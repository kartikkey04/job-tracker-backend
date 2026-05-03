import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    schema.parse(req.body); // throws ZodError → caught by errorHandler
    next();
  };
};
