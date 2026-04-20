// Teacher/TeacherSidebar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import './TeacherSidebar.css';

const TeacherSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tokenValid, setTokenValid] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Helper: Lấy token từ storage
  const getToken = useCallback(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  // Helper: Lấy user từ storage
  const getUserFromStorage = useCallback(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user:', error);
      return null;
    }
  }, []);

  // Helper: Kiểm tra token có hợp lệ không (decode và check expiry)
  const isTokenValid = useCallback((token) => {
    if (!token) return false;
    
    try {
      // Decode JWT token (phần payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Kiểm tra token có hết hạn chưa
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }, []);

  // Kiểm tra authentication khi component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      const userData = getUserFromStorage();
      
      if (!token || !userData || !isTokenValid(token)) {
        // Token không tồn tại hoặc đã hết hạn
        setTokenValid(false);
        setLoading(false);
        
        // Xóa dữ liệu cũ nếu có
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Redirect về login
        navigate('/login', { replace: true });
        return;
      }
      
      // Token hợp lệ
      setUser(userData);
      setTokenValid(true);
      setLoading(false);
    };
    
    checkAuth();
  }, [getToken, getUserFromStorage, isTokenValid, navigate]);

  // Lắng nghe sự kiện storage (khi token thay đổi ở tab khác)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        const token = getToken();
        const userData = getUserFromStorage();
        
        if (!token || !userData || !isTokenValid(token)) {
          // Token bị xóa hoặc hết hạn ở tab khác
          setTokenValid(false);
          navigate('/login', { replace: true });
        } else {
          setUser(userData);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getToken, getUserFromStorage, isTokenValid, navigate]);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refresh user info khi component focus (trở lại tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab được focus lại, kiểm tra lại token và user
        const token = getToken();
        const userData = getUserFromStorage();
        
        if (!token || !userData || !isTokenValid(token)) {
          navigate('/login', { replace: true });
        } else {
          setUser(userData);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [getToken, getUserFromStorage, isTokenValid, navigate]);

  const handleLogout = useCallback(async () => {
    // Gọi API logout nếu cần (optional)
    try {
      const token = getToken();
      if (token) {
        // Gọi API logout để invalidate token trên server
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {
          // Bỏ qua lỗi nếu API không có endpoint logout
          console.log('Logout API not available');
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Xóa tất cả dữ liệu session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Chuyển hướng về login
      navigate('/login', { replace: true });
    }
  }, [getToken, navigate]);

  // Tự động logout sau thời gian không hoạt động (30 phút)
  useEffect(() => {
    let inactivityTimer;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      
      // Đặt timer 30 phút (1800000 ms)
      inactivityTimer = setTimeout(() => {
        console.log('Auto logout due to inactivity');
        handleLogout();
      }, 30 * 60 * 1000);
    };
    
    // Các sự kiện cần reset timer
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });
    
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [handleLogout]);

  const menuItems = [
    {
      path: '/teacher/dashboard',
      icon: 'fas fa-chalkboard-teacher',
      label: 'Tổng quan',
      roles: ['teacher', 'admin']
    },
    {
      path: '/teacher/profile',
      icon: 'fas fa-user-circle',
      label: 'Thông tin cá nhân',
      roles: ['teacher', 'admin']
    },
    {
      path: '/teacher/teacherschedule',
      icon: 'fas fa-calendar-alt',
      label: 'Lịch giảng dạy',
      roles: ['teacher']
    },
    {
      path: '/teacher/classes',
      icon: 'fas fa-users',
      label: 'Lớp học',
      roles: ['teacher']
    },
    {
      path: '/teacher/students',
      icon: 'fas fa-user-graduate',
      label: 'Sinh viên',
      roles: ['teacher']
    },
    {
      path: '/teacher/face-attendance',
      icon: 'fas fa-fingerprint',
      label: 'Điểm danh',
      roles: ['teacher']
    },
    {
      path: '/teacher/grades',
      icon: 'fas fa-star',
      label: 'Nhập điểm',
      roles: ['teacher']
    },
    {
      path: '/teacher/exams',
      icon: 'fas fa-file-alt',
      label: 'Quản lý thi cử',
      roles: ['teacher', 'admin']
    },
    {
      path: '/teacher/materials',
      icon: 'fas fa-book',
      label: 'Tài liệu giảng dạy',
      roles: ['teacher']
    },
    {
      path: '/teacher/notifications',
      icon: 'fas fa-bell',
      label: 'Thông báo',
      badge: 0, // Có thể fetch từ API
      roles: ['teacher', 'admin']
    },
    {
      path: '/teacher/chat',
      icon: 'fas fa-comment-dots',
      label: 'Tin nhắn',
      roles: ['teacher', 'admin']
    },
    {
      path: '/teacher/change-password',
      icon: 'fas fa-key',
      label: 'Đổi mật khẩu',
      roles: ['teacher', 'admin']
    }
  ];

  // Lọc menu items theo role
  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return true;
    return item.roles.includes(user.role || 'teacher');
  });

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

  // Hiển thị loading
  if (loading) {
    return (
      <div className="teacher-loading">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  // Nếu token không hợp lệ, không render gì (sẽ redirect trong useEffect)
  if (!tokenValid || !user) {
    return null;
  }

  return (
    <div className={`teacher-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Menu Button */}
      <button className="teacher-mobile-menu-btn" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isMobile && showMobileMenu && (
        <div className="teacher-sidebar-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <aside className={`teacher-sidebar ${isMobile && !showMobileMenu ? 'mobile-hidden' : ''}`}>
        {/* Sidebar Header */}
        <div className="teacher-sidebar-header">
          <div className="teacher-logo-area">
            {!isCollapsed ? (
              <div className="teacher-logo-full">
                <i className="fas fa-chalkboard-teacher"></i>
                <span>Giảng Viên</span>
              </div>
            ) : (
              <div className="teacher-logo-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
            )}
          </div>
          <button className="teacher-collapse-btn" onClick={toggleSidebar}>
            <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'}`}></i>
          </button>
        </div>

        {/* User Info */}
        <div className="teacher-sidebar-user">
          <div className="teacher-user-avatar-wrapper">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Giảng viên')}&background=4F46E5&color=fff`} 
              alt={user.name || 'Giảng viên'}
              className="teacher-user-avatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Giảng viên')}&background=4F46E5&color=fff`;
              }}
            />
            {!isCollapsed && (
              <div className="teacher-user-status online"></div>
            )}
          </div>
          {!isCollapsed && (
            <div className="teacher-user-info">
              <span className="teacher-user-name">{user.name || 'Giảng viên'}</span>
              <span className="teacher-user-role">
                {user.role === 'teacher' ? 'Giảng viên' : user.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'}
              </span>
              {user.teacherCode && (
                <span className="teacher-user-code">Mã: {user.teacherCode}</span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="teacher-sidebar-nav">
          <div className="teacher-nav-section">
            {!isCollapsed && <div className="teacher-nav-section-title">MENU CHÍNH</div>}
            <ul className="teacher-nav-menu">
              {filteredMenuItems.map((item, index) => (
                <li key={index} className="teacher-nav-item">
                  <Link 
                    to={item.path} 
                    className={`teacher-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <i className={item.icon}></i>
                    {!isCollapsed && <span>{item.label}</span>}
                    {item.badge && item.badge > 0 && !isCollapsed && (
                      <span className="teacher-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                    {item.badge && item.badge > 0 && isCollapsed && (
                      <span className="teacher-nav-badge-collapsed">{item.badge > 99 ? '99+' : item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="teacher-sidebar-footer">
          <button className="teacher-logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        
        </div>
      </aside>

      {/* Main Content */}
      <main className="teacher-main-content" onClick={closeMobileMenu}>
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherSidebar;