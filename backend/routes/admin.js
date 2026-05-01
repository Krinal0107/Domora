const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const Lead = require('../models/Lead');
const KYC = require('../models/KYC');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect, authorize('admin'));

router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalProperties, activeProperties, totalUsers,
      totalBrokers, pendingKYC, totalLeads
    ] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'broker' }),
      KYC.countDocuments({ status: 'pending' }),
      Lead.countDocuments()
    ]);

    const recentProperties = await Property.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const topAreas = await Property.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$location.area', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalProperties, activeProperties, totalUsers,
        totalBrokers, pendingKYC, totalLeads,
        recentProperties, topAreas
      }
    });
  } catch (err) { next(err); }
});

router.get('/properties/pending', async (req, res, next) => {
  try {
    const properties = await Property.find({ isVerified: false, status: 'active' })
      .populate('owner', 'name email phone kycStatus')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: properties });
  } catch (err) { next(err); }
});

router.put('/properties/:id/verify', async (req, res, next) => {
  try {
    const { approved, notes } = req.body;
    const property = await Property.findByIdAndUpdate(req.params.id, {
      isVerified: approved,
      verifiedAt: approved ? new Date() : undefined,
      verifiedBy: approved ? req.user._id : undefined,
      adminNotes: notes
    }, { new: true }).populate('owner', 'name email');

    if (!property) return res.status(404).json({ success: false, message: 'Not found' });

    const io = req.app.get('io');
    await Notification.create({
      user: property.owner._id,
      type: 'kyc',
      title: approved ? 'Property Verified' : 'Verification Declined',
      body: approved
        ? `"${property.title}" has been verified and is now live.`
        : `"${property.title}" verification declined. ${notes || ''}`,
      link: `/properties/${property._id}`
    });
    io?.to(`user_${property.owner._id}`).emit('notification', { type: 'property_verified', approved });

    res.json({ success: true, data: property });
  } catch (err) { next(err); }
});

router.put('/properties/:id/feature', async (req, res, next) => {
  try {
    const { days = 30 } = req.body;
    const property = await Property.findByIdAndUpdate(req.params.id, {
      isFeatured: true,
      featuredUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    }, { new: true });
    res.json({ success: true, data: property });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data: users, total });
  } catch (err) { next(err); }
});

router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'broker', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.get('/notifications', async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    const filter = userId ? { user: userId } : {};
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.json({ success: true, data: notifications });
  } catch (err) { next(err); }
});

module.exports = router;
