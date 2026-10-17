const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function runSchema() {
  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
  console.log(`[Schema Migration] Reading schema file from: ${schemaPath}`);

  if (!fs.existsSync(schemaPath)) {
    console.error(`[Error] Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Connect without database first in case database does not exist yet
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  try {
    console.log(`[Schema Migration] Connected to MySQL. Executing schema definitions...`);
    await connection.query(sql);
    console.log('[Schema Migration] \x1b[32m%s\x1b[0m', 'Successfully applied schema.sql! All tables created.');
  } catch (error) {
    console.error('[Schema Migration] \x1b[31m%s\x1b[0m', `Failed to apply schema: ${error.message}`);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSchema();
