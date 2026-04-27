import { z } from 'zod';
import { EmailSchema, PasswordSchema, UsernameSchema, IsoDateSchema } from './primitives.js';

export const SignupDtoSchema = z.object({
  email: EmailSchema,
  username: UsernameSchema,
  password: PasswordSchema,
  // Self-declared DOB — required, but not sufficient for paid-feature gating.
  // Kicks the real KYC requirement to Stripe Identity / Persona.
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateOfBirth must be YYYY-MM-DD'),
  // Explicit checkboxes — the user must SAY they accepted both.
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
});
export type SignupDto = z.infer<typeof SignupDtoSchema>;

export const LoginDtoSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(256),
});
export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string().min(1),
  // expiresIn is seconds-from-now; clients must NOT trust the JWT exp claim
  // for UI scheduling (clock skew) — they should track from receipt.
  expiresInSeconds: z.number().int().positive(),
  refreshToken: z.string().min(1),
  refreshExpiresInSeconds: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const RefreshDtoSchema = z.object({
  refreshToken: z.string().min(1).max(2048),
});
export type RefreshDto = z.infer<typeof RefreshDtoSchema>;

export const SessionSchema = z.object({
  userId: z.string().uuid(),
  issuedAt: IsoDateSchema,
  expiresAt: IsoDateSchema,
});
export type Session = z.infer<typeof SessionSchema>;
