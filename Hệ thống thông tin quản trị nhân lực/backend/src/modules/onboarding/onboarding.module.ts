import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { NotificationsService } from '../../common/services/notifications.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class CreatePathDto {
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetJobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orgUnitId?: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) articleIds!: string[];
}

class AssignPathDto {
  @ApiProperty() @IsString() userId!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
}

class CreateHandoverDto {
  @ApiProperty() @IsString() ownerUserId!: string;
  @ApiProperty() @IsDateString() leavingDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) itemTitles?: string[];
}

class HandoverItemDoneDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() done!: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() articleId?: string;
}

// ---------------------------------------------------------------------------
// Service — KC19 lộ trình hội nhập + KC20 chuyển giao tri thức khi nghỉ việc
// ---------------------------------------------------------------------------

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------- onboarding
  /** Danh sách lộ trình hội nhập kèm số người đã được giao. */
  async listPaths() {
    const paths = await this.prisma.onboardingPath.findMany({
      include: {
        _count: { select: { items: true, assignments: true } },
        orgUnit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return paths.map((p) => ({
      id: p.id, title: p.title, description: p.description,
      targetJobTitle: p.targetJobTitle, orgUnit: p.orgUnit,
      itemCount: p._count.items, assignedCount: p._count.assignments,
    }));
  }

  /** Tạo lộ trình đọc từ danh sách bài viết đã xuất bản. */
  async createPath(dto: CreatePathDto, user: AuthUser, requestId?: string) {
    const articles = await this.prisma.article.findMany({ where: { id: { in: dto.articleIds }, deletedAt: null } });
    if (articles.length !== dto.articleIds.length) {
      throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Một số bài viết không tồn tại');
    }
    const path = await this.prisma.onboardingPath.create({
      data: {
        title: dto.title, description: dto.description, targetJobTitle: dto.targetJobTitle,
        orgUnitId: dto.orgUnitId, createdBy: user.id,
        items: { create: dto.articleIds.map((articleId, i) => ({ articleId, sortOrder: i })) },
      },
    });
    await this.audit.log({ actorId: user.id, action: 'ONBOARDING_PATH_CREATED', entityType: 'OnboardingPath', entityId: path.id, requestId });
    return path;
  }

  /** Giao lộ trình cho một nhân viên mới + gửi thông báo. */
  async assign(pathId: string, dto: AssignPathDto, actor: AuthUser, requestId?: string) {
    const path = await this.loadPath(pathId);
    const assignment = await this.prisma.onboardingAssignment.upsert({
      where: { pathId_userId: { pathId, userId: dto.userId } },
      create: { pathId, userId: dto.userId, dueDate: dto.dueDate ? new Date(dto.dueDate) : null },
      update: { dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
    });
    await this.notifications.notify({
      userIds: [dto.userId],
      type: 'ONBOARDING_ASSIGNED',
      title: `Bạn có lộ trình hội nhập mới: ${path.title}`,
      linkPath: '/onboarding',
    });
    await this.audit.log({ actorId: actor.id, action: 'ONBOARDING_ASSIGNED', entityType: 'OnboardingAssignment', entityId: assignment.id, requestId });
    return assignment;
  }

  /** Lộ trình của CHÍNH MÌNH kèm tiến độ hoàn thành từng mục. */
  async myAssignments(userId: string) {
    const assignments = await this.prisma.onboardingAssignment.findMany({
      where: { userId },
      include: {
        path: { include: { items: { include: { article: { select: { id: true, title: true, slug: true } } }, orderBy: { sortOrder: 'asc' } } } },
        progress: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
    return assignments.map((a) => {
      const doneIds = new Set(a.progress.map((p) => p.itemId));
      const items = a.path.items.map((i) => ({ ...i, completed: doneIds.has(i.id) }));
      const required = items.filter((i) => i.isRequired);
      const doneRequired = required.filter((i) => i.completed).length;
      return {
        id: a.id, status: a.status, dueDate: a.dueDate, assignedAt: a.assignedAt,
        path: { id: a.path.id, title: a.path.title, description: a.path.description },
        items,
        progressPercent: required.length === 0 ? 100 : Math.round((doneRequired / required.length) * 100),
      };
    });
  }

  /** Đánh dấu hoàn thành một mục đọc — chỉ chủ nhân của assignment. */
  async completeItem(assignmentId: string, itemId: string, user: AuthUser) {
    const assignment = await this.prisma.onboardingAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment || assignment.userId !== user.id) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Không phải lộ trình của bạn', HttpStatus.FORBIDDEN);
    }
    await this.prisma.onboardingItemProgress.upsert({
      where: { assignmentId_itemId: { assignmentId, itemId } },
      create: { assignmentId, itemId },
      update: {},
    });
    // Đủ mục bắt buộc → tự động hoàn thành lộ trình
    const pathItems = await this.prisma.onboardingPathItem.findMany({ where: { pathId: assignment.pathId, isRequired: true } });
    const done = await this.prisma.onboardingItemProgress.count({ where: { assignmentId, itemId: { in: pathItems.map((p) => p.id) } } });
    if (pathItems.length > 0 && done >= pathItems.length) {
      await this.prisma.onboardingAssignment.update({ where: { id: assignmentId }, data: { status: 'COMPLETED' } });
    }
    return { success: true };
  }

  // --------------------------------------------------------------- handover
  /** Danh sách checklist chuyển giao: KM/ADMIN thấy tất cả, người thường thấy của mình. */
  async listHandovers(user: AuthUser) {
    const roles = await this.globalRoles(user.id);
    const privileged = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
    const rows = await this.prisma.handoverChecklist.findMany({
      where: privileged ? {} : { ownerUserId: user.id },
      include: {
        owner: { select: { id: true, fullName: true, email: true, jobTitle: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((h) => ({
      id: h.id, owner: h.owner, leavingDate: h.leavingDate, status: h.status,
      total: h.items.length, done: h.items.filter((i) => i.status === 'DONE').length,
      items: h.items,
    }));
  }

  /**
   * Tạo checklist chuyển giao khi nghỉ việc — mirror UC17 của tài liệu gốc:
   * sinh sẵn các mục bắt buộc (tri thức đã văn bản hóa, xóa mẫu khuôn mặt…).
   */
  async createHandover(dto: CreateHandoverDto, actor: AuthUser, requestId?: string) {
    const owner = await this.prisma.user.findFirst({ where: { id: dto.ownerUserId, deletedAt: null } });
    if (!owner) throw new NotFoundException('Không tìm thấy nhân viên');

    const defaultTitles = [
      'Bàn giao công việc cho người kế nhiệm',
      'Văn bản hóa tri thức quan trọng thành bài viết trong KMS',
      'Xóa mẫu khuôn mặt & thu hồi quyền truy cập hệ thống',
      'Chuyển giao bookmark / runbook cá nhân',
    ];
    const titles = dto.itemTitles?.length ? dto.itemTitles : defaultTitles;

    const checklist = await this.prisma.handoverChecklist.create({
      data: {
        ownerUserId: dto.ownerUserId,
        leavingDate: new Date(dto.leavingDate),
        items: { create: titles.map((title) => ({ title })) },
      },
      include: { items: true },
    });
    await this.audit.log({ actorId: actor.id, action: 'HANDOVER_CREATED', entityType: 'HandoverChecklist', entityId: checklist.id, requestId });
    return checklist;
  }

  /** Xác nhận hoàn thành một mục; có thể gắn bài viết làm bằng chứng tri thức. */
  async setItemDone(handoverId: string, itemId: string, dto: HandoverItemDoneDto, user: AuthUser) {
    const item = await this.prisma.handoverItem.findFirst({ where: { id: itemId, checklistId: handoverId } });
    if (!item) throw new NotFoundException('Không tìm thấy mục chuyển giao');
    const roles = await this.globalRoles(user.id);
    const privileged = roles.includes('ADMIN') || roles.includes('KM_MANAGER');
    const checklist = await this.prisma.handoverChecklist.findUnique({ where: { id: handoverId } });
    if (!privileged && checklist?.ownerUserId !== user.id && item.assigneeId !== user.id) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Không có quyền cập nhật mục này', HttpStatus.FORBIDDEN);
    }
    const done = dto.done ?? true;

    // Ràng buộc UC17: Nếu là mục Thu hồi tài sản, kiểm tra xem nhân viên còn tài sản chưa trả không
    if (done && checklist?.ownerUserId && (item.title.toLowerCase().includes('tài sản') || item.title.toLowerCase().includes('máy tính'))) {
      const activeAsset = await this.prisma.hrmsAssetAllocation.findFirst({
        where: { assignedUserId: checklist.ownerUserId, status: 'ALLOCATED' },
      });
      if (activeAsset) {
        throw new BusinessException(
          ErrorCodes.VALIDATION_ERROR,
          `Nhân viên còn tài sản [${activeAsset.assetCode} - ${activeAsset.name}] chưa được thu hồi về kho!`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.prisma.handoverItem.update({
      where: { id: itemId },
      data: {
        status: done ? 'DONE' : 'PENDING',
        completedAt: done ? new Date() : null,
        ...(dto.articleId ? { articleId: dto.articleId } : {}),
      },
    });
  }

  /** Đóng checklist — chỉ khi TOÀN BỘ mục đã DONE (cưỡng chế thủ tục như UC17). */
  async closeHandover(id: string, actor: AuthUser, requestId?: string) {
    const pending = await this.prisma.handoverItem.count({ where: { checklistId: id, status: 'PENDING' } });
    if (pending > 0) {
      throw new BusinessException(ErrorCodes.HANDOVER_NOT_CLOSABLE, `Còn ${pending} mục chưa hoàn thành`, HttpStatus.CONFLICT);
    }
    await this.prisma.handoverChecklist.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date() } });
    await this.audit.log({ actorId: actor.id, action: 'HANDOVER_CLOSED', entityType: 'HandoverChecklist', entityId: id, requestId });
    return { success: true };
  }

  private globalRoles(userId: string) {
    return this.prisma.userRole.findMany({ where: { userId }, select: { roleCode: true } }).then((r) => r.map((x) => x.roleCode));
  }

  private loadPath(id: string) {
    return this.prisma.onboardingPath.findUnique({ where: { id } })
      .then((p) => { if (!p) throw new NotFoundException('Không tìm thấy lộ trình'); return p; });
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly service: OnboardingService) {}

  @Get('paths')
  listPaths() {
    return this.service.listPaths();
  }

  @Roles('KM_MANAGER', 'ADMIN')
  @Post('paths')
  createPath(@Body() dto: CreatePathDto, @CurrentUser() user: AuthUser) {
    return this.service.createPath(dto, user);
  }

  @Get('my')
  my(@CurrentUser() user: AuthUser) {
    return this.service.myAssignments(user.id);
  }

  @Roles('KM_MANAGER', 'ADMIN')
  @Post('paths/:id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignPathDto, @CurrentUser() user: AuthUser) {
    return this.service.assign(id, dto, user);
  }

  @Post('assignments/:assignmentId/items/:itemId/complete')
  complete(
    @Param('assignmentId') assignmentId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.completeItem(assignmentId, itemId, user);
  }
}

@ApiTags('handover')
@ApiBearerAuth()
@Controller('handovers')
export class HandoverController {
  constructor(private readonly service: OnboardingService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.service.listHandovers(user);
  }

  @Roles('KM_MANAGER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateHandoverDto, @CurrentUser() user: AuthUser) {
    return this.service.createHandover(dto, user);
  }

  @Post(':id/items/:itemId/done')
  setItemDone(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: HandoverItemDoneDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.setItemDone(id, itemId, dto, user);
  }

  @Roles('KM_MANAGER', 'ADMIN')
  @Post(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.closeHandover(id, user);
  }
}

@Module({ controllers: [OnboardingController, HandoverController], providers: [OnboardingService] })
export class OnboardingModule {}
