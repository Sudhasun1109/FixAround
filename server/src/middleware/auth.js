const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/apiError');
const { pool } = require('../config/database');

/**
 * Middleware to verify JWT token and authenticate user
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Authentication token is required'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(AppError.unauthorized('Authentication token missing'));
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    // Look up active user in DB
    const [rows] = await pool.query(
      'SELECT id, email, phone, first_name, last_name, role, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id || decoded.userId]
    );

    if (rows.length === 0) {
      return next(AppError.unauthorized('User associated with this token no longer exists'));
    }

    const user = rows[0];
    if (!user.is_active) {
      return next(AppError.forbidden('User account is deactivated. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Invalid or expired authentication token'));
    }
    next(err);
  }
}

/**
 * Optional authentication middleware: Populates req.user if a valid token is provided,
 * otherwise proceeds as guest without returning 401
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const [rows] = await pool.query(
      'SELECT id, email, phone, first_name, last_name, role, is_active FROM users WHERE id = ? LIMIT 1',
      [decoded.id || decoded.userId]
    );

    if (rows.length > 0 && rows[0].is_active) {
      req.user = rows[0];
    } else {
      req.user = null;
    }

    next();
  } catch (err) {
    // Non-blocking: proceed as unauthenticated on token failure
    req.user = null;
    next();
  }
}

module.exports = {
  verifyToken,
  optionalAuth
};
