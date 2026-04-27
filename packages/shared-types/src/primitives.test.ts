import { describe, it, expect } from 'vitest';
import {
  IdSchema,
  UsernameSchema,
  EmailSchema,
  PasswordSchema,
  CentsSchema,
  UrlSchema,
  buildPlatformUrlSchema,
} from './primitives.js';

describe('IdSchema', () => {
  it('accepts a valid UUID v4', () => {
    const id = '8e9e0c3c-4b0a-4d0a-9b0a-1c2d3e4f5a6b';
    expect(IdSchema.parse(id)).toBe(id);
  });

  it('rejects non-UUIDs', () => {
    expect(() => IdSchema.parse('not-a-uuid')).toThrow();
    expect(() => IdSchema.parse('')).toThrow();
    expect(() => IdSchema.parse('1234')).toThrow();
  });

  it('rejects oversized input', () => {
    expect(() => IdSchema.parse('a'.repeat(10_000))).toThrow();
  });
});

describe('UsernameSchema', () => {
  it('accepts valid usernames', () => {
    for (const u of ['alice', 'bob_99', 'A_b_C']) {
      expect(UsernameSchema.parse(u)).toBe(u);
    }
  });

  it('rejects too-short or too-long usernames', () => {
    expect(() => UsernameSchema.parse('ab')).toThrow();
    expect(() => UsernameSchema.parse('a'.repeat(25))).toThrow();
  });

  it('rejects non-ASCII to prevent homoglyph impersonation', () => {
    // Cyrillic 'а' looks like Latin 'a' but is U+0430.
    expect(() => UsernameSchema.parse('аlice')).toThrow();
  });

  it('rejects punctuation and whitespace', () => {
    expect(() => UsernameSchema.parse('alice.smith')).toThrow();
    expect(() => UsernameSchema.parse('alice smith')).toThrow();
    expect(() => UsernameSchema.parse('alice-smith')).toThrow();
  });
});

describe('EmailSchema', () => {
  it('lowercases and trims', () => {
    expect(EmailSchema.parse('  Alice@Example.com ')).toBe('alice@example.com');
  });

  it('rejects invalid emails', () => {
    expect(() => EmailSchema.parse('alice')).toThrow();
    expect(() => EmailSchema.parse('alice@')).toThrow();
    expect(() => EmailSchema.parse('@example.com')).toThrow();
  });

  it('rejects oversized email', () => {
    expect(() => EmailSchema.parse('a'.repeat(255) + '@x.com')).toThrow();
  });
});

describe('PasswordSchema', () => {
  it('accepts a strong password', () => {
    expect(PasswordSchema.parse('Str0ng!Passw0rd!!')).toBe('Str0ng!Passw0rd!!');
  });

  it('rejects passwords missing required classes', () => {
    expect(() => PasswordSchema.parse('alllowercase123')).toThrow();
    expect(() => PasswordSchema.parse('ALLUPPERCASE123')).toThrow();
    expect(() => PasswordSchema.parse('NoDigitsHere!!')).toThrow();
  });

  it('rejects too-short passwords', () => {
    expect(() => PasswordSchema.parse('Short1!')).toThrow();
  });

  it('rejects oversized passwords (DoS guard)', () => {
    expect(() => PasswordSchema.parse('A1!' + 'a'.repeat(300))).toThrow();
  });
});

describe('CentsSchema', () => {
  it('accepts valid amounts', () => {
    expect(CentsSchema.parse(0)).toBe(0);
    expect(CentsSchema.parse(500)).toBe(500);
    expect(CentsSchema.parse(100_000_00)).toBe(100_000_00);
  });

  it('rejects negative amounts', () => {
    expect(() => CentsSchema.parse(-1)).toThrow();
  });

  it('rejects floats', () => {
    expect(() => CentsSchema.parse(1.5)).toThrow();
  });

  it('rejects amounts above platform max', () => {
    expect(() => CentsSchema.parse(100_000_01)).toThrow();
  });
});

describe('UrlSchema', () => {
  it('accepts https URLs', () => {
    const u = 'https://example.com/path';
    expect(UrlSchema.parse(u)).toBe(u);
  });

  it('rejects http URLs', () => {
    expect(() => UrlSchema.parse('http://example.com')).toThrow();
  });

  it('rejects oversized URLs', () => {
    expect(() => UrlSchema.parse('https://example.com/' + 'a'.repeat(3000))).toThrow();
  });
});

describe('buildPlatformUrlSchema', () => {
  const schema = buildPlatformUrlSchema(['cdn.skillshots.app', 'media.skillshots.app']);

  it('accepts URLs on the allow-list', () => {
    const u = 'https://cdn.skillshots.app/v/abc.mp4';
    expect(schema.parse(u)).toBe(u);
  });

  it('rejects URLs not on the allow-list', () => {
    expect(() => schema.parse('https://attacker.example/abc.mp4')).toThrow();
  });

  it('rejects malformed URLs', () => {
    expect(() => schema.parse('not a url')).toThrow();
  });
});
