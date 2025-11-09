import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler, asyncHandler } from './errorHandler';

describe('Error Handler Middleware', () => {
  const mockReq = {} as Request;
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  const mockNext = vi.fn() as unknown as NextFunction;

  it('should handle AppError correctly', () => {
    const error = new AppError(400, 'VALIDATION_ERROR', 'Invalid input');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
      },
    });
  });

  it('should handle generic errors as 500', () => {
    const error = new Error('Unexpected error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    );
  });

  it('should create AppError with correct properties', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    expect(error.isOperational).toBe(true);
  });
});

describe('Async Handler', () => {
  it('should call next with error on rejected promise', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = vi.fn();

    const errorToThrow = new Error('Async error');
    const asyncFn = async () => {
      throw errorToThrow;
    };

    const handler = asyncHandler(asyncFn);
    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(errorToThrow);
  });

  it('should not call next on successful promise', async () => {
    const mockReq = {} as Request;
    const mockRes = {
      json: vi.fn(),
    } as unknown as Response;
    const mockNext = vi.fn();

    const asyncFn = async (req: Request, res: Response) => {
      res.json({ success: true });
    };

    const handler = asyncHandler(asyncFn);
    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
  });
});
