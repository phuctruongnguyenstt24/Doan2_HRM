// TeacherTraining.jsx - Trang đào tạo dành cho giảng viên
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaBookOpen, FaCalendarAlt, FaClock, FaUsers, FaMoneyBillWave,
  FaChalkboardTeacher, FaGraduationCap, FaCertificate, FaMapMarkerAlt,
  FaUserTie, FaFileAlt, FaCheckCircle, FaRegClock, FaHourglassHalf,
  FaDownload, FaEye, FaChartLine, FaStar, FaRegStar
} from 'react-icons/fa';
import './NVTraining.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TeacherTraining = () => {
  const [teacher, setTeacher] = useState(null);
  const [teachingPrograms, setTeachingPrograms] = useState([]);
  const [upcomingPrograms, setUpcomingPrograms] = useState([]);
  const [completedPrograms, setCompletedPrograms] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Lấy thông tin giảng viên đang đăng nhập
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Lấy thông tin giảng viên từ token hoặc localStorage
        const teacherId = localStorage.getItem('teacherId') || 
                          JSON.parse(localStorage.getItem('teacher'))?._id;
        
        if (!teacherId) {
          // Nếu chưa có, có thể redirect đến trang login
          console.error('Không tìm thấy thông tin giảng viên');
          setLoading(false);
          return;
        }

        // Lấy thông tin giảng viên
        const teacherRes = await axios.get(`${API_URL}/teachers/${teacherId}`);
        if (teacherRes.data) {
          setTeacher(teacherRes.data);
        }

        // Lấy các chương trình mà giảng viên tham gia giảng dạy
        const programsRes = await axios.get(`${API_URL}/training/programs/teacher/${teacherId}`);
        if (programsRes.data.success) {
          const allPrograms = programsRes.data.data;
          
          // Phân loại chương trình
          const now = new Date();
          const upcoming = allPrograms.filter(p => 
            p.status === 'Đang mở đăng ký' || 
            (p.status === 'Sắp khai giảng') ||
            (new Date(p.startDate) > now && p.status !== 'Đã kết thúc')
          );
          
          const ongoing = allPrograms.filter(p => 
            p.status === 'Đang diễn ra' ||
            (new Date(p.startDate) <= now && new Date(p.endDate) >= now && p.status !== 'Đã kết thúc')
          );
          
          const completed = allPrograms.filter(p => 
            p.status === 'Đã kết thúc' || new Date(p.endDate) < now
          );
          
          setTeachingPrograms(ongoing);
          setUpcomingPrograms(upcoming);
          setCompletedPrograms(completed);
          
          // Thống kê
          setStatistics({
            total: allPrograms.length,
            ongoing: ongoing.length,
            upcoming: upcoming.length,
            completed: completed.length,
            totalStudents: allPrograms.reduce((sum, p) => sum + (p.enrolledCount || 0), 0),
            totalHours: allPrograms.reduce((sum, p) => sum + (p.duration || 0), 0),
            avgRating: allPrograms.reduce((sum, p) => sum + (p.rating || 0), 0) / (allPrograms.length || 1)
          });
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const viewProgramDetail = (program) => {
    setSelectedProgram(program);
    setShowDetailModal(true);
  };

  const getStatusBadge = (program) => {
    const now = new Date();
    const startDate = new Date(program.startDate);
    const endDate = new Date(program.endDate);
    
    let status = program.status;
    let statusClass = '';
    let icon = null;
    
    if (status === 'Đang mở đăng ký') {
      statusClass = 'status-registering';
      icon = <FaRegClock />;
    } else if (status === 'Sắp khai giảng' || (startDate > now && status !== 'Đã kết thúc')) {
      statusClass = 'status-upcoming';
      icon = <FaHourglassHalf />;
    } else if (status === 'Đang diễn ra' || (startDate <= now && endDate >= now)) {
      statusClass = 'status-ongoing';
      icon = <FaRegClock />;
    } else if (status === 'Đã kết thúc' || endDate < now) {
      statusClass = 'status-completed';
      icon = <FaCheckCircle />;
    } else {
      statusClass = 'status-default';
    }
    
    const statusText = status === 'Đang mở đăng ký' ? 'Đang nhận đăng ký' :
                       status === 'Sắp khai giảng' ? 'Sắp khai giảng' :
                       status === 'Đang diễn ra' ? 'Đang diễn ra' :
                       status === 'Đã kết thúc' ? 'Đã kết thúc' : status;
    
    return <span className={`status-badge ${statusClass}`}>{icon}{statusText}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'Chưa cập nhật';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getDaysVietnamese = (days) => {
    if (!days || days.length === 0) return 'Chưa cập nhật';
    return days.join(', ');
  };

  if (loading) {
    return (
      <div className="teacher-training-loading">
        <div className="spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="teacher-training">
      {/* Header với thông tin giảng viên */}
      <div className="teacher-header-training">
        <div className="teacher-avatar">
          <img src={teacher?.avatar || 'https://i.pravatar.cc/150'} alt={teacher?.name} />
        </div>
        <div className="teacher-info">
          <h1>{teacher?.name}</h1>
          <div className="teacher-meta">
            <span><FaUserTie /> {teacher?.position || 'Giảng viên'}</span>
            <span><FaGraduationCap /> {teacher?.degree || 'Thạc sĩ'}</span>
            <span><FaChalkboardTeacher /> {teacher?.faculty || 'Chưa cập nhật'}</span>
          </div>
          <div className="teacher-contact">
            <span>📧 {teacher?.email}</span>
            <span>📞 {teacher?.phone}</span>
          </div>
        </div>
      </div>

      {/* Thống kê nhanh */}
      {statistics && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon"><FaBookOpen /></div>
            <div className="stat-content">
              <span className="stat-value">{statistics.total}</span>
              <span className="stat-label">Tổng chương trình</span>
            </div>
          </div>
          <div className="stat-card ongoing">
            <div className="stat-icon"><FaRegClock /></div>
            <div className="stat-content">
              <span className="stat-value">{statistics.ongoing}</span>
              <span className="stat-label">Đang giảng dạy</span>
            </div>
          </div>
          <div className="stat-card upcoming">
            <div className="stat-icon"><FaHourglassHalf /></div>
            <div className="stat-content">
              <span className="stat-value">{statistics.upcoming}</span>
              <span className="stat-label">Sắp diễn ra</span>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-content">
              <span className="stat-value">{statistics.completed}</span>
              <span className="stat-label">Đã hoàn thành</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-content">
              <span className="stat-value">{statistics.totalStudents}</span>
              <span className="stat-label">Học viên</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-content">
              <span className="stat-value">{statistics.totalHours}</span>
              <span className="stat-label">Tổng số giờ</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="training-tabs">
        <button
          className={`tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('ongoing')}
        >
          <FaRegClock /> Đang giảng dạy ({teachingPrograms.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <FaHourglassHalf /> Sắp diễn ra ({upcomingPrograms.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <FaCheckCircle /> Đã hoàn thành ({completedPrograms.length})
        </button>
      </div>

      {/* Danh sách chương trình */}
      <div className="programs-list">
        {activeTab === 'ongoing' && (
          <>
            {teachingPrograms.length === 0 ? (
              <div className="empty-state">
                <FaBookOpen className="empty-icon" />
                <p>Hiện tại bạn không có chương trình nào đang giảng dạy</p>
              </div>
            ) : (
              <div className="programs-grid">
                {teachingPrograms.map(program => (
                  <ProgramCard 
                    key={program._id} 
                    program={program} 
                    onViewDetail={viewProgramDetail}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    getStatusBadge={getStatusBadge}
                    getDaysVietnamese={getDaysVietnamese}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'upcoming' && (
          <>
            {upcomingPrograms.length === 0 ? (
              <div className="empty-state">
                <FaHourglassHalf className="empty-icon" />
                <p>Không có chương trình sắp diễn ra</p>
              </div>
            ) : (
              <div className="programs-grid">
                {upcomingPrograms.map(program => (
                  <ProgramCard 
                    key={program._id} 
                    program={program} 
                    onViewDetail={viewProgramDetail}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    getStatusBadge={getStatusBadge}
                    getDaysVietnamese={getDaysVietnamese}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'completed' && (
          <>
            {completedPrograms.length === 0 ? (
              <div className="empty-state">
                <FaCheckCircle className="empty-icon" />
                <p>Chưa có chương trình nào hoàn thành</p>
              </div>
            ) : (
              <div className="programs-grid">
                {completedPrograms.map(program => (
                  <ProgramCard 
                    key={program._id} 
                    program={program} 
                    onViewDetail={viewProgramDetail}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                    getStatusBadge={getStatusBadge}
                    getDaysVietnamese={getDaysVietnamese}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal chi tiết chương trình */}
      {showDetailModal && selectedProgram && (
        <ProgramDetailModal
          program={selectedProgram}
          onClose={() => setShowDetailModal(false)}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getDaysVietnamese={getDaysVietnamese}
        />
      )}
    </div>
  );
};

// Component Card cho chương trình
const ProgramCard = ({ program, onViewDetail, formatDate, formatCurrency, getStatusBadge, getDaysVietnamese }) => {
  return (
    <div className="program-card">
      <div className="program-card-header">
        <div className="program-code">{program.code}</div>
        {getStatusBadge(program)}
      </div>
      
      <h3 className="program-name">{program.name}</h3>
      
      <div className="program-badges">
        <span className="badge type-badge">{program.type}</span>
        <span className="badge category-badge">{program.category}</span>
      </div>
      
      <div className="program-info-row">
        <div className="info-item">
          <FaCalendarAlt />
          <span>{formatDate(program.startDate)} - {formatDate(program.endDate)}</span>
        </div>
        <div className="info-item">
          <FaClock />
          <span>{program.duration} giờ ({program.credits} tín chỉ)</span>
        </div>
      </div>
      
      <div className="program-info-row">
        <div className="info-item">
          <FaMapMarkerAlt />
          <span>{program.schedule?.location || 'Chưa cập nhật'}</span>
        </div>
        <div className="info-item">
          <FaUsers />
          <span>{program.enrolledCount || 0}/{program.maxParticipants} học viên</span>
        </div>
      </div>
      
      <div className="program-schedule">
        <strong>Lịch học:</strong>
        <span>{getDaysVietnamese(program.schedule?.days)}</span>
        <span>{program.schedule?.startTime} - {program.schedule?.endTime}</span>
      </div>
      
      <div className="program-card-footer">
        <div className="program-fee">
          <FaMoneyBillWave />
          <span>{formatCurrency(program.fee)}</span>
        </div>
        <button className="btn-detail" onClick={() => onViewDetail(program)}>
          <FaEye /> Xem chi tiết
        </button>
      </div>
    </div>
  );
};

// Modal chi tiết chương trình
const ProgramDetailModal = ({ program, onClose, formatDate, formatCurrency, getDaysVietnamese }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{program.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Thông tin cơ bản */}
          <div className="detail-section">
            <h3><FaBookOpen /> Thông tin chương trình</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Mã chương trình:</label>
                <span>{program.code}</span>
              </div>
              <div className="detail-item">
                <label>Loại hình:</label>
                <span>{program.type}</span>
              </div>
              <div className="detail-item">
                <label>Danh mục:</label>
                <span>{program.category}</span>
              </div>
              <div className="detail-item">
                <label>Chứng chỉ:</label>
                <span>{program.certificate}</span>
              </div>
              <div className="detail-item">
                <label>Thời lượng:</label>
                <span>{program.duration} giờ ({program.credits} tín chỉ)</span>
              </div>
              <div className="detail-item">
                <label>Học phí:</label>
                <span>{formatCurrency(program.fee)}</span>
              </div>
            </div>
          </div>
          
          {/* Thời gian và địa điểm */}
          <div className="detail-section">
            <h3><FaCalendarAlt /> Thời gian & Địa điểm</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Ngày bắt đầu:</label>
                <span>{formatDate(program.startDate)}</span>
              </div>
              <div className="detail-item">
                <label>Ngày kết thúc:</label>
                <span>{formatDate(program.endDate)}</span>
              </div>
              <div className="detail-item">
                <label>Hạn đăng ký:</label>
                <span>{formatDate(program.registrationDeadline)}</span>
              </div>
              <div className="detail-item">
                <label>Lịch học:</label>
                <span>{getDaysVietnamese(program.schedule?.days)}</span>
              </div>
              <div className="detail-item">
                <label>Thời gian:</label>
                <span>{program.schedule?.startTime} - {program.schedule?.endTime}</span>
              </div>
              <div className="detail-item">
                <label>Địa điểm:</label>
                <span>{program.schedule?.location || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
          
          {/* Mô tả chi tiết */}
          <div className="detail-section">
            <h3><FaFileAlt /> Mô tả chương trình</h3>
            <p className="detail-description">{program.description}</p>
          </div>
          
          {/* Đối tượng tham gia */}
          <div className="detail-section">
            <h3><FaUsers /> Đối tượng tham gia</h3>
            <p>{program.targetAudience}</p>
            {program.prerequisites && (
              <>
                <h4>Điều kiện tiên quyết:</h4>
                <p>{program.prerequisites}</p>
              </>
            )}
          </div>
          
          {/* Nội dung đào tạo */}
          {program.content && program.content.length > 0 && (
            <div className="detail-section">
              <h3><FaBookOpen /> Nội dung đào tạo</h3>
              <div className="content-list">
                {program.content.map((item, index) => (
                  <div key={index} className="content-item">
                    <span className="content-topic">{item.topic}</span>
                    <span className="content-hours">{item.hours} giờ</span>
                    {item.description && <p className="content-desc">{item.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Thông tin lớp học */}
          <div className="detail-section">
            <h3><FaUsers /> Quy mô lớp học</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Số lượng tối đa:</label>
                <span>{program.maxParticipants} học viên</span>
              </div>
              <div className="detail-item">
                <label>Số lượng tối thiểu:</label>
                <span>{program.minParticipants} học viên</span>
              </div>
              <div className="detail-item">
                <label>Đã đăng ký:</label>
                <span>{program.enrolledCount || 0} học viên</span>
              </div>
            </div>
          </div>
          
          {/* Đánh giá */}
          {program.rating > 0 && (
            <div className="detail-section">
              <h3><FaStar /> Đánh giá</h3>
              <div className="rating-display">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(program.rating) ? 
                      <FaStar key={i} className="star filled" /> : 
                      <FaRegStar key={i} className="star" />
                  ))}
                </div>
                <span className="rating-value">{program.rating.toFixed(1)} / 5</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherTraining;