import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  CreateChallengeDtoSchema,
  ListChallengesQuerySchema,
  type CreateChallengeDto,
  type ListChallengesQuery,
} from '@skill-shots/shared-types';
import { ChallengesService } from './challenges.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(CreateChallengeDtoSchema))
  create(@CurrentUser() me: AuthedUser, @Body() dto: CreateChallengeDto) {
    return this.challenges.create(me.id, dto);
  }

  @Get()
  list(@Query(new ZodValidationPipe(ListChallengesQuerySchema)) query: ListChallengesQuery) {
    return this.challenges.list(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.challenges.getById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() me: AuthedUser, @Param('id') id: string) {
    return this.challenges.cancel(me.id, id);
  }
}
