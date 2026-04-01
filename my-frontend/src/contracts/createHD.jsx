import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './createHD.css';
import contractService from '../services/contractService';

const CreateHD = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    contractCode: '',
    customerName: '',
    customerId: '',
    contractType: 'Thường',
    startDate: '',
    endDate: '',
    amount: '',
    description: '',
    attachments: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachments') {
      // Chuyển FileList thành mảng
      const fileArray = Array.from(files || []);
      setFormData(prev => ({ ...prev, attachments: fileArray }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Xóa lỗi khi người dùng nhập lại
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Xóa thông báo status
    if (submitStatus.message) {
      setSubmitStatus({ type: '', message: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.contractCode.trim()) {
      newErrors.contractCode = 'Mã hợp đồng không được để trống';
    } else if (!/^[A-Z0-9-]+$/.test(formData.contractCode)) {
      newErrors.contractCode = 'Mã hợp đồng chỉ chứa chữ hoa, số và dấu gạch ngang';
    }
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Tên khách hàng không được để trống';
    }
    
    if (!formData.customerId.trim()) {
      newErrors.customerId = 'Số CMND/CCCD không được để trống';
    } else if (!/^[0-9]{9,12}$/.test(formData.customerId.trim())) {
      newErrors.customerId = 'Số CMND/CCCD phải từ 9-12 chữ số';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Số tiền hợp đồng không được để trống';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Số tiền hợp đồng phải lớn hơn 0';
    } else if (parseFloat(formData.amount) > 1000000000) {
      newErrors.amount = 'Số tiền không được vượt quá 1 tỷ đồng';
    }

    // Kiểm tra kích thước file
    if (formData.attachments.length > 0) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = formData.attachments.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        newErrors.attachments = `Các file sau vượt quá 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`;
      }
    }
    
    return newErrors;
  };

  // Xử lý submit form
 // createHD.jsx - Phần handleSubmit cập nhật
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const validationErrors = validateForm();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  
  setIsSubmitting(true);
  setSubmitStatus({ type: '', message: '' });
  
  try {
    // Chuẩn bị dữ liệu để gửi lên server
    const contractData = {
      contractCode: formData.contractCode,
      customerName: formData.customerName,
      customerId: formData.customerId,
      contractType: formData.contractType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      amount: formData.amount,
      description: formData.description,
      attachments: formData.attachments
    };
    
    const result = await contractService.addContract(contractData);
    
    console.log('Contract created:', result);
    
    setSubmitStatus({
      type: 'success',
      message: result.message || 'Tạo hợp đồng thành công!'
    });
    
    // Reset form
    setFormData({
      contractCode: '',
      customerName: '',
      customerId: '',
      contractType: 'Thường',
      startDate: '',
      endDate: '',
      amount: '',
      description: '',
      attachments: []
    });
    
    // Reset input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    
    setTimeout(() => {
      navigate('/contracts/listHD');
    }, 2000);
    
  } catch (error) {
    console.error('Error creating contract:', error);
    
    let errorMessage = error.message || 'Có lỗi xảy ra khi tạo hợp đồng';
    
    // Kiểm tra lỗi mã hợp đồng đã tồn tại
    if (errorMessage.includes('Mã hợp đồng đã tồn tại')) {
      setErrors(prev => ({
        ...prev,
        contractCode: 'Mã hợp đồng đã tồn tại trong hệ thống'
      }));
    }
    
    setSubmitStatus({
      type: 'error',
      message: errorMessage
    });
    
  } finally {
    setIsSubmitting(false);
  }
};

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, amount: rawValue }));
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã nhập?')) {
      setFormData({
        contractCode: '',
        customerName: '',
        customerId: '',
        contractType: 'Thường',
        startDate: '',
        endDate: '',
        amount: '',
        description: '',
        attachments: []
      });
      // Reset input file
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      setErrors({});
      setSubmitStatus({ type: '', message: '' });
    }
  };

  // Xóa file đã chọn
  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
    
    // Reset input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="form-container-cr">
      <h1 className="form-title">Tạo hợp đồng mới</h1>
      
      {submitStatus.message && (
        <div className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          <span className="alert-icon">
            {submitStatus.type === 'success' ? '✓' : '✗'}
          </span>
          <span className="alert-message">{submitStatus.message}</span>
          {submitStatus.type === 'success' && (
            <span className="alert-redirect">Đang chuyển về trang danh sách...</span>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="contract-form">
        <div className="form-grid">
          {/* Cột trái */}
          <div className="form-column">
            <div className="form-group">
              <label className="form-label">
                Mã hợp đồng <span className="required">*</span>
                <span className="label-hint">(Chỉ chứa chữ hoa, số, dấu gạch ngang)</span>
              </label>
              <input
                type="text"
                name="contractCode"
                value={formData.contractCode}
                onChange={handleChange}
                className={`form-input ${errors.contractCode ? 'input-error' : ''}`}
                placeholder="Ví dụ: HD-2024-001"
                maxLength="20"
                disabled={isSubmitting}
              />
              {errors.contractCode && (
                <span className="error-text">
                  <span className="error-icon">⚠️</span>
                  {errors.contractCode}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Tên khách hàng <span className="required">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`form-input ${errors.customerName ? 'input-error' : ''}`}
                placeholder="Nhập tên khách hàng"
                maxLength="100"
                disabled={isSubmitting}
              />
              {errors.customerName && (
                <span className="error-text">
                  <span className="error-icon">⚠️</span>
                  {errors.customerName}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Số CMND/CCCD <span className="required">*</span>
              </label>
              <input
                type="text"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                className={`form-input ${errors.customerId ? 'input-error' : ''}`}
                placeholder="Nhập số CMND/CCCD"
                maxLength="12"
                disabled={isSubmitting}
              />
              {errors.customerId && (
                <span className="error-text">
                  <span className="error-icon">⚠️</span>
                  {errors.customerId}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Loại hợp đồng</label>
              <select
                name="contractType"
                value={formData.contractType}
                onChange={handleChange}
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="Thường">Thường</option>
                <option value="Cao cấp">Cao cấp</option>
                <option value="VIP">VIP</option>
                <option value="Doanh nghiệp">Doanh nghiệp</option>
              </select>
            </div>
          </div>

          {/* Cột phải */}
          <div className="form-column">
            <div className="form-group">
              <label className="form-label">
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`form-input ${errors.startDate ? 'input-error' : ''}`}
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <span className="error-text">
                  <span className="error-icon">⚠️</span>
                  {errors.startDate}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Ngày kết thúc <span className="required">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`form-input ${errors.endDate ? 'input-error' : ''}`}
                disabled={isSubmitting}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <span className="error-text">
                  <span className="error-icon">⚠️</span>
                  {errors.endDate}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Số tiền hợp đồng <span className="required">*</span>
                <span className="label-hint">(VNĐ)</span>
              </label>
              <div className="input-with-icon">
                <input
                  type="text"
                  name="amount"
                  value={formData.amount ? formatCurrency(formData.amount) : ''}
                  onChange={handleAmountChange}
                  className={`form-input-CHD pad-left ${errors.amount ? 'input-error' : ''}`}
                  placeholder="0"
                  disabled={isSubmitting}
                />
                <span className="input-icon-CHD">VNĐ</span>
              </div>
              {errors.amount && (
                <span className="error-text">
                  <span className="error-icon">⚠️</span>
                  {errors.amount}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label-cr">File đính kèm</label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  name="attachments"
                  onChange={handleChange}
                  className="form-file"
                  multiple
                  disabled={isSubmitting}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {formData.attachments.length > 0 && (
                  <div className="file-info">
                    <p className="file-count">Đã chọn {formData.attachments.length} file</p>
                    <ul className="file-list">
                      {formData.attachments.map((file, index) => (
                        <li key={index} className="file-item">
                          <span>📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
                          <button 
                            type="button"
                            className="file-remove-btn"
                            onClick={() => removeFile(index)}
                            disabled={isSubmitting}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="file-hint">Hỗ trợ: PDF, DOC, DOCX, JPG, JPEG, PNG (tối đa 10MB/file)</p>
                {errors.attachments && (
                  <span className="error-text">
                    <span className="error-icon">⚠️</span>
                    {errors.attachments}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-group full-width">
          <label className="form-label">Mô tả hợp đồng</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="form-textarea"
            placeholder="Nhập chi tiết điều khoản, ghi chú..."
            disabled={isSubmitting}
            maxLength="500"
          />
          <span className="char-count">{formData.description.length}/500</span>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleReset}
            className="btn-reset"
            disabled={isSubmitting}
          >
            Nhập lại
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/contracts/listHD')}
            className="btn-cancel"
            disabled={isSubmitting}
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className={`btn-submit ${isSubmitting ? 'btn-loading' : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Đang lưu...
              </>
            ) : 'Tạo hợp đồng'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHD;