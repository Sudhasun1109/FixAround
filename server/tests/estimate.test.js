/**
 * FixAround — Estimate Integration Tests
 * 
 * Tests: estimate submission, approval, rejection, revision,
 * unauthorized changes, price validation
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Estimate API', () => {
  let customerToken, customerUserId;
  let techToken, techUserId;
  let bookingId;

  beforeAll(async () => {
    const customer = await createTestUser({
      email: `test_est_cust_${Date.now()}@test.com`,
      role: 'customer'
    });
    customerToken = customer.token;
    customerUserId = customer.userId;

    const tech = await createTestUser({
      email: `test_est_tech_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1],
      verificationStatus: 'approved'
    });
    techToken = tech.token;
    techUserId = tech.userId;

    // Create a booking in ACCEPTED state
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        categoryId: 1,
        title: 'Estimate test booking',
        description: 'For estimate tests',
        customerLatitude: 28.6139,
        customerLongitude: 77.2090,
        customerAddress: '123 Test Street'
      });
    bookingId = createRes.body.data.id;

    // Set to ACCEPTED with technician assigned
    await pool.query(
      `UPDATE bookings SET status = 'ACCEPTED', technician_id = ? WHERE id = ?`,
      [techUserId, bookingId]
    );
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  describe('POST /api/v1/bookings/:id/estimates', () => {
    it('should allow technician to submit an estimate', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/estimates`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          laborCharge: 250.00,
          materialCharge: 150.00,
          inspectionCharge: 99.00,
          additionalCharge: 0,
          breakdownNotes: 'Labor: Fan repair\nMaterial: New capacitor'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_estimate).toBe(499);
      expect(res.body.data.status).toBe('SUBMITTED');
    });

    it('should reject estimate from customer', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/estimates`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          laborCharge: 250,
          materialCharge: 150,
          inspectionCharge: 99,
          additionalCharge: 0
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject estimate with negative amounts', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/estimates`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          laborCharge: -100,
          materialCharge: 150,
          inspectionCharge: 99,
          additionalCharge: 0
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/bookings/:id/estimates', () => {
    it('should list estimates for a booking', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}/estimates`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Estimate Approval/Rejection', () => {
    let estimateId;

    beforeAll(async () => {
      // Get the estimate ID
      const listRes = await request(app)
        .get(`/api/v1/bookings/${bookingId}/estimates`)
        .set('Authorization', `Bearer ${customerToken}`);

      estimateId = listRes.body.data[0].id;
    });

    it('should allow customer to approve estimate', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/estimates/${estimateId}/approve`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject approval from non-owner customer', async () => {
      const otherCustomer = await createTestUser({
        email: `test_est_other_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/estimates/${estimateId}/approve`)
        .set('Authorization', `Bearer ${otherCustomer.token}`);

      // Should be 403 or 404 since this customer doesn't own the booking
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });
});
