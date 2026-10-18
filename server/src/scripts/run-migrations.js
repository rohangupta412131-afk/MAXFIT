import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();

    // Create schema_migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
    `);

    // Check if initial schema was previously applied before schema_migrations existed
    const checkInit = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'products'
      );
    `);
    if (checkInit.rows[0].exists) {
      await client.query(`
        INSERT INTO public.schema_migrations (version)
        VALUES ('20260401000000_init_schema.sql')
        ON CONFLICT (version) DO NOTHING;
      `);
    }

    const appliedRes = await client.query(`SELECT version FROM public.schema_migrations`);
    const appliedSet = new Set(appliedRes.rows.map(r => r.version));

    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    console.log(`Discovered ${files.length} migration file(s):`, files);

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Skipping already-applied migration: ${file}`);
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      console.log(`Executing pending migration: ${file}...`);
      const sql = fs.readFileSync(fullPath, 'utf8');
      
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(`INSERT INTO public.schema_migrations (version) VALUES ($1)`, [file]);
        await client.query('COMMIT');
        console.log(`Migration ${file} executed and recorded successfully!`);
      } catch (mErr) {
        await client.query('ROLLBACK');
        throw mErr;
      }
    }

    // Check tables and RLS status
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables in database:', res.rows.map(r => r.table_name));

    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
      WHERE pg_namespace.nspname = 'public' AND relkind = 'r' 
      ORDER BY relname;
    `);
    console.log('RLS status on tables:');
    console.table(rlsRes.rows);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
