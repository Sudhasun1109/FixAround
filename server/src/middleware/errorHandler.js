const AppError = require('../utils/apiError');
const apiResponse = require('../utils/apiResponse');
const config = require('../config/env');

/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  // Normalize error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // MySQL Duplicate Entry (code: ER_DUP_ENTRY / 1062)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    statusCode = 409;
    message = 'A duplicate record already exists with that information.';
    const matches = err.sqlMessage ? err.sqlMessage.match(/Duplicate entry '(.*)' for key '(.*)'/) : null;
    if (matches && matches[2]) {
      errors = [{ field: matches[2], message: `Value '${matches[1]}' is already taken.` }];
    }
  }

  // MySQL Foreign Key Constraint (code: ER_NO_REFERENCED_ROW_2 / 1452)
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    statusCode = 400;
    message = 'Invalid reference ID provided. Associated record does not exist.';
  }

  // MySQL Row Referenced (code: ER_ROW_IS_REFERENCED_2 / 1451)
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    statusCode = 409;
    message = 'Cannot delete or update this record because it is referenced by another entity.';
  }

  // JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // SyntaxError in Body Parsing
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }

  // Log error (with stack in dev, concise in prod)
  if (!config.isProduction) {
    console.error(`[Error] [${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  } else if (statusCode >= 500) {
    console.error(`[CRITICAL] [${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`);
  }

  // In production, redact raw internal system exception messages
  if (config.isProduction && statusCode >= 500 && !err.isOperational) {
    message = 'An unexpected internal error occurred. Please try again later.';
  }

  const responseData = {
    success: false,
    message,
    data: null
  };

  if (errors !== null && errors !== undefined) {
    responseData.errors = Array.isArray(errors) ? errors : [errors];
  }

  if (!config.isProduction && err.stack) {
    responseData.stack = err.stack;
  }

  return res.status(statusCode).json(responseData);
}

module.exports = errorHandler;
