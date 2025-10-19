const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { authenticate, requireSellerOrAdmin, requireApprovedSeller } = require('../middleware/auth');
const { uploadMultiple, deleteImage } = require('../utils/cloudinary');

const router = express.Router();

// Get all products (public)
router.get('/', [
  query('page').optional({ checkFalsy: true }).isInt({ min: 1 }),
  query('limit').optional({ checkFalsy: true }).isInt({ min: 1, max: 50 }),
  query('category').optional({ checkFalsy: true }).isString(),
  query('search').optional({ checkFalsy: true }).isString(),
  query('sort').optional({ checkFalsy: true }).isIn(['price_asc', 'price_desc', 'newest', 'popular']),
  query('minPrice').optional({ checkFalsy: true }).isFloat({ min: 0 }),
  query('maxPrice').optional({ checkFalsy: true }).isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 12,
      category,
      search,
      sort = 'newest',
      minPrice,
      maxPrice
    } = req.query;

    // Build filter object
    const filter = {
      status: 'approved',
      isActive: true
    };

    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'price_asc':
        sortObj = { price: 1 };
        break;
      case 'price_desc':
        sortObj = { price: -1 };
        break;
      case 'popular':
        sortObj = { 'analytics.views': -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .populate('seller', 'name businessInfo.businessName')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email businessInfo.businessName avatar')
      .populate('reviews.user', 'name avatar')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Temporarily allow viewing product detail regardless of approval/active state
    // This prevents 404s when navigating from listings while data is being curated.

    // Increment view count
    await Product.findByIdAndUpdate(req.params.id, {
      $inc: { 'analytics.views': 1 }
    });

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// Create product (seller only)
router.post('/', 
  authenticate, 
  (process.env.NODE_ENV !== 'production' ? requireSellerOrAdmin : requireApprovedSeller), 
  [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Product name must be 2-100 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('category').isIn([
    'jewelry', 'home-decor', 'art', 'textiles', 'pottery', 
    'woodwork', 'metalwork', 'paper-crafts', 'candles', 
    'soaps', 'clothing', 'accessories', 'other'
  ]).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      shortDescription,
      category,
      subcategory,
      price,
      originalPrice,
      stock,
      tags,
      dimensions,
      weight,
      materials,
      colors,
      sustainability,
      shipping
    } = req.body;

    const productData = {
      name,
      description,
      shortDescription,
      category,
      subcategory,
      price,
      originalPrice,
      stock,
      seller: req.user._id,
      tags: tags || [],
      dimensions,
      weight,
      materials: materials || [],
      colors: colors || [],
      sustainability: sustainability || {},
      shipping: shipping || {}
    };

    // In development, auto-approve products to simplify testing. In production, keep default 'pending'.
    if (process.env.NODE_ENV !== 'production') {
      productData.status = 'approved';
      productData.isActive = true;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
});

// Upload product images
router.post('/:id/images', 
  authenticate, 
  (process.env.NODE_ENV !== 'production' ? requireSellerOrAdmin : requireApprovedSeller), 
  uploadMultiple, 
  async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // req.files are already uploaded to Cloudinary by CloudinaryStorage
    const uploaded = (req.files || []).map((f) => ({
      public_id: f.filename, // Cloudinary public id
      url: f.path,           // secure URL
      alt: f.originalname
    }));
    
    product.images = [...product.images, ...uploaded];
    await product.save();

    res.json({
      message: 'Images uploaded successfully',
      images: product.images
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error uploading images' });
  }
});

// Update product
router.put('/:id', authenticate, requireApprovedSeller, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    const updateData = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
});

// Delete product
router.delete('/:id', authenticate, requireSellerOrAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    // Delete images from cloudinary
    for (const image of product.images) {
      await deleteImage(image.public_id);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// Get seller's products
router.get('/seller/my-products', authenticate, requireApprovedSeller, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { seller: req.user._id };
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ message: 'Server error fetching seller products' });
  }
});

// Get similar products
router.get('/:id/similar', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const similarProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'approved',
      isActive: true
    })
    .populate('seller', 'name businessInfo.businessName')
    .limit(6)
    .lean();

    res.json({ products: similarProducts });
  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({ message: 'Server error fetching similar products' });
  }
});

module.exports = router;
