import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkAndSetAdmin() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  // Ensure rohan has admin role
  await c.query(`
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE full_name ILIKE '%rohan%' 
       OR id IN (SELECT id FROM auth.users WHERE email ILIKE '%rohan%');
  `);

  const res = await c.query(`
    SELECT p.id, p.full_name, p.role, u.email 
    FROM public.profiles p 
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.role, p.full_name;
  `);

  console.log('Preserved User Accounts:');
  res.rows.forEach(r => {
    const masked = r.email ? `${r.email.slice(0, 3)}***@${r.email.split('@')[1]}` : 'no-email';
    console.log(`- Role: ${r.role.padEnd(8)} | Name: ${(r.full_name || 'N/A').padEnd(16)} | Email: ${masked}`);
  });

  await c.end();
}

checkAndSetAdmin().catch(console.error);
