const { body, check } = require('express-validator');
const { PAYMENT_METHODS } = require('../utils/constants');

const initiatePaymentValidation = [
  check('id')
    .custom((val, { req }) => {
      const rawId = req.params?.id || req.body?.booking_id || val;
      if (!rawId) {
        throw new Error('Booking ID is required');
      }
      const isNum = Number.isInteger(Number(rawId)) && Number(rawId) > 0;
      const isBookingNum = typeof rawId === 'string' && rawId.startsWith('BK-');
      if (!isNum && !isBookingNum) {
        throw new Error('Booking ID must be a positive integer');
      }
      return true;
    }),

  body('payment_method')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage(`payment_method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),

  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('amount must be greater than 0')
];

module.exports = {
  initiatePaymentValidation
};
