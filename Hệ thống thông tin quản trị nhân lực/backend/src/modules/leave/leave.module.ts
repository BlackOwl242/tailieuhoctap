import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { businessDates, dateKey } from '../../common/hr-time';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import { HrAccessService } from '../../common/services/hr-access.service';
import { RuntimeSettingsService } from '../../common/services/runtime-settings.service';
import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class CreateLeaveDto {
  @ApiProperty() @IsEnum(['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY']) type!: 'ANNUAL' | 'SICK' | 'UNPAID' | 'MATERNITY';
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiProperty() @IsDateString() endDate!: string;
  @ApiProperty() @IsString() @MaxLength(500) reason!: string;
}

class DecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

// ---------------------------------------------------------------------------
// Service — UC20 Đăng ký nghỉ phép: kiểm quỹ trước khi trình, trừ quỹ NGAY khi duyệt
// ---------------------------------------------------------------------------

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ledger: AttendanceLedgerService,
    private readonly access: HrAccessService,
    private readonly settings: RuntimeSettingsService,
  ) {}

  /** Số ngày nghỉ làm việc (loại cuối tuần) giữa hai ngày, tính cả 2 đầu. */
  private businessDays(from: Date, to: Date): number {
    let days = 0;
    const d = new Date(from);
    const end = new Date(to);
    // Chuẩn hóa cả hai đầu về giữa ngày để không lệch do múi giờ/00:00
    d.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);
    while (d.getTime() <= end.getTime()) {
      const wd = d.getDay();
      if (wd !== 0 && wd !== 6) days += 1;
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  private async ensureBalance(userId: string, year: number, db: Prisma.TransactionClient | PrismaService = this.prisma) {
    const existing = await db.leaveBalance.findUnique({
      where: { userId_year: { userId, year } },
    });
    if (existing) return existing;
    // Thâm niên: +1 ngày mỗi 5 năm công tác (Điều 65 BLĐ 2019)
    const user = await db.user.findUnique({ where: { id: userId }, select: { hireDate: true } });
    let entitled = 12;
    if (user?.hireDate) {
      const years = (new Date(Date.UTC(year, 11, 31)).getTime() - user.hireDate.getTime()) / (365.25 * 86_400_000);
      entitled += Math.max(0, Math.floor(years / 5));
    }
    return db.leaveBalance.upsert({ where: { userId_year: { userId, year } }, create: { userId, year, entitled }, update: {} });
  }

  @Get('balance')
  async myBalance(@CurrentUser() user: AuthUser, @Query('year') yearStr?: string) {
    const year = yearStr ? Number(yearStr) : new Date().getFullYear();
    const balance = await this.ensureBalance(user.id, year);
    const pending = await this.prisma.leaveRequest.aggregate({
      where: { userId: user.id, type: 'ANNUAL', status: 'PENDING', startDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } },
      _sum: { days: true },
    });
    return { ...balance, pendingDays: pending._sum.days ?? 0, remaining: balance.entitled - balance.used };
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.prisma.leaveRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { approver: { select: { fullName: true } } },
    });
  }

  /** Toàn công ty — cho hộp phê duyệt của HR/quản lý. */
  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Get()
  async all(@Query('status') status: string | undefined, @CurrentUser() actor: AuthUser) {
    const scope = await this.access.reviewScope(actor);
    return this.prisma.leaveRequest.findMany({
      where: { ...(status ? { status: status as never } : {}), ...(scope.orgUnitId ? { user: { orgUnitId: scope.orgUnitId } } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        approver: { select: { fullName: true } },
      },
    });
  }

  async create(dto: CreateLeaveDto, actor: AuthUser, requestId?: string) {
    return this.prisma.$transaction(async tx => {
    const start = dateKey(dto.startDate);
    const end = dateKey(dto.endDate);
    if (end < start) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Ngày kết thúc phải sau ngày bắt đầu');
    const selectedDates = businessDates(start, end, await this.settings.get('HOLIDAYS', []));
    const days = selectedDates.length;
    if (end.getTime() - start.getTime() > 366 * 86400000) throw new ConflictException('Đơn nghỉ tối đa một năm');
    for (const day of selectedDates) await this.ledger.assertMutable(day, tx);
    const overlap = await tx.leaveRequest.findFirst({ where: { userId: actor.id, status: { in: ['PENDING', 'APPROVED'] }, startDate: { lte: end }, endDate: { gte: start } } });
    if (overlap) throw new ConflictException('Đã có đơn nghỉ trùng khoảng thời gian');
    if (days <= 0) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Khoảng thời gian chọn không có ngày làm việc nào');

    // Kiểm quỹ TRƯỚC khi trình (UC20 bước 2) — chỉ áp dụng phép năm
    if (dto.type === 'ANNUAL') for (const year of [...new Set(selectedDates.map(day => day.getUTCFullYear()))]) {
      const balance = await this.ensureBalance(actor.id, year, tx);
      const daysInYear = selectedDates.filter(day => day.getUTCFullYear() === year).length;
      if (daysInYear > balance.entitled - balance.used) throw new ConflictException(`Quỹ phép năm ${year} không đủ`);
    }

    const request = await tx.leaveRequest.create({
      data: {
        userId: actor.id,
        type: dto.type,
        startDate: start,
        endDate: end,
        days,
        reason: dto.reason,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'LEAVE_REQUESTED', entityType: 'LeaveRequest', entityId: request.id,
      after: { type: dto.type, days }, requestId,
    });
    return request;
    }, { isolationLevel: 'Serializable', timeout: 120_000 });
  }

  /** Duyệt: trừ quỹ phép NGAY (nếu phép năm) — nguyên tắc "duyệt là trừ quỹ". */
  async decide(id: string, approve: boolean, actor: AuthUser, note?: string, requestId?: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    if (request.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Đơn đã được xử lý trước đó', HttpStatus.CONFLICT);
    }

    await this.access.assertReviewer(actor, request.userId);
    const dates = businessDates(request.startDate, request.endDate, await this.settings.get('HOLIDAYS', []));
    const updated = await this.prisma.$transaction(async tx => {
      for (const day of dates) await this.ledger.assertMutable(day, tx);
      const changed = await tx.leaveRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: approve ? 'APPROVED' : 'REJECTED', approverId: actor.id, decidedAt: new Date(), decisionNote: note } });
      if (changed.count !== 1) throw new ConflictException('Đơn đã được xử lý');
      if (approve && request.type === 'ANNUAL') for (const year of [...new Set(dates.map(day => day.getUTCFullYear()))]) {
        const balance = await this.ensureBalance(request.userId, year, tx);
        const count = dates.filter(day => day.getUTCFullYear() === year).length;
        if (balance.entitled - balance.used < count) throw new ConflictException(`Quỹ phép năm ${year} không đủ`);
        const changedBalance = await tx.leaveBalance.updateMany({ where: { userId: request.userId, year, used: balance.used }, data: { used: { increment: count } } });
        if (changedBalance.count !== 1) throw new ConflictException('Quỹ phép vừa thay đổi');
      }
      if (approve) for (const day of dates) await this.ledger.recompute(request.userId, day, tx);
      await tx.auditLog.create({ data: { actorId: actor.id, action: approve ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED', entityType: 'LeaveRequest', entityId: id } });
      return tx.leaveRequest.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId: actor.id, action: approve ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      entityType: 'LeaveRequest', entityId: id, after: { status: updated.status }, requestId,
    });
    return updated;
  }

  /** Nhân viên tự hủy đơn khi còn chờ duyệt. */
  async cancel(id: string, actor: AuthUser, requestId?: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    if (request.userId !== actor.id) throw new BusinessException(ErrorCodes.FORBIDDEN, 'Chỉ người tạo đơn mới được hủy', HttpStatus.FORBIDDEN);
    if (request.status === 'APPROVED' && request.startDate < new Date(new Date().toISOString().slice(0,10))) throw new ConflictException('Phép đã bắt đầu phải được HR điều chỉnh có minh chứng');
    if (!['PENDING','APPROVED'].includes(request.status)) throw new ConflictException('Đơn không ở trạng thái có thể hủy');
    const dates = businessDates(request.startDate, request.endDate, await this.settings.get('HOLIDAYS', []));
    const updated = await this.prisma.$transaction(async tx => {
      for (const day of dates) await this.ledger.assertMutable(day, tx);
      const changed = await tx.leaveRequest.updateMany({ where: { id, status: request.status }, data: { status: 'CANCELLED', decidedAt: new Date() } });
      if (changed.count !== 1) throw new ConflictException('Đơn đã thay đổi trạng thái');
      if (request.status === 'APPROVED' && request.type === 'ANNUAL') for (const year of [...new Set(dates.map(d=>d.getUTCFullYear()))]) {
        const days = dates.filter(d=>d.getUTCFullYear()===year).length;
        const balance = await tx.leaveBalance.findUniqueOrThrow({ where: { userId_year: { userId: request.userId, year } } });
        if (balance.used < days) throw new ConflictException('Sổ phép không khớp; cần đối soát');
        await tx.leaveBalance.update({ where: { userId_year: { userId: request.userId, year } }, data: { used: { decrement: days } } });
      }
      for (const day of dates) await this.ledger.recompute(request.userId, day, tx);
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'LEAVE_CANCELLED', entityType: 'LeaveRequest', entityId: id, requestId } });
      return tx.leaveRequest.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });
    return updated;
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('leave')
@ApiBearerAuth()
@Controller(['leave', 'hrms/leave'])
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Get(['balance', 'my-balance'])
  balance(@CurrentUser() user: AuthUser, @Query('year') year?: string) {
    return this.service.myBalance(user, year);
  }

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
  create(@Body() dto: CreateLeaveDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
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

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancel(id, user);
  }
}

@Module({ controllers: [LeaveController], providers: [LeaveService] })
export class LeaveModule {}

