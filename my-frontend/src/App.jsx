import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UniversityProvider } from './contexts/UniversityContext';
import { ThemeProvider } from './ThemeContext';
//admin
import Login from './login';
import ProtectedRoute from "./ProtectedRoute";
import ForgotPassword from './ForgotPassword';
import Register from './register';
import Layout from './layout';
import ChangePassword from './change-password';
import Profile from './profile';
import Settings from './settings';
import Dashboard from './dashboard';
import Employees from './employees/list';
import Organization from './organization/departments';
import OfficeManagement from './organization/OfficeManagement';
import Contracts from './contracts/listHD';
import CreateHD from './contracts/createHD';
import Attendance from './attendance/AttendanceManagement';
import AttendanceReport from './attendance/AttendanceReport';

//Dành cho nhân viên
import Sidebaremployee from './sidebar-employee/EmployeeSidebar';
import EmployeeAttendance from './NV-attendance/EmployeeAttendance';
import NVDashboard from './NV/NVDashboard';
 
import NVchat from './NV-chat/ChatEmployee';

//Dành cho giảng viên
import TeacherLogin from './Teacher/TeacherLogin';
import TeacherDashboard from './Teacher/TeacherDashboard';
import TeacherSidebar from './Teacher/TeacherSidebar'; // Thêm sidebar cho teacher
import TeacherSchedule from './Teacher/TeacherSchedule';
import FaceAttendance from './Teacher/FaceAttendance';


//Admin
import BusinessTrip from './attendance/BusinessTrip';
import Tranining from './training/courses';
import AdminScheduleManager from './training/AdminScheduleManager';
import Chat from './chat-NV/chatNV';
import UserManagement from './users-permissions/UserManagement';

function App() {
  // Kiểm tra token khi load app
  const isAuthenticated = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return !!token;
  };

  // Lấy role của user
  const getUserRole = () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.role;
    } catch (error) {
      return null;
    }
  };

  return (
    <UniversityProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public routes - không cần đăng nhập */}
            <Route path="/login" element={<Login />} />
            <Route path="/teacher-login" element={<TeacherLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />

            {/* Redirect root based on authentication */}
            <Route
              path="/"
              element={
                isAuthenticated() ? (
                  <Navigate to={
                    getUserRole() === 'admin' ? '/dashboard' :
                    getUserRole() === 'employee' ? '/employee/NVDashboard' :
                    getUserRole() === 'teacher' ? '/teacher/dashboard' : '/login'
                  } replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Employee routes - thêm requiredRole="employee" */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute requiredRole="employee">
                  <Sidebaremployee />
                </ProtectedRoute>
              }
            >
              {/* Sửa path đúng với login.jsx */}
              <Route path="dashboard" element={<NVDashboard />} />
              <Route path="NVDashboard" element={<NVDashboard />} /> {/* Giữ lại cho tương thích */}
        
              <Route path="NVattendance" element={<EmployeeAttendance />} />
              <Route path="Chatemployee" element={<NVchat />} />
            </Route>

            {/* Teacher routes - THÊM VÀO */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherSidebar />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="teacherschedule" element={<TeacherSchedule/>}/>
              <Route path="face-attendance" element={<FaceAttendance />} />
              
            </Route>

            {/* Admin routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="employees/list" element={<Employees />} />
              <Route path="organization/departments" element={<Organization />} />
              <Route path="organization/OfficeManagement" element={<OfficeManagement />} />
              <Route path="contracts/listHD" element={<Contracts />} />
              <Route path="contracts/createHD" element={<CreateHD />} />
              <Route path="attendance/AttendanceManagement" element={<Attendance />} />
              <Route path="attendance/AttendanceReport" element={<AttendanceReport />} />
              <Route path="attendance/BusinessTrip" element={<BusinessTrip />} />
              <Route path="training/courses" element={<Tranining />} />
              <Route path="training/adminmanagerschedule" element={<AdminScheduleManager/>}/>
              <Route path="chat-NV/chatNV" element={<Chat />} />
              <Route path="users-permissions/UserManagement" element={<UserManagement />} />
            </Route>

            {/* Catch all - redirect based on authentication */}
            <Route 
              path="*" 
              element={
                isAuthenticated() ? (
                  <Navigate to={
                    getUserRole() === 'admin' ? '/dashboard' :
                    getUserRole() === 'employee' ? '/employee/NVDashboard' :
                    getUserRole() === 'teacher' ? '/teacher/dashboard' : '/login'
                  } replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </UniversityProvider>
  );
}

export default App;