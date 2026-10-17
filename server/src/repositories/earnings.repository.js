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

module.exports = {
  create,
  findByTechnicianId,
  findByBookingId,
  getTotal,
  checkExists
};
