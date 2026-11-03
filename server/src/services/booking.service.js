const pinHelper = require('../utils/pin.helper');
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
      technician_id: data.technician_id || null,
    scheduled_at: (data.scheduled_at ? new Date(data.scheduled_at).toISOString().slice(0, 19).replace('T', ' ') : null),
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

  // Support both user_id and technician_profiles.id
  let targetUserId = parseInt(technicianUserId, 10);
  let tech = await userRepo.findById(targetUserId);

  if (!tech || tech.role !== ROLES.TECHNICIAN) {
    // Check if the passed ID was actually a technician_profiles.id
    const technicianRepo = require('../repositories/technician.repository');
    const profile = await technicianRepo.findById(targetUserId);
    if (profile && profile.user_id) {
      targetUserId = profile.user_id;
      tech = await userRepo.findById(targetUserId);
    }
  }

  if (!tech || tech.role !== ROLES.TECHNICIAN) {
    throw AppError.badRequest('Selected user is not a valid technician');
  }

  const assignmentService = require('./assignment.service');
  return await assignmentService.createAssignment(bookingId, targetUserId, 1);
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


/**
 * Generate 4-digit completion PIN (Technician only)
 * Sets status to AWAITING_CUSTOMER_VERIFICATION
 */
async function generatePin(bookingId, currentUser) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  // Authorization: must be assigned technician or admin
  if (currentUser.role === ROLES.TECHNICIAN && booking.technician_id !== currentUser.id) {
    throw AppError.forbidden('You are not the assigned technician for this booking');
  }

  // Verify status is IN_PROGRESS or ARRIVED or already AWAITING_CUSTOMER_VERIFICATION
  const allowedStatuses = [
    BOOKING_STATUSES.IN_PROGRESS,
    BOOKING_STATUSES.ARRIVED,
    BOOKING_STATUSES.AWAITING_CUSTOMER_VERIFICATION
  ];
  if (!allowedStatuses.includes(booking.status)) {
    throw AppError.badRequest(`Cannot generate completion PIN from current status '${booking.status}'. Service must be IN_PROGRESS.`);
  }

  const { pin, packedHash } = pinHelper.generateCompletionPin(bookingId);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE bookings 
       SET verification_pin_hash = ?, 
           pin_expires_at = ?, 
           pin_attempt_count = 0, 
           status = ? 
       WHERE id = ?`,
      [packedHash, expiresAt, BOOKING_STATUSES.AWAITING_CUSTOMER_VERIFICATION, bookingId]
    );

    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: BOOKING_STATUSES.AWAITING_CUSTOMER_VERIFICATION,
      changed_by: currentUser.id,
      actor_role: currentUser.role,
      notes: 'Technician generated 4-digit service completion PIN'
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notify customer
  await notificationRepo.create({
    user_id: booking.customer_id,
    type: 'BOOKING_PIN_GENERATED',
    title: 'Service Completion PIN Ready',
    message: `Your technician has completed service for booking #${booking.booking_number}. Check your booking details to view your 4-digit verification PIN.`,
    data: { bookingId }
  });

  // Security: Never reveal the plain PIN to the technician
  return {
    bookingId,
    status: BOOKING_STATUSES.AWAITING_CUSTOMER_VERIFICATION,
    expires_at: expiresAt,
    message: 'Completion PIN generated successfully. Customer must now share their PIN with you.'
  };
}

/**
 * Get 4-digit verification PIN (Customer only)
 */
async function getVerificationPin(bookingId, currentUser) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  // Authorization: must be the customer who owns the booking or admin
  if (currentUser.role === ROLES.CUSTOMER && booking.customer_id !== currentUser.id) {
    throw AppError.forbidden('You do not have permission to view this verification PIN');
  }

  if (!booking.verification_pin_hash) {
    return {
      has_pin: false,
      message: 'No completion PIN has been generated yet'
    };
  }

  const now = new Date();
  const expiresAt = new Date(booking.pin_expires_at);
  const isExpired = now > expiresAt;
  const secondsLeft = isExpired ? 0 : Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

  if (isExpired) {
    return {
      has_pin: true,
      is_expired: true,
      expires_at: booking.pin_expires_at,
      seconds_left: 0,
      message: 'Verification PIN has expired. Ask your technician to regenerate.'
    };
  }

  const plainPin = pinHelper.decryptPin(booking.verification_pin_hash);

  return {
    has_pin: true,
    is_expired: false,
    pin: plainPin,
    expires_at: booking.pin_expires_at,
    seconds_left: secondsLeft
  };
}

/**
 * Verify 4-digit customer PIN (Technician only)
 * Sets status to VERIFIED
 */
