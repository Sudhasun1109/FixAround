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
  skip: (req) => {
    // Never block test suite
    if (config.env === 'test') return true;
    // In development mode, allow localhost/loopback requests without restriction
    if (config.env === 'development' && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1')) {
      return true;
    }
    return false;
  },
  handler: (req, res) => {
    return apiResponse.error(
      res,
      'Too many requests from this IP, please try again after a few minutes',
      429
    );
  }
});

/**
 * Rate limiter for sensitive authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === 'test',
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
