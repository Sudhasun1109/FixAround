const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('../src/config/env');

async function fixPasswords() {
  const hash = bcrypt.hashSync('Password123!', 10);
  console.log(`Generated real hash for 'Password123!': ${hash}`);

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database
  });

  try {
    const [result] = await connection.query(
      'UPDATE users SET password_hash = ?',
      [hash]
    );
    console.log(`Updated ${result.affectedRows} users with valid password hash!`);
    console.log("All seed users can now log in with password: Password123!");
  } catch (err) {
    console.error('Error updating passwords:', err);
  } finally {
    await connection.end();
  }
}

fixPasswords();