async function verifyPin(bookingId, currentUser, inputPin) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  // Authorization: must be assigned technician or admin
  if (currentUser.role === ROLES.TECHNICIAN && booking.technician_id !== currentUser.id) {
    throw AppError.forbidden('You are not the assigned technician for this booking');
  }

  if (booking.status !== BOOKING_STATUSES.AWAITING_CUSTOMER_VERIFICATION) {
    throw AppError.badRequest(`Booking is not awaiting customer verification (current status: ${booking.status})`);
  }

  if (!booking.verification_pin_hash) {
    throw AppError.badRequest('No active PIN found on this booking');
  }

  // Check attempt count
  if (booking.pin_attempt_count >= 5) {
    throw AppError.badRequest('Maximum verification attempts exceeded (5/5). Please regenerate PIN.');
  }

  // Check expiration
  if (new Date() > new Date(booking.pin_expires_at)) {
    throw AppError.badRequest('Verification PIN has expired. Please regenerate PIN.');
  }

  const isMatch = pinHelper.verifyPin(inputPin, bookingId, booking.verification_pin_hash);

  if (!isMatch) {
    await pool.query(
      `UPDATE bookings SET pin_attempt_count = pin_attempt_count + 1 WHERE id = ?`,
      [bookingId]
    );
    const remaining = 5 - (booking.pin_attempt_count + 1);
    throw AppError.badRequest(`Invalid 4-digit PIN. ${remaining} attempt(s) remaining.`);
  }

  // PIN is correct! Update booking to VERIFIED
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `UPDATE bookings 
       SET pin_verified_at = UTC_TIMESTAMP(), 
           verification_pin_hash = NULL, 
           status = ? 
       WHERE id = ?`,
      [BOOKING_STATUSES.VERIFIED, bookingId]
    );

    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: BOOKING_STATUSES.AWAITING_CUSTOMER_VERIFICATION,
      to_status: BOOKING_STATUSES.VERIFIED,
      changed_by: currentUser.id,
      actor_role: currentUser.role,
      notes: 'Customer 4-digit PIN verified successfully'
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notify customer
  await notificationRepo.create({
    user_id: booking.customer_id,
    type: 'BOOKING_VERIFIED',
    title: 'Service Verified',
    message: `Your technician verified your completion PIN. You may now proceed to final payment.`,
    data: { bookingId }
  });

  return {
    bookingId,
    status: BOOKING_STATUSES.VERIFIED,
    message: '4-digit PIN verified successfully! Proceed to payment.'
  };
}

/**
 * Process booking payment and mark COMPLETED
 */
async function processPayment(bookingId, currentUser, paymentData = {}) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  // Check authorization
  const isOwner = currentUser.role === ROLES.CUSTOMER && booking.customer_id === currentUser.id;
  const isAssignedTech = currentUser.role === ROLES.TECHNICIAN && booking.technician_id === currentUser.id;
  const isAdmin = currentUser.role === ROLES.ADMIN;

  if (!isOwner && !isAssignedTech && !isAdmin) {
    throw AppError.forbidden('You do not have permission to record payment for this booking');
  }

  const allowableStatuses = [
    BOOKING_STATUSES.VERIFIED,
    BOOKING_STATUSES.PAYMENT_PENDING,
    BOOKING_STATUSES.IN_PROGRESS,
    BOOKING_STATUSES.COMPLETED
  ];

  if (!allowableStatuses.includes(booking.status)) {
    throw AppError.badRequest(`Cannot process payment for booking with status '${booking.status}'. Service must be verified.`);
  }

  const paymentMethod = paymentData.payment_method || 'CASH';
  const amount = parseFloat(paymentData.amount || booking.final_total || booking.estimated_total || 500);
  const commissionRate = 15.00;
  const commissionAmount = parseFloat((amount * 0.15).toFixed(2));
  const technicianPayout = parseFloat((amount * 0.85).toFixed(2));
  const paymentNumber = 'PAY-' + Date.now();

  const conn = await pool.getConnection();
  let paymentId;
  try {
    await conn.beginTransaction();

    // 1. Insert into payments
    const [pResult] = await conn.query(
      `INSERT INTO payments (
        payment_number, booking_id, customer_id, amount, payment_method, status, paid_at
      ) VALUES (?, ?, ?, ?, ?, 'SUCCESS', UTC_TIMESTAMP())`,
      [paymentNumber, bookingId, booking.customer_id, amount, paymentMethod]
    );
    paymentId = pResult.insertId;

    // 2. Update booking
    await conn.query(
      `UPDATE bookings 
       SET status = ?, 
           payment_method = ?, 
           payment_status = 'PAID', 
           final_total = ?, 
           commission_amount = ?, 
           technician_payout = ?, 
           completed_at = UTC_TIMESTAMP() 
       WHERE id = ?`,
      [BOOKING_STATUSES.COMPLETED, paymentMethod, amount, commissionAmount, technicianPayout, bookingId]
    );

    // 3. Status history
    await bookingRepo.addStatusHistory({
      booking_id: bookingId,
      from_status: booking.status,
      to_status: BOOKING_STATUSES.COMPLETED,
      changed_by: currentUser.id,
      actor_role: currentUser.role,
      notes: `Payment of ₹${amount} confirmed via ${paymentMethod}. Service marked COMPLETED.`
    }, conn);

    // 4. Update technician profile completed_jobs
    if (booking.technician_id) {
      await conn.query(
        `UPDATE technician_profiles SET completed_jobs = completed_jobs + 1 WHERE user_id = ?`,
        [booking.technician_id]
      );

      // 5. Insert into technician_earnings
      await conn.query(
        `INSERT INTO technician_earnings (
          technician_id, booking_id, payment_id, gross_amount, commission_rate, commission_amount, net_amount, settlement_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [booking.technician_id, bookingId, paymentId, amount, commissionRate, commissionAmount, technicianPayout]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notifications
  await notificationRepo.create({
    user_id: booking.customer_id,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Confirmed',
    message: `Payment of ₹${amount} confirmed for booking #${booking.booking_number}. Thank you for using FixAround!`,
    data: { bookingId, paymentId }
  });

  if (booking.technician_id) {
    await notificationRepo.create({
      user_id: booking.technician_id,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Received',
      message: `Payment confirmed for booking #${booking.booking_number}. Net payout ₹${technicianPayout} queued for settlement.`,
      data: { bookingId, paymentId }
    });
  }

  return await bookingRepo.findById(bookingId);
}

module.exports = {
  create,
  getById,
  getMyBookings,
  cancel,
  updateStatus,
  assignTechnician,
  getAll,
  getTimeline,
  generatePin,
  getVerificationPin,
  verifyPin,
  processPayment
};
