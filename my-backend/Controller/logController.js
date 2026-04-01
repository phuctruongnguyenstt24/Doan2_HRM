const Log = require('../models/accessLog');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Helper function to create a log entry
 * Dùng trong các controller khác khi cần ghi log
 */
exports.createLog = async (userId, action, options = {}) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User ${userId} not found for logging`);
      return null;
    }

    const logData = {
      userId,
      username: user.name || user.email.split('@')[0],
      userEmail: user.email,
      action,
      description: options.description || '',
      ipAddress: options.ipAddress || '0.0.0.0',
      userAgent: options.userAgent || '',
      status: options.status || 'success',
      metadata: options.metadata || {}
    };

    const log = await Log.create(logData);
    return log;
  } catch (error) {
    console.error('Error creating log:', error);
    return null;
  }
};

 
exports.getStats = async (req, res) => {
  try {
    // Tổng số log
    const totalLogs = await AccessLog.countDocuments();

    // Theo status
    const success = await AccessLog.countDocuments({ status: 'success' });
    const failed = await AccessLog.countDocuments({ status: 'failed' });
    const warning = await AccessLog.countDocuments({ status: 'warning' });

    // Theo action
    const loginCount = await AccessLog.countDocuments({ action: 'login' });
    const apiCallCount = await AccessLog.countDocuments({ action: 'api_call' });

    // Số IP unique
    const uniqueIPs = await AccessLog.distinct('ipAddress');

    res.json({
      totalLogs,
      statusStats: {
        success,
        failed,
        warning
      },
      actionStats: {
        login: loginCount,
        api_call: apiCallCount
      },
      uniqueIPCount: uniqueIPs.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Lấy danh sách logs với phân trang và filter
 * GET /api/users-permissions/access-log
 */
exports.getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      userId,
      userEmail,
      action,
      status
    } = req.query;

    // Build filter object
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        // Thêm 1 ngày để bao gồm cả ngày endDate
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filter.timestamp.$lt = end;
      }
    }

    // User ID filter
    if (userId) {
      // Kiểm tra nếu userId hợp lệ
      if (mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = new mongoose.Types.ObjectId(userId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'User ID không hợp lệ'
        });
      }
    }

    // User Email filter
    if (userEmail) {
      filter.userEmail = { $regex: userEmail, $options: 'i' };
    }

    // Action filter
    if (action) {
      filter.action = action;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Get total count
    const totalCount = await Log.countDocuments(filter);

    // Get logs with pagination
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log._id,
      userId: log.userId,
      username: log.username,
      userEmail: log.userEmail,
      action: log.action,
      description: log.description,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      status: log.status,
      timestamp: log.timestamp,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    }));

    res.json({
      success: true,
      logs: formattedLogs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount,
      hasMore: skip + logs.length < totalCount
    });

  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử truy cập'
    });
  }
};

/**
 * Lấy thống kê logs
 * GET /api/users-permissions/access-log/statistics
 */
exports.getLogStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filter.timestamp.$lt = end;
      }
    }

    // Get total logs count
    const totalLogs = await Log.countDocuments(filter);

    // Get statistics by action
    const actionStats = await Log.aggregate([
      { $match: filter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get statistics by status
    const statusStats = await Log.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get login statistics
    const loginStats = await Log.aggregate([
      { 
        $match: { 
          ...filter,
          action: 'login' 
        } 
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get top 5 active users
    const topUsers = await Log.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: '$userId', 
          username: { $first: '$username' },
          email: { $first: '$userEmail' },
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Get hourly distribution (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const hourlyStats = await Log.aggregate([
      { 
        $match: { 
          ...filter,
          timestamp: { $gte: last24Hours }
        } 
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1, '_id.hour': -1 } }
    ]);

    res.json({
      success: true,
      statistics: {
        totalLogs,
        actionStats,
        statusStats,
        loginStats,
        topUsers,
        hourlyStats
      }
    });

  } catch (error) {
    console.error('Error getting log statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê'
    });
  }
};

/**
 * Xóa logs cũ (older than 90 days)
 * DELETE /api/users-permissions/access-log/cleanup
 */
exports.clearOldLogs = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await Log.deleteMany({
      timestamp: { $lt: ninetyDaysAgo }
    });

    // Tạo log về việc xóa
    if (req.user && result.deletedCount > 0) {
      await exports.createLog(req.user._id, 'delete', {
        description: `Đã xóa ${result.deletedCount} bản ghi log cũ hơn 90 ngày`,
        status: 'success'
      });
    }

    res.json({
      success: true,
      message: `Đã xóa ${result.deletedCount} bản ghi cũ`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error clearing old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bản ghi cũ'
    });
  }
};