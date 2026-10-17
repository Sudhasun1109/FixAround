const { pool } = require('../config/database');

/**
 * Create a new booking assignment record
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    booking_id,
    technician_id,
    attempt_number = 1,
    status = 'PENDING',
    deadline
  } = data;

  const [result] = await conn.query(
    `INSERT INTO booking_assignments (booking_id, technician_id, attempt_number, status, deadline)
     VALUES (?, ?, ?, ?, ?)`,
    [booking_id, technician_id, attempt_number, status, deadline]
  );

  return result.insertId;
}

/**
 * Find assignment by ID with optional SELECT FOR UPDATE lock
 * @param {number} id
 * @param {boolean} [forUpdate=false]
 * @param {Object} [conn=pool]
 */
async function findById(id, forUpdate = false, conn = pool) {
  let query = `
    SELECT ba.*, 
           b.booking_number, b.status AS booking_status, b.customer_id, b.category_id,
           u.first_name AS technician_first_name, u.last_name AS technician_last_name, u.phone AS technician_phone
    FROM booking_assignments ba
    JOIN bookings b ON b.id = ba.booking_id
    JOIN users u ON u.id = ba.technician_id
    WHERE ba.id = ? LIMIT 1
  `;

  if (forUpdate) {
    query += ' FOR UPDATE';
  }

  const [rows] = await conn.query(query, [id]);
  return rows[0] || null;
}

/**
 * Find all assignments for a booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT ba.*, 
            u.first_name AS technician_first_name, u.last_name AS technician_last_name,
            u.phone AS technician_phone, u.email AS technician_email
     FROM booking_assignments ba
     JOIN users u ON u.id = ba.technician_id
     WHERE ba.booking_id = ?
     ORDER BY ba.attempt_number ASC`,
    [bookingId]
  );
  return rows;
}

/**
 * Find currently PENDING assignment for a booking
 * @param {number} bookingId
 * @param {boolean} [forUpdate=false]
 * @param {Object} [conn=pool]
 */
async function findPendingByBookingId(bookingId, forUpdate = false, conn = pool) {
  let query = `
    SELECT ba.*, 
           u.first_name, u.last_name, u.phone
    FROM booking_assignments ba
    JOIN users u ON u.id = ba.technician_id
    WHERE ba.booking_id = ? AND ba.status = 'PENDING'
    LIMIT 1
  `;

  if (forUpdate) {
    query += ' FOR UPDATE';
  }

  const [rows] = await conn.query(query, [bookingId]);
  return rows[0] || null;
}

/**
 * Find assignments by technician user ID
 * @param {number} technicianId (users.id)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByTechnicianId(technicianId, { status = null, page = 1, limit = 10 } = {}, conn = pool) {
  const conditions = ['ba.technician_id = ?'];
  const values = [technicianId];

  if (status) {
    conditions.push('ba.status = ?');
    values.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM booking_assignments ba ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT ba.*, 
           b.booking_number, b.title, b.is_emergency, b.status AS booking_status,
           b.customer_address, b.customer_latitude, b.customer_longitude,
           sc.name AS category_name,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name
    FROM booking_assignments ba
    JOIN bookings b ON b.id = ba.booking_id
    JOIN service_categories sc ON sc.id = b.category_id
    JOIN users c ON c.id = b.customer_id
    ${whereClause}
    ORDER BY ba.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { assignments: rows, total };
}

/**
 * Update status of an assignment
 * @param {number} id
 * @param {string} status 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
 * @param {string|null} [rejectionReason=null]
 * @param {Object} [conn=pool]
 */
async function updateStatus(id, status, rejectionReason = null, conn = pool) {
  const [result] = await conn.query(
    `UPDATE booking_assignments 
     SET status = ?, 
         responded_at = UTC_TIMESTAMP(), 
         rejection_reason = ? 
     WHERE id = ?`,
    [status, rejectionReason, id]
  );
  return result.affectedRows;
}

/**
 * Find all pending assignments whose deadline has passed (with FOR UPDATE lock)
 * @param {Object} [conn=pool]
 */
async function findExpired(conn = pool) {
  const [rows] = await conn.query(
    `SELECT ba.*, 
            b.booking_number, b.category_id, b.status AS booking_status
     FROM booking_assignments ba
     JOIN bookings b ON b.id = ba.booking_id
     WHERE ba.status = 'PENDING' AND ba.deadline < UTC_TIMESTAMP()
     FOR UPDATE`
  );
  return rows;
}

/**
 * Count total assignments made for a booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function countByBooking(bookingId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS total FROM booking_assignments WHERE booking_id = ?',
    [bookingId]
  );
  return rows[0].total;
}

/**
 * Get IDs of technicians who rejected or expired on this booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function getRejectedTechnicianIds(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT DISTINCT technician_id 
     FROM booking_assignments 
     WHERE booking_id = ? AND status IN ('REJECTED', 'EXPIRED')`,
    [bookingId]
  );
  return rows.map((r) => r.technician_id);
}

module.exports = {
  create,
  findById,
  findByBookingId,
  findPendingByBookingId,
  findByTechnicianId,
  updateStatus,
  findExpired,
  countByBooking,
  getRejectedTechnicianIds
};
