import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validation';

describe('Validation Middleware', () => {
  const mockNext = vi.fn() as unknown as NextFunction;
  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  it('should validate and pass valid request body', async () => {
    const schema = z.object({
      email: z.string().email(),
      username: z.string().min(3),
    });

    const mockReq = {
      body: {
        email: 'test@example.com',
        username: 'testuser',
      },
    } as Request;

    const middleware = validate(schema, 'body');
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({
      email: 'test@example.com',
      username: 'testuser',
    });
  });

  it('should return 400 for invalid request body', async () => {
    const schema = z.object({
      email: z.string().email(),
      username: z.string().min(3),
    });

    const mockReq = {
      body: {
        email: 'invalid-email',
        username: 'ab', // too short
      },
    } as Request;

    const middleware = validate(schema, 'body');
    await middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: expect.any(Array),
        }),
      })
    );
  });

  it('should validate query parameters', async () => {
    const schema = z.object({
      page: z.string().transform(Number),
      limit: z.string().transform(Number),
    });

    const mockReq = {
      query: {
        page: '1',
        limit: '10',
      },
    } as unknown as Request;

    const middleware = validate(schema, 'query');
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.query).toEqual({
      page: 1,
      limit: 10,
    });
  });

  it('should sanitize input data', async () => {
    const schema = z.object({
      email: z.string().email().toLowerCase(),
      age: z.number().min(18),
    });

    const mockReq = {
      body: {
        email: 'TEST@EXAMPLE.COM',
        age: 25,
        extraField: 'should be removed',
      },
    } as Request;

    const middleware = validate(schema, 'body');
    await middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({
      email: 'test@example.com',
      age: 25,
    });
  });
});
