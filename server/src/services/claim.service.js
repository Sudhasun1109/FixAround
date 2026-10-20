const claimRepo = require('../repositories/claim.repository');
const bookingRepo = require('../repositories/booking.repository');
const serviceRepo = require('../repositories/service.repository');
const notificationRepo = require('../repositories/notification.repository');
const auditRepo = require('../repositories/audit.repository');
const AppError = require('../utils/apiError');
const config = require('../config/env');
const { generateClaimNumber, generateRefundNumber } = require('../utils/helpers');
const { BOOKING_STATUSES, CLAIM_STATUSES, ROLES } = require('../utils/constants');
const { pool } = require('../config/database');

/**
 * File a warranty claim on a completed service
 * @param {number} bookingId
 * @param {number} customerId
 * @param {Object} data
 */
async function create(bookingId, customerId, data) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (Number(booking.customer_id) !== Number(customerId)) {
    throw AppError.forbidden('You are not authorized to file a claim for this booking');
  }

  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw AppError.badRequest('Warranty claims can only be filed on completed bookings');
  }

  if (!booking.technician_id) {
    throw AppError.badRequest('No technician is associated with this booking');
  }

  // Calculate warranty expiry based on category warranty_period_days
  const warrantyDays = booking.warranty_period_days || config.platform.defaultWarrantyPeriodDays || 30;
  const completedAt = new Date(booking.completed_at || booking.updated_at || Date.now());
  const warrantyExpiresAt = new Date(completedAt.getTime() + warrantyDays * 24 * 60 * 60 * 1000);

  const now = new Date();
  if (now > warrantyExpiresAt) {
    throw AppError.badRequest(
      `Warranty period (${warrantyDays} days) for this service expired on ${warrantyExpiresAt.toDateString()}`
    );
  }

  const claimNumber = generateClaimNumber();
  const expiresAtIso = warrantyExpiresAt.toISOString().slice(0, 19).replace('T', ' ');

  const claimId = await claimRepo.create({
    claim_number: claimNumber,
    booking_id: bookingId,
    customer_id: customerId,
    technician_id: booking.technician_id,
    issue_description: data.issue_description || data.description,
    evidence_notes: data.evidence_notes || null,
    warranty_expires_at: expiresAtIso,
    status: CLAIM_STATUSES.OPEN
  });

  // Notify technician
  await notificationRepo.create({
    user_id: booking.technician_id,
    type: 'WARRANTY_CLAIM_FILED',
    title: 'Warranty Claim Filed',
    message: `A warranty claim #${claimNumber} was filed for booking #${booking.booking_number}.`,
    data: { bookingId, claimId, claimNumber }
  });

  return await claimRepo.findById(claimId);
}

/**
 * Technician responds to a warranty claim
 * @param {number} claimId
 * @param {number} technicianUserId
 * @param {string} response
 */
async function respond(claimId, technicianUserId, response) {
  const claim = await claimRepo.findById(claimId);
  if (!claim) {
    throw AppError.notFound('Warranty claim not found');
  }

  if (claim.technician_id !== technicianUserId) {
    throw AppError.forbidden('You are not the technician assigned to this claim');
  }

  await claimRepo.updateStatus(claimId, CLAIM_STATUSES.UNDER_REVIEW);

  return await claimRepo.findById(claimId);
}

/**
 * Admin resolves a warranty claim
 * @param {number} claimId
 * @param {number} adminId
 * @param {Object} resolution
 */
