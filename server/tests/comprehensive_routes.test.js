const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Comprehensive Endpoints & Frontend API Parity', () => {
  let customerUser, customerToken;
  let technicianUser, technicianToken;
  let adminUser, adminToken;
  let testBooking;

  beforeAll(async () => {
    const cust = await createTestUser({ role: 'customer' });
    customerUser = cust.user;
    customerToken = cust.token;

    const tech = await createTestUser({ role: 'technician', skills: [1] });
    technicianUser = tech.user;
    technicianToken = tech.token;

    const adm = await createTestUser({ role: 'admin' });
    adminUser = adm.user;
    adminToken = adm.token;

    const bookingRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        categoryId: 1,
        title: 'Comprehensive test booking',
        description: 'End-to-end endpoint verification',
        customerLatitude: 19.0760,
        customerLongitude: 72.8777,
        customerAddress: '123 Test Street'
      });
    testBooking = bookingRes.body.data;

    await pool.query(
      'UPDATE bookings SET technician_id = ?, status = "COMPLETED", final_total = 500 WHERE id = ?',
      [technicianUser.id, testBooking.id]
    );
  });

  afterAll(async () => {
    await cleanupTestUsers([customerUser.id, technicianUser.id, adminUser.id]);
    await closePool();
  });

  describe('Customer Address Management (/api/v1/customers/addresses)', () => {
    let createdAddressId;

    it('should create a new customer address', async () => {
      const res = await request(app)
        .post('/api/v1/customers/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          label: 'Home',
          address_line1: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          is_default: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.city).toBe('Mumbai');
      createdAddressId = res.body.data.id;
    });

    it('should list all customer addresses', async () => {
      const res = await request(app)
        .get('/api/v1/customers/addresses')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should update an existing address', async () => {
      const res = await request(app)
        .put(`/api/v1/customers/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          address_line1: '456 Updated Boulevard',
          city: 'Mumbai'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.address_line1).toBe('456 Updated Boulevard');
    });

    it('should set an address as default', async () => {
      const res = await request(app)
        .patch(`/api/v1/customers/addresses/${createdAddressId}/default`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should delete a customer address', async () => {
      const res = await request(app)
        .delete(`/api/v1/customers/addresses/${createdAddressId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Technician Extra Endpoints', () => {
    it('POST /technicians/location should update coordinates', async () => {
      const res = await request(app)
        .post('/api/v1/technicians/location')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ latitude: 19.0760, longitude: 72.8777 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.latitude).toBe(19.0760);
    });

    it('GET /technicians/:id/skills should retrieve technician skills', async () => {
      const res = await request(app)
        .get(`/api/v1/technicians/${technicianUser.id}/skills`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /technicians/documents and GET /technicians/documents should record and fetch metadata', async () => {
      const postRes = await request(app)
        .post('/api/v1/technicians/documents')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          document_type: 'ID_PROOF',
          document_name: 'Aadhaar Card Copy',
          file_url: 'https://example.com/uploads/aadhaar.pdf'
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);

      const getRes = await request(app)
        .get('/api/v1/technicians/documents')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(Array.isArray(getRes.body.data)).toBe(true);
      expect(getRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Technician Earnings Route Aliases', () => {
    it('GET /technicians/earnings should list earnings records', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/earnings')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /technicians/earnings/summary should return total earnings summary', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/earnings/summary')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_earned');
    });
  });

  describe('Direct Payments & Sandbox API Parity', () => {
    let paymentId;

    it('POST /payments/initiate should start payment with booking_id in body', async () => {
      const res = await request(app)
        .post('/api/v1/payments/initiate')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          booking_id: testBooking.id,
          amount: 500,
          payment_method: 'SANDBOX'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      paymentId = res.body.data.id || res.body.data.paymentId || (res.body.data.payment && res.body.data.payment.id);
    });

    it('POST /payments/sandbox-pay should verify payment with payment_id in body', async () => {
      const res = await request(app)
        .post('/api/v1/payments/sandbox-pay')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          payment_id: paymentId,
          booking_id: testBooking.id,
          amount: 500,
          status: 'SUCCESS'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /payments/booking/:bookingId should retrieve payment record', async () => {
      const res = await request(app)
        .get(`/api/v1/payments/booking/${testBooking.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Direct Estimates API Parity', () => {
    it('POST /estimates should allow technician to submit price estimate', async () => {
      const newBookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          title: 'Estimate test booking',
          description: 'Testing price estimates',
          customerLatitude: 19.0760,
          customerLongitude: 72.8777,
          customerAddress: '456 Test Ave'
        });
      const newBooking = newBookingRes.body.data;
      await pool.query('UPDATE bookings SET technician_id = ?, status = "ACCEPTED" WHERE id = ?', [technicianUser.id, newBooking.id]);

      const res = await request(app)
        .post('/api/v1/estimates')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          booking_id: newBooking.id,
          labor_charge: 300,
          material_charge: 200,
          notes: 'Standard service estimate'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(parseFloat(res.body.data.total_estimate)).toBe(500);

      const getRes = await request(app)
        .get(`/api/v1/estimates/booking/${newBooking.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
    });
  });

  describe('Invoices API Parity', () => {
    it('GET /invoices/booking/:bookingId should return invoice for booking', async () => {
      const res = await request(app)
        .get(`/api/v1/invoices/booking/${testBooking.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Notifications API Parity', () => {
    it('POST /notifications/mark-all-read should mark notifications read', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Admin Extended Monitoring & Verification Endpoints', () => {
    it('GET /admin/technicians/verification should list pending technicians', async () => {
      const res = await request(app)
        .get('/api/v1/admin/technicians/verification')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /admin/bookings/emergency should list emergency bookings', async () => {
      const res = await request(app)
        .get('/api/v1/admin/bookings/emergency')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /admin/claims should list warranty claims', async () => {
      const res = await request(app)
        .get('/api/v1/admin/claims')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /admin/reviews and PATCH /admin/reviews/:id/visibility', async () => {
      const getRes = await request(app)
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
    });
  });
});
