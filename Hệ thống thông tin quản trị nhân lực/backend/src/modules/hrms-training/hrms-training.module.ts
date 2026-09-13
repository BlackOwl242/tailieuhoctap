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

  async listPrograms() {
    return this.prisma.hrmsTrainingProgram.findMany({
      include: { feedbacks: true, _count: { select: { feedbacks: true } } },
      orderBy: { startDate: 'desc' },
    });
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
export class HrmsTrainingController {
  constructor(private readonly service: HrmsTrainingService) {}

  @Get('programs')
  listPrograms() {
    return this.service.listPrograms();
  }

  @Post('programs')
  createProgram(@Body() dto: CreateTrainingProgramDto) {
    return this.service.createProgram('system', dto);
  }

  @Patch('programs/:id')
  updateProgram(@Param('id') id: string, @Body() dto: Partial<CreateTrainingProgramDto> & { status?: string }) {
    return this.service.updateProgram('system', id, dto);
  }

  @Delete('programs/:id')
  deleteProgram(@Param('id') id: string) {
    return this.service.deleteProgram('system', id);
  }

  @Get('grievances')
  listGrievances(@Query('userId') userId?: string, @Query('status') status?: GrievanceStatus) {
    return this.service.listGrievances(userId, status);
  }

  @Post('grievances')
  createGrievance(@Body() dto: CreateGrievanceDto) {
    return this.service.createGrievance('system', dto);
  }

  @Patch('grievances/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: GrievanceStatus,
    @Body('resolution') resolution?: string,
  ) {
    return this.service.updateGrievanceStatus('system', id, status, resolution);
  }

  @Patch('grievances/:id/resolve')
  resolve(@Param('id') id: string, @Body('resolution') resolution: string) {
    return this.service.resolveGrievance('system', id, resolution);
  }

  @Delete('grievances/:id')
  deleteGrievance(@Param('id') id: string) {
    return this.service.deleteGrievance('system', id);
  }
}

@Module({
  controllers: [HrmsTrainingController],
  providers: [HrmsTrainingService],
  exports: [HrmsTrainingService],
})
export class HrmsTrainingModule {}
