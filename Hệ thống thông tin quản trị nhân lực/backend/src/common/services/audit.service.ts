import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  requestId?: string | null;
}

/**
 * Append-only audit trail. Logging must NEVER break the business flow,
 * therefore every failure is swallowed after being reported to the logger.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          beforeData: entry.before === undefined ? undefined : (entry.before as object),
          afterData: entry.after === undefined ? undefined : (entry.after as object),
          ip: entry.ip ?? null,
          requestId: entry.requestId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log for ${entry.action}: ${String(error)}`);
    }
  }
}
