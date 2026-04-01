const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  overtimeRate: {
    type: Number,
    default: 1.5
  },
  workingDays: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  paidLeaveDays: {
    type: Number,
    default: 0
  },
  unpaidLeaveDays: {
    type: Number,
    default: 0
  },
  lateDays: {
    type: Number,
    default: 0
  },
  absentDays: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0,
    min: 0
  },
  deduction: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSalary: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'check'],
    default: 'bank_transfer'
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    accountHolder: String
  },
  notes: String,
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Compound index for unique salary per user per month
salarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// Calculate total salary before save
salarySchema.pre('save', function(next) {
  // Công thức tính lương
  const basePay = this.totalHours * this.hourlyRate;
  const overtimePay = this.overtimeHours * this.hourlyRate * this.overtimeRate;
  const paidLeavePay = this.paidLeaveDays * 8 * this.hourlyRate; // 8 giờ/ngày
  
  this.totalSalary = basePay + overtimePay + paidLeavePay + this.bonus - this.deduction;
  next();
});

const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;