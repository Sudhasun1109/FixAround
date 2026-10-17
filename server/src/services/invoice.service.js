const invoiceRepo = require('../repositories/invoice.repository');
const paymentRepo = require('../repositories/payment.repository');
const bookingRepo = require('../repositories/booking.repository');
const estimateRepo = require('../repositories/estimate.repository');
const AppError = require('../utils/apiError');
const { generateInvoiceNumber } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

/**
 * Generate invoice for a completed payment
 * @param {number} paymentId
 */
async function generate(paymentId) {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) {
    throw AppError.notFound('Payment not found');
  }

  const booking = await bookingRepo.findById(payment.booking_id);
  if (!booking) {
    throw AppError.notFound('Associated booking not found');
  }

  // Check if invoice already exists
  const existing = await invoiceRepo.findByBookingId(booking.id);
  if (existing) {
    return existing;
  }

  // Look for approved estimate for line item breakdown
  const estimates = await estimateRepo.findByBookingId(booking.id);
  const approvedEstimate = estimates.find((e) => e.status === 'APPROVED');

  let lineItems = [];
  if (approvedEstimate) {
    if (parseFloat(approvedEstimate.labor_charge) > 0) {
      lineItems.push({ description: 'Labor Charges', amount: approvedEstimate.labor_charge });
    }
    if (parseFloat(approvedEstimate.material_charge) > 0) {
      lineItems.push({ description: 'Materials & Parts', amount: approvedEstimate.material_charge });
    }
    if (parseFloat(approvedEstimate.inspection_charge) > 0) {
      lineItems.push({ description: 'Inspection Fee', amount: approvedEstimate.inspection_charge });
    }
    if (parseFloat(approvedEstimate.additional_charge) > 0) {
      lineItems.push({ description: 'Additional Charges', amount: approvedEstimate.additional_charge });
    }
  }

  if (lineItems.length === 0) {
    lineItems.push({
      description: `${booking.category_name || 'Repair'} Service - ${booking.title}`,
      amount: payment.amount
    });
  }

  const invoiceNumber = generateInvoiceNumber();
  const invoiceId = await invoiceRepo.create({
    invoice_number: invoiceNumber,
    booking_id: booking.id,
    customer_id: booking.customer_id,
    technician_id: booking.technician_id,
    payment_id: paymentId,
    subtotal: payment.amount,
    tax_amount: '0.00',
    total_amount: payment.amount,
    line_items: lineItems,
    status: 'PAID'
  });

  return await invoiceRepo.findById(invoiceId);
}

/**
 * Get invoice by ID with authorization verification
 * @param {number} invoiceId
 * @param {Object} currentUser
 */
async function getById(invoiceId, currentUser) {
  const invoice = await invoiceRepo.findById(invoiceId);
  if (!invoice) {
    throw AppError.notFound('Invoice not found');
  }

  if (currentUser.role === ROLES.ADMIN) {
    return invoice;
  }

  if (currentUser.role === ROLES.CUSTOMER && invoice.customer_id === currentUser.id) {
    return invoice;
  }

  if (currentUser.role === ROLES.TECHNICIAN && invoice.technician_id === currentUser.id) {
    return invoice;
  }

  throw AppError.forbidden('You are not authorized to view this invoice');
}

/**
 * Get all invoices for a customer
 * @param {number} customerId
 * @param {Object} options
 */
async function getByCustomer(customerId, options = {}) {
  return await invoiceRepo.findByCustomerId(customerId, options);
}

/**
 * Get invoice for a specific booking
 * @param {number} bookingId
 * @param {Object} currentUser
 */
async function getByBooking(bookingId, currentUser) {
  const invoice = await invoiceRepo.findByBookingId(bookingId);
  if (!invoice) {
    throw AppError.notFound('Invoice not yet generated for this booking');
  }

  if (currentUser.role === ROLES.ADMIN) {
    return invoice;
  }

  if (currentUser.role === ROLES.CUSTOMER && invoice.customer_id === currentUser.id) {
    return invoice;
  }

  if (currentUser.role === ROLES.TECHNICIAN && invoice.technician_id === currentUser.id) {
    return invoice;
  }

  throw AppError.forbidden('You are not authorized to view this invoice');
}

module.exports = {
  generate,
  getById,
  getByCustomer,
  getByBooking
};
