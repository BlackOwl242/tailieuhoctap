import { BadRequestException, ConflictException } from '@nestjs/common';
import { dateKey, DAY_MS, workDate, clockMinutes } from '../../common/hr-time';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';

export class CreateShiftTypeDto {
  @ApiProperty({ example: 'Ca Hành chính' })
  @IsString()
  name: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  lateToleranceMinutes?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  earlyExitToleranceMinutes?: number;

  @ApiPropertyOptional({ default: '#3b82f6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enableAutoAttendance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateShiftAssignmentDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsString()
  shiftTypeId: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ type: [Number], default: [1, 2, 3, 4, 5], description: 'Ngày làm việc theo tuần; Chủ nhật=0, Thứ bảy=6' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workDays?: number[];
}

@Injectable()
export class HrmsShiftsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly ledger: AttendanceLedgerService) {}

  async listShiftTypes() {
    return this.prisma.hrmsShiftType.findMany({
      orderBy: { startTime: 'asc' },
      include: { _count: { select: { assignments: true } } },
    });
  }

  async createShiftType(actorId: string, dto: CreateShiftTypeDto) {
    clockMinutes(dto.startTime); clockMinutes(dto.endTime);
    const res = await this.prisma.hrmsShiftType.create({ data: dto });
    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsShiftType',
      targetId: res.id,
      description: `Tạo ca làm việc mới: ${dto.name} (${dto.startTime} - ${dto.endTime})`,
    });
    return res;
  }

  async listAssignments(userId?: string, shiftTypeId?: string) {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (shiftTypeId) where.shiftTypeId = shiftTypeId;

    return this.prisma.hrmsShiftAssignment.findMany({
      where,
      include: { shiftType: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async assignShift(actorId: string, dto: CreateShiftAssignmentDto) {
    const shift = await this.prisma.hrmsShiftType.findUnique({ where: { id: dto.shiftTypeId } });
    if (!shift) throw new NotFoundException('Không tìm thấy ca làm việc');

    const start = dateKey(dto.startDate), end = dto.endDate ? dateKey(dto.endDate) : null;
    if (end && end < start) throw new BadRequestException('Ngày kết thúc ca không hợp lệ');
    const workDays = dto.workDays ?? [1, 2, 3, 4, 5];
    if (!workDays.length || workDays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new BadRequestException('Cần chọn ít nhất một ngày làm việc hợp lệ');
    const res = await this.prisma.$transaction(async tx => {
      await this.ledger.assertMutable(start, tx);
      if (end) for (let day = new Date(start); day <= end; day = new Date(day.getTime() + DAY_MS)) await this.ledger.assertMutable(day, tx);
      const closed = await tx.attendancePeriod.findFirst({ where: { status: 'FINALIZED', closedAt: { not: null } }, orderBy: [{ year: 'desc' }, { month: 'desc' }] });
      if (!end && closed && start < new Date(Date.UTC(closed.year, closed.month, 1))) throw new ConflictException('Ca không có ngày kết thúc không được bao phủ kỳ đã chốt');
      const overlaps = await tx.hrmsShiftAssignment.findMany({ where: { userId: dto.userId, status: 'ACTIVE', ...(end ? { startDate: { lte: end } } : {}), OR: [{ endDate: null }, { endDate: { gte: start } }] } });
      if (overlaps.length && (!end || start.getTime() !== end.getTime())) throw new ConflictException('Khoảng phân ca trùng lịch đã có');
      for (const existing of overlaps) {
        await tx.hrmsShiftAssignment.update({ where: { id: existing.id }, data: { status: 'CANCELLED' } });
        if (dateKey(existing.startDate) < start) await tx.hrmsShiftAssignment.create({ data: { userId: existing.userId, shiftTypeId: existing.shiftTypeId, startDate: dateKey(existing.startDate), endDate: new Date(start.getTime() - DAY_MS), workDays: existing.workDays, assignedBy: actorId } });
        if (!existing.endDate || dateKey(existing.endDate) > start) await tx.hrmsShiftAssignment.create({ data: { userId: existing.userId, shiftTypeId: existing.shiftTypeId, startDate: new Date(start.getTime() + DAY_MS), endDate: existing.endDate ? dateKey(existing.endDate) : null, workDays: existing.workDays, assignedBy: actorId } });
      }
      return tx.hrmsShiftAssignment.create({ data: { userId: dto.userId, shiftTypeId: dto.shiftTypeId, startDate: start, endDate: end, workDays, assignedBy: actorId }, include: { shiftType: true } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'ASSIGN_SHIFT',
      targetType: 'HrmsShiftAssignment',
      targetId: res.id,
      description: `Phân ca ${shift.name} cho nhân sự ${dto.userId}`,
    });
    return res;
  }

  async updateShiftType(actorId: string, id: string, dto: Partial<CreateShiftTypeDto>) {
    const shift = await this.prisma.hrmsShiftType.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Không tìm thấy ca làm việc');

    if (await this.prisma.hrmsShiftAssignment.count({ where: { shiftTypeId: id } })) throw new ConflictException('Ca đã sử dụng; tạo mẫu ca mới để bảo toàn lịch sử');
    if (dto.startTime) clockMinutes(dto.startTime); if (dto.endTime) clockMinutes(dto.endTime);
    const res = await this.prisma.hrmsShiftType.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      targetType: 'HrmsShiftType',
      targetId: id,
      description: `Cập nhật ca làm việc: ${res.name}`,
    });
    return res;
  }

  async deleteShiftType(actorId: string, id: string) {
    const shift = await this.prisma.hrmsShiftType.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Không tìm thấy ca làm việc');

    if (await this.prisma.hrmsShiftAssignment.count({ where: { shiftTypeId: id } })) throw new ConflictException('Ca đã có lịch phân công; không được xóa');
    await this.prisma.hrmsShiftType.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE',
      targetType: 'HrmsShiftType',
      targetId: id,
      description: `Xóa ca làm việc: ${shift.name}`,
    });
    return { success: true, message: 'Đã xóa ca làm việc thành công' };
  }

  async deleteAssignment(actorId: string, id: string) {
    const assignment = await this.prisma.hrmsShiftAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException('Không tìm thấy phân ca');

    await this.prisma.$transaction(async tx => {
      const current = await tx.hrmsShiftAssignment.findUniqueOrThrow({ where: { id } });
      const until = current.endDate ?? workDate();
      for (let day = dateKey(current.startDate); day <= until; day = new Date(day.getTime() + DAY_MS)) await this.ledger.assertMutable(day, tx);
      await tx.hrmsShiftAssignment.update({ where: { id }, data: { status: 'CANCELLED' } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'DELETE',
      targetType: 'HrmsShiftAssignment',
      targetId: id,
      description: `Hủy phân ca cho nhân sự ${assignment.userId}`,
    });
    return { success: true, message: 'Đã hủy phân ca thành công' };
  }

  async getRosterMatrix(from?: string, to?: string) {
    const start = from ? dateKey(from) : workDate();
    const end = to ? dateKey(to) : new Date(start.getTime() + 6 * DAY_MS);
    const shiftTypes = await this.prisma.hrmsShiftType.findMany();
    const assignments = await this.prisma.hrmsShiftAssignment.findMany({
      where: { status: 'ACTIVE', startDate: { lte: end }, OR: [{ endDate: null }, { endDate: { gte: start } }] },
      include: { shiftType: true },
    });
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true, jobTitle: true, orgUnit: { select: { name: true } } },
      orderBy: { employeeCode: 'asc' },
    });

    return { shiftTypes, assignments, users };
  }
}

@ApiTags('HRMS - Shifts & Roster')
@ApiBearerAuth()
@Controller('hrms/shifts')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
export class HrmsShiftsController {
  constructor(private readonly service: HrmsShiftsService) {}

  @Get('types')
  listTypes() {
    return this.service.listShiftTypes();
  }

  @Post('types')
  createType(@Body() dto: CreateShiftTypeDto, @CurrentUser() actor: AuthUser) {
    return this.service.createShiftType(actor.id, dto);
  }

  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() dto: Partial<CreateShiftTypeDto>, @CurrentUser() actor: AuthUser) {
    return this.service.updateShiftType(actor.id, id, dto);
  }

  @Delete('types/:id')
  deleteType(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteShiftType(actor.id, id);
  }

  @Get('assignments')
  listAssignments(@Query('userId') userId?: string, @Query('shiftTypeId') shiftTypeId?: string) {
    return this.service.listAssignments(userId, shiftTypeId);
  }

  @Post('assignments')
  assign(@Body() dto: CreateShiftAssignmentDto, @CurrentUser() actor: AuthUser) {
    return this.service.assignShift(actor.id, dto);
  }

  @Delete('assignments/:id')
  deleteAssignment(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteAssignment(actor.id, id);
  }

  @Get('roster')
  roster(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.getRosterMatrix(from, to);
  }
}

@Module({
  controllers: [HrmsShiftsController],
  providers: [HrmsShiftsService],
  exports: [HrmsShiftsService],
})
export class HrmsShiftsModule {}
