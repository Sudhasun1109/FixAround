const mysql = require('mysql2/promise');
const config = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,

  // Enable TLS only if explicitly requested via DB_SSL=true
  ssl: process.env.DB_SSL === 'true'
    ? { minVersion: 'TLSv1.2', rejectUnauthorized: false }
    : undefined,

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
