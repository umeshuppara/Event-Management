const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    user,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Prevent self-assigning admin
    const allowedRoles = ['attendee', 'organizer'];
    const userRole = allowedRoles.includes(role) ? role : 'attendee';

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: userRole });
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = async (req, res) => {
  const token = generateToken(req.user._id);
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
};

// @desc    Promote current user to admin
// @route   PUT /api/auth/promote
// @access  Private
exports.promoteToAdmin = async (req, res, next) => {
  try {
    const { secret } = req.body;

    if (!process.env.ADMIN_PROMOTE_SECRET) {
      return res.status(500).json({ success: false, message: 'Admin promotion is not configured' });
    }

    if (!secret || secret !== process.env.ADMIN_PROMOTE_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid admin promotion secret' });
    }

    if (req.user.role === 'admin') {
      return res.status(200).json({ success: true, user: req.user, message: 'User is already an admin' });
    }

    req.user.role = 'admin';
    await req.user.save();

    sendTokenResponse(req.user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};