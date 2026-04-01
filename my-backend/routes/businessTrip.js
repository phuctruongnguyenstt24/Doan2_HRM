const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const BusinessTrip = require('../models/BusinessTrip');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Không có quyền' });
        }
        next();
    };
};

// Lấy danh sách công tác
router.get('/admin/business-trips', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, department, status, search } = req.query;
        
        const query = {};
        
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.startDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.startDate.$lte = end;
            }
        }
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        let userIds = [];
        if (department && department !== 'all') {
            const users = await User.find({ department: department, isActive: true }).select('_id');
            userIds = users.map(u => u._id);
            if (userIds.length === 0) {
                return res.json({ success: true, data: [], pagination: { currentPage: parseInt(page), totalPages: 0, totalItems: 0, limit: parseInt(limit) } });
            }
            query.userId = { $in: userIds };
        }
        
        const totalItems = await BusinessTrip.countDocuments(query);
        
        const trips = await BusinessTrip.find(query)
            .populate('userId', 'employeeId name email department position')
            .populate('approvalBy', 'name')
            .sort({ startDate: -1, createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();
        
        const formattedData = trips.map(trip => ({
            _id: trip._id,
            employeeId: trip.employeeId,
            employeeName: trip.userId?.name || 'N/A',
            department: trip.userId?.department?.name || 'Chưa có',
            title: trip.title,
            startDate: trip.startDate,
            endDate: trip.endDate,
            startTime: trip.startTime,
            endTime: trip.endTime,
            location: trip.location,
            purpose: trip.purpose,
            status: trip.status,
            totalExpense: trip.totalExpense,
            notes: trip.notes
        }));
        
        res.json({
            success: true,
            data: formattedData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                totalItems,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching business trips:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Thêm công tác mới
router.post('/admin/business-trips', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { userId, employeeId, title, startDate, endDate, startTime, endTime, location, purpose, notes } = req.body;
        
        let userQuery = {};
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            userQuery._id = userId;
        } else if (employeeId) {
            userQuery.employeeId = employeeId;
        } else {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp userId hoặc employeeId' });
        }
        
        const user = await User.findOne(userQuery);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
        }
        
        const newTrip = new BusinessTrip({
            userId: user._id,
            employeeId: user.employeeId,
            title,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime: startTime || '08:00',
            endTime: endTime || '17:00',
            location,
            purpose,
            notes: notes || '',
            createdBy: req.user._id
        });
        
        await newTrip.save();
        
        res.status(201).json({ success: true, message: 'Thêm công tác thành công', data: newTrip });
    } catch (error) {
        console.error('Error creating business trip:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật công tác
router.put('/admin/business-trips/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, startDate, endDate, startTime, endTime, location, purpose, status, notes } = req.body;
        
        const trip = await BusinessTrip.findById(id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy công tác' });
        }
        
        if (title) trip.title = title;
        if (startDate) trip.startDate = new Date(startDate);
        if (endDate) trip.endDate = new Date(endDate);
        if (startTime) trip.startTime = startTime;
        if (endTime) trip.endTime = endTime;
        if (location) trip.location = location;
        if (purpose) trip.purpose = purpose;
        if (status) trip.status = status;
        if (notes !== undefined) trip.notes = notes;
        
        trip.updatedBy = req.user._id;
        await trip.save();
        
        res.json({ success: true, message: 'Cập nhật thành công', data: trip });
    } catch (error) {
        console.error('Error updating business trip:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Phê duyệt công tác
router.put('/admin/business-trips/:id/approve', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvalNote } = req.body;
        
        const trip = await BusinessTrip.findById(id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy công tác' });
        }
        
        trip.status = status || 'approved';
        trip.approvalBy = req.user._id;
        trip.approvalDate = new Date();
        if (approvalNote) trip.approvalNote = approvalNote;
        
        await trip.save();
        
        res.json({ success: true, message: `Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} công tác`, data: trip });
    } catch (error) {
        console.error('Error approving business trip:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa công tác
router.delete('/admin/business-trips/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const trip = await BusinessTrip.findByIdAndDelete(id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy công tác' });
        }
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        console.error('Error deleting business trip:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Thêm chi phí
router.post('/admin/business-trips/:id/expenses', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, description, date } = req.body;
        
        const trip = await BusinessTrip.findById(id);
        if (!trip) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy công tác' });
        }
        
        trip.expenses.push({
            type,
            amount,
            description,
            date: date ? new Date(date) : new Date()
        });
        
        trip.totalExpense = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        await trip.save();
        
        res.json({ success: true, message: 'Thêm chi phí thành công', data: trip });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Lấy công tác của user hiện tại
router.get('/my-business-trips', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const query = { userId: req.user._id };
        
        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.startDate.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.startDate.$lte = end;
            }
        }
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        const trips = await BusinessTrip.find(query).sort({ startDate: -1 });
        
        res.json({ success: true, data: trips });
    } catch (error) {
        console.error('Error fetching my business trips:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;