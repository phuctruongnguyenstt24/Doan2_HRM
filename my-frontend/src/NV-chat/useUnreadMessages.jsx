// NV-chat/useUnreadMessages.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy current user
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Hàm lấy tổng số tin nhắn chưa đọc
  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.get('/messages/conversations');
      const conversations = response.data;
      
      let total = 0;
      conversations.forEach(conv => {
        // Lấy unread count cho current user
        const unread = conv.unreadCount?.get?.(currentUser._id) || 0;
        total += unread;
      });
      
      setUnreadCount(total);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [currentUser]);

  // Fetch ban đầu và polling
  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
      
      // Polling mỗi 10 giây để cập nhật
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchUnreadCount]);

  // Lắng nghe sự kiện từ socket (nếu có)
  useEffect(() => {
    const handleNewMessage = () => {
      fetchUnreadCount();
    };
    
    window.addEventListener('new-message', handleNewMessage);
    return () => window.removeEventListener('new-message', handleNewMessage);
  }, [fetchUnreadCount]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
};

export default useUnreadMessages;