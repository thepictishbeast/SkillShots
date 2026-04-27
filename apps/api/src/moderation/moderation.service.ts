import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { CreateReportDto, Report as ReportT } from '@skill-shots/shared-types';
import type { Report as ReportRow } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async fileReport(reporterId: string, dto: CreateReportDto): Promise<ReportT> {
    const row = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        ...(dto.details !== undefined ? { details: dto.details } : {}),
      },
    });
    return this.toApi(row);
  }

  async listOpen(): Promise<ReportT[]> {
    const rows = await this.prisma.report.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return rows.map((r) => this.toApi(r));
  }

  async resolve(adminId: string, reportId: string, note: string, action: ResolveAction): Promise<ReportT> {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException({ error: 'report_not_found' });
    if (report.status === 'resolved') throw new BadRequestException({ error: 'already_resolved' });

    await this.prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
          resolutionNote: note,
        },
      });
      await tx.adminAction.create({
        data: {
          actorId: adminId,
          type: 'resolve_report',
          targetType: report.targetType,
          targetId: report.targetId,
          reason: note,
          contextJson: { action },
        },
      });

      switch (action) {
        case 'remove_challenge':
          if (report.targetType === 'challenge') {
            await tx.challenge.update({
              where: { id: report.targetId },
              data: { status: 'cancelled', moderationFlaggedAt: new Date(), moderationFlaggedReason: note },
            });
          }
          break;
        case 'disqualify_entry':
          if (report.targetType === 'entry') {
            await tx.entry.update({
              where: { id: report.targetId },
              data: { status: 'disqualified' },
            });
          }
          break;
        case 'ban_user':
          if (report.targetType === 'user') {
            await tx.user.update({
              where: { id: report.targetId },
              data: { isBanned: true, bannedReason: note },
            });
          }
          break;
        case 'no_action':
          break;
      }
    });

    const updated = await this.prisma.report.findUniqueOrThrow({ where: { id: reportId } });
    return this.toApi(updated);
  }

  private toApi(r: ReportRow): ReportT {
    return {
      id: r.id as ReportT['id'],
      reporterId: r.reporterId as ReportT['reporterId'],
      targetType: r.targetType as ReportT['targetType'],
      targetId: r.targetId as ReportT['targetId'],
      reason: r.reason as ReportT['reason'],
      details: r.details,
      status: r.status as ReportT['status'],
      createdAt: r.createdAt.toISOString() as ReportT['createdAt'],
    };
  }
}

export type ResolveAction = 'no_action' | 'remove_challenge' | 'disqualify_entry' | 'ban_user';
