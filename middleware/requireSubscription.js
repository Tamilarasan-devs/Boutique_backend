const pool = require('../config/db');

const requireSubscription = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT status, trial_end FROM subscriptions WHERE id = 1');
    const sub = result.rows[0];

    if (!sub) {
      return res.status(403).json({ error: 'Subscription Required', message: 'No subscription record found.', status: 'inactive' });
    }

    const { status, trial_end } = sub;

    // If active, let them through
    if (status === 'active') {
      return next();
    }

    // If trialing, check if trial is still valid
    if (status === 'trialing' && trial_end) {
      const now = new Date();
      if (new Date(trial_end) > now) {
        return next();
      } else {
        // Trial expired
        return res.status(403).json({
          error: 'Trial Expired',
          message: 'Your 15-day free trial has expired. Please upgrade to Pro to continue.',
          status: 'expired'
        });
      }
    }

    // Default reject
    return res.status(403).json({
      error: 'Subscription Required',
      message: 'Your SaaS subscription is inactive. Please upgrade to Pro to continue.',
      status: status || 'inactive'
    });
    
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ error: 'Internal Server Error validating subscription' });
  }
};

module.exports = requireSubscription;
