const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const KYC = require('../models/KYC');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const { uploadDocuments, uploadToS3 } = require('../middleware/upload');

router.post('/',
  protect,
  uploadDocuments.single('document'),
  [body('docType').isIn(['aadhaar', 'pan', 'passport', 'voter_id', 'property_deed', 'sale_agreement'])],
  validate,
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Document file required' });
      const url = await uploadToS3(req.file, 'kyc');
      const doc = await KYC.create({
        user: req.user._id,
        property: req.body.propertyId,
        docType: req.body.docType,
        fileUrl: url,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
      res.status(201).json({ success: true, data: doc });
    } catch (err) { next(err); }
  }
);

router.get('/my', protect, async (req, res, next) => {
  try {
    const docs = await KYC.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
});

router.get('/pending', protect, authorize('admin'), async (req, res, next) => {
  try {
    const docs = await KYC.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .populate('property', 'title')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
});

router.put('/:id/review', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const doc = await KYC.findByIdAndUpdate(req.params.id, {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    }, { new: true }).populate('user', 'name email');

    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    if (status === 'approved') {
      const allApproved = await KYC.countDocuments({ user: doc.user._id, status: { $ne: 'approved' } });
      if (allApproved === 0) {
        await User.findByIdAndUpdate(doc.user._id, { kycStatus: 'approved', isVerified: true });
      }
    }

    const io = req.app.get('io');
    await Notification.create({
      user: doc.user._id,
      type: 'kyc',
      title: `KYC ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      body: status === 'approved' ? 'Your document has been verified.' : `Rejected: ${rejectionReason}`
    });
    io?.to(`user_${doc.user._id}`).emit('notification', { type: 'kyc', status });

    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
});

module.exports = router;
