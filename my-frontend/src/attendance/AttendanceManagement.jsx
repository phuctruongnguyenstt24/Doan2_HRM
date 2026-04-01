import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import './AttendanceManagement.css';

const AttendanceManagement = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // States cho API
  const [attendanceData, setAttendanceData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20
  });

  // Sử dụng biến môi trường
  const API_URL = import.meta.env.VITE_API_URL || '/api';

    // Thêm useEffect để log URL đang dùng
  useEffect(() => {
    console.log('🌐 API_URL from env:', API_URL);
    console.log('🌐 Will proxy through Vite dev server');
  }, []);

  // Token từ localStorage
  const token = localStorage.getItem('token');

  // Headers cho API requests
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

   // Helper function để fetch với error handling tốt hơn
  const fetchAPI = async (endpoint, options = {}) => {
    try {
      // Nếu đang trong development, dùng proxy
      let url;
      if (import.meta.env.DEV) {
        // Sử dụng proxy của Vite
        url = `/api${endpoint}`;
        console.log('🔄 Dev mode - using proxy:', url);
      } else {
        // Production - dùng URL đầy đủ
        url = `${API_URL}${endpoint}`;
        console.log('🚀 Production mode - using full URL:', url);
      }
      
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ API fetch error:', error);
      throw error;
    }
  };

  // Thêm useEffect để load dữ liệu mẫu nếu API không có
  useEffect(() => {
    if (employees.length === 0) {
      console.log('📝 Using sample employee data for testing');
      setEmployees([
        {
          employeeId: 'GV001',
          name: 'Nguyễn Văn A',
          department: 'Khoa Công Nghệ Thông Tin',
          position: 'Giảng viên',
          hourlyRate: 150000
        },
        {
          employeeId: 'NV001',
          name: 'Trần Thị B',
          department: 'Phòng Đào Tạo',
          position: 'Nhân viên',
          hourlyRate: 80000
        },
        {
          employeeId: 'GV002',
          name: 'Lê Văn C',
          department: 'Khoa Kinh Tế',
          position: 'Giảng viên',
          hourlyRate: 150000
        }
      ]);
    }
  }, [employees.length]);

  // ==================== API CALLS ====================

  // Lấy danh sách phòng ban
 
  const fetchDepartments = async () => {
    try {
      const data = await fetchAPI('/departments');
      
      if (data.success) {
        setDepartments([
          { id: 'all', name: 'Tất cả phòng ban' },
          ...data.data.map(dept => ({
            id: dept._id,
            name: dept.name
          }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      // Fallback data
      setDepartments([
        { id: 'all', name: 'Tất cả phòng ban' },
        { id: '1', name: 'Khoa Công Nghệ Thông Tin' },
        { id: '2', name: 'Khoa Kinh Tế' },
        { id: '3', name: 'Phòng Đào Tạo' }
      ]);
    }
  };

  // Lấy danh sách nhân viên
  const fetchEmployees = async () => {
    try {
      console.log('🔵 Fetching employees...');
      const data = await fetchAPI('/users-permissions/users?limit=100');
      
      // hỗ trợ cả 2 format
      const users = data.users || data;

      if (!Array.isArray(users) || users.length === 0) {
        console.log('⚠️ No users found, using sample data');
        setEmployees(getSampleEmployees());
        return;
      }

      const formattedEmployees = users.map(user => ({
        id: user._id || user.id,
        employeeId: user.employeeId || user._id || user.id,
        name: user.fullName || user.name || 'Không có tên',
        department: user.department?.name || user.department || 'Chưa có',
        position: user.position || 'Nhân viên',
        hourlyRate: user.hourlyRate || 80000
      }));

      console.log('✅ Formatted employees:', formattedEmployees);
      setEmployees(formattedEmployees);

    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      setEmployees(getSampleEmployees());
    }
  };

  // Lấy dữ liệu chấm công
  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        startDate: selectedDate,
        endDate: selectedDate,
        ...(selectedDepartment !== 'all' && { department: selectedDepartment }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const data = await fetchAPI(`/attendance/admin/attendance?${params}`);

      if (data.success) {
        const formattedData = data.data.map(record => ({
          id: record._id,
          employeeId: record.employeeId,
          employeeName: record.userId?.fullName || record.userId?.name || 'N/A',
          department: record.departmentName || record.userId?.department?.name || 'Chưa có phòng ban',
          position: record.userId?.position || 'Nhân viên',
          date: new Date(record.date).toISOString().split('T')[0],
          checkIn: record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null,
          checkOut: record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null,
          status: record.status,
          workingHours: record.workingHours || 0,
          overtime: record.overtime || 0,
          leaveType: record.leaveType
        }));

        setAttendanceData(formattedData);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems
        }));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Không thể tải dữ liệu chấm công');
    } finally {
      setLoading(false);
    }
  };

  // Sửa hàm handleEdit
  const handleEdit = (record) => {
    if (record.id && !record.id.toString().startsWith('temp-')) {
      setSelectedRecord(record);
      setShowEditModal(true);
    } else {
      alert('Không thể chỉnh sửa bản ghi tạm thời');
    }
  };

  // Xử lý khi bấm nút thêm mới
  const handleAddClick = () => {
    const newRecord = {
      employeeId: '',
      employeeName: '',
      department: '',
      position: '',
      date: selectedDate,
      checkIn: '08:00',  // String đơn giản
      checkOut: '17:00', // String đơn giản
      status: 'present',
      workingHours: 8,
      overtime: 0,
      leaveType: null
    };

    setSelectedRecord(newRecord);
    setShowEditModal(true);
  };

  // Thêm chấm công mới
  const handleAddAttendance = async () => {
    if (!selectedRecord?.employeeId) {
      alert('Vui lòng chọn nhân viên');
      return;
    }

    // Tìm employee object để lấy userId
    const employee = employees.find(emp => emp.employeeId === selectedRecord.employeeId);

    if (!employee) {
      alert('Không tìm thấy thông tin nhân viên');
      return;
    }

    try {
      // Đảm bảo checkIn và checkOut là string đơn giản (HH:mm)
      const checkInTime = selectedRecord.checkIn || '08:00';
      const checkOutTime = selectedRecord.checkOut || '17:00';

      const attendanceData = {
        userId: employee.id || employee.employeeId,
        employeeId: selectedRecord.employeeId,
        date: selectedDate,
        checkIn: checkInTime,  // Gửi trực tiếp string "HH:mm"
        checkOut: checkOutTime, // Gửi trực tiếp string "HH:mm"
        status: selectedRecord.status,
        leaveType: selectedRecord.leaveType || null,
        workingHours: parseFloat(selectedRecord.workingHours) || 0,
        overtime: parseFloat(selectedRecord.overtime) || 0,
        notes: ''
      };

      console.log('📤 Sending attendance data:', attendanceData);

      const response = await fetch(`${API_URL}/attendance/admin/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify(attendanceData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        fetchAttendance(); // Refresh danh sách
        alert('✅ Thêm chấm công thành công!');
      } else {
        console.error('❌ Server response:', data);
        alert(data.message || 'Có lỗi xảy ra khi thêm chấm công');
      }
    } catch (error) {
      console.error('❌ Error adding attendance:', error);
      alert('Có lỗi xảy ra khi thêm chấm công: ' + error.message);
    }
  };


  // Cập nhật chấm công
  const handleSaveEdit = async () => {
    if (!selectedRecord.id || selectedRecord.id.toString().startsWith('temp-')) {
      alert('ID không hợp lệ');
      return;
    }

    try {
      // Đảm bảo checkIn và checkOut là string đơn giản (HH:mm)
      const checkInTime = selectedRecord.checkIn || '08:00';
      const checkOutTime = selectedRecord.checkOut || '17:00';

      const updateData = {
        checkIn: checkInTime,  // Gửi trực tiếp string "HH:mm"
        checkOut: checkOutTime, // Gửi trực tiếp string "HH:mm"
        status: selectedRecord.status,
        leaveType: selectedRecord.leaveType,
        workingHours: parseFloat(selectedRecord.workingHours),
        overtime: parseFloat(selectedRecord.overtime)
      };

      console.log('📤 Updating attendance data:', updateData);

      const response = await fetch(`${API_URL}/attendance/admin/attendance/${selectedRecord.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        fetchAttendance();
        alert('✅ Cập nhật chấm công thành công!');
      } else {
        alert(data.message || '❌ Có lỗi xảy ra khi cập nhật chấm công');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('❌ Có lỗi xảy ra khi cập nhật chấm công: ' + error.message);
    }
  };

  // Xóa chấm công
  const handleDelete = async (id) => {
    if (!id || id.toString().startsWith('temp-')) {
      alert('Không thể xóa bản ghi tạm thời');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa bản ghi này?')) return;

    try {
      const response = await fetch(`${API_URL}/attendance/admin/attendance/${id}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (data.success) {
        fetchAttendance();
        alert('✅ Xóa chấm công thành công!');
      } else {
        alert(data.message || '❌ Có lỗi xảy ra khi xóa chấm công');
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      alert('❌ Có lỗi xảy ra khi xóa chấm công');
    }
  };



  // ==================== LIFE CYCLE ====================

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedDepartment, filterStatus, pagination.currentPage]);

  // Tính công lương
  const calculateSalary = (record) => {
    const employee = employees.find(e => e.employeeId === record.employeeId);
    if (!employee) return 0;

    const hourlyRate = employee.hourlyRate;
    let totalSalary = 0;

    if (record.status === 'present' || record.status === 'late') {
      totalSalary = record.workingHours * hourlyRate;
      if (record.overtime > 0) {
        totalSalary += record.overtime * hourlyRate * 1.5;
      }
    } else if (record.status === 'leave' && record.leaveType === 'paid') {
      totalSalary = 8 * hourlyRate;
    }

    return totalSalary;
  };

  // Format tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Thống kê
  const statistics = {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'present').length,
    late: attendanceData.filter(r => r.status === 'late').length,
    absent: attendanceData.filter(r => r.status === 'absent').length,
    leave: attendanceData.filter(r => r.status === 'leave').length,
    totalSalary: attendanceData.reduce((sum, record) => sum + calculateSalary(record), 0)
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  return (
    <div className="time-tracking-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản Lý Chấm Công</h1>
        <div className="header-actions">

          <button className="btn-add" onClick={handleAddClick}>
            <i className="fas fa-plus"></i>
            Thêm chấm công
          </button>


        </div>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Bộ lọc */}
      <div className="filter-section-NV">
        <div className="filter-group-NV">
          <label>Ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className="filter-input-NV"
          />
        </div>

        <div className="filter-group-NV">
          <label>Phòng ban:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className="filter-input-NV"
          >
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group-NV">
          <label>Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className="filter-input-NV"
          >
            <option value="all">Tất cả</option>
            <option value="present">Có mặt</option>
            <option value="late">Đi muộn</option>
            <option value="absent">Vắng không phép</option>
            <option value="leave">Nghỉ phép</option>
          </select>
        </div>

        <button className="btn-search" onClick={() => fetchAttendance()}>
          <i className="fas fa-search"></i>
          Tìm kiếm
        </button>
      </div>

      {/* Thống kê nhanh */}
      <div className="stats-cards">
        <div className="stat-card total">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng số</span>
            <span className="stat-value">{statistics.total}</span>
          </div>
        </div>

        <div className="stat-card present">
          <div className="stat-icon">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Có mặt</span>
            <span className="stat-value">{statistics.present}</span>
          </div>
        </div>

        <div className="stat-card late">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đi muộn</span>
            <span className="stat-value">{statistics.late}</span>
          </div>
        </div>

        <div className="stat-card absent">
          <div className="stat-icon">
            <FaTimesCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Vắng không phép</span>
            <span className="stat-value">{statistics.absent}</span>
          </div>
        </div>

        <div className="stat-card leave">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <span className="stat-label">Nghỉ phép</span>
            <span className="stat-value">{statistics.leave}</span>
          </div>
        </div>

        <div className="stat-card salary">
          <div className="stat-icon">
            <FaMoneyBillWave />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng lương</span>
            <span className="stat-value">{formatCurrency(statistics.totalSalary)}</span>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
        </div>
      )}

      {/* Bảng chấm công */}
      {!loading && (
        <>
          <div className="attendance-table">
            <table>
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ tên</th>
                  <th>Phòng ban</th>
                  <th>Chức vụ</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th>Trạng thái</th>
                  <th>Giờ công</th>
                  <th>Tăng ca</th>
                  <th>Tiền lương</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="text-center">
                      Không có dữ liệu chấm công
                    </td>
                  </tr>
                ) : (
                  attendanceData.map(record => (
                    <tr key={record.id}>
                      <td>{record.employeeId}</td>
                      <td>{record.employeeName}</td>
                      <td>{record.department}</td>
                      <td>{record.position}</td>
                      <td>
                        <span className={record.checkIn ? '' : 'text-muted'}>
                          {record.checkIn || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span className={record.checkOut ? '' : 'text-muted'}>
                          {record.checkOut || '--:--'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === 'present' && 'Có mặt'}
                          {record.status === 'late' && 'Đi muộn'}
                          {record.status === 'absent' && 'Vắng không phép'}
                          {record.status === 'leave' && 'Nghỉ phép'}
                        </span>
                        {record.leaveType && (
                          <small className="leave-type">
                            ({record.leaveType === 'paid' ? 'Có lương' : 'Không lương'})
                          </small>
                        )}
                      </td>
                      <td>{record.workingHours}h</td>
                      <td>{record.overtime > 0 ? `${record.overtime}h` : '-'}</td>
                      <td className="salary-cell">{formatCurrency(calculateSalary(record))}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(record)}
                          title="Chỉnh sửa"
                          disabled={record.id?.toString().startsWith('temp-')}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-delete-AT"
                          onClick={() => handleDelete(record.id)}
                          title="Xóa"
                          disabled={record.id?.toString().startsWith('temp-')}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span>Trang {pagination.currentPage} / {pagination.totalPages}</span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal chỉnh sửa/thêm mới */}
      {showEditModal && (
        <div className="modal-overlay-AT">
          <div className="modal-content-AT">
            <div className="modal-header-AT">
              <h2>{selectedRecord?.id ? 'Chỉnh sửa chấm công' : 'Thêm chấm công mới'}</h2>
              <button className="btn-close" onClick={() => {
                setShowEditModal(false);
                setSelectedRecord(null);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Hiển thị form chọn nhân viên khi thêm mới và chưa chọn nhân viên */}
              {!selectedRecord?.employeeId && (
                <div className="form-group-AT">
                  <label>Chọn nhân viên:</label>
                  <select
                    className="form-input-AT"
                    onChange={(e) => {
                      const emp = employees.find(emp => emp.employeeId === e.target.value);
                      if (emp) {
                        setSelectedRecord(prev => ({
                          ...prev,
                          id: null,
                          employeeId: emp.employeeId,
                          employeeName: emp.name,
                          department: emp.department,
                          position: emp.position,
                          hourlyRate: emp.hourlyRate,
                          checkIn: prev?.checkIn || '08:00',
                          checkOut: prev?.checkOut || '17:00',
                          status: prev?.status || 'present',
                          workingHours: prev?.workingHours || 8,
                          overtime: prev?.overtime || 0
                        }));
                      }
                    }}
                    value={selectedRecord?.employeeId || ''}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.employeeId} - {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Hiển thị thông tin nhân viên đã chọn */}
              {selectedRecord?.employeeId && (
                <>
                  <div className="form-group-AT">
                    <label>Mã nhân viên:</label>
                    <input
                      type="text"
                      value={selectedRecord.employeeId || ""}
                      onChange={(e) =>
                        setSelectedRecord({
                          ...selectedRecord,
                          employeeId: e.target.value
                        })
                      }
                      className="form-input-AT"
                    />

                  </div>

                  <div className="form-group-AT">
                    <label>Họ tên:</label>
                    <input
                      type="text"
                      value={selectedRecord.employeeName || ""}
                      onChange={(e) =>
                        setSelectedRecord({
                          ...selectedRecord,
                          employeeName: e.target.value
                        })
                      }
                      className="form-input-AT"
                    />
                  </div>

                  <div className="form-group-AT">
                    <label>Phòng ban:</label>
                    <input
                      type="text"
                      value={selectedRecord.department || ""}
                    disabled
                      className="form-input-AT"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group-AT">
                      <label>Giờ vào:</label>
                      <input
                        type="time"
                        value={selectedRecord.checkIn || '08:00'}
                        onChange={(e) => setSelectedRecord({
                          ...selectedRecord,
                          checkIn: e.target.value
                        })}
                        className="form-input-AT"
                      />
                    </div>

                    <div className="form-group-AT">
                      <label>Giờ ra:</label>
                      <input
                        type="time"
                        value={selectedRecord.checkOut || '17:00'}
                        onChange={(e) => setSelectedRecord({
                          ...selectedRecord,
                          checkOut: e.target.value
                        })}
                        className="form-input-AT"
                      />
                    </div>
                  </div>

                  <div className="form-group-AT">
                    <label>Trạng thái:</label>
                    <select
                      value={selectedRecord.status}
                      onChange={(e) => setSelectedRecord({
                        ...selectedRecord,
                        status: e.target.value,
                        leaveType: e.target.value === 'leave' ? selectedRecord.leaveType : null
                      })}
                      className="form-input-AT"
                    >
                      <option value="present">Có mặt</option>
                      <option value="late">Đi muộn</option>
                      <option value="absent">Vắng không phép</option>
                      <option value="leave">Nghỉ phép</option>
                    </select>
                  </div>

                  {selectedRecord.status === 'leave' && (
                    <div className="form-group-AT">
                      <label>Loại nghỉ:</label>
                      <select
                        value={selectedRecord.leaveType || 'paid'}
                        onChange={(e) => setSelectedRecord({
                          ...selectedRecord,
                          leaveType: e.target.value
                        })}
                        className="form-input-AT"
                      >
                        <option value="paid">Nghỉ có lương</option>
                        <option value="unpaid">Nghỉ không lương</option>
                      </select>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group-AT">
                      <label>Số giờ công:</label>
                      <input
                        type="number"
                        value={selectedRecord.workingHours}
                        disabled
                        className="form-input-AT"
                        step="0.5"
                        min="0"
                        max="24"
                      />
                    </div>

                    <div className="form-group-AT">
                      <label>Giờ tăng ca:</label>
                      <input
                        type="number"
                        value={selectedRecord.overtime}
                        onChange={(e) => setSelectedRecord({
                          ...selectedRecord,
                          overtime: parseFloat(e.target.value)
                        })}
                        className="form-input-AT"
                        step="0.5"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Nút đổi nhân viên (khi thêm mới) */}
                  {!selectedRecord.id && (
                    <button
                      className="btn-change-employee"
                      onClick={() => {
                        setSelectedRecord(prev => ({
                          ...prev,
                          employeeId: '',
                          employeeName: '',
                          department: '',
                          position: ''
                        }));
                      }}
                    >
                      <i className="fas fa-exchange-alt"></i>
                      Đổi nhân viên khác
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => {
                setShowEditModal(false);
                setSelectedRecord(null);
              }}>
                Hủy
              </button>
              <button
                className="btn-save"
                onClick={selectedRecord?.id ? handleSaveEdit : handleAddAttendance}
                disabled={!selectedRecord?.employeeId}
              >
                {selectedRecord?.id ? 'Lưu thay đổi' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;