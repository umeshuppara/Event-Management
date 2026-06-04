import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await API.get('/events', { params });
      setEvents(data.events);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Upcoming Events</h1>
        <p>Discover and book events near you</p>
      </div>

      {/* Search & Filter */}
      <div className="events-filters container">
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="category-filter">
          <option value="">All Categories</option>
          <option value="conference">Conference</option>
          <option value="workshop">Workshop</option>
          <option value="concert">Concert</option>
          <option value="sports">Sports</option>
          <option value="networking">Networking</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="events-grid container">
        {loading ? (
          <div className="loading">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="no-events">
            <p>No events found. Check back later!</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-card-header">
                <span className="event-category">{event.category}</span>
              </div>
              <div className="event-card-body">
                <h3>{event.title}</h3>
                <p className="event-description">{event.description.substring(0, 100)}...</p>
                <div className="event-meta">
                  <span>📅 {formatDate(event.date)}</span>
                  <span>⏰ {event.time}</span>
                  <span>📍 {event.location}</span>
                  <span>
                    🪑 {event.ticketTypes?.reduce((sum, ticket) => sum + (ticket.availableSeats || 0), 0) || 0} seats left
                  </span>
                </div>
                <div className="event-organizer">
                  By {event.organizer?.name}
                </div>
              </div>
              <div className="event-card-footer">
                <Link to={`/events/${event._id}`} className="view-btn">View Details</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;