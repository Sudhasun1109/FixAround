const { pool } = require('../config/database');

/**
 * Create a new booking
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    booking_number,
    customer_id,
    category_id,
    technician_id = null,
    address_id = null,
    title,
    description = null,
    is_emergency = 0,
    status = 'REQUESTED',
    urgency = 'normal',
    customer_latitude = null,
    customer_longitude = null,
    customer_address = null,
    scheduled_at = null,
    notes = null
  } = data;

  const [result] = await conn.query(
    `INSERT INTO bookings (
      booking_number, customer_id, category_id, technician_id, address_id,
      title, description, is_emergency, status, urgency,
      customer_latitude, customer_longitude, customer_address, scheduled_at, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      booking_number,
      customer_id,
      category_id,
      technician_id,
      address_id,
      title,
      description,
      is_emergency ? 1 : 0,
      status,
      urgency,
      customer_latitude,
      customer_longitude,
      customer_address,
      scheduled_at,
      notes
    ]
  );

  return result.insertId;
}

/**
 * Find booking by ID (joined with customer, technician, category, address)
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT b.*,
            sc.name AS service_name,
            sc.name AS category_name, sc.slug AS category_slug, sc.icon AS category_icon, sc.warranty_period_days,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name, 
            CASE WHEN c.id IS NOT NULL THEN TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) ELSE NULL END AS customer_name,
            c.email AS customer_email, c.phone AS customer_phone,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name, 
            CASE WHEN t.id IS NOT NULL THEN TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, ''))) ELSE NULL END AS technician_name,
            t.email AS technician_email, t.phone AS technician_phone,
            tp.avg_rating AS technician_avg_rating,
            addr.address_line1, addr.address_line2, addr.city, addr.state, addr.pincode,
            p.status AS payment_status,
            p.id AS payment_id,
            p.payment_method
     FROM bookings b
     JOIN service_categories sc ON sc.id = b.category_id
     JOIN users c ON c.id = b.customer_id
     LEFT JOIN users t ON t.id = b.technician_id
     LEFT JOIN technician_profiles tp ON tp.user_id = t.id
     LEFT JOIN addresses addr ON addr.id = b.address_id
     LEFT JOIN (
       SELECT booking_id, MAX(id) AS max_id 
       FROM payments 
       GROUP BY booking_id
     ) latest_p ON latest_p.booking_id = b.id
     LEFT JOIN payments p ON p.id = latest_p.max_id
     WHERE b.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find booking by booking_number
 * @param {string} bookingNumber
 * @param {Object} [conn=pool]
 */
async function findByBookingNumber(bookingNumber, conn = pool) {
  const [rows] = await conn.query(
    `SELECT b.*,
            sc.name AS service_name,
            sc.name AS category_name, sc.slug AS category_slug,
            c.first_name AS customer_first_name, c.last_name AS customer_last_name,
            CASE WHEN c.id IS NOT NULL THEN TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) ELSE NULL END AS customer_name,
            t.first_name AS technician_first_name, t.last_name AS technician_last_name,
            CASE WHEN t.id IS NOT NULL THEN TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, ''))) ELSE NULL END AS technician_name
     FROM bookings b
     JOIN service_categories sc ON sc.id = b.category_id
     JOIN users c ON c.id = b.customer_id
     LEFT JOIN users t ON t.id = b.technician_id
     WHERE b.booking_number = ? LIMIT 1`,
    [bookingNumber]
  );
  return rows[0] || null;
}

