import { Client } from '@gradio/client';
import sharp from 'sharp';
import { env } from '../config/env.js';

class VtonService {
  constructor() {
    this.space = env.HF_SPACE || 'yisol/IDM-VTON';
    this.token = env.HF_TOKEN;
    this.client = null;
    this.connecting = null;
    this.activeJobs = 0;
    this.maxConcurrent = 2;
    this.queue = [];
  }

  async getClient() {
    if (this.client) return this.client;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      console.log(`[VTON Service] Connecting to Gradio space: ${this.space}`);
      const client = await Client.connect(this.space, {
        hf_token: this.token || undefined
      });
      this.client = client;
      this.connecting = null;
      console.log('[VTON Service] Connected to Gradio Space successfully.');
      return client;
    })();

    return this.connecting;
  }

  async preprocessImage(buffer, maxWidth = 768, maxHeight = 1024) {
    return await sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  async executeTryon({ personBuffer, garmentBuffer, garmentDescription }) {
    // Concurrency queue
    if (this.activeJobs >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.activeJobs++;
    try {
      return await this._runWithRetry({ personBuffer, garmentBuffer, garmentDescription }, 1);
    } finally {
      this.activeJobs--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }

  async _runWithRetry(params, retriesLeft = 1) {
    try {
      const client = await this.getClient();

      // Normalize images
      const normalizedPerson = await this.preprocessImage(params.personBuffer);
      const normalizedGarment = await this.preprocessImage(params.garmentBuffer);

      const personBlob = new Blob([normalizedPerson], { type: 'image/jpeg' });
      const garmentBlob = new Blob([normalizedGarment], { type: 'image/jpeg' });

      console.log('[VTON Service] Submitting inference request to IDM-VTON...');

      const result = await client.predict('/tryon', [
        {
          background: personBlob,
          layers: [],
          composite: null
        },
        garmentBlob,
        params.garmentDescription || 'clothing apparel',
        true,   // is_checked (auto-masking)
        false,  // is_checked_crop (auto-crop)
        30,     // denoise_steps
        42      // seed
      ]);

      if (!result || !result.data || !result.data[0]) {
        throw new Error('IDM-VTON did not return output image data');
      }

      const outputData = result.data[0];
      const resultUrl = typeof outputData === 'string' ? outputData : outputData.url;

      console.log(`[VTON Service] Generation succeeded: ${resultUrl}`);

      // Fetch the generated image buffer
      const imageRes = await fetch(resultUrl);
      if (!imageRes.ok) {
        throw new Error(`Failed to download generated try-on image: ${imageRes.statusText}`);
      }

      const generatedBuffer = Buffer.from(await imageRes.arrayBuffer());
      return {
        buffer: generatedBuffer,
        url: resultUrl
      };

    } catch (err) {
      console.error(`[VTON Service Error] Attempt failed:`, err.message || err);

      if (retriesLeft > 0) {
        console.log(`[VTON Service] Retrying in 3 seconds... (${retriesLeft} retries left)`);
        await new Promise(r => setTimeout(r, 3000));
        return this._runWithRetry(params, retriesLeft - 1);
      }

      // Readable error message
      const msg = err.message || '';
      if (msg.includes('queue') || msg.includes('CUDA') || msg.includes('busy') || msg.includes('GPU')) {
        throw new Error('AI virtual try-on servers are currently at high demand. Please try again in 1-2 minutes.');
      }
      throw new Error(`Try-on generation failed: ${msg || 'AI model inference timed out'}`);
    }
  }
}

export const vtonService = new VtonService();
