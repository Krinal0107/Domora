const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('passport');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');

const signToken = (user, res) => {
  const token = generateToken(user._id);
  res.json({ success: true, token, user });
};

router.post('/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be 8+ chars'),
    body('role').optional().isIn(['user', 'broker'])
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, phone, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }
      const user = await User.create({ name, email, password, phone, role: role || 'user' });
      signToken(user, res);
    } catch (err) { next(err); }
  }
);

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !user.password || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      signToken(user, res);
    } catch (err) { next(err); }
  }
);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

router.post('/wallet-login',
  [body('walletAddress').notEmpty().isLength({ min: 32, max: 44 })],
  validate,
  async (req, res, next) => {
    try {
      const { walletAddress, name } = req.body;
      let user = await User.findOne({ walletAddress });
      if (!user) {
        user = await User.create({
          walletAddress,
          name: name || `User_${walletAddress.slice(0, 8)}`,
          email: `${walletAddress.slice(0, 8)}@wallet.local`,
          isVerified: false
        });
      }
      signToken(user, res);
    } catch (err) { next(err); }
  }
);

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
