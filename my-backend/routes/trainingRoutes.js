// routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const TrainingProgram = require('../models/TrainingProgram');
const Enrollment = require('../models/Enrollment');
const LecturerSchedule = require('../models/LecturerSchedule');
const Teacher = require('../models/Teacher');

// ==================== QUẢN LÝ CHƯƠNG TRÌNH ====================

// Lấy tất cả chương trình
router.get('/programs', async (req, res) => {
  try {
    const { status, type, category, search } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const programs = await TrainingProgram.find(filter)
      .populate('instructors', 'name teacherCode email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: programs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy chi tiết chương trình
router.get('/programs/:id', async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id)
      .populate('instructors', 'name teacherCode email phone degree');

    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình' });
    }

    // Lấy danh sách học viên đã đăng ký
    const enrollments = await Enrollment.find({ program: program._id })
      .populate('teacher', 'name teacherCode email phone faculty');

    res.json({
      success: true,
      data: { program, enrollments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo chương trình mới
router.post('/programs', async (req, res) => {
  try {
    // Kiểm tra mã trùng
    const existing = await TrainingProgram.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Mã chương trình đã tồn tại'
      });
    }

    const program = new TrainingProgram({
      ...req.body,
      code: req.body.code.toUpperCase()
    });

    const savedProgram = await program.save();

    res.status(201).json({
      success: true,
      message: 'Tạo chương trình thành công',
      data: savedProgram
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật chương trình
router.put('/programs/:id', async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình' });
    }

    // Kiểm tra mã trùng nếu thay đổi
    if (req.body.code && req.body.code.toUpperCase() !== program.code) {
      const existing = await TrainingProgram.findOne({ code: req.body.code.toUpperCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Mã chương trình đã tồn tại'
        });
      }
      program.code = req.body.code.toUpperCase();
    }

    Object.assign(program, req.body);
    program.updatedAt = Date.now();

    const updatedProgram = await program.save();

    res.json({
      success: true,
      message: 'Cập nhật chương trình thành công',
      data: updatedProgram
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa chương trình
router.delete('/programs/:id', async (req, res) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình' });
    }

    // Kiểm tra có học viên đăng ký không
    const enrollments = await Enrollment.countDocuments({ program: program._id });
    if (enrollments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa vì đã có học viên đăng ký'
      });
    }

    await program.deleteOne();

    res.json({
      success: true,
      message: 'Xóa chương trình thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== QUẢN LÝ ĐĂNG KÝ ====================

// Đăng ký chương trình
router.post('/enroll', async (req, res) => {
  try {
    const { programId, teacherId } = req.body;

    // Kiểm tra chương trình tồn tại
    const program = await TrainingProgram.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương trình' });
    }

    // Kiểm tra giảng viên tồn tại
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    }

    // Kiểm tra đã đăng ký chưa
    const existing = await Enrollment.findOne({ program: programId, teacher: teacherId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Giảng viên đã đăng ký chương trình này' });
    }

    // Kiểm tra số lượng
    const enrolledCount = await Enrollment.countDocuments({ program: programId, status: { $ne: 'Hủy' } });
    if (enrolledCount >= program.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Chương trình đã đủ số lượng học viên' });
    }

    const enrollment = new Enrollment({
      program: programId,
      teacher: teacherId,
      status: 'Đã đăng ký'
    });

    await enrollment.save();

    // Cập nhật số lượng đã đăng ký
    program.enrolledCount = enrolledCount + 1;
    await program.save();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: enrollment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Lấy danh sách đăng ký
router.get('/enrollments', async (req, res) => {
  try {
    const { programId, teacherId, status } = req.query;
    let filter = {};

    if (programId) filter.program = programId;
    if (teacherId) filter.teacher = teacherId;
    if (status) filter.status = status;

    const enrollments = await Enrollment.find(filter)
      .populate('program', 'code name type category startDate endDate')
      .populate('teacher', 'name teacherCode email phone faculty')
      .sort({ registrationDate: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật điểm
router.put('/enrollments/:id/score', async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });
    }

    enrollment.scores = { ...enrollment.scores, ...req.body };
    enrollment.updatedAt = Date.now();

    await enrollment.save();

    res.json({
      success: true,
      message: 'Cập nhật điểm thành công',
      data: enrollment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật điểm danh
router.put('/enrollments/:id/attendance', async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });
    }

    enrollment.attendance.push(req.body);
    enrollment.updatedAt = Date.now();

    await enrollment.save();

    res.json({
      success: true,
      message: 'Cập nhật điểm danh thành công',
      data: enrollment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cấp chứng chỉ
router.put('/enrollments/:id/certificate', async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đăng ký' });
    }

    if (enrollment.scores.total < 50) {
      return res.status(400).json({ success: false, message: 'Học viên chưa đạt yêu cầu để cấp chứng chỉ' });
    }

    enrollment.certificateIssued = {
      issued: true,
      certificateNumber: `CC${Date.now()}${enrollment._id.toString().slice(-4)}`,
      issuedDate: new Date(),
      issuedBy: req.body.issuedBy || 'Phòng Đào tạo'
    };

    enrollment.status = 'Hoàn thành';
    enrollment.updatedAt = Date.now();

    await enrollment.save();

    res.json({
      success: true,
      message: 'Cấp chứng chỉ thành công',
      data: enrollment.certificateIssued
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==================== THỐNG KÊ ====================

// Thống kê chung
router.get('/statistics', async (req, res) => {
  try {
    const totalPrograms = await TrainingProgram.countDocuments();
    const activePrograms = await TrainingProgram.countDocuments({ status: 'Đang mở đăng ký' });
    const ongoingPrograms = await TrainingProgram.countDocuments({ status: 'Đang diễn ra' });
    const completedPrograms = await TrainingProgram.countDocuments({ status: 'Đã kết thúc' });

    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ status: 'Hoàn thành' });
    const inProgressEnrollments = await Enrollment.countDocuments({ status: 'Đang học' });

    const certificatesIssued = await Enrollment.countDocuments({ 'certificateIssued.issued': true });

    res.json({
      success: true,
      data: {
        programs: {
          total: totalPrograms,
          active: activePrograms,
          ongoing: ongoingPrograms,
          completed: completedPrograms
        },
        enrollments: {
          total: totalEnrollments,
          completed: completedEnrollments,
          inProgress: inProgressEnrollments,
          certificatesIssued
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Thống kê theo khoa
router.get('/statistics/faculty', async (req, res) => {
  try {
    const facultyStats = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacher',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      { $unwind: '$teacher' },
      {
        $group: {
          _id: '$teacher.faculty',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Hoàn thành'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: facultyStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//Dành cho giảng viên
// ==================== API CHO GIẢNG VIÊN ====================
 
// ==================== QUẢN LÝ LỊCH GIẢNG VIÊN ====================


// Lấy danh sách lịch của giảng viên
router.get('/lecturer-schedules', async (req, res) => {
  try {
    const { lecturerId, programId, month, year, startDate, endDate, status } = req.query;
    let filter = {};

    if (lecturerId) filter.lecturerId = lecturerId;
    if (programId) filter.programId = programId;
    if (status) filter.status = status;

    // Lọc theo tháng/năm
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      filter.date = { $gte: start, $lte: end };
    }

    // Lọc theo khoảng ngày
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await LecturerSchedule.find(filter)
      .populate('lecturerId', 'name teacherCode email phone faculty')
      .populate('programId', 'code name type category duration credits')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy chi tiết một lịch
router.get('/lecturer-schedules/:id', async (req, res) => {
  try {
    const schedule = await LecturerSchedule.findById(req.params.id)
      .populate('lecturerId', 'name teacherCode email phone faculty')
      .populate('programId', 'code name type category duration credits');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo lịch mới
router.post('/lecturer-schedules', async (req, res) => {
  try {
    const {
      programId,
      lecturerId,
      title,
      date,
      startTime,
      endTime,
      location,
      room,
      sessionType,
      maxStudents,
      currentStudents,
      description,
      requirements,
      materials,
      status
    } = req.body;

    // Kiểm tra giảng viên tồn tại
    const teacher = await Teacher.findById(lecturerId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    }

    // Kiểm tra chương trình tồn tại (nếu có)
    let program = null;
    let courseCode = null;
    let courseName = null;

    if (programId) {
      program = await TrainingProgram.findById(programId);
      if (program) {
        courseCode = program.code;
        courseName = program.name;
      }
    }

    // Kiểm tra trùng lịch
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    const conflictingSchedule = await LecturerSchedule.findOne({
      lecturerId,
      date,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ],
      status: { $ne: 'Cancelled' }
    });

    if (conflictingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Giảng viên đã có lịch vào khung giờ này'
      });
    }

    const schedule = new LecturerSchedule({
      programId: programId || null,
      lecturerId,
      courseCode,
      courseName,
      title,
      date: new Date(date),
      startTime,
      endTime,
      location,
      room,
      sessionType: sessionType || 'Lý thuyết',
      maxStudents: maxStudents || 30,
      currentStudents: currentStudents || 0,
      description: description || '',
      requirements: requirements || '',
      materials: materials || '',
      status: status || 'Scheduled'
    });

    const savedSchedule = await schedule.save();

    // Populate dữ liệu trước khi trả về
    await savedSchedule.populate('lecturerId', 'name teacherCode email phone faculty');
    await savedSchedule.populate('programId', 'code name type category');

    res.status(201).json({
      success: true,
      message: 'Tạo lịch thành công',
      data: savedSchedule
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật lịch
router.put('/lecturer-schedules/:id', async (req, res) => {
  try {
    const schedule = await LecturerSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }

    const {
      title,
      date,
      startTime,
      endTime,
      location,
      room,
      sessionType,
      maxStudents,
      currentStudents,
      description,
      requirements,
      materials,
      status
    } = req.body;

    // Kiểm tra trùng lịch (trừ chính nó)
    if (date && startTime && endTime) {
      const conflictingSchedule = await LecturerSchedule.findOne({
        _id: { $ne: req.params.id },
        lecturerId: schedule.lecturerId,
        date: new Date(date),
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          }
        ],
        status: { $ne: 'Cancelled' }
      });

      if (conflictingSchedule) {
        return res.status(400).json({
          success: false,
          message: 'Giảng viên đã có lịch vào khung giờ này'
        });
      }
    }

    // Cập nhật các trường
    if (title) schedule.title = title;
    if (date) schedule.date = new Date(date);
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;
    if (location) schedule.location = location;
    if (room) schedule.room = room;
    if (sessionType) schedule.sessionType = sessionType;
    if (maxStudents) schedule.maxStudents = maxStudents;
    if (currentStudents !== undefined) schedule.currentStudents = currentStudents;
    if (description !== undefined) schedule.description = description;
    if (requirements !== undefined) schedule.requirements = requirements;
    if (materials !== undefined) schedule.materials = materials;
    if (status) schedule.status = status;

    schedule.updatedAt = Date.now();

    const updatedSchedule = await schedule.save();
    await updatedSchedule.populate('lecturerId', 'name teacherCode email phone faculty');
    await updatedSchedule.populate('programId', 'code name type category');

    res.json({
      success: true,
      message: 'Cập nhật lịch thành công',
      data: updatedSchedule
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa lịch
router.delete('/lecturer-schedules/:id', async (req, res) => {
  try {
    const schedule = await LecturerSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }

    await schedule.deleteOne();

    res.json({
      success: true,
      message: 'Xóa lịch thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Gửi nhắc nhở cho giảng viên
router.post('/lecturer-schedules/:id/remind', async (req, res) => {
  try {
    const schedule = await LecturerSchedule.findById(req.params.id)
      .populate('lecturerId', 'name email phone');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }

    // Cập nhật trạng thái đã gửi nhắc
    schedule.reminderSent = true;
    schedule.reminderSentAt = new Date();
    await schedule.save();

    // TODO: Gửi email/SMS thực tế ở đây
    // Ví dụ: sendEmail(schedule.lecturerId.email, 'Nhắc nhở lịch dạy', generateReminderContent(schedule));

    res.json({
      success: true,
      message: `Đã gửi nhắc nhở đến giảng viên ${schedule.lecturerId.name}`,
      data: {
        sentTo: schedule.lecturerId.email,
        schedule: {
          title: schedule.title,
          date: schedule.date,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          location: schedule.location,
          room: schedule.room
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy lịch theo tuần
router.get('/lecturer-schedules/week/:lecturerId', async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { weekOffset = 0 } = req.query;

    // Tính ngày đầu tuần (Thứ 2)
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const schedules = await LecturerSchedule.find({
      lecturerId,
      date: { $gte: monday, $lte: sunday },
      status: { $ne: 'Cancelled' }
    })
      .populate('programId', 'code name')
      .sort({ date: 1, startTime: 1 });

    // Nhóm theo ngày
    const schedulesByDay = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      schedulesByDay[dateStr] = [];
    }

    schedules.forEach(schedule => {
      const dateStr = schedule.date.toISOString().split('T')[0];
      if (schedulesByDay[dateStr]) {
        schedulesByDay[dateStr].push(schedule);
      }
    });

    res.json({
      success: true,
      data: {
        weekStart: monday,
        weekEnd: sunday,
        schedules: schedulesByDay
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật trạng thái điểm danh cho buổi học
router.put('/lecturer-schedules/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceList } = req.body; // [{ teacherId, status, note }]

    const schedule = await LecturerSchedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch' });
    }

    // Cập nhật danh sách điểm danh
    schedule.attendance = attendanceList;
    schedule.currentStudents = attendanceList.filter(a => a.status === 'present').length;
    schedule.updatedAt = Date.now();

    await schedule.save();

    res.json({
      success: true,
      message: 'Cập nhật điểm danh thành công',
      data: {
        present: schedule.currentStudents,
        total: schedule.maxStudents,
        attendanceRate: (schedule.currentStudents / schedule.maxStudents * 100).toFixed(1)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Lấy thống kê lịch dạy của giảng viên
router.get('/lecturer-schedules/statistics/:lecturerId', async (req, res) => {
  try {
    const { lecturerId } = req.params;
    const { year, month } = req.query;

    let matchCondition = { lecturerId };
    
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      matchCondition.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await LecturerSchedule.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 3600000] } }
        }
      }
    ]);

    const totalSessions = stats.reduce((sum, s) => sum + s.count, 0);
    const totalHours = stats.reduce((sum, s) => sum + s.totalHours, 0);

    res.json({
      success: true,
      data: {
        totalSessions,
        totalHours,
        breakdown: stats,
        averageHoursPerSession: totalSessions > 0 ? (totalHours / totalSessions).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;