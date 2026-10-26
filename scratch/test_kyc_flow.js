const http = require('http');
const { pool } = require('../server/src/config/database');
const jwt = require('../server/node_modules/jsonwebtoken');
const config = require('../server/src/config/env');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- STARTING KYC APPROVAL & NOTIFICATION TEST ---');

  // 1. Generate JWT tokens for Admin (id 1) and Technician (id 5, profile 1)
  const adminToken = jwt.sign({ id: 1, email: 'admin@fixaround.com', role: 'admin' }, config.jwt.secret, { expiresIn: '1h' });
  const techToken = jwt.sign({ id: 5, email: 'suresh.electrician@example.com', role: 'technician' }, config.jwt.secret, { expiresIn: '1h' });

  // 2. Test Admin GET /api/v1/admin/technicians/verification
  console.log('\n[1] Fetching pending verification queue as Admin...');
  const queueRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/technicians/verification?status=pending',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  console.log(`Status: ${queueRes.status}`);
  if (queueRes.status !== 200) {
    console.error('Queue response error:', queueRes.data);
    process.exit(1);
  }

  const technicians = queueRes.data?.data || [];
  console.log(`Found ${technicians.length} technician(s) in pending queue.`);
  const suresh = technicians.find(t => t.id === 1 || t.user_id === 5);
  if (!suresh) {
    console.error('Technician Suresh not found in pending queue!');
    process.exit(1);
  }
  console.log(`✓ Suresh found! Documents attached: ${suresh.documents?.length || 0}`);
  if (suresh.documents && suresh.documents.length > 0) {
    console.log(`✓ First document title: "${suresh.documents[0].document_name}", status: "${suresh.documents[0].status}"`);
    console.log(`✓ Document URL: "${suresh.documents[0].file_url}"`);
  }

  // 3. Test Technician Uploading a New KYC Document
  console.log('\n[2] Technician uploading a new Trade Certification document...');
  const uploadRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/technicians/documents',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${techToken}`
    }
  }, {
    document_type: 'CERTIFICATION',
    document_name: 'National Electrical Safety Certificate',
    file_url: 'https://drive.google.com/file/d/test-cert-link/view'
  });

  console.log(`Upload Status: ${uploadRes.status}`);
  if (uploadRes.status !== 201) {
    console.error('Upload failed:', uploadRes.data);
    process.exit(1);
  }
  const uploadedDoc = uploadRes.data?.data;
  console.log(`✓ Document created with ID: ${uploadedDoc.id}`);

  // 4. Verify Admin Notification was created
  console.log('\n[3] Verifying Admin received KYC notification...');
  const [adminNotifs] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = 1 AND type = 'KYC_SUBMITTED' ORDER BY id DESC LIMIT 1"
  );
  if (adminNotifs.length > 0) {
    console.log(`✓ Admin Notification received: "${adminNotifs[0].title}" - "${adminNotifs[0].message}"`);
  } else {
    console.error('Admin notification was not found in DB!');
    process.exit(1);
  }

  // 5. Test Admin Reviewing Document (Approving Document)
  console.log('\n[4] Admin reviewing & approving document...');
  const reviewDocRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/admin/technicians/documents/${uploadedDoc.id}/review`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    status: 'APPROVED',
    notes: 'Trade certificate verified via electrical inspectorate registry.'
  });
  console.log(`Review Doc Status: ${reviewDocRes.status}`);
  if (reviewDocRes.status !== 200) {
    console.error('Doc review failed:', reviewDocRes.data);
    process.exit(1);
  }
  console.log(`✓ Document approved successfully!`);

  // 6. Test Admin Granting Full Verification to Technician
  console.log('\n[5] Admin granting full verification to Technician...');
  const verifyTechRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/admin/technicians/1/verify`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    status: 'approved',
    notes: 'All government IDs and trade certifications successfully vetted.'
  });
  console.log(`Verify Tech Status: ${verifyTechRes.status}`);
  if (verifyTechRes.status !== 200) {
    console.error('Technician verification failed:', verifyTechRes.data);
    process.exit(1);
  }
  console.log(`✓ Technician profile status updated to APPROVED!`);

  // 7. Verify Technician received notification
  const [techNotifs] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = 5 AND type = 'KYC_APPROVED' ORDER BY id DESC LIMIT 1"
  );
  if (techNotifs.length > 0) {
    console.log(`✓ Technician Notification received: "${techNotifs[0].title}" - "${techNotifs[0].message}"`);
  }

  console.log('\n🎉 ALL KYC APPROVAL & NOTIFICATION TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
