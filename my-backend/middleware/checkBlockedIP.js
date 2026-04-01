const BlockedIP = require('../models/BlockedIP');

const checkBlockedIP = async (req, res, next) => {
  try {
    let ip = req.ip || req.connection.remoteAddress;

    // chuẩn hóa IP
    ip = ip.replace('::ffff:', '');

    const blocked = await BlockedIP.findOne({ ip });

    if (blocked) {
      return res.status(403).json({
        message: 'Your IP has been blocked'
      });
    }

    next();

  } catch (error) {
    console.error(error);
    next();
  }
};

module.exports = checkBlockedIP;