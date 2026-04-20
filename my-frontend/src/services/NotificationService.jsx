// services/NotificationService.js
import { realData } from './searchService';

class NotificationService {
  constructor() {
    this.listeners = [];
    this.notifications = [];
    this.audio = null;
    this.lastCheckTime = new Date();
    this.checkInterval = null;
    this.isSoundEnabled = true;
    
    this.initAudio();
  }

  initAudio() {
    // Tạo audio notification (sử dụng Web Audio API hoặc file âm thanh)
    try {
      this.audio = new Audio('./notification.mp3'); // Đường dẫn đến file âm thanh
      this.audio.volume = 0.5;
    } catch (error) {
      console.warn('Could not load audio file:', error);
    }
  }

  // Play notification sound
  playSound() {
    if (this.isSoundEnabled && this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }

  // Kiểm tra dữ liệu realtime
  async checkRealTimeData() {
    const newNotifications = [];
    const now = new Date();

    // 1. Kiểm tra hợp đồng sắp hết hạn (7 ngày)
    const expiringContracts = this.checkExpiringContracts(now);
    newNotifications.push(...expiringContracts);

    // 2. Kiểm tra chấm công mới hôm nay
    const newAttendance = this.checkNewAttendance(now);
    newNotifications.push(...newAttendance);

    // 3. Kiểm tra tin nhắn chưa đọc
    const unreadMessages = this.checkUnreadMessages();
    newNotifications.push(...unreadMessages);

    // 4. Kiểm tra người dùng mới truy cập
    const newVisitors = this.checkNewVisitors(now);
    newNotifications.push(...newVisitors);

    // 5. Kiểm tra khóa học sắp bắt đầu
    const upcomingCourses = this.checkUpcomingCourses(now);
    newNotifications.push(...upcomingCourses);

    // 6. Kiểm tra yêu cầu nghỉ phép mới
    const newLeaveRequests = this.checkNewLeaveRequests();
    newNotifications.push(...newLeaveRequests);

    // Lọc trùng và thêm mới
    const uniqueNotifications = this.filterUniqueNotifications(newNotifications);
    
    if (uniqueNotifications.length > 0) {
      this.addNotifications(uniqueNotifications);
      this.notifyListeners(uniqueNotifications);
      
      // Phát âm thanh cho thông báo quan trọng
      const hasImportant = uniqueNotifications.some(n => n.priority === 'high');
      if (hasImportant) {
        this.playSound();
      }
    }

    return uniqueNotifications;
  }

  // Kiểm tra hợp đồng sắp hết hạn
  checkExpiringContracts(now) {
    const notifications = [];
    const contracts = this.getContractsFromStorage();
    
    contracts.forEach(contract => {
      const endDate = new Date(contract.endDate);
      const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      // Kiểm tra trong vòng 7 ngày tới
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0 && !contract.notified) {
        // Kiểm tra xem đã thông báo chưa
        const alreadyNotified = this.checkIfNotified(`contract_${contract.id}`);
        
        if (!alreadyNotified) {
          notifications.push({
            id: `contract_${contract.id}_${Date.now()}`,
            type: 'contract',
            title: 'Hợp đồng sắp hết hạn',
            message: `Hợp đồng ${contract.code} của ${contract.employeeName} sẽ hết hạn sau ${daysUntilExpiry} ngày`,
            time: now,
            read: false,
            priority: daysUntilExpiry <= 3 ? 'high' : 'medium',
            data: { contractId: contract.id, daysLeft: daysUntilExpiry },
            link: `/contracts/listHD?contractId=${contract.id}`
          });
          
          // Đánh dấu đã thông báo
          this.markAsNotified(`contract_${contract.id}`);
        }
      }
    });
    
    return notifications;
  }

