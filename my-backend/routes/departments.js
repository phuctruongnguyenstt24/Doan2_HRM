// routes/departments.js
const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Lấy tất cả khoa
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      status, 
      sortBy = 'name', 
      sortOrder = 'asc',
      page = 1,
      limit = 10 
    } = req.query;

    let query = {};

    // Tìm kiếm
    if (search) {
      query.$text = { $search: search };
    }

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      query.status = status;
    }

    // Sắp xếp
    let sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const departments = await Department.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Department.countDocuments(query);

    res.json({
      success: true,
      data: departments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách khoa',
      error: error.message
    });
  }
});

// Lấy chi tiết một khoa theo ID
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin khoa',
      error: error.message
    });
  }
});

// Lấy khoa theo mã
router.get('/code/:code', async (req, res) => {
  try {
    const department = await Department.findOne({ 
      code: req.params.code.toUpperCase() 
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa với mã này'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin khoa',
      error: error.message
    });
  }
});

// Thêm khoa mới
router.post('/', async (req, res) => {
  try {
    const { code } = req.body;

    // Kiểm tra mã khoa đã tồn tại chưa
    const existingDepartment = await Department.findOne({ 
      code: code.toUpperCase() 
    });
    
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Mã khoa đã tồn tại'
      });
    }

    // Tạo khoa mới
    const department = new Department({
      ...req.body,
      code: code.toUpperCase(),
      createdAt: new Date(),
      lastActive: new Date()
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'Thêm khoa thành công',
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm khoa',
      error: error.message
    });
  }
});

// Cập nhật khoa
// routes/departments.js

// Cập nhật khoa
router.put('/:id', async (req, res) => {
  try {
    const { code } = req.body;
    const departmentId = req.params.id; // ✅ Lấy ID từ params

    // Kiểm tra mã khoa mới có bị trùng không (nếu có thay đổi code)
    if (code) {
      const existingDepartment = await Department.findOne({
        code: code.toUpperCase(),
        _id: { $ne: departmentId } // ✅ Sử dụng departmentId thay vì req.params._id
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Mã khoa đã tồn tại'
        });
      }
    }

    // Cập nhật khoa
    const department = await Department.findByIdAndUpdate(
      departmentId,
      {
        ...req.body,
        code: code ? code.toUpperCase() : undefined,
        lastActive: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật khoa thành công',
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật khoa',
      error: error.message
    });
  }
});

// Xóa khoa
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    res.json({
      success: true,
      message: 'Xóa khoa thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa khoa',
      error: error.message
    });
  }
});

// Cập nhật trạng thái khoa (active/inactive)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      {
        status,
        lastActive: new Date()
      },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    res.json({
      success: true,
      message: `Đã ${status === 'active' ? 'kích hoạt' : 'tạm dừng'} khoa thành công`,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
});

// Thống kê tổng quan
router.get('/stats/overview', async (req, res) => {
  try {
    const totalDepartments = await Department.countDocuments();
    const totalFaculty = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$facultyCount' } } }
    ]);
    const totalStudents = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$studentCount' } } }
    ]);
    const activeDepartments = await Department.countDocuments({ status: 'active' });
    const avgPerformance = await Department.aggregate([
      { $group: { _id: null, avg: { $avg: '$performance' } } }
    ]);
    const totalBudget = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } }
    ]);
    const totalResearchGrants = await Department.aggregate([
      { $group: { _id: null, total: { $sum: '$researchGrants' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalDepartments,
        totalFaculty: totalFaculty[0]?.total || 0,
        totalStudents: totalStudents[0]?.total || 0,
        activeDepartments,
        avgPerformance: Math.round(avgPerformance[0]?.avg || 0),
        totalBudget: totalBudget[0]?.total || 0,
        totalResearchGrants: totalResearchGrants[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê',
      error: error.message
    });
  }
});

// Lấy danh sách chương trình đào tạo theo khoa
router.get('/:id/programs', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).select('programs');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    res.json({
      success: true,
      data: department.programs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chương trình',
      error: error.message
    });
  }
});

module.exports = router;