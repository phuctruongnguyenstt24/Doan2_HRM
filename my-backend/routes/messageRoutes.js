// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const authMiddleware = require('../middleware/authMiddleware');

// Lấy danh sách nhân viên cho admin
router.get('/employees', authMiddleware, async (req, res) => {
    try {
        const employees = await User.find(
            { role: { $in: ['user', 'manager'] }, isActive: true },
            'name email avatar employeeId role'
        ).sort('name');

        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy danh sách conversation của user
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id,
            isActive: true
        })
            .populate('participants', 'name email avatar role employeeId')
            .sort('-updatedAt');

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy tin nhắn giữa 2 người
router.get('/messages/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ],
            isDeleted: false
        })
            .populate('sender', 'name email avatar role')
            .populate('receiver', 'name email avatar role')
            .sort('-createdAt')
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // Đánh dấu tin nhắn đã đọc
        await Message.markAsRead(userId, req.user._id);

        // Reset unread count trong conversation
        const conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, userId] }
        });

        if (conversation) {
            await conversation.resetUnreadCount(req.user._id);
        }

        res.json({
            messages: messages.reverse(),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Tổng số tin nhắn
router.get('/stats/total', authMiddleware, async (req, res) => {
  try {
    const total = await Message.countDocuments();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
 

// Đánh dấu đã đọc tin nhắn từ user
router.post('/mark-as-read/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Đánh dấu tin nhắn đã đọc
        await Message.updateMany(
            {
                sender: userId,
                receiver: req.user._id,
                isRead: false,
                isDeleted: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );
        
        // Reset unread count trong conversation
        const conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, userId] }
        });
        
        if (conversation) {
            await conversation.resetUnreadCount(req.user._id);
        }
        
        res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Gửi tin nhắn
router.post('/send', authMiddleware, async (req, res) => {
    try {
        const { receiverId, content, attachments = [] } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Thiếu thông tin tin nhắn' });
        }

        // Kiểm tra receiver tồn tại
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Người nhận không tồn tại' });
        }

        // Tạo tin nhắn mới
        const message = await Message.create({
            sender: req.user._id,
            receiver: receiverId,
            content,
            attachments
        });

        // Cập nhật conversation
        await Conversation.updateConversation(
            [req.user._id, receiverId],
            content,
            req.user._id
        );

        // Populate thông tin người gửi
        await message.populate('sender', 'name email avatar role');
        await message.populate('receiver', 'name email avatar role');

        // Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(receiverId.toString()).emit('new_message', message);
            io.to(req.user._id.toString()).emit('message_sent', message);
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy số tin nhắn chưa đọc
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const unreadCount = await Message.getUnreadCount(req.user._id);
        res.json({ unreadCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Xóa tin nhắn (soft delete)
router.delete('/message/:messageId', authMiddleware, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
        }

        // Chỉ cho phép người gửi xóa
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Không có quyền xóa tin nhắn này' });
        }

        message.isDeleted = true;
        await message.save();

        res.json({ message: 'Đã xóa tin nhắn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy danh sách admin cho nhân viên
router.get('/admins', authMiddleware, async (req, res) => {
    try {
        const admins = await User.find(
            { role: { $in: ['admin', 'manager'] }, isActive: true },
            'name email avatar employeeId role'
        ).sort('name');

        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy danh sách giảng viên cho nhân viên
router.get('/teachers', authMiddleware, async (req, res) => {
    try {
        const teachers = await Teacher.find(
            { isLocked: false },
            'name teacherCode email phone faculty major degree position avatar'
        ).sort('name');

        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy danh sách nhân viên cho giảng viên
router.get('/staffs', authMiddleware, async (req, res) => {  // Đổi protect thành authMiddleware
  try {
    const staffs = await User.find(
      { role: { $in: ['user', 'manager', 'admin'] }, isActive: true },
      'name email avatar employeeId role'
    ).sort('name');
    
    res.json(staffs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;