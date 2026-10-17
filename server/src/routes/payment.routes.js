const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { initiatePaymentValidation } = require('../validators/payment.validator');
const { ROLES } = require('../utils/constants');

const router = Router();

// Customer my-payments
router.get('/my-payments', verifyToken, authorize(ROLES.CUSTOMER), paymentController.getMyPayments);

// Public webhook
router.post('/payments/webhook', paymentController.webhook);
router.post('/webhook', paymentController.webhook);

// Booking payments
router.post(
  '/bookings/:id/payments',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(initiatePaymentValidation),
  paymentController.initiate
);

router.get(
  '/bookings/:id/payments',
  verifyToken,
  paymentController.getByBooking
);

// Payment verification (sandbox/live)
router.post(
  '/payments/:id/verify',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  paymentController.verify
);

router.post(
  '/:id/verify',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  paymentController.verify
);

module.exports = router;
