const mongoose = require('mongoose');

const officeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã phòng ban là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Tên phòng ban là bắt buộc'],
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  director: {
    type: String,
    required: [true, 'Trưởng phòng là bắt buộc'],
    trim: true
  },
  viceDirector: [{
    type: String,
    trim: true
  }],
  staffCount: {
    type: Number,
    default: 1,
    min: 1
  },
  phone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  floor: {
    type: String,
    default: '',
    trim: true
  },
  building: {
    type: String,
    default: '',
    trim: true
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  services: [{
    type: String,
    trim: true
  }],
  workingHours: {
    morning: {
      type: String,
      default: '07:30 - 11:30'
    },
    afternoon: {
      type: String,
      default: '13:30 - 17:00'
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['academic', 'student', 'administrative', 'technical', 'library', 'union'],
    default: 'academic'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlyExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  performance: {
    type: Number,
    default: 80,
    min: 0,
    max: 100
  },
  tasksCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingTasks: {
    type: Number,
    default: 0,
    min: 0
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  note: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
officeSchema.index({ code: 1 });
officeSchema.index({ name: 1 });
officeSchema.index({ status: 1 });
officeSchema.index({ category: 1 });
officeSchema.index({ performance: -1 });

const Office = mongoose.model('Office', officeSchema);

module.exports = Office;