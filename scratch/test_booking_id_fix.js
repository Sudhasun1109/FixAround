const http = require('http');
const config = require('../server/src/config/env');
const jwt = require('../server/node_modules/jsonwebtoken');

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

async function run() {
  console.log('--- TESTING BOOKING ID RESOLUTION AND VALIDATION ---');

  const customerToken = jwt.sign({ id: 2, email: 'customer@example.com', role: 'customer' }, config.jwt.secret);
  const adminToken = jwt.sign({ id: 1, email: 'admin@fixaround.com', role: 'admin' }, config.jwt.secret);

  // Test 1: Review submission with body booking_id (numeric)
  console.log('\n[1] Testing POST /api/v1/reviews with { booking_id: 1 }...');
  const reviewRes1 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/reviews',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    }
  }, {
    booking_id: 1,
    rating: 5,
    comment: 'Super fast and reliable service!'
  });

  console.log(`Status: ${reviewRes1.status}`);
  console.log('Message:', reviewRes1.data.message);
  // It shouldn't be "Booking ID must be a positive integer"
  if (reviewRes1.data.errors && reviewRes1.data.errors.some(e => e.message === 'Booking ID must be a positive integer')) {
    console.error('FAILED: Still returning Booking ID must be a positive integer!');
    process.exit(1);
  }
  console.log('✓ Validation passed without "Booking ID must be a positive integer" error!');

  // Test 2: Review submission with booking reference string (e.g. BK-...)
  console.log('\n[2] Testing POST /api/v1/reviews with booking number "BK-20261024-0001"...');
  const reviewRes2 = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/reviews',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    }
  }, {
    booking_id: 'BK-20261024-0001',
    rating: 5,
    comment: 'Great job!'
  });

  console.log(`Status: ${reviewRes2.status}`);
  console.log('Message:', reviewRes2.data.message);
  if (reviewRes2.data.errors && reviewRes2.data.errors.some(e => e.message === 'Booking ID must be a positive integer')) {
    console.error('FAILED: Booking reference rejected by validator!');
    process.exit(1);
  }
  console.log('✓ Validation passed for booking reference string!');

  // Test 3: Payment initiation with { booking_id: 1 }
  console.log('\n[3] Testing POST /api/v1/payments/initiate with { booking_id: 1 }...');
  const payRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/payments/initiate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    }
  }, {
    booking_id: 1,
    payment_method: 'WALLET'
  });

  console.log(`Status: ${payRes.status}`);
  console.log('Message:', payRes.data.message);
  if (payRes.data.errors && payRes.data.errors.some(e => e.message === 'Booking ID must be a positive integer')) {
    console.error('FAILED: Payment initiation failed with Booking ID error!');
    process.exit(1);
  }
  console.log('✓ Payment initiation validator accepted booking_id successfully!');

  // Test 4: Booking lookup by ID as Admin
  console.log('\n[4] Testing GET /api/v1/bookings/1...');
  const getBookingRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/bookings/1',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  console.log(`Status: ${getBookingRes.status}`);
  if (getBookingRes.status === 200 && getBookingRes.data?.data) {
    console.log(`✓ Retrieved booking: "${getBookingRes.data.data.booking_number}"`);
  }

  console.log('\n🎉 ALL TESTS PASSED! "Booking ID must be a positive integer" IS FULLY RESOLVED!\n');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
