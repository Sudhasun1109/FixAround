const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function createWalletTable() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
  });

  const sql = `
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id INT UNSIGNED NOT NULL,
      booking_id INT UNSIGNED DEFAULT NULL,
      claim_id INT UNSIGNED DEFAULT NULL,
      amount DECIMAL(12,2) NOT NULL,
      type ENUM('CREDIT', 'DEBIT') NOT NULL DEFAULT 'CREDIT',
      description VARCHAR(255) DEFAULT NULL,
      balance_after DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_wt_customer (customer_id),
      KEY idx_wt_booking (booking_id),
      KEY idx_wt_claim (claim_id),
      CONSTRAINT fk_wt_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_wt_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
      CONSTRAINT fk_wt_claim FOREIGN KEY (claim_id) REFERENCES warranty_claims(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await conn.query(sql);
  console.log('wallet_transactions table created successfully');
  await conn.end();
}

createWalletTable().catch(err => {
  console.error(err);
  process.exit(1);
});
