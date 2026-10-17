const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.get('/unread-count', verifyToken, notificationController.getUnreadCount);
router.patch('/read-all', verifyToken, notificationController.markAllAsRead);
router.patch('/:id/read', verifyToken, notificationController.markAsRead);
router.get('/', verifyToken, notificationController.getAll);

module.exports = router;
