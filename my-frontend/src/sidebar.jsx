import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import {
  FaTachometerAlt,
  FaUsers,
  FaSitemap,
  FaFileContract,
  FaCalendarCheck,
  FaGraduationCap,
  FaComment,
  FaUserShield,
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaHome
} from 'react-icons/fa';
import './sidebar.css';

const Sidebar = ({ collapsed, onToggle, onClose, onPageChange }) => {
  const { settings } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed || false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
        if (onToggle) onToggle(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onToggle]);

  // Sync collapsed state
  useEffect(() => {
    if (collapsed !== undefined) {
      setIsCollapsed(collapsed);
    }
  }, [collapsed]);

  const toggleSubmenu = (menuName) => {
    setActiveSubmenu(activeSubmenu === menuName ? null : menuName);
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onToggle) onToggle(newState);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarStyle = {
    backgroundColor: settings.sidebarColor,
    color: settings.darkMode ? '#f3f4f6' : '#ffffff',
  };

  const menuItems = [
    { name: 'Tổng quan', icon: <FaTachometerAlt />, path: '/dashboard', title: 'Tổng quan', submenu: null },
    {
      name: 'Hồ sơ Nhân sự',
      icon: <FaUsers />,
      title: 'Hồ sơ Nhân sự',
      path: '/employees',
      submenu: [
        { name: 'Danh sách nhân viên', path: '/employees/list', title: 'Danh sách giảng viên' }
      ]
    },
    {
      name: 'Cơ cấu Tổ chức',
      icon: <FaSitemap />,
      title: 'Cơ cấu Tổ chức',
      path: '/organization',
      submenu: [
        { name: 'Quản lí Khoa', path: '/organization/departments', title: 'Quản lí Khoa' },
        { name: 'Quản lí Phòng ban', path: '/organization/OfficeManagement', title: 'Quản lí Phòng ban' }
      ]
    },
    {
      name: 'Hợp đồng Lao động',
      icon: <FaFileContract />,
      title: 'Hợp đồng Lao động',
      path: '/contracts',
      submenu: [
        { name: 'Danh sách hợp đồng', path: '/contracts/listHD', title: 'Danh sách hợp đồng' },
        { name: 'Tạo hợp đồng mới', path: '/contracts/createHD', title: 'Tạo hợp đồng mới' }
      ]
    },
    {
      name: 'Chấm công & Công tác',
      icon: <FaCalendarCheck />,
      title: 'Chấm công & Công tác',
      path: '/attendance',
      submenu: [
        { name: 'Quản lí Chấm công', path: '/attendance/AttendanceManagement', title: 'Quản lí Chấm công' },
        { name: 'Báo cáo chấm công', path: '/attendance/AttendanceReport', title: 'Báo cáo chấm công' },
        { name: 'Quản lý công tác', path: '/attendance/BusinessTrip', title: 'Quản lý công tác' }
      ]
    },
    {
      name: 'Đào tạo & Bồi dưỡng',
      icon: <FaGraduationCap />,
      title: 'Đào tạo & Bồi dưỡng',
      path: '/training',
      submenu: [
        { name: 'Quản lí đào tạo', path: '/training/courses', title: 'Quản lí đào tạo' },
        { name: 'Lịch Giảng Viên', path: '/training/adminmanagerschedule', title: 'Lịch Giảng Viên' }
      ]
    },
    {
      name: 'Nhắn tin',
      icon: <FaComment />,
      path: '/chat-NV/chatNV',
      title: 'Nhắn tin',
      submenu: null
    },
    {
      name: 'Người dùng & Phân quyền',
      icon: <FaUserShield />,
      title: 'Người dùng & Phân quyền',
      path: '/users-permissions',
      submenu: [
        { name: 'Quản lý người dùng', path: '/users-permissions/UserManagement', title: 'Quản lý người dùng' }
      ]
    }
  ];

  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return { name: 'Admin', role: 'Quản trị viên', avatar: null };
    } catch (error) {
      return { name: 'Admin', role: 'Quản trị viên', avatar: null };
    }
  };

  const userInfo = getUserInfo();

  return (
    <>
      <div className={`sidebar-admin ${isCollapsed ? 'collapsed-admin' : ''}`} style={sidebarStyle}>
        <div className="sidebar-header-admin">
          {!isCollapsed && (
            <div className="logo-section-admin">
              <div className="logo-admin"><FaHome /></div>
              <div className="logo-text-admin" onClick={() => navigate('/')}>
                <h2>HR System</h2>
                <p>Quản lý University</p>
              </div>
            </div>
          )}
          <button className="toggle-btn-admin" onClick={toggleSidebar} style={{ color: '#fff' }}>
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="user-profile-admin">
            <div className="avatar-admin">
              {userInfo.avatar ? <img src={userInfo.avatar} alt={userInfo.name} /> : <FaUserCircle />}
            </div>
            <div className="user-info-admin">
              <h4>{userInfo.name}</h4>
              <p>{userInfo.role === 'admin' ? 'Quản trị viên' : userInfo.role}</p>
            </div>
          </div>
        )}

        <div className="sidebar-menu-admin">
          {menuItems.map((item) => (
            <div key={item.name} className="menu-item-wrapper">
              {item.submenu ? (
                <>
                  <div
                    className={`menu-item-admin ${activeSubmenu === item.name ? 'active' : ''}`}
                    onClick={() => toggleSubmenu(item.name)}
                  >
                    <span className="menu-icon-admin">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="menu-text-admin">{item.name}</span>
                        <span className="arrow">{activeSubmenu === item.name ? '▾' : '▸'}</span>
                      </>
                    )}
                  </div>
                  {activeSubmenu === item.name && !isCollapsed && (
                    <div className="submenu-admin">
                      {item.submenu.map((subItem) => (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={({ isActive }) => `submenu-item-admin ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            if (onClose) onClose();
                            if (onPageChange) onPageChange(subItem.title);
                          }}
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
                  className={({ isActive }) => `menu-item-admin ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (onClose) onClose();
                    if (onPageChange) onPageChange(item.title);
                  }}
                >
                  <span className="menu-icon-admin">{item.icon}</span>
                  {!isCollapsed && <span className="menu-text-admin">{item.name}</span>}
                </NavLink>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom-admin">
          <NavLink to="/settings" className={({ isActive }) => `bottom-menu-item-admin ${isActive ? 'active' : ''}`}>
            <FaCog className="bottom-icon-admin" />
            {!isCollapsed && <span>Cài đặt</span>}
          </NavLink>
          <button className="bottom-menu-item-admin logout-btn-admin" onClick={handleLogout}>
            <FaSignOutAlt className="bottom-icon-admin" />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>

        {isCollapsed && (
          <div className="collapsed-user-info-admin">
            <div className="collapsed-avatar-admin">
              {userInfo.avatar ? <img src={userInfo.avatar} alt={userInfo.name} /> : <FaUserCircle />}
            </div>
          </div>
        )}
      </div>

      <button className="mobile-toggle-btn-admin" onClick={toggleSidebar}>☰</button>
    </>
  );
};

export default Sidebar;