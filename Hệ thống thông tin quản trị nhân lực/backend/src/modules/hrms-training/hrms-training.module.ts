import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { workDate } from '../../common/hr-time';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { GrievanceStatus } from '@prisma/client';

export class CreateTrainingProgramDto {
  @ApiProperty({ example: 'Khóa Đào tạo: An toàn Thông tin & ISO 27001' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Chuyên gia An ninh Mạng' })
  @IsString()
  trainerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2026-09-10T09:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-11T17:00:00.000Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateGrievanceDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Trần Thị Mai' })
  @IsString()
  employeeName: string;

  @ApiProperty({ example: 'Kiến nghị nâng cấp thiết bị và đường truyền phòng họp' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ default: 'WORK_ENVIRONMENT' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty()
  @IsString()
  description: string;
}

@Injectable()
export class HrmsTrainingService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listPrograms(userId?: string) {
    const programs = await this.prisma.hrmsTrainingProgram.findMany({ include: { _count: { select: { feedbacks: true } } }, orderBy: { startDate: 'desc' } });
    return Promise.all(programs.map(async program => {
      const enrollments = await this.prisma.hrmsTrainingEnrollment.findMany({ where: { programId: program.id, ...(userId ? { userId } : {}) }, orderBy: { enrolledAt: 'asc' } });
      const users = await this.prisma.user.findMany({ where: { id: { in: enrollments.map(e=>e.userId) } }, select: { id: true, fullName: true } });
      return { ...program, enrollments: enrollments.map(e=>({...e, employeeName:users.find(u=>u.id===e.userId)?.fullName})), participantCount: await this.prisma.hrmsTrainingEnrollment.count({ where: { programId: program.id, status: { not: 'CANCELLED' } } }) };
    }));
  }
  async enroll(programId: string, userId: string) {
    return this.prisma.$transaction(async tx => {
      const program = await tx.hrmsTrainingProgram.findUniqueOrThrow({ where: { id: programId } });
      if (program.status === 'COMPLETED') throw new ConflictException('Khóa học đã kết thúc');
      const enrolled = await tx.hrmsTrainingEnrollment.count({ where: { programId, status: { not: 'CANCELLED' } } });
      if (enrolled >= program.maxParticipants) throw new ConflictException('Khóa học đã đủ chỗ');
      const prior = await tx.hrmsTrainingEnrollment.findUnique({ where: { programId_userId: { programId, userId } } });
      if (prior && prior.status !== 'CANCELLED') throw new ConflictException('Bạn đã ghi danh');
      return tx.hrmsTrainingEnrollment.upsert({ where: { programId_userId: { programId, userId } }, create: { programId, userId }, update: { status: 'ENROLLED', enrolledAt: new Date() } });
    }, { isolationLevel: 'Serializable' });
  }
  async completeEnrollment(actorId: string, programId: string, userId: string, dto: { score: number; evidenceUrl: string }) {
    if (!Number.isFinite(dto.score) || dto.score < 0 || dto.score > 100 || !dto.evidenceUrl?.trim()) throw new BadRequestException('Cần điểm 0–100 và minh chứng học tập');
    if (actorId === userId) throw new ForbiddenException('Không được tự chứng nhận kết quả của mình');
    return this.prisma.$transaction(async tx => {
      const enrollment = await tx.hrmsTrainingEnrollment.findUniqueOrThrow({ where: { programId_userId: { programId, userId } } });
      if (enrollment.status !== 'ENROLLED' && enrollment.status !== 'ATTENDED') throw new ConflictException('Kết quả học tập đã được xử lý');
      const program = await tx.hrmsTrainingProgram.findUniqueOrThrow({ where: { id: programId } });
      const passed = dto.score >= 50;
      const certificate = passed ? await tx.certificate.create({ data: { userId, name: program.name, certNo: `DT-${enrollment.id}`, issuedBy: program.trainerName, issuedDate: workDate(), fileUrl: dto.evidenceUrl } }) : null;
      await tx.auditLog.create({ data: { actorId, action: 'TRAINING_RESULT_VERIFIED', entityType: 'HrmsTrainingEnrollment', entityId: enrollment.id, afterData: { score: dto.score, passed } } });
      return tx.hrmsTrainingEnrollment.update({ where: { id: enrollment.id }, data: { status: passed ? 'COMPLETED' : 'FAILED', score: dto.score, evidenceUrl: dto.evidenceUrl, certificateId: certificate?.id, completedAt: new Date(), verifiedBy: actorId } });
    }, { isolationLevel: 'Serializable' });
  }

  async createProgram(actorId: string, dto: CreateTrainingProgramDto) {
    const res = await this.prisma.hrmsTrainingProgram.create({
      data: {
        name: dto.name,
        trainerName: dto.trainerName,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        maxParticipants: dto.maxParticipants ?? 30,
        description: dto.description,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_TRAINING_PROGRAM',
      targetType: 'HrmsTrainingProgram',
      targetId: res.id,
      description: `Tạo chương trình đào tạo: ${dto.name}`,
    });

    return res;
  }

  async listGrievances(userId?: string, status?: GrievanceStatus) {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.hrmsGrievance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGrievance(actorId: string, dto: CreateGrievanceDto) {
    const res = await this.prisma.hrmsGrievance.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        subject: dto.subject,
        category: dto.category ?? 'WORK_ENVIRONMENT',
        description: dto.description,
        status: GrievanceStatus.OPEN,
      },
    });

    await this.audit.log({
      actorId,
      action: 'SUBMIT_GRIEVANCE',
      targetType: 'HrmsGrievance',
      targetId: res.id,
      description: `Gửi kiến nghị / khiếu nại: ${dto.subject}`,
    });

    return res;
  }

  async updateProgram(actorId: string, id: string, dto: Partial<CreateTrainingProgramDto> & { status?: string }) {
    const prog = await this.prisma.hrmsTrainingProgram.findUnique({ where: { id } });
    if (!prog) throw new NotFoundException('Không tìm thấy khóa đào tạo');

    const res = await this.prisma.hrmsTrainingProgram.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.trainerName && { trainerName: dto.trainerName }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.maxParticipants && { maxParticipants: dto.maxParticipants }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status }),
      },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_TRAINING_PROGRAM',
      targetType: 'HrmsTrainingProgram',
      targetId: id,
      description: `Cập nhật khóa đào tạo: ${res.name}`,
    });

    return res;
  }

  async deleteProgram(actorId: string, id: string) {
    const prog = await this.prisma.hrmsTrainingProgram.findUnique({ where: { id } });
    if (!prog) throw new NotFoundException('Không tìm thấy khóa đào tạo');

    if (await this.prisma.hrmsTrainingEnrollment.count({ where: { programId: id } })) throw new ConflictException('Khóa đã có học viên; giữ lại kết quả và chứng nhận');
    await this.prisma.hrmsTrainingProgram.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE_TRAINING_PROGRAM',
      targetType: 'HrmsTrainingProgram',
      targetId: id,
      description: `Xóa khóa đào tạo: ${prog.name}`,
    });

    return { success: true, message: 'Đã xóa khóa đào tạo thành công' };
  }

  async updateGrievanceStatus(actorId: string, id: string, status: GrievanceStatus, resolution?: string) {
    const gr = await this.prisma.hrmsGrievance.findUnique({ where: { id } });
    if (!gr) throw new NotFoundException('Không tìm thấy kiến nghị');

    const updateData: Record<string, unknown> = { status };
    if (resolution !== undefined) updateData.resolution = resolution;
    if (status === GrievanceStatus.RESOLVED || status === GrievanceStatus.DISMISSED) {
      updateData.resolvedBy = actorId;
      updateData.resolvedAt = new Date();
    }

    const res = await this.prisma.hrmsGrievance.update({
      where: { id },
      data: updateData,
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_GRIEVANCE_STATUS',
      targetType: 'HrmsGrievance',
      targetId: id,
      description: `Cập nhật trạng thái kiến nghị ${gr.subject} -> ${status}`,
    });

    return res;
  }

  async deleteGrievance(actorId: string, id: string) {
    const gr = await this.prisma.hrmsGrievance.findUnique({ where: { id } });
    if (!gr) throw new NotFoundException('Không tìm thấy kiến nghị');

    await this.prisma.hrmsGrievance.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE_GRIEVANCE',
      targetType: 'HrmsGrievance',
      targetId: id,
      description: `Xóa kiến nghị: ${gr.subject}`,
    });

    return { success: true, message: 'Đã xóa kiến nghị thành công' };
  }

  async resolveGrievance(actorId: string, id: string, resolution: string) {
    const gr = await this.prisma.hrmsGrievance.findUnique({ where: { id } });
    if (!gr) throw new NotFoundException('Không tìm thấy khiếu nại');

    const res = await this.prisma.hrmsGrievance.update({
      where: { id },
      data: {
        resolution,
        status: GrievanceStatus.RESOLVED,
        resolvedBy: actorId,
        resolvedAt: new Date(),
      },
    });

    await this.audit.log({
      actorId,
      action: 'RESOLVE_GRIEVANCE',
      targetType: 'HrmsGrievance',
      targetId: id,
      description: `Giải quyết kiến nghị ${gr.subject}`,
    });

    return res;
  }
}

