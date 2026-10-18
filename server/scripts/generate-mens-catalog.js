import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Seeded PRNG (mulberry32)
function createPrng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let seed = h;
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createPrng('max-fit-2026');

const categoryConfig = {
  'Checks Shirt': {
    slug: 'checks-shirt',
    sizeType: 'top',
    cat3: 'CHK',
    priceRange: [599, 899],
    fabric: '100% Combed Cotton Flannel & Twill',
    care: 'Machine wash cold with like colours, warm iron if needed, do not bleach',
    styles: [
      'Gingham Check Casual Shirt',
      'Tartans Brushed Cotton Shirt',
      'Buffalo Check Regular Shirt',
      'Windowpane Tailored Shirt',
      'Micro Check Casual Shirt',
      'Lumberjack Heavy Flannel Shirt',
      'Heritage Plaid Relaxed Shirt',
      'Oxford Box Check Shirt',
      'Monochrome Grid Check Shirt'
    ],
    garmentDes: (col) => `long sleeve ${col.toLowerCase()} checks cotton button-down shirt`
  },
  'T-shirt': {
    slug: 't-shirt',
    sizeType: 'top',
    cat3: 'TSH',
    priceRange: [499, 699],
    fabric: '220 GSM 100% Heavyweight Bio-Washed Cotton',
    care: 'Machine wash cold inside out, gentle cycle, do not iron on print, tumble dry low',
    styles: [
      'Heavyweight Oversized Crew Tee',
      'Essential Relaxed Drop-Shoulder Tee',
      'Vintage Pigment Dyed Tee',
      'Signature Minimalist Boxy Tee'
    ],
    garmentDes: (col) => `short sleeve ${col.toLowerCase()} heavyweight cotton crew neck t-shirt`
  },
  'Hoodies and Sweatshirt': {
    slug: 'hoodies-sweatshirt',
    sizeType: 'top',
    cat3: 'HOD',
    priceRange: [599, 999],
    fabric: '380 GSM Cotton-Fleece Blend with Brushed Backing',
    care: 'Machine wash cold inside out, do not bleach, tumble dry gentle, reshape while damp',
    styles: [
      'Classic Kangaroo Pocket Pullover Hoodie',
      'Heavyweight French Terry Crew Sweatshirt',
      'Oversized Drop-Shoulder Fleece Hoodie',
      'Minimalist Ribbed Hem Sweatshirt',
      'Double-Lined Hooded Streetwear Pullover',
      'Athletic Relaxed Fleece Crewneck',
      'Garment-Dyed Brushed Cotton Hoodie',
      'Urban Thermal Layered Sweatshirt',
      'Thermal-Knit Heavy Pullover Hoodie',
      'Cozy Brushed Core Crew Sweatshirt',
      'Structured Heavy Fleece Pullover',
      'Premium Combed Cotton Hoodie',
      'Relaxed Fit Graphic Fleece Hoodie',
      'Clean Silhouette French Terry Sweatshirt',
      'Vintage Wash Heavyweight Hoodie'
    ],
    garmentDes: (col) => `long sleeve ${col.toLowerCase()} fleece cotton pullover hoodie with front pocket`
  },
  'Casual Shirts': {
    slug: 'casual-shirts',
    sizeType: 'top',
    cat3: 'CSH',
    priceRange: [499, 899],
    fabric: 'Pre-Washed Pure Cotton Linen Blend',
    care: 'Gentle machine wash cold, hang dry in shade, medium iron',
    styles: [
      'Linen Blend Relaxed Resort Shirt',
      'Classic Oxford Button-Down Casual Shirt',
      'Textured Slub Cotton Regular Shirt',
      'Camp Collar Short Sleeve Casual Shirt',
      'Mandarin Collar Linen Casual Shirt',
      'Washed Chambray Utility Casual Shirt',
      'Minimalist Poplin Everyday Casual Shirt',
      'Waffle Knit Breathable Casual Shirt',
      'Textured Dobby Long Sleeve Shirt',
      'Structured Twill Everyday Casual Shirt',
      'Lightweight Breathable Summer Shirt',
      'Tailored Cutaway Collar Casual Shirt',
      'Vintage Washed Regular Fit Shirt',
      'Brushed Cotton Utility Work Shirt',
      'Casual Spread Collar Slub Shirt',
      'Easy Care Relaxed Cotton Casual Shirt',
      'Pure Cotton Everyday Long Sleeve Shirt'
    ],
    garmentDes: (col) => `long sleeve ${col.toLowerCase()} breathable cotton casual button-down shirt`
  },
  "Men's Jacket": {
    slug: 'mens-jacket',
    sizeType: 'top',
    cat3: 'JKT',
    priceRange: [999, 1299],
    fabric: 'Heavy Cotton Canvas & Denim with Poly-Taffeta Lining',
    care: 'Dry clean recommended, or hand wash cold, do not tumble dry',
    styles: [
      'Type III Trucker Canvas Jacket',
      'Vintage Washed Denim Rider Jacket',
      'Urban Minimalist Zip-Up Bomber Jacket',
      'Rugged Multi-Pocket Field Utility Jacket',
      'Heavyweight Worker Canvas Overshirt Jacket'
    ],
    garmentDes: (col) => `long sleeve ${col.toLowerCase()} zip front utility canvas jacket`
  },
  'Pants Jeans': {
    slug: 'pants-jeans',
    sizeType: 'bottom',
    cat3: 'JNS',
    priceRange: [799, 999],
    fabric: '13.5 Oz Comfort-Stretch Cotton Denim (98% Cotton, 2% Elastane)',
    care: 'Machine wash cold inside out, wash dark colours separately, line dry in shade',
    styles: [
      'Classic Slim-Fit Stretch Denim Jeans',
      'Relaxed Tapered Fit Selvedge Jeans',
      'Straight Leg Vintage Wash Denim Jeans',
      'Clean Dark Indigo Regular Fit Jeans',
      'Distressed Stonewash Comfort Jeans',
      'Modern Athletic Taper Denim Jeans',
      'Mid-Rise Clean Contour Jeans',
      'Authentic Heavyweight Denim Pants'
    ],
    garmentDes: (col) => `men's ${col.toLowerCase()} comfort stretch denim pants`
  },
  'Cargo': {
    slug: 'cargo',
    sizeType: 'bottom',
    cat3: 'CRG',
    priceRange: [899, 999],
    fabric: 'Heavyweight Cotton Twill with Reinforced Ripstop Paneling',
    care: 'Machine wash cold with similar colours, iron on reverse, do not bleach',
    styles: [
      'Multi-Pocket Tactical Relaxed Cargo Pants',
      'Rugged Utility Tapered Cotton Cargo Pants',
      'Everyday Streetwear Elastic Cuff Cargo Pants'
    ],
    garmentDes: (col) => `men's ${col.toLowerCase()} heavy cotton multi-pocket cargo pants`
  }
};

