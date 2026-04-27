import * as argon2 from 'argon2';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

// SECURITY: argon2id is the OWASP-recommended password hash. Parameters are
// the OWASP "second-strongest" preset — m=19MB, t=2, p=1 — survives common
// CPU+GPU brute-force budgets.
const ARGON2_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  // SECURITY: hard-cap input. argon2 is intentionally slow; without a cap a
  // 100 MB password is a DoS primitive.
  if (plain.length > 256) throw new Error('password input too long');
  return argon2.hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  if (plain.length > 256) return false;
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// SECURITY: opaque tokens are 256-bit CSPRNG. Hex (64 chars) so they're
// URL-safe and copy-pasteable; entropy is identical to base64.
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

// SECURITY: SHA-256 hex of a token is a fast lookup index; we additionally
// argon2-verify the full token. Stops a DB-leak from being instantly usable
// while staying O(1) at lookup time.
export function tokenIndex(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

// SECURITY: constant-time compare for any secret material.
// REGRESSION-GUARD: timing-leak attacks on token equality have repeatedly
// landed CVEs; never `===` compare.
export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) {
    // Equalize length so the early-return doesn't leak length itself.
    const filler = Buffer.alloc(ab.length, 0);
    timingSafeEqual(ab, filler);
    return false;
  }
  return timingSafeEqual(ab, bb);
}
