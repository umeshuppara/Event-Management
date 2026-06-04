const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const {
  register,
  login,
  getMe,
  googleCallback,
  promoteToAdmin,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Email & Password
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/promote', protect, promoteToAdmin);
router.get('/logout', protect, logout);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleCallback
);

module.exports = router;