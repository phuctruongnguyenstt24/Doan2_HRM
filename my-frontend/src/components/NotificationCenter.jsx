// components/NotificationCenter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, 
  FaCheckDouble, 
  FaTrash, 
  FaVolumeUp, 
  FaVolumeMute,
  FaFileContract,
  FaCalendarCheck,
  FaComment,
  FaUserPlus,
  FaGraduationCap,
  FaPlane,
  FaTimes
} from 'react-icons/fa';
import notificationService from '../services/NotificationService';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const navigate = useNavigate();

  // Load notifications và subscribe
  useEffect(() => {
    // Load initial data
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
    setIsSoundEnabled(notificationService.isSoundEnabled);

    // Subscribe to realtime updates
    const unsubscribe = notificationService.subscribe((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      
      // Hiển thị toast cho thông báo mới
      if (data.newNotifications && data.newNotifications.length > 0) {
        data.newNotifications.forEach(notif => {
          showToastNotification(notif);
        });
      }
    });

    // Start realtime check
    notificationService.startRealtimeCheck(30000); // 30 giây

    return () => {
      unsubscribe();
      notificationService.stopRealtimeCheck();
    };
  }, []);

  // Hiển thị toast notification
  const showToastNotification = (notification) => {
    setShowToast(notification);
    setTimeout(() => {
      setShowToast(null);
    }, 5000);
  };

  // Đánh dấu đã đọc
  const handleMarkAsRead = (id, e) => {
    e.stopPropagation();
    notificationService.markAsRead(id);
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  // Xóa thông báo
  const handleDelete = (id, e) => {
    e.stopPropagation();
    notificationService.deleteNotification(id);
  };

  // Click vào thông báo
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      setShowDropdown(false);
    }
  };

  // Bật/tắt âm thanh
  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    notificationService.toggleSound(newState);
  };

  // Lấy icon theo loại thông báo
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'contract': return <FaFileContract className="notif-icon contract" />;
      case 'attendance': return <FaCalendarCheck className="notif-icon attendance" />;
      case 'message': return <FaComment className="notif-icon message" />;
      case 'visitor': return <FaUserPlus className="notif-icon visitor" />;
      case 'course': return <FaGraduationCap className="notif-icon course" />;
      case 'leave': return <FaPlane className="notif-icon leave" />;
      default: return <FaBell className="notif-icon default" />;
    }
  };

  // Format thời gian
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return new Date(date).toLocaleDateString('vi-VN');
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast-notification ${showToast.priority}`} onClick={() => handleNotificationClick(showToast)}>
          <div className="toast-icon">
            {getNotificationIcon(showToast.type)}
          </div>
          <div className="toast-content">
            <div className="toast-title">{showToast.title}</div>
            <div className="toast-message">{showToast.message}</div>
          </div>
          <button className="toast-close" onClick={(e) => {
            e.stopPropagation();
            setShowToast(null);
          }}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Notification Bell */}
      <div className="notification-center">
        <button 
          className="notification-bell"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Sound Toggle Button */}
        <button className="sound-toggle" onClick={toggleSound} title={isSoundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}>
          {isSoundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
            <div className="notifications-dropdown">
              <div className="dropdown-header">
                <h3>Thông báo</h3>
                <div className="dropdown-actions">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="mark-all-read">
                      <FaCheckDouble /> Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>

              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <FaBell />
                    <p>Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''} ${notification.priority}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="notification-content">
                        <div className="notification-title">
                          {notification.title}
                          {notification.priority === 'high' && (
                            <span className="priority-badge">Quan trọng</span>
                          )}
                        </div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{formatTime(notification.time)}</div>
                      </div>
                      
                      <div className="notification-actions">
                        {!notification.read && (
                          <button 
                            className="mark-read-btn"
                            onClick={(e) => handleMarkAsRead(notification.id, e)}
                            title="Đánh dấu đã đọc"
                          >
                            <FaCheckDouble />
                          </button>
                        )}
                        <button 
                          className="delete-btn"
                          onClick={(e) => handleDelete(notification.id, e)}
                          title="Xóa"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="dropdown-footer">
                  <span>{unreadCount} chưa đọc</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;