import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';

// AVP-PASS-1 2026-04-27: NestJS class-validator is fine but we already define
// every entity in zod (shared-types). One source of truth, no DTO drift.
//
// SECURITY: we cap input size at the framework boundary; this pipe assumes the
// fastify body limit is set, see main.ts.
@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      // SECURITY: never leak the raw zod error (may contain attacker input).
      throw new BadRequestException({
        error: 'validation_failed',
        issues,
      });
    }
    return result.data;
  }
}
