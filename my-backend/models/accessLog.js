// models/AccessLog.js
const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'login', 
      'logout', 
      'register',
      'update_user',      // Giữ lại
      'delete_user',      // Giữ lại
      // 'view_users',     // ĐÃ XÓA
      // 'view_user_detail', // ĐÃ XÓA
      // 'view_logs',      // ĐÃ XÓA
     
      'block_ip',
      'manage_contracts',
      'manage_attendance',
      'manage_salary',
     
      'manage_training',
      'manage_trips',
      'other'
    ],
    required: true
  },
  endpoint: {
    type: String
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  details: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
accessLogSchema.index({ userId: 1, timestamp: -1 });
accessLogSchema.index({ action: 1 });
accessLogSchema.index({ timestamp: -1 });
accessLogSchema.index({ ipAddress: 1 });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;