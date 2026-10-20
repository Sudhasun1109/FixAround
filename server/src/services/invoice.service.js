const { pool } = require('../config/database');
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
    // If existing invoice was ISSUED, mark it PAID with payment_id
    if (existing.status !== 'PAID') {
      await pool.query(
        'UPDATE invoices SET status = "PAID", payment_id = ? WHERE id = ?',
        [paymentId, existing.id]
      );
      return await invoiceRepo.findById(existing.id);
    }
    return existing;
  }

  // Look for approved estimate for line item breakdown
  const estimates = await estimateRepo.findByBookingId(booking.id);
  const approvedEstimate = estimates.find((e) => e.status === 'APPROVED') || estimates[0];

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
      description: `${booking.service_name || booking.category_name || 'Repair'} Service - ${booking.title || 'Standard Service'}`,
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
 * Generate or get invoice for a booking (before or after payment)
 * @param {number} bookingId
 */
async function generateForBooking(bookingId) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Associated booking not found');
  }

  // Check if invoice already exists
  const existing = await invoiceRepo.findByBookingId(booking.id);
  if (existing) {
    return existing;
  }

  // Look for approved or latest estimate for line item breakdown
  const estimates = await estimateRepo.findByBookingId(booking.id);
  const activeEstimate = estimates.find((e) => e.status === 'APPROVED') || estimates[0];

  let lineItems = [];
  let subtotal = 0;

  if (activeEstimate) {
    if (parseFloat(activeEstimate.labor_charge) > 0) {
      lineItems.push({ description: 'Labor Charges', amount: activeEstimate.labor_charge });
    }
    if (parseFloat(activeEstimate.material_charge) > 0) {
      lineItems.push({ description: 'Materials & Parts', amount: activeEstimate.material_charge });
    }
    if (parseFloat(activeEstimate.inspection_charge) > 0) {
      lineItems.push({ description: 'Inspection Fee', amount: activeEstimate.inspection_charge });
    }
    if (parseFloat(activeEstimate.additional_charge) > 0) {
      lineItems.push({ description: 'Additional Charges', amount: activeEstimate.additional_charge });
    }
    subtotal = parseFloat(activeEstimate.total_estimate);
  }

  if (lineItems.length === 0) {
    const defaultAmount = parseFloat(booking.final_total || booking.estimated_total || 500);
    lineItems.push({
      description: `${booking.service_name || booking.category_name || 'Repair'} Service - ${booking.title || 'Standard Service'}`,
      amount: defaultAmount.toFixed(2)
    });
    subtotal = defaultAmount;
  }

  // Check if a successful payment already exists for this booking
  const [payments] = await pool.query(
    'SELECT * FROM payments WHERE booking_id = ? AND status = "SUCCESS" ORDER BY id DESC LIMIT 1',
    [booking.id]
  );
  const paidPayment = payments[0] || null;

  const invoiceNumber = generateInvoiceNumber();
  const invoiceId = await invoiceRepo.create({
    invoice_number: invoiceNumber,
    booking_id: booking.id,
    customer_id: booking.customer_id,
    technician_id: booking.technician_id,
    payment_id: paidPayment ? paidPayment.id : null,
    subtotal: subtotal.toFixed(2),
    tax_amount: '0.00',
    total_amount: subtotal.toFixed(2),
    line_items: lineItems,
    status: paidPayment ? 'PAID' : 'ISSUED'
  });

  return await invoiceRepo.findById(invoiceId);
}

/**
 * Get invoice by ID with authorization verification
 * @param {number} invoiceId
 * @param {Object} currentUser
 */
async function getById(invoiceId, currentUser) {
  let invoice = await invoiceRepo.findById(invoiceId);
  if (!invoice) {
    // If not found by invoice ID, check if this is a booking ID
    invoice = await invoiceRepo.findByBookingId(invoiceId);
    if (!invoice) {
      try {
        invoice = await generateForBooking(invoiceId);
      } catch {
        // Ignored
      }
    }
  }

  if (!invoice) {
    throw AppError.notFound('Invoice not found');
  }

  const role = currentUser.role?.toLowerCase();
  const userId = Number(currentUser.id);

  if (role === 'admin' || role === ROLES.ADMIN) {
    return invoice;
  }

  if ((role === 'customer' || role === ROLES.CUSTOMER) && Number(invoice.customer_id) === userId) {
    return invoice;
  }

  if ((role === 'technician' || role === ROLES.TECHNICIAN) && Number(invoice.technician_id) === userId) {
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
  let invoice = await invoiceRepo.findByBookingId(bookingId);
  if (!invoice) {
    try {
      invoice = await generateForBooking(bookingId);
    } catch {
      // Ignored
    }
  }

  if (!invoice) {
    throw AppError.notFound('Invoice not yet generated for this booking');
  }

  const role = currentUser.role?.toLowerCase();
  const userId = Number(currentUser.id);

  if (role === 'admin' || role === ROLES.ADMIN) {
    return invoice;
  }

  if ((role === 'customer' || role === ROLES.CUSTOMER) && Number(invoice.customer_id) === userId) {
    return invoice;
  }

  if ((role === 'technician' || role === ROLES.TECHNICIAN) && Number(invoice.technician_id) === userId) {
    return invoice;
  }

  throw AppError.forbidden('You are not authorized to view this invoice');
}

module.exports = {
  generate,
  generateForBooking,
  getById,
  getByCustomer,
  getByBooking
};
