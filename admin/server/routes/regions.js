const express = require('express');
const mongoose = require('mongoose');
const RegionLimit = mongoose.model('RegionLimit');
const { protect } = require('../middleware/admin-auth');

const router = express.Router();

function sanitizeCity(city) {
  return String(city || '').trim();
}

router.get('/', protect, async (req, res) => {
  try {
    const regions = await RegionLimit.find().sort({ city: 1 });
    res.json({ success: true, data: regions });
  } catch (error) {
    console.error('Get region limits error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения лимитов регионов' });
  }
});

router.put('/:city', protect, async (req, res) => {
  try {
    const city = sanitizeCity(decodeURIComponent(req.params.city));
    const maxBookings = Number(req.body.maxBookings);

    if (!city) {
      return res.status(400).json({ success: false, error: 'Город обязателен' });
    }
    if (!maxBookings || isNaN(maxBookings) || maxBookings < 1) {
      return res.status(400).json({ success: false, error: 'Лимит должен быть положительным числом' });
    }

    const region = await RegionLimit.findOneAndUpdate(
      { city },
      { city, maxBookings },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Лимит региона обновлён', data: region });
  } catch (error) {
    console.error('Update region limit error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обновления лимита региона' });
  }
});

module.exports = router;
