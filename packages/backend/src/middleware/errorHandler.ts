import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown in route handlers and formats them
 * into consistent API responses.
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error in ${req.method} ${req.path}:`, err);

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
};

/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to catch rejected promises
 * and pass them to error handling middleware.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
