import { injectable } from 'tsyringe';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import {
  SpotifyTrack,
  SpotifyAudioFeatures,
  SpotifySearchResponse,
  SpotifyTokenResponse,
  SpotifyTopTracksResponse,
  SpotifyRecentlyPlayedResponse,
  SpotifyError,
  SongSearchFilters,
  CachedSong,
} from '../types/spotify.types';

/**
 * SpotifyService
 *
 * Handles all interactions with Spotify Web API including:
 * - OAuth token management (client credentials flow)
 * - Track search
 * - Audio features retrieval
 * - User library access (top tracks, recently played)
 * - Rate limiting and error handling
 */
@injectable()
export class SpotifyService {
  private readonly BASE_URL = 'https://api.spotify.com/v1';
  private readonly AUTH_URL = 'https://accounts.spotify.com/api/token';

  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to automatically add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      this.handleApiError.bind(this)
    );
  }

  /**
   * Ensure we have a valid access token
   * Automatically refreshes if expired
   */
  private async ensureValidToken(): Promise<void> {
    const now = Date.now();

    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiresAt > now + 5 * 60 * 1000) {
      return;
    }

    logger.debug('Refreshing Spotify access token');
    await this.getClientCredentialsToken();
  }

  /**
   * Get access token using Client Credentials flow
   * This is for app-level access (search, get tracks, audio features)
   */
  private async getClientCredentialsToken(): Promise<void> {
    try {
      const credentials = Buffer.from(
        `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64');

      const response = await axios.post<SpotifyTokenResponse>(
        this.AUTH_URL,
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

      logger.info('Successfully obtained Spotify access token');
    } catch (error) {
      logger.error('Failed to get Spotify access token:', error);
      throw new AppError(
        500,
        'SPOTIFY_AUTH_ERROR',
        'Failed to authenticate with Spotify'
      );
    }
  }

  /**
   * Search for tracks
   */
  async searchTracks(filters: SongSearchFilters): Promise<SpotifySearchResponse> {
    try {
      const params = new URLSearchParams({
        q: filters.query,
        type: 'track',
        limit: String(filters.limit || 20),
        offset: String(filters.offset || 0),
      });

      if (filters.market) {
        params.append('market', filters.market);
      }

      const response = await this.axiosInstance.get<SpotifySearchResponse>(
        `/search?${params.toString()}`
      );

      logger.debug(`Spotify search: "${filters.query}" - ${response.data.tracks.items.length} results`);

      return response.data;
    } catch (error) {
      logger.error('Spotify search error:', error);
      throw error;
    }
  }

  /**
   * Get track by ID
   */
  async getTrack(trackId: string, market?: string): Promise<SpotifyTrack> {
    try {
      const params = market ? `?market=${market}` : '';
      const response = await this.axiosInstance.get<SpotifyTrack>(
        `/tracks/${trackId}${params}`
      );

      return response.data;
    } catch (error) {
      logger.error(`Error getting track ${trackId}:`, error);
      throw error;
    }
  }

  /**
   * Get audio features for a track
   */
  async getAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures> {
    try {
      const response = await this.axiosInstance.get<SpotifyAudioFeatures>(
        `/audio-features/${trackId}`
      );

      return response.data;
    } catch (error) {
      logger.error(`Error getting audio features for ${trackId}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple audio features at once (more efficient)
   */
  async getMultipleAudioFeatures(trackIds: string[]): Promise<SpotifyAudioFeatures[]> {
    try {
      // Spotify allows max 100 IDs at once
      if (trackIds.length > 100) {
        throw new AppError(400, 'INVALID_REQUEST', 'Maximum 100 track IDs allowed');
      }

      const response = await this.axiosInstance.get<{ audio_features: SpotifyAudioFeatures[] }>(
        `/audio-features?ids=${trackIds.join(',')}`
      );

      return response.data.audio_features;
    } catch (error) {
      logger.error('Error getting multiple audio features:', error);
      throw error;
    }
  }

  /**
   * Get user's top tracks (requires user access token)
   */
  async getUserTopTracks(
    userToken: string,
    options?: {
      timeRange?: 'short_term' | 'medium_term' | 'long_term';
      limit?: number;
      offset?: number;
    }
  ): Promise<SpotifyTopTracksResponse> {
    try {
      const params = new URLSearchParams({
        time_range: options?.timeRange || 'medium_term',
        limit: String(options?.limit || 20),
        offset: String(options?.offset || 0),
      });

      const response = await axios.get<SpotifyTopTracksResponse>(
        `${this.BASE_URL}/me/top/tracks?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting user top tracks:', error);
      throw error;
    }
  }

  /**
   * Get user's recently played tracks (requires user access token)
   */
  async getUserRecentlyPlayed(
    userToken: string,
    options?: {
      limit?: number;
      after?: number; // Unix timestamp in ms
      before?: number; // Unix timestamp in ms
    }
  ): Promise<SpotifyRecentlyPlayedResponse> {
    try {
      const params = new URLSearchParams({
        limit: String(options?.limit || 20),
      });

      if (options?.after) {
        params.append('after', String(options.after));
      }
      if (options?.before) {
        params.append('before', String(options.before));
      }

      const response = await axios.get<SpotifyRecentlyPlayedResponse>(
        `${this.BASE_URL}/me/player/recently-played?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Error getting recently played:', error);
      throw error;
    }
  }

  /**
   * Convert Spotify track + audio features to our CachedSong format
   */
  async convertToCachedSong(
    track: SpotifyTrack,
    audioFeatures?: SpotifyAudioFeatures
  ): Promise<CachedSong> {
    // Get audio features if not provided
    if (!audioFeatures) {
      audioFeatures = await this.getAudioFeatures(track.id);
    }

    // Extract release year
    const releaseYear = track.album.release_date
      ? parseInt(track.album.release_date.substring(0, 4))
      : 0;

    // Get largest album image
    const imageUrl = track.album.images.length > 0
      ? track.album.images[0].url
      : null;

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      artistId: track.artists[0]?.id || '',
      album: track.album.name,
      albumId: track.album.id,
      releaseYear,
      durationMs: track.duration_ms,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      imageUrl,
      popularity: track.popularity,
      explicit: track.explicit,
      audioFeatures,
      genres: track.artists[0]?.genres || [],
      cachedAt: now,
      expiresAt: now + thirtyDays,
      platform: 'spotify',
    };
  }

  /**
   * Handle API errors and convert to AppError
   */
  private async handleApiError(error: AxiosError<SpotifyError>): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.message;

      // Rate limit handling
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        logger.warn(`Spotify rate limit hit. Retry after: ${retryAfter} seconds`);
        throw new AppError(
          429,
          'RATE_LIMIT_EXCEEDED',
          `Rate limit exceeded. Retry after ${retryAfter} seconds`
        );
      }

      // Not found
      if (status === 404) {
        throw new AppError(404, 'NOT_FOUND', 'Track not found on Spotify');
      }

      // Unauthorized
      if (status === 401) {
        logger.error('Spotify authentication failed');
        // Try to refresh token
        this.accessToken = null;
        this.tokenExpiresAt = 0;
        throw new AppError(401, 'SPOTIFY_AUTH_ERROR', 'Spotify authentication failed');
      }

      // Other errors
      throw new AppError(
        status,
        'SPOTIFY_API_ERROR',
        message || 'Spotify API error'
      );
    }

    // Network or timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new AppError(504, 'SPOTIFY_TIMEOUT', 'Spotify API request timed out');
    }

    // Unknown error
    logger.error('Unknown Spotify API error:', error);
    throw new AppError(500, 'SPOTIFY_ERROR', 'An error occurred with Spotify API');
  }
}
