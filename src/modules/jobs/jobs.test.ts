import request from 'supertest';
import app from '../../app';

describe('Jobs Routes', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    });

    authToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  describe('POST /api/jobs', () => {
    it('should create a new job application', async () => {
      const jobData = {
        company_name: 'Tech Corp',
        role_title: 'Software Engineer',
        job_description: 'We are looking for a skilled software engineer...',
        status: 'applied',
        job_url: 'https://techcorp.com/jobs/123',
      };

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(jobData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.company_name).toBe(jobData.company_name);
      expect(res.body.data.role_title).toBe(jobData.role_title);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Tech Corp',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if no auth token provided', async () => {
      const res = await request(app).post('/api/jobs').send({
        company_name: 'Tech Corp',
        role_title: 'Software Engineer',
        job_description: 'Test description',
        status: 'applied',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/jobs', () => {
    it('should get user jobs', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const res = await request(app)
        .get('/api/jobs?status=applied')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 if no auth token provided', async () => {
      const res = await request(app).get('/api/jobs');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/jobs/stats', () => {
    it('should get dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/jobs/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
    });
  });

  describe('PUT /api/jobs/:id', () => {
    let jobId: string;

    beforeAll(async () => {
      // Create a job to update
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Update Corp',
          role_title: 'Developer',
          job_description: 'Test job',
          status: 'applied',
        });
      jobId = res.body.data.id;
    });

    it('should update job details', async () => {
      const updateData = {
        role_title: 'Senior Developer',
        notes: 'Updated notes',
      };

      const res = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role_title).toBe(updateData.role_title);
    });

    it('should update job status and create history', async () => {
      const res = await request(app)
        .put(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'interview',
          note: 'Scheduled for interview',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('interview');
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(app)
        .put('/api/jobs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'interview' });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/jobs/:id', () => {
    let jobId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Detail Corp',
          role_title: 'Engineer',
          job_description: 'Test job',
          status: 'applied',
        });
      jobId = res.body.data.id;
    });

    it('should get job details with history', async () => {
      const res = await request(app)
        .get(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(jobId);
      expect(Array.isArray(res.body.data.status_history)).toBe(true);
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(app)
        .get('/api/jobs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    let jobId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Delete Corp',
          role_title: 'Engineer',
          job_description: 'Test job',
          status: 'applied',
        });
      jobId = res.body.data.id;
    });

    it('should delete a job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for already deleted job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
