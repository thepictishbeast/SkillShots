import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthedRequest, AuthedUser } from './jwt-auth.guard.js';

// SECURITY: this decorator MUST be used in tandem with JwtAuthGuard. It throws
// if user is missing — defence-in-depth in case a controller forgets the guard.
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthedUser => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.user) throw new UnauthorizedException({ error: 'no_session' });
  return req.user;
});
