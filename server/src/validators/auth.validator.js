const { body } = require('express-validator');
const { ROLES } = require('../utils/constants');

const registerValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one numeric digit'),

  body('first_name')
    .optional()
    .trim(),
  body('firstName')
    .optional()
    .trim(),
  body()
    .custom((value, { req }) => {
      const fn = req.body.firstName || req.body.first_name;
      if (!fn || fn.trim().length === 0) {
        throw new Error('First name is required');
      }
      return true;
    }),

  body('last_name')
    .optional()
    .trim(),
  body('lastName')
    .optional()
    .trim(),
  body()
    .custom((value, { req }) => {
      const ln = req.body.lastName || req.body.last_name;
      if (!ln || ln.trim().length === 0) {
        throw new Error('Last name is required');
      }
      return true;
    }),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn([ROLES.CUSTOMER, ROLES.TECHNICIAN])
    .withMessage(`Role must be either '${ROLES.CUSTOMER}' or '${ROLES.TECHNICIAN}'`)
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  registerValidation,
  loginValidation
};
