import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { VoteFraudService } from './vote-fraud.service.js';

const svc = new VoteFraudService();

describe('VoteFraudService.hashSignal', () => {
  it('returns null for null/undefined/empty', () => {
    expect(svc.hashSignal(null)).toBeNull();
    expect(svc.hashSignal(undefined)).toBeNull();
    expect(svc.hashSignal('')).toBeNull();
  });

  it('is deterministic per value', () => {
    expect(svc.hashSignal('1.2.3.4')).toBe(svc.hashSignal('1.2.3.4'));
  });

  it('returns 32 hex chars (truncated SHA-256)', () => {
    const h = svc.hashSignal('1.2.3.4')!;
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces different hashes for different values', () => {
    expect(svc.hashSignal('1.2.3.4')).not.toBe(svc.hashSignal('1.2.3.5'));
  });
});

describe('VoteFraudService.scoreVoteSignals', () => {
  it('clean votes score zero', () => {
    const { score, reasons } = svc.scoreVoteSignals({
      voterAccountAgeMs: 1000 * 60 * 60 * 24 * 365,
      sameIpVotesInChallenge: 0,
      coVotePartnersInLast30Days: 0,
    });
    expect(score).toBe(0);
    expect(reasons).toEqual([]);
  });

  it('flags fresh accounts heavily', () => {
    const { score, reasons } = svc.scoreVoteSignals({
      voterAccountAgeMs: 60 * 1000,
      sameIpVotesInChallenge: 0,
      coVotePartnersInLast30Days: 0,
    });
    expect(score).toBeGreaterThanOrEqual(40);
    expect(reasons).toContain('account_under_1h');
  });

  it('flags high IP cluster + young account → auto-flag', () => {
    const { score } = svc.scoreVoteSignals({
      voterAccountAgeMs: 60 * 1000,
      sameIpVotesInChallenge: 10,
      coVotePartnersInLast30Days: 0,
    });
    expect(svc.shouldAutoFlag(score)).toBe(true);
  });

  it('shouldQueueForReview is exclusive of shouldAutoFlag', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (score: number) => {
        const auto = svc.shouldAutoFlag(score);
        const queue = svc.shouldQueueForReview(score);
        return !(auto && queue);
      }),
      { numRuns: 10_000 },
    );
  });

  it('score is monotonic in each suspicion signal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        fc.integer({ min: 0, max: 30 }),
        (lowIp: number, highIpDelta: number) => {
          const high = lowIp + highIpDelta;
          const low = svc.scoreVoteSignals({
            voterAccountAgeMs: 0,
            sameIpVotesInChallenge: lowIp,
            coVotePartnersInLast30Days: 0,
          }).score;
          const hi = svc.scoreVoteSignals({
            voterAccountAgeMs: 0,
            sameIpVotesInChallenge: high,
            coVotePartnersInLast30Days: 0,
          }).score;
          return hi >= low;
        },
      ),
      { numRuns: 10_000 },
    );
  });

  it('score is bounded for a clean signal triple — no surprise inflation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000 * 60 * 60 * 24 * 365, max: 1000 * 60 * 60 * 24 * 365 * 5 }),
        (ageMs: number) => {
          const { score } = svc.scoreVoteSignals({
            voterAccountAgeMs: ageMs,
            sameIpVotesInChallenge: 0,
            coVotePartnersInLast30Days: 0,
          });
          return score === 0;
        },
      ),
      { numRuns: 10_000 },
    );
  });
});
