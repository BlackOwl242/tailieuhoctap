import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PersonnelActionsModule, PersonnelActionsService } from '../personnel-actions/personnel-actions.module';
import { HrAccessService } from '../../common/services/hr-access.service';
import { dateKey } from '../../common/hr-time';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
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
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly actions: PersonnelActionsService, private readonly access: HrAccessService) {}

  async listEvents(type?: LifecycleEventType, status?: LifecycleEventStatus) {
    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const events = await this.prisma.hrmsLifecycleEvent.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
    const actions = await this.prisma.personnelAction.findMany({where:{id:{in:events.map(e=>e.personnelActionId).filter((id):id is string=>Boolean(id))}}});
    return events.map(e=>{const a=actions.find(a=>a.id===e.personnelActionId);return {...e,status:a?(a.appliedAt?'COMPLETED':a.status):e.status};});
  }

  async createEvent(actor: AuthUser, dto: CreateLifecycleEventDto) {
    if (dto.type === 'ONBOARDING') throw new BadRequestException('Hội nhập được sinh từ ứng viên đã chấp thuận offer');
    const types = { PROMOTION: 'SALARY_ADJUST', TRANSFER: 'TRANSFER', SEPARATION: 'RESIGNATION', DISCIPLINARY: 'DISCIPLINE' } as const;
    const action = await this.actions.create({ subjectId: dto.userId, type: types[dto.type], effectiveDate: dto.effectiveDate, payload: { ...dto.details, title: dto.title, decisionNo: dto.decisionNo, notes: dto.notes } }, actor);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: dto.userId } });
    return this.prisma.hrmsLifecycleEvent.create({ data: { userId: dto.userId, employeeName: user.fullName, type: dto.type, title: dto.title, effectiveDate: dateKey(dto.effectiveDate), status: 'PENDING', personnelActionId: action.id, details: dto.details as any ?? {}, notes: dto.notes, createdBy: actor.id } });
  }

  async updateEventStatus(actor: AuthUser, id: string, status: LifecycleEventStatus) {
    const ev = await this.prisma.hrmsLifecycleEvent.findUniqueOrThrow({ where: { id } });
    if (!ev.personnelActionId || !['APPROVED', 'REJECTED'].includes(status)) throw new ConflictException('Sự kiện phải đi qua quyết định nhân sự; hội nhập hoàn tất từ checklist');
    if (!actor.roles.some(role => ['ADMIN','BOD'].includes(role))) throw new ForbiddenException('Cần quyền Ban Giám đốc');
    await this.actions.decide(ev.personnelActionId, status === 'APPROVED', actor);
    const action = await this.prisma.personnelAction.findUniqueOrThrow({where:{id:ev.personnelActionId}});
    return this.prisma.hrmsLifecycleEvent.update({ where: { id }, data: { status: action.appliedAt ? 'COMPLETED' : status } });
  }

  async listOnboardingTasks(actor: AuthUser) {
    const tasks = await this.prisma.hrmsOnboardingTask.findMany({ where: { userId: { not: null } }, orderBy: { createdAt: 'asc' } });
    const ids = [...new Set(tasks.map(t => t.userId!))];
    const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, fullName: true, orgUnitId: true } });
    const scope = actor.roles.includes('LINE_MANAGER') ? await this.access.reviewScope(actor) : null;
    return tasks.filter(t => actor.roles.some(role => ['ADMIN','KM_MANAGER','HR_CB','BOD'].includes(role)) || t.userId === actor.id || t.category === 'DEPARTMENT' && users.find(u => u.id === t.userId)?.orgUnitId === scope?.orgUnitId).map(t => ({ ...t, employeeName: users.find(u => u.id === t.userId)?.fullName }));
  }

  async toggleOnboardingTask(actor: AuthUser, id: string) {
    return this.prisma.$transaction(async tx => {
      const task = await tx.hrmsOnboardingTask.findUniqueOrThrow({ where: { id } });
      if (!task.userId) throw new ConflictException('Đây là mẫu checklist, chưa gắn nhân viên');
      if (actor.id === task.userId) throw new ForbiddenException('Không tự ký xác nhận hội nhập');
      const allowed: Record<string,string[]> = { IT: ['ADMIN'], HR: ['ADMIN','HR_CB','KM_MANAGER'], ADMIN: ['ADMIN','HR_CB'], DEPARTMENT: ['ADMIN','LINE_MANAGER'] };
      if (!allowed[task.category]?.some(role => actor.roles.includes(role))) throw new ForbiddenException('Cần người phụ trách bộ phận ký');
      if (task.category === 'DEPARTMENT') await this.access.assertReviewer(actor, task.userId);
      if (task.isCompleted) throw new ConflictException('Nhiệm vụ đã xác nhận, không được bỏ xác nhận');
      if (task.category === 'IT') {
        const user = await tx.user.findUniqueOrThrow({ where: { id: task.userId } });
        if (user.status !== 'ACTIVE') throw new ConflictException('Quản trị cần đặt mật khẩu và kích hoạt tài khoản tại trang Người dùng trước khi xác nhận IT');
      }
      const result = await tx.hrmsOnboardingTask.update({ where: { id }, data: { isCompleted: true, completedAt: new Date(), completedBy: actor.id } });
      const [pendingTasks, pendingLearningPaths] = await Promise.all([
        tx.hrmsOnboardingTask.count({ where: { userId: task.userId, isCompleted: false } }),
        tx.onboardingAssignment.count({ where: { userId: task.userId, status: 'IN_PROGRESS' } }),
      ]);
      if (!pendingTasks && !pendingLearningPaths) await tx.hrmsLifecycleEvent.updateMany({ where: { userId: task.userId, type: 'ONBOARDING', status: 'IN_PROGRESS' }, data: { status: 'COMPLETED' } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'ONBOARDING_TASK_CONFIRMED', entityType: 'HrmsOnboardingTask', entityId: id } });
      return result;
    }, { isolationLevel: 'Serializable' });
  }

}

@ApiTags('HRMS - Employee Lifecycle')
@ApiBearerAuth()
@Controller('hrms/lifecycle')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD')
export class HrmsLifecycleController {
  constructor(private readonly service: HrmsLifecycleService) {}

  @Get('events')
  listEvents(@Query('type') type?: LifecycleEventType, @Query('status') status?: LifecycleEventStatus) {
    return this.service.listEvents(type, status);
  }

  @Post('events')
  createEvent(@Body() dto: CreateLifecycleEventDto, @CurrentUser() actor: AuthUser) {
    return this.service.createEvent(actor, dto);
  }

  @Patch('events/:id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: LifecycleEventStatus, @CurrentUser() actor: AuthUser) {
    return this.service.updateEventStatus(actor, id, status);
  }

  @Roles('ADMIN','KM_MANAGER','HR_CB','BOD','LINE_MANAGER','USER')
  @Get('onboarding-tasks')
  listTasks(@CurrentUser() actor: AuthUser) {
    return this.service.listOnboardingTasks(actor);
  }

  @Roles('ADMIN','KM_MANAGER','HR_CB','LINE_MANAGER')
  @Patch('onboarding-tasks/:id/toggle')
  toggleTask(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.toggleOnboardingTask(actor, id);
  }
}

@Module({
  imports: [PersonnelActionsModule],
  controllers: [HrmsLifecycleController],
  providers: [HrmsLifecycleService],
  exports: [HrmsLifecycleService],
})
export class HrmsLifecycleModule {}
