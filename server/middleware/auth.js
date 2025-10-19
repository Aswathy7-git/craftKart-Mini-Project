const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Check if user is seller
const requireSeller = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Seller role required.' });
  }
  next();
};

// Check if user is seller or admin
const requireSellerOrAdmin = (req, res, next) => {
  if (!['seller', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Seller or Admin role required.' });
  }
  next();
};

// Check if seller is approved
const requireApprovedSeller = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Access denied. Seller role required.' });
    }

    if (!req.user.businessInfo?.isApproved) {
      return res.status(403).json({ 
        message: 'Access denied. Your seller account is pending approval.' 
      });
    }

    next();
  } catch (error) {
    console.error('Approved seller check error:', error);
    res.status(500).json({ message: 'Server error during authorization check.' });
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireSeller,
  requireSellerOrAdmin,
  requireApprovedSeller
};
