import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { ClaimStatus } from '@prisma/client';

export class CreateTravelRequestDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiProperty({ example: 'Khảo sát & Triển khai dự án tại Chi nhánh Đà Nẵng' })
  @IsString()
  purpose: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @IsString()
  fromLocation: string;

  @ApiProperty({ example: 'TP. Đà Nẵng' })
  @IsString()
  toLocation: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  @IsDateString()
  departureDate: string;

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' })
  @IsDateString()
  returnDate: string;

  @ApiPropertyOptional({ example: 15000000 })
  @IsOptional()
  @IsNumber()
  estimatedBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateExpenseClaimDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  travelRequestId?: string;

  @ApiProperty({ example: 'Thanh quyết toán chi phí công tác Đà Nẵng' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ default: 'TRAVEL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 12850000 })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsArray()
  items?: { item: string; amount: number; date: string }[];
}

export class CreateAdvanceDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  travelRequestId?: string;

  @ApiProperty({ example: 10000000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Tạm ứng chi phí vé máy bay và khách sạn' })
  @IsString()
  purpose: string;
}

@Injectable()
export class HrmsExpensesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listTravelRequests(userId?: string, status?: ClaimStatus) {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.hrmsTravelRequest.findMany({
      where,
      include: { advances: true, claims: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTravelRequest(actorId: string, dto: CreateTravelRequestDto) {
    const res = await this.prisma.hrmsTravelRequest.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        purpose: dto.purpose,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        departureDate: new Date(dto.departureDate),
        returnDate: new Date(dto.returnDate),
        estimatedBudget: dto.estimatedBudget ?? 0,
        notes: dto.notes,
        status: ClaimStatus.APPROVED,
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_TRAVEL_REQUEST',
      targetType: 'HrmsTravelRequest',
      targetId: res.id,
      description: `Tạo đề xuất công tác: ${dto.purpose} (${dto.fromLocation} -> ${dto.toLocation})`,
    });

    return res;
  }

  async listClaims(userId?: string, status?: ClaimStatus) {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.prisma.hrmsExpenseClaim.findMany({
      where,
      include: { travelRequest: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClaim(actorId: string, dto: CreateExpenseClaimDto) {
    const res = await this.prisma.hrmsExpenseClaim.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        travelRequestId: dto.travelRequestId,
        title: dto.title,
        category: dto.category ?? 'TRAVEL',
        totalAmount: dto.totalAmount,
        approvedAmount: dto.totalAmount,
        status: ClaimStatus.APPROVED,
        items: (dto.items ?? []) as import('@prisma/client').Prisma.InputJsonValue,
        submittedAt: new Date(),
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_EXPENSE_CLAIM',
      targetType: 'HrmsExpenseClaim',
      targetId: res.id,
      description: `Tạo thanh quyết toán chi phí: ${dto.title} (${dto.totalAmount.toLocaleString('vi-VN')} VND)`,
    });

    return res;
  }

  async updateClaimStatus(actorId: string, id: string, status: ClaimStatus) {
    const claim = await this.prisma.hrmsExpenseClaim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Không tìm thấy bảng kê chi phí');

    const res = await this.prisma.hrmsExpenseClaim.update({
      where: { id },
      data: { status, approvedBy: actorId },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_CLAIM_STATUS',
      targetType: 'HrmsExpenseClaim',
      targetId: id,
      description: `Duyệt trạng thái bảng kê chi phí [${status}] cho ${claim.title}`,
    });

    return res;
  }

  async listAdvances(userId?: string) {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    return this.prisma.hrmsEmployeeAdvance.findMany({
      where,
      include: { travelRequest: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdvance(actorId: string, dto: CreateAdvanceDto) {
    const res = await this.prisma.hrmsEmployeeAdvance.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        travelRequestId: dto.travelRequestId,
        amount: dto.amount,
        purpose: dto.purpose,
        status: ClaimStatus.APPROVED,
        disbursedAt: new Date(),
      },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE_ADVANCE',
      targetType: 'HrmsEmployeeAdvance',
      targetId: res.id,
      description: `Tạo đề xuất tạm ứng: ${dto.purpose} (${dto.amount.toLocaleString('vi-VN')} VND)`,
    });

    return res;
  }

  async deleteClaim(actorId: string, id: string) {
    const claim = await this.prisma.hrmsExpenseClaim.findUnique({ where: { id } });
    if (!claim) throw new NotFoundException('Không tìm thấy bảng kê chi phí');

    const res = await this.prisma.hrmsExpenseClaim.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE_EXPENSE_CLAIM',
      targetType: 'HrmsExpenseClaim',
      targetId: id,
      description: `Xóa bảng kê chi phí: ${claim.title}`,
    });

    return res;
  }

  async updateTravelRequestStatus(actorId: string, id: string, status: ClaimStatus) {
    const travel = await this.prisma.hrmsTravelRequest.findUnique({ where: { id } });
    if (!travel) throw new NotFoundException('Không tìm thấy chuyến công tác');

    const res = await this.prisma.hrmsTravelRequest.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_TRAVEL_STATUS',
      targetType: 'HrmsTravelRequest',
      targetId: id,
      description: `Cập nhật trạng thái công tác [${status}] cho ${travel.purpose}`,
    });

    return res;
  }

  async deleteTravelRequest(actorId: string, id: string) {
    const travel = await this.prisma.hrmsTravelRequest.findUnique({ where: { id } });
    if (!travel) throw new NotFoundException('Không tìm thấy chuyến công tác');

    const res = await this.prisma.hrmsTravelRequest.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE_TRAVEL_REQUEST',
      targetType: 'HrmsTravelRequest',
      targetId: id,
      description: `Xóa đề xuất công tác: ${travel.purpose}`,
    });

    return res;
  }

  async updateAdvanceStatus(actorId: string, id: string, status: ClaimStatus) {
    const adv = await this.prisma.hrmsEmployeeAdvance.findUnique({ where: { id } });
    if (!adv) throw new NotFoundException('Không tìm thấy đề xuất tạm ứng');

    const res = await this.prisma.hrmsEmployeeAdvance.update({
      where: { id },
      data: {
        status,
        disbursedAt: status === ClaimStatus.APPROVED || status === ClaimStatus.PAID ? new Date() : undefined,
      },
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE_ADVANCE_STATUS',
      targetType: 'HrmsEmployeeAdvance',
      targetId: id,
      description: `Cập nhật trạng thái tạm ứng [${status}] cho ${adv.purpose}`,
    });

    return res;
  }

  async deleteAdvance(actorId: string, id: string) {
    const adv = await this.prisma.hrmsEmployeeAdvance.findUnique({ where: { id } });
    if (!adv) throw new NotFoundException('Không tìm thấy đề xuất tạm ứng');

    const res = await this.prisma.hrmsEmployeeAdvance.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE_ADVANCE',
      targetType: 'HrmsEmployeeAdvance',
      targetId: id,
      description: `Xóa đề xuất tạm ứng: ${adv.purpose}`,
    });

    return res;
  }
}

