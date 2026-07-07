const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');

// Initialize Razorpay with test keys if env vars are missing
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123',
});

// @route   POST /api/subscription/create
const createSubscription = async (req, res) => {
  const { plan_id } = req.body;
  try {
    const options = {
      plan_id: plan_id || 'plan_mock123',
      customer_notify: 1,
      total_count: 12,
    };
    
    if (razorpay.key_id === 'rzp_test_mock123') {
      return res.json({
        id: 'sub_mock_' + Math.random().toString(36).substring(7),
        entity: 'subscription',
        status: 'created',
      });
    }

    const subscription = await razorpay.subscriptions.create(options);
    res.json(subscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

// @route   POST /api/subscription/verify-signature
const verifySignature = async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

  try {
    if (razorpay.key_id === 'rzp_test_mock123') {
      await pool.query(
        "UPDATE subscriptions SET status = 'active', razorpay_subscription_id = $1 WHERE id = 1",
        [razorpay_subscription_id]
      );
      return res.json({ success: true, message: 'Payment verified (mock)' });
    }

    const text = razorpay_payment_id + '|' + razorpay_subscription_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      await pool.query(
        "UPDATE subscriptions SET status = 'active', razorpay_subscription_id = $1 WHERE id = 1",
        [razorpay_subscription_id]
      );
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// @route   GET /api/subscription/status
const getSubscriptionStatus = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscriptions WHERE id = 1');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ status: 'inactive' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

module.exports = {
  createSubscription,
  verifySignature,
  getSubscriptionStatus
};
