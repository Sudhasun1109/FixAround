const crypto = require('crypto');
const paymentRepo = require('../repositories/payment.repository');
const bookingRepo = require('../repositories/booking.repository');
const notificationRepo = require('../repositories/notification.repository');
const settingsRepo = require('../repositories/settings.repository');
const invoiceRepo = require('../repositories/invoice.repository');
const earningsRepo = require('../repositories/earnings.repository');
const AppError = require('../utils/apiError');
const config = require('../config/env');
const { generatePaymentNumber, generateInvoiceNumber } = require('../utils/helpers');
const { BOOKING_STATUSES, PAYMENT_STATUSES } = require('../utils/constants');
const { pool } = require('../config/database');


const Stripe = require('stripe');

let stripeClient;

function getStripeClient() {
  if (!config.payment.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(config.payment.stripeSecretKey);
  }

  return stripeClient;
}

/**
 * Initiate payment for a booking
 * @param {number} bookingId
 * @param {number} customerId
 * @param {string} [method='ONLINE']
 * @param {number} [customAmount=null]
 */
async function initiate(bookingId, customerId, method = 'ONLINE', customAmount = null) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (booking.customer_id !== customerId) {
    throw AppError.forbidden('You are not authorized to pay for this booking');
  }

  // Calculate amount to pay
  let amount = customAmount;
  if (!amount) {
    amount = booking.final_total || booking.estimated_total || 0.00;
  }
  amount = parseFloat(amount);

  if (amount <= 0) {
    throw AppError.badRequest('Payment amount must be greater than zero');
  }

  const paymentNumber = generatePaymentNumber();
  const isSandbox = config.env !== 'production' || method === 'SANDBOX';

  const paymentId = await paymentRepo.create({
    payment_number: paymentNumber,
    booking_id: bookingId,
    customer_id: customerId,
    amount: amount.toFixed(2),
    payment_method: method,
    status: PAYMENT_STATUSES.INITIATED,
    is_sandbox: isSandbox ? 1 : 0
  });

  const paymentObj = {
    id: paymentId,
    paymentId,
    paymentNumber,
    amount: amount.toFixed(2),
    paymentMethod: method,
    isSandbox,
    currency: 'INR',
    bookingNumber: booking.booking_number
  };

  return {
    ...paymentObj,
    payment: paymentObj
  };
}

/**
 * Create Stripe Checkout Session for a booking
 */
async function createStripeCheckout(bookingId, customerId) {
  const stripe = getStripeClient();

  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (Number(booking.customer_id) !== Number(customerId)) {
    throw AppError.forbidden(
      'You are not authorized to pay for this booking'
    );
  }

  const amount = Number(
    booking.final_total || booking.estimated_total || 0
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    throw AppError.badRequest(
      'Payment amount must be greater than zero'
    );
  }

  const amountInPaise = Math.round(amount * 100);

  if (amountInPaise < 1) {
    throw AppError.badRequest('Invalid payment amount');
  }

  const paymentNumber = generatePaymentNumber();

  const paymentId = await paymentRepo.create({
    payment_number: paymentNumber,
    booking_id: bookingId,
    customer_id: customerId,
    amount: amount.toFixed(2),
    payment_method: 'STRIPE',
    status: PAYMENT_STATUSES.INITIATED,
    is_sandbox: config.env !== 'production' ? 1 : 0
  });

  try {
    const clientUrl = config.clientUrl;

    if (!clientUrl) {
      throw new Error('Client URL is not configured');
    }

    const baseUrl = clientUrl.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: booking.title || 'FixAround Service Booking',
              description: `Booking #${booking.booking_number || bookingId}`
            },
            unit_amount: amountInPaise
          },
          quantity: 1
        }
      ],

      client_reference_id: String(paymentId),

      metadata: {
        paymentId: String(paymentId),
        paymentNumber: String(paymentNumber),
        bookingId: String(bookingId),
        customerId: String(customerId)
      },

      payment_intent_data: {
        metadata: {
          paymentId: String(paymentId),
          bookingId: String(bookingId)
        }
      },

      success_url:
        `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${baseUrl}/payment/cancel?payment_id=${encodeURIComponent(String(paymentId))}`
    });

    await paymentRepo.updateStatus(
      paymentId,
      PAYMENT_STATUSES.INITIATED,
      {
        gateway_order_id: session.id,
        gateway_response: {
          gateway: 'stripe',
          checkout_session_id: session.id
        }
      }
    );

    return {
      paymentId,
      paymentNumber,
      bookingId,
      amount: amount.toFixed(2),
      currency: 'INR',
      checkoutUrl: session.url,
      sessionId: session.id
    };
  } catch (error) {
    console.error(
      `[Stripe Checkout Error] paymentId ${paymentId}:`,
      error.message
    );

    throw error;
  }
}

