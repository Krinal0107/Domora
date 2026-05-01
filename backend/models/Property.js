const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 5000 },
  type: {
    type: String,
    enum: ['apartment', 'villa', 'plot', 'commercial', 'office', 'shop'],
    required: true
  },
  listingType: { type: String, enum: ['buy', 'rent', 'lease'], required: true },
  status: {
    type: String,
    enum: ['active', 'sold', 'rented', 'pending', 'draft'],
    default: 'active'
  },
  price: { type: Number, required: true, min: 0 },
  priceUnit: { type: String, enum: ['total', 'per_sqft', 'per_month'], default: 'total' },
  area: { type: Number, required: true, min: 0 },
  areaUnit: { type: String, enum: ['sqft', 'sqm', 'sqyd'], default: 'sqft' },
  bedrooms: Number,
  bathrooms: Number,
  parking: Number,
  floor: Number,
  totalFloors: Number,
  furnishing: {
    type: String,
    enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
    default: 'unfurnished'
  },
  facing: String,
  age: { type: Number, default: 0 },
  location: {
    address: { type: String, required: true },
    area: {
      type: String,
      enum: [
        'Vesu', 'Adajan', 'Piplod', 'Althan', 'Pal', 'Sarthana',
        'Katargam', 'Varachha', 'Udhna', 'Rander', 'Jahangirpura',
        'Dumas', 'Bhatar', 'Athwalines', 'City Light', 'Puna',
        'Limbayat', 'Sachin', 'Hazira'
      ],
      required: true
    },
    city: { type: String, default: 'Surat' },
    state: { type: String, default: 'Gujarat' },
    pincode: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  images: [{ type: String }],
  videos: [{ type: String }],
  amenities: [String],
  features: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  broker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes: String,
  solanaTokenId: String,
  documentHash: String,
  fraudScore: { type: Number, default: 0, min: 0, max: 100 },
  fraudFlags: [String],
  viewCount: { type: Number, default: 0 },
  leadCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  featuredUntil: Date,
  reelVideoUrl: String,
  reelThumbnail: String,
  nearbyPlaces: [{
    name: String,
    type: String,
    distance: Number
  }],
  priceHistory: [{
    price: Number,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ 'location.area': 1, status: 1, listingType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ isVerified: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ title: 'text', description: 'text', 'location.address': 'text' });

propertySchema.virtual('pricePerSqft').get(function () {
  if (this.priceUnit === 'per_sqft') return this.price;
  return this.area > 0 ? Math.round(this.price / this.area) : 0;
});

module.exports = mongoose.model('Property', propertySchema);
