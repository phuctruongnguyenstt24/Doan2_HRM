import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);
import './AttendanceReport.css';

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // ================= FETCH =================
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users-permissions/users`, { headers });
      const data = await res.json();

      const users = data.users || data;

      const formatted = users.map((u) => ({
        id: u._id || u.id,
        employeeId: u.employeeId || u._id,
        name: u.fullName || u.name,
        hourlyRate: u.hourlyRate || 80000,
      }));

      setEmployees(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const res = await fetch(
        `${API_URL}/attendance/admin/attendance?${params}`,
        { headers }
      );

      const data = await res.json();

      if (data.success) {
        const formatted = data.data.map((r) => ({
          id: r._id,
          employeeId: r.employeeId,
          name: r.userId?.fullName || r.userId?.name,
          date: new Date(r.date).toISOString().split('T')[0],
          workingHours: r.workingHours || 0,
          overtime: r.overtime || 0,
          status: r.status,
          leaveType: r.leaveType,
        }));

        setAttendanceData(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //Xem báo cáo và in
 const openReport = async () => {
  if (!startDate || !endDate) {
    alert("Vui lòng chọn ngày bắt đầu và kết thúc!");
    return;
  }

  if (!attendanceData || attendanceData.length === 0) {
    alert('Không có dữ liệu để in!');
    return;
  }

  // Debug: kiểm tra dữ liệu
  console.log('Data to print:', attendanceData);

  const printWindow = window.open('', '_blank');
  const htmlContent = generatePrintHTML(attendanceData, startDate, endDate);
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
  };
};

// Hàm tạo HTML cho báo cáo
// Hàm tạo HTML cho báo cáo
const generatePrintHTML = (attendanceData, startDate, endDate) => {
  // Định nghĩa lại các hàm cần thiết trong phạm vi này
  const getStatusText = (status) => {
    const statusMap = {
      'present': 'Có mặt',
      'late': 'Đi muộn',
      'absent': 'Vắng',
      'leave': 'Nghỉ'
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const calculateSalary = (record) => {
    
    const hourlyRate = 80000; // Lấy từ state hoặc truyền vào
    
    let salary = 0;
    
    if (record.status === 'present' || record.status === 'late') {
      salary = record.workingHours * hourlyRate;
      salary += record.overtime * hourlyRate * 1.5;
    }
    
    if (record.status === 'leave' && record.leaveType === 'paid') {
      salary = 8 * hourlyRate;
    }
    
    return salary;
  };

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

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  // ================= LOGIC =================
  const calculateSalary = (record) => {
    const emp = employees.find(
      (e) => e.employeeId === record.employeeId
    );
    if (!emp) return 0;

    let salary = 0;

    if (record.status === 'present' || record.status === 'late') {
      salary = record.workingHours * emp.hourlyRate;
      salary += record.overtime * emp.hourlyRate * 1.5;
    }

    if (record.status === 'leave' && record.leaveType === 'paid') {
      salary = 8 * emp.hourlyRate;
    }

    return salary;
  };

  const totalSalary = attendanceData.reduce(
    (sum, r) => sum + calculateSalary(r),
    0
  );
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
     // 👇 MÀU CỘT
      backgroundColor: [
        '#4CAF50', // xanh lá - có mặt
        '#FFC107', // vàng - đi muộn
        '#F44336', // đỏ - vắng
        '#2196F3'  // xanh dương - nghỉ
      ],

      borderRadius: 6

      },
    ],
  };
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);

  // ================= EXPORT =================
 const handleExport = async () => {
  if (!startDate || !endDate) {
    alert("Vui lòng chọn khoảng thời gian!");
    return;
  }

  try {
    setLoading(true);

    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    const res = await fetch(
      `${API_URL}/attendance/export?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // ❗ Check lỗi HTTP
    if (!res.ok) {
      throw new Error("Lỗi khi tải file Excel");
    }

    // 👉 Lấy tên file từ header (nếu backend có gửi)
    const contentDisposition = res.headers.get("Content-Disposition");
    let fileName = "attendance_report.xlsx";

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match?.[1]) {
        fileName = decodeURIComponent(match[1]);
      }
    }

    const blob = await res.blob();

    // 👉 Tạo link download
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Xuất file thất bại!");
  } finally {
    setLoading(false);
  }
};
  // ================= UI =================
  return (
    <div className="report-container">
      <h1 className="title-BCCC">Báo Cáo Chấm Công</h1>

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

        <button onClick={openReport}>Xem báo cáo</button>
        <button onClick={handleExport}>Xuất Excel</button>
      </div>

      {/* SUMMARY */}
      <div className="summary-box">
        <p>Tổng bản ghi: {attendanceData.length}</p>
        <p>Tổng lương: {formatCurrency(totalSalary)}</p>
      </div>

      <div className="chart-box">
        <h3>Biểu đồ thống kê chấm công</h3>
        <Bar data={chartData} />
      </div>
      {/* TABLE */}
      {loading ? (
        <p>Đang tải...</p>
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
            {attendanceData.map((r) => (
              <tr key={r.id}>
                <td>{r.employeeId}</td>
                <td>{r.name}</td>
                <td>{r.date}</td>
                <td>{r.workingHours}</td>
                <td>{r.overtime}</td>
                <td>{r.status}</td>
                <td>{formatCurrency(calculateSalary(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttendanceReport;