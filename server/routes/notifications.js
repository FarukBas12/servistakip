const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.use(auth);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Mark specific notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark ALL as read
router.put('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
