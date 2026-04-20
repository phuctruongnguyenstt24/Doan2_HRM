// models/LecturerSchedule.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  checkInTime: Date,
  note: String
}, { _id: false });

const lecturerScheduleSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingProgram',
    default: null
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  courseCode: {
    type: String,
    default: ''
  },
  courseName: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: ''
  },
  room: {
    type: String,
    default: ''
  },
  sessionType: {
    type: String,
    enum: ['Lý thuyết', 'Thực hành', 'Thảo luận', 'Kiểm tra', 'Bài tập'],
    default: 'Lý thuyết'
  },
  maxStudents: {
    type: Number,
    default: 30
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  requirements: {
    type: String,
    default: ''
  },
  materials: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  attendance: [attendanceSchema],
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderSentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tối ưu truy vấn
lecturerScheduleSchema.index({ lecturerId: 1, date: 1 });
lecturerScheduleSchema.index({ programId: 1 });
lecturerScheduleSchema.index({ status: 1 });
lecturerScheduleSchema.index({ date: 1 });

// Virtual field: thời lượng buổi học (giờ)
lecturerScheduleSchema.virtual('durationHours').get(function() {
  const start = this.startTime.split(':');
  const end = this.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  return (endMinutes - startMinutes) / 60;
});

// Virtual field: kiểm tra xem buổi học đã kết thúc chưa
lecturerScheduleSchema.virtual('isPast').get(function() {
  const now = new Date();
  const scheduleEnd = new Date(this.date);
  const [hours, minutes] = this.endTime.split(':');
  scheduleEnd.setHours(parseInt(hours), parseInt(minutes));
  return scheduleEnd < now;
});

// Virtual field: kiểm tra buổi học đang diễn ra
lecturerScheduleSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  const scheduleStart = new Date(this.date);
  const scheduleEnd = new Date(this.date);
  const [startHours, startMinutes] = this.startTime.split(':');
  const [endHours, endMinutes] = this.endTime.split(':');
  scheduleStart.setHours(parseInt(startHours), parseInt(startMinutes));
  scheduleEnd.setHours(parseInt(endHours), parseInt(endMinutes));
  return now >= scheduleStart && now <= scheduleEnd;
});

// Middleware: tự động cập nhật updatedAt (đã bỏ next)
lecturerScheduleSchema.pre('save', function() {
  this.updatedAt = Date.now();
  
  // Tự động cập nhật status dựa trên thời gian
  if (this.isOngoing && this.status === 'Scheduled') {
    this.status = 'Ongoing';
  }
  if (this.isPast && this.status === 'Ongoing') {
    this.status = 'Completed';
  }
});

module.exports = mongoose.model('LecturerSchedule', lecturerScheduleSchema);