import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { Roles } from '../../common/decorators';
import { verifyAuditChain } from '../../common/audit-hash';

class AuditQueryDto {
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsInt() page?: number = 1;
  @IsOptional() @IsInt() limit?: number = 50;
}

/**
 * KC22 — Tra cứu & kiểm chứng nhật ký kiểm toán (CHỈ ĐỌC).
 * Bảng audit_logs được khóa append-only ở mức trigger PostgreSQL + SHA-256 hash chain.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Roles('ADMIN', 'AUDITOR', 'BOD')
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: AuditQueryDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 50));
    const where = {
      ...(q.action ? { action: { contains: q.action, mode: 'insensitive' as const } } : {}),
      ...(q.entityType ? { entityType: q.entityType } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    const items = rows.map((r) => ({
      ...r,
      id: r.id.toString(),
      beforeData: r.beforeData ?? null,
      afterData: r.afterData ?? null,
    }));
    return { items, total, page, limit };
  }

  @Get('verify')
  @ApiOperation({ summary: 'Kiểm chứng toàn vẹn chuỗi băm SHA-256 nhật ký kiểm toán (SOX / ISO 27001)' })
  async verifyIntegrity() {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        actorId: true,
        action: true,
        entityType: true,
        entityId: true,
        requestId: true,
        createdAt: true,
        prevHash: true,
        entryHash: true,
      },
    });
    return {
      ...verifyAuditChain(rows),
      verifiedAt: new Date().toISOString(),
    };
  }
}

@Module({ controllers: [AuditController] })
export class AuditModule {}
