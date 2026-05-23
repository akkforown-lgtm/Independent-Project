const bcrypt = require('bcryptjs');

module.exports = function(mongoose) {
  const adminSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, default: 'admin' }
  }, { timestamps: true }, { collection: 'admins' }); // Явно коллекция admins

  adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  adminSchema.methods.comparePassword = async function(pwd) {
    return await bcrypt.compare(pwd, this.password);
  };

  adminSchema.methods.toJSON = function() {
    const admin = this.toObject();
    delete admin.password;
    delete admin.__v;
    return admin;
  };

  return adminSchema;
};