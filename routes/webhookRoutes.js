const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');

// @route   POST /api/webhooks/razorpay
router.post('/razorpay', async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_123';
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  // Verify webhook signature (skip in dev if mock)
  if (digest === req.headers['x-razorpay-signature'] || process.env.RAZORPAY_WEBHOOK_SECRET === undefined) {
    const event = req.body.event;
    
    try {
      if (event === 'subscription.charged') {
        const subscriptionId = req.body.payload.subscription.entity.id;
        await pool.query(
          "UPDATE subscriptions SET status = 'active' WHERE razorpay_subscription_id = $1",
          [subscriptionId]
        );
      } else if (event === 'subscription.halted' || event === 'subscription.cancelled') {
        const subscriptionId = req.body.payload.subscription.entity.id;
        await pool.query(
          "UPDATE subscriptions SET status = 'cancelled' WHERE razorpay_subscription_id = $1",
          [subscriptionId]
        );
      }
      res.json({ status: 'ok' });
    } catch (err) {
      console.error('Webhook processing error:', err);
      res.status(500).send('Error');
    }
  } else {
    res.status(400).send('Invalid signature');
  }
});

module.exports = router;
