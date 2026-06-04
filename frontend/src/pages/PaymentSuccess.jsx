import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await API.get(`/payments/status/${bookingId}`);
        if (res.data?.success) {
          setBooking(res.data);
        } else {
          toast.error(res.data?.message || 'Failed to load booking status');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load booking status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="payment-success-card">
          <h2>Confirming payment...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        <div className="success-badge">✓</div>
        <h2>Payment Successful</h2>
        <p className="muted">Your booking has been confirmed.</p>

        <div className="details">
          <div className="detail-row">
            <span>Booking ID</span>
            <strong>{bookingId}</strong>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <strong>{booking?.paymentStatus || 'completed'}</strong>
          </div>
          <div className="detail-row">
            <span>Transaction</span>
            <strong style={{ wordBreak: 'break-all' }}>{booking?.transactionId || '-'}</strong>
          </div>
        </div>

        <div className="actions">
          <button className="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

