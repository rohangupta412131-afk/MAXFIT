import { supabaseAdmin } from '../config/supabase.js';
import { vtonService } from '../services/vtonService.js';

export const submitTryon = async (req, res, next) => {
  try {
    const { productId, personPath } = req.body;

    if (!productId || !personPath) {
      return res.status(400).json({ success: false, error: 'Product ID and person photo path are required' });
    }

    // Verify person path belongs to the user
    if (!personPath.startsWith(`${req.user.id}/`)) {
      return res.status(403).json({ success: false, error: 'Unauthorized image path' });
    }

    // Verify product
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, garment_image, garment_des, tryon_enabled')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (prodErr || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (!product.tryon_enabled || !product.garment_image) {
      return res.status(400).json({ success: false, error: 'Virtual try-on is not enabled for this garment' });
    }

    // Create tryon job in DB
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('tryon_jobs')
      .insert({
        user_id: req.user.id,
        product_id: productId,
        person_path: personPath,
        status: 'processing'
      })
      .select()
      .single();

    if (jobErr) throw jobErr;

    // Send 202 Accepted immediately
    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'processing',
        message: 'Try-on job queued. AI generation in progress.'
      }
    });

    // Run processing asynchronously in background
    processTryonJob(job.id, req.user.id, personPath, product).catch(err => {
      console.error(`[Background Tryon Job ${job.id} Error]:`, err);
    });

  } catch (err) {
    next(err);
  }
};

async function processTryonJob(jobId, userId, personPath, product) {
  try {
    console.log(`[Tryon Job ${jobId}] Starting background processing...`);

    // 1. Download user's uploaded person image from tryon-uploads bucket
    const { data: personData, error: personDownloadErr } = await supabaseAdmin.storage
      .from('tryon-uploads')
      .download(personPath);

    if (personDownloadErr || !personData) {
      throw new Error(`Failed to read user photo: ${personDownloadErr?.message || 'File not found'}`);
    }

    const personBuffer = Buffer.from(await personData.arrayBuffer());

    // 2. Fetch garment image
    let garmentBuffer;
    if (product.garment_image.startsWith('http')) {
      const garmRes = await fetch(product.garment_image);
      if (!garmRes.ok) throw new Error('Failed to load garment image');
      garmentBuffer = Buffer.from(await garmRes.arrayBuffer());
    } else {
      const { data: garmData, error: garmErr } = await supabaseAdmin.storage
        .from('products')
        .download(product.garment_image);
      if (garmErr || !garmData) throw new Error('Garment file not found in storage');
      garmentBuffer = Buffer.from(await garmData.arrayBuffer());
    }

    // 3. Call AI VTON Service
    const generationResult = await vtonService.executeTryon({
      personBuffer,
      garmentBuffer,
      garmentDescription: product.garment_des || product.name
    });

    // 4. Upload generated result to private tryon-results bucket
    const resultPath = `${userId}/${jobId}.png`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('tryon-results')
      .upload(resultPath, generationResult.buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadErr) {
      throw new Error(`Failed to save try-on result: ${uploadErr.message}`);
    }

    // 5. Update tryon_jobs record to 'done'
    await supabaseAdmin
      .from('tryon_jobs')
      .update({
        status: 'done',
        result_path: resultPath,
        error: null
      })
      .eq('id', jobId);

    console.log(`[Tryon Job ${jobId}] Successfully completed! Result saved to ${resultPath}`);

  } catch (err) {
    console.error(`[Tryon Job ${jobId}] Failed:`, err.message);
    await supabaseAdmin
      .from('tryon_jobs')
      .update({
        status: 'failed',
        error: err.message || 'Virtual try-on processing failed'
      })
      .eq('id', jobId);
  }
}

export const getTryonJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabaseAdmin
      .from('tryon_jobs')
      .select('*, product:products(id, name, slug, price, images, garment_image)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !job) {
      return res.status(404).json({ success: false, error: 'Try-on job not found' });
    }

    // Generate signed URLs for private images
    let personSignedUrl = null;
    let resultSignedUrl = null;

    if (job.person_path) {
      const { data } = await supabaseAdmin.storage.from('tryon-uploads').createSignedUrl(job.person_path, 3600);
      personSignedUrl = data?.signedUrl || null;
    }

    if (job.result_path) {
      const { data } = await supabaseAdmin.storage.from('tryon-results').createSignedUrl(job.result_path, 3600);
      resultSignedUrl = data?.signedUrl || null;
    }

    res.json({
      success: true,
      data: {
        ...job,
        personUrl: personSignedUrl,
        resultUrl: resultSignedUrl
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getTryonHistory = async (req, res, next) => {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('tryon_jobs')
      .select('*, product:products(id, name, slug, price, mrp, images, garment_image, variants:product_variants(id, size, color, stock))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach signed URLs
    const enriched = await Promise.all((jobs || []).map(async (job) => {
      let personUrl = null;
      let resultUrl = null;

      if (job.person_path) {
        const { data } = await supabaseAdmin.storage.from('tryon-uploads').createSignedUrl(job.person_path, 3600);
        personUrl = data?.signedUrl;
      }

      if (job.result_path) {
        const { data } = await supabaseAdmin.storage.from('tryon-results').createSignedUrl(job.result_path, 3600);
        resultUrl = data?.signedUrl;
      }

      return {
        ...job,
        personUrl,
        resultUrl
      };
    }));

    res.json({
      success: true,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTryonJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: job, error } = await supabaseAdmin
      .from('tryon_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !job) {
      return res.status(404).json({ success: false, error: 'Try-on job not found' });
    }

    // Remove files from storage
    if (job.person_path) {
      await supabaseAdmin.storage.from('tryon-uploads').remove([job.person_path]);
    }
    if (job.result_path) {
      await supabaseAdmin.storage.from('tryon-results').remove([job.result_path]);
    }

    // Delete row
    await supabaseAdmin
      .from('tryon_jobs')
      .delete()
      .eq('id', id);

    res.json({
      success: true,
      message: 'Try-on record and associated photos removed successfully'
    });
  } catch (err) {
    next(err);
  }
};
