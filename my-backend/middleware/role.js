// middleware/roleMiddleware.js
const User = require('../models/User');

/**
 * Middleware kiểm tra quyền truy cập theo role
 * @param {Array} allowedRoles - Danh sách role được phép (ví dụ: ['admin', 'manager'])
 * @returns {Function} Middleware function
 */
const roleMiddleware = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Kiểm tra xem đã có user từ authMiddleware chưa
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            // Lấy thông tin user từ database để có role mới nhất
            const user = await User.findById(req.user._id);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            // Kiểm tra role
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền truy cập tính năng này'
                });
            }

            // Lưu role vào req để sử dụng sau
            req.userRole = user.role;
            
            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi kiểm tra quyền: ' + error.message
            });
        }
    };
};

/**
 * Middleware kiểm tra user có phải admin không
 */
const adminMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Yêu cầu quyền admin'
            });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền admin'
        });
    }
};

/**
 * Middleware kiểm tra user có phải manager không
 */
const managerMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }
        
        if (user.role !== 'manager' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Yêu cầu quyền quản lý'
            });
        }

        next();
    } catch (error) {
        console.error('Manager middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền quản lý'
        });
    }
};

/**
 * Middleware kiểm tra user có phải admin hoặc manager không
 */
const adminOrManagerMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }
        
        if (user.role !== 'admin' && user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Yêu cầu quyền admin hoặc quản lý'
            });
        }

        next();
    } catch (error) {
        console.error('Admin or manager middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra quyền'
        });
    }
};

module.exports = roleMiddleware;
module.exports.adminMiddleware = adminMiddleware;
module.exports.managerMiddleware = managerMiddleware;
module.exports.adminOrManagerMiddleware = adminOrManagerMiddleware;