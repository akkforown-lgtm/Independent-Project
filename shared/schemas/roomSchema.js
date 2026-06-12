module.exports = function(mongoose) {
  const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, enum: ['vip', 'classic', 'cheap'], required: true },
    price: { type: Number, required: true, min: 0 },
    size: { type: Number, required: true, description: 'Size in square meters' },
    description: { type: String, default: '' },
    maxGuests: { type: Number, default: 2 },
    amenities: [String],
    imageUrl: { type: String, default: null },
    image: { type: String, default: null },
    isAvailable: { type: Boolean, default: true },
    quantity: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  }, { timestamps: true });

  return roomSchema;
};
