const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function migrate() {
  console.log('[Migration] Connecting to database...');
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('[Migration] Checking existing bookings columns...');
    const [cols] = await connection.query("SHOW COLUMNS FROM bookings");
    const colNames = cols.map(c => c.Field);

    // 1. Add verification_pin_hash if not exists
    if (!colNames.includes('verification_pin_hash')) {
      console.log('[Migration] Adding verification_pin_hash...');
      await connection.query("ALTER TABLE bookings ADD COLUMN verification_pin_hash VARCHAR(255) NULL AFTER status");
    }

    // 2. Add pin_expires_at if not exists
    if (!colNames.includes('pin_expires_at')) {
      console.log('[Migration] Adding pin_expires_at...');
      await connection.query("ALTER TABLE bookings ADD COLUMN pin_expires_at DATETIME NULL AFTER verification_pin_hash");
    }

    // 3. Add pin_attempt_count if not exists
    if (!colNames.includes('pin_attempt_count')) {
      console.log('[Migration] Adding pin_attempt_count...');
      await connection.query("ALTER TABLE bookings ADD COLUMN pin_attempt_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER pin_expires_at");
    }

    // 4. Add pin_verified_at if not exists
    if (!colNames.includes('pin_verified_at')) {
      console.log('[Migration] Adding pin_verified_at...');
      await connection.query("ALTER TABLE bookings ADD COLUMN pin_verified_at DATETIME NULL AFTER pin_attempt_count");
    }

    // 5. Add payment_method if not exists
    if (!colNames.includes('payment_method')) {
      console.log('[Migration] Adding payment_method...');
      await connection.query("ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) NULL AFTER final_total");
    }

    // 6. Add payment_status if not exists
    if (!colNames.includes('payment_status')) {
      console.log('[Migration] Adding payment_status...');
      await connection.query("ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' AFTER payment_method");
    }

    // 7. Update status column on bookings to ensure AWAITING_CUSTOMER_VERIFICATION, VERIFIED, PAYMENT_PENDING are supported
    console.log('[Migration] Updating bookings status enum...');
    await connection.query(`
      ALTER TABLE bookings MODIFY COLUMN status ENUM(
        'REQUESTED','ASSIGNED','ACCEPTED','ON_THE_WAY','ARRIVED',
        'IN_PROGRESS','AWAITING_APPROVAL','AWAITING_CUSTOMER_VERIFICATION','VERIFIED','PAYMENT_PENDING','COMPLETED',
        'CANCELLED','REJECTED','NO_TECHNICIAN_AVAILABLE','EXPIRED','DISPUTED'
      ) NOT NULL DEFAULT 'REQUESTED'
    `);

    console.log('\x1b[32m%s\x1b[0m', '[Migration] Successfully migrated bookings table for PIN verification and payments!');
  } catch (err) {
    console.error('[Migration Error]', err);
    throw err;
  } finally {
    await connection.end();
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
