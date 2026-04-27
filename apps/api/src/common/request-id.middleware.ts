import { Injectable, NestMiddleware } from '@nestjs/common';
import { nanoid } from 'nanoid';
import type { FastifyRequest, FastifyReply } from 'fastify';

// SECURITY: trust client-supplied `x-request-id` ONLY in trusted-proxy mode.
// In default mode, generate fresh; never reflect attacker-controlled IDs into
// logs without a length cap.
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest & { id: string }, reply: FastifyReply, next: () => void): void {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' && /^[A-Za-z0-9_\-]{1,64}$/.test(incoming)
        ? incoming
        : nanoid(21);
    req.id = id;
    void reply.header('x-request-id', id);
    next();
  }
}
