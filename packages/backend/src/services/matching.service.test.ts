import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { MatchingService } from './matching.service';
import { AudioFeatures } from '../types/music.types';

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    service = new MatchingService();
  });

  // Test data: Identical songs
  const identicalSong: AudioFeatures = {
    valence: 0.8,
    energy: 0.7,
    danceability: 0.75,
    tempo: 120,
    acousticness: 0.3,
    key: 0, // C
    mode: 1, // Major
    timeSignature: 4,
    loudness: -5,
    durationMs: 200000, // 3:20
    genres: ['pop', 'dance-pop'],
    artist: 'Test Artist',
    releaseYear: 2020,
  };

  // Test data: Very similar songs
  const similarSong: AudioFeatures = {
    valence: 0.82,
    energy: 0.68,
    danceability: 0.78,
    tempo: 118,
    acousticness: 0.28,
    key: 7, // G (one step in Circle of Fifths)
    mode: 1, // Major
    timeSignature: 4,
    loudness: -6,
    durationMs: 210000, // 3:30
    genres: ['pop', 'synth-pop'],
    artist: 'Similar Artist',
    releaseYear: 2021,
  };

  // Test data: Opposite songs
  const oppositeSong: AudioFeatures = {
    valence: 0.2, // sad vs happy
    energy: 0.3, // calm vs energetic
    danceability: 0.25, // not danceable
    tempo: 60, // slow
    acousticness: 0.9, // acoustic vs electric
    key: 6, // F# (opposite in circle)
    mode: 0, // Minor vs Major
    timeSignature: 3, // 3/4 vs 4/4
    loudness: -15,
    durationMs: 400000, // 6:40 (much longer)
    genres: ['classical', 'piano'],
    artist: 'Different Artist',
    releaseYear: 1980,
  };

  // Test data: Octave tempo relationship
  const doubleTempo: AudioFeatures = {
    ...identicalSong,
    tempo: 240, // Double tempo (120 * 2)
  };

  describe('calculateMatch', () => {
    it('should return 100 for identical songs', () => {
      const result = service.calculateMatch(identicalSong, identicalSong);

      expect(result.overallScore).toBe(100);
      expect(result.confidence).toBeGreaterThan(0.9);
      expect(result.processingTime).toBeLessThan(5); // < 5ms
    });

    it('should return high score (70-90) for very similar songs', () => {
      const result = service.calculateMatch(identicalSong, similarSong);

      expect(result.overallScore).toBeGreaterThanOrEqual(70);
      expect(result.overallScore).toBeLessThanOrEqual(90);
      expect(result.processingTime).toBeLessThan(5);
    });

    it('should return low score (< 40) for opposite songs', () => {
      const result = service.calculateMatch(identicalSong, oppositeSong);

      expect(result.overallScore).toBeLessThan(40);
      expect(result.processingTime).toBeLessThan(5);
    });

    it('should include all required result fields', () => {
      const result = service.calculateMatch(identicalSong, similarSong);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('algorithmVersion');
    });

    it('should have proper breakdown structure', () => {
      const result = service.calculateMatch(identicalSong, similarSong);

      expect(result.breakdown).toHaveProperty('layer1');
      expect(result.breakdown).toHaveProperty('layer2');
      expect(result.breakdown).toHaveProperty('layer3');

      expect(result.breakdown.layer1.score).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.layer1.score).toBeLessThanOrEqual(1);
      expect(result.breakdown.layer1.components).toBeDefined();
    });
  });

  describe('Layer 1: High-Level Features', () => {
    it('should score valence similarity correctly', () => {
      const high1 = { ...identicalSong, valence: 0.9 };
      const high2 = { ...identicalSong, valence: 0.85 };
      const low = { ...identicalSong, valence: 0.1 };

      const similar = service.calculateMatch(high1, high2);
      const different = service.calculateMatch(high1, low);

      expect(similar.breakdown.layer1.components.valence.similarity).toBeGreaterThan(0.9);
      expect(different.breakdown.layer1.components.valence.similarity).toBeLessThan(0.3);
    });

    it('should score energy similarity correctly', () => {
      const highEnergy = { ...identicalSong, energy: 0.95 };
      const lowEnergy = { ...identicalSong, energy: 0.15 };

      const result = service.calculateMatch(highEnergy, lowEnergy);

      expect(result.breakdown.layer1.components.energy.similarity).toBeLessThan(0.3);
    });

    it('should recognize octave tempo relationships', () => {
      const result = service.calculateMatch(identicalSong, doubleTempo);

      // Octave relationship should give 0.7 similarity
      expect(result.breakdown.layer1.components.tempo.similarity).toBeGreaterThanOrEqual(
        0.65
      );
      expect(result.breakdown.layer1.components.tempo.similarity).toBeLessThanOrEqual(
        0.75
      );
    });

    it('should score linear tempo similarity', () => {
      const tempo120 = { ...identicalSong, tempo: 120 };
      const tempo125 = { ...identicalSong, tempo: 125 };
      const tempo80 = { ...identicalSong, tempo: 80 };

      const close = service.calculateMatch(tempo120, tempo125);
      const far = service.calculateMatch(tempo120, tempo80);

      expect(close.breakdown.layer1.components.tempo.similarity).toBeGreaterThan(
        far.breakdown.layer1.components.tempo.similarity
      );
    });
  });

  describe('Layer 2: Musical Structure', () => {
    it('should use Circle of Fifths for key similarity', () => {
      const cMajor = { ...identicalSong, key: 0, mode: 1 }; // C Major
      const gMajor = { ...identicalSong, key: 7, mode: 1 }; // G Major (1 step)
      const fSharpMajor = { ...identicalSong, key: 6, mode: 1 }; // F# (6 steps)

      const adjacent = service.calculateMatch(cMajor, gMajor);
      const opposite = service.calculateMatch(cMajor, fSharpMajor);

      expect(adjacent.breakdown.layer2.components.keyMode.similarity).toBeGreaterThan(
        opposite.breakdown.layer2.components.keyMode.similarity
      );
    });

    it('should recognize relative major/minor', () => {
      const cMajor = { ...identicalSong, key: 0, mode: 1 };
      const cMinor = { ...identicalSong, key: 0, mode: 0 };

      const result = service.calculateMatch(cMajor, cMinor);

      // Same key, different mode should give 0.7
      expect(result.breakdown.layer2.components.keyMode.similarity).toBe(0.7);
    });

    it('should score time signature similarity', () => {
      const fourFour = { ...identicalSong, timeSignature: 4 };
      const threeFour = { ...identicalSong, timeSignature: 3 };
      const fiveFour = { ...identicalSong, timeSignature: 5 };

      const same = service.calculateMatch(fourFour, fourFour);
      const different = service.calculateMatch(fourFour, fiveFour);

      expect(same.breakdown.layer2.components.timeSignature.similarity).toBe(1.0);
      expect(different.breakdown.layer2.components.timeSignature.similarity).toBe(0.3);
    });

    it('should score duration similarity', () => {
      const short = { ...identicalSong, durationMs: 180000 }; // 3:00
      const medium = { ...identicalSong, durationMs: 185000 }; // 3:05
      const long = { ...identicalSong, durationMs: 300000 }; // 5:00

      const similar = service.calculateMatch(short, medium);
      const different = service.calculateMatch(short, long);

      expect(similar.breakdown.layer2.components.duration.similarity).toBeGreaterThan(
        0.9
      );
      expect(different.breakdown.layer2.components.duration.similarity).toBeLessThan(
        0.8
      );
    });
  });

  describe('Layer 3: Genre & Metadata', () => {
    it('should use Jaccard similarity for genres', () => {
      const pop1 = { ...identicalSong, genres: ['pop', 'dance-pop', 'electropop'] };
      const pop2 = { ...identicalSong, genres: ['pop', 'synth-pop'] };
      const rock = { ...identicalSong, genres: ['rock', 'alternative-rock'] };

      const overlap = service.calculateMatch(pop1, pop2);
      const noOverlap = service.calculateMatch(pop1, rock);

      expect(overlap.breakdown.layer3.components.genre.similarity).toBeGreaterThan(
        noOverlap.breakdown.layer3.components.genre.similarity
      );
    });

    it('should recognize same artist', () => {
      const artist1 = { ...identicalSong, artist: 'Taylor Swift' };
      const artist2 = { ...identicalSong, artist: 'Taylor Swift' };
      const artist3 = { ...identicalSong, artist: 'Ed Sheeran' };

      const same = service.calculateMatch(artist1, artist2);
      const different = service.calculateMatch(artist1, artist3);

      expect(same.breakdown.layer3.components.artist.similarity).toBe(1.0);
      expect(different.breakdown.layer3.components.artist.similarity).toBe(0.0);
    });

    it('should recognize same decade', () => {
      const year2020 = { ...identicalSong, releaseYear: 2020 };
      const year2025 = { ...identicalSong, releaseYear: 2025 };
      const year1990 = { ...identicalSong, releaseYear: 1990 };

      const sameDecade = service.calculateMatch(year2020, year2025);
      const differentDecade = service.calculateMatch(year2020, year1990);

      expect(sameDecade.breakdown.layer3.components.era.similarity).toBe(1.0);
      expect(differentDecade.breakdown.layer3.components.era.similarity).toBeLessThan(
        0.5
      );
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence with complete data', () => {
      const result = service.calculateMatch(identicalSong, similarSong);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should have lower confidence with missing metadata', () => {
      const incomplete = { ...identicalSong, genres: undefined, artist: undefined, releaseYear: undefined };
      const result = service.calculateMatch(identicalSong, incomplete);
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('Explanation Generation', () => {
    it('should generate summary for high match', () => {
      const result = service.calculateMatch(identicalSong, similarSong);
      expect(result.explanation.summary).toBeDefined();
      expect(result.explanation.summary.length).toBeGreaterThan(0);
    });

    it('should include strengths for similar songs', () => {
      const result = service.calculateMatch(identicalSong, similarSong);
      expect(result.explanation.strengths.length).toBeGreaterThan(0);
    });

    it('should include weaknesses for opposite songs', () => {
      const result = service.calculateMatch(identicalSong, oppositeSong);
      expect(result.explanation.weaknesses.length).toBeGreaterThan(0);
    });

    it('should provide detailed breakdowns', () => {
      const result = service.calculateMatch(identicalSong, similarSong);
      expect(result.explanation.details.mood).toBeDefined();
      expect(result.explanation.details.rhythm).toBeDefined();
      expect(result.explanation.details.harmony).toBeDefined();
      expect(result.explanation.details.style).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete matching in < 5ms', () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = service.calculateMatch(identicalSong, similarSong);
        times.push(result.processingTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(5);
      expect(maxTime).toBeLessThan(10); // Even max should be reasonable
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields', () => {
      const minimal: AudioFeatures = {
        valence: 0.5,
        energy: 0.5,
        danceability: 0.5,
        tempo: 100,
        acousticness: 0.5,
        key: 0,
        mode: 1,
        timeSignature: 4,
        loudness: -10,
        durationMs: 200000,
      };

      const result = service.calculateMatch(minimal, minimal);
      expect(result.overallScore).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(90);
    });

    it('should handle extreme values', () => {
      const extreme1: AudioFeatures = {
        valence: 1.0,
        energy: 1.0,
        danceability: 1.0,
        tempo: 200,
        acousticness: 0.0,
        key: 11,
        mode: 1,
        timeSignature: 7,
        loudness: 0,
        durationMs: 600000,
      };

      const extreme2: AudioFeatures = {
        valence: 0.0,
        energy: 0.0,
        danceability: 0.0,
        tempo: 50,
        acousticness: 1.0,
        key: 0,
        mode: 0,
        timeSignature: 3,
        loudness: -60,
        durationMs: 60000,
      };

      const result = service.calculateMatch(extreme1, extreme2);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
