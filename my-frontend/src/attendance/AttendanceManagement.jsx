import React, { useState, useEffect, useCallback } from 'react';
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Helper function để fetch API
const fetchAPI = useCallback(async (endpoint, options = {}) => {
  try {
    // Lấy token từ cả localStorage và sessionStorage
    let token = localStorage.getItem('token');
    if (!token) {
      token = sessionStorage.getItem('token');
    }
    
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
      // Xóa token từ cả hai nơi
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
      throw new Error('Unauthorized');
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
}, [API_URL]);

  // Dữ liệu mẫu
  const getSampleEmployees = useCallback(() => {
    return [
      {
        id: '1',
        employeeId: 'GV001',
        name: 'Nguyễn Văn A',
        department: 'Khoa Công Nghệ Thông Tin',
        position: 'Giảng viên',
        hourlyRate: 150000
      },
      {
        id: '2',
        employeeId: 'NV001',
        name: 'Trần Thị B',
        department: 'Phòng Đào Tạo',
        position: 'Nhân viên',
        hourlyRate: 80000
      },
      {
        id: '3',
        employeeId: 'GV002',
        name: 'Lê Văn C',
        department: 'Khoa Kinh Tế',
        position: 'Giảng viên',
        hourlyRate: 150000
      }
    ];
  }, []);

  // Lấy danh sách phòng ban
  const fetchDepartments = useCallback(async () => {
    try {
      const data = await fetchAPI('/departments');
      if (data.success && data.data) {
        setDepartments([
          { id: 'all', name: 'Tất cả phòng ban' },
          ...data.data.map(dept => ({
            id: dept._id,
            name: dept.name
          }))
        ]);
      } else {
        // Fallback data
        setDepartments([
          { id: 'all', name: 'Tất cả phòng ban' },
          { id: '1', name: 'Khoa Công Nghệ Thông Tin' },
          { id: '2', name: 'Khoa Kinh Tế' },
          { id: '3', name: 'Phòng Đào Tạo' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([
        { id: 'all', name: 'Tất cả phòng ban' },
        { id: '1', name: 'Khoa Công Nghệ Thông Tin' },
        { id: '2', name: 'Khoa Kinh Tế' },
        { id: '3', name: 'Phòng Đào Tạo' }
      ]);
    }
  }, [fetchAPI]);

  // Lấy danh sách nhân viên
  const fetchEmployees = useCallback(async () => {
    try {
      const data = await fetchAPI('/users-permissions/users?limit=100');
      
      let users = [];
      if (data.users && Array.isArray(data.users)) {
        users = data.users;
      } else if (Array.isArray(data)) {
        users = data;
      } else if (data.data && Array.isArray(data.data)) {
        users = data.data;
      }
      
      if (users.length === 0) {
        setEmployees(getSampleEmployees());
        return;
      }

      const formattedEmployees = users.map(user => ({
        id: user._id || user.id,
        employeeId: user.employeeId || user.code || user._id,
        name: user.fullName || user.name || 'Không có tên',
        department: user.department?.name || user.department || 'Chưa có',
        position: user.position || 'Nhân viên',
        hourlyRate: user.hourlyRate || 80000
      }));

      setEmployees(formattedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees(getSampleEmployees());
    }
  }, [fetchAPI, getSampleEmployees]);

  // Lấy dữ liệu chấm công
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const pageNum = pagination.currentPage;
      const limitNum = pagination.limit;
      
      const params = new URLSearchParams({
        page: pageNum,
        limit: limitNum,
        startDate: selectedDate,
        endDate: selectedDate,
        ...(selectedDepartment !== 'all' && { department: selectedDepartment }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const data = await fetchAPI(`/attendance/admin/attendance?${params}`);
      
      if (data.success && data.data) {
        const formattedData = data.data.map(record => ({
          id: record._id,
          employeeId: record.employeeId || record.userId?.employeeId,
          employeeName: record.userId?.fullName || record.userId?.name || record.employeeName || 'N/A',
          department: record.departmentName || record.userId?.department?.name || 'Chưa có',
          position: record.userId?.position || 'Nhân viên',
          date: record.date?.split('T')[0] || selectedDate,
          checkIn: record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : (record.checkIn || null),
          checkOut: record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : (record.checkOut || null),
          status: record.status || 'absent',
          workingHours: record.workingHours || 0,
          overtime: record.overtime || 0,
          leaveType: record.leaveType
        }));

        setAttendanceData(formattedData);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.totalItems || 0
        }));
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
      setError('Không thể tải dữ liệu chấm công');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDepartment, filterStatus, pagination.currentPage, pagination.limit, fetchAPI]);

  // Thêm chấm công mới
  const handleAddAttendance = async () => {
    if (!selectedRecord?.employeeId) {
      alert('Vui lòng chọn nhân viên');
      return;
    }

    const employee = employees.find(emp => emp.employeeId === selectedRecord.employeeId);

    if (!employee) {
      alert('Không tìm thấy thông tin nhân viên');
      return;
    }

    try {
      const checkInTime = selectedRecord.checkIn || '08:00';
      const checkOutTime = selectedRecord.checkOut || '17:00';

      const payload = {
        userId: employee.id || employee.employeeId,
        employeeId: selectedRecord.employeeId,
        date: selectedDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: selectedRecord.status,
        leaveType: selectedRecord.leaveType || null,
        workingHours: parseFloat(selectedRecord.workingHours) || 0,
        overtime: parseFloat(selectedRecord.overtime) || 0,
        notes: ''
      };

      const data = await fetchAPI('/attendance/admin/attendance', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        await fetchAttendance();
        alert('Thêm chấm công thành công!');
      } else {
        alert(data.message || 'Thêm thất bại');
      }
    } catch (error) {
      console.error('Error adding attendance:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  // Cập nhật chấm công
  const handleSaveEdit = async () => {
    if (!selectedRecord?.id || selectedRecord.id.toString().startsWith('temp-')) {
      alert('ID không hợp lệ');
      return;
    }

    try {
      const updateData = {
        checkIn: selectedRecord.checkIn || '08:00',
        checkOut: selectedRecord.checkOut || '17:00',
        status: selectedRecord.status,
        leaveType: selectedRecord.leaveType || null,
        workingHours: parseFloat(selectedRecord.workingHours) || 0,
        overtime: parseFloat(selectedRecord.overtime) || 0
      };

      const data = await fetchAPI(`/attendance/admin/attendance/${selectedRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (data.success) {
        setShowEditModal(false);
        setSelectedRecord(null);
        await fetchAttendance();
        alert('Cập nhật thành công!');
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  // Xóa chấm công
  const handleDelete = async (id) => {
    if (!id || id.toString().startsWith('temp-')) {
      alert('Không thể xóa bản ghi này');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa bản ghi này?')) return;

    try {
      const data = await fetchAPI(`/attendance/admin/attendance/${id}`, {
        method: 'DELETE'
      });

      if (data.success) {
        await fetchAttendance();
        alert('Xóa thành công!');
      } else {
        alert(data.message || 'Xóa thất bại');
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      alert('Có lỗi xảy ra: ' + error.message);
    }
  };

  // Xử lý chỉnh sửa
  const handleEdit = (record) => {
    if (record.id && !record.id.toString().startsWith('temp-')) {
      setSelectedRecord(record);
      setShowEditModal(true);
    } else {
      alert('Không thể chỉnh sửa bản ghi tạm thời');
    }
  };

  // Xử lý thêm mới
  const handleAddClick = () => {
    const newRecord = {
      employeeId: '',
      employeeName: '',
      department: '',
      position: '',
      date: selectedDate,
      checkIn: '08:00',
      checkOut: '17:00',
      status: 'present',
      workingHours: 8,
      overtime: 0,
      leaveType: null
    };
    setSelectedRecord(newRecord);
    setShowEditModal(true);
  };

  // Tính lương
  const calculateSalary = useCallback((record) => {
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
  }, [employees]);

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

  // Chuyển trang
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  // Load initial data
  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, [fetchDepartments, fetchEmployees]);

  // Load attendance when filters change
  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedDepartment, filterStatus, pagination.currentPage, fetchAttendance]);

  return (
    <div className="time-tracking-container">
      {/* Header */}
      <div className="page-header-AT">
        <h1>Quản Lý Chấm Công</h1>
        <div className="header-actions-AT">
          <button className="btn-add" onClick={handleAddClick}>
            <i className="fas fa-plus"></i>
            Thêm chấm công
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Filters */}
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
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
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

      {/* Statistics Cards */}
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

      {/* Attendance Table */}
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

          {/* Pagination */}
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

      {/* Edit/Add Modal */}
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
              {!selectedRecord?.employeeId ? (
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
              ) : (
                <>
                  <div className="form-group-AT">
                    <label>Mã nhân viên:</label>
                    <input
                      type="text"
                      value={selectedRecord.employeeId || ""}
                      disabled
                      className="form-input-AT"
                    />
                  </div>

                  <div className="form-group-AT">
                    <label>Họ tên:</label>
                    <input
                      type="text"
                      value={selectedRecord.employeeName || ""}
                      disabled
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
                        onChange={(e) => setSelectedRecord({
                          ...selectedRecord,
                          workingHours: parseFloat(e.target.value)
                        })}
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