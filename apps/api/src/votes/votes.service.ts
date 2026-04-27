import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { CastVoteDto, ChallengeResults } from '@skill-shots/shared-types';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { VoteFraudService } from './vote-fraud.service.js';

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fraud: VoteFraudService,
  ) {}

  async cast(
    voterId: string,
    challengeId: string,
    dto: CastVoteDto,
    ipAddr: string | null,
    userAgent: string | null,
  ): Promise<{ accepted: boolean; flagged: boolean }> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException({ error: 'challenge_not_found' });

    if (challenge.status !== 'voting') {
      throw new BadRequestException({ error: 'challenge_not_in_voting' });
    }
    if (challenge.votingDeadline.getTime() <= Date.now()) {
      throw new BadRequestException({ error: 'voting_window_closed' });
    }

    const entry = await this.prisma.entry.findUnique({ where: { id: dto.entryId } });
    if (!entry || entry.challengeId !== challengeId) {
      throw new BadRequestException({ error: 'entry_not_in_challenge' });
    }
    if (entry.status === 'disqualified') {
      throw new BadRequestException({ error: 'entry_disqualified' });
    }
    // SECURITY: forbid self-vote at the application layer.
    if (entry.userId === voterId) {
      throw new ForbiddenException({ error: 'cannot_vote_for_own_entry' });
    }

    const ipHash = this.fraud.hashSignal(ipAddr);
    const uaHash = this.fraud.hashSignal(userAgent);

    // Enforce one-vote-per-challenge at app + DB level.
    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.vote.create({
          data: {
            challengeId,
            entryId: dto.entryId,
            voterId,
            ipHash,
            uaHash,
          },
        });
        await tx.entry.update({
          where: { id: dto.entryId },
          data: { voteCount: { increment: 1 } },
        });
      });
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({ error: 'already_voted' });
      }
      throw e;
    }

    // Fraud signals — async-friendly but here we score inline for simplicity.
    const voter = await this.prisma.user.findUnique({ where: { id: voterId }, select: { createdAt: true } });
    const accountAgeMs = voter ? Date.now() - voter.createdAt.getTime() : Number.MAX_SAFE_INTEGER;
    const sameIpInChallenge = ipHash
      ? await this.prisma.vote.count({ where: { challengeId, ipHash } })
      : 0;
    // Fast approximation of co-vote partners — count distinct voters who
    // co-voted in challenges this voter has voted in over the last 30 days.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentChallengesRaw = await this.prisma.vote.findMany({
      where: { voterId, createdAt: { gte: since } },
      select: { challengeId: true },
      distinct: ['challengeId'],
    });
    const recentChallenges = recentChallengesRaw.map((r: { challengeId: string }) => r.challengeId);
    const coPartners = recentChallenges.length === 0
      ? 0
      : await this.prisma.vote.groupBy({
          by: ['voterId'],
          where: {
            challengeId: { in: recentChallenges },
            voterId: { not: voterId },
            createdAt: { gte: since },
          },
          _count: { _all: true },
          having: { voterId: { _count: { gt: 1 } } },
        }).then((g: { voterId: string }[]) => g.length);

    const { score } = this.fraud.scoreVoteSignals({
      voterAccountAgeMs: accountAgeMs,
      sameIpVotesInChallenge: sameIpInChallenge,
      coVotePartnersInLast30Days: coPartners,
    });

    const flagged = this.fraud.shouldAutoFlag(score);
    if (flagged) {
      await this.prisma.vote.updateMany({
        where: { challengeId, voterId },
        data: { invalidatedAt: new Date(), invalidatedReason: 'auto_flagged_fraud_score' },
      });
      // Roll back the count for the entry.
      await this.prisma.entry.update({
        where: { id: dto.entryId },
        data: { voteCount: { decrement: 1 } },
      });
    }

    return { accepted: !flagged, flagged };
  }

  async results(challengeId: string): Promise<ChallengeResults> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException({ error: 'challenge_not_found' });

    // SECURITY: do NOT reveal vote counts during voting (bandwagon mitigation).
    if (challenge.status === 'voting') {
      return {
        challengeId: challengeId as ChallengeResults['challengeId'],
        status: 'voting',
        votingClosesAt: challenge.votingDeadline.toISOString() as ChallengeResults['votingClosesAt'],
        entries: [],
        winnerId: null,
      };
    }
    if (challenge.status !== 'completed') {
      throw new BadRequestException({ error: 'results_not_available' });
    }

    const entries = await this.prisma.entry.findMany({
      where: { challengeId, status: { in: ['submitted', 'approved'] } },
      orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }],
    });

    return {
      challengeId: challengeId as ChallengeResults['challengeId'],
      status: 'completed',
      votingClosesAt: challenge.votingDeadline.toISOString() as ChallengeResults['votingClosesAt'],
      entries: entries.map((e: { id: string; userId: string; voteCount: number }, idx: number) => ({
        entryId: e.id as ChallengeResults['entries'][number]['entryId'],
        userId: e.userId as ChallengeResults['entries'][number]['userId'],
        voteCount: e.voteCount,
        rank: idx + 1,
      })),
      winnerId: (challenge.winnerId ?? null) as ChallengeResults['winnerId'],
    };
  }

  private isUniqueViolation(e: unknown): boolean {
    return Boolean(
      e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as Prisma.PrismaClientKnownRequestError).code === 'P2002',
    );
  }
}
