import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { LifecycleEventStatus, LifecycleEventType } from '@prisma/client';

export class CreateLifecycleEventDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiProperty({ enum: LifecycleEventType, example: LifecycleEventType.PROMOTION })
  @IsEnum(LifecycleEventType)
  type: LifecycleEventType;

  @ApiProperty({ example: 'Quyết định Bổ nhiệm Trưởng nhóm Kỹ thuật' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'QD-2026/088-BN' })
  @IsOptional()
  @IsString()
  decisionNo?: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  effectiveDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

@Injectable()
export class HrmsLifecycleService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listEvents(type?: LifecycleEventType, status?: LifecycleEventStatus) {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    return this.prisma.hrmsLifecycleEvent.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async createEvent(actorId: string, dto: CreateLifecycleEventDto) {
    const res = await this.prisma.hrmsLifecycleEvent.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        type: dto.type,
        title: dto.title,
        decisionNo: dto.decisionNo,
        effectiveDate: new Date(dto.effectiveDate),
        details: (dto.details ?? {}) as import('@prisma/client').Prisma.InputJsonValue,
        notes: dto.notes,
        createdBy: actorId,
        status: LifecycleEventStatus.APPROVED,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_LIFECYCLE_EVENT',
      targetType: 'HrmsLifecycleEvent',
      targetId: res.id,
      description: `Tạo sự kiện vòng đời: [${dto.type}] ${dto.title} cho nhân viên ${dto.employeeName}`,
    });

    return res;
  }

  async updateEventStatus(actorId: string, id: string, status: LifecycleEventStatus) {
    const ev = await this.prisma.hrmsLifecycleEvent.findUnique({ where: { id } });
    if (!ev) throw new NotFoundException('Không tìm thấy sự kiện');

    const res = await this.prisma.hrmsLifecycleEvent.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_EVENT_STATUS',
      targetType: 'HrmsLifecycleEvent',
      targetId: id,
      description: `Cập nhật trạng thái sự kiện ${ev.title} sang [${status}]`,
    });

    return res;
  }

  async listOnboardingTasks() {
    return this.prisma.hrmsOnboardingTask.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async toggleOnboardingTask(id: string) {
    const task = await this.prisma.hrmsOnboardingTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Không tìm thấy nhiệm vụ');

    return this.prisma.hrmsOnboardingTask.update({
      where: { id },
      data: {
        isCompleted: !task.isCompleted,
        completedAt: !task.isCompleted ? new Date() : null,
      },
    });
  }
}

@ApiTags('HRMS - Employee Lifecycle')
@ApiBearerAuth()
@Controller('hrms/lifecycle')
export class HrmsLifecycleController {
  constructor(private readonly service: HrmsLifecycleService) {}

  @Get('events')
  listEvents(@Query('type') type?: LifecycleEventType, @Query('status') status?: LifecycleEventStatus) {
    return this.service.listEvents(type, status);
  }

  @Post('events')
  createEvent(@Body() dto: CreateLifecycleEventDto) {
    return this.service.createEvent('system', dto);
  }

  @Patch('events/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: LifecycleEventStatus) {
    return this.service.updateEventStatus('system', id, status);
  }

  @Get('onboarding-tasks')
  listTasks() {
    return this.service.listOnboardingTasks();
  }

  @Patch('onboarding-tasks/:id/toggle')
  toggleTask(@Param('id') id: string) {
    return this.service.toggleOnboardingTask(id);
  }
}

@Module({
  controllers: [HrmsLifecycleController],
  providers: [HrmsLifecycleService],
  exports: [HrmsLifecycleService],
})
export class HrmsLifecycleModule {}
