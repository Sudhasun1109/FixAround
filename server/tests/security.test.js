/**
 * FixAround — Comprehensive Security Audit & Hardening Integration Tests
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool } = require('./setup');

describe('Security Audit & Hardening Verification', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  // ==================== 1. SECURITY HEADERS ====================
  describe('Security Headers (Helmet)', () => {
    it('should set protective security headers on responses', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers).toHaveProperty('content-security-policy');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  // ==================== 2. CORS SECURITY ====================
  describe('CORS Security', () => {
    it('should return CORS headers for trusted client origins', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should respond to preflight OPTIONS requests with allowed methods', async () => {
      const res = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.statusCode).toBe(204);
      expect(res.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  // ==================== 3. SQL INJECTION DEFENSE ====================
  describe('SQL Injection Defense', () => {
    it('should safely handle SQL injection payloads in search query parameters', async () => {
      const sqlInjectionPayload = "' OR '1'='1' -- ";
      const res = await request(app)
        .get(`/api/v1/technicians?search=${encodeURIComponent(sqlInjectionPayload)}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.technicians || res.body.data)).toBe(true);
    });

    it('should safely handle UNION SELECT injection attempts in parameters', async () => {
      const unionPayload = "1 UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13";
      const res = await request(app)
        .get(`/api/v1/services/${encodeURIComponent(unionPayload)}`);

      // Should return 404 or 400 safely without database crash
      expect([400, 404]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== 4. RBAC & PRIVILEGE ESCALATION ====================
  describe('Role-Based Access Control & Privilege Escalation', () => {
    it('should block unauthenticated access to admin endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block customer from accessing admin dashboard with 403', async () => {
      const { token } = await createTestUser({
        email: `sec_cust_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should block technician from accessing admin settings with 403', async () => {
      const { token } = await createTestUser({
        email: `sec_tech_${Date.now()}@test.com`,
        role: 'technician'
      });

      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== 5. ERROR SANITIZATION ====================
  describe('Error Handling & Information Disclosure Prevention', () => {
    it('should return clean JSON for 404 routes without leaking server details', async () => {
      const res = await request(app).get('/api/v1/non-existent-route-for-security-check');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Route not found');
    });

    it('should handle malformed JSON body gracefully with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ "email": "test@test.com", "password": '); // Incomplete JSON

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Malformed JSON');
    });
  });

  // ==================== 6. GOOGLE OAUTH SECURITY ====================
  describe('Google OAuth Endpoint Security', () => {
    it('should reject requests with missing credential', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ role: 'customer' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with non-string credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: { fake: 'token' } });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid role parameter', async () => {
      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'mock.jwt.token', role: 'superadmin' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
