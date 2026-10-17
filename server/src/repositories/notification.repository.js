const { pool } = require('../config/database');

/**
 * Create a new notification
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    user_id,
    type,
    title,
    message,
    data: payload = null
  } = data;

  const [result] = await conn.query(
    `INSERT INTO notifications (user_id, type, title, message, data)
     VALUES (?, ?, ?, ?, ?)`,
    [
      user_id,
      type,
      title,
      message,
      payload ? JSON.stringify(payload) : null
    ]
  );

  return result.insertId;
}

/**
 * Find notifications by user ID (paginated)
 * @param {number} userId
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findByUserId(userId, { page = 1, limit = 20, unreadOnly = false } = {}, conn = pool) {
  const conditions = ['user_id = ?'];
  const values = [userId];

  if (unreadOnly) {
    conditions.push('is_read = 0');
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM notifications ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT * FROM notifications
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { notifications: rows, total };
}

/**
 * Mark a single notification as read
 * @param {number} id
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function markAsRead(id, userId, conn = pool) {
  const [result] = await conn.query(
    `UPDATE notifications 
     SET is_read = 1, read_at = UTC_TIMESTAMP() 
     WHERE id = ? AND user_id = ? AND is_read = 0`,
    [id, userId]
  );
  return result.affectedRows;
}

/**
 * Mark all unread notifications for a user as read
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function markAllAsRead(userId, conn = pool) {
  const [result] = await conn.query(
    `UPDATE notifications 
     SET is_read = 1, read_at = UTC_TIMESTAMP() 
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return result.affectedRows;
}

/**
 * Count unread notifications for user
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function countUnread(userId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return rows[0].total;
}

module.exports = {
  create,
  findByUserId,
  markAsRead,
  markAllAsRead,
  countUnread
};
