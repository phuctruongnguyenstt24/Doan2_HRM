// routes/contractRoutes.js
const express = require('express');
const router = express.Router();
const contractService = require('../services/contractService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png'
        ];
        
        if (allowedTypes.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOC, DOCX, JPG, JPEG, PNG'));
        }
    }
});

// Middleware xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File quá lớn. Kích thước tối đa là 10MB' });
        }
        return res.status(400).json({ message: err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// Lấy tất cả hợp đồng
router.get('/', async (req, res) => {
    try {
        const contracts = await contractService.getAllContracts();
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy chi tiết hợp đồng
router.get('/:id', async (req, res) => {
    try {
        const contract = await contractService.getContractById(req.params.id);
        res.json(contract);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Tạo hợp đồng mới
router.post('/', upload.array('attachments', 5), handleMulterError, async (req, res) => {
    try {
        console.log('📥 Received contract data:', req.body);
        console.log('📎 Received files:', req.files);
        
        const contractData = {
            ...req.body,
            attachments: req.files || []
        };
        const result = await contractService.addContract(contractData);
        res.status(201).json(result);
    } catch (error) {
        console.error('❌ Error creating contract:', error);
        res.status(400).json({ message: error.message });
    }
});

// Cập nhật trạng thái hợp đồng
router.put('/:id/status', async (req, res) => {
    try {
        const { status, endDate } = req.body;
        const result = await contractService.updateContractStatus(req.params.id, status, endDate);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Xóa hợp đồng
router.delete('/:id', async (req, res) => {
    try {
        const result = await contractService.deleteContract(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Tìm kiếm hợp đồng
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }
        const contracts = await contractService.searchContracts(q);
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Kiểm tra và cập nhật trạng thái
router.post('/check-status', async (req, res) => {
    try {
        const result = await contractService.checkAndUpdateStatus();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy thống kê
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await contractService.getContractStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;