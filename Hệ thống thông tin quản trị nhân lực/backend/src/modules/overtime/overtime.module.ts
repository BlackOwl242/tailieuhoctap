import { ConflictException } from '@nestjs/common';
import { dateKey, workDate } from '../../common/hr-time';
import { HrAccessService } from '../../common/services/hr-access.service';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, Max, Min, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import { SettingsModule, SettingsService } from '../settings/settings.module';
import { payrollPolicyFor, VN_PAYROLL_POLICIES, type PayrollPolicy } from '../../common/payroll-calculator';
import type { AuthUser } from '../../common/types/auth-user';

class CreateOvertimeDto {
  @ApiProperty() @IsDateString() workDate!: string;
  @ApiProperty() @IsNumber() @Min(0.5) @Max(4) hours!: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() @Min(0) @Max(4) nightHours?: number;
  @ApiPropertyOptional({ enum: ['WEEKDAY','WEEKLY_REST','PUBLIC_HOLIDAY'], default: 'WEEKDAY' }) @IsOptional() @IsIn(['WEEKDAY','WEEKLY_REST','PUBLIC_HOLIDAY']) dayCategory?: string;
  @ApiProperty() @IsString() @MaxLength(500) reason!: string;
}

class DecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

class ConfirmOvertimeDto {
  @IsNumber() @Min(0) @Max(4) actualHours!: number;
  @IsNumber() @Min(0) @Max(4) actualNightHours!: number;
  @IsString() @MinLength(10) @MaxLength(1000) note!: string;
  @IsString() @MinLength(1) @MaxLength(2000) evidenceUrl!: string;
}

/**
 * UC19 — Duyệt kế hoạch trước; chỉ trả số giờ thực làm được xác nhận
 * độc lập, có minh chứng, trước khi chốt công.
 */
