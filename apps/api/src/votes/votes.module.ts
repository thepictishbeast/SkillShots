import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller.js';
import { VotesService } from './votes.service.js';
import { VoteFraudService } from './vote-fraud.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [VotesController],
  providers: [VotesService, VoteFraudService],
  exports: [VotesService, VoteFraudService],
})
export class VotesModule {}
