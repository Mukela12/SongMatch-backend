import { Router } from 'express';
import { healthRouter } from './health.routes';
import { musicRouter } from './music.routes';

/**
 * Main API Router (v1)
 *
 * Combines all route modules under /api/v1
 */
export const apiRouter = Router();

// Health and status routes
apiRouter.use('/health', healthRouter);

// Music routes (Spotify integration, song search, matching)
apiRouter.use('/music', musicRouter);

// Auth routes (to be implemented)
// apiRouter.use('/auth', authRouter);

// User routes (to be implemented)
// apiRouter.use('/users', userRouter);

// Game routes (to be implemented)
// apiRouter.use('/games', gameRouter);

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
        music: '/api/v1/music',
        auth: '/api/v1/auth (coming soon)',
        users: '/api/v1/users (coming soon)',
        games: '/api/v1/games (coming soon)',
      },
    },
  });
});
