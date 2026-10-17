const serviceService = require('../services/service.service');
const apiResponse = require('../utils/apiResponse');

async function getAll(req, res, next) {
  try {
    const activeOnly = req.query.active !== 'false';
    const categories = await serviceService.getAll({ activeOnly });
    return apiResponse.success(res, categories, 'Service categories retrieved');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const category = await serviceService.getById(req.params.id);
    return apiResponse.success(res, category, 'Service category retrieved');
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await serviceService.create(req.body);
    return apiResponse.success(res, category, 'Service category created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await serviceService.update(parseInt(req.params.id, 10), req.body);
    return apiResponse.success(res, category, 'Service category updated successfully');
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    const category = await serviceService.updateStatus(parseInt(req.params.id, 10), is_active);
    return apiResponse.success(res, category, 'Service category status updated');
  } catch (err) {
    next(err);
  }
}

async function getWithStats(req, res, next) {
  try {
    const categories = await serviceService.getWithStats();
    return apiResponse.success(res, categories, 'Service categories with stats retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  getWithStats
};
