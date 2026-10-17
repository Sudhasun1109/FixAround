const invoiceService = require('../services/invoice.service');
const apiResponse = require('../utils/apiResponse');

async function getById(req, res, next) {
  try {
    const invoice = await invoiceService.getById(parseInt(req.params.id, 10), req.user);
    return apiResponse.success(res, invoice, 'Invoice retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function getMyInvoices(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await invoiceService.getByCustomer(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10)
    });
    return apiResponse.paginated(
      res,
      result.invoices,
      { page, limit, total: result.total },
      'My invoices retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getByBooking(req, res, next) {
  try {
    const invoice = await invoiceService.getByBooking(parseInt(req.params.id, 10), req.user);
    return apiResponse.success(res, invoice, 'Booking invoice retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getById,
  getMyInvoices,
  getByBooking
};
