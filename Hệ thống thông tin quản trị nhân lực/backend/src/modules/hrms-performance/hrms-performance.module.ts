import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({ example: 'Đạt SLA 99.9%' })
  @IsString()
  targetMetric: string;
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

  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  relationship: string;

  @ApiProperty({ example: 4.8 })
  @IsNumber()
  rating: number;

  @ApiProperty({ example: 'Nhân sự có tinh thần trách nhiệm cao, năng lực chuyên môn vững vàng, dẫn dắt đội ngũ tốt.' })
  @IsString()
  feedback: string;
}

@Injectable()
export class HrmsPerformanceService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listCycles() {
    return this.prisma.hrmsAppraisalCycle.findMany({
      include: {
        _count: { select: { goals: true, reviews: true } },
      },
      orderBy: { year: 'desc' },
    });
  }

  async createCycle(actorId: string, dto: CreateCycleDto) {
    const res = await this.prisma.hrmsAppraisalCycle.create({
      data: {
        name: dto.name,
        year: dto.year,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        description: dto.description,
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

  async deleteCycle(actorId: string, id: string) {
    // Xóa reviews & goals liên quan trước
    await this.prisma.hrmsAppraisalReview.deleteMany({ where: { cycleId: id } });
    await this.prisma.hrmsAppraisalGoal.deleteMany({ where: { cycleId: id } });
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
    await this.prisma.hrmsAppraisalReview.delete({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'DELETE_REVIEW_360',
      targetType: 'HrmsAppraisalReview',
      targetId: id,
      description: `Xóa phản hồi 360 độ ID: ${id}`,
    });
    return { success: true };
  }
  async listGoals(cycleId?: string, userId?: string) {
    const where: Record<string, unknown> = {};
    if (cycleId) where.cycleId = cycleId;
    if (userId) where.userId = userId;

    return this.prisma.hrmsAppraisalGoal.findMany({
      where,
      include: { cycle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(actorId: string, dto: CreateGoalDto) {
    const res = await this.prisma.hrmsAppraisalGoal.create({
      data: {
        cycleId: dto.cycleId,
        userId: dto.userId,
        employeeName: dto.employeeName,
        kraTitle: dto.kraTitle,
        description: dto.description,
        weightage: dto.weightage ?? 20,
        targetMetric: dto.targetMetric,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_GOAL',
      targetType: 'HrmsAppraisalGoal',
      targetId: res.id,
      description: `Thiết lập mục tiêu KRA [${dto.kraTitle}] cho nhân viên ${dto.employeeName}`,
    });
    return res;
  }

  async scoreGoal(actorId: string, id: string, selfScore?: number, managerScore?: number) {
    const goal = await this.prisma.hrmsAppraisalGoal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu đánh giá');

    const finalScore = managerScore !== undefined ? managerScore : goal.finalScore;

    const res = await this.prisma.hrmsAppraisalGoal.update({
      where: { id },
      data: {
        selfScore: selfScore !== undefined ? selfScore : goal.selfScore,
        managerScore: managerScore !== undefined ? managerScore : goal.managerScore,
        finalScore,
        status: managerScore !== undefined ? 'APPROVED' : 'SUBMITTED',
      },
    });

    await this.audit.log({
      actorId,
      action: 'SCORE_GOAL',
      targetType: 'HrmsAppraisalGoal',
      targetId: id,
      description: `Chấm điểm mục tiêu ${goal.kraTitle}: Tự chấm=${selfScore ?? '-'}, Quản lý=${managerScore ?? '-'}`,
    });
    return res;
  }

  async listReviews(cycleId?: string, userId?: string) {
    const where: Record<string, unknown> = {};
    if (cycleId) where.cycleId = cycleId;
    if (userId) where.userId = userId;

    return this.prisma.hrmsAppraisalReview.findMany({
      where,
      include: { cycle: true },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async addReview360(actorId: string, dto: CreateReview360Dto) {
    const res = await this.prisma.hrmsAppraisalReview.create({
      data: {
        cycleId: dto.cycleId,
        userId: dto.userId,
        reviewerName: dto.reviewerName,
        relationship: dto.relationship,
        rating: dto.rating,
        feedback: dto.feedback,
      },
    });

    await this.audit.log({
      actorId,
      action: 'SUBMIT_360_REVIEW',
      targetType: 'HrmsAppraisalReview',
      targetId: res.id,
      description: `Gửi đánh giá 360 độ (${dto.relationship}) cho nhân sự ${dto.userId} (Điểm: ${dto.rating}/5)`,
    });
    return res;
  }

  /** Đồng bộ kết quả đánh giá cuối kỳ vào hồ sơ cán bộ (QT ĐGCB - Mẫu 2C-BNV / Doanh nghiệp) */
  async syncToPersonnelAppraisal(
    actorId: string,
    dto: {
      userId: string;
      year: number;
      classification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY';
      comment?: string;
      decisionNo?: string;
    },
  ) {
    // 1. Lấy hoặc tạo PersonnelComprehensiveProfile của nhân sự
    let profile = await this.prisma.personnelComprehensiveProfile.findUnique({
      where: { userId: dto.userId },
    });
    if (!profile) {
      profile = await this.prisma.personnelComprehensiveProfile.create({
        data: {
          userId: dto.userId,
          healthStatus: 'Tốt',
        },
      });
    }

    // 2. Tạo bản ghi quá trình đánh giá cán bộ
    const appraisal = await this.prisma.personnelAppraisal.create({
      data: {
        profileId: profile.id,
        year: dto.year,
        classification: dto.classification,
        comment: dto.comment ?? 'Đánh giá hoàn thành chu kỳ hiệu suất 360 độ',
        decisionNo: dto.decisionNo,
      },
    });

    await this.audit.log({
      actorId,
      action: 'SYNC_APPRAISAL_TO_PROFILE',
      targetType: 'PersonnelAppraisal',
      targetId: appraisal.id,
      description: `Đồng bộ đánh giá năm ${dto.year} (${dto.classification}) vào Hồ sơ cán bộ ID ${dto.userId}`,
    });

    return appraisal;
  }
}

@ApiTags('HRMS - Performance & 360 Appraisal')
@ApiBearerAuth()
@Controller('hrms/performance')
export class HrmsPerformanceController {
  constructor(private readonly service: HrmsPerformanceService) {}

  @Get('cycles')
  listCycles() {
    return this.service.listCycles();
  }

  @Post('cycles')
  createCycle(@Body() dto: CreateCycleDto) {
    return this.service.createCycle('system', dto);
  }

  @Patch('cycles/:id')
  updateCycle(
    @Param('id') id: string,
    @Body() dto: { name?: string; status?: string; description?: string },
  ) {
    return this.service.updateCycle('system', id, dto);
  }

  @Delete('cycles/:id')
  deleteCycle(@Param('id') id: string) {
    return this.service.deleteCycle('system', id);
  }

  @Get('goals')
  listGoals(@Query('cycleId') cycleId?: string, @Query('userId') userId?: string) {
    return this.service.listGoals(cycleId, userId);
  }

  @Post('goals')
  createGoal(@Body() dto: CreateGoalDto) {
    return this.service.createGoal('system', dto);
  }

  @Patch('goals/:id/score')
  scoreGoal(
    @Param('id') id: string,
    @Body('selfScore') selfScore?: number,
    @Body('managerScore') managerScore?: number,
  ) {
    return this.service.scoreGoal('system', id, selfScore, managerScore);
  }

  @Delete('goals/:id')
  deleteGoal(@Param('id') id: string) {
    return this.service.deleteGoal('system', id);
  }

  @Get('reviews')
  listReviews(@Query('cycleId') cycleId?: string, @Query('userId') userId?: string) {
    return this.service.listReviews(cycleId, userId);
  }

  @Post('reviews')
  addReview(@Body() dto: CreateReview360Dto) {
    return this.service.addReview360('system', dto);
  }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) {
    return this.service.deleteReview('system', id);
  }

  @Post('sync-appraisal')
  syncAppraisal(
    @Body()
    dto: {
      userId: string;
      year: number;
      classification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY';
      comment?: string;
      decisionNo?: string;
    },
  ) {
    return this.service.syncToPersonnelAppraisal('system', dto);
  }
}

@Module({
  controllers: [HrmsPerformanceController],
  providers: [HrmsPerformanceService],
  exports: [HrmsPerformanceService],
})
export class HrmsPerformanceModule {}

