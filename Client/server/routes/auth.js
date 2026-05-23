const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { protect } = require('../middleware/auth');
const { validateRegistrationData, validateLoginData } = require('../../../shared/validation');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validate input
    const validation = validateRegistrationData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, error: { email: 'Пользователь с таким email уже существует' } });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ success: false, error: { phone: 'Пользователь с таким телефоном уже существует' } });
    }

    const user = await User.create({ firstName, lastName, email: email.toLowerCase(), phone, password });
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user: user.toJSON() });

  } catch (error) {
    console.error('Register error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({ success: false, error: messages });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'email' ? 
        'Email уже зарегистрирован' : 
        'Телефон уже зарегистрирован';
      return res.status(400).json({ success: false, error: { [field]: message } });
    }
    
    res.status(500).json({ success: false, error: { server: 'Ошибка сервера при регистрации' } });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateLoginData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: { email: 'Пользователь не найден' } });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { password: 'Неверный пароль' } });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: user.toJSON() });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { server: 'Ошибка сервера при входе' } });
  }
});

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    res.json(user.toJSON());
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, error: 'Ошибка сервера' });
  }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existingPhone) {
        return res.status(400).json({ success: false, error: 'Этот номер телефона уже используется', field: 'phone' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone && { phone }) },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    res.json(user.toJSON());

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обновления профиля' });
  }
});

router.get('/cards', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('savedCards');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user.savedCards || [] });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ success: false, error: 'Failed to get saved cards' });
  }
});

router.post('/cards', protect, async (req, res) => {
  try {
    const { cardNumber, expiry, brand } = req.body;
    const normalizedNumber = String(cardNumber || '').replace(/\D/g, '');

    if (normalizedNumber.length < 12 || normalizedNumber.length > 19) {
      return res.status(400).json({ success: false, error: 'Invalid card number' });
    }

    if (!expiry || !/^\d{2}\/\d{2}$/.test(String(expiry))) {
      return res.status(400).json({ success: false, error: 'Invalid card expiry' });
    }

    const last4 = normalizedNumber.slice(-4);
    const detectedBrand = brand || (normalizedNumber.startsWith('4') ? 'Visa' : normalizedNumber.startsWith('5') ? 'Mastercard' : 'Card');
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const existingCard = user.savedCards.find(card => card.last4 === last4 && card.expiry === expiry);
    if (!existingCard) {
      user.savedCards.push({
        masked: `•••• ${last4}`,
        brand: detectedBrand,
        last4,
        expiry
      });
      await user.save();
    }

    res.status(201).json({ success: true, data: user.savedCards });
  } catch (error) {
    console.error('Save card error:', error);
    res.status(500).json({ success: false, error: 'Failed to save card' });
  }
});

router.delete('/cards/:cardId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.savedCards = user.savedCards.filter(card => card._id.toString() !== req.params.cardId);
    await user.save();

    res.json({ success: true, data: user.savedCards });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete card' });
  }
});

module.exports = router;
