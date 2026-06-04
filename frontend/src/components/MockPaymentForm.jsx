import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../api/axios';
import './MockPaymentForm.css';

const MockPaymentForm = ({ bookingId, amount, onSuccess, onError }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [displayAmount, setDisplayAmount] = useState(0);
  const [successData, setSuccessData] = useState(null);

  // Update displayAmount whenever amount prop changes
  useEffect(() => {
    const numeric = typeof amount === 'string' ? Number(amount) : (amount || 0);
    if (Number.isFinite(numeric) && numeric > 0) {
      setDisplayAmount(numeric);
    } else {
      setDisplayAmount(0);
    }
  }, [amount]);

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    // Format as XXXX XXXX XXXX XXXX
    const formatted = value.slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 4 digits max (MMYY)
    value = value.slice(0, 4);
    
    // Validate month during input (must be 01-12)
    if (value.length >= 2) {
      const monthStr = value.slice(0, 2);
      const month = parseInt(monthStr);
      
      // Prevent invalid months: must be 01-12, never 00 or 13+
      // Examples: 00 invalid, 01-12 valid, 13+ invalid
      if (month === 0 || month > 12) {
        // Don't allow this input - silently reject
        return; // Exit early without updating state
      }
    }
    
    // Only allow if first digit is valid for MM/YY
    // First digit must be 0 or 1 (for months 01-12)
    if (value.length === 1) {
      const firstDigit = parseInt(value[0]);
      // Allow 0 or 1 as first digit (covers 01-12)
      // For any other first digit (2-9), reject it
      if (firstDigit > 1) {
        return; // Reject typing 2-9 as first digit
      }
    }
    
    // Format as MM/YY
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiryDate(value);
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvv(value.slice(0, 3));
  };

  const validateExpiryFuture = (value) => {
    // Strict MM/YY format validation
    if (!/^\d{2}\/\d{2}$/.test(value)) {
      return { ok: false, message: 'Expiry date must be in MM/YY format' };
    }

    const [mmStr, yyStr] = value.split('/');
    const mm = Number(mmStr);
    const yy = Number(yyStr);

    // Validate month is 01-12
    if (mm < 1 || mm > 12) {
      return { ok: false, message: 'Invalid month. Please enter between 01-12' };
    }

    // Get current date dynamically (always uses system time, never hardcoded)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = now.getDate();

    // Convert YY to full year (2000 + YY)
    // Handle both 2-digit years: 00-99 becomes 2000-2099
    const expYear = 2000 + yy;
    const expMonth = mm;

    // Card expires at the LAST day of the given month at 23:59:59
    // Get last day of expiry month
    const lastDayOfMonth = new Date(expYear, expMonth, 0).getDate();
    const expiryEnd = new Date(expYear, expMonth - 1, lastDayOfMonth, 23, 59, 59, 999);

    // Get start of today (for strict comparison)
    const todayStart = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0, 0);

    // Card is expired if expiry end date is before today
    if (expiryEnd < todayStart) {
      return { ok: false, message: 'Card has expired. Please enter a future expiry date.' };
    }

    // Card expires this month - reject it (strict future validation)
    if (expYear === currentYear && expMonth === currentMonth) {
      return { ok: false, message: 'Card expires this month. Please enter a future expiry date.' };
    }

    // All validations passed
    return { ok: true };
  };

  const validateForm = () => {
    const cleanCardNumber = cardNumber.replace(/\s/g, '');

    if (!cleanCardNumber || cleanCardNumber.length !== 16) {
      toast.error('Card number must be 16 digits');
      return false;
    }

    if (!expiryDate) {
      toast.error('Expiry date is required');
      return false;
    }

    const expiryCheck = validateExpiryFuture(expiryDate);
    if (!expiryCheck.ok) {
      toast.error(expiryCheck.message);
      return false;
    }

    if (!cvv || cvv.length !== 3) {
      toast.error('CVV must be 3 digits');
      return false;
    }

    return true;
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    const loadingToastId = toast.loading('Processing payment...');

    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        // Send payment to backend with displayAmount
        const response = await API.post('/payments/process', {
          bookingId,
          amount: displayAmount,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cvv,
        });

        if (response.data.success) {
          toast.dismiss(loadingToastId);
          
          // Store success data for detailed display
          setSuccessData({
            eventTitle: response.data.booking.event,
            bookingId: response.data.booking._id,
            amount: displayAmount,
            transactionId: response.data.booking.transactionId,
          });
          
          setIsPaymentSuccess(true);
          toast.success('✅ Payment Successful! Confirmation email sent.');

          // Call parent's success callback
          if (onSuccess) {
            onSuccess(response.data.booking);
          }
        } else {
          throw new Error(response.data.message || 'Payment failed');
        }
      } catch (error) {
        toast.dismiss(loadingToastId);
        setIsProcessing(false);
        const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
        toast.error('❌ ' + errorMessage);
        if (onError) {
          onError(error);
        }
      }
    }, 2000); // 2-second processing time
  };

  if (isPaymentSuccess && successData) {
    return (
      <div className="mock-payment-form success-state">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h3>✅ Payment Successful!</h3>
          <div className="success-details">
            <p><strong>Event:</strong> {successData.eventTitle}</p>
            <p><strong>Booking ID:</strong> {successData.bookingId}</p>
            <p><strong>Amount Paid:</strong> ₹{successData.amount}</p>
            <p><strong>Transaction ID:</strong> {successData.transactionId}</p>
            <p className="confirmation-note">✉️ Confirmation email has been sent to your registered email address</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-payment-form">
      <div className="payment-header">
        <h3>💳 Payment Details</h3>
        <p className="amount-display">
          Amount to Pay: <span className="amount-value">₹{displayAmount || 'Loading...'}</span>
        </p>
      </div>

      <form onSubmit={handlePayment}>
        <div className="form-group">
          <label htmlFor="cardNumber">Card Number</label>
          <input
            type="text"
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={handleCardNumberChange}
            disabled={isProcessing}
            maxLength="19"
            required
          />
          <small className="hint">Format: XXXX XXXX XXXX XXXX</small>
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              type="text"
              id="expiryDate"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={handleExpiryChange}
              disabled={isProcessing}
              maxLength="5"
              required
            />
            <small className="hint">Format: MM/YY</small>
          </div>

          <div className="form-group half">
            <label htmlFor="cvv">CVV</label>
            <input
              type="text"
              id="cvv"
              placeholder="123"
              value={cvv}
              onChange={handleCvvChange}
              disabled={isProcessing}
              maxLength="3"
              required
            />
            <small className="hint">3 digits</small>
          </div>
        </div>

        <div className="payment-info">
          <h4>Demo Payment Method</h4>
          <p>This is a mock payment form for demonstration purposes. No real payment will be processed.</p>
          <ul>
            <li>Card Number: Any 16 digits</li>
            <li>Expiry Date: Enter in MM/YY format (must be future date)</li>
            <li>CVV: Any 3 digits</li>
          </ul>
        </div>

        <button
          type="submit"
          className="pay-btn"
          disabled={
            isProcessing ||
            displayAmount <= 0 ||
            cardNumber.replace(/\s/g, '').length !== 16 ||
            !expiryDate ||
            !/^\d{2}\/\d{2}$/.test(expiryDate) ||
            !cvv ||
            cvv.length !== 3
          }
        >
          {isProcessing ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : displayAmount > 0 ? (
            `Pay ₹${displayAmount}`
          ) : (
            'Loading amount...'
          )}
        </button>

        <p className="payment-note">
          ℹ️ This is a demo payment form. No real transaction will occur.
        </p>
      </form>
    </div>
  );
};

export default MockPaymentForm;
