import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CATEGORIES_DEF = [
  { name: 'Checks Shirt', slug: 'checks-shirt', size_type: 'top', sort_order: 1 },
  { name: 'T-shirt', slug: 't-shirt', size_type: 'top', sort_order: 2 },
  { name: 'Hoodies and Sweatshirt', slug: 'hoodies-sweatshirt', size_type: 'top', sort_order: 3 },
  { name: 'Casual Shirts', slug: 'casual-shirts', size_type: 'top', sort_order: 4 },
  { name: "Men's Jacket", slug: 'mens-jacket', size_type: 'top', sort_order: 5 },
  { name: 'Pants Jeans', slug: 'pants-jeans', size_type: 'bottom', sort_order: 6 },
  { name: 'Cargo', slug: 'cargo', size_type: 'bottom', sort_order: 7 }
];

const TOP_SIZE_CHART = [
  { size: 'S', chest_cm: 92, waist_cm: 76, hip_cm: 92, height_min: 165, height_max: 172 },
  { size: 'M', chest_cm: 98, waist_cm: 82, hip_cm: 98, height_min: 170, height_max: 178 },
  { size: 'L', chest_cm: 104, waist_cm: 88, hip_cm: 104, height_min: 175, height_max: 183 },
  { size: 'XL', chest_cm: 110, waist_cm: 94, hip_cm: 110, height_min: 180, height_max: 188 },
  { size: 'XXL', chest_cm: 116, waist_cm: 100, hip_cm: 116, height_min: 182, height_max: 192 }
];

const BOTTOM_SIZE_CHART = [
  { size: '28', chest_cm: null, waist_cm: 71, hip_cm: 88, inseam_cm: 78, height_min: 162, height_max: 170 },
  { size: '30', chest_cm: null, waist_cm: 76, hip_cm: 93, inseam_cm: 80, height_min: 168, height_max: 175 },
  { size: '32', chest_cm: null, waist_cm: 81, hip_cm: 98, inseam_cm: 81, height_min: 172, height_max: 180 },
  { size: '34', chest_cm: null, waist_cm: 86, hip_cm: 103, inseam_cm: 82, height_min: 176, height_max: 184 },
  { size: '36', chest_cm: null, waist_cm: 91, hip_cm: 108, inseam_cm: 83, height_min: 180, height_max: 188 },
  { size: '38', chest_cm: null, waist_cm: 96, hip_cm: 113, inseam_cm: 84, height_min: 182, height_max: 192 }
];

