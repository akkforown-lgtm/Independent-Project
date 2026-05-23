const bcrypt = require('bcryptjs');

module.exports = function(mongoose) {
  const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    language: { type: String, enum: ['ru', 'en'], default: 'ru' },
    savedCards: [{
      masked: String,
      brand: String,
      last4: String,
      expiry: String,
      addedAt: { type: Date, default: Date.now }
    }]
  }, { timestamps: true }, { collection: 'users' }); // Явно указываем коллекцию users

  userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  userSchema.methods.comparePassword = async function(pwd) {
    return await bcrypt.compare(pwd, this.password);
  };

  userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
  };

  return userSchema;
};