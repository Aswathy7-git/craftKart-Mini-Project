const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, requireAdmin);

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingProducts,
      pendingSellers,
      recentOrders,
      monthlyRevenue
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'seller', 'businessInfo.isApproved': false }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            },
            status: { $in: ['delivered', 'shipped'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$pricing.total' }
          }
        }
      ])
    ]);

    // Get sales data for the last 6 months
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          },
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$pricing.total' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        pendingProducts,
        pendingSellers,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      },
      recentOrders,
      salesData
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// Delete a product (admin)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
});

// Bulk delete products without a visible image
router.delete('/products/cleanup/no-image', async (req, res) => {
  try {
    const result = await Product.deleteMany({
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } },
        { 'images.0.url': { $in: [null, '', undefined] } }
      ]
    });
    res.json({ message: 'Cleanup completed', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Bulk delete products without image error:', error);
    res.status(500).json({ message: 'Server error during cleanup' });
  }
});

// Get all users
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('role').optional().isIn(['user', 'seller', 'admin']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// Get pending sellers
router.get('/sellers/pending', async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      'businessInfo.isApproved': false
    }).select('-password');

    res.json({ sellers });
  } catch (error) {
    console.error('Get pending sellers error:', error);
    res.status(500).json({ message: 'Server error fetching pending sellers' });
  }
});

// Approve/reject seller
router.put('/sellers/:id/approve', [
  body('approved').isBoolean().withMessage('Approved status is required'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { approved, reason } = req.body;
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    seller.businessInfo.isApproved = approved;
    seller.businessInfo.approvedAt = approved ? new Date() : null;
    
    if (reason) {
      seller.businessInfo.rejectionReason = approved ? null : reason;
    }

    await seller.save();

    res.json({
      message: `Seller ${approved ? 'approved' : 'rejected'} successfully`,
      seller
    });
  } catch (error) {
    console.error('Approve/reject seller error:', error);
    res.status(500).json({ message: 'Server error updating seller status' });
  }
});

// Get all products
router.get('/products', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .populate('seller', 'name email businessInfo.businessName')
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
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// Approve/reject product
router.put('/products/:id/approve', [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reason } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.status = status;
    if (reason) {
      product.adminNotes = reason;
    }

    await product.save();

    res.json({
      message: `Product ${status} successfully`,
      product
    });
  } catch (error) {
    console.error('Approve/reject product error:', error);
    res.status(500).json({ message: 'Server error updating product status' });
  }
});

// Get all orders
router.get('/orders', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isString(),
  query('search').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .populate('items.seller', 'name businessInfo.businessName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Update user status
router.put('/users/:id/status', [
  body('isActive').isBoolean().withMessage('Active status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// Get analytics data
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      userGrowth,
      orderGrowth,
      revenueGrowth,
      topProducts,
      topSellers
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $in: ['delivered', 'shipped'] } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            revenue: { $sum: '$pricing.total' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Product.aggregate([
        { $match: { status: 'approved', isActive: true } },
        { $sort: { 'analytics.sales': -1 } },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            price: 1,
            images: 1,
            'analytics.sales': 1,
            'analytics.views': 1
          }
        }
      ]),
      User.aggregate([
        { $match: { role: 'seller', 'businessInfo.isApproved': true } },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'seller',
            as: 'products'
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: 'products._id',
            foreignField: 'items.product',
            as: 'orders'
          }
        },
        {
          $addFields: {
            totalSales: { $sum: '$orders.pricing.total' },
            productCount: { $size: '$products' }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 },
        {
          $project: {
            name: 1,
            email: 1,
            'businessInfo.businessName': 1,
            totalSales: 1,
            productCount: 1
          }
        }
      ])
    ]);

    res.json({
      userGrowth,
      orderGrowth,
      revenueGrowth,
      topProducts,
      topSellers
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;
