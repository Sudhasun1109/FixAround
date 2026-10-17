const { pool } = require('../config/database');

/**
 * Create a new price estimate
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    booking_id,
    technician_id,
    revision_number = 1,
    labor_charge = 0.00,
    material_charge = 0.00,
    inspection_charge = 0.00,
    additional_charge = 0.00,
    total_estimate = 0.00,
    breakdown_notes = null,
    status = 'SUBMITTED'
  } = data;

  const [result] = await conn.query(
    `INSERT INTO price_estimates (
      booking_id, technician_id, revision_number,
      labor_charge, material_charge, inspection_charge, additional_charge,
      total_estimate, breakdown_notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking_id,
      technician_id,
      revision_number,
      labor_charge,
      material_charge,
      inspection_charge,
      additional_charge,
      total_estimate,
      breakdown_notes,
      status
    ]
  );

  return result.insertId;
}

/**
 * Find estimate by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT pe.*,
            b.booking_number, b.customer_id, b.status AS booking_status,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name
     FROM price_estimates pe
     JOIN bookings b ON b.id = pe.booking_id
     JOIN users t ON t.id = pe.technician_id
     WHERE pe.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find all estimates for a booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT pe.*,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name,
            u.first_name AS approver_first_name, u.last_name AS approver_last_name
     FROM price_estimates pe
     JOIN users t ON t.id = pe.technician_id
     LEFT JOIN users u ON u.id = pe.approved_by
     WHERE pe.booking_id = ?
     ORDER BY pe.revision_number DESC`,
    [bookingId]
  );
  return rows;
}

/**
 * Approve an estimate
 * @param {number} id
 * @param {number} approvedBy (Customer ID)
 * @param {Object} [conn=pool]
 */
async function approve(id, approvedBy, conn = pool) {
  const [result] = await conn.query(
    `UPDATE price_estimates 
     SET status = 'APPROVED', 
         approved_at = UTC_TIMESTAMP(), 
         approved_by = ? 
     WHERE id = ?`,
    [approvedBy, id]
  );
  return result.affectedRows;
}

/**
 * Reject an estimate
 * @param {number} id
 * @param {string} reason
 * @param {Object} [conn=pool]
 */
async function reject(id, reason = null, conn = pool) {
  const [result] = await conn.query(
    `UPDATE price_estimates 
     SET status = 'REJECTED', 
         rejected_at = UTC_TIMESTAMP(), 
         rejection_reason = ? 
     WHERE id = ?`,
    [reason, id]
  );
  return result.affectedRows;
}

/**
 * Mark previous pending/submitted estimates as SUPERSEDED for a booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function supersedePrevious(bookingId, conn = pool) {
  const [result] = await conn.query(
    `UPDATE price_estimates 
     SET status = 'SUPERSEDED' 
     WHERE booking_id = ? AND status IN ('SUBMITTED', 'REVISED')`,
    [bookingId]
  );
  return result.affectedRows;
}

/**
 * Get latest revision number for booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function getLatestRevisionNumber(bookingId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT MAX(revision_number) AS max_rev FROM price_estimates WHERE booking_id = ?',
    [bookingId]
  );
  return rows[0].max_rev || 0;
}

module.exports = {
  create,
  findById,
  findByBookingId,
  approve,
  reject,
  supersedePrevious,
  getLatestRevisionNumber
};
