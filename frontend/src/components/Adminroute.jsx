import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
};

export default AdminRoute;