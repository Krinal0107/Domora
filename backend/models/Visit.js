const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  broker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  notes: String,
  feedback: String,
  rating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

visitSchema.index({ property: 1 });
visitSchema.index({ visitor: 1, status: 1 });
visitSchema.index({ owner: 1, scheduledAt: 1 });

module.exports = mongoose.model('Visit', visitSchema);
