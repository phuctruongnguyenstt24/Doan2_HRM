// pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats] = useState({
    totalCourses: 3,
    totalStudents: 120,
    pendingAssignments: 15,
    weeklyClasses: 12
  });
  const navigate = useNavigate();

// pages/teacher/TeacherDashboard.jsx
useEffect(() => {
  const fetchUserData = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    console.log('🔍 Token exists:', !!token);
    console.log('🔍 User data from storage:', userData);
    
    if (!token || !userData) {
      console.log('❌ No token or user data, redirecting to teacher-login');
      navigate('/teacher-login');  // ✅ Sửa lại đường dẫn
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      console.log('📦 Parsed user:', parsedUser);
      
      if (parsedUser.role !== 'teacher') {
        console.log('❌ User role is not teacher:', parsedUser.role);
        navigate('/login');
        return;
      }
      
      const userWithDetails = {
        ...parsedUser,
        _id: parsedUser.id || parsedUser._id,
        teacherCode: parsedUser.teacherCode || 'Chưa cập nhật',
        faculty: parsedUser.faculty || 'Chưa cập nhật',
        major: parsedUser.major || 'Chưa cập nhật',
        degree: parsedUser.degree || 'Chưa cập nhật',
        position: parsedUser.position || 'Giảng viên',
        phone: parsedUser.phone || 'Chưa cập nhật'
      };
      
      console.log('✅ Teacher data loaded:', userWithDetails);
      setUser(userWithDetails);
      
    } catch (error) {
      console.error('❌ Error parsing user data:', error);
      navigate('/teacher-login');  // ✅ Sửa lại đường dẫn
    } finally {
      setLoading(false);
    }
  };
  
  fetchUserData();
}, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👨‍🏫 Dashboard Giảng Viên</h1>
          <div className="header-date">
            {new Date().toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Thống kê nhanh */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>Môn học đang dạy</h3>
              <p className="stat-number">{stats.totalCourses}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-info">
              <h3>Sinh viên</h3>
              <p className="stat-number">{stats.totalStudents}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <h3>Bài tập cần chấm</h3>
              <p className="stat-number">{stats.pendingAssignments}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>Tiết dạy trong tuần</h3>
              <p className="stat-number">{stats.weeklyClasses}</p>
            </div>
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <div className="profile-section">
          <div className="profile-card">
            <h2>Thông tin cá nhân</h2>
            <div className="profile-info">
              <div className="info-row">
                <span className="label">Họ và tên:</span>
                <span className="value">{user?.name || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="label">Mã giảng viên:</span>
                <span className="value">{user?.teacherCode || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span className="value">{user?.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Số điện thoại:</span>
                <span className="value">{user?.phone || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="label">Khoa:</span>
                <span className="value">{user?.faculty || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="label">Chuyên ngành:</span>
                <span className="value">{user?.major || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="label">Học vị:</span>
                <span className="value">{user?.degree || 'Chưa cập nhật'}</span>
              </div>
              <div className="info-row">
                <span className="label">Chức vụ:</span>
                <span className="value">{user?.position || 'Giảng viên'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;