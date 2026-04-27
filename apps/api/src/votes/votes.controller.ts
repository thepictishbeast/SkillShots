import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CastVoteDtoSchema, type CastVoteDto } from '@skill-shots/shared-types';
import { VotesService } from './votes.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller('challenges/:id')
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Post('vote')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(CastVoteDtoSchema))
  cast(
    @CurrentUser() me: AuthedUser,
    @Param('id') id: string,
    @Body() dto: CastVoteDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string | undefined,
  ) {
    return this.votes.cast(me.id, id, dto, ip || null, ua || null);
  }

  @Get('results')
  results(@Param('id') id: string) {
    return this.votes.results(id);
  }
}
