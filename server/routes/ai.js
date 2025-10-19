const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticate } = require('../middleware/auth');
const { uploadSingle } = require('../utils/cloudinary');
const openai = require('../utils/openai');

const router = express.Router();

// Search suggestions
router.post('/search-suggest', [
  body('q').isString().trim().isLength({ min: 1 }).withMessage('Query is required'),
  body('max').optional().isInt({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, max = 5 } = req.body;

    const system = 'You generate concise, buyer-friendly search suggestions for a handmade crafts marketplace. Return ONLY a JSON array of strings. No commentary.';
    const user = `Query: ${q}\nReturn ${max} short suggestions that expand or narrow the search. Keep under 45 characters each.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.5,
      max_tokens: 150
    });

    const text = resp?.choices?.[0]?.message?.content || '[]';
    let suggestions = [];
    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      const json = start !== -1 && end !== -1 ? text.slice(start, end + 1) : '[]';
      const parsed = JSON.parse(json);
      suggestions = Array.isArray(parsed) ? parsed.filter(s => typeof s === 'string').slice(0, max) : [];
    } catch (_) {
      suggestions = [];
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('AI search-suggest error:', error);
    res.status(500).json({ message: 'Server error generating suggestions' });
  }
});

// Analyze product image (multipart) and get AI recommendations
// Accepts form-data: image (file). Optional body fields via query: productId, saveToProduct
router.post('/analyze-image', uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required (field name: image)' });
    }

    const imageUrl = req.file.path || req.file.secure_url || req.file.url;
    if (!imageUrl) {
      return res.status(400).json({ message: 'Failed to obtain uploaded image URL' });
    }

    const { productId, saveToProduct } = { ...req.body };

    // Use OpenAI Vision to analyze the product image
    const aiAnalysis = await analyzeProductImage(imageUrl);

    // Get similar products based on AI analysis
    let similarProducts = await getSimilarProducts(aiAnalysis, productId);

    // Fallback: if AI failed or returned empty and we have a filename, try text-based search
    if ((!similarProducts || similarProducts.length === 0) && (!aiAnalysis.tags || aiAnalysis.tags.length === 0)) {
      const rawName = (req.file.originalname || '').toLowerCase();
      const tokens = rawName
        .replace(/\.[^.]+$/, '')
        .split(/[\s_\-]+/)
        .filter(Boolean)
        .filter(t => !['img','image','photo','picture','product','handmade','craft','new'].includes(t))
        .slice(0, 5);

      if (tokens.length) {
        // Build naive regex OR over tokens against name or tags
        const regex = new RegExp(tokens.map(t => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'i');
        try {
          similarProducts = await Product.find({
            status: 'approved',
            isActive: true,
            $or: [
              { name: regex },
              { tags: { $in: tokens } },
              { category: { $in: tokens } }
            ]
          })
          .populate('seller', 'name businessInfo.businessName')
          .limit(8)
          .lean();
        } catch (_) {
          // ignore fallback errors
        }
        // Also seed minimal tags from tokens to help client
        if (!aiAnalysis.tags || aiAnalysis.tags.length === 0) {
          aiAnalysis.tags = tokens;
        }
      }
    }

    // Optionally save AI-generated fields to the product (requires auth)
    let updatedProduct = null;
    if (saveToProduct && productId && req.user) {
      try {
        updatedProduct = await saveAIFieldsToProduct(productId, aiAnalysis, req.user);
      } catch (_) {
        // ignore save errors to still return analysis
      }
    }

    res.json({
      analysis: aiAnalysis,
      tags: aiAnalysis.tags || [],
      imageUrl,
      similarProducts,
      updatedProduct
    });
  } catch (error) {
    console.error('AI image analysis error:', error);
    res.status(500).json({ message: 'Server error analyzing image' });
  }
});

// Visual search: returns similar products from uploaded image (no save)
router.post('/search-by-image', uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required' });
    const imageUrl = req.file.path || req.file.secure_url || req.file.url;
    const analysis = await analyzeProductImage(imageUrl);
    const similarProducts = await getSimilarProducts(analysis);
    res.json({ imageUrl, analysis, similarProducts });
  } catch (error) {
    console.error('AI search-by-image error:', error);
    res.status(500).json({ message: 'Server error performing visual search' });
  }
});

// Get product recommendations
router.get('/recommendations/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const recommendations = await getProductRecommendations(product);
    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error getting recommendations' });
  }
});

// Get personalized recommendations for user
router.get('/personalized/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const recommendations = await getPersonalizedRecommendations(userId);
    res.json({ recommendations });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({ message: 'Server error getting personalized recommendations' });
  }
});

// Helper function to analyze product image via OpenAI Vision
async function analyzeProductImage(imageUrl) {
  const systemPrompt = `You are a product catalog assistant for a handmade crafts marketplace.
Analyze the given product image and return ONLY strict JSON with these fields:
{
  "categories": string[] (broad marketplace categories e.g., "jewelry", "pottery", "home-decor"),
  "colors": string[] (dominant simple color names),
  "materials": string[] (e.g., "clay", "metal", "gemstone", "wood", "textile"),
  "style": string (e.g., "bohemian", "minimalist", "vintage", "modern"),
  "tags": string[] (5-12 SEO-friendly tags),
  "confidence": number 0..1,
  "description": string (1-2 sentences SEO-friendly)
}
No extra commentary.`;

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this product image and follow the JSON schema.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.2
    });
    const text = resp?.choices?.[0]?.message?.content;

    const jsonString = extractJson(text);
    const parsed = JSON.parse(jsonString);

    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials : [],
      style: parsed.style || '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
      description: parsed.description || ''
    };
  } catch (err) {
    console.error('OpenAI Vision parsing error:', err);
    return {
      categories: [],
      colors: [],
      materials: [],
      style: '',
      tags: [],
      confidence: 0.5,
      description: ''
    };
  }
}

// Extract first JSON object from a possibly verbose string
function extractJson(text) {
  if (!text) return '{}';
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return '{}';
}

// Helper: find similar products using analysis fields
async function getSimilarProducts(analysis, excludeProductId) {
  const { categories, colors, materials } = analysis;
  const filter = { status: 'approved', isActive: true };
  
  if (categories && categories.length) filter.category = { $in: categories };
  if (colors && colors.length) filter.colors = { $in: colors };
  if (materials && materials.length) filter.materials = { $in: materials };
  if (excludeProductId) filter._id = { $ne: excludeProductId };

  return await Product.find(filter)
    .populate('seller', 'name businessInfo.businessName')
    .limit(6)
    .lean();
}

// Helper: recommendations based on an existing product
async function getProductRecommendations(product) {
  const { category, tags = [], colors = [], materials = [] } = product;

  const similarProducts = await Product.find({
    _id: { $ne: product._id },
    status: 'approved',
    isActive: true,
    $or: [
      { category },
      { tags: { $in: tags } },
      { colors: { $in: colors } },
      { materials: { $in: materials } }
    ]
  })
    .populate('seller', 'name businessInfo.businessName')
    .limit(8)
    .lean();

  const trendingProducts = await Product.find({
    _id: { $ne: product._id },
    category,
    status: 'approved',
    isActive: true,
    trending: true
  })
    .populate('seller', 'name businessInfo.businessName')
    .limit(4)
    .lean();

  const featuredProducts = await Product.find({
    _id: { $ne: product._id },
    status: 'approved',
    isActive: true,
    featured: true
  })
    .populate('seller', 'name businessInfo.businessName')
    .limit(4)
    .lean();

  return { similar: similarProducts, trending: trendingProducts, featured: featuredProducts };
}

// Helper: naive personalized recommendations
async function getPersonalizedRecommendations() {
  const [trendingProducts, featuredProducts, recentProducts] = await Promise.all([
    Product.find({ status: 'approved', isActive: true, trending: true })
      .populate('seller', 'name businessInfo.businessName')
      .limit(6)
      .lean(),
    Product.find({ status: 'approved', isActive: true, featured: true })
      .populate('seller', 'name businessInfo.businessName')
      .limit(6)
      .lean(),
    Product.find({ status: 'approved', isActive: true })
      .sort({ createdAt: -1 })
      .populate('seller', 'name businessInfo.businessName')
      .limit(6)
      .lean()
  ]);

  return { trending: trendingProducts, featured: featuredProducts, recent: recentProducts };
}

// Helper: save AI-generated fields to product
async function saveAIFieldsToProduct(productId, analysis, user) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Authorization: only product owner or admin can update
    if (product.seller.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new Error('Not authorized to update this product');
    }

    const updateFields = {};
    
    // Add tags (merge with existing, avoid duplicates)
    if (analysis.tags && analysis.tags.length > 0) {
      const existingTags = product.tags || [];
      const newTags = [...new Set([...existingTags, ...analysis.tags])];
      updateFields.tags = newTags;
    }

    // Add materials (merge with existing, avoid duplicates)
    if (analysis.materials && analysis.materials.length > 0) {
      const existingMaterials = product.materials || [];
      const newMaterials = [...new Set([...existingMaterials, ...analysis.materials])];
      updateFields.materials = newMaterials;
    }

    // Add colors (merge with existing, avoid duplicates)
    if (analysis.colors && analysis.colors.length > 0) {
      const existingColors = product.colors || [];
      const newColors = [...new Set([...existingColors, ...analysis.colors])];
      updateFields.colors = newColors;
    }

    // Update SEO description if provided and not already set
    if (analysis.description && !product.seo?.metaDescription) {
      updateFields['seo.metaDescription'] = analysis.description;
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('seller', 'name businessInfo.businessName');

    return updatedProduct;
  } catch (error) {
    console.error('Save AI fields error:', error);
    throw error;
  }
}

module.exports = router;