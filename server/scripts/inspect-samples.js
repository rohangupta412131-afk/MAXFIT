import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inspectSamples() {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/seed/image-manifest.json')));
  
  // Look at one or two samples from each category
  const categories = [...new Set(manifest.map(m => m.category))];
  
  for (const cat of categories) {
    const items = manifest.filter(m => m.category === cat);
    console.log(`\n=== Category: ${cat} (Total ${items.length}) ===`);
    for (const item of items) {
      const meta = await sharp(item.fullPath).metadata();
      // Check top area (head/face area) and center area
      const topStats = await sharp(item.fullPath).extract({
        left: Math.round(meta.width * 0.35),
        top: Math.round(meta.height * 0.05),
        width: Math.round(meta.width * 0.3),
        height: Math.round(meta.height * 0.2)
      }).stats();
      
      const centerStats = await sharp(item.fullPath).extract({
        left: Math.round(meta.width * 0.3),
        top: Math.round(meta.height * 0.35),
        width: Math.round(meta.width * 0.4),
        height: Math.round(meta.height * 0.3)
      }).stats();

      console.log(`- ${item.filename.slice(0, 45)}: Dim ${meta.width}x${meta.height} | Top R:${Math.round(topStats.channels[0].mean)} G:${Math.round(topStats.channels[1].mean)} B:${Math.round(topStats.channels[2].mean)} | Center R:${Math.round(centerStats.channels[0].mean)} G:${Math.round(centerStats.channels[1].mean)} B:${Math.round(centerStats.channels[2].mean)}`);
    }
  }
}

inspectSamples().catch(console.error);
