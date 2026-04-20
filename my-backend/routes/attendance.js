const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Department = require('../models/Department');
const authMiddleware = require('../middleware/authMiddleware');
const ExcelJS = require('exceljs');

// Middleware kiểm tra quyền admin/manager (tự định nghĩa)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện hành động này'
            });
        }

        next();
    };
};

// @route   GET /api/attendance/admin/attendance
// @desc    Lấy danh sách chấm công (có phân trang và lọc)
// @access  Private (Admin, Manager)

router.get('/admin/attendance', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            startDate,
            endDate,
            department,
            status,
            employeeId
        } = req.query;

        // Xây dựng query
        const query = {};

        // Lọc theo ngày
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // Lọc theo trạng thái
        if (status && status !== 'all') {
            query.status = status;
        }

        // Lọc theo employeeId
        if (employeeId) {
            query.employeeId = employeeId;
        }

        // Lọc theo department (cần join với User)
        let userIds = [];
        if (department && department !== 'all') {
            const users = await User.find({
                department: department,
                isActive: true
            }).select('_id');
            userIds = users.map(u => u._id);

            if (userIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalItems: 0,
                        limit: parseInt(limit)
                    }
                });
            }
            query.userId = { $in: userIds };
        }

        // Đếm tổng số bản ghi
        const totalItems = await Attendance.countDocuments(query);

        // Lấy dữ liệu với phân trang - SỬA PHẦN POPULATE
        const attendance = await Attendance.find(query)
            .populate({
                path: 'userId',
                select: 'employeeId name email department position hourlyRate',
                populate: {
                    path: 'department',
                    model: 'Department',
                    select: 'name code'
                }
            })
            .sort({ date: -1, createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
        //Test
      console.log(attendance[0]);
        // Format dữ liệu để trả về - THÊM DEPARTMENT NAME
        const formattedData = attendance.map(record => {
            // Lấy department name từ userId.department
            // let departmentName = 'Chưa có phòan';
            // if (record.userId && record.userId.department) {
            //     departmentName = record.userId.department.name || 'Chưa có pban';
            // }

            return {
                _id: record._id,
                employeeId: record.employeeId,
                userId: record.userId,
                date: record.date,
                checkIn: record.checkIn,
                checkOut: record.checkOut,
                status: record.status,
                workingHours: record.workingHours,
                overtime: record.overtime,
                leaveType: record.leaveType,
                notes: record.notes,
                department: record.userId?.department?.name || 'Chưa có phòng ban'
            };
        });

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
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu chấm công',
            error: error.message
        });
    }
});

// @route   POST /api/attendance/admin/attendance
// @desc    Thêm bản ghi chấm công mới
// @access  Private (Admin, Manager)
router.post('/admin/attendance', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            userId,
            employeeId,
            date,
            checkIn,
            checkOut,
            status,
            leaveType,
            workingHours,
            overtime,
            notes
        } = req.body;

        // Tìm user
        let userQuery = {};

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            userQuery._id = userId;
        } else if (employeeId) {
            userQuery.employeeId = employeeId;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp userId hoặc employeeId'
            });
        }

        const user = await User.findOne(userQuery);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy nhân viên'
            });
        }

        if (!user.employeeId) {
            return res.status(400).json({
                success: false,
                message: 'User chưa có employeeId'
            });
        }

        // Kiểm tra bản ghi đã tồn tại
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            userId: user._id,
            date: { $gte: startDate, $lte: endDate }
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Nhân viên đã có bản ghi chấm công trong ngày này'
            });
        }

        const localDateStr = new Date(date).toISOString().split('T')[0];

        // Tạo bản ghi mới - CẤU TRÚC ĐÚNG VỚI MODEL
        const newAttendance = new Attendance({
            userId: user._id,
            employeeId: user.employeeId,
            date: new Date(date),
            status: status || 'present',
            leaveType: leaveType || null,
            workingHours: workingHours || 0,
            overtime: overtime || 0,
            notes: notes || '',
            createdBy: req.user._id
        });

        // Xử lý checkIn
        if (checkIn && checkIn !== '') {
            const checkInStr = checkIn.length === 5 ? `${checkIn}:00` : checkIn;
            const checkInDate = new Date(`${localDateStr}T${checkInStr}`);
            if (!isNaN(checkInDate.getTime())) {
                newAttendance.checkIn = { time: checkInDate };
            }
        }

        // Xử lý checkOut
        if (checkOut && checkOut !== '') {
            const checkOutStr = checkOut.length === 5 ? `${checkOut}:00` : checkOut;
            const checkOutDate = new Date(`${localDateStr}T${checkOutStr}`);
            if (!isNaN(checkOutDate.getTime())) {
                newAttendance.checkOut = { time: checkOutDate };
            }
        }

        await newAttendance.save();

        res.status(201).json({
            success: true,
            message: 'Thêm chấm công thành công',
            data: newAttendance
        });
    } catch (error) {
        console.error('Error creating attendance:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bản ghi chấm công đã tồn tại cho ngày này'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thêm chấm công',
            error: error.message
        });
    }
});


