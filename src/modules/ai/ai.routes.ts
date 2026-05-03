import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { rateLimiter } from '../../middlewares/rateLimit';
import { coverLetterSchema, interviewTipsSchema, resumeMatchSchema } from './ai.schema';
import * as aiController from './ai.controller';
import { env } from '../../config/env';

const router = Router();

// AI rate limiter: max 5 requests per hour per user
const aiRateLimit = rateLimiter({
  windowSeconds: parseInt(env.AI_RATE_LIMIT_WINDOW),
  max: parseInt(env.AI_RATE_LIMIT_MAX),
  keyPrefix: 'ai',
});

router.use(authenticate);
router.use(aiRateLimit);

router.post('/cover-letter', validate(coverLetterSchema), aiController.generateCoverLetter);
router.post('/interview-tips', validate(interviewTipsSchema), aiController.generateInterviewTips);
router.post('/resume-match', validate(resumeMatchSchema), aiController.matchResume);

export default router;
