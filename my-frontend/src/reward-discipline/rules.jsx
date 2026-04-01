import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Eye, Edit, Trash2, FileText, BookOpen } from 'lucide-react';
import "./rules.css" ;
const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const itemsPerPage = 10;

  const ruleCategories = [
    { id: '1', name: 'Khen thưởng', value: 'reward' },
    { id: '2', name: 'Kỷ luật', value: 'discipline' },
    { id: '3', name: 'Chung', value: 'general' },
    { id: '4', name: 'Thủ tục', value: 'procedure' },
  ];

  const ruleStatuses = [
    { id: '1', name: 'Hiệu lực', value: 'active' },
    { id: '2', name: 'Hết hiệu lực', value: 'expired' },
    { id: '3', name: 'Sắp áp dụng', value: 'upcoming' },
    { id: '4', name: 'Đang sửa đổi', value: 'modifying' },
  ];

  const mockRules = [
    { 
      id: 1, 
      code: 'QT-001', 
      name: 'Quy định về khen thưởng nhân viên', 
      category: 'reward',
      categoryName: 'Khen thưởng',
      effectiveDate: '2024-01-01',
      expiredDate: '2024-12-31',
      status: 'active',
      department: 'Phòng Nhân sự',
      createdBy: 'Admin',
      createdDate: '2023-12-15',
      fileUrl: 'quy_dinh_khen_thuong.pdf',
      description: 'Quy định chi tiết về các hình thức khen thưởng, tiêu chí và thủ tục'
    },
    // Thêm dữ liệu mẫu khác...
  ];

  useEffect(() => {
    setTimeout(() => {
      setRules(mockRules);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleViewDetail = (rule) => {
    setSelectedRule(rule);
    setShowModal(true);
  };

  const handleDownload = (fileUrl) => {
    console.log('Downloading:', fileUrl);
    // Logic download file
  };

  const handlePreview = (rule) => {
    console.log('Preview rule:', rule);
    // Logic preview file
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || rule.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRules = filteredRules.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="rules-page loading-state">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu quy chế...</p>
      </div>
    );
  }

  return (
    <div className="rules-page">
      <div className="rules-header">
        <h1 className="page-title-rl">
          <BookOpen className="icon-rl" />
          Quản lý Quy chế
        </h1>
        <div className="header-actions-rl">
          <button className="btn-rl btn-primary-rl">
            <Plus size={18} />
            Thêm quy chế
          </button>
          <button className="btn-rl btn-secondary-rl">
            <Download size={18} />
            Tải mẫu
          </button>
        </div>
      </div>

      <div className="rules-filters">
        <div className="search-box-rl">
          <Search className="search-icon-rl" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên, mô tả..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input-rl"
          />
        </div>

        <div className="filter-group-rl">
          <select 
            className="filter-select-rl"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {ruleCategories.map(category => (
              <option key={category.id} value={category.value}>
                {category.name}
              </option>
            ))}
          </select>

          <select 
            className="filter-select-rl"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {ruleStatuses.map(status => (
              <option key={status.id} value={status.value}>
                {status.name}
              </option>
            ))}
          </select>

          <button className="btn-rl btn-filter">
            <Filter size={18} />
            Lọc
          </button>
        </div>
      </div>

      <div className="rules-content">
        <div className="summary-cards">
          <div className="summary-card total">
            <h3>Tổng số</h3>
            <p className="count">{rules.length}</p>
          </div>
          <div className="summary-card active">
            <h3>Đang hiệu lực</h3>
            <p className="count">
              {rules.filter(r => r.status === 'active').length}
            </p>
          </div>
          <div className="summary-card reward">
            <h3>Quy chế khen thưởng</h3>
            <p className="count">
              {rules.filter(r => r.category === 'reward').length}
            </p>
          </div>
          <div className="summary-card discipline">
            <h3>Quy chế kỷ luật</h3>
            <p className="count">
              {rules.filter(r => r.category === 'discipline').length}
            </p>
          </div>
        </div>

        <div className="rules-table-container">
          <table className="rules-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã quy chế</th>
                <th>Tên quy chế</th>
                <th>Danh mục</th>
                <th>Ngày hiệu lực</th>
                <th>Ngày hết hạn</th>
                <th>Phòng ban</th>
                <th>Trạng thái</th>
                <th>Tệp đính kèm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRules.map((rule, index) => (
                <tr key={rule.id}>
                  <td>{startIndex + index + 1}</td>
                  <td className="code-cell">{rule.code}</td>
                  <td className="name-cell">{rule.name}</td>
                  <td>
                    <span className={`badge-rl category-${rule.category}`}>
                      {rule.categoryName}
                    </span>
                  </td>
                  <td>{new Date(rule.effectiveDate).toLocaleDateString('vi-VN')}</td>
                  <td>{rule.expiredDate ? new Date(rule.expiredDate).toLocaleDateString('vi-VN') : 'Không'}</td>
                  <td>{rule.department}</td>
                  <td>
                    <span className={`status-badge-rl status-${rule.status}`}>
                      {rule.status === 'active' ? 'Hiệu lực' : 
                       rule.status === 'expired' ? 'Hết hiệu lực' :
                       rule.status === 'upcoming' ? 'Sắp áp dụng' : 'Đang sửa đổi'}
                    </span>
                  </td>
                  <td>
                    {rule.fileUrl ? (
                      <button 
                        className="btn-icon-rl download"
                        onClick={() => handleDownload(rule.fileUrl)}
                        title="Tải xuống"
                      >
                        <Download size={16} />
                      </button>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="action-buttons-rl">
                      <button 
                        className="btn-icon-rl view"
                        onClick={() => handleViewDetail(rule)}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn-icon-rl preview"
                        onClick={() => handlePreview(rule)}
                        title="Xem trước"
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        className="btn-icon-rl edit"
                        onClick={() => handleEdit(rule)}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container-rl">
          <div className="pagination-info-rl">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredRules.length)} 
            trong tổng số {filteredRules.length} bản ghi
          </div>
          <div className="pagination-controls-rl">
            <button 
              className="pagination-btn-rl"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Trước
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`pagination-btn-rl ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            
            <button 
              className="pagination-btn-rl"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {showModal && selectedRule && (
        <div className="modal-overlay-rl">
          <div className="modal-content-rl modal-lg">
            <div className="modal-header-rl">
              <h2>{selectedRule.name}</h2>
              <button className="close-btn-rl" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body-rl">
              <div className="rule-detail-grid">
                <div className="detail-section">
                  <h3>Thông tin cơ bản</h3>
                  <div className="detail-row">
                    <label>Mã quy chế:</label>
                    <span>{selectedRule.code}</span>
                  </div>
                  <div className="detail-row">
                    <label>Danh mục:</label>
                    <span className={`badge-rl category-${selectedRule.category}`}>
                      {selectedRule.categoryName}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Phòng ban:</label>
                    <span>{selectedRule.department}</span>
                  </div>
                  <div className="detail-row">
                    <label>Ngày hiệu lực:</label>
                    <span>{new Date(selectedRule.effectiveDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="detail-row">
                    <label>Ngày hết hạn:</label>
                    <span>
                      {selectedRule.expiredDate ? 
                        new Date(selectedRule.expiredDate).toLocaleDateString('vi-VN') : 
                        'Không có'}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Mô tả chi tiết</h3>
                  <div className="description-content">
                    {selectedRule.description || 'Không có mô tả chi tiết'}
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Thông tin khác</h3>
                  <div className="detail-row">
                    <label>Người tạo:</label>
                    <span>{selectedRule.createdBy}</span>
                  </div>
                  <div className="detail-row">
                    <label>Ngày tạo:</label>
                    <span>{new Date(selectedRule.createdDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="detail-row">
                    <label>Trạng thái:</label>
                    <span className={`status-badge-rl status-${selectedRule.status}`}>
                      {selectedRule.status === 'active' ? 'Đang hiệu lực' : 
                       selectedRule.status === 'expired' ? 'Hết hiệu lực' :
                       selectedRule.status === 'upcoming' ? 'Sắp áp dụng' : 'Đang sửa đổi'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedRule.fileUrl && (
                <div className="file-section-rl">
                  <h3>Tệp đính kèm</h3>
                  <div className="file-attachment-rl">
                    <FileText className="file-icon-rl" />
                    <span>{selectedRule.fileUrl}</span>
                    <button 
                      className="btn-rl btn-download-rl"
                      onClick={() => handleDownload(selectedRule.fileUrl)}
                    >
                      <Download size={16} />
                      Tải xuống
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer-rl">
              <button className="btn-rl btn-secondary-rl" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button className="btn-rl btn-primary-rl">
                <Download size={16} />
                Tải toàn bộ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesPage;