import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { AdminController } from './admin.controller.js';
import { ModerationService } from './moderation.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController, AdminController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
