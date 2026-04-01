// models/TrainingProgram.js
const mongoose = require('mongoose');

const trainingProgramSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Vui lòng nhập mã chương trình'],
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên chương trình'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Đào tạo', 'Bồi dưỡng', 'Nâng cao', 'Chuyên sâu'],
    default: 'Đào tạo'
  },
  category: {
    type: String,
    required: true,
    enum: ['Sư phạm', 'Nghiệp vụ', 'Ngoại ngữ', 'Tin học', 'Quản lý', 'Chuyên môn']
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    comment: 'Thời lượng (giờ)'
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    comment: 'Số tín chỉ'
  },
  fee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    required: true
  },
  objectives: [{
    type: String
  }],
  content: [{
    topic: String,
    hours: Number,
    description: String
  }],
  targetAudience: {
    type: String,
    required: true,
    comment: 'Đối tượng tham gia'
  },
  prerequisites: {
    type: String,
    default: ''
  },
  certificate: {
    type: String,
    required: true,
    enum: ['Chứng chỉ', 'Chứng nhận', 'Văn bằng'],
    default: 'Chứng chỉ'
  },
  maxParticipants: {
    type: Number,
    required: true,
    min: 1,
    default: 30
  },
  minParticipants: {
    type: Number,
    min: 1,
    default: 10
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
    }],
    startTime: String,
    endTime: String,
    location: String
  },
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],
  coordinator: {
    name: String,
    phone: String,
    email: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Đang mở đăng ký', 'Sắp khai giảng', 'Đang diễn ra', 'Đã kết thúc', 'Hủy'],
    default: 'Đang mở đăng ký'
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [{
    user: String,
    rating: Number,
    comment: String,
    date: Date
  }],
  materials: [{
    name: String,
    url: String,
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Validate endDate > startDate
trainingProgramSchema.pre('save', function() {
  if (this.endDate <= this.startDate) {
    throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
  }
  if (this.registrationDeadline >= this.startDate) {
     throw new Error('Hạn đăng ký phải trước ngày khai giảng');
  }
  
});

module.exports = mongoose.model('TrainingProgram', trainingProgramSchema);