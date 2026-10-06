import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SpaceAccessService } from './services/space-access.service';
import { AuditService } from './services/audit.service';
import { NotificationsService } from './services/notifications.service';
import { HrAccessService } from './services/hr-access.service';
import { RuntimeSettingsService } from './services/runtime-settings.service';
import { AttendanceLedgerService } from './services/attendance-ledger.service';
import { PersonnelEffectsService } from './services/personnel-effects.service';

@Global()
@Module({
  providers: [PrismaService, AuditService, NotificationsService, SpaceAccessService, HrAccessService, RuntimeSettingsService, AttendanceLedgerService, PersonnelEffectsService],
  exports: [PrismaService, AuditService, NotificationsService, SpaceAccessService, HrAccessService, RuntimeSettingsService, AttendanceLedgerService, PersonnelEffectsService],
})
export class SharedModule {}
