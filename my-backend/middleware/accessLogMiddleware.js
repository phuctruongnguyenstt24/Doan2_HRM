// middleware/accessLogMiddleware.js
const AccessLog = require('../models/accessLog');

/**
 * Xác định action từ request
 */
function determineAction(req) {
  const { path, method } = req;

  // Auth actions
  if (path.includes('/auth/login')) return 'login';
  if (path.includes('/auth/google')) return 'login';
  if (path.includes('/auth/google/callback')) return 'login';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/auth/register')) return 'register';
  
  // User management actions - ĐÃ XÓA view_users và view_user_detail
  // Chỉ giữ lại update và delete
  if (path.includes('/users') && method === 'PUT') return 'update_user';
  if (path.includes('/users') && method === 'DELETE') return 'delete_user';
  
  // Access logs actions - ĐÃ DISABLED
  // if (path.includes('/access-logs')) return 'view_logs';
  
  // Dashboard actions
 
  
  // Security actions
  if (path.includes('/security/block-ip')) return 'block_ip';
  
  // Other business actions
  if (path.includes('/contracts')) return 'manage_contracts';
  if (path.includes('/attendance')) return 'manage_attendance';
  if (path.includes('/salary')) return 'manage_salary';
 
  if (path.includes('/training')) return 'manage_training';
  if (path.includes('/business-trips')) return 'manage_trips';

  return 'other';
}

/**
 * Lấy IP của client
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
}

/**
 * Tạo access log bất đồng bộ
 */
async function createAccessLogAsync(req, statusCode, duration, action) {
  try {
    const user = req.user;
    if (!user) return;

    const logData = {
      userId: user._id,
      action: action,
      endpoint: req.originalUrl,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      status: statusCode >= 400 ? 'failed' : 'success',
      details: JSON.stringify({
        method: req.method,
        statusCode,
        duration: `${duration}ms`
      })
    };

    await AccessLog.create(logData);
    console.log(`📝 Log created: ${action} for user ${user.email} (${user._id})`);

  } catch (error) {
    console.error('❌ Error creating access log:', error);
  }
}

/**
 * Middleware ghi access log
 */
const accessLogMiddleware = async (req, res, next) => {
  // Bỏ qua các request không cần log
  const skipPaths = ['/', '/favicon.ico', '/api/test', '/api/auth/config', '/_next'];
  if (skipPaths.some(path => req.path === path) || req.path.startsWith('/_next')) {
    return next();
  }

  const startTime = Date.now();
  
  // Xác định action NGAY TẠI ĐÂY
  const action = determineAction(req);
  
  // Debug log (chỉ trong môi trường development)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔍 [ACCESS LOG] Path: ${req.path}, Method: ${req.method}, Action: ${action}, User: ${req.user?.email || 'No user'}`);
  }

  // Lưu original send để override
  const originalSend = res.send;
  
  // Override res.send method
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    // Danh sách actions được phép ghi log (ĐÃ XÓA view_users và view_user_detail)
    const allowedActions = [
      'login', 
      'logout', 
      'register',
      'update_user', 
      'delete_user',
     
      'block_ip',
      'manage_contracts',
      'manage_attendance',
      'manage_salary',
   
      'manage_training',
      'manage_trips'
    ];
    
    // Ghi log nếu có user và action được phép
    if (req.user && req.method !== 'OPTIONS' && allowedActions.includes(action)) {
      // Không ghi log nếu action là 'other'
      if (action !== 'other') {
        console.log(`✅ Creating log for action: ${action} - User: ${req.user.email}`);
        createAccessLogAsync(req, res.statusCode, duration, action);
      }
    }

    // Gọi original send
    originalSend.call(this, data);
  };

  next();
};

module.exports = accessLogMiddleware;