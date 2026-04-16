const express = require('express');
const router = express.Router();
const dashboardController = require('../Controller/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// Dashboard routes (có thể bỏ authMiddleware nếu chưa cần xác thực)
router.get('/stats', dashboardController.getStats);
router.get('/department-distribution', dashboardController.getDepartmentDistribution);
router.get('/position-distribution', dashboardController.getPositionDistribution);
router.get('/contract-distribution', dashboardController.getContractDistribution);
router.get('/notifications', dashboardController.getNotifications);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/export-report', dashboardController.exportReport);
router.get('/all', dashboardController.getDashboardData);

module.exports = router;