// searchService.jsx
// Định nghĩa dữ liệu cho các trang
export const searchableContent = {
  // Dashboard
  '/dashboard': {
    title: 'Tổng quan',
    content: 'Dashboard tổng quan hệ thống, thống kê nhân sự, biểu đồ, báo cáo nhanh',
    keywords: ['dashboard', 'tổng quan', 'thống kê', 'biểu đồ', 'báo cáo']
  },
  
  // Employees
  '/employees/list': {
    title: 'Danh sách nhân viên',
    content: 'Quản lý danh sách nhân viên, thông tin cá nhân, chức vụ, phòng ban, lương, thưởng',
    keywords: ['nhân viên', 'danh sách', 'nhân sự', 'thông tin', 'chức vụ', 'lương']
  },
  
  // Organization
  '/organization/departments': {
    title: 'Quản lý Khoa',
    content: 'Quản lý các khoa trong trường đại học, trưởng khoa, giảng viên, sinh viên',
    keywords: ['khoa', 'khoa học', 'quản lý khoa', 'trưởng khoa']
  },
  '/organization/OfficeManagement': {
    title: 'Quản lý Phòng ban',
    content: 'Quản lý các phòng ban, nhân viên văn phòng, trưởng phòng, cơ cấu tổ chức',
    keywords: ['phòng ban', 'văn phòng', 'trưởng phòng', 'cơ cấu']
  },
  
  // Contracts
  '/contracts/listHD': {
    title: 'Danh sách hợp đồng',
    content: 'Danh sách hợp đồng lao động, hợp đồng thử việc, gia hạn hợp đồng, thanh lý hợp đồng',
    keywords: ['hợp đồng', 'lao động', 'thử việc', 'gia hạn', 'thanh lý']
  },
  '/contracts/createHD': {
    title: 'Tạo hợp đồng mới',
    content: 'Tạo mới hợp đồng lao động, chọn loại hợp đồng, thời hạn, điều khoản, ký kết',
    keywords: ['tạo hợp đồng', 'hợp đồng mới', 'ký kết', 'điều khoản']
  },
  
  // Attendance
  '/attendance/AttendanceManagement': {
    title: 'Quản lý Chấm công',
    content: 'Chấm công hàng ngày, quản lý giờ vào ra, điểm danh, nghỉ phép, đi muộn về sớm',
    keywords: ['chấm công', 'điểm danh', 'giờ vào', 'giờ ra', 'nghỉ phép']
  },
  '/attendance/AttendanceReport': {
    title: 'Báo cáo chấm công',
    content: 'Báo cáo chấm công theo tháng, năm, thống kê giờ làm, tính lương, OT',
    keywords: ['báo cáo', 'chấm công', 'thống kê', 'lương', 'OT', 'làm thêm']
  },
  '/attendance/BusinessTrip': {
    title: 'Quản lý công tác',
    content: 'Đăng ký công tác, phê duyệt, thanh toán công tác phí, báo cáo công tác',
    keywords: ['công tác', 'công tác phí', 'đi công tác', 'thanh toán']
  },
  
  // Training
  '/training/courses': {
    title: 'Quản lý đào tạo',
    content: 'Khóa học, chương trình đào tạo, bồi dưỡng nghiệp vụ, kỹ năng mềm, chứng chỉ',
    keywords: ['đào tạo', 'khóa học', 'bồi dưỡng', 'chứng chỉ', 'nghiệp vụ']
  },
  '/training/adminmanagerschedule': {
    title: 'Lịch Giảng Viên',
    content: 'Quản lý lịch dạy của giảng viên, phân công giảng dạy, thời khóa biểu',
    keywords: ['giảng viên', 'lịch dạy', 'phân công', 'thời khóa biểu']
  },
  
  // Chat
  '/chat-NV/chatNV': {
    title: 'Nhắn tin',
    content: 'Chat nội bộ, nhắn tin với đồng nghiệp, nhóm chat, gửi file, tin nhắn nhanh',
    keywords: ['chat', 'nhắn tin', 'tin nhắn', 'trao đổi', 'liên lạc']
  },
  
  // Users & Permissions
  '/users-permissions/UserManagement': {
    title: 'Quản lý người dùng',
    content: 'Tạo tài khoản, phân quyền, vai trò, quyền truy cập, bảo mật, xác thực',
    keywords: ['người dùng', 'tài khoản', 'phân quyền', 'vai trò', 'bảo mật']
  },
  
  // Settings
  '/settings': {
    title: 'Cài đặt hệ thống',
    content: 'Cấu hình hệ thống, giao diện, ngôn ngữ, thông báo, email, backup',
    keywords: ['cài đặt', 'cấu hình', 'giao diện', 'ngôn ngữ', 'backup']
  },
  
  // Profile
  '/profile': {
    title: 'Tài khoản cá nhân',
    content: 'Thông tin cá nhân, đổi mật khẩu, ảnh đại diện, thay đổi thông tin',
    keywords: ['profile', 'cá nhân', 'đổi mật khẩu', 'thông tin']
  }
};

