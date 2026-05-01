const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Lead = require('../models/Lead');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/',
  optionalAuth,
  [
    body('propertyId').notEmpty().isMongoId(),
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty(),
    body('message').optional().isLength({ max: 1000 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { propertyId, name, email, phone, message, source } = req.body;
      const property = await Property.findById(propertyId).populate('owner');
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

      const buyerId = req.user?._id || null;
      const lead = await Lead.findOneAndUpdate(
        { property: propertyId, email },
        { name, phone, message, source: source || 'direct', status: 'new', seller: property.owner._id, buyer: buyerId },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Property.findByIdAndUpdate(propertyId, { $inc: { leadCount: 1 } });

      const io = req.app.get('io');
      await Notification.create({
        user: property.owner._id,
        type: 'lead',
        title: 'New Lead',
        body: `${name} is interested in "${property.title}"`,
        link: `/dashboard/leads/${lead._id}`
      });
      io?.to(`user_${property.owner._id}`).emit('notification', { type: 'lead', message: `New lead for ${property.title}` });

      res.status(201).json({ success: true, data: lead });
    } catch (err) { next(err); }
  }
);

router.get('/my-leads', protect, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { seller: req.user._id };
    if (status) filter.status = status;
    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('property', 'title price location images')
        .populate('buyer', 'name avatar email phone')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Lead.countDocuments(filter)
    ]);
    res.json({ success: true, data: leads, total });
  } catch (err) { next(err); }
});

router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, notes, followUpDate } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { status, notes, followUpDate },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) { next(err); }
});

module.exports = router;
