import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateOpaqueToken,
  tokenIndex,
  constantTimeEqual,
} from './crypto.js';

describe('hashPassword + verifyPassword', () => {
  it('round-trips a strong password', async () => {
    const hash = await hashPassword('Str0ng!Passw0rd!!');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await verifyPassword(hash, 'Str0ng!Passw0rd!!')).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('Str0ng!Passw0rd!!');
    expect(await verifyPassword(hash, 'wrong')).toBe(false);
  });

  it('rejects a corrupted hash without throwing', async () => {
    expect(await verifyPassword('not-a-real-hash', 'anything')).toBe(false);
  });

  it('refuses oversized passwords (DoS guard)', async () => {
    await expect(hashPassword('A'.repeat(257))).rejects.toThrow();
    expect(
      await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$xxx$yyy', 'A'.repeat(257)),
    ).toBe(false);
  });

  it('produces different hashes for the same password (random salt)', async () => {
    const a = await hashPassword('Str0ng!Passw0rd!!');
    const b = await hashPassword('Str0ng!Passw0rd!!');
    expect(a).not.toBe(b);
  });
});

describe('generateOpaqueToken', () => {
  it('returns 64 hex chars (256 bits)', () => {
    const t = generateOpaqueToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces distinct tokens', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateOpaqueToken());
    expect(seen.size).toBe(1000);
  });
});

describe('tokenIndex', () => {
  it('is deterministic', () => {
    const a = tokenIndex('abc');
    const b = tokenIndex('abc');
    expect(a).toBe(b);
  });

  it('is collision-resistant on tiny inputs', () => {
    expect(tokenIndex('a')).not.toBe(tokenIndex('b'));
  });

  it('returns 64 hex chars (SHA-256)', () => {
    expect(tokenIndex('x')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('constantTimeEqual', () => {
  it('returns true for equal strings', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
  });

  it('returns false for unequal strings', () => {
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
  });

  it('returns false for unequal-length strings', () => {
    expect(constantTimeEqual('a', 'aa')).toBe(false);
  });

  it('returns true for empty strings', () => {
    expect(constantTimeEqual('', '')).toBe(true);
  });
});
