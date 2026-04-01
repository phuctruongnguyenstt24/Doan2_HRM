import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sử dụng API_URL từ env
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Helper function để fetch API
  const fetchAPI = async (endpoint, options = {}) => {
    try {
      let url;
      
      // Nếu đang trong development và API_URL là ngrok domain
      if (import.meta.env.DEV && API_URL.includes('ngrok-free.dev')) {
        // Dùng proxy để tránh CORS
        url = `/api${endpoint}`;
        console.log('🔄 Dev mode with ngrok - using proxy:', url);
      } else {
        // Production hoặc local development
        url = `${API_URL}${endpoint}`;
        console.log('🚀 Using full URL:', url);
      }
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include'
      });
      
      return response;
    } catch (error) {
      console.error('❌ API fetch error:', error);
      throw error;
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Lưu token và user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Chuyển hướng dựa vào role
        if (data.user.role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/employee/teacherDashboard');
        }
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Sử dụng API_URL cho Google OAuth
    const googleAuthUrl = API_URL.includes('ngrok-free.dev') 
      ? `/api/auth/google` 
      : `${API_URL}/auth/google`;
    window.location.href = googleAuthUrl;
  };

  // Xử lý redirect từ Google OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      
      // Fetch user info
      fetchAPI('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (data.user.role === 'admin') {
            navigate('/dashboard');
          } else {
            navigate('/employee/teacherDashboard');
          }
        }
      })
      .catch(error => {
        console.error('Error fetching user info:', error);
        setError('Không thể lấy thông tin người dùng');
      });
    }
  }, [navigate]);

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-header">
          <h1>Đăng Nhập Hệ Thống</h1>
          <p>Quản lý nhân sự chuyên nghiệp</p>
        </div>

        <div className="login-card">
          <div className="login-form">
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope className="input-icon-login" />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <FaLock className="input-icon-login" />
                  Mật khẩu
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Quên mật khẩu?
                </Link>
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
              </button>
            </form>

            <div className="divider">
              <span>Hoặc đăng nhập với</span>
            </div>

            <button 
              className="google-login-btn"
              onClick={handleGoogleLogin}
            >
              <FaGoogle className="google-icon" />
              Đăng nhập với Google
            </button>

            <div className="register-link">
              <p>
                Chưa có tài khoản? 
                <Link to="/register"> Đăng ký ngay</Link>
              </p>
            </div>
          </div>

          <div className="login-sidebar">
            <div className="sidebar-content">
              <h2>Hệ Thống Quản Lý Nhân Sự</h2>
              <p>
                Quản lý thông tin nhân viên, chấm công, tính lương và 
                các hoạt động nhân sự một cách hiệu quả.
              </p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">👥</span>
                  <span>Quản lý nhân viên</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <span>Báo cáo & thống kê</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔐</span>
                  <span>Bảo mật cao</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>© 2024 HR Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;