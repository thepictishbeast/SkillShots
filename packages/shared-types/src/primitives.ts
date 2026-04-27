import { z } from 'zod';

// BUG ASSUMPTION: every ID could be malformed, attacker-controlled, or oversized.
// SECURITY: enforce shape and length BEFORE any DB lookup to bound attacker effort.
export const IdSchema = z
  .string()
  .uuid({ message: 'must be a valid UUID v4' })
  .brand<'Id'>();
export type Id = z.infer<typeof IdSchema>;

// SECURITY: usernames must be ASCII-restricted to avoid homoglyph impersonation
// (Cyrillic 'а' vs Latin 'a' etc.). Length-bounded to avoid storage abuse.
export const UsernameSchema = z
  .string()
  .min(3, 'username must be at least 3 characters')
  .max(24, 'username must be at most 24 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'username may only contain letters, digits, underscore')
  .brand<'Username'>();
export type Username = z.infer<typeof UsernameSchema>;

// SECURITY: trimmed, lowercased, length-capped per RFC 5321 practical limit (254).
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('invalid email')
  .max(254, 'email exceeds RFC 5321 practical limit')
  .brand<'Email'>();
export type Email = z.infer<typeof EmailSchema>;

// SECURITY: enforce a strong floor (length, classes) at the boundary.
// Final entropy is also re-checked server-side via zxcvbn.
export const PasswordSchema = z
  .string()
  .min(12, 'password must be at least 12 characters')
  .max(256, 'password exceeds maximum length (256)')
  .refine((s) => /[a-z]/.test(s), { message: 'password must contain a lowercase letter' })
  .refine((s) => /[A-Z]/.test(s), { message: 'password must contain an uppercase letter' })
  .refine((s) => /[0-9]/.test(s), { message: 'password must contain a digit' });
export type Password = z.infer<typeof PasswordSchema>;

// Money is stored in MINOR UNITS (cents) as integers — never floats.
// REGRESSION-GUARD: floating-point money has bitten this industry forever; integers only.
export const CentsSchema = z
  .number()
  .int('amount must be an integer (cents)')
  .nonnegative('amount must not be negative')
  .max(100_000_00, 'amount exceeds platform max ($100,000)')
  .brand<'Cents'>();
export type Cents = z.infer<typeof CentsSchema>;

export const IsoDateSchema = z
  .string()
  .datetime({ offset: true, message: 'must be ISO-8601 with timezone offset' });
export type IsoDate = z.infer<typeof IsoDateSchema>;

export const UrlSchema = z
  .string()
  .url('invalid URL')
  .max(2048, 'URL exceeds 2048 characters')
  .refine((u) => u.startsWith('https://'), { message: 'URL must use https' });
export type Url = z.infer<typeof UrlSchema>;

// SECURITY: video URLs must be on the platform CDN; reject arbitrary off-domain links
// to prevent phishing or malware delivery via a "challenge".
// The allow-list is supplied at validation time so the package can stay env-agnostic.
export const buildPlatformUrlSchema = (allowedHosts: readonly string[]) =>
  UrlSchema.refine(
    (u) => {
      try {
        const host = new URL(u).host;
        return allowedHosts.includes(host);
      } catch {
        return false;
      }
    },
    { message: 'URL host is not on the platform allow-list' },
  );
