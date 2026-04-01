const asyncHandler = require('express-async-handler');
const Office = require('../models/Office');

// @desc    Lấy tất cả phòng ban
// @route   GET /api/offices
// @access  Public
const getOffices = asyncHandler(async (req, res) => {
  const {
    category,
    status,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    limit = 10
  } = req.query;

  // Xây dựng query
  let query = {};

  // Filter theo category
  if (category) {
    query.category = category;
  }

  // Filter theo status
  if (status) {
    query.status = status;
  }

  // Search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { director: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Sort
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Thực hiện query
  const offices = await Office.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Tính toán thống kê
  const total = await Office.countDocuments(query);
  const stats = await Office.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalOffices: { $sum: 1 },
        totalStaff: { $sum: '$staffCount' },
        avgPerformance: { $avg: '$performance' },
        totalBudget: { $sum: '$budget' },
        activeOffices: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    count: offices.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    stats: stats[0] || {
      totalOffices: 0,
      totalStaff: 0,
      avgPerformance: 0,
      totalBudget: 0,
      activeOffices: 0
    },
    data: offices
  });
});

// @desc    Lấy thông tin một phòng ban
// @route   GET /api/offices/:id
// @access  Public
const getOfficeById = asyncHandler(async (req, res) => {
  const office = await Office.findById(req.params.id);

  if (!office) {
    res.status(404);
    throw new Error('Không tìm thấy phòng ban');
  }

  res.status(200).json({
    success: true,
    data: office
  });
});

// @desc    Tạo phòng ban mới
// @route   POST /api/offices
// @access  Public
const createOffice = asyncHandler(async (req, res) => {
  const {
    code,
    name,
    description,
    director,
    phone,
    email,
    location,
    category
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!code || !name || !description || !director || !phone || !email || !location || !category) {
    res.status(400);
    throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
  }

  // Kiểm tra mã phòng ban đã tồn tại
  const officeExists = await Office.findOne({ code });
  if (officeExists) {
    res.status(400);
    throw new Error('Mã phòng ban đã tồn tại');
  }

  // Xử lý mảng
  const processArray = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      return field.split(',').map(item => item.trim()).filter(item => item !== '');
    }
    return [];
  };

  const officeData = {
    ...req.body,
    responsibilities: processArray(req.body.responsibilities),
    services: processArray(req.body.services),
    viceDirector: processArray(req.body.viceDirector)
  };

  const office = await Office.create(officeData);

  res.status(201).json({
    success: true,
    message: 'Tạo phòng ban thành công',
    data: office
  });
});

// @desc    Cập nhật phòng ban
// @route   PUT /api/offices/:id
// @access  Public
const updateOffice = asyncHandler(async (req, res) => {
  let office = await Office.findById(req.params.id);

  if (!office) {
    res.status(404);
    throw new Error('Không tìm thấy phòng ban');
  }

  // Kiểm tra mã phòng ban nếu có thay đổi
  if (req.body.code && req.body.code !== office.code) {
    const officeExists = await Office.findOne({ code: req.body.code });
    if (officeExists) {
      res.status(400);
      throw new Error('Mã phòng ban đã tồn tại');
    }
  }

  // Xử lý mảng
  const processArray = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      return field.split(',').map(item => item.trim()).filter(item => item !== '');
    }
    return field;
  };

  const updateData = {
    ...req.body,
    responsibilities: processArray(req.body.responsibilities),
    services: processArray(req.body.services),
    viceDirector: processArray(req.body.viceDirector),
    updatedAt: Date.now()
  };

  office = await Office.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'Cập nhật phòng ban thành công',
    data: office
  });
});

// @desc    Xóa phòng ban
// @route   DELETE /api/offices/:id
// @access  Public
const deleteOffice = asyncHandler(async (req, res) => {
  const office = await Office.findById(req.params.id);

  if (!office) {
    res.status(404);
    throw new Error('Không tìm thấy phòng ban');
  }

  await office.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Xóa phòng ban thành công',
    data: {}
  });
});

// @desc    Lấy thống kê
// @route   GET /api/offices/stats/summary
// @access  Public
const getOfficeStats = asyncHandler(async (req, res) => {
  const stats = await Office.aggregate([
    {
      $group: {
        _id: null,
        totalOffices: { $sum: 1 },
        totalStaff: { $sum: '$staffCount' },
        avgPerformance: { $avg: '$performance' },
        totalBudget: { $sum: '$budget' },
        totalExpenses: { $sum: '$monthlyExpenses' },
        totalTasksCompleted: { $sum: '$tasksCompleted' },
        totalPendingTasks: { $sum: '$pendingTasks' }
      }
    },
    {
      $project: {
        _id: 0,
        totalOffices: 1,
        totalStaff: 1,
        avgPerformance: { $round: ['$avgPerformance', 1] },
        totalBudget: 1,
        totalExpenses: 1,
        totalTasksCompleted: 1,
        totalPendingTasks: 1,
        budgetUtilization: {
          $cond: [
            { $eq: ['$totalBudget', 0] },
            0,
            { $multiply: [{ $divide: ['$totalExpenses', '$totalBudget'] }, 100] }
          ]
        }
      }
    }
  ]);

  // Thống kê theo category
  const categoryStats = await Office.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalStaff: { $sum: '$staffCount' },
        avgPerformance: { $avg: '$performance' }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        totalStaff: 1,
        avgPerformance: { $round: ['$avgPerformance', 1] },
        _id: 0
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: stats[0] || {
        totalOffices: 0,
        totalStaff: 0,
        avgPerformance: 0,
        totalBudget: 0,
        totalExpenses: 0,
        totalTasksCompleted: 0,
        totalPendingTasks: 0,
        budgetUtilization: 0
      },
      byCategory: categoryStats
    }
  });
});

module.exports = {
  getOffices,
  getOfficeById,
  createOffice,
  updateOffice,
  deleteOffice,
  getOfficeStats
};