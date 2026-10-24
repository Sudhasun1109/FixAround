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
const Razorpay = require('razorpay');

let stripeClient;
let razorpayClient;

function getRazorpayClient() {
  if (!config.payment.razorpayKeyId || !config.payment.razorpayKeySecret) {
    throw new Error('Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: config.payment.razorpayKeyId,
      key_secret: config.payment.razorpayKeySecret,
    });
  }

  return razorpayClient;
}

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

    // 2. Update existing Invoice or generate new if none exists
    const [existingInv] = await conn.query('SELECT id FROM invoices WHERE booking_id = ? ORDER BY id DESC LIMIT 1', [booking.id]);
    if (existingInv.length > 0) {
      await conn.query('UPDATE invoices SET status = "PAID", payment_id = ? WHERE booking_id = ?', [paymentId, booking.id]);
    } else {
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

        // Increment completed_jobs. Earnings remain PENDING until Admin verifies & settles
        await conn.query(
          `UPDATE technician_profiles 
           SET completed_jobs = completed_jobs + 1
           WHERE user_id = ?`,
          [booking.technician_id]
        );
      }
    }

    // 4. Award 20 loyalty reward points to customer for completing the job
    if (booking.customer_id) {
      await conn.query(
        `UPDATE customer_profiles 
         SET reward_points = reward_points + 20 
         WHERE user_id = ?`,
        [booking.customer_id]
      );

      const [cProf] = await conn.query(
        'SELECT reward_points FROM customer_profiles WHERE user_id = ?',
        [booking.customer_id]
      );
      const newPts = cProf[0]?.reward_points || 20;

      await conn.query(
        `INSERT INTO reward_points_history 
         (customer_id, booking_id, points, type, description, balance_after)
         VALUES (?, ?, 20, 'EARNED', ?, ?)`,
        [
          booking.customer_id,
          booking.id,
          `Earned 20 Reward Points for service #${booking.booking_number}`,
          newPts
        ]
      );
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
 * Create a Razorpay Order for a booking
 * @param {number} bookingId
 * @param {number} customerId
 * @param {number} [customAmount=null]
 */
async function createRazorpayOrder(bookingId, customerId, customAmount = null) {
  const rzp = getRazorpayClient();
  const booking = await bookingRepo.findById(bookingId);

  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (Number(booking.customer_id) !== Number(customerId)) {
    throw AppError.forbidden('You are not authorized to pay for this booking');
  }

  let amount = customAmount || booking.final_total || booking.estimated_total || 500;
  amount = parseFloat(amount);
  if (amount <= 0) {
    throw AppError.badRequest('Payment amount must be greater than zero');
  }

  const amountInPaise = Math.round(amount * 100);
  const paymentNumber = generatePaymentNumber();

  // Create payment record in DB
  const paymentId = await paymentRepo.create({
    payment_number: paymentNumber,
    booking_id: bookingId,
    customer_id: customerId,
    amount: amount.toFixed(2),
    payment_method: 'RAZORPAY',
    status: PAYMENT_STATUSES.INITIATED,
    is_sandbox: 1
  });

  const receipt = `rcpt_${booking.id}_${paymentId}`.slice(0, 40);

  const order = await rzp.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      booking_id: String(booking.id),
      booking_number: booking.booking_number,
      customer_id: String(customerId)
    }
  });

  // Save gateway_order_id
  await paymentRepo.updateStatus(paymentId, PAYMENT_STATUSES.INITIATED, {
    gateway_order_id: order.id,
    gateway_response: order
  });

  return {
    orderId: order.id,
    amount: order.amount, // in paise
    currency: order.currency,
    keyId: config.payment.razorpayKeyId,
    paymentId,
    paymentNumber,
    bookingNumber: booking.booking_number,
    customerName: booking.customer_name || `${booking.customer_first_name || ''} ${booking.customer_last_name || ''}`.trim() || 'Customer',
    customerEmail: booking.customer_email || '',
    customerPhone: booking.customer_phone || ''
  };
}

/**
 * Verify Razorpay payment signature
 * @param {Object} data
 * @param {number} customerId
 */
