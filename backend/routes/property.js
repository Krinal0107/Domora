const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const Property = require('../models/Property');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const { uploadImages, uploadVideos, uploadToS3 } = require('../middleware/upload');
const fraudDetection = require('../services/fraudDetection');
const { AREA_INSIGHTS } = require('../utils/areaData');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      listingType, type, area, minPrice, maxPrice,
      minArea, maxArea, bedrooms, furnishing, isVerified,
      sortBy, page = 1, limit = 20, search, lat, lng, radius
    } = req.query;

    const filter = { status: 'active' };
    if (listingType) filter.listingType = listingType;
    if (type) filter.type = { $in: type.split(',') };
    if (area) filter['location.area'] = { $in: area.split(',') };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = Number(minArea);
      if (maxArea) filter.area.$lte = Number(maxArea);
    }
    if (bedrooms) filter.bedrooms = { $in: bedrooms.split(',').map(Number) };
    if (furnishing) filter.furnishing = { $in: furnishing.split(',') };
    if (isVerified === 'true') filter.isVerified = true;

    if (lat && lng && radius) {
      filter['location.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius) * 1000
        }
      };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      popular: { viewCount: -1 },
      area_asc: { area: 1 }
    };
    const sort = sortOptions[sortBy] || { isFeatured: -1, createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      Property.find(filter)
        .populate('owner', 'name avatar phone isVerified role')
        .populate('broker', 'name avatar phone brokerDetails')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Property.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) { next(err); }
});

router.get('/featured', async (req, res, next) => {
  try {
    const properties = await Property.find({
      isFeatured: true,
      status: 'active',
      featuredUntil: { $gt: new Date() }
    })
      .populate('owner', 'name avatar phone')
      .limit(10)
      .lean();
    res.json({ success: true, data: properties });
  } catch (err) { next(err); }
});

router.get('/area-insights', async (req, res) => {
  res.json({ success: true, data: AREA_INSIGHTS });
});

router.get('/my-listings', protect, async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: properties });
  } catch (err) { next(err); }
});

router.get('/reels', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, area } = req.query;
    const filter = { status: 'active', $or: [{ reelVideoUrl: { $exists: true, $ne: '' } }, { images: { $exists: true, $not: { $size: 0 } } }] };
    if (area) filter['location.area'] = area;
    const properties = await Property.find(filter)
      .populate('owner', 'name avatar')
      .sort({ viewCount: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    res.json({ success: true, data: properties });
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name avatar phone email isVerified role brokerDetails')
      .populate('broker', 'name avatar phone brokerDetails')
      .lean();
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
    await Property.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
});

router.post('/',
  protect,
  authorize('user', 'broker', 'admin'),
  [
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').trim().notEmpty().isLength({ max: 5000 }),
    body('type').isIn(['apartment', 'villa', 'plot', 'commercial', 'office', 'shop']),
    body('listingType').isIn(['buy', 'rent', 'lease']),
    body('price').isNumeric().isFloat({ min: 0 }),
    body('area').isNumeric().isFloat({ min: 0 }),
    body('location.address').notEmpty(),
    body('location.area').notEmpty(),
    body('location.coordinates.lat').isNumeric(),
    body('location.coordinates.lng').isNumeric()
  ],
  validate,
  async (req, res, next) => {
    try {
      const data = { ...req.body, owner: req.user._id };
      if (req.user.role === 'broker') data.broker = req.user._id;

      const fraudResult = await fraudDetection.analyze(data);
      data.fraudScore = fraudResult.score;
      data.fraudFlags = fraudResult.flags;

      const property = await Property.create(data);
      await property.populate('owner', 'name avatar phone');
      res.status(201).json({ success: true, data: property });
    } catch (err) { next(err); }
  }
);

router.put('/:id',
  protect,
  async (req, res, next) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
      if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (req.body.price && req.body.price !== property.price) {
        property.priceHistory.push({ price: property.price });
      }
      Object.assign(property, req.body);
      if (req.user.role !== 'admin') {
        property.isVerified = false;
      }
      await property.save();
      res.json({ success: true, data: property });
    } catch (err) { next(err); }
  }
);

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Not found' });
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await property.deleteOne();
    res.json({ success: true, message: 'Property deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/images',
  protect,
  uploadImages.array('images', 20),
  async (req, res, next) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) return res.status(404).json({ success: false, message: 'Not found' });
      if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      const urls = await Promise.all(req.files.map(f => uploadToS3(f, 'properties')));
      property.images.push(...urls);
      await property.save();
      res.json({ success: true, images: property.images });
    } catch (err) { next(err); }
  }
);

router.post('/:id/video',
  protect,
  uploadVideos.single('video'),
  async (req, res, next) => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) return res.status(404).json({ success: false, message: 'Not found' });
      if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      const url = await uploadToS3(req.file, 'reels');
      property.reelVideoUrl = url;
      await property.save();
      res.json({ success: true, videoUrl: url });
    } catch (err) { next(err); }
  }
);

module.exports = router;
