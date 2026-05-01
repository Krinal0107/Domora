const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Negotiation = require('../models/Negotiation');
const Property = require('../models/Property');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/',
  protect,
  [
    body('propertyId').isMongoId(),
    body('offerAmount').isNumeric().isFloat({ min: 1 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { propertyId, offerAmount, message } = req.body;
      const property = await Property.findById(propertyId);
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' });
      if (property.owner.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Cannot negotiate on your own property' });
      }

      const existing = await Negotiation.findOne({
        property: propertyId,
        buyer: req.user._id,
        status: { $in: ['open', 'countered'] }
      });
      if (existing) return res.status(409).json({ success: false, message: 'Active negotiation exists', data: existing });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const negotiation = await Negotiation.create({
        property: propertyId,
        buyer: req.user._id,
        seller: property.owner,
        askingPrice: property.price,
        initialOffer: offerAmount,
        currentOffer: offerAmount,
        expiresAt,
        history: [{ actor: req.user._id, action: 'offer', amount: offerAmount, message }]
      });

      const io = req.app.get('io');
      await Notification.create({
        user: property.owner,
        type: 'offer',
        title: 'New Offer Received',
        body: `Offer of ₹${(offerAmount / 100000).toFixed(1)}L on "${property.title}"`,
        link: `/dashboard/negotiations/${negotiation._id}`
      });
      io?.to(`user_${property.owner}`).emit('notification', { type: 'offer', negotiationId: negotiation._id });

      res.status(201).json({ success: true, data: negotiation });
    } catch (err) { next(err); }
  }
);

router.get('/my', protect, async (req, res, next) => {
  try {
    const negotiations = await Negotiation.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }]
    })
      .populate('property', 'title price images location')
      .populate('buyer', 'name avatar phone')
      .populate('seller', 'name avatar phone')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: negotiations });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const n = await Negotiation.findOne({
      _id: req.params.id,
      $or: [{ buyer: req.user._id }, { seller: req.user._id }]
    })
      .populate('property', 'title price images location owner')
      .populate('buyer', 'name avatar phone')
      .populate('seller', 'name avatar phone')
      .populate('history.actor', 'name avatar');
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: n });
  } catch (err) { next(err); }
});

router.post('/:id/respond', protect,
  [
    body('action').isIn(['counter', 'accept', 'reject']),
    body('counterAmount').if(body('action').equals('counter')).isNumeric().isFloat({ min: 1 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { action, counterAmount, message } = req.body;
      const n = await Negotiation.findOne({
        _id: req.params.id,
        status: { $in: ['open', 'countered'] }
      });
      if (!n) return res.status(404).json({ success: false, message: 'Negotiation not found or closed' });

      const isBuyer = n.buyer.toString() === req.user._id.toString();
      const isSeller = n.seller.toString() === req.user._id.toString();
      if (!isBuyer && !isSeller) return res.status(403).json({ success: false, message: 'Not authorized' });

      n.history.push({ actor: req.user._id, action, amount: counterAmount || n.currentOffer, message });

      if (action === 'counter') {
        n.currentOffer = counterAmount;
        n.status = 'countered';
      } else if (action === 'accept') {
        n.status = 'accepted';
      } else {
        n.status = 'rejected';
      }

      await n.save();

      const notifyUser = isBuyer ? n.seller : n.buyer;
      const io = req.app.get('io');
      io?.to(`user_${notifyUser}`).emit('negotiation_update', { id: n._id, status: n.status, action });

      res.json({ success: true, data: n });
    } catch (err) { next(err); }
  }
);

module.exports = router;
