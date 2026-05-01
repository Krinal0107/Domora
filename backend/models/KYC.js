const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  docType: {
    type: String,
    enum: ['aadhaar', 'pan', 'passport', 'voter_id', 'property_deed', 'sale_agreement'],
    required: true
  },
  fileUrl: { type: String, required: true },
  fileName: String,
  fileSize: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  extractedData: mongoose.Schema.Types.Mixed
}, { timestamps: true });

kycSchema.index({ user: 1, status: 1 });
kycSchema.index({ property: 1, docType: 1 });

module.exports = mongoose.model('KYC', kycSchema);