async function resolve(claimId, adminId, resolution) {
  const claim = await claimRepo.findById(claimId);
  if (!claim) {
    throw AppError.notFound('Warranty claim not found');
  }

  const resType = resolution.resolution_type || 'FULL_REFUND';
  let defaultNotes = resolution.resolution_notes;
  if (!defaultNotes || !defaultNotes.trim()) {
    if (resType === 'FULL_REFUND') {
      defaultNotes = 'Claim verified and authorized. Full refund credited directly to customer FixAround Wallet.';
    } else if (resType === 'PARTIAL_REFUND') {
      defaultNotes = 'Claim verified. Partial refund credited directly to customer FixAround Wallet.';
    } else if (resType === 'RE_SERVICE') {
      defaultNotes = 'Complimentary re-service authorized for the customer.';
    } else {
      defaultNotes = 'Claim reviewed and resolved by administration.';
    }
  }

  await claimRepo.resolve(claimId, {
    status: resolution.status || (resType === 'REJECTED' ? CLAIM_STATUSES.REJECTED : CLAIM_STATUSES.RESOLVED),
    resolution_type: resType,
    resolution_notes: defaultNotes,
    resolved_by: adminId
  });

  // If Full or Partial Refund: Process credit directly to Customer Wallet
  let refundRecord = null;
  if (resType === 'FULL_REFUND' || resType === 'PARTIAL_REFUND') {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Determine amount from booking or payment
      const [bookings] = await conn.query('SELECT final_total, estimated_total FROM bookings WHERE id = ?', [claim.booking_id]);
      const [payments] = await conn.query('SELECT id, amount FROM payments WHERE booking_id = ? AND status = "SUCCESS" ORDER BY id DESC LIMIT 1', [claim.booking_id]);

      let baseAmount = payments[0]?.amount || bookings[0]?.final_total || bookings[0]?.estimated_total || 650;
      let refundAmount = resType === 'FULL_REFUND' ? Number(baseAmount) : Number(baseAmount) / 2;
      refundAmount = Math.round(refundAmount * 100) / 100;

      const refundNumber = generateRefundNumber();
      const paymentId = payments[0]?.id || null;

      // 1. Insert into refunds table
      await conn.query(
        `INSERT INTO refunds (
          refund_number, payment_id, booking_id, amount, reason, status, approved_by, gateway_refund_id, processed_at
        ) VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?, 'WALLET_CREDIT', NOW())`,
        [refundNumber, paymentId, claim.booking_id, refundAmount, defaultNotes, adminId]
      );

      // 2. Credit customer_profiles.wallet_balance
      await conn.query(
        'UPDATE customer_profiles SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
        [refundAmount, claim.customer_id]
      );

      // 3. Get updated balance
      const [balRows] = await conn.query(
        'SELECT wallet_balance FROM customer_profiles WHERE user_id = ?',
        [claim.customer_id]
      );
      const balanceAfter = balRows[0]?.wallet_balance || refundAmount;

      // 4. Record wallet transaction
      await conn.query(
        `INSERT INTO wallet_transactions (customer_id, booking_id, claim_id, amount, type, description, balance_after)
         VALUES (?, ?, ?, ?, 'CREDIT', ?, ?)`,
        [claim.customer_id, claim.booking_id, claimId, refundAmount, `Refund credited for warranty claim #${claim.claim_number}`, balanceAfter]
      );

      await conn.commit();
      refundRecord = { refundNumber, refundAmount, balanceAfter };
    } catch (err) {
      await conn.rollback();
      console.error('Failed to process wallet refund in transaction:', err);
    } finally {
      conn.release();
    }
  }

  // Audit log
  await auditRepo.create({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'RESOLVE_WARRANTY_CLAIM',
    entity_type: 'warranty_claim',
    entity_id: claimId,
    details: { ...resolution, refund: refundRecord }
  });

  // Notify customer
  const notifyMessage = refundRecord
    ? `Your warranty claim #${claim.claim_number} was approved with a ₹${refundRecord.refundAmount} refund credited directly to your FixAround Wallet.`
    : `Your warranty claim #${claim.claim_number} has been resolved: ${resType}.`;

  await notificationRepo.create({
    user_id: claim.customer_id,
    type: 'CLAIM_RESOLVED',
    title: refundRecord ? 'Refund Credited to FixAround Wallet' : 'Warranty Claim Resolved',
    message: notifyMessage,
    data: { claimId, refund: refundRecord }
  });

  return await claimRepo.findById(claimId);
}

/**
 * Get claim by ID with authorization
 * @param {number} claimId
 * @param {Object} currentUser
 */
async function getById(claimId, currentUser) {
  const claim = await claimRepo.findById(claimId);
  if (!claim) {
    throw AppError.notFound('Warranty claim not found');
  }

  if (currentUser.role === ROLES.ADMIN) {
    return claim;
  }

  if (currentUser.role === ROLES.CUSTOMER && claim.customer_id === currentUser.id) {
    return claim;
  }

  if (currentUser.role === ROLES.TECHNICIAN && claim.technician_id === currentUser.id) {
    return claim;
  }

  throw AppError.forbidden('You are not authorized to view this claim');
}

/**
 * Get all claims (Admin)
 * @param {Object} options
 */
async function getAll(options = {}) {
  return await claimRepo.findAll(options);
}

/**
 * Get claims submitted by customer
 * @param {number} customerId
 * @param {Object} options
 */
async function getByCustomer(customerId, options = {}) {
  return await claimRepo.findByCustomerId(customerId, options);
}

module.exports = {
  create,
  respond,
  resolve,
  getById,
  getAll,
  getByCustomer
};
