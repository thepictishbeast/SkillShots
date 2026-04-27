import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { SignupDto, LoginDto, AuthTokens, RefreshDto } from '@skill-shots/shared-types';
import { PrismaService } from '../common/prisma.service.js';
import {
  hashPassword,
  verifyPassword,
  generateOpaqueToken,
  tokenIndex,
} from '../common/crypto.js';
import * as argon2 from 'argon2';
import { isAtLeastYearsOld } from '../common/age.js';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

// SECURITY: returning fixed-time errors prevents user-enumeration via login
// timing or 4xx differentiation.
const GENERIC_AUTH_FAIL = 'invalid_credentials';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto, ipAtIssue: string | null, userAgent: string | null): Promise<AuthTokens> {
    // BUG ASSUMPTION: dto is already zod-validated — but we re-check the
    // age gate against the SERVER clock here, regardless.
    const dob = new Date(dto.dateOfBirth + 'T00:00:00.000Z');
    if (!isAtLeastYearsOld(dob, env.MIN_AGE_YEARS)) {
      throw new ForbiddenException({
        error: 'underage',
        message: `Skill Shots requires users to be at least ${env.MIN_AGE_YEARS} years old.`,
      });
    }

    // SECURITY: case-insensitive uniqueness check via citext on email.
    // Username uniqueness is exact (case-sensitive at column level) but we
    // additionally lower-compare to block "Alice" vs "alice" collisions.
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { username: { equals: dto.username, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({ error: 'email_or_username_taken' });
    }

    const passwordHash = await hashPassword(dto.password);
    const now = new Date();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        dateOfBirth: dob,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      },
    });

    return this.issueTokens(user, ipAtIssue, userAgent);
  }

  async login(dto: LoginDto, ipAtIssue: string | null, userAgent: string | null): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // SECURITY: do the password verify even on missing user, against a dummy
    // hash, to equalize timing. This is the standard mitigation for
    // user-enumeration timing attacks.
    if (!user) {
      await verifyPassword(
        '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlfc2FsdF9oZXJlMTIzNA$Z3p5/KqgkDPkGxh+wU7pU0eY1u5wQTu2kYj1iH9w7wQ',
        dto.password,
      );
      throw new UnauthorizedException({ error: GENERIC_AUTH_FAIL });
    }

    if (user.isBanned) {
      throw new ForbiddenException({ error: 'account_banned' });
    }
    if (user.deletedAt) {
      throw new UnauthorizedException({ error: GENERIC_AUTH_FAIL });
    }

    const ok = await verifyPassword(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException({ error: GENERIC_AUTH_FAIL });
    }

    return this.issueTokens(user, ipAtIssue, userAgent);
  }

  async refresh(
    dto: RefreshDto,
    ipAtIssue: string | null,
    userAgent: string | null,
  ): Promise<AuthTokens> {
    if (dto.refreshToken.length > 2048) {
      throw new BadRequestException({ error: 'token_too_long' });
    }

    const idx = tokenIndex(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHashIndex: idx },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException({ error: GENERIC_AUTH_FAIL });
    }
    if (stored.revokedAt) {
      // REGRESSION-GUARD: presenting a revoked token = compromise signal.
      // Invalidate the entire descendant chain by revoking ALL tokens for the user.
      this.log.warn({ userId: stored.userId }, 'revoked refresh token replayed; invalidating user sessions');
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException({ error: GENERIC_AUTH_FAIL });
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({ error: 'refresh_expired' });
    }

    // Argon2-verify full token for cryptographic match (not just SHA index).
    let cryptoOk = false;
    try {
      cryptoOk = await argon2.verify(stored.tokenHashFull, dto.refreshToken);
    } catch {
      cryptoOk = false;
    }
    if (!cryptoOk) {
      throw new UnauthorizedException({ error: GENERIC_AUTH_FAIL });
    }

    if (stored.user.isBanned || stored.user.deletedAt) {
      throw new ForbiddenException({ error: 'account_unavailable' });
    }

    // Rotate: revoke the presented token and issue a child.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user, ipAtIssue, userAgent, stored.id);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken || refreshToken.length > 2048) return;
    const idx = tokenIndex(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHashIndex: idx, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---- internal ----

  private async issueTokens(
    user: User,
    ipAtIssue: string | null,
    userAgent: string | null,
    parentId?: string,
  ): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, isAdmin: user.isAdmin },
      { subject: user.id },
    );

    const refreshPlain = generateOpaqueToken();
    const refreshIdx = tokenIndex(refreshPlain);
    const refreshHash = await argon2.hash(refreshPlain, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_SECONDS * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHashIndex: refreshIdx,
        tokenHashFull: refreshHash,
        expiresAt,
        parentId: parentId ?? null,
        ipAtIssue: ipAtIssue?.slice(0, 64) ?? null,
        userAgentAtIssue: userAgent?.slice(0, 256) ?? null,
      },
    });

    return {
      accessToken,
      expiresInSeconds: env.JWT_ACCESS_TTL_SECONDS,
      refreshToken: refreshPlain,
      refreshExpiresInSeconds: env.JWT_REFRESH_TTL_SECONDS,
    };
  }
}
