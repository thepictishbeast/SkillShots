import pino from 'pino';
import type { Env } from '../config/env.js';

// SECURITY: redact PII before it reaches the log sink.
// REGRESSION-GUARD: previous-life incident — passwords ended up in CloudWatch
// because the auth controller logged the request body verbatim.
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.body.password',
  'req.body.refreshToken',
  'req.body.accessToken',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.tokenHashFull',
  '*.tokenHashIndex',
  '*.stripeAccountId',
  '*.stripePaymentId',
  '*.email',
  '*.dateOfBirth',
];

export function buildLogger(env: Env): pino.Logger {
  const isProd = env.NODE_ENV === 'production';
  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    base: {
      service: 'skill-shots-api',
      env: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: isProd
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' },
        },
  });
}
