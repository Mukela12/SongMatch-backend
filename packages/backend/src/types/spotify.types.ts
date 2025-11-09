/**
 * Spotify API Types
 *
 * Type definitions for Spotify Web API responses and requests.
 * Based on Spotify Web API documentation: https://developer.spotify.com/documentation/web-api
 */

/**
 * Spotify Track Object (Simplified)
 */
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  popularity: number;
  explicit: boolean;
}

/**
 * Spotify Artist Object (Simplified)
 */
export interface SpotifyArtist {
  id: string;
  name: string;
  genres?: string[];
  external_urls: {
    spotify: string;
  };
}

/**
 * Spotify Album Object (Simplified)
 */
export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  release_date: string; // YYYY-MM-DD or YYYY
  images: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

/**
 * Spotify Image Object
 */
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

/**
 * Spotify Audio Features Object
 */
export interface SpotifyAudioFeatures {
  id: string;
  // High-level features
  valence: number; // 0.0 to 1.0
  energy: number; // 0.0 to 1.0
  danceability: number; // 0.0 to 1.0
  tempo: number; // BPM
  acousticness: number; // 0.0 to 1.0

  // Musical structure
  key: number; // 0-11 (C, C#, D, ... , B)
  mode: number; // 0 = minor, 1 = major
  time_signature: number; // 3-7
  loudness: number; // dB, typically -60 to 0
  duration_ms: number;

  // Additional features
  instrumentalness: number; // 0.0 to 1.0
  liveness: number; // 0.0 to 1.0
  speechiness: number; // 0.0 to 1.0
}

/**
 * Spotify Search Response
 */
export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * Spotify User Profile
 */
export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  country?: string;
  product?: string; // premium, free, etc.
  images?: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

/**
 * Spotify OAuth Token Response
 */
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string; // "Bearer"
  expires_in: number; // seconds
  refresh_token?: string;
  scope?: string;
}

/**
 * Spotify API Error Response
 */
export interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

/**
 * Spotify User's Top Tracks Response
 */
export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

/**
 * Spotify Recently Played Response
 */
export interface SpotifyRecentlyPlayedResponse {
  items: {
    track: SpotifyTrack;
    played_at: string; // ISO 8601 timestamp
  }[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
}

/**
 * Our cached song data (combining track + audio features)
 */
export interface CachedSong {
  // Track metadata
  id: string;
  name: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  releaseYear: number;
  durationMs: number;
  previewUrl: string | null;
  spotifyUrl: string;
  imageUrl: string | null;
  popularity: number;
  explicit: boolean;

  // Audio features
  audioFeatures: SpotifyAudioFeatures;

  // Genre info (from artist)
  genres: string[];

  // Cache metadata
  cachedAt: number; // Timestamp
  expiresAt: number; // Timestamp (30 days)
  platform: 'spotify';
}

/**
 * Song search filters
 */
export interface SongSearchFilters {
  query: string;
  limit?: number; // Max 50 for Spotify
  offset?: number;
  market?: string; // ISO 3166-1 alpha-2 country code
}

/**
 * Song search result (our internal format)
 */
export interface SongSearchResult {
  songs: CachedSong[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
