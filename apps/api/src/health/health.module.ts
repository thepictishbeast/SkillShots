import { Module } from '@nestjs/common';
import { HealthController, HealthRootController } from './health.controller.js';

@Module({ controllers: [HealthController, HealthRootController] })
export class HealthModule {}
