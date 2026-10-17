const { pool } = require('../config/database');

/**
 * Find technician profile by technician profile ID
 * @param {number} id
 * @param {Object} [conn=pool]
 */
async function findById(id, conn = pool) {
  const [rows] = await conn.query(
    `SELECT tp.*, 
            u.email, u.phone, u.first_name, u.last_name, u.avatar_url, u.is_active
     FROM technician_profiles tp
     JOIN users u ON u.id = tp.user_id
     WHERE tp.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Find technician profile by user ID
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function findByUserId(userId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT tp.*, 
            u.email, u.phone, u.first_name, u.last_name, u.avatar_url, u.is_active
     FROM technician_profiles tp
     JOIN users u ON u.id = tp.user_id
     WHERE tp.user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Update technician profile
 * @param {number} profileId
 * @param {Object} fields
 * @param {Object} [conn=pool]
 */
async function update(profileId, fields, conn = pool) {
  const allowed = [
    'bio', 'experience_years', 'verification_status', 'verified_at',
    'verified_by', 'is_available', 'is_online', 'latitude',
    'longitude', 'service_radius_km', 'service_city', 'service_pincode',
    'completed_jobs', 'avg_rating', 'review_count', 'total_earnings'
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

  values.push(profileId);
  const [result] = await conn.query(
    `UPDATE technician_profiles SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Update technician profile by user ID
 * @param {number} userId
 * @param {Object} fields
 * @param {Object} [conn=pool]
 */
async function updateByUserId(userId, fields, conn = pool) {
  const allowed = [
    'bio', 'experience_years', 'verification_status', 'verified_at',
    'verified_by', 'is_available', 'is_online', 'latitude',
    'longitude', 'service_radius_km', 'service_city', 'service_pincode',
    'completed_jobs', 'avg_rating', 'review_count', 'total_earnings'
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

  values.push(userId);
  const [result] = await conn.query(
    `UPDATE technician_profiles SET ${setClauses.join(', ')} WHERE user_id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Find technicians nearby using SQL Haversine formula
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} [params.radiusKm=10]
 * @param {number} [params.categoryId=null]
 * @param {boolean} [params.onlyAvailable=true]
 * @param {Object} [conn=pool]
 */
async function findNearby({ latitude, longitude, radiusKm = 10, categoryId = null, onlyAvailable = true }, conn = pool) {
  let query = `
    SELECT tp.*, 
           u.id AS user_id, u.first_name, u.last_name, u.avatar_url, u.phone,
           (6371 * ACOS(
             LEAST(1.0, GREATEST(-1.0, 
               COS(RADIANS(?)) * COS(RADIANS(tp.latitude)) * COS(RADIANS(tp.longitude) - RADIANS(?)) +
               SIN(RADIANS(?)) * SIN(RADIANS(tp.latitude))
             ))
           )) AS distance_km
    FROM technician_profiles tp
    JOIN users u ON u.id = tp.user_id
  `;

  const values = [latitude, longitude, latitude];

  if (categoryId) {
    query += ` JOIN technician_skills ts ON ts.technician_id = tp.id AND ts.category_id = ?`;
    values.push(categoryId);
  }

  query += ` WHERE u.is_active = 1 AND tp.verification_status = 'approved' AND tp.latitude IS NOT NULL AND tp.longitude IS NOT NULL`;

  if (onlyAvailable) {
    query += ` AND tp.is_available = 1`;
  }

  query += ` HAVING distance_km <= ? ORDER BY distance_km ASC`;
  values.push(radiusKm);

  const [rows] = await conn.query(query, values);
  return rows;
}

/**
 * Find eligible technicians for automated booking assignment
 * @param {Object} options
 * @param {number} options.categoryId
 * @param {number|null} [options.latitude=null]
 * @param {number|null} [options.longitude=null]
 * @param {number} [options.maxRadiusKm=25]
 * @param {Array<number>} [options.excludeTechnicianUserIds=[]]
 * @param {Object} [conn=pool]
 */
async function findEligibleForBooking({
  categoryId,
  latitude = null,
  longitude = null,
  maxRadiusKm = 25,
  excludeTechnicianUserIds = []
}, conn = pool) {
  const values = [];
  let selectClause = `
    SELECT tp.*, u.id AS technician_user_id, u.first_name, u.last_name, u.phone, u.email
  `;

  if (latitude !== null && longitude !== null) {
    selectClause += `,
      (6371 * ACOS(
        LEAST(1.0, GREATEST(-1.0, 
          COS(RADIANS(?)) * COS(RADIANS(tp.latitude)) * COS(RADIANS(tp.longitude) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(tp.latitude))
        ))
      )) AS distance_km
    `;
    values.push(latitude, longitude, latitude);
  } else {
    selectClause += `, 0 AS distance_km`;
  }

  let fromClause = `
    FROM technician_profiles tp
    JOIN users u ON u.id = tp.user_id
    JOIN technician_skills ts ON ts.technician_id = tp.id AND ts.category_id = ?
  `;
  values.push(categoryId);

  let whereClause = `
    WHERE u.is_active = 1 
      AND tp.verification_status = 'approved' 
      AND tp.is_available = 1
  `;

  if (excludeTechnicianUserIds && excludeTechnicianUserIds.length > 0) {
    whereClause += ` AND u.id NOT IN (${excludeTechnicianUserIds.map(() => '?').join(', ')})`;
    values.push(...excludeTechnicianUserIds);
  }

  let orderClause = '';
  if (latitude !== null && longitude !== null) {
    whereClause += ` AND tp.latitude IS NOT NULL AND tp.longitude IS NOT NULL`;
    orderClause = ` HAVING distance_km <= ? ORDER BY distance_km ASC, tp.avg_rating DESC, tp.completed_jobs DESC`;
    values.push(maxRadiusKm);
  } else {
    orderClause = ` ORDER BY tp.avg_rating DESC, tp.completed_jobs DESC`;
  }

  const fullQuery = `${selectClause} ${fromClause} ${whereClause} ${orderClause}`;
  const [rows] = await conn.query(fullQuery, values);
  return rows;
}

/**
 * Update availability of technician
 * @param {number} userId
 * @param {boolean} isAvailable
 * @param {boolean} [isOnline=null]
 * @param {Object} [conn=pool]
 */
async function updateAvailability(userId, isAvailable, isOnline = null, conn = pool) {
  const fields = ['is_available = ?'];
  const values = [isAvailable ? 1 : 0];

  if (isOnline !== null) {
    fields.push('is_online = ?');
    values.push(isOnline ? 1 : 0);
  }

  values.push(userId);
  const [result] = await conn.query(
    `UPDATE technician_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );

  return result.affectedRows;
}

/**
 * Update verification status of technician
 * @param {number} technicianProfileId
 * @param {string} status 'pending' | 'approved' | 'rejected' | 'suspended'
 * @param {number} verifiedBy Admin user ID
 * @param {Object} [conn=pool]
 */
async function updateVerification(technicianProfileId, status, verifiedBy, conn = pool) {
  const [result] = await conn.query(
    `UPDATE technician_profiles 
     SET verification_status = ?, 
         verified_by = ?, 
         verified_at = IF(? = 'approved', UTC_TIMESTAMP(), verified_at)
     WHERE id = ?`,
    [status, verifiedBy, status, technicianProfileId]
  );
  return result.affectedRows;
}

/**
 * Get skills (service categories) for technician
 * @param {number} technicianProfileId
 * @param {Object} [conn=pool]
 */
async function getSkills(technicianProfileId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT ts.id, ts.category_id, ts.years_experience, ts.created_at,
            sc.name AS category_name, sc.slug AS category_slug, sc.icon
     FROM technician_skills ts
     JOIN service_categories sc ON sc.id = ts.category_id
     WHERE ts.technician_id = ?
     ORDER BY sc.name ASC`,
    [technicianProfileId]
  );
  return rows;
}

/**
 * Add a skill to technician
 * @param {number} technicianProfileId
 * @param {number} categoryId
 * @param {number} [yearsExperience=0]
 * @param {Object} [conn=pool]
 */
async function addSkill(technicianProfileId, categoryId, yearsExperience = 0, conn = pool) {
  const [result] = await conn.query(
    `INSERT INTO technician_skills (technician_id, category_id, years_experience)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE years_experience = VALUES(years_experience)`,
    [technicianProfileId, categoryId, yearsExperience]
  );
  return result.insertId;
}

/**
 * Remove a skill from technician
 * @param {number} technicianProfileId
 * @param {number} categoryId
 * @param {Object} [conn=pool]
 */
async function removeSkill(technicianProfileId, categoryId, conn = pool) {
  const [result] = await conn.query(
    `DELETE FROM technician_skills WHERE technician_id = ? AND category_id = ?`,
    [technicianProfileId, categoryId]
  );
  return result.affectedRows;
}

/**
 * Get technician performance statistics
 * @param {number} userId
 * @param {Object} [conn=pool]
 */
async function getStats(userId, conn = pool) {
  const [profileRows] = await conn.query(
    `SELECT tp.completed_jobs, tp.avg_rating, tp.review_count, tp.total_earnings,
            tp.is_available, tp.is_online, tp.verification_status
     FROM technician_profiles tp
     WHERE tp.user_id = ? LIMIT 1`,
    [userId]
  );

  const [bookingStats] = await conn.query(
    `SELECT 
       COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS total_completed,
       COUNT(CASE WHEN status IN ('REQUESTED','ASSIGNED','ACCEPTED','ON_THE_WAY','ARRIVED','IN_PROGRESS','AWAITING_APPROVAL') THEN 1 END) AS active_bookings,
       COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_bookings
     FROM bookings 
     WHERE technician_id = ?`,
    [userId]
  );

  return {
    profile: profileRows[0] || null,
    bookings: bookingStats[0] || { total_completed: 0, active_bookings: 0, cancelled_bookings: 0 }
  };
}

/**
 * Find all technicians with pagination and filters (admin view)
 * @param {Object} options
 * @param {Object} [conn=pool]
 */
async function findAll({ page = 1, limit = 20, status = null, city = null, search = null } = {}, conn = pool) {
  const conditions = [];
  const values = [];

  if (status) {
    conditions.push('tp.verification_status = ?');
    values.push(status);
  }

  if (city) {
    conditions.push('tp.service_city LIKE ?');
    values.push(`%${city}%`);
  }

  if (search) {
    conditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    const searchTerm = `%${search}%`;
    values.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM technician_profiles tp
    JOIN users u ON u.id = tp.user_id
    ${whereClause}
  `;
  const [countRows] = await conn.query(countQuery, values);
  const total = countRows[0].total;

  const selectQuery = `
    SELECT tp.*, 
           u.email, u.phone, u.first_name, u.last_name, u.avatar_url, u.is_active, u.created_at AS user_created_at
    FROM technician_profiles tp
    JOIN users u ON u.id = tp.user_id
    ${whereClause}
    ORDER BY tp.id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await conn.query(selectQuery, [...values, Number(limit), Number(offset)]);

  return { technicians: rows, total };
}

module.exports = {
  findById,
  findByUserId,
  update,
  updateByUserId,
  findNearby,
  findEligibleForBooking,
  updateAvailability,
  updateVerification,
  getSkills,
  addSkill,
  removeSkill,
  getStats,
  findAll
};
