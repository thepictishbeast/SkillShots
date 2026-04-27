import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();

  // SECURITY: bodyLimit caps request size at the framework boundary BEFORE
  // any controller sees the bytes. 1 MiB is plenty for JSON; videos use
  // presigned-direct-to-S3 so they never traverse this server.
  const adapter = new FastifyAdapter({
    bodyLimit: 1 * 1024 * 1024,
    trustProxy: env.NODE_ENV === 'production' ? 1 : false,
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  await app.register(helmet, {
    // SECURITY: tightest Helmet defaults; CSP is API-only so script-src is irrelevant.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    strictTransportSecurity: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (env.CORS_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('cors_blocked'), false);
    },
    credentials: true,
    maxAge: 600,
  });

  app.enableShutdownHooks();

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  new Logger('Bootstrap').log(`API listening on :${env.PORT} (${env.NODE_ENV})`);
}

void bootstrap();
