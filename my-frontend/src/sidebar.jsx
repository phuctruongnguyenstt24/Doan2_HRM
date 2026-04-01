import React, { useState, useEffect } from 'react'; // Thêm useEffect
import { NavLink, useNavigate } from 'react-router-dom';
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
  FaHome
} from 'react-icons/fa';
import './sidebar.css';
 

const Sidebar = ({ collapsed, onToggle, onClose }) => {
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

    // Gọi callback từ layout nếu có
    if (onToggle) {
      onToggle(newState);
    }
  };

  const handleLogout = () => {
    // Xóa token và thông tin user
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Chuyển hướng về trang login
    navigate('/login');
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
      name: 'Khen thưởng & Kỷ luật',
      icon: <FaAward />,
      path: '/reward-discipline',
      submenu: [
        { name: 'Khen thưởng', path: '/reward-discipline/rewards' },
        { name: 'Kỷ luật', path: '/reward-discipline/disciplines' },
        { name: 'Quy chế', path: '/reward-discipline/rules' },
        { name: 'Thống kê', path: '/reward-discipline/statistics' }
      ]
    },
    {
      name: 'Lương & Phúc lợi',
      icon: <FaMoneyBillWave />,
      path: '/salary-benefits',
      submenu: [
        { name: 'Bảng lương', path: '/salary-benefits/PayrollBenefits' },
   
     
     
      ]
    },
    // {
    //   name: 'Báo cáo & Thống kê',
    //   icon: <FaChartBar />,
    //   path: '/reports',
    //   submenu: [
    //     { name: 'Báo cáo nhân sự', path: '/reports/hr' },
    //     { name: 'Báo cáo tài chính', path: '/reports/finance' },
    //     { name: 'Thống kê tổng hợp', path: '/reports/overview' },
    //     { name: 'Báo cáo tùy chỉnh', path: '/reports/custom' },
    //     { name: 'Xuất báo cáo', path: '/reports/export' }
    //   ]
    // },
    {
      name: 'Người dùng & Phân quyền',
      icon: <FaUserShield />,
      path: '/users-permissions',
      submenu: [
        { name: 'Quản lý người dùng', path: '/users-permissions/UserManagement' },
 
        { name: 'Lịch sử truy cập', path: '/users-permissions/AccessLog' }
      ]
    },

    {
      name: 'Thông báo & Tin nội bộ',
      icon: <FaBell />,
      path: '/notifications',
      submenu: [
        { name: 'Thông báo', path: '/notifications/list' },
        { name: 'Tin nội bộ', path: '/notifications/internal-news' },
        { name: 'Gửi thông báo', path: '/notifications/send' },
        { name: 'Cài đặt thông báo', path: '/notifications/settings' }
      ]
    }

  ];

  const getUserInfo = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.avatar) {
        return user;
      }

      // Nếu không có user trong localStorage, thử lấy từ URL
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
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className="logo-section">
              <div className="logo">
                <FaHome />
              </div>
              <div className="logo-text">
                <h2>HR System</h2>
                <p>Quản lý University</p>
              </div>
            </div>
          )}
          <button className="toggle-btn" onClick={toggleSidebar}>
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
                        <span className="menu-text">{item.name}</span>
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
                          onClick={onClose} // Đóng menu mobile khi click item
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
                  onClick={onClose} // Đóng menu mobile khi click item
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!isCollapsed && <span className="menu-text">{item.name}</span>}
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
            onClick={onClose} // Đóng menu mobile khi click item
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

      {/* Mobile Toggle Button - chỉ hiển thị trên mobile */}
      <button className="mobile-toggle-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>
    </>
  );
};

export default Sidebar;