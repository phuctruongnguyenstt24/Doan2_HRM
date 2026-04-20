// FaceAttendance.jsx - Chấm công bằng khuôn mặt cho giảng viên
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaCamera, FaCheckCircle, FaTimesCircle, FaClock, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import './FaceAttendance.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FaceAttendance = () => {
    const [lecturer, setLecturer] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const [result, setResult] = useState(null);
    const [todayRecord, setTodayRecord] = useState(null);
    const [time, setTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Hàm lấy token từ nhiều nguồn
    const getToken = () => {
        // Thử lấy từ nhiều vị trí
        const token = localStorage.getItem('token') || 
                      sessionStorage.getItem('token') ||
                      localStorage.getItem('accessToken') ||
                      sessionStorage.getItem('accessToken');
        
        console.log('Token found:', token ? 'Yes (length: ' + token.length + ')' : 'No');
        return token;
    };

    // Hàm tạo headers với token
    const getAuthHeaders = () => {
        const token = getToken();
        return {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        };
    };

    useEffect(() => {
        fetchLecturer();
        checkTodayAttendance();
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchLecturer = async () => {
        try {
            setLoading(true);
            let user = localStorage.getItem('user');
            if (!user) user = sessionStorage.getItem('user');
            
            if (!user) {
                console.error('Không tìm thấy user trong localStorage');
                setLoading(false);
                return;
            }
            
            const userData = JSON.parse(user);
            setLecturer(userData);
            console.log('Lecturer:', userData);
            console.log('Token exists:', !!getToken());
            
        } catch (error) {
            console.error('Lỗi:', error);
            setMessage({ type: 'error', text: 'Không thể tải thông tin giảng viên' });
        } finally {
            setLoading(false);
        }
    };

    // SỬA: Gọi API đúng endpoint /lecturer/today
    const checkTodayAttendance = async () => {
        try {
            const token = getToken();
            if (!token) {
                console.error('No token found! User might not be logged in');
                setMessage({ type: 'error', text: 'Vui lòng đăng nhập lại' });
                return;
            }

            console.log('Calling /lecturer/today with token:', token.substring(0, 20) + '...');
            
            const res = await axios.get(`${API_URL}/lecturer/today`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Response:', res.data);
            
            if (res.data.success) {
                setTodayRecord(res.data.data);
                setIsCheckedIn(!!res.data.data?.checkIn);
            }
        } catch (error) {
            console.error('Check attendance error:', error.response?.status, error.response?.data);
            if (error.response?.status === 401) {
                setMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại' });
                // Có thể redirect về login
                // window.location.href = '/login';
            }
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraActive(true);
        } catch (error) {
            setMessage({ type: 'error', text: 'Không thể mở camera' });
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // SỬA: Gọi API đúng endpoint /lecturer/face-checkin hoặc /lecturer/face-checkout
    const captureAndCheck = async () => {
        if (!videoRef.current) return;

        setCapturing(true);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('face', blob, 'face.jpg');

            const token = getToken();
            if (!token) {
                setMessage({ type: 'error', text: 'Vui lòng đăng nhập lại' });
                setCapturing(false);
                return;
            }

            // Chọn endpoint dựa trên trạng thái đã check-in chưa
            const endpoint = isCheckedIn ? '/lecturer/face-checkout' : '/lecturer/face-checkin';

            try {
                console.log(`Calling ${endpoint}...`);
                const res = await axios.post(`${API_URL}${endpoint}`, formData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                console.log('Face check response:', res.data);
                setResult(res.data);
                if (res.data.success) {
                    setMessage({ type: 'success', text: res.data.message });
                    checkTodayAttendance(); // Refresh trạng thái
                    setTimeout(() => stopCamera(), 2000);
                } else {
                    setMessage({ type: 'error', text: res.data.message });
                }
            } catch (error) {
                console.error('Face check error:', error.response?.data || error.message);
                setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi nhận diện' });
            } finally {
                setCapturing(false);
            }
        }, 'image/jpeg');
    };

    const getStatusText = () => {
        if (!todayRecord) return 'Chưa chấm công';
        if (todayRecord.checkIn && !todayRecord.checkOut) return 'Đã check-in, chưa check-out';
        if (todayRecord.checkIn && todayRecord.checkOut) return 'Đã hoàn thành';
        return 'Chưa chấm công';
    };

    const getStatusClass = () => {
        if (!todayRecord) return 'pending';
        if (todayRecord.checkIn && !todayRecord.checkOut) return 'checked';
        if (todayRecord.checkIn && todayRecord.checkOut) return 'completed';
        return 'pending';
    };

    if (loading) return <div className="face-loading">Đang tải...</div>;

    return (
        <div className="face-attendance">
            <div className="face-header">
                <h1><FaCamera /> Chấm công khuôn mặt</h1>
                <p>Xin chào, {lecturer?.name || lecturer?.fullName || 'Giảng viên'}</p>
            </div>

            <div className="face-info">
                <div className="info-card">
                    <FaClock /> {time.toLocaleTimeString('vi-VN')}
                </div>
                <div className="info-card">
                    <FaCalendarAlt /> {time.toLocaleDateString('vi-VN')}
                </div>
                <div className={`info-card status-${getStatusClass()}`}>
                    {getStatusText()}
                </div>
            </div>

            {!cameraActive ? (
                <div className="camera-placeholder">
                    <FaCamera className="placeholder-icon" />
                    <button className="btn-start" onClick={startCamera}>
                        Bật camera chấm công
                    </button>
                </div>
            ) : (
                <div className="camera-container">
                    <video ref={videoRef} autoPlay playsInline className="camera-video" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    <div className="camera-controls">
                        <button className="btn-capture" onClick={captureAndCheck} disabled={capturing}>
                            {capturing ? <FaSpinner className="spinner" /> : <FaCamera />}
                            {capturing ? 'Đang xử lý...' : (isCheckedIn ? 'Check-out' : 'Check-in')}
                        </button>
                        <button className="btn-close" onClick={stopCamera}>Đóng camera</button>
                    </div>
                </div>
            )}

            {message.text && (
                <div className={`face-message ${message.type}`}>
                    {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
                    {message.text}
                </div>
            )}

            {result && result.data && (
                <div className="face-result">
                    <h3>Kết quả nhận diện</h3>
                    <p>Tên: {result.data.name}</p>
                    <p>Độ chính xác: {(result.data.confidence * 100).toFixed(1)}%</p>
                    {result.data.status && <p>Trạng thái: {result.data.status === 'present' ? 'Đúng giờ' : result.data.status === 'late' ? 'Muộn' : 'Quá giờ'}</p>}
                    {result.data.workingHours && <p>Số giờ: {result.data.workingHours.toFixed(1)}h</p>}
                </div>
            )}

            {todayRecord && (
                <div className="today-record">
                    <h3>Hôm nay</h3>
                    <div className="record-row">
                        <span>Check-in:</span>
                        <strong>{todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('vi-VN') : '--:--'}</strong>
                    </div>
                    <div className="record-row">
                        <span>Check-out:</span>
                        <strong>{todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString('vi-VN') : '--:--'}</strong>
                    </div>
                    {todayRecord.status && (
                        <div className="record-row">
                            <span>Trạng thái:</span>
                            <strong className={`status-badge status-${todayRecord.status}`}>
                                {todayRecord.status === 'present' ? 'Đúng giờ' : 
                                 todayRecord.status === 'late' ? 'Đi muộn' : 'Vắng'}
                            </strong>
                        </div>
                    )}
                    {todayRecord.workingHours > 0 && (
                        <div className="record-row">
                            <span>Giờ làm:</span>
                            <strong>{todayRecord.workingHours.toFixed(1)} giờ</strong>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FaceAttendance;