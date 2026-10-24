const technicianRepo = require('../repositories/technician.repository');
const userRepo = require('../repositories/user.repository');
const auditRepo = require('../repositories/audit.repository');
const notificationRepo = require('../repositories/notification.repository');
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
 * @param {string} status 'approved' | 'rejected' | 'suspended' | 'pending'
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

  // Update corresponding technician_documents statuses
  const docStatus = status === 'approved' ? 'APPROVED' : status === 'rejected' ? 'REJECTED' : 'PENDING';
  await pool.query(
    `UPDATE technician_documents 
     SET status = ?, reviewed_by = ?, reviewed_at = UTC_TIMESTAMP(), notes = COALESCE(?, notes)
     WHERE technician_id = ? AND (status = 'PENDING' OR ? = 'REJECTED')`,
    [docStatus, adminId, notes, profile.id, docStatus]
  );

  // Notify the technician of the outcome
  try {
    const isApproved = status === 'approved';
    await notificationRepo.create({
      user_id: profile.user_id,
      type: isApproved ? 'KYC_APPROVED' : 'KYC_REJECTED',
      title: isApproved ? 'KYC Verification Approved!' : 'KYC Verification Update',
      message: isApproved
        ? 'Congratulations! Your technician KYC verification has been approved. You are now active and eligible to receive dispatch requests.'
        : `Your KYC verification was marked as ${status}.${notes ? ` Note: ${notes}` : ' Please re-upload clear credentials.'}`,
      data: {
        technician_id: profile.id,
        status,
        notes
      }
    });
  } catch (notifErr) {
    console.error('Failed to notify technician about verification:', notifErr);
  }

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

/**
 * Get skills by technician profile or user ID
 * @param {number} techId
 */
async function getSkillsByTechnicianId(techId) {
  let profile = await technicianRepo.findById(techId);
  if (!profile) {
    profile = await technicianRepo.findByUserId(techId);
  }
  if (!profile) return [];
  return await technicianRepo.getSkills(profile.id);
}

/**
 * Upload verification document metadata
 * @param {number} userId
 * @param {Object} docData
 */
async function uploadDocument(userId, { document_type, document_name, file_url, file_path }) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }
  const [result] = await pool.query(
    `INSERT INTO technician_documents (technician_id, document_type, document_name, file_url, file_path, status)
     VALUES (?, ?, ?, ?, ?, 'PENDING')`,
    [profile.id, document_type || 'ID_PROOF', document_name, file_url || null, file_path || null]
  );

  // Set technician profile to 'pending' verification review
  await pool.query(
    `UPDATE technician_profiles SET verification_status = 'pending' WHERE id = ?`,
    [profile.id]
  );

  // Send notifications to all active Platform Admins so they see it immediately in their queue and bell
  try {
    const [admins] = await pool.query(`SELECT id FROM users WHERE role = 'admin' AND is_active = 1`);
    const techUser = await userRepo.findById(userId);
    const techName = techUser ? `${techUser.first_name || ''} ${techUser.last_name || ''}`.trim() : 'Technician';

    for (const admin of admins) {
      await notificationRepo.create({
        user_id: admin.id,
        type: 'KYC_SUBMITTED',
        title: 'New KYC Document Submitted',
        message: `${techName} uploaded ${document_name || document_type} for verification review.`,
        data: {
          technician_id: profile.id,
          user_id: userId,
          document_id: result.insertId,
          document_type,
          document_name,
          file_url
        }
      });
    }

    // Acknowledge submission to the technician
    await notificationRepo.create({
      user_id: userId,
      type: 'KYC_SUBMITTED',
      title: 'KYC Document Received',
      message: `Your ${document_name || document_type} has been submitted for admin compliance verification.`,
      data: {
        document_id: result.insertId,
        document_type,
        document_name
      }
    });
  } catch (err) {
    console.error('Failed to dispatch KYC notifications:', err);
  }

  return { id: result.insertId, document_type, document_name, file_url, status: 'PENDING' };
}

/**
 * Review an individual verification document (Admin only)
 * @param {number} documentId
 * @param {string} status 'APPROVED' | 'REJECTED'
 * @param {number} adminId
 * @param {string} [notes=null]
 */
async function reviewDocument(documentId, status, adminId, notes = null) {
  const [docRows] = await pool.query(`SELECT * FROM technician_documents WHERE id = ?`, [documentId]);
  if (!docRows.length) {
    throw AppError.notFound('Verification document not found');
  }
  const doc = docRows[0];
  const docStatus = status.toUpperCase();

  await pool.query(
    `UPDATE technician_documents
     SET status = ?, reviewed_by = ?, reviewed_at = UTC_TIMESTAMP(), notes = ?
     WHERE id = ?`,
    [docStatus, adminId, notes || null, documentId]
  );

  const profile = await technicianRepo.findById(doc.technician_id);
  if (profile) {
    const [allDocs] = await pool.query(
      `SELECT status FROM technician_documents WHERE technician_id = ?`,
      [profile.id]
    );

    let updatedProfileStatus = profile.verification_status;
    if (docStatus === 'REJECTED') {
      updatedProfileStatus = 'rejected';
      await technicianRepo.updateVerification(profile.id, 'rejected', adminId);
    } else if (allDocs.length > 0 && allDocs.every(d => d.status === 'APPROVED')) {
      updatedProfileStatus = 'approved';
      await technicianRepo.updateVerification(profile.id, 'approved', adminId);
    }

    // Notify technician
    try {
      await notificationRepo.create({
        user_id: profile.user_id,
        type: docStatus === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
        title: `KYC Document ${docStatus === 'APPROVED' ? 'Approved' : 'Rejected'}`,
        message: docStatus === 'APPROVED'
          ? `Your document "${doc.document_name}" has been approved by FixAround Administration.`
          : `Your document "${doc.document_name}" was rejected.${notes ? ` Reason: ${notes}` : ''}`,
        data: {
          document_id: documentId,
          technician_id: profile.id,
          status: docStatus,
          notes
        }
      });
    } catch (notifErr) {
      console.error('Failed to notify tech regarding document review:', notifErr);
    }
  }

  return { id: documentId, status: docStatus, notes };
}

/**
 * Get uploaded documents for technician
 * @param {number} userId
 */
async function getDocuments(userId) {
  const profile = await technicianRepo.findByUserId(userId);
  if (!profile) {
    throw AppError.notFound('Technician profile not found');
  }
  const [rows] = await pool.query(
    `SELECT * FROM technician_documents WHERE technician_id = ? ORDER BY created_at DESC`,
    [profile.id]
  );
  return rows;
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
  updateSkills,
  getSkillsByTechnicianId,
  uploadDocument,
  getDocuments,
  reviewDocument
};
