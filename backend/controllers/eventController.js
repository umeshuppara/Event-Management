const Event = require('../models/event');
const Booking = require('../models/booking');
const { isPastDate, isEventExpired } = require('../utils/timeHelper');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    // Get current datetime
    const now = new Date();
    
    const query = {
      isActive: true,
      status: 'approved',
      date: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) }, // From today onwards
    };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    let events = await Event.find(query)
      .populate('organizer', 'name email')
      .select('-seats') // don't send all seats in list view
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter out expired events (considering time)
    events = events.filter(event => !isEventExpired(event.date, event.time));

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event (with seats)
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email');
    if (!event || event.status !== 'approved' || !event.isActive || isPastDate(event.date) || isEventExpired(event.date, event.time)) {
      return res.status(404).json({ success: false, message: 'Event not found or has expired' });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (organizer, admin)
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, category, location, date, time, ticketTypes, image } = req.body;

    if (!title || !description || !location || !date || !time) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!ticketTypes || ticketTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one ticket type' });
    }

    const event = await Event.create({
      title,
      description,
      category,
      location,
      date,
      time,
      ticketTypes,
      image: image || '',
      organizer: req.user._id,
      status: 'pending',
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (organizer owner, admin)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (organizer owner, admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my events (organizer)
// @route   GET /api/events/my/events
// @access  Private (organizer, admin)
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    const eventIds = events.map((event) => event._id);
    const bookings = await Booking.find({ event: { $in: eventIds } })
      .populate('user', 'name email')
      .populate('event', 'title date location');

    const eventsWithBookings = events.map((event) => {
      const eventObj = event.toObject({ virtuals: true });
      eventObj.bookings = bookings.filter(
        (booking) => booking.event._id.toString() === event._id.toString()
      );
      return eventObj;
    });

    res.status(200).json({ success: true, count: eventsWithBookings.length, events: eventsWithBookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seats for a specific ticket type
// @route   GET /api/events/:id/seats/:type
// @access  Public
exports.getSeatsByType = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const seats = event.seats.filter(seat => seat.type === req.params.type);
    res.status(200).json({ success: true, seats });
  } catch (error) {
    next(error);
  }
};