/**
 * Find bookings by customer ID (paginated)
 * @param {number} customerId
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByCustomerId(customerId, { page = 1, limit = 10, status = null } = {}, conn = pool) {
  const conditions = ['b.customer_id = ?'];
  const values = [customerId];

  if (status) {
    conditions.push('b.status = ?');
    values.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM bookings b ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT b.*,
           sc.name AS service_name,
           sc.name AS category_name, sc.slug AS category_slug, sc.icon AS category_icon,
           t.first_name AS technician_first_name, t.last_name AS technician_last_name,
           CASE WHEN t.id IS NOT NULL THEN TRIM(CONCAT(COALESCE(t.first_name, ''), ' ', COALESCE(t.last_name, ''))) ELSE NULL END AS technician_name,
           t.phone AS technician_phone,
           p.status AS payment_status,
           p.id AS payment_id,
           p.payment_method
    FROM bookings b
    JOIN service_categories sc ON sc.id = b.category_id
    LEFT JOIN users t ON t.id = b.technician_id
    LEFT JOIN (
      SELECT booking_id, MAX(id) AS max_id 
      FROM payments 
      GROUP BY booking_id
    ) latest_p ON latest_p.booking_id = b.id
    LEFT JOIN payments p ON p.id = latest_p.max_id
    ${whereClause}
    ORDER BY b.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { bookings: rows, total };
}

/**
 * Find bookings by technician ID (paginated)
 * @param {number} technicianId (users.id)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByTechnicianId(technicianId, { page = 1, limit = 10, status = null } = {}, conn = pool) {
  const conditions = ['b.technician_id = ?'];
  const values = [technicianId];

  if (status) {
    conditions.push('b.status = ?');
    values.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM bookings b ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT b.*,
           sc.name AS service_name,
           sc.name AS category_name, sc.slug AS category_slug, sc.icon AS category_icon,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name,
           CASE WHEN c.id IS NOT NULL THEN TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) ELSE NULL END AS customer_name,
           c.phone AS customer_phone
    FROM bookings b
    JOIN service_categories sc ON sc.id = b.category_id
    JOIN users c ON c.id = b.customer_id
    ${whereClause}
    ORDER BY b.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { bookings: rows, total };
}

/**
 * Update booking status and related milestone timestamps
 * @param {number} id
 * @param {string} status
 * @param {Object} [extraFields={}]
 * @param {Object} [conn=pool]
 */
