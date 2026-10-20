const { Router } = require('express');
const claimController = require('../controllers/claim.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createClaimValidation, resolveClaimValidation } = require('../validators/claim.validator');
const { ROLES } = require('../utils/constants');

const router = Router();

// Customer my claims
router.get('/my-claims', verifyToken, authorize(ROLES.CUSTOMER), claimController.getMyClaims);

// File claim on booking & direct claim filing
router.post(
  '/bookings/:id/claims',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(createClaimValidation),
  claimController.create
);

router.post(
  '/',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(createClaimValidation),
  claimController.create
);

// Admin all claims
router.get('/claims', verifyToken, authorize(ROLES.ADMIN), claimController.getAll);
router.get('/', verifyToken, authorize(ROLES.ADMIN), claimController.getAll);

// Claim by ID
router.get('/claims/:id(\\d+)', verifyToken, claimController.getById);
router.get('/:id(\\d+)', verifyToken, claimController.getById);

// Admin resolve claim (both PATCH and POST supported)
router.patch(
  '/claims/:id(\\d+)/resolve',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(resolveClaimValidation),
  claimController.resolve
);
router.post(
  '/claims/:id(\\d+)/resolve',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(resolveClaimValidation),
  claimController.resolve
);
router.patch(
  '/:id(\\d+)/resolve',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(resolveClaimValidation),
  claimController.resolve
);
router.post(
  '/:id(\\d+)/resolve',
  verifyToken,
  authorize(ROLES.ADMIN),
  validate(resolveClaimValidation),
  claimController.resolve
);

// Technician respond to claim (both PATCH and POST supported)
router.patch(
  '/claims/:id(\\d+)/respond',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  claimController.respond
);
router.post(
  '/claims/:id(\\d+)/respond',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  claimController.respond
);
router.patch(
  '/:id(\\d+)/respond',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  claimController.respond
);
router.post(
  '/:id(\\d+)/respond',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  claimController.respond
);

module.exports = router;
