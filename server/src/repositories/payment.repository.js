const { pool } = require('../config/database');

/**
 * Create a new payment record
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    payment_number,
    booking_id,
    customer_id,
    amount,
    payment_method = 'ONLINE',
    status = 'PENDING',
    gateway_order_id = null,
    gateway_payment_id = null,
    gateway_signature = null,
    gateway_response = null,
    is_sandbox = 0,
    paid_at = null
  } = data;

  const [result] = await conn.query(
    `INSERT INTO payments (
      payment_number, booking_id, customer_id, amount, payment_method,
      status, gateway_order_id, gateway_payment_id, gateway_signature,
      gateway_response, is_sandbox, paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payment_number,
      booking_id,
      customer_id,
      amount,
      payment_method,
      status,
      gateway_order_id,
      gateway_payment_id,
      gateway_signature,
      gateway_response ? JSON.stringify(gateway_response) : null,
      is_sandbox ? 1 : 0,
      paid_at
    ]
  );

  return result.insertId;
}

/**
 * Find payment by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT p.*,
            b.booking_number, b.technician_id, b.category_id,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.email AS customer_email
     FROM payments p
     JOIN bookings b ON b.id = p.booking_id
     JOIN users c ON c.id = p.customer_id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find payments by booking ID
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function findByBookingId(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT p.*,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name
     FROM payments p
     JOIN users c ON c.id = p.customer_id
     WHERE p.booking_id = ?
     ORDER BY p.id DESC`,
    [bookingId]
  );
  return rows;
}

/**
 * Update payment status and gateway details
 * @param {number} id
 * @param {string} status
 * @param {Object} [details={}]
 * @param {Object} [conn=pool]
 */
async function updateStatus(id, status, details = {}, conn = pool) {
  const setClauses = ['status = ?'];
  const values = [status];

  if (status === 'SUCCESS' && !details.paid_at) {
    setClauses.push('paid_at = UTC_TIMESTAMP()');
  }

  const allowed = [
    'gateway_order_id', 'gateway_payment_id', 'gateway_signature',
    'gateway_response', 'paid_at'
  ];

  for (const key of allowed) {
    if (details[key] !== undefined) {
      setClauses.push(`\`${key}\` = ?`);
      if (key === 'gateway_response' && typeof details[key] === 'object' && details[key] !== null) {
        values.push(JSON.stringify(details[key]));
      } else {
        values.push(details[key]);
      }
    }
  }

  values.push(id);
  const [result] = await conn.query(
    `UPDATE payments SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Find payments by customer ID (paginated)
 * @param {number} customerId
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByCustomerId(customerId, { page = 1, limit = 10, status = null } = {}, conn = pool) {
  const conditions = ['p.customer_id = ?'];
  const values = [customerId];

  if (status) {
    conditions.push('p.status = ?');
    values.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM payments p ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT p.*,
           b.booking_number, b.title AS booking_title
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    ${whereClause}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { payments: rows, total };
}

/**
 * Find all payments for admin view (paginated with filters)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({
  page = 1,
  limit = 20,
  status = null,
  paymentMethod = null,
  startDate = null,
  endDate = null
} = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push('p.status = ?');
    values.push(status);
  }

  if (paymentMethod) {
    conditions.push('p.payment_method = ?');
    values.push(paymentMethod);
  }

  if (startDate) {
    conditions.push('p.created_at >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('p.created_at <= ?');
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM payments p
    ${whereClause}
  `;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT p.*,
           b.booking_number,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.email AS customer_email
    FROM payments p
    JOIN bookings b ON b.id = p.booking_id
    JOIN users c ON c.id = p.customer_id
    ${whereClause}
    ORDER BY p.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { payments: rows, total };
}

module.exports = {
  create,
  findById,
  findByBookingId,
  updateStatus,
  findByCustomerId,
  findAll
};
