const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');
const technicianWalletService = require('../src/services/technicianWallet.service');

describe('FixAround Advanced Marketplace — Wallet, Backup Technician & WebRTC Communication', () => {
  let customerToken, customerUserId;
  let tech1Token, tech1UserId;
  let tech2Token, tech2UserId;
  let testBookingId;
  let backupRequestId;

  beforeAll(async () => {
    // 1. Create Customer
    const customer = await createTestUser({
      email: `adv_cust_${Date.now()}@test.com`,
      role: 'customer'
    });
    customerToken = customer.token;
    customerUserId = customer.userId;

    // 2. Create Primary Technician
    const tech1 = await createTestUser({
      email: `adv_tech1_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1], // Electrician
      verificationStatus: 'approved',
      isAvailable: 1,
      isOnline: 1
    });
    tech1Token = tech1.token;
    tech1UserId = tech1.userId;

    // 3. Create Backup Technician
    const tech2 = await createTestUser({
      email: `adv_tech2_${Date.now()}@test.com`,
      role: 'technician',
      skills: [1], // Electrician
      verificationStatus: 'approved',
      isAvailable: 1,
      isOnline: 1
    });
    tech2Token = tech2.token;
    tech2UserId = tech2.userId;
  });

  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  describe('PHASE 7: 15% Platform Commission & Technician Wallet (Scenarios A & B)', () => {
    let techWalletUserId;

    beforeAll(async () => {
      // Dedicated technician for isolated wallet scenario math
      const wTech = await createTestUser({
        email: `wallet_test_tech_${Date.now()}@test.com`,
        role: 'technician',
        skills: [1],
        verificationStatus: 'approved'
      });
      techWalletUserId = wTech.userId;
    });

    it('Scenario A: Cash payment of ₹1,000 -> 15% commission liability (₹150) charged to technician', async () => {
      const result = await technicianWalletService.recordCashPayment({
        bookingId: 99991,
        technicianId: techWalletUserId,
        grossAmount: 1000,
        bookingNumber: 'BK-TEST-CASH'
      });

      expect(result.grossAmount).toBe(1000);
      expect(result.commissionRate).toBe(15);
      expect(result.commissionAmount).toBe(150);
      expect(result.newOutstanding).toBe(150);
      expect(result.availableBalance).toBe(0);

      // Verify wallet summary
      const summary = await technicianWalletService.getWalletSummary(techWalletUserId);
      expect(summary.outstanding_commission).toBe(150);
      expect(summary.total_cash_collected).toBe(1000);
      expect(summary.available_balance).toBe(0);
      expect(summary.net_balance).toBe(-150);
    });

    it('Scenario B: Online payment of ₹2,000 following ₹150 cash liability -> deducts ₹300 current + ₹150 prior = ₹450 -> credits ₹1,550 net', async () => {
      const result = await technicianWalletService.recordOnlinePayment({
        bookingId: 99992,
        technicianId: techWalletUserId,
        grossAmount: 2000,
        bookingNumber: 'BK-TEST-ONLINE'
      });

      expect(result.grossAmount).toBe(2000);
      expect(result.commissionRate).toBe(15);
      expect(result.commissionAmount).toBe(300);
      expect(result.previousOutstanding).toBe(150);
      expect(result.commissionDeducted).toBe(450); // ₹300 current + ₹150 prior
      expect(result.netPayable).toBe(1550); // ₹2,000 - ₹450
      expect(result.newOutstanding).toBe(0); // Liability cleared!
      expect(result.availableBalance).toBe(1550);

      // Verify wallet summary
      const summary = await technicianWalletService.getWalletSummary(techWalletUserId);
      expect(summary.outstanding_commission).toBe(0);
      expect(summary.available_balance).toBe(1550);
      expect(summary.total_online_earnings).toBe(2000);
      expect(summary.total_commission_paid).toBe(450);
      expect(summary.net_balance).toBe(1550);
    });

    it('Ledger verification: Transaction history preserves immutable records with exact details', async () => {
      const ledger = await technicianWalletService.getTransactions(techWalletUserId);
      expect(ledger.transactions.length).toBe(2);

      const [onlineTx, cashTx] = ledger.transactions;
      expect(onlineTx.transaction_type).toBe('ONLINE_PAYOUT');
      expect(onlineTx.commission_deducted).toBe(450);
      expect(onlineTx.net_amount).toBe(1550);
      expect(onlineTx.new_outstanding).toBe(0);

      expect(cashTx.transaction_type).toBe('CASH_COLLECTED');
      expect(cashTx.commission_amount).toBe(150);
      expect(cashTx.new_outstanding).toBe(150);
    });
  });

  describe('PHASE 5: Backup Technician Workflow', () => {
    it('Creates an active booking assigned to Technician 1', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          categoryId: 1,
          technician_id: tech1UserId,
          title: 'Emergency Wiring Fix',
          description: 'Sparks from main switchboard',
          urgency: 'urgent',
          customerAddress: '12 Brigade Road, Bangalore',
          customerLatitude: 12.9716,
          customerLongitude: 77.5946
        });

      expect(res.statusCode).toBe(201);
      testBookingId = res.body.data.id;

      // Tech 1 accepts
      await request(app)
        .post(`/api/v1/bookings/${testBookingId}/accept`)
        .set('Authorization', `Bearer ${tech1Token}`);

      // Tech 1 moves to ON_THE_WAY
      await request(app)
        .patch(`/api/v1/bookings/${testBookingId}/status`)
        .set('Authorization', `Bearer ${tech1Token}`)
        .send({ status: 'ON_THE_WAY' });
    });

    it('Technician 1 requests backup due to VEHICLE_BREAKDOWN', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/${testBookingId}/backup/request`)
        .set('Authorization', `Bearer ${tech1Token}`)
        .send({
          reason: 'VEHICLE_BREAKDOWN',
          explanation: 'Motorcycle flat tire on MG Road'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.reason).toBe('VEHICLE_BREAKDOWN');
      backupRequestId = res.body.data.id;
    });

    it('Technician 2 sees incoming backup request in feed', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/backup-requests')
        .set('Authorization', `Bearer ${tech2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const list = res.body.data || [];
      const found = list.some(r => r.id === backupRequestId);
      expect(found).toBe(true);
    });

    it('Technician 2 accepts backup request -> booking transferred seamlessly to Technician 2', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/backup/${backupRequestId}/accept`)
        .set('Authorization', `Bearer ${tech2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.technician_id).toBe(tech2UserId);

      // Verify in DB that booking technician_id is now tech2UserId
      const [rows] = await pool.query('SELECT technician_id FROM bookings WHERE id = ?', [testBookingId]);
      expect(rows[0].technician_id).toBe(tech2UserId);
    });

    it('Concurrency check: Duplicate acceptance attempt is rejected', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/backup/${backupRequestId}/accept`)
        .set('Authorization', `Bearer ${tech2Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PHASE 4: Ongoing Work Endpoint', () => {
    it('Technician 2 sees the accepted booking in ongoing work endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/ongoing-bookings')
        .set('Authorization', `Bearer ${tech2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const ongoing = res.body.data || [];
      const found = ongoing.some(b => b.id === testBookingId);
      expect(found).toBe(true);
    });
  });

  describe('PHASE 2 & 3: WebRTC Call Sessions & Estimate Approval Check', () => {
    it('Creates and retrieves WebRTC call session for booking', async () => {
      // Insert a mock call session
      await pool.query(
        `INSERT INTO call_sessions 
         (booking_id, caller_id, receiver_id, call_type, status, started_at, duration_seconds)
         VALUES (?, ?, ?, 'video', 'ended', UTC_TIMESTAMP(), 145)`,
        [testBookingId, customerUserId, tech2UserId]
      );

      const res = await request(app)
        .get(`/api/v1/bookings/${testBookingId}/call-session`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].call_type).toBe('video');
    });

    it('Technician views their wallet via REST endpoint', async () => {
      const res = await request(app)
        .get('/api/v1/technicians/wallet')
        .set('Authorization', `Bearer ${tech2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('available_balance');
      expect(res.body.data).toHaveProperty('outstanding_commission');
      expect(res.body.data.commission_rate).toBe(15);
    });
  });
});
