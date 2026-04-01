// server/models/Teacher.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  // ... các trường hiện có

 
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên giảng viên'],
    trim: true
  },
  teacherCode: {
    type: String,
    required: [true, 'Vui lòng nhập mã giảng viên'],
    unique: true,
    uppercase: true
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Vui lòng nhập email hợp lệ'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    match: [/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6,
    select: false
  },
  faculty: {
    type: String,
    required: [true, 'Vui lòng chọn khoa']
  },
  major: {
    type: String,
    required: [true, 'Vui lòng chọn chuyên ngành']
  },
  degree: {
    type: String,
    enum: ['Cử nhân', 'Thạc sĩ', 'Tiến sĩ', 'Phó giáo sư', 'Giáo sư'],
    default: 'Thạc sĩ'
  },
  position: {
    type: String,
    enum: ['Giảng viên', 'Giảng viên chính', 'Trợ lý giáo sư', 'Phó giáo sư', 'Giáo sư', 'Trưởng bộ môn', 'Trưởng khoa'],
    default: 'Giảng viên'
  },
  
  // Thêm trạng thái khóa
  isLocked: {
    type: Boolean,
    default: false
  },
  
  // Lý do khóa (nếu có)
  lockReason: {
    type: String,
    default: ''
  },
  
  // Ngày khóa
  lockedAt: {
    type: Date
  },
  
  // Ai đã khóa
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  startDate: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String,
    default: 'https://i.pravatar.cc/150'
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

module.exports = mongoose.model('Teacher', teacherSchema);