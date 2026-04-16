import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './chatNV.css';

// Tạo axios instance với base URL đúng
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor để thêm token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['ngrok-skip-browser-warning'] = 'true';  // THÊM DÒNG NÀY
  return config;
});

const ChatNV = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
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
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Lấy current user từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Kết nối Socket.IO
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token && !user) {
      navigate('/login');
    }
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';  // DÙNG VITE_SOCKET_URL
    console.log('Connecting to socket:', socketUrl);

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      // THÊM HEADER ĐỂ BỎ QUA TRANG CẢNH BÁO CỦA NGrok
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('new_message', (message) => {
      console.log('New message received:', message);
      if (selectedUser && message.sender._id === selectedUser._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }

      updateConversations();

      if (!selectedUser || message.sender._id !== selectedUser._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.sender._id]: (prev[message.sender._id] || 0) + 1
        }));
      }
    });

    socketRef.current.on('message_sent', (message) => {
      console.log('Message sent:', message);
      setMessages(prev => prev.filter(msg => !msg.isTemp));
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('user_typing', ({ userId, isTyping }) => {
      if (selectedUser && userId === selectedUser._id) {
        setUserTyping(isTyping);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate, selectedUser]);

  // Load danh sách nhân viên và conversations
  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
      fetchConversations();
      fetchTotalMessages(); // THÊM DÒNG NÀY
      fetchAllUnreadCounts(); // SỬA: đổi từ fetchUnreadCount
    }

    const interval = setInterval(() => {
      fetchAllUnreadCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Load messages khi chọn user
  useEffect(() => {
    if (selectedUser) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      fetchMessages(1);

      setUnreadCounts(prev => ({
        ...prev,
        [selectedUser._id]: 0
      }));
      // Gọi API để reset unread count trên server
      resetUnreadCountForUser(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/messages/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (pageNum) => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await api.get(`/messages/messages/${selectedUser._id}`, {
        params: { page: pageNum, limit: 50 }
      });

      if (pageNum === 1) {
        setMessages(response.data.messages);
      } else {
        setMessages(prev => [...response.data.messages, ...prev]);
      }

      setHasMore(response.data.messages.length === 50);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // CHATNV.JSX - Thay thế hàm fetchUnreadCount
  const fetchAllUnreadCounts = async () => {
    if (!currentUser) return;

    try {
      const response = await api.get('/messages/conversations');
      const conversations = response.data;

      const counts = {};
      conversations.forEach(conv => {
        const otherUser = conv.participants.find(p => p._id !== currentUser._id);
        if (otherUser) {
          const unreadCount = conv.unreadCount?.get?.(currentUser._id) || 0;
          if (unreadCount > 0) {
            counts[otherUser._id] = unreadCount;
          }
        }
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  const resetUnreadCountForUser = async (userId) => {
    try {
      await api.post(`/messages/mark-as-read/${userId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };


  // CHATNV.JSX - Thêm sau resetUnreadCountForUser
  const fetchTotalMessages = async () => {
    setStatsLoading(true);
    try {
      const response = await api.get('/messages/stats/total');
      setTotalMessages(response.data.total);
    } catch (error) {
      console.error('Error fetching total messages:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  const updateConversations = async () => {
    await fetchConversations();
    await fetchAllUnreadCounts();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempMessage = {
      _id: Date.now(),
      content: messageContent,
      sender: { _id: currentUser?._id },
      receiver: { _id: selectedUser._id },
      createdAt: new Date(),
      isTemp: true
    };
    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      await api.post('/messages/send', {
        receiverId: selectedUser._id,
        content: messageContent
      });

      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      updateConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Gửi tin nhắn thất bại');
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping && e.target.value.trim() && selectedUser) {
      setIsTyping(true);
      socketRef.current?.emit('typing', {
        receiverId: selectedUser._id,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && selectedUser) {
        setIsTyping(false);
        socketRef.current?.emit('typing', {
          receiverId: selectedUser._id,
          isTyping: false
        });
      }
    }, 1000);
  };

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchMessages(nextPage);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && !loading && hasMore) {
      handleLoadMore();
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
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

  if (!currentUser) {
    return <div className="loading">Loading...</div>;
  }
  const getUserRoleLabel = (user) => {
    if (user.role === 'admin') return 'Quản trị viên';
    if (user.role === 'manager') return 'Quản lý';
    if (user.role === 'employee') return 'Nhân viên';
    return 'Nhân viên';
  };
  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header-chat">
          <h3>💬 Tin nhắn</h3>
          <div className="search-box-chat">
            <input
              type="text"
              placeholder="🔍 Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Phần conversations list - scroll riêng */}
        <div className="conversations-list">
          {/* Conversations section */}
          {conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id !== currentUser._id);
            if (!otherUser) return null;
            const unread = unreadCounts[otherUser._id] || 0;

            return (
              <div
                key={conv._id}
                className={`conversation-item ${selectedUser?._id === otherUser._id ? 'active' : ''}`}
                onClick={() => setSelectedUser(otherUser)}
              >
                <div className="conversation-avatar">
                  <img src={otherUser.avatar || '/default-avatar.png'} alt={otherUser.name} />
                  {otherUser.isActive && <span className="online-status"></span>}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {otherUser.name}
                    {otherUser.role === 'manager' && <span className="role-badge manager">QL</span>}
                    {otherUser.role === 'user' && <span className="role-badge staff">NV</span>}
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

          {/* Employees section */}
          <div className="employees-section">
            <div className="section-title">📋 Tất cả nhân viên</div>
            {filteredEmployees.map(emp => {
              const unread = unreadCounts[emp._id] || 0;
              return (
                <div
                  key={emp._id}
                  className={`employee-item ${selectedUser?._id === emp._id ? 'active' : ''}`}
                  onClick={() => setSelectedUser(emp)}
                >
                  <div className="employee-avatar-chat">
                    <img src={emp.avatar || '/default-avatar.png'} alt={emp.name} />
                  </div>
                  <div className="employee-info-chat">
                    <div className="employee-name-chat">
                      {emp.name || emp.email}
                      {emp.employeeId && <span className="employee-id">({emp.employeeId})</span>}
                    </div>
                    <div className="employee-email">{emp.email}</div>
                  </div>
                  {unread > 0 && <div className="unread-badge">{unread > 99 ? '99+' : unread}</div>}
                </div>
              );
            })}

            {filteredEmployees.length === 0 && (
              <div className="no-users">
                <p>Không tìm thấy nhân viên</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <img src={selectedUser.avatar || '/default-avatar.png'} alt={selectedUser.name} className="chat-avatar" />
                <div>
                  <div className="chat-user-name">
                    {selectedUser.name || selectedUser.email}
                    {selectedUser.employeeId && <span className="user-employee-id"> - {selectedUser.employeeId}</span>}
                  </div>
                  <div className="chat-user-status">
                    {userTyping ? (
                      <span className="typing-indicator">Đang nhập...</span>
                    ) : (
                      <span className="user-role">{selectedUser.role === 'manager' ? 'Quản lý' : 'Nhân viên'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="messages-area" ref={messagesContainerRef} onScroll={handleScroll}>
              {loading && page === 1 && (
                <div className="loading-messages">
                  <div className="spinner"></div>
                  <span>Đang tải tin nhắn...</span>
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="no-messages">
                  <div className="no-messages-icon">💬</div>
                  <p>Chưa có tin nhắn nào</p>
                  <p className="no-messages-sub">Hãy gửi tin nhắn đầu tiên</p>
                </div>
              )}

              {messages.map((message, index) => {
                const isOwn = message.sender._id === currentUser._id;
                const showAvatar = index === 0 || messages[index - 1]?.sender._id !== message.sender._id;

                return (
                  <div key={message._id} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
                    {!isOwn && showAvatar && (
                      <img src={message.sender.avatar || '/default-avatar.png'} alt="" className="message-avatar" />
                    )}
                    <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${message.isTemp ? 'temp' : ''}`}>
                      {!isOwn && showAvatar && (
                        <div className="message-sender-name">{message.sender.name || message.sender.email}</div>
                      )}
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        {message.isTemp && <span className="sending-status"> • Đang gửi...</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && page > 1 && (
                <div className="loading-more">
                  <div className="spinner-small"></div>
                  <span>Đang tải thêm...</span>
                </div>
              )}

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
            <p>Chọn một nhân viên để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatNV;