// client/src/components/ChatEmployee.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './ChatEmployee.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const ChatEmployee = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [admins, setAdmins] = useState([]);
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
    const [activeTab, setActiveTab] = useState('teachers');
    const [isTyping, setIsTyping] = useState(false);
    const [userTyping, setUserTyping] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
   

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Lấy current user
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    // Kết nối Socket.IO
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            withCredentials: true,
            path: '/socket.io/'
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to chat server');
        });

        socketRef.current.on('new_message', (message) => {
            // Nếu đang ở conversation với người gửi
            if (selectedUser && message.sender._id === selectedUser._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
                // Đánh dấu đã đọc ngay lập tức
                setUnreadCounts(prev => ({
                    ...prev,
                    [message.sender._id]: 0
                }));
            } else {
                // Tăng badge cho người dùng không được chọn
                setUnreadCounts(prev => ({
                    ...prev,
                    [message.sender._id]: (prev[message.sender._id] || 0) + 1
                }));
            }

            // Cập nhật conversations
            fetchConversations();
        });

        socketRef.current.on('message_sent', (message) => {
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

    // Load dữ liệu ban đầu
    useEffect(() => {
        if (currentUser) {
            fetchTeachers();
            fetchAdmins();
            fetchConversations();
            fetchTotalMessages();
            fetchAllUnreadCounts(); // Gọi hàm mới để lấy tất cả unread counts
        }

        // Polling để cập nhật unread counts (dự phòng)
        const interval = setInterval(() => {
            if (currentUser) {
                fetchAllUnreadCounts();
            }
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

            // Xóa badge ngay khi chọn user
            setUnreadCounts(prev => ({
                ...prev,
                [selectedUser._id]: 0
            }));
            
            // Gọi API để reset unread count trên server
            resetUnreadCountForUser(selectedUser._id);
            window.dispatchEvent(new Event('messages-read'));
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Hàm mới: Lấy tất cả unread counts từ conversations
    const fetchAllUnreadCounts = async () => {
        if (!currentUser) return;
        
        try {
            const response = await api.get('/messages/conversations');
            const conversations = response.data;
            
            const counts = {};
            conversations.forEach(conv => {
                // Tìm người kia trong conversation
                const otherUser = conv.participants.find(p => p._id !== currentUser._id);
                if (otherUser) {
                    // Lấy unread count cho current user từ conversation
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

    // Hàm mới: Reset unread count cho user được chọn
    const resetUnreadCountForUser = async (userId) => {
        try {
            await api.post(`/messages/mark-as-read/${userId}`);
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/messages/teachers');
            setTeachers(response.data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    };

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

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/messages/admins');
            setAdmins(response.data);
        } catch (error) {
            console.error('Error fetching admins:', error);
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || sending) return;

        setSending(true);
        const messageContent = newMessage.trim();
        setNewMessage('');

        const tempMessage = {
            _id: Date.now(),
            content: messageContent,
            sender: { _id: currentUser?._id, name: currentUser?.name },
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
            fetchConversations();
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

    const getFilteredUsers = () => {
        if (activeTab === 'teachers') {
            return teachers.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.teacherCode?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } else {
            return admins.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    };

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

    const getUserRoleLabel = (user) => {
        if (user.role === 'admin') return 'Quản trị viên';
        if (user.role === 'manager') return 'Quản lý';
        if (user.degree) return `Giảng viên - ${user.degree}`;
        return 'Nhân viên';
    };

    if (!currentUser) {
        return <div className="loading-chat">Đang tải...</div>;
    }

    const filteredUsers = getFilteredUsers();

    return (
        <div className="chat-employee-container">
            <div className="chat-employee-sidebar">
                <div className="sidebar-header-chat">
                    <h3>💬 Tin nhắn</h3>
                    
                    <div className="tabs-chat">
                        <button
                            className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('teachers')}
                        >
                            👨‍🏫 Giảng viên
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
                            onClick={() => setActiveTab('admins')}
                        >
                            👤 Quản lý
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

                <div className="users-list-chat">
                    {filteredUsers.map(user => {
                        const unread = unreadCounts[user._id] || 0;
                        const isSelected = selectedUser?._id === user._id;

                        return (
                            <div
                                key={user._id}
                                className={`user-item-chat ${isSelected ? 'active' : ''}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className="user-avatar-chat">
                                    <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
                                    {user.isActive && <span className="online-status-chat"></span>}
                                </div>
                                <div className="user-info-chat">
                                    <div className="user-name-chat">
                                        {user.name || user.email}
                                        {user.teacherCode && <span className="user-code-chat">({user.teacherCode})</span>}
                                        {user.employeeId && <span className="user-code-chat">({user.employeeId})</span>}
                                    </div>
                                    <div className="user-role-badge-chat">{getUserRoleLabel(user)}</div>
                                    {user.faculty && <div className="user-faculty-chat">{user.faculty}</div>}
                                </div>
                                {/* Badge hiển thị bên phải */}
                                {unread > 0 && (
                                    <div className="unread-badge">{unread > 99 ? '99+' : unread}</div>
                                )}
                            </div>
                        );
                    })}

                    {filteredUsers.length === 0 && (
                        <div className="no-users">
                            <p>Không tìm thấy người dùng</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-employee-main">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <img src={selectedUser.avatar || '/default-avatar.png'} alt={selectedUser.name} className="chat-avatar" />
                                <div>
                                    <div className="chat-user-name">
                                        {selectedUser.name || selectedUser.email}
                                    </div>
                                    <div className="chat-user-status">
                                        {userTyping ? (
                                            <span className="typing-indicator">Đang nhập...</span>
                                        ) : (
                                            <span className="user-role">{getUserRoleLabel(selectedUser)}</span>
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
                        <p>Chọn một giảng viên hoặc quản lý để bắt đầu trò chuyện</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatEmployee;