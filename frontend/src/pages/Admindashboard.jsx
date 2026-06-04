import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, eventsRes, bookingsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/events'),
        API.get('/admin/bookings'),
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setEvents(eventsRes.data.events);
      setBookings(bookingsRes.data.bookings);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role });
      toast.success('Role updated!');
      fetchAll();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleChangeEventStatus = async (eventId, status) => {
    try {
      await API.put(`/admin/events/${eventId}/status`, { status });
      toast.success(`Event ${status}`);
      fetchAll();
    } catch (error) {
      toast.error('Failed to update event status');
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  if (loading) return <div className="loading">Loading admin panel...</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>⚙️ Admin Panel</h1>
        <p>Manage users, events, and bookings</p>
      </div>

      <div className="container">
        {/* Admin Management Tabs - Removed Stats Display */}

        {/* Tabs */}
        <div className="dashboard-tabs">
          {['users', 'events', 'bookings'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="admin-table-section">
            <h2>All Users ({users.length})</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><span className="badge badge-confirmed">{user.role}</span></td>
                      <td><span className={`badge ${user.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="admin-table-section">
            <h2>All Events ({events.length})</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Organizer</th>
                    <th>Date</th>
                    <th>Total Seats</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event._id}>
                      <td>{event.title}</td>
                      <td>{event.organizer?.name}</td>
                      <td>{formatDate(event.date)}</td>
                      <td>{event.ticketTypes?.reduce((sum, ticket) => sum + (ticket.totalSeats || 0), 0) || 0}</td>
                      <td>
                        {event.status === 'pending' ? (
                          <div className="status-action-group">
                            <button onClick={() => handleChangeEventStatus(event._id, 'approved')} className="admin-action-btn confirm-btn">Approve</button>
                            <button onClick={() => handleChangeEventStatus(event._id, 'rejected')} className="admin-action-btn reject-btn">Reject</button>
                          </div>
                        ) : (
                          <span className={`badge ${event.status === 'approved' ? 'badge-confirmed' : 'badge-cancelled'}`}>{event.status === 'approved' ? '✅ Approved' : '❌ Rejected'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="admin-table-section">
            <h2>All Bookings ({bookings.length})</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Event</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking.user?.name}</td>
                      <td>{booking.event?.title}</td>
                      <td>{booking.seatNumbers?.length || booking.quantity}</td>
                      <td>₹{booking.totalAmount}</td>
                      <td><span className={`badge badge-${booking.status}`}>{booking.status}</span></td>
                      <td>
                        <span className={`badge ${booking.paymentStatus === 'completed' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                          {booking.paymentStatus === 'completed' ? '💳 PAID' : booking.paymentStatus}
                        </span>
                      </td>
                      <td>{formatDate(booking.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;