import { z } from 'zod';
import { IdSchema, IsoDateSchema, CentsSchema, UrlSchema } from './primitives.js';

export const ChallengeStatusSchema = z.enum([
  'draft',
  'live',
  'voting',
  'completed',
  'cancelled',
]);
export type ChallengeStatus = z.infer<typeof ChallengeStatusSchema>;

// Curated category list — keeping it small at launch tightens moderation surface.
export const ChallengeCategorySchema = z.enum([
  'sports',
  'gaming',
  'fitness',
  'music',
  'art',
  'cooking',
  'tricks',
  'misc',
]);
export type ChallengeCategory = z.infer<typeof ChallengeCategorySchema>;

export const ChallengeSchema = z.object({
  id: IdSchema,
  creatorId: IdSchema,
  title: z.string().min(3).max(80),
  category: ChallengeCategorySchema,
  rules: z.string().min(20).max(2000),
  proofVideoUrl: UrlSchema,
  entryFee: CentsSchema,
  creatorPotAmount: CentsSchema,
  totalPot: CentsSchema,
  platformFeeBasisPoints: z
    .number()
    .int()
    .min(1000, 'fee floor 10.00%')
    .max(1500, 'fee ceiling 15.00%'),
  status: ChallengeStatusSchema,
  entryDeadline: IsoDateSchema,
  votingDeadline: IsoDateSchema,
  winnerId: IdSchema.nullable(),
  createdAt: IsoDateSchema,
});
export type Challenge = z.infer<typeof ChallengeSchema>;

// CreateChallengeDto — voted deadlines are emitted as durations (minutes) so the
// server can convert to absolute timestamps with its own clock. Client clocks lie.
// REGRESSION-GUARD: previous teams have shipped relative-deadline bugs where
// 10-second-skewed clients created challenges that closed before they opened.
export const CreateChallengeDtoSchema = z
  .object({
    title: z.string().min(3).max(80),
    category: ChallengeCategorySchema,
    rules: z.string().min(20).max(2000),
    entryFee: CentsSchema,
    creatorPotAmount: CentsSchema,
    entryWindowMinutes: z.number().int().min(60).max(60 * 24 * 14),
    votingWindowMinutes: z.number().int().min(60).max(60 * 24 * 7),
    proofVideoUploadId: IdSchema,
  })
  .refine((c) => c.entryFee > 0 || c.creatorPotAmount > 0, {
    message: 'either entryFee or creatorPotAmount must be > 0',
  });
export type CreateChallengeDto = z.infer<typeof CreateChallengeDtoSchema>;

export const ListChallengesQuerySchema = z.object({
  status: ChallengeStatusSchema.optional(),
  category: ChallengeCategorySchema.optional(),
  cursor: IdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListChallengesQuery = z.infer<typeof ListChallengesQuerySchema>;
