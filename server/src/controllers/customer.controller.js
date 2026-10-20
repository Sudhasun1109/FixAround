const addressRepo = require('../repositories/address.repository');
const apiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');

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

async function getStates(req, res, next) {
  try {
    return apiResponse.success(res, INDIAN_STATES, 'States list retrieved successfully');
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
  getStates,
  INDIAN_STATES
};