@ApiTags('HRMS - Expenses & Travel Claims')
@ApiBearerAuth()
@Controller('hrms/expenses')
export class HrmsExpensesController {
  constructor(private readonly service: HrmsExpensesService) {}

  @Get('travel-requests')
  listTravelRequests(@Query('userId') userId?: string, @Query('status') status?: ClaimStatus) {
    return this.service.listTravelRequests(userId, status);
  }

  @Post('travel-requests')
  createTravelRequest(@Body() dto: CreateTravelRequestDto) {
    return this.service.createTravelRequest('system', dto);
  }

  @Patch('travel-requests/:id/status')
  updateTravelRequestStatus(@Param('id') id: string, @Body('status') status: ClaimStatus) {
    return this.service.updateTravelRequestStatus('system', id, status);
  }

  @Delete('travel-requests/:id')
  deleteTravelRequest(@Param('id') id: string) {
    return this.service.deleteTravelRequest('system', id);
  }

  @Get('claims')
  listClaims(@Query('userId') userId?: string, @Query('status') status?: ClaimStatus) {
    return this.service.listClaims(userId, status);
  }

  @Post('claims')
  createClaim(@Body() dto: CreateExpenseClaimDto) {
    return this.service.createClaim('system', dto);
  }

  @Patch('claims/:id/status')
  updateClaimStatus(@Param('id') id: string, @Body('status') status: ClaimStatus) {
    return this.service.updateClaimStatus('system', id, status);
  }

  @Delete('claims/:id')
  deleteClaim(@Param('id') id: string) {
    return this.service.deleteClaim('system', id);
  }

  @Get('advances')
  listAdvances(@Query('userId') userId?: string) {
    return this.service.listAdvances(userId);
  }

  @Post('advances')
  createAdvance(@Body() dto: CreateAdvanceDto) {
    return this.service.createAdvance('system', dto);
  }

  @Patch('advances/:id/status')
  updateAdvanceStatus(@Param('id') id: string, @Body('status') status: ClaimStatus) {
    return this.service.updateAdvanceStatus('system', id, status);
  }

  @Delete('advances/:id')
  deleteAdvance(@Param('id') id: string) {
    return this.service.deleteAdvance('system', id);
  }
}

@Module({
  controllers: [HrmsExpensesController],
  providers: [HrmsExpensesService],
  exports: [HrmsExpensesService],
})
export class HrmsExpensesModule {}
