const { Router } = require('express');
const serviceController = require('../controllers/service.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createServiceValidation, updateServiceValidation } = require('../validators/service.validator');
const { ROLES } = require('../utils/constants');

const router = Router();

router.get('/', serviceController.getAll);
router.get('/stats', serviceController.getWithStats);
router.get('/:id', serviceController.getById);

router.post(
  '/',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(createServiceValidation),
  serviceController.create
);

router.put(
  '/:id',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(updateServiceValidation),
  serviceController.update
);

router.patch(
  '/:id/status',
  verifyToken,
  authorize(ROLES.ADMIN),
  serviceController.updateStatus
);

module.exports = router;
