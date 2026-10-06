import { BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID, randomBytes } from 'node:crypto';
import { dateKey, workDate } from '../../common/hr-time';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { ApplicantStage, InterviewRecommendation, OfferStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class CreateJobOpeningDto {
  @ApiProperty() @IsString() requisitionId: string;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryBandId?: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 2 })
  @IsInt() @Min(1) @Max(2)
  minimumInterviewRounds = 1;

  @ApiProperty({ example: 60, minimum: 1, maximum: 180 })
  @IsInt() @Min(1) @Max(180)
  probationDays!: number;
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
    const request = await this.prisma.jobRequisition.findUnique({ where: { id: dto.requisitionId } });
    if (!request || request.status !== 'APPROVED' || (dto.vacancies ?? 1) > request.headcount) throw new ConflictException('Tin phải thuộc chỉ tiêu đã duyệt; số lượng không vượt định biên');
    if (!dto.salaryBandId) throw new ConflictException('Cần cấu hình và duyệt khung lương cho vị trí trước khi mở tuyển');
    const band = await this.prisma.hrmsSalaryBand.findUnique({ where: { id: dto.salaryBandId } });
    const today = new Date();
    if (!band || band.status !== 'ACTIVE' || band.effectiveFrom > today || (band.effectiveTo && band.effectiveTo < today)) throw new ConflictException('Chỉ được tuyển theo khung lương đã duyệt và đang có hiệu lực');
    if (band.compensationBasis !== 'MONTHLY') throw new ConflictException('Tuyển dụng hiện lập offer theo tháng; cần chọn khung lương tháng');
    const title = (dto.designation || dto.title).trim().toLocaleLowerCase('vi');
    if (band.jobTitles.length && !band.jobTitles.some(t => t.trim().toLocaleLowerCase('vi') === title)) throw new ConflictException('Chức danh đăng tuyển không nằm trong danh sách chức danh của khung lương');
    if (!dto.requirements?.trim()) throw new BadRequestException('Cần ghi rõ tiêu chí bắt buộc để đánh giá ứng viên công bằng');
    const res = await this.prisma.hrmsJobOpening.create({
      data: {
        ...dto,
        salaryRange: `${band.minSalary.toLocaleString('vi-VN')}–${band.maxSalary.toLocaleString('vi-VN')} đồng/tháng`,
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
    const res = await this.prisma.$transaction(async (tx) => {
      const opening = await tx.hrmsJobOpening.findUnique({ where: { id: dto.jobOpeningId } });
      if (!opening) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
      if (!['OPEN', 'IN_PROGRESS'].includes(opening.status)) throw new ConflictException('Tin đã đóng/chưa mở');
      if (!opening.requisitionId || !await tx.jobRequisition.findFirst({ where: { id: opening.requisitionId, status: 'APPROVED' } })) {
        throw new ConflictException('Phiếu tuyển dụng đã đóng hoặc không còn hiệu lực; không nhận thêm hồ sơ');
      }
      return tx.hrmsJobApplicant.create({ data: dto, include: { jobOpening: true } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsJobApplicant',
      targetId: res.id,
      description: `Thêm ứng viên: ${dto.candidateName} cho vị trí ${res.jobOpening.title}`,
    });
    return res;
  }

  async updateApplicantStage(actorId: string, id: string, stage: ApplicantStage) {
    const app = await this.prisma.hrmsJobApplicant.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Không tìm thấy ứng viên');

    const graph: Record<string, string[]> = { APPLIED: ['SCREENING', 'REJECTED'], SCREENING: ['INTERVIEW_ROUND_1', 'REJECTED'], INTERVIEW_ROUND_1: ['INTERVIEW_ROUND_2', 'REJECTED'], INTERVIEW_ROUND_2: ['REJECTED'], OFFER_SENT: ['REJECTED'], HIRED: [], REJECTED: [] };
    if (!graph[app.stage]?.includes(stage)) throw new ConflictException('Giai đoạn không hợp lệ; gửi offer và nhận việc qua luồng riêng');
    if (stage === 'INTERVIEW_ROUND_2') {
      const opening = await this.prisma.hrmsJobOpening.findUniqueOrThrow({ where: { id: app.jobOpeningId } });
      const completed = await this.prisma.hrmsInterviewRound.findFirst({ where: { applicantId: id, status: 'COMPLETED', recommendation: { in: ['HIRE', 'STRONG_HIRE'] } } });
      if (opening.minimumInterviewRounds < 2 || !completed) throw new ConflictException('Chỉ chuyển sang vòng 2 nếu vị trí yêu cầu 2 vòng và ứng viên đã đạt vòng 1');
    }
    const res = await this.prisma.hrmsJobApplicant.update({
      where: { id, stage: app.stage },
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
    const applicant = await this.prisma.hrmsJobApplicant.findUniqueOrThrow({ where: { id: dto.applicantId } });
    if (!['INTERVIEW_ROUND_1','INTERVIEW_ROUND_2'].includes(applicant.stage)) throw new ConflictException('Ứng viên chưa vào giai đoạn phỏng vấn');
    if (dto.score != null && (!Number.isFinite(dto.score) || dto.score < 0 || dto.score > 100)) throw new BadRequestException('Điểm phỏng vấn phải trong 0–100');
    if (dto.score !== undefined && (!dto.feedback?.trim() || dto.feedback.trim().length < 10)) throw new BadRequestException('Kết quả phỏng vấn cần có nhận xét cụ thể (ít nhất 10 ký tự)');
    const interviewer = await this.prisma.user.findUniqueOrThrow({ where: { id: actorId } });
    const res = await this.prisma.hrmsInterviewRound.create({
      data: {
        applicantId: dto.applicantId,
        roundName: dto.roundName,
        interviewerName: interviewer.fullName,
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
    return this.prisma.$transaction(async tx => {
      const app = await tx.hrmsJobApplicant.findUniqueOrThrow({ where: { id: dto.applicantId }, include: { jobOpening: true } });
      if (!['OPEN', 'IN_PROGRESS'].includes(app.jobOpening.status)) throw new ConflictException('Tin tuyển dụng đã đóng; không thể phát hành offer mới');
      const eligibleStage = app.jobOpening.minimumInterviewRounds === 1
        ? ['INTERVIEW_ROUND_1', 'INTERVIEW_ROUND_2'].includes(app.stage)
        : app.stage === 'INTERVIEW_ROUND_2';
      if (!eligibleStage || !Number.isFinite(dto.offeredSalary) || dto.offeredSalary <= 0) throw new ConflictException('Chỉ gửi đề nghị sau khi hoàn tất số vòng phỏng vấn đã quy định và nhập mức lương hợp lệ');
      const rounds = await tx.hrmsInterviewRound.findMany({ where: { applicantId: app.id, status: 'COMPLETED' }, orderBy: { scheduledAt: 'asc' } });
      if (rounds.length < app.jobOpening.minimumInterviewRounds) throw new ConflictException(`Cần đủ ${app.jobOpening.minimumInterviewRounds} vòng phỏng vấn có kết quả`);
      if (rounds.some(round => round.recommendation === 'REJECT') || !['HIRE', 'STRONG_HIRE'].includes(rounds[rounds.length - 1]?.recommendation ?? 'HOLD')) throw new ConflictException('Chỉ lập đề nghị khi kết quả phỏng vấn gần nhất đề xuất nhận và không còn vòng nào đánh giá loại');
      const band = app.jobOpening.salaryBandId ? await tx.hrmsSalaryBand.findUnique({ where: { id: app.jobOpening.salaryBandId } }) : null;
      const joiningDate = dateKey(dto.joiningDate);
      if (!band || band.status !== 'ACTIVE' || band.compensationBasis !== 'MONTHLY' || band.effectiveFrom > joiningDate || (band.effectiveTo && band.effectiveTo < joiningDate)) throw new ConflictException('Khung lương tháng của vị trí không còn hiệu lực vào ngày nhận việc');
      if (dto.offeredSalary < band.minSalary || dto.offeredSalary > band.maxSalary) throw new ConflictException(`Mức đề nghị phải nằm trong khung ${band.minSalary.toLocaleString('vi-VN')}–${band.maxSalary.toLocaleString('vi-VN')} đồng/tháng`);
      const request = app.jobOpening.requisitionId ? await tx.jobRequisition.findUnique({ where: { id: app.jobOpening.requisitionId } }) : null;
      if (!request || request.status !== 'APPROVED' || dto.offeredSalary * app.jobOpening.vacancies > request.budgetMonthly) throw new ConflictException('Offer vượt ngân sách/chỉ tiêu chưa duyệt');
      if (await tx.hrmsJobOffer.count({ where: { applicantId: app.id, status: { in: ['SENT','ACCEPTED'] } } })) throw new ConflictException('Đã có offer đang hiệu lực');
      const offer = await tx.hrmsJobOffer.create({ data: { ...dto, joiningDate, status: 'SENT' } });
      await tx.hrmsJobApplicant.update({ where: { id: app.id }, data: { stage: 'OFFER_SENT' } });
      await tx.auditLog.create({ data: { actorId, action: 'OFFER_PREPARED_FOR_DELIVERY', entityType: 'HrmsJobOffer', entityId: offer.id } });
      return offer;
    }, { isolationLevel: 'Serializable' });
  }

  async respondOffer(actorId: string, id: string, accepted: boolean, evidenceUrl: string) {
    if (!evidenceUrl?.trim()) throw new BadRequestException('Cần minh chứng phản hồi của ứng viên');
    return this.prisma.$transaction(async tx => {
      const offer = await tx.hrmsJobOffer.findUniqueOrThrow({ where: { id } });
      if (offer.status !== 'SENT') throw new ConflictException('Offer đã được phản hồi');
      const result = await tx.hrmsJobOffer.update({ where: { id }, data: { status: accepted ? 'ACCEPTED' : 'REJECTED', acceptedEvidenceUrl: evidenceUrl, respondedAt: new Date() } });
      if (!accepted) await tx.hrmsJobApplicant.update({ where: { id: offer.applicantId, stage: 'OFFER_SENT' }, data: { stage: 'REJECTED' } });
      await tx.auditLog.create({ data: { actorId, action: accepted ? 'OFFER_ACCEPTED' : 'OFFER_REJECTED', entityType: 'HrmsJobOffer', entityId: id } });
      return result;
    }, { isolationLevel: 'Serializable' });
  }

  async convertToEmployee(actorId: string, applicantId: string) {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
    return this.prisma.$transaction(async tx => {
      const app = await tx.hrmsJobApplicant.findUniqueOrThrow({ where: { id: applicantId }, include: { jobOpening: true, offers: { where: { status: 'ACCEPTED' }, orderBy: { respondedAt: 'desc' } } } });
      const offer = app.offers[0];
      if (app.stage !== 'OFFER_SENT' || !offer?.acceptedEvidenceUrl) throw new ConflictException('Phải có offer được chấp thuận và minh chứng trước khi nhận việc');
      if (!app.jobOpening.probationDays || app.jobOpening.probationDays < 1) throw new ConflictException('Cần cấu hình thời hạn thử việc của vị trí trước khi tiếp nhận');
      const hired = await tx.hrmsJobApplicant.count({ where: { jobOpeningId: app.jobOpeningId, stage: 'HIRED' } });
      if (hired >= app.jobOpening.vacancies) throw new ConflictException('Đã đủ chỉ tiêu tuyển');
      const req = app.jobOpening.requisitionId ? await tx.jobRequisition.findUniqueOrThrow({ where: { id: app.jobOpening.requisitionId } }) : null;
      if (!req || req.status !== 'APPROVED') throw new ConflictException('Chỉ tiêu không còn hiệu lực');
      const user = await tx.user.create({ data: { email: app.email, passwordHash, fullName: app.candidateName, phone: app.phone, employeeCode: `NV-${randomUUID().slice(0,8).toUpperCase()}`, jobTitle: offer.designation, salaryBandId: app.jobOpening.salaryBandId, baseSalary: offer.offeredSalary, hireDate: dateKey(offer.joiningDate), employmentStatus: 'PROBATION', status: 'DISABLED', orgUnitId: req.orgUnitId, roles: { create: { roleCode: 'USER' } } }, select: { id: true, email: true, fullName: true, employeeCode: true, employmentStatus: true, status: true } });
      await tx.personnelComprehensiveProfile.create({ data: { userId: user.id, recruitDate: dateKey(offer.joiningDate), recruitOrg: app.jobOpening.department } });
      await tx.contract.create({ data: { userId: user.id, contractNo: `TV-${user.employeeCode}`, type: 'PROBATION', startDate: dateKey(offer.joiningDate), endDate: new Date(dateKey(offer.joiningDate).getTime() + (app.jobOpening.probationDays - 1) * 86400000), baseSalary: offer.offeredSalary, compensationBasis: 'MONTHLY', insuranceSalary: offer.offeredSalary, createdById: actorId } });
      await tx.hrmsJobApplicant.update({ where: { id: applicantId, stage: 'OFFER_SENT' }, data: { stage: 'HIRED' } });
      const tasks = [{ title: 'Cấp tài khoản và đặt mật khẩu ban đầu', category: 'IT' }, { title: 'Xác minh hồ sơ và hợp đồng thử việc', category: 'HR' }, { title: 'Cấp tài sản và xác nhận giao nhận', category: 'ADMIN' }, { title: 'Hướng dẫn công việc và mục tiêu thử việc', category: 'DEPARTMENT' }];
      await tx.hrmsOnboardingTask.createMany({ data: tasks.map(task => ({ ...task, userId: user.id, assignee: user.fullName })) });
      await tx.hrmsLifecycleEvent.create({ data: { userId: user.id, employeeName: user.fullName, type: 'ONBOARDING', status: 'IN_PROGRESS', title: `Hội nhập ${user.fullName}`, effectiveDate: dateKey(offer.joiningDate), createdBy: actorId } });
      await tx.auditLog.create({ data: { actorId, action: 'APPLICANT_HIRED', entityType: 'User', entityId: user.id, afterData: { applicantId, offerId: offer.id } } });
      return user;
    }, { isolationLevel: 'Serializable' });
  }

}

@ApiTags('HRMS - Recruitment & ATS')
@ApiBearerAuth()
@Controller('hrms/recruitment')
@Roles('ADMIN', 'KM_MANAGER', 'HR_RECRUITER', 'BOD')
export class HrmsRecruitmentController {
  constructor(private readonly service: HrmsRecruitmentService) {}

  @Get('openings')
  listOpenings() {
    return this.service.listOpenings();
  }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Post('openings')
  createOpening(@Body() dto: CreateJobOpeningDto, @CurrentUser() actor: AuthUser) {
    return this.service.createOpening(actor.id, dto);
  }

  @Get('applicants')
  listApplicants(@Query('jobOpeningId') jobOpeningId?: string, @Query('stage') stage?: ApplicantStage) {
    return this.service.listApplicants(jobOpeningId, stage);
  }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Post('applicants')
  createApplicant(@Body() dto: CreateApplicantDto, @CurrentUser() actor: AuthUser) {
    return this.service.createApplicant(actor.id, dto);
  }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Patch('applicants/:id/stage')
  updateStage(@Param('id') id: string, @Body('stage') stage: ApplicantStage, @CurrentUser() actor: AuthUser) {
    return this.service.updateApplicantStage(actor.id, id, stage);
  }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Post('interviews')
  addInterview(@Body() dto: CreateInterviewRoundDto, @CurrentUser() actor: AuthUser) {
    return this.service.addInterviewRound(actor.id, dto);
  }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Post('offers')
  createOffer(@Body() dto: CreateJobOfferDto, @CurrentUser() actor: AuthUser) {
    return this.service.createOffer(actor.id, dto);
  }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Patch('offers/:id/respond')
  respondOffer(@Param('id') id: string, @Body() body: { accepted: boolean; evidenceUrl: string }, @CurrentUser() actor: AuthUser) { return this.service.respondOffer(actor.id, id, body.accepted === true, body.evidenceUrl); }

  @Roles('ADMIN','KM_MANAGER','HR_RECRUITER')
  @Post('applicants/:id/convert-to-employee')
  convertToEmployee(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.convertToEmployee(actor.id, id);
  }
}

@Module({
  controllers: [HrmsRecruitmentController],
  providers: [HrmsRecruitmentService],
  exports: [HrmsRecruitmentService],
})
export class HrmsRecruitmentModule {}
