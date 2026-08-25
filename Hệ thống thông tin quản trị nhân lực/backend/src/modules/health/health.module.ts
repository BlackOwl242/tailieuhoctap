import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../common/prisma.service';

/** Healthcheck cho Docker + giám sát: liveness không chạm DB, readiness có. */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    return { status: 'ok', uptimeSec: Math.round(process.uptime()), timestamp: new Date().toISOString() };
  }

  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'up', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'degraded', database: 'down', timestamp: new Date().toISOString() };
    }
  }
}

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly service: HealthService) {}

  @Public()
  @Get('healthz')
  healthz() {
    return this.service.liveness();
  }

  @Public()
  @Get('readyz')
  readyz() {
    return this.service.readiness();
  }
}

@Module({ controllers: [HealthController], providers: [HealthService] })
export class HealthModule {}
