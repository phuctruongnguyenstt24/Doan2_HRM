// backend/routes/adminScheduleRoutes.js
const express = require('express');
const router = express.Router();
const Schedule = require('../models/managerschedule');
const Teacher = require('../models/Teacher');
const Course = require('../models/TrainingProgram');
const Notification = require('../models/Notification');

// Lấy danh sách lịch (có filter)
router.get('/admin/schedule', async (req, res) => {
  try {
    const { startDate, endDate, teacherId, courseId, teachingType, status } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (teacherId) query.teacherId = teacherId;
    if (courseId) query.courseId = courseId;
    if (teachingType && teachingType !== 'all') query.teachingType = teachingType;
    if (status && status !== 'all') query.status = status;
    
    const schedule = await Schedule.find(query)
      .populate('teacherId', 'name email faculty')
      .populate('courseId', 'name code credits')
      .sort({ date: 1, startTime: 1 });
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thêm lịch mới
router.post('/admin/schedule', async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    
    // Populate thông tin
    await schedule.populate('teacherId', 'name email');
    await schedule.populate('courseId', 'name code');
    
    res.json({ success: true, data: schedule, message: 'Thêm lịch thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật lịch
router.put('/admin/schedule/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('teacherId', 'name email')
     .populate('courseId', 'name code');
    
    res.json({ success: true, data: schedule, message: 'Cập nhật lịch thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa lịch
router.delete('/admin/schedule/:id', async (req, res) => {
  try {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Xóa lịch thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo lịch hàng loạt
router.post('/admin/schedule/bulk', async (req, res) => {
  try {
    const { teacherId, courseId, className, room, teachingType, dayOfWeek, weeks, startTime, endTime, periods } = req.body;
    
    const schedules = [];
    const today = new Date();
    let currentDate = new Date();
    
    // Tìm ngày đầu tiên của tuần hiện tại có đúng thứ mong muốn
    while (currentDate.getDay() !== dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    for (let i = 0; i < weeks; i++) {
      const scheduleDate = new Date(currentDate);
      scheduleDate.setDate(currentDate.getDate() + (i * 7));
      
      schedules.push({
        teacherId,
        courseId,
        className,
        date: scheduleDate,
        startTime,
        endTime,
        room,
        teachingType,
        periods,
        status: 'scheduled'
      });
    }
    
    const result = await Schedule.insertMany(schedules);
    res.json({ success: true, data: result, message: `Tạo ${result.length} lịch thành công` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Sao chép lịch từ tuần trước
router.post('/admin/schedule/copy-week', async (req, res) => {
  try {
    const { sourceWeekStart, targetWeekStart, teacherId } = req.body;
    
    const sourceStart = new Date(sourceWeekStart);
    const sourceEnd = new Date(sourceWeekStart);
    sourceEnd.setDate(sourceEnd.getDate() + 6);
    
    const query = {
      date: { $gte: sourceStart, $lte: sourceEnd }
    };
    if (teacherId) query.teacherId = teacherId;
    
    const sourceSchedules = await Schedule.find(query);
    const newSchedules = [];
    
    const targetStart = new Date(targetWeekStart);
    const dayDiff = targetStart.getDate() - sourceStart.getDate();
    
    for (const schedule of sourceSchedules) {
      const newDate = new Date(schedule.date);
      newDate.setDate(newDate.getDate() + dayDiff);
      
      newSchedules.push({
        teacherId: schedule.teacherId,
        courseId: schedule.courseId,
        className: schedule.className,
        date: newDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        teachingType: schedule.teachingType,
        periods: schedule.periods,
        status: 'scheduled'
      });
    }
    
    const result = await Schedule.insertMany(newSchedules);
    res.json({ success: true, data: result, message: `Sao chép ${result.length} lịch thành công` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Gửi thông báo cho giảng viên
router.post('/admin/schedule/notify', async (req, res) => {
  try {
    const { scheduleId, teacherId, action } = req.body;
    
    let message = '';
    switch (action) {
      case 'create':
        message = 'Bạn có lịch giảng dạy mới. Vui lòng kiểm tra lịch trình.';
        break;
      case 'update':
        message = 'Lịch giảng dạy của bạn đã được cập nhật. Vui lòng kiểm tra lại.';
        break;
      case 'delete':
        message = 'Một lịch giảng dạy đã bị hủy. Vui lòng kiểm tra lịch trình của bạn.';
        break;
      default:
        message = 'Có thay đổi trong lịch giảng dạy của bạn.';
    }
    
    const notification = new Notification({
      teacherId,
      scheduleId,
      type: 'schedule_change',
      message,
      createdAt: new Date()
    });
    
    await notification.save();
    res.json({ success: true, message: 'Đã gửi thông báo' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API cho giảng viên lấy lịch
router.get('/teacher/schedule', async (req, res) => {
  try {
    const { teacherId, startDate, endDate, type } = req.query;
    
    const query = {
      teacherId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (type && type !== 'all') {
      query.teachingType = type;
    }
    
    const schedule = await Schedule.find(query)
      .populate('courseId', 'name code credits')
      .sort({ date: 1, startTime: 1 });
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy thông báo cho giảng viên
router.get('/teacher/schedule/notifications', async (req, res) => {
  try {
    const { teacherId } = req.query;
    const notifications = await Notification.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;