import React, { useState, useEffect } from 'react';
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

  // Sử dụng API_URL từ env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Helper function để fetch API
  const fetchAPI = async (endpoint, options = {}) => {
    try {
      let url;
      
      // Nếu đang trong development và API_URL là ngrok domain
      if (import.meta.env.DEV && API_URL.includes('ngrok-free.dev')) {
        // Dùng proxy để tránh CORS
        url = `/api${endpoint}`;
        console.log('🔄 Dev mode with ngrok - using proxy:', url);
      } else {
        // Production hoặc local development
        url = `${API_URL}${endpoint}`;
        console.log('🚀 Using full URL:', url);
      }
      
      const token = localStorage.getItem('token');
      
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

  // Fetch users
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      const response = await fetchAPI(`/users-permissions/users?page=${page}&limit=10&search=${searchTerm}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chặn địa chỉ IP
  const blockIP = async (ipAddress) => {
    if (window.confirm(`Block IP address: ${ipAddress}?`)) {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          alert('Please login first');
          return;
        }

        const response = await fetchAPI('/security/block-ip', {
          method: 'POST',
          body: JSON.stringify({ ip: ipAddress })
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        if (response.ok) {
          alert('IP address blocked successfully');
        } else {
          alert('Failed to block IP');
        }
      } catch (error) {
        console.error('Error blocking IP:', error);
        alert('Failed to block IP');
      }
    }
  };

  // Fetch access logs
  const fetchAccessLogs = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }

      const response = await fetchAPI(`/users-permissions/access-logs?page=${page}&limit=50&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Debug: In ra console để xem cấu trúc
        console.log('📊 Access Logs API Response:', data);
        console.log('📝 Logs array:', data.logs);
        console.log('🔍 First log userId:', data.logs?.[0]?.userId);
        
        // Kiểm tra xem userId có được populate không
        if (data.logs && data.logs.length > 0) {
          console.log('✅ User name from populate:', data.logs[0].userId?.name);
          console.log('✅ User email from populate:', data.logs[0].userId?.email);
        }
        
        setAccessLogs(data.logs || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetchAPI('/users-permissions/dashboard/stats');

      if (response.status === 401) {
        localStorage.removeItem('token');
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
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchAccessLogs();
    }
  }, [activeTab, dateRange]);

  // Xem chi tiết user
  const viewUserDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetchAPI(`/users-permissions/users/${userId}`);

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Sửa: API trả về { success, data: { user, accessLogs, stats } }
        if (data.success && data.data) {
          setSelectedUser({
            user: data.data.user,
            accessLogs: data.data.accessLogs,
            logsCount: data.data.stats?.totalLogs || 0
          });
        } else {
          // Fallback cho cấu trúc cũ
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
      const token = localStorage.getItem('token');

      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetchAPI(`/users-permissions/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        fetchUsers(pagination.page);
        alert('User status updated successfully');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user status');
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
        `"${log.details || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === 'users') {
      fetchUsers(1);
    } else {
      fetchAccessLogs(1);
    }
  };

  return (
    <div className="user-management-container">
      {/* Header */}
      <div className="dashboard-header-UM">
        <h1><FaUser className="header-icon-UM" /> User Management</h1>
        <div className="header-actions-UM">
          <button className="btn-refresh" onClick={() => activeTab === 'users' ? fetchUsers() : fetchAccessLogs()}>
            <FaSync /> Refresh
          </button>
          {activeTab === 'logs' && (
            <button className="btn-export" onClick={exportLogsToCSV}>
              <FaDownload /> Export CSV
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
              <p>Total Users</p>
            </div>
          </div>
          <div className="stat-card-UM">
            <div className="stat-icon-UM active-users">
              <FaUser />
            </div>
            <div className="stat-info-UM">
              <h3>{stats.userStats?.active || 0}</h3>
              <p>Active Users</p>
            </div>
          </div>
          <div className="stat-card-UM">
            <div className="stat-icon admin-users-UM">
              <FaUserShield />
            </div>
            <div className="stat-info-UM">
              <h3>{stats.userStats?.admins || 0}</h3>
              <p>Admins</p>
            </div>
          </div>
          <div className="stat-card-UM">
            <div className="stat-icon activity-chart-UM">
              <FaChartLine />
            </div>
            <div className="stat-info-UM">
              <h3>{accessLogs.length}</h3>
              <p>Recent Activities</p>
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
          <FaUsers /> Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FaHistory /> Access Logs
        </button>
      </div>

      {/* Search and Filters */}
      <div className="filter-bar-UM">
        <div className="search-box-UM">
          <FaSearch className="search-icon-UM" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-search-UM" onClick={handleSearch}>
            Search
          </button>
        </div>

        {activeTab === 'logs' && (
          <div className="date-filter-UM">
            <FaCalendarAlt className="filter-icon-UM" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <span>to</span>
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
            <div className="loading">Loading users...</div>
          ) : (
            <>
              <table className="users-table-UM">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td className="user-info-UM">
                        <div className="user-avatar-UM">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="user-details-UM">
                          <strong>{user.name || 'No Name'}</strong>
                          <small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge-UM ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {user.lastLogin ?
                          new Date(user.lastLogin).toLocaleString() :
                          'Never'}
                      </td>
                      <td className="action-buttons-UM">
                        <button
                          className="btn-view"
                          onClick={() => viewUserDetails(user._id)}
                        >
                          <FaEye /> View
                        </button>
                        <button
                          className={`btn-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => updateUserStatus(user._id, !user.isActive)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="pagination-UM">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Access Logs Tab Content */}
      {activeTab === 'logs' && (
        <div className="logs-container-UM">
          {loading ? (
            <div className="loading">Loading access logs...</div>
          ) : (
            <>
              <div className="logs-table-container-UM">
                <table className="logs-table-UM">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>IP Address</th>
                      <th>Device/Browser</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.map(log => (
                      <tr key={log._id} className={`log-row log-${log.status}`}>
                        <td>
                          <div className="timestamp">
                            {new Date(log.timestamp).toLocaleDateString()}
                            <small>{new Date(log.timestamp).toLocaleTimeString()}</small>
                          </div>
                        </td>
                        <td>
                          <div className="log-user-UM">
                            <strong>{log.userId?.name || 'Unknown'}</strong>
                            <small>{log.userId?.email || 'No email'}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`action-badge-UM action-${log.action}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.ipAddress}</td>
                        <td>
                          <div className="user-agent-UM">
                            {log.userAgent ?
                              log.userAgent.substring(0, 50) + (log.userAgent.length > 50 ? '...' : '') :
                              'Unknown'}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge-UM ${log.status}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-block-ip-UM"
                            onClick={() => blockIP(log.ipAddress)}
                          >
                            <FaBan /> Block IP
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-UM">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => fetchAccessLogs(pagination.page - 1)}
                >
                  Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchAccessLogs(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay-UM" onClick={() => setSelectedUser(null)}>
          <div className="modal-content-UM" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-UM">
              <h2>User Details</h2>
              <button className="close-modal-UM" onClick={() => setSelectedUser(null)}>×</button>
            </div>

            <div className="user-detail-view">
              <div className="user-basic-info">
                <div className="detail-avatar">
                  {selectedUser.user.name ? selectedUser.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="detail-main">
                  <h3>{selectedUser.user.name || 'No Name'}</h3>
                  <p>{selectedUser.user.email}</p>
                  <div className="detail-tags">
                    <span className={`role-tag role-${selectedUser.user.role}`}>
                      {selectedUser.user.role}
                    </span>
                    <span className={`status-tag ${selectedUser.user.isActive ? 'active' : 'inactive'}`}>
                      {selectedUser.user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="user-activity-section">
                <h3><FaHistory /> Recent Activity ({selectedUser.logsCount} logs)</h3>
                <div className="activity-list">
                  {selectedUser.accessLogs?.slice(0, 5).map(log => (
                    <div key={log._id} className="activity-item">
                      <div className="activity-time">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="activity-action">
                        <span className={`action-tag action-${log.action}`}>
                          {log.action}
                        </span>
                        <small>{log.ipAddress}</small>
                      </div>
                      <div className="activity-status">
                        <span className={`status-dot ${log.status}`}></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions-UM">
                <button className="btn-secondary-UM" onClick={() => setSelectedUser(null)}>
                  Close
                </button>
                <button
                  className="btn-primary-UM"
                  onClick={() => {
                    console.log('View all activity for user:', selectedUser.user._id);
                  }}
                >
                  View Full Activity
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