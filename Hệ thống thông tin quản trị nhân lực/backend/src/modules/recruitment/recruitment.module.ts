import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

class CreateRequisitionDto {
  @ApiProperty() @IsString() @MaxLength(160) title!: string;
  @ApiProperty() @IsString() @MaxLength(120) position!: string;
  @ApiProperty() @IsInt() @Min(1) headcount!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}

class DecideRequisitionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) note?: string;
}

class CreateCandidateDto {
  @ApiProperty() @IsString() @MaxLength(160) fullName!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requisitionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

class UpdateCandidateDto {
  @ApiPropertyOptional() @IsOptional() @IsEnum(['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']) stage?: 'NEW' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() requisitionId?: string;
}

// ---------------------------------------------------------------------------
// Service — QP1 Tuyển dụng: phiếu đề xuất → thẩm định/duyệt → ống dẫn ứng viên
// ---------------------------------------------------------------------------

@Injectable()
export class RecruitmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------- phiếu đề xuất
  requisitions() {
    return this.prisma.jobRequisition.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { fullName: true } },
        _count: { select: { candidates: true } },
      },
    });
  }

  async createRequisition(dto: CreateRequisitionDto, actor: AuthUser, requestId?: string) {
    const requisition = await this.prisma.jobRequisition.create({
      data: { ...dto, requestedById: actor.id, status: 'PENDING_REVIEW' },
    });
    await this.audit.log({
      actorId: actor.id, action: 'REQUISITION_CREATED', entityType: 'JobRequisition', entityId: requisition.id,
      after: { title: dto.title, headcount: dto.headcount }, requestId,
    });
    return requisition;
  }

  /** Thẩm định + phê duyệt (UC05/UC06 gộp một bước duyệt của HR/quản lý). */
  async decideRequisition(id: string, approve: boolean, actor: AuthUser, note?: string, requestId?: string) {
    const requisition = await this.prisma.jobRequisition.findUnique({ where: { id } });
    if (!requisition) throw new NotFoundException('Không tìm thấy phiếu đề xuất tuyển dụng');
    if (requisition.status !== 'PENDING_REVIEW') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Phiếu đã được xử lý', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: {
        status: approve ? 'APPROVED' : 'REJECTED',
        decidedById: actor.id,
        decidedAt: new Date(),
        decisionNote: note,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: approve ? 'REQUISITION_APPROVED' : 'REQUISITION_REJECTED',
      entityType: 'JobRequisition', entityId: id, requestId,
    });
    return updated;
  }

  async closeRequisition(id: string, actor: AuthUser, requestId?: string) {
    const requisition = await this.prisma.jobRequisition.findUnique({ where: { id } });
    if (!requisition) throw new NotFoundException('Không tìm thấy phiếu đề xuất tuyển dụng');
    const updated = await this.prisma.jobRequisition.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    await this.audit.log({
      actorId: actor.id, action: 'REQUISITION_CLOSED', entityType: 'JobRequisition', entityId: id, requestId,
    });
    return updated;
  }

  // ---------------------------------------------------------------- ứng viên
  candidates() {
    return this.prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { requisition: { select: { id: true, title: true } } },
    });
  }

  async createCandidate(dto: CreateCandidateDto, actor: AuthUser, requestId?: string) {
    if (dto.requisitionId) {
      const req = await this.prisma.jobRequisition.findUnique({ where: { id: dto.requisitionId } });
      if (!req) throw new NotFoundException('Không tìm thấy phiếu tuyển dụng liên quan');
    }
    const candidate = await this.prisma.candidate.create({ data: dto });
    await this.audit.log({
      actorId: actor.id, action: 'CANDIDATE_CREATED', entityType: 'Candidate', entityId: candidate.id,
      after: { fullName: dto.fullName }, requestId,
    });
    return candidate;
  }

  /** Chuyển stage ống dẫn ứng viên (UC07) — HIRED là trạng thái kết thúc. */
  async updateCandidate(id: string, dto: UpdateCandidateDto, actor: AuthUser, requestId?: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');
    if (candidate.stage === 'HIRED' || candidate.stage === 'REJECTED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Ứng viên đã ở trạng thái kết thúc', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        stage: dto.stage,
        rating: dto.rating,
        notes: dto.notes,
        requisitionId: dto.requisitionId,
      },
    });
    await this.audit.log({
      actorId: actor.id, action: 'CANDIDATE_STAGE_CHANGED', entityType: 'Candidate', entityId: id,
      before: { stage: candidate.stage }, after: { stage: updated.stage }, requestId,
    });
    return updated;
  }
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('recruitment')
@ApiBearerAuth()
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly service: RecruitmentService) {}

  @Get('requisitions')
  requisitions() {
    return this.service.requisitions();
  }

  @Post('requisitions')
  createRequisition(@Body() dto: CreateRequisitionDto, @CurrentUser() user: AuthUser) {
    return this.service.createRequisition(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('requisitions/:id/approve')
  approveRequisition(@Param('id') id: string, @Body() dto: DecideRequisitionDto, @CurrentUser() user: AuthUser) {
    return this.service.decideRequisition(id, true, user, dto.note);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('requisitions/:id/reject')
  rejectRequisition(@Param('id') id: string, @Body() dto: DecideRequisitionDto, @CurrentUser() user: AuthUser) {
    return this.service.decideRequisition(id, false, user, dto.note);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('requisitions/:id/close')
  closeRequisition(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.closeRequisition(id, user);
  }

  @Get('candidates')
  candidates() {
    return this.service.candidates();
  }

  /** Mục 5 — siết quyền: chỉ HR/quản lý mới được thêm ứng viên và chuyển stage. */
  @Roles('ADMIN', 'KM_MANAGER')
  @Post('candidates')
  createCandidate(@Body() dto: CreateCandidateDto, @CurrentUser() user: AuthUser) {
    return this.service.createCandidate(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Patch('candidates/:id')
  updateCandidate(@Param('id') id: string, @Body() dto: UpdateCandidateDto, @CurrentUser() user: AuthUser) {
    return this.service.updateCandidate(id, dto, user);
  }
}

@Module({ controllers: [RecruitmentController], providers: [RecruitmentService] })
export class RecruitmentModule {}
