import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const password = process.env.SUPABASE_DB_PASSWORD;
const encodedPassword = encodeURIComponent(password);
const projectRef = 'ryfyxehnxryikxvwugos';

const connectionStrings = [
  // Direct connection
  `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  // Pooler connections across common AWS regions
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
];

async function testConnections() {
  for (const connStr of connectionStrings) {
    const client = new pg.Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    try {
      console.log('Testing connection to:', connStr.split('@')[1]);
      await client.connect();
      const res = await client.query('SELECT NOW() as now, current_database() as db;');
      console.log('SUCCESS! Connected to DB. Time:', res.rows[0].now, 'DB:', res.rows[0].db);
      await client.end();
      return connStr;
    } catch (err) {
      console.log('Failed:', err.message);
      try { await client.end(); } catch (e) {}
    }
  }
  return null;
}

testConnections().then((res) => {
  if (res) {
    console.log('Working connection string found!');
    process.exit(0);
  } else {
    console.log('No direct connection worked.');
    process.exit(1);
  }
});
