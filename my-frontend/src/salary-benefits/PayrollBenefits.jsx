import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Space, Modal, Form, Input, Select, 
  DatePicker, Tag, message, Tooltip, Row, Col, Statistic,
  Tabs, Descriptions, Badge, Progress, Steps, Alert
} from 'antd';
import {
  DollarOutlined, GiftOutlined, CalculatorOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  DownloadOutlined, PrinterOutlined, FileTextOutlined,
  TeamOutlined, UserOutlined, BankOutlined
} from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import './PayrollBenefits.css';

const { Option } = Select;
const { TabPane } = Tabs;
const { Step } = Steps;

const PayrollBenefits = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(moment().month() + 1);
  const [year, setYear] = useState(moment().year());
  const [payrollList, setPayrollList] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [config, setConfig] = useState(null);
  const [summary, setSummary] = useState(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  // Fetch danh sách nhân viên
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách nhân viên');
    }
  };

  // Fetch danh sách bảng lương
  const fetchPayrolls = async (params = {}) => {
    try {
      const queryParams = {
        month,
        year,
        ...params
      };
      const response = await axios.get('/api/payroll', { params: queryParams });
      setPayrollList(response.data);
    } catch (error) {
      message.error('Không thể tải bảng lương');
    }
  };

  // Fetch thống kê
  const fetchSummary = async () => {
    try {
      const response = await axios.get('/api/payroll/statistics/summary', {
        params: { month, year }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Fetch danh sách thưởng
  const fetchBonuses = async () => {
    try {
      const response = await axios.get('/api/bonus', {
        params: { isActive: true }
      });
      setBonuses(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách thưởng');
    }
  };

  // Fetch cấu hình
  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/working-time-config/active');
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  // Tính lương cho nhân viên
  const calculatePayroll = async (employeeId) => {
    setLoading(true);
    try {
      const response = await axios.post(`/api/payroll/calculate/${employeeId}`, {
        month,
        year
      });
      setPayrollData(response.data);
      message.success('Tính lương thành công');
      fetchPayrolls();
      fetchSummary();
    } catch (error) {
      message.error(error.response?.data?.message || 'Lỗi khi tính lương');
    } finally {
      setLoading(false);
    }
  };

  // Tính lương hàng loạt
  const calculateBulkPayroll = async () => {
    Modal.confirm({
      title: 'Xác nhận tính lương hàng loạt',
      content: `Bạn có chắc chắn muốn tính lương cho tất cả nhân viên tháng ${month}/${year}?`,
      onOk: async () => {
        setLoading(true);
        try {
          const response = await axios.post('/api/payroll/calculate/bulk', {
            month,
            year
          });
          message.success(`Đã tính lương thành công cho ${response.data.success} nhân viên`);
          fetchPayrolls();
          fetchSummary();
        } catch (error) {
          message.error('Lỗi khi tính lương hàng loạt');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Duyệt bảng lương
  const approvePayroll = async (id) => {
    try {
      await axios.put(`/api/payroll/${id}/approve`);
      message.success('Duyệt bảng lương thành công');
      fetchPayrolls();
    } catch (error) {
      message.error('Lỗi khi duyệt bảng lương');
    }
  };

  // Xác nhận đã thanh toán
  const payPayroll = async (id) => {
    try {
      await axios.put(`/api/payroll/${id}/pay`);
      message.success('Xác nhận thanh toán thành công');
      fetchPayrolls();
    } catch (error) {
      message.error('Lỗi khi xác nhận thanh toán');
    }
  };

  // Xuất bảng lương
  const exportPayroll = async (id) => {
    try {
      const response = await axios.get(`/api/payroll/${id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${moment().format('YYYYMM')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Xuất file thành công');
    } catch (error) {
      message.error('Lỗi khi xuất file');
    }
  };

  // Xóa bảng lương
  const deletePayroll = async (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa bảng lương này?',
      onOk: async () => {
        try {
          await axios.delete(`/api/payroll/${id}`);
          message.success('Xóa thành công');
          fetchPayrolls();
        } catch (error) {
          message.error('Lỗi khi xóa bảng lương');
        }
      },
    });
  };

  // Columns cho bảng danh sách lương
  const payrollColumns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 100,
    },
    {
      title: 'Tên nhân viên',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 150,
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 150,
      render: (value) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Phụ cấp',
      dataIndex: ['allowances', 'total'],
      key: 'allowances',
      width: 120,
      render: (value) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Làm thêm',
      dataIndex: ['overtime', 'amount'],
      key: 'overtime',
      width: 120,
      render: (value) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Thưởng',
      dataIndex: 'totalBonus',
      key: 'totalBonus',
      width: 120,
      render: (value) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Tổng thu nhập',
      dataIndex: 'grossIncome',
      key: 'grossIncome',
      width: 150,
      render: (value) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Khấu trừ',
      dataIndex: ['deductions', 'total'],
      key: 'deductions',
      width: 120,
      render: (value) => value?.toLocaleString('vi-VN') + ' đ',
    },
    {
      title: 'Thực nhận',
      dataIndex: 'netSalary',
      key: 'netSalary',
      width: 150,
      render: (value) => <strong>{value?.toLocaleString('vi-VN')} đ</strong>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: 'Nháp' },
          approved: { color: 'processing', text: 'Đã duyệt' },
          paid: { color: 'success', text: 'Đã thanh toán' },
          cancelled: { color: 'error', text: 'Hủy' }
        };
        const s = statusMap[status] || statusMap.draft;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<FileTextOutlined />} 
              size="small"
              onClick={() => {
                setSelectedEmployee(employees.find(e => e._id === record.employeeId));
                setPayrollData(record);
              }}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <>
              <Tooltip title="Duyệt">
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />} 
                  size="small"
                  onClick={() => approvePayroll(record._id)}
                />
              </Tooltip>
              <Tooltip title="Xóa">
                <Button 
                  danger 
                  icon={<i className="fas fa-trash" />} 
                  size="small"
                  onClick={() => deletePayroll(record._id)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'approved' && (
            <Tooltip title="Xác nhận thanh toán">
              <Button 
                type="primary" 
                icon={<BankOutlined />} 
                size="small"
                onClick={() => payPayroll(record._id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Xuất file">
            <Button 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => exportPayroll(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
    fetchSummary();
    fetchBonuses();
    fetchConfig();
  }, [month, year]);

  return (
    <div className="payroll-container">
      <Card
        title={
          <Space>
            <DollarOutlined />
            <span>Quản lý Lương và Phúc lợi</span>
          </Space>
        }
        extra={
          <Space>
            <Select value={month} onChange={setMonth} style={{ width: 100 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <Option key={m} value={m}>Tháng {m}</Option>
              ))}
            </Select>
            <Select value={year} onChange={setYear} style={{ width: 100 }}>
              {Array.from({ length: 5 }, (_, i) => moment().year() - 2 + i).map(y => (
                <Option key={y} value={y}>Năm {y}</Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<CalculatorOutlined />}
              onClick={calculateBulkPayroll}
              loading={loading}
            >
              Tính lương hàng loạt
            </Button>
          </Space>
        }
      >
        {/* Thống kê tổng quan */}
        {summary && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="Tổng nhân viên" 
                  value={summary.summary.totalEmployees}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="Tổng lương thực nhận" 
                  value={summary.summary.totalNetSalary}
                  precision={0}
                  suffix="đ"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="Tổng thuế" 
                  value={summary.summary.totalTax}
                  precision={0}
                  suffix="đ"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic 
                  title="Tổng thưởng" 
                  value={summary.summary.totalBonus}
                  precision={0}
                  suffix="đ"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Tabs defaultActiveKey="list">
          <TabPane tab="Danh sách bảng lương" key="list">
            <Table
              columns={payrollColumns}
              dataSource={payrollList}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1500 }}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab="Chi tiết nhân viên" key="detail">
            {selectedEmployee ? (
              <>
                {/* Thông tin nhân viên */}
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Descriptions title="Thông tin nhân viên" bordered>
                    <Descriptions.Item label="Mã NV">{selectedEmployee.employeeCode}</Descriptions.Item>
                    <Descriptions.Item label="Tên NV">{selectedEmployee.employeeName}</Descriptions.Item>
                    <Descriptions.Item label="Phòng ban">{selectedEmployee.department}</Descriptions.Item>
                    <Descriptions.Item label="Chức vụ">{selectedEmployee.position}</Descriptions.Item>
                    <Descriptions.Item label="Lương cơ bản">
                      {selectedEmployee.baseSalary?.toLocaleString('vi-VN')} đ
                    </Descriptions.Item>
                    <Descriptions.Item label="Kỳ tính lương">
                      Tháng {month}/{year}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* Bảng lương chi tiết */}
                {payrollData && (
                  <>
                    <Steps
                      current={
                        payrollData.status === 'draft' ? 0 :
                        payrollData.status === 'approved' ? 1 :
                        payrollData.status === 'paid' ? 2 : 0
                      }
                      style={{ marginBottom: 24 }}
                    >
                      <Step title="Nháp" icon={<FileTextOutlined />} />
                      <Step title="Đã duyệt" icon={<CheckCircleOutlined />} />
                      <Step title="Đã thanh toán" icon={<BankOutlined />} />
                    </Steps>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Card title="Thu nhập" size="small">
                          <div className="calculation-row">
                            <span>Lương cơ bản:</span>
                            <span className="amount">
                              {payrollData.baseSalary?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>Phụ cấp ăn trưa:</span>
                            <span className="amount">
                              + {payrollData.allowances?.meal?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>Phụ cấp khác:</span>
                            <span className="amount">
                              + {(payrollData.allowances?.transportation + 
                                  payrollData.allowances?.phone + 
                                  payrollData.allowances?.housing + 
                                  payrollData.allowances?.responsibility)?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>Làm thêm ({payrollData.overtime?.hours} giờ):</span>
                            <span className="amount">
                              + {payrollData.overtime?.amount?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>Tiền thưởng:</span>
                            <span className="amount">
                              + {payrollData.totalBonus?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row total">
                            <span>Tổng thu nhập:</span>
                            <span className="amount">
                              {payrollData.grossIncome?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </Card>
                      </Col>

                      <Col span={12}>
                        <Card title="Khấu trừ" size="small">
                          <div className="calculation-row">
                            <span>BHXH (8%):</span>
                            <span className="amount negative">
                              - {payrollData.deductions?.socialInsurance?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>BHYT (1.5%):</span>
                            <span className="amount negative">
                              - {payrollData.deductions?.healthInsurance?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>BHTN (1%):</span>
                            <span className="amount negative">
                              - {payrollData.deductions?.unemploymentInsurance?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>Thuế TNCN:</span>
                            <span className="amount negative">
                              - {payrollData.deductions?.tax?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row">
                            <span>Khấu trừ khác:</span>
                            <span className="amount negative">
                              - {payrollData.deductions?.other?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <div className="calculation-row total">
                            <span>Tổng khấu trừ:</span>
                            <span className="amount negative">
                              - {payrollData.deductions?.total?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    <Card style={{ marginTop: 16 }}>
                      <Row gutter={16} align="middle">
                        <Col span={16}>
                          <Progress 
                            percent={Math.round((payrollData.netSalary / payrollData.grossIncome) * 100)} 
                            status="active"
                            format={(percent) => `Thực nhận ${percent}% tổng thu nhập`}
                          />
                        </Col>
                        <Col span={8}>
                          <Alert
                            message="Lương thực nhận"
                            description={
                              <span style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>
                                {payrollData.netSalary?.toLocaleString('vi-VN')} đ
                              </span>
                            }
                            type="success"
                            icon={<DollarOutlined />}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* Danh sách thưởng */}
                    {payrollData.bonuses?.length > 0 && (
                      <Card title="Chi tiết thưởng" style={{ marginTop: 16 }} size="small">
                        {payrollData.bonuses.map((bonus, index) => (
                          <div key={index} className="bonus-item">
                            <div className="bonus-info">
                              <Tag color="gold">{bonus.name}</Tag>
                              <span>{bonus.description}</span>
                            </div>
                            <span className="bonus-amount">
                              + {bonus.amount?.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))}
                      </Card>
                    )}

                    {/* Phúc lợi */}
                    <Card title="Phúc lợi" style={{ marginTop: 16 }} size="small">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic 
                            title="Ngày phép năm" 
                            value={selectedEmployee.leaveDays?.annual || 12}
                            suffix="ngày"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic 
                            title="Ngày phép còn lại" 
                            value={selectedEmployee.leaveDays?.remaining || 12}
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic 
                            title="Ngày ốm đã nghỉ" 
                            value={selectedEmployee.leaveDays?.sick || 0}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </>
                )}
              </>
            ) : (
              <Alert
                message="Chưa chọn nhân viên"
                description="Vui lòng chọn một nhân viên từ danh sách để xem chi tiết"
                type="info"
                showIcon
              />
            )}
          </TabPane>

          <TabPane tab="Danh sách thưởng" key="bonuses">
            <Button 
              type="primary" 
              icon={<GiftOutlined />} 
              style={{ marginBottom: 16 }}
              onClick={() => {
                // Mở modal thêm thưởng
              }}
            >
              Thêm khoản thưởng
            </Button>
            <Table
              columns={[
                {
                  title: 'Tên thưởng',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Loại',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => {
                    const typeMap = {
                      individual: 'Cá nhân',
                      department: 'Phòng ban',
                      company: 'Công ty',
                      holiday: 'Lễ Tết'
                    };
                    return typeMap[type] || type;
                  },
                },
                {
                  title: 'Phương thức tính',
                  dataIndex: 'calculationMethod',
                  key: 'calculationMethod',
                  render: (method) => {
                    const methodMap = {
                      fixed: 'Cố định',
                      percentage_salary: '% lương cơ bản',
                      percentage_overtime: '% lương OT'
                    };
                    return methodMap[method] || method;
                  },
                },
                {
                  title: 'Giá trị',
                  dataIndex: 'value',
                  key: 'value',
                  render: (value, record) => {
                    if (record.calculationMethod === 'fixed') {
                      return value?.toLocaleString('vi-VN') + ' đ';
                    }
                    return value + '%';
                  },
                },
                {
                  title: 'Hiệu lực',
                  dataIndex: 'effectiveDate',
                  key: 'effectiveDate',
                  render: (date) => moment(date).format('DD/MM/YYYY'),
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'isActive',
                  key: 'isActive',
                  render: (active) => (
                    <Tag color={active ? 'success' : 'default'}>
                      {active ? 'Đang áp dụng' : 'Ngừng áp dụng'}
                    </Tag>
                  ),
                },
                {
                  title: 'Thao tác',
                  key: 'actions',
                  render: (_, record) => (
                    <Space>
                      <Button type="link" size="small">Sửa</Button>
                      <Button type="link" danger size="small">Xóa</Button>
                    </Space>
                  ),
                },
              ]}
              dataSource={bonuses}
              rowKey="_id"
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default PayrollBenefits;