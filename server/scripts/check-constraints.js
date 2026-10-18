import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkConstraints() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  const res = await c.query(`
    SELECT conrelid::regclass::text as table_name, conname, contype, pg_get_constraintdef(c.oid) as def
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public'
      AND conrelid::regclass::text IN ('product_variants', 'products', 'size_chart', 'categories')
    ORDER BY table_name, conname;
  `);
  console.table(res.rows);
  await c.end();
}

checkConstraints().catch(console.error);
