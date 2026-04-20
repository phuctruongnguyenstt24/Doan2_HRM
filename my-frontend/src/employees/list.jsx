// list.jsx (đã sửa)
import React, { useState, useEffect } from 'react';
import { useUniversity } from '../contexts/UniversityContext';
import './list.css';


const TeacherList = () => {
  const {
    teachers,
    departments,
    addTeacher,
    updateTeacher,
    toggleLockTeacher,
    deleteTeacher,  // ✅ Thêm deleteTeacher
    loading,
    refreshTeachers  // ✅ Thêm refresh function
  } = useUniversity();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('Tất cả');
  const [filterMajor, setFilterMajor] = useState('Tất cả');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // ✅ Thêm modal xóa
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true); // Tự động tạo mật khẩu

  const [formData, setFormData] = useState({
    name: '',
    teacherCode: '',
    email: '',
    phone: '',
    faculty: '',
    major: '',
    degree: 'Thạc sĩ',
    position: 'Giảng viên',
    startDate: new Date().toISOString().split('T')[0],
    password: ''
  });



  // ✅ Sửa departments map với _id
  const faculties = {};
  departments.forEach(dept => {
    faculties[dept.name] = dept.programs || [];
  });

  // ✅ Sửa facultyList với _id
  const facultyList = ['Tất cả', ...(departments?.map(dept => dept.name) || [])];

  // Lấy danh sách ngành
  const getMajorList = () => {
    if (filterFaculty === 'Tất cả') {
      const allMajors = departments.flatMap(dept => dept.programs || []);
      return ['Tất cả', ...new Set(allMajors)];
    } else {
      const selectedDept = departments.find(d => d.name === filterFaculty);
      return ['Tất cả', ...(selectedDept?.programs || [])];
    }
  };

  const majorList = getMajorList();




  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFaculty = filterFaculty === 'Tất cả' || teacher.faculty === filterFaculty;
    const matchesMajor = filterMajor === 'Tất cả' || teacher.major === filterMajor;

    return matchesSearch && matchesFaculty && matchesMajor;
  });

  // Xử lý khóa/mở khóa
  const handleLockToggle = (teacher) => {
    setSelectedTeacher(teacher);
    setIsLockModalOpen(true);
  };

  const confirmLockToggle = async () => {
    if (!selectedTeacher) return;

    try {
      await toggleLockTeacher(selectedTeacher._id, selectedTeacher.isLocked);
      setIsLockModalOpen(false);
      setSelectedTeacher(null);
      alert(`Đã ${selectedTeacher.isLocked ? 'mở khóa' : 'khóa'} tài khoản thành công!`);
    } catch (error) {
      console.error('Lỗi khi toggle lock:', error);
      alert(error.response?.data?.message || 'Lỗi khi thực hiện thao tác!');
    }
  };

  // ✅ Xử lý xóa giảng viên


  // Thêm giảng viên mới
  const handleAddTeacher = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'faculty' && { major: '' })
    }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.name || !formData.teacherCode || !formData.email || !formData.phone || !formData.faculty || !formData.major) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Email không hợp lệ!');
      return false;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert('Số điện thoại phải có 10-11 chữ số!');
      return false;
    }

    if (formData.teacherCode.length < 3) {
      alert('Mã giảng viên phải có ít nhất 3 ký tự!');
      return false;
    }

    return true;
  };

  // Xử lý thêm giảng viên
  // list.jsx - Sửa handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let finalPassword = formData.password;
      if (autoGeneratePassword || !formData.password) {
        finalPassword = formData.teacherCode + '@' + new Date().getFullYear();
      }

      const teacherData = {
        name: formData.name.trim(),
        teacherCode: formData.teacherCode.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        faculty: formData.faculty,
        major: formData.major,
        degree: formData.degree,
        position: formData.position,
        startDate: formData.startDate || new Date().toISOString().split('T')[0],
        password: finalPassword, // ✅ ĐẢM BẢO GỬI PASSWORD
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        isLocked: false
      };

      console.log('Dữ liệu chuẩn bị gửi:', teacherData);

      await addTeacher(teacherData);

      setIsModalOpen(false);
      resetForm();
      alert(`Đã thêm giảng viên "${formData.name}" thành công!`);

      if (refreshTeachers) {
        await refreshTeachers();
      }
    } catch (error) {
      console.error('Lỗi khi thêm giảng viên:', error);

      if (error.response) {
        const serverError = error.response.data;
        console.log('Chi tiết lỗi server:', serverError);

        let errorMessage = 'Lỗi khi thêm giảng viên!\n';
        if (serverError.message) {
          errorMessage += `\n${serverError.message}`;
        }
        if (serverError.errors) {
          Object.keys(serverError.errors).forEach(key => {
            errorMessage += `\n- ${key}: ${serverError.errors[key]}`;
          });
        }
        alert(errorMessage);
      } else {
        alert(error.message || 'Lỗi khi thêm giảng viên!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Mở modal chỉnh sửa
  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      teacherCode: teacher.teacherCode || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      faculty: teacher.faculty || '',
      major: teacher.major || '',
      degree: teacher.degree || 'Thạc sĩ',
      position: teacher.position || 'Giảng viên',
      startDate: teacher.startDate ? teacher.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      password: ''
    });
    setAutoGeneratePassword(false);
    setIsEditModalOpen(true);
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const teacherData = {
        name: formData.name.trim(),
        teacherCode: formData.teacherCode.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        faculty: formData.faculty,
        major: formData.major,
        degree: formData.degree,
        position: formData.position,
        startDate: formData.startDate,
      };

      // Chỉ thêm password vào data nếu có nhập mật khẩu mới
      if (formData.password) {
        teacherData.password = formData.password;
      }

      console.log('Dữ liệu cập nhật:', teacherData);

      await updateTeacher(editingTeacher._id, teacherData);
      setIsEditModalOpen(false);
      setEditingTeacher(null);
      resetForm();

      let successMessage = `✅ Đã cập nhật giảng viên "${formData.name}" thành công!`;
      if (formData.password) {
        successMessage += `\nMật khẩu mới đã được cập nhật.`;
      }
      alert(successMessage);
    } catch (error) {
      console.error('Lỗi khi cập nhật giảng viên:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi cập nhật giảng viên!';
      alert('❌ ' + errorMessage);
    }
  };

  // Đóng modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTeacher(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      teacherCode: '',
      email: '',
      phone: '',
      faculty: '',
      major: '',
      degree: 'Thạc sĩ',
      position: 'Giảng viên',
      startDate: new Date().toISOString().split('T')[0],
      password: ''

    });
    setAutoGeneratePassword(true);
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách giảng viên...</p>
      </div>
    );
  }

  return (
    <div className="teacher-list-container">
      <div className="header-GV">
        <h1>📋 Danh sách giảng viên</h1>
        <button className="add-btn" onClick={handleAddTeacher}>
          ➕ Thêm giảng viên
        </button>
      </div>

      {/* Modal thêm giảng viên */}
      {isModalOpen && (
        <div className="modal-overlay-GV">
          <div className="modal-content-GV">
            <div className="modal-header-GV">
              <h2>Thêm giảng viên mới</h2>
              <button className="close-btn-GV" onClick={handleCloseModal}>✕</button>
            </div>

            <div className="modal-body-GV">
              <form onSubmit={handleSubmit}>
                <div className="form-group-GV">
                  <label>Họ và tên:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group-GV">
                  <label>Mã giảng viên:</label>
                  <input
                    type="text"
                    name="teacherCode"
                    value={formData.teacherCode}
                    onChange={handleInputChange}
                    required
                    placeholder="GV001"
                  />
                </div>

                <div className="form-group-GV">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="giangvien@university.edu.vn"
                  />
                </div>

                <div className="form-group-GV">
                  <label>Số điện thoại:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="0987654321"
                  />
                </div>

                <div className="form-group-GV">
                  <label>Khoa:</label>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map(dept => (
                      <option key={dept._id || dept.id} value={dept.name}>  {/* ✅ Sửa key an toàn */}
                        {dept.name} ({dept.facultyCount} GV)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Chuyên ngành:</label>
                  <select
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.faculty}
                  >
                    <option value="">Chọn chuyên ngành</option>
                    {formData.faculty && faculties[formData.faculty]?.map(major => (
                      <option key={major} value={major}>{major}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Học vị:</label>
                  <select
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                  >
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Phó giáo sư">Phó giáo sư</option>
                    <option value="Giáo sư">Giáo sư</option>
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Chức vụ:</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                  >
                    <option value="Giảng viên">Giảng viên</option>
                    <option value="Giảng viên chính">Giảng viên chính</option>
                    <option value="Trợ lý giáo sư">Trợ lý giáo sư</option>
                    <option value="Phó giáo sư">Phó giáo sư</option>
                    <option value="Giáo sư">Giáo sư</option>
                    <option value="Trưởng bộ môn">Trưởng bộ môn</option>
                    <option value="Trưởng khoa">Trưởng khoa</option>
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Ngày bắt đầu làm việc:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                  <label>Mật khẩu:</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={autoGeneratePassword ? "Tự động tạo từ mã GV" : "Nhập mật khẩu"}
                      disabled={autoGeneratePassword}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password-btn"
                      style={{
                        padding: '8px 12px',
                        background: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                    <input
                      type="checkbox"
                      id="autoGeneratePassword"
                      checked={autoGeneratePassword}
                      onChange={(e) => {
                        setAutoGeneratePassword(e.target.checked);
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, password: '' }));
                        }
                      }}
                    />
                    <label htmlFor="autoGeneratePassword" style={{ marginLeft: '5px', fontSize: '13px' }}>
                      Tự động tạo mật khẩu (theo mã giảng viên)
                    </label>
                  </div>
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    {autoGeneratePassword
                      ? `Mật khẩu sẽ được tạo: ${formData.teacherCode || 'MAGV'}@${new Date().getFullYear()}`
                      : 'Nhập mật khẩu tùy chỉnh (ít nhất 6 ký tự)'}
                  </small>
                </div>

                <div className="modal-actions-GV">
                  <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Lưu giảng viên'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa giảng viên */}
      {isEditModalOpen && (
        <div className="modal-overlay-GV">
          <div className="modal-content-GV">
            <div className="modal-header-GV">
              <h2>Chỉnh sửa thông tin giảng viên</h2>
              <button className="close-btn-GV" onClick={handleCloseEditModal}>✕</button>
            </div>

            <div className="modal-body-GV">
              <form onSubmit={handleSaveEdit}>
                <div className="form-group-GV">
                  <label>Họ và tên:</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group-GV">
                  <label>Mã giảng viên:</label>
                  <input
                    type="text"
                    name="teacherCode"
                    value={formData.teacherCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group-GV">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group-GV">
                  <label>Số điện thoại:</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group-GV">
                  <label>Khoa:</label>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn khoa</option>
                    {departments.map(dept => (
                      <option key={dept._id || dept.id} value={dept.name}>  {/* ✅ Sửa key an toàn */}
                        {dept.name} ({dept.facultyCount} GV)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Chuyên ngành:</label>
                  <select
                    name="major"
                    value={formData.major}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Chọn chuyên ngành</option>
                    {formData.faculty && faculties[formData.faculty]?.map(major => (
                      <option key={major} value={major}>{major}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Học vị:</label>
                  <select
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                  >
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Phó giáo sư">Phó giáo sư</option>
                    <option value="Giáo sư">Giáo sư</option>
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Chức vụ:</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                  >
                    <option value="Giảng viên">Giảng viên</option>
                    <option value="Giảng viên chính">Giảng viên chính</option>
                    <option value="Trợ lý giáo sư">Trợ lý giáo sư</option>
                    <option value="Phó giáo sư">Phó giáo sư</option>
                    <option value="Giáo sư">Giáo sư</option>
                    <option value="Trưởng bộ môn">Trưởng bộ môn</option>
                    <option value="Trưởng khoa">Trưởng khoa</option>
                  </select>
                </div>

                <div className="form-group-GV">
                  <label>Ngày bắt đầu làm việc:</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />

                  <label>Mật khẩu:</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={autoGeneratePassword ? "Tự động tạo từ mã GV" : "Nhập mật khẩu"}
                      disabled={autoGeneratePassword}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="toggle-password-btn"
                      style={{
                        padding: '8px 12px',
                        background: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                    <input
                      type="checkbox"
                      id="autoGeneratePassword"
                      checked={autoGeneratePassword}
                      onChange={(e) => {
                        setAutoGeneratePassword(e.target.checked);
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, password: '' }));
                        }
                      }}
                    />
                    <label htmlFor="autoGeneratePassword" style={{ marginLeft: '5px', fontSize: '13px' }}>
                      Tự động tạo mật khẩu (theo mã giảng viên)
                    </label>
                  </div>
                  <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                    {autoGeneratePassword
                      ? `Mật khẩu sẽ được tạo: ${formData.teacherCode || 'MAGV'}@${new Date().getFullYear()}`
                      : 'Nhập mật khẩu tùy chỉnh (ít nhất 6 ký tự)'}
                  </small>
                </div>

                <div className="modal-actions-GV">
                  <button type="button" className="cancel-btn" onClick={handleCloseEditModal}>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Lưu giảng viên'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal khóa/mở khóa */}
      {isLockModalOpen && selectedTeacher && (
        <div className="modal-overlay-GV">
          <div className="modal-content-GV lock-modal">
            <div className="modal-header-GV">
              <h2>
                {selectedTeacher.isLocked ? 'Mở khóa' : 'Khóa'} tài khoản giảng viên
              </h2>
              <button className="close-btn-GV" onClick={() => setIsLockModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body-GV">
              <p className="lock-confirm-message">
                Bạn có chắc chắn muốn {selectedTeacher.isLocked ? 'mở khóa' : 'khóa'}
                tài khoản của <strong>{selectedTeacher.name}</strong>?
              </p>
              <div className="modal-actions-GV">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsLockModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={selectedTeacher.isLocked ? "unlock-btn" : "lock-btn"}
                  onClick={confirmLockToggle}
                >
                  {selectedTeacher.isLocked ? '🔓 Mở khóa' : '🔒 Khóa tài khoản'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal xóa giảng viên */}
      {isDeleteModalOpen && selectedTeacher && (
        <div className="modal-overlay-GV">
          <div className="modal-content-GV delete-modal">
            <div className="modal-header-GV">
              <h2>Xóa giảng viên</h2>
              <button className="close-btn-GV" onClick={() => setIsDeleteModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body-GV">
              <p className="delete-confirm-message">
                Bạn có chắc chắn muốn xóa giảng viên <strong>{selectedTeacher.name}</strong>?
                <br />
                <span style={{ color: 'red', fontSize: '14px' }}>
                  Hành động này không thể hoàn tác!
                </span>
              </p>
              <div className="modal-actions-GV">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={confirmDelete}
                >
                  🗑️ Xóa vĩnh viễn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="filters-GV">
        <div className="search-box-GV">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã GV, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon-GV">🔍</span>
        </div>

        <div className="filter-group-GV">
          <div className="department-filter-GV">
            <label className="filter-for-khoa">Khoa:</label>
            <select
           
              value={filterFaculty}
              onChange={(e) => {
                setFilterFaculty(e.target.value);
                setFilterMajor('Tất cả');
              }}
            >
              {facultyList.map(faculty => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>
          </div>

          <div className="department-filter-GV">
            <label>Chuyên ngành:</label>
            <select
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
          
            >
              {majorList.map(major => (
                <option key={major} value={major}>{major}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Thống kê */}
      <div className="stats-GV">
        <div className="stat-card-GV">
          <h3>Tổng số giảng viên</h3>
          <p className="stat-number-GV">{teachers.length}</p>
        </div>
        <div className="stat-card-GV">
          <h3>Đang hoạt động</h3>
          <p className="stat-number-GV">{teachers.filter(t => !t.isLocked).length}</p>
        </div>
        <div className="stat-card-GV">
          <h3>Đã khóa</h3>
          <p className="stat-number-GV">{teachers.filter(t => t.isLocked).length}</p>
        </div>
        <div className="stat-card-GV">
          <h3>Đang hiển thị</h3>
          <p className="stat-number-GV">{filteredTeachers.length}</p>
        </div>
      </div>

      {/* Danh sách giảng viên */}
      <div className="employee-grid-GV">
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map(teacher => (
            <div key={teacher._id} className="employee-card-GV">
              <div className="employee-header-GV">
                <img
                  src={teacher.avatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`}
                  alt={teacher.name}
                  className="employee-avatar-GV"
                />
                <div className="employee-info-GV">
                  <h3>{teacher.name}</h3>
                  <span className='department-nv'>{teacher.faculty}</span>
                  <span className="student-id">MGV: {teacher.teacherCode}</span>

                  {teacher.isLocked ? (
                    <span className="status-badge-list locked">🔒 Đã khóa</span>
                  ) : (
                    <span className="status-badge-list active">✅ Hoạt động</span>
                  )}
                </div>
              </div>

              <div className="employee-details">
                <div className="detail-item">
                  <span className="label">🎓 Học vị:</span>
                  <span className="value">{teacher.degree}</span>
                </div>
                <div className="detail-item">
                  <span className="label">👨‍🏫 Chức vụ:</span>
                  <span className="value">{teacher.position}</span>
                </div>
                <div className="detail-item">
                  <span className="label">📚 Chuyên ngành:</span>
                  <span className="value">{teacher.major}</span>
                </div>
                <div className="detail-item">
                  <span className="label">📧 Email:</span>
                  <span className="value">{teacher.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">📱 SĐT:</span>
                  <span className="value">{teacher.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="label">📅 Bắt đầu làm việc:</span>
                  <span className="value">
                    {teacher.startDate ? new Date(teacher.startDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="employee-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(teacher)}
                  disabled={teacher.isLocked}
                >
                  ✏️ Sửa
                </button>
                <button
                  className={teacher.isLocked ? "btn-unlock" : "btn-lock"}
                  onClick={() => handleLockToggle(teacher)}
                >
                  {teacher.isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}
                </button>
              
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>Không tìm thấy giảng viên nào phù hợp với tiêu chí tìm kiếm.</p>
          </div>
        )}
      </div>

      <div className="summary">
        <p>
          Hiển thị <strong>{filteredTeachers.length}</strong> trong tổng số <strong>{teachers.length}</strong> giảng viên
        </p>
      </div>
    </div>
  );
};

export default TeacherList;