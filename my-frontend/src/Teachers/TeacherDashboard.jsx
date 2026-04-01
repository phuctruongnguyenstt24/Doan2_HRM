import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import {faHome, faUsers, faBuilding, faChevronLeft, faChevronRight,
//   faFingerprint, faGraduationCap, faCalendarAlt, faCoins,
//   faFolderOpen, faCalendarCheck, faBell, faUserCircle,
//   faChartLine, faChalkboardTeacher, faCog, faSignOutAlt,
//   faCodeBranch} from 'react-icons/fa';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    pendingLeaves: 0,
    attendanceRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Giả lập dữ liệu thống kê
    setStats({
      totalStudents: 156,
      totalCourses: 4,
      pendingLeaves: 2,
      attendanceRate: 94.5
    });

    // Giả lập hoạt động gần đây
    setRecentActivities([
      {
        id: 1,
        type: 'attendance',
        title: 'Chấm công thành công',
        time: '08:30 AM',
        date: '2024-01-15',
        status: 'success'
      },
      {
        id: 2,
        type: 'leave',
        title: 'Đơn xin nghỉ phép được duyệt',
        time: '02:15 PM',
        date: '2024-01-14',
        status: 'approved'
      },
      {
        id: 3,
        type: 'training',
        title: 'Hoàn thành khóa đào tạo',
        time: '11:00 AM',
        date: '2024-01-13',
        status: 'completed'
      },
      {
        id: 4,
        type: 'document',
        title: 'Tài liệu mới được cập nhật',
        time: '09:45 AM',
        date: '2024-01-12',
        status: 'info'
      }
    ]);

    // Giả lập lịch dạy sắp tới
    setUpcomingClasses([
      {
        id: 1,
        course: 'Lập trình React',
        time: '09:00 - 11:30',
        date: '2024-01-16',
        room: 'Phòng A101',
        students: 25
      },
      {
        id: 2,
        course: 'Node.js & Express',
        time: '13:30 - 16:00',
        date: '2024-01-16',
        room: 'Phòng B202',
        students: 20
      },
      {
        id: 3,
        course: 'Database Design',
        time: '09:00 - 11:30',
        date: '2024-01-17',
        room: 'Phòng C303',
        students: 28
      }
    ]);
  }, []);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'attendance':
        return 'fas fa-fingerprint';
      case 'leave':
        return 'fas fa-calendar-alt';
      case 'training':
        return 'fas fa-graduation-cap';
      case 'document':
        return 'fas fa-file-alt';
      default:
        return 'fas fa-bell';
    }
  };

  const getActivityColor = (status) => {
    switch(status) {
      case 'success':
        return '#10b981';
      case 'approved':
        return '#3b82f6';
      case 'completed':
        return '#8b5cf6';
      case 'info':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="teacher-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            Xin chào, {user.name || 'Giảng viên'}!
          </h1>
          <p className="dashboard-subtitle">
            Chào mừng bạn quay trở lại. Dưới đây là tổng quan về công việc hôm nay.
          </p>
        </div>
        <div className="header-right">
          <div className="date-display">
            <i className="fas fa-calendar-alt"></i>
            <span>
              {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalStudents}</h3>
            <p className="stat-label">Học viên</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalCourses}</h3>
            <p className="stat-label">Khóa học</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.attendanceRate}%</h3>
            <p className="stat-label">Tỷ lệ chấm công</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ef4444' }}>
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.pendingLeaves}</h3>
            <p className="stat-label">Đơn nghỉ chờ duyệt</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Upcoming Classes */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-chalkboard-teacher"></i>
              Lịch dạy sắp tới
            </h3>
            <Link to="/employee/calendar" className="view-all-link">
              Xem tất cả <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-content">
            {upcomingClasses.map((classItem) => (
              <div key={classItem.id} className="class-item">
                <div className="class-info">
                  <h4 className="class-title">{classItem.course}</h4>
                  <div className="class-details">
                    <span className="class-detail">
                      <i className="fas fa-calendar"></i>
                      {new Date(classItem.date).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="class-detail">
                      <i className="fas fa-clock"></i>
                      {classItem.time}
                    </span>
                    <span className="class-detail">
                      <i className="fas fa-door-open"></i>
                      {classItem.room}
                    </span>
                    <span className="class-detail">
                      <i className="fas fa-user-graduate"></i>
                      {classItem.students} học viên
                    </span>
                  </div>
                </div>
                <button className="btn-check-attendance">
                  <i className="fas fa-fingerprint"></i>
                  Chấm công
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-history"></i>
              Hoạt động gần đây
            </h3>
            <Link to="/employee/notifications" className="view-all-link">
              Xem tất cả <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-content">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon" style={{ background: getActivityColor(activity.status) }}>
                  <i className={getActivityIcon(activity.type)}></i>
                </div>
                <div className="activity-content">
                  <p className="activity-title">{activity.title}</p>
                  <div className="activity-time">
                    <i className="far fa-clock"></i>
                    <span>{activity.date} lúc {activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-bolt"></i>
              Thao tác nhanh
            </h3>
          </div>
          <div className="card-content">
            <div className="quick-actions-grid">
              <Link to="/employee/attendance" className="quick-action-btn">
                <i className="fas fa-fingerprint"></i>
                <span>Chấm công</span>
              </Link>
              <Link to="/employee/leave-request" className="quick-action-btn">
                <i className="fas fa-calendar-alt"></i>
                <span>Xin nghỉ phép</span>
              </Link>
              <Link to="/employee/training" className="quick-action-btn">
                <i className="fas fa-graduation-cap"></i>
                <span>Đào tạo</span>
              </Link>
              <Link to="/employee/salary" className="quick-action-btn">
                <i className="fas fa-coins"></i>
                <span>Xem lương</span>
              </Link>
              <Link to="/employee/documents" className="quick-action-btn">
                <i className="fas fa-folder-open"></i>
                <span>Tài liệu</span>
              </Link>
              <Link to="/employee/profile" className="quick-action-btn">
                <i className="fas fa-user-edit"></i>
                <span>Cập nhật hồ sơ</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-megaphone"></i>
              Thông báo
            </h3>
            <span className="badge">3 mới</span>
          </div>
          <div className="card-content">
            <div className="announcement-list">
              <div className="announcement-item">
                <div className="announcement-icon">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="announcement-content">
                  <p className="announcement-text">
                    Lịch nghỉ lễ 30/4 - 1/5: Đề nghị cập nhật đơn xin nghỉ phép trước ngày 25/4.
                  </p>
                  <span className="announcement-time">2 giờ trước</span>
                </div>
              </div>
              <div className="announcement-item">
                <div className="announcement-icon">
                  <i className="fas fa-chalkboard"></i>
                </div>
                <div className="announcement-content">
                  <p className="announcement-text">
                    Khóa đào tạo mới: "React Advanced" sẽ bắt đầu vào tuần tới. Đăng ký ngay!
                  </p>
                  <span className="announcement-time">Hôm qua</span>
                </div>
              </div>
              <div className="announcement-item">
                <div className="announcement-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="announcement-content">
                  <p className="announcement-text">
                    Báo cáo chấm công tháng 1 đã sẵn sàng. Vui lòng kiểm tra và xác nhận.
                  </p>
                  <span className="announcement-time">2 ngày trước</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;