const Booking = require('../models/booking');
const Event = require('../models/event');
const User = require('../models/user');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');

// @desc    Process Mock Payment (Demo purposes)
// @route   POST /api/payments/process
// @access  Private (attendee)
exports.processMockPayment = async (req, res, next) => {
  try {
    const { bookingId, amount, cardNumber, cvv } = req.body;

    // Validate required fields
    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: bookingId, amount',
      });
    }

    // Validate card details (just basic validation for demo)
    if (!cardNumber || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'Card details are required',
      });
    }

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('event', 'title location date time')
      .populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user owns this booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking',
      });
    }

    // Check if already paid
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking already paid',
      });
    }

    // Verify amount matches
    if (Number(amount) !== booking.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${amount}) does not match booking amount (${booking.totalAmount})`,
      });
    }

    // Update booking with payment details
    booking.paymentStatus = 'completed';
    booking.transactionId = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        booking.paidAt = new Date();
    await booking.save();

    // Send payment confirmation email
    if (booking.user && booking.user.email) {
      try {
        const emailOptions = {
          to: booking.user.email,
          userName: booking.user.name,
          eventTitle: booking.event.title,
          eventDate: booking.event.date ? booking.event.date.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          }) : 'Date Not Set',
          amount: booking.totalAmount,
          bookingId: bookingId,
          seats: booking.seatNumbers,
          ticketCount: booking.quantity,
          transactionId: booking.transactionId,
        };

        console.log('📧 Sending email with options:', JSON.stringify(emailOptions, null, 2));
        const emailResult = await sendPaymentConfirmationEmail(emailOptions);

        if (!emailResult.success) {
          console.error('❌ Email Result Failure:', emailResult.error);
        } else {
          console.log('✅ Payment confirmation email sent successfully');
        }
      } catch (emailError) {
        console.error('❌ Email Service Exception:', emailError);
      }
    } else {
      console.warn('Could not send email: User email not found or booking not populated correctly');
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Payment successful! Your booking is confirmed. Confirmation email sent.',
      booking: {
        _id: booking._id,
        paymentStatus: booking.paymentStatus,
        transactionId: booking.transactionId,
        paidAt: booking.paidAt,
        event: booking.event.title,
        user: booking.user.name,
      },
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

// @desc    Get payment status (optional - for checking if payment was made)
// @route   GET /api/payments/status/:bookingId
// @access  Private (attendee)
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      paymentStatus: booking.paymentStatus,
      transactionId: booking.transactionId,
      paidAt: booking.paidAt,
    });
  } catch (error) {
    next(error);
  }
};
