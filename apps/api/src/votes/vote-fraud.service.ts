import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

// SECURITY: hashed signal collection — we never store raw IPs against a vote
// long-term. Hash is per-platform-secret so a DB leak doesn't leak IPs.
//
// REGRESSION-GUARD: storing raw IPs against votes risks GDPR fines and creates
// a juicy target. Hash + truncate.
@Injectable()
export class VoteFraudService {
  private readonly secret: string;

  constructor() {
    // Use a fixed instance secret so the same IP hashes the same way within
    // a deployment. Rotates only on operator key-rotate.
    this.secret = process.env['IP_HASH_SECRET'] ?? 'skillshots-default-secret';
  }

  hashSignal(value: string | null | undefined): string | null {
    if (!value) return null;
    return createHash('sha256').update(`${this.secret}:${value}`).digest('hex').slice(0, 32);
  }

  // BUG ASSUMPTION: signals are imperfect. The job of this scorer is to
  // flag for human review, not to auto-disqualify. Auto-disqualification
  // only on overwhelming signal (account < 1h old AND co-vote with >=5
  // other accounts AND same IP hash).
  scoreVoteSignals(signals: {
    voterAccountAgeMs: number;
    sameIpVotesInChallenge: number;
    coVotePartnersInLast30Days: number;
  }): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    if (signals.voterAccountAgeMs < 60 * 60 * 1000) {
      score += 30;
      reasons.push('account_under_1h');
    }
    if (signals.voterAccountAgeMs < 24 * 60 * 60 * 1000) {
      score += 10;
      reasons.push('account_under_24h');
    }
    if (signals.sameIpVotesInChallenge >= 3) {
      score += 25;
      reasons.push('same_ip_cluster');
    }
    if (signals.sameIpVotesInChallenge >= 8) {
      score += 25;
      reasons.push('same_ip_cluster_severe');
    }
    if (signals.coVotePartnersInLast30Days >= 5) {
      score += 20;
      reasons.push('co_vote_ring_suspect');
    }
    if (signals.coVotePartnersInLast30Days >= 15) {
      score += 30;
      reasons.push('co_vote_ring_severe');
    }
    return { score, reasons };
  }

  // 0–24: clean. 25–49: log. 50–74: queue for review. 75+: auto-flag.
  shouldAutoFlag(score: number): boolean {
    return score >= 75;
  }

  shouldQueueForReview(score: number): boolean {
    return score >= 50 && score < 75;
  }
}
