const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    sparse: true // Cho phép nhiều user có employeeId = null
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  name: {
    type: String,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },

  // THÊM CÁC FIELD HRM
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

 position: {
  type: String,
  enum: ['Nhân viên', 'Admin', 'Quản lý'],
  default: 'Nhân viên',
  required: true,
  trim: true
},

  hourlyRate: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
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

// Hash password trước khi lưu - FIXED VERSION
userSchema.pre('save', async function () {
  // Hash password nếu có và bị thay đổi
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Update timestamp
  this.updatedAt = Date.now();
});



// Method để so sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Nếu user không có password (dùng OAuth), trả về false
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method để lấy thông tin user công khai (không có password)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Indexes để tăng hiệu suất tìm kiếm
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;