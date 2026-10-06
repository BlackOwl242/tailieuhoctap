import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
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

export class UpdateAdvanceStatusDto {
  @IsEnum(ClaimStatus)
  status: ClaimStatus;

  @IsOptional() @IsIn(['CASH', 'BANK'])
  paymentMethod?: 'CASH' | 'BANK';
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
    const recipient = await this.prisma.user.findFirst({where:{id:dto.userId,deletedAt:null}});
    if (!recipient) throw new BadRequestException('Cần chọn nhân viên hiện có');
    if (new Date(dto.returnDate) < new Date(dto.departureDate) || (dto.estimatedBudget ?? 0) < 0) throw new BadRequestException('Thời gian/ngân sách công tác không hợp lệ');
    const res = await this.prisma.hrmsTravelRequest.create({
      data: {
        userId: dto.userId,
        employeeName: recipient.fullName,
        purpose: dto.purpose,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        departureDate: new Date(dto.departureDate),
        returnDate: new Date(dto.returnDate),
        estimatedBudget: dto.estimatedBudget ?? 0,
        notes: dto.notes,
        status: ClaimStatus.SUBMITTED,
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
    const recipient = await this.prisma.user.findFirst({where:{id:dto.userId,deletedAt:null}});
    if (!recipient) throw new BadRequestException('Cần chọn nhân viên hiện có');
    if (!dto.items?.length || dto.items.some(item => !Number.isFinite(item.amount) || item.amount < 0) || Math.abs(dto.items.reduce((sum, item) => sum + item.amount, 0) - dto.totalAmount) > 0.01) throw new BadRequestException('Tổng bảng kê phải bằng tổng chi tiết hợp lệ');
    if (dto.travelRequestId) {
      const travel = await this.prisma.hrmsTravelRequest.findUniqueOrThrow({ where: { id: dto.travelRequestId } });
      if (travel.userId !== dto.userId || travel.status !== 'APPROVED') throw new ConflictException('Bảng kê phải thuộc chuyến công tác đã được duyệt của cùng nhân viên');
      if (travel.settlementClosedAt) throw new ConflictException('Đối soát tạm ứng chuyến đi đã khóa');
    }

    const res = await this.prisma.hrmsExpenseClaim.create({
      data: {
        userId: dto.userId,
        employeeName: recipient.fullName,
        travelRequestId: dto.travelRequestId,
        title: dto.title,
        category: dto.category ?? 'TRAVEL',
        totalAmount: dto.totalAmount,
        approvedAmount: null,
        status: ClaimStatus.SUBMITTED,
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

  private async statusPermission(actorId: string, status: ClaimStatus, current: ClaimStatus, userId: string) {
    if (!Object.values(ClaimStatus).includes(status)) throw new BadRequestException('Trạng thái không hợp lệ');
    const graph: Record<string, string[]> = { DRAFT: ['SUBMITTED'], SUBMITTED: ['APPROVED', 'REJECTED'], APPROVED: ['PAID'], REJECTED: [], PAID: [] };
    if (!graph[current]?.includes(status)) throw new ConflictException('Không được đảo ngược/bỏ qua bước phê duyệt');
    if (actorId === userId) throw new ForbiddenException('Không được tự duyệt hoặc chi trả đề xuất của mình');
    const roles = await this.prisma.userRole.findMany({ where: { userId: actorId }, select: { roleCode: true } });
    const allowed = status === 'PAID' ? ['ADMIN', 'ACCOUNTANT'] : ['ADMIN', 'KM_MANAGER', 'BOD'];
    if (!roles.some(role => allowed.includes(role.roleCode))) throw new ForbiddenException('Không có quyền duyệt/chi trả bước này');
  }

  async updateClaimStatus(actorId: string, id: string, status: ClaimStatus) {
    const claim = await this.prisma.hrmsExpenseClaim.findUniqueOrThrow({ where: { id } });
    await this.statusPermission(actorId, status, claim.status, claim.userId);
    return this.prisma.$transaction(async tx => {
      const changed = await tx.hrmsExpenseClaim.updateMany({ where: { id, status: claim.status }, data: { status, approvedBy: actorId, approvedAmount: status === 'APPROVED' ? claim.totalAmount : undefined } });
      if (changed.count !== 1) throw new ConflictException('Bảng kê vừa được xử lý');
      if (status === 'PAID') {
        const advances = claim.travelRequestId ? await tx.hrmsEmployeeAdvance.aggregate({ where: { travelRequestId: claim.travelRequestId, userId: claim.userId, status: 'PAID' }, _sum: { amount: true } }) : { _sum: { amount: 0 } };
        const previous = claim.travelRequestId ? await tx.expenseSettlement.aggregate({ where: { travelRequestId: claim.travelRequestId }, _sum: { advanceApplied: true } }) : { _sum: { advanceApplied: 0 } };
        const available = Math.max(0, (advances._sum.amount ?? 0) - (previous._sum.advanceApplied ?? 0));
        const applied = Math.min(available, claim.approvedAmount ?? claim.totalAmount);
        await tx.expenseSettlement.create({ data: { claimId: id, travelRequestId: claim.travelRequestId, userId: claim.userId, advanceApplied: applied, payableAmount: (claim.approvedAmount ?? claim.totalAmount) - applied, actorId } });
      }
      await tx.auditLog.create({ data: { actorId, action: `EXPENSE_${status}`, entityType: 'HrmsExpenseClaim', entityId: id } });
      return tx.hrmsExpenseClaim.findUniqueOrThrow({ where: { id } });
    }, { isolationLevel: 'Serializable' });
  }

  async closeTravelSettlement(actorId: string, travelRequestId: string) {
    const travel = await this.prisma.hrmsTravelRequest.findUnique({ where: { id: travelRequestId } });
    if (!travel) throw new NotFoundException('Không tìm thấy chuyến công tác');
    if (travel.settlementClosedAt) throw new ConflictException('Đối soát chuyến công tác đã khóa');
    const roles = await this.prisma.userRole.findMany({ where: { userId: actorId }, select: { roleCode: true } });
    if (!roles.some(role => ['ADMIN', 'ACCOUNTANT'].includes(role.roleCode))) throw new ForbiddenException('Chỉ kế toán mới được khóa quyết toán tạm ứng');
    const claims = await this.prisma.hrmsExpenseClaim.findMany({ where: { travelRequestId } });
    if (claims.some(claim => !['PAID', 'REJECTED'].includes(claim.status))) throw new ConflictException('Cần xử lý xong mọi bảng kê đã nộp trước khi khóa quyết toán');
    return this.prisma.$transaction(async tx => {
      const paidAdvances = await tx.hrmsEmployeeAdvance.aggregate({ where: { travelRequestId, userId: travel.userId, status: 'PAID' }, _sum: { amount: true } });
      const paidClaims = await tx.hrmsExpenseClaim.aggregate({ where: { travelRequestId, userId: travel.userId, status: 'PAID' }, _sum: { approvedAmount: true } });
      const totalAdvance = paidAdvances._sum.amount ?? 0;
      const totalExpense = paidClaims._sum.approvedAmount ?? 0;
      const due = Math.max(0, totalAdvance - totalExpense);
      const latestSettlement = await tx.expenseSettlement.findFirst({ where: { travelRequestId }, orderBy: { settledAt: 'desc' } });
      if (due > 0 && latestSettlement) await tx.expenseSettlement.update({ where: { id: latestSettlement.id }, data: { advanceRefundDue: due, refundStatus: 'DUE' } });
      const updated = await tx.hrmsTravelRequest.updateMany({ where: { id: travelRequestId, settlementClosedAt: null }, data: { settlementClosedAt: new Date(), settlementClosedBy: actorId, advanceRefundDue: due, refundStatus: due > 0 ? 'DUE' : 'NONE' } });
      if (updated.count !== 1) throw new ConflictException('Đối soát vừa được khóa bởi người khác');
      await tx.auditLog.create({ data: { actorId, action: 'ADVANCE_SETTLEMENT_CLOSED', entityType: 'HrmsTravelRequest', entityId: travelRequestId, afterData: { totalAdvance, totalExpense, refundDue: due } } });
      return tx.hrmsTravelRequest.findUniqueOrThrow({ where: { id: travelRequestId }, include: { advances: true, claims: true } });
    }, { isolationLevel: 'Serializable' });
  }

  async recordAdvanceRefund(actorId: string, travelRequestId: string, amount: number, note?: string) {
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Số tiền thu hồi phải là số dương');
    const roles = await this.prisma.userRole.findMany({ where: { userId: actorId }, select: { roleCode: true } });
    if (!roles.some(role => ['ADMIN', 'ACCOUNTANT'].includes(role.roleCode))) throw new ForbiddenException('Chỉ kế toán mới được ghi nhận đã thu hồi tạm ứng');
    return this.prisma.$transaction(async tx => {
      const travel = await tx.hrmsTravelRequest.findUnique({ where: { id: travelRequestId } });
      if (!travel) throw new NotFoundException('Không tìm thấy chuyến công tác');
      if (!travel.settlementClosedAt || travel.refundStatus === 'NONE') throw new ConflictException('Chuyến đi chưa có khoản tạm ứng dư cần thu hồi');
      const outstanding = travel.advanceRefundDue - travel.advanceRefundPaid;
      if (amount > outstanding) throw new BadRequestException(`Số tiền vượt dư nợ ${outstanding.toLocaleString('vi-VN')} VND`);
      const paid = travel.advanceRefundPaid + amount;
      const changed = await tx.hrmsTravelRequest.updateMany({ where: { id: travelRequestId, advanceRefundPaid: travel.advanceRefundPaid, settlementClosedAt: { not: null } }, data: { advanceRefundPaid: paid, refundStatus: paid >= travel.advanceRefundDue ? 'REPAID' : 'PARTIAL' } });
      if (changed.count !== 1) throw new ConflictException('Khoản thu hồi vừa được ghi nhận bởi người khác');
      const settlement = await tx.expenseSettlement.findFirst({ where: { travelRequestId }, orderBy: { settledAt: 'desc' } });
      if (settlement) await tx.expenseSettlement.update({ where: { id: settlement.id }, data: { advanceRefundPaid: { increment: amount }, refundStatus: paid >= travel.advanceRefundDue ? 'REPAID' : 'PARTIAL' } });
      await tx.auditLog.create({ data: { actorId, action: 'ADVANCE_REFUND_RECEIVED', entityType: 'HrmsTravelRequest', entityId: travelRequestId, afterData: { amount, outstanding, note } } });
      return tx.hrmsTravelRequest.findUniqueOrThrow({ where: { id: travelRequestId } });
    }, { isolationLevel: 'Serializable' });
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
    const recipient = await this.prisma.user.findFirst({where:{id:dto.userId,deletedAt:null}});
    if (!recipient) throw new BadRequestException('Cần chọn nhân viên hiện có');
    if (!Number.isFinite(dto.amount) || dto.amount <= 0) throw new BadRequestException('Tiền tạm ứng phải dương');
    if (dto.travelRequestId) { const travel=await this.prisma.hrmsTravelRequest.findUniqueOrThrow({where:{id:dto.travelRequestId}}); if(travel.userId!==dto.userId || travel.status!=='APPROVED') throw new ConflictException('Tạm ứng phải thuộc chuyến đã duyệt của cùng nhân viên'); if(travel.settlementClosedAt) throw new ConflictException('Đối soát tạm ứng chuyến đi đã khóa'); }
    const res = await this.prisma.hrmsEmployeeAdvance.create({
      data: {
        userId: dto.userId,
        employeeName: recipient.fullName,
        travelRequestId: dto.travelRequestId,
        amount: dto.amount,
        purpose: dto.purpose,
        status: ClaimStatus.SUBMITTED,
        disbursedAt: null,
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

    if (!['DRAFT', 'SUBMITTED', 'REJECTED'].includes(claim.status)) throw new ConflictException('Không được xóa chứng từ đã duyệt/chi trả');
    const res = await this.prisma.hrmsExpenseClaim.delete({ where: { id, status: { in: ['DRAFT','SUBMITTED','REJECTED'] } } });

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
    await this.statusPermission(actorId, status, travel.status, travel.userId);

    const res = await this.prisma.hrmsTravelRequest.update({
      where: { id, status: travel.status },
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

    if (!['DRAFT', 'SUBMITTED', 'REJECTED'].includes(travel.status)) throw new ConflictException('Không được xóa chứng từ đã duyệt/chi trả');
    const res = await this.prisma.hrmsTravelRequest.delete({ where: { id, status: { in: ['DRAFT','SUBMITTED','REJECTED'] } } });

    await this.audit.log({
      actorId,
      action: 'DELETE_TRAVEL_REQUEST',
      targetType: 'HrmsTravelRequest',
      targetId: id,
      description: `Xóa đề xuất công tác: ${travel.purpose}`,
    });

    return res;
  }

  async updateAdvanceStatus(actorId: string, id: string, status: ClaimStatus, paymentMethod?: 'CASH' | 'BANK') {
    const adv = await this.prisma.hrmsEmployeeAdvance.findUnique({ where: { id } });
    if (!adv) throw new NotFoundException('Không tìm thấy đề xuất tạm ứng');
    await this.statusPermission(actorId, status, adv.status, adv.userId);
    if (status === ClaimStatus.PAID && !paymentMethod) throw new BadRequestException('Khi giải ngân cần ghi nhận tiền mặt hay chuyển khoản');

    const res = await this.prisma.hrmsEmployeeAdvance.update({
      where: { id, status: adv.status },
      data: {
        status,
        disbursedAt: status === ClaimStatus.PAID ? new Date() : undefined,
        paymentMethod: status === ClaimStatus.PAID ? paymentMethod : undefined,
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

    if (!['DRAFT', 'SUBMITTED', 'REJECTED'].includes(adv.status)) throw new ConflictException('Không được xóa chứng từ đã duyệt/chi trả');
    const res = await this.prisma.hrmsEmployeeAdvance.delete({ where: { id, status: { in: ['DRAFT','SUBMITTED','REJECTED'] } } });

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
@Roles('ADMIN', 'KM_MANAGER', 'ACCOUNTANT', 'BOD')
export class HrmsExpensesController {
  constructor(private readonly service: HrmsExpensesService) {}

  @Get('travel-requests')
  listTravelRequests(@Query('userId') userId?: string, @Query('status') status?: ClaimStatus) {
    return this.service.listTravelRequests(userId, status);
  }

  @Post('travel-requests')
  createTravelRequest(@Body() dto: CreateTravelRequestDto, @CurrentUser() actor: AuthUser) {
    return this.service.createTravelRequest(actor.id, dto);
  }

  @Patch('travel-requests/:id/status')
  updateTravelRequestStatus(@Param('id') id: string, @Body('status') status: ClaimStatus, @CurrentUser() actor: AuthUser) {
    return this.service.updateTravelRequestStatus(actor.id, id, status);
  }

  @Post('travel-requests/:id/close-settlement')
  closeSettlement(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.closeTravelSettlement(actor.id, id);
  }

  @Post('travel-requests/:id/record-refund')
  recordRefund(@Param('id') id: string, @Body() body: { amount: number; note?: string }, @CurrentUser() actor: AuthUser) {
    return this.service.recordAdvanceRefund(actor.id, id, Number(body.amount), body.note);
  }

  @Delete('travel-requests/:id')
  deleteTravelRequest(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteTravelRequest(actor.id, id);
  }

  @Get('claims')
  listClaims(@Query('userId') userId?: string, @Query('status') status?: ClaimStatus) {
    return this.service.listClaims(userId, status);
  }

  @Post('claims')
  createClaim(@Body() dto: CreateExpenseClaimDto, @CurrentUser() actor: AuthUser) {
    return this.service.createClaim(actor.id, dto);
  }

  @Patch('claims/:id/status')
  updateClaimStatus(@Param('id') id: string, @Body('status') status: ClaimStatus, @CurrentUser() actor: AuthUser) {
    return this.service.updateClaimStatus(actor.id, id, status);
  }

  @Delete('claims/:id')
  deleteClaim(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteClaim(actor.id, id);
  }

  @Get('advances')
  listAdvances(@Query('userId') userId?: string) {
    return this.service.listAdvances(userId);
  }

  @Post('advances')
  createAdvance(@Body() dto: CreateAdvanceDto, @CurrentUser() actor: AuthUser) {
    return this.service.createAdvance(actor.id, dto);
  }

  @Patch('advances/:id/status')
  updateAdvanceStatus(@Param('id') id: string, @Body() dto: UpdateAdvanceStatusDto, @CurrentUser() actor: AuthUser) {
    return this.service.updateAdvanceStatus(actor.id, id, dto.status, dto.paymentMethod);
  }

  @Delete('advances/:id')
  deleteAdvance(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteAdvance(actor.id, id);
  }
}

@Module({
  controllers: [HrmsExpensesController],
  providers: [HrmsExpensesService],
  exports: [HrmsExpensesService],
})
export class HrmsExpensesModule {}
