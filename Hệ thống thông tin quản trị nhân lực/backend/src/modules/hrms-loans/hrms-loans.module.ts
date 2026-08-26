import {
  Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
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
  interestRate?: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(1)
  termMonths: number;

  @ApiPropertyOptional({ example: 'Nâng cấp máy trạm và màn hình 4K cá nhân' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DecideLoanDto {
  @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Đã thẩm định đủ điều kiện thâm niên trên 1 năm' })
  @IsOptional()
  @IsString()
  decisionNote?: string;
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

    const updated = await this.prisma.hrmsEmployeeLoan.update({
      where: { id: loanId },
      data: {
        status: dto.status,
        approvedBy: actorId,
        disbursedAt: dto.status === 'APPROVED' ? new Date() : null,
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

  async getMyLoans(userId: string) {
    return this.prisma.hrmsEmployeeLoan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Tính mức trích trừ an toàn theo Điều 102 BLLĐ 2019:
   * Mức khấu trừ nợ/tạm ứng hàng tháng không được vượt quá 30% lương thực lĩnh (Net Pay)
   */
  async calculateSafeMonthlyDeduction(loanId: string, netPayBeforeLoan: number) {
    const loan = await this.prisma.hrmsEmployeeLoan.findUnique({ where: { id: loanId } });
    if (!loan || loan.status !== 'APPROVED') {
      return { allowedDeduction: 0, maxCap30Percent: 0, rolloverAmount: 0, isCapped: false };
    }

    const maxCap30Percent = Math.floor(netPayBeforeLoan * 0.30);
    const standardEmi = Math.min(loan.monthlyEmi, loan.remainingAmount);
    const isCapped = standardEmi > maxCap30Percent;
    const allowedDeduction = isCapped ? maxCap30Percent : standardEmi;
    const rolloverAmount = standardEmi - allowedDeduction;

    return {
      loanId: loan.id,
      principalAmount: loan.principalAmount,
      remainingAmount: loan.remainingAmount,
      standardEmi,
      maxCap30Percent,
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

    const newRemaining = Math.max(0, loan.remainingAmount - paidAmount);
    const isCompleted = newRemaining <= 0;

    const updated = await this.prisma.hrmsEmployeeLoan.update({
      where: { id: loanId },
      data: {
        remainingAmount: newRemaining,
        status: isCompleted ? 'COMPLETED' : loan.status,
      },
    });

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
export class HrmsLoansController {
  constructor(private readonly service: HrmsLoansService) {}

  @Get()
  listLoans(@Query('status') status?: string, @Query('userId') userId?: string) {
    return this.service.listLoans(status, userId);
  }

  @Get('my')
  myLoans(@Query('userId') userId?: string) {
    return this.service.getMyLoans(userId ?? 'demo-user');
  }

  @Get(':id/safe-deduction')
  safeDeduction(@Param('id') id: string, @Query('netPay') netPay: string) {
    return this.service.calculateSafeMonthlyDeduction(id, Number(netPay) || 0);
  }

  @Post('apply')
  apply(@Body() dto: ApplyLoanDto) {
    return this.service.apply('system', dto);
  }

  @Patch(':id/decide')
  decide(@Param('id') id: string, @Body() dto: DecideLoanDto) {
    return this.service.decide('system', id, dto);
  }

  @Post(':id/repay')
  repay(@Param('id') id: string, @Body('amount') amount: number) {
    return this.service.recordRepayment('system', id, Number(amount) || 0);
  }
}

@Module({
  controllers: [HrmsLoansController],
  providers: [HrmsLoansService],
  exports: [HrmsLoansService],
})
export class HrmsLoansModule {}
