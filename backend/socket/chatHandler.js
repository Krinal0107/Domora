const jwt = require('jsonwebtoken');
const User = require('../models/User');

function initSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = await User.findById(decoded.id).select('-password');
      }
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.user) {
      socket.join(`user_${socket.user._id}`);
      console.log(`User ${socket.user.name} connected: ${socket.id}`);
    }

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        userId: socket.user?._id,
        userName: socket.user?.name,
        isTyping
      });
    });

    socket.on('send_message', async (data) => {
      const { conversationId, content } = data;
      socket.to(`conv_${conversationId}`).emit('receive_message', {
        conversationId,
        content,
        sender: { _id: socket.user?._id, name: socket.user?.name, avatar: socket.user?.avatar },
        createdAt: new Date().toISOString()
      });
    });

    socket.on('property_view', ({ propertyId }) => {
      io.emit('property_views', { propertyId, count: Math.floor(Math.random() * 50) + 10 });
    });

    socket.on('disconnect', () => {
      if (socket.user) {
        console.log(`User ${socket.user.name} disconnected`);
      }
    });
  });
}

module.exports = { initSocketHandlers };
