// models/TeacherStat.js
const mongoose = require('mongoose');

const teacherStatSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    unique: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalCourses: {
    type: Number,
    default: 0
  },
  completedCourses: {
    type: Number,
    default: 0
  },
  pendingAssignments: {
    type: Number,
    default: 0
  },
  totalTeachingHours: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  certificatesIssued: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TeacherStat', teacherStatSchema);