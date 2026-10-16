import { Client, handle_file } from '@gradio/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  const space = process.env.HF_SPACE || 'yisol/IDM-VTON';
  const token = process.env.HF_TOKEN;

  console.log('Connecting to Gradio Space:', space);

  try {
    const client = await Client.connect(space, {
      hf_token: token || undefined
    });

    console.log('Connected! Fetching test person and garment images...');
    const personRes = await fetch('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80');
    const personBuffer = Buffer.from(await personRes.arrayBuffer());
    const personBlob = new Blob([personBuffer], { type: 'image/jpeg' });

    const garmRes = await fetch('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80');
    const garmBuffer = Buffer.from(await garmRes.arrayBuffer());
    const garmBlob = new Blob([garmBuffer], { type: 'image/jpeg' });

    console.log(`Images loaded: Person (${personBuffer.length} bytes), Garment (${garmBuffer.length} bytes)`);

    console.log('Submitting tryon job...');
    const submission = client.submit('/tryon', [
      {
        background: personBlob,
        layers: [],
        composite: null
      },
      garmBlob,
      'Oversized charcoal grey heavyweight cotton crewneck t-shirt',
      true,   // is_checked (auto-masking)
      false,  // is_checked_crop (auto-crop)
      30,     // denoise_steps
      42      // seed
    ]);

    for await (const msg of submission) {
      if (msg.type === 'status') {
        console.log(`[Status] Stage: ${msg.stage}, Queue: ${msg.queue}, Position: ${msg.position ?? 'running'}, Progress: ${msg.progress ?? 'N/A'}`);
      } else if (msg.type === 'data') {
        console.log('\n[SUCCESS] Generated Data received:');
        console.log(msg.data);
      }
    }
  } catch (err) {
    console.error('Execution error:', err);
  }
}

run();
