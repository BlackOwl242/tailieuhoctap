import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
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
}

@Injectable()
export class HrmsShiftsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listShiftTypes() {
    return this.prisma.hrmsShiftType.findMany({
      orderBy: { startTime: 'asc' },
      include: { _count: { select: { assignments: true } } },
    });
  }

  async createShiftType(actorId: string, dto: CreateShiftTypeDto) {
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

    const res = await this.prisma.hrmsShiftAssignment.create({
      data: {
        userId: dto.userId,
        shiftTypeId: dto.shiftTypeId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        assignedBy: actorId,
      },
      include: { shiftType: true },
    });

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

    await this.prisma.hrmsShiftAssignment.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE',
      targetType: 'HrmsShiftAssignment',
      targetId: id,
      description: `Hủy phân ca cho nhân sự ${assignment.userId}`,
    });
    return { success: true, message: 'Đã hủy phân ca thành công' };
  }

  async getRosterMatrix() {
    const shiftTypes = await this.prisma.hrmsShiftType.findMany();
    const assignments = await this.prisma.hrmsShiftAssignment.findMany({
      where: { status: 'ACTIVE' },
      include: { shiftType: true },
    });
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, fullName: true, employeeCode: true, jobTitle: true, orgUnit: { select: { name: true } } },
      take: 20,
    });

    return { shiftTypes, assignments, users };
  }
}

@ApiTags('HRMS - Shifts & Roster')
@ApiBearerAuth()
@Controller('hrms/shifts')
export class HrmsShiftsController {
  constructor(private readonly service: HrmsShiftsService) {}

  @Get('types')
  listTypes() {
    return this.service.listShiftTypes();
  }

  @Post('types')
  createType(@Body() dto: CreateShiftTypeDto) {
    return this.service.createShiftType('system', dto);
  }

  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() dto: Partial<CreateShiftTypeDto>) {
    return this.service.updateShiftType('system', id, dto);
  }

  @Delete('types/:id')
  deleteType(@Param('id') id: string) {
    return this.service.deleteShiftType('system', id);
  }

  @Get('assignments')
  listAssignments(@Query('userId') userId?: string, @Query('shiftTypeId') shiftTypeId?: string) {
    return this.service.listAssignments(userId, shiftTypeId);
  }

  @Post('assignments')
  assign(@Body() dto: CreateShiftAssignmentDto) {
    return this.service.assignShift('system', dto);
  }

  @Delete('assignments/:id')
  deleteAssignment(@Param('id') id: string) {
    return this.service.deleteAssignment('system', id);
  }

  @Get('roster')
  roster() {
    return this.service.getRosterMatrix();
  }
}

@Module({
  controllers: [HrmsShiftsController],
  providers: [HrmsShiftsService],
  exports: [HrmsShiftsService],
})
export class HrmsShiftsModule {}
