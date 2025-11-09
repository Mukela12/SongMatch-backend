import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { asyncHandler } from '../middleware/errorHandler';

export const healthRouter = Router();

/**
 * GET /api/v1/health
 * Basic health check endpoint
 */
healthRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
    });
  })
);

/**
 * GET /api/v1/health/detailed
 * Detailed health check including database and Redis status
 */
healthRouter.get(
  '/detailed',
  asyncHandler(async (req, res) => {
    // Check database connection
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }

    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch (error) {
      redisStatus = 'error';
    }

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        services: {
          database: dbStatus,
          redis: redisStatus,
        },
      },
    });
  })
);
