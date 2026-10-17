const { pool } = require('../config/database');

/**
 * Find all service categories with optional filter for active-only
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({ activeOnly = false } = {}, conn = pool) {
  let query = 'SELECT * FROM service_categories';
  const params = [];

  if (activeOnly) {
    query += ' WHERE is_active = 1';
  }

  query += ' ORDER BY sort_order ASC, name ASC';

  const [rows] = await conn.query(query, params);
  return rows;
}

/**
 * Find service category by ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    'SELECT * FROM service_categories WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Find service category by URL slug
 * @param {string} slug
 * @param {Object} [conn=pool]
 */
async function findBySlug(slug, conn = pool) {
  const [rows] = await conn.query(
    'SELECT * FROM service_categories WHERE slug = ? LIMIT 1',
    [slug]
  );
  return rows[0] || null;
}

/**
 * Create a new service category
 * @param {Object} data
 * @param {Object} [conn=pool]
 */
async function create(data, conn = pool) {
  const {
    name,
    slug,
    description = null,
    icon = 'Wrench',
    image_url = null,
    min_price = 0.00,
    max_price = 0.00,
    inspection_charge = 0.00,
    warranty_period_days = 7,
    is_active = 1,
    sort_order = 0
  } = data;

  const [result] = await conn.query(
    `INSERT INTO service_categories 
     (name, slug, description, icon, image_url, min_price, max_price, inspection_charge, warranty_period_days, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      slug,
      description,
      icon,
      image_url,
      min_price,
      max_price,
      inspection_charge,
      warranty_period_days,
      is_active ? 1 : 0,
      sort_order
    ]
  );

  return result.insertId;
}

/**
 * Update service category
 * @param {number} id
 * @param {Object} fields
 * @param {Object} [conn=pool]
 */
async function update(id, fields, conn = pool) {
  const allowed = [
    'name', 'slug', 'description', 'icon', 'image_url',
    'min_price', 'max_price', 'inspection_charge',
    'warranty_period_days', 'is_active', 'sort_order'
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
    `UPDATE service_categories SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Update active status of service category
 * @param {number} id
 * @param {boolean} isActive
 * @param {Object} [conn=pool]
 */
async function updateStatus(id, isActive, conn = pool) {
  const [result] = await conn.query(
    'UPDATE service_categories SET is_active = ? WHERE id = ?',
    [isActive ? 1 : 0, id]
  );
  return result.affectedRows;
}

/**
 * Count service categories
 * @param {Object} conditions
 * @param {Object} [conn=pool]
 */
async function count(conditions = {}, conn = pool) {
  const whereClauses = [];
  const values = [];

  if (conditions.is_active !== undefined) {
    whereClauses.push('is_active = ?');
    values.push(conditions.is_active ? 1 : 0);
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total FROM service_categories ${whereStr}`,
    values
  );
  return rows[0].total;
}

module.exports = {
  findAll,
  findById,
  findBySlug,
  create,
  update,
  updateStatus,
  count
};
