/**
 * Application Error Class for consistent error management
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access', errors = null) {
    return new AppError(message, 401, errors);
  }

  static forbidden(message = 'Access forbidden: insufficient permissions', errors = null) {
    return new AppError(message, 403, errors);
  }

  static notFound(message = 'Resource not found', errors = null) {
    return new AppError(message, 404, errors);
  }

  static conflict(message = 'Resource conflict', errors = null) {
    return new AppError(message, 409, errors);
  }

  static internal(message = 'Internal server error', errors = null) {
    return new AppError(message, 500, errors, false);
  }
}

module.exports = AppError;
