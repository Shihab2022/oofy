import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorMiddleware: ErrorRequestHandler = (
  err: Error | (ApiError & { issues?: unknown }),
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let stack: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (process.env.NODE_ENV === 'development') {
    stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(stack ? { stack } : {}),
    ...('issues' in err && err.issues ? { issues: err.issues } : {}),
  });
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'Route not found'));
};
