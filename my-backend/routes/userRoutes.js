const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');
const AccessLog = require('../models/accessLog');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware chỉ cho admin truy cập
const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin rights required.' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy danh sách người dùng (chỉ admin)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    
    const query = {};
    
    // Tìm kiếm theo tên hoặc email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Lọc theo role
    if (role) {
      query.role = role;
    }
    
    // Lọc theo status
    if (status) {
      query.isActive = status === 'active';
    }
    
    const skip = (page - 1) * limit;
    
    // Lấy danh sách user (không bao gồm password)
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Đếm tổng số user
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Lấy thống kê
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers: total,
        limit: parseInt(limit)
      },
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy thông tin chi tiết user
router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('department', 'name code'); // Lấy thông tin phòng ban

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Lấy lịch sử truy cập của user với thông tin đầy đủ
    const accessLogs = await AccessLog.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(20);
    
    // Thống kê thêm
    const stats = {
      totalLogs: await AccessLog.countDocuments({ userId: user._id }),
      lastLogin: await AccessLog.findOne({ 
        userId: user._id, 
        action: 'login',
        status: 'success' 
      }).sort({ timestamp: -1 }),
      recentActivity: accessLogs.length
    };
    
    res.json({
      success: true,
      data: {
        user,
        accessLogs,
        stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cập nhật thông tin user
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, role, isActive } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'User updated successfully',
      user 
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Xóa user (soft delete)
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'User deactivated successfully',
      user 
    });
    
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy lịch sử truy cập (admin view)
router.get('/access-logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId = '',
      action = '',
      dateFrom = '',
      dateTo = '',
      status = ''
    } = req.query;
    
    const query = {};
    
    // Lọc theo user
    if (userId) {
      query.userId = userId;
    }
    
    // Lọc theo action
    if (action) {
      query.action = action;
    }
    
    // Lọc theo status
    if (status) {
      query.status = status;
    }
    
    // ⭐ SỬA: Lọc theo thời gian CHÍNH XÁC
    if (dateFrom || dateTo) {
      query.timestamp = {};
      
      if (dateFrom) {
        // Từ 00:00:00 của ngày bắt đầu
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        query.timestamp.$gte = startDate;
      }
      
      if (dateTo) {
        // Đến 23:59:59.999 của ngày kết thúc
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endDate;
      }
    }
    
    const skip = (page - 1) * limit;
    
    // Lấy logs với populate user info
    const logs = await AccessLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await AccessLog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Lấy thống kê
    const stats = await AccessLog.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": -1 } },
      { $limit: 7 }
    ]);
    
    res.json({
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalLogs: total,
        limit: parseInt(limit)
      },
      stats: {
        daily: stats
      }
    });
    
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Lấy thống kê tổng quan
router.get('/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Thống kê user
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { 
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          },
          admins: { 
            $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Thống kê truy cập 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const accessStats = await AccessLog.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            action: "$action"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          actions: {
            $push: {
              action: "$_id.action",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    
    // User hoạt động nhiều nhất
    const topUsers = await AccessLog.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          name: "$user.name",
          email: "$user.email",
          role: "$user.role",
          accessCount: "$count"
        }
      }
    ]);
    
    res.json({
      userStats: userStats[0] || { total: 0, active: 0, admins: 0 },
      accessStats,
      topUsers
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;