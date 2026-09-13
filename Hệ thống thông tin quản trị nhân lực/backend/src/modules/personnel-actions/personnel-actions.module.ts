import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

class CreateActionDto {
  @ApiProperty() @IsEnum(['TRANSFER', 'SALARY_ADJUST', 'AWARD', 'DISCIPLINE', 'RESIGNATION']) type!: 'TRANSFER' | 'SALARY_ADJUST' | 'AWARD' | 'DISCIPLINE' | 'RESIGNATION';
  @ApiProperty() @IsString() subjectId!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveDate?: string;
  @ApiProperty() @IsObject() payload!: Record<string, unknown>;
}

class DecideActionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() newOrgUnitId?: string;
}

/**
 * Biến động nhân sự — MỘT bộ máy duyệt dùng chung cho 5 loại đề xuất
 * (thuyên chuyển / điều chỉnh lương / khen thưởng / kỷ luật / thôi việc),
 * đúng mẫu hình ApprovalEngine: thêm loại mới chỉ cần cấu hình, không viết luồng.
 *
 * Hiệu lực khi duyệt:
 * - TRANSFER       → cập nhật đơn vị của nhân viên;
 * - SALARY_ADJUST  → cập nhật lương cơ bản (nguồn tính lương kỳ sau);
 * - RESIGNATION    → sinh checklist BÀN GIAO CÔNG VIỆC 4 xác nhận bắt buộc
 *                    (bàn giao việc – thu hồi tài sản – thu hồi tài khoản – quyết toán);
 * - AWARD/DISCIPLINE → ghi nhận quyết định (mức thưởng/khấu trừ nhập kỳ lương).
 */
