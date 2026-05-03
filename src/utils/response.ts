import { Request, Response, NextFunction } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncFn) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200): void => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (res: Response, error: string, statusCode = 400): void => {
  res.status(statusCode).json({ success: false, error });
};
