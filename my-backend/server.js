const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====================
// MIDDLEWARE - BASIC
// ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====================
// SESSION & PASSPORT
// ====================
app.use(session({
  secret: process.env.JWT_SECRET || 'your_secret_key',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ====================
// DATABASE CONNECTION
// ====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.log(process.env.MONGODB_URI);
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

connectDB();

// ====================
// USER MODEL
// ====================
const User = require('./models/User');

// ====================
// MIDDLEWARE - SET USER FROM TOKEN
// ====================
const jwt = require('jsonwebtoken');

const setUserFromToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Token không hợp lệ hoặc hết hạn - vẫn cho request đi tiếp
  }
  next();
};

app.use(setUserFromToken);

// ====================
// ACCESS LOG MIDDLEWARE - ĐÃ ĐƯỢC TÁCH RA FILE RIÊNG
// ====================
const accessLogMiddleware = require('./middleware/accessLogMiddleware');
app.use(accessLogMiddleware);

// ====================
// CHECK BLOCKED IP MIDDLEWARE
// ====================
const checkBlockedIP = require('./middleware/checkBlockedIP');
app.use(checkBlockedIP);

// ====================
// PASSPORT GOOGLE STRATEGY
// ====================
const GoogleStrategy = require('passport-google-oauth20').Strategy;

console.log('Google OAuth Config:');
console.log('- Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('- Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('- Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  proxy: true
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔵 Google OAuth Profile Received:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName
      });

      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        console.log('✅ User found by Google ID:', user.email);
        return done(null, user);
      }

      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        console.log('✅ User found by email, updating Google ID:', user.email);
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value;
        await user.save();
      } else {
        console.log('🆕 Creating new user from Google OAuth:', profile.emails[0].value);
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0]?.value,
          password: null
        });
      }

      return done(null, user);
    } catch (error) {
      console.error('❌ Google OAuth Error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ====================
// ROUTES IMPORTS
// ====================
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const securityRoutes = require('./routes/securityRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const officeRoutes = require('./routes/offices');
const DepartmentRoutes = require('./routes/departments.js');
const contractRoutes = require('./routes/contractRoutes.js');
const attendanceRoutes = require('./routes/attendance');
const salaryRoutes = require('./routes/salary');
const businessTripRoutes = require('./routes/businessTrip');
const courseRoutes = require('./routes/trainingRoutes');
const messageRoutes = require('./routes/messageRoutes');

// ====================
// ROUTES
// ====================

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is running 🚀',
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Test API
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test successful ✅',
    time: new Date().toISOString()
  });
});

// Test OAuth config
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleOAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});

// Mount các routes (ĐÃ BỎ /api/access-logs route)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users-permissions', userRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/departments', DepartmentRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/business-trips', businessTripRoutes);
app.use('/api/training', courseRoutes);
app.use('/api/messages', messageRoutes);

// Static files cho uploads
app.use('/uploads', express.static(uploadDir));

// Protected routes example
const authMiddleware = require('./middleware/authMiddleware');
app.get('/api/dashboard', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: `Chào mừng ${req.user.name} đến với dashboard`,
    user: req.user,
    dashboardData: {
      stats: {
        employees: 45,
        departments: 8,
        activeProjects: 12,
        attendanceRate: '94%'
      }
    }
  });
});

// ====================
// ERROR HANDLING
// ====================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Lỗi validation dữ liệu',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu đã tồn tại trong hệ thống'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ====================
// CREATE HTTP SERVER
// ====================
const server = require('http').createServer(app);

// ====================
// INITIALIZE SOCKET.IO
// ====================
const { initializeSocket } = require('./socket');
const io = initializeSocket(server);
app.set('io', io);

// ====================
// START SERVER
// ====================
server.listen(PORT, () => {
  console.log('\n===================================');
  console.log('🚀 Server Started Successfully');
  console.log('===================================');
  console.log(`✅ Server URL: http://localhost:${PORT}`);
  console.log(`✅ Socket.IO Server: Running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  console.log('📌 Access Log Middleware: GLOBAL - All requests will be logged');
  console.log('📌 Access Log Features:');
  console.log('   ✅ Auto-login logging');
  console.log('   ✅ User action logging');
  console.log('   ❌ View logs feature: DISABLED');
  console.log('📌 Available Routes:');
  console.log('   GET   /api/test');
  console.log('   GET   /api/auth/config');
  console.log('   POST  /api/auth/register');
  console.log('   POST  /api/auth/login');
  console.log('   GET   /api/auth/google');
  console.log('   GET   /api/auth/google/callback');
  console.log('   GET   /api/auth/me');
  console.log('   GET   /api/contracts');
  console.log('   POST  /api/contracts');
  console.log('   GET   /api/contracts/:id');
  console.log('   PUT   /api/contracts/:id/status');
  console.log('   DELETE /api/contracts/:id');
  console.log('   GET   /api/contracts/search?q=:term');
  console.log('   POST  /api/contracts/check-status');
  console.log('   GET   /api/contracts/stats/summary');
  console.log('   📨 CHAT ROUTES:');
  console.log('   GET   /api/messages/employees');
  console.log('   GET   /api/messages/conversations');
  console.log('   GET   /api/messages/messages/:userId');
  console.log('   POST  /api/messages/send');
  console.log('   GET   /api/messages/unread-count');
  console.log('===================================\n');
});