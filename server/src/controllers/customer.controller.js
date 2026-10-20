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

async function getWallet(req, res, next) {
  try {
    const { pool } = require('../config/database');
    const [profile] = await pool.query(
      'SELECT wallet_balance FROM customer_profiles WHERE user_id = ?',
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

    const balance = profile[0]?.wallet_balance || 0;
    return apiResponse.success(res, {
      wallet_balance: Number(balance),
      transactions: transactions || []
    }, 'Wallet details retrieved successfully');
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
  getWallet
};
