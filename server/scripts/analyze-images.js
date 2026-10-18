import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeImages() {
  const publicDir = path.resolve(__dirname, '../../client/public');
  const entries = fs.readdirSync(publicDir);
  const imgFolder = entries.find(e => /^products?[-_ ]?images?$/i.test(e));
  if (!imgFolder) {
    console.error('Could not find product images folder in client/public!');
    process.exit(1);
  }

  const realPath = path.join(publicDir, imgFolder);
  console.log(`REAL PRODUCT IMAGE PATH: ${realPath}`);

  const expectedCategories = [
    "Checks Shirt",
    "T-shirt",
    "Hoodies and Sweatshirt",
    "Casual Shirts",
    "Men's Jacket",
    "Pants Jeans",
    "Cargo"
  ];

  const subdirs = fs.readdirSync(realPath).filter(f => fs.statSync(path.join(realPath, f)).isDirectory());
  console.log('Categories found in folder:', subdirs);

  const hashes = new Map();
  const duplicates = [];
  const over5MB = [];
  const unsupported = [];
  const corrupt = [];
  const nestedSubfolders = [];
  const categoryStats = {};

  const allFiles = [];

  for (const cat of subdirs) {
    const catPath = path.join(realPath, cat);
    const catFiles = fs.readdirSync(catPath);
    categoryStats[cat] = {
      count: 0,
      extensions: {},
      sizes: [],
      dimensions: []
    };

    for (const f of catFiles) {
      const fullPath = path.join(catPath, f);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        nestedSubfolders.push(path.join(cat, f));
        continue;
      }

      categoryStats[cat].count++;
      const ext = path.extname(f).toLowerCase();
      categoryStats[cat].extensions[ext] = (categoryStats[cat].extensions[ext] || 0) + 1;
      categoryStats[cat].sizes.push(stat.size);

      // Check unsupported formats
      if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        unsupported.push({ path: path.join(cat, f), ext, size: stat.size });
      }

      // Check size > 5MB
      if (stat.size > 5 * 1024 * 1024) {
        over5MB.push({ path: path.join(cat, f), size: stat.size });
      }

      // Compute hash for duplicate detection
      const fileBuffer = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      if (hashes.has(hash)) {
        duplicates.push({ original: hashes.get(hash), duplicate: path.join(cat, f) });
      } else {
        hashes.set(hash, path.join(cat, f));
      }

      // Check corruption & get dimensions
      try {
        const metadata = await sharp(fileBuffer).metadata();
        categoryStats[cat].dimensions.push({ file: f, width: metadata.width, height: metadata.height, format: metadata.format });
        allFiles.push({
          category: cat,
          filename: f,
          fullPath,
          size: stat.size,
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          hash
        });
      } catch (err) {
        corrupt.push({ path: path.join(cat, f), error: err.message });
      }
    }
  }

  console.log('\n================ IMAGE ANALYSIS SUMMARY ================');
  for (const cat of Object.keys(categoryStats)) {
    const stats = categoryStats[cat];
    const totalBytes = stats.sizes.reduce((a, b) => a + b, 0);
    const avgBytes = stats.sizes.length ? Math.round(totalBytes / stats.sizes.length) : 0;
    const minBytes = Math.min(...stats.sizes);
    const maxBytes = Math.max(...stats.sizes);
    console.log(`\nCategory: "${cat}"`);
    console.log(`  File count: ${stats.count}`);
    console.log(`  Extensions: ${JSON.stringify(stats.extensions)}`);
    console.log(`  File size: avg ${(avgBytes/1024).toFixed(1)} KB, min ${(minBytes/1024).toFixed(1)} KB, max ${(maxBytes/1024).toFixed(1)} KB`);
    console.log(`  Sample dimensions: ${stats.dimensions.slice(0, 3).map(d => `${d.file} (${d.width}x${d.height}, ${d.format})`).join(', ')}`);
  }

  console.log('\n================ ANOMALY / FLAGS ================');
  console.log(`Nested subfolders: ${nestedSubfolders.length}`, nestedSubfolders);
  console.log(`Unsupported formats: ${unsupported.length}`, unsupported);
  console.log(`Files over 5 MB: ${over5MB.length}`, over5MB);
  console.log(`Corrupt images: ${corrupt.length}`, corrupt);
  console.log(`Duplicate images: ${duplicates.length}`, duplicates);

  const manifestPath = path.resolve(__dirname, '../../supabase/seed/image-manifest.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(allFiles, null, 2), 'utf8');
  console.log(`\nWrote complete image manifest (${allFiles.length} images) to ${manifestPath}`);
}

analyzeImages().catch(console.error);
