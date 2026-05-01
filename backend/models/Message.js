const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  unreadCounts: { type: Map, of: Number, default: {} }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  attachments: [String],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['text', 'image', 'document', 'system'], default: 'text' }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = {
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message: mongoose.model('Message', messageSchema)
};
