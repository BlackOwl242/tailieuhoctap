import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

class CreateOvertimeDto {
  @ApiProperty() @IsDateString() workDate!: string;
  @ApiProperty() @IsNumber() @Min(0.5) @Max(12) hours!: number;
  @ApiProperty() @IsString() @MaxLength(500) reason!: string;
}

class DecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

/**
 * UC19 — Đăng ký làm thêm giờ: phải được duyệt TRƯỚC, giờ chưa duyệt
 * không được tính tiền (chỉ payslip đếm giờ có status=APPROVED).
 */
@Injectable()
export class OvertimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.prisma.overtimeRequest.findMany({
      where: { userId: user.id },
      orderBy: { workDate: 'desc' },
      include: { approver: { select: { fullName: true } } },
    });
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get()
  all(@Query('status') status?: string) {
    return this.prisma.overtimeRequest.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { workDate: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        approver: { select: { fullName: true } },
      },
    });
  }

  async create(dto: CreateOvertimeDto, actor: AuthUser, requestId?: string) {
    const workDate = new Date(dto.workDate);
    const request = await this.prisma.overtimeRequest.create({
      data: { userId: actor.id, workDate, hours: dto.hours, reason: dto.reason },
    });
    await this.audit.log({
      actorId: actor.id, action: 'OVERTIME_REQUESTED', entityType: 'OvertimeRequest', entityId: request.id,
      after: { hours: dto.hours }, requestId,
    });
    return request;
  }

  async decide(id: string, approve: boolean, actor: AuthUser, note?: string, requestId?: string) {
    const request = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Không tìm thấy đơn làm thêm giờ');
    if (request.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Đơn đã được xử lý trước đó', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: approve ? 'APPROVED' : 'REJECTED',
        approverId: actor.id,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: approve ? 'OVERTIME_APPROVED' : 'OVERTIME_REJECTED',
      entityType: 'OvertimeRequest', entityId: id, after: { status: updated.status }, requestId,
    });
    return updated;
  }
}

@ApiTags('overtime')
@ApiBearerAuth()
@Controller('overtime')
export class OvertimeController {
  constructor(private readonly service: OvertimeService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.mine(user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get()
  all(@Query('status') status?: string) {
    return this.service.all(status);
  }

  @Post()
  create(@Body() dto: CreateOvertimeDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: DecisionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, true, user, dto.note);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: DecisionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, false, user, dto.note);
  }
}

@Module({ controllers: [OvertimeController], providers: [OvertimeService] })
export class OvertimeModule {}
