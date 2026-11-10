import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      const error = new ApiError(
        400,
        `Validation failed: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`,
        true,
      ) as ApiError & { issues?: typeof issues };
      error.issues = issues;
      return next(error);
    }

    next();
  };
