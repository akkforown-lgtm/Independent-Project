require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const client = require('prom-client');
const multer = require('multer');
const { apiRateLimit, authRateLimit } = require('../../shared/rate-limit');

// ====== ENVIRONMENT VALIDATION ======
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_SECRET_CODE'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ ОШИБКА: Отсутствуют переменные окружения:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'admin_' });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ====== CORS CONFIGURATION ======
const rawCorsOrigin = process.env.CORS_ORIGIN;
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
// If running on Render, include the Render external URL automatically
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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ====== FILE UPLOAD CONFIGURATION ======
// Ensure assets directory exists
const assetsDir = path.join(__dirname, '../../Client/assets/images');
const fs = require('fs');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: assetsDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Допускаются только изображения (JPEG, PNG, GIF, WebP)'));
    }
    cb(null, true);
  }
});

// ====== RATE LIMITING ======
app.post('/api/admin/auth/login', authRateLimit);
app.post('/api/admin/auth/register', authRateLimit);
app.use('/api/admin', apiRateLimit);

const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    console.log('🔄 Админ-панель: Подключение к MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Админ-панель: MongoDB подключена');

    const adminSchema = require('../../shared/schemas/adminSchema')(mongoose);
    const bookingSchema = require('../../shared/schemas/bookingSchema')(mongoose);
    const userSchema = require('../../shared/schemas/userSchema')(mongoose);
    const roomSchema = require('../../shared/schemas/roomSchema')(mongoose);
    const regionLimitSchema = require('../../shared/schemas/regionLimitSchema')(mongoose);
    
    mongoose.model('Admin', adminSchema);
    mongoose.model('Booking', bookingSchema);
    mongoose.model('User', userSchema);
    mongoose.model('Room', roomSchema);
    mongoose.model('RegionLimit', regionLimitSchema);

    const { seed } = require('./seed-rooms');
    const roomCount = await mongoose.model('Room').countDocuments();
    if (roomCount < 9) {
      console.log('⏳ В базе меньше 9 комнат. Сею стандартные номера...');
      await seed();
    }

    const RegionLimit = mongoose.model('RegionLimit');
    const regionCount = await RegionLimit.countDocuments();
    if (regionCount === 0) {
      await RegionLimit.insertMany([
        { city: 'Tashkent', maxBookings: 3 },
        { city: 'Bukhara', maxBookings: 3 },
        { city: 'Samarkand', maxBookings: 3 },
        { city: 'Khiva', maxBookings: 3 },
        { city: 'Fergana', maxBookings: 3 }
      ]);
      console.log('✅ Default region booking limits seeded');
    }
    
    // 🔥 Регистрируем Checkout ДО подключения маршрутов
    const checkoutSchema = new mongoose.Schema({
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
      services: [{
        name: String,
        category: { type: String, enum: ['restaurant', 'bar', 'spa', 'transfer', 'laundry', 'excursion', 'other'] },
        price: Number,
        quantity: { type: Number, default: 1 }
      }],
      servicesTotal: { type: Number, default: 0 },
      roomTotal: Number,
      discount: { type: Number, default: 0 },
      grandTotal: Number,
      paymentMethod: { type: String, enum: ['card', 'cash', 'transfer'], default: 'card' },
      status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
      notes: String,
      closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      closedAt: { type: Date, default: Date.now }
    }, { timestamps: true });
    mongoose.model('Checkout', checkoutSchema);
    
    console.log('✅ Модели зарегистрированы');

    app.post('/api/admin/upload', upload.single('image'), (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ success: false, error: 'Файл не загружен' });
        }
        res.json({ success: true, imageUrl: `/assets/images/${req.file.filename}` });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: 'Ошибка загрузки файла' });
      }
    });

    // Error handler for multer
    app.use((error, req, res, next) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'FILE_TOO_LARGE') {
          return res.status(400).json({ success: false, error: 'Файл слишком большой (максимум 10MB)' });
        }
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next();
    });

    app.use('/api/admin/auth', require('./routes/admin-auth'));
    app.use('/api/admin/bookings', require('./routes/bookings'));
    app.use('/api/admin/rooms', require('./routes/rooms'));
    app.use('/api/admin/regions', require('./routes/regions'));
    app.use('/api/admin/accounting', require('./routes/accounting'));
    app.use('/api/admin/checkout', require('./routes/checkout'));
    app.use('/api/admin/history', require('./routes/history'));

    app.use('/assets/images', express.static(path.join(__dirname, '../../Client/assets/images')));

    app.get('/api/admin/health', (req, res) => {
      res.json({ status: 'ok', service: 'admin' });
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`\n🚀 Админ-панель: http://localhost:${PORT}`);
      console.log(`📊 Метрики: http://localhost:${PORT}/metrics\n`);
    });
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

start();
