// utils/accessLogUtils.js
const AccessLog = require('../models/accessLog');

/**
 * Ghi log truy cập trực tiếp (cho các trường hợp đặc biệt như Google OAuth)
 */
async function logAccessDirectly(userId, action, req, status = 'success') {
  try {
    if (!userId) return;

    const logData = {
      userId: userId,
      action: action,
      endpoint: req.originalUrl || req.url,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      status: status,
      details: JSON.stringify({
        method: req.method,
        timestamp: new Date().toISOString()
      })
    };

    await AccessLog.create(logData);
    console.log(`📝 Direct log created: ${action} for user ${userId}`);
  } catch (error) {
    console.error('❌ Error creating direct access log:', error);
  }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';
}

module.exports = { logAccessDirectly };