import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FaUsers, 
  FaPlus, 
  FaChartLine, 
  FaUserFriends, 
  FaRegClock,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaTimes,
  FaUserPlus,
  FaUserMinus,
  FaArrowUp,
  FaArrowDown,
  FaChartPie,
  FaGraduationCap,
  FaBook,
  FaChalkboardTeacher,
  FaMicroscope,
  FaLaptopCode,
  FaMoneyBillWave,
  FaUniversity,
  FaClipboardCheck,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useUniversity } from '../contexts/UniversityContext'; 
import { v4 as uuidv4 } from 'uuid';
import './Departments.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Departments = () => {
  // ============= CONTEXT =============
  const { 
    departments: contextDepartments, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment,
    refreshDepartments, 
    toggleDepartmentStatus,
    loading: contextLoading 
  } = useUniversity();

  // ============= LOCAL STATE =============
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // State quản lý form
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  
  // State quản lý tìm kiếm và lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // State quản lý thống kê
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalFaculty: 0,
    totalStudents: 0,
    activeDepartments: 0,
    avgPerformance: 0,
    totalBudget: 0,
    totalResearchGrants: 0
  });

  // State cho form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    dean: '',
    facultyCount: 0,
    studentCount: 0,
    programs: [],
    researchAreas: [],
    facilities: [],
    accreditation: '',
    establishmentYear: new Date().getFullYear(),
    status: 'active',
    performance: 80,
    researchOutput: 0,
    publications: 0,
    color: '#3B82F6',
    email: '',
    phone: '',
    location: '',
    budget: 0,
    researchGrants: 0
  });

  // Refs cho modal
  const formRef = useRef(null);

  // ============= HELPER FUNCTIONS =============
  
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

  // Tính màu cho performance
  const getPerformanceColor = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    return '#EF4444';
  };

  // Xử lý chuyển đổi chuỗi thành mảng
  const processArrayField = (field) => {
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      return field.split(',').map(item => item.trim()).filter(item => item !== '');
    }
    return [];
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      dean: '',
      facultyCount: 0,
      studentCount: 0,
      programs: [],
      researchAreas: [],
      facilities: [],
      accreditation: '',
      establishmentYear: new Date().getFullYear(),
      status: 'active',
      performance: 80,
      researchOutput: 0,
      publications: 0,
      color: '#3B82F6',
      email: '',
      phone: '',
      location: '',
      budget: 0,
      researchGrants: 0
    });
  };

  // Helper functions cho thông tin bổ sung
  const getDepartmentColor = (name) => {
    const colors = {
      'Công nghệ thông tin': '#3B82F6',
      'Kinh tế': '#10B981',
      'Ngoại ngữ': '#8B5CF6',
      'Điện tử viễn thông': '#F59E0B',
      'Xây dựng': '#EF4444'
    };
    return colors[name] || '#3B82F6';
  };

  const getDepartmentPhone = (code) => {
    const phones = {
      'CNTT': '(024) 1234 5678',
      'KT': '(024) 1234 5679',
      'NN': '(024) 1234 5680',
      'ĐTVT': '(024) 1234 5681',
      'XD': '(024) 1234 5682'
    };
    return phones[code] || '(024) 1234 5683';
  };

  const getDepartmentLocation = (code) => {
    const locations = {
      'CNTT': 'Tầng 5, Nhà A1',
      'KT': 'Tầng 3, Nhà B1',
      'NN': 'Tầng 2, Nhà C1',
      'ĐTVT': 'Tầng 4, Nhà A2',
      'XD': 'Tầng 1, Nhà D1'
    };
    return locations[code] || 'Đang cập nhật';
  };

  // ============= DATA SYNC =============
  
  // Đồng bộ dữ liệu từ context
  useEffect(() => {
    if (contextDepartments && contextDepartments.length > 0) {
      // Thêm các thông tin bổ sung cho mỗi khoa
      const deptsWithDetails = contextDepartments.map(dept => ({
        ...dept,
        studentCount: dept.studentCount || Math.floor(Math.random() * 500) + 200,
        performance: dept.performance || Math.floor(Math.random() * 20) + 80,
        researchOutput: dept.researchOutput || Math.floor(Math.random() * 50) + 30,
        publications: dept.publications || Math.floor(Math.random() * 100) + 50,
        budget: dept.budget || Math.floor(Math.random() * 5000000000) + 1000000000,
        researchGrants: dept.researchGrants || Math.floor(Math.random() * 2000000000) + 500000000,
        color: dept.color || getDepartmentColor(dept.name),
        email: dept.email || `${dept.code?.toLowerCase()}@university.edu.vn`,
        phone: dept.phone || getDepartmentPhone(dept.code),
        location: dept.location || getDepartmentLocation(dept.code)
      }));
      
      setDepartments(deptsWithDetails);
    }
  }, [contextDepartments]);

  // ============= API CALLS =============
  
  // Fetch departments từ API (nếu cần thêm dữ liệu)
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder
      });

      const response = await axios.get(`${API_URL}/departments?${params}`);
      setDepartments(response.data.data);
      setPagination(response.data.pagination);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khoa:', error);
      setLoading(false);
    }
  };

  // Fetch thống kê
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments/stats/overview`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
    }
  };

  // ============= EFFECTS =============
  
  // Fetch khi dependencies thay đổi
  useEffect(() => {
    fetchDepartments();
  }, [searchTerm, statusFilter, sortBy, sortOrder, pagination.page]);

  // Fetch thống kê khi component mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Xử lý click ngoài modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target) && showForm) {
        setShowForm(false);
        setEditingDepartment(null);
        resetForm();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showForm]);

  // Tính toán thống kê từ departments hiện tại
  useEffect(() => {
    const totalDepartments = departments.length;
    const totalFaculty = departments.reduce((sum, dept) => sum + (dept.facultyCount || 0), 0);
    const totalStudents = departments.reduce((sum, dept) => sum + (dept.studentCount || 0), 0);
    const activeDepartments = departments.filter(dept => dept.status === 'active').length;
    const avgPerformance = departments.length > 0 
      ? Math.round(departments.reduce((sum, dept) => sum + (dept.performance || 0), 0) / departments.length)
      : 0;
    const totalBudget = departments.reduce((sum, dept) => sum + (dept.budget || 0), 0);
    const totalResearchGrants = departments.reduce((sum, dept) => sum + (dept.researchGrants || 0), 0);
    
    setStats(prev => ({
      ...prev,
      totalDepartments,
      totalFaculty,
      totalStudents,
      activeDepartments,
      avgPerformance,
      totalBudget,
      totalResearchGrants
    }));
  }, [departments]);

  // ============= CRUD OPERATIONS USING CONTEXT =============
  
  // Xử lý thêm/sửa khoa - DÙNG CONTEXT
const handleSaveDepartment = async () => {
  // 1. Validation dữ liệu đầu vào
  if (!formData.code || !formData.code.trim()) {
    alert('Vui lòng nhập mã khoa');
    return;
  }
  
  if (!formData.name || !formData.name.trim()) {
    alert('Vui lòng nhập tên khoa');
    return;
  }
  
  if (!formData.dean || !formData.dean.trim()) {
    alert('Vui lòng nhập tên trưởng khoa');
    return;
  }

  // 2. Chuẩn bị dữ liệu
  const processedData = {
    ...formData,
    // Xử lý các field là mảng
    programs: processArrayField(formData.programs),
    researchAreas: processArrayField(formData.researchAreas),
    facilities: processArrayField(formData.facilities),
    
    // Xử lý số liệu
    facultyCount: editingDepartment ? editingDepartment.facultyCount : (formData.facultyCount || 0),
    studentCount: formData.studentCount || 0,
    budget: formData.budget || 0,
    researchGrants: formData.researchGrants || 0,
    
    // Trim các field text
    code: formData.code.trim().toUpperCase(),
    name: formData.name.trim(),
    dean: formData.dean.trim(),
    description: formData.description?.trim() || '',
    email: formData.email?.trim() || '',
    phone: formData.phone?.trim() || '',
    location: formData.location?.trim() || '',
    
    // Cập nhật thời gian
    lastActive: new Date()
  };

  // 3. Hiển thị loading (tùy chọn)
  const saveButton = document.querySelector('.btn-save');
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = editingDepartment ? 'Đang cập nhật...' : 'Đang thêm...';
  }

  try {
    if (editingDepartment) {
      // Cập nhật khoa
      console.log('Updating department:', editingDepartment._id);
      await updateDepartment(editingDepartment._id, processedData);
      await refreshDepartments();
      alert('Cập nhật khoa thành công!');
    } else {
      // Thêm khoa mới
      console.log('Adding new department');
      await addDepartment(processedData);
      await refreshDepartments();
      alert('Thêm khoa thành công!');
    }
    
    // Đóng form và reset
    setShowForm(false);
    setEditingDepartment(null);
    resetForm();
    
    // Refresh dữ liệu
    await fetchStats();
    
    // Tùy chọn: refresh danh sách departments
    if (refreshDepartments) {
      await refreshDepartments();
    }
    
  } catch (error) {
    console.error('Lỗi khi lưu khoa:', error);
    
    // Xử lý các loại lỗi cụ thể
    let errorMessage = 'Lỗi khi lưu khoa';
    
    if (error.response) {
      // Lỗi từ server
      const serverError = error.response.data;
      if (serverError.message === 'Mã khoa đã tồn tại') {
        errorMessage = 'Mã khoa đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.';
      } else if (serverError.message === 'Tên khoa đã tồn tại') {
        errorMessage = 'Tên khoa đã tồn tại. Vui lòng sử dụng tên khác.';
      } else {
        errorMessage = serverError.message || 'Lỗi từ server';
      }
    } else if (error.request) {
      // Không nhận được response
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else {
      // Lỗi khác
      errorMessage = error.message || 'Đã xảy ra lỗi không xác định';
    }
    
    alert(errorMessage);
  } finally {
    // Khôi phục button
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = editingDepartment ? 'Cập nhật' : 'Thêm mới';
    }
  }
};

  // Xử lý xóa khoa - DÙNG CONTEXT
  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoa này?')) {
      try {
        // DÙNG CONTEXT deleteDepartment
        await deleteDepartment(id);
        await refreshDepartments();
        fetchStats(); // Cập nhật lại thống kê
        alert('Xóa khoa thành công!');
      } catch (error) {
        console.error('Lỗi khi xóa khoa:', error);
        alert(error.message || 'Lỗi khi xóa khoa');
      }
    }
  };

  // Xử lý chỉnh sửa khoa
  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setFormData({
      ...department,
      programs: Array.isArray(department.programs) ? department.programs.join(', ') : '',
      researchAreas: Array.isArray(department.researchAreas) ? department.researchAreas.join(', ') : '',
      facilities: Array.isArray(department.facilities) ? department.facilities.join(', ') : ''
    });
    setShowForm(true);
  };

  // Xử lý thay đổi trạng thái - DÙNG CONTEXT
  const handleToggleStatus = async (id) => {
    try {
      const dept = departments.find(d => d._id === id);
      const newStatus = dept.status === 'active' ? 'inactive' : 'active';
      
      // DÙNG CONTEXT toggleDepartmentStatus
      await toggleDepartmentStatus(id, newStatus);
      alert(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'tạm dừng'} khoa thành công!`);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      alert(error.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  // Xử lý phân trang
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // ============= FILTER & SORT =============
  
  // Lọc và sắp xếp danh sách khoa
  const filteredAndSortedDepartments = departments
    .filter(dept => {
      const matchesSearch = (dept.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (dept.code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (dept.dean?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (dept.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || dept.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'performance':
          aValue = a.performance || 0;
          bValue = b.performance || 0;
          break;
        case 'students':
          aValue = a.studentCount || 0;
          bValue = b.studentCount || 0;
          break;
        case 'faculty':
          aValue = a.facultyCount || 0;
          bValue = b.facultyCount || 0;
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        default:
          aValue = (a.name?.toLowerCase() || '');
          bValue = (b.name?.toLowerCase() || '');
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

 // ============= RENDER FUNCTIONS =============
  // Render form thêm/sửa khoa
  const renderDepartmentForm = () => (
    <div className="department-form" ref={formRef}>
      <div className="form-header">
        <h2>{editingDepartment ? 'Chỉnh sửa Khoa' : 'Thêm Khoa Mới'}</h2>
        <button className="btn-close" onClick={() => { setShowForm(false); resetForm(); }}>
          <FaTimes />
        </button>
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Mã khoa *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            placeholder="VD: CNTT, KT, NN"
          />
        </div>
        
        <div className="form-group">
          <label>Tên khoa *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Nhập tên khoa"
          />
        </div>
        
        <div className="form-group">
          <label>Trưởng khoa *</label>
          <input
            type="text"
            value={formData.dean}
            onChange={(e) => setFormData({...formData, dean: e.target.value})}
            placeholder="Nhập tên trưởng khoa"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Mô tả về khoa"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label>Số giảng viên</label>
          <input
            type="number"
            value={formData.facultyCount}
            onChange={(e) => setFormData({...formData, facultyCount: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label>Số sinh viên</label>
          <input
            type="number"
            value={formData.studentCount}
            onChange={(e) => setFormData({...formData, studentCount: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
        
        <div className="form-group">
          <label>Năm thành lập</label>
          <input
            type="number"
            value={formData.establishmentYear}
            onChange={(e) => setFormData({...formData, establishmentYear: parseInt(e.target.value) || new Date().getFullYear()})}
            min="1900"
            max={new Date().getFullYear()}
          />
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
          <label>Trạng thái</label>
          <div className="status-options">
            <label className={`status-option ${formData.status === 'active' ? 'active' : ''}`}>
              <input
                type="radio"
                value="active"
                checked={formData.status === 'active'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              />
              <span>Hoạt động</span>
            </label>
            <label className={`status-option ${formData.status === 'inactive' ? 'active' : ''}`}>
              <input
                type="radio"
                value="inactive"
                checked={formData.status === 'inactive'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              />
              <span>Tạm ngừng</span>
            </label>
          </div>
        </div>
        
        <div className="form-group full-width">
          <label>Chương trình đào tạo (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            value={formData.programs}
            onChange={(e) => setFormData({...formData, programs: e.target.value})}
            placeholder="Công nghệ Phần mềm, Khoa học Máy tính, Mạng máy tính"
          />
        </div>
        
        <div className="form-group full-width">
          <label>Hướng nghiên cứu (phân cách bằng dấu phẩy)</label>
          <input
            type="text"
            value={formData.researchAreas}
            onChange={(e) => setFormData({...formData, researchAreas: e.target.value})}
            placeholder="AI & Machine Learning, IoT, Cybersecurity"
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="khoa@university.edu.vn"
          />
        </div>
        
        <div className="form-group">
          <label>Điện thoại</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="(024) 1234 5678"
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
        <button className="btn-cancel" onClick={() => { setShowForm(false); resetForm(); }}>
          Hủy
        </button>
        <button className="btn-save" onClick={handleSaveDepartment}>
          {editingDepartment ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </div>
  );

  // Render thanh tìm kiếm và lọc
  const renderSearchFilter = () => (
    <div className="search-filter-container-DP">
      <div className="search-section-DP">
        <div className="search-input-wrapper-DP">
          <FaSearch className="search-icon-DP" />
          <input
            type="text"
            placeholder="Tìm kiếm khoa, mã khoa, trưởng khoa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-DP"
          />
        </div>
        
        <div className="sort-controls-DP">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select-DP"
          >
            <option value="name">Sắp xếp theo tên</option>
            <option value="performance">Sắp xếp theo hiệu suất</option>
            <option value="students">Sắp xếp theo số sinh viên</option>
            <option value="faculty">Sắp xếp theo số giảng viên</option>
            <option value="budget">Sắp xếp theo ngân sách</option>
          </select>
          
          <button 
            className="sort-order-btn-DP"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
          </button>
        </div>
      </div>
      
      <div className="filter-section-DP">
        <div className="filter-group-DP">
          <FaFilter />
          <span>Lọc theo:</span>
        </div>
        
        <div className="filter-options-DP">
          <button 
            className={`filter-btn-DP ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={`filter-btn-DP ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Đang hoạt động
          </button>
          <button 
            className={`filter-btn-DP ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Tạm ngừng
          </button>
        </div>
      </div>
    </div>
  );

  // Render thống kê
  const renderAnalytics = () => (
    <div className="analytics-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <FaUniversity style={{ color: '#3B82F6' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalDepartments}</h3>
            <p>Tổng số khoa</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <FaChalkboardTeacher style={{ color: '#10B981' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalFaculty}</h3>
            <p>Tổng giảng viên</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <FaGraduationCap style={{ color: '#F59E0B' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.totalStudents}</h3>
            <p>Tổng sinh viên</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
            <FaChartLine style={{ color: '#8B5CF6' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.avgPerformance}%</h3>
            <p>Hiệu suất trung bình</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <FaClipboardCheck style={{ color: '#EF4444' }} />
          </div>
          <div className="stat-info">
            <h3>{stats.activeDepartments}</h3>
            <p>Khoa đang hoạt động</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}>
            <FaMoneyBillWave style={{ color: '#EC4899' }} />
          </div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalBudget)}</h3>
            <p>Tổng ngân sách</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render danh sách khoa
  const renderDepartmentCards = () => (
    <div className="departments-grid">
      {filteredAndSortedDepartments.length > 0 ? (
        filteredAndSortedDepartments.map(dept => (
          <div key={dept._id} className="department-card-wrapper">
            <div className="department-card" style={{ borderLeftColor: dept.color }}>
              {/* Card Header */}
              <div className="department-card-header">
                <div className="department-info">
                  <div className="department-icon" style={{ backgroundColor: dept.color }}>
                    {dept.code.includes('CNTT') ? <FaLaptopCode /> : 
                     dept.code.includes('KT') ? <FaMoneyBillWave /> : 
                     dept.code.includes('NN') ? <FaBook /> :
                     <FaUniversity />}
                  </div>
                  <div className="department-title">
                    <div className="department-code">{dept.code}</div>
                    <h3>{dept.name}</h3>
                    <div className="department-meta">
                      <span className="department-dean">
                        <FaUserFriends /> {dept.dean}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="department-actions">
                  <button 
                    className="btn-action-DP edit"
                    onClick={() => handleEditDepartment(dept)}
                    title="Chỉnh sửa"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="btn-action-DP status"
                    onClick={() => handleToggleStatus(dept._id)}
                    title={dept.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
                  >
                    {dept.status === 'active' ? '✓' : '✗'}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="department-card-body">
                <p className="department-description">{dept.description}</p>
                
                {/* Performance */}
                <div className="performance-section">
                  <div className="performance-item">
                    <span className="label">Hiệu suất:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{
                          width: `${dept.performance}%`,
                          backgroundColor: getPerformanceColor(dept.performance)
                        }}
                      ></div>
                    </div>
                    <span className="value">{dept.performance}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="department-stats">
                  <div className="stat">
                    <FaChalkboardTeacher />
                    <div>
                      <span className="stat-value">{dept.facultyCount}</span>
                      <span className="stat-label">Giảng viên</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaGraduationCap />
                    <div>
                      <span className="stat-value">{dept.studentCount}</span>
                      <span className="stat-label">Sinh viên</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaMicroscope />
                    <div>
                      <span className="stat-value">{dept.researchOutput}</span>
                      <span className="stat-label">Nghiên cứu</span>
                    </div>
                  </div>
                  <div className="stat">
                    <FaChartPie />
                    <div>
                      <span className="stat-value">{formatCurrency(dept.budget)}</span>
                      <span className="stat-label">Ngân sách</span>
                    </div>
                  </div>
                </div>

                {/* Programs */}
                <div className="department-programs">
                  <h4>Chương trình đào tạo</h4>
                  <div className="program-tags">
                    {dept.programs.slice(0, 3).map((program, index) => (
                      <span key={index} className="program-tag">{program}</span>
                    ))}
                    {dept.programs.length > 3 && (
                      <span className="program-tag more">+{dept.programs.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="department-contact">
                  <div className="contact-item">
                    <FaEnvelope />
                    <span>{dept.email}</span>
                  </div>
                  <div className="contact-item">
                    <FaPhone />
                    <span>{dept.phone}</span>
                  </div>
                  <div className="contact-item">
                    <FaMapMarkerAlt />
                    <span>{dept.location}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="department-card-footer">
                  <div className="department-status">
                    <span className={`status-badge ${dept.status}`}>
                      {dept.status === 'active' ? 'Đang hoạt động' : 'Tạm ngừng'}
                    </span>
                    <span className="last-active">
                      <FaRegClock /> Thành lập: {dept.establishmentYear}
                    </span>
                  </div>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteDepartment(dept._id)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <FaUniversity className="empty-icon" />
          <h3>Không tìm thấy khoa nào</h3>
          <p>Thử thay đổi bộ lọc hoặc thêm khoa mới</p>
        </div>
      )}
    </div>
  );
  
  // Kiểm tra loading
  if (loading || contextLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách khoa...</p>
      </div>
    );
  }

  //---Hàm giao diện
  return (
    <div className="departments-container">
      <header className="departments-header">
        <div className="header-content-DP">
          <div className="logo-DP">
            <FaUniversity className="logo-icon-DP" />
            <div>
              <h1>Quản lý Khoa</h1>
              <p className="subtitle">Hệ thống quản lý các khoa trong trường đại học</p>
            </div>
          </div>
        </div>
        <button 
          className="btn-add-department"
          onClick={() => {
            setEditingDepartment(null);
            resetForm();
            setShowForm(true);
          }}
        >
          <FaPlus /> Thêm Khoa Mới
        </button>
      </header>

      {/* Analytics Dashboard */}
      {renderAnalytics()}

      {/* Thanh tìm kiếm và lọc */}
      {renderSearchFilter()}

      {/* Modal Form thêm/sửa khoa */}
      {showForm && (
        <div className="form-modal">
          <div className="form-modal-content">
            {renderDepartmentForm()}
          </div>
        </div>
      )}

      {/* Danh sách khoa */}
      {renderDepartmentCards()}

      {/* Footer */}
            {/* Phân trang */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Trước
          </button>
          <span>Trang {pagination.page} / {pagination.pages}</span>
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Sau
          </button>
        </div>
      )}
   
    </div>
  );
};
``
export default Departments;