import { inject, injectable } from 'tsyringe';
import { Redis } from 'ioredis';
import { MatchResult, AudioFeatures } from '../types/music.types';
import { MatchingService } from './matching.service';
import { logger } from '../utils/logger';

/**
 * MatchCacheService
 *
 * Caches match results in Redis to avoid recomputing identical matches.
 * Cache TTL: 7 days (as per DEVELOPMENT_PLAN.md)
 */
@injectable()
export class MatchCacheService {
  private readonly CACHE_PREFIX = 'match:';
  private readonly CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    @inject('Redis') private redis: Redis,
    private matchingService: MatchingService
  ) {}

  /**
   * Get match result with caching
   * Checks cache first, computes if not found, then caches result
   */
  async getMatch(
    features1: AudioFeatures,
    features2: AudioFeatures,
    song1Id: string,
    song2Id: string,
    bypassCache = false
  ): Promise<MatchResult> {
    // Try cache first (unless bypassed)
    if (!bypassCache) {
      const cached = await this.getCachedMatch(song1Id, song2Id);
      if (cached) {
        logger.debug(`Cache hit for match: ${song1Id} <-> ${song2Id}`);
        return cached;
      }
    }

    // Cache miss - compute match
    logger.debug(`Cache miss for match: ${song1Id} <-> ${song2Id}`);
    const result = this.matchingService.calculateMatch(features1, features2);

    // Store in cache (fire and forget)
    this.cacheMatch(song1Id, song2Id, result).catch((error) => {
      logger.error('Failed to cache match result:', error);
    });

    return result;
  }

  /**
   * Get cached match result
   * Returns null if not found or expired
   */
  private async getCachedMatch(
    song1Id: string,
    song2Id: string
  ): Promise<MatchResult | null> {
    try {
      const cacheKey = this.getCacheKey(song1Id, song2Id);
      const cached = await this.redis.get(cacheKey);

      if (!cached) return null;

      const result = JSON.parse(cached) as MatchResult;
      return result;
    } catch (error) {
      logger.warn('Error retrieving cached match:', error);
      return null;
    }
  }

  /**
   * Cache match result
   */
  private async cacheMatch(
    song1Id: string,
    song2Id: string,
    result: MatchResult
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(song1Id, song2Id);
      const serialized = JSON.stringify(result);

      await this.redis.setex(cacheKey, this.CACHE_TTL, serialized);

      logger.debug(`Cached match result: ${cacheKey} (TTL: ${this.CACHE_TTL}s)`);
    } catch (error) {
      logger.error('Error caching match result:', error);
      throw error;
    }
  }

  /**
   * Generate consistent cache key for song pair
   * Ensures same key regardless of order (A+B = B+A)
   */
  private getCacheKey(song1Id: string, song2Id: string): string {
    // Sort IDs to ensure consistency
    const [id1, id2] = [song1Id, song2Id].sort();
    return `${this.CACHE_PREFIX}${id1}:${id2}`;
  }

  /**
   * Invalidate cache for a specific song pair
   */
  async invalidateMatch(song1Id: string, song2Id: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(song1Id, song2Id);
      await this.redis.del(cacheKey);
      logger.debug(`Invalidated cache for: ${cacheKey}`);
    } catch (error) {
      logger.error('Error invalidating cache:', error);
      throw error;
    }
  }

  /**
   * Clear all match caches
   * Use with caution - clears ALL match results
   */
  async clearAllMatches(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length === 0) return 0;

      const deleted = await this.redis.del(...keys);
      logger.info(`Cleared ${deleted} cached matches`);
      return deleted;
    } catch (error) {
      logger.error('Error clearing match cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    estimatedSize: number;
    oldestKey: string | null;
  }> {
    try {
      const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
      const totalKeys = keys.length;

      // Estimate size (approximate)
      let estimatedSize = 0;
      if (keys.length > 0) {
        // Sample first 10 keys to estimate size
        const sampleKeys = keys.slice(0, Math.min(10, keys.length));
        for (const key of sampleKeys) {
          const value = await this.redis.get(key);
          if (value) estimatedSize += value.length;
        }
        estimatedSize = Math.round((estimatedSize / sampleKeys.length) * totalKeys);
      }

      // Find oldest key by checking TTL
      let oldestKey: string | null = null;
      let maxTtl = 0;
      for (const key of keys.slice(0, 100)) {
        // Check first 100
        const ttl = await this.redis.ttl(key);
        if (ttl > maxTtl) {
          maxTtl = ttl;
          oldestKey = key;
        }
      }

      return {
        totalKeys,
        estimatedSize,
        oldestKey,
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      throw error;
    }
  }
}