/**
 * Handle payment gateway webhook
 * @param {Object} payload
 * @param {string} signature
 */

/**
 * Verify / Simulate sandbox payment in development mode
 * @param {number} paymentId
 * @param {number} customerId
 */
async function verifySandboxPayment(paymentId, customerId) {
  const payment = await paymentRepo.findById(paymentId);

  if (!payment) {
    throw AppError.notFound('Payment record not found');
  }

  if (Number(payment.customer_id) !== Number(customerId)) {
    throw AppError.forbidden(
      'You are not authorized to verify this payment'
    );
  }

  if (payment.status === PAYMENT_STATUSES.SUCCESS) {
    return {
      payment,
      message: 'Payment is already marked as successful'
    };
  }

  const gatewayPaymentId =
    `sb_pay_${crypto.randomBytes(8).toString('hex')}`;

  const gatewayOrderId =
    `sb_ord_${crypto.randomBytes(8).toString('hex')}`;

  await paymentRepo.updateStatus(
    paymentId,
    PAYMENT_STATUSES.SUCCESS,
    {
      gateway_payment_id: gatewayPaymentId,
      gateway_order_id: gatewayOrderId,
      gateway_signature: 'sandbox_signature_verified',
      gateway_response: {
        status: 'captured',
        method: payment.payment_method,
        sandbox: true
      }
    }
  );

  await processPaymentSuccess(paymentId);

  const updatedPayment = await paymentRepo.findById(paymentId);

  return {
    payment: updatedPayment,
    message: 'Sandbox payment verified successfully'
  };
}