// @route   PUT /api/attendance/admin/attendance/:id
// @desc    Cập nhật bản ghi chấm công
// @access  Private (Admin, Manager)
router.put('/admin/attendance/:id', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            checkIn,
            checkOut,
            status,
            leaveType,
            workingHours,
            overtime,
            notes
        } = req.body;

        const attendance = await Attendance.findById(id);
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi chấm công'
            });
        }

        const attendanceDate = attendance.date;
        const localDateStr = attendanceDate.toISOString().split('T')[0];

        // Cập nhật checkIn
        if (checkIn !== undefined) {
            if (checkIn === null || checkIn === '') {
                attendance.checkIn = undefined;
            } else {
                const checkInStr = checkIn.length === 5 ? `${checkIn}:00` : checkIn;
                const checkInDate = new Date(`${localDateStr}T${checkInStr}`);
                if (isNaN(checkInDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Giờ check-in không hợp lệ'
                    });
                }
                attendance.checkIn = { time: checkInDate };
            }
        }

        // Cập nhật checkOut
        if (checkOut !== undefined) {
            if (checkOut === null || checkOut === '') {
                attendance.checkOut = undefined;
            } else {
                const checkOutStr = checkOut.length === 5 ? `${checkOut}:00` : checkOut;
                const checkOutDate = new Date(`${localDateStr}T${checkOutStr}`);
                if (isNaN(checkOutDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Giờ check-out không hợp lệ'
                    });
                }
                attendance.checkOut = { time: checkOutDate };
            }
        }

        if (status) attendance.status = status;
        if (leaveType !== undefined) attendance.leaveType = leaveType;
        if (workingHours !== undefined) attendance.workingHours = workingHours;
        if (overtime !== undefined) attendance.overtime = overtime;
        if (notes !== undefined) attendance.notes = notes;

        attendance.updatedBy = req.user._id;

        await attendance.save();

        res.json({
            success: true,
            message: 'Cập nhật chấm công thành công',
            data: attendance
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật chấm công',
            error: error.message
        });
    }
});

// @route   DELETE /api/attendance/admin/attendance/:id
// @desc    Xóa bản ghi chấm công
// @access  Private (Admin)
router.delete('/admin/attendance/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findByIdAndDelete(id);
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi chấm công'
            });
        }

        res.json({
            success: true,
            message: 'Xóa chấm công thành công'
        });
    } catch (error) {
        console.error('Error deleting attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa chấm công',
            error: error.message
        });
    }
});

// @route   GET /api/attendance/export
// @desc    Xuất Excel báo cáo chấm công
// @access  Private (Admin, Manager)
 

