import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function classifyColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b);

  if (v < 22) return 'Black';
  if (v > 88 && s < 12) return 'White';
  if (s < 14) {
    if (v < 40) return 'Charcoal';
    return 'Grey';
  }

  // Hue based
  if (h >= 345 || h < 15) {
    if (s > 30 && v < 50) return 'Maroon';
    return 'Red';
  }
  if (h >= 15 && h < 45) {
    if (s < 45 && v > 60) return 'Beige';
    if (s < 50 && v <= 60) return 'Khaki';
    if (v < 45) return 'Brown';
    return 'Rust';
  }
  if (h >= 45 && h < 70) {
    if (s < 35 && v > 65) return 'Beige';
    if (v < 50) return 'Olive';
    return 'Yellow';
  }
  if (h >= 70 && h < 165) {
    if (v < 45 || s < 40) return 'Olive';
    return 'Green';
  }
  if (h >= 165 && h < 260) {
    if (v < 35) return 'Navy';
    if (s < 30) return 'Slate Blue';
    return 'Blue';
  }
  if (h >= 260 && h < 320) {
    return 'Purple';
  }
  return 'Charcoal';
}

async function inspectImages() {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/seed/image-manifest.json')));
  const results = [];

  for (const item of manifest) {
    const img = sharp(item.fullPath);
    const meta = await img.metadata();
    
    // Sample the central 40% of the image (where garment typically sits)
    const left = Math.round(meta.width * 0.3);
    const top = Math.round(meta.height * 0.3);
    const width = Math.round(meta.width * 0.4);
    const height = Math.round(meta.height * 0.4);

    const stats = await img.extract({ left, top, width, height }).stats();
    const r = Math.round(stats.channels[0].mean);
    const g = Math.round(stats.channels[1].mean);
    const b = Math.round(stats.channels[2].mean);
    const color = classifyColor(r, g, b);

    results.push({
      category: item.category,
      filename: item.filename,
      width: meta.width,
      height: meta.height,
      r, g, b,
      color
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

inspectImages().catch(console.error);