async function handleWebhook(payload, signature) {
  // Validate signature if secret provided
  if (config.payment.stripeWebhookSecret && signature) {
    const expectedSig = crypto
      .createHmac('sha256', config.payment.stripeWebhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (expectedSig !== signature) {
      throw AppError.unauthorized('Invalid webhook signature');
    }
  }

  const paymentNumber = payload.payment_number || (payload.data && payload.data.payment_number);
  if (!paymentNumber) {
    return { received: true, note: 'No payment identifier found in payload' };
  }

  const [rows] = await pool.query('SELECT id, status FROM payments WHERE payment_number = ? LIMIT 1', [paymentNumber]);
  if (rows.length === 0) {
    return { received: true, note: 'Payment record not found' };
  }

  const payment = rows[0];
  if (payment.status !== PAYMENT_STATUSES.SUCCESS) {
    await paymentRepo.updateStatus(payment.id, PAYMENT_STATUSES.SUCCESS, {
      gateway_response: payload
    });
    await processPaymentSuccess(payment.id);
  }

  return { received: true, success: true };
}

/**
 * Process downstream records after successful payment
 * Generates invoice, calculates platform commission, records technician earnings
 * @param {number} paymentId
 */
async function processPaymentSuccess(paymentId) {
  const payment = await paymentRepo.findById(paymentId);
  if (!payment) return;

  const booking = await bookingRepo.findById(payment.booking_id);
  if (!booking) return;

  const commissionRate = (await settingsRepo.get('platform_commission_percent')) || config.platform.commissionPercent;
  const grossAmount = parseFloat(payment.amount);
  const commissionAmount = parseFloat(((grossAmount * commissionRate) / 100).toFixed(2));
  const netTechnicianPayout = parseFloat((grossAmount - commissionAmount).toFixed(2));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Update booking
    await conn.query(
      `UPDATE bookings 
       SET status = 'COMPLETED',
           completed_at = IFNULL(completed_at, UTC_TIMESTAMP()),
           final_total = ?, 
           commission_amount = ?, 
           technician_payout = ? 
       WHERE id = ?`,
      [grossAmount.toFixed(2), commissionAmount.toFixed(2), netTechnicianPayout.toFixed(2), booking.id]
    );

    // Audit status change
    await conn.query(
      `INSERT INTO booking_status_history 
       (booking_id, from_status, to_status, actor_role, notes)
       VALUES (?, ?, 'COMPLETED', 'system', 'Completed upon successful payment')`,
      [booking.id, booking.status]
    );

    // 2. Generate Invoice if not exists
    const [existingInv] = await conn.query('SELECT id FROM invoices WHERE payment_id = ? LIMIT 1', [paymentId]);
    if (existingInv.length === 0) {
      const invoiceNumber = generateInvoiceNumber();
      const lineItems = [
        {
          description: booking.title || 'Service Charge',
          amount: grossAmount.toFixed(2)
        }
      ];

      await invoiceRepo.create({
        invoice_number: invoiceNumber,
        booking_id: booking.id,
        customer_id: booking.customer_id,
        technician_id: booking.technician_id,
        payment_id: paymentId,
        subtotal: grossAmount.toFixed(2),
        tax_amount: '0.00',
        total_amount: grossAmount.toFixed(2),
        line_items: lineItems,
        status: 'PAID'
      }, conn);
    }

    // 3. Record technician earnings if technician assigned
    if (booking.technician_id) {
      const alreadyEarned = await earningsRepo.checkExists(booking.id, conn);
      if (!alreadyEarned) {
        await earningsRepo.create({
          technician_id: booking.technician_id,
          booking_id: booking.id,
          payment_id: paymentId,
          gross_amount: grossAmount.toFixed(2),
          commission_rate: commissionRate.toFixed(2),
          commission_amount: commissionAmount.toFixed(2),
          net_amount: netTechnicianPayout.toFixed(2),
          settlement_status: 'PENDING',
          notes: `Booking #${booking.booking_number} completed payment`
        }, conn);

        // Update technician total_earnings & completed_jobs in technician_profiles
        await conn.query(
          `UPDATE technician_profiles 
           SET total_earnings = total_earnings + ?,
               completed_jobs = completed_jobs + 1
           WHERE user_id = ?`,
          [netTechnicianPayout.toFixed(2), booking.technician_id]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error(`[Payment Processing Error] for paymentId ${paymentId}:`, err);
    throw err;
  } finally {
    conn.release();
  }

  // Send notifications
  await notificationRepo.create({
    user_id: booking.customer_id,
    type: 'PAYMENT_SUCCESS',
    title: 'Payment Successful',
    message: `Payment of ₹${grossAmount.toFixed(2)} for booking #${booking.booking_number} was successful. Invoice has been generated.`,
    data: { bookingId: booking.id, paymentId }
  });

  if (booking.technician_id) {
    await notificationRepo.create({
      user_id: booking.technician_id,
      type: 'EARNINGS_CREDITED',
      title: 'Payment Received',
      message: `You earned ₹${netTechnicianPayout.toFixed(2)} for completing booking #${booking.booking_number}.`,
      data: { bookingId: booking.id, payout: netTechnicianPayout }
    });
  }
}

/**
 * Get payments for a booking
 * @param {number} bookingId
 */
async function getByBooking(bookingId) {
  return await paymentRepo.findByBookingId(bookingId);
}

/**
 * Get payments made by customer
 * @param {number} customerId
 * @param {Object} options
 */
async function getByCustomer(customerId, options = {}) {
  return await paymentRepo.findByCustomerId(customerId, options);
}

module.exports = {
  initiate,
  verifySandboxPayment,
  handleWebhook,
  processPaymentSuccess,
  getByBooking,
  getByCustomer
};
