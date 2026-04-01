// models/Enrollment.js
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  program: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingProgram',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Đã đăng ký', 'Đã xác nhận', 'Đang học', 'Hoàn thành', 'Hủy', 'Trượt'],
    default: 'Đã đăng ký'
  },
  attendance: [{
    date: Date,
    status: {
      type: String,
      enum: ['Có mặt', 'Vắng', 'Muộn', 'Có phép'],
      default: 'Vắng'
    },
    note: String
  }],
  scores: {
    midterm: {
      score: Number,
      maxScore: Number,
      percentage: Number
    },
    final: {
      score: Number,
      maxScore: Number,
      percentage: Number
    },
    assignments: [{
      name: String,
      score: Number,
      maxScore: Number,
      weight: Number
    }],
    total: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  certificateIssued: {
    issued: {
      type: Boolean,
      default: false
    },
    certificateNumber: String,
    issuedDate: Date,
    issuedBy: String
  },
  feedback: {
    rating: Number,
    comment: String,
    date: Date
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

// Tính điểm tổng kết
enrollmentSchema.pre('save', function() {
  if (this.scores.midterm && this.scores.final) {
    let total = 0;
    if (this.scores.midterm.percentage) {
      total += (this.scores.midterm.score / this.scores.midterm.maxScore) * this.scores.midterm.percentage;
    }
    if (this.scores.final.percentage) {
      total += (this.scores.final.score / this.scores.final.maxScore) * this.scores.final.percentage;
    }
    if (this.scores.assignments) {
      this.scores.assignments.forEach(assignment => {
        if (assignment.weight) {
          total += (assignment.score / assignment.maxScore) * assignment.weight;
        }
      });
    }
    this.scores.total = total;
    
    // Tự động cập nhật trạng thái nếu hoàn thành
    if (total >= 50 && this.status !== 'Hoàn thành') {
      this.status = 'Hoàn thành';
    }
  }

});

module.exports = mongoose.model('Enrollment', enrollmentSchema);