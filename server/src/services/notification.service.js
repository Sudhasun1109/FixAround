const notificationRepo = require('../repositories/notification.repository');
const AppError = require('../utils/apiError');

/**
 * Create a new notification
 * @param {number} userId
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {Object} [data=null]
 */
async function create(userId, type, title, message, data = null) {
  const notificationId = await notificationRepo.create({
    user_id: userId,
    type,
    title,
    message,
    data
  });
  return { id: notificationId, userId, type, title, message, data };
}

/**
 * Get user notifications with pagination
 * @param {number} userId
 * @param {Object} options
 */
async function getByUser(userId, options = {}) {
  return await notificationRepo.findByUserId(userId, options);
}

/**
 * Mark specific notification as read
 * @param {number} notificationId
 * @param {number} userId
 */
async function markAsRead(notificationId, userId) {
  const affected = await notificationRepo.markAsRead(notificationId, userId);
  return { success: true, updated: affected > 0 };
}

/**
 * Mark all user notifications as read
 * @param {number} userId
 */
async function markAllAsRead(userId) {
  const affected = await notificationRepo.markAllAsRead(userId);
  return { success: true, updated: affected };
}

/**
 * Get count of unread notifications
 * @param {number} userId
 */
async function getUnreadCount(userId) {
  const count = await notificationRepo.countUnread(userId);
  return { unreadCount: count };
}

/**
 * Helper: Send booking notification
 * @param {number} userId
 * @param {string} title
 * @param {string} message
 * @param {number} bookingId
 */
async function sendBookingNotification(userId, title, message, bookingId) {
  return await create(userId, 'BOOKING_NOTIFICATION', title, message, { bookingId });
}

/**
 * Helper: Send assignment notification
 * @param {number} technicianUserId
 * @param {string} title
 * @param {string} message
 * @param {number} bookingId
 * @param {number} assignmentId
 */
async function sendAssignmentNotification(technicianUserId, title, message, bookingId, assignmentId) {
  return await create(technicianUserId, 'ASSIGNMENT_NOTIFICATION', title, message, { bookingId, assignmentId });
}

/**
 * Helper: Send payment notification
 * @param {number} userId
 * @param {string} title
 * @param {string} message
 * @param {number} bookingId
 * @param {number} paymentId
 */
async function sendPaymentNotification(userId, title, message, bookingId, paymentId) {
  return await create(userId, 'PAYMENT_NOTIFICATION', title, message, { bookingId, paymentId });
}

module.exports = {
  create,
  getByUser,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendBookingNotification,
  sendAssignmentNotification,
  sendPaymentNotification
};
