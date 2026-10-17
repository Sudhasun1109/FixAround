const earningsService = require('../services/earnings.service');
const apiResponse = require('../utils/apiResponse');

async function getMyEarnings(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await earningsService.getByTechnician(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      settlementStatus: status
    });
    return apiResponse.paginated(
      res,
      result.earnings,
      { page, limit, total: result.total },
      'Earnings history retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const summary = await earningsService.getSummary(req.user.id);
    return apiResponse.success(res, summary, 'Earnings summary retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyEarnings,
  getSummary
};
