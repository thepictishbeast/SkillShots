import { Body, Controller, Get, Param, Patch, UseGuards, UsePipes } from '@nestjs/common';
import { UpdateProfileDtoSchema, type UpdateProfileDto } from '@skill-shots/shared-types';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthedUser } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() me: AuthedUser) {
    return this.users.getPrivate(me.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(UpdateProfileDtoSchema))
  updateMe(@CurrentUser() me: AuthedUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(me.id, dto);
  }

  @Get('users/:id')
  getById(@Param('id') id: string) {
    return this.users.getPublic(id);
  }
}
