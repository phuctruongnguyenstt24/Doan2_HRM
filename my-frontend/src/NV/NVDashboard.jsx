import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './NVDashboard.css';

const NVDashboard = () => {
  const [user, setUser] = useState({});
  const [stats, setStats] = useState({
    attendanceRate: 0,
    presentDays: 0,
    totalWorkDays: 0,
    pendingLeaves: 0,
    unreadMessages: 0,
    totalMessages: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cấu hình axios
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
  });

  // Thêm token vào request
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Fetch dữ liệu thật
    fetchDashboardData();
    fetchTodaySchedule();
    fetchRecentActivities();
  }, []);

  // Lấy dữ liệu dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Lấy thông tin chấm công
      const attendanceRes = await api.get('/attendance/statistics');
      const attendanceData = attendanceRes.data || {};
      
      // 2. Lấy số đơn nghỉ phép đang chờ
      const leaveRes = await api.get('/leave-requests/pending-count');
      const pendingLeaves = leaveRes.data?.count || 0;
      
      // 3. Lấy số tin nhắn chưa đọc
      const messagesRes = await api.get('/messages/conversations');
      let unreadMessages = 0;
      const currentUserId = userData._id;
      
      if (messagesRes.data && Array.isArray(messagesRes.data)) {
        messagesRes.data.forEach(conv => {
          if (conv.unreadCount) {
            const unread = conv.unreadCount.get ? conv.unreadCount.get(currentUserId) : conv.unreadCount[currentUserId];
            if (unread) unreadMessages += unread;
          }
        });
      }
      
      // 4. Lấy tổng số tin nhắn đã gửi
      const totalMessagesRes = await api.get('/messages/stats/total');
      const totalMessages = totalMessagesRes.data?.total || 0;
      
      setStats({
        attendanceRate: attendanceData.rate || 0,
        presentDays: attendanceData.presentDays || 0,
        totalWorkDays: attendanceData.totalWorkDays || 22,
        pendingLeaves: pendingLeaves,
        unreadMessages: unreadMessages,
        totalMessages: totalMessages
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Nếu API chưa có, dùng dữ liệu mẫu
      setStats({
        attendanceRate: 94.5,
        presentDays: 18,
        totalWorkDays: 22,
        pendingLeaves: 2,
        unreadMessages: 5,
        totalMessages: 128
      });
    } finally {
      setLoading(false);
    }
  };

  // Lấy lịch làm việc hôm nay
  const fetchTodaySchedule = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/schedule/today?date=${today}`);
      setTodaySchedule(response.data);
    } catch (error) {
      console.error('Error fetching today schedule:', error);
      // Dữ liệu mẫu nếu chưa có API
      setTodaySchedule({
        hasShift: true,
        startTime: '08:00',
        endTime: '17:00',
        department: 'Phòng Nhân sự',
        task: 'Xử lý hồ sơ nhân viên'
      });
    }
  };

  // Lấy hoạt động gần đây
  const fetchRecentActivities = async () => {
    try {
      const response = await api.get('/activities/recent?limit=5');
      setRecentActivities(response.data);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Dữ liệu mẫu
      setRecentActivities([
        {
          id: 1,
          type: 'attendance',
          title: 'Đã chấm công thành công',
          time: '08:30',
          date: new Date().toISOString().split('T')[0],
          status: 'success'
        },
        {
          id: 2,
          type: 'message',
          title: 'Tin nhắn mới từ Quản lý',
          time: '14:15',
          date: new Date().toISOString().split('T')[0],
          status: 'info'
        },
        {
          id: 3,
          type: 'leave',
          title: 'Đơn xin nghỉ phép đã được duyệt',
          time: '10:30',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          status: 'approved'
        }
      ]);
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'attendance':
        return 'fas fa-fingerprint';
      case 'message':
        return 'fas fa-comment-dots';
      case 'leave':
        return 'fas fa-calendar-alt';
      case 'salary':
        return 'fas fa-coins';
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
      case 'info':
        return '#f59e0b';
      case 'pending':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="loading-dashboard">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            Xin chào, {user.name || user.fullName || 'Nhân viên'}!
          </h1>
          <p className="dashboard-subtitle">
            Chào mừng bạn đến với hệ thống quản lý nhân sự
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
            <i className="fas fa-fingerprint"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.attendanceRate}%</h3>
            <p className="stat-label">Tỷ lệ chấm công</p>
            <p className="stat-detail">{stats.presentDays}/{stats.totalWorkDays} ngày</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b981' }}>
            <i className="fas fa-comment-dots"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.unreadMessages}</h3>
            <p className="stat-label">Tin nhắn chưa đọc</p>
            <p className="stat-detail">Tổng: {stats.totalMessages}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b' }}>
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.pendingLeaves}</h3>
            <p className="stat-label">Đơn nghỉ chờ duyệt</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <i className="fas fa-coins"></i>
          </div>
          <div className="stat-info">
            <h3 className="stat-value">
              {new Intl.NumberFormat('vi-VN').format(stats.currentSalary || 0)}
            </h3>
            <p className="stat-label">Lương tháng này</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Today's Schedule */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-calendar-check"></i>
              Lịch làm việc hôm nay
            </h3>
            <Link to="/employee/calendar" className="view-all-link">
              Xem lịch <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-content">
            {todaySchedule ? (
              <div className="today-schedule">
                <div className="schedule-time">
                  <i className="fas fa-clock"></i>
                  <span>{todaySchedule.startTime} - {todaySchedule.endTime}</span>
                </div>
                <div className="schedule-department">
                  <i className="fas fa-building"></i>
                  <span>{todaySchedule.department || 'Phòng Nhân sự'}</span>
                </div>
                <div className="schedule-task">
                  <i className="fas fa-tasks"></i>
                  <span>{todaySchedule.task || 'Làm việc tại văn phòng'}</span>
                </div>
                <Link to="/employee/NVattendance" className="btn-checkin">
                  <i className="fas fa-fingerprint"></i>
                  Chấm công ngay
                </Link>
              </div>
            ) : (
              <div className="no-schedule">
                <p>Hôm nay không có lịch làm việc</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-history"></i>
              Hoạt động gần đây
            </h3>
          </div>
          <div className="card-content">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
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
              ))
            ) : (
              <div className="no-activities">
                <p>Chưa có hoạt động nào</p>
              </div>
            )}
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
              <Link to="/employee/NVattendance" className="quick-action-btn">
                <i className="fas fa-fingerprint"></i>
                <span>Chấm công</span>
              </Link>
              <Link to="/employee/Chatemployee" className="quick-action-btn">
                <i className="fas fa-comment-dots"></i>
                <span>Phản hồi</span>
              </Link>
              <Link to="/employee/leave-request" className="quick-action-btn">
                <i className="fas fa-calendar-alt"></i>
                <span>Xin nghỉ phép</span>
              </Link>
              <Link to="/employee/salary" className="quick-action-btn">
                <i className="fas fa-coins"></i>
                <span>Xem lương</span>
              </Link>
              <Link to="/employee/calendar" className="quick-action-btn">
                <i className="fas fa-calendar-check"></i>
                <span>Lịch làm việc</span>
              </Link>
              <Link to="/employee/profile" className="quick-action-btn">
                <i className="fas fa-user-edit"></i>
                <span>Cập nhật hồ sơ</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fas fa-comment-dots"></i>
              Tin nhắn gần đây
            </h3>
            <Link to="/employee/Chatemployee" className="view-all-link">
              Vào phản hồi <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="card-content">
            <div className="recent-messages">
              <div className="message-placeholder">
                <i className="fas fa-comments"></i>
                <p>Bạn có {stats.unreadMessages} tin nhắn chưa đọc</p>
                <Link to="/employee/Chatemployee" className="btn-view-messages">
                  Xem tin nhắn
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    
    </div>
  );
};

export default NVDashboard;