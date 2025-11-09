import { inject, injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { CachedSong, SongSearchResult, SongSearchFilters } from '../types/spotify.types';
import { SpotifyService } from './spotify.service';
import { AudioFeatures } from '../types/music.types';

/**
 * SongCacheService
 *
 * Manages song caching in PostgreSQL with 30-day TTL.
 * Reduces Spotify API calls and improves response times.
 *
 * Cache Strategy:
 * - Store complete song data (metadata + audio features) in database
 * - 30-day TTL (as per DEVELOPMENT_PLAN.md)
 * - Automatic cache invalidation on expiry
 * - Fallback to Spotify API on cache miss
 */
@injectable()
export class SongCacheService {
  private readonly CACHE_TTL_DAYS = 30;
  private readonly CACHE_TTL_MS = this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    private spotifyService: SpotifyService
  ) {}

  /**
   * Get song by ID with caching
   * Returns cached version if available and not expired
   * Otherwise fetches from Spotify and caches
   */
  async getSongById(songId: string, platform: 'spotify' = 'spotify'): Promise<CachedSong> {
    // Try cache first
    const cached = await this.getCachedSong(songId, platform);
    if (cached) {
      logger.debug(`Cache hit for song: ${songId}`);
      return cached;
    }

    // Cache miss - fetch from Spotify
    logger.debug(`Cache miss for song: ${songId}, fetching from Spotify`);
    const track = await this.spotifyService.getTrack(songId);
    const song = await this.spotifyService.convertToCachedSong(track);

    // Store in cache
    await this.cacheSong(song);

    return song;
  }

  /**
   * Search songs with caching
   * Uses cached results when possible, fetches from Spotify otherwise
   */
  async searchSongs(filters: SongSearchFilters): Promise<SongSearchResult> {
    // For search, we'll fetch fresh results from Spotify
    // but individual songs will be cached
    const searchResponse = await this.spotifyService.searchTracks(filters);

    // Convert tracks to cached songs (will use cache for ones we've seen before)
    const songs: CachedSong[] = [];
    for (const track of searchResponse.tracks.items) {
      try {
        // Check if we have this song cached
        let cachedSong = await this.getCachedSong(track.id, 'spotify');

        if (!cachedSong) {
          // Not cached - convert and cache it
          cachedSong = await this.spotifyService.convertToCachedSong(track);
          await this.cacheSong(cachedSong);
        }

        songs.push(cachedSong);
      } catch (error) {
        logger.error(`Error processing track ${track.id}:`, error);
        // Skip this song if there's an error
      }
    }

    return {
      songs,
      total: searchResponse.tracks.total,
      limit: searchResponse.tracks.limit,
      offset: searchResponse.tracks.offset,
      hasMore: searchResponse.tracks.next !== null,
    };
  }

  /**
   * Get audio features for a song (with caching)
   * Converts to our internal AudioFeatures format
   */
  async getAudioFeatures(songId: string, platform: 'spotify' = 'spotify'): Promise<AudioFeatures> {
    const song = await this.getSongById(songId, platform);

    return {
      valence: song.audioFeatures.valence,
      energy: song.audioFeatures.energy,
      danceability: song.audioFeatures.danceability,
      tempo: song.audioFeatures.tempo,
      acousticness: song.audioFeatures.acousticness,
      key: song.audioFeatures.key,
      mode: song.audioFeatures.mode,
      timeSignature: song.audioFeatures.time_signature,
      loudness: song.audioFeatures.loudness,
      durationMs: song.audioFeatures.duration_ms,
      genres: song.genres,
      artist: song.artist,
      releaseYear: song.releaseYear,
    };
  }

  /**
   * Get cached song from database
   */
  private async getCachedSong(songId: string, platform: string): Promise<CachedSong | null> {
    try {
      const cached = await this.prisma.songCache.findUnique({
        where: {
          platform_songId: {
            platform,
            songId,
          },
        },
      });

      if (!cached) return null;

      // Check if expired
      if (cached.expiresAt.getTime() < Date.now()) {
        logger.debug(`Cache expired for song: ${songId}`);
        // Delete expired entry
        await this.deleteCachedSong(songId, platform);
        return null;
      }

      // Parse JSON data
      return JSON.parse(cached.data) as CachedSong;
    } catch (error) {
      logger.error('Error retrieving cached song:', error);
      return null;
    }
  }

  /**
   * Cache song in database
   */
  private async cacheSong(song: CachedSong): Promise<void> {
    try {
      const data = JSON.stringify(song);

      await this.prisma.songCache.upsert({
        where: {
          platform_songId: {
            platform: song.platform,
            songId: song.id,
          },
        },
        create: {
          platform: song.platform,
          songId: song.id,
          title: song.name,
          artist: song.artist,
          data,
          cachedAt: new Date(song.cachedAt),
          expiresAt: new Date(song.expiresAt),
        },
        update: {
          title: song.name,
          artist: song.artist,
          data,
          cachedAt: new Date(song.cachedAt),
          expiresAt: new Date(song.expiresAt),
        },
      });

      logger.debug(`Cached song: ${song.id} (${song.name})`);
    } catch (error) {
      logger.error('Error caching song:', error);
      // Don't throw - caching failure shouldn't break the request
    }
  }

  /**
   * Delete cached song
   */
  private async deleteCachedSong(songId: string, platform: string): Promise<void> {
    try {
      await this.prisma.songCache.delete({
        where: {
          platform_songId: {
            platform,
            songId,
          },
        },
      });
      logger.debug(`Deleted cached song: ${songId}`);
    } catch (error) {
      logger.error('Error deleting cached song:', error);
    }
  }

  /**
   * Clean up expired cache entries
   * Should be run periodically (e.g., daily cron job)
   */
  async cleanExpiredCache(): Promise<number> {
    try {
      const result = await this.prisma.songCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired song cache entries`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    expired: number;
    byPlatform: Record<string, number>;
  }> {
    try {
      const [total, expired, spotify] = await Promise.all([
        this.prisma.songCache.count(),
        this.prisma.songCache.count({
          where: {
            expiresAt: {
              lt: new Date(),
            },
          },
        }),
        this.prisma.songCache.count({
          where: {
            platform: 'spotify',
          },
        }),
      ]);

      return {
        totalCached: total,
        expired,
        byPlatform: {
          spotify,
        },
      };
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return {
        totalCached: 0,
        expired: 0,
        byPlatform: {},
      };
    }
  }

  /**
   * Invalidate specific song cache
   */
  async invalidateSong(songId: string, platform: 'spotify' = 'spotify'): Promise<void> {
    await this.deleteCachedSong(songId, platform);
    logger.info(`Invalidated cache for song: ${songId}`);
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clearAllCache(): Promise<number> {
    try {
      const result = await this.prisma.songCache.deleteMany({});
      logger.warn(`Cleared all song cache: ${result.count} entries deleted`);
      return result.count;
    } catch (error) {
      logger.error('Error clearing cache:', error);
      return 0;
    }
  }
}
