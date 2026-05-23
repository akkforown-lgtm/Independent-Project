const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/admin-auth');

const router = express.Router();
const Booking = () => mongoose.model('Booking');
const Checkout = mongoose.model('Checkout');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/history/all', protect, async (req, res) => {
  try {
    const successfulCheckouts = await Booking()
      .find({ status: 'completed' })
      .populate('user', 'firstName lastName email')
      .sort({ 'checkout.closedAt': -1 });

    const cancelledBookings = await Booking()
      .find({ status: 'cancelled' })
      .populate('user', 'firstName lastName email')
      .sort({ cancelledAt: -1 });

    res.json({
      success: true,
      data: {
        successful: successfulCheckouts,
        unsuccessful: cancelledBookings
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get checkout history' });
  }
});

/**
 * GET /api/admin/checkout/:bookingId
 * Get checkout data for a booking
 */
router.get('/:bookingId', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const checkout = await Checkout.findOne({ bookingId: req.params.bookingId });
    const booking = await Booking().findById(req.params.bookingId).populate('user', 'firstName lastName email phone');
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    }
    
    res.json({
      success: true,
      data: {
        booking,
        checkout: checkout || { 
          services: [], 
          servicesTotal: 0, 
          roomTotal: booking.roomPrice * booking.nights, 
          grandTotal: booking.roomPrice * booking.nights 
        }
      }
    });
  } catch (error) {
    console.error('Get checkout error:', error);
    res.status(500).json({ success: false, error: 'Ошибка получения данных чекаута' });
  }
});

/**
 * POST /api/admin/checkout/:bookingId
 * Create/Update checkout and close booking
 */
router.post('/:bookingId', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.bookingId)) {
      return res.status(400).json({ success: false, error: 'Неверный формат ID' });
    }

    const { services, discount, paymentMethod, notes } = req.body;
    const booking = await Booking().findById(req.params.bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Бронирование не найдено' });
    }

    // Validate input
    if (!Array.isArray(services)) {
      return res.status(400).json({ success: false, error: 'Services должны быть массивом' });
    }

    // Calculate totals
    const servicesTotal = services.reduce((sum, s) => {
      if (s.price && s.quantity) {
        return sum + (s.price * s.quantity);
      }
      return sum;
    }, 0);

    const roomTotal = booking.roomPrice * booking.nights;
    const discountAmount = discount || 0;
    const grandTotal = roomTotal + servicesTotal - discountAmount;

    // Find or create checkout
    let checkout = await Checkout.findOne({ bookingId: req.params.bookingId });
    
    const adminName = `${req.user.firstName} ${req.user.lastName}`.trim() || 'Admin';

    if (checkout) {
      checkout.services = services;
      checkout.servicesTotal = servicesTotal;
      checkout.roomTotal = roomTotal;
      checkout.discount = discountAmount;
      checkout.grandTotal = grandTotal;
      checkout.paymentMethod = paymentMethod || 'card';
      checkout.notes = notes || '';
      checkout.closedBy = req.user._id;
      checkout.closedAt = new Date();
      checkout.status = 'completed';
    } else {
      checkout = new Checkout({
        bookingId: req.params.bookingId,
        services: services || [],
        servicesTotal,
        roomTotal,
        discount: discountAmount,
        grandTotal,
        paymentMethod: paymentMethod || 'card',
        notes: notes || '',
        closedBy: req.user._id,
        closedAt: new Date(),
        status: 'completed'
      });
    }

    await checkout.save();

    // Update booking status to completed
    booking.status = 'completed';
    booking.checkout = {
      id: checkout._id,
      closedBy: adminName,
      closedAt: new Date(),
      roomTotal: roomTotal,
      servicesTotal: servicesTotal,
      discount: discountAmount,
      grandTotal: grandTotal,
      paymentMethod: paymentMethod || 'card',
      services: services || []
    };

    // Add notification to booking
    booking.notifications.push({
      message: `🧾 Заказ закрыт администратором ${adminName}. Итоговая сумма: $${grandTotal.toFixed(2)}`,
      type: 'success',
      createdAt: new Date()
    });

    await booking.save();

    res.json({ 
      success: true, 
      message: 'Заказ успешно закрыт',
      data: { checkout, booking }
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ success: false, error: 'Ошибка закрытия заказа' });
  }
});

module.exports = router;