@ApiTags('HRMS - Training & Grievances')
@ApiBearerAuth()
@Controller('hrms/training')
@Roles('ADMIN', 'KM_MANAGER', 'HR_TRAINER')
export class HrmsTrainingController {
  constructor(private readonly service: HrmsTrainingService) {}

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Get('programs')
  listPrograms(@CurrentUser() actor: AuthUser) {
    return this.service.listPrograms(actor.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER'].includes(role)) ? undefined : actor.id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'HR_TRAINER', 'ACCOUNTANT', 'BOD', 'HR_RECRUITER')
  @Post('programs/:id/enroll')
  enroll(@Param('id') id: string, @CurrentUser() actor: AuthUser) { return this.service.enroll(id, actor.id); }

  @Patch('programs/:id/enrollments/:userId')
  complete(@Param('id') id: string, @Param('userId') userId: string, @Body() dto: { score: number; evidenceUrl: string }, @CurrentUser() actor: AuthUser) { return this.service.completeEnrollment(actor.id, id, userId, dto); }

  @Post('programs')
  createProgram(@Body() dto: CreateTrainingProgramDto, @CurrentUser() actor: AuthUser) {
    return this.service.createProgram(actor.id, dto);
  }

  @Patch('programs/:id')
  updateProgram(@Param('id') id: string, @Body() dto: Partial<CreateTrainingProgramDto> & { status?: string }, @CurrentUser() actor: AuthUser) {
    return this.service.updateProgram(actor.id, id, dto);
  }

  @Delete('programs/:id')
  deleteProgram(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteProgram(actor.id, id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Get('grievances')
  listGrievances(@CurrentUser() actor: AuthUser, @Query('userId') userId?: string, @Query('status') status?: GrievanceStatus) {
    return this.service.listGrievances(actor.roles.some(r => ['ADMIN', 'KM_MANAGER', 'HR_TRAINER'].includes(r)) ? userId : actor.id, status);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Post('grievances')
  createGrievance(@Body() dto: CreateGrievanceDto, @CurrentUser() actor: AuthUser) {
    return this.service.createGrievance(actor.id, { ...dto, userId: actor.id, employeeName: actor.fullName ?? actor.email });
  }

  @Patch('grievances/:id/status')
  updateStatus(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body('status') status: GrievanceStatus,
    @Body('resolution') resolution?: string) {
    return this.service.updateGrievanceStatus(actor.id, id, status, resolution);
  }

  @Patch('grievances/:id/resolve')
  resolve(@Param('id') id: string, @Body('resolution') resolution: string, @CurrentUser() actor: AuthUser) {
    return this.service.resolveGrievance(actor.id, id, resolution);
  }

  @Delete('grievances/:id')
  deleteGrievance(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteGrievance(actor.id, id);
  }
}

@Module({
  controllers: [HrmsTrainingController],
  providers: [HrmsTrainingService],
  exports: [HrmsTrainingService],
})
export class HrmsTrainingModule {}
