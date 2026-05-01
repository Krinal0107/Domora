const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const User = require('../models/User');
const Property = require('../models/Property');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadImages, uploadToS3 } = require('../middleware/upload');

router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedProperties', 'title price location images status');
  res.json({ success: true, user });
});

router.put('/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('phone').optional().trim(),
    body('brokerDetails.agency').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'phone', 'brokerDetails', 'notifications'];
      const updates = {};
      allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      res.json({ success: true, user });
    } catch (err) { next(err); }
  }
);

router.post('/avatar', protect, uploadImages.single('avatar'), async (req, res, next) => {
  try {
    const url = await uploadToS3(req.file, 'avatars');
    await User.findByIdAndUpdate(req.user._id, { avatar: url });
    res.json({ success: true, avatarUrl: url });
  } catch (err) { next(err); }
});

router.post('/save/:propertyId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const pid = req.params.propertyId;
    const idx = user.savedProperties.indexOf(pid);
    if (idx === -1) {
      user.savedProperties.push(pid);
    } else {
      user.savedProperties.splice(idx, 1);
    }
    await user.save();
    res.json({ success: true, saved: idx === -1, savedProperties: user.savedProperties });
  } catch (err) { next(err); }
});

router.get('/saved', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedProperties',
        populate: { path: 'owner', select: 'name avatar phone' }
      });
    res.json({ success: true, data: user.savedProperties });
  } catch (err) { next(err); }
});

router.post('/alerts', protect,
  [
    body('area').notEmpty(),
    body('type').isIn(['apartment', 'villa', 'plot', 'commercial', 'office', 'shop', 'any']),
    body('minPrice').optional().isNumeric(),
    body('maxPrice').optional().isNumeric()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { area, type, minPrice, maxPrice, bedrooms } = req.body;
      await User.findByIdAndUpdate(req.user._id, {
        $push: { alerts: { area, type, minPrice, maxPrice, bedrooms } }
      });
      res.json({ success: true, message: 'Alert created' });
    } catch (err) { next(err); }
  }
);

router.delete('/alerts/:alertId', protect, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { alerts: { _id: req.params.alertId } }
    });
    res.json({ success: true, message: 'Alert removed' });
  } catch (err) { next(err); }
});

router.post('/wallet', protect,
  [body('walletAddress').notEmpty().isLength({ min: 32, max: 44 })],
  validate,
  async (req, res, next) => {
    try {
      const { walletAddress } = req.body;
      const existing = await User.findOne({ walletAddress });
      if (existing && existing._id.toString() !== req.user._id.toString()) {
        return res.status(409).json({ success: false, message: 'Wallet already linked to another account' });
      }
      await User.findByIdAndUpdate(req.user._id, { walletAddress });
      res.json({ success: true, message: 'Wallet linked' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
