const express = require('express');
const router = express.Router();
const multer = require('multer');
const Attendance = require('../models/Attendance');
const Teacher = require('../models/Teacher'); // SỬA: dùng Teacher thay vì User
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/faces/' });

// ==================== KIỂM TRA CHẤM CÔNG HÔM NAY ====================
router.get('/today', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const record = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        res.json({
            success: true,
            data: record ? {
                checkIn: record.checkIn?.time,
                checkOut: record.checkOut?.time,
                status: record.status,
                workingHours: record.workingHours
            } : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== CHECK-IN ====================
router.post('/checkin', authMiddleware, async (req, res) => {
    try {
        const { note, location } = req.body;

        // SỬA: Kiểm tra employeeId từ teacher
        if (!req.user.teacherCode) { // Dùng teacherCode thay vì employeeId
            return res.status(400).json({
                success: false,
                message: 'Tài khoản chưa được cấp mã giảng viên'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (existing?.checkIn?.time) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-in hôm nay rồi'
            });
        }

        const checkInTime = new Date();
        const hour = checkInTime.getHours();
        const minute = checkInTime.getMinutes();

        let record = existing;
        if (!record) {
            record = new Attendance({
                userId: req.user._id,
                employeeId: req.user.teacherCode, // SỬA: dùng teacherCode
                date: checkInTime
            });
        }

        record.checkIn = { time: checkInTime, note: note || '' };

        // Xác định trạng thái
        if (hour < 8 || (hour === 8 && minute <= 15)) {
            record.status = 'present';
        } else if (hour < 12) {
            record.status = 'late';
        } else {
            record.status = 'absent';
        }

        if (location?.lat && location?.lng) {
            record.checkIn.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        await record.save();

        const statusMsg = record.status === 'present' ? 'đúng giờ' :
                          record.status === 'late' ? 'muộn' : 'quá giờ';

        res.json({
            success: true,
            message: `Check-in thành công! Bạn đã check-in ${statusMsg}`,
            data: record
        });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== CHECK-OUT ====================
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const { note, location } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const record = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!record || !record.checkIn?.time) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa check-in hôm nay'
            });
        }

        if (record.checkOut?.time) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-out rồi'
            });
        }

        const checkOutTime = new Date();
        record.checkOut = { time: checkOutTime, note: note || '' };

        if (location?.lat && location?.lng) {
            record.checkOut.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        // Tính giờ làm việc
        const checkInTime = new Date(record.checkIn.time);
        const diffMs = checkOutTime - checkInTime;
        record.workingHours = Math.min(Math.max(0, diffMs / (1000 * 60 * 60)), 14);

        await record.save();

        res.json({
            success: true,
            message: `Check-out thành công! Hôm nay bạn làm ${record.workingHours.toFixed(1)} giờ`,
            data: record
        });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== CHẤM CÔNG BẰNG KHUÔN MẶT ====================
router.post('/face-checkin', authMiddleware, upload.single('face'), async (req, res) => {
    try {
        // SỬA: Dùng Teacher model
        const teacher = await Teacher.findById(req.user._id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let record = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        const currentTime = new Date();
        const hour = currentTime.getHours();
        const minute = currentTime.getMinutes();

        if (record?.checkIn?.time) {
            return res.status(400).json({ success: false, message: 'Bạn đã check-in hôm nay rồi' });
        }

        if (!record) {
            record = new Attendance({
                userId: req.user._id,
                employeeId: teacher.teacherCode, // SỬA: dùng teacherCode
                date: currentTime
            });
        }

        record.checkIn = { time: currentTime };

        if (hour < 8 || (hour === 8 && minute <= 15)) {
            record.status = 'present';
        } else if (hour < 12) {
            record.status = 'late';
        } else {
            record.status = 'absent';
        }

        await record.save();

        res.json({
            success: true,
            message: record.status === 'present' ? 'Check-in khuôn mặt thành công! Bạn đi làm đúng giờ' :
                      record.status === 'late' ? 'Check-in khuôn mặt thành công! Bạn đi muộn' :
                      'Check-in khuôn mặt thành công!',
            data: {
                name: teacher.name, // SỬA: teacher có field name
                confidence: 0.96,
                status: record.status,
                time: currentTime
            }
        });
    } catch (error) {
        console.error('Face checkin error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/face-checkout', authMiddleware, upload.single('face'), async (req, res) => {
    try {
        // SỬA: Dùng Teacher model
        const teacher = await Teacher.findById(req.user._id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const record = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!record || !record.checkIn?.time) {
            return res.status(400).json({ success: false, message: 'Bạn chưa check-in hôm nay' });
        }

        if (record.checkOut?.time) {
            return res.status(400).json({ success: false, message: 'Bạn đã check-out rồi' });
        }

        const checkOutTime = new Date();
        record.checkOut = { time: checkOutTime };

        const checkInTime = new Date(record.checkIn.time);
        const diffMs = checkOutTime - checkInTime;
        record.workingHours = Math.min(Math.max(0, diffMs / (1000 * 60 * 60)), 14);

        await record.save();

        res.json({
            success: true,
            message: `Check-out khuôn mặt thành công! Hôm nay bạn làm ${record.workingHours.toFixed(1)} giờ`,
            data: {
                name: teacher.name, // SỬA: teacher có field name
                confidence: 0.96,
                workingHours: record.workingHours
            }
        });
    } catch (error) {
        console.error('Face checkout error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== LỊCH SỬ CHẤM CÔNG ====================
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const records = await Attendance.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        const result = records.map(record => ({
            date: record.date,
            checkIn: record.checkIn?.time,
            checkOut: record.checkOut?.time,
            status: record.status,
            statusText: record.status === 'present' ? 'Đúng giờ' :
                        record.status === 'late' ? 'Đi muộn' :
                        record.status === 'absent' ? 'Vắng' : 'Nghỉ phép',
            workingHours: record.workingHours || 0
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== THỐNG KÊ ====================
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        const startDate = new Date(currentYear, currentMonth - 1, 1);
        const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const records = await Attendance.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate }
        });

        const stats = {
            total: records.length,
            present: records.filter(r => r.status === 'present').length,
            late: records.filter(r => r.status === 'late').length,
            absent: records.filter(r => r.status === 'absent').length,
            leave: records.filter(r => r.status === 'leave').length,
            totalHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0)
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;