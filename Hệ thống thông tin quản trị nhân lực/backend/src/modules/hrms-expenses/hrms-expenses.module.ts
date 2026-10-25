import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, ArrayMinSize, ArrayUnique, MinLength } from 'class-validator';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import { HrAccessService } from '../../common/services/hr-access.service';
import { dateKey, workDate } from '../../common/hr-time';
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

class ConfirmTravelAttendanceDto {
  @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsDateString({}, { each: true }) workDates!: string[];
  @IsString() @MinLength(1) evidenceUrl!: string;
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
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly ledger: AttendanceLedgerService, private readonly access: HrAccessService) {}

  async travelAttendanceOptions(actor: AuthUser, id: string) {
    const travel = await this.prisma.hrmsTravelRequest.findUniqueOrThrow({ where: { id } });
    await this.access.assertReviewer(actor, travel.userId);
    if (!['APPROVED', 'PAID'].includes(travel.status)) throw new ConflictException('Chỉ xác nhận công tác đã được duyệt');
    if (travel.returnDate.getTime() - travel.departureDate.getTime() > 366 * 86_400_000) throw new ConflictException('Lịch trình quá dài; cần đối soát trước');
    const scheduled = await this.ledger.scheduledDates(travel.userId, dateKey(travel.departureDate), dateKey(travel.returnDate));
    const leaves = await this.prisma.leaveRequest.findMany({ where: { userId: travel.userId, status: 'APPROVED', startDate: { lte: travel.returnDate }, endDate: { gte: travel.departureDate } } });
    const days = [];
    for (const day of scheduled) {
      const date = day.toISOString().slice(0, 10), confirmed = travel.confirmedWorkDates.includes(date);
      let reason = confirmed ? 'Đã ghi công' : day >= workDate() ? 'Ngày chưa kết thúc' : leaves.some(leave => dateKey(leave.startDate) <= day && dateKey(leave.endDate) >= day) ? 'Trùng nghỉ phép đã duyệt' : '';
      if (!reason) try { await this.ledger.assertMutable(day); } catch (error) { if (!(error instanceof ConflictException)) throw error; reason = 'Kỳ công/lương đã chốt'; }
      days.push({ date, confirmed, canConfirm: !reason, reason });
    }
    return { days };
  }

  async confirmTravelAttendance(actor: AuthUser, id: string, dto: ConfirmTravelAttendanceDto) {
    if (!dto.evidenceUrl.trim()) throw new BadRequestException('Cần minh chứng công tác thực hiện');
    return this.prisma.$transaction(async tx => {
      const travel = await tx.hrmsTravelRequest.findUniqueOrThrow({ where: { id } });
      if (!['APPROVED', 'PAID'].includes(travel.status)) throw new ConflictException('Chỉ xác nhận công tác đã được duyệt');
      if (travel.returnDate.getTime() - travel.departureDate.getTime() > 366 * 86_400_000) throw new ConflictException('Lịch trình quá dài; cần đối soát trước');
      await this.access.assertReviewer(actor, travel.userId);
      const dates = dto.workDates.map(dateKey);
      const scheduled = new Set((await this.ledger.scheduledDates(travel.userId, dateKey(travel.departureDate), dateKey(travel.returnDate), tx)).map(day => day.toISOString().slice(0, 10)));
      for (const day of dates) {
        if (!scheduled.has(day.toISOString().slice(0, 10)) || day >= workDate()) throw new ConflictException('Chỉ xác nhận ngày làm việc trong chuyến đi đã kết thúc');
        await this.ledger.assertMutable(day, tx);
        if (await tx.leaveRequest.findFirst({ where: { userId: travel.userId, status: 'APPROVED', startDate: { lte: day }, endDate: { gte: day } } })) throw new ConflictException('Ngày công tác trùng nghỉ phép đã duyệt; cần đối soát trước');
      }
      const confirmedWorkDates = [...new Set([...travel.confirmedWorkDates, ...dates.map(day => day.toISOString().slice(0, 10))])].sort();
      const result = await tx.hrmsTravelRequest.update({ where: { id }, data: { confirmedWorkDates, attendanceConfirmedAt: new Date(), attendanceConfirmedBy: actor.id, attendanceEvidenceUrl: dto.evidenceUrl.trim() } });
      for (const day of dates) await this.ledger.recompute(travel.userId, day, tx);
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'TRAVEL_ATTENDANCE_CONFIRMED', entityType: 'HrmsTravelRequest', entityId: id, afterData: { workDates: dto.workDates, evidenceUrl: dto.evidenceUrl } } });
      return result;
    }, { isolationLevel: 'Serializable' });
  }

  private async expenseActor(actorId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: actorId }, include: { roles: true } });
    return { id: user.id, email: user.email, roles: user.roles.map(role => role.roleCode) };
  }

  private async expenseScope(actorId: string, userId?: string): Promise<Record<string, unknown>> {
    const actor = await this.expenseActor(actorId);
    if (actor.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD', 'AUDITOR'].includes(role))) return userId ? { userId } : {};
    let ids = [actorId];
    if (actor.roles.includes('LINE_MANAGER')) {
      const scope = await this.access.reviewScope(actor);
      if (!scope.orgUnitId) throw new ForbiddenException('Chưa xác định phạm vi quản lý');
      ids = (await this.prisma.user.findMany({ where: { deletedAt: null, orgUnitId: scope.orgUnitId }, select: { id: true } })).map(user => user.id);
      ids = [...new Set([actorId, ...ids])];
    }
    if (userId && !ids.includes(userId)) throw new ForbiddenException('Không có quyền xem công tác phí của nhân viên này');
    return { userId: userId ?? { in: ids } };
  }

  private async assertExpenseWriter(actorId: string, userId: string) {
    const actor = await this.expenseActor(actorId);
    if (!actor.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD', 'LINE_MANAGER', 'USER', 'HR_RECRUITER', 'HR_TRAINER'].includes(role))) throw new ForbiddenException('Vai trò này chỉ có quyền xem công tác phí');
    if (actorId === userId || actor.roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD'].includes(role))) return;
    await this.access.assertReviewer(actor, userId);
  }

  private async resolveRecipient(actorId: string, userId?: string, employeeName?: string) {
    // Never silently reassign a request when an identity is invalid or ambiguous.
    let recipient;
    if (userId) recipient = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    else if (employeeName?.trim()) {
      const matches = await this.prisma.user.findMany({ where: { fullName: { equals: employeeName.trim(), mode: 'insensitive' }, deletedAt: null }, take: 2 });
      if (matches.length !== 1) throw new BadRequestException('Tên nhân viên không xác định duy nhất; hãy chọn nhân viên từ danh sách');
      recipient = matches[0];
    } else recipient = await this.prisma.user.findFirst({ where: { id: actorId, deletedAt: null } });
    if (!recipient) throw new BadRequestException('Cần chọn nhân viên hiện có');
    await this.assertExpenseWriter(actorId, recipient.id);
    return recipient;
  }

  async listTravelRequests(actorId: string, userId?: string, status?: ClaimStatus) {
    const where = await this.expenseScope(actorId, userId);
    if (status) where.status = status;

    return this.prisma.hrmsTravelRequest.findMany({
      where,
      include: { advances: true, claims: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTravelRequest(actorId: string, dto: CreateTravelRequestDto) {
    const recipient = await this.resolveRecipient(actorId, dto.userId, dto.employeeName);
    if (!dto.purpose.trim() || !dto.fromLocation.trim() || !dto.toLocation.trim()) throw new BadRequestException('Cần mục đích, nơi đi và nơi đến của chuyến công tác');
    if (new Date(dto.returnDate) < new Date(dto.departureDate) || new Date(dto.returnDate).getTime() - new Date(dto.departureDate).getTime() > 366 * 86_400_000 || (dto.estimatedBudget ?? 0) < 0) throw new BadRequestException('Thời gian/ngân sách công tác không hợp lệ; chuyến đi tối đa một năm');
    const res = await this.prisma.hrmsTravelRequest.create({
      data: {
        userId: recipient.id,
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

  async listClaims(actorId: string, userId?: string, status?: ClaimStatus) {
    const where = await this.expenseScope(actorId, userId);
    if (status) where.status = status;

    return this.prisma.hrmsExpenseClaim.findMany({
      where,
      include: { travelRequest: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createClaim(actorId: string, dto: CreateExpenseClaimDto) {
    const recipient = await this.resolveRecipient(actorId, dto.userId, dto.employeeName);
    if (!dto.title.trim() || !Number.isFinite(dto.totalAmount) || dto.totalAmount <= 0 || !dto.items?.length || dto.items.some(item => !item || typeof item.item !== 'string' || !item.item.trim() || !Number.isFinite(item.amount) || item.amount <= 0) || Math.abs(dto.items.reduce((sum, item) => sum + item.amount, 0) - dto.totalAmount) > 0.01) throw new BadRequestException('Bảng kê cần tiêu đề, nội dung từng khoản chi và tổng tiền dương khớp chi tiết');
    if (dto.travelRequestId) {
      const travel = await this.prisma.hrmsTravelRequest.findUniqueOrThrow({ where: { id: dto.travelRequestId } });
      if (travel.userId !== recipient.id || travel.status !== 'APPROVED') throw new ConflictException('Bảng kê phải thuộc chuyến công tác đã được duyệt của cùng nhân viên');
      if (travel.settlementClosedAt) throw new ConflictException('Đối soát tạm ứng chuyến đi đã khóa');
    }

    const res = await this.prisma.hrmsExpenseClaim.create({
      data: {
        userId: recipient.id,
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
    const allowed = status === 'PAID' ? ['ADMIN', 'ACCOUNTANT'] : ['ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'ACCOUNTANT', 'BOD'];
    if (!roles.some(role => allowed.includes(role.roleCode))) throw new ForbiddenException('Không có quyền duyệt/chi trả bước này');
    if (!roles.some(role => ['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD'].includes(role.roleCode))) await this.access.assertReviewer({ id: actorId, email: '', roles: roles.map(role => role.roleCode) }, userId);
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
      const travel = await this.prisma.hrmsTravelRequest.findUnique({ where: { id: travelRequestId } });
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

  async listAdvances(actorId: string, userId?: string) {
    const where = await this.expenseScope(actorId, userId);

    return this.prisma.hrmsEmployeeAdvance.findMany({
      where,
      include: { travelRequest: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdvance(actorId: string, dto: CreateAdvanceDto) {
    const recipient = await this.resolveRecipient(actorId, dto.userId, dto.employeeName);
    if (!dto.purpose.trim() || !Number.isFinite(dto.amount) || dto.amount <= 0) throw new BadRequestException('Cần mục đích và tiền tạm ứng dương');
    if (dto.travelRequestId) { const travel=await this.prisma.hrmsTravelRequest.findUniqueOrThrow({where:{id:dto.travelRequestId}}); if(travel.userId!==recipient.id || travel.status!=='APPROVED') throw new ConflictException('Tạm ứng phải thuộc chuyến đã duyệt của cùng nhân viên'); if(travel.settlementClosedAt) throw new ConflictException('Đối soát tạm ứng chuyến đi đã khóa'); }
    const res = await this.prisma.hrmsEmployeeAdvance.create({
      data: {
        userId: recipient.id,
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
    await this.assertExpenseWriter(actorId, claim.userId);

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
    await this.assertExpenseWriter(actorId, travel.userId);

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
    await this.assertExpenseWriter(actorId, adv.userId);

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
@Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
export class HrmsExpensesController {
  constructor(private readonly service: HrmsExpensesService) {}

  @Get('travel-requests')
  listTravelRequests(@CurrentUser() actor: AuthUser, @Query('userId') userId?: string, @Query('status') status?: ClaimStatus) {
    return this.service.listTravelRequests(actor.id, userId, status);
  }

  @Post('travel-requests')
  createTravelRequest(@Body() dto: CreateTravelRequestDto, @CurrentUser() actor: AuthUser) {
    return this.service.createTravelRequest(actor.id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Get('travel-requests/:id/attendance-options')
  attendanceOptions(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.travelAttendanceOptions(actor, id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'BOD')
  @Post('travel-requests/:id/confirm-attendance')
  confirmAttendance(@Param('id') id: string, @Body() dto: ConfirmTravelAttendanceDto, @CurrentUser() actor: AuthUser) {
    return this.service.confirmTravelAttendance(actor, id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'ACCOUNTANT', 'BOD')
  @Patch('travel-requests/:id/status')
  updateTravelRequestStatus(@Param('id') id: string, @Body('status') status: ClaimStatus, @CurrentUser() actor: AuthUser) {
    return this.service.updateTravelRequestStatus(actor.id, id, status);
  }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Post('travel-requests/:id/close-settlement')
  closeSettlement(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.closeTravelSettlement(actor.id, id);
  }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Post('travel-requests/:id/record-refund')
  recordRefund(@Param('id') id: string, @Body() body: { amount: number; note?: string }, @CurrentUser() actor: AuthUser) {
    return this.service.recordAdvanceRefund(actor.id, id, Number(body.amount), body.note);
  }

  @Delete('travel-requests/:id')
  deleteTravelRequest(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteTravelRequest(actor.id, id);
  }

  @Get('claims')
  listClaims(@CurrentUser() actor: AuthUser, @Query('userId') userId?: string, @Query('status') status?: ClaimStatus) {
    return this.service.listClaims(actor.id, userId, status);
  }

  @Post('claims')
  createClaim(@Body() dto: CreateExpenseClaimDto, @CurrentUser() actor: AuthUser) {
    return this.service.createClaim(actor.id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'ACCOUNTANT', 'BOD')
  @Patch('claims/:id/status')
  updateClaimStatus(@Param('id') id: string, @Body('status') status: ClaimStatus, @CurrentUser() actor: AuthUser) {
    return this.service.updateClaimStatus(actor.id, id, status);
  }

  @Delete('claims/:id')
  deleteClaim(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteClaim(actor.id, id);
  }

  @Get('advances')
  listAdvances(@CurrentUser() actor: AuthUser, @Query('userId') userId?: string) {
    return this.service.listAdvances(actor.id, userId);
  }

  @Post('advances')
  createAdvance(@Body() dto: CreateAdvanceDto, @CurrentUser() actor: AuthUser) {
    return this.service.createAdvance(actor.id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'LINE_MANAGER', 'ACCOUNTANT', 'BOD')
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
