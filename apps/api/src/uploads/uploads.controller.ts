import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { UploadsService } from './uploads.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

const RequestUrlBodySchema = z.object({
  contentType: z.string().min(1).max(64),
});

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('video')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async issueVideoUrl(
    @CurrentUser() me: AuthedUser,
    @Body(new ZodValidationPipe(RequestUrlBodySchema)) body: { contentType: string },
  ) {
    return this.uploads.issueVideoUploadUrl(me.id, body.contentType);
  }

  @Post('video/:uploadId/confirm')
  confirm(@CurrentUser() me: AuthedUser, @Param('uploadId') uploadId: string) {
    return this.uploads.confirmVideoUpload(me.id, uploadId);
  }
}
