/**
 * Music Types
 *
 * Type definitions for music-related data structures including
 * audio features, match results, and confidence metrics.
 */

/**
 * Audio features from music platform (Spotify)
 * All 0-1 values except tempo (BPM) and loudness (dB)
 */
export interface AudioFeatures {
  // High-level features (Layer 1)
  valence: number; // 0-1: sad/negative to happy/positive
  energy: number; // 0-1: calm to energetic
  danceability: number; // 0-1: not danceable to very danceable
  tempo: number; // BPM (typically 50-200)
  acousticness: number; // 0-1: electric to acoustic

  // Musical structure (Layer 2)
  key: number; // 0-11 (C, C#, D, ... , B)
  mode: number; // 0 = minor, 1 = major
  timeSignature: number; // Beats per measure (3, 4, 5, 6, 7)
  loudness: number; // dB (typically -60 to 0)
  durationMs: number; // Track duration in milliseconds

  // Metadata (Layer 3)
  genres?: string[]; // Genre tags
  artist?: string; // Artist name
  releaseYear?: number; // Year released
}

/**
 * Component score with detailed breakdown
 */
export interface ScoreComponent {
  similarity: number; // 0-1 similarity score
  weight: number; // Weight in layer calculation
  values: number[]; // Original values [song1, song2]
  label?: string; // Human-readable label
}

/**
 * Layer calculation result
 */
export interface LayerResult {
  score: number; // 0-1 layer score
  components: Record<string, ScoreComponent>; // Individual component scores
}

/**
 * Complete match result
 */
export interface MatchResult {
  overallScore: number; // 0-100 final match score
  confidence: number; // 0-1 algorithm confidence
  breakdown: {
    layer1: LayerResult; // High-level features (60%)
    layer2: LayerResult; // Musical structure (25%)
    layer3: LayerResult; // Genre & metadata (15%)
  };
  explanation: MatchExplanation; // Human-readable explanation
  processingTime: number; // Milliseconds
  algorithmVersion: string; // Algorithm version for tracking
}

/**
 * Human-readable match explanation
 */
export interface MatchExplanation {
  summary: string; // One-sentence summary
  strengths: string[]; // What matches well
  weaknesses: string[]; // What doesn't match
  details: {
    mood: string; // Valence/energy description
    rhythm: string; // Tempo/danceability description
    harmony: string; // Key/mode description
    style: string; // Genre/artist description
  };
}

/**
 * Cached match data
 */
export interface CachedMatch {
  song1Id: string;
  song2Id: string;
  result: MatchResult;
  cachedAt: number; // Timestamp
  expiresAt: number; // Timestamp
}

/**
 * Match request
 */
export interface MatchRequest {
  song1: AudioFeatures;
  song2: AudioFeatures;
  includeExplanation?: boolean; // Default: true
  bypassCache?: boolean; // Default: false
}
