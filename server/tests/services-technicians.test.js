/**
 * FixAround — Services & Technicians Integration Tests
 * 
 * Tests: service listing, technician search, Haversine nearby,
 * admin category management, verification
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Services & Technicians API', () => {
  let adminToken;
  let techToken, techUserId;

  beforeAll(async () => {
    const admin = await createTestUser({
      email: `test_svc_admin_${Date.now()}@test.com`,
      role: 'admin'
    });
    adminToken = admin.token;

    const tech = await createTestUser({
      email: `test_svc_tech_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1, 2],
      verificationStatus: 'approved',
      isAvailable: 1,
      isOnline: 1,
      latitude: 28.6139,
      longitude: 77.2090
    });
    techToken = tech.token;
    techUserId = tech.userId;
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  // ==================== SERVICES ====================

  describe('GET /api/v1/services', () => {
    it('should list all active service categories', async () => {
      const res = await request(app).get('/api/v1/services');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should include price ranges in categories', async () => {
      const res = await request(app).get('/api/v1/services');

      const firstCategory = res.body.data[0];
      expect(firstCategory).toHaveProperty('min_price');
      expect(firstCategory).toHaveProperty('max_price');
      expect(firstCategory).toHaveProperty('name');
    });
  });

  describe('GET /api/v1/services/:id', () => {
    it('should return a single service category', async () => {
      const res = await request(app).get('/api/v1/services/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('slug');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app).get('/api/v1/services/99999');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/v1/services (Admin)', () => {
    it('should allow admin to create a category', async () => {
      const slug = `test-cat-${Date.now()}`;
      const res = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          slug,
          description: 'A test category',
          icon: 'Wrench',
          minPrice: 100,
          maxPrice: 5000,
          inspectionCharge: 99,
          warrantyPeriodDays: 7
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);

      // Clean up
      await pool.query('DELETE FROM service_categories WHERE slug = ?', [slug]);
    });

    it('should deny non-admin from creating category', async () => {
      const res = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          name: 'Unauthorized',
          slug: 'unauthorized',
          description: 'Should fail'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  // ==================== TECHNICIANS ====================

  describe('GET /api/v1/technicians', () => {
    it('should list verified technicians', async () => {
      const res = await request(app).get('/api/v1/technicians');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/technicians/nearby', () => {
    it('should find nearby technicians with Haversine', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/nearby')
        .query({
          latitude: 28.6139,
          longitude: 77.2090,
          radiusKm: 20,
          categoryId: 1
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return empty array for distant coordinates', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/nearby')
        .query({
          latitude: 0.0001,
          longitude: 0.0001,
          radiusKm: 1
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('PATCH /api/v1/technicians/availability', () => {
    it('should allow technician to toggle availability', async () => {
      const res = await request(app)
        .patch('/api/v1/technicians/availability')
        .set('Authorization', `Bearer ${techToken}`)
        .send({ isAvailable: true, isOnline: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject availability change from customer', async () => {
      const customer = await createTestUser({
        email: `test_svc_cust_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .patch('/api/v1/technicians/availability')
        .set('Authorization', `Bearer ${customer.token}`)
        .send({ isAvailable: true });

      expect(res.statusCode).toBe(403);
    });
  });

  // ==================== TECHNICIAN VERIFICATION ====================

  describe('PATCH /api/v1/technicians/:id/verify (Admin)', () => {
    it('should allow admin to verify a technician', async () => {
      // Create a pending technician
      const pending = await createTestUser({
        email: `test_svc_pend_${Date.now()}@test.com`,
        role: 'technician',
        verificationStatus: 'pending'
      });

      const res = await request(app)
        .patch(`/api/v1/technicians/${pending.userId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          notes: 'Documents verified successfully'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should deny verification from non-admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/technicians/${techUserId}/verify`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'approved' });

      expect(res.statusCode).toBe(403);
    });
  });
});
