const express = require('express');
const mongoose = require('mongoose');
const { protect } = require('../middleware/admin-auth');

const router = express.Router();
const Booking = () => mongoose.model('Booking');
const Checkout = mongoose.model('Checkout');

router.get('/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Все бронирования для подсчёта количества
    const bookings = await Booking().find(filter);
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status === 'active').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length;

    // 🔥 REVENUE ТОЛЬКО ИЗ ЗАКРЫТЫХ ЗАКАЗОВ (Checkout)
    const checkouts = await Checkout.find().populate('bookingId');
    const totalRevenue = checkouts.reduce((sum, co) => sum + (co.grandTotal || co.roomTotal || 0), 0);
    const completedBookings = checkouts.length;

    // Доходы по услугам
    const serviceIncome = {
      restaurant: 0, bar: 0, spa: 0, transfer: 0, laundry: 0, excursion: 0, other: 0
    };
    checkouts.forEach(co => {
      (co.services || []).forEach(s => {
        const key = s.category || 'other';
        serviceIncome[key] = (serviceIncome[key] || 0) + (s.price * (s.quantity || 1));
      });
    });

    // По категориям номеров
    const byCategory = {
      vip: bookings.filter(b => b.roomCategory === 'vip').length,
      classic: bookings.filter(b => b.roomCategory === 'classic').length,
      cheap: bookings.filter(b => b.roomCategory === 'cheap').length
    };
    
    // По городам
    const byCity = {};
    bookings.forEach(b => { byCity[b.city] = (byCity[b.city] || 0) + 1; });
    
    // По месяцам
    const byMonth = {};
    checkouts.forEach(co => {
      const month = new Date(co.closedAt || co.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      byMonth[month] = (byMonth[month] || 0) + (co.grandTotal || 0);
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalBookings,
        activeBookings,
        cancelledBookings,
        completedBookings,
        byCategory,
        byCity,
        byMonth,
        serviceIncome
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/export', protect, async (req, res) => {
  try {
    const bookings = await Booking().find().populate('user', 'firstName lastName email');

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      // Escape double quotes
      return '"' + s.replace(/"/g, '""') + '"';
    };

    const formatDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '';
      return dt.toISOString().slice(0, 10); // YYYY-MM-DD
    };

    const header = ['ID','Клиент','Email','Номер','Категория','Город','Заезд','Выезд','Ночей','Сумма','Статус','Дата'];
    const rows = bookings.map(b => {
      const clientName = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim();
      return [
        b._id,
        clientName,
        b.user?.email || '',
        b.roomName || '',
        b.roomCategory || '',
        b.city || '',
        formatDate(b.checkIn),
        formatDate(b.checkOut),
        b.nights || 0,
        b.totalPrice || 0,
        b.status || '',
        formatDate(b.createdAt)
      ].map(escapeCsv).join(',');
    });

    const csv = [header.map(escapeCsv).join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings-export.csv');
    // Add BOM to help Excel detect UTF-8 and keep dates formatted as strings/ISO
    res.send('\uFEFF' + csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;