  // Kiểm tra chấm công mới
  checkNewAttendance(now) {
    const notifications = [];
    const attendance = this.getAttendanceFromStorage();
    const today = now.toDateString();
    
    attendance.forEach(record => {
      const recordDate = new Date(record.date).toDateString();
      
      // Chấm công hôm nay và chưa được duyệt
      if (recordDate === today && record.status === 'pending' && !record.notified) {
        const alreadyNotified = this.checkIfNotified(`attendance_${record.id}_${today}`);
        
        if (!alreadyNotified) {
          notifications.push({
            id: `attendance_${record.id}_${Date.now()}`,
            type: 'attendance',
            title: 'Chấm công mới',
            message: `${record.employeeName} đã chấm công lúc ${record.time} - Chờ duyệt`,
            time: now,
            read: false,
            priority: 'medium',
            data: { attendanceId: record.id, employeeName: record.employeeName },
            link: `/attendance/AttendanceManagement`
          });
          
          this.markAsNotified(`attendance_${record.id}_${today}`);
        }
      }
    });
    
    return notifications;
  }

  // Kiểm tra tin nhắn chưa đọc
  checkUnreadMessages() {
    const notifications = [];
    const messages = this.getMessagesFromStorage();
    const currentUser = this.getCurrentUser();
    
    messages.forEach(message => {
      if (message.receiverId === currentUser.id && !message.read && !message.notified) {
        const alreadyNotified = this.checkIfNotified(`message_${message.id}`);
        
        if (!alreadyNotified) {
          notifications.push({
            id: `message_${message.id}_${Date.now()}`,
            type: 'message',
            title: 'Tin nhắn mới',
            message: `${message.senderName}: ${message.content.substring(0, 50)}...`,
            time: new Date(message.timestamp),
            read: false,
            priority: 'high',
            data: { messageId: message.id, senderId: message.senderId },
            link: `/chat-NV/chatNV`
          });
          
          this.markAsNotified(`message_${message.id}`);
        }
      }
    });
    
    return notifications;
  }

  // Kiểm tra người dùng mới truy cập
  checkNewVisitors(now) {
    const notifications = [];
    const visitors = this.getVisitorsFromStorage();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    visitors.forEach(visitor => {
      const visitTime = new Date(visitor.timestamp);
      if (visitTime > this.lastCheckTime && visitTime > lastHour) {
        const alreadyNotified = this.checkIfNotified(`visitor_${visitor.userId}_${visitTime.toISOString()}`);
        
        if (!alreadyNotified) {
          notifications.push({
            id: `visitor_${visitor.userId}_${Date.now()}`,
            type: 'visitor',
            title: 'Người dùng mới truy cập',
            message: `${visitor.userName} vừa đăng nhập vào hệ thống lúc ${visitTime.toLocaleTimeString()}`,
            time: visitTime,
            read: false,
            priority: 'low',
            data: { userId: visitor.userId, userName: visitor.userName },
            link: '/users-permissions/UserManagement'
          });
          
          this.markAsNotified(`visitor_${visitor.userId}_${visitTime.toISOString()}`);
        }
      }
    });
    
    return notifications;
  }

  // Kiểm tra khóa học sắp bắt đầu
  checkUpcomingCourses(now) {
    const notifications = [];
    const courses = this.getCoursesFromStorage();
    
    courses.forEach(course => {
      const startDate = new Date(course.startDate);
      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStart <= 3 && daysUntilStart >= 0 && !course.notified) {
        const alreadyNotified = this.checkIfNotified(`course_${course.id}`);
        
        if (!alreadyNotified) {
          notifications.push({
            id: `course_${course.id}_${Date.now()}`,
            type: 'course',
            title: 'Khóa học sắp bắt đầu',
            message: `Khóa học "${course.name}" sẽ bắt đầu vào ngày ${startDate.toLocaleDateString()}`,
            time: now,
            read: false,
            priority: daysUntilStart <= 1 ? 'high' : 'medium',
            data: { courseId: course.id, daysUntilStart },
            link: `/training/courses?courseId=${course.id}`
          });
          
          this.markAsNotified(`course_${course.id}`);
        }
      }
    });
    
