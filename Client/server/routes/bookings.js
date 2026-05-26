const express = require('express');
const mongoose = require('mongoose');
const Booking = mongoose.model('Booking');
const RegionLimit = mongoose.model('RegionLimit');
const { protect } = require('../middleware/auth');
const { validateBookingData, normalizeCity } = require('../../../shared/validation');

const router = express.Router();

function sanitizeDate(value) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function datesOverlap(checkInA, checkOutA, checkInB, checkOutB) {
  return new Date(checkInA) < new Date(checkOutB) && new Date(checkOutA) > new Date(checkInB);
}

async function getRegionLimit(city) {
  const normalizedCity = normalizeCity(city);
  if (!normalizedCity) return 3;
  const region = await RegionLimit.findOne({ city: normalizedCity });
  return region ? region.maxBookings : 3;
}

async function countOverlappingRegionBookings(city, checkIn, checkOut) {
  const start = sanitizeDate(checkIn);
  const end = sanitizeDate(checkOut);
  if (!start || !end || end <= start) return 0;

  const now = new Date();
  return Booking.countDocuments({
    city: normalizeCity(city),
    status: { $nin: ['cancelled', 'rejected', 'completed'] },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ],
    checkIn: { $lt: end },
    checkOut: { $gt: start }
  });
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// In-process lock/mutex per city to handle concurrency
const bookingLocks = new Map();

async function withBookingLock(city, fn) {
  const normalizedCity = normalizeCity(city).toLowerCase();
  
  if (!bookingLocks.has(normalizedCity)) {
    bookingLocks.set(normalizedCity, Promise.resolve());
  }
  
  const currentLock = bookingLocks.get(normalizedCity);
  
  let resolveLock;
  const nextLock = new Promise(resolve => {
    resolveLock = resolve;
  });
  
  bookingLocks.set(normalizedCity, nextLock);
  
  const resultPromise = currentLock.then(() => fn()).finally(() => {
    resolveLock();
  });
  
  nextLock.then(() => {
    if (bookingLocks.get(normalizedCity) === nextLock) {
      bookingLocks.delete(normalizedCity);
    }
  });
  
  return resultPromise;
}

router.post('/', protect, async (req, res) => {
  try {
    // Validate booking data
    const validation = validateBookingData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors });
    }

    const { roomName, roomPrice, roomCategory, checkIn, checkOut, nights, totalPrice } = req.body;
    const city = normalizeCity(req.body.city);

    const booking = await withBookingLock(city, async () => {
      const overlappingCount = await countOverlappingRegionBookings(city, checkIn, checkOut);
      const regionLimit = await getRegionLimit(city);

      if (overlappingCount >= regionLimit) {
        throw new Error('REGION_LIMIT');
      }

      return await Booking.create({
        user: req.user._id,
        roomName,
        roomPrice,
        roomCategory: roomCategory || 'classic',
        city,
        checkIn,
        checkOut,
        nights,
        totalPrice,
        notifications: [{ message: 'Бронирование создано', type: 'success', createdAt: new Date() }]
      });
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    if (error.message === 'REGION_LIMIT') {
      const { city } = req.body;
      const regionLimit = await getRegionLimit(city);
      return res.status(400).json({
        success: false,
        error: `Регион ${city} уже содержит ${regionLimit} активных бронирований на выбранные даты`,
        code: 'REGION_LIMIT'
      });
    }
    console.error('Create booking error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: { server: 'Ошибка создания бронирования' } });
  }
});

router.post('/hold', protect, async (req, res) => {
  try {
    const validation = validateBookingData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors });
    }

    const { roomName, roomPrice, roomCategory, checkIn, checkOut, nights, totalPrice } = req.body;
    const city = normalizeCity(req.body.city);

    const booking = await withBookingLock(city, async () => {
      const overlappingCount = await countOverlappingRegionBookings(city, checkIn, checkOut);
      const regionLimit = await getRegionLimit(city);

      if (overlappingCount >= regionLimit) {
        throw new Error('REGION_LIMIT');
      }

      return await Booking.create({
        user: req.user._id,
        roomName,
        roomPrice,
        roomCategory: roomCategory || 'classic',
        city,
        checkIn,
        checkOut,
        nights,
        totalPrice,
        status: 'hold',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes hold
        notifications: [{ message: 'Бронирование заблокировано (ожидание оплаты)', type: 'info', createdAt: new Date() }]
      });
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    if (error.message === 'REGION_LIMIT') {
      const { city } = req.body;
      const regionLimit = await getRegionLimit(city);
      return res.status(400).json({
        success: false,
        error: `Регион ${city} уже содержит ${regionLimit} активных бронирований на выбранные даты`,
        code: 'REGION_LIMIT'
      });
    }
    console.error('Hold booking error:', error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});
      return res.status(400).json({ success: false, error: messages });
    }
    res.status(500).json({ success: false, error: { server: 'Ошибка создания удержания брони' } });
  }
});

