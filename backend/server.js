const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./config/db'); // ensure DB tables initialized & seeded - triggered schema sync
const { getJwtSecret } = require('./middleware/auth');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // Force IPv4 globally for Render to fix SMTP IPv6 ENETUNREACH error

app.set('trust proxy', 1); // Trust Render reverse proxy for rate limiter

// Shared CORS origin validator for both Express and Socket.IO
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.indexOf(origin) !== -1) return true;
  try {
    const originUrl = new URL(origin);
    const validProtocol = ['http:', 'https:', 'capacitor:', 'ionic:'].includes(originUrl.protocol);
    return (
      validProtocol &&
      (
        originUrl.hostname === 'localhost' ||
        originUrl.hostname === '127.0.0.1' ||
        originUrl.hostname.endsWith('.vercel.app') ||
        originUrl.hostname.endsWith('.netlify.app')
      )
    );
  } catch (e) {
    return false;
  }
};

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('CORS Policy violation: unauthorized origin'), false);
    },
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});

// Expose io to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error('CORS Policy violation: unauthorized origin'), false);
  },
  credentials: true
}));

// Harden Express headers & payload limits
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing middleware (capped at 5MB to prevent DoS while supporting profile avatars)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate Limiting Security
const rateLimit = require('express-rate-limit');

// 1. Global API Rate Limiter (Max 3000 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 3000, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
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
const vehicleRoutes = require('./routes/vehicleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/household', householdRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Jamindan Emergency Response API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  if (err && (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE' || /only image/i.test(err.message || ''))) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded image file is too large.'
      : (err.message || 'Invalid image upload');
    return res.status(400).json({ message });
  }
  const status = err.status || (err.message && err.message.startsWith('CORS Policy') ? 403 : 500);
  res.status(status).json({
    message: err.message || 'Internal Server Error'
  });
});

// Optional JWT verification on Socket.IO handshake (allows public alert listeners while authenticating room joins)
io.use((socket, next) => {
  const rawAuthHeader = socket.handshake?.headers?.authorization;
  const headerToken = typeof rawAuthHeader === 'string' && rawAuthHeader.startsWith('Bearer ')
    ? rawAuthHeader.slice(7)
    : null;
  const token = socket.handshake?.auth?.token || headerToken;
  if (token) {
    try {
      socket.user = jwt.verify(token, getJwtSecret());
    } catch (err) {
      socket.user = null;
    }
  } else {
    socket.user = null;
  }
  next();
});

// WebRTC Signaling Events
io.on('connection', (socket) => {
  console.log('New Socket.IO Connection:', socket.id);

  socket.on('broadcaster-ready', () => {
    // Broadcaster ready, tell authorized incident rooms
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(r => socket.to(r).emit('broadcaster-ready'));
  });

  // Broadcaster (Resident) or Admin/Responder joins the room for a specific incident
  socket.on('join-incident-room', async (payload) => {
    try {
      const incidentIdRaw = typeof payload === 'object' && payload !== null ? payload.incidentId : payload;
      const parsedId = parseInt(incidentIdRaw, 10);
      if (!Number.isInteger(parsedId) || parsedId <= 0) return;

      let activeUser = socket.user;
      if (!activeUser && payload && typeof payload === 'object' && payload.token) {
        try {
          activeUser = jwt.verify(payload.token, getJwtSecret());
          socket.user = activeUser;
        } catch (err) {
          activeUser = null;
        }
      }

      if (!activeUser) {
        socket.emit('room-error', { message: 'Authentication required to join incident stream.' });
        return;
      }

      const [rows] = await db.execute('SELECT id, reporter_id FROM incidents WHERE id = ?', [parsedId]);
      if (!rows || rows.length === 0) return;

      const isPrivileged = activeUser.role === 'Admin' || activeUser.role === 'Responder';
      const isOwner = Number(rows[0].reporter_id) === Number(activeUser.id);
      if (!isPrivileged && !isOwner) {
        socket.emit('room-error', { message: 'Unauthorized to join this incident room.' });
        return;
      }

      const roomName = `incident-${parsedId}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined incident room: ${parsedId}`);
      // Notify others in the room that someone joined (useful for WebRTC renegotiation)
      socket.to(roomName).emit('viewer-joined', socket.id);
    } catch (err) {
      console.error('join-incident-room error:', err);
    }
  });

  // Relay WebRTC Offer from Viewer (Admin) to Broadcaster (Resident)
  socket.on('webrtc-offer', (data) => {
    if (!data || !data.incidentId) return;
    const roomName = `incident-${data.incidentId}`;
    if (!socket.rooms.has(roomName)) return;
    socket.to(roomName).emit('webrtc-offer', { ...data, senderId: socket.id });
  });

  // Relay WebRTC Answer from Broadcaster (Resident) to Viewer (Admin)
  socket.on('webrtc-answer', (data) => {
    if (!data || !data.incidentId) return;
    const roomName = `incident-${data.incidentId}`;
    if (!socket.rooms.has(roomName)) return;
    socket.to(roomName).emit('webrtc-answer', { ...data, senderId: socket.id });
  });

  // Relay ICE Candidates
  socket.on('ice-candidate', (data) => {
    if (!data || !data.incidentId) return;
    const roomName = `incident-${data.incidentId}`;
    if (!socket.rooms.has(roomName)) return;
    socket.to(roomName).emit('ice-candidate', { ...data, senderId: socket.id });
  });


  socket.on('disconnect', () => {
    console.log('Socket Disconnected:', socket.id);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Jamindan Emergency Response API server running on port ${PORT}`);
  console.log(`MySQL database connected successfully`);
  console.log(`Socket.IO Signaling Server running`);
  console.log(`Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`====================================================`);
});
