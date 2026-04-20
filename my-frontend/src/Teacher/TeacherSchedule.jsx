// LecturerCalendar.jsx - Trang lịch cho giảng viên
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaCalendarAlt, FaClock, FaBookOpen, FaSearch,
  FaChevronLeft, FaChevronRight, FaChalkboardTeacher,
  FaMapMarkerAlt, FaUsers, FaBell, FaCheckCircle,
  FaTimesCircle, FaRegClock, FaDownload, FaPrint
} from 'react-icons/fa';
import './TeacherSchedule.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LecturerCalendar = () => {
  const [lecturer, setLecturer] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    upcoming: 0,
    totalHours: 0
  });

  // Thời gian trong ngày
  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  useEffect(() => {
    fetchLecturerInfo();
  }, []);

  useEffect(() => {
    if (lecturer) {
      fetchSchedules();
    }
  }, [lecturer, currentDate]);

  useEffect(() => {
    filterSchedules();
    calculateStats();
  }, [schedules, searchTerm]);

  // Thêm useEffect này ngay sau các useEffect khác (khoảng dòng 55)
useEffect(() => {
  console.log('=== DEBUG SCHEDULES DATA ===');
  console.log('Raw schedules:', schedules);
  console.log('Filtered schedules:', filteredSchedules);
  console.log('Search term:', searchTerm);
}, [schedules, filteredSchedules, searchTerm]);

  // Lấy thông tin giảng viên đang đăng nhập
 // TeacherSchedule.jsx - Sửa hàm fetchLecturerInfo