router.get('/export', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { startDate, endDate, department, status } = req.query;

        // Xây dựng query
        const query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (department && department !== 'all') {
            const users = await User.find({ department }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const attendance = await Attendance.find(query)
            .populate({
                path: 'userId',
                select: 'employeeId name email department position hourlyRate',
                populate: {
                    path: 'department',
                    model: 'Department',
                    select: 'name code'
                }
            })
            .sort({ date: -1 });

        // Tính toán thống kê
        const stats = {
            total: attendance.length,
            present: attendance.filter(r => r.status === 'present').length,
            late: attendance.filter(r => r.status === 'late').length,
            absent: attendance.filter(r => r.status === 'absent').length,
            leave: attendance.filter(r => r.status === 'leave').length,
            totalWorkingHours: attendance.reduce((sum, r) => sum + (r.workingHours || 0), 0),
            totalOvertime: attendance.reduce((sum, r) => sum + (r.overtime || 0), 0)
        };

        // Tính tổng lương
        let totalSalary = 0;
        attendance.forEach(record => {
            const hourlyRate = record.userId?.hourlyRate || 80000;
            let salary = 0;
            
            if (record.status === 'present' || record.status === 'late') {
                salary = (record.workingHours || 0) * hourlyRate;
                salary += (record.overtime || 0) * hourlyRate * 1.5;
            }
            
            if (record.status === 'leave' && record.leaveType === 'paid') {
                salary = 8 * hourlyRate;
            }
            
            totalSalary += salary;
        });

        // Tạo workbook Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'HR System';
        workbook.created = new Date();
        
        // Tạo sheet chính
        const worksheet = workbook.addWorksheet('Báo cáo chấm công', {
            pageSetup: { paperSize: 9, orientation: 'landscape' }
        });

        // ===== HEADER =====
        worksheet.mergeCells('A1:M1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'BÁO CÁO CHẤM CÔNG';
        titleCell.font = { size: 18, bold: true, name: 'Arial' };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        // Thời gian báo cáo
        worksheet.mergeCells('A2:M2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Từ ngày: ${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Tất cả'} - Đến ngày: ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Tất cả'}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { horizontal: 'center' };
        
        // Thông tin bộ lọc
        if (department && department !== 'all') {
            worksheet.mergeCells('A3:M3');
            const filterCell = worksheet.getCell('A3');
            filterCell.value = `Phòng ban: ${department}`;
            filterCell.font = { size: 10 };
            filterCell.alignment = { horizontal: 'center' };
        }

        worksheet.addRow([]); // Dòng trống

        // ===== SUMMARY SECTION =====
        const summaryTitle = worksheet.addRow(['THỐNG KÊ TỔNG HỢP']);
        summaryTitle.getCell(1).font = { bold: true, size: 12 };
        summaryTitle.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E8F5E9' }
        };
        
        worksheet.addRow(['Tổng số bản ghi:', stats.total]);
        worksheet.addRow(['Có mặt:', stats.present]);
        worksheet.addRow(['Đi muộn:', stats.late]);
        worksheet.addRow(['Vắng:', stats.absent]);
        worksheet.addRow(['Nghỉ phép:', stats.leave]);
        worksheet.addRow(['Tổng giờ công:', stats.totalWorkingHours.toFixed(1) + ' giờ']);
        worksheet.addRow(['Tổng giờ tăng ca:', stats.totalOvertime.toFixed(1) + ' giờ']);
        worksheet.addRow(['Tổng lương:', formatCurrency(totalSalary)]);
        worksheet.addRow([]);

        // ===== TABLE HEADER =====
        const headers = [
            'STT', 'Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 
            'Ngày', 'Giờ vào', 'Giờ ra', 'Trạng thái', 'Loại nghỉ',
            'Giờ công', 'Tăng ca', 'Lương'
        ];
        
        const headerRow = worksheet.addRow(headers);
        
        // Style cho header
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '2C7DA0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // ===== DATA ROWS =====
        let currentTotalSalary = 0;
        
        attendance.forEach((record, index) => {
            const hourlyRate = record.userId?.hourlyRate || 80000;
            let salary = 0;
            
            if (record.status === 'present' || record.status === 'late') {
                salary = (record.workingHours || 0) * hourlyRate;
                salary += (record.overtime || 0) * hourlyRate * 1.5;
            }
            
            if (record.status === 'leave' && record.leaveType === 'paid') {
                salary = 8 * hourlyRate;
            }
            
            currentTotalSalary += salary;
            
            const row = worksheet.addRow([
                index + 1,
                record.userId?.employeeId || 'N/A',
                record.userId?.name || 'N/A',
                record.userId?.department?.name || 'Chưa có',
                record.userId?.position || 'Nhân viên',
                new Date(record.date).toLocaleDateString('vi-VN'),
                record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString('vi-VN') : '--:--',
                record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString('vi-VN') : '--:--',
                getStatusText(record.status),
                getLeaveTypeText(record.leaveType),
                record.workingHours || 0,
                record.overtime || 0,
                formatCurrency(salary)
            ]);
            
            // Style cho các ô dữ liệu
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Căn giữa cho các cột số
                if ([1, 2, 6, 7, 8, 11, 12, 13].includes(colNumber)) {
                    cell.alignment = { horizontal: 'center' };
                }
                
                // Màu nền cho trạng thái
                if (colNumber === 9) {
                    if (record.status === 'present') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C8E6C9' } };
                    } else if (record.status === 'late') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0B2' } };
                    } else if (record.status === 'absent') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCDD2' } };
                    } else if (record.status === 'leave') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BBDEFB' } };
                    }
                }
            });
        });
        
        // ===== FOOTER =====
        worksheet.addRow([]);
        const totalRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', 'TỔNG LƯƠNG:', formatCurrency(currentTotalSalary)]);
        
        // Style cho footer
        totalRow.getCell(12).font = { bold: true, size: 12 };
        totalRow.getCell(13).font = { bold: true, size: 12, color: { argb: 'D32F2F' } };
        
        // Merge cells cho footer
        worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);
        
        // ===== AUTO WIDTH =====
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length);
            });
            column.width = Math.min(maxLength + 2, 25);
        });
        
        // ===== RESPONSE =====
        const fileName = `bao_cao_cham_cong_${startDate || 'all'}_den_${endDate || 'all'}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xuất Excel',
            error: error.message
        });
    }
});

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'present': 'Có mặt',
        'late': 'Đi muộn',
        'absent': 'Vắng không phép',
        'leave': 'Nghỉ phép'
    };
    return statusMap[status] || status;
}

function getLeaveTypeText(leaveType) {
    const typeMap = {
        'paid': 'Có lương',
        'unpaid': 'Không lương',
        '': '-'
    };
    return typeMap[leaveType] || '-';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// @route   GET /api/attendance/departments
// @desc    Lấy danh sách phòng ban cho filter
// @access  Private
router.get('/departments', authMiddleware, async (req, res) => {
    try {
        const departments = await Department.find({ status: 'active' })
            .select('name code')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách phòng ban'
        });
    }
});

// @route   GET /api/attendance/stats
// @desc    Lấy thống kê chấm công
// @access  Private (Admin, Manager)
router.get('/stats', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        const query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        if (department && department !== 'all') {
            const users = await User.find({ department }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const stats = await Attendance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                    absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    leave: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
                    totalWorkingHours: { $sum: '$workingHours' },
                    totalOvertime: { $sum: '$overtime' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || {
                total: 0,
                present: 0,
                late: 0,
                absent: 0,
                leave: 0,
                totalWorkingHours: 0,
                totalOvertime: 0
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê'
        });
    }
});

// @route   GET /api/attendance/my-attendance
// @desc    Lấy thông tin chấm công của user hiện tại
// @access  Private
router.get('/my-attendance', authMiddleware, async (req, res) => {
    try {
        const { date } = req.query;

        let query = { userId: req.user._id };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.findOne(query).sort({ date: -1 });

        res.json({
            success: true,
            data: attendance || null
        });
    } catch (error) {
        console.error('Error fetching my attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy dữ liệu chấm công'
        });
    }
});

// @route   GET /api/attendance/my-stats
// @desc    Lấy thống kê chấm công của user hiện tại
// @access  Private
router.get('/my-stats', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = { userId: req.user._id };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const stats = await Attendance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: 1 },
                    presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    lateDays: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
                    absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    leaveDays: { $sum: { $cond: [{ $eq: ['$status', 'leave'] }, 1, 0] } },
                    totalHours: { $sum: '$workingHours' },
                    totalOvertime: { $sum: '$overtime' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || {
                totalDays: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                leaveDays: 0,
                totalHours: 0,
                totalOvertime: 0
            }
        });
    } catch (error) {
        console.error('Error getting my stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê'
        });
    }
});

// @route   POST /api/attendance/checkin
// @desc    Check-in cho nhân viên
// @access  Private
router.post('/checkin', authMiddleware, async (req, res) => {
    try {
        const { note, location } = req.body;

        if (!req.user.employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản của bạn chưa được cấp mã nhân viên'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-in hôm nay rồi'
            });
        }

        const checkInTime = new Date();

        // Tạo bản ghi mới - KHÔNG set status, để model tự xác định
        const attendance = new Attendance({
            userId: req.user._id,
            employeeId: req.user.employeeId,
            date: new Date(),
            checkIn: {
                time: checkInTime,
                note: note || ''
            }
            // KHÔNG set status ở đây
        });

        // Thêm location nếu có
        if (location && location.lng && location.lat) {
            attendance.checkIn.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        await attendance.save();

        // Trả về kết quả kèm thông báo trạng thái
        let statusMessage = '';
        if (attendance.status === 'present') {
            statusMessage = 'Bạn đã check-in đúng giờ!';
        } else if (attendance.status === 'late') {
            statusMessage = 'Bạn đã check-in muộn!';
        } else if (attendance.status === 'absent') {
            statusMessage = 'Bạn đã check-in quá giờ cho phép!';
        }

        res.status(201).json({
            success: true,
            message: statusMessage || 'Check-in thành công',
            data: attendance
        });
    } catch (error) {
        console.error('Error checking in:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-in hôm nay rồi'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server khi check-in: ' + error.message
        });
    }
});


// @route   PUT /api/attendance/config
// @desc    Cập nhật cấu hình giờ làm việc
// @access  Private (Admin)
router.put('/config', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const {
            morningStart,
            gracePeriod,
            maxLateHour,
            afternoonStart,
            afternoonEnd
        } = req.body;

        // TODO: lưu DB

        res.json({
            success: true,
            message: 'Cập nhật cấu hình thành công',
            data: {
                morningStart: morningStart || 8,
                gracePeriod: gracePeriod || 15,
                maxLateHour: maxLateHour || 12,
                afternoonStart: afternoonStart || 13,
                afternoonEnd: afternoonEnd || 17
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình'
        });
    }
});
// @route   POST /api/attendance/checkout
// @desc    Check-out cho nhân viên
// @access  Private


// Helper functions (có thể đặt ở ngoài hoặc trong utils)

// Main route
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const { note, location } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'Bạn chưa check-in hôm nay'
            });
        }

        // Kiểm tra đã check-out chưa
        if (attendance.checkOut?.time) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã check-out hôm nay rồi'
            });
        }

        // Cập nhật checkOut - CẤU TRÚC ĐÚNG VỚI MODEL
        attendance.checkOut = {
            time: new Date(),
            note: note || ''
        };

        // Thêm location nếu có
        if (location && location.lng && location.lat) {
            attendance.checkOut.location = {
                type: 'Point',
                coordinates: [location.lng, location.lat]
            };
        }

        // Model sẽ tự tính workingHours trong pre-save middleware
        await attendance.save();

        res.json({
            success: true,
            message: 'Check-out thành công',
            data: attendance
        });

    } catch (error) {
        console.error('Error checking out:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

// Thêm vào cuối file attendance.js, trước module.exports = router;

// ==================== THÊM MỚI: BÁO CÁO TỔNG HỢP ====================

// @route   GET /api/attendance/admin/report
// @desc    Lấy báo cáo chấm công tổng hợp (theo phòng ban và chi tiết nhân viên)
// @access  Private (Admin, Manager)
router.get('/admin/report', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            department,
            search
        } = req.query;

        // Xây dựng query cho attendance
        let attendanceQuery = {};

        // Lọc theo ngày
        if (startDate || endDate) {
            attendanceQuery.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                attendanceQuery.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                attendanceQuery.date.$lte = end;
            }
        }

        // Xây dựng query cho users
        let userQuery = { isActive: true };

        // Lọc theo department
        if (department && department !== 'all') {
            userQuery.department = department;
        }

        // Tìm kiếm theo tên hoặc mã nhân viên
        if (search) {
            userQuery.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        // Lấy danh sách users
        const users = await User.find(userQuery)
            .populate('department', 'name')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                summary: [],
                details: []
            });
        }

        const userIds = users.map(u => u._id);
        attendanceQuery.userId = { $in: userIds };

        // Lấy attendance records
        const attendances = await Attendance.find(attendanceQuery)
            .populate({
                path: 'userId',
                select: 'employeeId fullName name email position hourlyRate',
                populate: {
                    path: 'department',
                    select: 'name'
                }
            })
            .sort({ date: 1 })
            .lean();

        // Tạo map để nhóm dữ liệu theo user
        const userReportMap = new Map();

        users.forEach(user => {
            userReportMap.set(user._id.toString(), {
                userId: user._id,
                employeeId: user.employeeId || user._id.toString().slice(-6),
                employeeName: user.fullName || user.name || 'Không có tên',
                department: user.department?.name || 'Chưa có',
                position: user.position || 'Nhân viên',
                hourlyRate: user.hourlyRate || 80000, // THÊM DÒNG NÀY
                totalDays: 0,
                ontime: 0,
                late: 0,
                absent: 0,
                ontimeRate: 0,
                workingHours: 0,
                overtime: 0,
                note: '',
                records: []
            });
        });

        // Xử lý từng attendance record
        attendances.forEach(attendance => {
            const userId = attendance.userId?._id?.toString();
            if (!userId) return;

            const userReport = userReportMap.get(userId);
            if (userReport) {
                userReport.totalDays++;
                userReport.workingHours += attendance.workingHours || 0;
                userReport.overtime += attendance.overtime || 0;

                if (attendance.status === 'present') {
                    userReport.ontime++;
                } else if (attendance.status === 'late') {
                    userReport.late++;
                } else if (attendance.status === 'absent') {
                    userReport.absent++;
                }

                userReport.records.push({
                    date: attendance.date,
                    status: attendance.status,
                    checkIn: attendance.checkIn?.time,
                    checkOut: attendance.checkOut?.time
                });
            }
        });
        // Tính điểm chuyên cần dựa trên số ngày đi muộn
        const calculateAttendanceScore = (totalDays, lateDays, absentDays) => {
            if (totalDays === 0) return 0;
            const penalty = (lateDays * 0.5) + (absentDays * 2);
            const score = Math.max(0, 100 - (penalty / totalDays * 100));
            return Math.round(score);
        };
        // Tính tỷ lệ và chuyển thành array
        const details = [];
        userReportMap.forEach(userReport => {
            if (userReport.totalDays > 0) {
                userReport.ontimeRate = Math.round((userReport.ontime / userReport.totalDays) * 100);
            }
            details.push(userReport);
        });

        details.forEach(detail => {
            detail.attendanceScore = calculateAttendanceScore(
                detail.totalDays,
                detail.late,
                detail.absent
            );
            detail.scoreLevel = detail.attendanceScore >= 90 ? 'Tốt' :
                detail.attendanceScore >= 70 ? 'Khá' :
                    detail.attendanceScore >= 50 ? 'Trung bình' : 'Yếu';
        });

        // Tạo báo cáo tổng hợp theo phòng ban
        const departmentMap = new Map();

        details.forEach(detail => {
            const deptName = detail.department;
            if (!departmentMap.has(deptName)) {
                departmentMap.set(deptName, {
                    key: deptName,
                    department: deptName,
                    employeeCount: 0,
                    ontimeDays: 0,
                    lateDays: 0,
                    absentDays: 0,
                    totalSalary: 0,
                    ontimeRate: 0,
                    lateRate: 0,
                    absentRate: 0
                });
            }



            const deptData = departmentMap.get(deptName);
            deptData.employeeCount++;
            deptData.ontimeDays += detail.ontime;
            deptData.lateDays += detail.late;
            deptData.absentDays += detail.absent;

            // Tính lương (giả sử hourlyRate = 80,000 nếu không có)
            const hourlyRate = detail.hourlyRate || 80000;
            const salary = (detail.workingHours * hourlyRate) + (detail.overtime * hourlyRate * 1.5);
            deptData.totalSalary += salary;
        });

        // Tính tỷ lệ cho từng phòng ban
        const summary = [];
        departmentMap.forEach(deptData => {
            const totalDays = deptData.ontimeDays + deptData.lateDays + deptData.absentDays;
            if (totalDays > 0) {
                deptData.ontimeRate = Math.round((deptData.ontimeDays / totalDays) * 100);
                deptData.lateRate = Math.round((deptData.lateDays / totalDays) * 100);
                deptData.absentRate = Math.round((deptData.absentDays / totalDays) * 100);
            }
            summary.push(deptData);
        });

        res.json({
            success: true,
            summary,
            details
        });

    } catch (error) {
        console.error('Error getting attendance report:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy báo cáo chấm công',
            error: error.message
        });
    }
});

// @route   GET /api/attendance/export/report
// @desc    Xuất Excel báo cáo chấm công chi tiết
// @access  Private (Admin, Manager)
 

router.get('/export', authMiddleware, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { startDate, endDate, department, status } = req.query;

        // Xây dựng query
        const query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (department && department !== 'all') {
            const users = await User.find({ department }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const attendance = await Attendance.find(query)
            .populate({
                path: 'userId',
                select: 'employeeId name email department position hourlyRate',
                populate: {
                    path: 'department',
                    model: 'Department',
                    select: 'name code'
                }
            })
            .sort({ date: -1 });

        // Tính toán thống kê
        const stats = {
            total: attendance.length,
            present: attendance.filter(r => r.status === 'present').length,
            late: attendance.filter(r => r.status === 'late').length,
            absent: attendance.filter(r => r.status === 'absent').length,
            leave: attendance.filter(r => r.status === 'leave').length,
            totalWorkingHours: attendance.reduce((sum, r) => sum + (r.workingHours || 0), 0),
            totalOvertime: attendance.reduce((sum, r) => sum + (r.overtime || 0), 0)
        };

        // Tính tổng lương
        let totalSalary = 0;
        attendance.forEach(record => {
            const hourlyRate = record.userId?.hourlyRate || 80000;
            let salary = 0;
            
            if (record.status === 'present' || record.status === 'late') {
                salary = (record.workingHours || 0) * hourlyRate;
                salary += (record.overtime || 0) * hourlyRate * 1.5;
            }
            
            if (record.status === 'leave' && record.leaveType === 'paid') {
                salary = 8 * hourlyRate;
            }
            
            totalSalary += salary;
        });

        // Tạo workbook Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'HR System';
        workbook.created = new Date();
        
        // Tạo sheet chính
        const worksheet = workbook.addWorksheet('Báo cáo chấm công', {
            pageSetup: { paperSize: 9, orientation: 'landscape' }
        });

        // ===== HEADER =====
        worksheet.mergeCells('A1:M1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'BÁO CÁO CHẤM CÔNG';
        titleCell.font = { size: 18, bold: true, name: 'Arial' };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        worksheet.getRow(1).height = 35;

        // Thời gian báo cáo
        worksheet.mergeCells('A2:M2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Từ ngày: ${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Tất cả'} - Đến ngày: ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Tất cả'}`;
        dateCell.font = { size: 11, italic: true };
        dateCell.alignment = { horizontal: 'center' };
        
        // Thông tin bộ lọc
        if (department && department !== 'all') {
            worksheet.mergeCells('A3:M3');
            const filterCell = worksheet.getCell('A3');
            filterCell.value = `Phòng ban: ${department}`;
            filterCell.font = { size: 10 };
            filterCell.alignment = { horizontal: 'center' };
        }

        worksheet.addRow([]); // Dòng trống

        // ===== SUMMARY SECTION =====
        const summaryTitle = worksheet.addRow(['THỐNG KÊ TỔNG HỢP']);
        summaryTitle.getCell(1).font = { bold: true, size: 12 };
        summaryTitle.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'E8F5E9' }
        };
        
        worksheet.addRow(['Tổng số bản ghi:', stats.total]);
        worksheet.addRow(['Có mặt:', stats.present]);
        worksheet.addRow(['Đi muộn:', stats.late]);
        worksheet.addRow(['Vắng:', stats.absent]);
        worksheet.addRow(['Nghỉ phép:', stats.leave]);
        worksheet.addRow(['Tổng giờ công:', stats.totalWorkingHours.toFixed(1) + ' giờ']);
        worksheet.addRow(['Tổng giờ tăng ca:', stats.totalOvertime.toFixed(1) + ' giờ']);
        worksheet.addRow(['Tổng lương:', formatCurrency(totalSalary)]);
        worksheet.addRow([]);

        // ===== TABLE HEADER =====
        const headers = [
            'STT', 'Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 
            'Ngày', 'Giờ vào', 'Giờ ra', 'Trạng thái', 'Loại nghỉ',
            'Giờ công', 'Tăng ca', 'Lương'
        ];
        
        const headerRow = worksheet.addRow(headers);
        
        // Style cho header
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '2C7DA0' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // ===== DATA ROWS =====
        let currentTotalSalary = 0;
        
        attendance.forEach((record, index) => {
            const hourlyRate = record.userId?.hourlyRate || 80000;
            let salary = 0;
            
            if (record.status === 'present' || record.status === 'late') {
                salary = (record.workingHours || 0) * hourlyRate;
                salary += (record.overtime || 0) * hourlyRate * 1.5;
            }
            
            if (record.status === 'leave' && record.leaveType === 'paid') {
                salary = 8 * hourlyRate;
            }
            
            currentTotalSalary += salary;
            
            const row = worksheet.addRow([
                index + 1,
                record.userId?.employeeId || 'N/A',
                record.userId?.name || 'N/A',
                record.userId?.department?.name || 'Chưa có',
                record.userId?.position || 'Nhân viên',
                new Date(record.date).toLocaleDateString('vi-VN'),
                record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString('vi-VN') : '--:--',
                record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString('vi-VN') : '--:--',
                getStatusText(record.status),
                getLeaveTypeText(record.leaveType),
                record.workingHours || 0,
                record.overtime || 0,
                formatCurrency(salary)
            ]);
            
            // Style cho các ô dữ liệu
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Căn giữa cho các cột số
                if ([1, 2, 6, 7, 8, 11, 12, 13].includes(colNumber)) {
                    cell.alignment = { horizontal: 'center' };
                }
                
                // Màu nền cho trạng thái
                if (colNumber === 9) {
                    if (record.status === 'present') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C8E6C9' } };
                    } else if (record.status === 'late') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0B2' } };
                    } else if (record.status === 'absent') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCDD2' } };
                    } else if (record.status === 'leave') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'BBDEFB' } };
                    }
                }
            });
        });
        
        // ===== FOOTER =====
        worksheet.addRow([]);
        const totalRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', 'TỔNG LƯƠNG:', formatCurrency(currentTotalSalary)]);
        
        // Style cho footer
        totalRow.getCell(12).font = { bold: true, size: 12 };
        totalRow.getCell(13).font = { bold: true, size: 12, color: { argb: 'D32F2F' } };
        
        // Merge cells cho footer
        worksheet.mergeCells(`A${worksheet.rowCount}:L${worksheet.rowCount}`);
        
        // ===== AUTO WIDTH =====
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, cellValue.length);
            });
            column.width = Math.min(maxLength + 2, 25);
        });
        
        // ===== RESPONSE =====
        const fileName = `bao_cao_cham_cong_${startDate || 'all'}_den_${endDate || 'all'}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
        
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xuất Excel',
            error: error.message
        });
    }
});

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'present': 'Có mặt',
        'late': 'Đi muộn',
        'absent': 'Vắng không phép',
        'leave': 'Nghỉ phép'
    };
    return statusMap[status] || status;
}

function getLeaveTypeText(leaveType) {
    const typeMap = {
        'paid': 'Có lương',
        'unpaid': 'Không lương',
        '': '-'
    };
    return typeMap[leaveType] || '-';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// @route   GET /api/attendance/my-attendance/status
// @desc    Xem chi tiết trạng thái chấm công của từng ngày
// @access  Private
router.get('/my-attendance/status', authMiddleware, async (req, res) => {
    try {
        const { year, month } = req.query;
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
            checkInTime: record.checkIn?.time,
            checkOutTime: record.checkOut?.time,
            status: record.status,
            statusText: record.status === 'present' ? 'Đúng giờ' :
                record.status === 'late' ? 'Đi muộn' :
                    record.status === 'absent' ? 'Vắng' : 'Nghỉ phép',
            workingHours: record.workingHours,
            note: record.checkIn?.note || record.notes || ''
        }));

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết chấm công'
        });
    }
});



module.exports = router;
