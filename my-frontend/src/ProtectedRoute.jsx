// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  // Kiểm tra token chung
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  
  // Nếu không có token hoặc user -> chưa đăng nhập
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Parse user data
  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role
  if (requiredRole && user.role !== requiredRole) {
    // Nếu role không khớp, chuyển hướng về dashboard tương ứng
    switch (user.role) {
      case 'admin':
        return <Navigate to="/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'employee':
        return <Navigate to="/employee/NVDashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Hợp lệ, render children
  return children;
};

export default ProtectedRoute;