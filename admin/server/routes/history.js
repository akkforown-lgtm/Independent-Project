const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/admin-auth');

const router = express.Router();
const Booking = () => mongoose.model('Booking');
const Checkout = mongoose.model('Checkout');

// GET /api/admin/history — история заказов
router.get('/', protect, async (req, res) => {
  try {
    // ✅ Успешные — есть запись в Checkout
    const checkouts = await Checkout.find()
      .populate({ 
        path: 'bookingId', 
        populate: { path: 'user', select: 'firstName lastName email' } 
      })
      .populate('closedBy', 'firstName lastName')
      .sort({ closedAt: -1 });

    const successful = checkouts.map(co => ({
      booking: co.bookingId,
      checkout: {
        services: co.services || [],
        servicesTotal: co.servicesTotal || 0,
        roomTotal: co.roomTotal || 0,
        discount: co.discount || 0,
        grandTotal: co.grandTotal || 0,
        paymentMethod: co.paymentMethod || 'card',
        notes: co.notes || '',
        closedAt: co.closedAt || co.createdAt,
        closedByName: co.closedBy?.firstName || 'Admin'
      }
    }));

    // ❌ Неуспешные — статус cancelled или rejected
    const cancelled = await Booking().find({ status: { $in: ['cancelled', 'rejected'] } })
      .populate('user', 'firstName lastName email')
      .sort({ updatedAt: -1 });

    const unsuccessful = cancelled.map(b => ({
      _id: b._id,
      roomName: b.roomName,
      roomPrice: b.roomPrice,
      roomCategory: b.roomCategory,
      city: b.city,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.nights,
      totalPrice: b.totalPrice,
      status: b.status,
      cancelReason: b.cancelReason || '',
      cancelledByName: b.cancelledByName || 'Admin',
      updatedAt: b.updatedAt,
      user: b.user
    }));

    res.json({
      success: true,
      data: { 
        successful, 
        unsuccessful 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;