async function uploadWithRetry(bucket, storagePath, fileBuffer, contentType, maxRetries = 3) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabaseAdmin.storage.from(bucket).upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true
      });
      if (error) throw error;
      return data;
    } catch (err) {
      lastErr = err;
      console.warn(`[Attempt ${attempt}/${maxRetries}] Upload error for ${storagePath}: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastErr;
}

export async function seedMensCatalog() {
  console.log('=== STARTING MEN\'S CATALOG SEEDING ===');

  const catalogPath = path.resolve(__dirname, '../../supabase/seed/mens-catalog.json');
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog file not found: ${catalogPath}`);
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`Loaded ${catalog.length} products from mens-catalog.json`);

  const dbClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await dbClient.connect();

  try {
    // 1. Upload Images to Supabase Storage
    console.log('\n--- 5a. Uploading Product Images to Storage ---');
    const uploadedUrls = new Map();

    for (let i = 0; i < catalog.length; i++) {
      const p = catalog[i];
      const localAbsPath = path.resolve(__dirname, '../../', p.local_path);
      if (!fs.existsSync(localAbsPath)) {
        throw new Error(`Local image not found: ${localAbsPath}`);
      }

      const fileBuffer = fs.readFileSync(localAbsPath);
      // Clean storage path without leading "products/" bucket name
      const relativeStoragePath = `${p.category_slug}/${p.slug}/1.jpeg`;

      await uploadWithRetry('products', relativeStoragePath, fileBuffer, 'image/jpeg');

      const { data: urlData } = supabaseAdmin.storage.from('products').getPublicUrl(relativeStoragePath);
      uploadedUrls.set(p.slug, urlData.publicUrl);

      if ((i + 1) % 15 === 0 || i === catalog.length - 1) {
        console.log(`Uploaded ${i + 1}/${catalog.length} images...`);
      }
    }

    // Verify all uploaded URLs with HTTP GET
    console.log('\n--- Verifying Public URLs via HTTP GET ---');
    let getPassed = 0;
    for (const [slug, publicUrl] of uploadedUrls.entries()) {
      const res = await fetch(publicUrl);
      if (res.status !== 200) {
        throw new Error(`Public URL assertion failed for ${slug}: HTTP ${res.status} at ${publicUrl}`);
      }
      const cType = res.headers.get('content-type') || '';
      if (!cType.includes('image')) {
        throw new Error(`Public URL content-type mismatch for ${slug}: got ${cType}`);
      }
      getPassed++;
    }
    console.log(`All ${getPassed} public image URLs verified: HTTP 200 + image content-type.`);

    // 2. Database Seeding in a Transaction
    console.log('\n--- 5b-5e. Seeding Categories, Products, Variants, Size Charts, Coupons ---');
    await dbClient.query('BEGIN');

    // 2a. Categories
    const categoryIdMap = new Map();
    for (const cat of CATEGORIES_DEF) {
      // Pick first product of this category for category cover image
      const firstProd = catalog.find(p => p.category_slug === cat.slug);
      const imageUrl = firstProd ? uploadedUrls.get(firstProd.slug) : null;

      const catRes = await dbClient.query(`
        INSERT INTO public.categories (name, slug, size_type, sort_order, image_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          size_type = EXCLUDED.size_type,
          sort_order = EXCLUDED.sort_order,
          image_url = EXCLUDED.image_url
        RETURNING id, slug;
      `, [cat.name, cat.slug, cat.size_type, cat.sort_order, imageUrl]);

      categoryIdMap.set(cat.slug, catRes.rows[0].id);
    }
    console.log(`Upserted ${categoryIdMap.size} categories.`);

    // 2b. Size Chart
    for (const cat of CATEGORIES_DEF) {
      const catId = categoryIdMap.get(cat.slug);
      const chartRows = cat.size_type === 'bottom' ? BOTTOM_SIZE_CHART : TOP_SIZE_CHART;

      for (const row of chartRows) {
        await dbClient.query(`
          INSERT INTO public.size_chart (category_id, size, size_type, chest_cm, waist_cm, hip_cm, inseam_cm, height_min, height_max)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING;
        `, [catId, row.size, cat.size_type, row.chest_cm, row.waist_cm, row.hip_cm, row.inseam_cm || null, row.height_min, row.height_max]);
      }
    }
    console.log('Size chart rows seeded for tops and bottoms.');

    // 2c. Products and Variants
    let totalVariants = 0;
    for (const p of catalog) {
      const catId = categoryIdMap.get(p.category_slug);
      const mainImageUrl = uploadedUrls.get(p.slug);

      const prodRes = await dbClient.query(`
        INSERT INTO public.products (
          name, slug, description, price, mrp, category_id,
          fabric, care_instructions, images, garment_image, garment_des,
          tryon_enabled, is_active, is_featured, is_new
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, true, $13, $14
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          mrp = EXCLUDED.mrp,
          category_id = EXCLUDED.category_id,
          fabric = EXCLUDED.fabric,
          care_instructions = EXCLUDED.care_instructions,
          images = EXCLUDED.images,
          garment_image = EXCLUDED.garment_image,
          garment_des = EXCLUDED.garment_des,
          tryon_enabled = EXCLUDED.tryon_enabled,
          is_featured = EXCLUDED.is_featured,
          is_new = EXCLUDED.is_new,
          is_active = true
        RETURNING id;
      `, [
        p.name, p.slug, p.description, p.price, p.mrp, catId,
        p.fabric, p.care, [mainImageUrl], mainImageUrl, p.garment_des,
        p.tryon_enabled, p.is_featured, p.is_new
      ]);

      const productId = prodRes.rows[0].id;

      // Variants
      for (const v of p.variants) {
        await dbClient.query(`
          INSERT INTO public.product_variants (
            product_id, size, color, sku, stock, low_stock_threshold
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          )
          ON CONFLICT (sku) DO UPDATE SET
            stock = EXCLUDED.stock,
            low_stock_threshold = EXCLUDED.low_stock_threshold,
            color = EXCLUDED.color,
            size = EXCLUDED.size;
        `, [productId, v.size, v.color, v.sku, v.stock, v.low_stock_threshold || 5]);

        totalVariants++;
      }
    }
    console.log(`Upserted ${catalog.length} products and ${totalVariants} variants.`);

    // 2d. Coupons
    await dbClient.query(`
      INSERT INTO public.coupons (code, type, value, min_order, max_discount, is_active, expires_at)
      VALUES 
        ('WELCOME10', 'percent', 10, 499, 150, true, now() + interval '5 years'),
        ('FLAT200', 'flat', 200, 1299, 200, true, now() + interval '5 years')
      ON CONFLICT (code) DO UPDATE SET
        type = EXCLUDED.type,
        value = EXCLUDED.value,
        min_order = EXCLUDED.min_order,
        max_discount = EXCLUDED.max_discount,
        is_active = true,
        expires_at = EXCLUDED.expires_at;
    `);
    console.log('Upserted coupons WELCOME10 and FLAT200.');

    await dbClient.query('COMMIT');
    console.log('Seeding transaction committed successfully.');

    // 3. Verification Assertions (Phase 5f)
    console.log('\n--- 5f. VERIFICATION OF SEED ---');
    const catCounts = await dbClient.query(`
      SELECT c.name, c.slug, COUNT(p.id) as product_count
      FROM public.categories c
      LEFT JOIN public.products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug, c.sort_order
      ORDER BY c.sort_order;
    `);
    console.log('Categories and Product Counts:');
    console.table(catCounts.rows);

    const priceChecks = await dbClient.query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE price <= 0) as invalid_price,
        COUNT(*) FILTER (WHERE mrp <= price) as invalid_mrp,
        COUNT(*) FILTER (WHERE (price % 10) != 9) as non_nine_price
      FROM public.products;
    `);
    console.log('Price Integrity Checks:', priceChecks.rows[0]);
    if (parseInt(priceChecks.rows[0].invalid_price) > 0 || parseInt(priceChecks.rows[0].invalid_mrp) > 0 || parseInt(priceChecks.rows[0].non_nine_price) > 0) {
      throw new Error('Price verification assertion failed!');
    }

    const deliberateChecks = await dbClient.query(`
      SELECT p.name, p.slug, c.name as category, SUM(v.stock) as total_stock
      FROM public.products p
      JOIN public.categories c ON c.id = p.category_id
      JOIN public.product_variants v ON v.product_id = p.id
      GROUP BY p.id, p.name, p.slug, c.name
      HAVING SUM(v.stock) IN (0, 1);
    `);
    console.log('Deliberate Test Items in Database:');
    console.table(deliberateChecks.rows);

    console.log('SUCCESS: Seed completed and all verification checks passed.');

  } catch (err) {
    await dbClient.query('ROLLBACK');
    console.error('Seeding transaction error:', err);
    throw err;
  } finally {
    await dbClient.end();
  }
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].endsWith('seed-mens-catalog.js')) {
  seedMensCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
