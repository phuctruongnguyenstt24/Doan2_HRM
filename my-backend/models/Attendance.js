const mongoose = require('mongoose');
const WORKING_HOURS_CONFIG = {
  // Giờ bắt đầu làm việc buổi sáng
  MORNING_START: 8, // 8:00 AM
  // Giờ kết thúc làm việc buổi sáng (không bắt buộc)
  MORNING_END: 12, // 12:00 PM
  // Giờ bắt đầu làm việc buổi chiều
  AFTERNOON_START: 13.5,  
  // Giờ kết thúc làm việc buổi chiều
  AFTERNOON_END: 17, // 5:00 PM
  // Thời gian cho phép đi muộn (phút)
  GRACE_PERIOD: 15, // 15 phút
  // Giờ tối đa được coi là đi muộn (sau đó tính là vắng)
  MAX_LATE_HOUR: 12, // 12:00 PM
};

// SỬA LẠI HÀM determineStatusWithShift để xử lý số thập phân
function determineStatusWithShift(checkInTime, shiftType = 'fulltime') {
  if (!checkInTime) return 'absent';

  const checkInDate = new Date(checkInTime);
  const checkInHour = checkInDate.getHours();
  const checkInMinute = checkInDate.getMinutes();
  const checkInTotalMinutes = checkInHour * 60 + checkInMinute;

  const gracePeriod = WORKING_HOURS_CONFIG.GRACE_PERIOD;

  // Xử lý số thập phân (ví dụ: 13.5 = 13 giờ 30 phút)
  const morningStartMinutes = Math.floor(WORKING_HOURS_CONFIG.MORNING_START) * 60 + 
                              (WORKING_HOURS_CONFIG.MORNING_START % 1) * 60;
  const morningEndMinutes = Math.floor(WORKING_HOURS_CONFIG.MORNING_END) * 60 + 
                            (WORKING_HOURS_CONFIG.MORNING_END % 1) * 60;
  const afternoonStartMinutes = Math.floor(WORKING_HOURS_CONFIG.AFTERNOON_START) * 60 + 
                                (WORKING_HOURS_CONFIG.AFTERNOON_START % 1) * 60;
  const afternoonEndMinutes = Math.floor(WORKING_HOURS_CONFIG.AFTERNOON_END) * 60 + 
                              (WORKING_HOURS_CONFIG.AFTERNOON_END % 1) * 60;

  // Nếu là ca fulltime, kiểm tra cả sáng và chiều
  if (shiftType === 'fulltime') {
    // Check-in buổi sáng
    if (checkInTotalMinutes >= morningStartMinutes && checkInTotalMinutes <= morningEndMinutes + gracePeriod) {
      return checkInTotalMinutes <= morningStartMinutes + gracePeriod ? 'present' : 'late';
    }
    // Check-in buổi chiều
    else if (checkInTotalMinutes >= afternoonStartMinutes && checkInTotalMinutes <= afternoonEndMinutes + gracePeriod) {
      return checkInTotalMinutes <= afternoonStartMinutes + gracePeriod ? 'present' : 'late';
    }
    // Check-in giữa giờ nghỉ trưa
    else if (checkInTotalMinutes > morningEndMinutes + gracePeriod && checkInTotalMinutes < afternoonStartMinutes) {
      return 'late';
    }
    else {
      return 'absent';
    }
  }

  // Nếu là ca sáng
  if (shiftType === 'morning') {
    if (checkInTotalMinutes >= morningStartMinutes && checkInTotalMinutes <= morningEndMinutes + gracePeriod) {
      return checkInTotalMinutes <= morningStartMinutes + gracePeriod ? 'present' : 'late';
    }
    return 'absent';
  }

  // Nếu là ca chiều
  if (shiftType === 'afternoon') {
    if (checkInTotalMinutes >= afternoonStartMinutes && checkInTotalMinutes <= afternoonEndMinutes + gracePeriod) {
      return checkInTotalMinutes <= afternoonStartMinutes + gracePeriod ? 'present' : 'late';
    }
    return 'absent';
  }

  return 'absent';
}
function normalizeToLocalStartOfDay(value) {
  if (!value) return value;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (isNaN(date.getTime())) return value;
  date.setHours(0, 0, 0, 0);
  return date;
}

const attendanceSchema = new mongoose.Schema({
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


  date: {
    type: Date,
    required: true,
    index: true,
    set: normalizeToLocalStartOfDay
  },

  checkIn: {
    time: Date,
    note: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        // Cho phép null/undefined hoặc mảng có 2 phần tử
        validate: {
          validator: function (v) {
            // Nếu không có coordinates hoặc là null/undefined thì OK
            if (v === null || v === undefined) return true;
            // Nếu là mảng rỗng thì OK (sẽ bị xóa ở middleware)
            if (Array.isArray(v) && v.length === 0) return true;
            // Nếu có coordinates thì phải có đúng 2 phần tử
            return Array.isArray(v) && v.length === 2;
          },
          message: 'Coordinates must be empty or have exactly 2 numbers'
        }
      }
    }
  },

  checkOut: {
    time: Date,
    note: { type: String, default: '' },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (v) {
            if (v === null || v === undefined) return true;
            if (Array.isArray(v) && v.length === 0) return true;
            return Array.isArray(v) && v.length === 2;
          },
          message: 'Coordinates must be empty or have exactly 2 numbers'
        }
      }
    }
  },

  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'leave'],
    default: 'present',
    index: true
  },

  workingHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },

  overtime: {
    type: Number,
    default: 0,
    min: 0
  },

  leaveType: {
    type: String,
    enum: ['paid', 'unpaid', null],
    default: null
  },

  notes: {
    type: String,
    default: ''
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

}, { timestamps: true });

