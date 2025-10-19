const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        address: req.user.address,
        isEmailVerified: req.user.isEmailVerified,
        businessInfo: req.user.businessInfo,
        wallet: req.user.wallet,
        preferences: req.user.preferences,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('address.state').optional().trim(),
  body('address.zipCode').optional().trim(),
  body('address.country').optional().trim(),
  body('preferences.categories').optional().isArray(),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.sms').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Upload avatar
router.post('/avatar', authenticate, async (req, res) => {
  try {
    // In a real implementation, you would handle file upload here
    // For now, we'll just return a success message
    res.json({ message: 'Avatar upload endpoint - implement file upload logic' });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
});

// Get user's activity/stats
router.get('/activity', authenticate, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Review = require('../models/Review');
    const Cart = require('../models/Cart');

    const [orders, reviews, cart] = await Promise.all([
      Order.countDocuments({ user: req.user._id }),
      Review.countDocuments({ user: req.user._id }),
      Cart.findOne({ user: req.user._id })
    ]);

    res.json({
      stats: {
        totalOrders: orders,
        totalReviews: reviews,
        cartItems: cart?.items?.length || 0,
        wishlistItems: cart?.wishlist?.length || 0
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error fetching user activity' });
  }
});

// Update business info (for sellers)
router.put('/business-info', authenticate, [
  body('businessName').optional().trim().isLength({ min: 2, max: 100 }),
  body('businessType').optional().trim().isLength({ min: 2, max: 50 }),
  body('description').optional().trim().isLength({ min: 10, max: 500 }),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seller access required' });
    }

    const { businessName, businessType, description, website } = req.body;
    const businessInfo = {
      ...req.user.businessInfo,
      businessName: businessName || req.user.businessInfo?.businessName,
      businessType: businessType || req.user.businessInfo?.businessType,
      description: description || req.user.businessInfo?.description,
      website: website || req.user.businessInfo?.website
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { businessInfo },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Business info updated successfully',
      user
    });
  } catch (error) {
    console.error('Update business info error:', error);
    res.status(500).json({ message: 'Server error updating business info' });
  }
});

// Deactivate account
router.put('/deactivate', authenticate, [
  body('password').notEmpty().withMessage('Password is required for account deactivation')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Server error deactivating account' });
  }
});

// Get user by ID (public info only)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar businessInfo.businessName createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only show public information
    const publicInfo = {
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      businessName: user.businessInfo?.businessName,
      memberSince: user.createdAt
    };

    res.json({ user: publicInfo });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

module.exports = router;
