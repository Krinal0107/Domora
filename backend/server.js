require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const passport = require('passport');

const connectDB = require('./config/db');
require('./config/passport');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/property');
const userRoutes = require('./routes/user');
const leadRoutes = require('./routes/leads');
const chatRoutes = require('./routes/chat');
const negotiationRoutes = require('./routes/negotiation');
const visitRoutes = require('./routes/visit');
const kycRoutes = require('./routes/kyc');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const { initSocketHandlers } = require('./socket/chatHandler');
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

app.use(generalLimiter);

app.set('io', io);

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

initSocketHandlers(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });
});

module.exports = { app, server };
