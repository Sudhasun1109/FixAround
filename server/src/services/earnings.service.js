const earningsRepo = require('../repositories/earnings.repository');
const bookingRepo = require('../repositories/booking.repository');
const paymentRepo = require('../repositories/payment.repository');
const settingsRepo = require('../repositories/settings.repository');
const config = require('../config/env');
const AppError = require('../utils/apiError');
const { pool } = require('../config/database');

/**
 * Calculate commission and record technician earnings
 * @param {number} bookingId
 * @param {number} paymentId
 */
async function calculateAndRecord(bookingId, paymentId) {
  const alreadyExists = await earningsRepo.checkExists(bookingId);
  if (alreadyExists) {
    return await earningsRepo.findByBookingId(bookingId);
  }

  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (!booking.technician_id) {
    throw AppError.badRequest('No technician assigned to this booking');
  }

  const payment = await paymentRepo.findById(paymentId);
  if (!payment) {
    throw AppError.notFound('Payment record not found');
  }

  const commissionRate = (await settingsRepo.get('platform_commission_percent')) || config.platform.commissionPercent;
  const grossAmount = parseFloat(payment.amount);
  const commissionAmount = parseFloat(((grossAmount * commissionRate) / 100).toFixed(2));
  const netAmount = parseFloat((grossAmount - commissionAmount).toFixed(2));

  const conn = await pool.getConnection();
  let earningsId;
  try {
    await conn.beginTransaction();

    earningsId = await earningsRepo.create({
      technician_id: booking.technician_id,
      booking_id: bookingId,
      payment_id: paymentId,
      gross_amount: grossAmount.toFixed(2),
      commission_rate: commissionRate.toFixed(2),
      commission_amount: commissionAmount.toFixed(2),
      net_amount: netAmount.toFixed(2),
      settlement_status: 'PENDING',
      notes: `Earnings for booking #${booking.booking_number} (Awaiting Admin Verification & Settlement)`
    }, conn);

    // Amount is retained in Platform account until Admin verifies and settles the payout
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return await earningsRepo.findByBookingId(bookingId);
}

/**
 * Get all technician settlements for Admin verification
 * @param {Object} options
 */
async function getAll(options = {}) {
  return await earningsRepo.findAll(options);
}

/**
 * Admin verifies and settles payout to technician
 * @param {number} earningId
 * @param {number} adminId
 * @param {string|null} notes
 */
async function settle(earningId, adminId, notes = null) {
  return await earningsRepo.settle(earningId, adminId, notes);
}

/**
 * Get earnings history for a technician
 * @param {number} technicianId (users.id)
 * @param {Object} options
 */
async function getByTechnician(technicianId, options = {}) {
  return await earningsRepo.findByTechnicianId(technicianId, options);
}

/**
 * Get earnings summary statistics for a technician
 * @param {number} technicianId (users.id)
 */
async function getSummary(technicianId) {
  const summary = await earningsRepo.getTotal(technicianId);
  return {
    ...summary,
    total_earned: summary.settled_amount || 0.00,
    monthly_earnings: summary.settled_amount || 0.00,
    net_payout: summary.settled_amount || 0.00,
    pending_settlement: summary.pending_settlement || 0.00
  };
}

module.exports = {
  calculateAndRecord,
  getAll,
  settle,
  getByTechnician,
  getSummary
};
