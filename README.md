# EventHub - Event Booking & Management Platform

A modern, full-stack event booking application with secure mock payments, email confirmations, and real-time event management.

## 🚀 Quick Start (5 Minutes)

### 1. **Clone & Install**
```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 2. **Setup Environment Variables**

**Backend** - `backend/.env`
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/eventdb
PORT=5000
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

**Frontend** - `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. **Start Servers**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 5. **Test Payment**
1. Open http://localhost:5173
2. Register → Login → Book Event
3. Enter any 16-digit card: `4242 4242 4242 4242`
4. Expiry: Any future date (MM/YY format)
5. CVV: Any 3 digits
6. **Check email for confirmation** ✉️

---

## 📖 Documentation

For detailed setup, API endpoints, and deployment instructions, see [backend/.env.example](./backend/.env.example) for environment variable configuration.

---

## 🎯 Key Features Implemented

### ✅ User Features
- **Event Browsing** - Filter by category, search, pagination
- **Seat Selection** - Visual seat map with availability
- **Booking** - Multiple ticket types (VIP, Early Bird, Normal)
- **Secure Payments** - Mock payment system with simulated processing
- **Email Confirmations** - Booking & payment receipts
- **Dashboard** - View all bookings and tickets
- **Auto Expiry** - Events disappear after start time
- **Booking Lock** - Can't book after event starts

### ✅ Admin Features
- **Admin Dashboard** - Stats, users, events, bookings
- **Event Approval** - Approve/reject pending events
- **Booking Management** - View all bookings with seat info
- **Revenue Tracking** - Total revenue & profit metrics

### ✅ Technical Features
- **Real-time Seat Updates** - Live availability
- **Email Service** - HTML templates with booking details
- **Error Handling** - Graceful errors & user feedback
- **Security** - JWT auth, role-based access, password hashing
- **Database** - MongoDB with proper indexing

---

## 🏗️ Project Structure

```
event-management/
├── backend/
│   ├── config/           # Database, auth config
│   ├── controllers/      # Business logic
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation
│   ├── utils/           # Email service, helpers
│   ├── index.js         # Server entry
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── api/         # Axios config
│   │   ├── context/     # Auth context
│   │   └── App.jsx
│   └── package.json
└── README.md (this file)
```

---

## 📊 Payment Flow Overview

```
User Books Event
       ↓
✉️ Booking Confirmation Email Sent
       ↓
User Clicks "Pay Now"
       ↓
User Enters Card Details (16 digits, MM/YY, CVV)
       ↓
Payment Processed (2-second simulation)
       ↓
Backend Confirms Payment & Updates Booking
       ↓
✉️ Payment Confirmation Email Sent
       ↓
✅ Booking Complete!
```

---

## 🔐 Security Highlights

- ✅ **No Card Data Persisted** - Card details processed but not stored
- ✅ **JWT Auth** - Secure token-based authentication
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Email Verification** - Secure booking confirmations
- ✅ **HTTPS Ready** - All endpoints production-ready

---

## 🧪 Testing

### Test Payment Form

| Field | Format | Example |
|-------|--------|---------|
| Card Number | 16 digits | 4242 4242 4242 4242 |
| Expiry | MM/YY (future date) | 12/25 |
| CVV | 3 digits | 123 |

- Any future expiry date will work
- Any valid 16-digit number accepted
- Past expiry dates are rejected
- Email confirmations sent after successful payment

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Payment form not appearing | Check that frontend server is running |
| Card validation failing | Ensure 16 digits for card, MM/YY for expiry (future date), 3 digits for CVV |
| Email not sending | Check `EMAIL_USER` and `EMAIL_PASS` - for Gmail, must use App Password (not regular password) |
| 401 Unauthorized | Make sure you're logged in before booking |

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout

### Events
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (organizer)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user's bookings
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments/process` - Process mock payment

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - All users
- `GET /api/admin/events` - All events
- `GET /api/admin/bookings` - All bookings

---

## 📦 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Nodemailer
- JWT
- bcryptjs

### Frontend
- React 19
- Vite
- React Router
- Axios
- React Hot Toast

---

## 🔄 Environment Setup Checklist

- [ ] Backend `.env` configured with database and email
- [ ] Frontend `.env` configured with API URL
- [ ] Gmail App Password generated (for emails)
- [ ] Email credentials added to backend `.env`
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Both servers started and running
- [ ] Test payment completed successfully

---

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend Deployment (Heroku/Railway)
1. Set all `.env` variables on hosting platform
2. Deploy code

**Before going live**:
- [ ] Complete payment flow tested with test cards
- [ ] Emails confirmed working
- [ ] Event expiry tested
- [ ] All admin features working
- [ ] Error handling verified

---

## 📞 Getting Help

1. **Payment Issues**: Check browser console for errors and server logs
2. **Setup Questions**: Follow setup steps in README and .env.example files
3. **Code Issues**: Check backend/frontend logs in terminal

---

## 📄 License

This project is open source. Feel free to use it for learning and development.

---

## ✨ Ready to Start?

**Next Steps:**
1. Read [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) - Takes 15 minutes
2. Run `npm install` in both backend & frontend
3. Configure `.env` files with your Stripe keys
4. Start servers: `npm start` (backend) & `npm run dev` (frontend)
5. Test a complete payment flow
6. You're ready to deploy! 🚀

Happy building! 🎉
