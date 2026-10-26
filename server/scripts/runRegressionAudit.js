const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function runRegressionAudit() {
  console.log('===========================================================');
  console.log('   FIXAROUND SECOND-PASS REGRESSION AUDIT & VERIFICATION   ');
  console.log('===========================================================\n');

  const results = [];

  function record(testName, passed, details = '') {
    results.push({ testName, passed, details });
    const mark = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${mark} | ${testName}${details ? ` -> ${details}` : ''}`);
  }

  // --- PART 1: VALIDATION & SECURITY CHECKS (Negative Tests) ---
  console.log('\n--- PART 1: VALIDATION, ROLE PERMISSIONS & ERROR HANDLING ---');

  // 1. Invalid Login (Wrong password)
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 'priya.sharma@example.com',
      password: 'WrongPassword999!'
    });
    record('Auth: Reject invalid password', false, 'Should have returned 401');
  } catch (err) {
    const is401 = err.response?.status === 401;
    const msg = err.response?.data?.message || err.message;
    record('Auth: Reject invalid password', is401, `Status: ${err.response?.status}, Msg: "${msg}"`);
  }

  // 2. Registration Validation (Missing required fields)
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      email: 'invalid-email-format',
      password: '123'
    });
    record('Auth: Reject malformed registration', false, 'Should have returned 400');
  } catch (err) {
    const is400 = err.response?.status === 400;
    const errors = err.response?.data?.errors || [];
    record('Auth: Reject malformed registration', is400, `Status: 400, Validation errors count: ${errors.length}`);
  }

  // 3. Unauthenticated access to protected route
  try {
    await axios.get(`${BASE_URL}/bookings`);
    record('Security: Block unauthenticated access to bookings', false, 'Should have returned 401');
  } catch (err) {
    const is401 = err.response?.status === 401;
    record('Security: Block unauthenticated access to bookings', is401, `Status: ${err.response?.status}`);
  }

  // --- PART 2: AUTHENTICATION FOR ALL ROLES ---
  console.log('\n--- PART 2: AUTHENTICATION & ROLE-BASED ACCESS ---');

  let customerToken, customerUser, customerHeaders;
  let techToken, techUser, techHeaders;
  let adminToken, adminUser, adminHeaders;

  // 4. Customer Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'priya.sharma@example.com',
      password: 'Password123!'
    });
    customerToken = res.data.data.token;
    customerUser = res.data.data.user;
    customerHeaders = { Authorization: `Bearer ${customerToken}` };
    record('Auth: Customer Login', !!customerToken && customerUser.role === 'customer', `User: ${customerUser.first_name} ${customerUser.last_name}`);
  } catch (err) {
    record('Auth: Customer Login', false, err.message);
  }

  // 5. Technician Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'suresh.electrician@example.com',
      password: 'Password123!'
    });
    techToken = res.data.data.token;
    techUser = res.data.data.user;
    techHeaders = { Authorization: `Bearer ${techToken}` };
    record('Auth: Technician Login', !!techToken && techUser.role === 'technician', `Tech: ${techUser.first_name} ${techUser.last_name}`);
  } catch (err) {
    record('Auth: Technician Login', false, err.message);
  }

  // 6. Admin Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fixaround.com',
      password: 'Password123!'
    });
    adminToken = res.data.data.token;
    adminUser = res.data.data.user;
    adminHeaders = { Authorization: `Bearer ${adminToken}` };
    record('Auth: Admin Login', !!adminToken && adminUser.role === 'admin', `Admin: ${adminUser.first_name} ${adminUser.last_name}`);
  } catch (err) {
    record('Auth: Admin Login', false, err.message);
  }

  // 7. Role-Based Access Control: Customer blocked from Admin Dashboard
  try {
    await axios.get(`${BASE_URL}/admin/dashboard`, { headers: customerHeaders });
    record('RBAC: Customer blocked from Admin Dashboard', false, 'Customer accessed admin dashboard!');
  } catch (err) {
    record('RBAC: Customer blocked from Admin Dashboard', err.response?.status === 403, `Status: ${err.response?.status}`);
  }

  // 8. Role-Based Access Control: Technician blocked from Admin Settings
  try {
    await axios.get(`${BASE_URL}/admin/settings`, { headers: techHeaders });
    record('RBAC: Technician blocked from Admin Settings', false, 'Technician accessed admin settings!');
  } catch (err) {
    record('RBAC: Technician blocked from Admin Settings', err.response?.status === 403, `Status: ${err.response?.status}`);
  }

  // --- PART 3: TAMIL NADU ADDRESS SELECTION, SAVING, RETRIEVING & EDITING ---
  console.log('\n--- PART 3: TAMIL NADU ADDRESS LIFECYCLE (Select, Save, Retrieve, Edit) ---');

  let testAddressId;

  // 9. Create Address in Tamil Nadu
  try {
    const res = await axios.post(`${BASE_URL}/addresses`, {
      label: 'Textile Workshop',
      address_line1: '54 Avinashi Road, College Nagar',
      address_line2: 'Opposite New Bus Stand',
      city: 'Tiruppur',
      state: 'Tamil Nadu',
      pincode: '641602',
      latitude: 11.1120,
      longitude: 77.3450,
      is_default: false
    }, { headers: customerHeaders });
    testAddressId = res.data.data.id;
    const createdState = res.data.data.state;
    record('Address: Create with State = Tamil Nadu', res.data.success && createdState === 'Tamil Nadu', `ID: ${testAddressId}, State: "${createdState}", City: "${res.data.data.city}"`);
  } catch (err) {
    record('Address: Create with State = Tamil Nadu', false, err.message);
  }

  // 10. Retrieve Addresses and verify Tamil Nadu address exists
  try {
    const res = await axios.get(`${BASE_URL}/addresses`, { headers: customerHeaders });
    const found = res.data.data.find(a => a.id === testAddressId);
    record('Address: Retrieve Tamil Nadu Address', !!found && found.state === 'Tamil Nadu', `Retrieved: ${found ? `"${found.address_line1}, ${found.city}, ${found.state}"` : 'Not found'}`);
  } catch (err) {
    record('Address: Retrieve Tamil Nadu Address', false, err.message);
  }

  // 11. Edit / Update the Tamil Nadu Address
  try {
    const updateRes = await axios.put(`${BASE_URL}/addresses/${testAddressId}`, {
      label: 'Textile Hub Central',
      address_line1: '54 Avinashi Road, Industrial Estate Phase 2',
      address_line2: 'Near Municipal Water Tank',
      city: 'Tiruppur',
      state: 'Tamil Nadu',
      pincode: '641603'
    }, { headers: customerHeaders });
    const updated = updateRes.data.data;
    record('Address: Edit / Update Address in Tamil Nadu', updateRes.data.success && updated.pincode === '641603', `Updated Pincode: ${updated.pincode}, Label: "${updated.label}"`);
  } catch (err) {
    record('Address: Edit / Update Address in Tamil Nadu', false, err.message);
  }

  // 12. Set Default Address
  try {
    const defRes = await axios.patch(`${BASE_URL}/addresses/${testAddressId}/default`, {}, { headers: customerHeaders });
    record('Address: Set as Default Address', defRes.data.success, 'Default address flag persisted');
  } catch (err) {
    record('Address: Set as Default Address', false, err.message);
  }

  // --- PART 4: SERVICE CATEGORIES & WARRANTY INTEGRITY ---
  console.log('\n--- PART 4: SERVICE CATEGORIES & WARRANTY VERIFICATION ---');

  let categories = [];

  // 13. Fetch all active categories
  try {
    const res = await axios.get(`${BASE_URL}/services`);
    categories = res.data.data;
    record('Services: Get all active categories', res.data.success && categories.length > 0, `Total categories: ${categories.length}`);
  } catch (err) {
    record('Services: Get all active categories', false, err.message);
  }

  // 14. Admin creates service category WITHOUT specifying warranty days
  let adminCreatedCatId;
  const uniqueName = `Smart Solar Roofing ${Date.now()}`;
  try {
    const res = await axios.post(`${BASE_URL}/services`, {
      name: uniqueName,
      description: 'Rooftop solar panel installation and inverter grid connection in Tamil Nadu.',
      base_price: 2499,
      is_active: true
    }, { headers: adminHeaders });
    adminCreatedCatId = res.data.data.id;
    record('Services: Admin Create Category (No Warranty Days required)', res.data.success, `Created ID: ${adminCreatedCatId}, Name: "${res.data.data.name}"`);
  } catch (err) {
    record('Services: Admin Create Category (No Warranty Days required)', false, err.message);
  }

  // 15. Admin updates category
  try {
    const res = await axios.put(`${BASE_URL}/services/${adminCreatedCatId}`, {
      name: `${uniqueName} (Pro)`,
      description: 'Comprehensive rooftop solar and renewable inverter setup.',
      base_price: 2999,
      is_active: true
    }, { headers: adminHeaders });
    record('Services: Admin Update Category', res.data.success, `Updated Name: "${res.data.data.name}"`);
  } catch (err) {
    record('Services: Admin Update Category', false, err.message);
  }

  // 16. Admin deletes category
  try {
    const res = await axios.delete(`${BASE_URL}/services/${adminCreatedCatId}`, { headers: adminHeaders });
    record('Services: Admin Delete Category', res.data.success, `Deleted ID: ${adminCreatedCatId}`);
  } catch (err) {
    record('Services: Admin Delete Category', false, err.message);
  }

  // --- PART 5: COMPLETE END-TO-END BOOKING & SERVICE LIFECYCLE ---
  console.log('\n--- PART 5: BOOKING, ESTIMATE, STATUS, PAYMENT & REVIEW WORKFLOW ---');

  let bookingId, bookingNumber;
  const electricianCat = categories.find(c => c.slug === 'electrician') || categories[0];

  // 17. Customer creates a booking
  try {
    const res = await axios.post(`${BASE_URL}/bookings`, {
      category_id: electricianCat.id,
      technician_id: techUser.id,
      title: 'Emergency main switchboard tripping in Tiruppur textile unit',
      description: 'Circuit breaker trips repeatedly whenever power looms start. Need urgent check.',
      urgency: 'urgent',
      is_emergency: false,
      address_id: testAddressId,
      customer_address: '54 Avinashi Road, College Nagar, Tiruppur, Tamil Nadu - 641602',
      customer_latitude: 11.1120,
      customer_longitude: 77.3450,
      scheduled_at: new Date(Date.now() + 43200000).toISOString()
    }, { headers: customerHeaders });
    bookingId = res.data.data.id;
    bookingNumber = res.data.data.booking_number;
    record('Booking: Customer Create Booking', res.data.success, `Booking #: ${bookingNumber}, ID: ${bookingId}`);
  } catch (err) {
    record('Booking: Customer Create Booking', false, err.message);
  }

  // 18. Booking Timeline
  try {
    const res = await axios.get(`${BASE_URL}/bookings/${bookingId}/timeline`, { headers: customerHeaders });
    record('Booking: Timeline Event Tracking', res.data.success && res.data.data.length > 0, `Recorded Events: ${res.data.data.length}`);
  } catch (err) {
    record('Booking: Timeline Event Tracking', false, err.message);
  }

  // 19. Technician accepts booking
  try {
    const res = await axios.post(`${BASE_URL}/bookings/${bookingId}/accept`, {}, { headers: techHeaders });
    record('Technician: Accept Booking Assignment', res.data.success && res.data.data?.status === 'ACCEPTED', `Status: ${res.data.data?.status}`);
  } catch (err) {
    record('Technician: Accept Booking Assignment', false, err.message);
  }

  // 20. State Machine: Invalid transition test (ACCEPTED cannot jump directly to COMPLETED)
  try {
    await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'COMPLETED',
      notes: 'Illegal direct completion attempt'
    }, { headers: techHeaders });
    record('State Machine: Block invalid transition (ACCEPTED -> COMPLETED)', false, 'Should have failed state machine rule');
  } catch (err) {
    const is400 = err.response?.status === 400;
    record('State Machine: Block invalid transition (ACCEPTED -> COMPLETED)', is400, `Rejected as expected: "${err.response?.data?.message}"`);
  }

  // 21. Technician marks ON_THE_WAY
  try {
    const res = await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'ON_THE_WAY',
      notes: 'Dispatched with testing meters to Tiruppur location'
    }, { headers: techHeaders });
    record('State Machine: Transition ACCEPTED -> ON_THE_WAY', res.data.success, `Current Status: ${res.data.data?.status}`);
  } catch (err) {
    record('State Machine: Transition ACCEPTED -> ON_THE_WAY', false, err.message);
  }

  // 22. Technician marks ARRIVED
  try {
    const res = await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'ARRIVED',
      notes: 'Technician arrived at customer gate'
    }, { headers: techHeaders });
    record('State Machine: Transition ON_THE_WAY -> ARRIVED', res.data.success, `Current Status: ${res.data.data?.status}`);
  } catch (err) {
    record('State Machine: Transition ON_THE_WAY -> ARRIVED', false, err.message);
  }

  // 23. Technician creates price estimate
  let estimateId, estimateTotal;
  try {
    const res = await axios.post(`${BASE_URL}/estimates`, {
      booking_id: bookingId,
      technician_id: techUser.id,
      labor_charge: 650,
      material_charge: 850,
      inspection_charge: 99,
      additional_charge: 0,
      breakdown_notes: 'Replacement of burned terminal busbar and heavy-duty 32A fuse connector'
    }, { headers: techHeaders });
    estimateId = res.data.data.id;
    estimateTotal = res.data.data.total_estimate;
    record('Estimate: Technician Submit Quote', res.data.success, `Estimate ID: ${estimateId}, Total: ₹${estimateTotal}`);
  } catch (err) {
    record('Estimate: Technician Submit Quote', false, err.message);
  }

  // 24. Customer approves estimate (which transitions booking to IN_PROGRESS)
  try {
    const res = await axios.post(`${BASE_URL}/estimates/${estimateId}/approve`, {}, { headers: customerHeaders });
    record('Estimate: Customer Approve Quote', res.data.success, `Estimate Status: ${res.data.data?.status}`);
  } catch (err) {
    record('Estimate: Customer Approve Quote', false, err.message);
  }

  // 25. Technician completes work
  try {
    const res = await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'COMPLETED',
      notes: 'Wiring repaired, busbar replaced, and machine load tested successfully.'
    }, { headers: techHeaders });
    record('State Machine: Transition IN_PROGRESS -> COMPLETED', res.data.success, `Final Status: ${res.data.data?.status}`);
  } catch (err) {
    record('State Machine: Transition IN_PROGRESS -> COMPLETED', false, err.message);
  }

  // 26. Customer initiates and verifies payment
  try {
    const initPay = await axios.post(`${BASE_URL}/payments/initiate`, {
      booking_id: bookingId,
      payment_method: 'UPI',
      amount: estimateTotal
    }, { headers: customerHeaders });
    const paymentId = initPay.data.data.payment_id || initPay.data.data.id;

    const verifyPay = await axios.post(`${BASE_URL}/payments/sandbox-pay`, {
      payment_id: paymentId
    }, { headers: customerHeaders });

    record('Payment: Initiate & Sandbox Settle', verifyPay.data.success, `Payment ID: ${paymentId}, Status: ${verifyPay.data.data?.status || 'SUCCESS'}`);
  } catch (err) {
    record('Payment: Initiate & Sandbox Settle', false, err.message);
  }

  // 27. Customer submits review
  try {
    const res = await axios.post(`${BASE_URL}/reviews`, {
      booking_id: bookingId,
      technician_id: techUser.id,
      rating: 5,
      title: 'Superb rapid electrical repair in Tiruppur',
      comment: 'Arrived within 25 minutes. Fixed the industrial electrical trip immediately and gave a transparent quote.'
    }, { headers: customerHeaders });
    record('Review: Customer Submit Rating & Review', res.data.success, `Review ID: ${res.data.data?.id}, Rating: 5/5`);
  } catch (err) {
    record('Review: Customer Submit Rating & Review', false, err.message);
  }

  // 28. Customer Wallet check
  try {
    const res = await axios.get(`${BASE_URL}/customers/wallet`, { headers: customerHeaders });
    record('Customer: Wallet Balance & Transactions', res.data.success, `Balance: ₹${res.data.data?.wallet_balance}, Transactions: ${res.data.data?.transactions?.length}`);
  } catch (err) {
    record('Customer: Wallet Balance & Transactions', false, err.message);
  }

  // Clean up created test address
  if (testAddressId) {
    try {
      await axios.delete(`${BASE_URL}/addresses/${testAddressId}`, { headers: customerHeaders });
      record('Cleanup: Delete Test Address', true, `Deleted Address ID: ${testAddressId}`);
    } catch {
      // Ignored
    }
  }

  console.log('\n===========================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const pct = Math.round((passedCount / totalCount) * 100);
  console.log(`TOTAL REGRESSION TESTS RUN: ${totalCount}`);
  console.log(`PASSED: ${passedCount} / ${totalCount} (${pct}%)`);
  console.log('===========================================================');
}

runRegressionAudit();
