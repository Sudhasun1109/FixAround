const { pool } = require('../config/database');

/**
 * Create a new warranty claim
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    claim_number,
    booking_id,
    customer_id,
    technician_id,
    issue_description,
    evidence_notes = null,
    warranty_expires_at,
    status = 'OPEN'
  } = data;

  const [result] = await conn.query(
    `INSERT INTO warranty_claims (
      claim_number, booking_id, customer_id, technician_id,
      issue_description, evidence_notes, warranty_expires_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      claim_number,
      booking_id,
      customer_id,
      technician_id,
      issue_description,
      evidence_notes,
      warranty_expires_at,
      status
    ]
  );

  return result.insertId;
}

/**
 * Find claim by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT wc.*,
            b.booking_number, b.title AS booking_title, b.completed_at AS booking_completed_at,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.email AS customer_email,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name, t.phone AS technician_phone,
            r.first_name AS resolver_first_name, r.last_name AS resolver_last_name
     FROM warranty_claims wc
     JOIN bookings b ON b.id = wc.booking_id
     JOIN users c ON c.id = wc.customer_id
     JOIN users t ON t.id = wc.technician_id
     LEFT JOIN users r ON r.id = wc.resolved_by
     WHERE wc.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find claims by booking ID
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT wc.*,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name
     FROM warranty_claims wc
     JOIN users c ON c.id = wc.customer_id
     WHERE wc.booking_id = ?
     ORDER BY wc.id DESC`,
    [bookingId]
  );
  return rows;
}

/**
 * Find claims by customer ID
 * @param {number} customerId
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByCustomerId(customerId, { page = 1, limit = 10 } = {}, conn = pool) {
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM warranty_claims WHERE customer_id = ?`;
  const [countRows] = await conn.query(countQuery, [customerId]);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT wc.*,
           b.booking_number, b.title AS booking_title,
           t.first_name AS technician_first_name, t.last_name AS technician_last_name
    FROM warranty_claims wc
    JOIN bookings b ON b.id = wc.booking_id
    JOIN users t ON t.id = wc.technician_id
    WHERE wc.customer_id = ?
    ORDER BY wc.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [customerId, Number(limit), Number(offset)]);

  return { claims: rows, total };
}

/**
 * Update claim status
 * @param {number} id
 * @param {string} status
 * @param {Object} [conn=pool]
 */
async function updateStatus(id, status, conn = pool) {
  const [result] = await conn.query(
    'UPDATE warranty_claims SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows;
}

/**
 * Resolve claim by admin
 * @param {number} id
 * @param {Object} resolutionData
 * @param {Object} [conn=pool]
 */
async function resolve(id, resolutionData, conn = pool) {
  const {
    status = 'RESOLVED',
    resolution_type,
    resolution_notes,
    resolved_by
  } = resolutionData;

  const [result] = await conn.query(
    `UPDATE warranty_claims 
     SET status = ?, 
         resolution_type = ?, 
         resolution_notes = ?, 
         resolved_by = ?, 
         resolved_at = UTC_TIMESTAMP() 
     WHERE id = ?`,
    [status, resolution_type, resolution_notes, resolved_by, id]
  );
  return result.affectedRows;
}

/**
 * Find all claims (admin view)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({ page = 1, limit = 20, status = null } = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push('wc.status = ?');
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM warranty_claims wc ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT wc.*,
           b.booking_number,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name,
           t.first_name AS technician_first_name, t.last_name AS technician_last_name
    FROM warranty_claims wc
    JOIN bookings b ON b.id = wc.booking_id
    JOIN users c ON c.id = wc.customer_id
    JOIN users t ON t.id = wc.technician_id
    ${whereClause}
    ORDER BY wc.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { claims: rows, total };
}

module.exports = {
  create,
  findById,
  findByBookingId,
  findByCustomerId,
  updateStatus,
  resolve,
  findAll
};
