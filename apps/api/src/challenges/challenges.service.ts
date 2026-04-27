import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type {
  CreateChallengeDto,
  ListChallengesQuery,
  Challenge as ChallengeT,
} from '@skill-shots/shared-types';
import type { Challenge as ChallengeRow } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async create(creatorId: string, dto: CreateChallengeDto): Promise<ChallengeT> {
    // Confirm the upload belongs to this creator and exists in S3.
    const confirmed = await this.uploads.confirmVideoUpload(creatorId, dto.proofVideoUploadId);

    const now = Date.now();
    const entryDeadline = new Date(now + dto.entryWindowMinutes * 60_000);
    const votingDeadline = new Date(entryDeadline.getTime() + dto.votingWindowMinutes * 60_000);

    if (entryDeadline.getTime() <= now + 30_000) {
      // 30s buffer — clock skew between web/mobile.
      throw new BadRequestException({ error: 'entry_window_too_short' });
    }

    const totalPot = dto.creatorPotAmount;

    const row = await this.prisma.challenge.create({
      data: {
        creatorId,
        title: dto.title,
        category: dto.category,
        rules: dto.rules,
        proofVideoUrl: confirmed.url,
        entryFeeCents: dto.entryFee,
        creatorPotCents: dto.creatorPotAmount,
        totalPotCents: totalPot,
        platformFeeBasisPoints: env.STRIPE_PLATFORM_FEE_BPS,
        status: 'live',
        entryDeadline,
        votingDeadline,
      },
    });

    await this.prisma.user.update({
      where: { id: creatorId },
      data: { totalChallengesCreated: { increment: 1 } },
    });

    return this.toApi(row);
  }

  async list(query: ListChallengesQuery): Promise<{ items: ChallengeT[]; nextCursor: string | null }> {
    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;
    if (query.category) where['category'] = query.category;

    const rows = await this.prisma.challenge.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const more = rows.length > query.limit;
    const items = (more ? rows.slice(0, query.limit) : rows).map((r) => this.toApi(r));
    const last = more ? rows[query.limit - 1] : null;
    return { items, nextCursor: last?.id ?? null };
  }

  async getById(id: string): Promise<ChallengeT> {
    const row = await this.prisma.challenge.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ error: 'challenge_not_found' });
    return this.toApi(row);
  }

  async cancel(creatorId: string, id: string): Promise<ChallengeT> {
    const row = await this.prisma.challenge.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ error: 'challenge_not_found' });
    if (row.creatorId !== creatorId) throw new ForbiddenException({ error: 'not_creator' });
    if (row.status !== 'live' && row.status !== 'draft') {
      throw new BadRequestException({ error: 'challenge_not_cancellable' });
    }
    const updated = await this.prisma.challenge.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    return this.toApi(updated);
  }

  private toApi(c: ChallengeRow): ChallengeT {
    return {
      id: c.id as ChallengeT['id'],
      creatorId: c.creatorId as ChallengeT['creatorId'],
      title: c.title,
      category: c.category as ChallengeT['category'],
      rules: c.rules,
      proofVideoUrl: c.proofVideoUrl as ChallengeT['proofVideoUrl'],
      entryFee: c.entryFeeCents as ChallengeT['entryFee'],
      creatorPotAmount: c.creatorPotCents as ChallengeT['creatorPotAmount'],
      totalPot: c.totalPotCents as ChallengeT['totalPot'],
      platformFeeBasisPoints: c.platformFeeBasisPoints,
      status: c.status as ChallengeT['status'],
      entryDeadline: c.entryDeadline.toISOString() as ChallengeT['entryDeadline'],
      votingDeadline: c.votingDeadline.toISOString() as ChallengeT['votingDeadline'],
      winnerId: (c.winnerId ?? null) as ChallengeT['winnerId'],
      createdAt: c.createdAt.toISOString() as ChallengeT['createdAt'],
    };
  }
}
