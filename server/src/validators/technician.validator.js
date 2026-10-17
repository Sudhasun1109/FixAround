const { body, query, param } = require('express-validator');
const { VERIFICATION_STATUSES } = require('../utils/constants');

const updateProfileValidation = [
  body('bio')
    .optional()
    .trim(),

  body('experience_years')
    .optional()
    .isInt({ min: 0, max: 70 })
    .withMessage('Experience years must be between 0 and 70'),

  body('is_available')
    .optional()
    .isBoolean()
    .withMessage('is_available must be a boolean'),

  body('is_online')
    .optional()
    .isBoolean()
    .withMessage('is_online must be a boolean'),

  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('service_radius_km')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Service radius must be between 1 and 100 km'),

  body('service_city')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('service_pincode')
    .optional()
    .trim()
    .isLength({ max: 10 })
];

const searchNearbyValidation = [
  query('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  query('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 200 })
    .withMessage('Radius must be between 0.1 and 200 km')
];

const verifyTechnicianValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Technician ID must be a positive integer'),

  body('status')
    .notEmpty()
    .withMessage('Verification status is required')
    .isIn(Object.values(VERIFICATION_STATUSES))
    .withMessage(`Status must be one of: ${Object.values(VERIFICATION_STATUSES).join(', ')}`),

  body('notes')
    .optional()
    .trim()
];

module.exports = {
  updateProfileValidation,
  searchNearbyValidation,
  verifyTechnicianValidation
};
