import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import BookingFlow from '../components/Bookingflow';
import './Eventdetail.css';

const ticketLabels = { vip: '🌟 VIP', earlybird: '🐦 Early Bird', normal: '🎟️ Normal' };

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

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [eventStarted, setEventStarted] = useState(false);

  const fetchEvent = async () => {
    try {
      const { data } = await API.get(`/events/${id}`);
      setEvent(data.event);
      // Check if event has started
      if (data.event?.date && data.event?.time) {
        setEventStarted(hasEventStarted(data.event.date, data.event.time));
      }
    } catch (error) {
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleModalClose = () => {
    setShowBooking(false);
    // Refresh event data to show updated seat availability
    fetchEvent();
  };

  const handleBookNow = () => {
    if (!user) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }
    if (user.role !== 'attendee') {
      toast.error('Only attendees can book tickets');
      return;
    }
    setShowBooking(true);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const totalAvailable = event?.ticketTypes?.reduce((sum, t) => sum + t.availableSeats, 0) || 0;
  const totalSeats = event?.ticketTypes?.reduce((sum, t) => sum + t.totalSeats, 0) || 0;

  if (loading) return <div className="loading">Loading event...</div>;
  if (!event) return null;

  return (
    <div className="event-detail-page container">
      <div className="event-detail-card">
        <div className="event-detail-header">
          <span className="event-category-badge">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="event-detail-organizer">Organized by {event.organizer?.name}</p>
        </div>

        <div className="event-detail-body">
          <div className="event-info-grid">
            <div className="info-item">
              <span className="info-icon">📅</span>
              <div><label>Date</label><p>{formatDate(event.date)}</p></div>
            </div>
            <div className="info-item">
              <span className="info-icon">⏰</span>
              <div><label>Time</label><p>{event.time}</p></div>
            </div>
            <div className="info-item">
              <span className="info-icon">📍</span>
              <div><label>Location</label><p>{event.location}</p></div>
            </div>
            <div className="info-item">
              <span className="info-icon">🪑</span>
              <div><label>Seats Available</label><p>{totalAvailable} / {totalSeats}</p></div>
            </div>
          </div>

          <div className="event-description-section">
            <h3>About this Event</h3>
            <p>{event.description}</p>
          </div>

          <div className="ticket-types-section">
            <h3>Ticket Prices</h3>
            <div className="ticket-types-grid">
              {event.ticketTypes?.map((ticket) => (
                <div key={ticket.type} className={`ticket-info-card ${ticket.availableSeats === 0 ? 'sold-out' : ''}`}>
                  <div className="ticket-info-type">{ticketLabels[ticket.type]}</div>
                  <div className="ticket-info-price">₹{ticket.price}</div>
                  <div className="ticket-info-seats">
                    {ticket.availableSeats === 0 ? '❌ Sold Out' : `${ticket.availableSeats} left`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="book-section">
            {eventStarted ? (
              <div className="event-started-notice">
                ⚠️ This event has already started. Booking is no longer available.
              </div>
            ) : totalAvailable > 0 ? (
              <button onClick={handleBookNow} className="book-btn">
                🎟️ Book Your Seat
              </button>
            ) : (
              <div className="sold-out">SOLD OUT</div>
            )}
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingFlow event={event} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default EventDetail;