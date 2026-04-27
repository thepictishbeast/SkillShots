import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import type { AuthedRequest } from './jwt-auth.guard.js';

// SECURITY: must be combined with JwtAuthGuard — this only checks the role
// claim already attached to the request.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user || !req.user.isAdmin) {
      throw new ForbiddenException({ error: 'admin_required' });
    }
    return true;
  }
}
