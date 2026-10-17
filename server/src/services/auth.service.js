const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/env');
const AppError = require('../utils/apiError');
const { sanitizeUser } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');
const userRepo = require('../repositories/user.repository');

/**
 * Generate JWT access token
 * @param {Object} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * Register a new user
 * Creates user + customer_profile or technician_profile in a transaction
 * @param {Object} userData
 */
async function register(userData) {
  const email = userData.email.toLowerCase().trim();
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    throw AppError.conflict('An account with this email address already exists');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);

  const role = userData.role || ROLES.CUSTOMER;
  const firstName = userData.firstName || userData.first_name;
  const lastName = userData.lastName || userData.last_name;
  const phone = userData.phone || null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const userId = await userRepo.create({
      email,
      phone,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role,
      is_active: 1,
      email_verified: 0
    }, conn);

    if (role === ROLES.TECHNICIAN) {
      await conn.query(
        `INSERT INTO technician_profiles (user_id, verification_status, is_available, is_online)
         VALUES (?, 'pending', 0, 0)`,
        [userId]
      );
    } else {
      await conn.query(
        `INSERT INTO customer_profiles (user_id, preferred_language)
         VALUES (?, 'en')`,
        [userId]
      );
    }

    await conn.commit();

    const createdUser = await userRepo.findById(userId);
    const token = generateToken(createdUser);

    return {
      user: sanitizeUser(createdUser),
      token
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Log in an existing user
 * @param {string} email
 * @param {string} password
 */
async function login(email, password) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (!user.is_active) {
    throw AppError.forbidden('Your account has been deactivated. Please contact support.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  await userRepo.updateLastLogin(user.id);

  const token = generateToken(user);

  return {
    user: sanitizeUser(user),
    token
  };
}

/**
 * Get profile details for authenticated user
 * @param {number} userId
 */
async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return sanitizeUser(user);
}

/**
 * Update authenticated user's profile
 * @param {number} userId
 * @param {Object} data
 */
async function updateProfile(userId, data) {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }

  const updateFields = {};
  if (data.firstName || data.first_name) {
    updateFields.first_name = data.firstName || data.first_name;
  }
  if (data.lastName || data.last_name) {
    updateFields.last_name = data.lastName || data.last_name;
  }
  if (data.phone !== undefined) {
    updateFields.phone = data.phone;
  }
  if (data.avatar_url !== undefined) {
    updateFields.avatar_url = data.avatar_url;
  }

  if (Object.keys(updateFields).length > 0) {
    await userRepo.update(userId, updateFields);
  }

  const updatedUser = await userRepo.findById(userId);
  return sanitizeUser(updatedUser);
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  generateToken
};
