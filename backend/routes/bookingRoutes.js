const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All booking routes are protected
router.post('/', protect, authorize('attendee'), createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBooking);
router.delete('/:id', protect, authorize('attendee'), cancelBooking);

module.exports = router;