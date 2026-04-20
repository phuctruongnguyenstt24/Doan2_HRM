import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmployeeAttendance.css';

// Helper: Lấy token từ cả hai nơi
const getToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper: Lấy user từ cả hai nơi
const getUserFromStorage = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};

const EmployeeAttendance = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [note, setNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    leaveDays: 0,
    totalHours: 0,
    totalOvertime: 0
  });

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
 const token = getToken();
  const user = getUserFromStorage();


  

  // Helper function để fetch API
    const fetchAPI = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getToken();  // 👈 ĐÃ SỬA
      if (!token) {
        throw new Error('Vui lòng đăng nhập lại');
      }

      let url;
      if (import.meta.env.DEV) {
        url = `/api${endpoint}`;
      } else {
        url = `${API_URL}${endpoint}`;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Xóa token ở cả hai nơi
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/login');
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }, [API_URL, navigate]);

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!token || !user) {
      navigate('/login');
      return;
    }
  }, [navigate, token, user]);

  // Cập nhật thời gian mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Lấy thông tin chấm công hôm nay
  const fetchTodayAttendance = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await fetchAPI(`/attendance/my-attendance?date=${today}`);
      
      if (data.success) {
        setTodayAttendance(data.data);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance(null);
    }
  }, [fetchAPI]);

  // Lấy thống kê của user
  const fetchUserStats = useCallback(async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const data = await fetchAPI(`/attendance/my-stats?startDate=${firstDay}&endDate=${lastDay}`);
      
      if (data.success && data.data) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [fetchAPI]);

  // Lấy vị trí hiện tại
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ định vị'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  // Xử lý check-in
  const handleCheckIn = async () => {
    setActionType('checkin');
    setError('');
    
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      setShowNoteModal(true);
    } catch (error) {
      console.error('Error getting location:', error);
      // Vẫn cho phép check-in nếu không lấy được vị trí
      setLocation(null);
      setShowNoteModal(true);
      setError('Không thể lấy vị trí của bạn. Bạn vẫn có thể check-in mà không có vị trí.');
    }
  };

  // Xử lý check-out
  const handleCheckOut = async () => {
    setActionType('checkout');
    setError('');
    
    try {
      const locationData = await getCurrentLocation();
      setLocation(locationData);
      setShowNoteModal(true);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation(null);
      setShowNoteModal(true);
      setError('Không thể lấy vị trí của bạn. Bạn vẫn có thể check-out mà không có vị trí.');
    }
  };

  // Xác nhận check-in/check-out
  const confirmAction = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = actionType === 'checkin'
        ? '/attendance/checkin'
        : '/attendance/checkout';

      const payload = {
        note: note.trim() || undefined,
        ...(location && { location })
      };

      const data = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        setTodayAttendance(data.data);
        setShowNoteModal(false);
        setNote('');
        setLocation(null);
        await fetchUserStats();
        setMessage(`✅ ${actionType === 'checkin' ? 'Check-in' : 'Check-out'} thành công lúc ${new Date().toLocaleTimeString('vi-VN')}`);
        
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(`❌ ${data.message || `Có lỗi xảy ra khi ${actionType === 'checkin' ? 'check-in' : 'check-out'}`}`);
      }
    } catch (error) {
      console.error('Error in confirmAction:', error);
      setError(`❌ Lỗi kết nối server. Vui lòng thử lại sau.`);
    } finally {
      setLoading(false);
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchTodayAttendance();
    fetchUserStats();
  }, [fetchTodayAttendance, fetchUserStats]);

  // Format thời gian
  const formatTime = (date) => {
    if (!date) return '--:--:--';
    const d = new Date(date);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format ngày tháng
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Kiểm tra xem đã check-in chưa
  const hasCheckedIn = todayAttendance?.checkIn?.time;
  const hasCheckedOut = todayAttendance?.checkOut?.time;

  return (
    <div className="attendance-page">
      {/* Thời gian hiện tại */}
      <div className="current-time-card">
        <div className="current-date">{formatDate(currentTime)}</div>
        <div className="current-time">{formatTime(currentTime)}</div>
      </div>

      {/* Hiển thị thông báo */}
      {message && (
        <div className="message success">
          <i className="fas fa-check-circle"></i>
          {message}
        </div>
      )}

      {error && !showNoteModal && (
        <div className="message error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Trạng thái chấm công hôm nay */}
      <div className="today-status-card">
        <h3>Hôm nay</h3>
        <div className="status-details">
          <div className="status-item">
            <span className="status-label">Check-in</span>
            <span className="status-value">
              {hasCheckedIn
                ? formatTime(todayAttendance.checkIn.time)
                : '--:--:--'
              }
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Check-out</span>
            <span className="status-value">
              {hasCheckedOut
                ? formatTime(todayAttendance.checkOut.time)
                : '--:--:--'
              }
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Trạng thái</span>
            <span className={`status-badge ${todayAttendance?.status || 'pending'}`}>
              {!hasCheckedIn ? 'Chưa check-in' :
                todayAttendance.status === 'present' ? 'Có mặt' :
                todayAttendance.status === 'late' ? 'Đi muộn' :
                todayAttendance.status === 'leave' ? 'Nghỉ phép' :
                todayAttendance.status === 'absent' ? 'Vắng' : 
                hasCheckedOut ? 'Đã hoàn thành' : 'Đang làm việc'}
            </span>
          </div>
          {todayAttendance?.workingHours > 0 && (
            <div className="status-item">
              <span className="status-label">Số giờ làm</span>
              <span className="status-value">{todayAttendance.workingHours.toFixed(1)}h</span>
            </div>
          )}
          {todayAttendance?.overtime > 0 && (
            <div className="status-item">
              <span className="status-label">Tăng ca</span>
              <span className="status-value">{todayAttendance.overtime.toFixed(1)}h</span>
            </div>
          )}
        </div>

        {/* Nút check-in/check-out */}
        <div className="action-buttons">
          {!hasCheckedIn ? (
            <button
              className="btn-checkin"
              onClick={handleCheckIn}
              disabled={loading}
            >
              {loading && actionType === 'checkin' ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-sign-in-alt"></i>
              )}
              {loading && actionType === 'checkin' ? 'Đang xử lý...' : 'CHECK-IN'}
            </button>
          ) : !hasCheckedOut ? (
            <button
              className="btn-checkout"
              onClick={handleCheckOut}
              disabled={loading}
            >
              {loading && actionType === 'checkout' ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-sign-out-alt"></i>
              )}
              {loading && actionType === 'checkout' ? 'Đang xử lý...' : 'CHECK-OUT'}
            </button>
          ) : (
            <div className="completed-message">
              <i className="fas fa-check-circle"></i>
              <p>Bạn đã hoàn thành chấm công hôm nay</p>
            </div>
          )}
        </div>

        <div className="attendance-note">
          <p>
            <i className="fas fa-info-circle"></i> 
            Giờ làm việc: 8:00 - 17:00 (Check-in sau 8:30 sẽ tính là đi muộn)
          </p>
        </div>
      </div>

      {/* Thống kê trong tháng */}
      <div className="stats-section">
        <h3>Thống kê tháng này</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Tổng ngày</span>
              <span className="stat-value">{stats.totalDays || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon present">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Có mặt</span>
              <span className="stat-value">{stats.presentDays || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon late">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Đi muộn</span>
              <span className="stat-value">{stats.lateDays || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon absent">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Vắng</span>
              <span className="stat-value">{stats.absentDays || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon leave">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Nghỉ phép</span>
              <span className="stat-value">{stats.leaveDays || 0}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon hours">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Tổng giờ</span>
              <span className="stat-value">{stats.totalHours?.toFixed(1) || 0}h</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon overtime">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Tăng ca</span>
              <span className="stat-value">{stats.totalOvertime?.toFixed(1) || 0}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal nhập ghi chú */}
      {showNoteModal && (
        <div className="modal-overlay-NV">
          <div className="modal-content-NV">
            <div className="modal-header-NV">
              <h3>{actionType === 'checkin' ? 'Check-in' : 'Check-out'}</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowNoteModal(false);
                  setNote('');
                  setLocation(null);
                  setError('');
                  setActionType(null);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-time">
                <i className="fas fa-clock"></i> 
                Thời gian: {formatTime(currentTime)}
              </p>

              {location && (
                <p className="location-info">
                  <i className="fas fa-map-marker-alt"></i>
                  Đã lấy vị trí của bạn (vĩ độ: {location.lat.toFixed(4)}, kinh độ: {location.lng.toFixed(4)})
                </p>
              )}

              {!location && (
                <p className="location-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  Không thể xác định vị trí. Bạn vẫn có thể tiếp tục.
                </p>
              )}

              <div className="form-group-NV">
                <label>Ghi chú (không bắt buộc):</label>
                <textarea
                  className="form-input-NV"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú (nếu có)..."
                  rows="3"
                />
              </div>

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowNoteModal(false);
                  setNote('');
                  setLocation(null);
                  setError('');
                  setActionType(null);
                }}
              >
                Hủy
              </button>
              <button
                className="btn-confirm"
                onClick={confirmAction}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;