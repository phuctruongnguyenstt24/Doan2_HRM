// TrainingManagement.jsx - Phiên bản cập nhật với biến môi trường
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaCalendarAlt, FaClock, FaUsers, FaMoneyBillWave,
  FaChalkboardTeacher, FaGraduationCap, FaCertificate,
  FaChartLine, FaBookOpen, FaCheckCircle, FaTimesCircle,
  FaDollarSign, FaRegClock, FaMapMarkerAlt, FaUserTie
} from 'react-icons/fa';
import './TrainingManagement.css';

// Sử dụng biến môi trường
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TrainingManagement = () => {
  const [activeTab, setActiveTab] = useState('programs');
  const [programs, setPrograms] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('program');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    category: '',
    search: ''
  });

  const [programForm, setProgramForm] = useState({
    code: '',
    name: '',
    type: 'Đào tạo',
    category: 'Chuyên môn',
    duration: 30,
    credits: 2,
    fee: 0,
    description: '',
    targetAudience: '',
    prerequisites: '',
    
    maxParticipants: 30,
    minParticipants: 10,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    schedule: {
      days: [],
      startTime: '08:00',
      endTime: '17:00',
      location: ''
    },
    instructors: []
  });

  const [enrollmentForm, setEnrollmentForm] = useState({
    programId: '',
    teacherId: ''
  });

  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'programs') {
        const response = await axios.get(`${API_URL}/training/programs`, { params: filters });
        if (response.data.success) {
          setPrograms(response.data.data);
        }
      } else if (activeTab === 'enrollments') {
        const response = await axios.get(`${API_URL}/training/enrollments`);
        if (response.data.success) {
          setEnrollments(response.data.data);
        }
      } else if (activeTab === 'statistics') {
        const [statsRes, facultyStatsRes] = await Promise.all([
          axios.get(`${API_URL}/training/statistics`),
          axios.get(`${API_URL}/training/statistics/faculty`)
        ]);
        if (statsRes.data.success) {
          setStatistics({
            ...statsRes.data.data,
            facultyStats: facultyStatsRes.data.data
          });
        }
      }

      // Lấy danh sách giảng viên cho form đăng ký
      const teachersRes = await axios.get(`${API_URL}/teachers`);
      if (teachersRes.data) {
        setTeachers(teachersRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isEditing) {
        response = await axios.put(`${API_URL}/training/programs/${selectedProgram._id}`, programForm);
      } else {
        response = await axios.post(`${API_URL}/training/programs`, programForm);
      }

      if (response.data.success) {
        showNotification('success', response.data.message);
        closeModal();
        fetchData();
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/training/enroll`, enrollmentForm);
      if (response.data.success) {
        showNotification('success', response.data.message);
        closeModal();
        fetchData();
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa chương trình này?')) return;

    try {
      const response = await axios.delete(`${API_URL}/training/programs/${id}`);
      if (response.data.success) {
        showNotification('success', response.data.message);
        fetchData();
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleIssueCertificate = async (enrollmentId) => {
    if (!window.confirm('Cấp chứng chỉ cho học viên này?')) return;

    try {
      const response = await axios.put(`${API_URL}/training/enrollments/${enrollmentId}/certificate`, {
        issuedBy: 'Phòng Đào tạo'
      });
      if (response.data.success) {
        showNotification('success', response.data.message);
        fetchData();
      }
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const showNotification = (type, message) => {
    // Có thể thay bằng toast notification sau
    alert(message);
  };

  const openProgramModal = (program = null) => {
    if (program) {
      setIsEditing(true);
      setSelectedProgram(program);
      setProgramForm({
        ...program,
        startDate: program.startDate?.split('T')[0] || '',
        endDate: program.endDate?.split('T')[0] || '',
        registrationDeadline: program.registrationDeadline?.split('T')[0] || ''
      });
    } else {
      setIsEditing(false);
      setSelectedProgram(null);
      setProgramForm({
        code: '',
        name: '',
        type: 'Đào tạo',
        category: 'Chuyên môn',
        duration: 30,
        credits: 2,
        fee: 0,
        description: '',
        targetAudience: '',
        prerequisites: '',
         
        maxParticipants: 30,
        minParticipants: 10,
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        schedule: {
          days: [],
          startTime: '08:00',
          endTime: '17:00',
          location: ''
        },
        instructors: []
      });
    }
    setModalType('program');
    setShowModal(true);
  };

  const openEnrollmentModal = () => {
    setEnrollmentForm({ programId: '', teacherId: '' });
    setModalType('enrollment');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('program');
    setIsEditing(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Đang mở đăng ký': { class: 'status-active', icon: <FaCheckCircle /> },
      'Đang diễn ra': { class: 'status-ongoing', icon: <FaRegClock /> },
      'Đã kết thúc': { class: 'status-completed', icon: <FaCheckCircle /> },
      'Hủy': { class: 'status-cancelled', icon: <FaTimesCircle /> },
      'Draft': { class: 'status-draft', icon: <FaBookOpen /> }
    };
    const s = statusMap[status] || { class: 'status-default', icon: null };
    return <span className={`status-badge ${s.class}`}>{s.icon}{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="training-management">
      {/* Header */}
      <div className="training-header">
        <h1>Quản lý Đào tạo & Bồi dưỡng</h1>
        <p>Quản lý chương trình đào tạo, bồi dưỡng và cấp chứng chỉ cho giảng viên</p>
      </div>

      {/* Tabs */}
      <div className="training-tabs">
        <button
          className={`tab-btn ${activeTab === 'programs' ? 'active' : ''}`}
          onClick={() => setActiveTab('programs')}
        >
          <FaBookOpen /> Chương trình
        </button>
        <button
          className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrollments')}
        >
          <FaUsers /> Đăng ký
        </button>
        <button
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <FaChartLine /> Thống kê
        </button>
      </div>

      {/* Content */}
      <div className="training-content">
        {activeTab === 'programs' && (
          <>
            {/* Filters */}
            <div className="filters-bar">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Tìm theo mã, tên chương trình..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Đang mở đăng ký">Đang mở đăng ký</option>
                <option value="Đang diễn ra">Đang diễn ra</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Tất cả loại</option>
                <option value="Đào tạo">Đào tạo</option>
                <option value="Bồi dưỡng">Bồi dưỡng</option>
                <option value="Nâng cao">Nâng cao</option>
              </select>
              <button className="btn-primary" onClick={() => openProgramModal()}>
                <FaPlus /> Thêm chương trình
              </button>
            </div>

            {/* Programs Grid */}
            <div className="programs-grid">
              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : programs.length === 0 ? (
                <div className="empty-state">
                  <FaBookOpen className="empty-icon" />
                  <p>Chưa có chương trình đào tạo nào</p>
                  <button className="btn-primary" onClick={() => openProgramModal()}>
                    <FaPlus /> Tạo chương trình đầu tiên
                  </button>
                </div>
              ) : (
                programs.map(program => (
                  <div key={program._id} className="program-card">
                    <div className="program-header">
                      <div className="program-code">{program.code}</div>
                      {getStatusBadge(program.status)}
                    </div>
                    <h3 className="program-name">{program.name}</h3>
                    <div className="program-info">
                      <span><FaGraduationCap /> {program.type}</span>
                      <span><FaBookOpen /> {program.category}</span>
                    </div>
                    <div className="program-details">
                      <div><FaClock /> {program.duration} giờ</div>
                      <div><FaCalendarAlt /> {program.credits} tín chỉ</div>
                      <div><FaMoneyBillWave /> {formatCurrency(program.fee)}</div>
                      <div><FaUsers /> {program.enrolledCount || 0}/{program.maxParticipants}</div>
                    </div>
                    <div className="program-dates">
                      <div><FaCalendarAlt /> {new Date(program.startDate).toLocaleDateString('vi-VN')}</div>
                      <div> - {new Date(program.endDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div className="program-actions">
                  
                      <button className="icon-btn edit" onClick={() => openProgramModal(program)}>
                        <FaEdit />
                      </button>
                      <button className="icon-btn delete" onClick={() => handleDeleteProgram(program._id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'enrollments' && (
          <>
            <div className="enrollments-header">
              <button className="btn-primary" onClick={openEnrollmentModal}>
                <FaPlus /> Đăng ký mới
              </button>
            </div>

            <div className="enrollments-table-wrapper">
              {loading ? (
                <div className="loading">Đang tải...</div>
              ) : enrollments.length === 0 ? (
                <div className="empty-state">
                  <FaUsers className="empty-icon" />
                  <p>Chưa có đăng ký nào</p>
                </div>
              ) : (
                <table className="enrollments-table">
                  <thead>
                    <tr>
                      <th>Mã chương trình</th>
                      <th>Tên chương trình</th>
                      <th>Giảng viên</th>
                      <th>Khoa</th>
                      <th>Ngày đăng ký</th>
                      <th>Trạng thái</th>
                    
                      
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map(enrollment => (
                      <tr key={enrollment._id}>
                        <td>{enrollment.program?.code}</td>
                        <td>{enrollment.program?.name}</td>
                        <td>{enrollment.teacher?.name}</td>
                        <td>{enrollment.teacher?.faculty}</td>
                        <td>{new Date(enrollment.registrationDate).toLocaleDateString('vi-VN')}</td>
                        <td>{getStatusBadge(enrollment.status)}</td>
                     
                      
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === 'statistics' && statistics && (
          <div className="statistics-container">
            <div className="stats-cards">
              <div className="stat-card-large">
                <h3>Chương trình đào tạo</h3>
                <div className="stats-numbers">
                  <div><span className="stat-value">{statistics.programs?.total || 0}</span> Tổng số</div>
                  <div><span className="stat-value text-success">{statistics.programs?.active || 0}</span> Đang mở</div>
                  <div><span className="stat-value text-warning">{statistics.programs?.ongoing || 0}</span> Đang diễn ra</div>
                  <div><span className="stat-value text-info">{statistics.programs?.completed || 0}</span> Đã kết thúc</div>
                </div>
              </div>

              <div className="stat-card-large">
                <h3>Đăng ký</h3>
                <div className="stats-numbers">
                  <div><span className="stat-value">{statistics.enrollments?.total || 0}</span> Tổng lượt</div>
                  <div><span className="stat-value text-success">{statistics.enrollments?.completed || 0}</span> Hoàn thành</div>
                  <div><span className="stat-value text-warning">{statistics.enrollments?.inProgress || 0}</span> Đang học</div>
       
                </div>
              </div>
            </div>

            {statistics.facultyStats && statistics.facultyStats.length > 0 && (
              <div className="faculty-stats">
                <h3>Thống kê theo Khoa</h3>
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Khoa</th>
                      <th>Tổng số lượt đăng ký</th>
                      <th>Hoàn thành</th>
                      <th>Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.facultyStats.map(stat => (
                      <tr key={stat._id}>
                        <td>{stat._id}</td>
                        <td>{stat.total}</td>
                        <td>{stat.completed}</td>
                        <td>{stat.total > 0 ? ((stat.completed / stat.total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalType === 'program' ? (isEditing ? 'Cập nhật chương trình' : 'Thêm chương trình mới') : 'Đăng ký chương trình'}</h2>
              <button className="modal-close" onClick={closeModal}><FaTimesCircle /></button>
            </div>

            <form onSubmit={modalType === 'program' ? handleProgramSubmit : handleEnrollmentSubmit}>
              <div className="modal-body">
                {modalType === 'program' ? (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Mã chương trình *</label>
                        <input
                          type="text"
                          value={programForm.code}
                          onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                          required
                          placeholder="VD: DT001"
                        />
                      </div>
                      <div className="form-group">
                        <label>Tên chương trình *</label>
                        <input
                          type="text"
                          value={programForm.name}
                          onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Loại hình *</label>
                        <select
                          value={programForm.type}
                          onChange={(e) => setProgramForm({ ...programForm, type: e.target.value })}
                        >
                          <option value="Đào tạo">Đào tạo</option>
                          <option value="Bồi dưỡng">Bồi dưỡng</option>
                          <option value="Nâng cao">Nâng cao</option>
                          <option value="Chuyên sâu">Chuyên sâu</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Danh mục *</label>
                        <select
                          value={programForm.category}
                          onChange={(e) => setProgramForm({ ...programForm, category: e.target.value })}
                        >
                          <option value="Sư phạm">Sư phạm</option>
                          <option value="Nghiệp vụ">Nghiệp vụ</option>
                          <option value="Ngoại ngữ">Ngoại ngữ</option>
                          <option value="Tin học">Tin học</option>
                          <option value="Quản lý">Quản lý</option>
                          <option value="Chuyên môn">Chuyên môn</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Thời lượng (giờ) *</label>
                        <input
                          type="number"
                          value={programForm.duration}
                          onChange={(e) => setProgramForm({ ...programForm, duration: parseInt(e.target.value) })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Số tín chỉ *</label>
                        <input
                          type="number"
                          value={programForm.credits}
                          onChange={(e) => setProgramForm({ ...programForm, credits: parseInt(e.target.value) })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Học phí *</label>
                        <input
                          type="number"
                          value={programForm.fee}
                          onChange={(e) => setProgramForm({ ...programForm, fee: parseInt(e.target.value) })}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Ngày bắt đầu *</label>
                        <input
                          type="date"
                          value={programForm.startDate}
                          onChange={(e) => setProgramForm({ ...programForm, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Ngày kết thúc *</label>
                        <input
                          type="date"
                          value={programForm.endDate}
                          onChange={(e) => setProgramForm({ ...programForm, endDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Hạn đăng ký *</label>
                        <input
                          type="date"
                          value={programForm.registrationDeadline}
                          onChange={(e) => setProgramForm({ ...programForm, registrationDeadline: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Số lượng tối đa *</label>
                        <input
                          type="number"
                          value={programForm.maxParticipants}
                          onChange={(e) => setProgramForm({ ...programForm, maxParticipants: parseInt(e.target.value) })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Số lượng tối thiểu</label>
                        <input
                          type="number"
                          value={programForm.minParticipants}
                          onChange={(e) => setProgramForm({ ...programForm, minParticipants: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>
                 
                    </div>

                    <div className="form-group">
                      <label>Mô tả *</label>
                      <textarea
                        value={programForm.description}
                        onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                        rows="3"
                        required
                        placeholder="Mô tả chi tiết về chương trình..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Đối tượng tham gia *</label>
                      <input
                        type="text"
                        value={programForm.targetAudience}
                        onChange={(e) => setProgramForm({ ...programForm, targetAudience: e.target.value })}
                        required
                        placeholder="VD: Giảng viên có 2 năm kinh nghiệm"
                      />
                    </div>

                    <div className="form-group">
                      <label>Điều kiện tiên quyết</label>
                      <input
                        type="text"
                        value={programForm.prerequisites}
                        onChange={(e) => setProgramForm({ ...programForm, prerequisites: e.target.value })}
                        placeholder="VD: Đã hoàn thành chương trình cơ bản"
                      />
                    </div>

                    <div className="form-group">
                      <label>Địa điểm học</label>
                      <input
                        type="text"
                        value={programForm.schedule.location}
                        onChange={(e) => setProgramForm({ ...programForm, schedule: { ...programForm.schedule, location: e.target.value } })}
                        placeholder="Phòng học, cơ sở..."
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Chương trình *</label>
                      <select
                        value={enrollmentForm.programId}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, programId: e.target.value })}
                        required
                      >
                        <option value="">Chọn chương trình</option>
                        {programs.filter(p => p.status === 'Đang mở đăng ký').map(p => (
                          <option key={p._id} value={p._id}>{p.code} - {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Giảng viên *</label>
                      <select
                        value={enrollmentForm.teacherId}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, teacherId: e.target.value })}
                        required
                      >
                        <option value="">Chọn giảng viên</option>
                        {teachers.filter(t => !t.isLocked).map(t => (
                          <option key={t._id} value={t._id}>{t.teacherCode} - {t.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : (isEditing ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;