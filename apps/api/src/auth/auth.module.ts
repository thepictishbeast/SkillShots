import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { loadEnv } from '../config/env.js';

const env = loadEnv();

@Module({
  imports: [
    JwtModule.register({
      secret: env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: env.JWT_ACCESS_TTL_SECONDS,
        algorithm: 'HS256',
        issuer: 'skill-shots',
        audience: 'skill-shots-app',
      },
      verifyOptions: {
        algorithms: ['HS256'],
        issuer: 'skill-shots',
        audience: 'skill-shots-app',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
