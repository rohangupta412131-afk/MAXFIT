import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const productsData = [
  // CATEGORY 1: T-Shirts & Polos (c0000000-0000-0000-0000-000000000001)
  {
    name: 'Aura Oversized Heavyweight Tee',
    slug: 'aura-oversized-heavyweight-tee',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    gender: 'unisex',
    price: 899,
    mrp: 1499,
    fabric: '240 GSM 100% Combed Terry Cotton',
    care_instructions: 'Machine wash cold inside out, gentle cycle, do not iron on print',
    description: 'A luxurious drop-shoulder silhouette crafted from ultra-dense 240 GSM combed cotton. Retains structure wash after wash.',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Oversized charcoal grey heavyweight cotton crew-neck short-sleeve t-shirt',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Charcoal', stock: 15 },
      { size: 'M', color: 'Charcoal', stock: 25 },
      { size: 'L', color: 'Charcoal', stock: 20 },
      { size: 'XL', color: 'Charcoal', stock: 10 }
    ]
  },
  {
    name: 'Monochrome Acid Wash Tee',
    slug: 'monochrome-acid-wash-tee',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    gender: 'men',
    price: 999,
    mrp: 1699,
    fabric: '220 GSM Bio-washed Single Jersey Cotton',
    care_instructions: 'Hand wash or dry clean recommended, line dry in shade',
    description: 'Vintage mineral wash gives each tee a distinct patina. Relaxed chest and ribbed collar prevent sagging.',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Acid washed faded black short-sleeve crewneck graphic t-shirt',
    tryon_enabled: true,
    variants: [
      { size: 'M', color: 'Vintage Black', stock: 12 },
      { size: 'L', color: 'Vintage Black', stock: 18 },
      { size: 'XL', color: 'Vintage Black', stock: 8 }
    ]
  },
  {
    name: 'Minimalist Pique Polo',
    slug: 'minimalist-pique-polo',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    gender: 'men',
    price: 1199,
    mrp: 1899,
    fabric: '100% Pima Cotton Honeycomb Knit',
    care_instructions: 'Machine wash warm, tumble dry low, warm iron',
    description: 'Tailored collar that holds shape, mother-of-pearl buttons, and tennis tail vents for elevated everyday wear.',
    images: [
      'https://images.unsplash.com/photo-1625910513413-58210344d156?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1625910513413-58210344d156?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Classic navy blue short-sleeve pique polo shirt with button placket',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Navy', stock: 10 },
      { size: 'M', color: 'Navy', stock: 15 },
      { size: 'L', color: 'Navy', stock: 12 },
      { size: 'XL', color: 'Navy', stock: 6 }
    ]
  },
  {
    name: 'Nova Ribbed Crop Tee',
    slug: 'nova-ribbed-crop-tee',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    gender: 'women',
    price: 749,
    mrp: 1299,
    fabric: '95% Modal Cotton, 5% Spandex Rib',
    care_instructions: 'Gentle machine wash with like colors, flat dry',
    description: 'Buttery soft micro-ribbed crop silhouette engineered for ultimate stretch and recovery.',
    images: [
      'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Fitted white ribbed cotton short sleeve crew neck cropped top',
    tryon_enabled: true,
    variants: [
      { size: 'XS', color: 'Ivory', stock: 14 },
      { size: 'S', color: 'Ivory', stock: 20 },
      { size: 'M', color: 'Ivory', stock: 15 }
    ]
  },
  {
    name: 'Vortex Raw Hem Street Tee',
    slug: 'vortex-raw-hem-street-tee',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    gender: 'unisex',
    price: 849,
    mrp: 1399,
    fabric: '100% Carded Organic Cotton',
    care_instructions: 'Cold wash, do not bleach, steam iron',
    description: 'Raw-cut sleeve cuffs and curved hemline produce a modern cyberpunk aesthetic.',
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Olive green loose-fit cotton crewneck short sleeve t-shirt',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Olive', stock: 8 },
      { size: 'M', color: 'Olive', stock: 16 },
      { size: 'L', color: 'Olive', stock: 14 },
      { size: 'XL', color: 'Olive', stock: 4 }
    ]
  },

  // CATEGORY 2: Shirts & Formals (c0000000-0000-0000-0000-000000000002)
  {
    name: 'Kyoto Relaxed Linen Shirt',
    slug: 'kyoto-relaxed-linen-shirt',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    gender: 'men',
    price: 1899,
    mrp: 2999,
    fabric: '100% Pure French Flax Linen',
    care_instructions: 'Machine wash delicate, hang damp to minimize ironing',
    description: 'Naturally breathable, textured woven linen with a band collar and camp cuff detailing.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Beige pure linen long-sleeve casual button-down shirt with mandarin collar',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Sand Beige', stock: 10 },
      { size: 'M', color: 'Sand Beige', stock: 15 },
      { size: 'L', color: 'Sand Beige', stock: 10 },
      { size: 'XL', color: 'Sand Beige', stock: 5 }
    ]
  },
  {
    name: 'Oxford Tailored Slim Shirt',
    slug: 'oxford-tailored-slim-shirt',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    gender: 'men',
    price: 1599,
    mrp: 2499,
    fabric: '100% Supima Cotton Oxford Weave',
    care_instructions: 'Warm machine wash, medium iron, dry clean safe',
    description: 'Crisp button-down collar, structured basketweave texture, and darted back for a sharp contour.',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Sky blue long-sleeve formal button-down oxford cotton dress shirt',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Sky Blue', stock: 12 },
      { size: 'M', color: 'Sky Blue', stock: 20 },
      { size: 'L', color: 'Sky Blue', stock: 15 },
      { size: 'XL', color: 'Sky Blue', stock: 8 }
    ]
  },
  {
    name: 'Silk Blend Studio Blouse',
    slug: 'silk-blend-studio-blouse',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    gender: 'women',
    price: 1999,
    mrp: 3299,
    fabric: '70% Mulberry Silk, 30% EcoVero Viscose',
    care_instructions: 'Dry clean only or delicate cold hand wash with silk detergent',
    description: 'Lustrous drape with concealed button placket, drop-shoulders, and elongated tailored cuffs.',
    images: [
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Champagne ivory long-sleeve silk blouse with concealed placket',
    tryon_enabled: true,
    variants: [
      { size: 'XS', color: 'Champagne', stock: 6 },
      { size: 'S', color: 'Champagne', stock: 12 },
      { size: 'M', color: 'Champagne', stock: 10 }
    ]
  },
  {
    name: 'Camp Collar Havana Shirt',
    slug: 'camp-collar-havana-shirt',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    gender: 'men',
    price: 1299,
    mrp: 1999,
    fabric: '100% Rayon Featherweight Crepe',
    care_instructions: 'Cold hand wash, do not wring, hang dry in shade',
    description: 'Relaxed notch lapel, fluid resort drape, and a boxy hem ideal for warm-weather styling.',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Olive green short-sleeve Cuban camp collar rayon shirt',
    tryon_enabled: true,
    variants: [
      { size: 'M', color: 'Sage Green', stock: 14 },
      { size: 'L', color: 'Sage Green', stock: 12 },
      { size: 'XL', color: 'Sage Green', stock: 6 }
    ]
  },
  {
    name: 'Onyx Utility Overshirt',
    slug: 'onyx-utility-overshirt',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    gender: 'unisex',
    price: 2199,
    mrp: 3499,
    fabric: 'Cotton Twill 280 GSM with Matte Black Snaps',
    care_instructions: 'Machine wash cold with darks, warm iron',
    description: 'Heavyweight structural overshirt featuring dual flap chest pockets and snap button closure.',
    images: [
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Black heavy cotton twill utility overshirt with chest flap pockets',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Jet Black', stock: 9 },
      { size: 'M', color: 'Jet Black', stock: 18 },
      { size: 'L', color: 'Jet Black', stock: 15 },
      { size: 'XL', color: 'Jet Black', stock: 7 }
    ]
  },

  // CATEGORY 3: Hoodies & Sweatshirts (c0000000-0000-0000-0000-000000000003)
  {
    name: 'Cobalt Heavyweight 450 GSM Hoodie',
    slug: 'cobalt-heavyweight-450-gsm-hoodie',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    gender: 'unisex',
    price: 2499,
    mrp: 3999,
    fabric: '450 GSM Ultra-Heavy French Terry Cotton',
    care_instructions: 'Turn inside out, wash on cold, dry flat to maintain weight',
    description: 'Dense double-layered hood, seamless kangaroo pouch, and 2x2 ribbed side ribbing for maximum durability.',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Deep blue heavyweight fleece pullover hoodie with pouch pocket',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Deep Blue', stock: 10 },
      { size: 'M', color: 'Deep Blue', stock: 20 },
      { size: 'L', color: 'Deep Blue', stock: 16 },
      { size: 'XL', color: 'Deep Blue', stock: 8 }
    ]
  },
  {
    name: 'Anthracite French Terry Crewneck',
    slug: 'anthracite-french-terry-crewneck',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    gender: 'unisex',
    price: 1799,
    mrp: 2799,
    fabric: '380 GSM Brushed Loopback Cotton',
    care_instructions: 'Machine wash cold, do not tumble dry',
    description: 'Timeless athletic crewneck with raglan sleeves and triangle collar gusset.',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Charcoal grey solid cotton crewneck long-sleeve sweatshirt',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Anthracite', stock: 8 },
      { size: 'M', color: 'Anthracite', stock: 14 },
      { size: 'L', color: 'Anthracite', stock: 10 }
    ]
  },
  {
    name: 'Ecrú Raw Hem Cropped Hoodie',
    slug: 'ecru-raw-hem-cropped-hoodie',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    gender: 'women',
    price: 1899,
    mrp: 2999,
    fabric: '320 GSM Super-soft Fleeced Cotton',
    care_instructions: 'Gentle cycle wash, low heat iron',
    description: 'Cropped waist with an unhemmed raw edge and balloon sleeves for dynamic streetwear silhouette.',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Off-white cream cropped pullover hoodie with long sleeves',
    tryon_enabled: true,
    variants: [
      { size: 'XS', color: 'Ecru', stock: 10 },
      { size: 'S', color: 'Ecru', stock: 15 },
      { size: 'M', color: 'Ecru', stock: 12 }
    ]
  },
  {
    name: 'Cyber Acid Zip-Through Hoodie',
    slug: 'cyber-acid-zip-through-hoodie',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    gender: 'men',
    price: 2699,
    mrp: 4199,
    fabric: '400 GSM Cotton Fleece with Dual YKK Metal Zips',
    care_instructions: 'Wash cold inside out, zip closed before washing',
    description: 'Two-way zipper allows customized ventilation. Deep split kangaroo pockets and thermal lined hood.',
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Washed slate grey full-zip hooded sweatshirt with dual metallic zippers',
    tryon_enabled: true,
    variants: [
      { size: 'M', color: 'Slate Grey', stock: 12 },
      { size: 'L', color: 'Slate Grey', stock: 18 },
      { size: 'XL', color: 'Slate Grey', stock: 6 }
    ]
  },
  {
    name: 'Sage Mock Neck Quarter-Zip',
    slug: 'sage-mock-neck-quarter-zip',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    gender: 'unisex',
    price: 1999,
    mrp: 3199,
    fabric: '360 GSM Fine French Terry',
    care_instructions: 'Machine wash cold, lay flat to dry',
    description: 'High stand-up collar with antique silver zipper and dropped shoulder seams for elevated leisurewear.',
    images: [
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Sage green quarter-zip mock neck long sleeve pullover sweatshirt',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Sage', stock: 9 },
      { size: 'M', color: 'Sage', stock: 15 },
      { size: 'L', color: 'Sage', stock: 11 }
    ]
  },

  // CATEGORY 4: Jackets & Outerwear (c0000000-0000-0000-0000-000000000004)
  {
    name: 'Apex Technical Bomber Jacket',
    slug: 'apex-technical-bomber-jacket',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    gender: 'unisex',
    price: 3499,
    mrp: 5499,
    fabric: 'Water-Repellent DWR Coated Ripstop Nylon',
    care_instructions: 'Wipe clean or cold delicate cycle, do not iron coating',
    description: 'Weatherproof technical MA-1 silhouette equipped with magnetic arm pocket, storm flap, and Primaloft insulation.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Black technical nylon flight bomber jacket with ribbed collar and zipper',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Matte Black', stock: 7 },
      { size: 'M', color: 'Matte Black', stock: 14 },
      { size: 'L', color: 'Matte Black', stock: 10 },
      { size: 'XL', color: 'Matte Black', stock: 4 }
    ]
  },
  {
    name: 'Heritage Raw Selvedge Denim Jacket',
    slug: 'heritage-raw-selvedge-denim-jacket',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    gender: 'men',
    price: 2999,
    mrp: 4799,
    fabric: '13.5 oz Raw Indigo Selvedge Denim',
    care_instructions: 'Wash rarely, cold soak inside out, hang to dry',
    description: 'Type III trucker jacket pattern with red selvedge ID, engraved brass hardware, and interior stash pockets.',
    images: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Dark indigo blue classic denim trucker jacket with button front and chest pockets',
    tryon_enabled: true,
    variants: [
      { size: 'M', color: 'Raw Indigo', stock: 12 },
      { size: 'L', color: 'Raw Indigo', stock: 15 },
      { size: 'XL', color: 'Raw Indigo', stock: 8 }
    ]
  },
  {
    name: 'Solitude Wool Cocoon Coat',
    slug: 'solitude-wool-cocoon-coat',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    gender: 'women',
    price: 4499,
    mrp: 6999,
    fabric: '80% Recycled Melton Wool, 20% Cashmere',
    care_instructions: 'Specialist dry clean only',
    description: 'Sculptural silhouette with dropped shoulders, oversized notch lapels, and luxurious full cupro lining.',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Camel tan oversized wool long overcoat with wide lapels',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Camel', stock: 6 },
      { size: 'M', color: 'Camel', stock: 10 },
      { size: 'L', color: 'Camel', stock: 8 }
    ]
  },
  {
    name: 'Stealth Puffer Gilet',
    slug: 'stealth-puffer-gilet',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    gender: 'unisex',
    price: 2299,
    mrp: 3599,
    fabric: 'Ripstop Shell with 700 Fill-Power Down Alternative',
    care_instructions: 'Machine wash cold on gentle, tumble dry with tennis balls',
    description: 'Baffled thermal vest engineered for core warmth with water-shedding shell and fleece-lined hand pockets.',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Matte black sleeveless puffer vest jacket with high collar',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Black', stock: 8 },
      { size: 'M', color: 'Black', stock: 14 },
      { size: 'L', color: 'Black', stock: 12 }
    ]
  },
  {
    name: 'Glacier Field Parka',
    slug: 'glacier-field-parka',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    gender: 'unisex',
    price: 4999,
    mrp: 7999,
    fabric: '3-Layer Hydrophobic Taslan with Taped Seams',
    care_instructions: 'Spot clean, cold gentle machine wash when needed',
    description: 'Expedition-grade outerwear with deep storm hood, waist cinch cord, and 6 waterproof utility compartments.',
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Military khaki green heavy hooded parka jacket with multi-pocket layout',
    tryon_enabled: true,
    variants: [
      { size: 'M', color: 'Khaki', stock: 10 },
      { size: 'L', color: 'Khaki', stock: 12 },
      { size: 'XL', color: 'Khaki', stock: 5 }
    ]
  },
  {
    name: 'Reflective Windbreaker',
    slug: 'reflective-windbreaker',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    gender: 'unisex',
    price: 2399,
    mrp: 3799,
    fabric: 'Ultralight Packable Micro-Poly',
    care_instructions: 'Cold rinse, drip dry only',
    description: 'Packs into its own internal pocket. 360-degree reflective piping gives high visibility for nighttime city running.',
    images: [
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80'
    ],
    garment_image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80',
    garment_des: 'Silver grey light hooded windbreaker running jacket with front zipper',
    tryon_enabled: true,
    variants: [
      { size: 'S', color: 'Silver Grey', stock: 9 },
      { size: 'M', color: 'Silver Grey', stock: 15 },
      { size: 'L', color: 'Silver Grey', stock: 11 }
    ]
  }
];

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database for seeding...');
    await client.connect();

    // 1. Run seed SQL for categories, size charts, coupons
    const seedSqlPath = path.resolve(__dirname, '../../../supabase/seed.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
    await client.query(seedSql);
    console.log('Base seed (categories, size chart, coupons) applied.');

    // 2. Insert products & variants
    console.log(`Inserting ${productsData.length} products with variants...`);
    for (const prod of productsData) {
      // Upsert product
      const productRes = await client.query(`
        INSERT INTO public.products (
          name, slug, category_id, gender, price, mrp, fabric,
          care_instructions, description, images, garment_image,
          garment_des, tryon_enabled, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          price = EXCLUDED.price,
          mrp = EXCLUDED.mrp,
          garment_image = EXCLUDED.garment_image,
          garment_des = EXCLUDED.garment_des,
          tryon_enabled = EXCLUDED.tryon_enabled
        RETURNING id;
      `, [
        prod.name, prod.slug, prod.category_id, prod.gender, prod.price, prod.mrp,
        prod.fabric, prod.care_instructions, prod.description, prod.images,
        prod.garment_image, prod.garment_des, prod.tryon_enabled
      ]);

      const productId = productRes.rows[0].id;

      // Insert variants
      for (const v of prod.variants) {
        const sku = `${prod.slug.toUpperCase().slice(0, 8)}-${v.size}-${v.color.toUpperCase().slice(0, 3)}`;
        await client.query(`
          INSERT INTO public.product_variants (product_id, size, color, sku, stock)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (sku) DO UPDATE SET
            stock = EXCLUDED.stock;
        `, [productId, v.size, v.color, sku, v.stock]);
      }
    }

    const countRes = await client.query('SELECT COUNT(*) as count FROM public.products;');
    const varCountRes = await client.query('SELECT COUNT(*) as count FROM public.product_variants;');
    console.log(`Seeding complete! Total products: ${countRes.rows[0].count}, Total variants: ${varCountRes.rows[0].count}`);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
