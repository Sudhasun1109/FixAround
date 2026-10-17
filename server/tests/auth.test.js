/**
 * FixAround — Auth Integration Tests
 * 
 * Tests: registration, login, duplicate email, invalid credentials,
 * expired token, role-based access control
 */
const { app, request, pool, createTestUser, cleanupTestUsers, closePool, generateTestToken } = require('./setup');

describe('Auth API', () => {
  afterAll(async () => {
    await cleanupTestUsers();
    await closePool();
  });

  // ==================== REGISTRATION ====================

  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test_reg_${Date.now()}@test.com`,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Customer',
          phone: '9100099001',
          role: 'customer'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should register a new technician successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test_tech_${Date.now()}@test.com`,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Technician',
          phone: '9200099001',
          role: 'technician'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('technician');
    });

    it('should reject duplicate email', async () => {
      const email = `test_dup_${Date.now()}@test.com`;
      
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          firstName: 'First',
          lastName: 'User',
          phone: '9100099002',
          role: 'customer'
        });

      // Duplicate registration
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'Password123!',
          firstName: 'Second',
          lastName: 'User',
          phone: '9100099003',
          role: 'customer'
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test_weak_${Date.now()}@test.com`,
          password: '123',
          firstName: 'Test',
          lastName: 'Weak',
          phone: '9100099004',
          role: 'customer'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'Invalid',
          phone: '9100099005',
          role: 'customer'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration without required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test_missing_${Date.now()}@test.com`
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== LOGIN ====================

  describe('POST /api/v1/auth/login', () => {
    let testEmail;

    beforeAll(async () => {
      testEmail = `test_login_${Date.now()}@test.com`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
          firstName: 'Login',
          lastName: 'Test',
          phone: '9100099010',
          role: 'customer'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@nowhere.com',
          password: 'Password123!'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ==================== GET ME ====================

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const { token } = await createTestUser({ email: `test_me_${Date.now()}@test.com` });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with expired token', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: 999, email: 'expired@test.com', role: 'customer' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Small delay to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toBe(401);
    });
  });

  // ==================== ROLE-BASED ACCESS ====================

  describe('Role-Based Access Control', () => {
    it('should deny customer access to admin endpoints', async () => {
      const { token } = await createTestUser({
        email: `test_rbac_c_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should deny technician access to admin endpoints', async () => {
      const { token } = await createTestUser({
        email: `test_rbac_t_${Date.now()}@test.com`,
        role: 'technician'
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });

    it('should deny customer access to technician-only endpoints', async () => {
      const { token } = await createTestUser({
        email: `test_rbac_ct_${Date.now()}@test.com`,
        role: 'customer'
      });

      const res = await request(app)
        .patch('/api/v1/technicians/availability')
        .set('Authorization', `Bearer ${token}`)
        .send({ isAvailable: true });

      expect(res.statusCode).toBe(403);
    });
  });
});
