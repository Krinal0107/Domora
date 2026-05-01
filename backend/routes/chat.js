const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { Conversation, Message } = require('../models/Message');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.get('/conversations', protect, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatar role')
      .populate('lastMessage')
      .populate('property', 'title images price')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: conversations });
  } catch (err) { next(err); }
});

router.post('/conversations',
  protect,
  [body('participantId').isMongoId(), body('propertyId').optional().isMongoId()],
  validate,
  async (req, res, next) => {
    try {
      const { participantId, propertyId } = req.body;
      let conv = await Conversation.findOne({
        participants: { $all: [req.user._id, participantId] },
        ...(propertyId && { property: propertyId })
      });
      if (!conv) {
        conv = await Conversation.create({
          participants: [req.user._id, participantId],
          property: propertyId
        });
      }
      await conv.populate('participants', 'name avatar role');
      await conv.populate('property', 'title images price');
      res.json({ success: true, data: conv });
    } catch (err) { next(err); }
  }
);

router.get('/conversations/:id/messages', protect, async (req, res, next) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id
    });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    await Message.updateMany(
      { conversation: req.params.id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, data: messages.reverse() });
  } catch (err) { next(err); }
});

router.post('/conversations/:id/messages',
  protect,
  [body('content').trim().notEmpty().isLength({ max: 5000 })],
  validate,
  async (req, res, next) => {
    try {
      const conv = await Conversation.findOne({
        _id: req.params.id,
        participants: req.user._id
      });
      if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });

      const message = await Message.create({
        conversation: conv._id,
        sender: req.user._id,
        content: req.body.content,
        readBy: [req.user._id]
      });
      await message.populate('sender', 'name avatar');
      conv.lastMessage = message._id;
      await conv.save();

      const io = req.app.get('io');
      conv.participants.forEach(pid => {
        if (pid.toString() !== req.user._id.toString()) {
          io?.to(`user_${pid}`).emit('new_message', { message, conversationId: conv._id });
        }
      });

      res.status(201).json({ success: true, data: message });
    } catch (err) { next(err); }
  }
);

module.exports = router;
