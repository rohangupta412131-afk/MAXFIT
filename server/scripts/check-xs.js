import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkXs() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  const xsRows = (await c.query(`SELECT id FROM product_variants WHERE size = 'XS'`)).rows;
  const xsIds = xsRows.map(r => r.id);
  console.log('XS Variant IDs:', xsIds);

  const cartRes = await c.query(`SELECT * FROM cart_items WHERE variant_id = ANY($1::uuid[])`, [xsIds]);
  console.log('Cart items with XS:', cartRes.rows);

  const orderRes = await c.query(`SELECT * FROM order_items WHERE variant_id = ANY($1::uuid[])`, [xsIds]);
  console.log('Order items with XS:', orderRes.rows);

  await c.end();
}

checkXs().catch(console.error);