async function updateStatus(id, status, extraFields = {}, conn = pool) {
  const setClauses = ['status = ?'];
  const values = [status];

  // Set milestone timestamps automatically
  if (status === 'ACCEPTED' && !extraFields.accepted_at) {
    setClauses.push('accepted_at = UTC_TIMESTAMP()');
  } else if (status === 'IN_PROGRESS' && !extraFields.started_at) {
    setClauses.push('started_at = UTC_TIMESTAMP()');
  } else if (status === 'COMPLETED' && !extraFields.completed_at) {
    setClauses.push('completed_at = UTC_TIMESTAMP()');
  } else if (status === 'CANCELLED' && !extraFields.cancelled_at) {
    setClauses.push('cancelled_at = UTC_TIMESTAMP()');
  }

  const allowedExtra = [
    'accepted_at', 'started_at', 'completed_at', 'cancelled_at',
    'cancellation_reason', 'cancelled_by', 'estimated_total', 'final_total',
    'commission_amount', 'technician_payout', 'assignment_attempts', 'notes'
  ];

  for (const key of allowedExtra) {
    if (extraFields[key] !== undefined) {
      setClauses.push(`\`${key}\` = ?`);
      values.push(extraFields[key]);
    }
  }

  values.push(id);
  const [result] = await conn.query(
    `UPDATE bookings SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Update assigned technician and increment assignment attempts
 * @param {number} id
 * @param {number|null} technicianId
 * @param {string} [status='ASSIGNED']
 * @param {Object} [conn=pool]
 */
async function updateTechnician(id, technicianId, status = 'ASSIGNED', conn = pool) {
  const [result] = await conn.query(
    `UPDATE bookings 
     SET technician_id = ?, 
         status = ?, 
         assignment_attempts = assignment_attempts + 1 
     WHERE id = ?`,
    [technicianId, status, id]
  );
  return result.affectedRows;
}

/**
 * Cancel a booking
 * @param {number} id
 * @param {string} reason
 * @param {string} cancelledBy 'customer' | 'technician' | 'admin' | 'system'
 * @param {Object} [conn=pool]
 */
async function cancel(id, reason, cancelledBy, conn = pool) {
  const [result] = await conn.query(
    `UPDATE bookings 
     SET status = 'CANCELLED', 
         cancelled_at = UTC_TIMESTAMP(), 
         cancellation_reason = ?, 
         cancelled_by = ? 
     WHERE id = ?`,
    [reason, cancelledBy, id]
  );
  return result.affectedRows;
}

/**
 * Find all bookings (Admin paginated with filters)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({
  page = 1,
  limit = 20,
  status = null,
  categoryId = null,
  isEmergency = null,
  startDate = null,
  endDate = null,
  search = null
} = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push('b.status = ?');
    values.push(status);
  }

  if (categoryId) {
    conditions.push('b.category_id = ?');
    values.push(categoryId);
  }

  if (isEmergency !== null && isEmergency !== undefined) {
    conditions.push('b.is_emergency = ?');
    values.push(isEmergency ? 1 : 0);
  }

  if (startDate) {
    conditions.push('b.created_at >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('b.created_at <= ?');
    values.push(endDate);
  }

  if (search) {
    conditions.push('(b.booking_number LIKE ? OR b.title LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR t.first_name LIKE ? OR t.last_name LIKE ?)');
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM bookings b
    JOIN users c ON c.id = b.customer_id
    LEFT JOIN users t ON t.id = b.technician_id
    ${whereClause}
  `;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT b.*,
           sc.name AS category_name, sc.slug AS category_slug,
           c.first_name AS customer_first_name, c.last_name AS customer_last_name, c.phone AS customer_phone,
           t.first_name AS technician_first_name, t.last_name AS technician_last_name, t.phone AS technician_phone
    FROM bookings b
    JOIN service_categories sc ON sc.id = b.category_id
    JOIN users c ON c.id = b.customer_id
    LEFT JOIN users t ON t.id = b.technician_id
    ${whereClause}
    ORDER BY b.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { bookings: rows, total };
}

/**
 * Count bookings matching criteria
 * @param {Object} conditions
 * @param {Object} [conn=pool]
 */
async function count(conditions = {}, conn = pool) {
  const whereClauses = [];
  const values = [];

  if (conditions.status) {
    whereClauses.push('status = ?');
    values.push(conditions.status);
  }
  if (conditions.is_emergency !== undefined) {
    whereClauses.push('is_emergency = ?');
    values.push(conditions.is_emergency ? 1 : 0);
  }
  if (conditions.technician_id) {
    whereClauses.push('technician_id = ?');
    values.push(conditions.technician_id);
  }
  if (conditions.customer_id) {
    whereClauses.push('customer_id = ?');
    values.push(conditions.customer_id);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM bookings ${whereStr}`, values);
  return rows[0].total;
}

/**
 * Get status history audit records for a booking
 * @param {number} bookingId
 * @param {Object} [conn=pool]
 */
async function getStatusHistory(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT bsh.*, 
            u.first_name AS changed_by_first_name, u.last_name AS changed_by_last_name
     FROM booking_status_history bsh
     LEFT JOIN users u ON u.id = bsh.changed_by
     WHERE bsh.booking_id = ?
     ORDER BY bsh.created_at ASC`,
    [bookingId]
  );
  return rows;
}

/**
 * Add a status transition record to booking_status_history
 * @param {Object} historyData
 * @param {Object} [conn=pool]
 */
async function addStatusHistory(historyData, conn = pool) {
  const {
    booking_id,
    from_status = null,
    to_status,
    changed_by = null,
    actor_role = null,
    notes = null
  } = historyData;

  const [result] = await conn.query(
    `INSERT INTO booking_status_history 
     (booking_id, from_status, to_status, changed_by, actor_role, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [booking_id, from_status, to_status, changed_by, actor_role, notes]
  );

  return result.insertId;
}

module.exports = {
  create,
  findById,
  findByBookingNumber,
  findByCustomerId,
  findByTechnicianId,
  updateStatus,
  updateTechnician,
  cancel,
  findAll,
  count,
  getStatusHistory,
  addStatusHistory
};
