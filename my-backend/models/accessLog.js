const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Đã bỏ comment userEmail và userName để đồng bộ với User model
  // Thông tin user sẽ được lấy qua populate từ User model
  action: {
    type: String,
    enum: ['login', 'logout', 'page_view', 'api_call', 'data_update'],
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

// Indexes để tối ưu truy vấn
accessLogSchema.index({ userId: 1, timestamp: -1 });
// Đã xóa index trên userEmail vì không còn field này
accessLogSchema.index({ action: 1 });
accessLogSchema.index({ timestamp: -1 });
accessLogSchema.index({ ipAddress: 1 });

const AccessLog = mongoose.model('AccessLog', accessLogSchema);

module.exports = AccessLog;