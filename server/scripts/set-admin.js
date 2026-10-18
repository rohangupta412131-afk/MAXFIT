import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const email = process.argv[2];

if (!email) {
  console.log('Usage: node server/scripts/set-admin.js <user-email>');
  process.exit(1);
}

async function setAdmin() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const userRes = await client.query(
    `SELECT u.id, u.email, p.full_name, p.role 
     FROM auth.users u 
     LEFT JOIN profiles p ON u.id = p.id 
     WHERE LOWER(u.email) = LOWER($1)`,
    [email.trim()]
  );

  if (userRes.rows.length === 0) {
    console.error(`User with email "${email}" not found in auth.users.`);
    console.log('Available registered accounts:');
    const all = await client.query(`SELECT email FROM auth.users LIMIT 10`);
    console.log(all.rows.map(r => r.email));
    await client.end();
    process.exit(1);
  }

  const user = userRes.rows[0];

  await client.query(
    `UPDATE profiles SET role = 'admin' WHERE id = $1`,
    [user.id]
  );

  console.log(`SUCCESS: User "${user.email}" (${user.full_name || 'No Name'}) is now an ADMIN!`);
  await client.end();
}

setAdmin().catch(console.error);
