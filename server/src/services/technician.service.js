const technicianRepo = require('../repositories/technician.repository');
const userRepo = require('../repositories/user.repository');
const auditRepo = require('../repositories/audit.repository');
const AppError = require('../utils/apiError');
const { pool } = require('../config/database');

/**
 * Get technician profile by user ID with skills
 * @param {number} userId
 */
async function getProfile(userId) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }

  const skills = await technicianRepo.getSkills(profile.id);
  return {
    ...profile,
    skills
  };
}

/**
 * Get technician profile by profile ID
 * @param {number} profileId
 */
async function getById(profileId) {
  let profile = await technicianRepo.findById(profileId);
  if (!profile) {
    profile = await technicianRepo.findByUserId(profileId);
  }
  if (!profile) {
    throw AppError.notFound('Technician not found');
  }

  const skills = await technicianRepo.getSkills(profile.id);
  return {
    ...profile,
    skills
  };
}

/**
 * Update technician profile
 * @param {number} userId
 * @param {Object} data
 */
async function updateProfile(userId, data) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }

  await technicianRepo.updateByUserId(userId, data);
  return await getProfile(userId);
}

/**
 * Update availability and online status
 * @param {number} userId
 * @param {boolean} isAvailable
 * @param {boolean} [isOnline=null]
 */
async function setAvailability(userId, isAvailable, isOnline = null) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }

  await technicianRepo.updateAvailability(userId, isAvailable, isOnline);
  return await technicianRepo.findByUserId(userId);
}

/**
 * Find technicians near coordinates
 * @param {Object} params
 */
async function findNearby(params) {
  return await technicianRepo.findNearby(params);
}

/**
 * Verify or change status of technician (Admin only)
 * @param {number} technicianProfileId
 * @param {string} status 'approved' | 'rejected' | 'suspended'
 * @param {number} adminId
 * @param {string} [notes=null]
 */
async function verify(technicianProfileId, status, adminId, notes = null) {
  let profile = await technicianRepo.findById(technicianProfileId);
  if (!profile) {
    profile = await technicianRepo.findByUserId(technicianProfileId);
  }
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }

  await technicianRepo.updateVerification(profile.id, status, adminId);

  // Record audit log
  await auditRepo.create({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'VERIFY_TECHNICIAN',
    entity_type: 'technician_profile',
    entity_id: profile.id,
    details: { previousStatus: profile.verification_status, newStatus: status, notes }
  });

  return await technicianRepo.findById(profile.id);
}

/**
 * Get all technicians with pagination and filters (Admin)
 * @param {Object} options
 */
async function getAll(options = {}) {
  return await technicianRepo.findAll(options);
}

/**
 * Get technician stats
 * @param {number} userId
 */
async function getStats(userId) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }
  return await technicianRepo.getStats(userId);
}

/**
 * Update technician skills (categories)
 * @param {number} userId
 * @param {Array<{ categoryId: number, yearsExperience?: number }>} skillsList
 */
async function updateSkills(userId, skillsList) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Remove existing skills
    await conn.query('DELETE FROM technician_skills WHERE technician_id = ?', [profile.id]);

    // Insert new skills
    if (Array.isArray(skillsList) && skillsList.length > 0) {
      for (const item of skillsList) {
        const catId = typeof item === 'object'
          ? (item.categoryId || item.category_id || item.id)
          : item;
        const exp = typeof item === 'object'
          ? (item.yearsExperience ?? item.years_experience ?? 0)
          : 0;

        if (!catId) continue;

        await conn.query(
          'INSERT INTO technician_skills (technician_id, category_id, years_experience) VALUES (?, ?, ?)',
          [profile.id, catId, exp]
        );
      }
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return await technicianRepo.getSkills(profile.id);
}

module.exports = {
  getProfile,
  getById,
  updateProfile,
  setAvailability,
  findNearby,
  verify,
  getAll,
  getStats,
  updateSkills
};
