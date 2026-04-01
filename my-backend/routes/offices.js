// routes/offices.js - COMPLETE VERSION
const express = require('express');
const router = express.Router();
const Office = require('../models/Office');

console.log('✅ Office routes loaded');

// ====================
// GET ALL OFFICES
// ====================
router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/offices - Query params:', req.query);

    const { search, status, category, sortBy = 'name', sortOrder = 'asc' } = req.query;

    let query = {};

    // Tìm kiếm
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      query.status = status;
    }

    // Lọc theo loại
    if (category && category !== 'all') {
      query.category = category;
    }

    // Sắp xếp
    const sort = {};
    if (sortBy === 'name') sort.name = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'performance') sort.performance = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'staffCount') sort.staffCount = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'budget') sort.budget = sortOrder === 'desc' ? -1 : 1;
    if (sortBy === 'createdAt') sort.createdAt = sortOrder === 'desc' ? -1 : 1;

    console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));
    console.log('📊 Sort options:', sort);

    // Execute query
    const offices = await Office.find(query).sort(sort);

    console.log(`✅ Found ${offices.length} offices`);

    res.json({
      success: true,
      data: offices
    });
  } catch (error) {
    console.error('❌ Error in GET /api/offices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách phòng ban',
      error: error.message
    });
  }
});

// ====================
// GET STATS
// ====================
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/offices/stats');
    const offices = await Office.find();

    console.log(`📈 Processing stats for ${offices.length} offices`);

    const stats = {
      totalOffices: offices.length,
      totalStaff: offices.reduce((sum, office) => sum + (office.staffCount || 0), 0),
      avgPerformance: offices.length > 0 ?
        Math.round(offices.reduce((sum, office) => sum + (office.performance || 0), 0) / offices.length) : 0,
      totalBudget: offices.reduce((sum, office) => sum + (office.budget || 0), 0),
      activeOffices: offices.filter(o => o.status === 'active').length,
      totalExpenses: offices.reduce((sum, office) => sum + (office.monthlyExpenses || 0), 0),
      totalTasksCompleted: offices.reduce((sum, office) => sum + (office.tasksCompleted || 0), 0),
      totalPendingTasks: offices.reduce((sum, office) => sum + (office.pendingTasks || 0), 0),
      budgetUtilization: 0
    };

    console.log('📊 Stats calculated:', stats);

    res.json({
      success: true,
      data: {
        summary: stats,
        chartData: {}
      }
    });
  } catch (error) {
    console.error('❌ Error in GET /api/offices/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

// ====================
// GET OFFICE BY ID
// ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 GET /api/offices/:id - ID:', id);

    const office = await Office.findById(id);

    if (!office) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      });
    }

    res.json({
      success: true,
      data: office
    });
  } catch (error) {
    console.error('❌ Error in GET /api/offices/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
});

 
// ====================
// CREATE OFFICE (POST)
// ====================
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/offices - Body:', req.body);

    // Validate required fields
    const requiredFields = ['code', 'name', 'director', 'phone', 'email'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `Thiếu trường bắt buộc: ${field}`
        });
      }
    }

    // Check if office code already exists
    const existingOffice = await Office.findOne({ code: req.body.code });
    if (existingOffice) {
      return res.status(400).json({
        success: false,
        message: 'Mã phòng ban đã tồn tại'
      });
    }

    // Process array fields
    const officeData = {
      ...req.body,
      viceDirector: req.body.viceDirector ? 
        (typeof req.body.viceDirector === 'string' ? 
          req.body.viceDirector.split(',').map(item => item.trim()).filter(item => item) : 
          req.body.viceDirector) : [],
      responsibilities: req.body.responsibilities ?
        (typeof req.body.responsibilities === 'string' ? 
          req.body.responsibilities.split(',').map(item => item.trim()).filter(item => item) : 
          req.body.responsibilities) : [],
      services: req.body.services ?
        (typeof req.body.services === 'string' ? 
          req.body.services.split(',').map(item => item.trim()).filter(item => item) : 
          req.body.services) : []
    };

    // Create new office
    const newOffice = new Office(officeData);
    const savedOffice = await newOffice.save();

    console.log('✅ Office created successfully:', savedOffice.code);

    res.status(201).json({
      success: true,
      message: 'Tạo phòng ban thành công',
      data: savedOffice
    });
  } catch (error) {
    console.error('❌ Error in POST /api/offices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo phòng ban',
      error: error.message
    });
  }
});

// ====================
// UPDATE OFFICE (PUT)
// ====================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ PUT /api/offices/:id - ID:', id, 'Body:', req.body);

    // Process array fields
    const updateData = {
      ...req.body,
      viceDirector: req.body.viceDirector ? 
        (typeof req.body.viceDirector === 'string' ? 
          req.body.viceDirector.split(',').map(item => item.trim()).filter(item => item) : 
          req.body.viceDirector) : [],
      responsibilities: req.body.responsibilities ?
        (typeof req.body.responsibilities === 'string' ? 
          req.body.responsibilities.split(',').map(item => item.trim()).filter(item => item) : 
          req.body.responsibilities) : [],
      services: req.body.services ?
        (typeof req.body.services === 'string' ? 
          req.body.services.split(',').map(item => item.trim()).filter(item => item) : 
          req.body.services) : []
    };

    const updatedOffice = await Office.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedOffice) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      });
    }

    console.log('✅ Office updated successfully:', updatedOffice.code);

    res.json({
      success: true,
      message: 'Cập nhật phòng ban thành công',
      data: updatedOffice
    });
  } catch (error) {
    console.error('❌ Error in PUT /api/offices/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật phòng ban',
      error: error.message
    });
  }
});

// ====================
// DELETE OFFICE
// ====================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ DELETE /api/offices/:id - ID:', id);

    const office = await Office.findByIdAndDelete(id);

    if (!office) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng ban'
      });
    }

    console.log('✅ Office deleted successfully:', office.code);

    res.json({
      success: true,
      message: 'Đã xóa phòng ban thành công',
      data: office
    });
  } catch (error) {
    console.error('❌ Error in DELETE /api/offices/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phòng ban',
      error: error.message
    });
  }
});

module.exports = router;