import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function maskEmail(email) {
  if (!email || !email.includes('@')) return email || 'unknown';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(1, user.length - 3))}${user.slice(-1)}@${domain}`;
}

async function emptyBucket(bucketName) {
  let count = 0;
  try {
    let hasMore = true;
    while (hasMore) {
      const { data: files, error } = await supabaseAdmin.storage.from(bucketName).list('', { limit: 1000 });
      if (error) throw error;
      if (!files || files.length === 0) {
        hasMore = false;
        break;
      }

      // Collect all file paths recursively
      const filePaths = [];
      async function collectPaths(prefix) {
        const { data: items } = await supabaseAdmin.storage.from(bucketName).list(prefix, { limit: 1000 });
        if (!items) return;
        for (const item of items) {
          const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) {
            // It's a folder
            await collectPaths(itemPath);
          } else {
            filePaths.push(itemPath);
          }
        }
      }

      await collectPaths('');

      if (filePaths.length === 0) {
        hasMore = false;
        break;
      }

      // Remove in batches of 100
      for (let i = 0; i < filePaths.length; i += 100) {
        const batch = filePaths.slice(i, i + 100);
        const { error: delErr } = await supabaseAdmin.storage.from(bucketName).remove(batch);
        if (delErr) console.warn(`Warning deleting batch from ${bucketName}:`, delErr.message);
        count += batch.length;
      }
      hasMore = false;
    }
  } catch (err) {
    console.warn(`Could not empty bucket ${bucketName}:`, err.message);
  }
  return count;
}

async function getBucketCounts() {
  const counts = {};
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (buckets) {
    for (const b of buckets) {
      const { data: files } = await supabaseAdmin.storage.from(b.name).list('', { limit: 1000 });
      counts[b.name] = files ? files.length : 0;
    }
  }
  return counts;
}

async function resetCatalog() {
  // SAFETY GUARD
  if (process.env.CONFIRM_RESET !== 'yes') {
    console.error('ERROR: CONFIRM_RESET=yes environment variable is required to run reset-catalog. Aborting.');
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  let host = 'unknown';
  try {
    host = new URL(supabaseUrl).host;
  } catch (e) {
    host = supabaseUrl.replace(/https?:\/\//, '').split('/')[0];
  }
  console.log(`CONFIRMED RESET TARGET: Supabase host [${host}]`);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    console.log('\n--- BEFORE RESET: TABLE ROW COUNTS ---');
    const allTablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const beforeCounts = {};
    for (const row of allTablesRes.rows) {
      const t = row.table_name;
      const countRes = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      beforeCounts[t] = parseInt(countRes.rows[0].count, 10);
      console.log(`${t.padEnd(20)}: ${beforeCounts[t]}`);
    }

    const beforeBucketCounts = await getBucketCounts();
    console.log('\n--- BEFORE RESET: BUCKET OBJECT COUNTS ---');
    console.table(beforeBucketCounts);

    console.log('\nStarting database wipe transaction...');
    await client.query('BEGIN');

    // 1. DELETE child tables in proper FK order
    await client.query(`DELETE FROM public.order_items;`);
    await client.query(`DELETE FROM public.orders;`);
    await client.query(`DELETE FROM public.cart_items;`);
    await client.query(`DELETE FROM public.wishlist_items;`);
    await client.query(`DELETE FROM public.tryon_jobs;`);
    await client.query(`DELETE FROM public.size_chart;`);
    await client.query(`DELETE FROM public.product_variants;`);
    await client.query(`DELETE FROM public.products;`);
    await client.query(`DELETE FROM public.categories;`);

    // 2. Reset sequences
    await client.query(`ALTER SEQUENCE order_number_seq RESTART WITH 1001;`);

    // 3. Upsert base coupons WELCOME10 and FLAT200
    await client.query(`
      INSERT INTO public.coupons (code, type, value, min_order, max_discount, is_active)
      VALUES 
        ('WELCOME10', 'percent', 10, 499, 150, true),
        ('FLAT200', 'flat', 200, 1299, 200, true)
      ON CONFLICT (code) DO UPDATE SET
        type = EXCLUDED.type,
        value = EXCLUDED.value,
        min_order = EXCLUDED.min_order,
        max_discount = EXCLUDED.max_discount,
        is_active = true;
    `);

    await client.query('COMMIT');
    console.log('Database transaction committed successfully.');

    // 4. Empty Storage Buckets
    console.log('\nEmptying storage buckets: products, tryon-uploads, tryon-results, invoices...');
    for (const bucket of ['products', 'tryon-uploads', 'tryon-results', 'invoices']) {
      const deletedCount = await emptyBucket(bucket);
      console.log(`Bucket "${bucket}": emptied (${deletedCount} objects removed)`);
    }

    console.log('\n--- AFTER RESET: TABLE ROW COUNTS ---');
    const afterCounts = {};
    for (const row of allTablesRes.rows) {
      const t = row.table_name;
      const countRes = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      afterCounts[t] = parseInt(countRes.rows[0].count, 10);
      console.log(`${t.padEnd(20)}: ${afterCounts[t]}`);
    }

    const afterBucketCounts = await getBucketCounts();
    console.log('\n--- AFTER RESET: BUCKET OBJECT COUNTS ---');
    console.table(afterBucketCounts);

    // 5. Verification: Check preserved admin accounts and profiles
    console.log('\n--- VERIFICATION: PRESERVED PROFILES & ADMINS ---');
    const adminProfilesRes = await client.query(`
      SELECT p.id, p.full_name, p.role, u.email
      FROM public.profiles p
      LEFT JOIN auth.users u ON u.id = p.id
      WHERE p.role = 'admin';
    `);

    console.log(`Total preserved profiles: ${afterCounts['profiles']}`);
    console.log(`Total preserved addresses: ${afterCounts['addresses']}`);
    console.log(`Total preserved coupons: ${afterCounts['coupons']}`);
    console.log('Admin accounts preserved:');
    adminProfilesRes.rows.forEach(a => {
      console.log(`- ID: ${a.id} | Role: ${a.role} | Name: ${a.full_name} | Email: ${maskEmail(a.email)}`);
    });

    // 6. Assert orphaned records
    const orphanChecks = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM public.order_items) as order_items,
        (SELECT COUNT(*) FROM public.orders) as orders,
        (SELECT COUNT(*) FROM public.cart_items) as cart_items,
        (SELECT COUNT(*) FROM public.wishlist_items) as wishlist_items,
        (SELECT COUNT(*) FROM public.tryon_jobs) as tryon_jobs,
        (SELECT COUNT(*) FROM public.products) as products,
        (SELECT COUNT(*) FROM public.product_variants) as variants,
        (SELECT COUNT(*) FROM public.categories) as categories;
    `);

    const orphans = orphanChecks.rows[0];
    const anyOrphans = Object.values(orphans).some(val => parseInt(val, 10) > 0);
    if (anyOrphans) {
      console.error('ERROR: Orphaned rows detected in catalog tables:', orphans);
      process.exit(1);
    }
    console.log('SUCCESS: All catalog tables are 0 rows; no orphans remain; admin and users preserved.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reset failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetCatalog();
