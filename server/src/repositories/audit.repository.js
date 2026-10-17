const { pool } = require('../config/database');

/**
 * Create an audit log record
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    actor_id = null,
    actor_role = null,
    action,
    entity_type = null,
    entity_id = null,
    details = null,
    ip_address = null,
    user_agent = null
  } = data;

  const [result] = await conn.query(
    `INSERT INTO audit_logs (
      actor_id, actor_role, action, entity_type, entity_id,
      details, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      actor_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      details ? JSON.stringify(details) : null,
      ip_address,
      user_agent ? user_agent.substring(0, 500) : null
    ]
  );

  return result.insertId;
}

/**
 * Find audit logs with pagination and filters
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({
  page = 1,
  limit = 25,
  action = null,
  entityType = null,
  actorId = null,
  startDate = null,
  endDate = null
} = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (action) {
    conditions.push('al.action = ?');
    values.push(action);
  }

  if (entityType) {
    conditions.push('al.entity_type = ?');
    values.push(entityType);
  }

  if (actorId) {
    conditions.push('al.actor_id = ?');
    values.push(actorId);
  }

  if (startDate) {
    conditions.push('al.created_at >= ?');
    values.push(startDate);
  }

  if (endDate) {
    conditions.push('al.created_at <= ?');
    values.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT al.*, 
           u.email AS actor_email, u.first_name AS actor_first_name, u.last_name AS actor_last_name
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.actor_id
    ${whereClause}
    ORDER BY al.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { logs: rows, total };
}

module.exports = {
  create,
  findAll
};
