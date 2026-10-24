const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../config/env');
const addressRepo = require('../repositories/address.repository');
const userRepo = require('../repositories/user.repository');
const notificationRepo = require('../repositories/notification.repository');
const { pool } = require('../config/database');
const apiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');

let rzpClient = null;
function getRazorpay() {
  if (!rzpClient && config.payment.razorpayKeyId && config.payment.razorpayKeySecret) {
    rzpClient = new Razorpay({
      key_id: config.payment.razorpayKeyId,
      key_secret: config.payment.razorpayKeySecret
    });
  }
  return rzpClient;
}

async function getAddresses(req, res, next) {
  try {
    const addresses = await addressRepo.findByUserId(req.user.id);
    return apiResponse.success(res, addresses, 'Addresses retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function createAddress(req, res, next) {
  try {
    const { label, address_line1, address_line2, city, state, pincode, latitude, longitude, is_default } = req.body;
    if (!address_line1 || !city || !state || !pincode) {
      throw AppError.badRequest('Please provide address line 1, city, state, and pincode');
    }

    const addressId = await addressRepo.create({
      user_id: req.user.id,
      label,
      address_line1,
      address_line2,
      city,
      state,
      pincode,
      latitude,
      longitude,
      is_default
    });

    const newAddress = await addressRepo.findById(addressId);
    return apiResponse.success(res, newAddress, 'Address created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function updateAddress(req, res, next) {
  try {
    const addressId = parseInt(req.params.id, 10);
    const affected = await addressRepo.update(addressId, req.user.id, req.body);
    if (!affected) {
      throw AppError.notFound('Address not found or unauthorized');
    }
    const updated = await addressRepo.findById(addressId);
    return apiResponse.success(res, updated, 'Address updated successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const addressId = parseInt(req.params.id, 10);
    const affected = await addressRepo.deleteAddress(addressId, req.user.id);
    if (!affected) {
      throw AppError.notFound('Address not found or unauthorized');
    }
    return apiResponse.success(res, null, 'Address deleted successfully');
  } catch (err) {
    next(err);
  }
}

async function setDefaultAddress(req, res, next) {
  try {
    const addressId = parseInt(req.params.id, 10);
    const affected = await addressRepo.setDefault(addressId, req.user.id);
    if (!affected) {
      throw AppError.notFound('Address not found or unauthorized');
    }
    return apiResponse.success(res, null, 'Default address updated successfully');
  } catch (err) {
    next(err);
  }
}

const INDIAN_STATES = [
  { code: 'AN', name: 'Andaman and Nicobar Islands' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: 'DL', name: 'Delhi (NCT)' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu and Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PY', name: 'Puducherry' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
];

async function getWallet(req, res, next) {
  try {
    const { pool } = require('../config/database');
    const [profile] = await pool.query(
      'SELECT wallet_balance, reward_points FROM customer_profiles WHERE user_id = ?',
      [req.user.id]
    );

    const [transactions] = await pool.query(
      `SELECT wt.*, b.booking_number, wc.claim_number 
       FROM wallet_transactions wt
       LEFT JOIN bookings b ON b.id = wt.booking_id
       LEFT JOIN warranty_claims wc ON wc.id = wt.claim_id
       WHERE wt.customer_id = ?
       ORDER BY wt.created_at DESC LIMIT 50`,
      [req.user.id]
    );

    const [pointsHistory] = await pool.query(
      `SELECT rph.*, b.booking_number 
       FROM reward_points_history rph
       LEFT JOIN bookings b ON b.id = rph.booking_id
       WHERE rph.customer_id = ?
       ORDER BY rph.created_at DESC LIMIT 50`,
      [req.user.id]
    );

    const balance = profile[0]?.wallet_balance || 0;
    const points = profile[0]?.reward_points || 0;
    // 5 points = ₹1 rule
    const pointsRupeesValue = Math.floor(points / 5);

    return apiResponse.success(res, {
      wallet_balance: Number(balance),
      reward_points: Number(points),
      reward_points_value: pointsRupeesValue,
      points_ratio: '5 points = ₹1',
      transactions: transactions || [],
      points_history: pointsHistory || []
    }, 'Wallet details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

async function topupWallet(req, res, next) {
  try {
    const { pool } = require('../config/database');
    const amount = parseFloat(req.body.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      throw AppError.badRequest('Please enter a valid top-up amount');
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        'UPDATE customer_profiles SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
        [amount, req.user.id]
      );

      const [updatedProfile] = await conn.query(
        'SELECT wallet_balance FROM customer_profiles WHERE user_id = ?',
        [req.user.id]
      );
      const newBal = updatedProfile[0]?.wallet_balance || amount;

      await conn.query(
        `INSERT INTO wallet_transactions (customer_id, amount, type, description, balance_after)
         VALUES (?, ?, 'CREDIT', ?, ?)`,
        [req.user.id, amount, `Wallet top-up (Instant Add)`, newBal]
      );

      await conn.commit();

      return apiResponse.success(res, {
        wallet_balance: Number(newBal),
        added_amount: amount
      }, `₹${amount.toFixed(2)} added to FixAround Wallet successfully!`);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}

async function createWalletRazorpayOrder(req, res, next) {
  try {
    const amount = parseFloat(req.body.amount);
    if (!amount || isNaN(amount) || amount < 10) {
      throw AppError.badRequest('Please enter a valid top-up amount (minimum ₹10)');
    }

    const rzp = getRazorpay();
    if (!rzp) {
      throw AppError.internal('Razorpay gateway is not configured on the server');
    }

    const user = await userRepo.findById(req.user.id);
    const amountInPaise = Math.round(amount * 100);
    const receipt = `rcpt_w_${req.user.id}_${Date.now()}`.slice(0, 40);

    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        customer_id: String(req.user.id),
        type: 'WALLET_TOPUP',
        customer_email: user?.email || '',
        customer_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      }
    });

    return apiResponse.success(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.payment.razorpayKeyId,
      customerName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Customer',
      customerEmail: user?.email || '',
      customerPhone: user?.phone || '',
      topupAmount: amount
    }, 'Razorpay wallet top-up order created', 201);
  } catch (err) {
    next(err);
  }
}

async function verifyWalletRazorpay(req, res, next) {
  try {
    const { amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 10) {
      throw AppError.badRequest('Invalid top-up amount');
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw AppError.badRequest('Missing Razorpay verification parameters');
    }

    // Verify HMAC-SHA256 signature
    const secret = config.payment.razorpayKeySecret;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw AppError.badRequest('Invalid Razorpay payment signature');
    }

    // Idempotency check: Ensure this payment hasn't already been credited
    const [existingTx] = await pool.query(
      `SELECT id FROM wallet_transactions WHERE customer_id = ? AND description LIKE ?`,
      [req.user.id, `%${razorpay_payment_id}%`]
    );
    if (existingTx.length > 0) {
      const [cp] = await pool.query(
        'SELECT wallet_balance FROM customer_profiles WHERE user_id = ?',
        [req.user.id]
      );
      return apiResponse.success(res, {
        wallet_balance: Number(cp[0]?.wallet_balance || 0),
        added_amount: numAmount,
        payment_id: razorpay_payment_id
      }, 'Wallet has already been credited for this payment');
    }

    const conn = await pool.getConnection();
    let newBal = 0;
    try {
      await conn.beginTransaction();

      await conn.query(
        'UPDATE customer_profiles SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
        [numAmount, req.user.id]
      );

      const [updatedProfile] = await conn.query(
        'SELECT wallet_balance FROM customer_profiles WHERE user_id = ?',
        [req.user.id]
      );
      newBal = updatedProfile[0]?.wallet_balance || numAmount;

      await conn.query(
        `INSERT INTO wallet_transactions (customer_id, amount, type, description, balance_after)
         VALUES (?, ?, 'CREDIT', ?, ?)`,
        [
          req.user.id,
          numAmount,
          `Wallet top-up via Razorpay (${razorpay_payment_id})`,
          newBal
        ]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    // Send confirmation notification to customer
    try {
      await notificationRepo.create({
        user_id: req.user.id,
        type: 'WALLET_CREDITED',
        title: 'Wallet Recharged Successfully!',
        message: `₹${numAmount.toFixed(2)} has been added to your FixAround Wallet via Razorpay. Your current balance is ₹${Number(newBal).toFixed(2)}.`,
        data: {
          amount: numAmount,
          balance_after: Number(newBal),
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id
        }
      });
    } catch (notifErr) {
      console.warn('Failed to send wallet topup notification:', notifErr.message);
    }

    return apiResponse.success(res, {
      wallet_balance: Number(newBal),
      added_amount: numAmount,
      payment_id: razorpay_payment_id
    }, `₹${numAmount.toFixed(2)} added to your FixAround Wallet via Razorpay!`);
  } catch (err) {
    next(err);
  }
}

async function getStates(req, res, next) {
  try {
    return apiResponse.success(res, { states: INDIAN_STATES }, 'States list retrieved successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWallet,
  topupWallet,
  createWalletRazorpayOrder,
  verifyWalletRazorpay,
  getStates,
  INDIAN_STATES
};
