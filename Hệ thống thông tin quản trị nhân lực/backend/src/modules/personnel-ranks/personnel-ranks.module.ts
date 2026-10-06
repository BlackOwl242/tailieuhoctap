import { BadRequestException, ConflictException } from '@nestjs/common';
import { PersonnelActionsModule, PersonnelActionsService } from '../personnel-actions/personnel-actions.module';
import { dateKey } from '../../common/hr-time';
import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import {
  IsArray, IsDateString, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export class UpsertRankDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() groupCode!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() field?: string;
  @ApiProperty() @IsNumber() @Min(1) totalSteps!: number;
  @ApiProperty() @IsNumber() @Min(12) stepMonths!: number;
  @ApiProperty() @IsArray() coefficients!: number[];
}

export class ApplyProgressionDto {
  @ApiProperty() @IsNumber() @Min(1) newSalary!: number;
  @ApiProperty() @IsString() userId!: string;
  @ApiProperty() @IsNumber() nextStep!: number;
  @ApiProperty() @IsNumber() nextCoefficient!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() overGradePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() decisionNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class PersonnelRanksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly actions: PersonnelActionsService,
  ) {}

  private async assertCivilServantSector() {
    const profileRow = await this.prisma.setting.findUnique({ where: { key: 'ORG_PROFILE' } });
    const profile = profileRow?.value && typeof profileRow.value === 'object' ? profileRow.value as Record<string, unknown> : {};
    if (profile.orgSector !== 'state' || profile.publicPersonnelType !== 'CIVIL_SERVANT') {
      throw new BadRequestException('Quét và lập đề xuất nâng bậc ngạch chỉ bật cho tổ chức khu vực công đã chọn chế độ công chức');
    }
  }

  /** Lấy danh mục ngạch bậc lương tiêu chuẩn (hỗ trợ lọc theo nhóm ngạch A3/A2/A1/B/C hoặc tìm kiếm). */
  async listRanks(query: { groupCode?: string; field?: string; q?: string }) {
    const where: any = {};
    if (query.groupCode) where.groupCode = query.groupCode;
    if (query.field) where.field = query.field;
    if (query.q) {
      where.OR = [
        { code: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
        { field: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.personnelRank.findMany({
      where,
      orderBy: [{ groupCode: 'asc' }, { code: 'asc' }],
    });
  }

  /** Lấy chi tiết một ngạch lương. */
  async getRank(code: string) {
    const rank = await this.prisma.personnelRank.findUnique({ where: { code } });
    if (!rank) throw new NotFoundException(`Không tìm thấy ngạch lương mã ${code}`);
    return rank;
  }

  /** Tạo hoặc cập nhật định nghĩa ngạch lương. */
  async upsertRank(dto: UpsertRankDto, actor: AuthUser) {
    const rank = await this.prisma.personnelRank.upsert({
      where: { code: dto.code },
      update: {
        name: dto.name,
        groupCode: dto.groupCode,
        field: dto.field,
        totalSteps: dto.totalSteps,
        stepMonths: dto.stepMonths,
        coefficients: dto.coefficients,
      },
      create: {
        code: dto.code,
        name: dto.name,
        groupCode: dto.groupCode,
        field: dto.field,
        totalSteps: dto.totalSteps,
        stepMonths: dto.stepMonths,
        coefficients: dto.coefficients,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'UPSERT_PERSONNEL_RANK',
      entityType: 'PersonnelRank',
      entityId: rank.code,
      after: dto,
    });

    return rank;
  }

  /**
   * BỘ MÁY QUÉT TỰ ĐỘNG NÂNG BẬC LƯƠNG ĐỊNH KỲ & THÂM NIÊN VƯỢT KHUNG:
   * - Quét toàn bộ nhân sự có ngạch bậc lương trong hệ thống.
   * - Tính số tháng đã giữ bậc hiện tại: elapsedMonths = (now - salaryStepDate).
   * - Đối chiếu chu kỳ giữ bậc (36 tháng đối với ngạch loại A, 24 tháng đối với ngạch loại B/C).
   * - Nếu chưa kịch trần (step < totalSteps) và đủ thời gian -> đề xuất nâng lên bậc liền kề.
   * - Nếu đã kịch trần (step == totalSteps) -> đề xuất tính phụ cấp thâm niên vượt khung (+5% năm đầu, +1% mỗi năm sau).
   */
  async scanSalaryProgression(targetDateStr?: string) {
    await this.assertCivilServantSector();
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

    const profiles = await this.prisma.personnelComprehensiveProfile.findMany({
      where: {
        rankCode: { not: null },
        salaryStep: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            employeeCode: true,
            jobTitle: true,
            orgUnit: { select: { id: true, name: true, code: true } },
          },
        },
        rank: true,
      },
    });

    const eligibleList: any[] = [];
    const overdueList: any[] = [];
    const normalList: any[] = [];

    for (const p of profiles) {
      if (!p.rank || !p.salaryStep || !p.salaryStepDate) continue;

      const stepDate = new Date(p.salaryStepDate);
      const diffMs = targetDate.getTime() - stepDate.getTime();
      const monthsHeld = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
      const requiredMonths = p.rank.stepMonths || 36;
      const appraisal = await this.prisma.personnelAppraisal.findFirst({ where: { profileId: p.id }, orderBy: { year: 'desc' } });
      const disciplinary = await this.prisma.personnelAction.count({ where: { subjectId: p.userId, type: 'DISCIPLINE', status: 'APPROVED', effectiveAt: { gte: stepDate, lte: targetDate } } });
      const isOverdue = monthsHeld >= requiredMonths && Boolean(appraisal && appraisal.classification !== 'UNSATISFACTORY') && disciplinary === 0;

      const coefficients = (p.rank.coefficients as number[]) || [];
      const currentStep = p.salaryStep;
      const totalSteps = p.rank.totalSteps || coefficients.length || 9;
      const currentCoef = p.salaryCoefficient || coefficients[currentStep - 1] || 2.34;

      const isMaxStep = currentStep >= totalSteps;
      let nextStep = currentStep;
      let nextCoef = currentCoef;
      let suggestedOverGradePercent = p.overGradePercent || 0;
      let progressionType: 'STEP_PROMOTION' | 'OVER_GRADE_ALLOWANCE' | 'NONE' = 'NONE';

      if (!isMaxStep) {
        if (isOverdue) {
          progressionType = 'STEP_PROMOTION';
          nextStep = currentStep + 1;
          nextCoef = coefficients[nextStep - 1] ?? currentCoef;
        }
      } else {
        // Đã kịch trần ngạch: xét thâm niên vượt khung
        if (isOverdue) {
          progressionType = 'OVER_GRADE_ALLOWANCE';
          const yearsOver = Math.floor((monthsHeld - requiredMonths) / 12);
          suggestedOverGradePercent = 5 + Math.max(0, yearsOver);
        }
      }

      const item = {
        userId: p.userId,
        employeeCode: p.user.employeeCode,
        fullName: p.user.fullName,
        jobTitle: p.user.jobTitle,
        orgUnitName: p.user.orgUnit?.name || 'Chưa phân bổ',
        rankCode: p.rank.code,
        rankName: p.rank.name,
        groupCode: p.rank.groupCode,
        currentStep,
        totalSteps,
        currentCoefficient: currentCoef,
        salaryStepDate: p.salaryStepDate,
        monthsHeld,
        requiredMonths,
        isOverdue,
        progressionType,
        nextStep,
        nextCoefficient: nextCoef,
        currentOverGradePercent: p.overGradePercent || 0,
        suggestedOverGradePercent,
      };

      if (isOverdue) {
        eligibleList.push(item);
        if (monthsHeld > requiredMonths + 3) overdueList.push(item);
      } else {
        normalList.push(item);
      }
    }

    return {
      targetDate: targetDate.toISOString(),
      totalScanned: profiles.length,
      eligibleCount: eligibleList.length,
      overdueCount: overdueList.length,
      eligibleList,
      overdueList,
      normalList,
    };
  }

  /** Phê duyệt nâng bậc lương / phụ cấp thâm niên cho nhân sự. */
  async applyProgression(dto: ApplyProgressionDto, actor: AuthUser) {
    await this.assertCivilServantSector();
    const profile = await this.prisma.personnelComprehensiveProfile.findUnique({
      where: { userId: dto.userId },
      include: { rank: true },
    });

    if (!profile) throw new NotFoundException('Không tìm thấy hồ sơ nhân sự');

    const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();

    const coefficients = profile.rank?.coefficients as number[] | undefined;
    if (!profile.rank || !coefficients || !Number.isInteger(dto.nextStep) || dto.nextStep < 1 || dto.nextStep > coefficients.length || Math.abs(coefficients[dto.nextStep - 1] - dto.nextCoefficient) > .00001) throw new BadRequestException('Bậc/hệ số không thuộc danh mục ngạch');
    const currentStep = profile.salaryStep ?? 1;
    if (dto.nextStep !== currentStep + 1 && !(currentStep === coefficients.length && dto.nextStep === currentStep)) throw new BadRequestException('Chỉ được nâng bậc liền kề hoặc xét vượt khung');
    if (!profile.salaryStepDate) throw new ConflictException('Thiếu ngày giữ bậc');
    const due = new Date(profile.salaryStepDate); due.setUTCMonth(due.getUTCMonth() + profile.rank.stepMonths);
    if (dateKey(effectiveDate) < dateKey(due)) throw new ConflictException('Chưa đủ thời gian giữ bậc');
    const disciplinary = await this.prisma.personnelAction.count({ where: { subjectId: dto.userId, type: 'DISCIPLINE', status: 'APPROVED', effectiveAt: { gte: profile.salaryStepDate, lte: effectiveDate } } });
    if (disciplinary) throw new ConflictException('Có kỷ luật trong thời gian giữ bậc, cần thẩm định riêng');
    const appraisal = await this.prisma.personnelAppraisal.findFirst({ where: { profileId: profile.id }, orderBy: { year: 'desc' } });
    if (!appraisal || appraisal.classification === 'UNSATISFACTORY') throw new ConflictException('Cần kết quả đánh giá hoàn thành nhiệm vụ đã được xác minh');
    if ((dto.overGradePercent ?? 0) < 0 || (dto.overGradePercent ?? 0) > 100) throw new BadRequestException('Tỷ lệ vượt khung không hợp lệ');
    return this.actions.create({ type: 'SALARY_ADJUST', subjectId: dto.userId, effectiveDate: effectiveDate.toISOString(), payload: { newSalary: dto.newSalary, reason: dto.note?.trim() || 'Nâng bậc theo chế độ ngạch lương công chức', salaryReason: 'MERIT', rankProgression: true, nextStep: dto.nextStep, nextCoefficient: dto.nextCoefficient, overGradePercent: dto.overGradePercent ?? profile.overGradePercent ?? 0, decisionNo: dto.decisionNo, note: dto.note } }, actor);

  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('Personnel Ranks & Salary Progression — Ngạch bậc & Nâng lương')
@ApiBearerAuth()
@Controller('personnel-ranks')
export class PersonnelRanksController {
  constructor(private readonly service: PersonnelRanksService) {}

  @Get()
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  list(@Query() query: { groupCode?: string; field?: string; q?: string }) {
    return this.service.listRanks(query);
  }

  @Get('progression/scan')
  @Roles('ADMIN', 'KM_MANAGER')
  scanProgression(@Query('targetDate') targetDate?: string) {
    return this.service.scanSalaryProgression(targetDate);
  }

  @Post('progression/apply')
  @Roles('ADMIN', 'KM_MANAGER')
  applyProgression(@Body() dto: ApplyProgressionDto, @CurrentUser() actor: AuthUser) {
    return this.service.applyProgression(dto, actor);
  }

  @Get(':code')
  @Roles('ADMIN', 'KM_MANAGER', 'USER')
  getOne(@Param('code') code: string) {
    return this.service.getRank(code);
  }

  @Post()
  @Roles('ADMIN')
  upsert(@Body() dto: UpsertRankDto, @CurrentUser() actor: AuthUser) {
    return this.service.upsertRank(dto, actor);
  }
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

@Module({
  imports: [PersonnelActionsModule], controllers: [PersonnelRanksController],
  providers: [PersonnelRanksService],
  exports: [PersonnelRanksService],
})
export class PersonnelRanksModule {}
