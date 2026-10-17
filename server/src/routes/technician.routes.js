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
router.patch('/availability', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.setAvailability);
router.put('/skills', verifyToken, authorize(ROLES.TECHNICIAN), technicianController.updateSkills);

router.get('/:id/reviews', technicianController.getTechnicianReviews);
router.patch(
  '/:id/verify',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(verifyTechnicianValidation),
  technicianController.verify
);
router.get('/:id', technicianController.getById);
router.get('/', technicianController.getAll);

module.exports = router;
