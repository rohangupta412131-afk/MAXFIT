import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function printDbState() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('=== ROW COUNTS PER TABLE ===');
  const tablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  for (const row of tablesRes.rows) {
    const table = row.table_name;
    const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    console.log(`${table.padEnd(20)}: ${countRes.rows[0].count}`);
  }

  console.log('\n=== LIST OF CATEGORIES ===');
  const catRes = await client.query(`SELECT id, name, slug FROM categories ORDER BY name`);
  console.table(catRes.rows);

  console.log('\n=== DISTINCT GENDER VALUES ===');
  const genderRes = await client.query(`SELECT DISTINCT gender FROM products`);
  console.log(genderRes.rows.map(r => r.gender));

  await client.end();

  console.log('\n=== BUCKET CONTENTS (COUNTS ONLY) ===');
  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  if (error) {
    console.error('Bucket list error:', error);
  } else {
    for (const b of buckets) {
      const { data: files } = await supabaseAdmin.storage.from(b.name).list('', { limit: 1000 });
      console.log(`${b.name.padEnd(20)}: ${files ? files.length : 0}`);
    }
  }
}

printDbState().catch(console.error);
