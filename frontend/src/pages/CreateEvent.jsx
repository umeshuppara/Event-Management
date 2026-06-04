import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import './CreateEvent.css';

const categories = ['conference', 'workshop', 'concert', 'sports', 'networking', 'other'];
const sectionTypes = [
  { type: 'vip', label: 'VIP' },
  { type: 'earlybird', label: 'Early Bird' },
  { type: 'normal', label: 'Normal' },
];

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get today's date in YYYY-MM-DD format for date picker minimum
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'conference',
    location: '',
    date: '',
    time: '',
    timePeriod: 'AM',
    image: '',
    ticketTypes: {
      vip: { price: '', totalSeats: '' },
      earlybird: { price: '', totalSeats: '' },
      normal: { price: '', totalSeats: '' },
    },
  });
  const [loading, setLoading] = useState(false);

  if (!user || user.role !== 'organizer') {
    return (
      <div className="create-event-page container">
        <h2>Access denied</h2>
        <p>You must be an organizer to create events.</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTicketChange = (type, name, value) => {
    // Allow empty strings for better UX
    setForm((prev) => ({
      ...prev,
      ticketTypes: {
        ...prev.ticketTypes,
        [type]: {
          ...prev.ticketTypes[type],
          [name]: value === '' ? '' : Number(value),
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ticketTypes = sectionTypes
      .map((section) => ({
        type: section.type,
        price: form.ticketTypes[section.type].price === '' ? 0 : Number(form.ticketTypes[section.type].price),
        totalSeats: form.ticketTypes[section.type].totalSeats === '' ? 0 : Number(form.ticketTypes[section.type].totalSeats),
      }))
      .filter((ticket) => ticket.totalSeats > 0 && ticket.price >= 0);

    if (!form.title || !form.description || !form.location || !form.date || !form.time) {
      toast.error('Please fill all required fields');
      return;
    }

    if (ticketTypes.length === 0) {
      toast.error('Please add at least one ticket section with seats');
      return;
    }

    const formattedTime = `${form.time} ${form.timePeriod}`;
    setLoading(true);
    try {
      await API.post('/events', {
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        date: form.date,
        time: formattedTime,
        image: form.image,
        ticketTypes,
      });
      toast.success('Event created and sent for approval');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page container">
      <div className="page-header">
        <h1>Create Event</h1>
        <p>Set up your event with section pricing and seat counts, then submit for admin approval.</p>
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <div className="fieldset grid-2">
          <label>
            Event title
            <input name="title" value={form.title} onChange={handleInputChange} required />
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={handleInputChange}>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="fieldset grid-2">
          <label>
            Location
            <input name="location" value={form.location} onChange={handleInputChange} required />
          </label>
          <label>
            Date
            <input 
              type="date" 
              name="date" 
              value={form.date} 
              onChange={handleInputChange} 
              min={getTodayDate()}
              required 
            />
          </label>
        </div>

        <div className="fieldset grid-2">
          <label>
            Time
            <div className="time-input-row">
              <input type="time" name="time" value={form.time} onChange={handleInputChange} required />
              <select
                name="timePeriod"
                value={form.timePeriod}
                onChange={handleInputChange}
                className="time-period-select"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </label>
          <label>
            Image URL
            <input name="image" value={form.image} onChange={handleInputChange} />
          </label>
        </div>

        <label className="full-width">
          Description
          <textarea name="description" value={form.description} onChange={handleInputChange} rows="5" required />
        </label>

        <div className="section-settings">
          <h3>Seat sections</h3>
          <p>Set section pricing and available seats for each ticket section.</p>
          <div className="tickets-grid">
            {sectionTypes.map((section) => (
              <div key={section.type} className="section-card">
                <h4>{section.label}</h4>
                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.ticketTypes[section.type].price}
                    onChange={(e) => handleTicketChange(section.type, 'price', e.target.value)}
                  />
                </label>
                <label>
                  Available Seats
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.ticketTypes[section.type].totalSeats}
                    onChange={(e) => handleTicketChange(section.type, 'totalSeats', e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="create-event-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Event for Approval'}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
