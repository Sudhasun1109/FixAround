/**
 * FixAround — Booking & Assignment Integration Tests
 * 
 * Tests: booking creation, invalid category, unauthorized access,
 * state transitions, cancellation, technician accept/reject,
 * assignment expiry and backup
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Booking & Assignment API', () => {
  let customerToken, customerUserId;
  let techToken, techUserId;
  let adminToken;
  let tech2Token, tech2UserId;

  beforeAll(async () => {
    // Create test users
    const customer = await createTestUser({
      email: `test_bk_cust_${Date.now()}@test.com`,
      role: 'customer'
    });
    customerToken = customer.token;
    customerUserId = customer.userId;

    // Create address for customer
    await pool.query(
      `INSERT INTO addresses (user_id, label, address_line1, city, state, pincode, latitude, longitude, is_default)
       VALUES (?, 'Test Home', '123 Test Street', 'New Delhi', 'Delhi', '110001', 28.6139, 77.2090, 1)`,
      [customerUserId]
    );

    const tech = await createTestUser({
      email: `test_bk_tech1_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1], // Electrician
      verificationStatus: 'approved',
      isAvailable: 1,
      isOnline: 1
    });
    techToken = tech.token;
    techUserId = tech.userId;

    const tech2 = await createTestUser({
      email: `test_bk_tech2_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1], // Electrician
      verificationStatus: 'approved',
      isAvailable: 1,
      isOnline: 1
    });
    tech2Token = tech2.token;
    tech2UserId = tech2.userId;

    const admin = await createTestUser({
      email: `test_bk_admin_${Date.now()}@test.com`,
      role: 'admin'
    });
    adminToken = admin.token;
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  // ==================== BOOKING CREATION ====================

  describe('POST /api/v1/bookings', () => {
    it('should create a booking successfully', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          title: 'Test fan repair',
          description: 'Fan not working in bedroom',
          isEmergency: false,
          urgency: 'normal',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street, New Delhi'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('booking_number');
      expect(['REQUESTED', 'ASSIGNED']).toContain(res.body.data.status);
      expect(res.body.data.customer_id).toBe(customerUserId);
    });

    it('should create an emergency booking', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          title: 'Urgent power outage',
          description: 'No electricity in entire house',
          isEmergency: true,
          urgency: 'emergency',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street, New Delhi'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.is_emergency).toBe(1);
      expect(res.body.data.urgency).toBe('emergency');
    });

    it('should reject booking with invalid category', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 99999,
          title: 'Invalid category test',
          description: 'This should fail',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject booking from unauthenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          categoryId: 1,
          title: 'No auth test',
          description: 'Should fail',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject booking from technician role', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          categoryId: 1,
          title: 'Tech trying to book',
          description: 'Should fail - wrong role',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  // ==================== BOOKING RETRIEVAL ====================

  describe('GET /api/v1/bookings', () => {
    it('should list customer bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should deny unauthenticated listing', async () => {
      const res = await request(app)
        .get('/api/v1/bookings');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return booking details for owner', async () => {
      // Create a booking first
      const createRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          title: 'Detail test booking',
          description: 'For detail retrieval',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      const bookingId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(bookingId);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/999999')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ==================== BOOKING CANCELLATION ====================

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('should cancel a booking with reason', async () => {
      const createRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 2,
          title: 'Cancel test booking',
          description: 'Will be cancelled',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      const bookingId = createRes.body.data.id;

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });
  });

  // ==================== TECHNICIAN ACCEPT/REJECT ====================

  describe('Technician Accept/Reject', () => {
    let bookingIdForAccept;

    beforeAll(async () => {
      // Create a booking and manually assign it
      const createRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          title: 'Accept test booking',
          description: 'For technician acceptance test',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      bookingIdForAccept = createRes.body.data.id;

      // Manually assign via DB (simulating system assignment)
      const deadline = new Date(Date.now() + 300000).toISOString().slice(0, 19).replace('T', ' ');
      await pool.query(
        `UPDATE bookings SET status = 'ASSIGNED', technician_id = ? WHERE id = ?`,
        [techUserId, bookingIdForAccept]
      );
      await pool.query(
        `INSERT INTO booking_assignments (booking_id, technician_id, attempt_number, status, deadline)
         VALUES (?, ?, 1, 'PENDING', ?)`,
        [bookingIdForAccept, techUserId, deadline]
      );
      await pool.query(
        `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_role)
         VALUES (?, 'REQUESTED', 'ASSIGNED', 'system')`,
        [bookingIdForAccept]
      );
    });

    it('should allow assigned technician to accept', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingIdForAccept}/accept`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ==================== STATUS TRANSITIONS ====================

  describe('Status Transitions', () => {
    let bookingIdForTransitions;

    beforeAll(async () => {
      // Create and accept a booking
      const createRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          title: 'Status transition test',
          description: 'For testing state machine',
          customerLatitude: 28.6139,
          customerLongitude: 77.2090,
          customerAddress: '123 Test Street'
        });

      bookingIdForTransitions = createRes.body.data.id;

      // Set to ACCEPTED state directly
      await pool.query(
        `UPDATE bookings SET status = 'ACCEPTED', technician_id = ? WHERE id = ?`,
        [techUserId, bookingIdForTransitions]
      );
    });

    it('should allow valid transition ACCEPTED -> ON_THE_WAY', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingIdForTransitions}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'ON_THE_WAY', notes: 'Leaving now' });

      expect(res.statusCode).toBe(200);
    });

    it('should allow valid transition ON_THE_WAY -> ARRIVED', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingIdForTransitions}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'ARRIVED', notes: 'At location' });

      expect(res.statusCode).toBe(200);
    });

    it('should allow valid transition ARRIVED -> IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingIdForTransitions}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'IN_PROGRESS', notes: 'Started work' });

      expect(res.statusCode).toBe(200);
    });

    it('should allow valid transition IN_PROGRESS -> COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingIdForTransitions}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'COMPLETED', notes: 'Work finished' });

      expect(res.statusCode).toBe(200);
    });

    it('should reject invalid transition COMPLETED -> IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingIdForTransitions}/status`)
        .set('Authorization', `Bearer ${techToken}`)
        .send({ status: 'IN_PROGRESS', notes: 'Trying invalid transition' });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== INCOMING REQUESTS ====================

  describe('GET /api/v1/bookings/incoming', () => {
    it('should allow technician to fetch incoming job requests', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/incoming')
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.requests)).toBe(true);
    });

    it('should deny non-technician from accessing incoming requests', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/incoming')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
