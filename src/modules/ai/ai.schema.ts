import { z } from 'zod';

export const coverLetterSchema = z.object({
  job_description: z.string().min(50, 'Job description must be at least 50 characters'),
  role_title: z.string().min(1).max(200),
  company_name: z.string().min(1).max(200),
});

export const interviewTipsSchema = z.object({
  job_description: z.string().min(50, 'Job description must be at least 50 characters'),
  role_title: z.string().min(1).max(200),
  company_name: z.string().min(1).max(200),
});

export const resumeMatchSchema = z.object({
  resume_text: z.string().min(100, 'Resume text must be at least 100 characters'),
  job_description: z.string().min(50, 'Job description must be at least 50 characters'),
});
