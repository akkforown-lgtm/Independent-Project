module.exports = function(mongoose) {
  const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomName: { type: String, required: true },
    roomPrice: { type: Number, required: true },
    roomCategory: { type: String, enum: ['vip', 'classic', 'cheap'], default: 'classic' },
    city: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['hold', 'active', 'pending_change', 'pending_cancellation', 'changed', 'cancelled', 'rejected', 'completed'], default: 'active' },
    expiresAt: { type: Date, default: null },
    changeRequest: { type: mongoose.Schema.Types.Mixed, default: null },
    
    // Approval/Rejection tracking
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    approvalNotes: { type: String, default: '' },
    
    // Checkout information
    checkout: {
      id: mongoose.Schema.Types.ObjectId,
      closedBy: String,
      closedAt: Date,
      roomTotal: Number,
      servicesTotal: Number,
      discount: Number,
      grandTotal: Number,
      paymentMethod: String,
      services: [{ name: String, category: String, price: Number, quantity: Number }]
    },
    
    // Additional services user can add
    additionalServices: [{
      name: String,
      category: { type: String, enum: ['restaurant', 'bar', 'spa', 'transfer', 'laundry', 'excursion', 'other'] },
      price: Number,
      quantity: { type: Number, default: 1 },
      addedAt: { type: Date, default: Date.now }
    }],
    
    // Notifications
    notifications: [{ 
      message: String, 
      type: { type: String, enum: ['info', 'success', 'warning', 'error'] }, 
      read: { type: Boolean, default: false }, 
      createdAt: { type: Date, default: Date.now } 
    }],
    
    canModifyUntil: { type: Date, default: () => new Date(Date.now() + 12 * 60 * 60 * 1000) },
    
    // Cancellation tracking
    cancelReason: { type: String, default: '' },
    cancelledByName: { type: String, default: '' },
    cancelledAt: { type: Date, default: null }
  }, { timestamps: true });

  bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  bookingSchema.pre('save', function(next) {
    if (this.checkOut <= this.checkIn) return next(new Error('Дата выезда должна быть позже даты заезда'));
    next();
  });

  return bookingSchema;
};