import { describe, it, expect, beforeEach } from 'vitest';
import { EnvSchema, loadEnv, _resetEnvForTesting } from './env.js';

const minimalEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: 'postgresql://x:y@localhost:5432/z',
  JWT_ACCESS_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  CORS_ORIGINS: 'http://localhost:8081',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'sk',
  S3_ACCESS_KEY: 'k',
  S3_SECRET_KEY: 's',
  S3_PUBLIC_HOSTS: 'cdn.example.com',
  ALLOWED_VIDEO_MIME: 'video/mp4',
};

beforeEach(() => _resetEnvForTesting());

describe('EnvSchema', () => {
  it('accepts a fully-specified valid env', () => {
    const r = EnvSchema.safeParse(minimalEnv);
    expect(r.success).toBe(true);
  });

  it('rejects http DATABASE_URL', () => {
    const r = EnvSchema.safeParse({ ...minimalEnv, DATABASE_URL: 'http://x' });
    expect(r.success).toBe(false);
  });

  it('rejects too-short secrets', () => {
    const r = EnvSchema.safeParse({ ...minimalEnv, JWT_ACCESS_SECRET: 'short' });
    expect(r.success).toBe(false);
  });

  it('rejects platform fee outside 1000–1500 bps', () => {
    const lo = EnvSchema.safeParse({ ...minimalEnv, STRIPE_PLATFORM_FEE_BPS: '999' });
    expect(lo.success).toBe(false);
    const hi = EnvSchema.safeParse({ ...minimalEnv, STRIPE_PLATFORM_FEE_BPS: '1501' });
    expect(hi.success).toBe(false);
  });

  it('parses comma-list into array', () => {
    const r = EnvSchema.safeParse({ ...minimalEnv, CORS_ORIGINS: 'a,b, c' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.CORS_ORIGINS).toEqual(['a', 'b', 'c']);
  });
});

describe('loadEnv', () => {
  it('refuses identical access + refresh secrets', () => {
    expect(() =>
      loadEnv({ ...minimalEnv, JWT_REFRESH_SECRET: minimalEnv.JWT_ACCESS_SECRET } as never),
    ).toThrow(/MUST be different/);
  });

  it('refuses example default secrets in production', () => {
    expect(() =>
      loadEnv({
        ...minimalEnv,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'replace_me_with_openssl_rand_base64_64xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      } as never),
    ).toThrow(/refusing to start/);
  });

  it('returns a frozen-feeling singleton across calls', () => {
    const a = loadEnv(minimalEnv as never);
    const b = loadEnv({ ...minimalEnv, PORT: '9999' } as never);
    // Cached — second call ignores the new input.
    expect(a.PORT).toBe(b.PORT);
  });
});
