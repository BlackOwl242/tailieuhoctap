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

  private async ensureBalance(userId: string, year: number) {
    const existing = await this.prisma.leaveBalance.findUnique({
      where: { userId_year: { userId, year } },
    });
    if (existing) return existing;
    // Thâm niên: +1 ngày mỗi 5 năm công tác (Điều 65 BLĐ 2019)
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { hireDate: true } });
    let entitled = 12;
    if (user?.hireDate) {
      const years = (Date.now() - user.hireDate.getTime()) / (365.25 * 86_400_000);
      entitled += Math.floor(years / 5);
    }
    return this.prisma.leaveBalance.create({ data: { userId, year, entitled } });
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
  @Roles('ADMIN', 'KM_MANAGER')
  @Get()
  all(@Query('status') status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        approver: { select: { fullName: true } },
      },
    });
  }

  async create(dto: CreateLeaveDto, actor: AuthUser, requestId?: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Ngày kết thúc phải sau ngày bắt đầu');
    const days = this.businessDays(start, end);
    if (days <= 0) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Khoảng thời gian chọn không có ngày làm việc nào');

    // Kiểm quỹ TRƯỚC khi trình (UC20 bước 2) — chỉ áp dụng phép năm
    if (dto.type === 'ANNUAL') {
      const year = start.getFullYear();
      const balance = await this.ensureBalance(actor.id, year);
      const remaining = balance.entitled - balance.used;
      if (days > remaining) {
        throw new BusinessException(
          ErrorCodes.QUOTA_EXCEEDED,
          `Quỹ phép không đủ: cần ${days} ngày, còn lại ${remaining} ngày phép năm ${year}`,
          HttpStatus.BAD_REQUEST,
          { remaining, requested: days },
        );
      }
    }

    const request = await this.prisma.leaveRequest.create({
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
  }

  /** Duyệt: trừ quỹ phép NGAY (nếu phép năm) — nguyên tắc "duyệt là trừ quỹ". */
  async decide(id: string, approve: boolean, actor: AuthUser, note?: string, requestId?: string) {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Không tìm thấy đơn nghỉ phép');
    if (request.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Đơn đã được xử lý trước đó', HttpStatus.CONFLICT);
    }

    if (approve && request.type === 'ANNUAL') {
      const year = request.startDate.getFullYear();
      const balance = await this.ensureBalance(request.userId, year);
      if (balance.entitled - balance.used < request.days) {
        throw new BusinessException(ErrorCodes.QUOTA_EXCEEDED, 'Quỹ phép không đủ để duyệt đơn này', HttpStatus.CONFLICT);
      }
      await this.prisma.leaveBalance.update({
        where: { userId_year: { userId: request.userId, year } },
        data: { used: { increment: request.days } },
      });
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approve ? 'APPROVED' : 'REJECTED',
        approverId: actor.id,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });
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
    if (request.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Chỉ hủy được đơn đang chờ duyệt', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED', decidedAt: new Date() },
    });
    await this.audit.log({ actorId: actor.id, action: 'LEAVE_CANCELLED', entityType: 'LeaveRequest', entityId: id, requestId });
    return updated;
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('leave')
@ApiBearerAuth()
@Controller('leave')
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Get('balance')
  balance(@CurrentUser() user: AuthUser, @Query('year') year?: string) {
    return this.service.myBalance(user, year);
  }

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
  create(@Body() dto: CreateLeaveDto, @CurrentUser() user: AuthUser) {
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

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancel(id, user);
  }
}

@Module({ controllers: [LeaveController], providers: [LeaveService] })
export class LeaveModule {}
