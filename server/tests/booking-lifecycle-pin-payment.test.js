/**
 * FixAround — Complete Service Booking, Technician Acceptance,
 * 4-Digit PIN Verification and Payment Integration Tests
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Full Service Booking, 4-Digit PIN Verification & Payment Workflow', () => {
  let customerToken, customerUserId;
  let techToken, techUserId;
  let otherCustomerToken;
  let testBookingId;
  let correctPin;

  beforeAll(async () => {
    // 1. Create Customer
    const customer = await createTestUser({
      email: `test_workflow_cust_${Date.now()}@test.com`,
      role: 'customer'
    });
    customerToken = customer.token;
    customerUserId = customer.userId;

    // Create address for customer
    await pool.query(
      `INSERT INTO addresses (user_id, label, address_line1, city, state, pincode, latitude, longitude, is_default)
       VALUES (?, 'Primary Residence', '45 Park Avenue', 'New Delhi', 'Delhi', '110001', 28.6139, 77.2090, 1)`,
      [customerUserId]
    );

    // 2. Create Technician
    const tech = await createTestUser({
      email: `test_workflow_tech_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1], // Electrician
      verificationStatus: 'approved',
      isAvailable: 1,
      isOnline: 1
    });
    techToken = tech.token;
    techUserId = tech.userId;

    // 3. Create another customer to test unauthorized PIN access
    const otherCustomer = await createTestUser({
      email: `test_workflow_other_${Date.now()}@test.com`,
      role: 'customer'
    });
    otherCustomerToken = otherCustomer.token;
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  // STEP 1: Customer creates booking for service category with selected technician
  it('STEP 1: Customer creates service booking with selected technician (status: REQUESTED)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        categoryId: 1,
        technician_id: techUserId,
        title: 'Master Bedroom Circuit Breaker Tripping',
        description: 'Breaker trips whenever AC and lights are turned on.',
        urgency: 'normal',
        customerAddress: '45 Park Avenue, New Delhi - 110001',
        customerLatitude: 28.6139,
        customerLongitude: 77.2090
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    testBookingId = res.body.data.id;
    expect(res.body.data.technician_id).toBe(techUserId);
    expect(['REQUESTED', 'ASSIGNED']).toContain(res.body.data.status);
  });

  // STEP 2: Technician receives the request in incoming requests feed
  it('STEP 2: Technician sees incoming booking request in dispatch feed', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/incoming')
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    const requests = res.body.data.requests || [];
    const found = requests.some((r) => (r.booking_id || r.id) === testBookingId);
    expect(found).toBe(true);
  });

  // STEP 3: Technician accepts booking request
  it('STEP 3: Technician accepts booking request -> status becomes ACCEPTED', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/accept`)
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify booking status in database
    const [rows] = await pool.query('SELECT status FROM bookings WHERE id = ?', [testBookingId]);
    expect(rows[0].status).toBe('ACCEPTED');
  });

  // STEP 4: Technician updates status: ON_THE_WAY -> ARRIVED -> IN_PROGRESS
  it('STEP 4: Technician transitions through service execution: ON_THE_WAY -> ARRIVED -> IN_PROGRESS', async () => {
    // 4a. Mark ON_THE_WAY
    let res = await request(app)
      .patch(`/api/v1/bookings/${testBookingId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'ON_THE_WAY', notes: 'En route with equipment' });
    expect(res.statusCode).toBe(200);

    // 4b. Mark ARRIVED
    res = await request(app)
      .patch(`/api/v1/bookings/${testBookingId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'ARRIVED', notes: 'Arrived at customer location' });
    expect(res.statusCode).toBe(200);

    // 4c. Mark IN_PROGRESS
    res = await request(app)
      .patch(`/api/v1/bookings/${testBookingId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'IN_PROGRESS', notes: 'Repair work commenced' });
    expect(res.statusCode).toBe(200);
  });

  // STEP 5: Technician generates 4-digit completion PIN
  it('STEP 5: Technician generates completion PIN -> status becomes AWAITING_CUSTOMER_VERIFICATION', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/generate-pin`)
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AWAITING_CUSTOMER_VERIFICATION');
    // SECURITY: Technician response MUST NOT leak the PIN!
    expect(res.body.data.pin).toBeUndefined();

    // Verify DB status
    const [rows] = await pool.query('SELECT status, verification_pin_hash, pin_expires_at FROM bookings WHERE id = ?', [testBookingId]);
    expect(rows[0].status).toBe('AWAITING_CUSTOMER_VERIFICATION');
    expect(rows[0].verification_pin_hash).toBeTruthy();
    expect(rows[0].pin_expires_at).toBeTruthy();
  });

  // STEP 6: Customer retrieves 4-digit PIN securely
  it('STEP 6: Booking customer retrieves their 4-digit verification PIN', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${testBookingId}/verification-pin`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.has_pin).toBe(true);
    expect(res.body.data.is_expired).toBe(false);
    expect(res.body.data.pin).toMatch(/^\d{4}$/);
    correctPin = res.body.data.pin;
  });

  // STEP 7: Security check - Unauthorized customer cannot access another customer's PIN
  it('STEP 7: Security: Unauthorized customer is forbidden from retrieving the PIN (403)', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${testBookingId}/verification-pin`)
      .set('Authorization', `Bearer ${otherCustomerToken}`);

    expect(res.statusCode).toBe(403);
  });

  // STEP 8: Technician submits incorrect PIN -> rejected with 400
  it('STEP 8: Technician enters wrong PIN -> rejected with 400 and attempt count increments', async () => {
    const wrongPin = correctPin === '1234' ? '9999' : '1234';
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/verify-pin`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ pin: wrongPin });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);

    // Verify attempt count in DB
    const [rows] = await pool.query('SELECT pin_attempt_count, status FROM bookings WHERE id = ?', [testBookingId]);
    expect(rows[0].pin_attempt_count).toBeGreaterThanOrEqual(1);
    expect(rows[0].status).toBe('AWAITING_CUSTOMER_VERIFICATION');
  });

  // STEP 9: Technician enters correct PIN -> verified successfully (status: VERIFIED)
  it('STEP 9: Technician enters correct PIN -> verified successfully (status: VERIFIED)', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/verify-pin`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ pin: correctPin });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('VERIFIED');

    // Verify DB status
    const [rows] = await pool.query('SELECT status, pin_verified_at FROM bookings WHERE id = ?', [testBookingId]);
    expect(rows[0].status).toBe('VERIFIED');
    expect(rows[0].pin_verified_at).toBeTruthy();
  });

  // STEP 10: Complete payment -> marks COMPLETED
  it('STEP 10: Payment confirmation recorded -> marks COMPLETED and logs technician earnings', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/payment`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        payment_method: 'UPI',
        amount: 750,
        notes: 'Paid via Google Pay UPI'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(['SUCCESS', 'PAID']).toContain(res.body.data.payment_status);

    // Verify DB payments & technician earnings
    const [payRows] = await pool.query('SELECT * FROM payments WHERE booking_id = ?', [testBookingId]);
    expect(payRows.length).toBeGreaterThanOrEqual(1);
    expect(payRows[0].status).toBe('SUCCESS');

    const [earnRows] = await pool.query('SELECT * FROM technician_earnings WHERE booking_id = ?', [testBookingId]);
    expect(earnRows.length).toBeGreaterThanOrEqual(1);
    expect(Number(earnRows[0].gross_amount)).toBe(750);
  });

  // STEP 11: Customer rates and reviews technician for this completed booking
  it('STEP 11: Customer submits review & 5-star rating for completed booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${testBookingId}/reviews`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        rating: 5,
        review: 'Fixed our tripping circuit breaker in 20 minutes! Very professional and polite specialist.',
        punctualityRating: 5,
        professionalismRating: 5,
        qualityRating: 5
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
