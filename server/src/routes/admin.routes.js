const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../utils/constants');

const router = Router();

const technicianController = require('../controllers/technician.controller');
const validate = require('../middleware/validate');
const { verifyTechnicianValidation } = require('../validators/technician.validator');

// Apply auth and admin check to all admin routes
router.use(verifyToken, authorize(ROLES.ADMIN));

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);

router.get('/technicians/verification', adminController.getTechniciansForVerification);
router.patch('/technicians/:id/verify', validate(verifyTechnicianValidation), technicianController.verify);
router.post('/technicians/:id/verify', validate(verifyTechnicianValidation), technicianController.verify);

router.get('/bookings/emergency', adminController.getEmergencyBookings);
router.get('/bookings', adminController.getBookings);
router.post('/bookings/:id/reassign', adminController.reassignBooking);

router.get('/payments', adminController.getPayments);

router.get('/claims', adminController.getClaims);

router.get('/reviews', adminController.getReviews);
router.patch('/reviews/:id/visibility', adminController.toggleReviewVisibility);
router.delete('/reviews/:id', adminController.deleteReview);

router.get('/settings', adminController.getSettings);
router.put('/settings/:key', adminController.updateSetting);

router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
