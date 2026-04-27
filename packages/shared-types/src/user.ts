import { z } from 'zod';
import { IdSchema, UsernameSchema, EmailSchema, IsoDateSchema, UrlSchema } from './primitives.js';

export const UserPublicSchema = z.object({
  id: IdSchema,
  username: UsernameSchema,
  avatarUrl: UrlSchema.optional(),
  bio: z.string().max(280).optional(),
  verified: z.boolean(),
  totalWins: z.number().int().nonnegative(),
  totalChallengesCreated: z.number().int().nonnegative(),
  totalChallengesEntered: z.number().int().nonnegative(),
  winStreak: z.number().int().nonnegative(),
  createdAt: IsoDateSchema,
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

// Private user view — totalEarnings is only ever exposed to the user themselves.
// SECURITY: never serialize PrivateUser to a public endpoint.
export const UserPrivateSchema = UserPublicSchema.extend({
  email: EmailSchema,
  totalEarnings: z.number().int().nonnegative(),
  ageVerifiedAt: IsoDateSchema.nullable(),
  kycVerifiedAt: IsoDateSchema.nullable(),
});
export type UserPrivate = z.infer<typeof UserPrivateSchema>;

export const UpdateProfileDtoSchema = z.object({
  username: UsernameSchema.optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: UrlSchema.optional(),
});
export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>;
