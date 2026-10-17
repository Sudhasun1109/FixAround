const notificationService = require('../services/notification.service');
const apiResponse = require('../utils/apiResponse');

async function getAll(req, res, next) {
  try {
    const { page, limit, unread_only } = req.query;
    const result = await notificationService.getByUser(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      unreadOnly: unread_only === 'true' || unread_only === '1'
    });
    return apiResponse.paginated(
      res,
      result.notifications,
      { page, limit, total: result.total },
      'Notifications retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const result = await notificationService.markAsRead(notificationId, req.user.id);
    return apiResponse.success(res, result, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return apiResponse.success(res, result, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    return apiResponse.success(res, result, 'Unread notification count retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
