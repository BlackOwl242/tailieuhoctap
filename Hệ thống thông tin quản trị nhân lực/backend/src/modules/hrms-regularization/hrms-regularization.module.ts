import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import { HrAccessService } from '../../common/services/hr-access.service';
import { atClock, dateKey } from '../../common/hr-time';
import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

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
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Đã xác nhận với trưởng bộ phận' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
}

@Injectable()
export class HrmsRegularizationService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly ledger: AttendanceLedgerService, private readonly access: HrAccessService) {}

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
    const day = dateKey(dto.workDate);
    await this.ledger.assertMutable(day);
    if (!dto.requestedCheckIn && !dto.requestedCheckOut) throw new ConflictException('Cần ít nhất một giờ bổ sung');
    if (dto.requestedCheckIn) atClock(day, dto.requestedCheckIn);
    if (dto.requestedCheckOut) atClock(day, dto.requestedCheckOut);
    const schedule = await this.ledger.schedule(dto.userId, day);
    if (dto.requestedCheckIn && dto.requestedCheckOut && atClock(day, dto.requestedCheckOut) <= atClock(day, dto.requestedCheckIn) && schedule.endAt.getTime() < day.getTime() + 86400000 - 7*3600000) throw new ConflictException('Giờ ra phải sau giờ vào');
    const reg = await this.prisma.hrmsAttendanceRegularization.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        workDate: day,
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

  async decide(actor: AuthUser, id: string, dto: DecideRegularizationDto) {
    if (!['APPROVED', 'REJECTED'].includes(dto.status)) throw new ConflictException('Quyết định không hợp lệ');
    const reg = await this.prisma.hrmsAttendanceRegularization.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Không tìm thấy đơn giải trình');
    await this.access.assertReviewer(actor, reg.userId);
    const updated = await this.prisma.$transaction(async tx => {
      await this.ledger.assertMutable(reg.workDate, tx);
      const changed = await tx.hrmsAttendanceRegularization.updateMany({ where: { id, status: 'PENDING' }, data: { status: dto.status, approvedBy: actor.id, decisionNote: dto.decisionNote } });
      if (changed.count !== 1) throw new ConflictException('Đơn đã được xử lý');
      if (dto.status === 'APPROVED') await this.ledger.recompute(reg.userId, reg.workDate, tx);
      return tx.hrmsAttendanceRegularization.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });
    await this.audit.log({ actorId: actor.id, action: `HRMS_REGULARIZATION_${dto.status}`, targetType: 'HrmsAttendanceRegularization', targetId: id });
    return updated;
  }

}

@ApiTags('HRMS - Attendance Regularization')
@ApiBearerAuth()
@Controller('hrms/attendance-regularizations')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
export class HrmsRegularizationController {
  constructor(private readonly service: HrmsRegularizationService) {}

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Get('my')
  myRegularizations(@CurrentUser() user: AuthUser) {
    return this.service.list(undefined, user?.id);
  }

  @Get()
  list(@Query('status') status?: string, @Query('userId') userId?: string) {
    return this.service.list(status, userId);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Post()
  submit(@Body() dto: CreateRegularizationDto, @CurrentUser() actor: AuthUser) {
    return this.service.submit(actor.id, { ...dto, userId: actor.id, employeeName: actor.fullName ?? actor.email });
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER')
  @Patch(':id/decide')
  decide(@Param('id') id: string, @Body() dto: DecideRegularizationDto, @CurrentUser() actor: AuthUser) {
    return this.service.decide(actor, id, dto);
  }
}

@Module({
  controllers: [HrmsRegularizationController],
  providers: [HrmsRegularizationService],
  exports: [HrmsRegularizationService],
})
export class HrmsRegularizationModule {}
