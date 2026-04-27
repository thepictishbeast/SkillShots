import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';

export interface AuthedUser {
  id: string;
  isAdmin: boolean;
}

export type AuthedRequest = FastifyRequest & { user?: AuthedUser; id?: string };

interface JwtPayload {
  sub: string;
  isAdmin?: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const auth = req.headers.authorization;
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException({ error: 'missing_bearer_token' });
    }
    const token = auth.slice('Bearer '.length).trim();
    if (token.length === 0 || token.length > 4096) {
      throw new UnauthorizedException({ error: 'invalid_token' });
    }
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new UnauthorizedException({ error: 'invalid_token' });
      }
      req.user = { id: payload.sub, isAdmin: Boolean(payload.isAdmin) };
      return true;
    } catch {
      throw new UnauthorizedException({ error: 'invalid_token' });
    }
  }
}
