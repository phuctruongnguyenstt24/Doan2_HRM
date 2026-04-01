// routes/trainingRoutes.js
const express = require('express');
const router = express.Router();
const TrainingProgram = require('../models/TrainingProgram');
const Enrollment = require('../models/Enrollment');
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
// routes/trainingRoutes.js (thêm vào cuối file, trước module.exports)

// routes/trainingRoutes.js (phần API cho giảng viên)

// ==================== API CHO GIẢNG VIÊN ====================

// Helper: Lấy teacher từ teacherCode




module.exports = router;