    return notifications;
  }

  // Kiểm tra yêu cầu nghỉ phép mới
  checkNewLeaveRequests() {
    const notifications = [];
    const leaveRequests = this.getLeaveRequestsFromStorage();
    
    leaveRequests.forEach(request => {
      if (request.status === 'pending' && !request.notified) {
        const alreadyNotified = this.checkIfNotified(`leave_${request.id}`);
        
        if (!alreadyNotified) {
          notifications.push({
            id: `leave_${request.id}_${Date.now()}`,
            type: 'leave',
            title: 'Yêu cầu nghỉ phép mới',
            message: `${request.employeeName} yêu cầu nghỉ phép từ ${request.startDate} đến ${request.endDate}`,
            time: new Date(request.createdAt),
            read: false,
            priority: 'high',
            data: { requestId: request.id, employeeName: request.employeeName },
            link: '/attendance/AttendanceManagement'
          });
          
          this.markAsNotified(`leave_${request.id}`);
        }
      }
    });
    
    return notifications;
  }

  // Lấy dữ liệu từ localStorage/sessionStorage
  getContractsFromStorage() {
    try {
      const contracts = localStorage.getItem('contracts');
      return contracts ? JSON.parse(contracts) : [];
    } catch {
      return [];
    }
  }

  getAttendanceFromStorage() {
    try {
      const attendance = localStorage.getItem('attendance');
      return attendance ? JSON.parse(attendance) : [];
    } catch {
      return [];
    }
  }

  getMessagesFromStorage() {
    try {
      const messages = localStorage.getItem('messages');
      return messages ? JSON.parse(messages) : [];
    } catch {
      return [];
    }
  }

  getVisitorsFromStorage() {
    try {
      const visitors = localStorage.getItem('visitors');
      return visitors ? JSON.parse(visitors) : [];
    } catch {
      return [];
    }
  }

  getCoursesFromStorage() {
    try {
      const courses = localStorage.getItem('courses');
      return courses ? JSON.parse(courses) : [];
    } catch {
      return [];
    }
  }

  getLeaveRequestsFromStorage() {
    try {
      const leaves = localStorage.getItem('leaveRequests');
      return leaves ? JSON.parse(leaves) : [];
    } catch {
      return [];
    }
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { id: 'admin', name: 'Admin' };
    } catch {
      return { id: 'admin', name: 'Admin' };
    }
  }

  // Kiểm tra đã thông báo chưa
  checkIfNotified(key) {
    const notified = localStorage.getItem(`notified_${key}`);
    return notified === 'true';
  }

  markAsNotified(key) {
    localStorage.setItem(`notified_${key}`, 'true');
    // Tự động xóa sau 30 ngày
    setTimeout(() => {
      localStorage.removeItem(`notified_${key}`);
    }, 30 * 24 * 60 * 60 * 1000);
  }

  // Lọc thông báo trùng
  filterUniqueNotifications(newNotifications) {
    const existingIds = new Set(this.notifications.map(n => n.id));
    return newNotifications.filter(n => !existingIds.has(n.id));
  }

  // Thêm thông báo
  addNotifications(newNotifications) {
    this.notifications = [...newNotifications, ...this.notifications];
    this.saveToStorage();
  }

  // Lưu vào localStorage
  saveToStorage() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // Đánh dấu đã đọc
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners([], true); // Notify để refresh UI
      return true;
    }
    return false;
  }

  // Đánh dấu tất cả đã đọc
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notifyListeners([], true);
  }

  // Xóa thông báo
  deleteNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveToStorage();
    this.notifyListeners([], true);
  }

  // Lấy tất cả thông báo
  getNotifications() {
    return this.notifications;
  }

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Đăng ký listener
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Thông báo cho listeners
  notifyListeners(newNotifications, isUpdate = false) {
    this.listeners.forEach(listener => {
      listener({
        notifications: this.notifications,
        unreadCount: this.getUnreadCount(),
        newNotifications,
        isUpdate
      });
    });
  }

  // Bắt đầu kiểm tra realtime
  startRealtimeCheck(intervalMs = 30000) { // Mỗi 30 giây
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Kiểm tra ngay lập tức
    this.checkRealTimeData();
    
    // Kiểm tra định kỳ
    this.checkInterval = setInterval(() => {
      this.checkRealTimeData();
    }, intervalMs);
  }

  // Dừng kiểm tra
  stopRealtimeCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Bật/tắt âm thanh
  toggleSound(enabled) {
    this.isSoundEnabled = enabled;
    localStorage.setItem('notificationSound', enabled);
  }

  // Load cài đặt
  loadSettings() {
    const soundEnabled = localStorage.getItem('notificationSound');
    if (soundEnabled !== null) {
      this.isSoundEnabled = soundEnabled === 'true';
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();
notificationService.loadSettings();

export default notificationService;