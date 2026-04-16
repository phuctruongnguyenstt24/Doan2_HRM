// server/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index cho query nhanh
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, read: 1 });
messageSchema.index({ createdAt: -1 });

// Method để đánh dấu đã đọc
messageSchema.statics.markAsRead = async function(senderId, receiverId) {
  return await this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      read: false
    },
    {
      read: true,
      readAt: new Date()
    }
  );
};

// Method lấy số tin nhắn chưa đọc
messageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    receiver: userId,
    read: false,
    isDeleted: false
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;