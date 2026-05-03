import { Request, Response } from 'express';
import { asyncHandler, sendSuccess } from '../../utils/response';
import * as aiService from './ai.service';
import { AICoverLetterBody, AIInterviewTipsBody, AIResumeMatchBody } from '../../types';

export const generateCoverLetter = asyncHandler(async (req: Request, res: Response) => {
  const { job_description, role_title, company_name } = req.body as AICoverLetterBody;
  const result = await aiService.generateCoverLetter(job_description, role_title, company_name);
  sendSuccess(res, result, 'Cover letter generated');
});

export const generateInterviewTips = asyncHandler(async (req: Request, res: Response) => {
  const { job_description, role_title, company_name } = req.body as AIInterviewTipsBody;
  const result = await aiService.generateInterviewTips(job_description, role_title, company_name);
  sendSuccess(res, result, 'Interview tips generated');
});

export const matchResume = asyncHandler(async (req: Request, res: Response) => {
  const { resume_text, job_description } = req.body as AIResumeMatchBody;
  const result = await aiService.matchResume(resume_text, job_description);
  sendSuccess(res, result, 'Resume match analysis complete');
});
