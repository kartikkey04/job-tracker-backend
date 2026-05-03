import { z } from 'zod';

const jobStatusEnum = z.enum(['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']);

export const createJobSchema = z.object({
  company_name: z.string().min(1).max(200),
  role_title: z.string().min(1).max(200),
  job_description: z.string().optional(),
  status: jobStatusEnum.default('applied'),
  applied_date: z.string().optional(),
  interview_date: z.string().optional(),
  salary_range: z.string().max(100).optional(),
  job_url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const listJobsSchema = z.object({
  status: jobStatusEnum.optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
  sort: z.enum(['applied_date', 'created_at', 'company_name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
