const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Bạn không có quyền truy cập' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
};

// Lấy danh sách lương
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, month, year, department, status, search } = req.query;

    const query = {};

    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (department && department !== 'all') {
      const users = await User.find({ department }).select('_id');
      const userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        query.userId = { $in: userIds };
      }
    }

    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      if (userIds.length > 0) {
        query.userId = { $in: userIds };
      }
    }

    const skip = (page - 1) * limit;

    const salaries = await Salary.find(query)
      .populate('userId', 'fullName employeeId email department position avatar')
      .populate('calculatedBy', 'fullName')
      .populate('approvedBy', 'fullName')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Salary.countDocuments(query);

    // Thống kê tổng lương
    const totalSalary = await Salary.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalSalary' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: salaries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit: parseInt(limit)
      },
      summary: {
        totalSalary: totalSalary[0]?.total || 0,
        totalRecords: totalSalary[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching salaries:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
});

// Tính lương cho nhân viên
router.post('/calculate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, month, year } = req.body;

    if (!userId || !month || !year) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin' 
      });
    }

    // Kiểm tra user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy nhân viên' 
      });
    }

    // Kiểm tra đã tính lương chưa
    const existingSalary = await Salary.findOne({ userId, month, year });
    if (existingSalary) {
      return res.status(400).json({ 
        success: false,
        message: 'Lương tháng này đã được tính' 
      });
    }

    // Lấy dữ liệu chấm công trong tháng
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Tính toán các chỉ số
    const stats = {
      workingDays: 0,
      totalHours: 0,
      overtimeHours: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      lateDays: 0,
      absentDays: 0
    };

    attendances.forEach(att => {
      switch (att.status) {
        case 'present':
          stats.workingDays++;
          stats.totalHours += att.workingHours || 0;
          stats.overtimeHours += att.overtime || 0;
          break;
        case 'late':
          stats.workingDays++;
          stats.totalHours += att.workingHours || 0;
          stats.lateDays++;
          break;
        case 'leave':
          if (att.leaveType === 'paid') {
            stats.paidLeaveDays++;
            stats.totalHours += 8; // Mặc định 8h cho ngày nghỉ có lương
          } else {
            stats.unpaidLeaveDays++;
          }
          break;
        case 'absent':
          stats.absentDays++;
          break;
        case 'half-day':
          stats.workingDays += 0.5;
          stats.totalHours += (att.workingHours || 4);
          break;
      }
    });

    // Tạo bản ghi lương
    const salary = new Salary({
      userId,
      month,
      year,
      basicSalary: user.hourlyRate * 8 * 22, // Lương cơ bản 22 ngày công
      hourlyRate: user.hourlyRate,
      overtimeRate: user.overtimeRate || 1.5,
      workingDays: stats.workingDays,
      totalHours: stats.totalHours,
      overtimeHours: stats.overtimeHours,
      paidLeaveDays: stats.paidLeaveDays,
      unpaidLeaveDays: stats.unpaidLeaveDays,
      lateDays: stats.lateDays,
      absentDays: stats.absentDays,
      calculatedBy: req.user._id,
      status: 'calculated'
    });

    await salary.save();

    res.json({
      success: true,
      message: 'Tính lương thành công',
      data: salary
    });

  } catch (error) {
    console.error('Error calculating salary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
});

// Tính lương hàng loạt
router.post('/calculate-bulk', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { month, year, departmentId } = req.body;

    // Lấy danh sách nhân viên
    const query = { isActive: true };
    if (departmentId && departmentId !== 'all') {
      query.department = departmentId;
    }

    const users = await User.find(query).select('_id hourlyRate overtimeRate');

    const results = {
      success: [],
      failed: []
    };

    for (const user of users) {
      try {
        // Kiểm tra đã tính lương chưa
        const existing = await Salary.findOne({ 
          userId: user._id, 
          month, 
          year 
        });

        if (existing) {
          results.failed.push({
            userId: user._id,
            reason: 'Đã tính lương'
          });
          continue;
        }

        // Lấy dữ liệu chấm công
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const attendances = await Attendance.find({
          userId: user._id,
          date: { $gte: startDate, $lte: endDate }
        });

        // Tính toán (giống trên)
        const stats = {
          workingDays: 0,
          totalHours: 0,
          overtimeHours: 0,
          paidLeaveDays: 0,
          unpaidLeaveDays: 0,
          lateDays: 0,
          absentDays: 0
        };

        attendances.forEach(att => {
          // ... logic tính toán giống trên
        });

        const salary = new Salary({
          userId: user._id,
          month,
          year,
          basicSalary: user.hourlyRate * 8 * 22,
          hourlyRate: user.hourlyRate,
          overtimeRate: user.overtimeRate || 1.5,
          workingDays: stats.workingDays,
          totalHours: stats.totalHours,
          overtimeHours: stats.overtimeHours,
          paidLeaveDays: stats.paidLeaveDays,
          unpaidLeaveDays: stats.unpaidLeaveDays,
          lateDays: stats.lateDays,
          absentDays: stats.absentDays,
          calculatedBy: req.user._id,
          status: 'calculated'
        });

        await salary.save();
        results.success.push(user._id);

      } catch (error) {
        results.failed.push({
          userId: user._id,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Đã tính lương thành công cho ${results.success.length} nhân viên`,
      results
    });

  } catch (error) {
    console.error('Error bulk calculating salary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
});

// Cập nhật trạng thái lương
router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, bankAccount, notes } = req.body;

    const salary = await Salary.findById(id);
    if (!salary) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy bản ghi lương' 
      });
    }

    salary.status = status;
    salary.notes = notes || salary.notes;

    if (status === 'paid') {
      salary.paymentDate = new Date();
      salary.paymentMethod = paymentMethod || 'bank_transfer';
      salary.bankAccount = bankAccount || salary.bankAccount;
      salary.approvedBy = req.user._id;
      salary.approvedAt = new Date();
    }

    await salary.save();

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: salary
    });

  } catch (error) {
    console.error('Error updating salary status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
});

module.exports = router;