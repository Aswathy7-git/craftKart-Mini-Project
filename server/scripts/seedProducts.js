/*
 Seed script to populate handmade products across categories with images, descriptions, and prices.
 It also creates a demo approved seller so products have a valid seller reference.
 Usage:
   npm run seed
*/

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const User = require('../models/User');

const CATEGORIES = [
  'jewelry', 'home-decor', 'art', 'textiles', 'pottery',
  'woodwork', 'metalwork', 'paper-crafts', 'candles',
  'soaps', 'clothing', 'accessories', 'other'
];

// Royalty-free placeholder images (Unsplash) per theme
const IMAGE_POOL = {
  'jewelry': [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
    'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516'
  ],
  'home-decor': [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
    'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
  ],
  'art': [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    'https://images.unsplash.com/photo-1504198453319-5ce911bafcde'
  ],
  'textiles': [
    'https://images.unsplash.com/photo-1487004123179-0ad4aaf24ca7',
    'https://images.unsplash.com/photo-1493666438817-866a91353ca9',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1'
  ],
  'pottery': [
    'https://images.unsplash.com/photo-1545235617-9465d2a55698',
    'https://images.unsplash.com/photo-1582582429416-4f87a4c8f1fd',
    'https://images.unsplash.com/photo-1578301978693-85fa9ee07f2c'
  ],
  'woodwork': [
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4',
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'
  ],
  'metalwork': [
    'https://images.unsplash.com/photo-1517976487492-576ba3b8b9c9',
    'https://images.unsplash.com/photo-1484557052118-8254e7bff22b',
    'https://images.unsplash.com/photo-1587731546085-337f2b1c7f1f'
  ],
  'paper-crafts': [
    'https://images.unsplash.com/photo-1558884832-58e5d4b1b1b8',
    'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba'
  ],
  'candles': [
    'https://images.unsplash.com/photo-1519681393716-6f0b0d3b61ea',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd',
    'https://images.unsplash.com/photo-1519682337058-a94d519337bc'
  ],
  'soaps': [
    'https://images.unsplash.com/photo-1556228453-efd1cd5f3d7b',
    'https://images.unsplash.com/photo-1591375277343-9ba4c6ebe97e',
    'https://images.unsplash.com/photo-1561016444-14f747499547'
  ],
  'clothing': [
    'https://images.unsplash.com/photo-1520975922325-24baf8b1b3e1',
    'https://images.unsplash.com/photo-1520975693411-001dcd9a5022',
    'https://images.unsplash.com/photo-1516822003754-cca485356ecb'
  ],
  'accessories': [
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d',
    'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717',
    'https://images.unsplash.com/photo-1503342394126-480259ab8a30'
  ],
  'other': [
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    'https://images.unsplash.com/photo-1492724441997-5dc865305da7'
  ],
};

function titleCase(slug) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function randomPrice(min = 10, max = 200) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function buildImages(category) {
  const pool = IMAGE_POOL[category] || IMAGE_POOL['other'];
  return pool.map((url) => ({ url: `${url}?auto=format&fit=crop&w=1200&q=80`, alt: `${category} handmade` }));
}

async function ensureSellerUser() {
  let seller = await User.findOne({ email: 'seller@craftkart.com' }).select('+password');
  if (!seller) {
    seller = new User({
      name: 'CraftKart Seller',
      email: 'seller@craftkart.com',
      password: 'seller123',
      role: 'seller',
      businessInfo: {
        businessName: 'Handmade Hub',
        businessType: 'Artisan',
        description: 'Curated handmade goods by local artisans',
        isApproved: true,
        approvedAt: new Date()
      }
    });
    await seller.save();
  } else if (!seller.businessInfo?.isApproved || seller.role !== 'seller') {
    seller.role = 'seller';
    seller.businessInfo = {
      ...(seller.businessInfo || {}),
      isApproved: true,
      approvedAt: new Date(),
      businessName: seller.businessInfo?.businessName || 'Handmade Hub',
      businessType: seller.businessInfo?.businessType || 'Artisan',
      description: seller.businessInfo?.description || 'Curated handmade goods by local artisans'
    };
    await seller.save();
  }
  return seller;
}

function buildProduct(category, index, sellerId) {
  const name = `${titleCase(category)} Craft ${index + 1}`;
  const price = randomPrice();
  const originalPrice = Math.random() > 0.5 ? Math.round(price * (1 + Math.random() * 0.4) * 100) / 100 : undefined;

  return {
    name,
    description: `Handmade ${titleCase(category)} crafted with care and precision. Each piece is unique and tells a story. Perfect for gifting or personal use. Materials are sourced responsibly and crafted by skilled artisans.`,
    shortDescription: `Unique handmade ${titleCase(category)} item.`,
    category,
    subcategory: '',
    price,
    originalPrice,
    stock: Math.floor(Math.random() * 40) + 10,
    images: buildImages(category),
    seller: sellerId,
    status: 'approved',
    isActive: true,
    tags: [category, 'handmade', 'artisan'],
    materials: ['wood', 'cotton', 'metal', 'clay', 'paper'].slice(0, Math.floor(Math.random() * 3) + 1),
    sustainability: {
      isEcoFriendly: Math.random() > 0.6,
      story: 'Made with eco-conscious practices and love for the planet.'
    },
    shipping: {
      freeShipping: Math.random() > 0.7,
      shippingCost: 0
    }
  };
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: undefined });
  console.log('Connected to MongoDB');

  const seller = await ensureSellerUser();
  console.log('Using seller:', seller.email);

  // Wipe existing seed products created by this script to avoid duplicates
  console.log('Clearing existing products...');
  await Product.deleteMany({ 'seller': seller._id });

  // Build products: 6 per category
  const products = [];
  for (const cat of CATEGORIES) {
    for (let i = 0; i < 6; i++) {
      products.push(buildProduct(cat, i, seller._id));
    }
  }

  await Product.insertMany(products);
  console.log(`Inserted ${products.length} products.`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(async (err) => {
  console.error('Seed error:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
