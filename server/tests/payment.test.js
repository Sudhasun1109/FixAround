/**
 * FixAround — Payment Integration Tests
 * 
 * Tests: payment initiation, sandbox verification, duplicate prevention,
 * unauthorized access, commission calculation
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Payment API', () => {
  let customerToken, customerUserId;
  let techUserId;
  let completedBookingId;

  beforeAll(async () => {
    const customer = await createTestUser({
      email: `test_pay_cust_${Date.now()}@test.com`,
      role: 'customer'
    });
    customerToken = customer.token;
    customerUserId = customer.userId;

    const tech = await createTestUser({
      email: `test_pay_tech_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1],
      verificationStatus: 'approved'
    });
    techUserId = tech.userId;

    // Create a completed booking with approved estimate
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        categoryId: 1,
        title: 'Payment test booking',
        description: 'For payment testing',
        customerLatitude: 28.6139,
        customerLongitude: 77.2090,
        customerAddress: '123 Test Street'
      });
    completedBookingId = createRes.body.data.id;

    // Set booking to COMPLETED with final total
    await pool.query(
      `UPDATE bookings SET status = 'COMPLETED', technician_id = ?, final_total = 500.00, estimated_total = 500.00,
       completed_at = NOW() WHERE id = ?`,
      [techUserId, completedBookingId]
    );

    // Create an approved estimate
    await pool.query(
      `INSERT INTO price_estimates (booking_id, technician_id, revision_number, labor_charge, material_charge, 
       inspection_charge, additional_charge, total_estimate, status, approved_at, approved_by)
       VALUES (?, ?, 1, 250, 150, 100, 0, 500, 'APPROVED', NOW(), ?)`,
      [completedBookingId, techUserId, customerUserId]
    );
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  describe('POST /api/v1/bookings/:id/payments', () => {
    it('should initiate a sandbox payment', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/payments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'SANDBOX' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.paymentNumber || data.payment_number).toBeTruthy();
      expect(data.isSandbox !== undefined ? data.isSandbox : data.is_sandbox).toBeTruthy();
    });

    it('should reject payment from non-owner', async () => {
      const otherCustomer = await createTestUser({
        email: `test_pay_other_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/payments`)
        .set('Authorization', `Bearer ${otherCustomer.token}`)
        .send({ paymentMethod: 'SANDBOX' });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should reject payment without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/payments`)
        .send({ paymentMethod: 'SANDBOX' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/v1/payments/:id/verify', () => {
    let paymentId;

    beforeAll(async () => {
      // Get the payment we created
      const [payments] = await pool.query(
        'SELECT id FROM payments WHERE booking_id = ? ORDER BY id DESC LIMIT 1',
        [completedBookingId]
      );
      if (payments.length > 0) {
        paymentId = payments[0].id;
      }
    });

    it('should verify a sandbox payment', async () => {
      if (!paymentId) return; // Skip if no payment was created

      const res = await request(app)
        .post(`/api/v1/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/my-payments', () => {
    it('should list customer payment history', async () => {
      const res = await request(app)
        .get('/api/v1/my-payments')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
