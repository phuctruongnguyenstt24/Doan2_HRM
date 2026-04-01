import React, { useState, useEffect } from 'react';
import {
  FaUsers,
  FaPlane,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus
} from 'react-icons/fa';
import './BusinessTrip.css';

const BusinessTripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: 'all',
    status: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance/departments`, { headers });
      const data = await response.json();
      if (data.success) {
        setDepartments([
          { id: 'all', name: 'Tất cả phòng ban' },
          ...data.data.map(dept => ({ id: dept._id, name: dept.name }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/users-permissions/users?limit=100`, { headers });
      const data = await response.json();
      const users = data.users || data;
      if (Array.isArray(users)) {
        setEmployees(users.map(user => ({
          id: user._id || user.id,
          employeeId: user.employeeId || user._id,
          name: user.fullName || user.name || 'N/A',
          department: user.department?.name || 'Chưa có'
        })));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch business trips
  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.department !== 'all' && { department: filters.department }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`${API_URL}/business-trips/admin/business-trips?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setTrips(data.data);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems
        }));
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Không thể tải dữ liệu công tác');
    } finally {
      setLoading(false);
    }
  };

  // Add new trip
  const handleAddTrip = async (formData) => {
    try {
      const response = await fetch(`${API_URL}/business-trips/admin/business-trips`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchTrips();
        alert('✅ Thêm công tác thành công!');
      } else {
        alert(data.message || '❌ Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error adding trip:', error);
      alert('❌ Có lỗi xảy ra');
    }
  };

  // Update trip
  const handleUpdateTrip = async (id, formData) => {
    try {
      const response = await fetch(`${API_URL}/business-trips/admin/business-trips/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchTrips();
        alert('✅ Cập nhật thành công!');
      } else {
        alert(data.message || '❌ Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('❌ Có lỗi xảy ra');
    }
  };

  // Approve/Reject trip
  const handleApprove = async (id, status, approvalNote = '') => {
    if (!window.confirm(`Bạn có chắc muốn ${status === 'approved' ? 'phê duyệt' : 'từ chối'} công tác này?`)) return;
    try {
      const response = await fetch(`${API_URL}/business-trips/admin/business-trips/${id}/approve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, approvalNote })
      });
      const data = await response.json();
      if (data.success) {
        fetchTrips();
        alert(`✅ ${status === 'approved' ? 'Phê duyệt' : 'Từ chối'} thành công!`);
      }
    } catch (error) {
      console.error('Error approving trip:', error);
      alert('❌ Có lỗi xảy ra');
    }
  };

  // Delete trip
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa công tác này?')) return;
    try {
      const response = await fetch(`${API_URL}/business-trips/admin/business-trips/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();
      if (data.success) {
        fetchTrips();
        alert('✅ Xóa thành công!');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('❌ Có lỗi xảy ra');
    }
  };

  // Add expense
  const handleAddExpense = async (id, expense) => {
    try {
      const response = await fetch(`${API_URL}/business-trips/admin/business-trips/${id}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(expense)
      });
      const data = await response.json();
      if (data.success) {
        setShowExpenseModal(false);
        fetchTrips();
        alert('✅ Thêm chi phí thành công!');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('❌ Có lỗi xảy ra');
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [filters, pagination.currentPage]);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', text: 'Chờ duyệt', icon: <FaClock /> },
      approved: { class: 'status-approved', text: 'Đã duyệt', icon: <FaCheckCircle /> },
      rejected: { class: 'status-rejected', text: 'Từ chối', icon: <FaTimesCircle /> },
      completed: { class: 'status-completed', text: 'Hoàn thành', icon: <FaCheckCircle /> }
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`status-badge ${s.class}`}>{s.icon} {s.text}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const statistics = {
    total: trips.length,
    pending: trips.filter(t => t.status === 'pending').length,
    approved: trips.filter(t => t.status === 'approved').length,
    completed: trips.filter(t => t.status === 'completed').length,
    totalExpense: trips.reduce((sum, t) => sum + (t.totalExpense || 0), 0)
  };

  return (
    <div className="business-trip-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản Lý Công Tác</h1>
        <div className="header-actions">
          <button className="btn-add" onClick={() => { setSelectedTrip(null); setShowModal(true); }}>
            <FaPlus /> Thêm công tác
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <FaTimesCircle /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-group">
          <label>Từ ngày:</label>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value, currentPage: 1 })} />
        </div>
        <div className="filter-group">
          <label>Đến ngày:</label>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value, currentPage: 1 })} />
        </div>
        <div className="filter-group">
          <label>Phòng ban:</label>
          <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value, currentPage: 1 })}>
            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, currentPage: 1 })}>
            <option value="all">Tất cả</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Từ chối</option>
            <option value="completed">Hoàn thành</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Tìm kiếm:</label>
          <input type="text" placeholder="Tiêu đề, địa điểm..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, currentPage: 1 })} />
        </div>
        <button className="btn-search" onClick={fetchTrips}>Tìm kiếm</button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card total"><div className="stat-icon"><FaUsers /></div><div className="stat-info"><span>Tổng số</span><strong>{statistics.total}</strong></div></div>
        <div className="stat-card pending"><div className="stat-icon"><FaClock /></div><div className="stat-info"><span>Chờ duyệt</span><strong>{statistics.pending}</strong></div></div>
        <div className="stat-card approved"><div className="stat-icon"><FaCheckCircle /></div><div className="stat-info"><span>Đã duyệt</span><strong>{statistics.approved}</strong></div></div>
        <div className="stat-card completed"><div className="stat-icon"><FaPlane /></div><div className="stat-info"><span>Hoàn thành</span><strong>{statistics.completed}</strong></div></div>
        <div className="stat-card expense"><div className="stat-icon"><FaMoneyBillWave /></div><div className="stat-info"><span>Tổng chi phí</span><strong>{formatCurrency(statistics.totalExpense)}</strong></div></div>
      </div>

      {/* Loading */}
      {loading && <div className="loading"><FaClock className="fa-spin" /> Đang tải...</div>}

      {/* Table */}
      {!loading && (
        <>
          <div className="business-trip-table">
            <table>
              <thead>
                <tr>
                  <th>Mã NV</th>
                  <th>Họ tên</th>
                  <th>Phòng ban</th>
                  <th>Tiêu đề</th>
                  <th>Thời gian</th>
                  <th>Địa điểm</th>
                  <th>Trạng thái</th>
                  <th>Chi phí</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan="9" className="text-center">Không có dữ liệu công tác</td></tr>
                ) : (
                  trips.map(trip => (
                    <tr key={trip._id}>
                      <td>{trip.employeeId}</td>
                      <td>{trip.employeeName}</td>
                      <td>{trip.department}</td>
                      <td className="title-cell">{trip.title}</td>
                      <td className="date-cell">
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}<br/>
                        <small>{trip.startTime} - {trip.endTime}</small>
                      </td>
                      <td>{trip.location}</td>
                      <td>{getStatusBadge(trip.status)}</td>
                      <td className="expense-cell">{formatCurrency(trip.totalExpense)}</td>
                      <td className="actions-cell">
                        <button className="btn-edit" onClick={() => { setSelectedTrip(trip); setShowModal(true); }} title="Sửa"><FaEdit /></button>
                        <button className="btn-delete" onClick={() => handleDelete(trip._id)} title="Xóa"><FaTrash /></button>
                        {trip.status === 'pending' && (
                          <>
                            <button className="btn-approve" onClick={() => handleApprove(trip._id, 'approved')} title="Duyệt"><FaCheckCircle /></button>
                            <button className="btn-reject" onClick={() => handleApprove(trip._id, 'rejected')} title="Từ chối"><FaTimesCircle /></button>
                          </>
                        )}
                        <button className="btn-expense" onClick={() => { setSelectedTrip(trip); setShowExpenseModal(true); }} title="Chi phí"><FaMoneyBillWave /></button>
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
              <button onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })} disabled={pagination.currentPage === 1}>‹</button>
              <span>Trang {pagination.currentPage} / {pagination.totalPages}</span>
              <button onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })} disabled={pagination.currentPage === pagination.totalPages}>›</button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <BusinessTripModal
          trip={selectedTrip}
          employees={employees}
          onClose={() => setShowModal(false)}
          onSave={(data) => selectedTrip ? handleUpdateTrip(selectedTrip._id, data) : handleAddTrip(data)}
        />
      )}

      {/* Expense Modal */}
      {showExpenseModal && selectedTrip && (
        <ExpenseModal
          trip={selectedTrip}
          onClose={() => setShowExpenseModal(false)}
          onSave={(expense) => handleAddExpense(selectedTrip._id, expense)}
        />
      )}
    </div>
  );
};

// Modal Component
const BusinessTripModal = ({ trip, employees, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    employeeId: trip?.employeeId || '',
    title: trip?.title || '',
    startDate: trip?.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: trip?.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    startTime: trip?.startTime || '08:00',
    endTime: trip?.endTime || '17:00',
    location: trip?.location || '',
    purpose: trip?.purpose || '',
    notes: trip?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay-BT" onClick={onClose}>
      <div className="modal-content-BT" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-BT">
          <h2>{trip ? 'Chỉnh sửa công tác' : 'Thêm công tác mới'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body-BT">
            <div className="form-group-BT">
              <label>Nhân viên:</label>
              <select value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} required>
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(emp => <option key={emp.id} value={emp.employeeId}>{emp.employeeId} - {emp.name}</option>)}
              </select>
            </div>
            <div className="form-group-BT">
              <label>Tiêu đề công tác:</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group-BT">
                <label>Từ ngày:</label>
                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
              </div>
              <div className="form-group-BT">
                <label>Đến ngày:</label>
                <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group-BT">
                <label>Giờ bắt đầu:</label>
                <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div className="form-group-BT">
                <label>Giờ kết thúc:</label>
                <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
              </div>
            </div>
            <div className="form-group-BT">
              <label>Địa điểm:</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
            </div>
            <div className="form-group-BT">
              <label>Mục đích:</label>
              <textarea value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} rows="3" required />
            </div>
            <div className="form-group-BT">
              <label>Ghi chú:</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows="2" />
            </div>
          </div>
          <div className="modal-footer-BT">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save">{trip ? 'Cập nhật' : 'Thêm mới'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Expense Modal
const ExpenseModal = ({ trip, onClose, onSave }) => {
  const [expense, setExpense] = useState({
    type: 'transport',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(expense);
  };

  const expenseTypes = {
    transport: 'Di chuyển',
    accommodation: 'Lưu trú',
    meal: 'Ăn uống',
    other: 'Khác'
  };

  return (
    <div className="modal-overlay-BT" onClick={onClose}>
      <div className="modal-content-BT modal-small-BT" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-BT">
          <h2>Thêm chi phí - {trip.title}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body-BT">
            <div className="form-group-BT">
              <label>Loại chi phí:</label>
              <select value={expense.type} onChange={(e) => setExpense({ ...expense, type: e.target.value })}>
                {Object.entries(expenseTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="form-group-BT">
              <label>Số tiền:</label>
              <input type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: parseFloat(e.target.value) })} required />
            </div>
            <div className="form-group-BT">
              <label>Ngày:</label>
              <input type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} required />
            </div>
            <div className="form-group-BT">
              <label>Mô tả:</label>
              <textarea value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} rows="2" />
            </div>
          </div>
          <div className="modal-footer-BT">
            <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-save">Thêm chi phí</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessTripManagement;