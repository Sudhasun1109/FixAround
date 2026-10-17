const estimateRepo = require('../repositories/estimate.repository');
const bookingRepo = require('../repositories/booking.repository');
const notificationRepo = require('../repositories/notification.repository');
const AppError = require('../utils/apiError');
const { BOOKING_STATUSES, ESTIMATE_STATUSES, ROLES } = require('../utils/constants');
const { pool } = require('../config/database');

/**
 * Create a new price estimate
 * Supersedes previous submitted estimates, calculates total, updates booking
 * @param {number} bookingId
 * @param {number} technicianUserId
 * @param {Object} data
 */
async function create(bookingId, technicianUserId, data) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.technician_id !== technicianUserId) {
    throw AppError.forbidden('You are not the assigned technician for this booking');
  }

  const laborCharge = parseFloat(data.labor_charge || '0.00');
  const materialCharge = parseFloat(data.material_charge || '0.00');
  const inspectionCharge = parseFloat(data.inspection_charge || '0.00');
  const additionalCharge = parseFloat(data.additional_charge || '0.00');
  const totalEstimate = laborCharge + materialCharge + inspectionCharge + additionalCharge;

  const conn = await pool.getConnection();
  let estimateId;
  try {
    await conn.beginTransaction();

    // Supersede any active previous estimates
    await estimateRepo.supersedePrevious(bookingId, conn);

    // Determine revision number
    const maxRev = await estimateRepo.getLatestRevisionNumber(bookingId, conn);
    const revisionNumber = maxRev + 1;

    estimateId = await estimateRepo.create({
      booking_id: bookingId,
      technician_id: technicianUserId,
      revision_number: revisionNumber,
      labor_charge: laborCharge.toFixed(2),
      material_charge: materialCharge.toFixed(2),
      inspection_charge: inspectionCharge.toFixed(2),
      additional_charge: additionalCharge.toFixed(2),
      total_estimate: totalEstimate.toFixed(2),
      breakdown_notes: data.breakdown_notes || null,
      status: ESTIMATE_STATUSES.SUBMITTED
    }, conn);

    // Transition booking status to AWAITING_APPROVAL if IN_PROGRESS or ARRIVED
    if ([BOOKING_STATUSES.ARRIVED, BOOKING_STATUSES.IN_PROGRESS].includes(booking.status)) {
      await bookingRepo.updateStatus(bookingId, BOOKING_STATUSES.AWAITING_APPROVAL, {
        estimated_total: totalEstimate.toFixed(2)
      }, conn);

      await bookingRepo.addStatusHistory({
        booking_id: bookingId,
        from_status: booking.status,
        to_status: BOOKING_STATUSES.AWAITING_APPROVAL,
        changed_by: technicianUserId,
        actor_role: ROLES.TECHNICIAN,
        notes: `Technician submitted price quote: ₹${totalEstimate.toFixed(2)}`
      }, conn);
    }

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
    type: 'ESTIMATE_SUBMITTED',
    title: 'New Price Estimate Received',
    message: `Your technician submitted an estimate of ₹${totalEstimate.toFixed(2)} for booking #${booking.booking_number}. Please review and approve.`,
    data: { bookingId, estimateId, totalEstimate }
  });

  return await estimateRepo.findById(estimateId);
}

/**
 * Approve a price estimate (Customer only)
 * @param {number} estimateId
 * @param {number} customerId
 */
async function approve(estimateId, customerId) {
  const estimate = await estimateRepo.findById(estimateId);
  if (!estimate) {
    throw AppError.notFound('Estimate not found');
  }

  if (estimate.customer_id !== customerId) {
    throw AppError.forbidden('You are not authorized to approve estimates for this booking');
  }

  if (estimate.status !== ESTIMATE_STATUSES.SUBMITTED && estimate.status !== ESTIMATE_STATUSES.REVISED) {
    throw AppError.badRequest(`Cannot approve estimate with status '${estimate.status}'`);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await estimateRepo.approve(estimateId, customerId, conn);

    // Update booking estimated_total and transition to IN_PROGRESS
    await bookingRepo.updateStatus(estimate.booking_id, BOOKING_STATUSES.IN_PROGRESS, {
      estimated_total: estimate.total_estimate,
      final_total: estimate.total_estimate
    }, conn);

    await bookingRepo.addStatusHistory({
      booking_id: estimate.booking_id,
      from_status: BOOKING_STATUSES.AWAITING_APPROVAL,
      to_status: BOOKING_STATUSES.IN_PROGRESS,
      changed_by: customerId,
      actor_role: ROLES.CUSTOMER,
      notes: `Customer approved price estimate of ₹${estimate.total_estimate}`
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notify technician
  await notificationRepo.create({
    user_id: estimate.technician_id,
    type: 'ESTIMATE_APPROVED',
    title: 'Estimate Approved!',
    message: `Customer approved your estimate of ₹${estimate.total_estimate} for booking #${estimate.booking_number}. You can now proceed.`,
    data: { bookingId: estimate.booking_id, estimateId }
  });

  return await estimateRepo.findById(estimateId);
}

/**
 * Reject a price estimate (Customer only)
 * @param {number} estimateId
 * @param {number} customerId
 * @param {string} [reason=null]
 */
async function reject(estimateId, customerId, reason = null) {
  const estimate = await estimateRepo.findById(estimateId);
  if (!estimate) {
    throw AppError.notFound('Estimate not found');
  }

  if (estimate.customer_id !== customerId) {
    throw AppError.forbidden('You are not authorized to reject estimates for this booking');
  }

  if (estimate.status !== ESTIMATE_STATUSES.SUBMITTED && estimate.status !== ESTIMATE_STATUSES.REVISED) {
    throw AppError.badRequest(`Cannot reject estimate with status '${estimate.status}'`);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await estimateRepo.reject(estimateId, reason, conn);

    await bookingRepo.addStatusHistory({
      booking_id: estimate.booking_id,
      from_status: BOOKING_STATUSES.AWAITING_APPROVAL,
      to_status: BOOKING_STATUSES.IN_PROGRESS,
      changed_by: customerId,
      actor_role: ROLES.CUSTOMER,
      notes: `Estimate rejected by customer: ${reason || 'No reason provided'}`
    }, conn);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notify technician
  await notificationRepo.create({
    user_id: estimate.technician_id,
    type: 'ESTIMATE_REJECTED',
    title: 'Estimate Rejected',
    message: `Customer rejected the estimate for booking #${estimate.booking_number}: ${reason || 'Please provide a revised quote.'}`,
    data: { bookingId: estimate.booking_id, estimateId }
  });

  return await estimateRepo.findById(estimateId);
}

/**
 * Get all estimates for a booking
 * @param {number} bookingId
 */
async function getByBooking(bookingId) {
  return await estimateRepo.findByBookingId(bookingId);
}

module.exports = {
  create,
  approve,
  reject,
  getByBooking
};
