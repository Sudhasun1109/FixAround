const { pool } = require('../server/src/config/database');

async function syncPending() {
  await pool.query("UPDATE technician_profiles SET verification_status = 'pending' WHERE id = 1");
  const [existingNotif] = await pool.query("SELECT id FROM notifications WHERE user_id = 1 AND type = 'KYC_SUBMITTED'");
  if (existingNotif.length === 0) {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (1, 'KYC_SUBMITTED', 'New KYC Document Submitted', 'Suresh Kumar uploaded 660623847082 for verification review.', ?)`,
      [JSON.stringify({
        technician_id: 1,
        user_id: 5,
        document_id: 6,
        document_type: 'ID_PROOF',
        document_name: '660623847082',
        file_url: 'https://drive.google.com/file/d/152aKpXHxLkrJzcPDJWaNfkuiJrm6IrQW/view?usp=sharing'
      })]
    );
    console.log('Admin notification inserted successfully');
  } else {
    console.log('Admin notification already exists');
  }
  console.log('Technician profile updated to pending');
  process.exit(0);
}

syncPending().catch(err => {
  console.error(err);
  process.exit(1);
});
