import { Body, Controller, Get, Param, Post, UseGuards, UsePipes } from '@nestjs/common';
import { CreateEntryDtoSchema, type CreateEntryDto } from '@skill-shots/shared-types';
import { EntriesService } from './entries.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller()
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}

  @Post('challenges/:id/entries')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateEntryDtoSchema))
  create(
    @CurrentUser() me: AuthedUser,
    @Param('id') challengeId: string,
    @Body() dto: CreateEntryDto,
  ) {
    return this.entries.create(me.id, challengeId, dto);
  }

  @Get('challenges/:id/entries')
  list(@Param('id') challengeId: string) {
    return this.entries.listForChallenge(challengeId);
  }

  @Get('entries/:id')
  getOne(@Param('id') id: string) {
    return this.entries.getById(id);
  }
}