@Injectable()
export class PersonnelActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(status?: string) {
    return this.prisma.personnelAction.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        requester: { select: { fullName: true } },
        decider: { select: { fullName: true } },
      },
    });
  }

  mine(actor: AuthUser) {
    return this.prisma.personnelAction.findMany({
      where: { OR: [{ subjectId: actor.id }, { requestedById: actor.id }] },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { fullName: true } },
        requester: { select: { fullName: true } },
        decider: { select: { fullName: true } },
      },
    });
  }

  async create(dto: CreateActionDto, actor: AuthUser, requestId?: string) {
    const subject = await this.prisma.user.findFirst({ where: { id: dto.subjectId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Không tìm thấy nhân viên liên quan');
    // Nhân viên chỉ được tự đề xuất thôi việc; các loại khác do quản lý/HR đề xuất
    const isManager = actor.roles.includes('ADMIN') || actor.roles.includes('KM_MANAGER');
    if (!isManager && (dto.type !== 'RESIGNATION' || dto.subjectId !== actor.id)) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Bạn chỉ được tạo đề xuất thôi việc cho chính mình', HttpStatus.FORBIDDEN);
    }
    const dup = await this.prisma.personnelAction.findFirst({
      where: { subjectId: dto.subjectId, type: dto.type, status: 'PENDING' },
    });
    if (dup) throw new BusinessException(ErrorCodes.CONFLICT, 'Đã có đề xuất cùng loại đang chờ duyệt cho nhân viên này', HttpStatus.CONFLICT);

    const action = await this.prisma.personnelAction.create({
      data: {
        type: dto.type,
        subjectId: dto.subjectId,
        requestedById: actor.id,
        payload: {
          ...dto.payload,
          effectiveDate: dto.effectiveDate ?? null,
        },
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PERSONNEL_ACTION_CREATED', entityType: 'PersonnelAction', entityId: action.id,
      after: { type: dto.type, subjectId: dto.subjectId }, requestId,
    });
    return action;
  }

  async decide(id: string, approve: boolean, actor: AuthUser, note?: string, requestId?: string, newOrgUnitIdFromDto?: string) {
    const action = await this.prisma.personnelAction.findUnique({ where: { id } });
    if (!action) throw new NotFoundException('Không tìm thấy đề xuất');
    if (action.status !== 'PENDING') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Đề xuất đã được xử lý', HttpStatus.CONFLICT);
    }

    if (approve) {
      const payload = (action.payload ?? {}) as Record<string, unknown>;
      const effectiveDate = payload.effectiveDate ? new Date(String(payload.effectiveDate)) : new Date();

      switch (action.type) {
        case 'TRANSFER': {
          const newOrgUnitId = (newOrgUnitIdFromDto ? String(newOrgUnitIdFromDto) : null) || (payload.newOrgUnitId ? String(payload.newOrgUnitId) : null);
          if (!newOrgUnitId) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Thiếu đơn vị mới (newOrgUnitId)');
          await this.prisma.user.update({ where: { id: action.subjectId }, data: { orgUnitId: newOrgUnitId } });
          if (!payload.newOrgUnitId) {
            await this.prisma.personnelAction.update({
              where: { id },
              data: { payload: { ...payload, newOrgUnitId } },
            });
          }
          break;
        }
        case 'SALARY_ADJUST': {
          const newSalary = Number(payload.newSalary);
          if (!newSalary || newSalary <= 0) throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Thiếu mức lương mới (newSalary)');
          await this.prisma.user.update({ where: { id: action.subjectId }, data: { baseSalary: newSalary } });
          break;
        }
        case 'RESIGNATION': {
          // Sinh checklist BÀN GIAO CÔNG VIỆC 4 xác nhận bắt buộc (UC17)
          const leavingDate = effectiveDate;
          const checklist = await this.prisma.handoverChecklist.create({
            data: {
              ownerUserId: action.subjectId,
              leavingDate,
              items: {
                create: [
                  { title: 'Bàn giao công việc cho người tiếp nhận (Trưởng dự án xác nhận)' },
                  { title: 'Thu hồi tài sản: máy tính, thẻ từ, tài sản văn phòng (Hành chính xác nhận)' },
                  { title: 'Thu hồi toàn bộ tài khoản & quyền truy cập hệ thống (IT xác nhận)' },
                  { title: 'Quyết toán công – lương – bảo hiểm – thuế (Kế toán xác nhận)' },
                  { title: 'Chuyển giao tri thức: tài liệu hóa quy trình đang phụ trách' },
                ],
              },
            },
          });
          await this.prisma.user.update({
            where: { id: action.subjectId },
            data: { employmentStatus: 'RESIGNED' },
          });
          await this.audit.log({
            actorId: actor.id, action: 'HANDOVER_CHECKLIST_CREATED', entityType: 'HandoverChecklist',
            entityId: checklist.id, after: { from: 'RESIGNATION_APPROVED' }, requestId,
          });
          break;
        }
        case 'AWARD':
        case 'DISCIPLINE':
          // Mức thưởng/khấu trừ được kế toán nạp vào kỳ lương kế tiếp từ payload.amount
          break;
      }
    }

    const updated = await this.prisma.personnelAction.update({
      where: { id },
      data: {
        status: approve ? 'APPROVED' : 'REJECTED',
        decidedById: actor.id,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: approve ? 'PERSONNEL_ACTION_APPROVED' : 'PERSONNEL_ACTION_REJECTED',
      entityType: 'PersonnelAction', entityId: id, after: { type: action.type }, requestId,
    });
    return updated;
  }
}

@ApiTags('personnel-actions')
@ApiBearerAuth()
@Controller('personnel-actions')
export class PersonnelActionsController {
  constructor(private readonly service: PersonnelActionsService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.mine(user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get()
  list(@Param('status') status?: string) {
    return this.service.list(status);
  }

  @Post()
  create(@Body() dto: CreateActionDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: DecideActionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, true, user, dto.note, undefined, dto.newOrgUnitId);
  }

  @Roles('ADMIN')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: DecideActionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, false, user, dto.note);
  }
}

@Module({ controllers: [PersonnelActionsController], providers: [PersonnelActionsService] })
export class PersonnelActionsModule {}
