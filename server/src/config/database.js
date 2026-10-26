const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('./env');

/**
 * Configure TLS/SSL options for MySQL / TiDB Cloud
 * TiDB Cloud Serverless requires TLSv1.2 with public CA validation.
 */
function getSslConfig() {
  const host = config.db.host || '';
  const isTiDB = host.includes('tidbcloud.com') || Number(config.db.port) === 4000;
  const sslRequested = process.env.DB_SSL === 'true' || process.env.TIDB_ENABLE_SSL === 'true';
  const sslExplicitlyDisabled = process.env.DB_SSL === 'false' || process.env.TIDB_ENABLE_SSL === 'false';

  // Do not enable SSL if explicitly disabled (e.g. local development MySQL on port 3306)
  if (sslExplicitlyDisabled) {
    return undefined;
  }

  // Enable secure TLS for TiDB Cloud or when explicitly requested
  if (sslRequested || isTiDB) {
    const sslOptions = {
      minVersion: 'TLSv1.2',
      // Strict certificate validation against Node.js built-in Mozilla root CA store
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };

    // Support optional custom CA certificate file (e.g. TiDB Cloud Dedicated clusters)
    const caPath = process.env.DB_SSL_CA || process.env.TIDB_CA_PATH;
    if (caPath) {
      try {
        sslOptions.ca = fs.readFileSync(caPath);
      } catch (err) {
        console.warn(`[Database] Warning: Could not read custom CA at ${caPath}: ${err.message}. Using system CA bundle.`);
      }
    }

    return sslOptions;
  }

  return undefined;
}

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,

  // Secure TLS configuration compatible with TiDB Cloud Serverless & local MySQL
  ssl: getSslConfig(),

  waitForConnections: config.db.waitForConnections,
  connectionLimit: config.db.connectionLimit,
  queueLimit: config.db.queueLimit,
  timezone: config.db.timezone,
  decimalNumbers: config.db.decimalNumbers
});

/**
 * Test database connectivity
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log(
      `[Database] Successfully connected to MySQL at ${config.db.host}:${config.db.port}/${config.db.database}`
    );

    return true;
  } catch (error) {
    console.error(`[Database] Connection failed: ${error.message}`);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testConnection
};
