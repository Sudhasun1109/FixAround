const { pool } = require('../config/database');

/**
 * Create a new review
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    booking_id,
    customer_id,
    technician_id,
    rating,
    title = null,
    comment = null,
    is_visible = 1
  } = data;

  const [result] = await conn.query(
    `INSERT INTO reviews (booking_id, customer_id, technician_id, rating, title, comment, is_visible)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [booking_id, customer_id, technician_id, rating, title, comment, is_visible ? 1 : 0]
  );

  return result.insertId;
}

/**
 * Find review by booking ID
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT r.*,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.avatar_url AS customer_avatar
     FROM reviews r
     JOIN users c ON c.id = r.customer_id
     WHERE r.booking_id = ? LIMIT 1`,
    [bookingId]
  );
  return rows[0] || null;
}

/**
 * Check if review exists for a booking and customer
 * @param {number} bookingId
 * @param {number} customerId
 * @param {Object} [conn=pool]
 */
async function checkExists(bookingId, customerId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT id FROM reviews WHERE booking_id = ? AND customer_id = ? LIMIT 1',
    [bookingId, customerId]
  );
  return rows.length > 0;
}

/**
 * Find reviews for a technician (paginated)
 * @param {number} technicianId (users.id)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByTechnicianId(technicianId, { page = 1, limit = 10, visibleOnly = true } = {}, conn = pool) {
  const conditions = ['r.technician_id = ?'];
  const values = [technicianId];

  if (visibleOnly) {
    conditions.push('r.is_visible = 1');
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM reviews r ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT r.*,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.avatar_url AS customer_avatar
    FROM reviews r
    JOIN users c ON c.id = r.customer_id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { reviews: rows, total };
}

/**
 * Find reviews submitted by a customer
 * @param {number} customerId
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByCustomerId(customerId, { page = 1, limit = 10 } = {}, conn = pool) {
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM reviews WHERE customer_id = ?`;
  const [countRows] = await conn.query(countQuery, [customerId]);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT r.*,
           t.first_name AS technician_first_name, t.last_name AS technician_last_name,
           b.booking_number
    FROM reviews r
    JOIN users t ON t.id = r.technician_id
    JOIN bookings b ON b.id = r.booking_id
    WHERE r.customer_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [customerId, Number(limit), Number(offset)]);

  return { reviews: rows, total };
}

/**
 * Find all reviews (admin view with pagination and filters)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({ page = 1, limit = 20, rating = null, isVisible = null } = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (rating) {
    conditions.push('r.rating = ?');
    values.push(rating);
  }

  if (isVisible !== null && isVisible !== undefined) {
    conditions.push('r.is_visible = ?');
    values.push(isVisible ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM reviews r ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT r.*,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name,
           t.first_name AS technician_first_name, t.last_name AS technician_last_name,
           b.booking_number
    FROM reviews r
    JOIN users c ON c.id = r.customer_id
    JOIN users t ON t.id = r.technician_id
    JOIN bookings b ON b.id = r.booking_id
    ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { reviews: rows, total };
}

/**
 * Update review visibility
 * @param {number} id
 * @param {boolean} isVisible
 * @param {string|null} adminNotes
 * @param {Object} [conn=pool]
 */
async function updateVisibility(id, isVisible, adminNotes = null, conn = pool) {
  const [result] = await conn.query(
    'UPDATE reviews SET is_visible = ?, admin_notes = IFNULL(?, admin_notes) WHERE id = ?',
    [isVisible ? 1 : 0, adminNotes, id]
  );
  return result.affectedRows;
}

module.exports = {
  create,
  findByBookingId,
  checkExists,
  findByTechnicianId,
  findByCustomerId,
  findAll,
  updateVisibility
};
