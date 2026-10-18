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

function getHumanColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b);
  if (v < 25) return 'Black';
  if (v > 88 && s < 12) return 'White';
  if (s < 15) {
    if (v < 45) return 'Charcoal';
    return 'Grey';
  }
  if (h >= 345 || h < 15) {
    if (v < 55) return 'Maroon';
    return 'Red';
  }
  if (h >= 15 && h < 45) {
    if (s < 40 && v > 65) return 'Beige';
    if (s < 50 && v <= 65) return 'Khaki';
    if (v < 40) return 'Brown';
    return 'Rust';
  }
  if (h >= 45 && h < 70) {
    if (s < 35 && v > 65) return 'Beige';
    if (v < 50) return 'Olive';
    return 'Yellow';
  }
  if (h >= 70 && h < 165) {
    if (v < 50) return 'Olive';
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

async function analyzeAllGarments() {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/seed/image-manifest.json')));
  const items = [];

  for (const entry of manifest) {
    const raw = await sharp(entry.fullPath).raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = raw.info;
    const data = raw.data;

    // Detect background color by sampling 4 corners
    const cornerOffsets = [
      0,
      (width - 1) * channels,
      ((height - 1) * width) * channels,
      ((height - 1) * width + (width - 1)) * channels
    ];
    let bgR = 0, bgG = 0, bgB = 0;
    for (const off of cornerOffsets) {
      bgR += data[off];
      bgG += data[off + 1];
      bgB += data[off + 2];
    }
    bgR = Math.round(bgR / 4);
    bgG = Math.round(bgG / 4);
    bgB = Math.round(bgB / 4);

    // Collect non-background pixels inside inner 70% of image
    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    const yStart = Math.floor(height * 0.15);
    const yEnd = Math.floor(height * 0.85);
    const xStart = Math.floor(width * 0.15);
    const xEnd = Math.floor(width * 0.85);

    for (let y = yStart; y < yEnd; y += 4) {
      for (let x = xStart; x < xEnd; x += 4) {
        const idx = (y * width + x) * channels;
        const pr = data[idx];
        const pg = data[idx + 1];
        const pb = data[idx + 2];

        // Diff from background
        const diff = Math.abs(pr - bgR) + Math.abs(pg - bgG) + Math.abs(pb - bgB);
        if (diff > 45) {
          totalR += pr;
          totalG += pg;
          totalB += pb;
          count++;
        }
      }
    }

    let finalR = 128, finalG = 128, finalB = 128;
    if (count > 0) {
      finalR = Math.round(totalR / count);
      finalG = Math.round(totalG / count);
      finalB = Math.round(totalB / count);
    }
    const color = getHumanColor(finalR, finalG, finalB);

    items.push({
      category: entry.category,
      filename: entry.filename,
      width,
      height,
      r: finalR,
      g: finalG,
      b: finalB,
      color,
      bg: { r: bgR, g: bgG, b: bgB }
    });
  }

  console.log(`Analyzed ${items.length} garments.`);
  fs.writeFileSync(path.resolve(__dirname, '../../supabase/seed/garment-colors.json'), JSON.stringify(items, null, 2));
}

analyzeAllGarments().catch(console.error);
