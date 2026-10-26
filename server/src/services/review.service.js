const reviewRepo = require('../repositories/review.repository');
const bookingRepo = require('../repositories/booking.repository');
const notificationRepo = require('../repositories/notification.repository');
const AppError = require('../utils/apiError');
const { BOOKING_STATUSES } = require('../utils/constants');
const { pool } = require('../config/database');

/**
 * Submit a customer review for a completed booking
 * Updates technician avg_rating and review_count
 * @param {number} bookingId
 * @param {number} customerId
 * @param {Object} data
 */
async function create(bookingId, customerId, data) {
  let booking = null;
  if (typeof bookingId === 'number' || /^\d+$/.test(bookingId)) {
    booking = await bookingRepo.findById(parseInt(bookingId, 10));
  }
  if (!booking && typeof bookingId === 'string') {
    booking = await bookingRepo.findByBookingNumber(bookingId);
  }
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  const resolvedBookingId = booking.id;

  if (booking.customer_id !== customerId) {
    throw AppError.forbidden('You can only review bookings that you requested');
  }

  if (booking.status !== BOOKING_STATUSES.COMPLETED) {
    throw AppError.badRequest('Reviews can only be submitted for completed services');
  }

  if (!booking.technician_id) {
    throw AppError.badRequest('No technician is associated with this booking');
  }

  const alreadyReviewed = await reviewRepo.checkExists(resolvedBookingId, customerId);
  if (alreadyReviewed) {
    throw AppError.conflict('You have already submitted a review for this booking');
  }

  const rating = parseInt(data.rating, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw AppError.badRequest('Rating must be an integer between 1 and 5');
  }

  const conn = await pool.getConnection();
  let reviewId;
  try {
    await conn.beginTransaction();

    reviewId = await reviewRepo.create({
      booking_id: resolvedBookingId,
      customer_id: customerId,
      technician_id: booking.technician_id,
      rating,
      title: data.title || null,
      comment: data.comment || null,
      is_visible: 1
    }, conn);

    // Recalculate technician profile average rating and review count
    const [stats] = await conn.query(
      `SELECT COUNT(*) AS total_reviews, AVG(rating) AS avg_rating 
       FROM reviews 
       WHERE technician_id = ? AND is_visible = 1`,
      [booking.technician_id]
    );

    const newAvg = stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(1) : 0.0;
    const newCount = stats[0].total_reviews || 0;

    await conn.query(
      `UPDATE technician_profiles 
       SET avg_rating = ?, review_count = ? 
       WHERE user_id = ?`,
      [newAvg, newCount, booking.technician_id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Notify technician
  await notificationRepo.create({
    user_id: booking.technician_id,
    type: 'REVIEW_RECEIVED',
    title: 'New Customer Review',
    message: `A customer gave you a ${rating}★ review for booking #${booking.booking_number}.`,
    data: { bookingId, reviewId, rating }
  });

  return await reviewRepo.findByBookingId(bookingId);
}

/**
 * Get reviews for a technician
 * @param {number} technicianId (users.id)
 * @param {Object} options
 */
async function getByTechnician(technicianId, options = {}) {
  return await reviewRepo.findByTechnicianId(technicianId, options);
}

/**
 * Get reviews submitted by a customer
 * @param {number} customerId
 * @param {Object} options
 */
async function getByCustomer(customerId, options = {}) {
  return await reviewRepo.findByCustomerId(customerId, options);
}

/**
 * Get all reviews with filters (Admin)
 * @param {Object} options
 */
async function getAll(options = {}) {
  return await reviewRepo.findAll(options);
}

/**
 * Get featured public reviews for landing page
 * @param {number} limit
 */
async function getFeatured(limit = 6) {
  return await reviewRepo.findFeatured(limit);
}

module.exports = {
  create,
  getByTechnician,
  getByCustomer,
  getAll,
  getFeatured,
};
