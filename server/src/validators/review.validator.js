const { body, param } = require('express-validator');

const createReviewValidation = [
  param('id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),

  body('booking_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('booking_id must be a positive integer'),

  body().custom((value, { req }) => {
    if (!req.params?.id && !req.body?.booking_id) {
      throw new Error('Booking ID is required');
    }
    return true;
  }),

  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comment must not exceed 2000 characters')
];

module.exports = {
  createReviewValidation
};
