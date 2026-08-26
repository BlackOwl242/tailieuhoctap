import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
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

  @Get('reviews')
  listReviews(@Query('cycleId') cycleId?: string, @Query('userId') userId?: string) {
    return this.service.listReviews(cycleId, userId);
  }

  @Post('reviews')
  addReview(@Body() dto: CreateReview360Dto) {
    return this.service.addReview360('system', dto);
  }
}

@Module({
  controllers: [HrmsPerformanceController],
  providers: [HrmsPerformanceService],
  exports: [HrmsPerformanceService],
})
export class HrmsPerformanceModule {}
