import { Router } from 'express';
import { healthRouter } from './health.routes';

/**
 * Main API Router (v1)
 *
 * Combines all route modules under /api/v1
 */
export const apiRouter = Router();

// Health and status routes
apiRouter.use('/health', healthRouter);

// Auth routes (to be implemented)
// apiRouter.use('/auth', authRouter);

// User routes (to be implemented)
// apiRouter.use('/users', userRouter);

// Game routes (to be implemented)
// apiRouter.use('/games', gameRouter);

// Song routes (to be implemented)
// apiRouter.use('/songs', songRouter);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'SongMatch API v1',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        games: '/api/v1/games',
        songs: '/api/v1/songs',
      },
    },
  });
});
