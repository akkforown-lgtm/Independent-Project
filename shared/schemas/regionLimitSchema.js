module.exports = function(mongoose) {
  const regionLimitSchema = new mongoose.Schema({
    city: { type: String, required: true, unique: true, trim: true },
    maxBookings: { type: Number, required: true, default: 3, min: 1 }
  }, { timestamps: true });

  return regionLimitSchema;
};