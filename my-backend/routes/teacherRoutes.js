const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// Lấy tất cả giảng viên
router.get('/', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy giảng viên theo ID
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Không tìm thấy giảng viên' });
    }
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tạo giảng viên mới
router.post('/', async (req, res) => {
  try {
    console.log('Received teacher data:', req.body);
    
    // Kiểm tra các field bắt buộc
    const requiredFields = ['name', 'teacherCode', 'email', 'phone', 'faculty', 'major', 'password'];
    for (let field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Thiếu trường bắt buộc: ${field}`
        });
      }
    }
    
    // Kiểm tra mã giảng viên đã tồn tại
    const existingCode = await Teacher.findOne({ teacherCode: req.body.teacherCode.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảng viên đã tồn tại!'
      });
    }
    
    // Kiểm tra email đã tồn tại
    const existingEmail = await Teacher.findOne({ email: req.body.email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng!'
      });
    }
    
    // Tạo giảng viên mới với đầy đủ các trường
    const teacher = new Teacher({
      name: req.body.name.trim(),
      teacherCode: req.body.teacherCode.trim().toUpperCase(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone.trim(),
      faculty: req.body.faculty,
      major: req.body.major,
      degree: req.body.degree || 'Thạc sĩ',
      position: req.body.position || 'Giảng viên',
      startDate: req.body.startDate || Date.now(),
      password: req.body.password, // ✅ THÊM password
      avatar: req.body.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      isLocked: false
    });
    
    const newTeacher = await teacher.save();
    
    // Không trả về password
    const teacherResponse = newTeacher.toObject();
    delete teacherResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Thêm giảng viên thành công',
      data: teacherResponse
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    
    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
// server/routes/teacherRoutes.js

// Cập nhật giảng viên
router.put('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy giảng viên' 
      });
    }

    // Kiểm tra mã giảng viên trùng (nếu thay đổi)
    if (req.body.teacherCode && req.body.teacherCode !== teacher.teacherCode) {
      const existingCode = await Teacher.findOne({ 
        teacherCode: req.body.teacherCode.toUpperCase() 
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảng viên đã tồn tại!'
        });
      }
    }
    
    // Kiểm tra email trùng (nếu thay đổi)
    if (req.body.email && req.body.email.toLowerCase() !== teacher.email) {
      const existingEmail = await Teacher.findOne({ 
        email: req.body.email.toLowerCase() 
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng!'
        });
      }
    }

    // Cập nhật các trường
    teacher.name = req.body.name || teacher.name;
    teacher.teacherCode = req.body.teacherCode ? req.body.teacherCode.toUpperCase() : teacher.teacherCode;
    teacher.email = req.body.email ? req.body.email.toLowerCase() : teacher.email;
    teacher.phone = req.body.phone || teacher.phone;
    teacher.faculty = req.body.faculty || teacher.faculty;
    teacher.major = req.body.major || teacher.major;
    teacher.degree = req.body.degree || teacher.degree;
    teacher.position = req.body.position || teacher.position;
    teacher.startDate = req.body.startDate || teacher.startDate;
    
    // Cập nhật password nếu có
    if (req.body.password) {
      teacher.password = req.body.password;
    }
    
    teacher.updatedAt = Date.now();

    const updatedTeacher = await teacher.save();
    
    // Không trả về password
    const teacherResponse = updatedTeacher.toObject();
    delete teacherResponse.password;
    
    res.json({
      success: true,
      message: 'Cập nhật giảng viên thành công',
      data: teacherResponse
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
});
// server/routes/teacherRoutes.js
// ... các route hiện có

// Khóa/mở khóa giảng viên
// Khóa/mở khóa giảng viên (phiên bản đơn giản không cần user)
// server/routes/teacherRoutes.js
router.put('/:id/toggle-lock', async (req, res) => {
  try {
    console.log('Toggle lock called for ID:', req.params.id);
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy giảng viên' 
      });
    }

    // Toggle trạng thái khóa
    const newLockStatus = !teacher.isLocked;
    teacher.isLocked = newLockStatus;
    
    // Cập nhật thời gian nếu khóa
    if (newLockStatus) {
      teacher.lockedAt = Date.now();
      teacher.lockReason = req.body.reason || 'Tài khoản bị khóa bởi quản trị viên';
      // BỎ DÒNG NÀY: teacher.lockedBy = req.user ? req.user._id : null;
    } else {
      teacher.lockedAt = null;
      teacher.lockReason = '';
      // BỎ DÒNG NÀY: teacher.lockedBy = null;
    }
    
    teacher.updatedAt = Date.now();
    const updatedTeacher = await teacher.save();
    
    res.json({
      success: true,
      message: newLockStatus 
        ? 'Đã khóa tài khoản giảng viên' 
        : 'Đã mở khóa tài khoản giảng viên',
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error('Error in toggle-lock:', error);
    res.status(400).json({ 
      success: false,
      message: error.message
    });
  
  }
});

// GET teacher by teacherCode
router.get('/code/:teacherCode', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ 
      teacherCode: req.params.teacherCode 
    });
    
    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy giảng viên' 
      });
    }
    
    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// API để khóa với lý do cụ thể
router.put('/:id/lock', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Không tìm thấy giảng viên' });
    }

    teacher.isLocked = true;
    teacher.lockedAt = Date.now();
    teacher.lockReason = req.body.reason || 'Tài khoản bị khóa bởi quản trị viên';
    teacher.lockedBy = req.user ? req.user._id : null;
    teacher.updatedAt = Date.now();
    
    const updatedTeacher = await teacher.save();
    
    res.json({
      message: 'Đã khóa tài khoản giảng viên',
      teacher: updatedTeacher
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// API để mở khóa
router.put('/:id/unlock', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: 'Không tìm thấy giảng viên' });
    }

    teacher.isLocked = false;
    teacher.lockedAt = null;
    teacher.lockReason = '';
    teacher.lockedBy = null;
    teacher.updatedAt = Date.now();
    
    const updatedTeacher = await teacher.save();
    
    res.json({
      message: 'Đã mở khóa tài khoản giảng viên',
      teacher: updatedTeacher
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

