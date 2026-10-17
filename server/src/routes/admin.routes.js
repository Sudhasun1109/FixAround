const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

// Apply auth and admin check to all admin routes
router.use(verifyToken, authorize(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

router.get('/bookings', adminController.getBookings);
router.post('/bookings/:id/reassign', adminController.reassignBooking);

router.get('/payments', adminController.getPayments);

router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);

router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
