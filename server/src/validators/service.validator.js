const { body, param } = require('express-validator');

const createServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Service category name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be URL-safe (lowercase letters, numbers, hyphens)'),

  body('description')
    .optional()
    .trim(),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Icon identifier must not exceed 50 characters'),

  body('image_url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  body('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative decimal'),

  body('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative decimal'),

  body('inspection_charge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Inspection charge must be a non-negative decimal'),

  body('warranty_period_days')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty period days must be a non-negative integer'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('sort_order')
    .optional()
    .isInt()
    .withMessage('Sort order must be an integer')
];

const updateServiceValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Service ID must be a positive integer'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Service category name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must be URL-safe (lowercase letters, numbers, hyphens)'),

  body('description')
    .optional()
    .trim(),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 }),

  body('image_url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  body('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a non-negative decimal'),

  body('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a non-negative decimal'),

  body('inspection_charge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Inspection charge must be a non-negative decimal'),

  body('warranty_period_days')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty period must be a non-negative integer'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),

  body('sort_order')
    .optional()
    .isInt()
    .withMessage('Sort order must be an integer')
];

module.exports = {
  createServiceValidation,
  updateServiceValidation
};
