import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { HrAccessService } from '../../common/services/hr-access.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';

export class CreateCycleDto {
  @ApiProperty({ example: 'Chu kỳ đánh giá KPI 2026' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2026 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

}

export class CreateGoalItemDto {
  @ApiProperty({ example: 'Nâng cao chất lượng kiến trúc hệ thống' })
  @IsString() @MinLength(3) @MaxLength(160)
  kraTitle!: string;

  @ApiProperty({ example: 'Đảm bảo thời gian phản hồi API sub-100ms và độ bao phủ kiểm thử > 90%' })
  @IsString() @MinLength(3) @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional() @IsNumber()
  weightage?: number;

  @ApiPropertyOptional({ enum: ['GENERAL', 'RESULT'], default: 'RESULT' })
  @IsOptional() @IsIn(['GENERAL', 'RESULT'])
  criteriaGroup?: string;

  @ApiProperty({ example: 'Đạt SLA 99.9%' })
  @IsString() @MinLength(2) @MaxLength(500)
  targetMetric!: string;
}

export class CreateGoalDto {
  @ApiProperty()
  @IsString()
  cycleId: string;

  @ApiPropertyOptional({ description: 'Giao cá nhân; chọn userId hoặc orgUnitId, không gửi đồng thời.' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Giao cho đơn vị và toàn bộ nhân sự đủ điều kiện ở các đơn vị con.' })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn An', description: 'Tương thích biểu mẫu cũ; tên chính thức luôn lấy từ hồ sơ nhân sự.' })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({ example: 'Nâng cao chất lượng kiến trúc hệ thống' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  kraTitle?: string;

  @ApiPropertyOptional({ example: 'Đảm bảo thời gian phản hồi API sub-100ms và độ bao phủ kiểm thử > 90%' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @IsNumber()
  weightage?: number;

  @ApiPropertyOptional({ enum: ['GENERAL', 'RESULT'], default: 'RESULT', description: 'Khu vực nhà nước: tiêu chí chung hoặc kết quả nhiệm vụ; doanh nghiệp chỉ dùng kết quả KPI.' })
  @IsOptional()
  @IsIn(['GENERAL', 'RESULT'])
  criteriaGroup?: string;

  @ApiPropertyOptional({ example: 'Đạt SLA 99.9%' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  targetMetric?: string;

  @ApiPropertyOptional({ type: [CreateGoalItemDto], description: 'Có thể giao một nhóm KPI trong cùng một thao tác; tổng trọng số được kiểm tra riêng theo từng nhân sự và nhóm tiêu chí.' })
  @IsOptional() @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateGoalItemDto)
  goals?: CreateGoalItemDto[];
}

export class PublicAppraisalDecisionDto {
  @ApiProperty() @IsString() cycleId!: string;
  @ApiProperty() @IsString() userId!: string;
  @ApiProperty({ minLength: 2, maxLength: 160, description: 'Nhóm công chức/viên chức có nhiệm vụ tương đồng trong cùng đơn vị' }) @IsString() @MinLength(2) @MaxLength(160) comparableGroup!: string;
  @ApiProperty({ enum: ['EXCELLENT', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY'] }) @IsIn(['EXCELLENT', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY']) finalClassification!: string;
  @ApiPropertyOptional({ description: 'Xác nhận điều kiện chuyên môn và điều kiện xếp loại xuất sắc theo quy định áp dụng' }) @IsOptional() @IsBoolean() excellentCriteriaConfirmed?: boolean;
  @ApiPropertyOptional({ description: 'Có quyết định của cấp có thẩm quyền cho áp dụng tỷ lệ ngoại lệ tối đa 25%' }) @IsOptional() @IsBoolean() quotaExceptionApproved?: boolean;
  @ApiPropertyOptional({ maxLength: 100, description: 'Số văn bản phê duyệt ngoại lệ theo nhóm (nếu áp dụng)' }) @IsOptional() @IsString() @MaxLength(100) exceptionDecisionNo?: string;
  @ApiPropertyOptional({ maxLength: 2000, description: 'Căn cứ, minh chứng điều kiện xếp loại và quyết định/ngoại lệ; bắt buộc khi kết luận xuất sắc' }) @IsOptional() @IsString() @MaxLength(2000) decisionNote?: string;
}

export class CreateKraEvidenceDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(2000) description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) metricValue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) evidenceUrl?: string;
}

@Injectable()
export class HrmsPerformanceService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly access: HrAccessService) {}

  private async assertActive(cycleId: string) {
    const cycle = await this.prisma.hrmsAppraisalCycle.findUniqueOrThrow({ where: { id: cycleId } });
    if (cycle.status !== 'ACTIVE') throw new ConflictException('Kỳ đánh giá không còn mở');
    return cycle;
  }
  private async assertSubjectAccess(actor: AuthUser, userId: string) {
    if (actor.id === userId || actor.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD'].includes(role))) return;
    await this.access.assertReviewer(actor, userId);
  }
  private async recompute(cycleId: string, userId: string) {
    const cycle = await this.prisma.hrmsAppraisalCycle.findUniqueOrThrow({ where: { id: cycleId } });
    if (cycle.organizationSector === 'state') {
      const goals = await this.prisma.hrmsAppraisalGoal.findMany({ where: { cycleId, userId } });
      for (const goal of goals) {
        const finalScore = goal.managerScore === null ? null : Math.round(goal.managerScore * 100) / 100;
        await this.prisma.hrmsAppraisalGoal.update({ where: { id: goal.id }, data: { finalScore, status: 'SUBMITTED' } });
      }
      return;
    }
    const goals = await this.prisma.hrmsAppraisalGoal.findMany({ where: { cycleId, userId } });
    for (const goal of goals) {
      const finalScore = goal.managerScore === null ? null : Math.round(goal.managerScore * 100) / 100;
      await this.prisma.hrmsAppraisalGoal.update({ where: { id: goal.id }, data: { finalScore, status: 'SUBMITTED' } });
    }
  }
  async summary(cycleId: string, userId: string) {
    const cycle = await this.prisma.hrmsAppraisalCycle.findUniqueOrThrow({ where: { id: cycleId } });
    const goals = await this.prisma.hrmsAppraisalGoal.findMany({ where: { cycleId, userId }, include: { evidences: { select: { id: true } } } });
    if (cycle.organizationSector === 'state') {
      const general = goals.filter(goal => goal.criteriaGroup === 'GENERAL');
      const results = goals.filter(goal => goal.criteriaGroup === 'RESULT');
      const generalWeight = general.reduce((sum, goal) => sum + goal.weightage, 0);
      const resultWeight = results.reduce((sum, goal) => sum + goal.weightage, 0);
      const missingTaskEvidence = goals.some(goal => goal.criteriaGroup === 'RESULT' && goal.evidences.length === 0);
      if (Math.abs(generalWeight - 100) > .001 || Math.abs(resultWeight - 100) > .001 || !goals.length || goals.some(goal => goal.finalScore === null) || missingTaskEvidence) {
        return { complete: false, weight: { general: generalWeight, result: resultWeight }, score: null, classification: null, scoreClassification: null, finalDecision: false, missingTaskEvidence };
      }
      const generalScore = general.reduce((sum, goal) => sum + goal.finalScore! * goal.weightage / 100, 0);
      const taskScore = results.reduce((sum, goal) => sum + goal.finalScore! * goal.weightage / 100, 0);
      const score = Math.round((generalScore * cycle.generalCriteriaWeight / 100 + taskScore * cycle.taskCriteriaWeight / 100) * 100) / 100;
      const scoreClassification: import('@prisma/client').AppraisalClassification = score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'SATISFACTORY' : 'UNSATISFACTORY';
      const decision = await this.prisma.hrmsPublicAppraisalDecision.findUnique({ where: { cycleId_userId: { cycleId, userId } } });
      return { complete: true, weight: { general: generalWeight, result: resultWeight }, score, classification: decision?.finalClassification ?? scoreClassification, scoreClassification, finalDecision: Boolean(decision), generalScore: Math.round(generalScore * 100) / 100, taskScore: Math.round(taskScore * 100) / 100, missingTaskEvidence: false, framework: cycle.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'ND233_2026' : 'ND335_2025' };
    }
    const weight = goals.reduce((sum, goal) => sum + goal.weightage, 0);
    const missingEvidence = goals.some(goal => goal.evidences.length === 0);
    if (Math.abs(weight - 100) > .001 || !goals.length || goals.some(goal => goal.finalScore === null) || missingEvidence) return { complete: false, weight, score: null, classification: null, missingEvidence };
    const score = Math.round(goals.reduce((sum, goal) => sum + goal.finalScore! * goal.weightage / 100, 0) * 100) / 100;
    const classification: import('@prisma/client').AppraisalClassification = score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : score >= 50 ? 'SATISFACTORY' : 'UNSATISFACTORY';
    return { complete: true, weight, score, classification, missingEvidence: false, framework: 'ENTERPRISE_KPI' };
  }

  async listCycles() {
    return this.prisma.hrmsAppraisalCycle.findMany({
      include: {
        _count: { select: { goals: true } },
      },
      orderBy: [{ year: 'desc' }, { startDate: 'desc' }],
    });
  }

  async createCycle(actorId: string, dto: CreateCycleDto) {
    if (new Date(dto.endDate) < new Date(dto.startDate)) throw new BadRequestException('Khoảng thời gian kỳ không hợp lệ');
    const profileRow = await this.prisma.setting.findUnique({ where: { key: 'ORG_PROFILE' } });
    const profile = profileRow?.value && typeof profileRow.value === 'object' ? profileRow.value as Record<string, unknown> : {};
    const organizationSector = profile.orgSector === 'state' ? 'state' : 'enterprise';
    const publicPersonnelType = organizationSector === 'state' && profile.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'PUBLIC_EMPLOYEE' : organizationSector === 'state' ? 'CIVIL_SERVANT' : null;
    const res = await this.prisma.hrmsAppraisalCycle.create({
      data: {
        name: dto.name,
        year: dto.year,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        description: dto.description,
        organizationSector,
        publicPersonnelType,
        selfWeight: 0,
        peerWeight: 0,
        managerWeight: 100,
        subordinateWeight: 0,
        generalCriteriaWeight: 30,
        taskCriteriaWeight: 70,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_APPRAISAL_CYCLE',
      targetType: 'HrmsAppraisalCycle',
      targetId: res.id,
      description: `Khởi tạo kỳ đánh giá hiệu suất: ${dto.name}`,
    });
    return res;
  }

  async updateCycle(actorId: string, id: string, dto: { name?: string; status?: string; description?: string }) {
    const cycle = await this.prisma.hrmsAppraisalCycle.findUniqueOrThrow({ where: { id } });
    if (cycle.status === 'COMPLETED') throw new ConflictException('Kỳ đã khóa');
    if (dto.status && !['ACTIVE', 'COMPLETED'].includes(dto.status)) throw new BadRequestException('Trạng thái kỳ không hợp lệ');
    if (dto.status === 'COMPLETED') {
      const goals = await this.prisma.hrmsAppraisalGoal.findMany({ where: { cycleId: id } });
      if (!goals.length) throw new ConflictException('Kỳ chưa có mục tiêu');
      for (const userId of [...new Set(goals.map(goal => goal.userId))]) if (!(await this.summary(id, userId)).complete) throw new ConflictException('Chưa đủ điểm theo mô hình của kỳ hoặc trọng số mục tiêu chưa đạt yêu cầu');
      if (cycle.organizationSector === 'state') await this.assertPublicQuotaReady(id, [...new Set(goals.map(goal => goal.userId))]);
    }
    const res = await this.prisma.hrmsAppraisalCycle.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status,
        description: dto.description,
      },
    });
    await this.audit.log({
      actorId,
      action: 'UPDATE_APPRAISAL_CYCLE',
      targetType: 'HrmsAppraisalCycle',
      targetId: id,
      description: `Cập nhật kỳ đánh giá: ${res.name} (Trạng thái: ${res.status})`,
    });
    return res;
  }

  private publicComparableGroup(orgUnitId: string | null, jobTitle: string | null) {
    void orgUnitId;
    return (jobTitle || 'Chưa phân nhóm').trim().replace(/\s+/g, ' ');
  }

  private classificationRank(value: string) {
    return ({ UNSATISFACTORY: 0, SATISFACTORY: 1, GOOD: 2, EXCELLENT: 3 } as Record<string, number>)[value] ?? -1;
  }

  private async assertPublicQuotaReady(cycleId: string, userIds: string[]) {
    const decisions = await this.prisma.hrmsPublicAppraisalDecision.findMany({ where: { cycleId, userId: { in: userIds } } });
    if (decisions.length !== userIds.length) throw new ConflictException('Cần cơ quan có thẩm quyền rà soát và chốt xếp loại cuối cùng cho từng người trước khi khóa kỳ công vụ');
    const grouped = new Map<string, typeof decisions>();
    for (const decision of decisions) {
      const groupKey = `${decision.orgUnitId}::${decision.comparableGroup.trim().toLocaleLowerCase('vi').replace(/\s+/g, ' ')}`;
      grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), decision]);
    }
    for (const [group, rows] of grouped) {
      const excellent = rows.filter(row => row.finalClassification === 'EXCELLENT');
      const goodCount = rows.filter(row => row.finalClassification === 'GOOD').length;
      const regularLimit = Math.floor(goodCount * 0.2);
      if (excellent.length > regularLimit) {
        const exceptionLimit = Math.floor(goodCount * 0.25);
      const exceptionValid = excellent.length <= exceptionLimit && excellent.length > 0 && excellent.every(row => row.quotaExceptionApproved && row.exceptionDecisionNo?.trim());
        if (!exceptionValid) throw new ConflictException(`Nhóm “${group}” vượt tỷ lệ xuất sắc 20% trên số người xếp loại tốt; chỉ được áp dụng tối đa 25% khi có quyết định ngoại lệ hợp lệ của cấp có thẩm quyền`);
      }
    }
  }

  async listPublicDecisions(cycleId: string) {
    const cycle = await this.prisma.hrmsAppraisalCycle.findUniqueOrThrow({ where: { id: cycleId } });
    if (cycle.organizationSector !== 'state') throw new BadRequestException('Hiệu chuẩn hạn ngạch chỉ áp dụng cho chu kỳ khu vực công');
    const goals = await this.prisma.hrmsAppraisalGoal.findMany({ where: { cycleId }, select: { userId: true, employeeName: true } });
    const names = new Map<string, string>();
    for (const goal of goals) names.set(goal.userId, goal.employeeName);
    const users = await this.prisma.user.findMany({ where: { id: { in: [...names.keys()] } }, select: { id: true, fullName: true, jobTitle: true, orgUnitId: true, orgUnit: { select: { name: true } } } });
    const decisions = await this.prisma.hrmsPublicAppraisalDecision.findMany({ where: { cycleId } });
    const byUser = new Map(decisions.map(row => [row.userId, row]));
    return Promise.all(users.map(async user => {
      const summary = await this.summary(cycleId, user.id);
      const decision = byUser.get(user.id);
      return {
        userId: user.id,
        employeeName: user.fullName || names.get(user.id) || '',
        jobTitle: user.jobTitle,
        orgUnitName: user.orgUnit?.name ?? '',
        score: summary.score,
        scoreClassification: 'scoreClassification' in summary ? summary.scoreClassification ?? summary.classification : summary.classification,
        complete: summary.complete,
        missingTaskEvidence: 'missingTaskEvidence' in summary ? Boolean(summary.missingTaskEvidence) : false,
        comparableGroup: decision?.comparableGroup ?? this.publicComparableGroup(user.orgUnitId, user.jobTitle),
        finalClassification: decision?.finalClassification ?? ('scoreClassification' in summary ? summary.scoreClassification ?? summary.classification : summary.classification),
        excellentCriteriaConfirmed: decision?.excellentCriteriaConfirmed ?? false,
        quotaExceptionApproved: decision?.quotaExceptionApproved ?? false,
        exceptionDecisionNo: decision?.exceptionDecisionNo ?? '',
        decisionNote: decision?.decisionNote ?? '',
        decided: Boolean(decision),
      };
    }));
  }

  async savePublicDecision(actor: AuthUser, dto: PublicAppraisalDecisionDto) {
    const cycle = await this.assertActive(dto.cycleId);
    if (cycle.organizationSector !== 'state') throw new BadRequestException('Chỉ kỳ khu vực công có bước hiệu chuẩn xếp loại');
    const summary = await this.summary(dto.cycleId, dto.userId);
    const scoreClassification = 'scoreClassification' in summary ? summary.scoreClassification : summary.classification;
    if (!summary.complete || !scoreClassification) throw new ConflictException('Cần hoàn tất điểm và trọng số trước khi hiệu chuẩn xếp loại');
    const subject = await this.prisma.user.findUniqueOrThrow({ where: { id: dto.userId }, select: { orgUnitId: true } });
    if (!subject.orgUnitId) throw new BadRequestException('Nhân sự khu vực công cần được gán đơn vị tổ chức trước khi hiệu chuẩn hạn ngạch');
    if (this.classificationRank(dto.finalClassification) > this.classificationRank(scoreClassification)) throw new BadRequestException('Không được xếp loại cao hơn mức điểm và kết quả đã tính');
    const isExcellent = dto.finalClassification === 'EXCELLENT';
    if (isExcellent && !dto.excellentCriteriaConfirmed) throw new BadRequestException('Cần xác nhận điều kiện xếp loại xuất sắc theo quy định áp dụng');
    if (isExcellent && !dto.decisionNote?.trim()) throw new BadRequestException('Ghi căn cứ và minh chứng cho các điều kiện ngoài điểm số trước khi kết luận xuất sắc');
    if (dto.quotaExceptionApproved && (!isExcellent || !dto.exceptionDecisionNo?.trim())) throw new BadRequestException('Ngoại lệ hạn ngạch cần xếp loại xuất sắc và số quyết định của cấp có thẩm quyền');
    if (dto.finalClassification !== scoreClassification && !dto.decisionNote?.trim()) throw new BadRequestException('Ghi căn cứ khi kết luận khác mức xếp loại suy ra từ điểm');
    const decision = await this.prisma.hrmsPublicAppraisalDecision.upsert({
      where: { cycleId_userId: { cycleId: dto.cycleId, userId: dto.userId } },
      create: {
        cycleId: dto.cycleId, userId: dto.userId, orgUnitId: subject.orgUnitId, comparableGroup: dto.comparableGroup.trim(),
        finalClassification: dto.finalClassification as import('@prisma/client').AppraisalClassification,
        excellentCriteriaConfirmed: Boolean(dto.excellentCriteriaConfirmed), quotaExceptionApproved: Boolean(dto.quotaExceptionApproved),
        exceptionDecisionNo: dto.exceptionDecisionNo?.trim() || null, decisionNote: dto.decisionNote?.trim() || null, reviewedById: actor.id,
      },
      update: {
        orgUnitId: subject.orgUnitId, comparableGroup: dto.comparableGroup.trim(), finalClassification: dto.finalClassification as import('@prisma/client').AppraisalClassification,
        excellentCriteriaConfirmed: Boolean(dto.excellentCriteriaConfirmed), quotaExceptionApproved: Boolean(dto.quotaExceptionApproved),
        exceptionDecisionNo: dto.exceptionDecisionNo?.trim() || null, decisionNote: dto.decisionNote?.trim() || null, reviewedById: actor.id,
      },
    });
    await this.audit.log({ actorId: actor.id, action: 'PUBLIC_APPRAISAL_CLASSIFICATION_REVIEWED', entityType: 'HrmsPublicAppraisalDecision', entityId: decision.id, description: `Chốt xếp loại ${decision.finalClassification} trong nhóm nhiệm vụ ${decision.comparableGroup}; ngoại lệ 25%: ${decision.quotaExceptionApproved ? decision.exceptionDecisionNo : 'không áp dụng'}` });
    return decision;
  }

  async deleteCycle(actorId: string, id: string) {
    await this.assertActive(id);
    const [goalCount, reviewCount, competencyCount, developmentPlanCount, publicDecisionCount] = await Promise.all([
      this.prisma.hrmsAppraisalGoal.count({ where: { cycleId: id } }),
      this.prisma.hrmsAppraisalReview.count({ where: { cycleId: id } }),
      this.prisma.hrmsCompetencyAssessment.count({ where: { cycleId: id } }),
      this.prisma.hrmsDevelopmentPlan.count({ where: { cycleId: id } }),
      this.prisma.hrmsPublicAppraisalDecision.count({ where: { cycleId: id } }),
    ]);
    if (goalCount || reviewCount || competencyCount || developmentPlanCount || publicDecisionCount) throw new ConflictException('Không thể xóa kỳ đã có mục tiêu hoặc dữ liệu đánh giá; hãy đóng kỳ để giữ lịch sử');
    const res = await this.prisma.hrmsAppraisalCycle.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE_APPRAISAL_CYCLE',
      targetType: 'HrmsAppraisalCycle',
      targetId: id,
      description: `Xóa kỳ đánh giá ${res.name}`,
    });
    return { success: true };
  }

  async deleteGoal(actorId: string, id: string) {
    const goal = await this.prisma.hrmsAppraisalGoal.findUniqueOrThrow({ where: { id } });
    await this.assertActive(goal.cycleId);
    const res = await this.prisma.hrmsAppraisalGoal.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE_GOAL',
      targetType: 'HrmsAppraisalGoal',
      targetId: id,
      description: `Xóa mục tiêu KRA: ${res.kraTitle}`,
    });
    return { success: true };
  }

  async listGoals(cycleId?: string, userId?: string, actor?: AuthUser) {
    const where: Record<string, unknown> = {};
    if (cycleId) where.cycleId = cycleId;
    if (userId) where.userId = userId;

    if (actor && !actor.roles.some(role=>['ADMIN','KM_MANAGER','HR_TRAINER','HR_CB','BOD'].includes(role))) {
      if (actor.roles.includes('LINE_MANAGER')) {
        const scope = await this.access.reviewScope(actor);
        const users = await this.prisma.user.findMany({where:scope,select:{id:true}});
        where.userId = userId && users.some(u=>u.id===userId) ? userId : {in:users.map(u=>u.id)};
      } else where.userId = actor.id;
    }
    return this.prisma.hrmsAppraisalGoal.findMany({
      where,
      include: {
        cycle: true,
        evidences: { orderBy: { createdAt: 'asc' } },
        assignmentOrgUnit: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addGoalEvidence(actor: AuthUser, goalId: string, dto: CreateKraEvidenceDto) {
    const goal = await this.prisma.hrmsAppraisalGoal.findUniqueOrThrow({ where: { id: goalId } });
    await this.assertActive(goal.cycleId);
    await this.assertSubjectAccess(actor, goal.userId);
    const evidence = await this.prisma.hrmsKraEvidence.create({ data: { goalId, submittedBy: actor.id, ...dto } });
    await this.audit.log({ actorId: actor.id, action: 'APPRAISAL_EVIDENCE_ADDED', entityType: 'HrmsKraEvidence', entityId: evidence.id });
    return evidence;
  }

  async createGoal(actor: AuthUser, dto: CreateGoalDto) {
    if (Boolean(dto.userId) === Boolean(dto.orgUnitId)) throw new BadRequestException('Chọn đúng một phạm vi giao: cá nhân hoặc đơn vị tổ chức');
    const cycle = await this.assertActive(dto.cycleId);
    const goalItems = dto.goals?.length
      ? dto.goals.map(item => ({
        kraTitle: item.kraTitle.trim(),
        description: item.description.trim(),
        weightage: item.weightage ?? dto.weightage ?? 20,
        criteriaGroup: item.criteriaGroup ?? dto.criteriaGroup ?? 'RESULT',
        targetMetric: item.targetMetric.trim(),
      }))
      : dto.kraTitle?.trim() && dto.description?.trim() && dto.targetMetric?.trim()
        ? [{
          kraTitle: dto.kraTitle.trim(), description: dto.description.trim(),
          weightage: dto.weightage ?? 20, criteriaGroup: dto.criteriaGroup ?? 'RESULT', targetMetric: dto.targetMetric.trim(),
        }]
        : [];
    if (!goalItems.length || goalItems.some(item => !item.kraTitle || !item.description || !item.targetMetric)) {
      throw new BadRequestException('Nhập tên mục tiêu, chỉ số đo và mô tả trước khi giao KPI');
    }
    for (const item of goalItems) {
      if (!Number.isFinite(item.weightage) || item.weightage <= 0 || item.weightage > 100) throw new BadRequestException('Trọng số từng KPI phải lớn hơn 0% và không vượt 100%');
      if (!['GENERAL', 'RESULT'].includes(item.criteriaGroup)) throw new BadRequestException('Nhóm tiêu chí không hợp lệ');
      if (cycle.organizationSector === 'enterprise' && item.criteriaGroup !== 'RESULT') throw new BadRequestException('Kỳ doanh nghiệp chỉ dùng trọng số mục tiêu KPI');
    }
    const normalizedBatchKeys = goalItems.map(item => `${item.criteriaGroup}:${item.kraTitle.toLocaleLowerCase('vi')}`);
    if (new Set(normalizedBatchKeys).size !== normalizedBatchKeys.length) throw new BadRequestException('Tên mục tiêu trong cùng một nhóm tiêu chí không được trùng nhau');

    let assignmentOrgUnit: { id: string; name: string; code: string } | null = null;
    let recipients: Array<{ id: string; fullName: string }>;
    if (dto.userId) {
      if (dto.userId === actor.id) throw new BadRequestException('Không thể tự giao KPI cho chính mình; mục tiêu cần được giao và chấm bởi người khác');
      const user = await this.prisma.user.findFirst({
        where: { id: dto.userId, status: 'ACTIVE', deletedAt: null, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
        select: { id: true, fullName: true },
      });
      if (!user) throw new NotFoundException('Nhân viên không còn làm việc hoặc không tồn tại trong hồ sơ HR');
      recipients = [user];
    } else {
      const selectedUnit = await this.prisma.orgUnit.findUnique({ where: { id: dto.orgUnitId! }, select: { id: true, name: true, code: true } });
      if (!selectedUnit) throw new NotFoundException('Không tìm thấy phòng ban hoặc đơn vị được chọn');
      assignmentOrgUnit = selectedUnit;

      // OrgUnit.path is a materialized ancestor path and omits the current node on older rows;
      // walk parent links so both existing and newly created branches include all descendants.
      const allUnits = await this.prisma.orgUnit.findMany({ select: { id: true, parentId: true } });
      const unitIds = new Set([selectedUnit.id]);
      const restrictedManager = actor.roles.includes('LINE_MANAGER')
        && !actor.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD'].includes(role));
      if (!restrictedManager) {
        let frontier = [selectedUnit.id];
        while (frontier.length) {
          const children = allUnits.filter(unit => unit.parentId && frontier.includes(unit.parentId) && !unitIds.has(unit.id));
          frontier = children.map(unit => unit.id);
          for (const child of children) unitIds.add(child.id);
        }
      }
      recipients = await this.prisma.user.findMany({
        where: {
          orgUnitId: { in: [...unitIds] }, status: 'ACTIVE', deletedAt: null,
          employmentStatus: { in: ['ACTIVE', 'PROBATION'] },
        },
        select: { id: true, fullName: true },
        orderBy: [{ employeeCode: 'asc' }, { fullName: 'asc' }],
      });
      recipients = recipients.filter(user => user.id !== actor.id);
      if (!recipients.length) throw new BadRequestException('Đơn vị này chưa có nhân sự đang làm việc để nhận mục tiêu');
    }

    if (actor.roles.includes('LINE_MANAGER')) {
      for (const user of recipients) await this.access.assertReviewer(actor, user.id);
    }

    const recipientIds = recipients.map(user => user.id);
    const createdCount = await this.prisma.$transaction(async tx => {
      const existing = await tx.hrmsAppraisalGoal.findMany({
        where: { cycleId: dto.cycleId, userId: { in: recipientIds } },
        select: { userId: true, kraTitle: true, weightage: true, criteriaGroup: true },
      });
      const existingByUserGroup = new Map<string, number>();
      const existingTitles = new Set<string>();
      for (const goal of existing) {
        const groupKey = `${goal.userId}:${goal.criteriaGroup}`;
        existingByUserGroup.set(groupKey, (existingByUserGroup.get(groupKey) ?? 0) + goal.weightage);
        existingTitles.add(`${groupKey}:${goal.kraTitle.trim().toLocaleLowerCase('vi')}`);
      }
      const overLimit = recipients.find(user => {
        for (const criteriaGroup of new Set(goalItems.map(item => item.criteriaGroup))) {
          const assignedWeight = goalItems.filter(item => item.criteriaGroup === criteriaGroup).reduce((sum, item) => sum + item.weightage, 0);
          if ((existingByUserGroup.get(`${user.id}:${criteriaGroup}`) ?? 0) + assignedWeight > 100.001) return true;
        }
        return false;
      });
      if (overLimit) throw new BadRequestException(`Tổng trọng số của ${overLimit.fullName} sẽ vượt 100%; hãy rà soát KPI đã giao trong kỳ`);
      for (const user of recipients) {
        for (const item of goalItems) {
          if (existingTitles.has(`${user.id}:${item.criteriaGroup}:${item.kraTitle.toLocaleLowerCase('vi')}`)) {
            throw new ConflictException(`Mục tiêu “${item.kraTitle}” đã được giao cho ${user.fullName} trong kỳ; hãy kiểm tra trước khi giao lại`);
          }
        }
      }

      const goals = await tx.hrmsAppraisalGoal.createMany({
        data: recipients.flatMap(user => goalItems.map(item => ({
          cycleId: dto.cycleId,
          userId: user.id,
          employeeName: user.fullName,
          kraTitle: item.kraTitle,
          description: item.description,
          weightage: item.weightage,
          criteriaGroup: item.criteriaGroup,
          targetMetric: item.targetMetric,
          assignmentScope: assignmentOrgUnit ? 'ORG_UNIT' : 'INDIVIDUAL',
          assignmentOrgUnitId: assignmentOrgUnit?.id ?? null,
          assignmentOrgUnitName: assignmentOrgUnit?.name ?? null,
          assignmentOrgUnitCode: assignmentOrgUnit?.code ?? null,
        }))),
      });
      const packageSummary = goalItems.map(item => `${item.kraTitle} (${item.weightage}%)`).join('; ');
      await tx.notification.createMany({
        data: recipients.map(user => ({
          userId: user.id,
          type: 'GENERIC',
          title: goalItems.length === 1 ? 'Bạn có mục tiêu KPI mới' : `Bạn có ${goalItems.length} mục tiêu KPI mới`,
          body: `${cycle.name}: ${packageSummary}${assignmentOrgUnit ? ` · giao theo ${assignmentOrgUnit.name}` : ''}. Hãy xem chỉ số, thống nhất cách đo và cập nhật kết quả cùng minh chứng trong kỳ.`,
          linkPath: `/performance?tab=goals&cycleId=${encodeURIComponent(cycle.id)}`,
        })),
      });
      return goals.count;
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId: actor.id,
      action: assignmentOrgUnit ? 'CREATE_ORG_UNIT_KPI_ASSIGNMENT' : 'CREATE_GOAL',
      targetType: 'HrmsAppraisalGoal',
      targetId: null,
      description: assignmentOrgUnit
        ? `Giao ${goalItems.length} KPI theo đơn vị ${assignmentOrgUnit.name} (${assignmentOrgUnit.code}) cho ${recipients.length} nhân sự (${createdCount} mục tiêu cá nhân); đã gửi thông báo in-app cho từng người.`
        : `Thiết lập ${goalItems.length} KPI cho nhân viên ${recipients[0].fullName}; đã tạo thông báo in-app.`,
    });
    return {
      createdCount,
      recipientCount: recipients.length,
      assignmentScope: assignmentOrgUnit ? 'ORG_UNIT' : 'INDIVIDUAL',
      assignmentOrgUnit,
      cycleId: cycle.id,
      kraTitles: goalItems.map(item => item.kraTitle),
    };
  }

  async scoreGoal(actor: AuthUser, id: string, managerScore?: number) {
    const goal = await this.prisma.hrmsAppraisalGoal.findUniqueOrThrow({ where: { id } });
    const cycle = await this.assertActive(goal.cycleId);
    if (managerScore === undefined || !Number.isFinite(managerScore) || managerScore < 0 || managerScore > 100) throw new BadRequestException('Điểm KPI phải trong 0–100');
    await this.access.assertReviewer(actor, goal.userId);
    if (cycle.organizationSector === 'enterprise') {
      const evidenceCount = await this.prisma.hrmsKraEvidence.count({ where: { goalId: id } });
      if (evidenceCount === 0) throw new ConflictException('Cần ghi kết quả thực tế và ít nhất một minh chứng trước khi chấm KPI');
    }
    await this.prisma.hrmsAppraisalGoal.update({ where: { id }, data: { managerScore } });
    await this.recompute(goal.cycleId, goal.userId);
    await this.audit.log({ actorId: actor.id, action: 'APPRAISAL_SCORED', entityType: 'HrmsAppraisalGoal', entityId: id });
    return this.prisma.hrmsAppraisalGoal.findUniqueOrThrow({ where: { id } });
  }

  /** Đồng bộ kết quả đánh giá cuối kỳ vào hồ sơ cán bộ (QT ĐGCB - Mẫu 2C-BNV / Doanh nghiệp) */
  async syncToPersonnelAppraisal(
    actorId: string,
    dto: {
      userId: string;
      year: number;
      comment?: string;
      decisionNo?: string;
    },
  ) {
    const cycle = await this.prisma.hrmsAppraisalCycle.findFirst({ where: { year: dto.year, status: 'COMPLETED', organizationSector: 'state' }, orderBy: { endDate: 'desc' } });
    if (!cycle) throw new ConflictException('Chỉ kỳ đánh giá khu vực nhà nước đã khóa mới đồng bộ vào hồ sơ xếp loại; KPI doanh nghiệp không đồng bộ sang hồ sơ công vụ hoặc P3');
    const summary = await this.summary(cycle.id, dto.userId);
    if (!summary.complete || !summary.classification || !('finalDecision' in summary) || !summary.finalDecision) throw new ConflictException('Chưa đủ điểm hoặc chưa lưu kết luận hiệu chuẩn của cấp có thẩm quyền');
    const appraisal = await this.prisma.$transaction(async tx => {
      const profile = await tx.personnelComprehensiveProfile.upsert({ where: { userId: dto.userId }, create: { userId: dto.userId }, update: {} });
      const prior = await tx.personnelAppraisal.findFirst({ where: { profileId: profile.id, year: dto.year } });
      const legalBasis = cycle.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'NĐ 233/2026/NĐ-CP' : 'NĐ 335/2025/NĐ-CP';
      const data = { classification: summary.classification!, comment: `${dto.comment ?? ''} [Kỳ ${cycle.id}; điểm ${summary.score}; tiêu chí chung ${cycle.generalCriteriaWeight}% + kết quả nhiệm vụ ${cycle.taskCriteriaWeight}%; căn cứ ${legalBasis}]`, decisionNo: dto.decisionNo };
      return prior ? tx.personnelAppraisal.update({ where: { id: prior.id }, data }) : tx.personnelAppraisal.create({ data: { profileId: profile.id, year: dto.year, ...data } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'SYNC_APPRAISAL_TO_PROFILE',
      targetType: 'PersonnelAppraisal',
      targetId: appraisal.id,
      description: `Đồng bộ đánh giá năm ${dto.year} (${summary.classification}) vào Hồ sơ cán bộ ID ${dto.userId}`,
    });

    return appraisal;
  }

}

@ApiTags('HRMS - KPI Appraisal')
@ApiBearerAuth()
@Controller('hrms/performance')
@Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD')
export class HrmsPerformanceController {
  constructor(private readonly service: HrmsPerformanceService) {}

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER', 'ACCOUNTANT', 'HR_RECRUITER')
  @Get('cycles')
  listCycles() {
    return this.service.listCycles();
  }

  @Post('cycles')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD')
  createCycle(@Body() dto: CreateCycleDto, @CurrentUser() actor: AuthUser) {
    return this.service.createCycle(actor.id, dto);
  }

  @Patch('cycles/:id')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD')
  updateCycle(
    @Param('id') id: string,
    @Body() dto: { name?: string; status?: string; description?: string }, @CurrentUser() actor: AuthUser) {
    return this.service.updateCycle(actor.id, id, dto);
  }

  @Delete('cycles/:id')
  @Roles('ADMIN', 'KM_MANAGER')
  deleteCycle(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteCycle(actor.id, id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER', 'ACCOUNTANT', 'HR_RECRUITER')
  @Get('goals')
  listGoals(@CurrentUser() actor: AuthUser, @Query('cycleId') cycleId?: string, @Query('userId') userId?: string) {
    return this.service.listGoals(cycleId,userId,actor);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Post('goals/:id/evidence')
  addGoalEvidence(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: CreateKraEvidenceDto) {
    return this.service.addGoalEvidence(actor, id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Post('goals')
  createGoal(@Body() dto: CreateGoalDto, @CurrentUser() actor: AuthUser) {
    return this.service.createGoal(actor, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Patch('goals/:id/score')
  scoreGoal(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body('managerScore') managerScore?: number) {
    return this.service.scoreGoal(actor, id, managerScore);
  }

  @Delete('goals/:id')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'BOD')
  deleteGoal(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteGoal(actor.id, id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD')
  @Get('public-decisions')
  listPublicDecisions(@Query('cycleId') cycleId: string) {
    return this.service.listPublicDecisions(cycleId);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'BOD')
  @Post('public-decisions')
  savePublicDecision(@CurrentUser() actor: AuthUser, @Body() dto: PublicAppraisalDecisionDto) {
    return this.service.savePublicDecision(actor, dto);
  }

  @Post('sync-appraisal')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  syncAppraisal(
    @Body()
    dto: {
      userId: string;
      year: number;
      comment?: string;
      decisionNo?: string;
    }, @CurrentUser() actor: AuthUser) {
    return this.service.syncToPersonnelAppraisal(actor.id, dto);
  }
}

@Module({
  controllers: [HrmsPerformanceController],
  providers: [HrmsPerformanceService],
  exports: [HrmsPerformanceService],
})
export class HrmsPerformanceModule {}

