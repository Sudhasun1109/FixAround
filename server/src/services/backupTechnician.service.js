const { pool } = require('../config/database');
const bookingRepo = require('../repositories/booking.repository');
const technicianRepo = require('../repositories/technician.repository');
const notificationRepo = require('../repositories/notification.repository');
const AppError = require('../utils/apiError');
const { BOOKING_STATUSES, ROLES } = require('../utils/constants');

const ALLOWED_REASONS = [
  'VEHICLE_BREAKDOWN',
  'DELAYED_AT_PREVIOUS_JOB',
  'PERSONAL_EMERGENCY',
  'TOOL_EQUIPMENT_FAILURE',
  'DISTANCE_OR_TRAFFIC',
  'OTHER'
];

/**
 * Request a backup technician when original technician cannot reach location
 * @param {number} bookingId
 * @param {number} technicianUserId
 * @param {Object} data
 * @param {string} data.reason
 * @param {string} [data.explanation]
 */
async function requestBackup(bookingId, technicianUserId, data) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.technician_id !== technicianUserId) {
    throw AppError.forbidden('Only the currently assigned technician can request a backup');
  }

  const activeStatuses = [
    BOOKING_STATUSES.ACCEPTED,
    BOOKING_STATUSES.ON_THE_WAY,
    BOOKING_STATUSES.ARRIVED,
    BOOKING_STATUSES.IN_PROGRESS,
    BOOKING_STATUSES.AWAITING_APPROVAL
  ];

  if (!activeStatuses.includes(booking.status)) {
    throw AppError.badRequest(`Cannot request backup for booking with status '${booking.status}'`);
  }

  if (!ALLOWED_REASONS.includes(data.reason)) {
    throw AppError.badRequest(`Invalid reason. Must be one of: ${ALLOWED_REASONS.join(', ')}`);
  }

  // Check if active pending request already exists
  const [existing] = await pool.query(
    `SELECT * FROM backup_technician_requests 
     WHERE booking_id = ? AND status = 'PENDING' AND expires_at > UTC_TIMESTAMP() 
     LIMIT 1`,
    [bookingId]
  );

  if (existing.length > 0) {
    return existing[0];
  }

  // 15-minute expiration
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  const [res] = await pool.query(
    `INSERT INTO backup_technician_requests 
     (booking_id, original_technician_id, reason, explanation, status, expires_at)
     VALUES (?, ?, ?, ?, 'PENDING', ?)`,
    [bookingId, technicianUserId, data.reason, data.explanation || null, expiresAt]
  );

  const requestId = res.insertId;

  // Add status history entry
  await bookingRepo.addStatusHistory({
    booking_id: bookingId,
    from_status: booking.status,
    to_status: booking.status,
    changed_by: technicianUserId,
    actor_role: ROLES.TECHNICIAN,
    notes: `Backup technician requested. Reason: ${data.reason.replace(/_/g, ' ')}. ${data.explanation ? 'Details: ' + data.explanation : ''}`
  });

  // Notify customer
  await notificationRepo.create({
    user_id: booking.customer_id,
    type: 'BACKUP_TECHNICIAN_REQUESTED',
    title: 'Backup Technician Dispatched',
    message: `Your technician experienced an unexpected delay (${data.reason.replace(/_/g, ' ')}). A qualified backup technician in your area has been alerted to take over your booking.`,
    data: { bookingId, requestId }
  });

  // Find eligible nearby technicians and notify them
  try {
    const eligibleTechs = await technicianRepo.findEligibleForBooking({
      categoryId: booking.category_id,
      latitude: booking.customer_latitude ? Number(booking.customer_latitude) : null,
      longitude: booking.customer_longitude ? Number(booking.customer_longitude) : null,
      excludeTechnicianUserIds: [technicianUserId]
    });

    for (const tech of eligibleTechs) {
      await notificationRepo.create({
        user_id: tech.technician_user_id,
        type: 'BACKUP_REQUEST_AVAILABLE',
        title: 'Urgent: Backup Technician Needed',
        message: `A backup technician is needed for booking #${booking.booking_number} (${booking.title}) in your area.`,
        data: { bookingId, requestId, categoryId: booking.category_id }
      });
    }
  } catch (notifyErr) {
    console.error('[BackupTechnician] Error notifying nearby techs:', notifyErr.message);
  }

  return {
    id: requestId,
    booking_id: bookingId,
    original_technician_id: technicianUserId,
    reason: data.reason,
    explanation: data.explanation || null,
    status: 'PENDING',
    expires_at: expiresAt
  };
}

/**
 * Get active incoming backup requests for a technician
 * @param {number} technicianUserId
 */
