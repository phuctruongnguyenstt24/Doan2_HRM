const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AccessLog = require("../models/accessLog");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Helper function lấy IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
};

// Cấu hình email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Hàm gửi email OTP
const sendOTPEmail = async (email, otp, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Đặt lại mật khẩu - HR Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Xác nhận đặt lại mật khẩu</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Mã xác nhận (OTP) của bạn là:</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">© 2024 HR Management System. All rights reserved.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Lưu OTP tạm thời (có thể dùng Redis hoặc database)
// Tạm thời lưu trong memory (sẽ mất khi restart server)
const otpStore = new Map();

// Cleanup OTP cũ mỗi giờ
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 3600000);

// Đăng ký
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký'
      });
    }

    const user = await User.create({
      email,
      password,
      name: name || email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email.split('@')[0])}&background=random`
    });

    const token = generateToken(user);

    try {
      await AccessLog.collection.insertOne({
        userId: user._id,
        action: 'register',
        endpoint: '/api/auth/register',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        status: 'success',
        details: JSON.stringify({ method: 'email' }),
        timestamp: new Date()
      });
      console.log(`✅ Register log created for: ${user.email}`);
    } catch (logError) {
      console.error('Failed to create register log:', logError);
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      try {
        await AccessLog.collection.insertOne({
          userId: null,
          action: 'login',
          endpoint: '/api/auth/login',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          status: 'failed',
          details: JSON.stringify({ error: 'User not found', email }),
          timestamp: new Date()
        });
        console.log(`❌ Failed login - User not found: ${email}`);
      } catch (logError) {
        console.error('Failed to create login log:', logError);
      }

      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      try {
        await AccessLog.collection.insertOne({
          userId: user._id,
          action: 'login',
          endpoint: '/api/auth/login',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          status: 'failed',
          details: JSON.stringify({ error: 'Invalid password' }),
          timestamp: new Date()
        });
        console.log(`❌ Failed login - Invalid password: ${email}`);
      } catch (logError) {
        console.error('Failed to create login log:', logError);
      }

      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    const token = generateToken(user);

    try {
      await AccessLog.collection.insertOne({
        userId: user._id,
        action: 'login',
        endpoint: '/api/auth/login',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        status: 'success',
        details: JSON.stringify({ method: 'password' }),
        timestamp: new Date()
      });
      console.log(`✅ Login log created for: ${user.email}`);
    } catch (logError) {
      console.error('Failed to create login log:', logError);
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Google OAuth
router.get("/google", (req, res, next) => {
  console.log('🔵 Initiating Google OAuth flow');
  const authenticator = passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    accessType: "offline"
  });
  authenticator(req, res, next);
});
//Xử lí login gg

router.get("/google/callback",
  (req, res, next) => {
    console.log('🔵 Google OAuth callback received');
    passport.authenticate("google", { session: false }, async (err, user, info) => {
      if (err) {
        console.error('❌ Google OAuth Error in callback:', err);
        const errorMessage = err.message || 'Authentication failed';
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
      }

      if (!user) {
        console.error('❌ No user returned from Google OAuth');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user_found`);
      }

      console.log('✅ Google OAuth successful for user:', user.email);
      console.log('👤 User role:', user.role);

      try {
        if (req.user && req.user.photos && req.user.photos[0]) {
          user.avatar = req.user.photos[0].value;
          await user.save();
          console.log('✅ Updated avatar from Google:', user.avatar);
        }

        try {
          await AccessLog.collection.insertOne({
            userId: user._id,
            action: 'login',
            endpoint: '/api/auth/google/callback',
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'] || '',
            status: 'success',
            details: JSON.stringify({ method: 'google' }),
            timestamp: new Date()
          });
          console.log(`✅ Google login log created for: ${user.email}`);
        } catch (logError) {
          console.error('Failed to create Google login log:', logError);
        }

        const token = generateToken(user);
        const frontendUrl = process.env.FRONTEND_URL || 'https://unevocative-lauran-nonsocialistic.ngrok-free.dev';
        
        // 🔥 QUAN TRỌNG: Kiểm tra role để redirect đúng trang
        let redirectPath = '/dashboard'; // Mặc định cho admin
        
        if (user.role === 'admin') {
          redirectPath = '/dashboard';
          console.log('👑 Admin user - redirecting to dashboard');
        } else if (user.role === 'employee') {
          redirectPath = '/employee/teacherDashboard';
          console.log('👨‍🏫 Employee user - redirecting to teacher dashboard');
        } else {
          // Nếu role không xác định hoặc khác, mặc định là employee
          redirectPath = '/employee/teacherDashboard';
          console.log('❓ Unknown role - default to teacher dashboard');
        }
        
        const redirectUrl = `${frontendUrl}${redirectPath}?token=${token}`;
        console.log('🔍 FRONTEND_URL from env:', process.env.FRONTEND_URL);
        console.log('🔍 Using frontendUrl:', frontendUrl);
        console.log('🔍 Redirect path:', redirectPath);
        console.log('🔍 Final redirectUrl:', redirectUrl);
        console.log('Redirecting to:', redirectUrl);
        return res.redirect(redirectUrl);
      } catch (tokenError) {
        console.error('❌ Token generation error:', tokenError);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
      }
    })(req, res, next);
  }
);

