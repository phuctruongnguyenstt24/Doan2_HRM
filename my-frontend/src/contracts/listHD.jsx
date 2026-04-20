import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListHD.css';
import contractService from '../services/contractService';

const ListHD = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContract, setSelectedContract] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData, setUpdateData] = useState({
        status: '',
        endDate: ''
    });
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadContracts();
        loadStats();
        const interval = setInterval(() => checkAndUpdateStatus(), 3600000); // 1 giờ
        return () => clearInterval(interval);
    }, []);

    // Hàm tải danh sách hợp đồng
    const loadContracts = async () => {
        setLoading(true);
        try {
            const data = await contractService.getAllContracts();
            const updatedData = data.map(contract => ({
                ...contract,
                status: getAutoStatus(contract)
            }));
            setContracts(updatedData);
        } catch (error) {
            console.error('Error loading contracts:', error);
            alert(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };
    // Hàm tải thống kê
    const loadStats = async () => {
        try {
            const data = await contractService.getContractStats();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Hàm kiểm tra và cập nhật trạng thái
    const checkAndUpdateStatus = async () => {
        try {
            let updatedCount = 0;
            for (const contract of contracts) {
                const autoStatus = getAutoStatus(contract);
                if (autoStatus !== contract.status) {
                    await contractService.updateContractStatus(contract._id, autoStatus, contract.endDate);
                    updatedCount++;
                }
            }
            if (updatedCount > 0) {
                alert(`Đã cập nhật ${updatedCount} hợp đồng`);
                loadContracts();
                loadStats();
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    // Xử lý tìm kiếm
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadContracts();
            return;
        }

        setLoading(true);
        try {
            const data = await contractService.searchContracts(searchTerm);
            setContracts(data);
        } catch (error) {
            console.error('Error searching contracts:', error);
            alert(error.message || 'Có lỗi xảy ra khi tìm kiếm');
        } finally {
            setLoading(false);
        }
    };

    // Lọc hợp đồng (kết hợp tìm kiếm local và API)
    const filteredContracts = contracts.filter(contract =>
        contract.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contract.customerId && contract.customerId.includes(searchTerm))
    );

    // Lấy class cho trạng thái
    const getStatusClass = (status) => {
        switch (status) {
            case 'Đang hoạt động': return 'status-active';
            case 'Đã hết hạn': return 'status-expired';
            case 'Sắp hết hạn': return 'status-warning';
            case 'Chưa bắt đầu': return 'status-pending';
            case 'Tạm ngưng': return 'status-suspended';
            case 'Hủy bỏ': return 'status-cancelled';
            default: return 'status-default';
        }
    };

    // Định dạng tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    // Định dạng ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };
    const getAutoStatus = (contract) => {
        if (contract.status === 'Hủy bỏ' || contract.status === 'Tạm ngưng') return contract.status;

        const today = new Date();
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);

        if (start > today) return 'Chưa bắt đầu';
        if (end < today) return 'Đã hết hạn';

        const daysRemaining = Math.round((end - today) / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 30) return 'Sắp hết hạn';

        return 'Đang hoạt động';
    };
    // Xem chi tiết hợp đồng
    const handleViewDetail = async (contract) => {
        try {
            // Lấy chi tiết đầy đủ từ API
            const detail = await contractService.getContractById(contract._id);
            setSelectedContract(detail);

            // Hiển thị modal chi tiết (bạn có thể tạo modal riêng)
            alert(`Chi tiết hợp đồng:
Mã: ${detail.code}
Khách hàng: ${detail.customer}
CMND/CCCD: ${detail.customerId || 'N/A'}
Loại: ${detail.type}
Ngày bắt đầu: ${formatDate(detail.startDate)}
Ngày kết thúc: ${formatDate(detail.endDate)}
Số tiền: ${formatCurrency(detail.amount)}
Mô tả: ${detail.description || 'Không có'}
File đính kèm: ${detail.attachments || 0} file
Trạng thái: ${detail.status}
Ngày tạo: ${formatDate(detail.createdAt)}
Ngày cập nhật: ${formatDate(detail.updatedAt)}`);
        } catch (error) {
            console.error('Error viewing contract detail:', error);
            alert('Không thể tải chi tiết hợp đồng');
        }
    };

    // Xử lý in hợp đồng
    const handlePrint = (contract) => {
        setSelectedContract(contract);
        setShowPrintModal(true);
    };

    // In hợp đồng
    const printContract = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hợp đồng ${selectedContract.code}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; }
                        .contract-info { margin: 20px 0; }
                        .info-row { margin: 10px 0; display: flex; }
                        .label { font-weight: bold; width: 150px; }
                        .value { flex: 1; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .footer { margin-top: 50px; text-align: right; }
                        .signature { margin-top: 30px; display: flex; justify-content: space-between; }
                        .print-date { text-align: center; margin-top: 20px; font-style: italic; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">HỢP ĐỒNG DỊCH VỤ</div>
                        <div>Số: ${selectedContract.code}</div>
                    </div>
                    
                    <div class="contract-info">
                        <div class="info-row">
                            <span class="label">Ngày lập:</span>
                            <span class="value">${formatDate(new Date())}</span>
                        </div>
                    </div>

                    <h3>THÔNG TIN KHÁCH HÀNG</h3>
                    <table>
                        <tr>
                            <th>Họ và tên</th>
                            <td>${selectedContract.customer}</td>
                        </tr>
                        <tr>
                            <th>CMND/CCCD</th>
                            <td>${selectedContract.customerId || 'N/A'}</td>
                        </tr>
                    </table>

                    <h3>THÔNG TIN HỢP ĐỒNG</h3>
                    <table>
                        <tr>
                            <th>Loại hợp đồng</th>
                            <td>${selectedContract.type}</td>
                        </tr>
                        <tr>
                            <th>Ngày bắt đầu</th>
                            <td>${formatDate(selectedContract.startDate)}</td>
                        </tr>
                        <tr>
                            <th>Ngày kết thúc</th>
                            <td>${formatDate(selectedContract.endDate)}</td>
                        </tr>
                        <tr>
                            <th>Số tiền</th>
                            <td>${formatCurrency(selectedContract.amount)}</td>
                        </tr>
                        <tr>
                            <th>Mô tả</th>
                            <td>${selectedContract.description || 'Không có'}</td>
                        </tr>
                        <tr>
                            <th>Trạng thái</th>
                            <td>${selectedContract.status}</td>
                        </tr>
                    </table>

                    <div class="print-date">
                        <p>Ngày in: ${formatDate(new Date())}</p>
                    </div>

                    <div class="footer">
                        <div class="signature">
                            <div>
                                <p>ĐẠI DIỆN BÊN A</p>
                                <p>(Ký, ghi rõ họ tên)</p>
                            </div>
                            <div>
                                <p>ĐẠI DIỆN BÊN B</p>
                                <p>(Ký, ghi rõ họ tên)</p>
                            </div>
                        </div>
                    </div>
                    
                    <script>
                        window.onload = function() { 
                            setTimeout(function() { window.print(); }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setShowPrintModal(false);
    };

    // Mở modal cập nhật trạng thái
    const handleUpdateStatus = (contract) => {
        setSelectedContract(contract);
        setUpdateData({
            status: contract.status,
            endDate: contract.endDate ? contract.endDate.split('T')[0] : ''
        });
        setShowUpdateModal(true);
    };

    // Cập nhật trạng thái hợp đồng
    const updateContractStatus = async () => {
        try {
            if (selectedContract) {
                const finalStatus = getAutoStatus({ ...selectedContract, endDate: updateData.endDate, status: updateData.status });
                await contractService.updateContractStatus(selectedContract._id, finalStatus, updateData.endDate);
                alert('Cập nhật thành công!');
                loadContracts();
                loadStats();
                setShowUpdateModal(false);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.message || 'Có lỗi xảy ra khi cập nhật');
        }
    };

    // Xóa hợp đồng
    const handleDeleteContract = async (contract) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa hợp đồng ${contract.code}?`)) {
            try {
                await contractService.deleteContract(contract._id);
                alert('Xóa hợp đồng thành công!');
                loadContracts(); // Tải lại danh sách
                loadStats(); // Tải lại thống kê
            } catch (error) {
                console.error('Error deleting contract:', error);
                alert(error.message || 'Có lỗi xảy ra khi xóa hợp đồng');
            }
        }
    };

    // Xử lý thay đổi trạng thái
    const handleStatusChange = (e) => {
        setUpdateData({
            ...updateData,
            status: e.target.value
        });
    };

    // Xử lý thay đổi ngày kết thúc
    const handleEndDateChange = (e) => {
        setUpdateData({
            ...updateData,
            endDate: e.target.value
        });
    };

    // Xuất Excel (dùng dữ liệu hiện tại)
    const handleExportExcel = () => {
        try {
            // Chuyển đổi dữ liệu thành CSV
            const headers = ['Mã hợp đồng', 'Khách hàng', 'CMND/CCCD', 'Loại', 'Ngày bắt đầu', 'Ngày kết thúc', 'Số tiền', 'File', 'Trạng thái'];
            const csvRows = [];

            // Thêm headers
            csvRows.push(headers.join(','));

            // Thêm dữ liệu
            contracts.forEach(contract => {
                const row = [
                    `"${contract.code || ''}"`,
                    `"${contract.customer || ''}"`,
                    `"${contract.customerId || ''}"`,
                    `"${contract.type || ''}"`,
                    `"${formatDate(contract.startDate)}"`,
                    `"${formatDate(contract.endDate)}"`,
                    contract.amount || 0,
                    contract.attachments || 0,
                    `"${contract.status || ''}"`
                ];
                csvRows.push(row.join(','));
            });

            const csvData = csvRows.join('\n');
            const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' }); // Thêm BOM cho UTF-8
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hop-dong_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            alert(`Đã xuất ${contracts.length} hợp đồng`);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Có lỗi xảy ra khi xuất dữ liệu');
        }
    };

    return (
        <div className="contract-container">
            <h1 className="contract-title">Danh sách hợp đồng</h1>

            {/* Thống kê nhanh */}
            {stats && (
                <div className="stats-container-HD">
                    <div className="stat-box-HD">
                        <span className="stat-label-HD">Tổng hợp đồng:</span>
                        <span className="stat-value-HD">{stats.total}</span>
                    </div>
                    <div className="stat-box-HD">
                        <span className="stat-label-HD">Tổng giá trị:</span>
                        <span className="stat-value-HD">{formatCurrency(stats.totalAmount)}</span>
                    </div>
                </div>
            )}

            <div className="contract-toolbar">
                <div className="search-box-HD">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã, khách hàng hoặc CMND..."
                        className="search-input-HD"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Tìm kiếm
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportExcel}>
                        Xuất Excel
                    </button>

                    <button className="btn btn-info" onClick={() => navigate('/contracts/createHD')}>
                        + Thêm mới
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    {filteredContracts.length === 0 ? (
                        <div className="empty-state">
                            <p>Không có hợp đồng nào</p>
                        </div>
                    ) : (
                        <table className="contract-table">
                            <thead>
                                <tr>
                                    <th>Mã hợp đồng</th>
                                    <th>Khách hàng</th>
                                    <th>CMND/CCCD</th>
                                    <th>Loại hợp đồng</th>
                                    <th>Ngày bắt đầu</th>
                                    <th>Ngày kết thúc</th>
                                    <th>Số tiền</th>
                                    <th>File</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>

                                </tr>
                            </thead>
                            <tbody>
                                {filteredContracts.map((contract) => (
                                    <tr key={contract._id}>
                                        <td className="font-bold">{contract.code}</td>
                                        <td>{contract.customer}</td>
                                        <td>{contract.customerId || 'N/A'}</td>
                                        <td>{contract.type}</td>
                                        <td>{formatDate(contract.startDate)}</td>
                                        <td>{formatDate(contract.endDate)}</td>
                                        <td>{formatCurrency(contract.amount)}</td>
                                        <td>{contract.attachments || 0} file</td>
                                        <td>
                                            <span className={`status-badge-HD ${getStatusClass(contract.status)}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons-HD">
                                                <button
                                                    className="action-btn-HD view-btn-HD"
                                                    onClick={() => handleViewDetail(contract)}
                                                    title="Xem chi tiết"
                                                >
                                                    👁️
                                                </button>

                                                <button
                                                    className="action-btn-HD print-btn-HD"
                                                    onClick={() => handlePrint(contract)}
                                                    title="In hợp đồng"
                                                >
                                                    🖨️
                                                </button>
                                                <button
                                                    className="action-btn-HD update-btn-HD"
                                                    onClick={() => handleUpdateStatus(contract)}
                                                    title="Cập nhật trạng thái"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="action-btn-HD delete-btn-HD"
                                                    onClick={() => handleDeleteContract(contract)}
                                                    title="Xóa hợp đồng"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal in hợp đồng */}
            {showPrintModal && selectedContract && (
                <div className="modal-overlay-HD">
                    <div className="modal-content-HD">
                        <h3>In hợp đồng</h3>
                        <p>Bạn có chắc chắn muốn in hợp đồng <strong>{selectedContract.code}</strong>?</p>
                        <div className="modal-actions-HD">
                            <button className="btn btn-primary-HD" onClick={printContract}>
                                In ngay
                            </button>
                            <button className="btn btn-secondary-HD" onClick={() => setShowPrintModal(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal cập nhật trạng thái */}
            {showUpdateModal && selectedContract && (
                <div className="modal-overlay-HD">
                    <div className="modal-content-HD">
                        <h3>Cập nhật trạng thái hợp đồng</h3>
                        <p>Mã hợp đồng: <strong>{selectedContract.code}</strong></p>

                        <div className="form-group">
                            <label>Trạng thái:</label>
                            <select
                                className="form-control"
                                value={updateData.status}
                                onChange={handleStatusChange}
                            >
                                <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                <option value="Đang hoạt động">Đang hoạt động</option>
                                <option value="Sắp hết hạn">Sắp hết hạn</option>
                                <option value="Đã hết hạn">Đã hết hạn</option>
                                <option value="Tạm ngưng">Tạm ngưng</option>
                                <option value="Hủy bỏ">Hủy bỏ</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Ngày kết thúc:</label>
                            <input
                                type="date"
                                className="form-control"
                                value={updateData.endDate}
                                onChange={handleEndDateChange}
                                min={selectedContract.startDate ? selectedContract.startDate.split('T')[0] : ''}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={updateContractStatus}>
                                Cập nhật
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListHD;