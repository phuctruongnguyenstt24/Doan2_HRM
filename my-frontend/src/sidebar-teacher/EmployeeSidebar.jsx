import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import useUnreadMessages from '../NV-chat/useUnreadMessages'; // Import hook
import './EmployeeSidebar.css';

const EmployeeSidebar = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');


  
  // Lấy số tin nhắn chưa đọc
 
  const { unreadCount, refreshUnreadCount } = useUnreadMessages();


  // Refresh unread count khi rời khỏi trang chat
  useEffect(() => {
    // Nếu đang ở trang chat, không cần refresh (vì đã đọc tin nhắn ở đó)
    // Khi chuyển sang trang khác, refresh lại
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
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/employee/NVDashboard',
      icon: 'fas fa-home',
      label: 'Trang chủ',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/NVattendance',
      icon: 'fas fa-fingerprint',
      label: 'Chấm công',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/NVtraining',
      icon: 'fas fa-graduation-cap',
      label: 'Đào tạo',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/Chatemployee',
      icon: 'fas fa-comment-dots', // Đổi icon cho phù hợp
      label: 'Phản hồi',
      roles: ['admin', 'manager', 'user', 'lecturer'],
      badge: unreadCount // Thêm badge từ hook
    },
    {
      path: '/employee/leave-request',
      icon: 'fas fa-calendar-alt',
      label: 'Xin nghỉ phép',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/salary',
      icon: 'fas fa-coins',
      label: 'Bảng lương',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/documents',
      icon: 'fas fa-folder-open',
      label: 'Tài liệu',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/calendar',
      icon: 'fas fa-calendar-check',
      label: 'Lịch làm việc',
      roles: ['admin', 'manager', 'user', 'lecturer']
    },
    {
      path: '/employee/notifications',
      icon: 'fas fa-bell',
      label: 'Thông báo',
      roles: ['admin', 'manager', 'user', 'lecturer'],
      badge: 3
    },
    {
      path: '/employee/profile',
      icon: 'fas fa-user-circle',
      label: 'Hồ sơ cá nhân',
      roles: ['admin', 'manager', 'user', 'lecturer']
    }
  ];

  // Menu dành cho Admin/Manager thêm
  const adminMenuItems = [
    {
      path: '/admin/users',
      icon: 'fas fa-users',
      label: 'Quản lý nhân viên',
      roles: ['admin', 'manager']
    },
    {
      path: '/admin/attendance',
      icon: 'fas fa-chart-line',
      label: 'Báo cáo chấm công',
      roles: ['admin', 'manager']
    },
    {
      path: '/admin/training',
      icon: 'fas fa-chalkboard-teacher',
      label: 'Quản lý đào tạo',
      roles: ['admin']
    },
    {
      path: '/admin/settings',
      icon: 'fas fa-cog',
      label: 'Cài đặt hệ thống',
      roles: ['admin']
    }
  ];

  // Lọc menu theo role
  const userRole = user.role || 'user';
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));
  const filteredAdminItems = adminMenuItems.filter(item => item.roles.includes(userRole));

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
            <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user-teacher">
          <div className="user-avatar-wrapper">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=4F46E5&color=fff`} 
              alt={user.name}
              className="user-avatar-teacher"
            />
            {!isCollapsed && (
              <div className="user-status online"></div>
            )}
          </div>
          {!isCollapsed && (
            <div className="user-info-teacher">
              <span className="user-name-teacher">{user.name || 'Nhân viên'}</span>
              <span className="user-role-teacher">
                {user.role === 'admin' ? 'Quản trị viên' : 
                 user.role === 'manager' ? 'Quản lý' : 
                 user.role === 'user' ? 'Nhân viên' : 'Giảng viên'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            {!isCollapsed && <div className="nav-section-title">Chính</div>}
            <ul className="nav-menu">
              {filteredMenuItems.map((item, index) => (
                <li key={index} className="nav-item">
                  <Link 
                    to={item.path} 
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <i className={item.icon}></i>
                    {!isCollapsed && <span>{item.label}</span>}
                    {item.badge > 0 && !isCollapsed && ( // Hiển thị badge nếu > 0
                      <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                    {/* Hiển thị badge nhỏ khi sidebar collapsed */}
                    {item.badge > 0 && isCollapsed && (
                      <span className="nav-badge-collapsed">{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {filteredAdminItems.length > 0 && (
            <div className="nav-section">
              {!isCollapsed && <div className="nav-section-title">Quản trị</div>}
              <ul className="nav-menu">
                {filteredAdminItems.map((item, index) => (
                  <li key={index} className="nav-item">
                    <Link 
                      to={item.path} 
                      className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      <i className={item.icon}></i>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
          {!isCollapsed && (
            <div className="app-version">
              <i className="fas fa-code-branch"></i>
              <span>Version 1.0.0</span>
            </div>
          )}
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