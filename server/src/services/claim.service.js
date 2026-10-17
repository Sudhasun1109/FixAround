const claimRepo = require('../repositories/claim.repository');
const bookingRepo = require('../repositories/booking.repository');
const serviceRepo = require('../repositories/service.repository');
const notificationRepo = require('../repositories/notification.repository');
const auditRepo = require('../repositories/audit.repository');
const AppError = require('../utils/apiError');
const config = require('../config/env');
const { generateClaimNumber } = require('../utils/helpers');
const { BOOKING_STATUSES, CLAIM_STATUSES, ROLES } = require('../utils/constants');

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

  if (booking.customer_id !== customerId) {
    throw AppError.forbidden('You are not authorized to file a claim for this booking');
  }

  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw AppError.badRequest('Warranty claims can only be filed on completed bookings');
  }

  if (!booking.technician_id) {
    throw AppError.badRequest('No technician is associated with this booking');
  }

  // Calculate warranty expiry based on category warranty_period_days
  const warrantyDays = booking.warranty_period_days || config.platform.defaultWarrantyPeriodDays;
  const completedAt = new Date(booking.completed_at || booking.updated_at);
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
    issue_description: data.issue_description,
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

  await claimRepo.resolve(claimId, {
    status: resolution.status || CLAIM_STATUSES.RESOLVED,
    resolution_type: resolution.resolution_type,
    resolution_notes: resolution.resolution_notes,
    resolved_by: adminId
  });

  // Audit log
  await auditRepo.create({
    actor_id: adminId,
    actor_role: 'admin',
    action: 'RESOLVE_WARRANTY_CLAIM',
    entity_type: 'warranty_claim',
    entity_id: claimId,
    details: resolution
  });

  // Notify customer
  await notificationRepo.create({
    user_id: claim.customer_id,
    type: 'CLAIM_RESOLVED',
    title: 'Warranty Claim Resolved',
    message: `Your warranty claim #${claim.claim_number} has been resolved: ${resolution.resolution_type}.`,
    data: { claimId }
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
