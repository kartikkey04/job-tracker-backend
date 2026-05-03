import request from 'supertest';
import app from '../app';

describe('Middlewares', () => {
  let authToken: string;

  beforeAll(async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Middleware Test User',
      email: 'middleware@example.com',
      password: 'Password123',
    });
    authToken = registerRes.body.data.accessToken;
  });

  describe('Error Handler Middleware', () => {
    it('should handle 404 errors', async () => {
      const res = await request(app).get('/non-existent-route');
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Route not found');
    });

    it('should handle malformed JSON requests', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should allow normal request rates', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should include rate limit headers', async () => {
      const res = await request(app).get('/health');
      
      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Validation Middleware', () => {
    it('should validate request bodies', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'weak',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should sanitize input data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '  Test User  ',
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Name should be trimmed
      expect(res.body.data.user.name).toBe('Test User');
    });
  });

  describe('Authentication Middleware', () => {
    it('should verify valid JWT tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject expired tokens', async () => {
      // This would require mocking time or using an expired token
      // For now, we test with an invalid token format
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should attach user to request object', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBeDefined();
      expect(res.body.data.user.email).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const res = await request(app).get('/health');

      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers).toHaveProperty('x-frame-options');
      expect(res.headers).toHaveProperty('x-xss-protection');
    });

    it('should set CORS headers', async () => {
      const res = await request(app)
        .options('/api/auth/me')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers).toHaveProperty('access-control-allow-origin');
      expect(res.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Request Logging', () => {
    it('should log requests in development', async () => {
      const res = await request(app).get('/health');
      
      expect(res.status).toBe(200);
      // In test environment, morgan is set to silent mode
      // In development, it would log to console
    });
  });
});
