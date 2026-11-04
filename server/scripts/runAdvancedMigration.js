const { pool } = require('../src/config/database');

async function runAdvancedMigration() {
  console.log('[AdvancedMigration] Starting migration...');
  const conn = await pool.getConnection();

  try {
    // 1. customer_profiles -> reward_points
    console.log('[AdvancedMigration] Checking customer_profiles columns...');
    const [cpCols] = await conn.query('SHOW COLUMNS FROM customer_profiles');
    const cpColNames = cpCols.map(c => c.Field);
    if (!cpColNames.includes('reward_points')) {
      console.log('[AdvancedMigration] Adding reward_points to customer_profiles...');
      await conn.query('ALTER TABLE customer_profiles ADD COLUMN reward_points INT UNSIGNED NOT NULL DEFAULT 0 AFTER wallet_balance');
    }

    // 2. reward_points_history table
    console.log('[AdvancedMigration] Ensuring reward_points_history table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reward_points_history (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        customer_id INT UNSIGNED NOT NULL,
        booking_id INT UNSIGNED DEFAULT NULL,
        points INT NOT NULL,
        type ENUM('EARNED','REDEEMED','EXPIRED','ADJUSTMENT') NOT NULL DEFAULT 'EARNED',
        description VARCHAR(255) DEFAULT NULL,
        balance_after INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rph_customer (customer_id)
      ) ENGINE=InnoDB;
    `);

    // 3. bookings columns & status enum
    console.log('[AdvancedMigration] Checking bookings columns...');
    const [bkCols] = await conn.query('SHOW COLUMNS FROM bookings');
    const bkColNames = bkCols.map(c => c.Field);

    if (!bkColNames.includes('verification_pin_hash')) {
      console.log('[AdvancedMigration] Adding verification_pin_hash...');
      await conn.query('ALTER TABLE bookings ADD COLUMN verification_pin_hash VARCHAR(255) NULL AFTER status');
    }
    if (!bkColNames.includes('pin_expires_at')) {
      console.log('[AdvancedMigration] Adding pin_expires_at...');
      await conn.query('ALTER TABLE bookings ADD COLUMN pin_expires_at DATETIME NULL AFTER verification_pin_hash');
    }
    if (!bkColNames.includes('pin_attempt_count')) {
      console.log('[AdvancedMigration] Adding pin_attempt_count...');
      await conn.query('ALTER TABLE bookings ADD COLUMN pin_attempt_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER pin_expires_at');
    }
    if (!bkColNames.includes('pin_verified_at')) {
      console.log('[AdvancedMigration] Adding pin_verified_at...');
      await conn.query('ALTER TABLE bookings ADD COLUMN pin_verified_at DATETIME NULL AFTER pin_attempt_count');
    }
    if (!bkColNames.includes('payment_method')) {
      console.log('[AdvancedMigration] Adding payment_method...');
      await conn.query('ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) NULL AFTER final_total');
    }
    if (!bkColNames.includes('payment_status')) {
      console.log('[AdvancedMigration] Adding payment_status...');
      await conn.query("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' AFTER payment_method");
    }

    console.log('[AdvancedMigration] Updating bookings status enum...');
    await conn.query(`
      ALTER TABLE bookings MODIFY COLUMN status ENUM(
        'REQUESTED','ASSIGNED','ACCEPTED','ON_THE_WAY','ARRIVED',
        'IN_PROGRESS','AWAITING_APPROVAL','AWAITING_CUSTOMER_VERIFICATION','VERIFIED','PAYMENT_PENDING','COMPLETED',
        'CANCELLED','REJECTED','NO_TECHNICIAN_AVAILABLE','EXPIRED','DISPUTED'
      ) NOT NULL DEFAULT 'REQUESTED'
    `);

    // 4. call_sessions table for WebRTC voice/video calls
    console.log('[AdvancedMigration] Ensuring call_sessions table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS call_sessions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        booking_id INT UNSIGNED NOT NULL,
        caller_id INT UNSIGNED NOT NULL,
        receiver_id INT UNSIGNED NOT NULL,
        call_type ENUM('voice', 'video') NOT NULL DEFAULT 'voice',
        status ENUM('initiated', 'ringing', 'connected', 'rejected', 'missed', 'ended', 'failed') NOT NULL DEFAULT 'initiated',
        started_at DATETIME DEFAULT NULL,
        ended_at DATETIME DEFAULT NULL,
        duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cs_booking (booking_id),
        INDEX idx_cs_caller (caller_id),
        INDEX idx_cs_receiver (receiver_id)
      ) ENGINE=InnoDB;
    `);

    // 5. backup_technician_requests table
    console.log('[AdvancedMigration] Ensuring backup_technician_requests table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS backup_technician_requests (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        booking_id INT UNSIGNED NOT NULL,
        original_technician_id INT UNSIGNED NOT NULL,
        accepted_technician_id INT UNSIGNED DEFAULT NULL,
        reason ENUM('VEHICLE_BREAKDOWN', 'DELAYED_AT_PREVIOUS_JOB', 'PERSONAL_EMERGENCY', 'TOOL_EQUIPMENT_FAILURE', 'DISTANCE_OR_TRAFFIC', 'OTHER') NOT NULL,
        explanation TEXT DEFAULT NULL,
        status ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        expires_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_btr_booking (booking_id),
        INDEX idx_btr_orig_tech (original_technician_id),
        INDEX idx_btr_status (status)
      ) ENGINE=InnoDB;
    `);

    // 6. technician_wallets table
    console.log('[AdvancedMigration] Ensuring technician_wallets table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS technician_wallets (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        technician_id INT UNSIGNED NOT NULL,
        available_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        outstanding_commission DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_cash_collected DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_online_earnings DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_commission_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tw_tech (technician_id),
        INDEX idx_tw_tech (technician_id)
      ) ENGINE=InnoDB;
    `);

    // 7. technician_wallet_transactions table
    console.log('[AdvancedMigration] Ensuring technician_wallet_transactions table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS technician_wallet_transactions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        technician_id INT UNSIGNED NOT NULL,
        booking_id INT UNSIGNED DEFAULT NULL,
        transaction_type ENUM('CASH_COLLECTED', 'ONLINE_PAYOUT', 'COMMISSION_CHARGE', 'COMMISSION_SETTLEMENT', 'WITHDRAWAL', 'ADJUSTMENT') NOT NULL,
        payment_method ENUM('CASH', 'ONLINE', 'WALLET', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
        gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        commission_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00,
        commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        previous_outstanding DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        commission_deducted DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        new_outstanding DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        new_available_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        description VARCHAR(500) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_twt_tech (technician_id),
        INDEX idx_twt_booking (booking_id)
      ) ENGINE=InnoDB;
    `);

    // 8. Initialize technician_wallets for existing technicians
    console.log('[AdvancedMigration] Initializing technician_wallets for existing technicians...');
    const [techUsers] = await conn.query("SELECT id FROM users WHERE role = 'technician'");
    for (const tech of techUsers) {
      await conn.query(`
        INSERT INTO technician_wallets (technician_id, available_balance, outstanding_commission)
        VALUES (?, 0.00, 0.00)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, [tech.id]);
    }

    console.log('\x1b[32m%s\x1b[0m', '[AdvancedMigration] Migration completed successfully!');
  } catch (err) {
    console.error('[AdvancedMigration Error]', err);
    throw err;
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  runAdvancedMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = runAdvancedMigration;
