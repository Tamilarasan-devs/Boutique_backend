const pool = require('../config/db');

/**
 * requireSubscription middleware
 *
 * Verifies that the authenticated boutique has an active or valid trial subscription.
 * MUST be used after verifyToken so that req.user.boutique_id is available.
 *
 * FIX: Previously hardcoded `WHERE id = 1` — completely broken for multi-tenant.
 *      Now correctly scoped to the authenticated boutique_id.
 */
const requireSubscription = async (req, res, next) => {
  const boutique_id = req.user?.boutique_id;

  if (!boutique_id) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  try {
    const result = await pool.query(
      'SELECT status, trial_end FROM subscriptions WHERE boutique_id = $1 LIMIT 1',
      [boutique_id]
    );
    const sub = result.rows[0];

    if (!sub) {
      // No subscription record found — allow access (new boutique, not yet set up)
      return next();
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
        return res.status(403).json({
          error: 'Trial Expired',
          message: 'Your 15-day free trial has expired. Please upgrade to Pro to continue.',
          status: 'expired',
        });
      }
    }

    // Default: reject
    return res.status(403).json({
      error: 'Subscription Required',
      message: 'Your subscription is inactive. Please upgrade to Pro to continue.',
      status: status || 'inactive',
    });

  } catch (error) {
    console.error('[requireSubscription] Error:', error.message);
    res.status(500).json({ error: 'Internal server error validating subscription.' });
  }
};

module.exports = requireSubscription;
