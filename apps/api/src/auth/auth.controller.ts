import { Body, Controller, Headers, HttpCode, Ip, Post, UsePipes, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  SignupDtoSchema,
  LoginDtoSchema,
  RefreshDtoSchema,
  type SignupDto,
  type LoginDto,
  type RefreshDto,
  type AuthTokens,
} from '@skill-shots/shared-types';
import { AuthService } from './auth.service.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { JwtAuthGuard, type AuthedRequest } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(SignupDtoSchema))
  signup(
    @Body() dto: SignupDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string | undefined,
  ): Promise<AuthTokens> {
    return this.auth.signup(dto, ip || null, ua || null);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(LoginDtoSchema))
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string | undefined,
  ): Promise<AuthTokens> {
    return this.auth.login(dto, ip || null, ua || null);
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(RefreshDtoSchema))
  refresh(
    @Body() dto: RefreshDto,
    @Ip() ip: string,
    @Headers('user-agent') ua: string | undefined,
  ): Promise<AuthTokens> {
    return this.auth.refresh(dto, ip || null, ua || null);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(RefreshDtoSchema))
  async logout(@Body() dto: RefreshDto, @Req() _req: AuthedRequest): Promise<void> {
    await this.auth.logout(dto.refreshToken);
  }
}
