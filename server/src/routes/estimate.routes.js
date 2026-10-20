const { Router } = require('express');
const estimateController = require('../controllers/estimate.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createEstimateValidation,
  approveEstimateValidation,
  rejectEstimateValidation
} = require('../validators/estimate.validator');
const { ROLES } = require('../utils/constants');

const router = Router({ mergeParams: true });

// Direct estimates routes (when mounted at /api/v1/estimates or /api/v1)
router.post(
  '/',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  validate(createEstimateValidation),
  estimateController.create
);

router.get(
  '/booking/:bookingId',
  verifyToken,
  estimateController.getByBooking
);

router.post(
  '/:id/approve',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  estimateController.approve
);

router.post(
  '/:id/reject',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  estimateController.reject
);

router.get(
  '/:id',
  verifyToken,
  estimateController.getById
);

// Nested routes (when mounted at /api/v1/bookings)
router.post(
  '/:id/estimates',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  validate(createEstimateValidation),
  estimateController.create
);

router.get(
  '/:id/estimates',
  verifyToken,
  estimateController.getByBooking
);

router.post(
  '/:id/estimates/:eid/approve',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(approveEstimateValidation),
  estimateController.approve
);

router.post(
  '/:id/estimates/:eid/reject',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(rejectEstimateValidation),
  estimateController.reject
);

module.exports = router;
