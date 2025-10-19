const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// Create order
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress.name').notEmpty().withMessage('Shipping name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Shipping street is required'),
  body('shippingAddress.city').notEmpty().withMessage('Shipping city is required'),
  body('shippingAddress.state').notEmpty().withMessage('Shipping state is required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Shipping zip code is required'),
  body('shippingAddress.country').notEmpty().withMessage('Shipping country is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Shipping phone is required'),
  body('paymentMethod.type').isIn(['stripe', 'razorpay', 'paypal', 'wallet', 'cod', 'payu']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    // Basic request debug (safe fields)
    console.log('[orders] create start', {
      user: req.user?._id?.toString?.(),
      itemsCount: Array.isArray(req.body.items) ? req.body.items.length : 0,
      paymentType: req.body?.paymentMethod?.type
    });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      gift
    } = req.body;

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      let product;
      try {
        product = await Product.findById(item.product);
      } catch (e) {
        console.error('[orders] invalid product id', item.product, e?.message);
        return res.status(400).json({ message: `Invalid product id: ${item.product}` });
      }
      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for product ${product.name}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        seller: product.seller
      });
    }

    // Calculate shipping (simplified, INR)
    const shipping = subtotal > 10000 ? 0 : 99; // Free shipping over ₹10,000
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    // Create order
    const orderData = {
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: {
        type: paymentMethod.type,
        paymentStatus: 'pending'
      },
      pricing: {
        subtotal,
        shipping,
        tax,
        total
      },
      gift: gift || {},
      // Mark all new orders as confirmed immediately
      status: 'confirmed'
    };

    const order = new Order(orderData);
    await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [], lastUpdated: new Date() } }
    );

    // Send confirmation email to buyer
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Order Confirmation - ${order.orderNumber}`,
        template: 'orderConfirmation',
        data: {
          customerName: req.user.name,
          orderNumber: order.orderNumber,
          total: total.toFixed(2),
          status: 'confirmed'
        }
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    // Notify each seller involved in the order
    try {
      const sellerItemsMap = {};
      orderItems.forEach((it) => {
        const sid = it.seller.toString();
        if (!sellerItemsMap[sid]) sellerItemsMap[sid] = [];
        sellerItemsMap[sid].push(it);
      });

      for (const sellerId of Object.keys(sellerItemsMap)) {
        const seller = await User.findById(sellerId).select('name email');
        if (!seller?.email) continue;
        const items = sellerItemsMap[sellerId];

        const itemsHtml = items
          .map((i) => `<li>${i.quantity} × ${i.product} — ₹${i.price.toFixed(2)}</li>`) // Product names could be fetched if needed
          .join('');

        await sendEmail({
          to: seller.email,
          subject: 'You Got a New Order – CraftKart',
          html: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
              <h2 style="color:#8B5CF6;">New Order Received</h2>
              <p>Hello ${seller.name || 'Seller'},</p>
              <p>You just received a new order <strong>${order.orderNumber}</strong>.</p>
              <h3>Items</h3>
              <ul>${itemsHtml}</ul>
              <p><strong>Order Total (buyer):</strong> ₹${total.toFixed(2)}</p>
              <p>Buyer: ${req.user.name} (${req.user.email})</p>
              <p>Login to your dashboard to process the order.</p>
            </div>
          `
        });
      }
    } catch (sellerEmailErr) {
      console.error('Seller notification email failed:', sellerEmailErr);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    // Surface more detail in development to help debugging
    const msg = process.env.NODE_ENV === 'development' && error?.message ? `Server error creating order: ${error.message}` : 'Server error creating order';
    res.status(500).json({ message: msg });
  }
});

// Get user's orders
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.product', 'name images price')
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
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
});

// Get single order
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images price')
      .populate('items.seller', 'name businessInfo.businessName email phone')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error fetching order' });
  }
});

// Update order status (seller/admin)
router.put('/:id/status', authenticate, [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
  body('trackingNumber').optional().isString(),
  body('carrier').optional().isString(),
  body('note').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, trackingNumber, carrier, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    const isSeller = order.items.some(item => 
      item.seller.toString() === req.user._id.toString()
    );
    
    if (!isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const updateData = { status };
    
    if (trackingNumber) {
      updateData.tracking = {
        ...order.tracking,
        trackingNumber,
        carrier: carrier || order.tracking?.carrier,
        trackingUrl: carrier ? `https://tracking.${carrier.toLowerCase()}.com/${trackingNumber}` : order.tracking?.trackingUrl
      };
    }

    if (note) {
      updateData.notes = {
        ...order.notes,
        [req.user.role]: note
      };
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name email');

    // Send notification email for status changes
    if (['shipped', 'delivered'].includes(status)) {
      try {
        await sendEmail({
          to: updatedOrder.user.email,
          subject: `Order Update - ${order.orderNumber}`,
          template: status === 'shipped' ? 'orderShipped' : 'orderDelivered',
          data: {
            customerName: updatedOrder.user.name,
            orderNumber: order.orderNumber,
            trackingNumber: trackingNumber || order.tracking?.trackingNumber,
            carrier: carrier || order.tracking?.carrier,
            trackingUrl: updateData.tracking?.trackingUrl,
            estimatedDelivery: updateData.tracking?.estimatedDelivery
          }
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
});

// Cancel order
router.put('/:id/cancel', authenticate, [
  body('reason').optional().isString()
], async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        notes: {
          ...order.notes,
          customer: reason || 'Order cancelled by customer'
        }
      },
      { new: true }
    );

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error cancelling order' });
  }
});

// Get seller's orders
router.get('/seller/orders', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seller access required' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const filter = { 'items.seller': req.user._id };
    
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.product', 'name images price')
      .populate('user', 'name email phone')
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
    console.error('Get seller orders error:', error);
    res.status(500).json({ message: 'Server error fetching seller orders' });
  }
});

module.exports = router;
