import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SpaceAccessService } from './services/space-access.service';
import { AuditService } from './services/audit.service';
import { NotificationsService } from './services/notifications.service';

@Global()
@Module({
  providers: [PrismaService, AuditService, NotificationsService, SpaceAccessService],
  exports: [PrismaService, AuditService, NotificationsService, SpaceAccessService],
})
export class SharedModule {}
