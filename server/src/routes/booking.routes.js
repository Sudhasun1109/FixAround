const { Router } = require('express');
const bookingController = require('../controllers/booking.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  createBookingValidation,
  cancelBookingValidation,
  updateStatusValidation
} = require('../validators/booking.validator');
const { ROLES } = require('../utils/constants');

const router = Router();

router.post(
  '/',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(createBookingValidation),
  bookingController.create
);

router.get('/', verifyToken, bookingController.getMyBookings);
router.get('/incoming', verifyToken, authorize(ROLES.TECHNICIAN), bookingController.getIncomingRequests);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.get('/:id', verifyToken, bookingController.getById);
router.get('/:id/timeline', verifyToken, bookingController.getTimeline);

router.post(
  '/:id/cancel',
  verifyToken,
  validate(cancelBookingValidation),
  bookingController.cancel
);

router.patch(
  '/:id/status',
  verifyToken,
  authorize(ROLES.TECHNICIAN, ROLES.ADMIN),
  validate(updateStatusValidation),
  bookingController.updateStatus
);

router.post(
  '/:id/assign',
  verifyToken,
  authorize(ROLES.ADMIN),
  bookingController.assign
);

router.post(
  '/:id/accept',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  bookingController.accept
);

router.post(
  '/:id/reject',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  bookingController.reject
);


router.post(
  '/:id/generate-pin',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  bookingController.generatePin
);

router.get(
  '/:id/verification-pin',
  verifyToken,
  authorize(ROLES.CUSTOMER, ROLES.ADMIN),
  bookingController.getVerificationPin
);

router.post(
  '/:id/verify-pin',
  verifyToken,
  authorize(ROLES.TECHNICIAN),
  bookingController.verifyPin
);

router.post(
  '/:id/payment',
  verifyToken,
  bookingController.processPayment
);

module.exports = router;
