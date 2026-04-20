// Teacher/TeacherLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './TeacherLayout.css';

const TeacherLayout = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error parsing user:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedEmail');
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { path: '/teacher/dashboard', icon: '📊', label: 'Tổng quan' },
    { path: '/teacher/profile', icon: '👤', label: 'Thông tin cá nhân' },
    { path: '/teacher/schedule', icon: '📅', label: 'Lịch giảng dạy' },
    { path: '/teacher/students', icon: '👨‍🎓', label: 'Danh sách sinh viên' },
    { path: '/teacher/attendance', icon: '📝', label: 'Điểm danh' },
    { path: '/teacher/change-password', icon: '🔒', label: 'Đổi mật khẩu' },
  ];

  return (
    <div className="teacher-layout">
      {/* Sidebar */}
      <aside className={`teacher-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">👨‍🏫</span>
            {sidebarOpen && <span className="logo-text">Giảng Viên</span>}
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                {user?.name?.charAt(0) || 'G'}
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="user-info-sidebar">
              <h4>{user?.name || 'Giảng viên'}</h4>
              <p>{user?.teacherCode || 'Mã GV'}</p>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn-sidebar">
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="teacher-main">
        <header className="teacher-header">
          <div className="header-title">
            <h1>{getPageTitle(location.pathname)}</h1>
          </div>
          <div className="header-actions">
            <span className="welcome-text">
              Xin chào, {user?.name?.split(' ').pop() || 'Giảng viên'}!
            </span>
          </div>
        </header>
        <div className="teacher-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const getPageTitle = (path) => {
  const titles = {
    '/teacher/dashboard': 'Tổng quan',
    '/teacher/profile': 'Thông tin cá nhân',
    '/teacher/schedule': 'Lịch giảng dạy',
    '/teacher/students': 'Danh sách sinh viên',
    '/teacher/attendance': 'Điểm danh',
    '/teacher/change-password': 'Đổi mật khẩu',
  };
  return titles[path] || 'Giảng viên';
};

export default TeacherLayout;