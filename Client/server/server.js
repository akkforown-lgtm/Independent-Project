require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const { apiRateLimit, authRateLimit } = require('../../shared/rate-limit');

let metricsClient = null;
try {
  metricsClient = require('prom-client');
  metricsClient.collectDefaultMetrics({ prefix: 'client_' });
} catch (error) {
  console.warn('Prometheus default metrics disabled: prom-client is not installed');
}

// ====== ENVIRONMENT VALIDATION ======
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('ERROR: Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

app.get('/metrics', async (req, res) => {
  if (metricsClient) {
    res.set('Content-Type', metricsClient.register.contentType);
    return res.end(await metricsClient.register.metrics());
  }

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.end([
    '# HELP client_up Whether the client API process is running',
    '# TYPE client_up gauge',
    'client_up 1',
    '# HELP client_uptime_seconds Client API process uptime in seconds',
    '# TYPE client_uptime_seconds counter',
    `client_uptime_seconds ${Math.floor(process.uptime())}`
  ].join('\n') + '\n');
});

// ====== CORS CONFIGURATION ======
const rawCorsOrigin = process.env.CORS_ORIGIN;
const corsOrigins = rawCorsOrigin
  ? rawCorsOrigin.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// ====== RATE LIMITING ======
app.use('/api/auth', authRateLimit);
app.use('/api', apiRateLimit);

const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    console.log('Client API: connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Client API: MongoDB connected');

    // Register only client-facing models.
    const userSchema = require('../../shared/schemas/userSchema')(mongoose);
    const bookingSchema = require('../../shared/schemas/bookingSchema')(mongoose);
    const roomSchema = require('../../shared/schemas/roomSchema')(mongoose);
    const regionLimitSchema = require('../../shared/schemas/regionLimitSchema')(mongoose);
    
    const User = mongoose.model('User', userSchema);
    const Booking = mongoose.model('Booking', bookingSchema);
    mongoose.model('Room', roomSchema);
    mongoose.model('RegionLimit', regionLimitSchema);
    
    // Explicitly build/sync indexes in background
    User.createIndexes().catch(err => console.error('Error creating User indexes:', err));
    Booking.createIndexes().catch(err => console.error('Error creating Booking indexes:', err));
    
    console.log('Client API: models registered (users, bookings, rooms, region limits) and indexes queued');

    const authRoutes = require('./routes/auth');
    const bookingRoutes = require('./routes/bookings');
    const roomRoutes = require('./routes/rooms');

    app.use('/api/auth', authRoutes);
    app.use('/api/bookings', bookingRoutes);
    app.use('/api/rooms', roomRoutes);

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', service: 'client', timestamp: new Date().toISOString() });
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Client API: http://localhost:${PORT}`);
      console.log(`Metrics: http://localhost:${PORT}/metrics\n`);
    });
  } catch (error) {
    console.error('Startup error:', error.message);
    process.exit(1);
  }
}

start();