async function verifyRazorpayPayment(data, customerId) {
  const { booking_id, payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  const payment = await paymentRepo.findById(payment_id);
  if (!payment) {
    throw AppError.notFound('Payment record not found');
  }

  if (Number(payment.customer_id) !== Number(customerId)) {
    throw AppError.forbidden('You are not authorized to verify this payment');
  }

  // Verify HMAC signature
  const secret = config.payment.razorpayKeySecret;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw AppError.badRequest('Invalid payment signature verification failed');
  }

  // Update payment status to SUCCESS
  await paymentRepo.updateStatus(payment.id, PAYMENT_STATUSES.SUCCESS, {
    gateway_payment_id: razorpay_payment_id,
    gateway_order_id: razorpay_order_id,
    gateway_signature: razorpay_signature,
    gateway_response: {
      status: 'captured',
      razorpay_payment_id,
      razorpay_order_id
    }
  });

  await processPaymentSuccess(payment.id);

  const updatedPayment = await paymentRepo.findById(payment.id);

  return {
    payment: updatedPayment,
    message: 'Razorpay payment verified successfully'
  };
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

/**
 * Customer pays booking invoice directly from FixAround Wallet
 * Can optionally redeem reward points (5 points = ₹1)
 * @param {number} bookingId
 * @param {number} customerId
 * @param {number} [pointsToRedeem=0]
 */
async function payWithWallet(bookingId, customerId, pointsToRedeem = 0) {
  const booking = await bookingRepo.findById(bookingId);
  if (!booking) {
    throw AppError.notFound('Booking not found');
  }

  if (Number(booking.customer_id) !== Number(customerId)) {
    throw AppError.forbidden('You are not authorized to pay for this booking');
  }

  // Calculate gross amount
  const [invoices] = await pool.query('SELECT * FROM invoices WHERE booking_id = ? ORDER BY id DESC LIMIT 1', [bookingId]);
  const invoice = invoices[0];
  let rawAmount = invoice ? parseFloat(invoice.total_amount) : parseFloat(booking.final_total || booking.estimated_total || 500);

  // Check customer profile for wallet and reward points
  const [profiles] = await pool.query(
    'SELECT wallet_balance, reward_points FROM customer_profiles WHERE user_id = ?',
    [customerId]
  );
  const profile = profiles[0] || { wallet_balance: 0, reward_points: 0 };
  const currentWallet = parseFloat(profile.wallet_balance || 0);
  const currentPoints = parseInt(profile.reward_points || 0, 10);

  // Calculate points redemption: 5 points = ₹1
  let pointsUsed = 0;
  let pointsDiscount = 0;
  if (pointsToRedeem > 0) {
    pointsUsed = Math.min(Number(pointsToRedeem), currentPoints);
    pointsDiscount = Math.floor(pointsUsed / 5);
    if (pointsDiscount > rawAmount) {
      pointsDiscount = Math.floor(rawAmount);
      pointsUsed = pointsDiscount * 5;
    }
  }

  const finalPayable = Math.max(0, Math.round((rawAmount - pointsDiscount) * 100) / 100);

  if (currentWallet < finalPayable) {
    throw AppError.badRequest(
      `Insufficient wallet balance (₹${currentWallet.toFixed(2)}). Total payable is ₹${finalPayable.toFixed(2)}.`
    );
  }

  const conn = await pool.getConnection();
  let paymentId = null;
  try {
    await conn.beginTransaction();

    // 1. Deduct wallet
    if (finalPayable > 0) {
      await conn.query(
        'UPDATE customer_profiles SET wallet_balance = wallet_balance - ? WHERE user_id = ?',
        [finalPayable, customerId]
      );
    }

    // 2. Deduct points if any
    if (pointsUsed > 0) {
      await conn.query(
        'UPDATE customer_profiles SET reward_points = reward_points - ? WHERE user_id = ?',
        [pointsUsed, customerId]
      );

      const [pRes] = await conn.query('SELECT reward_points FROM customer_profiles WHERE user_id = ?', [customerId]);
      const ptsAfter = pRes[0]?.reward_points || 0;

      await conn.query(
        `INSERT INTO reward_points_history (customer_id, booking_id, points, type, description, balance_after)
         VALUES (?, ?, ?, 'REDEEMED', ?, ?)`,
        [customerId, bookingId, pointsUsed, `Redeemed ${pointsUsed} pts for ₹${pointsDiscount} discount on #${booking.booking_number}`, ptsAfter]
      );
    }

    // 3. Get updated wallet balance
    const [wRes] = await conn.query('SELECT wallet_balance FROM customer_profiles WHERE user_id = ?', [customerId]);
    const walletAfter = wRes[0]?.wallet_balance || 0;

    // 4. Log wallet transaction
    if (finalPayable > 0) {
      await conn.query(
        `INSERT INTO wallet_transactions (customer_id, booking_id, amount, type, description, balance_after)
         VALUES (?, ?, ?, 'DEBIT', ?, ?)`,
        [customerId, bookingId, finalPayable, `Paid for repair service #${booking.booking_number}`, walletAfter]
      );
    }

    // 5. Create Payment record with 'WALLET' method
    const paymentNumber = generatePaymentNumber();
    const [payResult] = await conn.query(
      `INSERT INTO payments (
        payment_number, booking_id, customer_id, amount, payment_method, status, is_sandbox, paid_at
      ) VALUES (?, ?, ?, ?, 'WALLET', 'SUCCESS', 0, UTC_TIMESTAMP())`,
      [paymentNumber, bookingId, customerId, rawAmount]
    );
    paymentId = payResult.insertId;

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // 6. Complete booking, generate invoice, award 20 new reward points
  await processPaymentSuccess(paymentId);

  return {
    success: true,
    payment_id: paymentId,
    amount_paid: finalPayable,
    points_redeemed: pointsUsed,
    points_discount: pointsDiscount,
    points_earned: 20,
    message: `Payment of ₹${finalPayable} completed using FixAround Wallet! You earned 20 Reward Points.`
  };
}

module.exports = {
  initiate,
  createRazorpayOrder,
  verifyRazorpayPayment,
  verifySandboxPayment,
  payWithWallet,
  handleWebhook,
  processPaymentSuccess,
  getByBooking,
  getByCustomer
};
