const mongoose = require('mongoose');
const moment = require('moment');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Office = require('../models/Office');
const AccessLog = require('../models/accessLog');

// Helper: Lấy khoảng thời gian
const getDateRange = (range) => {
  const now = new Date();
  const start = new Date();
  
  switch(range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
  }
  
  return { start, end: now };
};

// ==================== MAIN DASHBOARD API ====================

// 1. Lấy thống kê nhanh
const getStats = async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    
    // Thống kê từ User model
    const totalEmployees = await User.countDocuments({ isActive: true });
    const teachers = await Teacher.countDocuments({ isLocked: false });
    const staff = await User.countDocuments({ 
      position: 'Nhân viên', 
      isActive: true 
    });
    const admins = await User.countDocuments({ 
      role: 'admin', 
      isActive: true 
    });
    const managers = await User.countDocuments({ 
      role: 'manager', 
      isActive: true 
    });
    
    // Hợp đồng sắp hết hạn (từ Teacher model)
    const contractExpiring = await Teacher.countDocuments({
      contractEndDate: {
        $lte: moment().add(30, 'days').toDate(),
        $gte: new Date()
      }
    });
    
    // Sinh nhật tháng này (từ Teacher model)
    const currentMonth = moment().month() + 1;
    const birthdays = await Teacher.countDocuments({
      $expr: {
        $eq: [{ $month: "$birthday" }, currentMonth]
      }
    });
    
    // Đang nghỉ phép (từ User model - có thể thêm field status)
    const onLeave = await User.countDocuments({ 
      isActive: true,
      status: 'on_leave' // Nếu có field này
    });
    
    // Thống kê thêm
    const totalDepartments = await Department.countDocuments({ status: 'active' });
    const totalOffices = await Office.countDocuments({ status: 'active' });
    const activeTeachers = await Teacher.countDocuments({ isLocked: false });
    const lockedTeachers = await Teacher.countDocuments({ isLocked: true });
    
    res.json({
      totalEmployees,
      teachers,
      staff,
      admins,
      managers,
      contractExpiring: contractExpiring || 0,
      birthdays: birthdays || 0,
      onLeave: onLeave || 0,
      totalDepartments,
      totalOffices,
      activeTeachers,
      lockedTeachers
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. Phân bổ theo khoa/phòng (từ Department model và User)
const getDepartmentDistribution = async (req, res) => {
  try {
    const departments = await Department.find({ status: 'active' });
    
    // Màu sắc cho các khoa
    const colors = ['#4dabf7', '#40c057', '#ff6b6b', '#7950f2', '#fd7e14', '#e64980', '#20c997', '#6f42c1'];
    
    // Đếm số lượng user theo từng department
    const distribution = await Promise.all(departments.map(async (dept, index) => {
      const userCount = await User.countDocuments({ 
        department: dept._id,
        isActive: true 
      });
      
      return {
        name: dept.name,
        value: userCount,
        color: colors[index % colors.length],
        code: dept.code,
        _id: dept._id
      };
    }));
    
    // Lọc bỏ các khoa có value = 0 (tùy chọn)
    const filteredDistribution = distribution.filter(d => d.value > 0);
    
    // Nếu không có dữ liệu, trả về mảng rỗng
    if (filteredDistribution.length === 0) {
      return res.json([]);
    }
    
    res.json(filteredDistribution);
    
  } catch (error) {
    console.error('Error fetching department distribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. Phân bổ theo chức danh (từ User model)
const getPositionDistribution = async (req, res) => {
  try {
    const distribution = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          color: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'Admin'] }, then: '#ff6b6b' },
                { case: { $eq: ['$_id', 'Quản lý'] }, then: '#fd7e14' },
                { case: { $eq: ['$_id', 'Nhân viên'] }, then: '#4dabf7' }
              ],
              default: '#40c057'
            }
          }
        }
      }
    ]);
    
    // Nếu không có dữ liệu, trả về mặc định
    if (distribution.length === 0) {
      return res.json([
        { name: 'Nhân viên', value: 0, color: '#4dabf7' },
        { name: 'Quản lý', value: 0, color: '#fd7e14' },
        { name: 'Admin', value: 0, color: '#ff6b6b' }
      ]);
    }
    
    res.json(distribution);
    
  } catch (error) {
    console.error('Error fetching position distribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 4. Phân bổ theo loại hợp đồng (từ Teacher model)
const getContractDistribution = async (req, res) => {
  try {
    const distribution = await Teacher.aggregate([
      {
        $group: {
          _id: '$contractType',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          color: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'Biên chế'] }, then: '#4dabf7' },
                { case: { $eq: ['$_id', 'HĐLĐ xác định thời hạn'] }, then: '#40c057' },
                { case: { $eq: ['$_id', 'HĐLĐ không xác định thời hạn'] }, then: '#ff6b6b' }
              ],
              default: '#adb5bd'
            }
          }
        }
      }
    ]);
    
    // Nếu không có dữ liệu, trả về mock data
    if (distribution.length === 0) {
      return res.json([
        { name: 'Biên chế', value: 0, color: '#4dabf7' },
        { name: 'HĐLĐ xác định thời hạn', value: 0, color: '#40c057' },
        { name: 'HĐLĐ không xác định thời hạn', value: 0, color: '#ff6b6b' }
      ]);
    }
    
    res.json(distribution);
    
  } catch (error) {
    console.error('Error fetching contract distribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 5. Thông báo quan trọng
const getNotifications = async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const notifications = [];
    
    // 1. Kiểm tra hợp đồng sắp hết hạn
    const expiringContracts = await Teacher.countDocuments({
      contractEndDate: {
        $lte: moment().add(30, 'days').toDate(),
        $gte: new Date()
      }
    });
    
    if (expiringContracts > 0) {
      notifications.push({
        id: 1,
        type: 'contract',
        title: 'Hợp đồng sắp hết hạn',
        description: `${expiringContracts} hợp đồng sẽ hết hạn trong 30 ngày tới`,
        priority: 'high',
        date: new Date().toISOString(),
        count: expiringContracts
      });
    }
    
    // 2. Kiểm tra sinh nhật tháng này
    const currentMonth = moment().month() + 1;
    const birthdays = await Teacher.countDocuments({
      $expr: { $eq: [{ $month: "$birthday" }, currentMonth] }
    });
    
    if (birthdays > 0) {
      notifications.push({
        id: 2,
        type: 'birthday',
        title: 'Sinh nhật tháng này',
        description: `${birthdays} giảng viên có sinh nhật trong tháng ${moment().format('MM')}`,
        priority: 'medium',
        date: new Date().toISOString(),
        count: birthdays
      });
    }
    
    // 3. Kiểm tra tài khoản user mới
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    
    if (newUsersToday > 0) {
      notifications.push({
        id: 3,
        type: 'user',
        title: 'Người dùng mới',
        description: `${newUsersToday} người dùng mới đăng ký hôm nay`,
        priority: 'medium',
        date: new Date().toISOString(),
        count: newUsersToday
      });
    }
    
    // 4. Thống kê truy cập
    const todayLogins = await AccessLog.countDocuments({
      action: 'login',
      timestamp: { $gte: today }
    });
    
    notifications.push({
      id: 4,
      type: 'activity',
      title: 'Hoạt động hôm nay',
      description: `${todayLogins} lượt đăng nhập hôm nay`,
      priority: 'low',
      date: new Date().toISOString(),
      count: todayLogins
    });
    
    // 5. Kiểm tra tài khoản không hoạt động
    const inactiveUsers = await User.countDocuments({ isActive: false });
    if (inactiveUsers > 0) {
      notifications.push({
        id: 5,
        type: 'warning',
        title: 'Tài khoản không hoạt động',
        description: `${inactiveUsers} tài khoản đang bị vô hiệu hóa`,
        priority: 'low',
        date: new Date().toISOString(),
        count: inactiveUsers
      });
    }
    
    res.json(notifications.slice(0, parseInt(limit)));
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.json([
      { 
        id: 1, 
        type: 'info', 
        title: 'Hệ thống hoạt động bình thường', 
        description: 'Không có thông báo mới', 
        priority: 'low', 
        date: new Date().toISOString(), 
        count: 0 
      }
    ]);
  }
};

