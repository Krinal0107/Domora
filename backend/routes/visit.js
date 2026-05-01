const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Visit = require('../models/Visit');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/',
  protect,
  [
    body('propertyId').isMongoId(),
    body('scheduledAt').isISO8601().toDate()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { propertyId, scheduledAt, notes } = req.body;
      const property = await Property.findById(propertyId);
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

      const conflict = await Visit.findOne({
        property: propertyId,
        scheduledAt: {
          $gte: new Date(scheduledAt.getTime() - 30 * 60000),
          $lte: new Date(scheduledAt.getTime() + 30 * 60000)
        },
        status: { $in: ['scheduled', 'rescheduled'] }
      });
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Slot not available. Choose another time.' });
      }

      const visit = await Visit.create({
        property: propertyId,
        visitor: req.user._id,
        owner: property.owner,
        broker: property.broker,
        scheduledAt,
        notes
      });

      const io = req.app.get('io');
      await Notification.create({
        user: property.owner,
        type: 'visit',
        title: 'Visit Scheduled',
        body: `Visit scheduled for "${property.title}" on ${scheduledAt.toLocaleString('en-IN')}`,
        link: `/dashboard/visits/${visit._id}`
      });
      io?.to(`user_${property.owner}`).emit('notification', { type: 'visit' });

      res.status(201).json({ success: true, data: visit });
    } catch (err) { next(err); }
  }
);

router.get('/my', protect, async (req, res, next) => {
  try {
    const visits = await Visit.find({
      $or: [{ visitor: req.user._id }, { owner: req.user._id }]
    })
      .populate('property', 'title price images location')
      .populate('visitor', 'name avatar phone')
      .sort({ scheduledAt: -1 });
    res.json({ success: true, data: visits });
  } catch (err) { next(err); }
});

router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, feedback, rating, newDateTime } = req.body;
    const visit = await Visit.findOne({
      _id: req.params.id,
      $or: [{ visitor: req.user._id }, { owner: req.user._id }]
    });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    visit.status = status;
    if (feedback) visit.feedback = feedback;
    if (rating) visit.rating = rating;
    if (status === 'rescheduled' && newDateTime) visit.scheduledAt = newDateTime;
    await visit.save();
    res.json({ success: true, data: visit });
  } catch (err) { next(err); }
});

module.exports = router;
