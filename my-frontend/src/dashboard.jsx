import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaChalkboardTeacher,
  FaUserTie,
  FaBirthdayCake,
  FaFileContract,
  FaCalendarAlt,
  FaChartPie,
  FaChartBar,
  FaChartLine,
  FaBell,
  FaCalendarCheck,
  FaHistory,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaDownload,
  FaGraduationCap,
  FaFilter,
  FaSearch,
  FaSync,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding
} from 'react-icons/fa';
import axios from 'axios';
import contractService from './services/contractService';
import { useUniversity } from './contexts/UniversityContext';
 
import './dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    teachers: 0,
    staff: 0,
    contractExpiring: 0,
    birthdays: 0,
    onLeave: 0
  });

  const [departmentDistribution, setDepartmentDistribution] = useState([]);
  const [positionDistribution, setPositionDistribution] = useState([]);
  const [contractTypeDistribution, setContractTypeDistribution] = useState([]);
  const [importantNotifications, setImportantNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    position: '',
    contractType: ''
  });
  const [departmentStats, setDepartmentStats] = useState({
  departments: [],
  totalFaculty: 0,
  totalStudents: 0,
  avgPerformance: 0
});

const [officeStats, setOfficeStats] = useState({
  offices: [],
  totalOffices: 0,
  totalStaff: 0,
  avgPerformance: 0,
  totalBudget: 0,
  activeOffices: 0
});

  // API endpoints - Thay đổi URL theo backend của bạn
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch dashboard data từ API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi các API song song để tăng performance
      const [
        statsResponse,
        departmentResponse,
        positionResponse,
        contractResponse,
        notificationsResponse,
        activitiesResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/stats?range=${selectedTimeRange}`),
        axios.get(`${API_BASE_URL}/dashboard/department-distribution`),
        axios.get(`${API_BASE_URL}/dashboard/position-distribution`),
        axios.get(`${API_BASE_URL}/dashboard/contract-distribution`),
        axios.get(`${API_BASE_URL}/dashboard/notifications?limit=4`),
        axios.get(`${API_BASE_URL}/dashboard/recent-activities?limit=5`)
      ]);

      // Cập nhật state với dữ liệu từ API
      setStats(statsResponse.data);
      setDepartmentDistribution(departmentResponse.data);
      setPositionDistribution(positionResponse.data);
      setContractTypeDistribution(contractResponse.data);
      setImportantNotifications(notificationsResponse.data);
      setRecentActivities(activitiesResponse.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');

      // Fallback data khi API lỗi
      setFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm này ngay sau fetchDashboardData
  const fetchContractData = async () => {
    try {
      // Lấy thống kê hợp đồng từ contractService
      const stats = await contractService.getContractStats();
      setContractStats({

        // _id: 0,
        //         total: 1,
        //         totalAmount: 1,
        //         activeContracts: 1,
        //         expiredContracts: 1,
        //         expiringContracts: 1
        totalContracts: stats.total || 0,
        totalAmount: stats.totalAmount || 0,
        activeContracts: stats.activeContracts || 0,
        expiredContracts: stats.expiredContracts || 0,
        expiringSoon: stats.expiringContracts || 0
      });

      // Cập nhật số hợp đồng sắp hết hạn vào stats
      setStats(prev => ({
        ...prev,
        contractExpiring: stats.expiringSoon || 0
      }));

    } catch (err) {
      console.error('Error fetching contract data:', err);
    }
  };

  const fetchDepartmentData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/departments`);
    const departments = response.data.data || [];
    
    const totalFaculty = departments.reduce((sum, d) => sum + (d.facultyCount || 0), 0);
    const totalStudents = departments.reduce((sum, d) => sum + (d.studentCount || 0), 0);
    const avgPerformance = departments.length > 0 
      ? Math.round(departments.reduce((sum, d) => sum + (d.performance || 0), 0) / departments.length)
      : 0;
    
    setDepartmentStats({
      departments: departments.map(d => ({
        id: d._id,
        name: d.name,
        code: d.code,
        facultyCount: d.facultyCount || 0,
        studentCount: d.studentCount || 0,
        performance: d.performance || 0,
        color: d.color || '#3B82F6',
        status: d.status
      })),
      totalFaculty,
      totalStudents,
      avgPerformance
    });
  } catch (err) {
    console.error('Error fetching departments:', err);
  }
};

