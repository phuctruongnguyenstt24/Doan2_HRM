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
 FaSync
} from 'react-icons/fa';
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
  

  // Mock data - Thay thế bằng API call thực tế
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // Mock data
      setTimeout(() => {
        setStats({
          totalEmployees: 1248,
          teachers: 856,
          staff: 392,
          contractExpiring: 23,
          birthdays: 12,
          onLeave: 45
        });

        setDepartmentDistribution([
          { name: 'Khoa CNTT', value: 280, color: '#4dabf7' },
          { name: 'Khoa Kinh tế', value: 220, color: '#40c057' },
          { name: 'Phòng Tổ chức', value: 120, color: '#ff6b6b' },
          { name: 'Khoa Ngoại ngữ', value: 195, color: '#7950f2' },
          { name: 'Phòng Đào tạo', value: 185, color: '#fd7e14' },
          { name: 'Khác', value: 248, color: '#e64980' }
        ]);

        setPositionDistribution([
          { name: 'Giảng viên', value: 856, color: '#4dabf7' },
          { name: 'Nhân viên', value: 248, color: '#40c057' },
          { name: 'Quản lý', value: 112, color: '#ff6b6b' },
          { name: 'Trưởng phòng', value: 32, color: '#7950f2' }
        ]);

        setContractTypeDistribution([
          { name: 'Biên chế', value: 420, color: '#4dabf7' },
          { name: 'HĐLĐ xác định thời hạn', value: 580, color: '#40c057' },
          { name: 'HĐLĐ không xác định thời hạn', value: 248, color: '#ff6b6b' }
        ]);

        setImportantNotifications([
          { 
            id: 1, 
            type: 'contract', 
            title: 'Hợp đồng sắp hết hạn', 
            description: '23 hợp đồng sẽ hết hạn trong 30 ngày tới',
            priority: 'high',
            date: '2024-01-15',
            count: 23
          },
          { 
            id: 2, 
            type: 'birthday', 
            title: 'Sinh nhật tháng này', 
            description: '12 nhân viên có sinh nhật trong tháng 1',
            priority: 'medium',
            date: '2024-01-10',
            count: 12
          },
          { 
            id: 3, 
            type: 'leave', 
            title: 'Nhân viên nghỉ phép', 
            description: '45 nhân viên đang nghỉ phép trong tuần này',
            priority: 'medium',
            date: '2024-01-08',
            count: 45
          },
          { 
            id: 4, 
            type: 'training', 
            title: 'Đào tạo sắp diễn ra', 
            description: '3 khóa đào tạo sẽ diễn ra tuần tới',
            priority: 'low',
            date: '2024-01-05',
            count: 3
          }
        ]);

        setRecentActivities([
          { 
            id: 1, 
            type: 'new_employee', 
            action: 'Thêm nhân viên mới', 
            user: 'Nguyễn Văn A',
            department: 'Khoa CNTT',
            time: '5 phút trước',
            avatar: 'NA'
          },
          { 
            id: 2, 
            type: 'contract_update', 
            action: 'Gia hạn hợp đồng', 
            user: 'Trần Thị B',
            department: 'Phòng Tổ chức',
            time: '1 giờ trước',
            avatar: 'TB'
          },
          { 
            id: 3, 
            type: 'salary', 
            action: 'Tính lương tháng 12', 
            user: 'Phạm Văn C',
            department: 'Phòng Kế toán',
            time: '2 giờ trước',
            avatar: 'PC'
          },
          { 
            id: 4, 
            type: 'attendance', 
            action: 'Cập nhật chấm công', 
            user: 'Lê Thị D',
            department: 'Phòng Nhân sự',
            time: '3 giờ trước',
            avatar: 'LD'
          },
          { 
            id: 5, 
            type: 'training', 
            action: 'Đăng ký khóa đào tạo', 
            user: 'Hoàng Văn E',
            department: 'Khoa Kinh tế',
            time: '5 giờ trước',
            avatar: 'HE'
          }
        ]);

        setLoading(false);
      }, 1000);
    };

    fetchDashboardData();
  }, [selectedTimeRange]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#fd7e14';
      case 'low': return '#40c057';
      default: return '#868e96';
    }
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

  const handleExportReport = () => {
    // Logic xuất báo cáo
    alert('Xuất báo cáo thành công!');
  };

  const handleRefresh = () => {
    setLoading(true);
    // Refresh data
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Tổng quan Hệ thống</h1>
          <p>Chào mừng quay trở lại! Dưới đây là thống kê tổng quan hệ thống.</p>
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
          <button className="btn-refresh" onClick={handleRefresh}>
            <FaSync /> Làm mới
          </button>
          <button className="btn-export" onClick={handleExportReport}>
            <FaDownload /> Xuất báo cáo
          </button>
        </div>
      </div>

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
              <p className="stat-change">68.6% tổng số</p>
            </div>
          </div>

          <div className="stat-card staff">
            <div className="stat-icon">
              <FaUserTie />
            </div>
            <div className="stat-info">
              <h3>Nhân viên</h3>
              <p className="stat-value">{stats.staff.toLocaleString()}</p>
              <p className="stat-change">31.4% tổng số</p>
            </div>
          </div>

          <div className="stat-card contracts">
            <div className="stat-icon">
              <FaFileContract />
            </div>
            <div className="stat-info">
              <h3>Hợp đồng sắp hết hạn</h3>
              <p className="stat-value">{stats.contractExpiring}</p>
              <p className="stat-change warning">Cần xử lý sớm</p>
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
          <div className="col-4">
            <div className="chart-card">
              <div className="chart-header">
                <h3><FaChartPie /> Phân bổ theo khoa/phòng</h3>
                <button className="btn-more">Chi tiết</button>
              </div>
              <div className="chart-body">
                <div className="pie-chart">
                  {departmentDistribution.map((dept, index) => (
                    <div 
                      key={index}
                      className="pie-segment"
                      style={{
                        backgroundColor: dept.color,
                        width: `${(dept.value / stats.totalEmployees) * 100}%`
                      }}
                      title={`${dept.name}: ${dept.value} (${((dept.value / stats.totalEmployees) * 100).toFixed(1)}%)`}
                    >
                      <span className="segment-label">{dept.name}</span>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  {departmentDistribution.map((dept, index) => (
                    <div key={index} className="legend-item">
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="legend-text">{dept.name}</span>
                      <span className="legend-value">{dept.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="chart-card">
              <div className="chart-header">
                <h3><FaChartBar /> Phân bổ theo chức danh</h3>
                <button className="btn-more">Chi tiết</button>
              </div>
              <div className="chart-body">
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
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="chart-card">
              <div className="chart-header">
                <h3><FaChartLine /> Loại hợp đồng</h3>
                <button className="btn-more">Chi tiết</button>
              </div>
              <div className="chart-body">
                <div className="donut-chart">
                  <div className="donut-inner">
                    <div className="donut-total">{stats.totalEmployees}</div>
                    <div className="donut-label">Tổng hợp đồng</div>
                  </div>
                  {contractTypeDistribution.map((contract, index, array) => {
                    const startPercent = array.slice(0, index).reduce((acc, curr) => 
                      acc + (curr.value / stats.totalEmployees) * 100, 0
                    );
                    const percent = (contract.value / stats.totalEmployees) * 100;
                    
                    return (
                      <div 
                        key={index}
                        className="donut-segment"
                        style={{
                          background: `conic-gradient(
                            ${contract.color} 0deg ${percent * 3.6}deg,
                            transparent ${percent * 3.6}deg 360deg
                          )`,
                          transform: `rotate(${startPercent * 3.6}deg)`
                        }}
                      />
                    );
                  })}
                </div>
                <div className="chart-legend">
                  {contractTypeDistribution.map((contract, index) => (
                    <div key={index} className="legend-item">
                      <span 
                        className="legend-color" 
                        style={{ backgroundColor: contract.color }}
                      />
                      <span className="legend-text">{contract.name}</span>
                      <span className="legend-value">{contract.value}</span>
                    </div>
                  ))}
                </div>
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
                <button className="btn-view-all">Xem tất cả</button>
              </div>
              <div className="notification-list">
                {importantNotifications.map(notification => (
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
                        <span className="notification-date">{notification.date}</span>
                        <span className="notification-count">{notification.count} cái</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="activity-card">
              <div className="activity-header">
                <h3><FaHistory /> Hoạt động gần đây</h3>
                <button className="btn-view-all">Xem tất cả</button>
              </div>
              <div className="activity-list">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-avatar">
                      {activity.avatar}
                    </div>
                    <div className="activity-content">
                      <div className="activity-action">
                        <span className="activity-user">{activity.user}</span>
                        <span className="activity-text">{activity.action}</span>
                      </div>
                      <div className="activity-meta">
                        <span className="activity-department">{activity.department}</span>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                    {getActivityIcon(activity.type)}
                  </div>
                ))}
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