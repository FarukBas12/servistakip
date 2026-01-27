const express = require('express');
const router = express.Router();
const controller = require('../controllers/backupController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all routes

router.post('/', controller.manualBackup);

module.exports = router;
