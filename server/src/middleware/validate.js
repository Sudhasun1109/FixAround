const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function normalizeCase(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
  for (const [key, val] of Object.entries(obj)) {
    const snake = toSnakeCase(key);
    if (snake !== key && !(snake in obj)) {
      obj[snake] = val;
    }
    const camel = toCamelCase(key);
    if (camel !== key && !(camel in obj)) {
      obj[camel] = val;
    }
  }
}

/**
 * Middleware wrapper that executes express-validator chains and checks for validation errors
 * @param {Array<import('express-validator').ValidationChain>} validations
 */
function validate(validations) {
  return async (req, res, next) => {
    if (req.body) {
      normalizeCase(req.body);
    }

    // Run all validations sequentially or in parallel
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return apiResponse.error(
      res,
      'Validation failed. Please check the supplied parameters.',
      400,
      formattedErrors
    );
  };
}

module.exports = validate;
