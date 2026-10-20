const { Router } = require('express');
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createReviewValidation } = require('../validators/review.validator');
const { ROLES } = require('../utils/constants');

const router = Router();

// My reviews
router.get('/my-reviews', verifyToken, reviewController.getMyReviews);

// Technician reviews
router.get('/technician/:id', reviewController.getTechnicianReviews);
router.get('/technicians/:id/reviews', reviewController.getTechnicianReviews);

// Booking reviews & direct review creation
router.post(
  '/bookings/:id/reviews',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(createReviewValidation),
  reviewController.create
);

router.post(
  '/',
  verifyToken,
  authorize(ROLES.CUSTOMER),
  validate(createReviewValidation),
  reviewController.create
);

router.put('/:id', verifyToken, authorize(ROLES.CUSTOMER), reviewController.update);
router.delete('/:id', verifyToken, reviewController.deleteReview);

// Admin all reviews
router.get('/reviews', verifyToken, authorize(ROLES.ADMIN), reviewController.getAll);
router.get('/', verifyToken, authorize(ROLES.ADMIN), reviewController.getAll);

module.exports = router;
