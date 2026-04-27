import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  balance(@CurrentUser() me: AuthedUser) {
    return this.wallet.getBalance(me.id);
  }

  @Get('transactions')
  txns(@CurrentUser() me: AuthedUser) {
    return this.wallet.listTransactions(me.id);
  }

  @Post('deposit')
  deposit(@CurrentUser() me: AuthedUser) {
    return this.wallet.startDeposit(me.id);
  }

  @Post('payout')
  payout(@CurrentUser() me: AuthedUser) {
    return this.wallet.requestPayout(me.id);
  }
}
