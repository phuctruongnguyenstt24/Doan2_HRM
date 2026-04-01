const BlockedIP = require('../models/BlockedIP');

exports.blockIP = async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({ message: 'IP is required' });
    }

    // chuẩn hóa IP (tránh lỗi ::ffff:)
    const cleanIP = ip.replace('::ffff:', '');

    const exists = await BlockedIP.findOne({ ip: cleanIP });
    if (exists) {
      return res.status(400).json({ message: 'IP already blocked' });
    }

    await BlockedIP.create({ ip: cleanIP });

    res.json({ message: 'IP blocked successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};