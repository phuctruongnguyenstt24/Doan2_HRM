const AccessLog = require('../models/accessLog');

const accessLogMiddleware = async (req, res, next) => {
  // Bỏ qua các request không cần log
  if (req.path.startsWith('/_next') || req.path === '/favicon.ico') {
    return next();
  }

  const startTime = Date.now();
  
  // Ghi lại response để bắt dữ liệu sau khi hoàn thành
  const originalSend = res.send;
  res.send = function(data) {
    // Tính thời gian xử lý
    const duration = Date.now() - startTime;
    
    // Tạo log bất đồng bộ (không chờ)
    createAccessLogAsync(req, res.statusCode, duration);
    
    // Gọi hàm send gốc
    originalSend.call(this, data);
  };

  next();
};

async function createAccessLogAsync(req, statusCode, duration) {
  try {
    const user = req.user;

    // Nếu chưa login thì bỏ qua log
    if (!user) return;

    const logData = {
      userId: user._id,  // ✅ Chỉ cần userId, không cần userEmail/userName
      action: determineAction(req),
      endpoint: req.originalUrl,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      status: statusCode >= 400 ? 'failed' : 'success',
      details: JSON.stringify({
        method: req.method,
        statusCode,
        duration: `${duration}ms`,
        query: req.query,
        body: req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE'
          ? redactSensitiveData(req.body)
          : {}
      })
    };

    await AccessLog.create(logData);

  } catch (error) {
    console.error('Error creating access log:', error);
  }
}

function determineAction(req) {
  const { path, method } = req;
  
  if (path.includes('/auth/login')) return 'login';
  if (path.includes('/auth/logout')) return 'logout';
  if (method === 'GET') return 'page_view';
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') return 'data_update';
  
  return 'api_call';
}

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.ip || 
         'unknown';
}

function redactSensitiveData(body) {
  if (!body) return {};
  
  const redacted = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn'];
  
  sensitiveFields.forEach(field => {
    if (redacted[field]) {
      redacted[field] = '***REDACTED***';
    }
  });
  
  return redacted;
}

module.exports = accessLogMiddleware;