@Injectable()
export class OvertimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: HrAccessService,
    private readonly ledger: AttendanceLedgerService,
    private readonly settings: SettingsService,
  ) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.prisma.overtimeRequest.findMany({
      where: { userId: user.id },
      orderBy: { workDate: 'desc' },
      include: { approver: { select: { fullName: true } } },
    });
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Get()
  async all(@Query('status') status: string | undefined, @CurrentUser() actor: AuthUser) {
    const scope = await this.access.reviewScope(actor);
    return this.prisma.overtimeRequest.findMany({
      where: { ...(status ? { status: status as never } : {}), ...(scope.orgUnitId ? { user: { orgUnitId: scope.orgUnitId } } : {}) },
      orderBy: { workDate: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        approver: { select: { fullName: true } },
      },
    });
  }

  async create(dto: CreateOvertimeDto, actor: AuthUser, requestId?: string) {
    return this.prisma.$transaction(async tx => {
    const workDate = dateKey(dto.workDate);
    await this.ledger.assertMutable(workDate, tx);
    if (dto.hours <= 0 || dto.hours > 4) throw new ConflictException('Giới hạn đăng ký mặc định là 4 giờ mỗi ngày');
    if ((dto.nightHours ?? 0) > dto.hours) throw new ConflictException('Số giờ làm đêm không thể lớn hơn tổng giờ OT');
    const effectiveSettings = await this.settings.effective();
    const configuredPolicies = effectiveSettings.PAYROLL_POLICIES;
    const policies = Array.isArray(configuredPolicies) ? configuredPolicies as PayrollPolicy[] : VN_PAYROLL_POLICIES;
    let policy: PayrollPolicy;
    try { policy = payrollPolicyFor(workDate, policies); }
    catch (error) { throw new ConflictException(error instanceof Error ? error.message : 'Chưa cấu hình chính sách OT hiệu lực'); }
    const active = await tx.overtimeRequest.findMany({ where: { userId: actor.id, status: { in: ['PENDING', 'APPROVED'] }, workDate: { gte: new Date(Date.UTC(workDate.getUTCFullYear(), 0, 1)), lt: new Date(Date.UTC(workDate.getUTCFullYear() + 1, 0, 1)) } } });
    if (active.some(request => dateKey(request.workDate).getTime() === workDate.getTime())) throw new ConflictException('Đã có đăng ký OT cho ngày này');
    if (active.reduce((sum, request) => sum + request.hours, 0) + dto.hours > policy.maxAnnualOvertimeHours || active.filter(request => request.workDate.getUTCMonth() === workDate.getUTCMonth()).reduce((sum, request) => sum + request.hours, 0) + dto.hours > policy.maxMonthlyOvertimeHours) throw new ConflictException(`Vượt giới hạn OT đang cấu hình ${policy.maxMonthlyOvertimeHours} giờ/tháng hoặc ${policy.maxAnnualOvertimeHours} giờ/năm`);
    const holidays = effectiveSettings.HOLIDAYS as string[];
    const scheduled = await this.ledger.scheduledDates(actor.id, workDate, workDate, tx, false);
    const dayCategory = holidays.includes(workDate.toISOString().slice(0, 10)) ? 'PUBLIC_HOLIDAY' : scheduled.length ? 'WEEKDAY' : 'WEEKLY_REST';
    const request = await tx.overtimeRequest.create({
      data: { userId: actor.id, workDate, hours: dto.hours, nightHours: dto.nightHours ?? 0, dayCategory, reason: dto.reason },
    });
    await this.audit.log({
      actorId: actor.id, action: 'OVERTIME_REQUESTED', entityType: 'OvertimeRequest', entityId: request.id,
      after: { hours: dto.hours }, requestId,
    });
    return request;
    }, { isolationLevel: 'Serializable', timeout: 120_000 });
  }

  async decide(id: string, approve: boolean, actor: AuthUser, note?: string, requestId?: string) {
    const request = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Không tìm thấy đơn làm thêm giờ');
    if (request.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Đơn đã được xử lý trước đó', HttpStatus.CONFLICT);
    }
    await this.access.assertReviewer(actor, request.userId);
    await this.ledger.assertMutable(request.workDate);
    const updated = await this.prisma.overtimeRequest.update({
      where: { id, status: 'PENDING' },
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

  async confirmActual(id: string, dto: ConfirmOvertimeDto, actor: AuthUser) {
    return this.prisma.$transaction(async tx => {
      const request = await tx.overtimeRequest.findUniqueOrThrow({ where: { id } });
      await this.access.assertReviewer(actor, request.userId);
      await this.ledger.assertMutable(request.workDate, tx);
      if (request.status !== 'APPROVED' || request.actualConfirmedAt) throw new ConflictException('Cần đơn đã duyệt kế hoạch và chưa xác nhận thực làm');
      if (request.workDate >= workDate()) throw new ConflictException('Chỉ xác nhận sau khi ngày làm thêm đã kết thúc');
      if (!dto.evidenceUrl.trim() || dto.note.trim().length < 10) throw new ConflictException('Cần minh chứng và nhận xét đối soát thực làm ít nhất 10 ký tự');
      if (dto.actualHours > request.hours || dto.actualNightHours > dto.actualHours) throw new ConflictException('Giờ thực làm không vượt kế hoạch đã duyệt; giờ đêm không vượt tổng giờ');
      const effectiveSettings = await this.settings.effective();
      const holidays = effectiveSettings.HOLIDAYS as string[];
      const scheduled = await this.ledger.scheduledDates(request.userId, request.workDate, request.workDate, tx, false);
      const dayCategory = holidays.includes(request.workDate.toISOString().slice(0, 10)) ? 'PUBLIC_HOLIDAY' : scheduled.length ? 'WEEKDAY' : 'WEEKLY_REST';
      const changed = await tx.overtimeRequest.updateMany({ where: { id, status: 'APPROVED', actualConfirmedAt: null }, data: {
        actualHours: dto.actualHours, actualNightHours: dto.actualNightHours, actualConfirmedAt: new Date(), actualConfirmedBy: actor.id,
        actualNote: dto.note.trim(), actualEvidenceUrl: dto.evidenceUrl.trim(), dayCategory,
      } });
      if (changed.count !== 1) throw new ConflictException('Số giờ thực làm vừa được xác nhận');
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'OVERTIME_ACTUAL_CONFIRMED', entityType: 'OvertimeRequest', entityId: id, afterData: { ...dto, dayCategory } } });
      return tx.overtimeRequest.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });
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

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Get()
  all(@CurrentUser() actor: AuthUser, @Query('status') status?: string) {
    return this.service.all(status, actor);
  }

  @Post()
  create(@Body() dto: CreateOvertimeDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Post(':id/confirm-actual')
  confirmActual(@Param('id') id: string, @Body() dto: ConfirmOvertimeDto, @CurrentUser() actor: AuthUser) {
    return this.service.confirmActual(id, dto, actor);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: DecisionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, true, user, dto.note);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: DecisionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, false, user, dto.note);
  }
}

@Module({ imports: [SettingsModule], controllers: [OvertimeController], providers: [OvertimeService] })
export class OvertimeModule {}
