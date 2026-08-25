import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

class CreateCourseDto {
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiProperty() @IsDateString() startDate!: string;
  @ApiProperty() @IsDateString() endDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) capacity?: number;
}

class UpdateCourseDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(['PLANNED', 'ONGOING', 'DONE']) status?: 'PLANNED' | 'ONGOING' | 'DONE';
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
}

/**
 * Đào tạo & phát triển (chức năng "Đánh giá và phát triển" — PTTK_OOP_HR mục 1.1.1):
 * HR tạo khóa học, nhân viên tự ghi danh, hoàn thành ghi nhận vào hồ sơ.
 */
@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  courses() {
    return this.prisma.trainingCourse.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { enrollments: true } } },
    });
  }

  async createCourse(dto: CreateCourseDto, actor: AuthUser, requestId?: string) {
    if (new Date(dto.endDate) < new Date(dto.startDate)) {
      throw new BusinessException(ErrorCodes.VALIDATION_ERROR, 'Ngày kết thúc phải sau ngày bắt đầu');
    }
    const course = await this.prisma.trainingCourse.create({
      data: { ...dto, createdById: actor.id },
    });
    await this.audit.log({
      actorId: actor.id, action: 'TRAINING_COURSE_CREATED', entityType: 'TrainingCourse', entityId: course.id,
      after: { title: dto.title }, requestId,
    });
    return course;
  }

  async updateCourse(id: string, dto: UpdateCourseDto, actor: AuthUser, requestId?: string) {
    const course = await this.prisma.trainingCourse.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Không tìm thấy khóa đào tạo');
    const updated = await this.prisma.trainingCourse.update({
      where: { id },
      data: { status: dto.status, description: dto.description },
    });
    await this.audit.log({
      actorId: actor.id, action: 'TRAINING_COURSE_UPDATED', entityType: 'TrainingCourse', entityId: id, requestId,
    });
    return updated;
  }

  /** Khóa học của tôi + trạng thái ghi danh. */
  async myCourses(userId: string) {
    return this.prisma.trainingCourse.findMany({
      include: {
        enrollments: { where: { userId }, select: { status: true, completedAt: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /** Ghi danh — chặn khi hết chỗ (capacity). */
  async enroll(courseId: string, actor: AuthUser, requestId?: string) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      include: { _count: { select: { enrollments: { where: { status: { not: 'DROPPED' } } } } } },
    });
    if (!course) throw new NotFoundException('Không tìm thấy khóa đào tạo');
    if (course.status === 'DONE') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Khóa học đã kết thúc', HttpStatus.CONFLICT);
    }
    if (course.capacity && course._count.enrollments >= course.capacity) {
      throw new BusinessException(ErrorCodes.QUOTA_EXCEEDED, 'Khóa học đã đủ số lượng', HttpStatus.CONFLICT);
    }
    const enrollment = await this.prisma.trainingEnrollment.upsert({
      where: { courseId_userId: { courseId, userId: actor.id } },
      create: { courseId, userId: actor.id },
      update: { status: 'ENROLLED', completedAt: null },
    });
    await this.audit.log({
      actorId: actor.id, action: 'TRAINING_ENROLLED', entityType: 'TrainingCourse', entityId: courseId, requestId,
    });
    return enrollment;
  }

  async drop(courseId: string, actor: AuthUser, requestId?: string) {
    const enrollment = await this.prisma.trainingEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId: actor.id } },
    });
    if (!enrollment) throw new NotFoundException('Bạn chưa ghi danh khóa này');
    const updated = await this.prisma.trainingEnrollment.update({
      where: { courseId_userId: { courseId, userId: actor.id } },
      data: { status: 'DROPPED' },
    });
    await this.audit.log({
      actorId: actor.id, action: 'TRAINING_DROPPED', entityType: 'TrainingCourse', entityId: courseId, requestId,
    });
    return updated;
  }

  /** HR/manager đánh dấu hoàn thành cho nhân viên. */
  async markCompleted(courseId: string, userId: string, actor: AuthUser, requestId?: string) {
    const enrollment = await this.prisma.trainingEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (!enrollment) throw new NotFoundException('Nhân viên chưa ghi danh khóa này');
    const updated = await this.prisma.trainingEnrollment.update({
      where: { courseId_userId: { courseId, userId } },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    await this.audit.log({
      actorId: actor.id, action: 'TRAINING_COMPLETED', entityType: 'TrainingCourse', entityId: courseId,
      after: { userId }, requestId,
    });
    return updated;
  }
}

@ApiTags('training')
@ApiBearerAuth()
@Controller('training')
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get('courses')
  courses() {
    return this.service.courses();
  }

  @Get('courses/mine')
  myCourses(@CurrentUser() user: AuthUser) {
    return this.service.myCourses(user.id);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    return this.service.createCourse(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('courses/:id/update')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() user: AuthUser) {
    return this.service.updateCourse(id, dto, user);
  }

  @Post('courses/:id/enroll')
  enroll(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.enroll(id, user);
  }

  @Post('courses/:id/drop')
  drop(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.drop(id, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('courses/:id/complete/:userId')
  markCompleted(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: AuthUser) {
    return this.service.markCompleted(id, userId, user);
  }
}

@Module({ controllers: [TrainingController], providers: [TrainingService] })
export class TrainingModule {}
