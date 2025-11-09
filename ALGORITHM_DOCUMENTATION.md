# SongMatch Algorithm Documentation

> Scientific music similarity algorithm with three-layer weighted scoring
>
> **Last Updated:** 2025-11-09
> **Algorithm Version:** 1.0
> **Accuracy Target:** 70%+ correlation with human judgment

---

## Table of Contents

1. [Overview](#overview)
2. [Algorithm Design](#algorithm-design)
3. [Three-Layer Scoring System](#three-layer-scoring-system)
4. [Implementation Guide](#implementation-guide)
5. [Explanation Generation](#explanation-generation)
6. [Confidence Scoring](#confidence-scoring)
7. [Validation & Testing](#validation--testing)
8. [Performance Optimization](#performance-optimization)
9. [Future Improvements](#future-improvements)

---

## Overview

The SongMatch algorithm calculates similarity between two songs based on audio features, musical structure, and metadata. It produces:

- **Match Score**: 0-100 indicating similarity
- **Confidence Level**: 0-1 indicating algorithm certainty
- **Human-Readable Explanation**: Why songs match or don't match
- **Detailed Breakdown**: Component-by-component analysis

### Design Principles

1. **Scientifically Grounded**: Based on Music Information Retrieval (MIR) research
2. **Transparent**: Users understand why songs match
3. **Balanced**: Multiple factors contribute to final score
4. **Calibrated**: Validated against human judgment
5. **Fast**: < 5ms computation time per match

---

## Algorithm Design

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│              LAYER 1: High-Level Features               │
│                    Weight: 60%                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Valence (mood)         - 15%                   │   │
│  │  Energy (intensity)     - 15%                   │   │
│  │  Danceability (rhythm)  - 12%                   │   │
│  │  Tempo (BPM)            - 10%                   │   │
│  │  Acousticness           -  8%                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│            LAYER 2: Musical Structure                   │
│                    Weight: 25%                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Key & Mode (harmony)   - 10%                   │   │
│  │  Time Signature         -  5%                   │   │
│  │  Loudness (dynamics)    -  5%                   │   │
│  │  Duration similarity    -  5%                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           LAYER 3: Genre & Metadata                     │
│                    Weight: 15%                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Genre overlap          -  8%                   │   │
│  │  Artist similarity      -  4%                   │   │
│  │  Era/decade match       -  3%                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

            ▼
┌─────────────────────────────────────────────────────────┐
│          FINAL SCORE: Weighted Sum (0-100)              │
└─────────────────────────────────────────────────────────┘
```

---

## Three-Layer Scoring System

### Layer 1: High-Level Features (60% weight)

These are the most perceptually important audio features.

#### 1.1 Valence - Mood (15%)

**Definition:** Musical positiveness (0 = sad/negative, 1 = happy/positive)

**Similarity Calculation:**
```typescript
valenceSimilarity = 1 - Math.abs(valence1 - valence2)
```

**Example:**
- Song A: Valence = 0.8 (upbeat, happy)
- Song B: Valence = 0.75 (upbeat, happy)
- Similarity: 1 - |0.8 - 0.75| = 0.95 (95% similar)

**Rationale:** Mood is the most noticeable aspect of a song. Matching valence ensures emotional consistency.

---

#### 1.2 Energy - Intensity (15%)

**Definition:** Intensity and activity (0 = calm, 1 = energetic)

**Similarity Calculation:**
```typescript
energySimilarity = 1 - Math.abs(energy1 - energy2)
```

**Example:**
- Song A: Energy = 0.9 (high energy EDM)
- Song B: Energy = 0.3 (calm ambient)
- Similarity: 1 - |0.9 - 0.3| = 0.4 (40% similar) ❌

**Rationale:** Energy level dramatically affects perceived similarity. Mixing high and low energy songs feels jarring.

---

#### 1.3 Danceability - Rhythm (12%)

**Definition:** How suitable for dancing based on tempo, rhythm, beat strength (0-1)

**Similarity Calculation:**
```typescript
danceabilitySimilarity = 1 - Math.abs(danceability1 - danceability2)
```

**Example:**
- Song A: Danceability = 0.85 (strong beat, perfect for dancing)
- Song B: Danceability = 0.82 (strong beat)
- Similarity: 1 - |0.85 - 0.82| = 0.97 (97% similar) ✅

---

#### 1.4 Tempo - BPM (10%)

**Definition:** Beats per minute (50-200 typical range)

**Similarity Calculation with Octave Awareness:**
```typescript
function tempoSimilarity(bpm1: number, bpm2: number): number {
  const ratio = Math.max(bpm1, bpm2) / Math.min(bpm1, bpm2);

  // Check for octave relationship (double/half tempo sounds similar)
  if (Math.abs(ratio - 2.0) < 0.1 || Math.abs(ratio - 0.5) < 0.1) {
    return 0.7; // Octave relationship bonus
  }

  // Linear similarity
  const diff = Math.abs(bpm1 - bpm2);
  return Math.max(0, 1 - (diff / 50));
}
```

**Example:**
- Song A: 120 BPM
- Song B: 240 BPM (double tempo)
- Similarity: 0.7 (octave relationship) ✅

**Rationale:** Doubling or halving tempo creates similar rhythmic feel. Linear distance matters for non-octave relationships.

---

#### 1.5 Acousticness (8%)

**Definition:** Confidence that track is acoustic (0 = electric, 1 = acoustic)

**Similarity Calculation:**
```typescript
acousticnessSimilarity = 1 - Math.abs(acousticness1 - acousticness2)
```

**Example:**
- Song A: Acousticness = 0.9 (acoustic guitar)
- Song B: Acousticness = 0.1 (heavy synth)
- Similarity: 1 - |0.9 - 0.1| = 0.2 (20% similar) ❌

---

### Layer 2: Musical Structure (25% weight)

These features define the musical framework.

#### 2.1 Key & Mode - Harmony (10%)

**Definition:**
- Key: 0-11 (C, C#, D, ... , B)
- Mode: 0 = minor, 1 = major

**Similarity Calculation using Circle of Fifths:**

```typescript
// Circle of Fifths: C, G, D, A, E, B, F#, C#, G#, D#, A#, F
const CIRCLE_OF_FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

// Pre-computed distance matrix for O(1) lookup
const CIRCLE_DISTANCE_MATRIX = precomputeDistances();

function keySimilarity(
  key1: number,
  mode1: number,
  key2: number,
  mode2: number
): number {
  // Perfect match
  if (key1 === key2 && mode1 === mode2) return 1.0;

  // Same key, different mode (relative major/minor)
  if (key1 === key2) return 0.7;

  // Circle of fifths distance
  const distance = CIRCLE_DISTANCE_MATRIX[key1][key2];
  const similarity = 1 - (distance / 6);

  // Mode penalty if different
  return mode1 === mode2 ? similarity : similarity * 0.8;
}
```

**Example:**
- Song A: C Major (key=0, mode=1)
- Song B: G Major (key=7, mode=1)
- Distance in Circle: 1 step
- Similarity: 1 - (1/6) = 0.83 ✅

**Rationale:** Circle of Fifths represents harmonic relationships. Adjacent keys sound similar.

---

#### 2.2 Time Signature (5%)

**Definition:** Beats per measure (typically 3, 4, 5, 6, 7)

**Similarity Calculation:**
```typescript
function timeSignatureSimilarity(ts1: number, ts2: number): number {
  if (ts1 === ts2) return 1.0;

  // Common compound signatures (6/8 ≈ 3/4)
  if ((ts1 === 6 && ts2 === 3) || (ts1 === 3 && ts2 === 6)) return 0.7;

  return 0.3; // Different time signatures feel different
}
```

---

#### 2.3 Loudness - Dynamics (5%)

**Definition:** Overall loudness in dB (-60 to 0)

**Similarity Calculation:**
```typescript
function loudnessSimilarity(db1: number, db2: number): number {
  // Normalize to 0-1 range (-60 to 0 dB)
  const norm1 = (db1 + 60) / 60;
  const norm2 = (db2 + 60) / 60;

  return 1 - Math.abs(norm1 - norm2);
}
```

**Rationale:** Loudness affects perceived intensity. Quiet and loud tracks feel different.

---

#### 2.4 Duration Similarity (5%)

**Definition:** How close song lengths are

**Similarity Calculation:**
```typescript
function durationSimilarity(ms1: number, ms2: number): number {
  const diff = Math.abs(ms1 - ms2) / 1000; // Convert to seconds

  if (diff < 10) return 1.0;  // Within 10 seconds = same
  if (diff < 30) return 0.8;  // Within 30 seconds = similar
  if (diff < 60) return 0.6;  // Within 1 minute = somewhat similar

  return Math.max(0, 1 - (diff / 300)); // Linear decay up to 5 minutes
}
```

---

### Layer 3: Genre & Metadata (15% weight)

Contextual and categorical similarity.

#### 3.1 Genre Overlap (8%)

**Definition:** Shared genres between songs

**Similarity Calculation (Jaccard Index):**
```typescript
function genreSimilarity(genres1: string[], genres2: string[]): number {
  if (genres1.length === 0 || genres2.length === 0) return 0.5; // No data

  const set1 = new Set(genres1.map(g => g.toLowerCase()));
  const set2 = new Set(genres2.map(g => g.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  // Jaccard similarity
  return intersection.size / union.size;
}
```

**Example:**
- Song A: ["pop", "dance-pop", "electropop"]
- Song B: ["pop", "synth-pop", "indie-pop"]
- Intersection: {pop}
- Union: {pop, dance-pop, electropop, synth-pop, indie-pop}
- Similarity: 1/5 = 0.2

**Improvement - Genre Hierarchy:**
```typescript
// Pop subgenres share parent
"dance-pop" -> "pop"
"synth-pop" -> "pop"
// Gives credit for related genres
```

---

#### 3.2 Artist Similarity (4%)

**Definition:** Same artist or similar artists

**Similarity Calculation:**
```typescript
function artistSimilarity(
  artist1: string,
  artist2: string,
  relatedArtists?: Map<string, string[]>
): number {
  // Same artist
  if (artist1 === artist2) return 1.0;

  // Check if artists are related (from Spotify API)
  if (relatedArtists) {
    const related1 = relatedArtists.get(artist1) || [];
    const related2 = relatedArtists.get(artist2) || [];

    if (related1.includes(artist2) || related2.includes(artist1)) {
      return 0.6; // Related artists
    }
  }

  return 0; // Different artists
}
```

---

#### 3.3 Era/Decade Match (3%)

**Definition:** Released in same decade

**Similarity Calculation:**
```typescript
function eraSimilarity(year1: number, year2: number): number {
  if (!year1 || !year2) return 0.5; // No data

  const decade1 = Math.floor(year1 / 10) * 10;
  const decade2 = Math.floor(year2 / 10) * 10;

  if (decade1 === decade2) return 1.0; // Same decade

  const diff = Math.abs(decade1 - decade2) / 10; // Decades apart
  return Math.max(0, 1 - (diff / 5)); // Penalty for distance
}
```

---

## Implementation Guide

### TypeScript Implementation

```typescript
// src/services/matching/algorithm.service.ts

import { injectable } from 'tsyringe';
import { AudioFeatures, MatchResult } from '@/types/music.types';

@injectable()
export class MatchingService {
  private readonly ALGORITHM_VERSION = '1.0';

  /**
   * Calculate match between two songs
   * Target: < 5ms execution time
   */
  calculateMatch(features1: AudioFeatures, features2: AudioFeatures): MatchResult {
    const startTime = performance.now();

    // Layer 1: High-level features (60%)
    const layer1 = this.calculateLayer1(features1, features2);

    // Layer 2: Musical structure (25%)
    const layer2 = this.calculateLayer2(features1, features2);

    // Layer 3: Genre & metadata (15%)
    const layer3 = this.calculateLayer3(features1, features2);

    // Weighted sum
    const overallScore = Math.round(
      (layer1.score * 0.60 +
       layer2.score * 0.25 +
       layer3.score * 0.15) * 100
    );

    // Calculate confidence
    const confidence = this.calculateConfidence(features1, features2);

    // Generate explanation
    const explanation = this.generateExplanation(
      features1,
      features2,
      { layer1, layer2, layer3 }
    );

    const processingTime = Math.round(performance.now() - startTime);

    return {
      overallScore,
      confidence,
      breakdown: { layer1, layer2, layer3 },
      explanation,
      processingTime,
      algorithmVersion: this.ALGORITHM_VERSION,
    };
  }

  private calculateLayer1(f1: AudioFeatures, f2: AudioFeatures) {
    const components = {
      valence: {
        similarity: this.continuousSimilarity(f1.valence, f2.valence),
        weight: 0.15,
        values: [f1.valence, f2.valence],
      },
      energy: {
        similarity: this.continuousSimilarity(f1.energy, f2.energy),
        weight: 0.15,
        values: [f1.energy, f2.energy],
      },
      danceability: {
        similarity: this.continuousSimilarity(f1.danceability, f2.danceability),
        weight: 0.12,
        values: [f1.danceability, f2.danceability],
      },
      tempo: {
        similarity: this.tempoSimilarity(f1.tempo, f2.tempo),
        weight: 0.10,
        values: [f1.tempo, f2.tempo],
      },
      acousticness: {
        similarity: this.continuousSimilarity(f1.acousticness, f2.acousticness),
        weight: 0.08,
        values: [f1.acousticness, f2.acousticness],
      },
    };

    // Weighted sum
    const score = Object.values(components).reduce(
      (sum, comp) => sum + (comp.similarity * comp.weight),
      0
    ) / 0.60; // Normalize to 0-1

    return { score, components };
  }

  // Inline for JIT optimization
  private continuousSimilarity(v1: number, v2: number): number {
    return 1 - Math.abs(v1 - v2);
  }

  private tempoSimilarity(bpm1: number, bpm2: number): number {
    const ratio = Math.max(bpm1, bpm2) / Math.min(bpm1, bpm2);

    // Octave relationship (double/half tempo)
    if (Math.abs(ratio - 2.0) < 0.1 || Math.abs(ratio - 0.5) < 0.1) {
      return 0.7;
    }

    // Linear similarity
    const diff = Math.abs(bpm1 - bpm2);
    return Math.max(0, 1 - (diff / 50));
  }

  private calculateLayer2(f1: AudioFeatures, f2: AudioFeatures) {
    const components = {
      key: {
        similarity: this.keySimilarity(f1.key, f1.mode, f2.key, f2.mode),
        weight: 0.10,
      },
      timeSignature: {
        similarity: this.timeSignatureSimilarity(f1.time_signature, f2.time_signature),
        weight: 0.05,
      },
      loudness: {
        similarity: this.loudnessSimilarity(f1.loudness, f2.loudness),
        weight: 0.05,
      },
      duration: {
        similarity: this.durationSimilarity(f1.duration_ms, f2.duration_ms),
        weight: 0.05,
      },
    };

    const score = Object.values(components).reduce(
      (sum, comp) => sum + (comp.similarity * comp.weight),
      0
    ) / 0.25; // Normalize to 0-1

    return { score, components };
  }

  private calculateLayer3(f1: AudioFeatures, f2: AudioFeatures) {
    const components = {
      genre: {
        similarity: this.genreSimilarity(f1.genres || [], f2.genres || []),
        weight: 0.08,
      },
      era: {
        similarity: this.eraSimilarity(f1.release_year || 0, f2.release_year || 0),
        weight: 0.03,
      },
    };

    const score = Object.values(components).reduce(
      (sum, comp) => sum + (comp.similarity * comp.weight),
      0
    ) / 0.15; // Normalize to 0-1

    return { score, components };
  }
}
```

---

## Explanation Generation

### Human-Readable Explanations

```typescript
generateExplanation(f1, f2, breakdown) {
  const reasons = [];
  const differences = [];

  // Analyze each component
  if (breakdown.layer1.components.energy.similarity > 0.9) {
    reasons.push(
      `Similar energy levels (${(f1.energy * 100).toFixed(0)}% vs ${(f2.energy * 100).toFixed(0)}%)`
    );
  }

  if (breakdown.layer1.components.valence.similarity < 0.5) {
    differences.push(
      `Different moods: Song 1 is ${f1.valence > 0.5 ? 'upbeat' : 'melancholic'}, Song 2 is ${f2.valence > 0.5 ? 'upbeat' : 'melancholic'}`
    );
  }

  // Generate summary
  const summary = overallScore >= 80
    ? "Excellent match! These songs share many musical characteristics."
    : overallScore >= 60
    ? "Good match! Songs have similar vibes with some differences."
    : overallScore >= 40
    ? "Moderate match. Some shared elements but distinct styles."
    : "Different styles. These songs have distinct characteristics.";

  return {
    summary,
    topReasons: reasons.slice(0, 3),
    differences: differences.slice(0, 2),
  };
}
```

---

## Confidence Scoring

Confidence indicates how reliable the match score is.

```typescript
calculateConfidence(f1: AudioFeatures, f2: AudioFeatures): number {
  let confidence = 0.5; // Base confidence

  // More data = higher confidence
  const dataCompleteness = this.assessDataCompleteness(f1, f2);
  confidence += dataCompleteness * 0.3;

  // More features available = higher confidence
  if (f1.genres && f2.genres && f1.genres.length > 0 && f2.genres.length > 0) {
    confidence += 0.1;
  }

  // Not estimated = higher confidence
  if (!f1.estimated && !f2.estimated) {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}
```

---

## Validation & Testing

### Test Suite

```typescript
// tests/unit/algorithm.test.ts

describe('MatchingService', () => {
  it('should return 100 for identical songs', () => {
    const features = createTestFeatures();
    const result = service.calculateMatch(features, features);
    expect(result.overallScore).toBe(100);
  });

  it('should score high for similar songs', () => {
    const pop1 = createPopSong({ energy: 0.8, valence: 0.7 });
    const pop2 = createPopSong({ energy: 0.82, valence: 0.72 });
    const result = service.calculateMatch(pop1, pop2);
    expect(result.overallScore).toBeGreaterThan(80);
  });

  it('should score low for opposite styles', () => {
    const ballad = createBallad();
    const metal = createMetal();
    const result = service.calculateMatch(ballad, metal);
    expect(result.overallScore).toBeLessThan(40);
  });
});
```

### Human Validation Dataset

Collect 100+ song pairs with human ratings:

```typescript
const validationSet = [
  {
    song1: "spotify:track:...",
    song2: "spotify:track:...",
    humanScore: 85, // Average of 3-5 raters
    category: "pop-pop-similar",
  },
  // ... 100+ more
];

// Calculate correlation
const correlation = calculateCorrelation(
  validationSet.map(v => v.humanScore),
  validationSet.map(v => algorithm.calculate(v.song1, v.song2).score)
);

// Target: > 0.70 correlation
```

---

## Performance Optimization

### Target: < 5ms per match

**Optimizations:**
1. **Inline Functions:** Let JIT compiler optimize
2. **Pre-computed Lookups:** Circle of Fifths distance matrix
3. **Avoid Allocations:** Reuse objects where possible
4. **Caching:** Cache match results for 7 days

```typescript
// Performance benchmark
console.time('match-calculation');
for (let i = 0; i < 1000; i++) {
  service.calculateMatch(song1, song2);
}
console.timeEnd('match-calculation');
// Target: < 5000ms total (5ms average)
```

---

## Future Improvements

### Version 1.1 (Planned)

1. **Audio Waveform Analysis**
   - Spectral centroid
   - Mel-frequency cepstral coefficients (MFCCs)
   - Chromagram analysis

2. **Lyrical Analysis**
   - Sentiment analysis
   - Topic modeling
   - Language detection

3. **User Feedback Loop**
   - A/B test weight adjustments
   - Personalized weights based on user preferences
   - Collaborative filtering

4. **Genre Hierarchy**
   - Multi-level genre taxonomy
   - Parent-child genre relationships
   - Weighted genre similarity

### Version 2.0 (Future)

1. **Machine Learning Model**
   - Neural network for feature extraction
   - Trained on millions of song pairs
   - Automatic weight optimization

2. **Cultural Context**
   - Regional music trends
   - Temporal trends (what's popular now)
   - Social graph (friends' music taste)

---

## References

1. **Music Information Retrieval:**
   - Lartillot, O., & Toiviainen, P. (2007). "A Matlab Toolbox for Musical Feature Extraction From Audio"

2. **Spotify Audio Features:**
   - https://developer.spotify.com/documentation/web-api/reference/get-audio-features

3. **Circle of Fifths:**
   - https://en.wikipedia.org/wiki/Circle_of_fifths

4. **Jaccard Similarity:**
   - https://en.wikipedia.org/wiki/Jaccard_index

---

## Changelog

**Version 1.0 (2025-11-09)**
- Initial algorithm design
- Three-layer weighted system
- Circle of Fifths implementation
- Octave-aware tempo matching
- Human-readable explanations
- Confidence scoring

---

For implementation code, see: `packages/backend/src/services/matching/algorithm.service.ts`

For testing strategy, see: `DEVELOPMENT_PLAN.md`
