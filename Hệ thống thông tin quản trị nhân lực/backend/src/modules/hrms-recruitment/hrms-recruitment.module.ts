import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { ApplicantStage, InterviewRecommendation, OfferStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class CreateJobOpeningDto {
  @ApiProperty({ example: 'Tuyển dụng Kỹ sư Phần mềm Senior' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  vacancies?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  minExperience?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryRange?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closingDate?: string;
}

export class CreateApplicantDto {
  @ApiProperty()
  @IsString()
  jobOpeningId: string;

  @ApiProperty({ example: 'Phạm Minh Đức' })
  @IsString()
  candidateName: string;

  @ApiProperty({ example: 'duc.pham@example.com' })
  @IsString()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resumeUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInterviewRoundDto {
  @ApiProperty()
  @IsString()
  applicantId: string;

  @ApiProperty({ example: 'Phỏng vấn Kỹ thuật Vòng 1' })
  @IsString()
  roundName: string;

  @ApiProperty({ example: 'Trần Văn Hoàng (Tech Lead)' })
  @IsString()
  interviewerName: string;

  @ApiProperty({ example: '2026-09-02T09:30:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional({ enum: InterviewRecommendation })
  @IsOptional()
  @IsEnum(InterviewRecommendation)
  recommendation?: InterviewRecommendation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class CreateJobOfferDto {
  @ApiProperty()
  @IsString()
  applicantId: string;

  @ApiProperty({ example: 'Senior Full-stack Developer' })
  @IsString()
  designation: string;

  @ApiProperty({ example: 35000000 })
  @IsNumber()
  offeredSalary: number;

  @ApiProperty({ example: '2026-09-15T00:00:00.000Z' })
  @IsDateString()
  joiningDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terms?: string;
}

@Injectable()
export class HrmsRecruitmentService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listOpenings() {
    return this.prisma.hrmsJobOpening.findMany({
      include: { _count: { select: { applicants: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOpening(actorId: string, dto: CreateJobOpeningDto) {
    const res = await this.prisma.hrmsJobOpening.create({
      data: {
        ...dto,
        closingDate: dto.closingDate ? new Date(dto.closingDate) : null,
      },
    });
    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsJobOpening',
      targetId: res.id,
      description: `Tạo tin tuyển dụng: ${dto.title}`,
    });
    return res;
  }

  async listApplicants(jobOpeningId?: string, stage?: ApplicantStage) {
    const where: Record<string, unknown> = {};
    if (jobOpeningId) where.jobOpeningId = jobOpeningId;
    if (stage) where.stage = stage;

    return this.prisma.hrmsJobApplicant.findMany({
      where,
      include: {
        jobOpening: true,
        interviews: true,
        offers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createApplicant(actorId: string, dto: CreateApplicantDto) {
    const opening = await this.prisma.hrmsJobOpening.findUnique({ where: { id: dto.jobOpeningId } });
    if (!opening) throw new NotFoundException('Không tìm thấy tin tuyển dụng');

    const res = await this.prisma.hrmsJobApplicant.create({
      data: dto,
      include: { jobOpening: true },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsJobApplicant',
      targetId: res.id,
      description: `Thêm ứng viên: ${dto.candidateName} cho vị trí ${opening.title}`,
    });
    return res;
  }

  async updateApplicantStage(actorId: string, id: string, stage: ApplicantStage) {
    const app = await this.prisma.hrmsJobApplicant.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Không tìm thấy ứng viên');

    const res = await this.prisma.hrmsJobApplicant.update({
      where: { id },
      data: { stage },
      include: { jobOpening: true, interviews: true, offers: true },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_STAGE',
      targetType: 'HrmsJobApplicant',
      targetId: id,
      description: `Chuyển giai đoạn ứng viên ${app.candidateName} sang [${stage}]`,
    });
    return res;
  }

  async addInterviewRound(actorId: string, dto: CreateInterviewRoundDto) {
    const res = await this.prisma.hrmsInterviewRound.create({
      data: {
        applicantId: dto.applicantId,
        roundName: dto.roundName,
        interviewerName: dto.interviewerName,
        scheduledAt: new Date(dto.scheduledAt),
        score: dto.score,
        recommendation: dto.recommendation ?? InterviewRecommendation.HOLD,
        feedback: dto.feedback,
        status: dto.score !== undefined ? 'COMPLETED' : 'SCHEDULED',
      },
    });

    await this.audit.log({
      actorId,
      action: 'SCHEDULE_INTERVIEW',
      targetType: 'HrmsInterviewRound',
      targetId: res.id,
      description: `Lên lịch/Đánh giá vòng phỏng vấn ${dto.roundName} cho ứng viên ${dto.applicantId}`,
    });
    return res;
  }

  async createOffer(actorId: string, dto: CreateJobOfferDto) {
    const res = await this.prisma.hrmsJobOffer.create({
      data: {
        applicantId: dto.applicantId,
        designation: dto.designation,
        offeredSalary: dto.offeredSalary,
        joiningDate: new Date(dto.joiningDate),
        status: OfferStatus.SENT,
        terms: dto.terms,
      },
    });

    await this.prisma.hrmsJobApplicant.update({
      where: { id: dto.applicantId },
      data: { stage: ApplicantStage.OFFER_SENT },
    });

    await this.audit.log({
      actorId,
      action: 'SEND_OFFER',
      targetType: 'HrmsJobOffer',
      targetId: res.id,
      description: `Gửi Thư mời nhận việc (Offer) cho ứng viên ${dto.applicantId} (Lương: ${dto.offeredSalary.toLocaleString('vi-VN')} VND)`,
    });
    return res;
  }

  async convertToEmployee(actorId: string, applicantId: string) {
    const app = await this.prisma.hrmsJobApplicant.findUnique({
      where: { id: applicantId },
      include: { jobOpening: true, offers: true },
    });
    if (!app) throw new NotFoundException('Không tìm thấy ứng viên');

    const offer = app.offers[0];
    const passwordHash = await bcrypt.hash('Employee@123', 10);
    const code = `NV${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await this.prisma.user.create({
      data: {
        email: app.email,
        passwordHash,
        fullName: app.candidateName,
        phone: app.phone,
        employeeCode: code,
        jobTitle: offer?.designation ?? app.jobOpening.designation ?? 'Chuyên viên',
        baseSalary: offer?.offeredSalary ?? 15000000,
        hireDate: offer?.joiningDate ?? new Date(),
        roles: { create: { roleCode: 'USER' } },
      },
    });

    await this.prisma.hrmsJobApplicant.update({
      where: { id: applicantId },
      data: { stage: ApplicantStage.HIRED },
    });

    // Tạo sự kiện Onboarding Lifecycle
    await this.prisma.hrmsLifecycleEvent.create({
      data: {
        userId: user.id,
        employeeName: user.fullName,
        type: 'ONBOARDING',
        status: 'IN_PROGRESS',
        title: `Tiếp nhận nhân sự mới: ${user.fullName} (${user.employeeCode})`,
        effectiveDate: new Date(),
        details: { position: user.jobTitle, baseSalary: user.baseSalary },
        createdBy: actorId,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CONVERT_TO_EMPLOYEE',
      targetType: 'User',
      targetId: user.id,
      description: `1-Click chuyển đổi ứng viên ${app.candidateName} thành Nhân viên chính thức (${code})`,
    });

    return user;
  }
}

@ApiTags('HRMS - Recruitment & ATS')
@ApiBearerAuth()
@Controller('hrms/recruitment')
export class HrmsRecruitmentController {
  constructor(private readonly service: HrmsRecruitmentService) {}

  @Get('openings')
  listOpenings() {
    return this.service.listOpenings();
  }

  @Post('openings')
  createOpening(@Body() dto: CreateJobOpeningDto) {
    return this.service.createOpening('system', dto);
  }

  @Get('applicants')
  listApplicants(@Query('jobOpeningId') jobOpeningId?: string, @Query('stage') stage?: ApplicantStage) {
    return this.service.listApplicants(jobOpeningId, stage);
  }

  @Post('applicants')
  createApplicant(@Body() dto: CreateApplicantDto) {
    return this.service.createApplicant('system', dto);
  }

  @Patch('applicants/:id/stage')
  updateStage(@Param('id') id: string, @Body('stage') stage: ApplicantStage) {
    return this.service.updateApplicantStage('system', id, stage);
  }

  @Post('interviews')
  addInterview(@Body() dto: CreateInterviewRoundDto) {
    return this.service.addInterviewRound('system', dto);
  }

  @Post('offers')
  createOffer(@Body() dto: CreateJobOfferDto) {
    return this.service.createOffer('system', dto);
  }

  @Post('applicants/:id/convert-to-employee')
  convertToEmployee(@Param('id') id: string) {
    return this.service.convertToEmployee('system', id);
  }
}

@Module({
  controllers: [HrmsRecruitmentController],
  providers: [HrmsRecruitmentService],
  exports: [HrmsRecruitmentService],
})
export class HrmsRecruitmentModule {}
