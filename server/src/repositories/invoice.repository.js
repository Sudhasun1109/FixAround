const { pool } = require('../config/database');

/**
 * Create a new invoice record
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    invoice_number,
    booking_id,
    customer_id,
    technician_id = null,
    payment_id = null,
    subtotal = 0.00,
    tax_amount = 0.00,
    tax_rate = 0.00,
    discount_amount = 0.00,
    total_amount = 0.00,
    line_items = null,
    status = 'ISSUED',
    issued_at = null,
    due_date = null,
    notes = null
  } = data;

  const [result] = await conn.query(
    `INSERT INTO invoices (
      invoice_number, booking_id, customer_id, technician_id, payment_id,
      subtotal, tax_amount, tax_rate, discount_amount, total_amount,
      line_items, status, issued_at, due_date, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IFNULL(?, UTC_TIMESTAMP()), ?, ?)`,
    [
      invoice_number,
      booking_id,
      customer_id,
      technician_id,
      payment_id,
      subtotal,
      tax_amount,
      tax_rate,
      discount_amount,
      total_amount,
      line_items ? JSON.stringify(line_items) : null,
      status,
      issued_at,
      due_date,
      notes
    ]
  );

  return result.insertId;
}

/**
 * Find invoice by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT inv.*,
            b.booking_number, b.title AS booking_title,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.email AS customer_email,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name,
            p.payment_number, p.payment_method
     FROM invoices inv
     JOIN bookings b ON b.id = inv.booking_id
     JOIN users c ON c.id = inv.customer_id
     LEFT JOIN users t ON t.id = inv.technician_id
     LEFT JOIN payments p ON p.id = inv.payment_id
     WHERE inv.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find invoice by booking ID
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT inv.*,
            b.booking_number,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name
     FROM invoices inv
     JOIN bookings b ON b.id = inv.booking_id
     JOIN users c ON c.id = inv.customer_id
     LEFT JOIN users t ON t.id = inv.technician_id
     WHERE inv.booking_id = ?
     ORDER BY (inv.status = 'PAID') DESC, inv.id DESC
     LIMIT 1`,
    [bookingId]
  );
  return rows[0] || null;
}

/**
 * Find invoices by customer ID (paginated)
 * @param {number} customerId
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByCustomerId(customerId, { page = 1, limit = 10 } = {}, conn = pool) {
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM invoices WHERE customer_id = ?`;
  const [countRows] = await conn.query(countQuery, [customerId]);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT inv.*,
           b.booking_number, b.title AS booking_title
    FROM invoices inv
    JOIN bookings b ON b.id = inv.booking_id
    WHERE inv.customer_id = ?
    ORDER BY inv.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [customerId, Number(limit), Number(offset)]);

  return { invoices: rows, total };
}

/**
 * Update invoice status
 * @param {number} id
 * @param {string} status 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED'
 * @param {Object} [conn=pool]
 */
async function updateStatus(id, status, conn = pool) {
  const [result] = await conn.query(
    'UPDATE invoices SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows;
}

module.exports = {
  create,
  findById,
  findByBookingId,
  findByCustomerId,
  updateStatus
};
