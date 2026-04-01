// services/contractService.js
const Contract = require('../models/contract');
const fs = require('fs');
const path = require('path');

class ContractService {
    
    // Lấy tất cả hợp đồng
    async getAllContracts() {
        try {
            const contracts = await Contract.find()
                .sort({ createdAt: -1 })
                .lean();
            
            // Format dữ liệu cho frontend
            return contracts.map(contract => ({
                _id: contract._id,
                code: contract.contractCode,
                customer: contract.customerName,
                customerId: contract.customerId,
                type: contract.contractType,
                startDate: contract.startDate,
                endDate: contract.endDate,
                amount: contract.amount,
                description: contract.description,
                attachments: contract.attachments ? contract.attachments.length : 0,
                status: contract.status,
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt
            }));
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách hợp đồng: ${error.message}`);
        }
    }

    // Lấy hợp đồng theo ID
    async getContractById(id) {
        try {
            const contract = await Contract.findById(id).lean();
            if (!contract) {
                throw new Error('Không tìm thấy hợp đồng');
            }
            
            return {
                _id: contract._id,
                code: contract.contractCode,
                customer: contract.customerName,
                customerId: contract.customerId,
                type: contract.contractType,
                startDate: contract.startDate,
                endDate: contract.endDate,
                amount: contract.amount,
                description: contract.description,
                attachments: contract.attachments || [],
                status: contract.status,
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy chi tiết hợp đồng: ${error.message}`);
        }
    }

    // Thêm hợp đồng mới
    async addContract(contractData) {
        try {
            // Kiểm tra mã hợp đồng đã tồn tại
            const existingContract = await Contract.findOne({ 
                contractCode: contractData.contractCode.toUpperCase() 
            });
            
            if (existingContract) {
                throw new Error('Mã hợp đồng đã tồn tại trong hệ thống');
            }

            // Xử lý file attachments
            let attachments = [];
            if (contractData.attachments && contractData.attachments.length > 0) {
                attachments = contractData.attachments.map(file => ({
                    fileName: file.originalname || file.name,
                    filePath: file.path || `/uploads/${file.filename}`,
                    fileSize: file.size,
                    fileType: file.mimetype || file.type
                }));
            }

            // Tạo hợp đồng mới
            const newContract = new Contract({
                contractCode: contractData.contractCode.toUpperCase(),
                customerName: contractData.customerName,
                customerId: contractData.customerId,
                contractType: contractData.contractType,
                startDate: new Date(contractData.startDate),
                endDate: new Date(contractData.endDate),
                amount: parseFloat(contractData.amount),
                description: contractData.description || '',
                attachments: attachments
            });

            await newContract.save();
            
            return {
                success: true,
                message: 'Tạo hợp đồng thành công',
                contract: newContract
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Cập nhật trạng thái hợp đồng
    async updateContractStatus(contractId, status, endDate = null) {
        try {
            const contract = await Contract.findById(contractId);
            if (!contract) {
                throw new Error('Không tìm thấy hợp đồng');
            }

            // Cập nhật trạng thái
            contract.status = status;
            
            // Cập nhật ngày kết thúc nếu có
            if (endDate) {
                contract.endDate = new Date(endDate);
            }

            await contract.save();
            
            return {
                success: true,
                message: 'Cập nhật trạng thái thành công',
                contract: contract
            };
        } catch (error) {
            throw new Error(`Lỗi khi cập nhật trạng thái: ${error.message}`);
        }
    }

    // Xóa hợp đồng
    async deleteContract(contractId) {
        try {
            const contract = await Contract.findById(contractId);
            if (!contract) {
                throw new Error('Không tìm thấy hợp đồng');
            }

            // Xóa file attachments nếu có
            if (contract.attachments && contract.attachments.length > 0) {
                for (const attachment of contract.attachments) {
                    if (attachment.filePath) {
                        const filePath = path.join(__dirname, '..', attachment.filePath);
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }
                }
            }

            await Contract.findByIdAndDelete(contractId);
            
            return {
                success: true,
                message: 'Xóa hợp đồng thành công'
            };
        } catch (error) {
            throw new Error(`Lỗi khi xóa hợp đồng: ${error.message}`);
        }
    }

    // Tìm kiếm hợp đồng
    async searchContracts(searchTerm) {
        try {
            const contracts = await Contract.find({
                $or: [
                    { contractCode: { $regex: searchTerm, $options: 'i' } },
                    { customerName: { $regex: searchTerm, $options: 'i' } },
                    { customerId: { $regex: searchTerm, $options: 'i' } }
                ]
            }).sort({ createdAt: -1 }).lean();

            return contracts.map(contract => ({
                _id: contract._id,
                code: contract.contractCode,
                customer: contract.customerName,
                customerId: contract.customerId,
                type: contract.contractType,
                startDate: contract.startDate,
                endDate: contract.endDate,
                amount: contract.amount,
                description: contract.description,
                attachments: contract.attachments ? contract.attachments.length : 0,
                status: contract.status,
                createdAt: contract.createdAt,
                updatedAt: contract.updatedAt
            }));
        } catch (error) {
            throw new Error(`Lỗi khi tìm kiếm hợp đồng: ${error.message}`);
        }
    }

    // Kiểm tra và cập nhật trạng thái
    async checkAndUpdateStatus() {
        try {
            return await Contract.checkAndUpdateStatus();
        } catch (error) {
            throw new Error(`Lỗi khi kiểm tra trạng thái: ${error.message}`);
        }
    }

    // Lấy thống kê
    async getContractStats() {
        try {
            return await Contract.getStats();
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê: ${error.message}`);
        }
    }
}

module.exports = new ContractService();