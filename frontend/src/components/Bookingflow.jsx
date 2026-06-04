import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import MockPaymentForm from './MockPaymentForm';
import './Bookingflow.css';

const ticketIcons = { vip: '🌟', earlybird: '🐦', normal: '🎟️' };
const ticketLabels = { vip: 'VIP', earlybird: 'Early Bird', normal: 'Normal' };

// Helper function to check if event has started
const hasEventStarted = (eventDate, eventTime) => {
  try {
    const [day, monthStr, year] = eventDate.match(/(\d+)\s+(\w+),\s+(\d+)/).slice(1);
    const months = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDateTime = new Date(year, months[monthStr], day, hours, minutes, 0);
    const now = new Date();
    return now >= eventDateTime;
  } catch (error) {
    return false;
  }
};

const BookingFlow = ({ event, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [seatOptions, setSeatOptions] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [booking, setBooking] = useState(false);
  const [eventStarted, setEventStarted] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [bookingAmount, setBookingAmount] = useState(0);

  useEffect(() => {
    // Check if event has started
    if (event?.date && event?.time) {
      setEventStarted(hasEventStarted(event.date, event.time));
    }
  }, [event]);

  useEffect(() => {
    if (selectedType) {
      setQuantity(1);
      setSelectedSeats([]);
    }
  }, [selectedType]);

  const handleSelectType = (ticketType) => {
    setSelectedType(ticketType);
    setSelectedSeats([]);
    setQuantity(1);
    setLoadingSeats(true);
    try {
      if (event?.seats?.length) {
        setSeatOptions(event.seats);
        setStep(2);
      } else {
        toast.error('Seat information not available');
      }
    } catch (error) {
      toast.error('Failed to load seats');
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleToggleSeat = (seat) => {
    if (seat.isBooked || seat.type !== selectedType.type) return;
    const exists = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatNumber !== seat.seatNumber));
      return;
    }
    if (selectedSeats.length >= quantity) {
      toast.error(`You can only select ${quantity} seat(s)`);
      return;
    }
    setSelectedSeats([...selectedSeats, seat]);
  };

  const handleQuantityChange = (value) => {
    const newValue = Math.max(1, value);
    setQuantity(newValue);
    if (selectedSeats.length > newValue) {
      setSelectedSeats(selectedSeats.slice(0, newValue));
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }

    if (selectedSeats.length !== quantity) {
      toast.error('Select the exact number of seats you want to book');
      return;
    }

    setBooking(true);
    try {
      const { data } = await API.post('/bookings', {
        eventId: event._id,
        ticketType: selectedType.type,
        seatNumbers: selectedSeats.map((seat) => seat.seatNumber),
        quantity,
      });
      
      // Store booking ID and amount for payment
      setBookingId(data.booking._id);
      setBookingAmount(data.booking.totalAmount);
      
      // Move to payment step
      setStep(3);
      toast.success('Booking created! Now proceed with payment.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handlePaymentSuccess = (confirmedBooking) => {
    toast.success('✅ Payment successful! Your booking is confirmed.');
    setTimeout(() => {
      // confirmedBooking is expected to contain booking id
      const id = confirmedBooking?._id || bookingId;
      navigate(`/payment-success/${id}`);
      onClose();
    }, 1500);
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed: ' + error);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const seatRows = ['vip', 'earlybird', 'normal']
    .map((type) => ({ type, seats: seatOptions.filter((seat) => seat.type === type) }))
    .filter((row) => row.seats.length > 0);

  return (
    <div className="booking-overlay">
      <div className="booking-modal">
        <div className="booking-modal-header">
          <div>
            <h2>Book Tickets</h2>
            <p>{event.title}</p>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="steps-indicator">
          {['Ticket Type', 'Select Seats', 'Payment'].map((label, index) => (
            <div key={index} className={`step ${step > index + 1 ? 'done' : ''} ${step === index + 1 ? 'active' : ''}`}>
              <div className="step-circle">{step > index + 1 ? '✓' : index + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {eventStarted && (
          <div className="event-started-warning">
            ⚠️ This event has already started. Booking is no longer available.
          </div>
        )}

        {step === 1 && (
          <div className="step-content">
            <h3>Choose Your Ticket Section</h3>
            {eventStarted ? (
              <div className="sold-out-message">
                This event has already begun, so you cannot book tickets anymore.
              </div>
            ) : (
              <div className="ticket-types">
                {event.ticketTypes.map((ticket) => (
                  <div
                    key={ticket.type}
                    className={`ticket-type-card ${ticket.availableSeats === 0 ? 'sold-out' : ''} ${selectedType?.type === ticket.type ? 'selected' : ''}`}
                    onClick={() => ticket.availableSeats > 0 && handleSelectType(ticket)}
                  >
                    <div className="ticket-type-icon">{ticketIcons[ticket.type]}</div>
                    <div className="ticket-type-info">
                      <h4>{ticketLabels[ticket.type]}</h4>
                      <p className="ticket-seats">
                        {ticket.availableSeats === 0 ? '❌ SOLD OUT' : `${ticket.availableSeats} seats available`}
                      </p>
                    </div>
                    <div className="ticket-type-price">₹{ticket.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-back">
              <button onClick={() => setStep(1)} className="back-btn">← Back</button>
              <h3>{ticketLabels[selectedType.type]} Section — ₹{selectedType.price} each</h3>
            </div>

            <div className="seat-legend">
              <span><span className="legend-box available"></span> Available</span>
              <span><span className="legend-box booked"></span> Booked</span>
              <span><span className="legend-box selected"></span> Selected</span>
            </div>

            <div className="quantity-control">
              <button type="button" onClick={() => handleQuantityChange(quantity - 1)}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => handleQuantityChange(quantity + 1)}>+</button>
            </div>

            {loadingSeats ? (
              <div className="loading">Loading seats...</div>
            ) : (
              <div className="seat-map">
                {seatRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="seat-section">
                    <div className="section-label">{ticketLabels[row.type]}</div>
                    <div className="seat-row">
                      {row.seats.map((seat) => {
                        const isOtherSection = selectedType && seat.type !== selectedType.type;
                        const isSelected = selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
                        return (
                          <button
                            key={seat.seatNumber}
                            className={`seat ${seat.isBooked ? 'booked' : isOtherSection ? 'other' : 'available'} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleToggleSeat(seat)}
                            disabled={seat.isBooked || isOtherSection}
                            title={seat.isBooked ? 'Already booked' : isOtherSection ? 'Unavailable for this section' : seat.seatNumber}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="seat-count">
              Selected: {selectedSeats.length} / {quantity} seat(s)
            </p>

            <button
              type="button"
              className="confirm-btn"
              onClick={handleConfirmBooking}
              disabled={selectedSeats.length !== quantity || booking}
            >
              {booking ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <div className="step-back">
              <button onClick={() => setStep(2)} className="back-btn">← Back</button>
              <h3>Payment Summary</h3>
            </div>

            <div className="payment-summary">
              <div className="summary-card">
                <div className="summary-row">
                  <span>Event</span>
                  <strong>{event.title}</strong>
                </div>
                <div className="summary-row">
                  <span>Date</span>
                  <strong>{formatDate(event.date)}</strong>
                </div>
                <div className="summary-row">
                  <span>Time</span>
                  <strong>{event.time}</strong>
                </div>
                <div className="summary-row">
                  <span>Location</span>
                  <strong>{event.location}</strong>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row">
                  <span>Ticket Type</span>
                  <strong>{ticketIcons[selectedType.type]} {ticketLabels[selectedType.type]}</strong>
                </div>
                <div className="summary-row">
                  <span>Seats</span>
                  <strong>{selectedSeats.map((seat) => seat.seatNumber).join(', ')}</strong>
                </div>
                <div className="summary-row">
                  <span>Quantity</span>
                  <strong>{quantity}</strong>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <strong>₹{selectedType.price * quantity}</strong>
                </div>
              </div>

              <MockPaymentForm 
                bookingId={bookingId}
                amount={bookingAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;