// 6. Hoạt động gần đây
const getRecentActivities = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const activities = await AccessLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    const formattedActivities = activities.map(log => ({
      id: log._id,
      type: log.action === 'login' ? 'attendance' : 
            log.action === 'create' ? 'new_employee' :
            log.action === 'update' ? 'contract_update' : 
            log.action === 'logout' ? 'attendance' : 'default',
      action: log.action === 'login' ? 'Đăng nhập hệ thống' :
              log.action === 'logout' ? 'Đăng xuất' :
              log.action === 'create' ? 'Thêm mới' :
              log.action === 'update' ? 'Cập nhật' : 
              log.action === 'delete' ? 'Xóa' : log.action,
      user: log.userId?.name || 'Unknown User',
      department: log.userId?.position || log.userId?.role || 'User',
      time: moment(log.timestamp).fromNow(),
      avatar: log.userId?.name?.charAt(0) || 'U',
      created_at: log.timestamp
    }));
    
    res.json(formattedActivities);
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.json([]);
  }
};

// 7. Xuất báo cáo Excel
const exportReport = async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    
    // Lấy dữ liệu
    const stats = await getStatsData(range);
    const users = await User.find({ isActive: true })
      .populate('department', 'name code')
      .limit(500);
    const departments = await Department.find();
    const teachers = await Teacher.find().limit(100);
    
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Tổng quan
    const sheet1 = workbook.addWorksheet('Tổng quan');
    sheet1.mergeCells('A1:D1');
    sheet1.getCell('A1').value = `BÁO CÁO TỔNG QUAN HỆ THỐNG - ${moment().format('DD/MM/YYYY HH:mm')}`;
    sheet1.getCell('A1').font = { bold: true, size: 16 };
    sheet1.getCell('A1').alignment = { horizontal: 'center' };
    
    sheet1.addRow([]);
    sheet1.addRow(['THỐNG KÊ NHANH']);
    sheet1.getCell('A3').font = { bold: true };
    sheet1.addRow(['Tổng nhân viên', stats.totalEmployees]);
    sheet1.addRow(['Giảng viên', stats.teachers]);
    sheet1.addRow(['Nhân viên văn phòng', stats.staff]);
    sheet1.addRow(['Quản lý', stats.managers]);
    sheet1.addRow(['Admin', stats.admins]);
    sheet1.addRow(['Tổng khoa', stats.totalDepartments]);
    sheet1.addRow(['Tổng phòng ban', stats.totalOffices]);
    
    // Sheet 2: Danh sách người dùng
    const sheet2 = workbook.addWorksheet('Danh sách người dùng');
    sheet2.columns = [
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Họ tên', key: 'name', width: 25 },
      { header: 'Chức vụ', key: 'position', width: 15 },
      { header: 'Vai trò', key: 'role', width: 12 },
      { header: 'Khoa/Phòng', key: 'department', width: 25 },
      { header: 'Trạng thái', key: 'status', width: 15 }
    ];
    
    users.forEach(user => {
      sheet2.addRow({
        email: user.email,
        name: user.name || 'Chưa cập nhật',
        position: user.position || 'Nhân viên',
        role: user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Quản lý' : 'Người dùng',
        department: user.department?.name || 'Chưa phân công',
        status: user.isActive ? 'Hoạt động' : 'Không hoạt động'
      });
    });
    
    // Sheet 3: Danh sách khoa
    const sheet3 = workbook.addWorksheet('Danh sách khoa');
    sheet3.columns = [
      { header: 'Mã khoa', key: 'code', width: 15 },
      { header: 'Tên khoa', key: 'name', width: 30 },
      { header: 'Số giảng viên', key: 'facultyCount', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 }
    ];
    
    departments.forEach(dept => {
      sheet3.addRow({
        code: dept.code,
        name: dept.name,
        facultyCount: dept.facultyCount || 0,
        status: dept.status === 'active' ? 'Hoạt động' : 'Tạm dừng'
      });
    });
    
    // Ghi file
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=dashboard_report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Lấy data stats
const getStatsData = async (range) => {
  const [totalEmployees, teachers, staff, managers, admins, totalDepartments, totalOffices] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Teacher.countDocuments(),
    User.countDocuments({ position: 'Nhân viên', isActive: true }),
    User.countDocuments({ role: 'manager', isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true }),
    Department.countDocuments(),
    Office.countDocuments()
  ]);
  
  return { totalEmployees, teachers, staff, managers, admins, totalDepartments, totalOffices };
};

