const estimateService = require('../services/estimate.service');
const apiResponse = require('../utils/apiResponse');

async function create(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id || req.params.bookingId || req.body.booking_id || req.body.bookingId, 10);
    const estimate = await estimateService.create(bookingId, req.user.id, req.body);
    return apiResponse.success(res, estimate, 'Price estimate submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getByBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id || req.params.bookingId, 10);
    const estimates = await estimateService.getByBooking(bookingId);
    return apiResponse.success(res, estimates, 'Estimates retrieved for booking');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const estimateId = parseInt(req.params.id, 10);
    const estimate = await estimateService.getById(estimateId);
    return apiResponse.success(res, estimate, 'Estimate retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const estimateId = parseInt(req.params.eid || req.params.id, 10);
    const estimate = await estimateService.approve(estimateId, req.user.id);
    return apiResponse.success(res, estimate, 'Price estimate approved successfully');
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const estimateId = parseInt(req.params.eid || req.params.id, 10);
    const { reason } = req.body;
    const estimate = await estimateService.reject(estimateId, req.user.id, reason);
    return apiResponse.success(res, estimate, 'Price estimate rejected');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getByBooking,
  getById,
  approve,
  reject
};
