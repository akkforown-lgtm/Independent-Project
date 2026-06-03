const cors = require('cors');

function normalizeOrigin(origin) {
  return String(origin || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
}

function createCors() {
  const rawCorsOrigin = process.env.CORS_ORIGIN;
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  if (process.env.RENDER_EXTERNAL_URL) {
    defaultOrigins.push(process.env.RENDER_EXTERNAL_URL);
  }

  const corsOrigins = rawCorsOrigin
    ? rawCorsOrigin.split(',').map(origin => origin.trim()).filter(Boolean)
    : defaultOrigins;

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      const msg = `CORS origin denied: ${origin}`;
      console.warn(msg);
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  };

  const baseCorsMiddleware = cors(corsOptions);

  return {
    corsOrigins,
    corsOptions,
    corsMiddleware: (req, res, next) => {
      const origin = req.get('origin');
      const host = req.get('host');
      const normalizedOrigin = normalizeOrigin(origin);
      const normalizedHost = normalizeOrigin(host);

      if (origin && host && normalizedOrigin === normalizedHost && !corsOrigins.includes(origin)) {
        corsOrigins.push(origin);
      }

      return baseCorsMiddleware(req, res, next);
    }
  };
}

module.exports = createCors;
