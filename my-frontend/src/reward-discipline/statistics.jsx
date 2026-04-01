import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users,
  Award,
  AlertTriangle,
  Calendar,
  Building
} from 'lucide-react';

import "./statistics.css";

const StatisticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [department, setDepartment] = useState('all');
  const [chartType, setChartType] = useState('bar');

  // Dữ liệu thống kê mẫu
  const [stats, setStats] = useState({
    summary: {
      totalRewards: 156,
      totalDisciplines: 45,
      totalEmployees: 1200,
      rewardRate: 13,
      disciplineRate: 3.75
    },
    byDepartment: [
      { name: 'Kinh doanh', rewards: 45, disciplines: 8 },
      { name: 'Kỹ thuật', rewards: 38, disciplines: 5 },
      { name: 'Nhân sự', rewards: 25, disciplines: 3 },
      { name: 'Hành chính', rewards: 22, disciplines: 4 },
      { name: 'Kế toán', rewards: 18, disciplines: 2 },
    ],
    monthlyData: [
      { month: '1/2024', rewards: 12, disciplines: 3 },
      { month: '2/2024', rewards: 15, disciplines: 2 },
      { month: '3/2024', rewards: 18, disciplines: 5 },
      { month: '4/2024', rewards: 14, disciplines: 4 },
      { month: '5/2024', rewards: 16, disciplines: 3 },
      { month: '6/2024', rewards: 20, disciplines: 6 },
    ],
    topEmployees: [
      { name: 'Nguyễn Văn A', department: 'Kinh doanh', rewards: 5, disciplines: 0 },
      { name: 'Trần Thị B', department: 'Kỹ thuật', rewards: 4, disciplines: 0 },
      { name: 'Lê Văn C', department: 'Nhân sự', rewards: 4, disciplines: 1 },
      { name: 'Phạm Thị D', department: 'Hành chính', rewards: 3, disciplines: 0 },
      { name: 'Hoàng Văn E', department: 'Kế toán', rewards: 3, disciplines: 0 },
    ],
    rewardTypes: [
      { type: 'Bằng khen', count: 45, percentage: 28.8 },
      { type: 'Tiền thưởng', count: 68, percentage: 43.6 },
      { type: 'Giấy khen', count: 32, percentage: 20.5 },
      { type: 'Kỷ niệm chương', count: 11, percentage: 7.1 },
    ],
    disciplineTypes: [
      { type: 'Khiển trách', count: 18, percentage: 40 },
      { type: 'Cảnh cáo', count: 15, percentage: 33.3 },
      { type: 'Hạ bậc lương', count: 8, percentage: 17.8 },
      { type: 'Buộc thôi việc', count: 4, percentage: 8.9 },
    ]
  });

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    // Gọi API lấy dữ liệu theo khoảng thời gian
    console.log('Fetching data for time range:', range);
  };

  const handleExportReport = () => {
    console.log('Exporting statistics report');
    // Logic export PDF/Excel
  };

  if (loading) {
    return (
      <div className="statistics-page loading-state">
        <div className="loading-spinner"></div>
        <p>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="statistics-page">
  <div className="statistics-header-st">
    <h1 className="page-title">
      <BarChart3 className="icon" />
      Thống kê Khen thưởng - Kỷ luật
    </h1>
    <div className="header-actions">
      <div className="time-range-selector-st">
        <button 
          className={`time-btn-st ${timeRange === 'week' ? 'active' : ''}`}
          onClick={() => handleTimeRangeChange('week')}
        >
          Tuần
        </button>
        <button 
          className={`time-btn-st ${timeRange === 'month' ? 'active' : ''}`}
          onClick={() => handleTimeRangeChange('month')}
        >
          Tháng
        </button>
        <button 
          className={`time-btn-st ${timeRange === 'quarter' ? 'active' : ''}`}
          onClick={() => handleTimeRangeChange('quarter')}
        >
          Quý
        </button>
        <button 
          className={`time-btn-st ${timeRange === 'year' ? 'active' : ''}`}
          onClick={() => handleTimeRangeChange('year')}
        >
          Năm
        </button>
      </div>
      <button className="btn-st btn-primary-st" onClick={handleExportReport}>
        <Download size={18} />
        Xuất báo cáo
      </button>
    </div>
  </div>

  <div className="statistics-filters-st">
    <div className="filter-group">
      <div className="filter-item">
        <label>Phòng ban:</label>
        <select 
          className="filter-select-st"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="all">Tất cả phòng ban</option>
          <option value="sales">Kinh doanh</option>
          <option value="tech">Kỹ thuật</option>
          <option value="hr">Nhân sự</option>
          <option value="admin">Hành chính</option>
          <option value="accounting">Kế toán</option>
        </select>
      </div>

      <div className="filter-item">
        <label>Loại biểu đồ:</label>
        <div className="chart-type-selector-st">
          <button 
            className={`chart-btn-st ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title="Biểu đồ cột"
          >
            <BarChart3 size={20} />
          </button>
          <button 
            className={`chart-btn-st ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title="Biểu đồ tròn"
          >
            <PieChart size={20} />
          </button>
          <button 
            className={`chart-btn-st ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
            title="Biểu đồ đường"
          >
            <TrendingUp size={20} />
          </button>
        </div>
      </div>

      <button className="btn-st btn-filter-st">
        <Filter size={18} />
        Áp dụng
      </button>
    </div>
  </div>

  <div className="statistics-content">
    {/* Summary Cards */}
    <div className="summary-cards-grid-st">
      <div className="stat-card-st total-rewards-st">
        <div className="card-icon">
          <Award />
        </div>
        <div className="card-content">
          <h3>Tổng khen thưởng</h3>
          <p className="card-value">{stats.summary.totalRewards}</p>
          <p className="card-subtext">
            <TrendingUp size={14} />
            {stats.summary.rewardRate}% so với tháng trước
          </p>
        </div>
      </div>

      <div className="stat-card-st total-disciplines-st">
        <div className="card-icon">
          <AlertTriangle />
        </div>
        <div className="card-content">
          <h3>Tổng kỷ luật</h3>
          <p className="card-value">{stats.summary.totalDisciplines}</p>
          <p className="card-subtext">
            <TrendingUp size={14} />
            {stats.summary.disciplineRate}% so với tháng trước
          </p>
        </div>
      </div>

      <div className="stat-card-st total-employees-st">
        <div className="card-icon">
          <Users />
        </div>
        <div className="card-content">
          <h3>Tổng nhân viên</h3>
          <p className="card-value">{stats.summary.totalEmployees}</p>
          <p className="card-subtext">Tổng số nhân viên công ty</p>
        </div>
      </div>

      <div className="stat-card-st reward-rate-st">
        <div className="card-icon">
          <BarChart3 />
        </div>
        <div className="card-content">
          <h3>Tỷ lệ khen thưởng</h3>
          <p className="card-value">{stats.summary.rewardRate}%</p>
          <p className="card-subtext">Số NV được khen / Tổng số NV</p>
        </div>
      </div>
    </div>

    {/* Charts Section */}
    <div className="charts-section-st">
      <div className="chart-container-st">
        <div className="chart-header-st">
          <h3>
            <BarChart3 size={20} />
            Khen thưởng & Kỷ luật theo phòng ban
          </h3>
          <select className="chart-select-st">
            <option>Biểu đồ cột</option>
            <option>Biểu đồ đường</option>
          </select>
        </div>
        <div className="chart-placeholder-st">
          <div className="mock-chart-st">
            {stats.byDepartment.map((dept, index) => (
              <div key={dept.name} className="mock-bar-container-st">
                <div className="mock-bar-label-st">{dept.name}</div>
                <div className="mock-bars-st">
                  <div 
                    className="mock-bar-st reward-bar-st" 
                    style={{ height: `${dept.rewards * 3}px` }}
                    title={`Khen thưởng: ${dept.rewards}`}
                  >
                    <span>{dept.rewards}</span>
                  </div>
                  <div 
                    className="mock-bar-st discipline-bar-st" 
                    style={{ height: `${dept.disciplines * 3}px` }}
                    title={`Kỷ luật: ${dept.disciplines}`}
                  >
                    <span>{dept.disciplines}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-container-st">
        <div className="chart-header-st">
          <h3>
            <PieChart size={20} />
            Phân loại khen thưởng
          </h3>
        </div>
        <div className="chart-placeholder-st pie-chart-st">
          <div className="pie-chart-mock-st">
            {stats.rewardTypes.map((type, index) => (
              <div 
                key={type.type}
                className="pie-slice-st"
                style={{
                  backgroundColor: `hsl(${index * 90}, 70%, 65%)`,
                  transform: `rotate(${index * 90}deg)`
                }}
                title={`${type.type}: ${type.count} (${type.percentage}%)`}
              >
                <span className="slice-label-st">{type.type}</span>
              </div>
            ))}
          </div>
          <div className="pie-legend-st">
            {stats.rewardTypes.map(type => (
              <div key={type.type} className="legend-item-st">
                <div className="legend-color-st"></div>
                <span>{type.type}: {type.count} ({type.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Tables Section */}
    <div className="tables-section-st">
      <div className="table-container-st">
        <div className="table-header-st">
          <h3>
            <Users size={20} />
            Top nhân viên được khen thưởng
          </h3>
        </div>
        <table className="stats-table-st">
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên nhân viên</th>
              <th>Phòng ban</th>
              <th>Số lần khen thưởng</th>
              <th>Số lần kỷ luật</th>
              <th>Điểm đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {stats.topEmployees.map((employee, index) => (
              <tr key={employee.name}>
                <td>{index + 1}</td>
                <td>{employee.name}</td>
                <td>{employee.department}</td>
                <td>
                  <span className="reward-count-st">{employee.rewards}</span>
                </td>
                <td>
                  <span className={`discipline-count-st ${employee.disciplines > 0 ? 'has-discipline-st' : ''}`}>
                    {employee.disciplines}
                  </span>
                </td>
                <td>
                  <span className="rating-score-st">
                    {employee.rewards * 10 - employee.disciplines * 5}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-container-st">
        <div className="table-header-st">
          <h3>
            <Calendar size={20} />
            Diễn biến theo tháng
          </h3>
        </div>
        <table className="stats-table-st">
          <thead>
            <tr>
              <th>Tháng</th>
              <th>Số khen thưởng</th>
              <th>Số kỷ luật</th>
              <th>Tỷ lệ khen thưởng</th>
              <th>Tỷ lệ kỷ luật</th>
              <th>Xu hướng</th>
            </tr>
          </thead>
          <tbody>
            {stats.monthlyData.map((data, index) => {
              const rewardRate = ((data.rewards / stats.summary.totalEmployees) * 100).toFixed(2);
              const disciplineRate = ((data.disciplines / stats.summary.totalEmployees) * 100).toFixed(2);
              const trend = index > 0 ? 
                ((data.rewards - stats.monthlyData[index-1].rewards) > 0 ? 'up' : 'down') : 'stable';
              
              return (
                <tr key={data.month}>
                  <td>{data.month}</td>
                  <td>{data.rewards}</td>
                  <td>{data.disciplines}</td>
                  <td>{rewardRate}%</td>
                  <td>{disciplineRate}%</td>
                  <td>
                    <span className={`trend-indicator-st trend-${trend}-st`}>
                      {trend === 'up' ? '↗ Tăng' : trend === 'down' ? '↘ Giảm' : '→ Ổn định'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Insights Section */}
    <div className="insights-section-st">
      <div className="insight-card-st">
        <h3>📊 Phân tích & Nhận định</h3>
        <ul className="insights-list-st">
          <li className="insight-positive-st">
            <strong>Điểm tích cực:</strong> Tỷ lệ khen thưởng đang tăng ổn định qua các tháng
          </li>
          <li className="insight-warning-st">
            <strong>Cần lưu ý:</strong> Phòng Kinh doanh có tỷ lệ kỷ luật cao nhất
          </li>
          <li className="insight-info-st">
            <strong>Xu hướng:</strong> Hình thức khen thưởng bằng tiền chiếm tỷ lệ cao nhất (43.6%)
          </li>
          <li className="insight-suggestion-st">
            <strong>Đề xuất:</strong> Cần tăng cường các hình thức khen thưởng phi vật chất
          </li>
        </ul>
      </div>

      <div className="insight-card-st">
        <h3>🎯 Mục tiêu tháng tới</h3>
        <div className="goals-list-st">
          <div className="goal-item-st">
            <div className="goal-progress-st">
              <div className="progress-bar" style={{ width: '75%' }}></div>
            </div>
            <span>Giảm tỷ lệ kỷ luật xuống dưới 3%</span>
          </div>
          <div className="goal-item-st">
            <div className="goal-progress-st">
              <div className="progress-bar" style={{ width: '60%' }}></div>
            </div>
            <span>Tăng khen thưởng lên 15% tổng số nhân viên</span>
          </div>
          <div className="goal-item-st">
            <div className="goal-progress-st">
              <div className="progress-bar" style={{ width: '40%' }}></div>
            </div>
            <span>Áp dụng 100% quy chế mới cho tất cả phòng ban</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  );
};

export default StatisticsPage;