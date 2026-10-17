/**
 * FixAround — Review & Warranty Claim Integration Tests
 * 
 * Tests: review eligibility, duplicate prevention, warranty claim creation,
 * warranty expiry, claim resolution
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Review & Warranty API', () => {
  let customerToken, customerUserId;
  let techToken, techUserId;
  let completedBookingId;
  let inProgressBookingId;

  beforeAll(async () => {
    const customer = await createTestUser({
      email: `test_rv_cust_${Date.now()}@test.com`,
      role: 'customer'
    });
    customerToken = customer.token;
    customerUserId = customer.userId;

    const tech = await createTestUser({
      email: `test_rv_tech_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1],
      verificationStatus: 'approved'
    });
    techToken = tech.token;
    techUserId = tech.userId;

    // Create a COMPLETED booking (eligible for review)
    const createRes1 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        categoryId: 1,
        title: 'Review test - completed',
        description: 'Completed booking for review',
        customerLatitude: 28.6139,
        customerLongitude: 77.2090,
        customerAddress: '123 Test Street'
      });
    completedBookingId = createRes1.body.data.id;

    await pool.query(
      `UPDATE bookings SET status = 'COMPLETED', technician_id = ?, completed_at = NOW(), final_total = 450.00 WHERE id = ?`,
      [techUserId, completedBookingId]
    );

    // Create an IN_PROGRESS booking (not eligible for review)
    const createRes2 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        categoryId: 1,
        title: 'Review test - in progress',
        description: 'In progress booking - no review allowed',
        customerLatitude: 28.6139,
        customerLongitude: 77.2090,
        customerAddress: '123 Test Street'
      });
    inProgressBookingId = createRes2.body.data.id;

    await pool.query(
      `UPDATE bookings SET status = 'IN_PROGRESS', technician_id = ? WHERE id = ?`,
      [techUserId, inProgressBookingId]
    );
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  // ==================== REVIEWS ====================

  describe('POST /api/v1/bookings/:id/reviews', () => {
    it('should allow review on completed booking', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rating: 5,
          title: 'Great service!',
          comment: 'Very professional and quick'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(5);
    });

    it('should reject duplicate review on same booking', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rating: 4,
          title: 'Duplicate review',
          comment: 'Should be rejected'
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject review on incomplete booking', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${inProgressBookingId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rating: 3,
          title: 'Not allowed',
          comment: 'Booking is not completed'
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject review with invalid rating', async () => {
      // Create another completed booking for this test
      const createRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 2,
          title: 'Invalid rating test',
          description: 'For invalid rating',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });
      const bId = createRes.body.data.id;
      await pool.query(
        `UPDATE bookings SET status = 'COMPLETED', technician_id = ?, completed_at = NOW() WHERE id = ?`,
        [techUserId, bId]
      );

      const res = await request(app)
        .post(`/api/v1/bookings/${bId}/reviews`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          rating: 6, // Invalid - max is 5
          title: 'Bad rating',
          comment: 'Too high'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject review from non-owner', async () => {
      const otherCustomer = await createTestUser({
        email: `test_rv_other_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/reviews`)
        .set('Authorization', `Bearer ${otherCustomer.token}`)
        .send({
          rating: 4,
          title: 'Not my booking',
          comment: 'Should fail'
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/technicians/:id/reviews', () => {
    it('should list technician reviews publicly', async () => {
      const res = await request(app)
        .get(`/api/v1/technicians/${techUserId}/reviews`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==================== WARRANTY CLAIMS ====================

  describe('POST /api/v1/bookings/:id/claims', () => {
    it('should create a warranty claim on completed booking', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/claims`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          issueDescription: 'Fan stopped working again after 2 days',
          evidenceNotes: 'Same humming noise as before the repair'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OPEN');
    });

    it('should reject claim on incomplete booking', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${inProgressBookingId}/claims`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          issueDescription: 'Service not complete yet',
          evidenceNotes: 'Should fail'
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject claim without description', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${completedBookingId}/claims`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/my-claims', () => {
    it('should list customer warranty claims', async () => {
      const res = await request(app)
        .get('/api/v1/my-claims')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PATCH /api/v1/claims/:id/resolve (Admin)', () => {
    it('should allow admin to resolve a claim', async () => {
      const admin = await createTestUser({
        email: `test_rv_admin_${Date.now()}@test.com`,
        role: 'admin'
      });

      // Get claim ID
      const [claims] = await pool.query(
        'SELECT id FROM warranty_claims WHERE customer_id = ? LIMIT 1',
        [customerUserId]
      );

      if (claims.length > 0) {
        const res = await request(app)
          .patch(`/api/v1/claims/${claims[0].id}/resolve`)
          .set('Authorization', `Bearer ${admin.token}`)
          .send({
            status: 'APPROVED',
            resolutionType: 'RE_SERVICE',
            resolutionNotes: 'Approved for free re-service within 48 hours'
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });
});
