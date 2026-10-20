const { body, param, check } = require('express-validator');
const { CLAIM_STATUSES } = require('../utils/constants');

const createClaimValidation = [
  check('booking_id')
    .custom((val, { req }) => {
      const id = req.params?.id || req.body?.booking_id || req.body?.id;
      if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
        throw new Error('Valid booking ID is required');
      }
      return true;
    }),

  check('issue_description')
    .custom((val, { req }) => {
      const desc = req.body?.issue_description || req.body?.description;
      if (!desc || typeof desc !== 'string' || desc.trim().length === 0) {
        throw new Error('Issue description is required');
      }
      if (desc.trim().length < 3) {
        throw new Error('Issue description must be at least 3 characters');
      }
      if (desc.trim().length > 3000) {
        throw new Error('Issue description must not exceed 3000 characters');
      }
      return true;
    }),

  body('evidence_notes')
    .optional()
    .trim()
];

const resolveClaimValidation = [
  check('id')
    .custom((val, { req }) => {
      const id = req.params?.id || req.body?.id || req.body?.claim_id;
      if (!id || isNaN(parseInt(id, 10)) || parseInt(id, 10) < 1) {
        throw new Error('Valid claim ID is required');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn([CLAIM_STATUSES.APPROVED, CLAIM_STATUSES.REJECTED, CLAIM_STATUSES.RESOLVED])
    .withMessage(`Status must be one of: ${[CLAIM_STATUSES.APPROVED, CLAIM_STATUSES.REJECTED, CLAIM_STATUSES.RESOLVED].join(', ')}`),

  body('resolution_type')
    .optional()
    .isIn(['RE_SERVICE', 'PARTIAL_REFUND', 'FULL_REFUND', 'REJECTED', 'OTHER'])
    .withMessage('Invalid resolution_type specified'),

  body('resolution_notes')
    .optional()
    .trim()
];

module.exports = {
  createClaimValidation,
  resolveClaimValidation
};
