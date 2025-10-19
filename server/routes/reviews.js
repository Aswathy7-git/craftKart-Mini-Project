const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create review
router.post('/', authenticate, [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, orderId, rating, title, comment, images } = req.body;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'delivered'
    });

    if (!order) {
      return res.status(400).json({ 
        message: 'Order not found or not eligible for review' 
      });
    }

    // Check if product was in the order
    const orderItem = order.items.find(item => 
      item.product.toString() === productId
    );

    if (!orderItem) {
      return res.status(400).json({ 
        message: 'Product was not in this order' 
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'Review already exists for this product' 
      });
    }

    // Create review
    const reviewData = {
      user: req.user._id,
      product: productId,
      order: orderId,
      rating,
      title,
      comment,
      images: images || [],
      verified: true
    };

    const review = new Review(reviewData);
    await review.save();

    // Update product with review reference
    await Product.findByIdAndUpdate(productId, {
      $push: { reviews: review._id }
    });

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error creating review' });
  }
});

// Get product reviews
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, rating } = req.query;
    const filter = { 
      product: req.params.productId,
      isActive: true 
    };

    if (rating) filter.rating = parseInt(rating);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { product: req.params.productId, isActive: true } },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total
      },
      averageRating: avgRating[0]?.average || 0
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
});

// Get user's reviews
router.get('/my-reviews', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user._id });

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error fetching user reviews' });
  }
});

// Update review
router.put('/:id', authenticate, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('comment').optional().trim().isLength({ min: 10, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const updateData = req.body;
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name avatar');

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error updating review' });
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Remove review from product
    await Product.findByIdAndUpdate(review.product, {
      $pull: { reviews: review._id }
    });

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error deleting review' });
  }
});

// Mark review as helpful
router.post('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already marked as helpful
    const alreadyHelpful = review.helpful.users.includes(req.user._id);
    
    if (alreadyHelpful) {
      // Remove helpful vote
      review.helpful.users.pull(req.user._id);
      review.helpful.count = Math.max(0, review.helpful.count - 1);
    } else {
      // Add helpful vote
      review.helpful.users.push(req.user._id);
      review.helpful.count += 1;
    }

    await review.save();

    res.json({
      message: alreadyHelpful ? 'Removed helpful vote' : 'Marked as helpful',
      helpfulCount: review.helpful.count
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Server error marking review as helpful' });
  }
});

// Respond to review (seller)
router.post('/:id/respond', authenticate, [
  body('response').trim().isLength({ min: 5, max: 500 }).withMessage('Response must be 5-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { response } = req.body;
    const review = await Review.findById(req.params.id)
      .populate('product', 'seller');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the seller of the product
    if (review.product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to respond to this review' });
    }

    review.response = {
      text: response,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    await review.save();

    res.json({
      message: 'Response added successfully',
      review
    });
  } catch (error) {
    console.error('Respond to review error:', error);
    res.status(500).json({ message: 'Server error responding to review' });
  }
});

module.exports = router;
