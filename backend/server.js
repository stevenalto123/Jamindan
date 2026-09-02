require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db'); // ensure DB tables initialized & seeded - triggered schema sync

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow any origin during local testing/development and allow vercel.app domains
    if (process.env.NODE_ENV !== 'production' || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('loca.lt') || origin.includes('lhr.life') || origin.includes('ngrok') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy violation: unauthorized origin'), false);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting Security
const rateLimit = require('express-rate-limit');

// 1. Global API Rate Limiter (Max 200 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10000, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Strict Authentication Rate Limiter (Max 15 requests per 15 minutes for login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { message: 'SECURITY ALERT: Too many login/registration attempts. You have been temporarily blocked for 15 minutes to prevent brute-force attacks.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply Global Limiter to all API routes
app.use('/api', globalLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const householdRoutes = require('./routes/householdRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const pushRoutes = require('./routes/pushRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jamindan Emergency Response API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Jamindan Emergency Response API server running on port ${PORT}`);
  console.log(`MySQL database connected successfully`);
  console.log(`Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`====================================================`);
});
