const express = require('express');
const mongoose = require('mongoose');
const Room = mongoose.model('Room');

const router = express.Router();

/**
 * GET /api/rooms
 * Get all available rooms (public endpoint)
 */
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true }).sort({ category: 1, price: 1 });
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения номеров' });
  }
});

/**
 * GET /api/rooms/:id
 * Get room details (public endpoint)
 */
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Номер не найден' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения номера' });
  }
});

module.exports = router;
