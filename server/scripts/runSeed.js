const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function runSeed() {
  const seedPath = path.resolve(__dirname, '../../database/seed.sql');
  console.log(`[Database Seed] Reading seed file from: ${seedPath}`);

  if (!fs.existsSync(seedPath)) {
    console.error(`[Error] Seed file not found at ${seedPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(seedPath, 'utf8');

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true
  });

  try {
    console.log(`[Database Seed] Connected to ${config.db.database}. Inserting seed data...`);
    await connection.query(sql);
    console.log('[Database Seed] \x1b[32m%s\x1b[0m', 'Successfully populated database with seed data!');
  } catch (error) {
    console.error('[Database Seed] \x1b[31m%s\x1b[0m', `Failed to apply seed data: ${error.message}`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSeed();
