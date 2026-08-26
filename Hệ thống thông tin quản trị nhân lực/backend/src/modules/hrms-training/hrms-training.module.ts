import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
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

  @Get('grievances')
  listGrievances(@Query('userId') userId?: string, @Query('status') status?: GrievanceStatus) {
    return this.service.listGrievances(userId, status);
  }

  @Post('grievances')
  createGrievance(@Body() dto: CreateGrievanceDto) {
    return this.service.createGrievance('system', dto);
  }

  @Patch('grievances/:id/resolve')
  resolve(@Param('id') id: string, @Body('resolution') resolution: string) {
    return this.service.resolveGrievance('system', id, resolution);
  }
}

@Module({
  controllers: [HrmsTrainingController],
  providers: [HrmsTrainingService],
  exports: [HrmsTrainingService],
})
export class HrmsTrainingModule {}
