import { Injectable, NotImplementedException } from '@nestjs/common';
import type { WalletBalance, WalletTransaction } from '@skill-shots/shared-types';
import { PrismaService } from '../common/prisma.service.js';

// PHASE-3 SKELETON. Real Stripe Connect flow:
//   - createConnectedAccount(userId)
//   - createPotPaymentIntent(challengeId, amount) — manual capture
//   - createEntryFeePaymentIntent(challengeId, userId, amount) — manual capture
//   - capturePot(challengeId)
//   - releasePayout(challengeId, winnerId)
//   - refund(transactionId)
// All wallet writes are append-only via PrismaService. Idempotency keys are
// already required by the schema (WalletTransaction.idempotencyKey UNIQUE).
//
// SECURITY: every Stripe webhook MUST verify the signature with
// STRIPE_WEBHOOK_SECRET BEFORE any DB write. See LEGAL_NOTES.md.
@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<WalletBalance> {
    // Available = sum of completed payouts/refunds minus completed
    // entry-fees/platform-fees/deposits-out.
    // Pending = sum of pending entry-fee holds against this user.
    const txns = await this.prisma.walletTransaction.findMany({
      where: { userId },
    });
    let available = 0;
    let pending = 0;
    for (const t of txns) {
      const amt = t.amountCents;
      if (t.status === 'completed') {
        if (t.type === 'payout' || t.type === 'refund') available += amt;
        if (t.type === 'entry_fee' || t.type === 'platform_fee') available -= amt;
        // 'deposit' increases available; we treat it as positive.
        if (t.type === 'deposit') available += amt;
      } else if (t.status === 'pending') {
        if (t.type === 'entry_fee') pending += amt;
      }
    }
    return {
      userId: userId as WalletBalance['userId'],
      available: Math.max(0, available) as WalletBalance['available'],
      pending: Math.max(0, pending) as WalletBalance['pending'],
    };
  }

  async listTransactions(userId: string): Promise<WalletTransaction[]> {
    const rows = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r): WalletTransaction => ({
      id: r.id as WalletTransaction['id'],
      userId: r.userId as WalletTransaction['userId'],
      challengeId: (r.challengeId ?? null) as WalletTransaction['challengeId'],
      type: r.type as WalletTransaction['type'],
      amount: r.amountCents as WalletTransaction['amount'],
      status: r.status as WalletTransaction['status'],
      stripePaymentId: r.stripePaymentId,
      createdAt: r.createdAt.toISOString() as WalletTransaction['createdAt'],
    }));
  }

  async startDeposit(_userId: string): Promise<never> {
    throw new NotImplementedException({
      error: 'phase_3_pending',
      message: 'Wallet deposit lands in Phase 3 (Stripe Connect onboarding).',
    });
  }

  async requestPayout(_userId: string): Promise<never> {
    throw new NotImplementedException({
      error: 'phase_3_pending',
      message: 'Payout requests land in Phase 3 (Stripe Connect).',
    });
  }
}
