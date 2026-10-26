const { pool } = require('../config/database');

/**
 * Create a new technician earnings record
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    technician_id,
    booking_id,
    payment_id = null,
    gross_amount = 0.00,
    commission_rate = 0.00,
    commission_amount = 0.00,
    net_amount = 0.00,
    settlement_status = 'PENDING',
    notes = null
  } = data;

  const [result] = await conn.query(
    `INSERT INTO technician_earnings (
      technician_id, booking_id, payment_id,
      gross_amount, commission_rate, commission_amount,
      net_amount, settlement_status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      technician_id,
      booking_id,
      payment_id,
      gross_amount,
      commission_rate,
      commission_amount,
      net_amount,
      settlement_status,
      notes
    ]
  );

  return result.insertId;
}

/**
 * Find earnings by technician ID (paginated)
 * @param {number} technicianId (users.id)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByTechnicianId(technicianId, { page = 1, limit = 20, settlementStatus = null } = {}, conn = pool) {
  const conditions = ['te.technician_id = ?'];
  const values = [technicianId];

  if (settlementStatus) {
    conditions.push('te.settlement_status = ?');
    values.push(settlementStatus);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM technician_earnings te ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT te.*,
           b.booking_number, b.title AS booking_title, b.completed_at
    FROM technician_earnings te
    JOIN bookings b ON b.id = te.booking_id
    ${whereClause}
    ORDER BY te.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { earnings: rows, total };
}

/**
 * Find earnings by booking ID
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT * FROM technician_earnings WHERE booking_id = ? LIMIT 1',
    [bookingId]
  );
  return rows[0] || null;
}

/**
 * Get total earnings summary for a technician
 * @param {number} technicianId (users.id)
 * @param {Object} [conn=pool]
 */
async function getTotal(technicianId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT 
       COALESCE(SUM(gross_amount), 0.00) AS total_gross,
       COALESCE(SUM(commission_amount), 0.00) AS total_commission,
       COALESCE(SUM(net_amount), 0.00) AS total_net,
       COALESCE(SUM(CASE WHEN settlement_status = 'PENDING' THEN net_amount ELSE 0.00 END), 0.00) AS pending_settlement,
       COALESCE(SUM(CASE WHEN settlement_status = 'SETTLED' THEN net_amount ELSE 0.00 END), 0.00) AS settled_amount
     FROM technician_earnings
     WHERE technician_id = ?`,
    [technicianId]
  );
  return rows[0];
}

/**
 * Check if earnings already created for a booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function checkExists(bookingId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT id FROM technician_earnings WHERE booking_id = ? LIMIT 1',
    [bookingId]
  );
  return rows.length > 0;
}

/**
 * Find all earnings with technician & booking info for Admin
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({ page = 1, limit = 20, settlementStatus = null, search = '' } = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (settlementStatus) {
    conditions.push('te.settlement_status = ?');
    values.push(settlementStatus);
  }

  if (search) {
    conditions.push('(b.booking_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM technician_earnings te 
    JOIN bookings b ON b.id = te.booking_id
    JOIN users u ON u.id = te.technician_id
    ${whereClause}
  `;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0]?.total || 0;

  const selectQuery = `
    SELECT te.*,
           b.booking_number, b.title AS booking_title, b.completed_at,
           u.first_name AS technician_first_name, u.last_name AS technician_last_name,
           u.email AS technician_email, u.phone AS technician_phone,
           TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS technician_name
    FROM technician_earnings te
    JOIN bookings b ON b.id = te.booking_id
    JOIN users u ON u.id = te.technician_id
    ${whereClause}
    ORDER BY te.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  // Summary stats
  const [summaryRows] = await conn.query(`
    SELECT 
      COALESCE(SUM(gross_amount), 0.00) AS total_gross,
      COALESCE(SUM(commission_amount), 0.00) AS total_commission,
      COALESCE(SUM(net_amount), 0.00) AS total_net,
      COALESCE(SUM(CASE WHEN settlement_status = 'PENDING' THEN net_amount ELSE 0.00 END), 0.00) AS total_pending,
      COALESCE(SUM(CASE WHEN settlement_status = 'SETTLED' THEN net_amount ELSE 0.00 END), 0.00) AS total_settled
    FROM technician_earnings
  `);

  return { earnings: rows, total, summary: summaryRows[0] || {} };
}

/**
 * Admin verifies and settles a technician payout
 * @param {number} earningId
 * @param {number} adminId
 * @param {string|null} notes
 * @param {Object} [conn=pool]
 */
async function settle(earningId, adminId, notes = null, conn = pool) {
  const AppError = require('../utils/apiError');
  const [rows] = await conn.query(
    `SELECT te.*, b.booking_number 
     FROM technician_earnings te 
     JOIN bookings b ON b.id = te.booking_id 
     WHERE te.id = ? LIMIT 1`,
    [earningId]
  );
  if (!rows.length) {
    throw AppError.notFound('Earnings record not found');
  }

  const earning = rows[0];
  if (earning.settlement_status === 'SETTLED') {
    throw AppError.badRequest('This payout has already been verified and settled');
  }

  const connection = conn === pool ? await pool.getConnection() : conn;
  const isLocalConn = conn === pool;

  try {
    if (isLocalConn) await connection.beginTransaction();

    // 1. Update technician_earnings to SETTLED
    await connection.query(
      `UPDATE technician_earnings 
       SET settlement_status = 'SETTLED', 
           settled_at = UTC_TIMESTAMP(), 
           notes = IFNULL(?, notes) 
       WHERE id = ?`,
      [notes || `Verified & settled by Admin #${adminId}`, earningId]
    );

    // 2. Transfer / credit amount to technician_profiles.total_earnings
    await connection.query(
      `UPDATE technician_profiles 
       SET total_earnings = total_earnings + ? 
       WHERE user_id = ?`,
      [Number(earning.net_amount).toFixed(2), earning.technician_id]
    );

    // 3. Send notification to technician
    const notificationRepo = require('./notification.repository');
    await notificationRepo.create({
      user_id: earning.technician_id,
      type: 'PAYMENT_RECEIVED',
      title: 'Payout Verified & Settled',
      message: `Admin has verified and released ₹${earning.net_amount} payout for booking #${earning.booking_number} to your earnings balance.`,
      data: { earningId, bookingId: earning.booking_id, amount: earning.net_amount }
    }, connection);

    if (isLocalConn) await connection.commit();
  } catch (err) {
    if (isLocalConn) await connection.rollback();
    throw err;
  } finally {
    if (isLocalConn) connection.release();
  }

  const [updated] = await pool.query('SELECT * FROM technician_earnings WHERE id = ?', [earningId]);
  return updated[0];
}

module.exports = {
  create,
  findByTechnicianId,
  findByBookingId,
  getTotal,
  checkExists,
  findAll,
  settle
};
