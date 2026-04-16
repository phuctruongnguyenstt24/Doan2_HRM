// ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {FaEnvelope, FaArrowLeft, FaCheckCircle, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // 1: request reset, 2: verify OTP, 3: reset password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchAPI = async (endpoint, options = {}) => {
    try {
      let url;
      if (import.meta.env.DEV && API_URL.includes('ngrok-free.dev')) {
        url = `/api${endpoint}`;
      } else {
        url = `${API_URL}${endpoint}`;
      }
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include'
      });
      
      return response;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  };

  // Step 1: Gửi yêu cầu reset password
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Mã xác nhận đã được gửi đến email của bạn!');
        setStep(2);
        startCountdown();
      } else {
        setError(data.message || 'Không thể gửi yêu cầu reset mật khẩu');
      }
    } catch (err) {
      console.error('Request reset error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Xác nhận OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAPI('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Xác nhận thành công! Vui lòng nhập mật khẩu mới.');
        setStep(3);
      } else {
        setError(data.message || 'Mã xác nhận không chính xác');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetchAPI('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Không thể đặt lại mật khẩu');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const response = await fetchAPI('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setSuccess('Đã gửi lại mã xác nhận!');
        startCountdown();
      } else {
        setError('Không thể gửi lại mã xác nhận');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <form onSubmit={handleRequestReset}>
      <div className="form-group">
        <label htmlFor="email">
          <FaEnvelope className="input-icon" />
          Email đăng ký
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Nhập email của bạn"
          required
          disabled={loading}
        />
        <small>Chúng tôi sẽ gửi mã xác nhận đến email này</small>
      </div>

      <button 
        type="submit" 
        className="reset-btn"
        disabled={loading}
      >
        {loading ? <FaSpinner className="spinner" /> : 'Gửi yêu cầu'}
      </button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleVerifyOTP}>
      <div className="form-group">
        <label htmlFor="otp">Mã xác nhận (OTP)</label>
        <input
          type="text"
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Nhập mã 6 số"
          maxLength="6"
          required
          disabled={loading}
        />
        <small>
          Vui lòng kiểm tra email của bạn
          {countdown > 0 && (
            <span className="countdown"> (Gửi lại sau {countdown}s)</span>
          )}
        </small>
      </div>

      <button 
        type="submit" 
        className="reset-btn"
        disabled={loading}
      >
        {loading ? <FaSpinner className="spinner" /> : 'Xác nhận'}
      </button>

      {countdown === 0 && (
        <button 
          type="button"
          className="resend-btn"
          onClick={handleResendOTP}
          disabled={loading}
        >
          Gửi lại mã
        </button>
      )}
    </form>
  );

 const renderStep3 = () => (
  <form onSubmit={handleResetPassword}>
    <div className="form-group">
      <label htmlFor="newPassword">Mật khẩu mới</label>
      <div className="password-input-wrapper">
        <input
          type={showNewPassword ? "text" : "password"}
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới"
          required
          disabled={loading}
        />
        <button
          type="button"
          className="toggle-password-btn"
          onClick={() => setShowNewPassword(!showNewPassword)}
        >
          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      <small>Mật khẩu phải có ít nhất 6 ký tự</small>
    </div>

    <div className="form-group">
      <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
      <div className="password-input-wrapper">
        <input
          type={showConfirmPassword ? "text" : "password"}
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          required
          disabled={loading}
        />
        <button
          type="button"
          className="toggle-password-btn"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>

    <button 
      type="submit" 
      className="reset-btn"
      disabled={loading}
    >
      {loading ? <FaSpinner className="spinner" /> : 'Đặt lại mật khẩu'}
    </button>
  </form>
);

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <Link to="/login" className="back-link">
            <FaArrowLeft /> Quay lại đăng nhập
          </Link>
          <h1>Quên mật khẩu?</h1>
          <p>
            {step === 1 && 'Nhập email của bạn để đặt lại mật khẩu'}
            {step === 2 && 'Nhập mã xác nhận đã được gửi đến email của bạn'}
            {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}

        <div className="forgot-password-content">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        <div className="forgot-password-footer">
          <p>
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;