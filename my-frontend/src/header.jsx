import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaBell, 
  FaUserCircle, 
  FaCog,
  FaMoon,
  FaSun,
  FaQuestionCircle,
  FaEnvelope,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { FiLogOut } from 'react-icons/fi';
import './header.css';

const Header = ({ pageTitle = "Trang chủ" }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  // Lấy thông tin user từ localStorage

const getUserInfo = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.avatar) {
      return user;
    }
    
    // Nếu không có user trong localStorage, thử lấy từ URL (Google login)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Decode token để lấy avatar
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedToken = JSON.parse(window.atob(base64));
        
        if (decodedToken.avatar) {
          // Lưu vào localStorage
          localStorage.setItem('user', JSON.stringify(decodedToken));
          return decodedToken;
        }
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
    
    // Fallback
    return {
      name: 'Admin User',
      email: 'admin@company.com',
      avatar: null,
      role: 'Quản trị viên'
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return {
      name: 'Admin User',
      email: 'admin@company.com',
      avatar: null,
      role: 'Quản trị viên'
    };
  }
};

const userInfo = getUserInfo();


  // Format date
  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('vi-VN', options);
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Cập nhật thời gian mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        title: 'Hợp đồng sắp hết hạn',
        message: '3 hợp đồng sẽ hết hạn trong 7 ngày tới',
        time: '10 phút trước',
        read: false,
        type: 'warning'
      },
      {
        id: 2,
        title: 'Nhân viên mới',
        message: 'Nguyễn Văn A vừa được thêm vào hệ thống',
        time: '2 giờ trước',
        read: false,
        type: 'info'
      },
      {
        id: 3,
        title: 'Yêu cầu phê duyệt',
        message: '5 yêu cầu nghỉ phép cần phê duyệt',
        time: '5 giờ trước',
        read: true,
        type: 'success'
      },
      {
        id: 4,
        title: 'Báo cáo tháng',
        message: 'Báo cáo nhân sự tháng 12 đã sẵn sàng',
        time: '1 ngày trước',
        read: true,
        type: 'info'
      },
      {
        id: 5,
        title: 'Cập nhật hệ thống',
        message: 'Phiên bản 2.1.0 đã được cập nhật',
        time: '2 ngày trước',
        read: true,
        type: 'success'
      }
    ];
    setNotifications(mockNotifications);
    
    // Tính số thông báo chưa đọc
    const unreadCount = mockNotifications.filter(n => !n.read).length;
    setUnreadNotifications(unreadCount);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Thực hiện tìm kiếm
      setSearchQuery('');
    }
  };

  const handleNotificationClick = (id) => {
    // Đánh dấu đã đọc
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    
    // Cập nhật số thông báo chưa đọc
    const unreadCount = updatedNotifications.filter(n => !n.read).length;
    setUnreadNotifications(unreadCount);
    
    // Navigate to notification detail (implement later)
    console.log('Notification clicked:', id);
  };

  const handleLogout = () => {
    // Xóa thông tin user
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    window.location.href = '/login';
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Apply dark mode to body
    if (!darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    setUnreadNotifications(0);
  };

  return (
    <header className="header">
      <div className="header-left">
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

      <div className="header-right">
        {/* Search Bar */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên, hợp đồng, báo cáo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <FaSearch />
            </button>
          </form>
        </div>

        {/* Dark Mode Toggle */}
        <button className="icon-button theme-toggle" onClick={toggleDarkMode} title="Chế độ tối">
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Help Button */}
        <button className="icon-button help-button" title="Trợ giúp">
          <FaQuestionCircle />
        </button>

        {/* Messages */}
        <div className="icon-button messages-button" title="Tin nhắn">
          <FaEnvelope />
          <span className="badge">2</span>
        </div>

        {/* Notifications */}
        <div className="notifications-container">
          <button 
            className="icon-button notifications-button"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Thông báo"
          >
            <FaBell />
            {unreadNotifications > 0 && (
              <span className="badge">{unreadNotifications}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Thông báo ({notifications.length})</h3>
                {unreadNotifications > 0 && (
                  <button 
                    className="mark-all-read"
                    onClick={markAllAsRead}
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.type}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    {!notification.read && (
                      <div className="unread-dot"></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="notifications-footer">
                <button className="view-all-notifications">
                  Xem tất cả thông báo
                </button>
              </div>
            </div>
          )}
        </div>

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
                {userInfo.name.charAt(0)}
              </div>
            )}
            <div className="user-info-admin">
              <span className="user-name-admin">{userInfo.name}</span>
              <span className="user-role-admin">{userInfo.role}</span>
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
                    {userInfo.name.charAt(0)}
                  </div>
                )}
                <div className="menu-user-info">
                  <h4>{userInfo.name}</h4>
                  <p>{userInfo.email}</p>
                  <span className="user-role-badge">{userInfo.role}</span>
                </div>
              </div>
              
              <div className="user-menu-items">
                <a href="/profile" className="menu-item">
                  <FaUserCircle className="menu-icon" />
                  <span>Tài khoản cá nhân</span>
                </a>
                <a href="/settings" className="menu-item">
                  <FaCog className="menu-icon" />
                  <span>Cài đặt</span>
                </a>
                <button className="menu-item" onClick={toggleDarkMode}>
                  {darkMode ? (
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

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div 
          className="dropdown-overlay"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;