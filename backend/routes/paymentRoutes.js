const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { processMockPayment, getPaymentStatus } = require('../controllers/paymentController');

const router = express.Router();

// Process Mock Payment (Demo purposes)
router.post('/process', protect, processMockPayment);

// Get Payment Status
router.get('/status/:bookingId', protect, getPaymentStatus);

module.exports = router;
