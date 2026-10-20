const { pool } = require('../config/database');

/**
 * Find user by email address
 * @param {string} email
 * @param {Object} [conn=pool]
 */
async function findByEmail(email, conn = pool) {
  const [rows] = await conn.query(
    `SELECT u.*, 
            cp.default_address_id, cp.preferred_language, cp.wallet_balance, cp.reward_points,
            tp.id AS technician_profile_id, tp.verification_status, tp.is_available, tp.is_online
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.user_id = u.id
     LEFT JOIN technician_profiles tp ON tp.user_id = u.id
     WHERE u.email = ? LIMIT 1`,
    [email.toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Find user by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT u.*, 
            cp.default_address_id, cp.preferred_language, cp.wallet_balance, cp.reward_points,
            tp.id AS technician_profile_id, tp.verification_status, tp.is_available, tp.is_online,
            tp.avg_rating, tp.completed_jobs, tp.service_city
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.user_id = u.id
     LEFT JOIN technician_profiles tp ON tp.user_id = u.id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find user by Google ID
 * @param {string} googleId
 * @param {Object} [conn=pool]
 */
async function findByGoogleId(googleId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT u.*, 
            cp.default_address_id, cp.preferred_language, cp.wallet_balance, cp.reward_points,
            tp.id AS technician_profile_id, tp.verification_status, tp.is_available, tp.is_online,
            tp.avg_rating, tp.completed_jobs, tp.service_city
     FROM users u
     LEFT JOIN customer_profiles cp ON cp.user_id = u.id
     LEFT JOIN technician_profiles tp ON tp.user_id = u.id
     WHERE u.google_id = ? LIMIT 1`,
    [googleId]
  );
  return rows[0] || null;
}

/**
 * Create a new user record
 * @param {Object} userData
 * @param {Object} [conn=pool]
 */
async function create(userData, conn = pool) {
  const {
    email,
    phone = null,
    password_hash,
    first_name,
    last_name,
    role = 'customer',
    is_active = 1,
    email_verified = 0,
    avatar_url = null,
    google_id = null,
    auth_provider = 'local'
  } = userData;

  const [result] = await conn.query(
    `INSERT INTO users (email, phone, password_hash, first_name, last_name, role, is_active, email_verified, avatar_url, google_id, auth_provider)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      email.toLowerCase(),
      phone,
      password_hash,
      first_name,
      last_name,
      role,
      is_active ? 1 : 0,
      email_verified ? 1 : 0,
      avatar_url,
      google_id,
      auth_provider
    ]
  );

  return result.insertId;
}

/**
 * Update user record
 * @param {number} id
 * @param {Object} fields
 * @param {Object} [conn=pool]
 */
async function update(id, fields, conn = pool) {
  const allowed = [
    'email', 'phone', 'first_name', 'last_name',
    'password_hash', 'avatar_url', 'is_active', 'email_verified',
    'google_id', 'auth_provider'
  ];
  const setClauses = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      setClauses.push(`\`${key}\` = ?`);
      values.push(fields[key]);
    }
  }

  if (setClauses.length === 0) return 0;

  values.push(id);
  const [result] = await conn.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Find users with pagination, role filter, and keyword search
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({ page = 1, limit = 20, role = null, search = null, isActive = null } = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (role) {
    conditions.push('u.role = ?');
    values.push(role);
  }

  if (isActive !== null && isActive !== undefined) {
    conditions.push('u.is_active = ?');
    values.push(isActive ? 1 : 0);
  }

  if (search) {
    conditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM users u ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT u.id, u.email, u.phone, u.first_name, u.last_name, u.role, 
           u.is_active, u.email_verified, u.avatar_url, u.last_login_at, u.created_at, u.updated_at
    FROM users u
    ${whereClause}
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { users: rows, total };
}

/**
 * Count users based on conditions
 * @param {Object} conditions
 * @param {Object} [conn=pool]
 */
async function count(conditions = {}, conn = pool) {
  const whereClauses = [];
  const values = [];

  if (conditions.role) {
    whereClauses.push('role = ?');
    values.push(conditions.role);
  }
  if (conditions.is_active !== undefined) {
    whereClauses.push('is_active = ?');
    values.push(conditions.is_active ? 1 : 0);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [rows] = await conn.query(`SELECT COUNT(*) AS total FROM users ${whereStr}`, values);
  return rows[0].total;
}

/**
 * Update user's last login timestamp
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function updateLastLogin(id, conn = pool) {
  const [result] = await conn.query(
    'UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?',
    [id]
  );
  return result.affectedRows;
}

/**
 * Deactivate user account
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function deactivate(id, conn = pool) {
  const [result] = await conn.query(
    'UPDATE users SET is_active = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows;
}

module.exports = {
  findByEmail,
  findById,
  findByGoogleId,
  create,
  update,
  findAll,
  count,
  updateLastLogin,
  deactivate
};
