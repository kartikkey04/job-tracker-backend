import request from 'supertest';
import app from '../../app';

describe('Auth Integration Tests', () => {
  describe('Complete Auth Flow', () => {
    let accessToken: string;
    let refreshToken: string;
    let userId: string;

    it('should register a new user', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'Password123',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(userData.name);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
      userId = res.body.data.user.id;
    });

    it('should access protected route with access token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(userId);
      expect(res.body.data.user.email).toBe('integration@example.com');
    });

    it('should refresh access token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.accessToken).not.toBe(accessToken);

      accessToken = res.body.data.accessToken;
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'invalid.refresh.token',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login with existing credentials', async () => {
      const loginData = {
        email: 'integration@example.com',
        password: 'Password123',
      };

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(loginData.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        email: 'integration@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app).post('/api/auth/login').send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject access after logout', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords properly', async () => {
      const userData = {
        name: 'Password Test User',
        email: 'password@example.com',
        password: 'MySecurePassword123',
      };

      const res = await request(app).post('/api/auth/register').send(userData);
      
      expect(res.status).toBe(201);
      expect(res.body.data.user.password_hash).toBeUndefined();
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'integration@example.com', // Already registered
        password: 'Password123',
      };

      const res = await request(app).post('/api/auth/register').send(userData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });
  });

  describe('Token Validation', () => {
    it('should reject malformed JWT tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '');

      expect(res.status).toBe(401);
    });

    it('should reject authorization header without Bearer', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'some.token');

      expect(res.status).toBe(401);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'not-an-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain.',
      ];

      for (const email of invalidEmails) {
        const res = await request(app).post('/api/auth/register').send({
          name: 'Test User',
          email,
          password: 'Password123',
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        'weak',
        '123456',
        'password',
        '123',
        'abc',
        'Password', // No number
        'password123', // No uppercase
        'PASSWORD123', // No lowercase
      ];

      for (const password of weakPasswords) {
        const res = await request(app).post('/api/auth/register').send({
          name: 'Test User',
          email: 'test@example.com',
          password,
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('should validate name length and characters', async () => {
      const invalidNames = [
        '', // Empty
        'a', // Too short
        'a'.repeat(101), // Too long
      ];

      for (const name of invalidNames) {
        const res = await request(app).post('/api/auth/register').send({
          name,
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });
  });
});
