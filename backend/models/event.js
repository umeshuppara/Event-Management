const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['vip', 'earlybird', 'normal'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
  },
  availableSeats: {
    type: Number,
  },
  prefix: {
    type: String, // V for vip, E for earlybird, N for normal
  },
});

const seatSchema = new mongoose.Schema({
  seatNumber: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['vip', 'earlybird', 'normal'],
    required: true,
  },
  isBooked: {
    type: Boolean,
    default: false,
  },
});

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: ['conference', 'workshop', 'concert', 'sports', 'networking', 'other'],
      default: 'other',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    ticketTypes: [ticketTypeSchema],
    seats: [seatSchema],
    image: {
      type: String,
      default: '',
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Auto generate seats and set availableSeats before saving
eventSchema.pre('save', async function () {
  if (this.isNew && this.ticketTypes && this.ticketTypes.length > 0) {
    const prefixMap = { vip: 'V', earlybird: 'E', normal: 'N' };
    const seats = [];

    this.ticketTypes.forEach((ticket) => {
      ticket.availableSeats = ticket.totalSeats;
      ticket.prefix = prefixMap[ticket.type];

      for (let i = 1; i <= ticket.totalSeats; i++) {
        seats.push({
          seatNumber: `${prefixMap[ticket.type]}${i}`,
          type: ticket.type,
          isBooked: false,
        });
      }
    });

    this.seats = seats;
  }
});

// Virtual for total seats
eventSchema.virtual('totalSeats').get(function () {
  return this.ticketTypes.reduce((sum, t) => sum + t.totalSeats, 0);
});

// Virtual for total available seats
eventSchema.virtual('totalAvailableSeats').get(function () {
  return this.ticketTypes.reduce((sum, t) => sum + t.availableSeats, 0);
});

// Virtual to check if event is expired
eventSchema.virtual('isExpired').get(function () {
  try {
    const [hours, minutes] = this.time.split(':').map(Number);
    const eventDateTime = new Date(this.date);
    eventDateTime.setHours(hours, minutes, 0, 0);
    return new Date() >= eventDateTime;
  } catch (error) {
    return false;
  }
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);