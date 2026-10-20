const paymentService = require('../services/payment.service');
const apiResponse = require('../utils/apiResponse');

async function initiate(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id || req.body.booking_id, 10);
    const { payment_method, amount } = req.body;
    const result = await paymentService.initiate(bookingId, req.user.id, payment_method, amount);
    return apiResponse.success(res, result, 'Payment initiated', 201);
  } catch (err) {
    next(err);
  }
}

async function getByBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.bookingId || req.params.id, 10);
    const payments = await paymentService.getByBooking(bookingId);
    return apiResponse.success(res, payments, 'Payments retrieved for booking');
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const paymentId = parseInt(req.params.id || req.body.payment_id, 10);
    const result = await paymentService.verifySandboxPayment(paymentId, req.user.id);
    return apiResponse.success(res, result.payment, result.message);
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];
    const result = await paymentService.handleWebhook(req.body, signature);
    return apiResponse.success(res, result, 'Webhook processed successfully');
  } catch (err) {
    next(err);
  }
}

async function getMyPayments(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await paymentService.getByCustomer(req.user.id, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10),
      status
    });
    return apiResponse.paginated(
      res,
      result.payments,
      { page, limit, total: result.total },
      'My payments retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function createRazorpayOrder(req, res, next) {
  try {
    const bookingId = parseInt(req.body.booking_id || req.params.id, 10);
    const amount = req.body.amount;
    const orderData = await paymentService.createRazorpayOrder(bookingId, req.user.id, amount);
    return apiResponse.success(res, orderData, 'Razorpay order created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function verifyRazorpay(req, res, next) {
  try {
    const result = await paymentService.verifyRazorpayPayment(req.body, req.user.id);
    return apiResponse.success(res, result.payment, result.message);
  } catch (err) {
    next(err);
  }
}

async function payWithWallet(req, res, next) {
  try {
    const bookingId = parseInt(req.body.booking_id || req.params.id, 10);
    const pointsToRedeem = parseInt(req.body.points_redeemed || 0, 10);
    const result = await paymentService.payWithWallet(bookingId, req.user.id, pointsToRedeem);
    return apiResponse.success(res, result, result.message, 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiate,
  getByBooking,
  verify,
  webhook,
  getMyPayments,
  createRazorpayOrder,
  verifyRazorpay,
  payWithWallet
};
