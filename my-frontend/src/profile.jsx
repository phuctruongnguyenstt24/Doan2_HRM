import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarker, 
  FaCalendarAlt,
  FaSave,
  FaEdit,
  FaLock,
  FaBuilding,
  FaIdCard,
  FaCamera,
  FaArrowLeft
} from 'react-icons/fa';
import './profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    role: '',
    department: '',
    employeeId: '',
    joinDate: '',
    avatar: null,
    bio: ''
  });

  const [formData, setFormData] = useState({ ...userData });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserData(data.user);
        setFormData(data.user);
        if (data.user.avatar) {
          setAvatarPreview(data.user.avatar);
        }
      } else {
        setError('Không thể tải thông tin người dùng');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ảnh không được vượt quá 5MB');
        return;
      }
      
      // Kiểm tra định dạng
      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn file ảnh');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      let response;
      
      if (avatarFile) {
        // Upload với avatar
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });
        formDataToSend.append('avatar', avatarFile);
        
        response = await fetch(`${API_URL}/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        });
      } else {
        // Upload không có avatar
        response = await fetch(`${API_URL}/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
      }

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Cập nhật localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          const updatedUser = { ...currentUser, ...formData };
          if (avatarPreview) {
            updatedUser.avatar = avatarPreview;
          }
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setUserData(formData);
        setSuccess('Cập nhật thông tin thành công!');
        setIsEditing(false);
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(userData);
    setAvatarPreview(userData.avatar);
    setAvatarFile(null);
    setIsEditing(false);
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header với nút back */}
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FaArrowLeft />
            <span>Quay lại</span>
          </button>
          <h1>Hồ sơ cá nhân</h1>
          {!isEditing && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              <FaEdit />
              <span>Chỉnh sửa</span>
            </button>
          )}
        </div>

        {/* Thông báo */}
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-container">
              {avatarPreview ? (
                <img src={avatarPreview} alt={userData.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              {isEditing && (
                <label className="avatar-upload-label">
                  <FaCamera className="camera-icon" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <span>Đổi ảnh</span>
                </label>
              )}
            </div>
            <h2>{userData.name}</h2>
            <span className="profile-role">{userData.role}</span>
          </div>

          {/* Information Section */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Thông tin cá nhân</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <FaUser className="input-icon" />
                    Họ và tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <p className="info-value">{userData.name || 'Chưa cập nhật'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaEnvelope className="input-icon" />
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  ) : (
                    <p className="info-value">{userData.email || 'Chưa cập nhật'}</p>
                  )}
                  {isEditing && <small className="info-hint">Email không thể thay đổi</small>}
                </div>

                <div className="form-group">
                  <label>
                    <FaPhone className="input-icon" />
                    Số điện thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <p className="info-value">{userData.phone || 'Chưa cập nhật'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <FaCalendarAlt className="input-icon" />
                    Ngày sinh
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday || ''}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="info-value">{formatDate(userData.birthday)}</p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>
                    <FaMapMarker className="input-icon" />
                    Địa chỉ
                  </label>
                  {isEditing ? (
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <p className="info-value">{userData.address || 'Chưa cập nhật'}</p>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>
                    <FaIdCard className="input-icon" />
                    Giới thiệu
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Giới thiệu về bản thân"
                    />
                  ) : (
                    <p className="info-value">{userData.bio || 'Chưa cập nhật'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Thông tin công việc</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <FaBuilding className="input-icon" />
                    Phòng ban
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleInputChange}
                      disabled
                    />
                  ) : (
                    <p className="info-value">{userData.department || 'Chưa cập nhật'}</p>
                  )}
                  {isEditing && <small className="info-hint">Liên hệ quản trị viên để thay đổi</small>}
                </div>

                <div className="form-group">
                  <label>
                    <FaIdCard className="input-icon" />
                    Mã nhân viên
                  </label>
                  <p className="info-value">{userData.employeeId || 'Chưa cập nhật'}</p>
                </div>

                <div className="form-group">
                  <label>
                    <FaCalendarAlt className="input-icon" />
                    Ngày vào làm
                  </label>
                  <p className="info-value">{formatDate(userData.joinDate)}</p>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Hủy bỏ
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Đang lưu...' : (
                    <>
                      <FaSave />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Security Section */}
          <div className="security-section">
            <h3>Bảo mật</h3>
            <button className="change-password-btn" onClick={() => navigate('/change-password')}>
              <FaLock />
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;