import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // Liveness: process is alive. Cheap, never depends on DB.
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  // Readiness: dependencies are reachable. Used by orchestrator before
  // routing traffic.
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'not_ready', db: 'down' });
    }
  }
}

@Controller()
export class HealthRootController {
  @Get()
  root() {
    return { service: 'skill-shots-api', version: '0.0.0' };
  }
}
