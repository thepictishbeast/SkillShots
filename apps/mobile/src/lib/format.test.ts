import { describe, it, expect } from 'vitest';
import { formatCents, formatTimeLeft } from './format.js';

describe('formatCents', () => {
  it('formats whole dollars', () => {
    expect(formatCents(500)).toBe('$5.00');
  });
  it('formats with cents', () => {
    expect(formatCents(12345)).toBe('$123.45');
  });
  it('formats zero', () => {
    expect(formatCents(0)).toBe('$0.00');
  });
  it('formats negative', () => {
    expect(formatCents(-500)).toBe('-$5.00');
  });
  it('formats thousands with commas', () => {
    expect(formatCents(1_234_567)).toBe('$12,345.67');
  });
});

describe('formatTimeLeft', () => {
  const now = new Date('2026-04-27T12:00:00Z');

  it('returns "closed" for past deadline', () => {
    expect(formatTimeLeft('2026-04-27T11:00:00Z', now)).toBe('closed');
  });
  it('shows days+hours for >1 day out', () => {
    expect(formatTimeLeft('2026-04-29T18:00:00Z', now)).toBe('2d 6h');
  });
  it('shows hours+minutes for <1 day', () => {
    expect(formatTimeLeft('2026-04-27T15:30:00Z', now)).toBe('3h 30m');
  });
  it('shows minutes only for <1 hour', () => {
    expect(formatTimeLeft('2026-04-27T12:25:00Z', now)).toBe('25m');
  });
  it('returns "closed" for invalid date', () => {
    expect(formatTimeLeft('not-a-date', now)).toBe('closed');
  });
});
