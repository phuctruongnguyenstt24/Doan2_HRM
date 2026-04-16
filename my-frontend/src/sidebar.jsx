// sidebar.jsx - Phiên bản đã cập nhật
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext'; // Thêm import useTheme
import {
  FaTachometerAlt,
  FaUsers,
  FaSitemap,
  FaFileContract,
  FaCalendarCheck,
  FaGraduationCap,
  FaAward,
  FaMoneyBillWave,
  FaChartBar,
  FaUserCog,
  FaCog,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaUserShield,
  FaDatabase,
  FaCogs,
  FaHome,
  FaComment
} from 'react-icons/fa';
import './sidebar.css';

const Sidebar = ({ collapsed, onToggle, onClose }) => {
  const { settings } = useTheme(); // Lấy settings từ theme context
  const [isCollapsed, setIsCollapsed] = useState(collapsed || false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();

  const toggleSubmenu = (menuName) => {
    if (activeSubmenu === menuName) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(menuName);
    }
  };

  // Đồng bộ state khi prop collapsed thay đổi
  useEffect(() => {
    if (collapsed !== undefined) {
      setIsCollapsed(collapsed);
    }
  }, [collapsed]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Style cho sidebar dựa trên settings
  const sidebarStyle = {
    backgroundColor: settings.sidebarColor,
    color: settings.darkMode ? '#f3f4f6' : '#ffffff',
  };

  const menuItems = [
    {
      name: 'Tổng quan',
      icon: <FaTachometerAlt />,
      path: '/dashboard',
      submenu: null
    },
    {
      name: 'Hồ sơ Nhân sự',
      icon: <FaUsers />,
      path: '/employees',
      submenu: [
        { name: 'Danh sách nhân viên', path: '/employees/list' }
      ]
    },
    {
      name: 'Cơ cấu Tổ chức',
      icon: <FaSitemap />,
      path: '/organization',
      submenu: [
        { name: 'Quản lí Khoa', path: '/organization/departments' },
        { name: 'Quản lí Phòng ban', path: '/organization/OfficeManagement' }
      ]
    },
    {
      name: 'Hợp đồng Lao động',
      icon: <FaFileContract />,
      path: '/contracts',
      submenu: [
        { name: 'Danh sách hợp đồng', path: '/contracts/listHD' },
        { name: 'Tạo hợp đồng mới', path: '/contracts/createHD' },
      ]
    },
    {
      name: 'Chấm công & Công tác',
      icon: <FaCalendarCheck />,
      path: '/attendance',
      submenu: [
        { name: 'Quản lí Chấm công', path: '/attendance/AttendanceManagement' },
        { name: 'Báo cáo chấm công', path: '/attendance/AttendanceReport' },
        { name: 'Quản lý công tác', path: '/attendance/BusinessTrip' }
      ]
    },
    {
      name: 'Đào tạo & Bồi dưỡng',
      icon: <FaGraduationCap />,
      path: '/training/courses',
    },
    {
      name: 'Nhắn tin',
      icon: <FaComment />,
      path: '/chat-NV/chatNV',
    },
    {
      name: 'Người dùng & Phân quyền',
      icon: <FaUserShield />,
      path: '/users-permissions',
      submenu: [
        { name: 'Quản lý người dùng', path: '/users-permissions/UserManagement' },
        { name: 'Lịch sử truy cập', path: '/users-permissions/AccessLog' }
      ]
    },
  ];

  const getUserInfo = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.avatar) {
        return user;
      }
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedToken = JSON.parse(window.atob(base64));
          if (decodedToken.avatar) {
            localStorage.setItem('user', JSON.stringify(decodedToken));
            return decodedToken;
          }
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      return {
        name: 'Admin',
        role: 'Quản trị viên',
        avatar: null
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return {
        name: 'Admin',
        role: 'Quản trị viên',
        avatar: null
      };
    }
  };

  const userInfo = getUserInfo();

  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={sidebarStyle}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo-section">
              <div className="logo">
                <FaHome />
              </div>
              <div className="logo-text" onClick={() => window.location.href="/"}>
                <h2>HR System</h2>
                <p>Quản lý University</p>
              </div>
            </div>
          )}
          <button 
            className="toggle-btn" 
            onClick={toggleSidebar}
            style={{ color: settings.darkMode ? '#f3f4f6' : '#fff' }}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="user-profile">
            <div className="avatar">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt={userInfo.name} />
              ) : (
                <FaUserCircle />
              )}
            </div>
            <div className="user-info">
              <h4>{userInfo.name}</h4>
              <p>{userInfo.role}</p>
            </div>
          </div>
        )}
      
        {/* Menu Items */}
        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <div key={index} className="menu-item-wrapper">
              {item.submenu ? (
                <>
                  <div
                    className={`menu-item ${activeSubmenu === item.name ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.name)}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="menu-text-sidebar">{item.name}</span>
                        <span className="arrow">
                          {activeSubmenu === item.name ? '▾' : '▸'}
                        </span>
                      </>
                    )}
                  </div>
                  {activeSubmenu === item.name && (
                    <div className="submenu">
                      {item.submenu.map((subItem, subIndex) => (
                        <NavLink
                          key={subIndex}
                          to={subItem.path}
                          className={({ isActive }) =>
                            `submenu-item ${isActive ? 'active' : ''}`
                          }
                          onClick={onClose}
                        >
                          {subItem.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `menu-item ${isActive ? 'active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!isCollapsed && <span className="menu-text-sidebar">{item.name}</span>}
                </NavLink>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) => `bottom-menu-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FaCog className="bottom-icon" />
            {!isCollapsed && <span>Cài đặt</span>}
          </NavLink>
          <button className="bottom-menu-item logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="bottom-icon" />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>

        {/* Collapsed Info */}
        {isCollapsed && (
          <div className="collapsed-user-info">
            <div className="collapsed-avatar">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt={userInfo.name} />
              ) : (
                <FaUserCircle />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      <button className="mobile-toggle-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>
    </>
  );
};

export default Sidebar;