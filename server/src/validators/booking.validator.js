const { body, param } = require('express-validator');
const { BOOKING_STATUSES, URGENCY_LEVELS } = require('../utils/constants');

const createBookingValidation = [
  body('category_id')
    .notEmpty()
    .withMessage('Service category ID is required')
    .isInt({ min: 1 })
    .withMessage('Service category ID must be a positive integer'),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Booking title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),

  body('description')
    .optional()
    .trim(),

  body('is_emergency')
    .optional()
    .isBoolean()
    .withMessage('is_emergency must be a boolean'),

  body('urgency')
    .optional()
    .isIn(Object.values(URGENCY_LEVELS))
    .withMessage(`Urgency must be one of: ${Object.values(URGENCY_LEVELS).join(', ')}`),

  body('address_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('address_id must be a positive integer'),

  body('customer_address')
    .optional()
    .trim(),

  body('customer_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Customer latitude must be between -90 and 90'),

  body('customer_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Customer longitude must be between -180 and 180'),

  body('scheduled_at')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('scheduled_at must be a valid ISO8601 date string')
];

const cancelBookingValidation = [
  param('id')
    .custom((val) => {
      if (!val) throw new Error('Booking ID is required');
      const isNum = Number.isInteger(Number(val)) && Number(val) > 0;
      const isBookingNum = typeof val === 'string' && val.startsWith('BK-');
      if (!isNum && !isBookingNum) {
        throw new Error('Booking ID must be a positive integer');
      }
      return true;
    }),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Cancellation reason must not exceed 1000 characters')
];

const updateStatusValidation = [
  param('id')
    .custom((val) => {
      if (!val) throw new Error('Booking ID is required');
      const isNum = Number.isInteger(Number(val)) && Number(val) > 0;
      const isBookingNum = typeof val === 'string' && val.startsWith('BK-');
      if (!isNum && !isBookingNum) {
        throw new Error('Booking ID must be a positive integer');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(BOOKING_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(BOOKING_STATUSES).join(', ')}`),

  body('notes')
    .optional()
    .trim()
];

module.exports = {
  createBookingValidation,
  cancelBookingValidation,
  updateStatusValidation
};
