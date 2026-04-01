// contexts/UniversityContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

// ✅ Lấy API URL từ env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ✅ Tạo axios instance với cấu hình mặc định
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const UniversityContext = createContext();

export const useUniversity = () => {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity must be used within UniversityProvider');
  }
  return context;
};

export const UniversityProvider = ({ children }) => {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalDepartments: 0,
    activeTeachers: 0,
    lockedTeachers: 0
  });

  // ============= TEACHER API CALLS =============
  
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/teachers');
      
      // ✅ Xử lý response linh hoạt
      let teachersData = [];
      if (Array.isArray(response.data)) {
        teachersData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        teachersData = response.data.data;
      } else if (response.data.teachers && Array.isArray(response.data.teachers)) {
        teachersData = response.data.teachers;
      } else {
        console.warn('Unexpected teachers response structure:', response.data);
        teachersData = [];
      }
      
      console.log('✅ Loaded teachers:', teachersData.length);
      setTeachers(teachersData);
      
      // Cập nhật stats
      setStats({
        totalTeachers: teachersData.length,
        activeTeachers: teachersData.filter(t => !t.isLocked).length,
        lockedTeachers: teachersData.filter(t => t.isLocked).length,
        totalDepartments: departments.length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách giảng viên:', error);
      if (error.response) {
        console.error('Response error:', error.response.data);
        console.error('Status:', error.response.status);
      }
      setLoading(false);
      setTeachers([]);
    }
  }, [departments.length]);

  const addTeacher = async (teacherData) => {
    try {
      console.log('📤 Adding teacher:', teacherData);
      const response = await api.post('/teachers', teacherData);
      
      // ✅ Xử lý response
      const newTeacher = response.data.data || response.data;
      console.log('✅ Teacher added:', newTeacher);
      
      setTeachers(prev => [...prev, newTeacher]);
      
      setStats(prev => ({
        ...prev,
        totalTeachers: prev.totalTeachers + 1,
        activeTeachers: prev.activeTeachers + 1
      }));
      
      if (teacherData.faculty) {
        updateDepartmentFacultyCount(teacherData.faculty, 'increment');
      }
      
      return newTeacher;
    } catch (error) {
      console.error('❌ Lỗi khi thêm giảng viên:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data?.message || 'Lỗi khi thêm giảng viên');
      }
      throw error;
    }
  };

  const updateTeacher = async (id, teacherData) => {
    try {
      console.log('📝 Updating teacher:', id, teacherData);
      const response = await api.put(`/teachers/${id}`, teacherData);
      
      const updatedTeacher = response.data.data || response.data;
      const oldTeacher = teachers.find(t => (t._id || t.id) === id);
      
      setTeachers(prev => prev.map(t => (t._id || t.id) === id ? updatedTeacher : t));
      
      if (oldTeacher && oldTeacher.faculty !== teacherData.faculty) {
        updateDepartmentFacultyCount(oldTeacher.faculty, 'decrement');
        updateDepartmentFacultyCount(teacherData.faculty, 'increment');
      }
      
      return updatedTeacher;
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật giảng viên:', error);
      throw error;
    }
  };

  const toggleLockTeacher = async (id, currentLockStatus) => {
    try {
      const response = await api.put(`/teachers/${id}/toggle-lock`, {});
      const updatedTeacher = response.data.data || response.data;
      
      setTeachers(prev => prev.map(t => (t._id || t.id) === id ? updatedTeacher : t));
      
      setStats(prev => ({
        ...prev,
        activeTeachers: !currentLockStatus ? prev.activeTeachers + 1 : prev.activeTeachers - 1,
        lockedTeachers: !currentLockStatus ? prev.lockedTeachers - 1 : prev.lockedTeachers + 1
      }));
      
      return updatedTeacher;
    } catch (error) {
      console.error('❌ Lỗi khi khóa/mở khóa giảng viên:', error);
      throw error;
    }
  };

  const deleteTeacher = async (id) => {
    try {
      const teacher = teachers.find(t => (t._id || t.id) === id);
      await api.delete(`/teachers/${id}`);
      
      setTeachers(prev => prev.filter(t => (t._id || t.id) !== id));
      
      setStats(prev => ({
        ...prev,
        totalTeachers: prev.totalTeachers - 1,
        activeTeachers: teacher?.isLocked ? prev.activeTeachers : prev.activeTeachers - 1,
        lockedTeachers: teacher?.isLocked ? prev.lockedTeachers - 1 : prev.lockedTeachers
      }));
      
      if (teacher?.faculty) {
        updateDepartmentFacultyCount(teacher.faculty, 'decrement');
      }
      
    } catch (error) {
      console.error('❌ Lỗi khi xóa giảng viên:', error);
      throw error;
    }
  };

  // ============= DEPARTMENT API CALLS =============
  
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get('/departments?limit=100');
      
      // ✅ Xử lý response linh hoạt
      let depts = [];
      if (Array.isArray(response.data)) {
        depts = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        depts = response.data.data;
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        depts = response.data.departments;
      } else {
        console.warn('Unexpected departments response structure:', response.data);
        depts = [];
      }
      
      // Tính số lượng giảng viên cho mỗi khoa
      const deptsWithCount = depts.map(dept => ({
        ...dept,
        id: dept._id || dept.id,
        _id: dept._id || dept.id,
        facultyCount: teachers.filter(t => t.faculty === dept.name).length
      }));
      
      setDepartments(deptsWithCount);
      
      setStats(prev => ({
        ...prev,
        totalDepartments: depts.length
      }));
      
      console.log('✅ Loaded departments:', depts.length);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách khoa:', error);
      setDepartments([]);
    }
  }, [teachers]);

  const addDepartment = async (departmentData) => {
    try {
      const response = await api.post('/departments', departmentData);
      const newDept = response.data.data || response.data;
      
      setDepartments(prev => [...prev, { 
        ...newDept, 
        id: newDept._id || newDept.id,
        _id: newDept._id || newDept.id,
        facultyCount: 0 
      }]);
      
      setStats(prev => ({
        ...prev,
        totalDepartments: prev.totalDepartments + 1
      }));
      
      return newDept;
    } catch (error) {
      console.error('❌ Lỗi khi thêm khoa:', error);
      throw error;
    }
  };

  const updateDepartment = async (id, departmentData) => {
    try {
      console.log('📝 Updating department:', id, departmentData);
      const response = await api.put(`/departments/${id}`, departmentData);
      const updatedDept = response.data.data || response.data;
      
      setDepartments(prev => prev.map(d => {
        const deptId = d._id || d.id;
        if (deptId === id) {
          return {
            ...updatedDept,
            _id: updatedDept._id || updatedDept.id || id,
            id: updatedDept.id || updatedDept._id || id
          };
        }
        return d;
      }));
      
      return updatedDept;
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật khoa:', error);
      throw error;
    }
  };

  const deleteDepartment = async (id) => {
    try {
      const dept = departments.find(d => (d._id || d.id) === id);
      
      if (dept) {
        const teachersInDept = teachers.filter(t => t.faculty === dept.name);
        if (teachersInDept.length > 0) {
          throw new Error(`Không thể xóa khoa này vì còn ${teachersInDept.length} giảng viên đang thuộc khoa.`);
        }
      }
      
      await api.delete(`/departments/${id}`);
      
      setDepartments(prev => prev.filter(d => (d._id || d.id) !== id));
      
      setStats(prev => ({
        ...prev,
        totalDepartments: prev.totalDepartments - 1
      }));
      
    } catch (error) {
      console.error('❌ Lỗi khi xóa khoa:', error);
      throw error;
    }
  };

  const toggleDepartmentStatus = async (id, newStatus) => {
    try {
      const response = await api.patch(`/departments/${id}/status`, { status: newStatus });
      const updatedDept = response.data.data || response.data;
      
      setDepartments(prev => prev.map(d => {
        const deptId = d._id || d.id;
        return deptId === id ? updatedDept : d;
      }));
      
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật trạng thái khoa:', error);
      throw error;
    }
  };
  
  // ============= HELPER FUNCTIONS =============
  
  const updateDepartmentFacultyCount = (facultyName, action) => {
    if (!facultyName) return;
    
    setDepartments(prev => prev.map(dept => {
      if (dept.name === facultyName) {
        return {
          ...dept,
          facultyCount: action === 'increment' 
            ? dept.facultyCount + 1 
            : Math.max(0, dept.facultyCount - 1)
        };
      }
      return dept;
    }));
  };

  const getFacultyCountByDepartment = (departmentName) => {
    return teachers.filter(t => t.faculty === departmentName).length;
  };

  const getTeachersByDepartment = (departmentName) => {
    return teachers.filter(t => t.faculty === departmentName);
  };

  // ============= INITIAL LOAD =============
  
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    if (teachers.length > 0 || departments.length === 0) {
      fetchDepartments();
    }
  }, [teachers, fetchDepartments]);

  const value = {
    teachers,
    departments,
    loading,
    stats,
    addTeacher,
    updateTeacher,
    toggleLockTeacher,
    deleteTeacher,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus,
    getFacultyCountByDepartment,
    getTeachersByDepartment,
    updateDepartmentFacultyCount,
    refreshTeachers: fetchTeachers,
    refreshDepartments: fetchDepartments
  };

  return (
    <UniversityContext.Provider value={value}>
      {children}
    </UniversityContext.Provider>
  );
};