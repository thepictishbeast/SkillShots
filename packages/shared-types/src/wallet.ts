import { z } from 'zod';
import { IdSchema, IsoDateSchema, CentsSchema } from './primitives.js';

export const WalletTxnTypeSchema = z.enum([
  'deposit',
  'entry_fee',
  'payout',
  'platform_fee',
  'refund',
]);
export type WalletTxnType = z.infer<typeof WalletTxnTypeSchema>;

export const WalletTxnStatusSchema = z.enum(['pending', 'completed', 'failed']);
export type WalletTxnStatus = z.infer<typeof WalletTxnStatusSchema>;

export const WalletTransactionSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  challengeId: IdSchema.nullable(),
  type: WalletTxnTypeSchema,
  amount: CentsSchema,
  status: WalletTxnStatusSchema,
  // External reference is opaque — never parse this client-side.
  stripePaymentId: z.string().min(1).max(255).nullable(),
  createdAt: IsoDateSchema,
});
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;

export const WalletBalanceSchema = z.object({
  userId: IdSchema,
  // available — what the user can withdraw now.
  available: CentsSchema,
  // pending — funds held against challenges in 'live' or 'voting'.
  pending: CentsSchema,
});
export type WalletBalance = z.infer<typeof WalletBalanceSchema>;
