import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateReportDtoSchema, type CreateReportDto } from '@skill-shots/shared-types';
import { ModerationService } from './moderation.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly mod: ModerationService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(CreateReportDtoSchema))
  file(@CurrentUser() me: AuthedUser, @Body() dto: CreateReportDto) {
    return this.mod.fileReport(me.id, dto);
  }
}
