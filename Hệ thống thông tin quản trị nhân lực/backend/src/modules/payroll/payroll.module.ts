import { HrmsPayrollModule, HrmsPayrollService } from '../hrms-payroll/hrms-payroll.module';
import {
  Body, Controller, Get, HttpStatus, Injectable, Module, NotFoundException, Param, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import { BusinessException, ErrorCodes } from '../../common/errors/business.exception';
import type { AuthUser } from '../../common/types/auth-user';

// ---------------------------------------------------------------------------
// Tham số pháp lý (Bảng 2.6 — PTTK_OOP_HR.md). Trong tương lai chuyển sang
// bảng THAMSO theo hiệu lực ngày; bản demo neo giá trị hiện hành.
// ---------------------------------------------------------------------------
class CreatePeriodDto {
  @ApiProperty() @IsInt() @Min(1) @Max(12) month!: number;
  @ApiProperty() @IsInt() @Min(2000) @Max(2100) year!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) note?: string;
}

// ---------------------------------------------------------------------------
// Service — UC22 cấu hình (tham số), UC23 tính bảng lương, UC24 duyệt & khóa
// ---------------------------------------------------------------------------

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly canonical: HrmsPayrollService,
  ) {}

  async periods() {
    const periods = await this.prisma.payrollPeriod.findMany({ orderBy: [{ year: 'desc' }, { month: 'desc' }] });
    return Promise.all(periods.map(async p => {
      const run = await this.prisma.hrmsPayrollRun.findUnique({ where: { legacyPeriodId: p.id }, include: { _count: { select: { slips: true } } } });
      return { ...p, canonicalStatus: run?.status, _count: { payslips: run?._count.slips ?? 0 } };
    }));
  }

  async createPeriod(dto: CreatePeriodDto, actor: AuthUser, requestId?: string) {
    const dup = await this.prisma.payrollPeriod.findUnique({
      where: { month_year: { month: dto.month, year: dto.year } },
    });
    if (dup) throw new BusinessException(ErrorCodes.CONFLICT, `Kỳ lương ${dto.month}/${dto.year} đã tồn tại`, HttpStatus.CONFLICT);
    const period = await this.prisma.payrollPeriod.create({
      data: { month: dto.month, year: dto.year, note: dto.note },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PAYROLL_PERIOD_CREATED', entityType: 'PayrollPeriod', entityId: period.id,
      after: { month: dto.month, year: dto.year }, requestId,
    });
    return period;
  }

  /**
   * UC23 — Tính bảng lương từ dữ liệu đã có:
   * - công hữu hiệu từ bảng chấm công đã tổng hợp (AttendanceDay);
   * - giờ làm thêm CHỈ ĐẾM đơn đã duyệt (UC19);
   * - BHXH 10,5% có trần, thuế TNCN lũy tiến 7 bậc, giảm trừ bản thân.
   * Chạy lại khi chưa khóa → xóa phiếu cũ tính lại (giữ vết qua audit log).
   */
  async calculate(periodId: string, actor: AuthUser) {
    const period = await this.prisma.payrollPeriod.findUniqueOrThrow({ where: { id: periodId } });
    const from = new Date(Date.UTC(period.year, period.month - 1, 1));
    const to = new Date(Date.UTC(period.year, period.month, 0));
    const result = await this.canonical.createPayrollRun(actor.id, { periodName: `${period.month}/${period.year}`, fromDate: from.toISOString(), toDate: to.toISOString(), notes: period.note ?? undefined }, periodId);
    await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'CALCULATED', calculatedAt: new Date() } });
    return result;
  }
  private async runId(periodId: string) {
    const run = await this.prisma.hrmsPayrollRun.findUnique({ where: { legacyPeriodId: periodId } });
    if (!run) throw new NotFoundException('Kỳ chưa tính lương bằng bộ tính thống nhất');
    return run.id;
  }
  async markReviewed(periodId: string, actor: AuthUser) {
    const result = await this.canonical.transition(actor.id, await this.runId(periodId), 'REVIEWED');
    await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'REVIEWED' } });
    return result;
  }
  async approve(periodId: string, actor: AuthUser) { return this.canonical.transition(actor.id, await this.runId(periodId), 'APPROVED'); }
  async lock(periodId: string, actor: AuthUser) {
    const result = await this.canonical.transition(actor.id, await this.runId(periodId), 'LOCKED');
    await this.prisma.payrollPeriod.update({ where: { id: periodId }, data: { status: 'LOCKED', lockedAt: new Date(), lockedById: actor.id } });
    return result;
  }
  async periodPayslips(periodId: string) { return (await this.canonical.getPayrollRun(await this.runId(periodId))).slips; }
  async myPayslips(userId: string) {
    return (await this.canonical.listSlipsByUser(userId)).map(slip => ({ ...slip, netSalary: slip.netPay, period: { id: slip.payrollRun.id, month: slip.payrollRun.fromDate.getUTCMonth() + 1, year: slip.payrollRun.fromDate.getUTCFullYear(), status: slip.payrollRun.status } }));
  }

}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD')
  @Get('periods')
  periods() {
    return this.service.periods();
  }

  @Get('payslips/mine')
  myPayslips(@CurrentUser() user: AuthUser) {
    return this.service.myPayslips(user.id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post('periods')
  createPeriod(@Body() dto: CreatePeriodDto, @CurrentUser() user: AuthUser) {
    return this.service.createPeriod(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post('periods/:id/calculate')
  calculate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.calculate(id, user);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT')
  @Post('periods/:id/review')
  review(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.markReviewed(id, user);
  }

  @Roles('ADMIN', 'BOD')
  @Post('periods/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) { return this.service.approve(id, user); }

  @Roles('ADMIN', 'BOD')
  @Post('periods/:id/lock')
  lock(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.lock(id, user);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT')
  @Get('periods/:id/payslips')
  periodPayslips(@Param('id') id: string) {
    return this.service.periodPayslips(id);
  }
}

@Module({ imports: [HrmsPayrollModule], controllers: [PayrollController], providers: [PayrollService] })
export class PayrollModule {}
