import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUsers, 
  FaPlus, 
  FaChartLine, 
  FaUserFriends, 
  FaRegClock,
  FaMoneyBillWave,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaChartPie,
  FaGraduationCap,
  FaWrench,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaUserTie,
  FaBookReader,
   
  
  FaCogs,
   
   
  FaChartBar,
  FaTasks,
 
  FaHandshake,
 
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
  FaDatabase
} from 'react-icons/fa';
import officeAPI from '../services/officeService';
 
import './OfficeManagement.css';

const OfficeManagement = () => {
  // State quản lý danh sách phòng ban
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State quản lý form
  const [showForm, setShowForm] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  
  // State quản lý tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // State quản lý thống kê
  const [stats, setStats] = useState({
    totalOffices: 0,
    totalStaff: 0,
    avgPerformance: 0,
    totalBudget: 0,
    activeOffices: 0,
    totalExpenses: 0,
    totalTasksCompleted: 0,
    totalPendingTasks: 0,
    budgetUtilization: 0
  });

  // State cho form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    fullName: '',
    description: '',
    director: '',
    viceDirector: '',
    staffCount: 1,
    phone: '',
    email: '',
    location: '',
    floor: '',
    building: '',
    responsibilities: '',
    services: '',
    workingHours: {
      morning: '07:30 - 11:30',
      afternoon: '13:30 - 17:00'
    },
    status: 'active',
    category: 'academic',
    color: '#3B82F6',
    budget: 0,
    monthlyExpenses: 0,
    performance: 80,
    tasksCompleted: 0,
    pendingTasks: 0,
    website: '',
    note: ''
  });

  // Refs cho modal
  const formRef = useRef(null);

  // Fetch data khi component mount
  useEffect(() => {
    fetchOffices();
    fetchStats();
  }, []);

  // Fetch danh sách phòng ban
  const fetchOffices = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sortBy,
        sortOrder
      };
      
      const response = await officeAPI.getAll(params);
      setOffices(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching offices:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch thống kê
  const fetchStats = async () => {
    try {
      const response = await officeAPI.getStats();
      if (response.data?.summary) {
        setStats(response.data.summary);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Xử lý click ngoài modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target) && showForm) {
        handleCloseForm();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm]);

  // Fetch lại data khi filter thay đổi
  useEffect(() => {
    fetchOffices();
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      fullName: '',
      description: '',
      director: '',
      viceDirector: '',
      staffCount: 1,
      phone: '',
      email: '',
      location: '',
      floor: '',
      building: '',
      responsibilities: '',
      services: '',
      workingHours: {
        morning: '07:30 - 11:30',
        afternoon: '13:30 - 17:00'
      },
      status: 'active',
      category: 'academic',
      color: '#3B82F6',
      budget: 0,
      monthlyExpenses: 0,
      performance: 80,
      tasksCompleted: 0,
      pendingTasks: 0,
      website: '',
      note: ''
    });
  };

  // Đóng form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingOffice(null);
    resetForm();
  };

  // Xử lý thêm/sửa phòng ban
  const handleSaveOffice = async () => {
    try {
      if (!formData.code || !formData.name || !formData.director || !formData.phone || !formData.email) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }

      if (editingOffice) {
        // Cập nhật phòng ban
        await officeAPI.update(editingOffice._id, formData);
      } else {
        // Thêm phòng ban mới
        await officeAPI.create(formData);
      }
      
      // Fetch lại data
      await fetchOffices();
      await fetchStats();
      
      handleCloseForm();
    } catch (err) {
      alert(err.message);
    }
  };

  // Xử lý xóa phòng ban
  const handleDeleteOffice = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) {
      try {
        await officeAPI.delete(id);
        await fetchOffices();
        await fetchStats();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Xử lý chỉnh sửa phòng ban
  const handleEditOffice = (office) => {
    setEditingOffice(office);
    setFormData({
      ...office,
      responsibilities: Array.isArray(office.responsibilities) ? office.responsibilities.join(', ') : '',
      services: Array.isArray(office.services) ? office.services.join(', ') : '',
      viceDirector: Array.isArray(office.viceDirector) ? office.viceDirector.join(', ') : ''
    });
    setShowForm(true);
  };

  // Xử lý thay đổi trạng thái
  const handleToggleStatus = async (office) => {
    try {
      const newStatus = office.status === 'active' ? 'inactive' : 'active';
      await officeAPI.update(office._id, { status: newStatus });
      await fetchOffices();
      await fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    await fetchOffices();
    await fetchStats();
  };

  // Format số tiền
  const formatCurrency = (amount = 0) => {
    if (isNaN(amount)) return "0 ₫";
    
    if (amount >= 1000000000) {
      return (amount / 1000000000).toFixed(1) + " Tỷ";
    }
    
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(0) + " Triệu";
    }
    
    return amount.toLocaleString('vi-VN') + " ₫";
  };

  // Lấy icon theo category
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'academic': return <FaGraduationCap />;
      case 'student': return <FaUserFriends />;
      case 'administrative': return <FaUserTie />;
      case 'technical': return <FaCogs />;
      case 'library': return <FaBookReader />;
      case 'union': return <FaHandshake />;
      default: return <FaBuilding />;
    }
  };

  // Lấy tên category
  const getCategoryName = (category) => {
    switch(category) {
      case 'academic': return 'Đào tạo';
      case 'student': return 'Sinh viên';
      case 'administrative': return 'Hành chính';
      case 'technical': return 'Kỹ thuật';
      case 'library': return 'Thư viện';
      case 'union': return 'Đoàn thể';
      default: return category;
    }
  };

  // Lấy tên status
  const getStatusName = (status) => {
    switch(status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Tạm ngừng';
      case 'maintenance': return 'Bảo trì';
      default: return status;
    }
  };

  // Render form thêm/sửa phòng ban
  const renderOfficeForm = () => (
    <div className="office-form" ref={formRef}>
      <div className="form-header">
        <h2>{editingOffice ? 'Chỉnh sửa Phòng Ban' : 'Thêm Phòng Ban Mới'}</h2>
        <button className="btn-close" onClick={handleCloseForm}>
          <FaTimes />
        </button>
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Mã phòng ban *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            placeholder="VD: PĐT, PTCSV, PTCB"
          />
        </div>
        
        <div className="form-group">
          <label>Tên phòng ban *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Nhập tên phòng ban"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Tên đầy đủ</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            placeholder="Nhập tên đầy đủ"
          />
        </div>
        
        <div className="form-group">
          <label>Trưởng phòng *</label>
          <input
            type="text"
            value={formData.director}
            onChange={(e) => setFormData({...formData, director: e.target.value})}
            placeholder="Nhập tên trưởng phòng"
          />
        </div>
        
        <div className="form-group">
          <label>Số nhân viên</label>
          <input
            type="number"
            value={formData.staffCount}
            onChange={(e) => setFormData({...formData, staffCount: parseInt(e.target.value) || 1})}
            min="1"
          />
        </div>
        
        <div className="form-group">
          <label>Điện thoại *</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="(024) 1234 5678"
          />
        </div>
        
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="phongban@university.edu.vn"
          />
        </div>
        
        <div className="form-group">
          <label>Địa chỉ *</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="Tầng, nhà, phòng"
          />
        </div>
        
        <div className="form-group">
          <label>Tòa nhà</label>
          <input
            type="text"
            value={formData.building}
            onChange={(e) => setFormData({...formData, building: e.target.value})}
            placeholder="Tòa nhà"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Mô tả *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Mô tả về phòng ban"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Loại phòng ban *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="academic">Đào tạo</option>
            <option value="student">Sinh viên</option>
            <option value="administrative">Hành chính</option>
            <option value="technical">Kỹ thuật</option>
            <option value="library">Thư viện</option>
            <option value="union">Đoàn thể</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm ngừng</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Hiệu suất (%)</label>
          <div className="range-container">
            <input
              type="range"
              min="0"
              max="100"
              value={formData.performance}
              onChange={(e) => setFormData({...formData, performance: parseInt(e.target.value)})}
              className="range-input"
            />
            <span className="range-value">{formData.performance}%</span>
          </div>
        </div>
        
        <div className="form-group">
          <label>Ngân sách (VND)</label>
          <input
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
            min="0"
            placeholder="Ngân sách"
          />
        </div>
        
        <div className="form-group">
          <label>Phó phòng (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            value={formData.viceDirector}
            onChange={(e) => setFormData({...formData, viceDirector: e.target.value})}
            placeholder="TS. Nguyễn Văn A, ThS. Trần Thị B"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Nhiệm vụ (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            value={formData.responsibilities}
            onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
            placeholder="Quản lý đào tạo, Tổ chức thi, Cấp văn bằng"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Dịch vụ cung cấp (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            value={formData.services}
            onChange={(e) => setFormData({...formData, services: e.target.value})}
            placeholder="Đăng ký học phần, Cấp bảng điểm, Xác nhận sinh viên"
          />
        </div>
        
        <div className="form-group">
          <label>Giờ làm việc - Sáng</label>
          <input
            type="text"
            value={formData.workingHours.morning}
            onChange={(e) => setFormData({
              ...formData,
              workingHours: { ...formData.workingHours, morning: e.target.value }
            })}
            placeholder="07:30 - 11:30"
          />
        </div>
        
        <div className="form-group">
          <label>Giờ làm việc - Chiều</label>
          <input
            type="text"
            value={formData.workingHours.afternoon}
            onChange={(e) => setFormData({
              ...formData,
              workingHours: { ...formData.workingHours, afternoon: e.target.value }
            })}
            placeholder="13:30 - 17:00"
          />
        </div>
        
        <div className="form-group">
          <label>Website</label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            placeholder="https://..."
          />
        </div>
        
        <div className="form-group">
          <label>Màu sắc đại diện</label>
          <div className="color-picker">
            {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
              <button
                key={color}
                className={`color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({...formData, color})}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="btn-cancel" onClick={handleCloseForm}>
          Hủy
        </button>
        <button className="btn-save" onClick={handleSaveOffice}>
          {editingOffice ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </div>
  );

  // Render thanh tìm kiếm và lọc
  const renderSearchFilter = () => (
    <div className="search-filter-container-OF">
      <div className="search-section-OF">
        <div className="search-input-wrapper-OF">
          <FaSearch className="search-icon-OF" />
          <input
            type="text"
            placeholder="Tìm kiếm phòng ban, mã phòng, trưởng phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-OF"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="controls-group-OF">
          <div className="sort-controls-OF">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select-OF"
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="performance">Sắp xếp theo hiệu suất</option>
              <option value="staffCount">Sắp xếp theo số nhân viên</option>
              <option value="budget">Sắp xếp theo ngân sách</option>
              <option value="createdAt">Sắp xếp theo ngày tạo</option>
            </select>
            
            <button 
              className="sort-order-btn-OF"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
            </button>
          </div>
          
          <button 
            className="btn-refresh-OF"
            onClick={handleRefresh}
            title="Làm mới dữ liệu"
            disabled={loading}
          >
            <FaSync className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>
      
      <div className="filter-section-OF">
        <div className="filter-group-OF">
          <FaFilter />
          <span>Lọc theo:</span>
        </div>
        
        <div className="filter-options-OF">
          <button 
            className={`filter-btn-OF ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả trạng thái
          </button>
          <button 
            className={`filter-btn-OF ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Đang hoạt động
          </button>
          <button 
            className={`filter-btn-OF ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Tạm ngừng
          </button>
          <button 
            className={`filter-btn-OF ${statusFilter === 'maintenance' ? 'active' : ''}`}
            onClick={() => setStatusFilter('maintenance')}
          >
            Bảo trì
          </button>
        </div>
        
        <div className="filter-options-OF">
          <button 
            className={`filter-btn-OF ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
          >
            Tất cả loại
          </button>
          <button 
            className={`filter-btn-OF ${categoryFilter === 'academic' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('academic')}
          >
            Đào tạo
          </button>
          <button 
            className={`filter-btn-OF ${categoryFilter === 'student' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('student')}
          >
            Sinh viên
          </button>
          <button 
            className={`filter-btn-OF ${categoryFilter === 'administrative' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('administrative')}
          >
            Hành chính
          </button>
          <button 
            className={`filter-btn-OF ${categoryFilter === 'technical' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('technical')}
          >
            Kỹ thuật
          </button>
          <button 
            className={`filter-btn-OF ${categoryFilter === 'library' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('library')}
          >
            Thư viện
          </button>
          <button 
            className={`filter-btn-OF ${categoryFilter === 'union' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('union')}
          >
            Đoàn thể
          </button>
        </div>
      </div>
    </div>
  );

  // Render thống kê
  const renderAnalytics = () => (
    <div className="analytics-container">
      <div className="stats-header">
        <h2>
          <FaChartBar /> Thống kê tổng quan
        </h2>
        <div className="stats-update">
          <FaDatabase /> Dữ liệu thời gian thực
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <FaBuilding style={{ color: '#3B82F6' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalOffices}</h3>
            <p>Tổng số phòng ban</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <FaUsers style={{ color: '#10B981' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalStaff}</h3>
            <p>Tổng nhân viên</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <FaChartLine style={{ color: '#F59E0B' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.avgPerformance}%</h3>
            <p>Hiệu suất trung bình</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <FaMoneyBillWave style={{ color: '#8B5CF6' }} />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalBudget)}</h3>
            <p>Tổng ngân sách</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <FaCheckCircle style={{ color: '#EF4444' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.activeOffices}</h3>
            <p>Phòng ban đang hoạt động</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
            <FaTasks style={{ color: '#EC4899' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalTasksCompleted}</h3>
            <p>Công việc đã hoàn thành</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render danh sách phòng ban
  const renderOfficeCards = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <FaSync className="spin" />
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <FaExclamationTriangle />
          <h3>Lỗi khi tải dữ liệu</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={handleRefresh}>
            Thử lại
          </button>
        </div>
      );
    }

    if (offices.length === 0) {
      return (
        <div className="empty-state">
          <FaDatabase />
          <h3>Không tìm thấy phòng ban nào</h3>
          <p>Thử thay đổi bộ lọc hoặc thêm phòng ban mới</p>
        </div>
      );
    }

    return (
      <div className="offices-grid">
        {offices.map(office => (
          <div key={office._id} className="office-card-wrapper">
            <div className="office-card" style={{ borderLeftColor: office.color }}>
              {/* Card Header */}
              <div className="office-card-header">
                <div className="office-info">
                  <div className="office-icon" style={{ backgroundColor: office.color }}>
                    {getCategoryIcon(office.category)}
                  </div>
                  <div className="office-title">
                    <div className="office-code">{office.code}</div>
                    <h3>{office.name}</h3>
                    <div className="office-meta">
                      <span className="office-category">
                        {getCategoryIcon(office.category)} {getCategoryName(office.category)}
                      </span>
                      <span className="office-director">
                        <FaUserTie /> {office.director}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="office-actions">
                  <button 
                    className="btn-action edit"
                    onClick={() => handleEditOffice(office)}
                    title="Chỉnh sửa"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className={`btn-action-OF status ${office.status}`}
                    onClick={() => handleToggleStatus(office)}
                    title={`${office.status === 'active' ? 'Tạm dừng' :  office.status === 'inactive' ? 'Đang hoạt động' : 'Bảo trì'}`}
                  >
                    {office.status === 'active' && '✔' }
                    {office.status === 'inactive' && '✘'}
                    {office.status === 'maintenance' && '🛠️'}

                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="office-card-body">
                <p className="office-description">{office.description}</p>
                
                {/* Performance */}
                <div className="performance-section">
                  <div className="performance-item">
                    <span className="label">Hiệu suất:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{
                          width: `${office.performance}%`,
                          backgroundColor: office.performance >= 80 ? '#10B981' : office.performance >= 60 ? '#F59E0B' : '#EF4444'
                        }}
                      ></div>
                    </div>
                    <span className="value">{office.performance}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="office-stats">
                  <div className="stat">
                    <FaUsers />
                    <div>
                      <span className="stat-value">{office.staffCount}</span>
                      <span className="stat-label">Nhân viên</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaTasks />
                    <div>
                      <span className="stat-value">{office.tasksCompleted}</span>
                      <span className="stat-label">Công việc</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaChartPie />
                    <div>
                      <span className="stat-value">{formatCurrency(office.budget)}</span>
                      <span className="stat-label">Ngân sách</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaRegClock />
                    <div>
                      <span className="stat-value">{office.workingHours?.morning}</span>
                      <span className="stat-label">Giờ làm</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="office-contact">
                  <div className="contact-item">
                    <FaEnvelope />
                    <span title={office.email}>{office.email}</span>
                  </div>
                  <div className="contact-item">
                    <FaPhone />
                    <span>{office.phone}</span>
                  </div>
                  <div className="contact-item">
                    <FaMapMarkerAlt />
                    <span title={office.location}>{office.location}</span>
                  </div>
                </div>

                {/* Responsibilities */}
                {office.responsibilities && office.responsibilities.length > 0 && (
                  <div className="office-responsibilities">
                    <h4>Nhiệm vụ chính</h4>
                    <ul>
                      {office.responsibilities.slice(0, 3).map((resp, index) => (
                        <li key={index}>{resp}</li>
                      ))}
                      {office.responsibilities.length > 3 && (
                        <li className="more">+{office.responsibilities.length - 3} nhiệm vụ khác</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Footer */}
                <div className="office-card-footer">
                  <div className="office-status">
                    <span className={`status-badge ${office.status}`}>
                      {getStatusName(office.status)}
                    </span>
                    <span className="last-update">
                      <FaRegClock /> Cập nhật: {new Date(office.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteOffice(office._id)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="office-management-container">
      <header className="office-header">
        <div className="header-content-OF">
          <div className="logo-OF">
            <FaBuilding className="logo-icon-OF" />
            <div>
              <h1>Quản lý Phòng Ban Đại Học</h1>
              <p className="subtitle">Hệ thống quản lý thông tin các phòng ban trong trường đại học</p>
            </div>
          </div>
        </div>
        <div className="header-actions-OF">
          <button 
            className="btn-refresh-header"
            onClick={handleRefresh}
            title="Làm mới dữ liệu"
            disabled={loading}
          >
            <FaSync className={loading ? 'spin' : ''} />
          </button>
          <button 
            className="btn-add-office"
            onClick={() => {
              setEditingOffice(null);
              resetForm();
              setShowForm(true);
            }}
          >
            <FaPlus /> Thêm Phòng Ban
          </button>
        </div>
      </header>

      {/* Analytics Dashboard */}
      {renderAnalytics()}

      {/* Thanh tìm kiếm và lọc */}
      {renderSearchFilter()}

      {/* Modal Form thêm/sửa phòng ban */}
      {showForm && (
        <div className="form-modal">
          <div className="form-modal-content">
            {renderOfficeForm()}
          </div>
        </div>
      )}

      {/* Danh sách phòng ban */}
      {renderOfficeCards()}

      {/* Footer */}
 
    </div>
  );
};

export default OfficeManagement;