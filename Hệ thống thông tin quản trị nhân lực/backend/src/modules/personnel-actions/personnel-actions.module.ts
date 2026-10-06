import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PersonnelEffectsService } from '../../common/services/personnel-effects.service';
import { HrAccessService, isHr } from '../../common/services/hr-access.service';
import { dateKey, workDate } from '../../common/hr-time';
import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post, Query,
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
    private readonly effects: PersonnelEffectsService,
    private readonly access: HrAccessService,
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
        subject: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        requester: { select: { fullName: true } },
        decider: { select: { fullName: true } },
      },
    });
  }

  async create(dto: CreateActionDto, actor: AuthUser, requestId?: string) {
    const subject = await this.prisma.user.findFirst({ where: { id: dto.subjectId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Không tìm thấy nhân viên liên quan');
    if (dto.type === 'SALARY_ADJUST') {
      const reason = String(dto.payload.reason ?? '').trim();
      const newSalary = Number(dto.payload.newSalary);
      if (reason.length < 10) throw new ConflictException('Đề xuất tăng/điều chỉnh lương cần nêu lý do cụ thể (ít nhất 10 ký tự)');
      if (!Number.isFinite(newSalary) || newSalary <= 0) throw new ConflictException('Mức lương mới phải lớn hơn 0');
      const salaryReason = String(dto.payload.salaryReason ?? (dto.payload.rankProgression ? 'MERIT' : 'OTHER'));
      if (!['MERIT', 'PROMOTION', 'MARKET_ALIGNMENT', 'LEGAL_MINIMUM', 'OTHER'].includes(salaryReason)) throw new ConflictException('Lý do điều chỉnh lương không hợp lệ');
      const effectiveAt = dto.effectiveDate ? dateKey(dto.effectiveDate) : workDate();
      const rankProfile = dto.payload.rankProgression === true
        ? await this.prisma.personnelComprehensiveProfile.findUnique({ where: { userId: subject.id }, select: { rankCode: true } })
        : null;
      const isValidatedRankProgression = Boolean(rankProfile?.rankCode);
      if (dto.payload.rankProgression === true && !isValidatedRankProgression) throw new ConflictException('Chỉ được dùng luồng ngạch/bậc cho nhân sự có ngạch công vụ đã khai báo');
      if (!isValidatedRankProgression) {
        const activeContract = await this.prisma.contract.findFirst({ where: { userId: subject.id, status: 'ACTIVE', startDate: { lte: effectiveAt }, OR: [{ endDate: null }, { endDate: { gte: effectiveAt } }] }, orderBy: { startDate: 'desc' } });
        if (!activeContract) throw new ConflictException('Cần có hợp đồng còn hiệu lực vào ngày điều chỉnh lương');
        const targetBandId = String(dto.payload.salaryBandId ?? subject.salaryBandId ?? '');
        if (!targetBandId) throw new ConflictException('Cần gắn khung lương đã duyệt cho vị trí trước khi đề xuất mức mới');
        const band = await this.prisma.hrmsSalaryBand.findUnique({ where: { id: targetBandId } });
        if (!band || band.status !== 'ACTIVE' || band.effectiveFrom > effectiveAt || (band.effectiveTo && band.effectiveTo < effectiveAt)) throw new ConflictException('Khung lương cần áp dụng chưa được duyệt hoặc không còn hiệu lực vào ngày điều chỉnh');
        if (band.compensationBasis !== activeContract.compensationBasis) throw new ConflictException('Đơn vị của khung lương phải khớp hợp đồng: theo tháng, ngày hoặc giờ');
        if (newSalary < band.minSalary || newSalary > band.maxSalary) {
          const unit = activeContract.compensationBasis === 'HOURLY' ? 'giờ' : activeContract.compensationBasis === 'DAILY' ? 'ngày công' : 'tháng';
          throw new ConflictException(`Mức lương mới phải nằm trong khoảng của khung ${band.code}: ${band.minSalary.toLocaleString('vi-VN')}–${band.maxSalary.toLocaleString('vi-VN')} đồng/${unit}`);
        }
        dto.payload.salaryBandId = targetBandId;
      }
      dto.payload.salaryReason = salaryReason;
    }
    // Nhân viên chỉ được tự đề xuất thôi việc; các loại khác do quản lý/HR đề xuất
    const isManager = isHr(actor) || actor.roles.includes('LINE_MANAGER');
    if (actor.roles.includes('LINE_MANAGER') && !isHr(actor) && dto.subjectId !== actor.id) await this.access.assertReviewer(actor, dto.subjectId);
    if (!isManager && (dto.type !== 'RESIGNATION' || dto.subjectId !== actor.id)) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Bạn chỉ được tạo đề xuất thôi việc cho chính mình', HttpStatus.FORBIDDEN);
    }
    const dup = await this.prisma.personnelAction.findFirst({
      where: { subjectId: dto.subjectId, type: dto.type, status: 'PENDING' },
    });
    if (dup) throw new BusinessException(ErrorCodes.CONFLICT, 'Đã có đề xuất cùng loại đang chờ duyệt cho nhân viên này', HttpStatus.CONFLICT);

    const effectiveAt = dto.effectiveDate ? dateKey(dto.effectiveDate) : workDate();
    if (['TRANSFER','SALARY_ADJUST','RESIGNATION'].includes(dto.type)) {
      const closed = await this.prisma.hrmsPayrollRun.findFirst({where:{fromDate:{lte:effectiveAt},toDate:{gte:effectiveAt},status:{in:['REVIEWED','APPROVED','LOCKED','PAID']}}});
      if (closed) throw new ConflictException('Ngày hiệu lực thuộc kỳ lương đã đối soát/khóa; cần lập điều chỉnh kỳ sau');
    }
    const action = await this.prisma.personnelAction.create({
      data: {
        type: dto.type,
        subjectId: dto.subjectId,
        requestedById: actor.id,
        effectiveAt: dto.effectiveDate ? dateKey(dto.effectiveDate) : workDate(),
        payload: {
          ...dto.payload,
          oldSalary: subject.baseSalary,
          ...(dto.type === 'TRANSFER' ? { oldOrgUnitId: subject.orgUnitId, oldJobTitle: subject.jobTitle } : {}),
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
    if (action.requestedById === actor.id) throw new ForbiddenException('Người đề xuất không được tự phê duyệt');
    await this.access.assertReviewer(actor, action.subjectId);
    const payload: Record<string, unknown> = { ...(action.payload as Record<string, unknown>), ...(newOrgUnitIdFromDto ? { newOrgUnitId: newOrgUnitIdFromDto } : {}) };
    if (approve && action.type === 'TRANSFER') {
      if (!payload.newOrgUnitId || !await this.prisma.orgUnit.findUnique({ where: { id: String(payload.newOrgUnitId) } })) throw new ConflictException('Đơn vị tiếp nhận không hợp lệ');
    }
    if (approve && action.type === 'SALARY_ADJUST') {
      const salary = Number(payload.newSalary);
      if (!Number.isFinite(salary) || salary <= 0 || String(payload.reason ?? '').trim().length < 10) throw new ConflictException('Đề xuất tăng lương thiếu mức mới hoặc lý do cụ thể');
      const rankProfile = payload.rankProgression === true
        ? await this.prisma.personnelComprehensiveProfile.findUnique({ where: { userId: action.subjectId }, select: { rankCode: true } })
        : null;
      const isValidatedRankProgression = Boolean(rankProfile?.rankCode);
      if (payload.rankProgression === true && !isValidatedRankProgression) throw new ConflictException('Chỉ được dùng luồng ngạch/bậc cho nhân sự có ngạch công vụ đã khai báo');
      if (!isValidatedRankProgression) {
        const bandId = String(payload.salaryBandId ?? '');
        const effectiveAt = action.effectiveAt ?? workDate();
        const activeContract = await this.prisma.contract.findFirst({ where: { userId: action.subjectId, status: 'ACTIVE', startDate: { lte: effectiveAt }, OR: [{ endDate: null }, { endDate: { gte: effectiveAt } }] }, orderBy: { startDate: 'desc' } });
        if (!activeContract || !bandId) throw new ConflictException('Cần hợp đồng còn hiệu lực và khung lương trước khi duyệt');
        const band = await this.prisma.hrmsSalaryBand.findUnique({ where: { id: bandId } });
        if (!band || band.status !== 'ACTIVE' || band.compensationBasis !== activeContract.compensationBasis || band.effectiveFrom > effectiveAt || (band.effectiveTo && band.effectiveTo < effectiveAt) || salary < band.minSalary || salary > band.maxSalary) throw new ConflictException('Mức lương phải nằm trong khung đã duyệt cùng đơn vị hợp đồng và có hiệu lực vào ngày áp dụng');
      }
    }
    const updated = await this.prisma.$transaction(async tx => {
      if (approve && action.effectiveAt && await tx.hrmsPayrollRun.findFirst({where:{fromDate:{lte:action.effectiveAt},toDate:{gte:action.effectiveAt},status:{in:['REVIEWED','APPROVED','LOCKED','PAID']}}})) throw new ConflictException('Ngày hiệu lực thuộc kỳ lương đã đối soát; điều chỉnh ở kỳ sau');
      const changed = await tx.personnelAction.updateMany({ where: { id, status: 'PENDING' }, data: { status: approve ? 'APPROVED' : 'REJECTED', payload: payload as import('@prisma/client').Prisma.InputJsonValue, effectiveAt: action.effectiveAt ?? (payload.effectiveDate ? dateKey(String(payload.effectiveDate)) : workDate()), decidedById: actor.id, decidedAt: new Date(), decisionNote: note } });
      if (changed.count !== 1) throw new ConflictException('Đề xuất đã được xử lý');
      if (approve && action.type === 'RESIGNATION') await tx.handoverChecklist.create({ data: { ownerUserId: action.subjectId, leavingDate: action.effectiveAt ?? workDate(), items: { create: [
        { title: 'Bàn giao công việc cho người tiếp nhận', responsibleRole: 'LINE_MANAGER' },
        { title: 'Thu hồi tài sản làm việc', responsibleRole: 'HR_CB' },
        { title: 'Thu hồi toàn bộ tài khoản và quyền truy cập', responsibleRole: 'ADMIN' },
        { title: 'Quyết toán công, lương, bảo hiểm, thuế và khoản vay', responsibleRole: 'ACCOUNTANT' },
        { title: 'Chuyển giao tri thức và tài liệu công việc', responsibleRole: 'KM_MANAGER' },
      ] } } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: approve ? 'PERSONNEL_ACTION_APPROVED' : 'PERSONNEL_ACTION_REJECTED', entityType: 'PersonnelAction', entityId: id, requestId, afterData: { type: action.type } } });
      return tx.personnelAction.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });
    if (approve) await this.effects.applyDue();
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

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD')
  @Get()
  list(@Query('status') status?: string) {
    return this.service.list(status);
  }

  @Post()
  create(@Body() dto: CreateActionDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN', 'BOD')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: DecideActionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, true, user, dto.note, undefined, dto.newOrgUnitId);
  }

  @Roles('ADMIN', 'BOD')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: DecideActionDto, @CurrentUser() user: AuthUser) {
    return this.service.decide(id, false, user, dto.note);
  }
}

@Module({ controllers: [PersonnelActionsController], providers: [PersonnelActionsService], exports: [PersonnelActionsService] })
export class PersonnelActionsModule {}