// Compound index để đảm bảo mỗi user chỉ có 1 bản ghi/ngày
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Middleware pre('validate') để normalize date và location
attendanceSchema.pre('validate', function () {
  // Normalize date
  if (this.date) {
    this.date = normalizeToLocalStartOfDay(this.date);
  }

  // Helper function để xử lý location
  const normalizeLocation = (location) => {
    if (!location) return undefined;

    // Nếu coordinates là mảng rỗng, xóa toàn bộ location
    if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 0) {
      return undefined;
    }

    // Nếu coordinates không hợp lệ, xóa location
    if (location.coordinates && (!Array.isArray(location.coordinates) || location.coordinates.length !== 2)) {
      return undefined;
    }

    // Nếu có coordinates hợp lệ
    if (location.coordinates && location.coordinates.length === 2) {
      // Đảm bảo có type
      location.type = 'Point';
      return location;
    }

    // Không có coordinates thì xóa location
    return undefined;
  };

  // Xử lý checkIn location
  if (this.checkIn) {
    const normalizedLocation = normalizeLocation(this.checkIn.location);
    if (normalizedLocation) {
      this.checkIn.location = normalizedLocation;
    } else {
      // Xóa location nếu không hợp lệ
      this.checkIn.location = undefined;
    }
  }

  // Xử lý checkOut location
  if (this.checkOut) {
    const normalizedLocation = normalizeLocation(this.checkOut.location);
    if (normalizedLocation) {
      this.checkOut.location = normalizedLocation;
    } else {
      this.checkOut.location = undefined;
    }
  }
});

// Middleware để tự động tính workingHours và xác định status
attendanceSchema.pre('save', function() {
  // QUAN TRỌNG: Nếu là nghỉ phép, giữ nguyên status 'leave'
  if (this.status === 'leave') {
    // Chỉ tính workingHours nếu có check-in và check-out
    if (this.checkIn?.time && this.checkOut?.time) {
      try {
        const checkInTime = new Date(this.checkIn.time);
        const checkOutTime = new Date(this.checkOut.time);
        if (checkOutTime > checkInTime) {
          let diffMs = checkOutTime - checkInTime;
          if (diffMs > 24 * 60 * 60 * 1000) {
            diffMs = 24 * 60 * 60 * 1000;
          }
          this.workingHours = Math.min(Math.max(0, diffMs / (1000 * 60 * 60)), 24);
        }
      } catch (error) {
        console.error('Error calculating working hours:', error);
      }
    }
    return; // Thoát khỏi middleware, không xử lý status
  }

  // Xác định status dựa trên check-in time (chỉ khi không phải nghỉ phép)
  if (this.checkIn?.time) {
    this.status = determineStatusWithShift(this.checkIn.time);
  } else {
    // Nếu không có check-in và không phải nghỉ phép, mặc định là vắng
    this.status = 'absent';
  }

  // Tính workingHours nếu có cả check-in và check-out
  if (this.checkIn?.time && this.checkOut?.time) {
    try {
      const checkInTime = new Date(this.checkIn.time);
      const checkOutTime = new Date(this.checkOut.time);

      if (checkOutTime > checkInTime) {
        let diffMs = checkOutTime - checkInTime;
        if (diffMs > 24 * 60 * 60 * 1000) {
          diffMs = 24 * 60 * 60 * 1000;
        }
        const diffHours = diffMs / (1000 * 60 * 60);
        this.workingHours = Math.min(Math.max(0, diffHours), 24);
      }
    } catch (error) {
      console.error('Error calculating working hours:', error);
    }
  }
});

// Method để kiểm tra xem đã check-in chưa
attendanceSchema.methods.hasCheckedIn = function () {
  return !!(this.checkIn && this.checkIn.time);
};

// Method để kiểm tra xem đã check-out chưa
attendanceSchema.methods.hasCheckedOut = function () {
  return !!(this.checkOut && this.checkOut.time);
};

// Method để lấy location hợp lệ
attendanceSchema.methods.getCheckInLocation = function () {
  if (this.checkIn?.location?.coordinates?.length === 2) {
    return {
      type: this.checkIn.location.type,
      coordinates: this.checkIn.location.coordinates
    };
  }
  return null;
};

attendanceSchema.methods.getCheckOutLocation = function () {
  if (this.checkOut?.location?.coordinates?.length === 2) {
    return {
      type: this.checkOut.location.type,
      coordinates: this.checkOut.location.coordinates
    };
  }
  return null;
};

// Static method để lấy attendance theo ngày
attendanceSchema.statics.getByDate = function (date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate({
    path: 'userId',
    select: 'employeeId name email department position hourlyRate',
    populate: {
      path: 'department',
      model: 'Department',
      select: 'name code'
    }
  });
};

// Static method để thống kê attendance theo tháng
attendanceSchema.statics.getMonthlyStats = async function (userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const records = await this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  });

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    leave: records.filter(r => r.status === 'leave').length,
    totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    totalOvertime: records.reduce((sum, r) => sum + (r.overtime || 0), 0)
  };

  return stats;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;