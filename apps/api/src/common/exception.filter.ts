import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

// SECURITY: this filter is the last line of defence between an internal
// exception and the public HTTP response. It MUST scrub stack traces, paths,
// and any field that smells like a secret.
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest & { id?: string }>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const safe =
        typeof body === 'string'
          ? { error: body }
          : (body as Record<string, unknown>);

      void reply.status(status).send({ ...safe, requestId: req.id });
      return;
    }

    // Unknown — log full detail server-side, return opaque to client.
    this.log.error(
      {
        err: exception instanceof Error ? { msg: exception.message, name: exception.name } : exception,
        requestId: req.id,
        path: req.url,
        method: req.method,
      },
      'unhandled_exception',
    );

    void reply.status(500).send({
      error: 'internal_error',
      message: 'An unexpected error occurred. The team has been notified.',
      requestId: req.id,
    });
  }
}
