import { Router } from 'express';
import { container } from '../di/container';
import { SongCacheService } from '../services/songCache.service';
import { MatchCacheService } from '../services/matchCache.service';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import {
  searchSongsSchema,
  getSongByIdSchema,
  getAudioFeaturesSchema,
  matchSongsSchema,
} from '../schemas/music.schemas';

export const musicRouter = Router();

// Get services from DI container
const songCacheService = container.resolve(SongCacheService);
const matchCacheService = container.resolve(MatchCacheService);

/**
 * GET /api/v1/music/search
 * Search for songs
 */
musicRouter.get(
  '/search',
  validate(searchSongsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { q, limit, offset, market } = req.query as any;

    const result = await songCacheService.searchSongs({
      query: q,
      limit,
      offset,
      market,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/v1/music/:platform/:songId
 * Get song by ID (with caching)
 */
musicRouter.get(
  '/:platform/:songId',
  validate(getSongByIdSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { platform, songId } = req.params as any;

    const song = await songCacheService.getSongById(songId, platform);

    res.json({
      success: true,
      data: song,
    });
  })
);

/**
 * GET /api/v1/music/features/:platform/:songId
 * Get audio features for a song
 */
musicRouter.get(
  '/features/:platform/:songId',
  validate(getAudioFeaturesSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { platform, songId } = req.params as any;

    const features = await songCacheService.getAudioFeatures(songId, platform);

    res.json({
      success: true,
      data: features,
    });
  })
);

/**
 * POST /api/v1/music/match
 * Calculate match score between two songs
 */
musicRouter.post(
  '/match',
  validate(matchSongsSchema, 'body'),
  asyncHandler(async (req, res) => {
    const { song1Id, song2Id, platform, includeExplanation, bypassCache } = req.body;

    // Get audio features for both songs
    const [features1, features2] = await Promise.all([
      songCacheService.getAudioFeatures(song1Id, platform),
      songCacheService.getAudioFeatures(song2Id, platform),
    ]);

    // Calculate match (with caching)
    const matchResult = await matchCacheService.getMatch(
      features1,
      features2,
      song1Id,
      song2Id,
      bypassCache
    );

    // Remove explanation if not requested
    const response = includeExplanation
      ? matchResult
      : { ...matchResult, explanation: undefined };

    res.json({
      success: true,
      data: response,
    });
  })
);

/**
 * GET /api/v1/music/cache/stats
 * Get song cache statistics
 */
musicRouter.get(
  '/cache/stats',
  asyncHandler(async (req, res) => {
    const stats = await songCacheService.getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * DELETE /api/v1/music/cache/:platform/:songId
 * Invalidate specific song cache
 */
musicRouter.delete(
  '/cache/:platform/:songId',
  validate(getSongByIdSchema, 'params'),
  asyncHandler(async (req, res) => {
    const { platform, songId } = req.params as any;

    await songCacheService.invalidateSong(songId, platform);

    res.json({
      success: true,
      message: `Cache invalidated for song: ${songId}`,
    });
  })
);