const fetchLecturerInfo = async () => {
  try {
    // Lấy từ localStorage hoặc context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const lecturerId = user._id || user.id;
    
    console.log('Lecturer ID from localStorage:', lecturerId);
    console.log('Full user object:', user);

    if (lecturerId && lecturerId.length === 24) { // Kiểm tra ID có đúng định dạng MongoDB không
      try {
        const response = await axios.get(`${API_URL}/teachers/${lecturerId}`);
        console.log('Teacher response:', response.data);
        
        if (response.data) {
          setLecturer(response.data);
          return;
        }
      } catch (err) {
        console.warn('Không tìm thấy giảng viên với ID:', lecturerId, err.response?.status);
      }
    }
    
    // Nếu ID không hợp lệ hoặc không tìm thấy, lấy giảng viên đầu tiên từ danh sách
    console.log('Falling back to first teacher in list');
    const response = await axios.get(`${API_URL}/teachers`);
    console.log('All teachers response:', response.data);
    
    // teacherRoutes trả về mảng trực tiếp, không có wrapper
    if (Array.isArray(response.data) && response.data.length > 0) {
      setLecturer(response.data[0]);
      // Cập nhật lại localStorage với ID đúng
      const firstTeacher = response.data[0];
      const updatedUser = { ...user, _id: firstTeacher._id, id: firstTeacher._id };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('Updated localStorage with correct teacher ID:', firstTeacher._id);
    } else {
      showNotification('error', 'Không có dữ liệu giảng viên');
    }
  } catch (error) {
    console.error('Error fetching lecturer:', error);
    showNotification('error', 'Không thể tải thông tin giảng viên');
  }
};

  // Lấy lịch dạy của giảng viên
  const fetchSchedules = async () => {
    if (!lecturer) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/training/lecturer-schedules`, {
        params: {
          lecturerId: lecturer._id,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        }
      });

      if (response.data.success) {
        setSchedules(response.data.data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = [...schedules];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSchedules(filtered);
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const completed = schedules.filter(s => s.status === 'Completed').length;
    const upcoming = schedules.filter(s => s.date >= today && s.status === 'Scheduled').length;

    let totalHours = 0;
    schedules.forEach(s => {
      const start = s.startTime.split(':');
      const end = s.endTime.split(':');
      const hours = (parseInt(end[0]) - parseInt(start[0])) + (parseInt(end[1]) - parseInt(start[1])) / 60;
      totalHours += hours;
    });

    setStats({
      total: schedules.length,
      completed,
      upcoming,
      totalHours: totalHours.toFixed(1)
    });
  };

  const getWeekDays = () => {
    const weekStart = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

const getSchedulesForDay = (date) => {
  // Tạo date theo múi giờ địa phương, bỏ giờ
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  // Format YYYY-MM-DD theo múi giờ địa phương
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  return filteredSchedules.filter(s => {
    // Chuyển date của schedule về múi giờ địa phương
    let scheduleDate = new Date(s.date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    const sYear = scheduleDate.getFullYear();
    const sMonth = String(scheduleDate.getMonth() + 1).padStart(2, '0');
    const sDay = String(scheduleDate.getDate()).padStart(2, '0');
    const scheduleDateStr = `${sYear}-${sMonth}-${sDay}`;
    
    return scheduleDateStr === dateStr;
  });
};
  // Chuyển tuần
  const handleChangeWeek = (weeks) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + weeks * 7);
    setCurrentDate(newDate);
  };

  // Về tuần hiện tại
  const handleCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Lấy số tuần trong năm
  const getWeekNumber = (date) => {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - yearStart) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + yearStart.getDay() + 1) / 7);
  };

  // Format khoảng thời gian của tuần (VD: 15/04 - 21/04)
  const formatWeekRange = (date) => {
    const weekStart = new Date(date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    const endStr = `${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
    return `${startStr} - ${endStr}`;
  };


  const getStatusBadge = (status) => {
    const statusMap = {
      'Scheduled': { class: 'status-scheduled', text: 'Sắp diễn ra', icon: <FaRegClock /> },
      'Ongoing': { class: 'status-ongoing', text: 'Đang diễn ra', icon: <FaClock /> },
      'Completed': { class: 'status-completed', text: 'Đã hoàn thành', icon: <FaCheckCircle /> },
      'Cancelled': { class: 'status-cancelled', text: 'Đã hủy', icon: <FaTimesCircle /> }
    };
    const s = statusMap[status] || statusMap['Scheduled'];
    return <span className={`lc-status-badge ${s.class}`}>{s.icon}{s.text}</span>;
  };

  const handleChangeMonth = (months) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + months);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const exportToCSV = () => {
    const headers = ['Ngày', 'Giờ bắt đầu', 'Giờ kết thúc', 'Khóa học', 'Tiêu đề', 'Loại buổi', 'Phòng', 'Địa điểm', 'Trạng thái'];
    const rows = filteredSchedules.map(s => [
      s.date,
      s.startTime,
      s.endTime,
      s.courseName,
      s.title,
      s.sessionType,
      s.room,
      s.location,
      getStatusBadge(s.status).props.children[1]
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lich_day_${lecturer?.name}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Xuất file thành công');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="lc-loading">
        <div className="lc-spinner"></div>
        <p>Đang tải lịch dạy...</p>
      </div>
    );
  }

  return (
    <div className="lecturer-calendar">
      {/* Notification */}
      {notification && (
        <div className={`lc-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="lc-header">
        <h1>
          <FaCalendarAlt /> Lịch Dạy Của Tôi
        </h1>
        <p>Xem lịch giảng dạy, buổi học đã được phân công</p>
      </div>

      {/* Lecturer Info */}
      {lecturer && (
        <div className="lc-lecturer-info">
          <div className="lc-avatar">
            {lecturer.name?.charAt(0) || 'GV'}
          </div>
          <div className="lc-info">
            <h2>{lecturer.name}</h2>
            <p>
              <span>Mã: {lecturer.teacherCode}</span>
              <span>Khoa: {lecturer.faculty}</span>
              <span>Email: {lecturer.email}</span>
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="lc-stats">
        <div className="lc-stat-card">
          <div className="lc-stat-icon"><FaBookOpen /></div>
          <div className="lc-stat-info">
            <span className="lc-stat-value">{stats.total}</span>
            <span className="lc-stat-label">Tổng buổi</span>
          </div>
        </div>
        <div className="lc-stat-card">
          <div className="lc-stat-icon"><FaCheckCircle /></div>
          <div className="lc-stat-info">
            <span className="lc-stat-value">{stats.completed}</span>
            <span className="lc-stat-label">Đã dạy</span>
          </div>
        </div>
        <div className="lc-stat-card">
          <div className="lc-stat-icon"><FaRegClock /></div>
          <div className="lc-stat-info">
            <span className="lc-stat-value">{stats.upcoming}</span>
            <span className="lc-stat-label">Sắp tới</span>
          </div>
        </div>
        <div className="lc-stat-card">
          <div className="lc-stat-icon"><FaClock /></div>
          <div className="lc-stat-info">
            <span className="lc-stat-value">{stats.totalHours}</span>
            <span className="lc-stat-label">Tổng giờ</span>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="lc-controls">
        <div className="lc-nav">
          {viewMode === 'week' ? (
            <>
              <button onClick={() => handleChangeWeek(-1)}>
                <FaChevronLeft /> Tuần trước
              </button>
              <button onClick={handleToday}>Tuần này</button>
              <button onClick={() => handleChangeWeek(1)}>
                Tuần sau <FaChevronRight />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleChangeMonth(-1)}>
                <FaChevronLeft /> Tháng trước
              </button>
              <button onClick={handleToday}>Hôm nay</button>
              <button onClick={() => handleChangeMonth(1)}>
                Tháng sau <FaChevronRight />
              </button>
            </>
          )}
        </div>

        <div className="lc-view-modes">
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>
            Tuần
          </button>
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>
            Tháng
          </button>
          <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>
            Ngày
          </button>
        </div>

        <div className="lc-month-display">
          <h3>
            {viewMode === 'week'
              ? `Tuần ${getWeekNumber(currentDate)} (${formatWeekRange(currentDate)})`
              : currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
            }
          </h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="lc-search">
        <FaSearch />
        <input
          type="text"
          placeholder="Tìm kiếm theo khóa học, tiêu đề, địa điểm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="lc-actions">
          <button onClick={exportToCSV}><FaDownload /> Xuất</button>
          <button onClick={handlePrint}><FaPrint /> In</button>
        </div>
      </div>

      {/* Calendar View */}
      <div className={`lc-calendar-view ${viewMode}`}>
        {viewMode === 'week' && (
          <div className="lc-week-view">
            <div className="lc-week-header">
              <div className="lc-time-col-header">Giờ</div>
              {getWeekDays().map((day, index) => (
                <div key={index} className="lc-week-day-header">
                  <div className="lc-day-name">
                    {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                  </div>
                  <div className="lc-day-date">
                    {day.getDate()}/{day.getMonth() + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="lc-week-body">
              {timeSlots.map(timeSlot => (
                <div key={timeSlot} className="lc-time-row">
                  <div className="lc-time-label">{timeSlot}</div>
                  {getWeekDays().map((day, dayIndex) => {
                    const daySchedules = getSchedulesForDay(day);
                    const schedule = daySchedules.find(
                      s => s.startTime <= timeSlot && s.endTime > timeSlot
                    );
                    return (
                      <div key={dayIndex} className="lc-time-cell">
                        {schedule && (
                          <div className={`lc-event ${schedule.status.toLowerCase()}`}>
                            <div className="lc-event-title">{schedule.title}</div>
                            <div className="lc-event-time">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                            <div className="lc-event-location">
                              {schedule.room} - {schedule.location}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'month' && (
          <div className="lc-month-view">
            <div className="lc-month-header">
              <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
            </div>
            <div className="lc-month-body">
              {Array.from({ length: 35 }).map((_, index) => {
                const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const startOffset = firstDayOfMonth.getDay();
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index - startOffset + 1);
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const daySchedules = getSchedulesForDay(date);
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                  <div key={index} className={`lc-month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}>
                    <div className="lc-month-day">{date.getDate()}</div>
                    <div className="lc-month-events">
                      {daySchedules.slice(0, 2).map(schedule => (
                        <div key={schedule._id} className={`lc-month-event ${schedule.status.toLowerCase()}`}>
                          <span className="lc-event-time">{schedule.startTime}</span>
                          <span className="lc-event-name">{schedule.courseName}</span>
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="lc-more-events">+{daySchedules.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="lc-day-view">
            <div className="lc-day-header">
              <h3>
                {currentDate.toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
            </div>
            <div className="lc-day-body">
              {timeSlots.map(timeSlot => {
                const daySchedules = getSchedulesForDay(currentDate);
                const schedule = daySchedules.find(
                  s => s.startTime <= timeSlot && s.endTime > timeSlot
                );
                return (
                  <div key={timeSlot} className="lc-day-time-row">
                    <div className="lc-day-time-label">{timeSlot}</div>
                    <div className="lc-day-time-cell">
                      {schedule && (
                        <div className={`lc-day-event ${schedule.status.toLowerCase()}`}>
                          <div className="lc-day-event-header">
                            <strong>{schedule.title}</strong>
                            {getStatusBadge(schedule.status)}
                          </div>
                          <div className="lc-day-event-details">
                            <div><FaClock /> {schedule.startTime} - {schedule.endTime}</div>
                            <div><FaMapMarkerAlt /> {schedule.room} - {schedule.location}</div>
                            <div><FaBookOpen /> {schedule.courseName}</div>
                            <div><FaChalkboardTeacher /> {schedule.sessionType}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Schedules List */}
<div className="lc-upcoming">
  <h3>📋 Các buổi học sắp tới</h3>
  <div className="lc-upcoming-list">
    {(() => {
      // Lấy ngày hôm nay, bỏ giờ
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // "2026-04-18"
      
      // Lọc các buổi học sắp tới
  const upcomingSchedules = filteredSchedules.filter(s => {
  // Chuyển date về múi giờ địa phương để so sánh
  let scheduleDate = new Date(s.date);
  scheduleDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return scheduleDate >= today && s.status !== 'Completed';
});
      
      if (upcomingSchedules.length === 0) {
        return <div className="lc-empty">Không có buổi học nào sắp tới</div>;
      }
      
      return upcomingSchedules
        .sort((a, b) => {
          let dateA = typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0];
          let dateB = typeof b.date === 'string' ? b.date.split('T')[0] : new Date(b.date).toISOString().split('T')[0];
          return dateA.localeCompare(dateB);
        })
        .map(schedule => {
          // Tạo Date object để hiển thị
          let scheduleDate;
          if (typeof schedule.date === 'string') {
            scheduleDate = new Date(schedule.date.split('T')[0]);
          } else {
            scheduleDate = new Date(schedule.date);
          }
          
          return (
            <div key={schedule._id} className="lc-upcoming-item">
              <div className="lc-upcoming-date">
                <span className="lc-day">{scheduleDate.getDate()}</span>
                <span className="lc-month">{scheduleDate.toLocaleDateString('vi-VN', { month: 'short' })}</span>
              </div>
              <div className="lc-upcoming-info">
                <div className="lc-upcoming-title">{schedule.title}</div>
                <div className="lc-upcoming-detail">
                  <span><FaClock /> {schedule.startTime} - {schedule.endTime}</span>
                  <span><FaMapMarkerAlt /> {schedule.room}</span>
                </div>
                <div className="lc-upcoming-course">{schedule.courseName}</div>
              </div>
              {getStatusBadge(schedule.status)}
            </div>
          );
        });
    })()}
  </div>
</div>
    </div>
  );
};

export default LecturerCalendar;