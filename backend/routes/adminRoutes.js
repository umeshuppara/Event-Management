const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getAllEvents,
  getAllBookings,
  getStats,
  updateEventStatus,
  deleteEvent,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.get('/events', getAllEvents);
router.put('/events/:id/status', updateEventStatus);
router.delete('/events/:id', deleteEvent);
router.get('/bookings', getAllBookings);

module.exports = router;