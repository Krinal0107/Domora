const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false, minlength: 8 },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['user', 'broker', 'admin'], default: 'user' },
  avatar: String,
  googleId: String,
  walletAddress: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  alerts: [{
    area: String,
    type: String,
    minPrice: Number,
    maxPrice: Number,
    bedrooms: Number,
    isActive: { type: Boolean, default: true }
  }],
  brokerDetails: {
    licenseNumber: String,
    agency: String,
    experience: Number,
    bio: String,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  notifications: { type: Boolean, default: true },
  lastLogin: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
