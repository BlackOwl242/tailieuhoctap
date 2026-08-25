import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { Roles } from '../../common/decorators';

class AuditQueryDto {
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsInt() page?: number = 1;
  @IsOptional() @IsInt() limit?: number = 50;
}

/**
 * KC22 — Tra cứu nhật ký kiểm toán (CHỈ ĐỌC).
 * Bảng audit_logs là append-only: không có bất kỳ route ghi/sửa/xóa nào ở đây.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Roles('ADMIN')
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
    // BigInt không serialize được bằng JSON.stringify → chuyển sang string
    const items = rows.map((r) => ({
      ...r,
      id: r.id.toString(),
      beforeData: r.beforeData ?? null,
      afterData: r.afterData ?? null,
    }));
    return { items, total, page, limit };
  }
}

@Module({ controllers: [AuditController] })
export class AuditModule {}
