import { z } from 'zod';
import { IdSchema, IsoDateSchema } from './primitives.js';

export const VoteSchema = z.object({
  id: IdSchema,
  challengeId: IdSchema,
  entryId: IdSchema,
  voterId: IdSchema,
  createdAt: IsoDateSchema,
});
export type Vote = z.infer<typeof VoteSchema>;

export const CastVoteDtoSchema = z.object({
  entryId: IdSchema,
});
export type CastVoteDto = z.infer<typeof CastVoteDtoSchema>;

// Public results — vote counts revealed only after voting closes.
// REGRESSION-GUARD: revealing live counts during voting is the #1 vector for bandwagon
// abuse on competitive-vote apps. Closed-voting reveal only.
export const ChallengeResultsSchema = z.object({
  challengeId: IdSchema,
  status: z.enum(['voting', 'completed']),
  votingClosesAt: IsoDateSchema,
  // entries[] is empty during 'voting'; populated after 'completed'.
  entries: z
    .array(
      z.object({
        entryId: IdSchema,
        userId: IdSchema,
        voteCount: z.number().int().nonnegative(),
        rank: z.number().int().positive(),
      }),
    )
    .max(10_000),
  winnerId: IdSchema.nullable(),
});
export type ChallengeResults = z.infer<typeof ChallengeResultsSchema>;
