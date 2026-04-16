import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UniversityProvider } from './contexts/UniversityContext'; // Import Provider
import { ThemeProvider } from './ThemeContext';
//admin
import Login from './login';
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

//Dành cho giảng viên , nhân viên
import Sidebarteacher from './sidebar-teacher/EmployeeSidebar';
import EmployeeAttendance from './NV-attendance/EmployeeAttendance';
import NVDashboard from './NV/NVDashboard';
import NVTraining from './NV/NVTraining';
import NVchat from './NV-chat/ChatEmployee';
// import TeacherTraining from './Teachers/TeacherTraining';
// import EmployeeLeaveRequest from './NV-leave/LeaveRequest'; // Thêm nếu có
// import EmployeeSalary from './NV-salary/Salary'; // Thêm nếu có
// import EmployeeDocuments from './NV-documents/Documents'; // Thêm nếu có
// import EmployeeCalendar from './NV-calendar/Calendar'; // Thêm nếu có
// import EmployeeNotifications from './NV-notifications/Notifications'; // Thêm nếu có
// import EmployeeProfile from './NV-profile/Profile'; // Thêm nếu có

//Admin
import BusinessTrip from './attendance/BusinessTrip';
 
import Tranining from './training/courses';

import Chat from './chat-NV/chatNV';


import UserManagement from './users-permissions/UserManagement';

function App() {
  return (
    <UniversityProvider> {/* Bọc toàn bộ Router trong Provider */}
    <ThemeProvider> 
      <Router>
        <Routes>
          {/* Public routes - không cần Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
       
          <Route path="/register" element={<Register />} />
          
          {/* Employee routes - sử dụng EmployeeSidebar */}
          <Route path="/employee" element={<Sidebarteacher />}>
            {/* Dashboard */}
            <Route path="NVDashboard" element={<NVDashboard />} />
            <Route path="NVtraining" element={<NVTraining/>}/>
            {/* Attendance */}
            <Route path="NVattendance" element={<EmployeeAttendance />} />

            <Route path="Chatemployee" element={<NVchat/>}/>


            
            {/* Training */}
            {/* <Route path="training" element={<TeacherTraining />} />
             */}
            {/* Leave Request */}
            {/* <Route path="leave-request" element={<EmployeeLeaveRequest />} />
             */}
            {/* Salary */}
            {/* <Route path="salary" element={<EmployeeSalary />} />
             */}
            {/* Documents */}
            {/* <Route path="documents" element={<EmployeeDocuments />} /> */}
            
            {/* Calendar */}
            {/* <Route path="calendar" element={<EmployeeCalendar />} /> */}
            
            {/* Notifications */}
            {/* <Route path="notifications" element={<EmployeeNotifications />} /> */}
            
            {/* Profile */}
            {/* <Route path="profile" element={<EmployeeProfile />} /> */}
          </Route>

          {/* Protected routes - có Layout dành cho Admin */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile/>}/>
                 <Route path="/settings" element={<Settings/>}/>
          <Route path="/change-password" element={<ChangePassword />} />
            
            {/* Employees */}
            <Route path="employees/list" element={<Employees />} />
            
            {/* Organization */}
            <Route path="organization/departments" element={<Organization />} />
            <Route path="organization/OfficeManagement" element={<OfficeManagement />} />
            
            {/* Contracts */}
            <Route path="contracts/listHD" element={<Contracts />} />
            <Route path="contracts/createHD" element={<CreateHD />} />
            
            {/* Attendance */}
            <Route path="attendance/AttendanceManagement" element={<Attendance />} />
            <Route path="attendance/AttendanceReport" element={<AttendanceReport />} />
            <Route path="attendance/BusinessTrip" element={<BusinessTrip />} />
            
            {/* Training */}
            <Route path="training/courses" element={<Tranining />} />
            
            {/* Reward & Discipline */}
             <Route path="chat-NV/chatNV" element={<Chat/>}/>
            {/* Salary & Benefits */}
            
            
            {/* Users & Permissions */}
            <Route path="users-permissions/UserManagement" element={<UserManagement />} />
          </Route>
        </Routes>
      </Router>
      </ThemeProvider>
    </UniversityProvider>
  );
}


export default App;