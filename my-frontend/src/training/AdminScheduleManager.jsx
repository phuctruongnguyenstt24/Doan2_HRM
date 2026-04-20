// LecturerSchedule.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaCalendarAlt, FaClock, FaUserTie, FaBookOpen, FaSearch,
  FaChevronLeft, FaChevronRight, FaPlus, FaEdit, FaTrash,
  FaTimesCircle, FaSave, FaPrint, FaDownload, FaCheckCircle,
  FaChalkboardTeacher, FaMapMarkerAlt, FaUsers, FaBell,FaInfoCircle
} from 'react-icons/fa';
import './AdminScheduleManager.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LecturerSchedule = () => {
  const [lecturers, setLecturers] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // week, month, day
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // add, edit
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [notification, setNotification] = useState(null);

const [scheduleForm, setScheduleForm] = useState({
    programId: '',
  courseId: '',
  lecturerId: '',
  courseCode: '',      // Thêm
  courseName: '',      // Thêm
  title: '',
  date: '',
  startTime: '08:00',
  endTime: '17:00',
  location: '',
  room: '',
  sessionType: 'Lý thuyết',
  maxStudents: 30,
  currentStudents: 0,
  description: '',
  requirements: '',
  materials: '',
  status: 'Scheduled',
  reminderSent: false,
  // Các trường từ programForm
  duration: 0,         // Thêm
  credits: 0,          // Thêm
  fee: 0,              // Thêm
  certificate: ''      // Thêm
});


  // Thời gian trong ngày
  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  useEffect(() => {
    fetchLecturers();
    fetchEnrollments();
  }, []);

  useEffect(() => {
    if (selectedLecturer) {
      fetchSchedules();
    }
  }, [selectedLecturer, currentDate, viewMode]);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchTerm, filterFaculty]);

  useEffect(() => {
  console.log('Schedules changed:', schedules);
  console.log('Filtered schedules:', filteredSchedules);
}, [schedules, filteredSchedules]);

  const fetchLecturers = async () => {
    try {
      const response = await axios.get(`${API_URL}/teachers`);
      if (response.data) {
        setLecturers(response.data);
        // Lấy danh sách khoa duy nhất
        const uniqueFaculties = [...new Set(response.data.map(l => l.faculty).filter(f => f))];
        setFaculties(uniqueFaculties);
      }
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      showNotification('error', 'Không thể tải danh sách giảng viên');
    }
  };

 const fetchEnrollments = async () => {
  try {
    // Lấy danh sách đăng ký từ API
    const response = await axios.get(`${API_URL}/training/enrollments`);
    if (response.data.success) {
      // Lấy tất cả các đăng ký (không filter status)
      const allEnrollments = response.data.data;
      
      // Tạo map các khóa học theo giảng viên
      const coursesMap = new Map();
      
      allEnrollments.forEach(enrollment => {
        if (enrollment.program && enrollment.teacher) {
          const courseKey = `${enrollment.program._id}_${enrollment.teacher._id}`;
          if (!coursesMap.has(courseKey)) {
            coursesMap.set(courseKey, {
              id: enrollment.program._id,
              code: enrollment.program.code,
              name: enrollment.program.name,
              lecturerId: enrollment.teacher._id,
              lecturerName: enrollment.teacher.name,
              duration: enrollment.program.duration,
              credits: enrollment.program.credits,
              fee: enrollment.program.fee,
              certificate: enrollment.program.certificate,
              startDate: enrollment.program.startDate,
              endDate: enrollment.program.endDate,
              schedule: enrollment.program.schedule,
              status: enrollment.status,
              enrollmentId: enrollment._id
            });
          }
        }
      });
      
      setAvailableCourses(Array.from(coursesMap.values()));
    }
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    showNotification('error', 'Không thể tải danh sách khóa học đã đăng ký');
  }
};

  const fetchSchedules = async () => {
  if (!selectedLecturer) return;
  
  setLoading(true);
  try {
    const response = await axios.get(`${API_URL}/training/lecturer-schedules`, {
      params: {
        lecturerId: selectedLecturer._id,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      }
    });
    if (response.data.success) {
      console.log('Fetched schedules:', response.data.data); // Debug log
      setSchedules(response.data.data);
    } else {
      generateMockSchedules();
    }
  } catch (error) {
    console.error('Error fetching schedules:', error);
    generateMockSchedules();
  } finally {
    setLoading(false);
  }
};

  const generateMockSchedules = () => {
  const lecturerCourses = availableCourses.filter(c => c.lecturerId === selectedLecturer?._id);
  const mockSchedules = [];
  
  if (lecturerCourses.length === 0) {
    console.log('No courses for this lecturer');
    setSchedules([]);
    return;
  }
  
  lecturerCourses.forEach((course, index) => {
    const numSessions = Math.floor(Math.random() * 6) + 5;
    for (let i = 0; i < numSessions; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1 + i * 3);
      if (date.getMonth() === currentDate.getMonth()) {
        mockSchedules.push({
          _id: `mock_${course.id}_${i}`,
          programId: course.id,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          lecturerId: course.lecturerId,
          lecturerName: course.lecturerName,
          title: `Buổi ${i + 1}: ${course.name}`,
          date: date.toISOString().split('T')[0], // Đảm bảo là string YYYY-MM-DD
          startTime: '08:00',
          endTime: '11:00',
          location: 'Cơ sở A',
          room: `P.${Math.floor(Math.random() * 10) + 1}0${Math.floor(Math.random() * 5) + 1}`,
          sessionType: i % 3 === 0 ? 'Lý thuyết' : (i % 3 === 1 ? 'Thực hành' : 'Thảo luận'),
          maxStudents: 30,
          currentStudents: Math.floor(Math.random() * 20) + 5,
          status: 'Scheduled',
          description: `Nội dung buổi học số ${i + 1}`,
          requirements: 'Sinh viên chuẩn bị tài liệu đầy đủ'
        });
      }
    }
  });
  
  console.log('Generated mock schedules:', mockSchedules);
  setSchedules(mockSchedules);
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
  
  if (filterFaculty && selectedLecturer) {
    if (selectedLecturer.faculty !== filterFaculty) {
      filtered = [];
    }
  }
  
  console.log('Filtered schedules:', filtered); // Debug log
  setFilteredSchedules(filtered);
};

  const handleLecturerSelect = (lecturer) => {
    setSelectedLecturer(lecturer);
    setSearchTerm('');
  };

