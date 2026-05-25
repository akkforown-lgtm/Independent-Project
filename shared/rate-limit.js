const rateLimitStore = new Map();

const readPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getRateLimit = (key, maxRequests, windowMs) => {
  const now = Date.now();

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { requests: [], reset: now + windowMs });
  }

  const store = rateLimitStore.get(key);

  if (now > store.reset) {
    store.requests = [];
    store.reset = now + windowMs;
  }

  store.requests = store.requests.filter(time => now - time < windowMs);

  if (store.requests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((store.reset - now) / 1000)),
      reset: store.reset
    };
  }

  store.requests.push(now);
  return {
    allowed: true,
    remaining: maxRequests - store.requests.length,
    retryAfter: 0,
    reset: store.reset
  };
};

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000, keyGenerator = (req) => req.ip) => {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const key = keyGenerator(req);
    const limit = getRateLimit(key, maxRequests, windowMs);

    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(limit.remaining));
    res.set('X-RateLimit-Reset', new Date(limit.reset).toISOString());

    if (!limit.allowed) {
      res.set('Retry-After', String(limit.retryAfter));
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: limit.retryAfter
      });
    }

    next();
  };
};

const authWindowMs = readPositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);
const authMaxRequests = readPositiveInt(
  process.env.AUTH_RATE_LIMIT_MAX,
  process.env.NODE_ENV === 'production' ? 30 : 300
);

const authRateLimit = rateLimit(
  authMaxRequests,
  authWindowMs,
  (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'no-email';
    return `${req.ip}:${req.method}:${req.baseUrl}${req.path}:${email}`;
  }
);

const apiRateLimit = rateLimit(
  readPositiveInt(process.env.API_RATE_LIMIT_MAX, 100000),
  readPositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000)
);

module.exports = {
  rateLimit,
  authRateLimit,
  apiRateLimit
};
