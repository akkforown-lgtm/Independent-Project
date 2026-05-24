/**
 * Rate limiting middleware
 */

const rateLimitStore = new Map();

const getRateLimit = (key, maxRequests, windowMs) => {
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { requests: [], reset: now + windowMs });
  }

  const store = rateLimitStore.get(key);

  // Reset if window expired
  if (now > store.reset) {
    store.requests = [];
    store.reset = now + windowMs;
  }

  // Clean old requests
  store.requests = store.requests.filter(time => now - time < windowMs);

  if (store.requests.length >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((store.reset - now) / 1000) };
  }

  store.requests.push(now);
  return { allowed: true, remaining: maxRequests - store.requests.length };
};

/**
 * Rate limit middleware
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @param {function} keyGenerator - Function to generate rate limit key
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000, keyGenerator = (req) => req.ip) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const limit = getRateLimit(key, maxRequests, windowMs);

    res.set('X-RateLimit-Limit', maxRequests);
    res.set('X-RateLimit-Remaining', limit.remaining);
    res.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

    if (!limit.allowed) {
      res.set('Retry-After', limit.retryAfter);
      return res.status(429).json({
        success: false,
        error: 'Слишком много запросов. Попробуйте позже.',
        retryAfter: limit.retryAfter
      });
    }

    next();
  };
};

/**
 * Strict rate limit for auth endpoints
 */
const authRateLimit = rateLimit(15, 15 * 60 * 1000);

/**
 * General rate limit for API
 */
const apiRateLimit = rateLimit(100000, 15 * 60 * 1000);

module.exports = {
  rateLimit,
  authRateLimit,
  apiRateLimit
};
