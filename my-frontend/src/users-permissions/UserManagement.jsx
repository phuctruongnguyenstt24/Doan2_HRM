import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUser,
  FaCalendarAlt,
  FaSearch,
  FaEye,
  FaHistory,
  FaChartLine,
  FaUsers,
  FaUserShield,
  FaSync,
  FaDownload,
  FaBan
} from 'react-icons/fa';
import { format, subDays } from 'date-fns';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [activeTab, setActiveTab] = useState('users');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchAPI = async (endpoint, options = {}) => {
    try {
      let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      let url;
      if (import.meta.env.DEV && API_URL.includes('ngrok-free.dev')) {
        url = `/api${cleanEndpoint}`;
        console.log('🔄 Dev mode with ngrok - using proxy:', url);
      } else {
        url = `${API_URL}${cleanEndpoint}`;
        console.log('🚀 Using full URL:', url);
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        credentials: 'include'
      });

      return response;
    } catch (error) {
      console.error('❌ API fetch error:', error);
      throw error;
    }
  };

  // Fetch users - wrap với useCallback
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetchAPI(`/users-permissions/users?page=${page}&limit=10${searchQuery}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Fetch access logs - wrap với useCallback
  const fetchAccessLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      const response = await fetchAPI(`/users-permissions/access-logs?page=${page}&limit=50&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Access Logs API Response:', data);
        setAccessLogs(data.logs || []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetchAPI('/users-permissions/dashboard/stats');

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Chặn địa chỉ IP
  const blockIP = async (ipAddress) => {
    if (window.confirm(`Chặn địa chỉ IP: ${ipAddress}?`)) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
          alert('Vui lòng đăng nhập lại');
          return;
        }

        const response = await fetchAPI('/security/block-ip', {
          method: 'POST',
          body: JSON.stringify({ ip: ipAddress })
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        if (response.ok) {
          alert('Đã chặn IP thành công');
        } else {
          alert('Chặn IP thất bại');
        }
      } catch (error) {
        console.error('Error blocking IP:', error);
        alert('Chặn IP thất bại');
      }
    }
  };

  // Xem chi tiết user
  const viewUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        alert('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetchAPI(`/users-permissions/users/${userId}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSelectedUser({
            user: data.data.user,
            accessLogs: data.data.accessLogs || [],
            logsCount: data.data.stats?.totalLogs || 0
          });
        } else {
          setSelectedUser(data);
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Cập nhật user status
  const updateUserStatus = async (userId, isActive) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        alert('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetchAPI(`/users-permissions/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        fetchUsers(pagination.page);
        alert('Cập nhật trạng thái thành công');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Cập nhật trạng thái thất bại');
    }
  };

  // Xuất logs ra CSV
  const exportLogsToCSV = () => {
    const headers = ['Time', 'User', 'Email', 'Action', 'IP Address', 'Status', 'Details'];
    const csvContent = [
      headers.join(','),
      ...accessLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.userId?.name || 'Unknown',
        log.userId?.email || '',
        log.action,
        log.ipAddress,
        log.status,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === 'users') {
      fetchUsers(1);
    } else {
      fetchAccessLogs(1);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === 'users') {
      fetchUsers(pagination.page);
    } else {
      fetchAccessLogs(pagination.page);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Load data when tab or filters change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    } else if (activeTab === 'logs') {
      fetchAccessLogs(1);
    }
  }, [activeTab, fetchUsers, fetchAccessLogs]);

  // Reset page when search term changes (for users)
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(1);
    }
  }, [searchTerm, activeTab, fetchUsers]);

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="dashboard-header-UM">
        <h1><FaUser className="header-icon-UM" /> Quản lý người dùng</h1>
        <div className="header-actions-UM">
          <button className="btn-refresh" onClick={handleRefresh}>
            <FaSync /> Làm mới
          </button>
          {activeTab === 'logs' && (
            <button className="btn-export" onClick={exportLogsToCSV}>
              <FaDownload /> Xuất CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-overview-UM">
          <div className="stat-card-UM">
            <div className="stat-icon-UM total-users">
              <FaUsers />
            </div>
            <div className="stat-info-UM">
              <h3>{stats.userStats?.total || 0}</h3>
              <p>Tổng người dùng</p>
            </div>
          </div>
          <div className="stat-card-UM">
            <div className="stat-icon-UM active-users">
              <FaUser />
            </div>
            <div className="stat-info-UM">
              <h3>{stats.userStats?.active || 0}</h3>
              <p>Đang hoạt động</p>
            </div>
          </div>
          <div className="stat-card-UM">
            <div className="stat-icon admin-users-UM">
              <FaUserShield />
            </div>
            <div className="stat-info-UM">
              <h3>{stats.userStats?.admins || 0}</h3>
              <p>Quản trị viên</p>
            </div>
          </div>
          <div className="stat-card-UM">
            <div className="stat-icon activity-chart-UM">
              <FaChartLine />
            </div>
            <div className="stat-info-UM">
              <h3>{accessLogs.length}</h3>
              <p>Hoạt động gần đây</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> Người dùng
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FaHistory /> Lịch sử truy cập
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filter-bar-UM">
        <div className="search-box-UM">
          <FaSearch className="search-icon-UM" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {activeTab === 'logs' && (
          <div className="date-filter-UM">
            <FaCalendarAlt className="filter-icon-UM" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <span>đến</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="users-table-container">
          {loading ? (
            <div className="loading">Đang tải người dùng...</div>
          ) : (
            <>
              <table className="users-table-UM">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Đăng nhập cuối</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id}>
                        <td className="user-info-UM">
                          <div className="user-avatar-UM">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="user-details-UM">
                            <strong>{user.name || 'Chưa có tên'}</strong>
                            <small>Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</small>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giảng viên' : 'Nhân viên'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-UM ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Hoạt động' : 'Khóa'}
                          </span>
                        </td>
                        <td>
                          {user.lastLogin ?
                            new Date(user.lastLogin).toLocaleString('vi-VN') :
                            'Chưa đăng nhập'}
                        </td>
                        <td className="action-buttons-UM">
                          <button
                            className="btn-view"
                            onClick={() => viewUserDetails(user._id)}
                            title="Xem chi tiết"
                          >
                            <FaEye /> Xem
                          </button>
                          <button
                            className={`btn-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => updateUserStatus(user._id, !user.isActive)}
                            title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                          >
                            {user.isActive ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination-UM">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => fetchUsers(pagination.page - 1)}
                  >
                    Trước
                  </button>
                  <span>Trang {pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchUsers(pagination.page + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Access Logs Tab Content */}
      {activeTab === 'logs' && (
        <div className="logs-container-UM">
          {loading ? (
            <div className="loading">Đang tải lịch sử truy cập...</div>
          ) : (
            <>
              <div className="logs-table-container-UM">
                <table className="logs-table-UM">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Người dùng</th>
                      <th>Hành động</th>
                      <th>IP Address</th>
                      <th>Thiết bị/Trình duyệt</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                      </tr>
                    ) : (
                      accessLogs.map(log => (
                        <tr key={log._id} className={`log-row log-${log.status}`}>
                          <td>
                            <div className="timestamp">
                              {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                              <small>{new Date(log.timestamp).toLocaleTimeString('vi-VN')}</small>
                            </div>
                          </td>
                          <td>
                            <div className="log-user-UM">
                              <strong>{log.userId?.name || 'Không xác định'}</strong>
                              <small>{log.userId?.email || ''}</small>
                            </div>
                          </td>
                          <td>
                            <span className={`action-badge-UM action-${log.action}`}>
                              {log.action === 'login' ? 'Đăng nhập' : 
                               log.action === 'logout' ? 'Đăng xuất' : 
                               log.action === 'failed' ? 'Thất bại' : log.action}
                            </span>
                          </td>
                          <td>{log.ipAddress}</td>
                          <td>
                            <div className="user-agent-UM" title={log.userAgent}>
                              {log.userAgent ?
                                log.userAgent.substring(0, 50) + (log.userAgent.length > 50 ? '...' : '') :
                                'Không xác định'}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge-UM ${log.status}`}>
                              {log.status === 'success' ? 'Thành công' : 
                               log.status === 'failed' ? 'Thất bại' : log.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-block-ip-UM"
                              onClick={() => blockIP(log.ipAddress)}
                              title="Chặn IP này"
                            >
                              <FaBan /> Chặn IP
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination-UM">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => fetchAccessLogs(pagination.page - 1)}
                  >
                    Trước
                  </button>
                  <span>Trang {pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => fetchAccessLogs(pagination.page + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay-UM" onClick={() => setSelectedUser(null)}>
          <div className="modal-content-UM" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-UM">
              <h2>Chi tiết người dùng</h2>
              <button className="close-modal-UM" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            <div className="user-detail-view">
              <div className="user-basic-info">
                <div className="detail-avatar">
                  {selectedUser.user?.name ? selectedUser.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="detail-main">
                  <h3>{selectedUser.user?.name || 'Chưa có tên'}</h3>
                  <p>{selectedUser.user?.email}</p>
                  <div className="detail-tags">
                    <span className={`role-tag role-${selectedUser.user?.role}`}>
                      {selectedUser.user?.role === 'admin' ? 'Quản trị viên' : 
                       selectedUser.user?.role === 'teacher' ? 'Giảng viên' : 'Nhân viên'}
                    </span>
                    <span className={`status-tag ${selectedUser.user?.isActive ? 'active' : 'inactive'}`}>
                      {selectedUser.user?.isActive ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-activity-section">
                <h3><FaHistory /> Hoạt động gần đây ({selectedUser.logsCount} lượt)</h3>
                <div className="activity-list">
                  {selectedUser.accessLogs?.length === 0 ? (
                    <p>Chưa có hoạt động nào</p>
                  ) : (
                    selectedUser.accessLogs?.slice(0, 5).map(log => (
                      <div key={log._id} className="activity-item">
                        <div className="activity-time">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </div>
                        <div className="activity-action">
                          <span className={`action-tag action-${log.action}`}>
                            {log.action === 'login' ? 'Đăng nhập' : 
                             log.action === 'logout' ? 'Đăng xuất' : 
                             log.action === 'failed' ? 'Thất bại' : log.action}
                          </span>
                          <small>{log.ipAddress}</small>
                        </div>
                        <div className="activity-status">
                          <span className={`status-dot ${log.status}`}></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="modal-actions-UM">
                <button className="btn-secondary-UM" onClick={() => setSelectedUser(null)}>
                  Đóng
                </button>
                <button
                  className="btn-primary-UM"
                  onClick={() => {
                    // Chuyển sang tab logs và filter theo user
                    setActiveTab('logs');
                    setSelectedUser(null);
                  }}
                >
                  Xem tất cả hoạt động
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;