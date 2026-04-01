import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, Award } from 'lucide-react';

import "./rewards.css" ; 

const RewardsPage = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const itemsPerPage = 10;

  // Dữ liệu mẫu
  const rewardTypes = [
    { id: '1', name: 'Bằng khen', value: 'certificate' },
    { id: '2', name: 'Tiền thưởng', value: 'money' },
    { id: '3', name: 'Giấy khen', value: 'praise' },
    { id: '4', name: 'Kỷ niệm chương', value: 'medal' },
  ];

  const rewardStatuses = [
    { id: '1', name: 'Đã duyệt', value: 'approved' },
    { id: '2', name: 'Chờ duyệt', value: 'pending' },
    { id: '3', name: 'Từ chối', value: 'rejected' },
  ];

  // Mock data
  const mockRewards = [
    { 
      id: 1, 
      employeeCode: 'NV001', 
      employeeName: 'Nguyễn Văn A', 
      department: 'Phòng Kinh doanh',
      rewardType: 'certificate',
      rewardTypeName: 'Bằng khen',
      amount: 5000000,
      reason: 'Hoàn thành vượt chỉ tiêu quý 4',
      date: '2024-01-15',
      approvedBy: 'Giám đốc Nguyễn Văn B',
      status: 'approved',
      attachment: 'bang_khen.pdf'
    },
    // Thêm nhiều dữ liệu mẫu khác...
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRewards(mockRewards);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilter = () => {
    // Logic filter sẽ được thêm sau
    console.log('Filtering with:', { selectedType, selectedStatus, searchTerm });
  };

  const handleViewDetail = (reward) => {
    setSelectedReward(reward);
    setShowModal(true);
  };

  const handleEdit = (reward) => {
    // Logic edit
    console.log('Edit reward:', reward);
  };

  const handleDelete = (rewardId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khen thưởng này?')) {
      // Logic delete
      console.log('Delete reward:', rewardId);
    }
  };

  const handleExport = () => {
    // Logic export to Excel/PDF
    console.log('Exporting rewards data');
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = 
      reward.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reward.employeeCode.includes(searchTerm) ||
      reward.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || reward.rewardType === selectedType;
    const matchesStatus = selectedStatus === 'all' || reward.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRewards = filteredRewards.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="rewards-page loading-state">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu khen thưởng...</p>
      </div>
    );
  }

  return (
    <div className="rewards-page">
      <div className="rewards-header">
        <h1 className="page-title-rw">
          <Award className="icon-rw" />
          Quản lý Khen thưởng
        </h1>
        <div className="header-actions-rw">
          <button className="btn-rw btn-primary-rw" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Thêm khen thưởng
          </button>
          <button className="btn-rw btn-secondary-rw" onClick={handleExport}>
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="rewards-filters">
        <div className="search-box-rw">
          <Search className="search-icon-rw" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã NV, lý do..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input-rw"
          />
        </div>

        <div className="filter-group-rw">
          <select 
            className="filter-select-rw"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">Tất cả loại khen thưởng</option>
            {rewardTypes.map(type => (
              <option key={type.id} value={type.value}>
                {type.name}
              </option>
            ))}
          </select>

          <select 
            className="filter-select-rw"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {rewardStatuses.map(status => (
              <option key={status.id} value={status.value}>
                {status.name}
              </option>
            ))}
          </select>

          <button className="btn-rw btn-filter-rw" onClick={handleFilter}>
            <Filter size={18} />
            Lọc
          </button>
        </div>
      </div>

      <div className="rewards-content">
        <div className="summary-cards-rw">
          <div className="summary-card-rw total">
            <h3>Tổng số</h3>
            <p className="count-rw">{rewards.length}</p>
          </div>
          <div className="summary-card-rw approved">
            <h3>Đã duyệt</h3>
            <p className="count-rw">
              {rewards.filter(r => r.status === 'approved').length}
            </p>
          </div>
          <div className="summary-card-rw pending">
            <h3>Chờ duyệt</h3>
            <p className="count-rw">
              {rewards.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="summary-card-rw amount">
            <h3>Tổng tiền thưởng</h3>
            <p className="count-rw">
              {rewards.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString()} VNĐ
            </p>
          </div>
        </div>

        <div className="rewards-table-container">
          <table className="rewards-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã NV</th>
                <th>Tên nhân viên</th>
                <th>Phòng ban</th>
                <th>Loại khen thưởng</th>
                <th>Số tiền</th>
                <th>Lý do</th>
                <th>Ngày khen</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRewards.map((reward, index) => (
                <tr key={reward.id}>
                  <td>{startIndex + index + 1}</td>
                  <td>{reward.employeeCode}</td>
                  <td>{reward.employeeName}</td>
                  <td>{reward.department}</td>
                  <td>
                    <span className={`badge badge-${reward.rewardType}`}>
                      {reward.rewardTypeName}
                    </span>
                  </td>
                  <td>{reward.amount ? reward.amount.toLocaleString() + ' VNĐ' : '-'}</td>
                  <td className="reason-cell">{reward.reason}</td>
                  <td>{new Date(reward.date).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge-rw status-${reward.status}`}>
                      {reward.status === 'approved' ? 'Đã duyệt' : 
                       reward.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-rw">
                      <button 
                        className="btn-icon-rw view"
                        onClick={() => handleViewDetail(reward)}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon-rw edit"
                        onClick={() => handleEdit(reward)}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon-rw delete"
                        onClick={() => handleDelete(reward.id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container-rw">
          <div className="pagination-info-rw">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRewards.length)} 
            trong tổng số {filteredRewards.length} bản ghi
          </div>
          <div className="pagination-controls-rw">
            <button 
              className="pagination-btn-rw"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Trước
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`pagination-btn-rw ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            
            <button 
              className="pagination-btn-rw"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal chi tiết */}
      {showModal && selectedReward && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chi tiết Khen thưởng</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>Mã nhân viên:</label>
                <span>{selectedReward.employeeCode}</span>
              </div>
              <div className="detail-row">
                <label>Tên nhân viên:</label>
                <span>{selectedReward.employeeName}</span>
              </div>
              <div className="detail-row">
                <label>Phòng ban:</label>
                <span>{selectedReward.department}</span>
              </div>
              <div className="detail-row">
                <label>Loại khen thưởng:</label>
                <span>{selectedReward.rewardTypeName}</span>
              </div>
              <div className="detail-row">
                <label>Số tiền:</label>
                <span>{selectedReward.amount?.toLocaleString()} VNĐ</span>
              </div>
              <div className="detail-row">
                <label>Lý do:</label>
                <span>{selectedReward.reason}</span>
              </div>
              <div className="detail-row">
                <label>Ngày khen thưởng:</label>
                <span>{new Date(selectedReward.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="detail-row">
                <label>Người duyệt:</label>
                <span>{selectedReward.approvedBy}</span>
              </div>
              {selectedReward.attachment && (
                <div className="detail-row">
                  <label>Tệp đính kèm:</label>
                  <a href="#" className="attachment-link">
                    {selectedReward.attachment}
                  </a>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary-rw" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;