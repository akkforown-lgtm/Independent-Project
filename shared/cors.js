const cors = require('cors');

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

  return {
    corsOrigins,
    corsOptions,
    corsMiddleware: cors(corsOptions)
  };
}

module.exports = createCors;
