import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Eye, Edit, AlertTriangle } from 'lucide-react';

import "./disciplines.css"; 

const DisciplinesPage = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const itemsPerPage = 10;

  const disciplineLevels = [
    { id: '1', name: 'Khiển trách', value: 'reprimand' },
    { id: '2', name: 'Cảnh cáo', value: 'warning' },
    { id: '3', name: 'Hạ bậc lương', value: 'salary_reduction' },
    { id: '4', name: 'Buộc thôi việc', value: 'dismissal' },
  ];

  const disciplineStatuses = [
    { id: '1', name: 'Đã xử lý', value: 'processed' },
    { id: '2', name: 'Đang xử lý', value: 'processing' },
    { id: '3', name: 'Chờ xác minh', value: 'pending' },
    { id: '4', name: 'Đã hủy', value: 'cancelled' },
  ];

  const mockDisciplines = [
    { 
      id: 1, 
      employeeCode: 'NV002', 
      employeeName: 'Trần Thị B', 
      department: 'Phòng Hành chính',
      level: 'warning',
      levelName: 'Cảnh cáo',
      violation: 'Đi muộn nhiều lần trong tháng',
      date: '2024-01-10',
      processedBy: 'Trưởng phòng Lê Văn C',
      status: 'processed',
      penalty: 'Cảnh cáo bằng văn bản',
      note: 'Nhân viên đã cam kết không tái phạm'
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setDisciplines(mockDisciplines);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilter = () => {
    console.log('Filtering disciplines:', { selectedLevel, selectedStatus, searchTerm });
  };

  const handleViewDetail = (discipline) => {
    setSelectedDiscipline(discipline);
    setShowModal(true);
  };

  const handleEdit = (discipline) => {
    console.log('Edit discipline:', discipline);
  };

  const handleExport = () => {
    console.log('Exporting disciplines data');
  };

  const handleAppeal = (disciplineId) => {
    console.log('Handle appeal for:', disciplineId);
  };

  const filteredDisciplines = disciplines.filter(discipline => {
    const matchesSearch = 
      discipline.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discipline.employeeCode.includes(searchTerm) ||
      discipline.violation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || discipline.level === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || discipline.status === selectedStatus;
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDisciplines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDisciplines = filteredDisciplines.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="disciplines-page-ds loading-state-ds">
        <div className="loading-spinner-ds"></div>
        <p>Đang tải dữ liệu kỷ luật...</p>
      </div>
    );
  }

  return (
    <div className="disciplines-page-ds">
      <div className="disciplines-header-ds">
        <h1 className="page-title-ds">
          <AlertTriangle className="icon-ds" />
          Quản lý Kỷ luật
        </h1>
        <div className="header-actions-ds">
          <button className="btn-ds btn-primary-ds">
            <Plus size={18} />
            Thêm kỷ luật
          </button>
          <button className="btn-ds btn-secondary-ds" onClick={handleExport}>
            <Download size={18} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="disciplines-filters-ds">
        <div className="search-box-ds">
          <Search className="search-icon-ds" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã NV, vi phạm..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input-ds"
          />
        </div>

        <div className="filter-group-ds">
          <select 
            className="filter-select-ds"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="all">Tất cả mức độ</option>
            {disciplineLevels.map(level => (
              <option key={level.id} value={level.value}>
                {level.name}
              </option>
            ))}
          </select>

          <select 
            className="filter-select-ds"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            {disciplineStatuses.map(status => (
              <option key={status.id} value={status.value}>
                {status.name}
              </option>
            ))}
          </select>

          <button className="btn-ds btn-secondary-ds" onClick={handleFilter}>
            <Filter size={18} />
            Lọc
          </button>
        </div>
      </div>

      <div className="disciplines-content-ds">
        <div className="summary-cards-ds">
          <div className="summary-card-ds total">
            <h3>Tổng số</h3>
            <p className="count">{disciplines.length}</p>
          </div>
          <div className="summary-card-ds warning">
            <h3>Cảnh cáo</h3>
            <p className="count">
              {disciplines.filter(d => d.level === 'warning').length}
            </p>
          </div>
          <div className="summary-card-ds serious">
            <h3>Khiển trách</h3>
            <p className="count">
              {disciplines.filter(d => d.level === 'reprimand').length}
            </p>
          </div>
          <div className="summary-card-ds processed">
            <h3>Đã xử lý</h3>
            <p className="count">
              {disciplines.filter(d => d.status === 'processed').length}
            </p>
          </div>
        </div>

        <div className="disciplines-table-container-ds">
          <table className="disciplines-table-ds">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã NV</th>
                <th>Tên nhân viên</th>
                <th>Phòng ban</th>
                <th>Mức độ</th>
                <th>Vi phạm</th>
                <th>Xử lý</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDisciplines.map((discipline, index) => (
                <tr key={discipline.id}>
                  <td>{startIndex + index + 1}</td>
                  <td>{discipline.employeeCode}</td>
                  <td>{discipline.employeeName}</td>
                  <td>{discipline.department}</td>
                  <td>
                    <span className={`badge-ds level-${discipline.level}-ds`}>
                      {discipline.levelName}
                    </span>
                  </td>
                  <td className="violation-cell-ds" title={discipline.violation}>
                    {discipline.violation}
                  </td>
                  <td>{discipline.penalty}</td>
                  <td>{new Date(discipline.date).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`status-badge-ds status-${discipline.status}-ds`}>
                      {discipline.status === 'processed' ? 'Đã xử lý' : 
                       discipline.status === 'processing' ? 'Đang xử lý' :
                       discipline.status === 'pending' ? 'Chờ xác minh' : 'Đã hủy'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-ds">
                      <button className="btn-icon-ds" onClick={() => handleViewDetail(discipline)} title="Xem">
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon-ds" onClick={() => handleEdit(discipline)} title="Sửa">
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon-ds appeal" onClick={() => handleAppeal(discipline.id)} title="Khiếu nại">
                        <AlertTriangle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-container-ds">
          <div className="pagination-info-ds">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDisciplines.length)} trong {filteredDisciplines.length}
          </div>
          <div className="pagination-controls-ds">
            <button 
              className="pagination-btn-ds"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Trước
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                className={`pagination-btn-ds ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button 
              className="pagination-btn-ds"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {showModal && selectedDiscipline && (
        <div className="modal-overlay-ds">
          <div className="modal-content-ds">
            <div className="modal-header-ds">
              <h2>Chi tiết Kỷ luật</h2>
              <button className="close-btn-ds" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body-ds">
              <div className="detail-row-ds">
                <label>Mã nhân viên:</label>
                <span>{selectedDiscipline.employeeCode}</span>
              </div>
              <div className="detail-row-ds">
                <label>Tên nhân viên:</label>
                <span>{selectedDiscipline.employeeName}</span>
              </div>
              <div className="detail-row-ds">
                <label>Phòng ban:</label>
                <span>{selectedDiscipline.department}</span>
              </div>
              <div className="detail-row-ds">
                <label>Mức độ:</label>
                <span className={`badge-ds level-${selectedDiscipline.level}-ds`}>
                  {selectedDiscipline.levelName}
                </span>
              </div>
              <div className="detail-row-ds">
                <label>Vi phạm:</label>
                <span>{selectedDiscipline.violation}</span>
              </div>
              <div className="detail-row-ds">
                <label>Hình thức xử lý:</label>
                <span>{selectedDiscipline.penalty}</span>
              </div>
              <div className="detail-row-ds">
                <label>Người xử lý:</label>
                <span>{selectedDiscipline.processedBy}</span>
              </div>
              <div className="detail-row-ds">
                <label>Ngày:</label>
                <span>{new Date(selectedDiscipline.date).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div className="modal-footer-ds" style={{padding: '16px 24px', textAlign: 'right', borderTop: '1px solid #e2e8f0'}}>
              <button className="btn-ds btn-secondary-ds" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinesPage;