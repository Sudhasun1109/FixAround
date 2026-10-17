const { body, param } = require('express-validator');
const { PAYMENT_METHODS } = require('../utils/constants');

const initiatePaymentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),

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
