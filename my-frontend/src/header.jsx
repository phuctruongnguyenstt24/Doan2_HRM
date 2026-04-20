import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaUserCircle, 
  FaCog,
  FaMoon,
  FaSun,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import SearchModal from './components/SearchModal';
import NotificationCenter from './components/NotificationCenter'; // Import Notification Center mới
import { useTheme } from './ThemeContext';
import './header.css';

const Header = ({ onMenuToggle, onSidebarToggle, sidebarCollapsed, pageTitle = "Trang chủ" })  => {
  const { settings, updateSettings } = useTheme();
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Thêm shortcut Ctrl+K để mở tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lấy thông tin user từ localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user;
      }
      
      return {
        name: 'Admin User',
        email: 'admin@company.com',
        avatar: null,
        role: 'admin'
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        name: 'Admin User',
        email: 'admin@company.com',
        avatar: null,
        role: 'admin'
      };
    }
  };

  const userInfo = getUserInfo();

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'employee': return 'Nhân viên';
      case 'teacher': return 'Giảng viên';
      default: return role || 'Thành viên';
    }
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('vi-VN', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(true);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const toggleDarkMode = () => {
    updateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const headerStyle = {
    backgroundColor: settings.headerColor || '#ffffff',
    color: settings.darkMode ? '#f3f4f6' : '#1f2937',
  };

  return (
    <>
      <header className="header-dashboard-HE" style={headerStyle}>
        <div className="header-left-HE">
          <div className="page-title">
            <h1>{pageTitle}</h1>
            <div className="date-time">
              <div className="date">
                <FaCalendarAlt className="date-icon" />
                <span>{formatDate(currentTime)}</span>
              </div>
              <div className="time">
                <FaClock className="time-icon" />
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-right-phuc">
          {/* Search Bar */}
          <div className="search-container-header">
            <form onSubmit={handleSearch} className="search-form-header">
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên, giảng viên, hợp đồng... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="search-input-header"
              />
              <button type="submit" className="search-button-header">
                <FaSearch />
              </button>
            </form>
          </div>

          {/* Dark Mode Toggle */}
          <button 
            className="icon-button-header theme-toggle" 
            onClick={toggleDarkMode} 
            title={settings.darkMode ? "Chế độ sáng" : "Chế độ tối"}
          >
            {settings.darkMode ? <FaSun /> : <FaMoon />}
          </button>

          {/* Notification Center - Real-time notifications */}
          <NotificationCenter />

          {/* User Profile */}
          <div className="user-profile-container-admin">
            <button 
              className="user-profile-button-admin"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt={userInfo.name} className="user-avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {userInfo.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="user-info-admin">
                <span className="user-name-admin">{userInfo.name || 'User'}</span>
                <span className="user-role-admin">{getRoleDisplay(userInfo.role)}</span>
              </div>
              <span className="dropdown-arrow">▾</span>
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  {userInfo.avatar ? (
                    <img src={userInfo.avatar} alt={userInfo.name} className="menu-avatar" />
                  ) : (
                    <div className="menu-avatar-placeholder">
                      {userInfo.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="menu-user-info">
                    <h4>{userInfo.name || 'User'}</h4>
                    <p>{userInfo.email || 'user@company.com'}</p>
                    <span className="user-role-badge">{getRoleDisplay(userInfo.role)}</span>
                  </div>
                </div>
                
                <div className="user-menu-items">
                  <Link to="/profile" className="menu-item">
                    <FaUserCircle className="menu-icon" />
                    <span>Tài khoản cá nhân</span>
                  </Link>
                  <Link to="/settings" className="menu-item">
                    <FaCog className="menu-icon" />
                    <span>Cài đặt</span>
                  </Link>
                  <button className="menu-item" onClick={toggleDarkMode}>
                    {settings.darkMode ? (
                      <>
                        <FaSun className="menu-icon" />
                        <span>Chế độ sáng</span>
                      </>
                    ) : (
                      <>
                        <FaMoon className="menu-icon" />
                        <span>Chế độ tối</span>
                      </>
                    )}
                  </button>
                  <div className="menu-divider"></div>
                  <button className="menu-item logout-item" onClick={handleLogout}>
                    <FiLogOut className="menu-icon" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div 
            className="dropdown-overlay"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;