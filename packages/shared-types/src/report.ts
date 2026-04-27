import { z } from 'zod';
import { IdSchema, IsoDateSchema } from './primitives.js';

export const ReportTargetTypeSchema = z.enum([
  'challenge',
  'entry',
  'comment',
  'user',
]);
export type ReportTargetType = z.infer<typeof ReportTargetTypeSchema>;

export const ReportStatusSchema = z.enum(['open', 'reviewing', 'resolved']);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

export const ReportReasonSchema = z.enum([
  'spam',
  'harassment',
  'hate_speech',
  'sexual_content',
  'violence',
  'minors',
  'fraud',
  'cheating',
  'self_harm',
  'csam',
  'illegal',
  'other',
]);
export type ReportReason = z.infer<typeof ReportReasonSchema>;

export const ReportSchema = z.object({
  id: IdSchema,
  reporterId: IdSchema,
  targetType: ReportTargetTypeSchema,
  targetId: IdSchema,
  reason: ReportReasonSchema,
  details: z.string().max(1000).nullable(),
  status: ReportStatusSchema,
  createdAt: IsoDateSchema,
});
export type Report = z.infer<typeof ReportSchema>;

export const CreateReportDtoSchema = z.object({
  targetType: ReportTargetTypeSchema,
  targetId: IdSchema,
  reason: ReportReasonSchema,
  details: z.string().max(1000).optional(),
});
export type CreateReportDto = z.infer<typeof CreateReportDtoSchema>;
