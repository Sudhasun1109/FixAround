const { pool } = require('../src/config/database');

async function cleanDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    console.log('1. Cleaning up test bookings...');
    const keepBookingIds = [1, 130];
    const bPlaceholders = keepBookingIds.map(() => '?').join(',');

    await conn.query(`DELETE FROM booking_status_history WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM booking_assignments WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM price_estimates WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM payments WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM invoices WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM technician_earnings WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM reviews WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM warranty_claims WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM service_attachments WHERE booking_id NOT IN (${bPlaceholders})`, keepBookingIds);
    await conn.query(`DELETE FROM bookings WHERE id NOT IN (${bPlaceholders})`, keepBookingIds);

    console.log('2. Cleaning up users, retaining only Admin (1), Customer (2), Technician (5)...');
    const keepUserIds = [1, 2, 5];
    const uPlaceholders = keepUserIds.map(() => '?').join(',');

    await conn.query(`DELETE FROM customer_profiles WHERE user_id NOT IN (${uPlaceholders})`, keepUserIds);
    await conn.query(`DELETE FROM addresses WHERE user_id NOT IN (${uPlaceholders})`, keepUserIds);

    const [extraTechs] = await conn.query(`SELECT id FROM technician_profiles WHERE user_id NOT IN (${uPlaceholders})`, keepUserIds);
    if (extraTechs.length > 0) {
      const extraTechIds = extraTechs.map(t => t.id);
      const techPlaceholders = extraTechIds.map(() => '?').join(',');
      await conn.query(`DELETE FROM technician_skills WHERE technician_id IN (${techPlaceholders})`, extraTechIds);
      await conn.query(`DELETE FROM technician_service_areas WHERE technician_id IN (${techPlaceholders})`, extraTechIds);
      await conn.query(`DELETE FROM technician_documents WHERE technician_id IN (${techPlaceholders})`, extraTechIds);
      await conn.query(`DELETE FROM technician_profiles WHERE id IN (${techPlaceholders})`, extraTechIds);
    }

    await conn.query(`DELETE FROM notifications WHERE user_id NOT IN (${uPlaceholders})`, keepUserIds);
    await conn.query(`DELETE FROM audit_logs WHERE actor_id NOT IN (${uPlaceholders})`, keepUserIds);

    const [delUsers] = await conn.query(`DELETE FROM users WHERE id NOT IN (${uPlaceholders})`, keepUserIds);
    console.log('Deleted extra users count:', delUsers.affectedRows);

    // Update technician 5 profile
    await conn.query(`
      UPDATE technician_profiles 
      SET completed_jobs = 1, avg_rating = 5.0, review_count = 1, total_earnings = 382.50, is_available = 1, is_online = 1 
      WHERE user_id = 5
    `);

    await conn.commit();
    console.log('Cleanup committed successfully!');
  } catch (err) {
    await conn.rollback();
    console.error('Rollback due to error:', err);
  } finally {
    conn.release();
  }

  const [remainingUsers] = await pool.query('SELECT id, email, role, first_name, last_name FROM users ORDER BY id ASC');
  console.log('\n--- FINAL REMAINING USERS ---');
  console.table(remainingUsers);

  const [remainingBookings] = await pool.query('SELECT id, booking_number, customer_id, technician_id, status FROM bookings ORDER BY id ASC');
  console.log('\n--- FINAL REMAINING BOOKINGS ---');
  console.table(remainingBookings);

  const [remainingPayments] = await pool.query('SELECT id, booking_id, customer_id, amount, status FROM payments ORDER BY id ASC');
  console.log('\n--- FINAL REMAINING PAYMENTS ---');
  console.table(remainingPayments);

  const [remainingInvoices] = await pool.query('SELECT id, invoice_number, booking_id, customer_id, total_amount, status FROM invoices ORDER BY id ASC');
  console.log('\n--- FINAL REMAINING INVOICES ---');
  console.table(remainingInvoices);

  const [remainingEarnings] = await pool.query('SELECT id, technician_id, booking_id, net_amount, settlement_status FROM technician_earnings ORDER BY id ASC');
  console.log('\n--- FINAL REMAINING EARNINGS ---');
  console.table(remainingEarnings);

  process.exit(0);
}

cleanDatabase();
