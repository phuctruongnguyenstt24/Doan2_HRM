// client/src/pages/TeacherLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TeacherLogin.css';

const TeacherLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
  });

 // client/src/pages/TeacherLogin.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await api.post('/auth/teacher-login', {
      email,
      password
    });

    if (response.data.success) {
      const { token, user } = response.data;
      
      // Lưu token
      localStorage.setItem('token', token);
      sessionStorage.setItem('token', token);
      
      // Lưu đầy đủ thông tin user
      const userToStore = {
        id: user.id || user._id,  // Thêm cả id
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teacherCode: user.teacherCode,
        faculty: user.faculty,
        major: user.major,
        degree: user.degree,
        position: user.position,
        phone: user.phone,
        avatar: user.avatar
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      sessionStorage.setItem('user', JSON.stringify(userToStore));
      
      console.log('✅ Login successful, redirecting to /teacher/dashboard');
      console.log('📦 Stored user:', userToStore);
      
      // ✅ SỬA LẠI: Chuyển hướng đúng với route trong App.jsx
      navigate('/teacher/dashboard');
    }
  } catch (err) {
    console.error('Login error:', err);
    setError(err.response?.data?.message || 'Đăng nhập thất bại');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="teacher-login-container">
      <div className="login-card-teacher">
        <div className="login-header-teacher">
          <div className="logo-teacher">👨‍🏫</div>
          <h2>Đăng nhập Giảng viên</h2>
          <p>Hệ thống quản lý giảng viên</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group-teacher">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap@email.com"
              required
            />
          </div>
          
          <div className="form-group-teacher">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        
        <div className="login-footer-teacher">
          <a href="/forgot-password">Quên mật khẩu?</a>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;