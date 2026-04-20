import React, { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './AttendanceReport.css';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Hàm lấy token từ cả hai nơi
  const getToken = useCallback(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }, []);

  // Hàm xử lý logout khi token hết hạn
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    window.location.href = '/login';
  }, []);

  // Hàm fetch API có xử lý token và 401
  const fetchAPI = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getToken();
      
      if (!token) {
        handleLogout();
        throw new Error('Vui lòng đăng nhập lại');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }, [API_URL, getToken, handleLogout]);

  // Fetch employees với xử lý lỗi
  const fetchEmployees = useCallback(async () => {
    setFetchingEmployees(true);
    setError(null);
    try {
      const data = await fetchAPI('/users-permissions/users');
      
      const users = data.users || data || [];
      
      const formatted = users.map((u) => ({
        id: u._id || u.id,
        employeeId: u.employeeId || u._id,
        name: u.fullName || u.name || 'Không có tên',
        hourlyRate: u.hourlyRate || 80000,
      }));

      setEmployees(formatted);
      
      // Nếu không có dữ liệu, dùng sample data
      if (formatted.length === 0) {
        setEmployees([
          { id: '1', employeeId: 'GV001', name: 'Nguyễn Văn A', hourlyRate: 150000 },
          { id: '2', employeeId: 'NV001', name: 'Trần Thị B', hourlyRate: 80000 },
        ]);
      }
    } catch (err) {
      console.error('Fetch employees error:', err);
      setError('Không thể tải danh sách nhân viên');
      // Fallback data
      setEmployees([
        { id: '1', employeeId: 'GV001', name: 'Nguyễn Văn A', hourlyRate: 150000 },
        { id: '2', employeeId: 'NV001', name: 'Trần Thị B', hourlyRate: 80000 },
      ]);
    } finally {
      setFetchingEmployees(false);
    }
  }, [fetchAPI]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (!startDate || !endDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const data = await fetchAPI(`/attendance/admin/attendance?${params}`);

      if (data.success && data.data) {
        const formatted = data.data.map((r) => ({
          id: r._id,
          employeeId: r.employeeId || r.userId?.employeeId,
          name: r.userId?.fullName || r.userId?.name || r.employeeName || 'N/A',
          date: r.date ? new Date(r.date).toISOString().split('T')[0] : startDate,
          workingHours: r.workingHours || 0,
          overtime: r.overtime || 0,
          status: r.status || 'absent',
          leaveType: r.leaveType,
        }));
        
        setAttendanceData(formatted);
      } else {
        setAttendanceData([]);
        if (data.message) setError(data.message);
      }
    } catch (err) {
      console.error('Fetch report error:', err);
      setError('Không thể tải dữ liệu báo cáo');
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, fetchAPI]);

  // Hàm tính lương (đã fix)
  const calculateSalary = useCallback((record) => {
    const emp = employees.find(
      (e) => e.employeeId === record.employeeId
    );
    
    const hourlyRate = emp?.hourlyRate || 80000;
    let salary = 0;

    if (record.status === 'present' || record.status === 'late') {
      salary = (record.workingHours || 0) * hourlyRate;
      salary += (record.overtime || 0) * hourlyRate * 1.5;
    } else if (record.status === 'leave' && record.leaveType === 'paid') {
      salary = 8 * hourlyRate;
    }

    return salary;
  }, [employees]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  }, []);

  // Get status text in Vietnamese
  const getStatusText = useCallback((status) => {
    const statusMap = {
      'present': 'Có mặt',
      'late': 'Đi muộn',
      'absent': 'Vắng',
      'leave': 'Nghỉ'
    };
    return statusMap[status] || status;
  }, []);

  // Tổng lương
  const totalSalary = attendanceData.reduce(
    (sum, r) => sum + calculateSalary(r),
    0
  );

  // Chart data
  const chartData = {
    labels: ['Có mặt', 'Đi muộn', 'Vắng', 'Nghỉ'],
    datasets: [
      {
        label: 'Số lượng',
        data: [
          attendanceData.filter(r => r.status === 'present').length,
          attendanceData.filter(r => r.status === 'late').length,
          attendanceData.filter(r => r.status === 'absent').length,
          attendanceData.filter(r => r.status === 'leave').length,
        ],
        backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#2196F3'],
        borderRadius: 6
      },
    ],
  };

  // Hàm in báo cáo (đã fix)
  const openReport = useCallback(() => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn ngày bắt đầu và kết thúc!");
      return;
    }

    if (!attendanceData || attendanceData.length === 0) {
      alert('Không có dữ liệu để in!');
      return;
    }

    const printWindow = window.open('', '_blank');
    const htmlContent = generatePrintHTML(attendanceData, startDate, endDate, employees, formatCurrency, getStatusText, calculateSalary);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [attendanceData, startDate, endDate, employees, formatCurrency, getStatusText, calculateSalary]);

  // Hàm xuất Excel (đã fix)
  const handleExport = useCallback(async () => {
    if (!startDate || !endDate) {
      alert("Vui lòng chọn khoảng thời gian!");
      return;
    }

    try {
      setLoading(true);
      
      const token = getToken();
      if (!token) {
        handleLogout();
        return;
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`${API_URL}/attendance/export?${params}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(`Lỗi khi tải file: ${response.status}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = `attendance_report_${startDate}_to_${endDate}.xlsx`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      alert('Xuất file thành công!');
    } catch (err) {
      console.error("Export error:", err);
      alert(`Xuất file thất bại: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, API_URL, getToken, handleLogout]);

  // Load initial data
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Load report when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, fetchReport]);

  // Kiểm tra token khi component mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      handleLogout();
    }
  }, [getToken, handleLogout]);

  return (
    <div className="report-container">
      <h1 className="title-BCCC">Báo Cáo Chấm Công</h1>

      {/* Error message */}
      {error && (
        <div className="error-message" style={{ color: 'red', padding: '10px', margin: '10px 0', background: '#ffebee', borderRadius: '4px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* FILTER */}
      <div className="filter-box">
        <div>
          <label>Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label>Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button onClick={openReport} disabled={loading}>
          {loading ? 'Đang tải...' : 'Xem báo cáo'}
        </button>
        <button onClick={handleExport} disabled={loading || attendanceData.length === 0}>
          {loading ? 'Đang xuất...' : 'Xuất Excel'}
        </button>
      </div>

      {/* SUMMARY */}
      <div className="summary-box">
        <p>Tổng bản ghi: {attendanceData.length}</p>
        <p>Tổng lương: {formatCurrency(totalSalary)}</p>
      </div>

      {/* CHART */}
      {attendanceData.length > 0 && (
        <div className="chart-box">
          <h3>Biểu đồ thống kê chấm công</h3>
          <Bar data={chartData} />
        </div>
      )}

      {/* TABLE */}
      {loading && !attendanceData.length ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tên</th>
              <th>Ngày</th>
              <th>Giờ công</th>
              <th>Tăng ca</th>
              <th>Trạng thái</th>
              <th>Lương</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  Không có dữ liệu chấm công trong khoảng thời gian này
                </td>
              </tr>
            ) : (
              attendanceData.map((r) => (
                <tr key={r.id}>
                  <td>{r.employeeId || '--'}</td>
                  <td>{r.name || '--'}</td>
                  <td>{r.date || '--'}</td>
                  <td>{r.workingHours || 0}h</td>
                  <td>{r.overtime || 0}h</td>
                  <td>
                    <span className={`status-badge ${r.status}`}>
                      {getStatusText(r.status)}
                    </span>
                    {r.leaveType && (
                      <small style={{ marginLeft: '5px' }}>
                        ({r.leaveType === 'paid' ? 'Có lương' : 'Không lương'})
                      </small>
                    )}
                  </td>
                  <td className="salary-cell">{formatCurrency(calculateSalary(r))}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Hàm generatePrintHTML cần được cập nhật để nhận đầy đủ tham số
const generatePrintHTML = (attendanceData, startDate, endDate, employees, formatCurrency, getStatusText, calculateSalary) => {
  const totalSalary = attendanceData.reduce(
    (sum, r) => sum + calculateSalary(r),
    0
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Báo cáo chấm công</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          padding: 20px;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 10px;
        }
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          color: #666;
        }
        .summary {
          margin: 20px 0;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 5px;
        }
        .summary p {
          margin: 5px 0;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #4CAF50;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body {
            margin: 0;
            padding: 10px;
          }
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <h1>BÁO CÁO CHẤM CÔNG</h1>
      <div class="report-header">
        <p>Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')}</p>
        <p>Đến ngày: ${new Date(endDate).toLocaleDateString('vi-VN')}</p>
      </div>
      
      <div class="summary">
        <p><strong>Tổng số bản ghi:</strong> ${attendanceData.length}</p>
        <p><strong>Tổng lương:</strong> ${formatCurrency(totalSalary)}</p>
        <p><strong>Thống kê:</strong></p>
        <p>- Có mặt: ${attendanceData.filter(r => r.status === 'present').length}</p>
        <p>- Đi muộn: ${attendanceData.filter(r => r.status === 'late').length}</p>
        <p>- Vắng: ${attendanceData.filter(r => r.status === 'absent').length}</p>
        <p>- Nghỉ: ${attendanceData.filter(r => r.status === 'leave').length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Mã NV</th>
            <th>Tên nhân viên</th>
            <th>Ngày</th>
            <th>Giờ công</th>
            <th>Tăng ca</th>
            <th>Trạng thái</th>
            <th>Lương</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceData.map((r) => `
            <tr>
              <td>${r.employeeId || ''}</td>
              <td>${r.name || 'Không có tên'}</td>
              <td>${r.date ? new Date(r.date).toLocaleDateString('vi-VN') : ''}</td>
              <td>${r.workingHours || 0}</td>
              <td>${r.overtime || 0}</td>
              <td>${getStatusText(r.status)}</td>
              <td>${formatCurrency(calculateSalary(r))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>Báo cáo được tạo tự động từ hệ thống quản lý nhân sự</p>
        <p>Ngày tạo: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; margin: 10px; cursor: pointer;">In báo cáo</button>
        <button onclick="window.close()" style="padding: 10px 20px; margin: 10px; cursor: pointer;">Đóng</button>
      </div>
    </body>
    </html>
  `;
};

export default AttendanceReport;