import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { UpdateProfileDto, UserPublic, UserPrivate } from '@skill-shots/shared-types';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublic(id: string): Promise<UserPublic> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u || u.deletedAt) throw new NotFoundException({ error: 'user_not_found' });
    return this.toPublic(u);
  }

  async getPrivate(id: string): Promise<UserPrivate> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u || u.deletedAt) throw new NotFoundException({ error: 'user_not_found' });
    return {
      ...this.toPublic(u),
      email: u.email as UserPrivate['email'],
      totalEarnings: u.totalEarningsCents,
      ageVerifiedAt: u.ageVerifiedAt ? u.ageVerifiedAt.toISOString() : null,
      kycVerifiedAt: u.kycVerifiedAt ? u.kycVerifiedAt.toISOString() : null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserPrivate> {
    if (dto.username) {
      const taken = await this.prisma.user.findFirst({
        where: {
          username: { equals: dto.username, mode: 'insensitive' },
          NOT: { id: userId },
        },
        select: { id: true },
      });
      if (taken) throw new ConflictException({ error: 'username_taken' });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
    });
    return this.getPrivate(userId);
  }

  // SECURITY: never expose private fields here.
  private toPublic(u: {
    id: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    verified: boolean;
    totalWins: number;
    totalChallengesCreated: number;
    totalChallengesEntered: number;
    winStreak: number;
    createdAt: Date;
  }): UserPublic {
    return {
      id: u.id as UserPublic['id'],
      username: u.username as UserPublic['username'],
      ...(u.avatarUrl !== null ? { avatarUrl: u.avatarUrl as UserPublic['avatarUrl'] } : {}),
      ...(u.bio !== null ? { bio: u.bio } : {}),
      verified: u.verified,
      totalWins: u.totalWins,
      totalChallengesCreated: u.totalChallengesCreated,
      totalChallengesEntered: u.totalChallengesEntered,
      winStreak: u.winStreak,
      createdAt: u.createdAt.toISOString() as UserPublic['createdAt'],
    };
  }
}
