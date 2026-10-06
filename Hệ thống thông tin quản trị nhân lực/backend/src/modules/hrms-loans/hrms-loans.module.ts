import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, Max, MinLength, MaxLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';

export class ApplyLoanDto {
  @ApiProperty({ example: 'user-id' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  employeeName: string;

  @ApiProperty({ example: 'Vay mua thiết bị làm việc' })
  @IsString()
  loanType: string;

  @ApiProperty({ example: 30000000 })
  @IsNumber()
  @Min(1000000)
  principalAmount: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate?: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1)
  @IsInt()
  @Max(120)
  termMonths: number;

  @ApiProperty({ example: true, description: 'Người vay đồng ý trích khoản đến hạn qua bảng lương theo lịch đã thỏa thuận' })
  @IsBoolean()
  payrollDeductionAuthorized: boolean;

  @ApiPropertyOptional({ example: 'Nâng cấp máy trạm và màn hình 4K cá nhân' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DecideLoanDto {
  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Đã thẩm định đủ điều kiện thâm niên trên 1 năm' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
}

export class DisburseLoanDto {
  @ApiProperty({ enum: ['CASH', 'BANK'] })
  @IsIn(['CASH', 'BANK'])
  method: 'CASH' | 'BANK';

  @ApiProperty({ description: 'Mã phiếu chi hoặc mã giao dịch ngân hàng để đối chiếu' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  reference: string;
}

@Injectable()
export class HrmsLoansService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async listLoans(status?: string, userId?: string) {
    return this.prisma.hrmsEmployeeLoan.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async apply(actorId: string, dto: ApplyLoanDto) {
    if (!dto.payrollDeductionAuthorized) throw new BadRequestException('Cần ghi nhận sự đồng ý khấu trừ theo lịch trả đã thỏa thuận');
    const interest = dto.interestRate ?? 0;
    const totalWithInterest = dto.principalAmount * (1 + (interest / 100) * (dto.termMonths / 12));
    const monthlyEmi = Math.round(totalWithInterest / dto.termMonths);

    const loan = await this.prisma.hrmsEmployeeLoan.create({
      data: {
        userId: dto.userId,
        employeeName: dto.employeeName,
        loanType: dto.loanType,
        principalAmount: dto.principalAmount,
        interestRate: interest,
        termMonths: dto.termMonths,
        monthlyEmi,
        remainingAmount: Math.round(totalWithInterest),
        reason: dto.reason,
        payrollDeductionAuthorizedAt: new Date(),
        deductionConsentVersion: 'salary-deduction-v1',
        status: 'PENDING',
      },
    });

    await this.audit.log({
      actorId,
      action: 'HRMS_LOAN_APPLY',
      targetType: 'HrmsEmployeeLoan',
      targetId: loan.id,
      description: `Đăng ký khoản vay: ${dto.loanType} (${dto.principalAmount.toLocaleString('vi-VN')} VND)`,
    });

    return loan;
  }

  async decide(actorId: string, loanId: string, dto: DecideLoanDto) {
    const loan = await this.prisma.hrmsEmployeeLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Không tìm thấy khoản vay');

    if (loan.status !== 'PENDING') throw new ConflictException('Khoản vay đã được xử lý');
    if (loan.userId === actorId) throw new ForbiddenException('Không được tự duyệt khoản vay');
    if (!['APPROVED', 'REJECTED'].includes(dto.status)) throw new BadRequestException('Trạng thái không hợp lệ');
    if (dto.status === 'APPROVED' && (!loan.payrollDeductionAuthorizedAt || !loan.deductionConsentVersion)) {
      throw new ConflictException('Chưa có bằng chứng người lao động đồng ý khấu trừ theo lịch trả; chưa thể duyệt khoản vay này.');
    }
    const updated = await this.prisma.hrmsEmployeeLoan.update({
      where: { id: loanId, status: 'PENDING' },
      data: {
        status: dto.status,
        approvedBy: actorId,
      },
    });

    await this.audit.log({
      actorId,
      action: `HRMS_LOAN_${dto.status}`,
      targetType: 'HrmsEmployeeLoan',
      targetId: loanId,
      description: `Duyệt khoản vay [${dto.status}] cho ${loan.employeeName}`,
    });

    return updated;
  }

  async disburse(actorId: string, loanId: string, dto: DisburseLoanDto) {
    const loan = await this.prisma.hrmsEmployeeLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Không tìm thấy khoản vay');
    if (loan.status !== 'APPROVED') throw new ConflictException('Chỉ khoản vay đã duyệt mới được giải ngân');
    if (loan.userId === actorId) throw new ForbiddenException('Người vay không được tự ghi nhận giải ngân');
    if (!loan.payrollDeductionAuthorizedAt || !loan.deductionConsentVersion) {
      throw new ConflictException('Chưa có bằng chứng người lao động đồng ý khấu trừ theo lịch trả; chưa thể giải ngân khoản vay này.');
    }
    const updated = await this.prisma.hrmsEmployeeLoan.updateMany({
      where: { id: loanId, status: 'APPROVED' },
      data: { status: 'DISBURSED', disbursedAt: new Date(), disbursementMethod: dto.method, disbursementReference: dto.reference.trim() },
    });
    if (updated.count !== 1) throw new ConflictException('Khoản vay vừa được xử lý bởi người khác');
    await this.audit.log({ actorId, action: 'HRMS_LOAN_DISBURSED', targetType: 'HrmsEmployeeLoan', targetId: loanId, description: `Ghi nhận giải ngân ${dto.method}: ${dto.reference.trim()}` });
    return this.prisma.hrmsEmployeeLoan.findUniqueOrThrow({ where: { id: loanId } });
  }

  async getMyLoans(userId: string) {
    return this.prisma.hrmsEmployeeLoan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Estimates the agreed installment subject to outstanding debt and available net pay. */
  async calculateSafeMonthlyDeduction(loanId: string, netPayBeforeLoan: number) {
    const loan = await this.prisma.hrmsEmployeeLoan.findUnique({ where: { id: loanId } });
    if (!loan || loan.status !== 'DISBURSED' || !loan.payrollDeductionAuthorizedAt) {
      return { allowedDeduction: 0, availableNetPay: 0, rolloverAmount: 0, isCapped: false };
    }

    const availableNetPay = Math.max(0, Math.floor(Number.isFinite(netPayBeforeLoan) ? netPayBeforeLoan : 0));
    const standardEmi = Math.min(loan.monthlyEmi, loan.remainingAmount);
    const isCapped = standardEmi > availableNetPay;
    const allowedDeduction = Math.min(standardEmi, availableNetPay);
    const rolloverAmount = standardEmi - allowedDeduction;

    return {
      loanId: loan.id,
      principalAmount: loan.principalAmount,
      remainingAmount: loan.remainingAmount,
      standardEmi,
      availableNetPay,
      allowedDeduction,
      rolloverAmount,
      isCapped,
    };
  }

  /**
   * Ghi nhận trả góp định kỳ hoặc quyết toán khi thôi việc
   */
  async recordRepayment(actorId: string, loanId: string, paidAmount: number) {
    const loan = await this.prisma.hrmsEmployeeLoan.findUnique({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Không tìm thấy khoản vay');

    if (!Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount > loan.remainingAmount) throw new BadRequestException('Số tiền trả phải dương và không vượt dư nợ');
    if (loan.status !== 'DISBURSED') throw new ConflictException('Khoản vay chưa giải ngân hoặc đã đóng');
    const newRemaining = loan.remainingAmount - paidAmount;
    const isCompleted = newRemaining === 0;
    const updated = await this.prisma.$transaction(async tx => {
      const changed = await tx.hrmsEmployeeLoan.updateMany({ where: { id: loanId, remainingAmount: loan.remainingAmount, status: 'DISBURSED' }, data: { remainingAmount: newRemaining, totalRepaid: { increment: paidAmount }, status: isCompleted ? 'COMPLETED' : 'DISBURSED' } });
      if (changed.count !== 1) throw new ConflictException('Dư nợ đã thay đổi; vui lòng tải lại');
      await tx.auditLog.create({ data: { actorId, action: 'LOAN_REPAYMENT', entityType: 'HrmsEmployeeLoan', entityId: loanId, afterData: { paidAmount, remainingAmount: newRemaining } } });
      return tx.hrmsEmployeeLoan.findUniqueOrThrow({ where: { id: loanId } });
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: isCompleted ? 'HRMS_LOAN_COMPLETED' : 'HRMS_LOAN_REPAYMENT',
      targetType: 'HrmsEmployeeLoan',
      targetId: loanId,
      description: `Ghi nhận trả nợ khoản vay: ${paidAmount.toLocaleString('vi-VN')} VND. Dư nợ còn lại: ${newRemaining.toLocaleString('vi-VN')} VND`,
    });

    return updated;
  }
}

@ApiTags('HRMS - Employee Loans')
@ApiBearerAuth()
@Controller('hrms/loans')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD')
export class HrmsLoansController {
  constructor(private readonly service: HrmsLoansService) {}

  @Get()
  listLoans(@Query('status') status?: string, @Query('userId') userId?: string) {
    return this.service.listLoans(status, userId);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Get('my')
  myLoans(@CurrentUser() actor: AuthUser) {
    return this.service.getMyLoans(actor.id);
  }

  @Get(':id/safe-deduction')
  safeDeduction(@Param('id') id: string, @Query('netPay') netPay: string) {
    return this.service.calculateSafeMonthlyDeduction(id, Number(netPay) || 0);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Post('apply')
  apply(@Body() dto: ApplyLoanDto, @CurrentUser() actor: AuthUser) {
    return this.service.apply(actor.id, { ...dto, userId: actor.id, employeeName: actor.fullName ?? actor.email });
  }

  @Patch(':id/decide')
  decide(@Param('id') id: string, @Body() dto: DecideLoanDto, @CurrentUser() actor: AuthUser) {
    return this.service.decide(actor.id, id, dto);
  }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Patch(':id/disburse')
  disburse(@Param('id') id: string, @Body() dto: DisburseLoanDto, @CurrentUser() actor: AuthUser) {
    return this.service.disburse(actor.id, id, dto);
  }

  @Post(':id/repay')
  repay(@Param('id') id: string, @Body('amount') amount: number, @CurrentUser() actor: AuthUser) {
    return this.service.recordRepayment(actor.id, id, Number(amount) || 0);
  }
}

@Module({
  controllers: [HrmsLoansController],
  providers: [HrmsLoansService],
  exports: [HrmsLoansService],
})
export class HrmsLoansModule {}