const topSizes = ['S', 'M', 'L', 'XL', 'XXL'];
const bottomSizes = ['28', '30', '32', '34', '36', '38'];

const allowedPricePoints = [
  499, 549, 599, 649, 699, 749, 799, 849, 899, 949, 999,
  1049, 1099, 1149, 1199, 1249, 1299
];

function pickPrice(min, max) {
  const candidates = allowedPricePoints.filter(p => p >= min && p <= max);
  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx];
}

function calculateMrp(price) {
  const factor = 1.20 + rng() * 0.25; // 1.20 to 1.45
  const raw = price * factor;
  // Round up to next value ending in 9
  let mrp = Math.ceil(raw / 10) * 10 - 1;
  if (mrp <= price) mrp = price + 100;
  // Make sure last digit is 9
  if (mrp % 10 !== 9) {
    mrp = Math.floor(mrp / 10) * 10 + 9;
    if (mrp <= price) mrp += 10;
  }
  return mrp;
}

function generateCatalog() {
  const garmentColors = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/seed/garment-colors.json')));

  const products = [];
  let productIndex = 1;

  // Track style indices per category
  const styleCounters = {};
  for (const cat of Object.keys(categoryConfig)) {
    styleCounters[cat] = 0;
  }

  // Choose deliberate test items:
  // Item 1: fully sold out product -> T-shirt #1
  // Item 2: single-unit product (1 unit in 1 size) -> Cargo #1
  const fullySoldOutIndex = 1; // First T-shirt
  const singleUnitIndex = 2; // First Cargo

  let catGlobalIndex = 0;

  for (const item of garmentColors) {
    catGlobalIndex++;
    const cat = item.category;
    const cfg = categoryConfig[cat];
    if (!cfg) throw new Error(`Unknown category: ${cat}`);

    const styleIdx = styleCounters[cat]++;
    const styleName = cfg.styles[styleIdx] || `${cat} Item ${styleIdx + 1}`;

    const color = item.color;
    const name = `${color} ${styleName}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const price = pickPrice(cfg.priceRange[0], cfg.priceRange[1]);
    const mrp = calculateMrp(price);

    const tryonEnabled = cfg.sizeType === 'top';
    const garmentDes = cfg.garmentDes(color);

    const isDeliberateSoldOut = (cat === 'T-shirt' && styleIdx === 0);
    const isDeliberateSingleUnit = (cat === 'Cargo' && styleIdx === 0);

    const sizes = cfg.sizeType === 'top' ? topSizes : bottomSizes;
    const variants = [];

    const pNum = String(productIndex).padStart(3, '0');
    const col3 = color.slice(0, 3).toUpperCase();

    sizes.forEach((sz, sIdx) => {
      const sku = `MXF-${cfg.cat3}-${pNum}-${col3}-${sz}`;
      let stock = 0;

      if (isDeliberateSoldOut) {
        stock = 0;
      } else if (isDeliberateSingleUnit) {
        stock = (sIdx === 1) ? 1 : 0; // Size M (or 30) gets exactly 1 unit, rest 0
      } else {
        // Guarantee at least 3 sizes in stock for every other product
        // 70% variants: 8 to 30
        // 20% variants: 1 to 5
        // 10% variants: 0
        const rand = rng();
        if (sIdx < 3) {
          // Guarantee in stock
          if (rand < 0.25) {
            stock = Math.floor(rng() * 5) + 1; // 1 to 5
          } else {
            stock = Math.floor(rng() * 23) + 8; // 8 to 30
          }
        } else {
          if (rand < 0.15) {
            stock = 0;
          } else if (rand < 0.35) {
            stock = Math.floor(rng() * 5) + 1;
          } else {
            stock = Math.floor(rng() * 23) + 8;
          }
        }
      }

      variants.push({
        size: sz,
        color: color,
        sku: sku,
        stock: stock,
        low_stock_threshold: 5
      });
    });

    const isFeatured = rng() < 0.20; // ~12 products
    const isNew = rng() < 0.23; // ~14 products

    products.push({
      id_temp: productIndex,
      name,
      slug,
      category: cat,
      category_slug: cfg.slug,
      size_type: cfg.sizeType,
      description: `Premium men's ${cat.toLowerCase()} tailored in a timeless silhouette. Designed for effortless comfort, breathable drape, and everyday endurance.`,
      fabric: cfg.fabric,
      care: cfg.care,
      colour: color,
      price,
      mrp,
      original_filename: item.filename,
      local_path: `client/public/Products Image/${cat}/${item.filename}`,
      storage_path: `products/${cfg.slug}/${slug}/1.jpeg`,
      tryon_enabled: tryonEnabled,
      garment_des: garmentDes,
      is_featured: isFeatured,
      is_new: isNew,
      is_sold_out_deliberate: isDeliberateSoldOut,
      is_single_unit_deliberate: isDeliberateSingleUnit,
      variants
    });

    productIndex++;
  }

  // Ensure count of is_featured is ~12 and is_new is ~14
  let featuredCount = products.filter(p => p.is_featured).length;
  let newCount = products.filter(p => p.is_new).length;

  for (let i = 0; i < products.length; i++) {
    if (featuredCount < 12 && !products[i].is_featured && !products[i].is_sold_out_deliberate) {
      products[i].is_featured = true;
      featuredCount++;
    }
    if (newCount < 14 && !products[i].is_new && !products[i].is_sold_out_deliberate) {
      products[i].is_new = true;
      newCount++;
    }
  }

  // Verify unique slugs and names
  const names = new Set();
  const slugs = new Set();
  for (const p of products) {
    if (names.has(p.name)) throw new Error(`Duplicate name: ${p.name}`);
    if (slugs.has(p.slug)) throw new Error(`Duplicate slug: ${p.slug}`);
    names.add(p.name);
    slugs.add(p.slug);
  }

  const outPath = path.resolve(__dirname, '../../supabase/seed/mens-catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(products, null, 2), 'utf8');
  console.log(`Generated ${products.length} products to ${outPath}`);

  // Summary by category
  const summary = {};
  for (const p of products) {
    if (!summary[p.category]) {
      summary[p.category] = {
        count: 0,
        minPrice: 9999,
        maxPrice: 0,
        totalStock: 0,
        tryonEnabled: 0
      };
    }
    summary[p.category].count++;
    summary[p.category].minPrice = Math.min(summary[p.category].minPrice, p.price);
    summary[p.category].maxPrice = Math.max(summary[p.category].maxPrice, p.price);
    summary[p.category].tryonEnabled += p.tryon_enabled ? 1 : 0;
    summary[p.category].totalStock += p.variants.reduce((a, b) => a + b.stock, 0);
  }

  console.table(summary);

  const soldOut = products.find(p => p.is_sold_out_deliberate);
  const singleUnit = products.find(p => p.is_single_unit_deliberate);
  console.log(`\nDeliberate Test Item 1 (Fully Sold Out): "${soldOut.name}" (${soldOut.category}) - Total Stock: 0`);
  console.log(`Deliberate Test Item 2 (Single Unit): "${singleUnit.name}" (${singleUnit.category}) - Total Stock: 1 (${singleUnit.variants.find(v => v.stock === 1).size})`);
}

generateCatalog();
