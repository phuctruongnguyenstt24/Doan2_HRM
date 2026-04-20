import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { FaBars, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import useUnreadMessages from '../NV-chat/useUnreadMessages';
import './EmployeeSidebar.css';

const EmployeeSidebar = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // THÊM STATE
  const location = useLocation();
  const navigate = useNavigate();
  
  // THÊM HÀM GET USER GIỐNG CHATEMPLOYEE
  const getUserFromStorage = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  // THÊM USE EFFECT ĐỂ LẤY USER
  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      console.log('EmployeeSidebar - User loaded:', user);
      setCurrentUser(user);
    }
  }, []);

  const { unreadCount, refreshUnreadCount } = useUnreadMessages();

  // Refresh unread count khi rời khỏi trang chat
  useEffect(() => {
    if (!location.pathname.includes('/employee/Chatemployee')) {
      refreshUnreadCount();
    }
  }, [location.pathname, refreshUnreadCount]);

  // Lắng nghe sự kiện khi đọc tin nhắn xong
  useEffect(() => {
    const handleMessagesRead = () => {
      refreshUnreadCount();
    };

    window.addEventListener('messages-read', handleMessagesRead);
    return () => window.removeEventListener('messages-read', handleMessagesRead);
  }, [refreshUnreadCount]);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  // Menu chỉ dành cho nhân viên
  const menuItems = [
    {
      path: '/employee/NVDashboard',
      icon: 'fas fa-home',
      label: 'Trang chủ'
    },
    {
      path: '/employee/NVattendance',
      icon: 'fas fa-fingerprint',
      label: 'Chấm công'
    },
    {
      path: '/employee/Chatemployee',
      icon: 'fas fa-comment-dots',
      label: 'Phản hồi',
      badge: unreadCount
    },
    {
      path: '/employee/leave-request',
      icon: 'fas fa-calendar-alt',
      label: 'Xin nghỉ phép'
    },
    {
      path: '/employee/salary',
      icon: 'fas fa-coins',
      label: 'Bảng lương'
    },
    {
      path: '/employee/calendar',
      icon: 'fas fa-calendar-check',
      label: 'Lịch làm việc'
    },
    {
      path: '/employee/notifications',
      icon: 'fas fa-bell',
      label: 'Thông báo',
      badge: 3
    },
    {
      path: '/employee/profile',
      icon: 'fas fa-user-circle',
      label: 'Hồ sơ cá nhân'
    }
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (isMobile) {
      setShowMobileMenu(!showMobileMenu);
    }
  };

  const closeMobileMenu = () => {
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  // Hàm lấy tên user an toàn
  const getUserName = () => {
    if (!currentUser) return 'Nhân viên';
    return currentUser.name || currentUser.fullName || currentUser.username || currentUser.email?.split('@')[0] || 'Nhân viên';
  };

  // Hiển thị loading nếu chưa có user
  if (!currentUser) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className={`employee-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobile && showMobileMenu && (
        <div className="sidebar-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <aside className={`employee-sidebar ${isMobile && !showMobileMenu ? 'mobile-hidden' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header-teacher">
          <div className="logo-area">
            {!isCollapsed ? (
              <div className="logo-full">
                <i className="fas fa-building"></i>
                <span>HR System</span>
              </div>
            ) : (
              <div className="logo-icon-teacher">
                <i className="fas fa-building"></i>
              </div>
            )}
          </div>
          <button className="collapse-btn-teacher" onClick={toggleSidebar}>
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* User Info - SỬA LẠI PHẦN NÀY */}
        <div className="sidebar-user-teacher">
          <div className="user-avatar-wrapper">
            <img
              src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&background=4F46E5&color=fff`}
              alt={getUserName()}
              className="user-avatar-teacher"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&background=4F46E5&color=fff`;
              }}
            />
            {!isCollapsed && (
              <div className="user-status online"></div>
            )}
          </div>
          {!isCollapsed && (
            <div className="user-info-employee">
              <span className="user-name-employee">{getUserName()}</span>
              <span className="user-role-employee">Nhân viên</span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <ul className="nav-menu">
              {menuItems.map((item, index) => (
                <li key={index} className="nav-item">
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <i className={item.icon}></i>
                    {!isCollapsed && <span>{item.label}</span>}
                    {item.badge > 0 && !isCollapsed && (
                      <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                    {item.badge > 0 && isCollapsed && (
                      <span className="nav-badge-collapsed">{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
          
        </div>
      </aside>

      {/* Main Content */}
      <main className="employee-main-content" onClick={closeMobileMenu}>
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeSidebar;