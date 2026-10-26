const bookingService = require('../services/booking.service');
const assignmentService = require('../services/assignment.service');
const bookingRepo = require('../repositories/booking.repository');
const apiResponse = require('../utils/apiResponse');

async function resolveBookingId(rawId) {
  if (!rawId) return null;
  if (typeof rawId === 'string' && rawId.startsWith('BK-')) {
    const b = await bookingRepo.findByBookingNumber(rawId);
    return b ? b.id : null;
  }
  const parsed = parseInt(rawId, 10);
  return isNaN(parsed) ? null : parsed;
}

async function create(req, res, next) {
  try {
    const booking = await bookingService.create(req.user.id, req.body);
    return apiResponse.success(res, booking, 'Booking created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await bookingService.getMyBookings(req.user, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      status
    });
    return apiResponse.paginated(
      res,
      result.bookings,
      { page, limit, total: result.total },
      'My bookings retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getIncomingRequests(req, res, next) {
  try {
    const requests = await assignmentService.getIncomingRequests(req.user.id);
    return apiResponse.success(res, { requests }, 'Incoming requests retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const bookingId = await resolveBookingId(req.params.id);
    const booking = await bookingService.getById(bookingId, req.user);
    return apiResponse.success(res, booking, 'Booking details retrieved');
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const { reason } = req.body;
    const bookingId = await resolveBookingId(req.params.id);
    const booking = await bookingService.cancel(bookingId, req.user, reason);
    return apiResponse.success(res, booking, 'Booking cancelled successfully');
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, notes, final_total } = req.body;
    const extraFields = {};
    if (final_total !== undefined && final_total !== null) {
      extraFields.final_total = parseFloat(final_total);
    }
    const bookingId = await resolveBookingId(req.params.id);
    const booking = await bookingService.updateStatus(
      bookingId,
      status,
      req.user,
      notes,
      extraFields
    );
    return apiResponse.success(res, booking, 'Booking status updated successfully');
  } catch (err) {
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    const { technician_id } = req.body;
    const bookingId = await resolveBookingId(req.params.id);
    const result = await bookingService.assignTechnician(
      bookingId,
      parseInt(technician_id, 10),
      req.user.id
    );
    return apiResponse.success(res, result, 'Technician assignment initiated');
  } catch (err) {
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    const bookingId = await resolveBookingId(req.params.id);
    const booking = await assignmentService.handleAcceptance(
      bookingId,
      req.user.id
    );
    return apiResponse.success(res, booking, 'Booking assignment accepted successfully');
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const { reason } = req.body;
    const bookingId = await resolveBookingId(req.params.id);
    const result = await assignmentService.handleRejection(
      bookingId,
      req.user.id,
      reason
    );
    return apiResponse.success(res, result, 'Booking assignment rejected');
  } catch (err) {
    next(err);
  }
}

async function getTimeline(req, res, next) {
  try {
    const bookingId = await resolveBookingId(req.params.id);
    const timeline = await bookingService.getTimeline(bookingId, req.user);
    return apiResponse.success(res, timeline, 'Booking status timeline retrieved');
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const { page, limit, status, category_id, is_emergency, start_date, end_date, search } = req.query;
    const result = await bookingService.getAll({
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
      'All bookings retrieved'
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getMyBookings,
  getIncomingRequests,
  getById,
  cancel,
  updateStatus,
  assign,
  accept,
  reject,
  getTimeline,
  getAll
};
