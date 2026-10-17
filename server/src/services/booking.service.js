const bookingRepo = require('../repositories/booking.repository');
const serviceRepo = require('../repositories/service.repository');
const userRepo = require('../repositories/user.repository');
const notificationRepo = require('../repositories/notification.repository');
const AppError = require('../utils/apiError');
const { generateBookingNumber } = require('../utils/helpers');
const { BOOKING_STATUSES, VALID_TRANSITIONS, ROLES } = require('../utils/constants');
const { pool } = require('../config/database');

/**
 * Create a new service booking
 * @param {number} customerId
 * @param {Object} data
 */
async function create(customerId, data) {
  // Validate and resolve category (supports category_id, categoryId, or slug)
  const rawCatId = data.category_id || data.categoryId;
  if (!rawCatId || rawCatId === 'undefined' || rawCatId === 'null') {
    throw AppError.badRequest('Please select a valid service category');
  }

  let category = null;
  if (/^\d+$/.test(String(rawCatId))) {
    category = await serviceRepo.findById(parseInt(rawCatId, 10));
  } else {
    category = await serviceRepo.findBySlug(String(rawCatId));
  }

  if (!category || !category.is_active) {
    throw AppError.badRequest('Invalid or inactive service category selected');
  }

  const resolvedCategoryId = category.id;
  const bookingNumber = generateBookingNumber();

  const conn = await pool.getConnection();
  let bookingId;
  try {
    await conn.beginTransaction();

    bookingId = await bookingRepo.create({
      booking_number: bookingNumber,
      customer_id: customerId,
      category_id: resolvedCategoryId,
      address_id: data.address_id || null,
      title: data.title,
      description: data.description || null,
      is_emergency: data.is_emergency ? 1 : 0,
      urgency: data.urgency || (data.is_emergency ? 'emergency' : 'normal'),
      customer_latitude: data.customer_latitude || null,
      customer_longitude: data.customer_longitude || null,
      customer_address: data.customer_address || null,
      scheduled_at: data.scheduled_at || null,
      status: BOOKING_STATUSES.REQUESTED,
      notes: data.notes || null
    }, conn);

    // Initial audit status entry
    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: null,
      to_status: BOOKING_STATUSES.REQUESTED,
      changed_by: customerId,
      actor_role: ROLES.CUSTOMER,
      notes: 'Booking requested by customer'
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Trigger automated assignment (lazy require to avoid circular dependency)
  try {
    const assignmentService = require('./assignment.service');
    await assignmentService.assignNextTechnician(bookingId);
  } catch (assignErr) {
    console.error(`[Assignment Error] Failed to assign technician for booking ${bookingId}:`, assignErr.message);
  }

  return await bookingRepo.findById(bookingId);
}

/**
 * Get booking by ID with authorization verification
 * @param {number} id
 * @param {Object} currentUser
 */
async function getById(id, currentUser) {
  const booking = await bookingRepo.findById(id);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (currentUser.role === ROLES.ADMIN) {
    return booking;
  }

  if (currentUser.role === ROLES.CUSTOMER && booking.customer_id === currentUser.id) {
    return booking;
  }

  if (currentUser.role === ROLES.TECHNICIAN && booking.technician_id === currentUser.id) {
    return booking;
  }

  throw AppError.forbidden('You do not have permission to view this booking');
}

/**
 * Get bookings for the authenticated customer or technician
 * @param {Object} currentUser
 * @param {Object} options
 */
async function getMyBookings(currentUser, options = {}) {
  if (currentUser.role === ROLES.CUSTOMER) {
    return await bookingRepo.findByCustomerId(currentUser.id, options);
  } else if (currentUser.role === ROLES.TECHNICIAN) {
    return await bookingRepo.findByTechnicianId(currentUser.id, options);
  }
  return { bookings: [], total: 0 };
}

/**
 * Cancel a booking
 * @param {number} id
 * @param {Object} currentUser
 * @param {string} reason
 */
async function cancel(id, currentUser, reason = 'No reason provided') {
  const booking = await bookingRepo.findById(id);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  // Check authorization
  const isOwner = currentUser.role === ROLES.CUSTOMER && booking.customer_id === currentUser.id;
  const isAdmin = currentUser.role === ROLES.ADMIN;
  const isAssignedTech = currentUser.role === ROLES.TECHNICIAN && booking.technician_id === currentUser.id;

  if (!isOwner && !isAdmin && !isAssignedTech) {
    throw AppError.forbidden('You do not have permission to cancel this booking');
  }

  if ([BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.CANCELLED].includes(booking.status)) {
    throw AppError.badRequest(`Cannot cancel booking with current status: '${booking.status}'`);
  }

  const cancelledByRole = currentUser.role === ROLES.ADMIN
    ? 'admin'
    : currentUser.role === ROLES.CUSTOMER
    ? 'customer'
    : 'technician';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await bookingRepo.cancel(id, reason, cancelledByRole, conn);

    await bookingRepo.addStatusHistory({
      booking_id: id,
      from_status: booking.status,
      to_status: BOOKING_STATUSES.CANCELLED,
      changed_by: currentUser.id,
      actor_role: currentUser.role,
      notes: `Cancelled: ${reason}`
    }, conn);

    // Cancel any active assignments
    await conn.query(
      `UPDATE booking_assignments SET status = 'EXPIRED' WHERE booking_id = ? AND status = 'PENDING'`,
      [id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Send notification to customer/technician
  if (booking.technician_id && currentUser.id !== booking.technician_id) {
    await notificationRepo.create({
      user_id: booking.technician_id,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Booking #${booking.booking_number} was cancelled: ${reason}`,
      data: { bookingId: id }
    });
  }

  if (currentUser.id !== booking.customer_id) {
    await notificationRepo.create({
      user_id: booking.customer_id,
      type: 'BOOKING_CANCELLED',
      title: 'Booking Cancelled',
      message: `Booking #${booking.booking_number} was cancelled: ${reason}`,
      data: { bookingId: id }
    });
  }

  return await bookingRepo.findById(id);
}

/**
 * Update booking status with state machine transition checks
 * @param {number} id
 * @param {string} newStatus
 * @param {Object} currentUser
 * @param {string} [notes=null]
 * @param {Object} [extraFields={}]
 */
async function updateStatus(id, newStatus, currentUser, notes = null, extraFields = {}) {
  const booking = await bookingRepo.findById(id);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const currentStatus = booking.status;

  // Validate state machine transition
  const allowable = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowable.includes(newStatus)) {
    throw AppError.badRequest(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowable.join(', ')}]`
    );
  }

  // Role validation
  if (currentUser.role === ROLES.TECHNICIAN && booking.technician_id !== currentUser.id) {
    throw AppError.forbidden('You are not the assigned technician for this booking');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await bookingRepo.updateStatus(id, newStatus, extraFields, conn);

    await bookingRepo.addStatusHistory({
      booking_id: id,
      from_status: currentStatus,
      to_status: newStatus,
      changed_by: currentUser.id,
      actor_role: currentUser.role,
      notes: notes || `Status changed from ${currentStatus} to ${newStatus}`
    }, conn);

    // If completed, update technician completed_jobs count
    if (newStatus === BOOKING_STATUSES.COMPLETED && booking.technician_id) {
      await conn.query(
        `UPDATE technician_profiles 
         SET completed_jobs = completed_jobs + 1 
         WHERE user_id = ?`,
        [booking.technician_id]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Send status update notification to customer
  await notificationRepo.create({
    user_id: booking.customer_id,
    type: 'BOOKING_STATUS_CHANGED',
    title: `Booking Update: ${newStatus}`,
    message: `Your booking #${booking.booking_number} status is now ${newStatus.replace(/_/g, ' ')}.`,
    data: { bookingId: id, status: newStatus }
  });

  return await bookingRepo.findById(id);
}

/**
 * Manually assign a technician to a booking (Admin)
 * @param {number} bookingId
 * @param {number} technicianUserId
 * @param {number} adminId
 */
async function assignTechnician(bookingId, technicianUserId, adminId) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const tech = await userRepo.findById(technicianUserId);
  if (!tech || tech.role !== ROLES.TECHNICIAN) {
    throw AppError.badRequest('Selected user is not a valid technician');
  }

  const assignmentService = require('./assignment.service');
  return await assignmentService.createAssignment(bookingId, technicianUserId, 1);
}

/**
 * Get all bookings with filtering and pagination (Admin)
 * @param {Object} options
 */
async function getAll(options = {}) {
  return await bookingRepo.findAll(options);
}

/**
 * Get chronological timeline for a booking
 * @param {number} bookingId
 * @param {Object} currentUser
 */
async function getTimeline(bookingId, currentUser) {
  // Check authorization
  await getById(bookingId, currentUser);
  return await bookingRepo.getStatusHistory(bookingId);
}

module.exports = {
  create,
  getById,
  getMyBookings,
  cancel,
  updateStatus,
  assignTechnician,
  getAll,
  getTimeline
};