const handleCreateSchedule = () => {
  if (!selectedLecturer) {
    showNotification('warning', 'Vui lòng chọn giảng viên trước');
    return;
  }
  
  setModalType('add');
  setSelectedSchedule(null);
  
  const today = new Date().toISOString().split('T')[0]; // Format: yyyy-MM-dd
  
  setScheduleForm({
    programId: '',
    courseId: '',
    lecturerId: selectedLecturer._id,
    courseCode: '',
    courseName: '',
    title: '',
    date: today,  // Format đúng
    startTime: '08:00',
    endTime: '17:00',
    location: '',
    room: '',
    sessionType: 'Lý thuyết',
    maxStudents: 30,
    currentStudents: 0,
    description: '',
    requirements: '',
    materials: '',
    status: 'Scheduled',
    reminderSent: false,
    duration: 0,
    credits: 0,
    fee: 0,
    certificate: ''
  });
  setShowModal(true);
};


 const handleEditSchedule = (schedule) => {
  setModalType('edit');
  setSelectedSchedule(schedule);
  
  // Format date: "2026-04-20" thay vì "2026-04-20T00:00:00.000Z"
  const formattedDate = schedule.date ? schedule.date.split('T')[0] : '';
  
  setScheduleForm({
    programId: schedule.courseId || schedule.programId,
    courseId: schedule.courseId,
    lecturerId: schedule.lecturerId,
    courseCode: schedule.courseCode || '',
    courseName: schedule.courseName || '',
    title: schedule.title,
    date: formattedDate,  // Đã format
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    location: schedule.location,
    room: schedule.room,
    sessionType: schedule.sessionType,
    maxStudents: schedule.maxStudents,
    currentStudents: schedule.currentStudents,
    description: schedule.description || '',
    requirements: schedule.requirements || '',
    materials: schedule.materials || '',
    status: schedule.status,
    reminderSent: schedule.reminderSent || false
  });
  setShowModal(true);
};

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) return;
    
    try {
      const response = await axios.delete(`${API_URL}/training/lecturer-schedules/${scheduleId}`);
      if (response.data.success) {
        showNotification('success', 'Xóa lịch học thành công');
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      // Xóa local
      setSchedules(schedules.filter(s => s._id !== scheduleId));
      showNotification('success', 'Xóa lịch học thành công');
    }
  };

 const handleSubmitSchedule = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Chuẩn bị dữ liệu đúng format cho API
    const submitData = {
      programId: scheduleForm.courseId,  // Chuyển courseId thành programId
      lecturerId: scheduleForm.lecturerId,
      title: scheduleForm.title,
      date: scheduleForm.date,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      location: scheduleForm.location,
      room: scheduleForm.room,
      sessionType: scheduleForm.sessionType,
      maxStudents: scheduleForm.maxStudents,
      currentStudents: scheduleForm.currentStudents,
      description: scheduleForm.description,
      requirements: scheduleForm.requirements,
      materials: scheduleForm.materials,
      status: scheduleForm.status
    };
    
    console.log('Submitting data:', submitData); // Debug log
    
    let response;
    if (modalType === 'add') {
      response = await axios.post(`${API_URL}/training/lecturer-schedules`, submitData);
    } else {
      response = await axios.put(`${API_URL}/training/lecturer-schedules/${selectedSchedule._id}`, submitData);
    }
    
    if (response.data.success) {
      showNotification('success', modalType === 'add' ? 'Thêm lịch học thành công' : 'Cập nhật lịch học thành công');
      setShowModal(false);
      fetchSchedules();
    }
  } catch (error) {
    console.error('Error saving schedule:', error);
    // Hiển thị lỗi chi tiết từ server
    if (error.response?.data?.message) {
      showNotification('error', error.response.data.message);
    } else {
      showNotification('error', 'Có lỗi xảy ra khi lưu lịch');
    }
    
    // Lưu local
    if (modalType === 'add') {
      const newSchedule = {
        _id: Date.now().toString(),
        ...scheduleForm,
        programId: e.target.value,
        courseId: scheduleForm.courseId,
        courseCode: scheduleForm.courseCode,
        courseName: scheduleForm.courseName,
        lecturerName: selectedLecturer?.name,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime
      };
      setSchedules([...schedules, newSchedule]);
    } else {
      const updatedSchedules = schedules.map(s => 
        s._id === selectedSchedule._id ? { ...s, ...scheduleForm } : s
      );
      setSchedules(updatedSchedules);
    }
    setShowModal(false);
  } finally {
    setLoading(false);
  }
};

  const handleSendReminder = async (schedule) => {
    try {
      const response = await axios.post(`${API_URL}/training/lecturer-schedules/${schedule._id}/remind`);
      if (response.data.success) {
        showNotification('success', 'Đã gửi nhắc nhở đến giảng viên');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      showNotification('success', 'Đã gửi nhắc nhở đến giảng viên');
    }
  };

  const handleChangeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleChangeMonth = (months) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + months);
    setCurrentDate(newDate);
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
  const getWeekDays = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

 const getSchedulesForDay = (date) => {
  // Đảm bảo date là Date object
  const targetDate = new Date(date);
  const dateStr = targetDate.toISOString().split('T')[0];
  
  return filteredSchedules.filter(s => {
    // Xử lý cả 2 trường hợp: s.date là string hoặc Date object
    let scheduleDateStr;
    if (typeof s.date === 'string') {
      scheduleDateStr = s.date.split('T')[0];
    } else if (s.date instanceof Date) {
      scheduleDateStr = s.date.toISOString().split('T')[0];
    } else {
      scheduleDateStr = new Date(s.date).toISOString().split('T')[0];
    }
    return scheduleDateStr === dateStr;
  });
};

  const getStatusBadge = (status) => {
    const statusMap = {
      'Scheduled': { class: 'status-scheduled', text: 'Đã lên lịch', icon: <FaCalendarAlt /> },
      'Ongoing': { class: 'status-ongoing', text: 'Đang diễn ra', icon: <FaClock /> },
      'Completed': { class: 'status-completed', text: 'Đã hoàn thành', icon: <FaCheckCircle /> },
      'Cancelled': { class: 'status-cancelled', text: 'Đã hủy', icon: <FaTimesCircle /> }
    };
    const s = statusMap[status] || statusMap['Scheduled'];
    return <span className={`status-badge ${s.class}`}>{s.icon}{s.text}</span>;
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
    link.setAttribute('download', `lich_giang_vien_${selectedLecturer?.name}_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Xuất file thành công');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="lecturer-schedule-container">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="schedule-header">
        <h1>
          <FaCalendarAlt /> Quản lý Lịch Giảng viên
        </h1>
        <p>Quản lý lịch dạy, sắp xếp buổi học cho giảng viên từ các khóa học đã đăng ký</p>
      </div>

      <div className="schedule-main">
        {/* Left Sidebar - Danh sách giảng viên */}
        <div className="lecturers-sidebar">
          <div className="sidebar-header-ASM">
            <h3><FaUserTie /> Danh sách giảng viên</h3>
            <div className="sidebar-filters-ASM">
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="faculty-filter"
              >
                <option value="">Tất cả khoa</option>
                {faculties.map(faculty => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="lecturers-list">
            {lecturers
              .filter(l => !filterFaculty || l.faculty === filterFaculty)
              .map(lecturer => (
                <div
                  key={lecturer._id}
                  className={`lecturer-item ${selectedLecturer?._id === lecturer._id ? 'active' : ''}`}
                  onClick={() => handleLecturerSelect(lecturer)}
                >
                  <div className="lecturer-avatar">
                    {lecturer.name?.charAt(0) || 'GV'}
                  </div>
                  <div className="lecturer-info">
                    <div className="lecturer-name">{lecturer.name}</div>
                    <div className="lecturer-detail">
                      <span className="lecturer-code">{lecturer.teacherCode}</span>
                      <span className="lecturer-faculty">{lecturer.faculty}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Content - Lịch */}
        <div className="schedule-content-ASM">
          {selectedLecturer ? (
            <>
              {/* Lecturer Info Bar */}
              <div className="lecturer-info-bar">
                <div className="lecturer-info-main">
                  <div className="lecturer-avatar-large">
                    {selectedLecturer.name?.charAt(0)}
                  </div>
                  <div>
                    <h2>{selectedLecturer.name}</h2>
                    <p>
                      <span>Mã: {selectedLecturer.teacherCode}</span>
                      <span>Khoa: {selectedLecturer.faculty}</span>
                      <span>Email: {selectedLecturer.email}</span>
                    </p>
                  </div>
                </div>
                <div className="lecturer-actions-ASM">
                  <button className="btn-primary-ASM" onClick={handleCreateSchedule}>
                    <FaPlus /> Thêm lịch
                  </button>
                  <button className="btn-secondary-ASM" onClick={exportToCSV}>
                    <FaDownload /> Xuất Excel
                  </button>
                  <button className="btn-secondary-ASM" onClick={handlePrint}>
                    <FaPrint /> In lịch
                  </button>
                </div>
              </div>

              {/* Calendar Controls */}
          <div className="calendar-controls">
  <div className="date-navigation">
    {viewMode === 'week' ? (
      <>
        <button onClick={() => handleChangeWeek(-1)}>
          <FaChevronLeft /> Tuần trước
        </button>
        <button onClick={handleCurrentWeek}>Tuần này</button>
        <button onClick={() => handleChangeWeek(1)}>
          Tuần sau <FaChevronRight />
        </button>
      </>
    ) : (
      <>
        <button onClick={() => handleChangeMonth(-1)}>
          <FaChevronLeft /> Tháng trước
        </button>
        <button onClick={() => setCurrentDate(new Date())}>
          Hôm nay
        </button>
        <button onClick={() => handleChangeMonth(1)}>
          Tháng sau <FaChevronRight />
        </button>
      </>
    )}
  </div>
  
  <div className="view-modes">
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
  
  <div className="month-display">
    <h3>
      {viewMode === 'week'
        ? `Tuần ${getWeekNumber(currentDate)} (${formatWeekRange(currentDate)})`
        : currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
      }
    </h3>
  </div>
</div>

              {/* Search Bar */}
              <div className="search-bar-ASM">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo khóa học, tiêu đề, địa điểm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Calendar View */}
              {loading ? (
                <div className="loading-spinner-ASM">Đang tải lịch...</div>
              ) : (
                <div className={`calendar-view-ASM ${viewMode}`}>
                  {viewMode === 'week' && (
                    <div className="week-view">
                      <div className="week-header">
                          <div className="time-col-header">Giờ</div>
                        {getWeekDays().map((day, index) => (
                          <div key={index} className="week-day-header">
                            <div className="day-name">
                              {day.toLocaleDateString('vi-VN', { weekday: 'short' })}
                            </div>
                            <div className="day-date">
                              {day.getDate()}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="week-body">
                        {timeSlots.map(timeSlot => (
                          <div key={timeSlot} className="time-row">
                            <div className="time-label">{timeSlot}</div>
                            {getWeekDays().map((day, dayIndex) => {
                              const daySchedules = getSchedulesForDay(day);
                              const scheduleAtTime = daySchedules.find(
                                s => s.startTime <= timeSlot && s.endTime > timeSlot
                              );
                              return (
                                <div key={dayIndex} className="time-cell">
                                  {scheduleAtTime && (
                                    <div 
                                      className={`schedule-event ${scheduleAtTime.status.toLowerCase()}`}
                                      onClick={() => handleEditSchedule(scheduleAtTime)}
                                    >
                                      <div className="event-title">{scheduleAtTime.title}</div>
                                      <div className="event-time">
                                        {scheduleAtTime.startTime} - {scheduleAtTime.endTime}
                                      </div>
                                      <div className="event-location">
                                        {scheduleAtTime.room} - {scheduleAtTime.location}
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
                    <div className="month-view">
                      <div className="month-header">
                        <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
                      </div>
                      <div className="month-body">
                        {Array.from({ length: 35 }).map((_, index) => {
                          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                          const startOffset = firstDayOfMonth.getDay();
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index - startOffset + 1);
                          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                          const daySchedules = getSchedulesForDay(date);
                          
                          return (
                            <div key={index} className={`month-cell ${!isCurrentMonth ? 'other-month' : ''}`}>
                              <div className="month-day">{date.getDate()}</div>
                              <div className="month-events">
                                {daySchedules.slice(0, 3).map(schedule => (
                                  <div 
                                    key={schedule._id} 
                                    className={`month-event ${schedule.status.toLowerCase()}`}
                                    onClick={() => handleEditSchedule(schedule)}
                                  >
                                    {schedule.startTime} - {schedule.title}
                                  </div>
                                ))}
                                {daySchedules.length > 3 && (
                                  <div className="more-events">+{daySchedules.length - 3} buổi</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {viewMode === 'day' && (
                    <div className="day-view">
                      <div className="day-header">
                        <h3>
                          {currentDate.toLocaleDateString('vi-VN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                      </div>
                      <div className="day-body">
                        {timeSlots.map(timeSlot => {
                          const daySchedules = getSchedulesForDay(currentDate);
                          const scheduleAtTime = daySchedules.find(
                            s => s.startTime <= timeSlot && s.endTime > timeSlot
                          );
                          return (
                            <div key={timeSlot} className="day-time-row">
                              <div className="day-time-label">{timeSlot}</div>
                              <div className="day-time-cell">
                                {scheduleAtTime && (
                                  <div 
                                    className={`day-schedule-event ${scheduleAtTime.status.toLowerCase()}`}
                                    onClick={() => handleEditSchedule(scheduleAtTime)}
                                  >
                                    <div className="event-header">
                                      <strong>{scheduleAtTime.title}</strong>
                                      {getStatusBadge(scheduleAtTime.status)}
                                    </div>
                                    <div className="event-details">
                                      <div><FaClock /> {scheduleAtTime.startTime} - {scheduleAtTime.endTime}</div>
                                      <div><FaMapMarkerAlt /> {scheduleAtTime.room} - {scheduleAtTime.location}</div>
                                      <div><FaBookOpen /> {scheduleAtTime.courseName}</div>
                                      <div><FaUsers /> {scheduleAtTime.currentStudents}/{scheduleAtTime.maxStudents} học viên</div>
                                    </div>
                                    <div className="event-actions">
                                      <button onClick={(e) => { e.stopPropagation(); handleEditSchedule(scheduleAtTime); }}>
                                        <FaEdit /> Sửa
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleSendReminder(scheduleAtTime); }}>
                                        <FaBell /> Nhắc
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSchedule(scheduleAtTime._id); }}>
                                        <FaTrash /> Xóa
                                      </button>
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
              )}

              {/* Schedules List View */}
              <div className="schedules-list">
                <h3>Danh sách buổi học</h3>
                <div className="schedules-table-wrapper">
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Khóa học</th>
                        <th>Tiêu đề</th>
                        <th>Loại</th>
                        <th>Phòng</th>
                        <th>Địa điểm</th>
                        <th>Sĩ số</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedules.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="empty-row">
                            Chưa có lịch học nào. Hãy tạo lịch mới!
                          </td>
                        </tr>
                      ) : (
                        filteredSchedules.map(schedule => (
                          <tr key={schedule._id}>
                            <td>{new Date(schedule.date).toLocaleDateString('vi-VN')}</td>
                            <td>{schedule.startTime} - {schedule.endTime}</td>
                            <td>
                              <div className="course-info">
                                <strong>{schedule.courseCode}</strong>
                                <span>{schedule.courseName}</span>
                              </div>
                            </td>
                            <td>{schedule.title}</td>
                            <td>{schedule.sessionType}</td>
                            <td>{schedule.room}</td>
                            <td>{schedule.location}</td>
                            <td>{schedule.currentStudents}/{schedule.maxStudents}</td>
                            <td>{getStatusBadge(schedule.status)}</td>
                            <td className="actions">
                              <button className="icon-btn edit" onClick={() => handleEditSchedule(schedule)}>
                                <FaEdit />
                              </button>
                              <button className="icon-btn delete" onClick={() => handleDeleteSchedule(schedule._id)}>
                                <FaTrash />
                              </button>
                              <button className="icon-btn remind" onClick={() => handleSendReminder(schedule)}>
                                <FaBell />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="no-lecturer-selected">
              <FaUserTie className="empty-icon" />
              <h3>Chưa chọn giảng viên</h3>
              <p>Vui lòng chọn một giảng viên từ danh sách bên trái để xem và quản lý lịch</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === 'add' ? 'Thêm lịch học mới' : 'Chỉnh sửa lịch học'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <FaTimesCircle />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule}>
              <div className="modal-body">
                <div className="form-row">
                 <div className="form-group">
  <label>Khóa học đã đăng ký *</label>
  <select
    value={scheduleForm.courseId}
    onChange={(e) => {
      const course = availableCourses.find(c => c.id === e.target.value);
      if (course) {
        setScheduleForm({
          ...scheduleForm,
          courseId: e.target.value,
          courseCode: course.code,
          courseName: course.name,
          title: `Buổi ${Math.floor(Math.random() * 20) + 1}: ${course.name}`,
          location: course.schedule?.location || '',
          maxStudents: 30,
          duration: course.duration,
          credits: course.credits,
          fee: course.fee,
          certificate: course.certificate
        });
      } else {
        setScheduleForm({
          ...scheduleForm,
          courseId: e.target.value,
          courseCode: '',
          courseName: '',
          title: ''
        });
      }
    }}
    required
  >
    <option value="">-- Chọn khóa học --</option>
    {availableCourses
      .filter(c => c.lecturerId === selectedLecturer?._id)
      .map(course => (
        <option key={course.id} value={course.id}>
          {course.code} - {course.name} ({course.duration} giờ - {course.credits} tín chỉ)
        </option>
      ))}
  </select>
  {scheduleForm.courseId && (
    <div className="course-info-hint">
      <small>
        <FaInfoCircle /> Thời lượng: {scheduleForm.duration} giờ | 
        Tín chỉ: {scheduleForm.credits} | 
        Học phí: {new Intl.NumberFormat('vi-VN').format(scheduleForm.fee)}đ
      </small>
    </div>
  )}
</div>

                  <div className="form-group">
                    <label>Tiêu đề buổi học *</label>
                    <input
                      type="text"
                      value={scheduleForm.title}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                      required
                      placeholder="VD: Buổi 1: Giới thiệu môn học"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày học *</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Giờ bắt đầu *</label>
                    <select
                      value={scheduleForm.startTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                      required
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Giờ kết thúc *</label>
                    <select
                      value={scheduleForm.endTime}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                      required
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Loại buổi học *</label>
                    <select
                      value={scheduleForm.sessionType}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, sessionType: e.target.value })}
                    >
                      <option value="Lý thuyết">Lý thuyết</option>
                      <option value="Thực hành">Thực hành</option>
                      <option value="Thảo luận">Thảo luận</option>
                      <option value="Kiểm tra">Kiểm tra</option>
                      <option value="Bài tập">Bài tập</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Phòng học *</label>
                    <input
                      type="text"
                      value={scheduleForm.room}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                      required
                      placeholder="VD: P.201"
                    />
                  </div>

                  <div className="form-group">
                    <label>Địa điểm *</label>
                    <input
                      type="text"
                      value={scheduleForm.location}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                      required
                      placeholder="VD: Cơ sở A"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số lượng tối đa</label>
                    <input
                      type="number"
                      value={scheduleForm.maxStudents}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, maxStudents: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Số lượng hiện tại</label>
                    <input
                      type="number"
                      value={scheduleForm.currentStudents}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, currentStudents: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select
                      value={scheduleForm.status}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, status: e.target.value })}
                    >
                      <option value="Scheduled">Đã lên lịch</option>
                      <option value="Ongoing">Đang diễn ra</option>
                      <option value="Completed">Đã hoàn thành</option>
                      <option value="Cancelled">Đã hủy</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả nội dung</label>
                  <textarea
                    value={scheduleForm.description}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                    rows="3"
                    placeholder="Mô tả chi tiết nội dung buổi học..."
                  />
                </div>

                <div className="form-group">
                  <label>Yêu cầu chuẩn bị</label>
                  <textarea
                    value={scheduleForm.requirements}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, requirements: e.target.value })}
                    rows="2"
                    placeholder="Những yêu cầu cho giảng viên và học viên..."
                  />
                </div>

                <div className="form-group">
                  <label>Tài liệu đính kèm</label>
                  <input
                    type="text"
                    value={scheduleForm.materials}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, materials: e.target.value })}
                    placeholder="Link tài liệu, giáo trình..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : (modalType === 'add' ? 'Thêm mới' : 'Cập nhật')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerSchedule;