const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/admin-auth');

const router = express.Router();
const Booking = () => mongoose.model('Booking');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/admin/bookings
 * Get all bookings with populated user data
 */
router.get('/', protect, async (req, res) => {
  try {
    const bookings = await Booking()
      .find()
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения бронирований' });
  }
});

router.get('/stats/summary', protect, async (req, res) => {
  try {
    const bookings = await Booking().find();

    res.json({
      success: true,
      data: {
        total: bookings.length,
        active: bookings.filter(b => b.status === 'active').length,
        pending: bookings.filter(b => ['pending_change', 'pending_cancellation'].includes(b.status)).length,
        cancelled: bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length,
        completed: bookings.filter(b => b.status === 'completed').length
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get booking statistics' });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Get single booking
 */
router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }
    const booking = await Booking().findById(req.params.id).populate('user', 'firstName lastName email phone');
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения бронирования' });
  }
});

/**
 * PUT /api/admin/bookings/:id/approve
 * Approve modification/cancellation request
 */
router.put('/:id/approve', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const booking = await Booking().findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });

    // Determine request type
    const isModification = booking.status === 'pending_change';
    const isCancellation = booking.status === 'pending_cancellation';

    if (!isModification && !isCancellation) {
      return res.status(400).json({ success: false, error: 'Нет активного запроса' });
    }

    const adminName = `${req.user.firstName} ${req.user.lastName}`.trim() || 'Admin';

    if (isModification) {
      // Apply the modification changes
      booking.roomName = booking.changeRequest.newRoomName || booking.roomName;
      booking.roomPrice = booking.changeRequest.newRoomPrice || booking.roomPrice;
      booking.roomCategory = booking.changeRequest.newRoomCategory || booking.roomCategory;
      booking.city = booking.changeRequest.newCity || booking.city;
      booking.checkIn = booking.changeRequest.newCheckIn || booking.checkIn;
      booking.checkOut = booking.changeRequest.newCheckOut || booking.checkOut;
      booking.nights = booking.changeRequest.newNights || booking.nights;
      booking.totalPrice = booking.changeRequest.newTotalPrice || booking.totalPrice;
      
      booking.status = 'active';
      booking.changeRequest = null;
      booking.approvalStatus = 'approved';
      booking.approvedBy = adminName;
      booking.approvedAt = new Date();
      
      booking.notifications.push({
        message: `✅ Запрос на изменение одобрен администратором ${adminName}`,
        type: 'success',
        createdAt: new Date()
      });
    } else if (isCancellation) {
      // Approve cancellation
      booking.status = 'cancelled';
      booking.changeRequest = null;
      booking.approvalStatus = 'approved';
      booking.approvedBy = adminName;
      booking.approvedAt = new Date();
      booking.cancelledByName = adminName;
      booking.cancelledAt = new Date();
      
      booking.notifications.push({
        message: `✅ Запрос на отмену одобрен администратором ${adminName}. Возврат средств произведён.`,
        type: 'success',
        createdAt: new Date()
      });
    }

    await booking.save();
    res.json({ success: true, message: 'Запрос одобрен', data: booking });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ success: false, error: 'Ошибка одобрения запроса' });
  }
});

/**
 * PUT /api/admin/bookings/:id/reject
 * Reject modification/cancellation request
 */
router.put('/:id/reject', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const booking = await Booking().findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });

    // Check if there's a pending request
    if (!['pending_change', 'pending_cancellation'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'Нет активного запроса' });
    }

    const adminName = `${req.user.firstName} ${req.user.lastName}`.trim() || 'Admin';
    const reason = req.body.reason || 'Не указана';

    booking.status = 'active';
    booking.changeRequest = null;
    booking.approvalStatus = 'rejected';
    booking.approvedBy = adminName;
    booking.approvedAt = new Date();
    booking.approvalNotes = reason;
    
    booking.notifications.push({
      message: `❌ Запрос отклонён администратором ${adminName}. Причина: ${reason}`,
      type: 'error',
      createdAt: new Date()
    });

    await booking.save();
    res.json({ success: true, message: 'Запрос отклонён', data: booking });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ success: false, error: 'Ошибка отклонения запроса' });
  }
});

/**
 * PUT /api/admin/bookings/:id/cancel-by-admin
 * Cancel booking by admin with reason
 */
router.put('/:id/cancel-by-admin', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const booking = await Booking().findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, error: 'Бронирование не найдено' });

    const adminName = `${req.user.firstName} ${req.user.lastName}`.trim() || 'Admin';
    const reason = req.body.reason || 'Не указана';

    booking.status = 'cancelled';
    booking.cancelReason = reason;
    booking.cancelledByName = adminName;
    booking.cancelledAt = new Date();
    
    booking.notifications.push({
      message: `❌ Заказ отменён администратором ${adminName}. Причина: ${reason}`,
      type: 'error',
      createdAt: new Date()
    });

    await booking.save();
    res.json({ success: true, message: 'Заказ отменён', data: booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, error: 'Ошибка отмены заказа' });
  }
});

module.exports = router;
