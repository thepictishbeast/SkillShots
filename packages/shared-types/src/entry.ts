import { z } from 'zod';
import { IdSchema, IsoDateSchema, UrlSchema } from './primitives.js';

export const EntryStatusSchema = z.enum([
  'submitted',
  'flagged',
  'approved',
  'disqualified',
]);
export type EntryStatus = z.infer<typeof EntryStatusSchema>;

export const EntrySchema = z.object({
  id: IdSchema,
  challengeId: IdSchema,
  userId: IdSchema,
  videoUrl: UrlSchema,
  caption: z.string().max(280).nullable(),
  voteCount: z.number().int().nonnegative(),
  status: EntryStatusSchema,
  createdAt: IsoDateSchema,
});
export type Entry = z.infer<typeof EntrySchema>;

export const CreateEntryDtoSchema = z.object({
  attemptVideoUploadId: IdSchema,
  caption: z.string().max(280).optional(),
});
export type CreateEntryDto = z.infer<typeof CreateEntryDtoSchema>;
