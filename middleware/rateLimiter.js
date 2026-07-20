/**
 * rateLimiter.js
 * In-memory rate limiter for sensitive endpoints.
 * Tracks requests per IP and blocks if threshold is exceeded.
 *
 * For production multi-instance deployments, replace with Redis-backed limiter.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 15; // max requests per window per IP

// Map: IP -> { count, resetAt }
const store = new Map();

/**
 * Clean up expired entries every 5 minutes to prevent memory growth.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

const authLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', retryAfterSec);
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: retryAfterSec,
    });
  }

  next();
};

module.exports = { authLimiter };