// Lấy thông tin user
const authMiddleware = require("../middleware/authMiddleware");
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// Đăng xuất
router.post("/logout", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user) {
        await AccessLog.collection.insertOne({
          userId: user._id,
          action: 'logout',
          endpoint: '/api/auth/logout',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          status: 'success',
          timestamp: new Date()
        });
        console.log(`✅ Logout log created for: ${user.email}`);
      }
    } catch (error) {
      console.error('Failed to create logout log:', error);
    }
  }

  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});
// Thêm vào cuối file auth.js, trước module.exports

// 5. Đổi mật khẩu (khi đã đăng nhập)
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không được trùng với mật khẩu cũ'
      });
    }

    // Tìm user trong database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      // Ghi log thất bại
      try {
        await AccessLog.collection.insertOne({
          userId: user._id,
          action: 'change_password_failed',
          endpoint: '/api/auth/change-password',
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || '',
          status: 'failed',
          details: JSON.stringify({ error: 'Invalid current password' }),
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to create change password log:', logError);
      }

      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.lastPasswordChange = new Date();
    await user.save();

    // Ghi log thành công
    try {
      await AccessLog.collection.insertOne({
        userId: user._id,
        action: 'change_password',
        endpoint: '/api/auth/change-password',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        status: 'success',
        timestamp: new Date()
      });
      console.log(`✅ Password changed for user: ${user.email}`);
    } catch (logError) {
      console.error('Failed to create change password log:', logError);
    }

    // (Tùy chọn) Gửi email thông báo đổi mật khẩu
    try {
      const notifyMailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Thông báo đổi mật khẩu - HR Management System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Xác nhận đổi mật khẩu</h2>
            <p>Xin chào <strong>${user.name}</strong>,</p>
            <p>Mật khẩu tài khoản của bạn vừa được thay đổi thành công.</p>
            <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với quản trị viên ngay lập tức.</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
            <p style="color: #666; font-size: 12px;">© 2024 HR Management System. All rights reserved.</p>
          </div>
        `
      };
      await transporter.sendMail(notifyMailOptions);
      console.log(`✅ Password change notification sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password change notification:', emailError);
      // Không throw error vì đây không phải lỗi chính
    }

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra, vui lòng thử lại sau'
    });
  }
});
// ============= QUÊN MẬT KHẨU APIs =============

// 1. Gửi OTP qua email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Tạo OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 phút

    // Lưu OTP
    otpStore.set(email, {
      otp,
      expiresAt,
      attempts: 0
    });

    // Gửi email
    await sendOTPEmail(email, otp, user.name);

    // Ghi log
    try {
      await AccessLog.collection.insertOne({
        userId: user._id,
        action: 'forgot_password_request',
        endpoint: '/api/auth/forgot-password',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        status: 'success',
        details: JSON.stringify({ email }),
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to create forgot password log:', logError);
    }

    res.json({
      success: true,
      message: 'Mã xác nhận đã được gửi đến email của bạn'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi email. Vui lòng thử lại sau.'
    });
  }
});

// 2. Xác nhận OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ email và mã xác nhận'
      });
    }

    const storedOTP = otpStore.get(email);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác nhận không tồn tại hoặc đã hết hạn'
      });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.'
      });
    }

    if (storedOTP.attempts >= 5) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Quá nhiều lần thử sai. Vui lòng yêu cầu mã mới.'
      });
    }

    if (storedOTP.otp !== otp) {
      storedOTP.attempts++;
      otpStore.set(email, storedOTP);

      return res.status(400).json({
        success: false,
        message: `Mã xác nhận không đúng. Còn ${5 - storedOTP.attempts} lần thử.`
      });
    }

    // Xác nhận thành công - lưu trạng thái verified
    otpStore.set(email, {
      ...storedOTP,
      verified: true
    });

    res.json({
      success: true,
      message: 'Xác nhận thành công'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// 3. Đặt lại mật khẩu
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const storedOTP = otpStore.get(email);

    if (!storedOTP || !storedOTP.verified) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu không hợp lệ. Vui lòng xác nhận OTP trước.'
      });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác nhận không đúng'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    // Xóa OTP đã sử dụng
    otpStore.delete(email);

    // Ghi log
    try {
      await AccessLog.collection.insertOne({
        userId: user._id,
        action: 'reset_password',
        endpoint: '/api/auth/reset-password',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
        status: 'success',
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to create reset password log:', logError);
    }

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// 4. Gửi lại OTP
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Kiểm tra xem có đang gửi quá nhiều không
    const existingOTP = otpStore.get(email);
    if (existingOTP && existingOTP.resendCount >= 3) {
      const timeSinceFirst = Date.now() - existingOTP.firstRequestTime;
      if (timeSinceFirst < 3600000) { // 1 giờ
        return res.status(429).json({
          success: false,
          message: 'Bạn đã yêu cầu gửi lại quá nhiều lần. Vui lòng thử lại sau 1 giờ.'
        });
      }
    }

    // Tạo OTP mới
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Cập nhật OTP store
    if (existingOTP) {
      otpStore.set(email, {
        ...existingOTP,
        otp: newOTP,
        expiresAt,
        attempts: 0,
        resendCount: (existingOTP.resendCount || 0) + 1
      });
    } else {
      otpStore.set(email, {
        otp: newOTP,
        expiresAt,
        attempts: 0,
        resendCount: 1,
        firstRequestTime: Date.now()
      });
    }

    // Gửi email
    await sendOTPEmail(email, newOTP, user.name);

    res.json({
      success: true,
      message: 'Đã gửi lại mã xác nhận'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi lại mã. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;