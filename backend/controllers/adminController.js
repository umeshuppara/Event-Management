const User = require('../models/user');
const Event = require('../models/event');
const Booking = require('../models/booking');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const allowedRoles = ['admin', 'organizer', 'attendee'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate or deactivate user
// @route   PUT /api/admin/users/:id/status
// @access  Private (admin)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/admin/events
// @access  Private (admin)
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private (admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('event', 'title date location')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeEvents = await Event.countDocuments({ isActive: true });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });

    // Total revenue
    const revenueResult = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ['$totalAmount', '$amount']
            }
          }
        }
      },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const totalProfit = Math.round(totalRevenue * 0.15);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        activeEvents,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        totalProfit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event status (approve/reject)
// @route   PUT /api/admin/events/:id/status
// @access  Private (admin)
exports.updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status, isActive: status === 'approved' },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event (admin)
// @route   DELETE /api/admin/events/:id
// @access  Private (admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};