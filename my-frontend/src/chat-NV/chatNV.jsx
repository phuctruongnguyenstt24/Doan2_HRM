import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './chatNV.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

const ChatNV = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [teachers, setTeachers] = useState([]); // THÊM: danh sách giảng viên
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTyping, setUserTyping] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('employees'); // THÊM: tab active

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Lấy current user
  useEffect(() => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
    else navigate('/login');
  }, [navigate]);

  // Kết nối Socket
  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' }
    });

    socketRef.current.on('connect', () => console.log('Socket connected'));
    socketRef.current.on('connect_error', (err) => console.error('Socket error:', err));

    socketRef.current.on('new_message', (message) => {
      if (!message?.sender) return;
      
      if (selectedUser?._id === message.sender._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
      fetchConversations();
      fetchUnreadCounts();
    });

    socketRef.current.on('message_sent', (message) => {
      setMessages(prev => prev.filter(m => !m.isTemp));
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('user_typing', ({ userId, isTyping }) => {
      if (selectedUser?._id === userId) setUserTyping(isTyping);
    });

    return () => { socketRef.current?.disconnect(); };
  }, [currentUser, selectedUser]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
      fetchTeachers(); // THÊM: tải danh sách giảng viên
      fetchConversations();
      fetchUnreadCounts();
    }
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Load messages khi chọn user
  useEffect(() => {
    if (selectedUser) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      fetchMessages(1);
      setUnreadCounts(prev => ({ ...prev, [selectedUser._id]: 0 }));
      markAsRead(selectedUser._id);
    }
    setUserTyping(null);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // THÊM: fetch danh sách giảng viên
  const fetchTeachers = async () => {
    try {
      const res = await api.get('/messages/teachers');
      setTeachers(res.data);
    } catch (err) { 
      console.error('Fetch teachers error:', err); 
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/messages/employees');
      setEmployees(res.data);
    } catch (err) { console.error('Fetch employees error:', err); }
  };

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } catch (err) { console.error('Fetch conversations error:', err); }
  };

  const fetchMessages = async (pageNum) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await api.get(`/messages/messages/${selectedUser._id}`, {
        params: { page: pageNum, limit: 50 }
      });
      if (pageNum === 1) setMessages(res.data.messages);
      else setMessages(prev => [...res.data.messages, ...prev]);
      setHasMore(res.data.messages.length === 50);
    } catch (err) { console.error('Fetch messages error:', err); }
    finally { setLoading(false); }
  };

  const fetchUnreadCounts = async () => {
    if (!currentUser?._id) return;
    try {
      const res = await api.get('/messages/conversations');
      const counts = {};
      res.data.forEach(conv => {
        const otherUser = conv.participants?.find(p => p._id !== currentUser._id);
        if (otherUser) {
          let unread = 0;
          if (conv.unreadCount) {
            unread = typeof conv.unreadCount.get === 'function' 
              ? conv.unreadCount.get(currentUser._id) || 0
              : conv.unreadCount[currentUser._id] || 0;
          }
          if (unread > 0) counts[otherUser._id] = unread;
        }
      });
      setUnreadCounts(counts);
    } catch (err) { console.error('Fetch unread counts error:', err); }
  };

  const markAsRead = async (userId) => {
    try {
      await api.post(`/messages/mark-as-read/${userId}`);
    } catch (err) { console.error('Mark as read error:', err); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending || !currentUser) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const tempMessage = {
      _id: Date.now(),
      content,
      sender: { _id: currentUser._id },
      receiver: { _id: selectedUser._id },
      createdAt: new Date(),
      isTemp: true
    };
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      await api.post('/messages/send', {
        receiverId: selectedUser._id,
        content
      });
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      fetchConversations();
    } catch (err) {
      console.error('Send message error:', err);
      setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
      setNewMessage(content);
      alert('Gửi tin nhắn thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!userTyping && e.target.value.trim() && selectedUser) {
      socketRef.current?.emit('typing', { receiverId: selectedUser._id, isTyping: true });
    }
    
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedUser) {
        socketRef.current?.emit('typing', { receiverId: selectedUser._id, isTyping: false });
      }
    }, 1000);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMessages(nextPage);
    }
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && !loading && hasMore) handleLoadMore();
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4f46e5&color=fff`;
  };

  const formatTime = (date) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return msgDate.toLocaleDateString('vi-VN');
  };

  const getRoleLabel = (role) => {
    const roles = { admin: 'AD', teacher: 'GV', employee: 'NV' };
    return roles[role] || 'NV';
  };

  // THÊM: lấy danh sách users theo tab
  const getFilteredUsers = () => {
    const users = activeTab === 'employees' ? employees : teachers;
    return users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.teacherCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // THÊM: lấy label cho user
  const getUserLabel = (user) => {
    if (user.role === 'teacher') return 'Giảng viên';
    if (user.role === 'admin') return 'Quản trị viên';
    return 'Nhân viên';
  };

  const filteredUsers = getFilteredUsers();

  if (!currentUser) return <div className="loading">Đang tải...</div>;

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header-chat">
          <h3>💬 Tin nhắn</h3>
          
          {/* THÊM: Tabs */}
          <div className="chat-tabs">
            <button 
              className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              👥 Nhân viên ({employees.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              👨‍🏫 Giảng viên ({teachers.length})
            </button>
          </div>

          <div className="search-box-chat">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="conversations-list">
          {/* Conversations - tin nhắn gần đây */}
          <div className="section-title">📋 Tin nhắn gần đây</div>
          {conversations.map(conv => {
            const otherUser = conv.participants?.find(p => p._id !== currentUser._id);
            if (!otherUser) return null;
            const unread = unreadCounts[otherUser._id] || 0;

            return (
              <div
                key={conv._id}
                className={`conversation-item ${selectedUser?._id === otherUser._id ? 'active' : ''}`}
                onClick={() => setSelectedUser(otherUser)}
              >
                <div className="conversation-avatar">
                  <img src={otherUser.avatar || getAvatarUrl(otherUser.name)} alt="" />
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {otherUser.name}
                    <span className="role-badge">{getRoleLabel(otherUser.role)}</span>
                  </div>
                  <div className="conversation-last-message">
                    {conv.lastMessage?.substring(0, 50) || 'Chưa có tin nhắn'}
                  </div>
                </div>
                <div className="conversation-meta">
                  <div className="conversation-time">{formatTime(conv.lastMessageTime)}</div>
                  {unread > 0 && <div className="unread-badge">{unread > 99 ? '99+' : unread}</div>}
                </div>
              </div>
            );
          })}

          {/* Users list theo tab */}
          <div className="section-title">
            {activeTab === 'employees' ? '📋 Tất cả nhân viên' : '📋 Tất cả giảng viên'}
          </div>
          
          {filteredUsers.map(user => {
            const unread = unreadCounts[user._id] || 0;
            return (
              <div
                key={user._id}
                className={`employee-item ${selectedUser?._id === user._id ? 'active' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="employee-avatar-chat">
                  <img src={user.avatar || getAvatarUrl(user.name)} alt="" />
                </div>
                <div className="employee-info-chat">
                  <div className="employee-name-chat">
                    {user.name || user.email}
                    {user.employeeId && <span className="employee-id">({user.employeeId})</span>}
                    {user.teacherCode && <span className="employee-id">({user.teacherCode})</span>}
                  </div>
                  <div className="employee-email">{user.email}</div>
                  <div className="employee-role">{getUserLabel(user)}</div>
                </div>
                {unread > 0 && <div className="unread-badge">{unread > 99 ? '99+' : unread}</div>}
              </div>
            );
          })}
          
          {filteredUsers.length === 0 && (
            <div className="no-users">
              <p>
                {activeTab === 'employees' 
                  ? 'Không tìm thấy nhân viên' 
                  : 'Không tìm thấy giảng viên'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area - giữ nguyên */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <img src={selectedUser.avatar || getAvatarUrl(selectedUser.name)} alt="" className="chat-avatar" />
                <div>
                  <div className="chat-user-name">
                    {selectedUser.name || selectedUser.email}
                    {(selectedUser.employeeId || selectedUser.teacherCode) && 
                      <span className="user-employee-id"> - {selectedUser.employeeId || selectedUser.teacherCode}</span>
                    }
                  </div>
                  <div className="chat-user-status">
                    {userTyping ? 
                      <span className="typing-indicator">Đang nhập...</span> : 
                      <span>{getUserLabel(selectedUser)}</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="messages-area" ref={messagesContainerRef} onScroll={handleScroll}>
              {loading && page === 1 && <div className="loading-messages">Đang tải...</div>}
              
              {!loading && messages.length === 0 && (
                <div className="no-messages">
                  <div className="no-messages-icon">💬</div>
                  <p>Chưa có tin nhắn nào</p>
                  <p className="no-messages-sub">Hãy gửi tin nhắn đầu tiên</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isOwn = msg.sender?._id === currentUser._id;
                const showAvatar = idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id;
                
                return (
                  <div key={msg._id} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
                    {!isOwn && showAvatar && (
                      <img src={msg.sender?.avatar || getAvatarUrl(msg.sender?.name)} alt="" className="message-avatar" />
                    )}
                    <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${msg.isTemp ? 'temp' : ''}`}>
                      {!isOwn && showAvatar && <div className="message-sender-name">{msg.sender?.name || msg.sender?.email}</div>}
                      <div className="message-content">{msg.content}</div>
                      <div className="message-time">
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {msg.isTemp && <span className="sending-status"> • Đang gửi...</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {loading && page > 1 && <div className="loading-more">Đang tải thêm...</div>}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Nhập tin nhắn..."
                disabled={sending}
                className="message-input"
              />
              <button type="submit" disabled={!newMessage.trim() || sending} className="send-button">
                {sending ? '⏳' : '📤'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>Chào mừng đến với tin nhắn</h3>
            <p>Chọn một nhân viên hoặc giảng viên để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatNV;