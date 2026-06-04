const Booking = require('../models/booking');
const Event = require('../models/event');
const { hasEventStarted } = require('../utils/timeHelper');

// @desc    Book a specific seat
// @route   POST /api/bookings
// @access  Private (attendee)
exports.createBooking = async (req, res, next) => {
  try {
    const { eventId, ticketType, seatNumbers, quantity } = req.body;

    if (!eventId || !ticketType || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide eventId, ticketType and seatNumbers' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if event has started or is in the past
    if (!event.isActive || event.status !== 'approved' || hasEventStarted(event.date, event.time)) {
      return res.status(400).json({ success: false, message: 'This event has already started or is in the past. Booking is not allowed.' });
    }

    // Get ticket price and availability
    const ticketTypeData = event.ticketTypes.find(t => t.type === ticketType);
    if (!ticketTypeData) {
      return res.status(404).json({ success: false, message: 'Ticket type not found' });
    }

    const requestedQuantity = quantity || seatNumbers.length;
    if (ticketTypeData.availableSeats < requestedQuantity) {
      return res.status(400).json({ success: false, message: 'Not enough seats available for this ticket type' });
    }

    const seatsToBook = event.seats.filter(
      (s) => s.type === ticketType && seatNumbers.includes(s.seatNumber)
    );
    if (seatsToBook.length !== seatNumbers.length) {
      return res.status(404).json({ success: false, message: 'One or more seats not found' });
    }

    if (seatsToBook.some((seat) => seat.isBooked)) {
      return res.status(400).json({ success: false, message: 'One or more selected seats are already booked' });
    }

    // Mark seats as booked
    seatsToBook.forEach((seat) => {
      seat.isBooked = true;
    });
    ticketTypeData.availableSeats -= seatNumbers.length;

    // Mark arrays as modified so Mongoose persists the changes
    event.markModified('seats');
    event.markModified('ticketTypes');
    await event.save();

    const totalAmount = ticketTypeData.price * seatNumbers.length;
    
    // Create new booking (users can have multiple bookings per event)
    const booking = await Booking.create({
      event: eventId,
      user: req.user._id,
      seatNumbers,
      quantity: seatNumbers.length,
      ticketType,
      amount: ticketTypeData.price,
      totalAmount,
    });

    await booking.populate('event', 'title date time location');
    await booking.populate('user', 'name email');

    res.status(201).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
// @access  Private
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date time location image')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private (attendee)
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    // Free the seats
    const event = await Event.findById(booking.event);
    if (event) {
      const seatNumbers = booking.seatNumbers?.length ? booking.seatNumbers : [booking.seatNumber];
      const quantityToRestore = booking.quantity || seatNumbers.length || 1;

      seatNumbers.forEach((seatNumber) => {
        const seat = event.seats.find((s) => s.seatNumber === seatNumber);
        if (seat) seat.isBooked = false;
      });

      const ticketTypeData = event.ticketTypes.find((t) => t.type === booking.ticketType);
      if (ticketTypeData) ticketTypeData.availableSeats += quantityToRestore;

      // Mark seats as modified so Mongoose persists the changes
      event.markModified('seats');
      event.markModified('ticketTypes');
      await event.save();
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date time location')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};