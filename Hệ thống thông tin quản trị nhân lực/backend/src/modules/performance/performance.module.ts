import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

class CreateReviewDto {
  @ApiProperty() @IsString() userId!: string;
  @ApiProperty() @IsString() @MinLength(4) @MaxLength(20) period!: string; // "2026-H1"
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) score?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) strengths?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) improvements?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

class SubmitReviewDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) score?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) strengths?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) improvements?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

/**
 * Đánh giá hiệu suất (chu kỳ 6 tháng — thói quen ngành CNTT theo Plan.md):
 * Trưởng nhóm lập phiếu → nộp → nhân viên xác nhận đã đọc (ACKNOWLEDGED).
 */
@Injectable()
export class PerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Đánh giá liên quan đến tôi: được đánh giá + tôi là người đánh giá. */
  async mine(actor: AuthUser) {
    const [received, given] = await Promise.all([
      this.prisma.performanceReview.findMany({
        where: { userId: actor.id },
        include: { reviewer: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.performanceReview.findMany({
        where: { reviewerId: actor.id },
        include: { user: { select: { id: true, fullName: true, employeeCode: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { received, given };
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get('team')
  team() {
    return this.prisma.performanceReview.findMany({
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateReviewDto, actor: AuthUser, requestId?: string) {
    const subject = await this.prisma.user.findFirst({ where: { id: dto.userId, deletedAt: null } });
    if (!subject) throw new NotFoundException('Không tìm thấy nhân viên');
    const dup = await this.prisma.performanceReview.findFirst({
      where: { userId: dto.userId, reviewerId: actor.id, period: dto.period },
    });
    if (dup) throw new BusinessException(ErrorCodes.CONFLICT, `Đã tồn tại đánh giá kỳ ${dto.period} cho nhân viên này`, HttpStatus.CONFLICT);

    const review = await this.prisma.performanceReview.create({
      data: {
        userId: dto.userId,
        reviewerId: actor.id,
        period: dto.period,
        score: dto.score,
        strengths: dto.strengths,
        improvements: dto.improvements,
        comment: dto.comment,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PERF_REVIEW_CREATED', entityType: 'PerformanceReview', entityId: review.id,
      after: { period: dto.period }, requestId,
    });
    return review;
  }

  async submit(id: string, dto: SubmitReviewDto, actor: AuthUser, requestId?: string) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy phiếu đánh giá');
    if (review.reviewerId !== actor.id && !actor.roles.includes('ADMIN')) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Chỉ người đánh giá mới được cập nhật', HttpStatus.FORBIDDEN);
    }
    if (review.status === 'ACKNOWLEDGED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Phiếu đã được nhân viên xác nhận — không sửa được', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.performanceReview.update({
      where: { id },
      data: {
        score: dto.score ?? review.score,
        strengths: dto.strengths ?? review.strengths,
        improvements: dto.improvements ?? review.improvements,
        comment: dto.comment ?? review.comment,
        status: 'SUBMITTED',
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PERF_REVIEW_SUBMITTED', entityType: 'PerformanceReview', entityId: id, requestId,
    });
    return updated;
  }

  /** Nhân viên xác nhận đã đọc kết quả đánh giá. */
  async acknowledge(id: string, actor: AuthUser, requestId?: string) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy phiếu đánh giá');
    if (review.userId !== actor.id) {
      throw new BusinessException(ErrorCodes.FORBIDDEN, 'Chỉ người được đánh giá mới xác nhận được', HttpStatus.FORBIDDEN);
    }
    if (review.status !== 'SUBMITTED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Phiếu chưa được nộp', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.performanceReview.update({
      where: { id },
      data: { status: 'ACKNOWLEDGED' },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PERF_REVIEW_ACKNOWLEDGED', entityType: 'PerformanceReview', entityId: id, requestId,
    });
    return updated;
  }
}

@ApiTags('performance')
@ApiBearerAuth()
@Controller('performance')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.service.mine(user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get('team')
  team() {
    return this.service.team();
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitReviewDto, @CurrentUser() user: AuthUser) {
    return this.service.submit(id, dto, user);
  }

  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.acknowledge(id, user);
  }
}

@Module({ controllers: [PerformanceController], providers: [PerformanceService] })
export class PerformanceModule {}
