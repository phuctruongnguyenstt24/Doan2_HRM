const mongoose = require('mongoose');

const businessTripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    default: '08:00'
  },
  endTime: {
    type: String,
    default: '17:00'
  },
  location: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  approvalBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  approvalNote: String,
  expenses: [{
    type: {
      type: String,
      enum: ['transport', 'accommodation', 'meal', 'other'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: String,
    date: Date
  }],
  totalExpense: {
    type: Number,
    default: 0
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

businessTripSchema.index({ userId: 1, startDate: -1 });
businessTripSchema.index({ status: 1 });

// Middleware không dùng next
businessTripSchema.pre('save', function() {
  if (this.expenses && this.expenses.length > 0) {
    this.totalExpense = this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }
});

module.exports = mongoose.model('BusinessTrip', businessTripSchema);