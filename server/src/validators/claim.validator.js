const { body, param } = require('express-validator');
const { CLAIM_STATUSES } = require('../utils/constants');

const createClaimValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),

  body('issue_description')
    .trim()
    .notEmpty()
    .withMessage('Issue description is required')
    .isLength({ min: 10, max: 3000 })
    .withMessage('Issue description must be between 10 and 3000 characters'),

  body('evidence_notes')
    .optional()
    .trim()
];

const resolveClaimValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Claim ID must be a positive integer'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn([CLAIM_STATUSES.APPROVED, CLAIM_STATUSES.REJECTED, CLAIM_STATUSES.RESOLVED])
    .withMessage(`Status must be one of: ${[CLAIM_STATUSES.APPROVED, CLAIM_STATUSES.REJECTED, CLAIM_STATUSES.RESOLVED].join(', ')}`),

  body('resolution_type')
    .optional()
    .isIn(['RE_SERVICE', 'PARTIAL_REFUND', 'FULL_REFUND', 'REJECTED', 'OTHER'])
    .withMessage('Invalid resolution_type specified'),

  body('resolution_notes')
    .trim()
    .notEmpty()
    .withMessage('Resolution notes are required')
];

module.exports = {
  createClaimValidation,
  resolveClaimValidation
};
