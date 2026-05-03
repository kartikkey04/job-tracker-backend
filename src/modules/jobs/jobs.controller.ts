import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../../utils/response';
import { listJobsSchema } from './jobs.schema';
import * as jobsService from './jobs.service';
import { CreateJobBody, UpdateJobBody, JobStatus } from '../../types';

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobsService.createJob(req.user!.userId, req.body as CreateJobBody);
  sendSuccess(res, { job }, 'Job application created', 201);
});

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const query = listJobsSchema.parse(req.query);
  const result = await jobsService.listJobs({
    userId: req.user!.userId,
    status: query.status as JobStatus | undefined,
    page: parseInt(String(query.page)),
    limit: parseInt(String(query.limit)),
    sort: String(query.sort),
    order: String(query.order),
  });
  sendSuccess(res, result);
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params['id']);
  const job = await jobsService.getJobById(id, req.user!.userId);
  sendSuccess(res, { job });
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params['id']);
  const job = await jobsService.updateJob(id, req.user!.userId, req.body as UpdateJobBody);
  sendSuccess(res, { job }, 'Job updated successfully');
});

export const deleteJob = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params['id']);
  await jobsService.deleteJob(id, req.user!.userId);
  sendSuccess(res, null, 'Job deleted successfully');
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await jobsService.getJobStats(req.user!.userId);
  sendSuccess(res, { stats });
});
