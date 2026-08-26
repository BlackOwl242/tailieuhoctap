import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';

export class CreateRegularizationDto {
  @ApiProperty({ example: 'user-id' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiProperty({ example: '2026-08-25' })
  @IsDateString()
  workDate: string;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @IsString()
  requestedCheckIn?: string;

  @ApiPropertyOptional({ example: '17:30' })
  @IsOptional()
  @IsString()
  requestedCheckOut?: string;

  @ApiProperty({ example: 'Quên quẹt thẻ do tham dự cuộc họp khách hàng ngoài trụ sở lúc 8h sáng' })
  @IsString()
  reason: string;
}

export class DecideRegularizationDto {
  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Đã xác nhận với trưởng bộ phận' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
}

@Injectable()
export class HrmsRegularizationService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(status?: string, userId?: string) {
    return this.prisma.hrmsAttendanceRegularization.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submit(actorId: string, dto: CreateRegularizationDto) {
    const reg = await this.prisma.hrmsAttendanceRegularization.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        workDate: new Date(dto.workDate),
        requestedCheckIn: dto.requestedCheckIn,
        requestedCheckOut: dto.requestedCheckOut,
        reason: dto.reason,
        status: 'PENDING',
      },
    });

    await this.audit.log({
      actorId,
      action: 'HRMS_REGULARIZATION_SUBMIT',
      targetType: 'HrmsAttendanceRegularization',
      targetId: reg.id,
      description: `Đề xuất giải trình bổ sung công ngày ${dto.workDate} cho ${dto.employeeName}`,
    });

    return reg;
  }

  async decide(actorId: string, id: string, dto: DecideRegularizationDto) {
    const reg = await this.prisma.hrmsAttendanceRegularization.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Không tìm thấy đơn giải trình');

    const updated = await this.prisma.hrmsAttendanceRegularization.update({
      where: { id },
      data: {
        status: dto.status,
        approvedBy: actorId,
        decisionNote: dto.decisionNote,
      },
    });

    if (dto.status === 'APPROVED') {
      const dateOnly = new Date(reg.workDate);
      const inParts = reg.requestedCheckIn ? reg.requestedCheckIn.split(':') : null;
      const outParts = reg.requestedCheckOut ? reg.requestedCheckOut.split(':') : null;

      const firstIn = inParts
        ? new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), Number(inParts[0]), Number(inParts[1]))
        : null;
      const lastOut = outParts
        ? new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), Number(outParts[0]), Number(outParts[1]))
        : null;

      await this.prisma.attendanceDay.upsert({
        where: {
          userId_workDate: {
            userId: reg.userId,
            workDate: dateOnly,
          },
        },
        create: {
          userId: reg.userId,
          workDate: dateOnly,
          firstInAt: firstIn,
          lastOutAt: lastOut,
          status: 'PRESENT',
          workedMinutes: 480,
          lateMinutes: 0,
          earlyMinutes: 0,
        },
        update: {
          firstInAt: firstIn ?? undefined,
          lastOutAt: lastOut ?? undefined,
          status: 'PRESENT',
          lateMinutes: 0,
        },
      });
    }

    await this.audit.log({
      actorId,
      action: `HRMS_REGULARIZATION_${dto.status}`,
      targetType: 'HrmsAttendanceRegularization',
      targetId: id,
      description: `Duyệt đơn giải trình công [${dto.status}] cho ${reg.employeeName}`,
    });

    return updated;
  }
}

@ApiTags('HRMS - Attendance Regularization')
@ApiBearerAuth()
@Controller('hrms/attendance-regularizations')
export class HrmsRegularizationController {
  constructor(private readonly service: HrmsRegularizationService) {}

  @Get()
  list(@Query('status') status?: string, @Query('userId') userId?: string) {
    return this.service.list(status, userId);
  }

  @Post()
  submit(@Body() dto: CreateRegularizationDto) {
    return this.service.submit('system', dto);
  }

  @Patch(':id/decide')
  decide(@Param('id') id: string, @Body() dto: DecideRegularizationDto) {
    return this.service.decide('system', id, dto);
  }
}

@Module({
  controllers: [HrmsRegularizationController],
  providers: [HrmsRegularizationService],
  exports: [HrmsRegularizationService],
})
export class HrmsRegularizationModule {}
