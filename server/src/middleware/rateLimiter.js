const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const apiResponse = require('../utils/apiResponse');

/**
 * Standard API rate limiter for general routes
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiResponse.error(
      res,
      'Too many requests from this IP, please try again after 15 minutes',
      429
    );
  }
});

/**
 * Stricter rate limiter for sensitive authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return apiResponse.error(
      res,
      'Too many authentication attempts, please try again after 15 minutes',
      429
    );
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
