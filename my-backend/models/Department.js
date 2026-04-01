// models/Department.js
const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  dean: {
    type: String,
    required: true
  },
  facultyCount: {
    type: Number,
    default: 0,
    min: 0
  },
  studentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  programs: [{
    type: String,
    trim: true
  }],
  researchAreas: [{
    type: String,
    trim: true
  }],
  facilities: [{
    type: String,
    trim: true
  }],
  accreditation: {
    type: String,
    default: ''
  },
  establishmentYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  performance: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  researchOutput: {
    type: Number,
    default: 0,
    min: 0
  },
  publications: {
    type: Number,
    default: 0,
    min: 0
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    default: ''
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  researchGrants: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

// Index for search optimization
departmentSchema.index({ name: 'text', code: 'text', description: 'text' });

module.exports = mongoose.model('Department', departmentSchema);