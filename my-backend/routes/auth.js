const router = require("express").Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar // Thêm avatar vào token
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

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
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
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

// Google OAuth - SIMPLIFIED VERSION
router.get("/google", (req, res, next) => {
  console.log('🔵 Initiating Google OAuth flow');
  const authenticator = passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
    accessType: "offline"
  });
  authenticator(req, res, next);
});

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
      
      try {
        // Cập nhật avatar từ Google nếu có
        if (req.user && req.user.photos && req.user.photos[0]) {
          user.avatar = req.user.photos[0].value;
          await user.save();
          console.log('✅ Updated avatar from Google:', user.avatar);
        }
        
        const token = generateToken(user);
        const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?token=${token}`;
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
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

// Quên mật khẩu
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại'
      });
    }
    
    res.json({
      success: true,
      message: 'Hướng dẫn reset mật khẩu đã được gửi đến email của bạn'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

module.exports = router;
 