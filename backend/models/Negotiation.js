const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  askingPrice: { type: Number, required: true },
  initialOffer: { type: Number, required: true },
  currentOffer: { type: Number, required: true },
  status: {
    type: String,
    enum: ['open', 'countered', 'accepted', 'rejected', 'expired'],
    default: 'open'
  },
  history: [{
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['offer', 'counter', 'accept', 'reject'] },
    amount: Number,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

negotiationSchema.index({ property: 1, buyer: 1 });
negotiationSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Negotiation', negotiationSchema);
