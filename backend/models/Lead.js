const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  broker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, maxlength: 1000 },
  status: {
    type: String,
    enum: ['new', 'contacted', 'visited', 'converted', 'lost'],
    default: 'new'
  },
  source: { type: String, enum: ['direct', 'chatbot', 'reels', 'map'], default: 'direct' },
  notes: String,
  followUpDate: Date
}, { timestamps: true });

leadSchema.index({ property: 1, buyer: 1 }, { unique: true });
leadSchema.index({ seller: 1, status: 1 });
leadSchema.index({ broker: 1, status: 1 });

module.exports = mongoose.model('Lead', leadSchema);
