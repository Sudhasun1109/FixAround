const { pool } = require('../config/database');
const config = require('../config/env');
const AppError = require('../utils/apiError');
const assignmentRepo = require('../repositories/assignment.repository');
const bookingRepo = require('../repositories/booking.repository');
const technicianRepo = require('../repositories/technician.repository');
const notificationRepo = require('../repositories/notification.repository');
const settingsRepo = require('../repositories/settings.repository');
const { BOOKING_STATUSES, ASSIGNMENT_STATUSES, ROLES } = require('../utils/constants');

/**
 * Assign next eligible technician to a booking
 * @param {number} bookingId
 */
async function assignNextTechnician(bookingId) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  // Allowed statuses to receive new assignment
  const eligibleStatuses = [
    BOOKING_STATUSES.REQUESTED,
    BOOKING_STATUSES.ASSIGNED,
    BOOKING_STATUSES.REJECTED,
    BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE
  ];

  if (!eligibleStatuses.includes(booking.status)) {
    return null;
  }

  // Fetch timeout and max attempts from platform settings or env
  const maxAttempts = (await settingsRepo.get('technician_max_assignment_attempts')) || config.platform.maxAssignmentAttempts;
  const timeoutSeconds = (await settingsRepo.get('technician_response_timeout_seconds')) || config.platform.technicianResponseTimeoutSeconds;

  // Check attempt count
  const attemptsCount = await assignmentRepo.countByBooking(bookingId);
  if (attemptsCount >= maxAttempts) {
    // Mark as NO_TECHNICIAN_AVAILABLE
    await bookingRepo.updateStatus(bookingId, BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE);
    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE,
      actor_role: 'system',
      notes: `Maximum assignment attempts (${maxAttempts}) reached with no acceptance.`
    });

    await notificationRepo.create({
      user_id: booking.customer_id,
      type: 'BOOKING_NO_TECHNICIAN',
      title: 'No Technicians Available',
      message: `We were unable to find an available technician for your booking #${booking.booking_number}. You can try again later or cancel.`,
      data: { bookingId }
    });
    return null;
  }

  // Get list of technician user IDs to exclude
  const excludedIds = await assignmentRepo.getRejectedTechnicianIds(bookingId);

  // Search eligible technicians
  let eligibleTechs = await technicianRepo.findEligibleForBooking({
    categoryId: booking.category_id,
    latitude: booking.customer_latitude ? Number(booking.customer_latitude) : null,
    longitude: booking.customer_longitude ? Number(booking.customer_longitude) : null,
    maxRadiusKm: config.platform.defaultSearchRadiusKm,
    excludeTechnicianUserIds: excludedIds
  });

  // If no technicians within strict local radius, fallback to any available approved technician
  // with this skill (essential for development & testing outside seed city)
  if (!eligibleTechs || eligibleTechs.length === 0) {
    eligibleTechs = await technicianRepo.findEligibleForBooking({
      categoryId: booking.category_id,
      latitude: null,
      longitude: null,
      excludeTechnicianUserIds: excludedIds
    });
  }

  if (!eligibleTechs || eligibleTechs.length === 0) {
    // No technician eligible
    await bookingRepo.updateStatus(bookingId, BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE);
    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: BOOKING_STATUSES.NO_TECHNICIAN_AVAILABLE,
      actor_role: 'system',
      notes: 'No eligible technicians found nearby.'
    });

    await notificationRepo.create({
      user_id: booking.customer_id,
      type: 'BOOKING_NO_TECHNICIAN',
      title: 'No Technicians Available',
      message: `No technicians are currently available in your area for booking #${booking.booking_number}.`,
      data: { bookingId }
    });
    return null;
  }

  const selectedTech = eligibleTechs[0];
  const nextAttemptNum = attemptsCount + 1;

  // Calculate deadline UTC
  const deadline = new Date(Date.now() + timeoutSeconds * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  const conn = await pool.getConnection();
  let assignmentId;
  try {
    await conn.beginTransaction();

    assignmentId = await assignmentRepo.create({
      booking_id: bookingId,
      technician_id: selectedTech.technician_user_id,
      attempt_number: nextAttemptNum,
      status: ASSIGNMENT_STATUSES.PENDING,
      deadline
    }, conn);

    await bookingRepo.updateTechnician(bookingId, selectedTech.technician_user_id, BOOKING_STATUSES.ASSIGNED, conn);

    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: BOOKING_STATUSES.ASSIGNED,
      actor_role: 'system',
      notes: `Offered to technician ${selectedTech.first_name} ${selectedTech.last_name} (Attempt #${nextAttemptNum})`
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Send assignment alert notification to technician
  await notificationRepo.create({
    user_id: selectedTech.technician_user_id,
    type: 'NEW_BOOKING_ASSIGNMENT',
    title: booking.is_emergency ? '🚨 Emergency Service Offer' : 'New Service Offer',
    message: `You have received a new service request: "${booking.title}". Please respond within ${Math.round(timeoutSeconds / 60)} minutes.`,
    data: {
      bookingId,
      assignmentId,
      deadline
    }
  });

  return { assignmentId, technicianId: selectedTech.technician_user_id, deadline };
}

/**
 * Handle technician acceptance of booking
 * @param {number} bookingId
 * @param {number} technicianUserId
 */
async function handleAcceptance(bookingId, technicianUserId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock pending assignment for update to avoid race conditions
    const [assignments] = await conn.query(
      `SELECT * FROM booking_assignments 
       WHERE booking_id = ? AND technician_id = ? AND status = 'PENDING' 
       FOR UPDATE`,
      [bookingId, technicianUserId]
    );

    if (assignments.length === 0) {
      throw AppError.badRequest('No pending assignment found for you on this booking');
    }

    const assignment = assignments[0];

    // Check if deadline passed
    const now = new Date();
    const deadlineDate = new Date(assignment.deadline);
    if (now > deadlineDate) {
      await conn.query(
        `UPDATE booking_assignments SET status = 'EXPIRED' WHERE id = ?`,
        [assignment.id]
      );
      await conn.commit();
      throw AppError.badRequest('The response deadline for this assignment has expired');
    }

    // Lock booking for update
    const [bookingRows] = await conn.query(
      `SELECT * FROM bookings WHERE id = ? FOR UPDATE`,
      [bookingId]
    );
    const booking = bookingRows[0];

    if (booking.status !== BOOKING_STATUSES.ASSIGNED && booking.status !== BOOKING_STATUSES.REQUESTED) {
      throw AppError.badRequest(`Booking is no longer in assignable state (current: ${booking.status})`);
    }

    // Mark assignment accepted
    await conn.query(
      `UPDATE booking_assignments 
       SET status = 'ACCEPTED', responded_at = UTC_TIMESTAMP() 
       WHERE id = ?`,
      [assignment.id]
    );

    // Update booking to ACCEPTED
    await conn.query(
      `UPDATE bookings 
       SET status = 'ACCEPTED', accepted_at = UTC_TIMESTAMP(), technician_id = ? 
       WHERE id = ?`,
      [technicianUserId, bookingId]
    );

    // Audit status transition
    await conn.query(
      `INSERT INTO booking_status_history 
       (booking_id, from_status, to_status, changed_by, actor_role, notes)
       VALUES (?, ?, 'ACCEPTED', ?, 'technician', 'Technician accepted assignment')`,
      [bookingId, booking.status, technicianUserId]
    );

    await conn.commit();

    // Notify customer
    await notificationRepo.create({
      user_id: booking.customer_id,
      type: 'BOOKING_ACCEPTED',
      title: 'Technician Assigned!',
      message: `A technician has accepted your booking #${booking.booking_number} and will arrive shortly.`,
      data: { bookingId }
    });

    return await bookingRepo.findById(bookingId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Handle technician rejection of booking
 * @param {number} bookingId
 * @param {number} technicianUserId
 * @param {string} [reason='Technician declined']
 */
async function handleRejection(bookingId, technicianUserId, reason = 'Technician declined') {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [assignments] = await conn.query(
      `SELECT * FROM booking_assignments 
       WHERE booking_id = ? AND technician_id = ? AND status = 'PENDING' 
       FOR UPDATE`,
      [bookingId, technicianUserId]
    );

    if (assignments.length === 0) {
      throw AppError.badRequest('No pending assignment found for you on this booking');
    }

    const assignment = assignments[0];

    await conn.query(
      `UPDATE booking_assignments 
       SET status = 'REJECTED', responded_at = UTC_TIMESTAMP(), rejection_reason = ? 
       WHERE id = ?`,
      [reason, assignment.id]
    );

    await conn.query(
      `UPDATE bookings SET status = 'REJECTED' WHERE id = ?`,
      [bookingId]
    );

    await conn.query(
      `INSERT INTO booking_status_history 
       (booking_id, from_status, to_status, changed_by, actor_role, notes)
       VALUES (?, 'ASSIGNED', 'REJECTED', ?, 'technician', ?)`,
      [bookingId, technicianUserId, `Technician rejected: ${reason}`]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Trigger next assignment automatically
  return await assignNextTechnician(bookingId);
}

/**
 * Process expired assignments (called periodically by cron job)
 */
async function processExpiredAssignments() {
  const conn = await pool.getConnection();
  let expiredList = [];
  try {
    await conn.beginTransaction();

    // Query pending assignments whose deadline has passed
    const [rows] = await conn.query(
      `SELECT ba.id, ba.booking_id, ba.technician_id, b.status AS booking_status
       FROM booking_assignments ba
       JOIN bookings b ON b.id = ba.booking_id
       WHERE ba.status = 'PENDING' AND ba.deadline < UTC_TIMESTAMP()
       FOR UPDATE`
    );

    expiredList = rows;

    for (const item of expiredList) {
      await conn.query(
        `UPDATE booking_assignments 
         SET status = 'EXPIRED', responded_at = UTC_TIMESTAMP(), rejection_reason = 'Response deadline expired'
         WHERE id = ?`,
        [item.id]
      );

      await conn.query(
        `INSERT INTO booking_status_history 
         (booking_id, from_status, to_status, actor_role, notes)
         VALUES (?, ?, 'EXPIRED', 'system', 'Assignment response deadline expired')`,
        [item.booking_id, item.booking_status]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('[Assignment Cron] Error processing expired assignments:', err.message);
    throw err;
  } finally {
    conn.release();
  }

  // Cascade to assign next technician for each expired booking
  for (const item of expiredList) {
    try {
      await assignNextTechnician(item.booking_id);
    } catch (assignErr) {
      console.error(`[Assignment Cron] Error reassigning booking ${item.booking_id}:`, assignErr.message);
    }
  }

  return expiredList.length;
}

/**
 * Get all assignment attempts for a booking
 * @param {number} bookingId
 */
async function getAssignmentHistory(bookingId) {
  return await assignmentRepo.findByBookingId(bookingId);
}

module.exports = {
  assignNextTechnician,
  handleAcceptance,
  handleRejection,
  processExpiredAssignments,
  getAssignmentHistory
};
