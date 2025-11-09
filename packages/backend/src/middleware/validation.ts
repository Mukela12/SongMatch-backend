import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Validation Middleware Factory
 *
 * Creates Express middleware that validates request body, query, or params
 * against a Zod schema. Returns 400 with detailed errors if validation fails.
 *
 * @param schema - Zod schema to validate against
 * @param target - Which part of request to validate ('body' | 'query' | 'params')
 */
export const validate = (
  schema: ZodSchema,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = await schema.parseAsync(data);

      // Replace request data with validated/sanitized data
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn(`Validation failed: ${JSON.stringify(errors)}`);

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors,
          },
        });
      }

      // Unexpected error
      logger.error('Unexpected validation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during validation',
        },
      });
    }
  };
};
