import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { CreateEntryDto, Entry as EntryT } from '@skill-shots/shared-types';
import type { Entry as EntryRow, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async create(userId: string, challengeId: string, dto: CreateEntryDto): Promise<EntryT> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException({ error: 'challenge_not_found' });

    if (challenge.status !== 'live') {
      throw new BadRequestException({ error: 'challenge_not_open_for_entry' });
    }
    if (challenge.entryDeadline.getTime() <= Date.now()) {
      throw new BadRequestException({ error: 'entry_window_closed' });
    }
    if (challenge.creatorId === userId) {
      // SECURITY: a creator entering their own challenge would be a payout
      // to themselves, gameable. App-level rule: forbid.
      throw new ForbiddenException({ error: 'creator_cannot_enter_own_challenge' });
    }

    const confirmed = await this.uploads.confirmVideoUpload(userId, dto.attemptVideoUploadId);

    try {
      const row = await this.prisma.entry.create({
        data: {
          challengeId,
          userId,
          videoUrl: confirmed.url,
          ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { totalChallengesEntered: { increment: 1 } },
      });
      return this.toApi(row);
    } catch (e) {
      if (this.isUniqueViolation(e)) {
        throw new ConflictException({ error: 'already_entered' });
      }
      throw e;
    }
  }

  async listForChallenge(challengeId: string): Promise<EntryT[]> {
    const rows = await this.prisma.entry.findMany({
      where: { challengeId, status: { in: ['submitted', 'approved'] } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toApi(r));
  }

  async getById(id: string): Promise<EntryT> {
    const row = await this.prisma.entry.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ error: 'entry_not_found' });
    return this.toApi(row);
  }

  private isUniqueViolation(e: unknown): boolean {
    return Boolean(
      e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as Prisma.PrismaClientKnownRequestError).code === 'P2002',
    );
  }

  private toApi(e: EntryRow): EntryT {
    return {
      id: e.id as EntryT['id'],
      challengeId: e.challengeId as EntryT['challengeId'],
      userId: e.userId as EntryT['userId'],
      videoUrl: e.videoUrl as EntryT['videoUrl'],
      caption: e.caption,
      voteCount: e.voteCount,
      status: e.status as EntryT['status'],
      createdAt: e.createdAt.toISOString() as EntryT['createdAt'],
    };
  }
}
