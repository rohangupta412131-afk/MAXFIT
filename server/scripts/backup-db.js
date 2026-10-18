import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function backupDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is required for backup');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, `../../backups/pre-mens-migration-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`Starting database backup to: ${backupDir}`);

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables to backup:`, tables);

    const summary = [];

    for (const table of tables) {
      const res = await client.query(`SELECT * FROM "${table}"`);
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2), 'utf8');
      const stats = fs.statSync(filePath);
      summary.push({
        table,
        rows: res.rowCount,
        filePath,
        bytes: stats.size
      });
      console.log(`Exported table "${table}": ${res.rowCount} rows (${stats.size} bytes)`);
    }

    // Also write a manifest.json
    fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify({
      timestamp,
      tableCount: tables.length,
      tables: summary
    }, null, 2), 'utf8');

    console.log('--- Backup Verification ---');
    let allNonEmpty = true;
    for (const item of summary) {
      const exists = fs.existsSync(item.filePath);
      const nonZero = item.bytes > 0;
      console.log(`File: ${item.table}.json | Exists: ${exists} | Non-empty: ${nonZero} (${item.bytes} bytes) | Rows: ${item.rows}`);
      if (!exists || !nonZero) allNonEmpty = false;
    }

    if (!allNonEmpty) {
      console.error('ERROR: Some backup files are missing or empty!');
      process.exit(1);
    }

    console.log('SUCCESS: All backup files verified successfully in ' + backupDir);
    return backupDir;
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

backupDatabase();
