const express = require('express');
const mongoose = require('mongoose');
const Room = mongoose.model('Room');
const { protect } = require('../middleware/admin-auth');

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/admin/rooms
 * Get all rooms
 */
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ category: 1, price: 1 });
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения номеров' });
  }
});

/**
 * GET /api/admin/rooms/:id
 * Get single room
 */
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Номер не найден' });
    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения номера' });
  }
});

/**
 * POST /api/admin/rooms
 * Create new room (admin only)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { name, category, price, size, description, maxGuests, amenities } = req.body;
    const imageUrl = req.body.imageUrl || req.body.image || null;

    // Validation
    if (!name || !category || !price || !size) {
      return res.status(400).json({ 
        success: false, 
        error: 'Пожалуйста, заполните обязательные поля (название, категория, цена, размер)' 
      });
    }

    if (!['vip', 'classic', 'cheap'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Неверная категория номера' });
    }

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, error: 'Цена должна быть положительным числом' });
    }

    if (isNaN(size) || size < 0) {
      return res.status(400).json({ success: false, error: 'Размер должен быть положительным числом' });
    }

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ success: false, error: 'Номер с таким названием уже существует' });
    }

    const room = await Room.create({
      name,
      category,
      price,
      size,
      description,
      maxGuests: maxGuests || 2,
      amenities: amenities || [],
      imageUrl,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Номер создан', data: room });
  } catch (error) {
    console.error('Create room error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Номер с таким названием уже существует' });
    }
    res.status(500).json({ success: false, error: 'Ошибка создания номера' });
  }
});

/**
 * PUT /api/admin/rooms/:id
 * Update room (admin only)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const { name, category, price, size, description, maxGuests, amenities, isAvailable } = req.body;
    const imageUrl = req.body.imageUrl || req.body.image;

    // Validation
    if (category && !['vip', 'classic', 'cheap'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Неверная категория номера' });
    }

    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ success: false, error: 'Цена должна быть положительным числом' });
    }

    if (size !== undefined && (isNaN(size) || size < 0)) {
      return res.status(400).json({ success: false, error: 'Размер должен быть положительным числом' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Номер не найден' });

    // Check if name already exists (if changing name)
    if (name && name !== room.name) {
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return res.status(400).json({ success: false, error: 'Номер с таким названием уже существует' });
      }
      room.name = name;
    }

    if (category) room.category = category;
    if (price !== undefined) room.price = price;
    if (size !== undefined) room.size = size;
    if (description !== undefined) room.description = description;
    if (maxGuests !== undefined) room.maxGuests = maxGuests;
    if (amenities !== undefined) room.amenities = amenities;
    if (imageUrl !== undefined) room.imageUrl = imageUrl;
    if (isAvailable !== undefined) room.isAvailable = isAvailable;
    
    room.updatedBy = req.user._id;
    await room.save();

    res.json({ success: true, message: 'Номер обновлён', data: room });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, error: 'Ошибка обновления номера' });
  }
});

/**
 * DELETE /api/admin/rooms/:id
 * Delete room (admin only)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ success: false, error: 'Номер не найден' });

    res.json({ success: true, message: 'Номер удалён', data: room });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ success: false, error: 'Ошибка удаления номера' });
  }
});

module.exports = router;
