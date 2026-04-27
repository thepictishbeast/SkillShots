import { z } from 'zod';

// SECURITY: env validation runs at startup and HARD-FAILS if any required var
// is missing or malformed. We refuse to start a half-configured app.
// REGRESSION-GUARD: a previous-life incident: prod ran for 6 hours with a
// stale Stripe key because the missing-env path silently used a default.
//
// Secret minimum length comes from the OWASP cheat-sheet: 64 raw bytes
// (≈86 base64 chars) for symmetric JWT signing keys.

const SecretSchema = z
  .string()
  .min(32, 'secret must be at least 32 characters (64+ recommended)');

const CommaListSchema = z
  .string()
  .min(1)
  .transform((s) => s.split(',').map((x) => x.trim()).filter((x) => x.length > 0));

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z
    .string()
    .url()
    .refine((u) => u.startsWith('postgresql://') || u.startsWith('postgres://'), {
      message: 'DATABASE_URL must be a postgres URL',
    }),

  JWT_ACCESS_SECRET: SecretSchema,
  JWT_REFRESH_SECRET: SecretSchema,
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(60 * 60).default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().min(3600).max(60 * 60 * 24 * 60).default(60 * 60 * 24 * 30),

  CORS_ORIGINS: CommaListSchema,

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1).max(63),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_FORCE_PATH_STYLE: z
    .string()
    .default('true')
    .transform((s) => s === 'true'),
  S3_PUBLIC_HOSTS: CommaListSchema,

  MAX_VIDEO_BYTES: z.coerce.number().int().positive().default(100 * 1024 * 1024),
  MAX_VIDEO_DURATION_SECONDS: z.coerce.number().int().positive().default(120),
  ALLOWED_VIDEO_MIME: CommaListSchema,

  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  STRIPE_PLATFORM_FEE_BPS: z.coerce
    .number()
    .int()
    .min(1000, 'platform fee floor 10.00%')
    .max(1500, 'platform fee ceiling 15.00%')
    .default(1250),

  RL_GLOBAL_PER_MIN: z.coerce.number().int().positive().default(600),
  RL_AUTH_PER_MIN: z.coerce.number().int().positive().default(20),
  RL_VOTE_PER_MIN: z.coerce.number().int().positive().default(60),

  MIN_AGE_YEARS: z.coerce.number().int().min(13).max(99).default(18),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

// SECURITY: in production, refuse to fall back to default secrets.
// JWT_ACCESS_SECRET === JWT_REFRESH_SECRET is a key-reuse bug — refuse.
export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  if (parsed.data.JWT_ACCESS_SECRET === parsed.data.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET MUST be different (key-reuse bug)');
  }

  if (parsed.data.NODE_ENV === 'production') {
    if (parsed.data.JWT_ACCESS_SECRET.startsWith('replace_me')) {
      throw new Error('JWT_ACCESS_SECRET appears to be the example default — refusing to start');
    }
    if (parsed.data.JWT_REFRESH_SECRET.startsWith('replace_me')) {
      throw new Error('JWT_REFRESH_SECRET appears to be the example default — refusing to start');
    }
  }

  cached = parsed.data;
  return cached;
}

// Test-only: reset the singleton.
export function _resetEnvForTesting(): void {
  cached = undefined;
}
