import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🎟️ EventHub</Link>
      </div>
      <div className="navbar-links">
        <Link to="/events">Events</Link>
        {!user ? (
          <>
            <Link to="/login" className="nav-btn-outline">Login</Link>
            <Link to="/register" className="nav-btn-primary">Register</Link>
          </>
        ) : (
          <>
            {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
            {user.role === 'organizer' && <Link to="/events/create">Create Event</Link>}
            {user.role !== 'admin' && <Link to="/dashboard">Dashboard</Link>}
            <span className="user-name">👋 {user.name}</span>
            <button onClick={handleLogout} className="nav-btn-outline">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;