async function getIncomingBackupRequests(technicianUserId) {
  // Get technician skills / categories
  const [skills] = await pool.query(
    `SELECT ts.category_id 
     FROM technician_skills ts
     JOIN technician_profiles tp ON tp.id = ts.technician_id
     WHERE tp.user_id = ?`,
    [technicianUserId]
  );

  const categoryIds = skills.map(s => s.category_id);
  if (categoryIds.length === 0) {
    return [];
  }

  const [requests] = await pool.query(
    `SELECT btr.*,
            b.booking_number, b.title as booking_title, b.description as booking_description,
            b.status as booking_status, b.customer_address, b.customer_latitude, b.customer_longitude,
            sc.name as category_name, sc.slug as category_slug,
            c.first_name as customer_first_name, c.last_name as customer_last_name,
            orig.first_name as original_tech_first_name, orig.last_name as original_tech_last_name
     FROM backup_technician_requests btr
     JOIN bookings b ON b.id = btr.booking_id
     JOIN service_categories sc ON sc.id = b.category_id
     JOIN users c ON c.id = b.customer_id
     JOIN users orig ON orig.id = btr.original_technician_id
     WHERE btr.status = 'PENDING'
       AND btr.expires_at > UTC_TIMESTAMP()
       AND btr.original_technician_id != ?
       AND b.category_id IN (${categoryIds.map(() => '?').join(', ')})
     ORDER BY btr.created_at DESC`,
    [technicianUserId, ...categoryIds]
  );

  return requests;
}

/**
 * Concurrency-safe acceptance of backup request
 * @param {number} requestId
 * @param {number} backupTechnicianUserId
 */
async function acceptBackupRequest(requestId, backupTechnicianUserId) {
  const conn = await pool.getConnection();
  let bookingId;
  let originalTechId;
  let bookingNumber;
  let customerId;

  try {
    await conn.beginTransaction();

    // 1. Lock backup request FOR UPDATE
    const [reqRows] = await conn.query(
      'SELECT * FROM backup_technician_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );

    if (reqRows.length === 0) {
      throw AppError.notFound('Backup request not found');
    }

    const backupReq = reqRows[0];
    if (backupReq.status !== 'PENDING') {
      throw AppError.badRequest('This backup request has already been accepted or is no longer available');
    }

    if (new Date(backupReq.expires_at) < new Date()) {
      throw AppError.badRequest('This backup request has expired');
    }

    if (backupReq.original_technician_id === backupTechnicianUserId) {
      throw AppError.badRequest('Original technician cannot accept their own backup request');
    }

    bookingId = backupReq.booking_id;
    originalTechId = backupReq.original_technician_id;

    // 2. Lock booking FOR UPDATE
    const [bRows] = await conn.query(
      'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
      [bookingId]
    );
    if (bRows.length === 0) {
      throw AppError.notFound('Associated booking not found');
    }
    const booking = bRows[0];
    bookingNumber = booking.booking_number;
    customerId = booking.customer_id;

    // 3. Update backup request
    await conn.query(
      `UPDATE backup_technician_requests 
       SET status = 'ACCEPTED', accepted_technician_id = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [backupTechnicianUserId, requestId]
    );

    // 4. Update booking technician_id to backup technician
    await conn.query(
      `UPDATE bookings 
       SET technician_id = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [backupTechnicianUserId, bookingId]
    );

    // 5. Transfer existing price estimates to new technician
    await conn.query(
      `UPDATE price_estimates 
       SET technician_id = ? 
       WHERE booking_id = ?`,
      [backupTechnicianUserId, bookingId]
    );

    // 6. Record status history
    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: booking.status,
      changed_by: backupTechnicianUserId,
      actor_role: ROLES.TECHNICIAN,
      notes: `Backup technician accepted assignment. Job transferred from technician #${originalTechId} to #${backupTechnicianUserId}.`
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Fetch updated backup technician details for notification
  const [techUser] = await pool.query(
    'SELECT first_name, last_name, phone FROM users WHERE id = ?',
    [backupTechnicianUserId]
  );
  const techName = techUser[0] ? `${techUser[0].first_name} ${techUser[0].last_name}` : 'Backup Technician';

  // Notifications
  await notificationRepo.create({
    user_id: customerId,
    type: 'BACKUP_TECHNICIAN_ASSIGNED',
    title: 'New Technician Assigned',
    message: `${techName} has accepted your service request #${bookingNumber} and is now assigned to your job.`,
    data: { bookingId, technicianId: backupTechnicianUserId }
  });

  await notificationRepo.create({
    user_id: originalTechId,
    type: 'BACKUP_ACCEPTED',
    title: 'Backup Technician Confirmed',
    message: `${techName} has taken over booking #${bookingNumber}. You are relieved of this assignment.`,
    data: { bookingId, acceptedBy: backupTechnicianUserId }
  });

  await notificationRepo.create({
    user_id: backupTechnicianUserId,
    type: 'BACKUP_TAKEOVER_SUCCESS',
    title: 'Booking Assigned',
    message: `You have successfully taken over booking #${bookingNumber}. You can now contact the customer and proceed with service.`,
    data: { bookingId }
  });

  return await bookingRepo.findById(bookingId);
}

/**
 * Get backup request status for a booking
 * @param {number} bookingId
 */
async function getBackupStatusForBooking(bookingId) {
  const [rows] = await pool.query(
    `SELECT btr.*,
            orig.first_name as original_tech_first_name, orig.last_name as original_tech_last_name,
            acc.first_name as accepted_tech_first_name, acc.last_name as accepted_tech_last_name
     FROM backup_technician_requests btr
     JOIN users orig ON orig.id = btr.original_technician_id
     LEFT JOIN users acc ON acc.id = btr.accepted_technician_id
     WHERE btr.booking_id = ?
     ORDER BY btr.created_at DESC LIMIT 1`,
    [bookingId]
  );
  return rows[0] || null;
}

module.exports = {
  ALLOWED_REASONS,
  requestBackup,
  getIncomingBackupRequests,
  acceptBackupRequest,
  getBackupStatusForBooking
};