// Hàm chuẩn bị index cho trang
export const prepareSearchIndex = () => {
  const index = [];
  
  Object.entries(searchableContent).forEach(([path, data]) => {
    const searchText = `${data.title} ${data.content} ${data.keywords.join(' ')}`.toLowerCase();
    
    index.push({
      path,
      title: data.title,
      content: data.content,
      keywords: data.keywords,
      searchText,
      priority: getPriorityScore(path),
      type: 'page' // Thêm type để phân biệt
    });
  });
  
  return index;
};

// Điểm ưu tiên
const getPriorityScore = (path) => {
  const priorities = {
    '/dashboard': 100,
    '/employees/list': 95,
    '/attendance/AttendanceManagement': 90,
    '/contracts/listHD': 85,
    '/users-permissions/UserManagement': 85
  };
  return priorities[path] || 50;
};

// Dữ liệu thực tế
export const realData = {
  teachers: [
    { id: 'GV001', name: 'Nguyễn Văn An', code: 'GV01', department: 'Khoa Công nghệ thông tin', email: 'an.nguyen@university.edu', phone: '0912345678' },
    { id: 'GV002', name: 'Trần Thị Bình', code: 'GV02', department: 'Khoa Quản trị kinh doanh', email: 'binh.tran@university.edu', phone: '0912345679' },
    { id: 'GV003', name: 'Lê Hoàng Cường', code: 'GV03', department: 'Khoa Ngoại ngữ', email: 'cuong.le@university.edu', phone: '0912345680' },
    { id: 'GV004', name: 'giang vien 04', code: 'GV04', department: 'Khoa Kế toán', email: 'dung.pham@university.edu', phone: '0912345681' },
    { id: 'GV005', name: 'Hoàng Văn Em', code: 'GV05', department: 'Khoa Công nghệ thông tin', email: 'em.hoang@university.edu', phone: '0912345682' }
  ],
  
  employees: [
    { id: 'NV001', name: 'Trần Văn Hùng', position: 'Trưởng phòng Nhân sự', department: 'Phòng Hành chính', phone: '0987654321' },
    { id: 'NV002', name: 'Nguyễn Thị Lan', position: 'Nhân viên Kế toán', department: 'Phòng Tài vụ', phone: '0987654322' }
  ],
  
  contracts: [
    { id: 'HD001', code: 'HD-2024-001', employeeName: 'Nguyễn Văn An', type: 'Hợp đồng chính thức', startDate: '2024-01-01', endDate: '2024-12-31' }
  ],
  
  courses: [
    { id: 'KH001', name: 'Lập trình React nâng cao', teacher: 'Nguyễn Văn An', schedule: 'Thứ 2,4,6', students: 30 }
  ]
};

// Chuẩn bị index cho dữ liệu thực
export const prepareRealDataIndex = () => {
  const index = [];
  
  // Teachers
  realData.teachers.forEach(teacher => {
    index.push({
      id: teacher.id,
      type: 'teacher',
      title: teacher.name,
      subtitle: `Mã: ${teacher.code} - ${teacher.department}`,
      content: `${teacher.name} ${teacher.code} ${teacher.department} ${teacher.email} ${teacher.phone}`,
      path: getPathByType('teacher', teacher.id),
      keywords: [teacher.name, teacher.code, teacher.department, teacher.email, teacher.phone],
      metadata: teacher
    });
  });
  
  // Employees
  realData.employees.forEach(employee => {
    index.push({
      id: employee.id,
      type: 'employee',
      title: employee.name,
      subtitle: `${employee.position} - ${employee.department}`,
      content: `${employee.name} ${employee.position} ${employee.department} ${employee.phone}`,
      path: getPathByType('employee', employee.id),
      keywords: [employee.name, employee.position, employee.department, employee.phone],
      metadata: employee
    });
  });
  
  // Contracts
  realData.contracts.forEach(contract => {
    index.push({
      id: contract.id,
      type: 'contract',
      title: contract.code,
      subtitle: `${contract.employeeName} - ${contract.type}`,
      content: `${contract.code} ${contract.employeeName} ${contract.type} ${contract.startDate} ${contract.endDate}`,
      path: getPathByType('contract', contract.id),
      keywords: [contract.code, contract.employeeName, contract.type],
      metadata: contract
    });
  });
  
  // Courses
  realData.courses.forEach(course => {
    index.push({
      id: course.id,
      type: 'course',
      title: course.name,
      subtitle: `GV: ${course.teacher} - Lịch: ${course.schedule}`,
      content: `${course.name} ${course.teacher} ${course.schedule}`,
      path: getPathByType('course', course.id),
      keywords: [course.name, course.teacher, course.schedule],
      metadata: course
    });
  });
  
  return index;
};

// Xác định đường dẫn
const getPathByType = (type, id) => {
  switch(type) {
    case 'teacher':
      return `/training/adminmanagerschedule?teacherId=${id}`;
    case 'employee':
      return `/employees/list?employeeId=${id}`;
    case 'contract':
      return `/contracts/listHD?contractId=${id}`;
    case 'course':
      return `/training/courses?courseId=${id}`;
    default:
      return '/';
  }
};

// Kết hợp cả 2 loại index
export const getCombinedSearchIndex = () => {
  const pageIndex = prepareSearchIndex();
  const realDataIndex = prepareRealDataIndex();
  return [...pageIndex, ...realDataIndex];
};