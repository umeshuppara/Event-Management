import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover & Book <span>Amazing Events</span></h1>
          <p>Find conferences, workshops, concerts, and more. Book your tickets in seconds.</p>
          <div className="hero-buttons">
            <Link to="/events" className="hero-btn-primary">Browse Events</Link>
            <Link to="/register" className="hero-btn-outline">Get Started</Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why Choose EventHub?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Easy Booking</h3>
              <p>Book tickets in seconds with our simple and secure booking system.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎪</div>
              <h3>Diverse Events</h3>
              <p>From conferences to concerts, find events that match your interests.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Secure Platform</h3>
              <p>Your data and bookings are protected with enterprise-grade security.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Manage Easily</h3>
              <p>Track all your bookings and events from your personal dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of event-goers and organizers on EventHub</p>
          <Link to="/register" className="hero-btn-primary">Create Account</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;