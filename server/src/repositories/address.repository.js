const { pool } = require('../config/database');

/**
 * Find all addresses for a user
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function findByUserId(userId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return rows;
}

/**
 * Find address by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT * FROM addresses WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new address
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    user_id,
    label = 'Home',
    address_line1,
    address_line2 = null,
    city,
    state,
    pincode,
    latitude = null,
    longitude = null,
    is_default = 0
  } = data;

  if (is_default) {
    // Unset existing defaults
    await conn.query(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [user_id]);
  }

  const [result] = await conn.query(
    `INSERT INTO addresses (user_id, label, address_line1, address_line2, city, state, pincode, latitude, longitude, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, label, address_line1, address_line2, city, state, pincode, latitude, longitude, is_default ? 1 : 0]
  );

  return result.insertId;
}

/**
 * Update an existing address
 * @param {number} id
 * @param {number} userId
 * @param {Object} fields
 * @param {Object} [conn=pool]
 */
async function update(id, userId, fields, conn = pool) {
  const allowed = [
    'label', 'address_line1', 'address_line2', 'city',
    'state', 'pincode', 'latitude', 'longitude', 'is_default'
  ];
  const setClauses = [];
  const values = [];

  if (fields.is_default) {
    await conn.query(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [userId]);
  }

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`\`${key}\` = ?`);
      values.push(fields[key]);
    }
  }

  if (setClauses.length === 0) return 0;

  values.push(id, userId);
  const [result] = await conn.query(
    `UPDATE addresses SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Delete address
 * @param {number} id
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function deleteAddress(id, userId, conn = pool) {
  const [result] = await conn.query(
    `DELETE FROM addresses WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return result.affectedRows;
}

/**
 * Set an address as default
 * @param {number} id
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function setDefault(id, userId, conn = pool) {
  await conn.query(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [userId]);
  const [result] = await conn.query(
    `UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return result.affectedRows;
}

module.exports = {
  findByUserId,
  findById,
  create,
  update,
  deleteAddress,
  setDefault
};
