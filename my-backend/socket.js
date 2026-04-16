const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('No token provided for socket connection');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      console.log(`✅ Socket authenticated for user: ${user.email}`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user?.email || 'Unknown'} (${socket.id})`);
    
    // Join user's personal room
    if (socket.user && socket.user._id) {
      const roomName = socket.user._id.toString();
      socket.join(roomName);
      console.log(`📌 User ${socket.user.email} joined room: ${roomName}`);
    }
    
    // Handle typing event
    socket.on('typing', ({ receiverId, isTyping }) => {
      if (receiverId && socket.user) {
        socket.to(receiverId.toString()).emit('user_typing', {
          userId: socket.user._id,
          isTyping
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user?.email || 'Unknown'} (${socket.id})`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };