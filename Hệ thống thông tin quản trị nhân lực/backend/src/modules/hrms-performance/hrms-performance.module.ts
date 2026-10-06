import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { HrAccessService } from '../../common/services/hr-access.service';
import { dateKey, workDate } from '../../common/hr-time';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';

export class CreateCycleDto {
  @ApiProperty({ example: 'Đánh giá Hiệu suất Toàn diện 2026' })
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

export class CreateGoalDto {
  @ApiProperty()
  @IsString()
  cycleId: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiProperty({ example: 'Nâng cao chất lượng kiến trúc hệ thống' })
  @IsString()
  kraTitle: string;

  @ApiProperty({ example: 'Đảm bảo thời gian phản hồi API sub-100ms và độ bao phủ kiểm thử > 90%' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ default: 25 })
  @IsOptional()
  @IsNumber()
  weightage?: number;

  @ApiPropertyOptional({ enum: ['GENERAL', 'RESULT'], default: 'RESULT', description: 'Khu vực nhà nước: tiêu chí chung hoặc kết quả nhiệm vụ; doanh nghiệp chỉ dùng kết quả KPI.' })
  @IsOptional()
  @IsIn(['GENERAL', 'RESULT'])
  criteriaGroup?: string;

  @ApiProperty({ example: 'Đạt SLA 99.9%' })
  @IsString()
  targetMetric: string;
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

export class CreateReview360Dto {
  @ApiProperty()
  @IsString()
  cycleId: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Trần Minh Quang (Tech Lead)' })
  @IsString()
  reviewerName: string;

  @ApiProperty({ enum: ['MANAGER', 'PEER', 'SUBORDINATE'] })
  @IsIn(['MANAGER', 'PEER', 'SUBORDINATE'])
  relationship: string;

  @ApiProperty({ example: 4.8 })
  @IsNumber()
  rating: number;

  @ApiProperty({ example: 'Nhân sự có tinh thần trách nhiệm cao, năng lực chuyên môn vững vàng, dẫn dắt đội ngũ tốt.' })
  @IsString()
  feedback: string;
}

export class CreateKraEvidenceDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(2000) description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) metricValue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) evidenceUrl?: string;
}

export class CreateCompetencyAssessmentDto {
  @ApiProperty() @IsString() cycleId!: string;
  @ApiProperty() @IsString() userId!: string;
  @ApiProperty() @IsString() @MaxLength(80) competencyCode!: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) currentLevel!: number;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @IsInt() @Min(1) @Max(5) targetLevel?: number;
  @ApiProperty({ minLength: 20, maxLength: 2000, description: 'Ví dụ thực tế, kết quả và bối cảnh làm căn cứ tự đánh giá' }) @IsString() @MinLength(20) @MaxLength(2000) selfNotes!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) evidenceUrl?: string;
}

export class CreateCompetencyStandardDto {
  @ApiProperty({ example: 'CUSTOMER_SERVICE' }) @IsString() @Matches(/^[A-Z0-9][A-Z0-9_.-]{1,79}$/) code!: string;
  @ApiProperty({ example: 'Phục vụ khách hàng' }) @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @ApiProperty() @IsString() @MinLength(10) @MaxLength(2000) description!: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) applicableJobTitles?: string[];
  @ApiProperty({ type: [String], minItems: 5, maxItems: 5, description: 'Mô tả hành vi quan sát được tương ứng mức 1 đến 5' }) @IsArray() @ArrayMinSize(5) @ArrayMaxSize(5) @IsString({ each: true }) @MinLength(10, { each: true }) @MaxLength(500, { each: true }) behavioralAnchors!: string[];
}

export class ReviewCompetencyDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) managerLevel!: number;
  @ApiProperty({ minLength: 20, maxLength: 2000 }) @IsString() @MinLength(20) @MaxLength(2000) managerNotes!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) managerEvidenceUrl?: string;
}

export class CreateDevelopmentPlanDto {
  @ApiProperty() @IsString() cycleId!: string;
  @ApiProperty() @IsString() userId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assessmentId?: string;
  @ApiProperty() @IsString() @MaxLength(80) competencyCode!: string;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(2000) objective!: string;
  @ApiProperty() @IsString() @MinLength(5) @MaxLength(2000) successCriteria!: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) actions!: string[];
  @ApiProperty() @IsDateString() dueDate!: string;
}

export class UpdateDevelopmentPlanDto {
  @ApiPropertyOptional({ enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'] }) @IsOptional() @IsIn(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) evidenceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) evidenceNote?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @IsInt() @Min(1) @Max(5) resultLevel?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) employeeNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) managerNotes?: string;
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
        await this.prisma.hrmsAppraisalGoal.update({ where: { id: goal.id }, data: { finalScore, status: finalScore !== null ? 'APPROVED' : 'SUBMITTED' } });
      }
      return;
    }
    const [subjectManagerRole, reviews] = await Promise.all([
      this.prisma.userRole.findFirst({ where: { userId, roleCode: 'LINE_MANAGER' }, select: { userId: true } }),
      this.prisma.hrmsAppraisalReview.findMany({ where: { cycleId, userId, relationship: { in: ['PEER', 'SUBORDINATE'] }, reviewerId: { not: null } } }),
    ]);
    const averageScore = (relationship: string) => {
      const rows = reviews.filter(review => review.relationship === relationship);
      return rows.length ? rows.reduce((sum, review) => sum + review.rating * 20, 0) / rows.length : null;
    };
    const peerScore = averageScore('PEER');
    const subordinateScore = averageScore('SUBORDINATE');
    const isManager = Boolean(subjectManagerRole);
    const goals = await this.prisma.hrmsAppraisalGoal.findMany({ where: { cycleId, userId } });
    for (const goal of goals) {
      const managerPeerWeight = isManager ? cycle.peerWeight - cycle.subordinateWeight : cycle.peerWeight;
      const finalScore = goal.selfScore !== null && goal.managerScore !== null && peerScore !== null && (!isManager || subordinateScore !== null)
        ? Math.round((goal.selfScore * cycle.selfWeight / 100 + peerScore * managerPeerWeight / 100 + goal.managerScore * cycle.managerWeight / 100 + (isManager ? subordinateScore! * cycle.subordinateWeight / 100 : 0)) * 100) / 100
        : null;
      await this.prisma.hrmsAppraisalGoal.update({ where: { id: goal.id }, data: { finalScore, status: finalScore !== null ? 'APPROVED' : 'SUBMITTED' } });
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
    if (Math.abs(weight - 100) > .001 || !goals.length || goals.some(goal => goal.finalScore === null)) return { complete: false, weight, score: null, classification: null };
    const score = Math.round(goals.reduce((sum, goal) => sum + goal.finalScore! * goal.weightage / 100, 0) * 100) / 100;
    const classification: import('@prisma/client').AppraisalClassification = score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : score >= 50 ? 'SATISFACTORY' : 'UNSATISFACTORY';
    return { complete: true, weight, score, classification, framework: 'ENTERPRISE_360' };
  }

  async listCycles() {
    return this.prisma.hrmsAppraisalCycle.findMany({
      include: {
        _count: { select: { goals: true, reviews: true } },
      },
      orderBy: { year: 'desc' },
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
        selfWeight: organizationSector === 'enterprise' ? 20 : 0,
        peerWeight: organizationSector === 'enterprise' ? 30 : 0,
        managerWeight: organizationSector === 'enterprise' ? 50 : 100,
        subordinateWeight: organizationSector === 'enterprise' ? 10 : 0,
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
    const [goalCount, reviewCount] = await Promise.all([
      this.prisma.hrmsAppraisalGoal.count({ where: { cycleId: id } }),
      this.prisma.hrmsAppraisalReview.count({ where: { cycleId: id } }),
    ]);
    if (goalCount || reviewCount) throw new ConflictException('Không thể xóa kỳ đã phát sinh mục tiêu hoặc phản hồi; hãy đóng kỳ và giữ lịch sử đánh giá');
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

  async deleteReview(actorId: string, id: string) {
    const review = await this.prisma.hrmsAppraisalReview.findUniqueOrThrow({ where: { id } });
    await this.assertActive(review.cycleId);
    await this.prisma.hrmsAppraisalReview.delete({ where: { id } });
    await this.recompute(review.cycleId, review.userId);
    await this.audit.log({
      actorId,
      action: 'DELETE_REVIEW_360',
      targetType: 'HrmsAppraisalReview',
      targetId: id,
      description: `Xóa phản hồi 360 độ ID: ${id}`,
    });
    return { success: true };
  }
  async listGoals(cycleId?: string, userId?: string, actor?: AuthUser) {
    const where: Record<string, unknown> = {};
    if (cycleId) where.cycleId = cycleId;
    if (userId) where.userId = userId;

    if (actor && !actor.roles.some(role=>['ADMIN','KM_MANAGER','HR_TRAINER','BOD'].includes(role))) {
      if (actor.roles.includes('LINE_MANAGER')) {
        const scope = await this.access.reviewScope(actor);
        const users = await this.prisma.user.findMany({where:scope,select:{id:true}});
        where.userId = userId && users.some(u=>u.id===userId) ? userId : {in:users.map(u=>u.id)};
      } else where.userId = actor.id;
    }
    return this.prisma.hrmsAppraisalGoal.findMany({
      where,
      include: { cycle: true, evidences: { orderBy: { createdAt: 'asc' } } },
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

  async listCompetencies(actor: AuthUser, userId = actor.id, cycleId?: string) {
    await this.assertSubjectAccess(actor, userId);
    return this.prisma.hrmsCompetencyAssessment.findMany({
      where: { userId, ...(cycleId ? { cycleId } : {}) },
      include: { cycle: { select: { id: true, name: true, year: true, startDate: true, endDate: true, status: true } }, developmentPlans: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listCompetencyStandards() {
    return this.prisma.hrmsCompetencyStandard.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createCompetencyStandard(actor: AuthUser, dto: CreateCompetencyStandardDto) {
    const anchors = dto.behavioralAnchors.map(anchor => anchor.trim());
    if (anchors.some(anchor => anchor.length < 10)) throw new BadRequestException('Mỗi mức cần mô tả hành vi cụ thể');
    const titles = (dto.applicableJobTitles ?? []).map(title => title.trim()).filter(Boolean);
    if (new Set(titles.map(title => title.toLocaleLowerCase('vi'))).size !== titles.length) throw new BadRequestException('Chức danh áp dụng không được lặp');
    const standard = await this.prisma.hrmsCompetencyStandard.create({ data: {
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description.trim(),
      applicableJobTitles: titles,
      behavioralAnchors: anchors as unknown as import('@prisma/client').Prisma.InputJsonValue,
      createdById: actor.id,
    } });
    await this.audit.log({ actorId: actor.id, action: 'COMPETENCY_STANDARD_CREATED', entityType: 'HrmsCompetencyStandard', entityId: standard.id });
    return standard;
  }

  async deactivateCompetencyStandard(actor: AuthUser, id: string) {
    const standard = await this.prisma.hrmsCompetencyStandard.findUnique({ where: { id } });
    if (!standard) throw new NotFoundException('Không tìm thấy chuẩn năng lực');
    if (!standard.isActive) throw new ConflictException('Chuẩn năng lực đã ngừng áp dụng');
    const updated = await this.prisma.hrmsCompetencyStandard.update({ where: { id }, data: { isActive: false } });
    await this.audit.log({ actorId: actor.id, action: 'COMPETENCY_STANDARD_DEACTIVATED', entityType: 'HrmsCompetencyStandard', entityId: id });
    return updated;
  }

  async assessCompetency(actor: AuthUser, dto: CreateCompetencyAssessmentDto) {
    await this.assertActive(dto.cycleId);
    if (actor.id !== dto.userId) throw new ForbiddenException('Nhân viên tự ghi nhận phần tự đánh giá; quản lý dùng bước thẩm định riêng');
    const standard = await this.prisma.hrmsCompetencyStandard.findUnique({ where: { code: dto.competencyCode.toUpperCase() } });
    if (!standard || !standard.isActive) throw new BadRequestException('Chọn một chuẩn năng lực đang áp dụng');
    const subject = await this.prisma.user.findUniqueOrThrow({ where: { id: dto.userId }, select: { jobTitle: true } });
    if (standard.applicableJobTitles.length && (!subject.jobTitle || !standard.applicableJobTitles.some(title => title.toLocaleLowerCase('vi') === subject.jobTitle?.trim().toLocaleLowerCase('vi')))) {
      throw new BadRequestException('Chuẩn năng lực này không áp dụng cho chức danh của nhân viên');
    }
    if (dto.selfNotes.trim().length < 20) throw new BadRequestException('Nêu ít nhất một ví dụ công việc cụ thể làm căn cứ đánh giá');
    if (dto.targetLevel !== undefined && dto.targetLevel < dto.currentLevel) throw new BadRequestException('Mức mục tiêu không được thấp hơn mức hiện tại');
    const where = { cycleId_userId_competencyCode: { cycleId: dto.cycleId, userId: dto.userId, competencyCode: standard.code } };
    const existing = await this.prisma.hrmsCompetencyAssessment.findUnique({ where });
    if (existing?.status === 'MANAGER_REVIEWED') throw new ConflictException('Đã được quản lý thẩm định; không thể sửa tự đánh giá trong kỳ đã thẩm định');
    const row = await this.prisma.hrmsCompetencyAssessment.upsert({
      where,
      create: { cycleId: dto.cycleId, userId: dto.userId, competencyCode: standard.code, competencyName: standard.name, currentLevel: dto.currentLevel, targetLevel: dto.targetLevel, selfNotes: dto.selfNotes.trim(), evidenceUrl: dto.evidenceUrl?.trim() || null, assessedBy: actor.id, status: 'SELF_SUBMITTED' },
      update: { competencyName: standard.name, currentLevel: dto.currentLevel, targetLevel: dto.targetLevel, selfNotes: dto.selfNotes.trim(), evidenceUrl: dto.evidenceUrl?.trim() || null, assessedBy: actor.id },
    });
    await this.audit.log({ actorId: actor.id, action: 'COMPETENCY_ASSESSED', entityType: 'HrmsCompetencyAssessment', entityId: row.id });
    return row;
  }

  async reviewCompetency(actor: AuthUser, id: string, dto: ReviewCompetencyDto) {
    const assessment = await this.prisma.hrmsCompetencyAssessment.findUniqueOrThrow({ where: { id } });
    await this.assertActive(assessment.cycleId);
    await this.access.assertReviewer(actor, assessment.userId);
    if (assessment.status === 'MANAGER_REVIEWED' && assessment.managerAssessedBy !== actor.id) throw new ConflictException('Đánh giá đã được một quản lý khác thẩm định; cần trao đổi với HR để hiệu chỉnh');
    if (dto.managerNotes.trim().length < 20) throw new BadRequestException('Ghi rõ căn cứ và ví dụ quan sát được trước khi thẩm định');
    const reviewed = await this.prisma.hrmsCompetencyAssessment.update({ where: { id }, data: {
      managerLevel: dto.managerLevel,
      managerNotes: dto.managerNotes.trim(),
      managerEvidenceUrl: dto.managerEvidenceUrl?.trim() || null,
      managerAssessedBy: actor.id,
      managerAssessedAt: new Date(),
      status: 'MANAGER_REVIEWED',
    } });
    await this.audit.log({ actorId: actor.id, action: 'COMPETENCY_MANAGER_REVIEWED', entityType: 'HrmsCompetencyAssessment', entityId: id });
    return reviewed;
  }

  async listDevelopmentPlans(actor: AuthUser, userId = actor.id, cycleId?: string) {
    await this.assertSubjectAccess(actor, userId);
    return this.prisma.hrmsDevelopmentPlan.findMany({
      where: { userId, ...(cycleId ? { cycleId } : {}) },
      include: { cycle: { select: { id: true, name: true, year: true, startDate: true, endDate: true, status: true } } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createDevelopmentPlan(actor: AuthUser, dto: CreateDevelopmentPlanDto) {
    await this.assertActive(dto.cycleId);
    await this.assertSubjectAccess(actor, dto.userId);
    if (dateKey(dto.dueDate) < workDate()) throw new BadRequestException('Hạn hoàn thành không được ở quá khứ');
    if (dto.assessmentId) {
      const assessment = await this.prisma.hrmsCompetencyAssessment.findUniqueOrThrow({ where: { id: dto.assessmentId } });
      if (assessment.userId !== dto.userId || assessment.cycleId !== dto.cycleId || assessment.competencyCode !== dto.competencyCode) throw new BadRequestException('Đánh giá năng lực phải khớp nhân viên, kỳ và năng lực của kế hoạch');
    }
    const plan = await this.prisma.hrmsDevelopmentPlan.create({
      data: { ...dto, dueDate: dateKey(dto.dueDate), actions: dto.actions as unknown as import('@prisma/client').Prisma.InputJsonValue, createdBy: actor.id },
    });
    await this.audit.log({ actorId: actor.id, action: 'DEVELOPMENT_PLAN_CREATED', entityType: 'HrmsDevelopmentPlan', entityId: plan.id });
    return plan;
  }

  async updateDevelopmentPlan(actor: AuthUser, id: string, dto: UpdateDevelopmentPlanDto) {
    return this.prisma.$transaction(async tx => {
      const plan = await tx.hrmsDevelopmentPlan.findUniqueOrThrow({ where: { id } });
      await this.assertActive(plan.cycleId);
      await this.assertSubjectAccess(actor, plan.userId);
      const isManager = actor.id !== plan.userId;
      if (!isManager && (dto.managerNotes !== undefined || dto.resultLevel !== undefined || ['COMPLETED','CANCELLED'].includes(dto.status ?? ''))) throw new ForbiddenException('Chỉ quản lý mới được kết luận kết quả kế hoạch');
      const transitions: Record<string, string[]> = { PROPOSED: ['IN_PROGRESS', 'CANCELLED'], IN_PROGRESS: ['COMPLETED', 'CANCELLED'] };
      if (dto.status && !transitions[plan.status]?.includes(dto.status)) throw new ConflictException('Không thể chuyển lùi hoặc thay đổi trạng thái kế hoạch đã kết thúc');
      if (dto.evidenceUrl && !['PROPOSED', 'IN_PROGRESS'].includes(plan.status)) throw new ConflictException('Không thể bổ sung minh chứng cho kế hoạch đã kết thúc');
      if (dto.status === 'COMPLETED' && dto.resultLevel === undefined && plan.resultLevel === null) throw new BadRequestException('Cần đánh giá mức năng lực sau cải thiện');
      if (dto.evidenceUrl !== undefined && !dto.evidenceUrl.trim()) throw new BadRequestException('Đường dẫn minh chứng không hợp lệ');
      const evidence = Array.isArray(plan.evidence) ? [...plan.evidence] : [];
      if (dto.evidenceUrl) evidence.push({ url: dto.evidenceUrl, note: dto.evidenceNote ?? '', submittedBy: actor.id, submittedAt: new Date().toISOString() });
      const updated = await tx.hrmsDevelopmentPlan.update({ where: { id }, data: {
        status: dto.status,
        evidence: evidence as import('@prisma/client').Prisma.InputJsonValue,
        resultLevel: dto.resultLevel,
        employeeNotes: dto.employeeNotes,
        managerNotes: isManager ? dto.managerNotes : undefined,
        reviewedBy: isManager && dto.status ? actor.id : undefined,
        completedAt: dto.status === 'COMPLETED' ? new Date() : undefined,
      } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'DEVELOPMENT_PLAN_UPDATED', entityType: 'HrmsDevelopmentPlan', entityId: id, afterData: { status: updated.status, resultLevel: updated.resultLevel, evidenceCount: evidence.length } } });
      return updated;
    }, { isolationLevel: 'Serializable' });
  }

  async createGoal(actor: AuthUser, dto: CreateGoalDto) {
    if (actor.roles.includes('LINE_MANAGER')) await this.access.assertReviewer(actor, dto.userId);
    const cycle = await this.assertActive(dto.cycleId);
    const criteriaGroup = dto.criteriaGroup ?? 'RESULT';
    if (cycle.organizationSector === 'enterprise' && criteriaGroup !== 'RESULT') throw new BadRequestException('Kỳ doanh nghiệp chỉ dùng trọng số mục tiêu KPI');
    const groupFilter = cycle.organizationSector === 'state' ? { criteriaGroup } : {};
    const total = await this.prisma.hrmsAppraisalGoal.aggregate({ where: { cycleId: dto.cycleId, userId: dto.userId, ...groupFilter }, _sum: { weightage: true } });
    if ((dto.weightage ?? 20) <= 0 || (total._sum.weightage ?? 0) + (dto.weightage ?? 20) > 100) throw new BadRequestException('Trọng số trong nhóm tiêu chí phải dương và không vượt 100%');
    const res = await this.prisma.hrmsAppraisalGoal.create({
      data: {
        cycleId: dto.cycleId,
        userId: dto.userId,
        employeeName: dto.employeeName,
        kraTitle: dto.kraTitle,
        description: dto.description,
        weightage: dto.weightage ?? 20,
        criteriaGroup,
        targetMetric: dto.targetMetric,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'CREATE_GOAL',
      targetType: 'HrmsAppraisalGoal',
      targetId: res.id,
      description: `Thiết lập mục tiêu KRA [${dto.kraTitle}] cho nhân viên ${dto.employeeName}`,
    });
    return res;
  }

  async scoreGoal(actor: AuthUser, id: string, selfScore?: number, managerScore?: number) {
    const goal = await this.prisma.hrmsAppraisalGoal.findUniqueOrThrow({ where: { id } });
    await this.assertActive(goal.cycleId);
    if ([selfScore, managerScore].some(score => score !== undefined && (!Number.isFinite(score) || score < 0 || score > 100))) throw new BadRequestException('Điểm phải trong 0–100');
    if (selfScore !== undefined && actor.id !== goal.userId) throw new ForbiddenException('Điểm tự chấm phải do chính nhân viên nhập');
    if (managerScore !== undefined) await this.access.assertReviewer(actor, goal.userId);
    await this.prisma.hrmsAppraisalGoal.update({ where: { id }, data: { selfScore, managerScore } });
    await this.recompute(goal.cycleId, goal.userId);
    await this.audit.log({ actorId: actor.id, action: 'APPRAISAL_SCORED', entityType: 'HrmsAppraisalGoal', entityId: id });
    return this.prisma.hrmsAppraisalGoal.findUniqueOrThrow({ where: { id } });
  }

  async listReviews(cycleId?: string, userId?: string, actor?: AuthUser) {
    const where: Record<string, unknown> = {};
    if (cycleId) where.cycleId = cycleId;
    if (userId) where.userId = userId;

    if (actor && !actor.roles.some(role=>['ADMIN','KM_MANAGER','HR_TRAINER','BOD'].includes(role))) {
      if (actor.roles.includes('LINE_MANAGER')) {
        const scope = await this.access.reviewScope(actor);
        const users = await this.prisma.user.findMany({where:scope,select:{id:true}});
        where.userId = userId && users.some(u=>u.id===userId) ? userId : {in:users.map(u=>u.id)};
      } else where.userId = actor.id;
    }
    const rows = await this.prisma.hrmsAppraisalReview.findMany({
      where,
      include: { cycle: true },
      orderBy: { submittedAt: 'desc' },
    });
    const privileged = actor?.roles.some(role=>['ADMIN','KM_MANAGER','HR_TRAINER','BOD','LINE_MANAGER'].includes(role));
    return rows.map(row=>!privileged&&row.relationship==='PEER'?{...row,reviewerId:null,reviewerName:'Đồng nghiệp (ẩn danh)'}:row);
  }

  async addReview360(actor: AuthUser, dto: CreateReview360Dto) {
    const cycle = await this.assertActive(dto.cycleId);
    if (cycle.organizationSector === 'state') throw new BadRequestException('Kỳ công chức/viên chức dùng khung tiêu chí 30/70; không nhận điểm 360 thay cho đánh giá theo nhiệm vụ');
    if (!['MANAGER', 'PEER', 'SUBORDINATE'].includes(dto.relationship) || !Number.isFinite(dto.rating) || dto.rating < 0 || dto.rating > 5) throw new BadRequestException('Nguồn đánh giá phải MANAGER/PEER/SUBORDINATE, điểm trong 0–5');
    if (dto.relationship === 'SELF' && actor.id !== dto.userId) throw new ForbiddenException('Không được tự chấm thay người khác');
    if (dto.relationship === 'MANAGER') await this.access.assertReviewer(actor, dto.userId);
    if (dto.relationship === 'PEER') {
      if (actor.id === dto.userId) throw new ForbiddenException('Không được đánh giá chéo chính mình');
      const users = await this.prisma.user.findMany({ where: { id: { in: [actor.id, dto.userId] } }, select: { id: true, orgUnitId: true } });
      if (users.length !== 2 || !users[0].orgUnitId || users[0].orgUnitId !== users[1].orgUnitId) throw new ForbiddenException('Đánh giá chéo trong cùng bộ phận');
    }
    if (dto.relationship === 'SUBORDINATE') {
      if (actor.id === dto.userId) throw new ForbiddenException('Không được đánh giá chính mình');
      const [targetManagerRole, users, reviewerManagerRole] = await Promise.all([
        this.prisma.userRole.findFirst({ where: { userId: dto.userId, roleCode: 'LINE_MANAGER' }, select: { userId: true } }),
        this.prisma.user.findMany({ where: { id: { in: [actor.id, dto.userId] } }, select: { id: true, orgUnitId: true } }),
        this.prisma.userRole.findFirst({ where: { userId: actor.id, roleCode: 'LINE_MANAGER' }, select: { userId: true } }),
      ]);
      if (!targetManagerRole || reviewerManagerRole || users.length !== 2 || !users[0].orgUnitId || users[0].orgUnitId !== users[1].orgUnitId) throw new ForbiddenException('Phản hồi cấp dưới chỉ dành cho nhân viên cùng bộ phận đánh giá quản lý trực tiếp');
    }
    const res = await this.prisma.hrmsAppraisalReview.upsert({ where: { cycleId_userId_reviewerId: { cycleId: dto.cycleId, userId: dto.userId, reviewerId: actor.id } }, create: { ...dto, reviewerId: actor.id, reviewerName: actor.fullName ?? actor.email }, update: { relationship: dto.relationship, rating: dto.rating, feedback: dto.feedback, submittedAt: new Date() } });
    await this.recompute(dto.cycleId, dto.userId);
    await this.audit.log({ actorId: actor.id, action: 'APPRAISAL_REVIEW_SUBMITTED', entityType: 'HrmsAppraisalReview', entityId: res.id });
    return res;
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

@ApiTags('HRMS - Performance & 360 Appraisal')
@ApiBearerAuth()
@Controller('hrms/performance')
@Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER')
export class HrmsPerformanceController {
  constructor(private readonly service: HrmsPerformanceService) {}

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER', 'ACCOUNTANT', 'HR_RECRUITER')
  @Get('cycles')
  listCycles() {
    return this.service.listCycles();
  }

  @Post('cycles')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER')
  createCycle(@Body() dto: CreateCycleDto, @CurrentUser() actor: AuthUser) {
    return this.service.createCycle(actor.id, dto);
  }

  @Patch('cycles/:id')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER')
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

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Get('competencies')
  competencies(@CurrentUser() actor: AuthUser, @Query('userId') userId?: string, @Query('cycleId') cycleId?: string) {
    return this.service.listCompetencies(actor, userId, cycleId);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Get('competency-standards')
  competencyStandards() {
    return this.service.listCompetencyStandards();
  }

  @Roles('ADMIN', 'HR_TRAINER', 'HR_CB', 'BOD')
  @Post('competency-standards')
  createCompetencyStandard(@CurrentUser() actor: AuthUser, @Body() dto: CreateCompetencyStandardDto) {
    return this.service.createCompetencyStandard(actor, dto);
  }

  @Roles('ADMIN', 'HR_TRAINER', 'HR_CB', 'BOD')
  @Delete('competency-standards/:id')
  deactivateCompetencyStandard(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.service.deactivateCompetencyStandard(actor, id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Post('competencies')
  assessCompetency(@CurrentUser() actor: AuthUser, @Body() dto: CreateCompetencyAssessmentDto) {
    return this.service.assessCompetency(actor, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER')
  @Post('competencies/:id/review')
  reviewCompetency(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: ReviewCompetencyDto) {
    return this.service.reviewCompetency(actor, id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Get('development-plans')
  developmentPlans(@CurrentUser() actor: AuthUser, @Query('userId') userId?: string, @Query('cycleId') cycleId?: string) {
    return this.service.listDevelopmentPlans(actor, userId, cycleId);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Post('development-plans')
  createDevelopmentPlan(@CurrentUser() actor: AuthUser, @Body() dto: CreateDevelopmentPlanDto) {
    return this.service.createDevelopmentPlan(actor, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER')
  @Patch('development-plans/:id')
  updateDevelopmentPlan(@CurrentUser() actor: AuthUser, @Param('id') id: string, @Body() dto: UpdateDevelopmentPlanDto) {
    return this.service.updateDevelopmentPlan(actor, id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER')
  @Post('goals')
  createGoal(@Body() dto: CreateGoalDto, @CurrentUser() actor: AuthUser) {
    return this.service.createGoal(actor, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'USER', 'ACCOUNTANT', 'HR_RECRUITER')
  @Patch('goals/:id/score')
  scoreGoal(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body('selfScore') selfScore?: number,
    @Body('managerScore') managerScore?: number) {
    return this.service.scoreGoal(actor, id, selfScore, managerScore);
  }

  @Delete('goals/:id')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB')
  deleteGoal(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteGoal(actor.id, id);
  }

  @Roles('ADMIN','KM_MANAGER','HR_TRAINER','HR_CB','LINE_MANAGER','BOD','USER','ACCOUNTANT','HR_RECRUITER')
  @Get('reviews')
  listReviews(@CurrentUser() actor: AuthUser, @Query('cycleId') cycleId?: string, @Query('userId') userId?: string) {
    return this.service.listReviews(cycleId,userId,actor);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB', 'LINE_MANAGER', 'BOD', 'USER', 'ACCOUNTANT', 'HR_RECRUITER')
  @Post('reviews')
  addReview(@Body() dto: CreateReview360Dto, @CurrentUser() actor: AuthUser) {
    return this.service.addReview360(actor, dto);
  }

  @Delete('reviews/:id')
  @Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER', 'HR_CB')
  deleteReview(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteReview(actor.id, id);
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

