import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { CommonModule } from './common/common.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { ChallengesModule } from './challenges/challenges.module.js';
import { EntriesModule } from './entries/entries.module.js';
import { VotesModule } from './votes/votes.module.js';
import { WalletModule } from './wallet/wallet.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { HealthModule } from './health/health.module.js';
import { GlobalExceptionFilter } from './common/exception.filter.js';
import { RequestIdMiddleware } from './common/request-id.middleware.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: env.RL_GLOBAL_PER_MIN },
    ]),
    CommonModule,
    AuthModule,
    UsersModule,
    UploadsModule,
    ChallengesModule,
    EntriesModule,
    VotesModule,
    WalletModule,
    ModerationModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
