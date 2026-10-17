const { pool } = require('../config/database');
const settingsRepo = require('../repositories/settings.repository');
const auditRepo = require('../repositories/audit.repository');
const userRepo = require('../repositories/user.repository');
const bookingRepo = require('../repositories/booking.repository');
const paymentRepo = require('../repositories/payment.repository');

/**
 * Get aggregated dashboard statistics
 */
async function getDashboardStats() {
  const [userStats] = await pool.query(
    `SELECT 
       COUNT(*) AS total_users,
       COUNT(CASE WHEN role = 'customer' THEN 1 END) AS total_customers,
       COUNT(CASE WHEN role = 'technician' THEN 1 END) AS total_technicians,
       COUNT(CASE WHEN is_active = 1 THEN 1 END) AS active_users
     FROM users`
  );

  const [techStats] = await pool.query(
    `SELECT 
       COUNT(CASE WHEN is_available = 1 THEN 1 END) AS available_technicians,
       COUNT(CASE WHEN is_online = 1 THEN 1 END) AS online_technicians,
       COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) AS verified_technicians,
       COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) AS pending_verifications
     FROM technician_profiles`
  );

  const [bookingStats] = await pool.query(
    `SELECT 
       COUNT(*) AS total_bookings,
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_bookings,
       COUNT(CASE WHEN status IN ('REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_APPROVAL') THEN 1 END) AS active_bookings,
       COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_bookings,
       COUNT(CASE WHEN is_emergency = 1 THEN 1 END) AS emergency_bookings
     FROM bookings`
  );

  const [financialStats] = await pool.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END), 0.00) AS total_revenue,
       COALESCE(SUM(CASE WHEN status = 'SUCCESS' AND created_at >= CURDATE() THEN amount ELSE 0 END), 0.00) AS today_revenue
     FROM payments`
  );

  const [claimStats] = await pool.query(
    `SELECT 
       COUNT(*) AS total_claims,
       COUNT(CASE WHEN status = 'OPEN' THEN 1 END) AS open_claims
     FROM warranty_claims`
  );

  return {
    users: userStats[0],
    technicians: techStats[0],
    bookings: bookingStats[0],
    financials: financialStats[0],
    claims: claimStats[0]
  };
}

/**
 * Get detailed booking report
 * @param {Object} filters
 */
async function getBookingReport(filters = {}) {
  return await bookingRepo.findAll(filters);
}

/**
 * Get detailed payment report
 * @param {Object} filters
 */
async function getPaymentReport(filters = {}) {
  return await paymentRepo.findAll(filters);
}

/**
 * Get all platform settings
 */
async function getSettings() {
  return await settingsRepo.getAll();
}

/**
 * Update a platform setting
 * @param {string} key
 * @param {*} value
 * @param {number} adminId
 */
async function updateSetting(key, value, adminId) {
  await settingsRepo.set(key, value, adminId);

  await auditRepo.create({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'UPDATE_PLATFORM_SETTING',
    entity_type: 'platform_setting',
    details: { key, value }
  });

  return await settingsRepo.get(key);
}

/**
 * Get audit logs
 * @param {Object} filters
 */
async function getAuditLogs(filters = {}) {
  return await auditRepo.findAll(filters);
}

module.exports = {
  getDashboardStats,
  getBookingReport,
  getPaymentReport,
  getSettings,
  updateSetting,
  getAuditLogs
};
