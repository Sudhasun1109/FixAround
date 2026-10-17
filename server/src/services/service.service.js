const serviceRepo = require('../repositories/service.repository');
const AppError = require('../utils/apiError');
const { pool } = require('../config/database');

/**
 * Generate slug from name
 * @param {string} text
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Get all service categories
 * @param {Object} options
 */
async function getAll(options = {}) {
  return await serviceRepo.findAll(options);
}

/**
 * Get service category by ID or Slug
 * @param {number|string} identifier
 */
async function getById(identifier) {
  let category = null;
  if (/^\d+$/.test(String(identifier))) {
    category = await serviceRepo.findById(parseInt(identifier, 10));
  }
  if (!category) {
    category = await serviceRepo.findBySlug(String(identifier));
  }
  if (!category) {
    throw AppError.notFound('Service category not found');
  }
  return category;
}

/**
 * Create a new service category
 * @param {Object} data
 */
async function create(data) {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  const existing = await serviceRepo.findBySlug(slug);
  if (existing) {
    throw AppError.conflict('A service category with this slug or name already exists');
  }

  const categoryId = await serviceRepo.create({
    ...data,
    slug
  });

  return await serviceRepo.findById(categoryId);
}

/**
 * Update service category
 * @param {number} id
 * @param {Object} data
 */
async function update(id, data) {
  const category = await serviceRepo.findById(id);
  if (!category) {
    throw AppError.notFound('Service category not found');
  }

  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }

  if (data.slug) {
    const existingWithSlug = await serviceRepo.findBySlug(data.slug);
    if (existingWithSlug && existingWithSlug.id !== Number(id)) {
      throw AppError.conflict('A service category with this slug already exists');
    }
  }

  await serviceRepo.update(id, data);
  return await serviceRepo.findById(id);
}

/**
 * Update active status of service category
 * @param {number} id
 * @param {boolean} isActive
 */
async function updateStatus(id, isActive) {
  const category = await serviceRepo.findById(id);
  if (!category) {
    throw AppError.notFound('Service category not found');
  }

  await serviceRepo.updateStatus(id, isActive);
  return await serviceRepo.findById(id);
}

/**
 * Get service categories with booking & technician counts
 */
async function getWithStats() {
  const [rows] = await pool.query(
    `SELECT sc.*,
            COUNT(DISTINCT b.id) AS total_bookings,
            COUNT(DISTINCT CASE WHEN b.status = 'COMPLETED' THEN b.id END) AS completed_bookings,
            COUNT(DISTINCT ts.technician_id) AS total_technicians
     FROM service_categories sc
     LEFT JOIN bookings b ON b.category_id = sc.id
     LEFT JOIN technician_skills ts ON ts.category_id = sc.id
     GROUP BY sc.id
     ORDER BY sc.sort_order ASC, sc.name ASC`
  );
  return rows;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  getWithStats
};
