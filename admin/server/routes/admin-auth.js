const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { protect } = require('../middleware/admin-auth');
const { validateRegistrationData, validateLoginData } = require('../../../shared/validation');

const router = express.Router();
const Admin = () => mongoose.model('Admin'); // 🔥 Отдельная модель Admin

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/admin/auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, adminCode } = req.body;

    // Validate admin code
    if (!adminCode || adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({ success: false, error: { adminCode: 'Неверный код администратора' } });
    }

    // Validate input
    const validation = validateRegistrationData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors });
    }

    const existingAdmin = await Admin().findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ success: false, error: { email: 'Администратор с таким email уже существует' } });
    }

    const existingPhone = await Admin().findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, error: { phone: 'Администратор с таким телефоном уже существует' } });
    }

    const admin = await Admin().create({
      firstName, lastName, email: email.toLowerCase(), phone, password
    });

    const token = generateToken(admin._id);
    res.status(201).json({ success: true, token, user: admin.toJSON() });
  } catch (error) {
    console.error('Admin register error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' ? 'Email уже зарегистрирован' : 'Телефон уже зарегистрирован';
      return res.status(400).json({ success: false, error: { [field]: message } });
    }
    
    res.status(500).json({ success: false, error: { server: 'Ошибка сервера при регистрации' } });
  }
});

// POST /api/admin/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLoginData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors });
    }

    const admin = await Admin().findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, error: { email: 'Администратор не найден' } });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { password: 'Неверный пароль' } });
    }

    const token = generateToken(admin._id);
    res.json({ success: true, token, user: admin.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const admin = await Admin().findById(req.user._id);
    if (!admin) return res.status(404).json({ success: false, error: 'Администратор не найден' });
    res.json(admin.toJSON());
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

module.exports = router;