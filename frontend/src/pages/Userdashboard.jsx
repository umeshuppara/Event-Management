import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const ticketLabels = { vip: 'VIP', earlybird: 'Early Bird', normal: 'Normal' };

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user?.role === 'organizer' ? 'events' : 'bookings');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user.role === 'organizer') {
        const eventsRes = await API.get('/events/my/events');
        setMyEvents(eventsRes.data.events);
      } else {
        const bookingsRes = await API.get('/bookings/my');
        setBookings(bookingsRes.data.bookings);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.delete(`/bookings/${bookingId}`);
      toast.success('Booking cancelled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const formatTime = (time) => {
    if (!time) return '';
    const normalized = time.trim();
    if (normalized.match(/^\d{1,2}:\d{2}\s?(AM|PM)$/i)) return normalized.toUpperCase();
    const [hours, minutes] = normalized.split(':');
    if (!hours || !minutes) return normalized;
    const hourNum = Number(hours);
    if (Number.isNaN(hourNum)) return normalized;
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = ((hourNum + 11) % 12) + 1;
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>My Dashboard</h1>
          <p>Welcome back, <strong>{user.name}</strong> — {user.role}</p>
        </div>
        {user.role === 'organizer' && (
          <Link to="/events/create" className="create-event-link">Create New Event</Link>
        )}
      </div>


      <div className="container">
        {/* Stats */}
        <div className="stats-grid">
          {user.role !== 'organizer' && (
            <>
              <div className="stat-card">
                <div className="stat-number">{bookings.length}</div>
                <div className="stat-label">Total Bookings</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{bookings.filter(b => b.status === 'confirmed').length}</div>
                <div className="stat-label">Confirmed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">₹{bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0)}</div>
                <div className="stat-label">Total Spent</div>
              </div>
            </>
          )}
          {user.role === 'organizer' && (
            <>
              <div className="stat-card">
                <div className="stat-number">{myEvents.length}</div>
                <div className="stat-label">My Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{myEvents.filter(event => event.status === 'pending').length}</div>
                <div className="stat-label">Pending Approval</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{myEvents.filter(event => event.status === 'approved').length}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{myEvents.reduce((sum, event) => sum + (event.bookings?.length || 0), 0)}</div>
                <div className="stat-label">Attendee Bookings</div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          {user.role !== 'organizer' && (
            <button
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              My Bookings
            </button>
          )}
          {user.role === 'organizer' && (
            <button
              className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              My Events
            </button>
          )}
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="tab-content">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <p>🎟️ No bookings yet. <a href="/events">Browse events</a> to book your first ticket!</p>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map((booking) => (
                  <div key={booking._id} className="booking-card">
                    <div className="booking-info">
                      <h3>{booking.event?.title}</h3>
                      <div className="booking-meta">
                        <span>📅 {formatDate(booking.event?.date)}</span>
                        <span>📍 {booking.event?.location}</span>
                        <span>🪑 {booking.quantity} seat(s)</span>
                        {booking.ticketType && (
                          <span>🎫 {ticketLabels[booking.ticketType] || booking.ticketType}</span>
                        )}
                        <span>💰 ₹{booking.totalAmount}</span>
                      </div>
                    </div>
                    <div className="booking-actions">
                      <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                      {booking.paymentStatus && (
                        <span className={`badge badge-${booking.paymentStatus === 'completed' ? 'confirmed' : 'cancelled'}`}>
                          {booking.paymentStatus === 'completed' ? '💳 PAID' : `${booking.paymentStatus}`}
                        </span>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancel(booking._id)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab (Organizer) */}
        {activeTab === 'events' && user.role === 'organizer' && (
          <div className="tab-content">
            {myEvents.length === 0 ? (
              <div className="empty-state">
                <p>📅 No events created yet. Use the button above to create your first event.</p>
              </div>
            ) : (
              <div className="my-events-list">
                {myEvents.map((event) => (
                  <div key={event._id} className="event-card organizer-event-card">
                    <div className="booking-info organizer-event-header">
                      <div>
                        <h3>{event.title}</h3>
                        <div className="booking-meta organizer-event-meta">
                          <span>📅 {formatDate(event.date)}</span>
                          <span>⏰ {formatTime(event.time)}</span>
                          <span>📍 {event.location}</span>
                          <span>🪑 {event.ticketTypes?.reduce((sum, ticket) => sum + (ticket.totalSeats || 0), 0) || 0} total seats</span>
                        </div>
                      </div>
                      <span className={`badge ${event.status === 'approved' ? 'badge-confirmed' : event.status === 'pending' ? 'badge-warning' : 'badge-cancelled'}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="event-bookings">
                      <h4>Attendee bookings ({event.bookings?.length || 0})</h4>
                      {event.bookings?.length > 0 ? (
                        event.bookings.map((booking) => (
                          <div key={booking._id} className="booking-card booking-card-small">
                            <div><strong>{booking.user?.name}</strong> ({booking.user?.email})</div>
                            <div>Seats: {booking.quantity}</div>
                            <div>Type: {booking.ticketType}</div>
                            <div>Total paid: ₹{booking.totalAmount}</div>
                            <div className={`badge badge-${booking.status}`}>{booking.status}</div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-state">No bookings yet for this event.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;