const fetchOfficeData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/offices`);
    const offices = response.data.data || [];
    
    const totalStaff = offices.reduce((sum, o) => sum + (o.staffCount || 0), 0);
    const avgPerformance = offices.length > 0 
      ? Math.round(offices.reduce((sum, o) => sum + (o.performance || 0), 0) / offices.length)
      : 0;
    const totalBudget = offices.reduce((sum, o) => sum + (o.budget || 0), 0);
    const activeOffices = offices.filter(o => o.status === 'active').length;
    
    setOfficeStats({
      offices: offices.map(o => ({
        id: o._id,
        code: o.code,
        name: o.name,
        category: o.category,
        staffCount: o.staffCount || 0,
        performance: o.performance || 0,
        budget: o.budget || 0,
        color: o.color || '#3B82F6',
        status: o.status
      })),
      totalOffices: offices.length,
      totalStaff,
      avgPerformance,
      totalBudget,
      activeOffices
    });
  } catch (err) {
    console.error('Error fetching offices:', err);
  }
};
  // Fallback data khi API không hoạt động
  const setFallbackData = () => {
    setStats({
      totalEmployees: 0,
      teachers: 0,
      staff: 0,
      contractExpiring: 0,
      birthdays: 0,
      onLeave: 0
    });
    setDepartmentDistribution([]);
    setPositionDistribution([]);
    setContractTypeDistribution([]);
    setImportantNotifications([]);
    setRecentActivities([]);
  };

  // THÊM state này vào ngay sau
  const [contractStats, setContractStats] = useState({
    totalContracts: 0,
    totalAmount: 0,
    activeContracts: 0,
    expiredContracts: 0,
    expiringSoon: 0
  });

  // Fetch dữ liệu khi component mount hoặc time range thay đổi
  useEffect(() => {
    fetchDashboardData();
    fetchContractData();
    fetchDepartmentData();
    fetchOfficeData();
  }, [selectedTimeRange]);

  // Export report function
  const handleExportReport = async (format = 'excel') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/export-report`, {
        params: {
          range: selectedTimeRange,
          format: format,
          ...filters
        },
        responseType: 'blob'
      });

      // Tạo link download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard_report_${new Date().toISOString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Hiển thị thông báo thành công
      showNotification('Xuất báo cáo thành công!', 'success');

    } catch (err) {
      console.error('Error exporting report:', err);
      showNotification('Xuất báo cáo thất bại. Vui lòng thử lại!', 'error');
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    showNotification('Đã làm mới dữ liệu!', 'info');
  };

  const showNotification = (message, type) => {
    // Tạo notification tạm thời
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#fd7e14';
      case 'low': return '#40c057';
      default: return '#868e96';
    }
  };

  // Thêm hàm này cùng chỗ với getPriorityColor, getActivityIcon...
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_employee': return <FaUsers className="activity-icon new" />;
      case 'contract_update': return <FaFileContract className="activity-icon contract" />;
      case 'salary': return <FaMoneyBillWave className="activity-icon salary" />;
      case 'attendance': return <FaCalendarCheck className="activity-icon attendance" />;
      case 'training': return <FaGraduationCap className="activity-icon training" />;
      default: return <FaHistory className="activity-icon default" />;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'contract': return <FaFileContract />;
      case 'birthday': return <FaBirthdayCake />;
      case 'leave': return <FaCalendarAlt />;
      case 'training': return <FaGraduationCap />;
      default: return <FaBell />;
    }
  };

  const applyFilters = () => {
    fetchDashboardData();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      position: '',
      contractType: ''
    });
    fetchDashboardData();
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Tổng quan Hệ thống</h1>
          
        </div>
        <div className="header-right">
          <div className="time-filter">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="time-select"
            >
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
          <button className="btn-filter-boss" onClick={() => setShowFilters(!showFilters)}>
            <FaFilter /> Bộ lọc
          </button>
          <button className="btn-refresh" onClick={handleRefresh}>
            <FaSync /> Làm mới
          </button>
          <div className="export-dropdown">
            <button className="btn-export" onClick={() => handleExportReport('excel')}>
              <FaDownload /> Xuất báo cáo
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Bộ lọc dữ liệu</h3>
            <button onClick={() => setShowFilters(false)}><FaTimes /></button>
          </div>
          <div className="filter-body">
            <div className="filter-group">
              <label>Khoa/Phòng</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="cntt">Khoa CNTT</option>
                <option value="kinhte">Khoa Kinh tế</option>
                <option value="ngoaingu">Khoa Ngoại ngữ</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Chức danh</label>
              <select
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="teacher">Giảng viên</option>
                <option value="staff">Nhân viên</option>
                <option value="manager">Quản lý</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Loại hợp đồng</label>
              <select
                value={filters.contractType}
                onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
              >
                <option value="">Tất cả</option>
                <option value="permanent">Biên chế</option>
                <option value="fixed">HĐLĐ xác định thời hạn</option>
                <option value="indefinite">HĐLĐ không xác định</option>
              </select>
            </div>
            <div className="filter-actions">
              <button onClick={applyFilters} className="btn-apply">Áp dụng</button>
              <button onClick={resetFilters} className="btn-reset">Đặt lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={fetchDashboardData}>Thử lại</button>
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="quick-stats-section">
        <h2 className="section-title">
          <FaChartLine /> Thống kê nhanh
        </h2>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>Tổng cán bộ</h3>
              <p className="stat-value">{stats.totalEmployees.toLocaleString()}</p>
              <p className="stat-change">+12% so với tháng trước</p>
            </div>
          </div>

          <div className="stat-card teachers">
            <div className="stat-icon">
              <FaChalkboardTeacher />
            </div>
            <div className="stat-info">
              <h3>Giảng viên</h3>
              <p className="stat-value">{stats.teachers.toLocaleString()}</p>
              <p className="stat-change">
                {stats.totalEmployees > 0
                  ? `${((stats.teachers / stats.totalEmployees) * 100).toFixed(1)}% tổng số`
                  : '0% tổng số'}
              </p>
            </div>
          </div>

          <div className="stat-card staff">
            <div className="stat-icon">
              <FaUserTie />
            </div>
            <div className="stat-info">
              <h3>Nhân viên</h3>
              <p className="stat-value">{stats.staff.toLocaleString()}</p>
              <p className="stat-change">
                {stats.totalEmployees > 0
                  ? `${((stats.staff / stats.totalEmployees) * 100).toFixed(1)}% tổng số`
                  : '0% tổng số'}
              </p>
            </div>
          </div>

          <div className="stat-card contracts">
            <div className="stat-icon">
              <FaFileContract />
            </div>
            <div className="stat-info">
              <h3>Hợp đồng sắp hết hạn</h3>

              <p className="stat-value">{contractStats.expiringSoon.toLocaleString()}</p>
              <p className="stat-change warning">Cần xử lý sớm</p>
            </div>
          </div>

          {/* THÊM CARD HỢP ĐỒNG MỚI */}
          <div className="stat-card contracts-overview">
            <div className="stat-icon">
              <FaFileContract />
            </div>
            <div className="stat-info">
              <h3>Tổng hợp đồng</h3>
              <p className="stat-value">{contractStats.totalContracts.toLocaleString()}</p>
              <p className="stat-change">Tổng giá trị: {formatCurrency(contractStats.totalAmount)}</p>
            </div>
          </div>

          <div className="stat-card active-contracts">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <h3>Đang hiệu lực</h3>
              <p className="stat-value">{contractStats.activeContracts}</p>
              <p className="stat-change">Hợp đồng đang hoạt động</p>
            </div>
          </div>

          <div className="stat-card expired-contracts">
            <div className="stat-icon">
              <FaTimesCircle />
            </div>
            <div className="stat-info">
              <h3>Đã hết hạn</h3>
              <p className="stat-value">{contractStats.expiredContracts}</p>
              <p className="stat-change">Cần gia hạn</p>
            </div>
          </div>

          <div className="stat-card birthdays">
            <div className="stat-icon">
              <FaBirthdayCake />
            </div>
            <div className="stat-info">
              <h3>Sinh nhật tháng này</h3>
              <p className="stat-value">{stats.birthdays}</p>
              <p className="stat-change">Nhân viên có sinh nhật</p>
            </div>
          </div>

          <div className="stat-card onleave">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-info">
              <h3>Đang nghỉ phép</h3>
              <p className="stat-value">{stats.onLeave}</p>
              <p className="stat-change">Nhân viên đang nghỉ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ phân bổ */}
      <div className="charts-section">
        <div className="row">
    <div className="row">
  {/* Phân bổ theo khoa */}
  <div className="col-6">
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaChartPie /> Phân bổ theo khoa</h3>
        <button className="btn-more" onClick={() => window.location.href = 'organization/departments'}>
          Chi tiết
        </button>
      </div>
      <div className="chart-body">
        {departmentStats.departments.length > 0 ? (
          <>
            <div className="pie-chart-container">
              {departmentStats.departments.slice(0, 5).map((dept, idx) => {
                const percentage = (dept.facultyCount / departmentStats.totalFaculty) * 100;
                return (
                  <div key={idx} className="pie-segment-item">
                    <div className="pie-bar">
                      <div 
                        className="pie-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: dept.color
                        }}
                      />
                    </div>
                    <div className="pie-label">
                      <span className="pie-name">{dept.name}</span>
                      <span className="pie-value">{dept.facultyCount} GV ({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              {departmentStats.departments.slice(0, 5).map((dept, idx) => (
                <div key={idx} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: dept.color }} />
                  <span className="legend-text">{dept.code || dept.name}</span>
                  <span className="legend-value">{dept.facultyCount}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">Không có dữ liệu khoa</div>
        )}
      </div>
    </div>
  </div>

  {/* Phân bổ theo phòng ban */}
  <div className="col-6">
    <div className="chart-card">
      <div className="chart-header">
        <h3><FaBuilding /> Phân bổ theo phòng ban</h3>
        <button className="btn-more" onClick={() => window.location.href = 'organization/OfficeManagement'}>
          Chi tiết
        </button>
      </div>
      <div className="chart-body">
        {officeStats.offices.length > 0 ? (
          <>
            <div className="pie-chart-container">
              {officeStats.offices.slice(0, 5).map((office, idx) => {
                const percentage = (office.staffCount / officeStats.totalStaff) * 100;
                return (
                  <div key={idx} className="pie-segment-item">
                    <div className="pie-bar">
                      <div 
                        className="pie-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: office.color
                        }}
                      />
                    </div>
                    <div className="pie-label">
                      <span className="pie-name">{office.name}</span>
                      <span className="pie-value">{office.staffCount} NV ({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              {officeStats.offices.slice(0, 5).map((office, idx) => (
                <div key={idx} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: office.color }} />
                  <span className="legend-text">{office.code}</span>
                  <span className="legend-value">{office.staffCount}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="no-data">Không có dữ liệu phòng ban</div>
        )}
      </div>
    </div>
  </div>
</div>

          <div className="col-4">
            <div className="chart-card">
              <div className="chart-header">
                <h3><FaChartBar /> Phân bổ theo chức danh</h3>
                <button
                  className="btn-more"
                  onClick={() => window.location.href = '/users-permissions/UserManagement'}
                >
                  Chi tiết
                </button>
              </div>
              <div className="chart-body">
                {positionDistribution.length > 0 ? (
                  <div className="bar-chart">
                    {positionDistribution.map((pos, index) => (
                      <div key={index} className="bar-item">
                        <div className="bar-label">{pos.name}</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${(pos.value / stats.totalEmployees) * 100}%`,
                              backgroundColor: pos.color
                            }}
                          >
                            <span className="bar-value">{pos.value}</span>
                          </div>
                        </div>
                        <div className="bar-percentage">
                          {((pos.value / stats.totalEmployees) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">Không có dữ liệu</div>
                )}
              </div>
            </div>
          </div>

       
        </div>
      </div>

      {/* Thông báo quan trọng & Hoạt động gần đây */}
      <div className="notifications-section">
        <div className="row">
          <div className="col-6">
            <div className="notification-card">
              <div className="notification-header">
                <h3><FaExclamationTriangle /> Thông báo quan trọng</h3>
                <button
                  className="btn-view-all"
                  onClick={() => window.location.href = '/notifications'}
                >
                  Xem tất cả
                </button>
              </div>
              <div className="notification-list">
                {importantNotifications.length > 0 ? (
                  importantNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className="notification-item"
                      style={{ borderLeftColor: getPriorityColor(notification.priority) }}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.description}</p>
                        <div className="notification-meta">
                          <span className="notification-date">
                            {new Date(notification.date).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="notification-count">{notification.count} cái</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">Không có thông báo mới</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="activity-card">
              <div className="activity-header">
                <h3><FaHistory /> Hoạt động gần đây</h3>
                <button
                  className="btn-view-all"
                  onClick={() => window.location.href = '/activities'}
                >
                  Xem tất cả
                </button>
              </div>
              <div className="activity-list">
                {recentActivities.length > 0 ? (
                  recentActivities.map(activity => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-avatar">
                        {activity.avatar || activity.user?.charAt(0) || 'U'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-action">
                          <span className="activity-user">{activity.user}</span>
                          <span className="activity-text">{activity.action}</span>
                        </div>
                        <div className="activity-meta">
                          <span className="activity-department">{activity.department}</span>
                          <span className="activity-time">
                            {activity.time || new Date(activity.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {getActivityIcon(activity.type)}
                    </div>
                  ))
                ) : (
                  <div className="no-data">Không có hoạt động nào</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;