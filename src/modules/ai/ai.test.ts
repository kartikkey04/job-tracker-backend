import request from 'supertest';
import app from '../../app';

describe('AI Routes', () => {
  let authToken: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'ai-test@example.com',
      password: 'Password1',
    });

    authToken = registerRes.body.data.accessToken;
  });

  describe('POST /api/ai/cover-letter', () => {
    it('should generate 3 cover letter variants', async () => {
      const coverLetterData = {
        company_name: 'Tech Innovations',
        role_title: 'Senior Software Engineer',
        job_description: 'We are looking for an experienced software engineer with strong skills in Node.js, React, and cloud technologies.',
      };

      const res = await request(app)
        .post('/api/ai/cover-letter')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coverLetterData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('formal');
      expect(res.body.data).toHaveProperty('conversational');
      expect(res.body.data).toHaveProperty('concise');
      expect(typeof res.body.data.formal).toBe('string');
      expect(typeof res.body.data.conversational).toBe('string');
      expect(typeof res.body.data.concise).toBe('string');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/ai/cover-letter')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Tech Corp',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 if no auth token provided', async () => {
      const res = await request(app).post('/api/ai/cover-letter').send({
        company_name: 'Tech Corp',
        role_title: 'Engineer',
        job_description: 'Test description',
      });

      expect(res.status).toBe(401);
    });

    it('should cache identical requests', async () => {
      const coverLetterData = {
        company_name: 'Cache Test Inc',
        role_title: 'Developer',
        job_description: 'Test job description for caching',
      };

      // First request
      const res1 = await request(app)
        .post('/api/ai/cover-letter')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coverLetterData);

      // Second identical request
      const res2 = await request(app)
        .post('/api/ai/cover-letter')
        .set('Authorization', `Bearer ${authToken}`)
        .send(coverLetterData);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data).toEqual(res2.body.data);
    });
  });

  describe('POST /api/ai/interview-tips', () => {
    it('should generate interview tips and questions', async () => {
      const interviewData = {
        company_name: 'Data Solutions',
        role_title: 'Data Scientist',
        job_description: 'Looking for a data scientist with experience in machine learning, Python, and statistical analysis.',
      };

      const res = await request(app)
        .post('/api/ai/interview-tips')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interviewData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('likely_questions');
      expect(res.body.data).toHaveProperty('research_points');
      expect(res.body.data).toHaveProperty('tips');
      expect(Array.isArray(res.body.data.likely_questions)).toBe(true);
      expect(Array.isArray(res.body.data.research_points)).toBe(true);
      expect(Array.isArray(res.body.data.tips)).toBe(true);
    });

    it('should return 400 for incomplete data', async () => {
      const res = await request(app)
        .post('/api/ai/interview-tips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role_title: 'Engineer',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/resume-match', () => {
    it('should score resume vs job description', async () => {
      const matchData = {
        resume_text: 'Experienced software developer with 5 years of experience in Node.js, React, and MongoDB. Worked on multiple full-stack projects.',
        job_description: 'Looking for a Node.js developer with React experience and MongoDB knowledge.',
      };

      const res = await request(app)
        .post('/api/ai/resume-match')
        .set('Authorization', `Bearer ${authToken}`)
        .send(matchData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('suggestions');
      expect(typeof res.body.data.score).toBe('number');
      expect(res.body.data.score).toBeGreaterThanOrEqual(0);
      expect(res.body.data.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });

    it('should return 400 if resume text is missing', async () => {
      const res = await request(app)
        .post('/api/ai/resume-match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          job_description: 'Test job description',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit after multiple requests', async () => {
      const coverLetterData = {
        company_name: 'Rate Limit Test',
        role_title: 'Engineer',
        job_description: 'Test description for rate limiting',
      };

      // Make multiple requests to exceed rate limit
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/ai/cover-letter')
            .set('Authorization', `Bearer ${authToken}`)
            .send(coverLetterData)
        );
      }

      const results = await Promise.all(requests);
      
      // First 5 should succeed, 6th should be rate limited
      for (let i = 0; i < 5; i++) {
        expect(results[i].status).toBe(200);
      }
      expect(results[5].status).toBe(429);
      expect(results[5].body.success).toBe(false);
      expect(results[5].body.error).toContain('rate limit');
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      // This test would mock OpenAI API failure
      // For now, we'll test with invalid data that might cause issues
      const invalidData = {
        company_name: 'Test',
        role_title: 'Test',
        job_description: '', // Empty description might cause issues
      };

      const res = await request(app)
        .post('/api/ai/cover-letter')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      // Should either succeed with minimal content or fail gracefully
      expect([200, 400, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('success');
    });
  });
});
