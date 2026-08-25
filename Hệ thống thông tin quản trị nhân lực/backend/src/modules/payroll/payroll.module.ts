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
const PARAMS = {
  STANDARD_WORKING_DAYS: 22, // ngày công chuẩn/tháng
  HOURS_PER_DAY: 8,
  OT_MULTIPLIER: 1.5, // 150% ngày thường (Điều 98 BLĐ 2019)
  EMPLOYEE_INSURANCE_RATE: 0.105, // BHXH người lao động đóng 10,5%
  INSURANCE_CAP_MULTIPLE: 20, // trần = 20 lần lương cơ sở
  BASE_SALARY: 2_340_000, // lương cơ sở hiện hành (VND)
  PERSONAL_DEDUCTION_MONTHLY: 11_000_000 / 12, // giảm trừ bản thân
  TAX_BRACKETS: [
    { limit: 5_000_000, rate: 0.05 },
    { limit: 10_000_000, rate: 0.1 },
    { limit: 18_000_000, rate: 0.15 },
    { limit: 32_000_000, rate: 0.2 },
    { limit: 52_000_000, rate: 0.25 },
    { limit: 80_000_000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ],
} as const;

/** Thuế TNCN lũy tiến 7 bậc trên thu nhập tính thuế tháng. */
function progressiveTax(taxable: number): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of PARAMS.TAX_BRACKETS) {
    if (taxable > prev) {
      tax += (Math.min(taxable, b.limit) - prev) * b.rate;
      prev = b.limit;
    } else break;
  }
  return Math.round(tax);
}

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
  ) {}

  periods() {
    return this.prisma.payrollPeriod.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { payslips: true } } },
    });
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
  async calculate(periodId: string, actor: AuthUser, requestId?: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ lương');
    if (period.status === 'LOCKED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Kỳ lương đã khóa — bất biến, không tính lại được', HttpStatus.CONFLICT);
    }

    // Kỳ lương theo tháng UTC — truyền Date object (Prisma yêu cầu ISO-8601 đầy đủ)
    const monthStart = new Date(Date.UTC(period.year, period.month - 1, 1));
    const monthEnd = new Date(Date.UTC(period.year, period.month, 1));

    const employees = await this.prisma.user.findMany({
      where: { deletedAt: null, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
      select: { id: true, baseSalary: true },
    });

    // Gom dữ liệu chấm công + OT đã duyệt của cả kỳ trong 2 truy vấn
    const attendance = await this.prisma.attendanceDay.groupBy({
      by: ['userId'],
      where: { workDate: { gte: monthStart, lt: monthEnd }, status: { in: ['PRESENT', 'LATE', 'EARLY_LEAVE', 'ON_LEAVE'] } },
      _count: { userId: true },
    });
    const attendanceMap = new Map(attendance.map((a) => [a.userId, a._count.userId]));

    const otRows = await this.prisma.overtimeRequest.groupBy({
      by: ['userId'],
      where: { workDate: { gte: monthStart, lt: monthEnd }, status: 'APPROVED' },
      _sum: { hours: true },
    });
    const otMap = new Map(otRows.map((o) => [o.userId, o._sum.hours ?? 0]));

    const insuranceCap = PARAMS.INSURANCE_CAP_MULTIPLE * PARAMS.BASE_SALARY;

    await this.prisma.$transaction(async (tx) => {
      // Tính lại = xóa phiếu cũ của kỳ (chưa khóa) rồi sinh phiên mới
      await tx.payslip.deleteMany({ where: { periodId } });

      for (const emp of employees) {
        const baseSalary = emp.baseSalary ?? 0;
        const workingDays = attendanceMap.get(emp.id) ?? 0;
        const otHours = otMap.get(emp.id) ?? 0;
        const hourlyRate = baseSalary / (PARAMS.STANDARD_WORKING_DAYS * PARAMS.HOURS_PER_DAY);
        const otAmount = Math.round(otHours * hourlyRate * PARAMS.OT_MULTIPLIER);
        const insuranceBase = Math.min(baseSalary, insuranceCap);
        const insurance = Math.round(insuranceBase * PARAMS.EMPLOYEE_INSURANCE_RATE);
        const taxable = Math.max(0, baseSalary + otAmount - insurance - PARAMS.PERSONAL_DEDUCTION_MONTHLY);
        const incomeTax = progressiveTax(taxable);
        const netSalary = baseSalary + otAmount - insurance - incomeTax;

        await tx.payslip.create({
          data: {
            periodId,
            userId: emp.id,
            workingDays,
            otHours,
            baseSalary,
            otAmount,
            insurance,
            incomeTax,
            netSalary,
          },
        });
      }

      await tx.payrollPeriod.update({
        where: { id: periodId },
        data: { status: 'CALCULATED', calculatedAt: new Date() },
      });
    });

    await this.audit.log({
      actorId: actor.id, action: 'PAYROLL_CALCULATED', entityType: 'PayrollPeriod', entityId: periodId,
      after: { employees: employees.length, month: period.month, year: period.year }, requestId,
    });
    return this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: { _count: { select: { payslips: true } } },
    });
  }

  /** UC24 — Kế toán/HR đối chiếu xong chuyển "Chờ duyệt". */
  async markReviewed(periodId: string, actor: AuthUser, requestId?: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ lương');
    if (period.status !== 'CALCULATED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Chỉ chuyển đối chiếu từ trạng thái ĐÃ TÍNH', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'REVIEWED' },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PAYROLL_REVIEWED', entityType: 'PayrollPeriod', entityId: periodId, requestId,
    });
    return updated;
  }

  /** UC24 — Giám đốc/ADMIN duyệt và KHÓA: bảng lương trở nên bất biến. */
  async lock(periodId: string, actor: AuthUser, requestId?: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ lương');
    if (period.status !== 'REVIEWED') {
      throw new BusinessException(ErrorCodes.INVALID_STATE_TRANSITION, 'Chỉ khóa được kỳ đã qua đối chiếu', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'LOCKED', lockedAt: new Date(), lockedById: actor.id },
    });
    await this.audit.log({
      actorId: actor.id, action: 'PAYROLL_LOCKED', entityType: 'PayrollPeriod', entityId: periodId, requestId,
    });
    return updated;
  }

  /** Bảng lương toàn công ty của một kỳ (ADMIN/HR). */
  async periodPayslips(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Không tìm thấy kỳ lương');
    return this.prisma.payslip.findMany({
      where: { periodId },
      include: {
        user: { select: { id: true, fullName: true, employeeCode: true, orgUnit: { select: { name: true } } } },
      },
      orderBy: { netSalary: 'desc' },
    });
  }

  /** Phiếu lương của chính mình (UC25 — tự phục vụ). */
  myPayslips(userId: string) {
    return this.prisma.payslip.findMany({
      where: { userId },
      include: { period: { select: { id: true, month: true, year: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
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

  @Get('periods')
  periods() {
    return this.service.periods();
  }

  @Get('payslips/mine')
  myPayslips(@CurrentUser() user: AuthUser) {
    return this.service.myPayslips(user.id);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('periods')
  createPeriod(@Body() dto: CreatePeriodDto, @CurrentUser() user: AuthUser) {
    return this.service.createPeriod(dto, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('periods/:id/calculate')
  calculate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.calculate(id, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Post('periods/:id/review')
  review(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.markReviewed(id, user);
  }

  @Roles('ADMIN')
  @Post('periods/:id/lock')
  lock(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.lock(id, user);
  }

  @Roles('ADMIN', 'KM_MANAGER')
  @Get('periods/:id/payslips')
  periodPayslips(@Param('id') id: string) {
    return this.service.periodPayslips(id);
  }
}

@Module({ controllers: [PayrollController], providers: [PayrollService] })
export class PayrollModule {}