// 8. Lấy tất cả data dashboard trong 1 request
const getDashboardData = async (req, res) => {
  try {
    const { range = 'month', limit = 5 } = req.query;
    
    const [stats, departments, positions, contracts, notifications, activities] = await Promise.all([
      getStatsData(range),
      getDepartmentDistributionData(),
      getPositionDistributionData(),
      getContractDistributionData(),
      getNotificationsData(4),
      getRecentActivitiesData(parseInt(limit))
    ]);
    
    res.json({
      stats,
      departments,
      positions,
      contracts,
      notifications,
      activities
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper functions cho dashboard data
const getDepartmentDistributionData = async () => {
  const departments = await Department.find({ status: 'active' });
  const colors = ['#4dabf7', '#40c057', '#ff6b6b', '#7950f2', '#fd7e14', '#e64980'];
  
  const distribution = await Promise.all(departments.map(async (dept, index) => {
    const userCount = await User.countDocuments({ department: dept._id, isActive: true });
    return {
      name: dept.name,
      value: userCount,
      color: colors[index % colors.length]
    };
  }));
  
  return distribution.filter(d => d.value > 0);
};

const getPositionDistributionData = async () => {
  const distribution = await User.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$position', count: { $sum: 1 } } },
    { $project: { name: '$_id', value: '$count', color: '#4dabf7' } }
  ]);
  return distribution.length ? distribution : [{ name: 'Chưa có dữ liệu', value: 0, color: '#adb5bd' }];
};

const getContractDistributionData = async () => {
  const distribution = await Teacher.aggregate([
    { $group: { _id: '$contractType', count: { $sum: 1 } } },
    { $project: { name: '$_id', value: '$count', color: '#40c057' } }
  ]);
  return distribution.length ? distribution : [];
};

const getNotificationsData = async (limit) => {
  const notifications = [];
  const expiringContracts = await Teacher.countDocuments({
    contractEndDate: { $lte: moment().add(30, 'days').toDate(), $gte: new Date() }
  });
  
  if (expiringContracts > 0) {
    notifications.push({ 
      id: 1, 
      type: 'contract', 
      title: 'Hợp đồng sắp hết hạn', 
      description: `${expiringContracts} hợp đồng sẽ hết hạn`, 
      priority: 'high', 
      date: new Date(), 
      count: expiringContracts 
    });
  }
  return notifications.slice(0, limit);
};

const getRecentActivitiesData = async (limit) => {
  const logs = await AccessLog.find()
    .populate('userId', 'name')
    .sort({ timestamp: -1 })
    .limit(limit);
    
  return logs.map(log => ({
    id: log._id,
    type: 'attendance',
    action: log.action,
    user: log.userId?.name || 'Unknown',
    department: 'System',
    time: moment(log.timestamp).fromNow(),
    avatar: log.userId?.name?.charAt(0) || 'S',
    created_at: log.timestamp
  }));
};

module.exports = {
  getStats,
  getDepartmentDistribution,
  getPositionDistribution,
  getContractDistribution,
  getNotifications,
  getRecentActivities,
  exportReport,
  getDashboardData
};