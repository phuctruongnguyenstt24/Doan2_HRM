const express = require('express');
const router = express.Router();
const { blockIP } = require('../Controller/securityController');

router.post('/block-ip', blockIP);

module.exports = router;