import { describe, it, expect } from 'vitest';
import { isAtLeastYearsOld } from './age.js';

const dob = (s: string): Date => new Date(s + 'T00:00:00.000Z');
const at = (s: string): Date => new Date(s + 'T00:00:00.000Z');

describe('isAtLeastYearsOld', () => {
  it('accepts a clearly-of-age user', () => {
    expect(isAtLeastYearsOld(dob('1990-01-01'), 18, at('2026-04-27'))).toBe(true);
  });

  it('rejects a clearly-underage user', () => {
    expect(isAtLeastYearsOld(dob('2020-01-01'), 18, at('2026-04-27'))).toBe(false);
  });

  it('handles birthday-on-cutoff exactly', () => {
    // born 2008-04-27 — turns 18 exactly on 2026-04-27 → eligible
    expect(isAtLeastYearsOld(dob('2008-04-27'), 18, at('2026-04-27'))).toBe(true);
  });

  it('handles birthday-day-after-cutoff', () => {
    // born 2008-04-28 — turns 18 on 2026-04-28 → not yet eligible on 2026-04-27
    expect(isAtLeastYearsOld(dob('2008-04-28'), 18, at('2026-04-27'))).toBe(false);
  });

  it('rejects invalid DOB', () => {
    expect(isAtLeastYearsOld(new Date('not a date'), 18)).toBe(false);
  });

  it('rejects negative minimum age', () => {
    expect(isAtLeastYearsOld(dob('1990-01-01'), -1)).toBe(false);
  });

  it('handles 21+ for higher-age markets', () => {
    expect(isAtLeastYearsOld(dob('2005-04-26'), 21, at('2026-04-27'))).toBe(true);
    expect(isAtLeastYearsOld(dob('2005-04-28'), 21, at('2026-04-27'))).toBe(false);
  });
});
