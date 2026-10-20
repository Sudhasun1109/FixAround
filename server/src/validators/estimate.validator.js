const { body, param } = require('express-validator');

const createEstimateValidation = [
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

  body('labor_charge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('labor_charge must be a non-negative number'),

  body('material_charge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('material_charge must be a non-negative number'),

  body('inspection_charge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('inspection_charge must be a non-negative number'),

  body('additional_charge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('additional_charge must be a non-negative number'),

  body('breakdown_notes')
    .optional()
    .trim()
];

const approveEstimateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),

  param('eid')
    .isInt({ min: 1 })
    .withMessage('Estimate ID must be a positive integer')
];

const rejectEstimateValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),

  param('eid')
    .isInt({ min: 1 })
    .withMessage('Estimate ID must be a positive integer'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must not exceed 500 characters')
];

module.exports = {
  createEstimateValidation,
  approveEstimateValidation,
  rejectEstimateValidation
};
