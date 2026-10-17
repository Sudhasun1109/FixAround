const adminService = require('../services/admin.service');
const userRepo = require('../repositories/user.repository');
const bookingService = require('../services/booking.service');
const assignmentService = require('../services/assignment.service');
const apiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');

async function getDashboard(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    return apiResponse.success(res, stats, 'Dashboard statistics retrieved');
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit, role, search, is_active } = req.query;
    const result = await userRepo.findAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      role,
      search,
      isActive: is_active !== undefined ? is_active === 'true' || is_active === '1' : null
    });
    return apiResponse.paginated(
      res,
      result.users,
      { page, limit, total: result.total },
      'Users list retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    await userRepo.update(userId, { is_active: is_active ? 1 : 0 });
    const updatedUser = await userRepo.findById(userId);
    return apiResponse.success(res, updatedUser, 'User status updated');
  } catch (err) {
    next(err);
  }
}

async function getBookings(req, res, next) {
  try {
    const { page, limit, status, category_id, is_emergency, start_date, end_date, search } = req.query;
    const result = await adminService.getBookingReport({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
      categoryId: category_id ? parseInt(category_id, 10) : null,
      isEmergency: is_emergency !== undefined ? is_emergency === 'true' || is_emergency === '1' : null,
      startDate: start_date,
      endDate: end_date,
      search
    });
    return apiResponse.paginated(
      res,
      result.bookings,
      { page, limit, total: result.total },
      'Bookings retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getPayments(req, res, next) {
  try {
    const { page, limit, status, payment_method, start_date, end_date } = req.query;
    const result = await adminService.getPaymentReport({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
      paymentMethod: payment_method,
      startDate: start_date,
      endDate: end_date
    });
    return apiResponse.paginated(
      res,
      result.payments,
      { page, limit, total: result.total },
      'Payments retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await adminService.getSettings();
    return apiResponse.success(res, settings, 'Platform settings retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updated = await adminService.updateSetting(key, value, req.user.id);
    return apiResponse.success(res, updated, `Setting '${key}' updated successfully`);
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, action, entity_type, actor_id, start_date, end_date } = req.query;
    const result = await adminService.getAuditLogs({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '25', 10),
      action,
      entityType: entity_type,
      actorId: actor_id ? parseInt(actor_id, 10) : null,
      startDate: start_date,
      endDate: end_date
    });
    return apiResponse.paginated(
      res,
      result.logs,
      { page, limit, total: result.total },
      'Audit logs retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function reassignBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { technician_id } = req.body;

    if (technician_id) {
      await bookingService.assignTechnician(bookingId, parseInt(technician_id, 10), req.user.id);
    } else {
      await assignmentService.assignNextTechnician(bookingId);
    }

    const updatedBooking = await bookingService.getById(bookingId, req.user);
    return apiResponse.success(res, updatedBooking, 'Booking reassignment triggered');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getUsers,
  updateUserStatus,
  getBookings,
  getPayments,
  getSettings,
  updateSetting,
  getAuditLogs,
  reassignBooking
};
