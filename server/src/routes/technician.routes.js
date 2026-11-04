const { Router } = require('express');
const technicianController = require('../controllers/technician.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  updateProfileValidation,
  searchNearbyValidation,
  verifyTechnicianValidation
} = require('../validators/technician.validator');
const { ROLES } = require('../utils/constants');

const router = Router();

router.get('/nearby', validate(searchNearbyValidation), technicianController.findNearby);
router.get('/profile', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getProfile);
router.get('/stats', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getStats);
router.patch(
  '/profile',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  validate(updateProfileValidation),
  technicianController.updateProfile
);
router.put(
  '/profile',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  validate(updateProfileValidation),
  technicianController.updateProfile
);

router.patch('/availability', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.setAvailability);
router.post('/availability', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.setAvailability);

router.post('/location', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.updateLocation);

router.put('/skills', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.updateSkills);
router.get('/:id/skills', technicianController.getSkills);

router.post('/documents', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.uploadDocument);
router.get('/documents', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getDocuments);

router.get('/:id/reviews', technicianController.getTechnicianReviews);

router.patch(
  '/:id/verify',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(verifyTechnicianValidation),
  technicianController.verify
);
router.post(
  '/:id/verify',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(verifyTechnicianValidation),
  technicianController.verify
);
// Technician Wallet & Commission Ledger
router.get('/wallet', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getWallet);
router.get('/wallet/transactions', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getWalletTransactions);
router.post('/wallet/settle-cash', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.settleCashCommission);

// Ongoing In-Flight Bookings & Backup Requests
router.get('/ongoing-bookings', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getOngoingBookings);
router.get('/backup-requests', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.getIncomingBackupRequests);

router.get('/:id', technicianController.getById);
router.get('/', technicianController.getAll);

module.exports = router;
