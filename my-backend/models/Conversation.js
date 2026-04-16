// server/models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  lastMessageSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

// Method cập nhật conversation
conversationSchema.statics.updateConversation = async function(participants, message, senderId) {
  const conversation = await this.findOne({
    participants: { $all: participants }
  });

  if (conversation) {
    // Cập nhật conversation hiện tại
    conversation.lastMessage = message;
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSender = senderId;
    conversation.updatedAt = new Date();
    
    // Tăng unread count cho receiver
    const receiverId = participants.find(p => p.toString() !== senderId.toString());
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    
    await conversation.save();
    return conversation;
  } else {
    // Tạo conversation mới
    const unreadCount = new Map();
    unreadCount.set(participants[1].toString(), 1);
    
    return await this.create({
      participants,
      lastMessage: message,
      lastMessageTime: new Date(),
      lastMessageSender: senderId,
      unreadCount
    });
  }
};

// Method reset unread count
conversationSchema.methods.resetUnreadCount = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;