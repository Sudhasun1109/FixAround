const claimService = require('../services/claim.service');
const apiResponse = require('../utils/apiResponse');

async function create(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const claim = await claimService.create(bookingId, req.user.id, req.body);
    return apiResponse.success(res, claim, 'Warranty claim filed successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getMyClaims(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await claimService.getByCustomer(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10)
    });
    return apiResponse.paginated(
      res,
      result.claims,
      { page, limit, total: result.total },
      'My warranty claims retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await claimService.getAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status
    });
    return apiResponse.paginated(
      res,
      result.claims,
      { page, limit, total: result.total },
      'All warranty claims retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const claim = await claimService.getById(parseInt(req.params.id, 10), req.user);
    return apiResponse.success(res, claim, 'Warranty claim retrieved');
  } catch (err) {
    next(err);
  }
}

async function resolve(req, res, next) {
  try {
    const claim = await claimService.resolve(
      parseInt(req.params.id, 10),
      req.user.id,
      req.body
    );
    return apiResponse.success(res, claim, 'Warranty claim resolved successfully');
  } catch (err) {
    next(err);
  }
}

async function respond(req, res, next) {
  try {
    const { response } = req.body;
    const claim = await claimService.respond(
      parseInt(req.params.id, 10),
      req.user.id,
      response
    );
    return apiResponse.success(res, claim, 'Response recorded for claim');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getMyClaims,
  getAll,
  getById,
  resolve,
  respond
};
