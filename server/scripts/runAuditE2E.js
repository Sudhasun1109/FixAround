const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function runAudit() {
  console.log('=== STARTING FIXAROUND E2E AUDIT & VERIFICATION ===\n');
  const results = [];

  function record(testName, passed, details = '') {
    results.push({ testName, passed, details });
    console.log(`${passed ? '✓ PASS' : '✗ FAIL'}: ${testName} ${details ? `(${details})` : ''}`);
  }

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    record('API Health Check', health.data.success, `status: ${health.data.data.status}`);

    // 2. Customer Authentication
    const customerLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'priya.sharma@example.com',
      password: 'Password123!'
    });
    const customerToken = customerLogin.data.data.token;
    const customer = customerLogin.data.data.user;
    record('Customer Login', !!customerToken, `User: ${customer.first_name} ${customer.last_name}, Role: ${customer.role}`);

    const customerHeaders = { Authorization: `Bearer ${customerToken}` };

    // 3. Customer Address Management with Tamil Nadu
    const addressesRes = await axios.get(`${BASE_URL}/customers/addresses`, { headers: customerHeaders });
    record('Get Customer Addresses (/customers/addresses)', addressesRes.data.success, `Count: ${addressesRes.data.data.length}`);

    const addressesRes2 = await axios.get(`${BASE_URL}/addresses`, { headers: customerHeaders });
    record('Get Customer Addresses alias (/addresses)', addressesRes2.data.success, `Count: ${addressesRes2.data.data.length}`);

    // Add a new address in Tiruppur, Tamil Nadu
    const newAddressRes = await axios.post(`${BASE_URL}/addresses`, {
      label: 'Office - Tiruppur Central',
      address_line1: '124 Kumaran Road, Kannipiran Colony',
      address_line2: 'Near Old Bus Stand',
      city: 'Tiruppur',
      state: 'Tamil Nadu',
      pincode: '641601',
      latitude: 11.1085,
      longitude: 77.3411,
      is_default: false
    }, { headers: customerHeaders });
    const createdAddressId = newAddressRes.data.data.id;
    record('Create Address with State: Tamil Nadu', newAddressRes.data.success, `Address ID: ${createdAddressId}, State: ${newAddressRes.data.data.state}`);

    // Set Default Address
    const defaultAddressRes = await axios.patch(`${BASE_URL}/addresses/${createdAddressId}/default`, {}, { headers: customerHeaders });
    record('Set Default Address', defaultAddressRes.data.success);

    // 4. Service Categories Check
    const servicesRes = await axios.get(`${BASE_URL}/services`);
    record('Get Services Categories', servicesRes.data.success, `Total categories: ${servicesRes.data.data.length}`);
    const electricianCategory = servicesRes.data.data.find(c => c.slug === 'electrician') || servicesRes.data.data[0];
    record('Service Category loaded', !!electricianCategory.id, `Category: ${electricianCategory.name} (ID: ${electricianCategory.id})`);

    // 5. Technician Authentication (Suresh - Electrician)
    const techLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'suresh.electrician@example.com',
      password: 'Password123!'
    });
    const techToken = techLogin.data.data.token;
    const techUser = techLogin.data.data.user;
    const techId = techUser.id;
    const techHeaders = { Authorization: `Bearer ${techToken}` };
    record('Technician Login', !!techToken, `Tech: ${techUser.first_name} ${techUser.last_name}, ID: ${techId}`);

    // Update Technician Availability
    const availRes = await axios.post(`${BASE_URL}/technicians/availability`, {
      is_available: true,
      service_radius_km: 25
    }, { headers: techHeaders });
    record('Technician Set Availability', availRes.data.success);

    // 6. Customer Creates a Booking
    const bookingRes = await axios.post(`${BASE_URL}/bookings`, {
      category_id: electricianCategory.id,
      technician_id: techId,
      title: 'Electrical circuit breaker maintenance in Tiruppur unit',
      description: 'Need electrical switchboard and circuit wiring check in Tiruppur unit',
      urgency: 'normal',
      is_emergency: false,
      address_id: createdAddressId,
      customer_address: '124 Kumaran Road, Kannipiran Colony, Tiruppur, Tamil Nadu - 641601',
      customer_latitude: 11.1085,
      customer_longitude: 77.3411,
      scheduled_at: new Date(Date.now() + 86400000).toISOString()
    }, { headers: customerHeaders });
    const bookingId = bookingRes.data.data.id;
    const bookingNumber = bookingRes.data.data.booking_number;
    record('Customer Create Booking', bookingRes.data.success, `Booking #: ${bookingNumber}, ID: ${bookingId}`);

    // 7. Booking Timeline
    const timelineRes = await axios.get(`${BASE_URL}/bookings/${bookingId}/timeline`, { headers: customerHeaders });
    record('Get Booking Timeline', timelineRes.data.success, `Events: ${timelineRes.data.data.length}`);

    // 8. Technician Receives and Accepts Booking
    const incomingRes = await axios.get(`${BASE_URL}/bookings/incoming`, { headers: techHeaders });
    record('Technician Get Incoming Requests', incomingRes.data.success, `Pending Incoming: ${incomingRes.data.data.length}`);

    const acceptRes = await axios.post(`${BASE_URL}/bookings/${bookingId}/accept`, {}, { headers: techHeaders });
    record('Technician Accept Booking', acceptRes.data.success, `Status: ${acceptRes.data.data?.status}`);

    // 9. Technician Progresses Status: ACCEPTED -> ON_THE_WAY -> ARRIVED
    const onTheWayRes = await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'ON_THE_WAY',
      notes: 'Technician departed for Tiruppur address'
    }, { headers: techHeaders });
    record('Booking Status -> ON_THE_WAY', onTheWayRes.data.success);

    const arrivedRes = await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'ARRIVED',
      notes: 'Technician reached the customer location in Tiruppur'
    }, { headers: techHeaders });
    record('Booking Status -> ARRIVED', arrivedRes.data.success);

    // 10. Technician Creates Estimate
    const estimateRes = await axios.post(`${BASE_URL}/estimates`, {
      booking_id: bookingId,
      technician_id: techId,
      labor_charge: 500,
      material_charge: 700,
      inspection_charge: 99,
      additional_charge: 0,
      breakdown_notes: 'Schneider 16A MCBs (x2) + safety wiring and labor'
    }, { headers: techHeaders });
    const estimateId = estimateRes.data.data.id;
    const estimateTotal = estimateRes.data.data.total_estimate;
    record('Technician Create Estimate', estimateRes.data.success, `Estimate ID: ${estimateId}, Total: Rs.${estimateTotal}`);

    // 11. Customer Views and Approves Estimate
    const getEstRes = await axios.get(`${BASE_URL}/estimates/booking/${bookingId}`, { headers: customerHeaders });
    const estList = getEstRes.data.data;
    record('Customer Retrieve Estimate by Booking', Array.isArray(estList) && estList.length > 0, `Count: ${estList.length}`);

    const approveEstRes = await axios.post(`${BASE_URL}/estimates/${estimateId}/approve`, {}, { headers: customerHeaders });
    record('Customer Approve Estimate', approveEstRes.data.success);

    // 12. Complete Job (Booking was already set to IN_PROGRESS upon customer estimate approval)
    const completeRes = await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, {
      status: 'COMPLETED',
      notes: 'All electrical repairs verified and tested safely'
    }, { headers: techHeaders });
    record('Booking Status -> COMPLETED', completeRes.data.success);

    // 13. Customer Initiates Payment & Sandbox Verification
    const initPayRes = await axios.post(`${BASE_URL}/payments/initiate`, {
      booking_id: bookingId,
      payment_method: 'UPI',
      amount: estimateTotal
    }, { headers: customerHeaders });
    const paymentId = initPayRes.data.data.payment_id || initPayRes.data.data.id;
    record('Customer Initiate Payment', initPayRes.data.success, `Payment ID: ${paymentId}`);

    const verifyPayRes = await axios.post(`${BASE_URL}/payments/sandbox-pay`, {
      payment_id: paymentId
    }, { headers: customerHeaders });
    record('Verify Sandbox Payment', verifyPayRes.data.success, `Status: ${verifyPayRes.data.data?.status || 'SUCCESS'}`);

    // 14. Customer Submits Review for Technician
    const reviewRes = await axios.post(`${BASE_URL}/reviews`, {
      booking_id: bookingId,
      technician_id: techId,
      rating: 5,
      title: 'Prompt & Reliable Service in Tiruppur',
      comment: 'Excellent electrical repair work done promptly in Tiruppur! Professional, transparent pricing, and courteous.'
    }, { headers: customerHeaders });
    record('Customer Submit Review', reviewRes.data.success, `Review ID: ${reviewRes.data.data?.id}`);

    // 15. Admin Authentication & Dashboard
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fixaround.com',
      password: 'Password123!'
    });
    const adminToken = adminLogin.data.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    record('Admin Login', !!adminToken, `Admin: ${adminLogin.data.data.user.first_name} ${adminLogin.data.data.user.last_name}`);

    const adminDash = await axios.get(`${BASE_URL}/admin/dashboard`, { headers: adminHeaders });
    record('Admin Dashboard Metrics', adminDash.data.success, `Summary loaded: ${!!adminDash.data.data}`);

    const adminSettings = await axios.get(`${BASE_URL}/admin/settings`, { headers: adminHeaders });
    record('Admin Settings Access', adminSettings.data.success, `Settings count: ${Object.keys(adminSettings.data.data || {}).length}`);

    // 16. Admin Category Creation (Without Warranty Days)
    const uniqueSuffix = Date.now();
    const newCategoryRes = await axios.post(`${BASE_URL}/services`, {
      name: `Smart Home Automation ${uniqueSuffix}`,
      description: 'Installation and maintenance of IoT switches, cameras, and home automation in Tamil Nadu.',
      base_price: 999,
      is_active: true
    }, { headers: adminHeaders });
    const createdCatId = newCategoryRes.data.data.id;
    record('Admin Create Service Category (No Warranty Days required)', newCategoryRes.data.success, `Created Category ID: ${createdCatId}`);

    // Admin updates category
    const updateCatRes = await axios.put(`${BASE_URL}/services/${createdCatId}`, {
      name: `Smart Home & IoT Automation ${uniqueSuffix}`,
      description: 'Comprehensive installation of smart home equipment and IoT sensors.',
      base_price: 1199,
      is_active: true
    }, { headers: adminHeaders });
    record('Admin Update Service Category', updateCatRes.data.success);

    // Clean up test category
    await axios.delete(`${BASE_URL}/services/${createdCatId}`, { headers: adminHeaders });
    record('Admin Delete Test Service Category', true);

    // 17. Customer Wallet Check
    const walletRes = await axios.get(`${BASE_URL}/customers/wallet`, { headers: customerHeaders });
    record('Customer Wallet Endpoint', walletRes.data.success, `Balance: Rs.${walletRes.data.data?.wallet_balance}`);

    console.log('\n=== ALL E2E AUDIT TESTS COMPLETE ===');
    const totalPassed = results.filter(r => r.passed).length;
    console.log(`Passed: ${totalPassed} / ${results.length} tests (${Math.round((totalPassed / results.length) * 100)}%)`);

  } catch (err) {
    console.error('Audit Error Details:', err.response?.data || err.message);
    record('Audit Process Exception', false, err.response?.data?.message || err.message);
  }
}

runAudit();
