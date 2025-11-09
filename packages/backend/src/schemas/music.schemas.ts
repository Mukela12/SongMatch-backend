import { z } from 'zod';

/**
 * Music API Validation Schemas
 *
 * Zod schemas for validating music endpoint requests
 */

/**
 * Search songs query parameters
 */
export const searchSongsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20))
    .pipe(z.number().min(1).max(50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 0))
    .pipe(z.number().min(0)),
  market: z.string().length(2).optional(), // ISO 3166-1 alpha-2
});

export type SearchSongsQuery = z.infer<typeof searchSongsSchema>;

/**
 * Get song by ID parameters
 */
export const getSongByIdSchema = z.object({
  platform: z.enum(['spotify']),
  songId: z.string().min(1, 'Song ID is required'),
});

export type GetSongByIdParams = z.infer<typeof getSongByIdSchema>;

/**
 * Get audio features parameters
 */
export const getAudioFeaturesSchema = z.object({
  platform: z.enum(['spotify']),
  songId: z.string().min(1, 'Song ID is required'),
});

export type GetAudioFeaturesParams = z.infer<typeof getAudioFeaturesSchema>;

/**
 * Match songs body
 */
export const matchSongsSchema = z.object({
  song1Id: z.string().min(1, 'First song ID is required'),
  song2Id: z.string().min(1, 'Second song ID is required'),
  platform: z.enum(['spotify']).default('spotify'),
  includeExplanation: z.boolean().default(true),
  bypassCache: z.boolean().default(false),
});

export type MatchSongsBody = z.infer<typeof matchSongsSchema>;
