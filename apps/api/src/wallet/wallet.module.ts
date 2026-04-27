import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { AuthModule } from '../auth/auth.module.js';

// PHASE-3 SKELETON: real Stripe Connect integration lands here.
// The shape is committed; the wiring is a NotImplementedException for now.
@Module({
  imports: [AuthModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
