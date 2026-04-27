import { Body, Controller, Get, Param, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { z } from 'zod';
import { ModerationService, type ResolveAction } from './moderation.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

const ResolveDtoSchema = z.object({
  note: z.string().min(1).max(1000),
  action: z.enum(['no_action', 'remove_challenge', 'disqualify_entry', 'ban_user']),
});

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly mod: ModerationService) {}

  @Get('reports')
  listReports() {
    return this.mod.listOpen();
  }

  @Patch('reports/:id')
  @UsePipes(new ZodValidationPipe(ResolveDtoSchema))
  resolve(
    @CurrentUser() me: AuthedUser,
    @Param('id') id: string,
    @Body() body: { note: string; action: ResolveAction },
  ) {
    return this.mod.resolve(me.id, id, body.note, body.action);
  }
}
