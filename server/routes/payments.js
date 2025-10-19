const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Razorpay = require('razorpay');

const router = express.Router();
const crypto = require('crypto');

// Initialize Razorpay (only if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// ------------------------- PayU (Basic UPI) -------------------------
const PAYU_ENV = (process.env.PAYU_ENV || 'test').toLowerCase();
const PAYU_KEY = process.env.PAYU_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';
const PAYU_ACTION_URL = PAYU_ENV === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment';

// Create PayU order request payload (hash v1)
router.post('/payu/order', authenticate, [
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!PAYU_KEY || !PAYU_SALT) {
      return res.status(500).json({ message: 'PayU not configured' });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const amount = Number(order.pricing.total).toFixed(2);
    const productinfo = `CraftKart Order ${order.orderNumber}`;
    const firstname = order.user.name || 'Buyer';
    const email = order.user.email || 'buyer@example.com';
    const phone = order.shippingAddress?.phone || '9999999999';
    const surl = process.env.PAYU_SUCCESS_URL || `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/payments/payu/callback`;
    const furl = process.env.PAYU_FAILURE_URL || surl;
    const txnid = `CK${Date.now()}`;

    // Include udf values in hash if you send them in fields
    const udf1 = order._id.toString();
    const udf2 = req.user._id.toString();
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';
    const udf6 = '';
    const udf7 = '';
    const udf8 = '';
    const udf9 = '';
    const udf10 = '';

    // Hash string: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|SALT
    const hashString = [
      PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      udf6,
      udf7,
      udf8,
      udf9,
      udf10
    ].join('|') + '|' + PAYU_SALT;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const fields = {
      key: PAYU_KEY,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      surl,
      furl,
      hash,
      udf1,
      udf2,
      // optional: force UPI page
      pg: 'UPI'
    };

    return res.json({ actionUrl: PAYU_ACTION_URL, fields });
  } catch (err) {
    console.error('PayU order error:', err);
    return res.status(500).json({ message: 'Server error creating PayU order' });
  }
});

// PayU callback (success/failure)
router.post('/payu/callback', async (req, res) => {
  try {
    // PayU posts form-url-encoded; ensure body parser for urlencoded is enabled globally
    const {
      status, mihpayid, txnid, amount, productinfo, firstname, email, hash,
      udf1
    } = req.body || {};

    if (!PAYU_SALT) return res.status(500).send('PayU not configured');

    // Verify response hash: sha512(salt|status|||||||||||email|firstname|productinfo|amount|txnid|key)
    const reverseHashString = [
      PAYU_SALT, status,
      '', '', '', '', '', '', '', '', '', '', '', '', '',
      email, firstname, productinfo, amount, txnid, PAYU_KEY
    ].join('|');
    const expected = crypto.createHash('sha512').update(reverseHashString).digest('hex');
    const verified = expected === hash;

    const orderId = udf1; // we sent our order id here
    if (!orderId) return res.status(400).send('Missing order reference');
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send('Order not found');

    if (verified && status === 'success') {
      order.paymentMethod.paymentId = mihpayid || txnid;
      order.paymentMethod.paymentStatus = 'completed';
      order.paymentMethod.paidAt = new Date();
      order.status = 'confirmed';
      await order.save();
    } else {
      order.paymentMethod.paymentStatus = 'failed';
      await order.save();
    }

    // Redirect buyer back to app
    const appUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    return res.redirect(`${appUrl}/orders`);
  } catch (err) {
    console.error('PayU callback error:', err);
    return res.status(500).send('Callback processing error');
  }
});

// Public route to fetch Razorpay Key ID for client checkout
// This is safe to expose; it's a public key used by Razorpay Checkout
router.get('/razorpay/key', (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) return res.status(500).json({ message: 'Razorpay not configured' });
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// Create Stripe payment intent
router.post('/stripe/create-payment-intent', authenticate, [
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.paymentMethod.paymentStatus === 'completed') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.pricing.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create Stripe payment intent error:', error);
    res.status(500).json({ message: 'Server error creating payment intent' });
  }
});

// Confirm Stripe payment
router.post('/stripe/confirm-payment', authenticate, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, orderId } = req.body;

    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order payment status
    order.paymentMethod.paymentId = paymentIntentId;
    order.paymentMethod.paymentStatus = 'completed';
    order.paymentMethod.paidAt = new Date();
    order.status = 'confirmed';

    await order.save();

    res.json({
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm Stripe payment error:', error);
    res.status(500).json({ message: 'Server error confirming payment' });
  }
});

