import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import './EmployeeAttendance.css';

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
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

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
  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${API_URL}/attendance/my-attendance?date=${today}`,
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        setTodayAttendance(data.data);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  // Lấy thống kê của user
  const fetchUserStats = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch(
        `${API_URL}/attendance/my-stats?startDate=${firstDay}&endDate=${lastDay}`,
        { headers }
      );
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Lấy vị trí hiện tại
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Xử lý check-in
  const handleCheckIn = () => {
    setActionType('checkin');
    getCurrentLocation();
    setShowNoteModal(true);
  };

  // Xử lý check-out
  const handleCheckOut = () => {
    setActionType('checkout');
    getCurrentLocation();
    setShowNoteModal(true);
  };

  // Xác nhận check-in/check-out
  const confirmAction = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const endpoint = actionType === 'checkin'
        ? `${API_URL}/attendance/checkin`
        : `${API_URL}/attendance/checkout`;

      const payload = {
        note: note,
        ...(location && { location })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        setTodayAttendance(data.data);
        setShowNoteModal(false);
        setNote('');
        setLocation(null);
        fetchUserStats();
        setMessage(`✅ ${actionType === 'checkin' ? 'Check-in' : 'Check-out'} thành công!`);
      } else {
        setError(`❌ ${data.message || `Có lỗi xảy ra khi ${actionType === 'checkin' ? 'check-in' : 'check-out'}`}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`❌ Lỗi kết nối server khi ${actionType === 'checkin' ? 'check-in' : 'check-out'}`);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
    }
  };

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchTodayAttendance();
    fetchUserStats();
  }, []);

  // Format thời gian
  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return new Date(date).toLocaleTimeString('vi-VN', {
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

  // Nội dung chính của trang (bỏ phần header cũ)
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

      {error && (
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
              {todayAttendance?.checkIn?.time
                ? formatTime(todayAttendance.checkIn.time)
                : '--:--:--'
              }
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Check-out</span>
            <span className="status-value">
              {todayAttendance?.checkOut?.time
                ? formatTime(todayAttendance.checkOut.time)
                : '--:--:--'
              }
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Trạng thái</span>
            <span className={`status-badge ${todayAttendance?.status || 'pending'}`}>
              {!todayAttendance ? 'Chưa check-in' :
                todayAttendance.status === 'present' ? 'Có mặt' :
                  todayAttendance.status === 'late' ? 'Đi muộn' :
                    todayAttendance.status === 'leave' ? 'Nghỉ phép' :
                      todayAttendance.status === 'absent' ? 'Vắng' : 'Đang làm việc'}
            </span>
          </div>
          {todayAttendance?.workingHours > 0 && (
            <div className="status-item">
              <span className="status-label">Số giờ làm</span>
              <span className="status-value">{todayAttendance.workingHours.toFixed(1)}h</span>
            </div>
          )}
        </div>

        {/* Nút check-in/check-out */}
        <div className="action-buttons">
          {!todayAttendance?.checkIn?.time ? (
            <button
              className="btn-checkin"
              onClick={handleCheckIn}
              disabled={loading}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-in-alt"></i>}
              {loading ? 'Đang xử lý...' : 'CHECK-IN'}
            </button>
          ) : !todayAttendance?.checkOut?.time ? (
            <button
              className="btn-checkout"
              onClick={handleCheckOut}
              disabled={loading}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sign-out-alt"></i>}
              {loading ? 'Đang xử lý...' : 'CHECK-OUT'}
            </button>
          ) : (
            <div className="completed-message">
              <i className="fas fa-check-circle"></i>
              <p>Bạn đã hoàn thành chấm công hôm nay</p>
            </div>
          )}
        </div>

        <div className="attendance-note">
          <p><i className="fas fa-info-circle"></i> Giờ làm việc: 8:00 - 17:00 (Check-in sau 8:30 sẽ tính là đi muộn)</p>
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
              <span className="stat-value">{stats.totalDays}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon present">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Có mặt</span>
              <span className="stat-value">{stats.presentDays}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon late">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Đi muộn</span>
              <span className="stat-value">{stats.lateDays}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon absent">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Vắng</span>
              <span className="stat-value">{stats.absentDays}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon leave">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Nghỉ phép</span>
              <span className="stat-value">{stats.leaveDays}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon hours">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Tổng giờ</span>
              <span className="stat-value">{stats.totalHours.toFixed(1)}h</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon overtime">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <span className="stat-label">Tăng ca</span>
              <span className="stat-value">{stats.totalOvertime.toFixed(1)}h</span>
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
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-time">
                <i className="fas fa-clock"></i> Thời gian: {formatTime(currentTime)}
              </p>

              {location && (
                <p className="location-info">
                  <i className="fas fa-map-marker-alt"></i>
                  Đã lấy vị trí của bạn
                </p>
              )}

              <div className="form-group-NV">
                <label>Ghi chú (không bắt buộc):</label>
                <textarea
                  className="form-input-NV"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú..."
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
                }}
              >
                Hủy
              </button>
              <button
                className="btn-confirm"
                onClick={confirmAction}
                disabled={loading}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>


  );
};

export default EmployeeAttendance;