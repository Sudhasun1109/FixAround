const { pool } = require('../config/database');
const AppError = require('../utils/apiError');

const COMMISSION_RATE = 15.00; // 15% platform commission

/**
 * Get or initialize technician wallet
 * @param {number} technicianId - user_id of technician
 * @param {Object} [conn] - optional MySQL connection
 */
async function getOrCreateWallet(technicianId, conn = pool) {
  const [rows] = await conn.query(
    'SELECT * FROM technician_wallets WHERE technician_id = ? LIMIT 1',
    [technicianId]
  );

  if (rows && rows.length > 0) {
    return rows[0];
  }

  // Initialize wallet row
  await conn.query(
    `INSERT INTO technician_wallets 
     (technician_id, available_balance, outstanding_commission, total_cash_collected, total_online_earnings, total_commission_paid)
     VALUES (?, 0.00, 0.00, 0.00, 0.00, 0.00)
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [technicianId]
  );

  const [created] = await conn.query(
    'SELECT * FROM technician_wallets WHERE technician_id = ? LIMIT 1',
    [technicianId]
  );
  return created[0];
}

/**
 * Record a Cash Payment (Scenario A)
 * Technician collects cash directly. 15% commission added to outstanding liability.
 * @param {Object} params
 * @param {number} params.bookingId
 * @param {number} params.technicianId
 * @param {number} params.grossAmount
 * @param {string} [params.bookingNumber]
 * @param {Object} [conn]
 */
async function recordCashPayment({ bookingId, technicianId, grossAmount, bookingNumber }, conn = pool) {
  const gross = parseFloat(grossAmount);
  if (isNaN(gross) || gross <= 0) {
    throw AppError.badRequest('Invalid gross amount for cash payment');
  }

  const commissionAmount = +(gross * (COMMISSION_RATE / 100)).toFixed(2);

  // Lock wallet row for update
  await getOrCreateWallet(technicianId, conn);
  const [locked] = await conn.query(
    'SELECT * FROM technician_wallets WHERE technician_id = ? FOR UPDATE',
    [technicianId]
  );
  const wallet = locked[0];

  const prevOutstanding = parseFloat(wallet.outstanding_commission) || 0;
  const prevCash = parseFloat(wallet.total_cash_collected) || 0;
  const prevAvail = parseFloat(wallet.available_balance) || 0;

  const newOutstanding = +(prevOutstanding + commissionAmount).toFixed(2);
  const newCash = +(prevCash + gross).toFixed(2);

  // Update wallet
  await conn.query(
    `UPDATE technician_wallets 
     SET outstanding_commission = ?, total_cash_collected = ?, updated_at = CURRENT_TIMESTAMP
     WHERE technician_id = ?`,
    [newOutstanding, newCash, technicianId]
  );

  const bRef = bookingNumber ? `#${bookingNumber}` : `ID ${bookingId}`;
  const description = `Cash collected ₹${gross.toFixed(2)} for booking ${bRef}. Platform commission (15%) of ₹${commissionAmount.toFixed(2)} added to outstanding liability.`;

  // Insert ledger transaction
  const [txResult] = await conn.query(
    `INSERT INTO technician_wallet_transactions
     (technician_id, booking_id, transaction_type, payment_method, gross_amount, commission_rate, 
      commission_amount, previous_outstanding, commission_deducted, net_amount, new_outstanding, 
      new_available_balance, description)
     VALUES (?, ?, 'CASH_COLLECTED', 'CASH', ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?)`,
    [
      technicianId,
      bookingId,
      gross,
      COMMISSION_RATE,
      commissionAmount,
      prevOutstanding,
      newOutstanding,
      prevAvail,
      description
    ]
  );

  return {
    transactionId: txResult.insertId,
    technicianId,
    bookingId,
    grossAmount: gross,
    commissionRate: COMMISSION_RATE,
    commissionAmount,
    previousOutstanding: prevOutstanding,
    commissionDeducted: 0,
    netPayable: 0,
    newOutstanding,
    availableBalance: prevAvail
  };
}

/**
 * Record an Online Payment (Scenario B)
 * Platform receives payment online. Deducts 15% current commission PLUS any prior outstanding cash commission.
 * Remaining funds credited to technician available balance. Outstanding commission cleared.
 * @param {Object} params
 * @param {number} params.bookingId
 * @param {number} params.technicianId
 * @param {number} params.grossAmount
 * @param {string} [params.bookingNumber]
 * @param {Object} [conn]
 */
async function recordOnlinePayment({ bookingId, technicianId, grossAmount, bookingNumber }, conn = pool) {
  const gross = parseFloat(grossAmount);
  if (isNaN(gross) || gross <= 0) {
    throw AppError.badRequest('Invalid gross amount for online payment');
  }

  const currentCommission = +(gross * (COMMISSION_RATE / 100)).toFixed(2);

  // Lock wallet row for update
  await getOrCreateWallet(technicianId, conn);
  const [locked] = await conn.query(
    'SELECT * FROM technician_wallets WHERE technician_id = ? FOR UPDATE',
    [technicianId]
  );
  const wallet = locked[0];

  const prevOutstanding = parseFloat(wallet.outstanding_commission) || 0;
  const prevAvail = parseFloat(wallet.available_balance) || 0;
  const prevOnline = parseFloat(wallet.total_online_earnings) || 0;
  const prevPaid = parseFloat(wallet.total_commission_paid) || 0;

  // Total liability to collect from this payout: current 15% + prior outstanding
  const totalLiability = +(currentCommission + prevOutstanding).toFixed(2);

  // Commission deducted from this payout (cannot exceed gross payment)
  const commissionDeducted = Math.min(gross, totalLiability);
  const netPayout = +(gross - commissionDeducted).toFixed(2);

  // Remaining outstanding liability (0 if full liability was covered by gross)
  const newOutstanding = +(totalLiability - commissionDeducted).toFixed(2);
  const newAvail = +(prevAvail + netPayout).toFixed(2);
  const newOnline = +(prevOnline + gross).toFixed(2);
  const newPaid = +(prevPaid + commissionDeducted).toFixed(2);

  // Update wallet
  await conn.query(
    `UPDATE technician_wallets 
     SET available_balance = ?, outstanding_commission = ?, total_online_earnings = ?, 
         total_commission_paid = ?, updated_at = CURRENT_TIMESTAMP
     WHERE technician_id = ?`,
    [newAvail, newOutstanding, newOnline, newPaid, technicianId]
  );

  const priorCleared = +(commissionDeducted - currentCommission).toFixed(2);
  const bRef = bookingNumber ? `#${bookingNumber}` : `ID ${bookingId}`;
  let description = `Online payout for booking ${bRef}. Gross: ₹${gross.toFixed(2)}. 15% commission: ₹${currentCommission.toFixed(2)}.`;
  if (priorCleared > 0) {
    description += ` Prior cash liability cleared: ₹${priorCleared.toFixed(2)}. Total commission deducted: ₹${commissionDeducted.toFixed(2)}.`;
  }
  description += ` Net ₹${netPayout.toFixed(2)} credited to available balance.`;

  // Insert ledger transaction
  const [txResult] = await conn.query(
    `INSERT INTO technician_wallet_transactions
     (technician_id, booking_id, transaction_type, payment_method, gross_amount, commission_rate, 
      commission_amount, previous_outstanding, commission_deducted, net_amount, new_outstanding, 
      new_available_balance, description)
     VALUES (?, ?, 'ONLINE_PAYOUT', 'ONLINE', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      technicianId,
      bookingId,
      gross,
      COMMISSION_RATE,
      currentCommission,
      prevOutstanding,
      commissionDeducted,
      netPayout,
      newOutstanding,
      newAvail,
      description
    ]
  );

  return {
    transactionId: txResult.insertId,
    technicianId,
    bookingId,
    grossAmount: gross,
    commissionRate: COMMISSION_RATE,
    commissionAmount: currentCommission,
    previousOutstanding: prevOutstanding,
    commissionDeducted,
    netPayable: netPayout,
    newOutstanding,
    availableBalance: newAvail
  };
}

/**
 * Get full wallet summary for a technician
 * @param {number} technicianId
 */
async function getWalletSummary(technicianId) {
  const wallet = await getOrCreateWallet(technicianId);

  const available = parseFloat(wallet.available_balance) || 0;
  const outstanding = parseFloat(wallet.outstanding_commission) || 0;
  const cash = parseFloat(wallet.total_cash_collected) || 0;
  const online = parseFloat(wallet.total_online_earnings) || 0;
  const paid = parseFloat(wallet.total_commission_paid) || 0;

  return {
    technician_id: technicianId,
    available_balance: available,
    outstanding_commission: outstanding,
    net_balance: +(available - outstanding).toFixed(2),
    total_cash_collected: cash,
    total_online_earnings: online,
    total_commission_paid: paid,
    commission_rate: COMMISSION_RATE,
    updated_at: wallet.updated_at
  };
}

/**
 * Get wallet transaction ledger for a technician
 * @param {number} technicianId
 * @param {Object} options
 */
async function getTransactions(technicianId, { page = 1, limit = 20 } = {}) {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const lim = parseInt(limit, 10);

  const [rows] = await pool.query(
    `SELECT t.*, b.booking_number, b.title as booking_title
     FROM technician_wallet_transactions t
     LEFT JOIN bookings b ON b.id = t.booking_id
     WHERE t.technician_id = ?
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT ? OFFSET ?`,
    [technicianId, lim, offset]
  );

  const [countRes] = await pool.query(
    'SELECT COUNT(*) as total FROM technician_wallet_transactions WHERE technician_id = ?',
    [technicianId]
  );

  const total = countRes[0]?.total || 0;

  return {
    transactions: rows.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      booking_number: r.booking_number,
      booking_title: r.booking_title,
      transaction_type: r.transaction_type,
      payment_method: r.payment_method,
      gross_amount: parseFloat(r.gross_amount),
      commission_rate: parseFloat(r.commission_rate),
      commission_amount: parseFloat(r.commission_amount),
      previous_outstanding: parseFloat(r.previous_outstanding),
      commission_deducted: parseFloat(r.commission_deducted),
      net_amount: parseFloat(r.net_amount),
      new_outstanding: parseFloat(r.new_outstanding),
      new_available_balance: parseFloat(r.new_available_balance),
      description: r.description,
      created_at: r.created_at
    })),
    pagination: {
      page: parseInt(page, 10),
      limit: lim,
      total,
      totalPages: Math.ceil(total / lim)
    }
  };
}

/**
 * Technician manually pays outstanding commission liability
 * @param {number} technicianId
 * @param {number} amount
 */
async function settleOutstandingCommission(technicianId, amount) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    throw AppError.badRequest('Invalid settlement amount');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await getOrCreateWallet(technicianId, conn);
    const [locked] = await conn.query(
      'SELECT * FROM technician_wallets WHERE technician_id = ? FOR UPDATE',
      [technicianId]
    );
    const wallet = locked[0];

    const prevOutstanding = parseFloat(wallet.outstanding_commission) || 0;
    if (prevOutstanding <= 0) {
      throw AppError.badRequest('No outstanding commission to settle');
    }

    const payAmt = Math.min(amt, prevOutstanding);
    const newOutstanding = +(prevOutstanding - payAmt).toFixed(2);
    const prevPaid = parseFloat(wallet.total_commission_paid) || 0;
    const newPaid = +(prevPaid + payAmt).toFixed(2);
    const avail = parseFloat(wallet.available_balance) || 0;

    await conn.query(
      `UPDATE technician_wallets 
       SET outstanding_commission = ?, total_commission_paid = ?, updated_at = CURRENT_TIMESTAMP
       WHERE technician_id = ?`,
      [newOutstanding, newPaid, technicianId]
    );

    const [txResult] = await conn.query(
      `INSERT INTO technician_wallet_transactions
       (technician_id, booking_id, transaction_type, payment_method, gross_amount, commission_rate, 
        commission_amount, previous_outstanding, commission_deducted, net_amount, new_outstanding, 
        new_available_balance, description)
       VALUES (?, NULL, 'COMMISSION_SETTLEMENT', 'ONLINE', ?, 0.00, 0.00, ?, ?, 0.00, ?, ?, ?)`,
      [
        technicianId,
        payAmt,
        prevOutstanding,
        payAmt,
        newOutstanding,
        avail,
        `Direct settlement of outstanding commission: ₹${payAmt.toFixed(2)} paid. Outstanding reduced from ₹${prevOutstanding.toFixed(2)} to ₹${newOutstanding.toFixed(2)}.`
      ]
    );

    await conn.commit();
    return {
      transactionId: txResult.insertId,
      paidAmount: payAmt,
      previousOutstanding: prevOutstanding,
      newOutstanding,
      availableBalance: avail
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  COMMISSION_RATE,
  getOrCreateWallet,
  recordCashPayment,
  recordOnlinePayment,
  getWalletSummary,
  getTransactions,
  settleOutstandingCommission
};
