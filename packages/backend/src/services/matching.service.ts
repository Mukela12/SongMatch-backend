import { injectable } from 'tsyringe';
import {
  AudioFeatures,
  MatchResult,
  LayerResult,
  ScoreComponent,
  MatchExplanation,
} from '../types/music.types';

/**
 * MatchingService
 *
 * Implements the three-layer weighted music similarity algorithm.
 * Target: < 5ms computation time per match
 * Accuracy: 70%+ correlation with human judgment
 */
@injectable()
export class MatchingService {
  private readonly ALGORITHM_VERSION = '1.0';

  // Circle of Fifths: C, G, D, A, E, B, F#, C#, G#, D#, A#, F
  private readonly CIRCLE_OF_FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

  // Pre-computed Circle of Fifths distance matrix for O(1) lookup
  private readonly CIRCLE_DISTANCE_MATRIX: number[][];

  constructor() {
    // Pre-compute distance matrix for performance
    this.CIRCLE_DISTANCE_MATRIX = this.buildCircleDistanceMatrix();
  }

  /**
   * Calculate match between two songs
   * Returns match score (0-100), confidence, breakdown, and explanation
   */
  calculateMatch(features1: AudioFeatures, features2: AudioFeatures): MatchResult {
    const startTime = performance.now();

    // Layer 1: High-level features (60% weight)
    const layer1 = this.calculateLayer1(features1, features2);

    // Layer 2: Musical structure (25% weight)
    const layer2 = this.calculateLayer2(features1, features2);

    // Layer 3: Genre & metadata (15% weight)
    const layer3 = this.calculateLayer3(features1, features2);

    // Weighted sum: 60% + 25% + 15% = 100%
    const overallScore = Math.round(
      (layer1.score * 0.6 + layer2.score * 0.25 + layer3.score * 0.15) * 100
    );

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(features1, features2);

    // Generate human-readable explanation
    const explanation = this.generateExplanation(
      features1,
      features2,
      { layer1, layer2, layer3 },
      overallScore
    );

    const processingTime = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      overallScore,
      confidence,
      breakdown: { layer1, layer2, layer3 },
      explanation,
      processingTime,
      algorithmVersion: this.ALGORITHM_VERSION,
    };
  }

  /**
   * LAYER 1: High-Level Features (60% weight)
   * Valence (15%), Energy (15%), Danceability (12%), Tempo (10%), Acousticness (8%)
   */
  private calculateLayer1(f1: AudioFeatures, f2: AudioFeatures): LayerResult {
    const components: Record<string, ScoreComponent> = {
      valence: {
        similarity: this.continuousSimilarity(f1.valence, f2.valence),
        weight: 0.15,
        values: [f1.valence, f2.valence],
        label: 'Mood/Positivity',
      },
      energy: {
        similarity: this.continuousSimilarity(f1.energy, f2.energy),
        weight: 0.15,
        values: [f1.energy, f2.energy],
        label: 'Energy Level',
      },
      danceability: {
        similarity: this.continuousSimilarity(f1.danceability, f2.danceability),
        weight: 0.12,
        values: [f1.danceability, f2.danceability],
        label: 'Danceability',
      },
      tempo: {
        similarity: this.tempoSimilarity(f1.tempo, f2.tempo),
        weight: 0.1,
        values: [f1.tempo, f2.tempo],
        label: 'Tempo (BPM)',
      },
      acousticness: {
        similarity: this.continuousSimilarity(f1.acousticness, f2.acousticness),
        weight: 0.08,
        values: [f1.acousticness, f2.acousticness],
        label: 'Acousticness',
      },
    };

    // Weighted sum normalized to 0-1
    const score =
      Object.values(components).reduce(
        (sum, comp) => sum + comp.similarity * comp.weight,
        0
      ) / 0.6; // Divide by total weight (60%)

    return { score, components };
  }

  /**
   * LAYER 2: Musical Structure (25% weight)
   * Key/Mode (10%), Time Signature (5%), Loudness (5%), Duration (5%)
   */
  private calculateLayer2(f1: AudioFeatures, f2: AudioFeatures): LayerResult {
    const components: Record<string, ScoreComponent> = {
      keyMode: {
        similarity: this.keySimilarity(f1.key, f1.mode, f2.key, f2.mode),
        weight: 0.1,
        values: [f1.key + f1.mode / 10, f2.key + f2.mode / 10],
        label: 'Key & Mode',
      },
      timeSignature: {
        similarity: this.timeSignatureSimilarity(f1.timeSignature, f2.timeSignature),
        weight: 0.05,
        values: [f1.timeSignature, f2.timeSignature],
        label: 'Time Signature',
      },
      loudness: {
        similarity: this.loudnessSimilarity(f1.loudness, f2.loudness),
        weight: 0.05,
        values: [f1.loudness, f2.loudness],
        label: 'Loudness',
      },
      duration: {
        similarity: this.durationSimilarity(f1.durationMs, f2.durationMs),
        weight: 0.05,
        values: [f1.durationMs, f2.durationMs],
        label: 'Duration',
      },
    };

    // Weighted sum normalized to 0-1
    const score =
      Object.values(components).reduce(
        (sum, comp) => sum + comp.similarity * comp.weight,
        0
      ) / 0.25; // Divide by total weight (25%)

    return { score, components };
  }

  /**
   * LAYER 3: Genre & Metadata (15% weight)
   * Genre (8%), Artist (4%), Era/Decade (3%)
   */
  private calculateLayer3(f1: AudioFeatures, f2: AudioFeatures): LayerResult {
    const components: Record<string, ScoreComponent> = {
      genre: {
        similarity: this.genreSimilarity(f1.genres || [], f2.genres || []),
        weight: 0.08,
        values: [(f1.genres || []).length, (f2.genres || []).length],
        label: 'Genre Overlap',
      },
      artist: {
        similarity: this.artistSimilarity(f1.artist, f2.artist),
        weight: 0.04,
        values: [f1.artist === f2.artist ? 1 : 0, 0],
        label: 'Artist Match',
      },
      era: {
        similarity: this.eraSimilarity(f1.releaseYear, f2.releaseYear),
        weight: 0.03,
        values: [f1.releaseYear || 0, f2.releaseYear || 0],
        label: 'Era/Decade',
      },
    };

    // Weighted sum normalized to 0-1
    const score =
      Object.values(components).reduce(
        (sum, comp) => sum + comp.similarity * comp.weight,
        0
      ) / 0.15; // Divide by total weight (15%)

    return { score, components };
  }

  /**
   * Continuous feature similarity (0-1 values)
   * Simple absolute difference
   */
  private continuousSimilarity(v1: number, v2: number): number {
    return 1 - Math.abs(v1 - v2);
  }

  /**
   * Tempo similarity with octave awareness
   * Recognizes that 120 BPM ≈ 240 BPM (double tempo sounds similar)
   */
  private tempoSimilarity(bpm1: number, bpm2: number): number {
    const ratio = Math.max(bpm1, bpm2) / Math.min(bpm1, bpm2);

    // Check for octave relationship (double/half tempo)
    if (Math.abs(ratio - 2.0) < 0.1 || Math.abs(ratio - 0.5) < 0.1) {
      return 0.7; // Octave relationship bonus
    }

    // Linear similarity for non-octave relationships
    const diff = Math.abs(bpm1 - bpm2);
    return Math.max(0, 1 - diff / 50);
  }

  /**
   * Key similarity using Circle of Fifths
   * Adjacent keys in the circle sound similar (C Major → G Major)
   */
  private keySimilarity(
    key1: number,
    mode1: number,
    key2: number,
    mode2: number
  ): number {
    // Perfect match
    if (key1 === key2 && mode1 === mode2) return 1.0;

    // Same key, different mode (relative major/minor)
    if (key1 === key2) return 0.7;

    // Circle of Fifths distance
    const distance = this.CIRCLE_DISTANCE_MATRIX[key1][key2];
    const similarity = 1 - distance / 6;

    // Mode penalty if different
    return mode1 === mode2 ? similarity : similarity * 0.8;
  }

  /**
   * Time signature similarity
   * Same signature = 1.0, compound vs simple = 0.7, different = 0.3
   */
  private timeSignatureSimilarity(ts1: number, ts2: number): number {
    if (ts1 === ts2) return 1.0;

    // Common compound signatures (6/8 ≈ 3/4)
    if ((ts1 === 6 && ts2 === 3) || (ts1 === 3 && ts2 === 6)) return 0.7;

    return 0.3; // Different time signatures
  }

  /**
   * Loudness similarity (dB)
   * Normalize -60 to 0 dB range to 0-1
   */
  private loudnessSimilarity(db1: number, db2: number): number {
    const norm1 = (db1 + 60) / 60;
    const norm2 = (db2 + 60) / 60;
    return 1 - Math.abs(norm1 - norm2);
  }

  /**
   * Duration similarity
   * Within 10s = 1.0, within 30s = 0.8, within 60s = 0.6, else linear decay
   */
  private durationSimilarity(ms1: number, ms2: number): number {
    const diff = Math.abs(ms1 - ms2) / 1000; // Convert to seconds

    if (diff < 10) return 1.0;
    if (diff < 30) return 0.8;
    if (diff < 60) return 0.6;

    return Math.max(0, 1 - diff / 300); // Linear decay up to 5 minutes
  }

  /**
   * Genre similarity using Jaccard index
   * Intersection / Union of genre sets
   */
  private genreSimilarity(genres1: string[], genres2: string[]): number {
    if (genres1.length === 0 || genres2.length === 0) return 0.5; // No data

    const set1 = new Set(genres1.map((g) => g.toLowerCase()));
    const set2 = new Set(genres2.map((g) => g.toLowerCase()));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Artist similarity
   * Same artist = 1.0, different = 0.0
   */
  private artistSimilarity(
    artist1: string | undefined,
    artist2: string | undefined
  ): number {
    if (!artist1 || !artist2) return 0.5; // No data
    return artist1 === artist2 ? 1.0 : 0.0;
  }

  /**
   * Era/decade similarity
   * Same decade = 1.0, adjacent = 0.8, further = linear decay
   */
  private eraSimilarity(
    year1: number | undefined,
    year2: number | undefined
  ): number {
    if (!year1 || !year2) return 0.5; // No data

    const decade1 = Math.floor(year1 / 10) * 10;
    const decade2 = Math.floor(year2 / 10) * 10;

    if (decade1 === decade2) return 1.0; // Same decade

    const diff = Math.abs(decade1 - decade2) / 10; // Decades apart
    return Math.max(0, 1 - diff / 5); // Penalty for distance
  }

  /**
   * Build Circle of Fifths distance matrix
   * Pre-computed for O(1) lookup during matching
   */
  private buildCircleDistanceMatrix(): number[][] {
    const matrix: number[][] = Array(12)
      .fill(0)
      .map(() => Array(12).fill(0));

    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        const pos1 = this.CIRCLE_OF_FIFTHS.indexOf(i);
        const pos2 = this.CIRCLE_OF_FIFTHS.indexOf(j);

        // Circular distance (shortest path around the circle)
        const clockwise = Math.abs(pos1 - pos2);
        const counterclockwise = 12 - clockwise;
        matrix[i][j] = Math.min(clockwise, counterclockwise);
      }
    }

    return matrix;
  }

  /**
   * Calculate confidence score (0-1)
   * Based on data completeness and feature availability
   */
  private calculateConfidence(f1: AudioFeatures, f2: AudioFeatures): number {
    let availableFeatures = 0;
    let totalFeatures = 0;

    // Check Layer 1 features (always available from Spotify)
    totalFeatures += 5;
    availableFeatures += 5;

    // Check Layer 2 features
    totalFeatures += 4;
    availableFeatures += 4;

    // Check Layer 3 features (optional)
    totalFeatures += 3;
    if (f1.genres && f1.genres.length > 0 && f2.genres && f2.genres.length > 0)
      availableFeatures++;
    if (f1.artist && f2.artist) availableFeatures++;
    if (f1.releaseYear && f2.releaseYear) availableFeatures++;

    return availableFeatures / totalFeatures;
  }

  /**
   * Generate human-readable explanation
   * Provides context for why songs match or don't match
   */
  private generateExplanation(
    f1: AudioFeatures,
    f2: AudioFeatures,
    layers: { layer1: LayerResult; layer2: LayerResult; layer3: LayerResult },
    overallScore: number
  ): MatchExplanation {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze Layer 1
    if (layers.layer1.components.valence.similarity > 0.8) {
      strengths.push('Very similar mood and emotional tone');
    } else if (layers.layer1.components.valence.similarity < 0.5) {
      weaknesses.push('Different emotional vibes (one more positive/upbeat)');
    }

    if (layers.layer1.components.energy.similarity > 0.8) {
      strengths.push('Matching energy levels');
    } else if (layers.layer1.components.energy.similarity < 0.5) {
      weaknesses.push('Contrasting energy (one more intense than the other)');
    }

    if (layers.layer1.components.tempo.similarity > 0.7) {
      strengths.push('Similar tempo and rhythm');
    } else if (layers.layer1.components.tempo.similarity < 0.5) {
      weaknesses.push('Different tempo/speed');
    }

    // Analyze Layer 2
    if (layers.layer2.components.keyMode.similarity > 0.8) {
      strengths.push('Harmonically compatible (similar key/mode)');
    } else if (layers.layer2.components.keyMode.similarity < 0.5) {
      weaknesses.push('Different harmonic structure (key/mode mismatch)');
    }

    // Analyze Layer 3
    if (f1.genres && f2.genres && layers.layer3.components.genre.similarity > 0.5) {
      strengths.push('Shared musical genres');
    } else if (
      f1.genres &&
      f2.genres &&
      layers.layer3.components.genre.similarity < 0.2
    ) {
      weaknesses.push('Different genres');
    }

    // Generate summary
    let summary = '';
    if (overallScore >= 80) {
      summary = 'These songs are very similar and would pair well together!';
    } else if (overallScore >= 60) {
      summary = 'These songs share some similarities but have notable differences.';
    } else if (overallScore >= 40) {
      summary = 'These songs have some common elements but differ in key aspects.';
    } else {
      summary = "These songs don't match well - they're quite different.";
    }

    // Provide detail breakdowns
    const moodDesc = this.getMoodDescription(f1.valence, f1.energy);
    const rhythmDesc = this.getRhythmDescription(f1.tempo, f1.danceability);
    const harmonyDesc = this.getHarmonyDescription(f1.key, f1.mode);
    const styleDesc = this.getStyleDescription(f1.genres, f1.artist);

    return {
      summary,
      strengths,
      weaknesses,
      details: {
        mood: moodDesc,
        rhythm: rhythmDesc,
        harmony: harmonyDesc,
        style: styleDesc,
      },
    };
  }

  private getMoodDescription(valence: number, energy: number): string {
    if (valence > 0.7 && energy > 0.7) return 'Upbeat and energetic';
    if (valence > 0.7 && energy < 0.4) return 'Happy but calm';
    if (valence < 0.4 && energy > 0.7) return 'Intense and dark';
    if (valence < 0.4 && energy < 0.4) return 'Melancholic and subdued';
    return 'Moderate mood and energy';
  }

  private getRhythmDescription(tempo: number, danceability: number): string {
    const speed = tempo < 90 ? 'slow' : tempo < 120 ? 'moderate' : 'fast';
    const dance = danceability > 0.7 ? 'very danceable' : danceability > 0.4 ? 'somewhat danceable' : 'not very danceable';
    return `${speed} tempo (${Math.round(tempo)} BPM), ${dance}`;
  }

  private getHarmonyDescription(key: number, mode: number): string {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyName = keys[key];
    const modeName = mode === 1 ? 'Major' : 'Minor';
    return `${keyName} ${modeName}`;
  }

  private getStyleDescription(genres: string[] | undefined, artist: string | undefined): string {
    if (!genres || genres.length === 0) return artist || 'Unknown style';
    return `${genres.slice(0, 2).join(', ')}${artist ? ` by ${artist}` : ''}`;
  }
}
