// models/Contract.js
const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    contractCode: {
        type: String,
        required: [true, 'Mã hợp đồng không được để trống'],
        unique: true,
        uppercase: true,
        trim: true,
        match: [/^[A-Z0-9-]+$/, 'Mã hợp đồng chỉ chứa chữ hoa, số và dấu gạch ngang'],
        maxlength: [20, 'Mã hợp đồng không được quá 20 ký tự']
    },
    customerName: {
        type: String,
        required: [true, 'Tên khách hàng không được để trống'],
        trim: true,
        maxlength: [100, 'Tên khách hàng không được quá 100 ký tự']
    },
    customerId: {
        type: String,
        required: [true, 'Số CMND/CCCD không được để trống'],
        trim: true,
        match: [/^[0-9]{9,12}$/, 'Số CMND/CCCD phải từ 9-12 chữ số']
    },
    contractType: {
        type: String,
        enum: ['Thường', 'Cao cấp', 'VIP', 'Doanh nghiệp'],
        default: 'Thường'
    },
    startDate: {
        type: Date,
        required: [true, 'Ngày bắt đầu không được để trống']
    },
    endDate: {
        type: Date,
        required: [true, 'Ngày kết thúc không được để trống'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'Ngày kết thúc phải sau ngày bắt đầu'
        }
    },
    amount: {
        type: Number,
        required: [true, 'Số tiền hợp đồng không được để trống'],
        min: [0, 'Số tiền phải lớn hơn 0'],
        max: [1000000000, 'Số tiền không được vượt quá 1 tỷ đồng']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    attachments: [{
        fileName: String,
        filePath: String,
        fileSize: Number,
        fileType: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['Chưa bắt đầu', 'Đang hoạt động', 'Sắp hết hạn', 'Đã hết hạn', 'Tạm ngưng', 'Hủy bỏ'],
        default: function() {
            const now = new Date();
            if (now < this.startDate) return 'Chưa bắt đầu';
            if (now > this.endDate) return 'Đã hết hạn';
            
            // Kiểm tra sắp hết hạn (trong vòng 30 ngày)
            const daysUntilEnd = Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntilEnd <= 30) return 'Sắp hết hạn';
            
            return 'Đang hoạt động';
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Tạo index cho tìm kiếm
contractSchema.index({ contractCode: 'text', customerName: 'text', customerId: 'text' });

// Middleware để tự động cập nhật status
contractSchema.pre('save', function() {
    const now = new Date();
    
    if (now < this.startDate) {
        this.status = 'Chưa bắt đầu';
    } else if (now > this.endDate) {
        this.status = 'Đã hết hạn';
    } else {
        const daysUntilEnd = Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
        if (daysUntilEnd <= 30) {
            this.status = 'Sắp hết hạn';
        } else {
            this.status = 'Đang hoạt động';
        }
    }
});

// Phương thức kiểm tra và cập nhật status hàng loạt
contractSchema.statics.checkAndUpdateStatus = async function() {
    const now = new Date();
    const updatedContracts = [];
    
    // Cập nhật hợp đồng sắp hết hạn
    const expiringContracts = await this.find({
        endDate: { 
            $gt: now,
            $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        },
        status: 'Đang hoạt động'
    });
    
    for (const contract of expiringContracts) {
        contract.status = 'Sắp hết hạn';
        await contract.save();
        updatedContracts.push(contract._id);
    }
    
    // Cập nhật hợp đồng đã hết hạn
    const expiredContracts = await this.find({
        endDate: { $lt: now },
        status: { $in: ['Đang hoạt động', 'Sắp hết hạn'] }
    });
    
    for (const contract of expiredContracts) {
        contract.status = 'Đã hết hạn';
        await contract.save();
        updatedContracts.push(contract._id);
    }
    
    return {
        updatedCount: updatedContracts.length,
        updatedIds: updatedContracts
    };
};

// Phương thức thống kê
contractSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                activeContracts: {
                    $sum: { $cond: [{ $eq: ['$status', 'Đang hoạt động'] }, 1, 0] }
                },
                expiredContracts: {
                    $sum: { $cond: [{ $eq: ['$status', 'Đã hết hạn'] }, 1, 0] }
                },
                expiringContracts: {
                    $sum: { $cond: [{ $eq: ['$status', 'Sắp hết hạn'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                totalAmount: 1,
                activeContracts: 1,
                expiredContracts: 1,
                expiringContracts: 1
            }
        }
    ]);
    
    return stats[0] || {
        total: 0,
        totalAmount: 0,
        activeContracts: 0,
        expiredContracts: 0,
        expiringContracts: 0
    };
};

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;