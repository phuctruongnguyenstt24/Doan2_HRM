const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose duplicate 
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Dữ liệu đã tồn tại trong hệ thống';
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Không tìm thấy dữ liệu';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;