// Create Razorpay order
router.post('/razorpay/create-order', authenticate, [
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!razorpay) {
      return res.status(500).json({ message: 'Razorpay not configured' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.pricing.total * 100), // Convert to paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString()
      }
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ message: 'Server error creating Razorpay order' });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify-payment', authenticate, [
  body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required'),
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Verify payment signature
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order payment status
    order.paymentMethod.paymentId = razorpayPaymentId;
    order.paymentMethod.paymentStatus = 'completed';
    order.paymentMethod.paidAt = new Date();
    order.status = 'confirmed';

    await order.save();

    // Send confirmation email to buyer
    try {
      const buyer = await User.findById(order.user).select('name email');
      if (buyer?.email) {
        await sendEmail({
          to: buyer.email,
          subject: `Payment Successful - ${order.orderNumber}`,
          template: 'orderConfirmation',
          data: {
            customerName: buyer.name,
            orderNumber: order.orderNumber,
            total: order.pricing.total.toFixed(2),
            status: 'paid'
          }
        });
      }
    } catch (emailErr) {
      console.error('Buyer payment email failed:', emailErr);
    }

    // Notify sellers involved in the order
    try {
      const sellerIds = [...new Set(order.items.map(i => i.seller.toString()))];
      for (const sellerId of sellerIds) {
        const seller = await User.findById(sellerId).select('name email');
        if (!seller?.email) continue;
        await sendEmail({
          to: seller.email,
          subject: 'You received a paid order – CraftKart',
          html: `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
              <h2 style="color:#8B5CF6;">Paid Order Received</h2>
              <p>Hello ${seller.name || 'Seller'},</p>
              <p>Order <strong>${order.orderNumber}</strong> has been paid via Razorpay.</p>
              <p><strong>Total (buyer):</strong> $${order.pricing.total.toFixed(2)}</p>
              <p>Please proceed with processing and shipping.</p>
            </div>
          `
        });
      }
    } catch (sellerEmailErr) {
      console.error('Seller payment email failed:', sellerEmailErr);
    }

    res.json({
      message: 'Payment verified successfully',
      order
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
});

// Process wallet payment
router.post('/wallet/pay', authenticate, [
  body('orderId').isMongoId().withMessage('Valid order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.user._id);
    if (user.wallet.balance < order.pricing.total) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct amount from wallet
    user.wallet.balance -= order.pricing.total;
    await user.save();

    // Update order payment status
    order.paymentMethod.paymentId = `wallet_${Date.now()}`;
    order.paymentMethod.paymentStatus = 'completed';
    order.paymentMethod.paidAt = new Date();
    order.status = 'confirmed';

    await order.save();

    res.json({
      message: 'Wallet payment successful',
      order,
      remainingBalance: user.wallet.balance
    });
  } catch (error) {
    console.error('Wallet payment error:', error);
    res.status(500).json({ message: 'Server error processing wallet payment' });
  }
});

// Add money to wallet
router.post('/wallet/add', authenticate, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('paymentMethod').isIn(['stripe', 'razorpay']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod } = req.body;

    if (paymentMethod === 'stripe') {
      if (!stripe) {
        return res.status(500).json({ message: 'Stripe not configured' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          type: 'wallet_topup',
          userId: req.user._id.toString()
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else if (paymentMethod === 'razorpay') {
      if (!razorpay) {
        return res.status(500).json({ message: 'Razorpay not configured' });
      }

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `wallet_${req.user._id}_${Date.now()}`,
        notes: {
          type: 'wallet_topup',
          userId: req.user._id.toString()
        }
      });

      res.json({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      });
    }
  } catch (error) {
    console.error('Add money to wallet error:', error);
    res.status(500).json({ message: 'Server error adding money to wallet' });
  }
});

// Confirm wallet top-up
router.post('/wallet/confirm-topup', authenticate, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('paymentMethod').isIn(['stripe', 'razorpay']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentId, paymentMethod } = req.body;

    // Verify payment (simplified - in production, verify with payment provider)
    const user = await User.findById(req.user._id);
    user.wallet.balance += amount;
    await user.save();

    res.json({
      message: 'Wallet topped up successfully',
      newBalance: user.wallet.balance
    });
  } catch (error) {
    console.error('Confirm wallet top-up error:', error);
    res.status(500).json({ message: 'Server error confirming wallet top-up' });
  }
});

// Get wallet balance
router.get('/wallet/balance', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    res.json({
      balance: user.wallet.balance,
      loyaltyPoints: user.wallet.loyaltyPoints
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ message: 'Server error fetching wallet balance' });
  }
});

// Webhook for Stripe (in production, this should be in a separate endpoint)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Update order status in database
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
