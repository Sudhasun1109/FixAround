const { pool } = require('../config/database');

/**
 * Format setting value according to data_type
 * @param {string} val
 * @param {string} type
 */
function parseValue(val, type) {
  if (val === null || val === undefined) return null;
  switch (type) {
    case 'number':
      return Number(val);
    case 'boolean':
      return val === 'true' || val === '1';
    case 'json':
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    default:
      return val;
  }
}

/**
 * Get setting value by key
 * @param {string} key
 * @param {Object} [conn=pool]
 */
async function get(key, conn = pool) {
  const [rows] = await conn.query(
    'SELECT setting_value, data_type FROM platform_settings WHERE setting_key = ? LIMIT 1',
    [key]
  );
  if (rows.length === 0) return null;
  return parseValue(rows[0].setting_value, rows[0].data_type);
}

/**
 * Set or update setting value
 * @param {string} key
 * @param {*} value
 * @param {number|null} [updatedBy=null]
 * @param {Object} [conn=pool]
 */
async function set(key, value, updatedBy = null, conn = pool) {
  const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const [result] = await conn.query(
    `INSERT INTO platform_settings (setting_key, setting_value, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
    [key, strVal, updatedBy]
  );

  return result.affectedRows;
}

/**
 * Get all platform settings as key-value map
 * @param {Object} [conn=pool]
 */
async function getAll(conn = pool) {
  const [rows] = await conn.query(
    'SELECT setting_key, setting_value, data_type, description, updated_at FROM platform_settings ORDER BY setting_key ASC'
  );

  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = {
      value: parseValue(row.setting_value, row.data_type),
      description: row.description,
      dataType: row.data_type,
      updatedAt: row.updated_at
    };
  }

  return settings;
}

module.exports = {
  get,
  set,
  getAll
};
