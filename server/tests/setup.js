/**
 * FixAround Test Setup & Utilities
 * 
 * Provides helpers for integration tests using supertest against the Express app.
 * Tests run against the REAL app (imported directly) but use test database.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'abcd';
process.env.DB_NAME = process.env.DB_NAME || 'fixaround_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-fixaround';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.TECHNICIAN_RESPONSE_TIMEOUT_SECONDS = '300';
process.env.TECHNICIAN_MAX_ASSIGNMENT_ATTEMPTS = '3';
process.env.PLATFORM_COMMISSION_PERCENT = '15';

const app = require('../src/app');
const { pool } = require('../src/config/database');
const config = require('../src/config/env');

/**
 * Generate a JWT token for testing
 */
function generateTestToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
}

/**
 * Create a test user directly in the database and return user + token
 */
async function createTestUser(overrides = {}) {
  const email = overrides.email || `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const role = overrides.role || 'customer';
  const firstName = overrides.firstName || 'Test';
  const lastName = overrides.lastName || 'User';

  const [result] = await pool.query(
    `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, is_active, email_verified)
     VALUES (?, ?, ?, ?, ?, ?, 1, 1)`,
    [email, overrides.phone || '9000000000', passwordHash, firstName, lastName, role]
  );

  const userId = result.insertId;

  // Create associated profile
  if (role === 'customer') {
    await pool.query(
      `INSERT INTO customer_profiles (user_id, preferred_language) VALUES (?, 'en')`,
      [userId]
    );
  } else if (role === 'technician') {
    await pool.query(
      `INSERT INTO technician_profiles (user_id, bio, experience_years, verification_status, is_available, is_online, latitude, longitude, service_radius_km, service_city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        overrides.bio || 'Test technician',
        overrides.experienceYears || 3,
        overrides.verificationStatus || 'approved',
        overrides.isAvailable !== undefined ? overrides.isAvailable : 1,
        overrides.isOnline !== undefined ? overrides.isOnline : 1,
        overrides.latitude || 28.6139,
        overrides.longitude || 77.2090,
        overrides.serviceRadiusKm || 15,
        overrides.serviceCity || 'New Delhi'
      ]
    );

    // Add skills if specified
    if (overrides.skills && overrides.skills.length > 0) {
      const [techProfile] = await pool.query(
        'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
      );
      for (const categoryId of overrides.skills) {
        await pool.query(
          'INSERT INTO technician_skills (technician_id, category_id, years_experience) VALUES (?, ?, 3)',
          [techProfile[0].id, categoryId]
        );
      }
    }
  }

  const user = { id: userId, email, role, first_name: firstName, last_name: lastName };
  const token = generateTestToken(user);

  return { user, token, userId };
}

/**
 * Clean up test data (delete by test email pattern)
 */
async function cleanupTestUsers() {
  try {
    // Get test user IDs
    const [testUsers] = await pool.query(
      "SELECT id FROM users WHERE email LIKE 'test_%@test.com'"
    );
    
    if (testUsers.length === 0) return;
    
    const ids = testUsers.map(u => u.id);
    const placeholders = ids.map(() => '?').join(',');
    
    // Delete in order respecting FKs
    await pool.query(`DELETE FROM notifications WHERE user_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM booking_status_history WHERE changed_by IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM booking_assignments WHERE technician_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM price_estimates WHERE technician_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM reviews WHERE customer_id IN (${placeholders}) OR technician_id IN (${placeholders})`, [...ids, ...ids]);
    await pool.query(`DELETE FROM warranty_claims WHERE customer_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM technician_earnings WHERE technician_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM invoices WHERE customer_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM refunds WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id IN (${placeholders}))`, ids);
    await pool.query(`DELETE FROM payments WHERE customer_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM service_attachments WHERE uploaded_by IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM bookings WHERE customer_id IN (${placeholders}) OR technician_id IN (${placeholders})`, [...ids, ...ids]);
    await pool.query(`DELETE FROM addresses WHERE user_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM technician_skills WHERE technician_id IN (SELECT id FROM technician_profiles WHERE user_id IN (${placeholders}))`, ids);
    await pool.query(`DELETE FROM technician_service_areas WHERE technician_id IN (SELECT id FROM technician_profiles WHERE user_id IN (${placeholders}))`, ids);
    await pool.query(`DELETE FROM technician_documents WHERE technician_id IN (SELECT id FROM technician_profiles WHERE user_id IN (${placeholders}))`, ids);
    await pool.query(`DELETE FROM technician_profiles WHERE user_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM customer_profiles WHERE user_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM audit_logs WHERE actor_id IN (${placeholders})`, ids);
    await pool.query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
  } catch (err) {
    // Silently ignore cleanup errors in tests
  }
}

/**
 * Close the database pool after all tests
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  app,
  request,
  pool,
  generateTestToken,
  createTestUser,
  cleanupTestUsers,
  closePool
};