router.post('/hold/:id/confirm', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'hold',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Время бронирования истекло или бронь не найдена', code: 'HOLD_EXPIRED' });
    }
    
    booking.status = 'active';
    booking.expiresAt = undefined;
    booking.notifications.push({ message: 'Бронирование создано', type: 'success', createdAt: new Date() });
    await booking.save();
    
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Confirm hold error:', error);
    res.status(500).json({ success: false, error: 'Ошибка подтверждения бронирования' });
  }
});

router.delete('/hold/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    }
    if (booking.status !== 'hold') {
      return res.status(400).json({ success: false, error: 'Можно отменить только удержание брони' });
    }

    await Booking.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete hold error:', error);
    res.status(500).json({ success: false, error: 'Ошибка отмены удержания брони' });
  }
});

router.get('/region-status', async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    const city = normalizeCity(req.query.city);
    const start = sanitizeDate(checkIn);
    const end = sanitizeDate(checkOut);

    if (!city || !start || !end || end <= start) {
      return res.status(400).json({ success: false, error: 'Неверные параметры региона или дат' });
    }

    const overlappingCount = await countOverlappingRegionBookings(city, start, end);
    const regionLimit = await getRegionLimit(city);

    res.json({
      success: true,
      data: {
        city,
        checkIn: start,
        checkOut: end,
        overlappingCount,
        regionLimit
      }
    });
  } catch (error) {
    console.error('Region status error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения статуса региона' });
  }
});

router.get('/room-status', async (req, res) => {
  try {
    const { roomName } = req.query;
    const city = normalizeCity(req.query.city);
    if (!roomName) {
      return res.status(400).json({ success: false, error: 'Требуется roomName' });
    }

    const now = new Date();
    const query = {
      roomName: String(roomName).trim(),
      status: { $nin: ['cancelled', 'rejected', 'completed'] },
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    };

    if (city) {
      query.city = city;
    }

    const bookings = await Booking.find(query).sort({ checkIn: 1 });
    const bookingRanges = bookings.map(b => ({ checkIn: b.checkIn, checkOut: b.checkOut, city: b.city }));

    res.json({
      success: true,
      data: {
        roomName: String(roomName).trim(),
        bookings: bookingRanges
      }
    });
  } catch (error) {
    console.error('Room status error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения статуса комнаты' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения бронирований' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка получения бронирования' });
  }
});

router.put('/:id/change-request', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });

    if (new Date() > new Date(booking.canModifyUntil)) {
      return res.status(400).json({ success: false, error: 'WINDOW_EXPIRED', message: 'Время для изменения истекло.' });
    }

    const { newRoomName, newRoomPrice, newRoomCategory, newCheckIn, newCheckOut, newNights, newTotalPrice } = req.body;
    const newCity = req.body.newCity ? normalizeCity(req.body.newCity) : null;

    if (req.body.newCity && !newCity) {
      return res.status(400).json({ success: false, error: { city: 'Выберите корректный город' } });
    }

    booking.changeRequest = {
      newRoomName: newRoomName || booking.roomName,
      newRoomPrice: newRoomPrice || booking.roomPrice,
      newRoomCategory: newRoomCategory || booking.roomCategory,
      newCity: newCity || booking.city,
      newCheckIn: newCheckIn || booking.checkIn,
      newCheckOut: newCheckOut || booking.checkOut,
      newNights: newNights || booking.nights,
      newTotalPrice: newTotalPrice || booking.totalPrice,
      newAdditionalServices: req.body.newAdditionalServices || booking.additionalServices,
      requestType: 'modification',
      requestedAt: new Date(),
      status: 'pending'
    };
    booking.status = 'pending_change';
    booking.notifications.push({ message: 'Запрос на изменение отправлен', type: 'info', createdAt: new Date() });
    await booking.save();

    res.json({ success: true, message: 'Запрос отправлен', data: booking });
  } catch (error) {
    console.error('Change request error:', error);
    res.status(500).json({ success: false, error: 'Ошибка запроса изменения' });
  }
});

router.put('/:id/cancel-request', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });

    if (new Date() > new Date(booking.canModifyUntil)) {
      return res.status(400).json({ success: false, error: 'WINDOW_EXPIRED', message: 'Время для отмены истекло.' });
    }

    booking.changeRequest = {
      newRoomName: booking.roomName, newRoomPrice: booking.roomPrice, newRoomCategory: booking.roomCategory,
      newCity: booking.city, newCheckIn: booking.checkIn, newCheckOut: booking.checkOut,
      newNights: booking.nights, newTotalPrice: booking.totalPrice,
      requestType: 'cancellation', requestedAt: new Date(), status: 'pending'
    };
    booking.status = 'pending_cancellation';
    booking.notifications.push({ message: 'Запрос на отмену отправлен', type: 'warning', createdAt: new Date() });
    await booking.save();

    res.json({ success: true, message: 'Запрос на отмену отправлен', data: booking });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ success: false, error: 'Ошибка запроса отмены' });
  }
});

router.get('/:id/notifications', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    res.json(booking.notifications || []);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка' });
  }
});

module.exports = router;
