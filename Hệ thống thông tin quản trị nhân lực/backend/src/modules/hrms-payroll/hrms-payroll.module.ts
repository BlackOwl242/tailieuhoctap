import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { calculateOvertimePay, calculatePayroll, currentPayrollPolicies, evaluateFormula, monthlyHourlyRate, payrollPolicyFor, VN_PAYROLL_POLICIES, type PayrollPolicy } from '../../common/payroll-calculator';
import { businessDates, dateKey, DAY_MS, DEFAULT_WORK_DAYS, isScheduledWorkday, isUnderThreeMonths } from '../../common/hr-time';
import { RuntimeSettingsService } from '../../common/services/runtime-settings.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { SalaryComponentType, PayrollRunStatus } from '@prisma/client';

export class CreateComponentDto {
  @ApiProperty({ example: 'ALLOWANCE_SKILL' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Phụ cấp Kỹ năng Chuyên môn' })
  @IsString()
  name: string;

  @ApiProperty({ enum: SalaryComponentType, default: SalaryComponentType.EARNING })
  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTaxApplicable?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Khoản lương thường xuyên, ổn định được thỏa thuận và tính vào căn cứ bảo hiểm' })
  @IsOptional()
  @IsBoolean()
  isInsuranceApplicable?: boolean;

  @ApiPropertyOptional({ default: false, description: 'Khoản trả cho công việc/chức danh đưa vào tiền lương giờ làm căn cứ tính OT' })
  @IsOptional()
  @IsBoolean()
  isOvertimeApplicable?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFormulaBased?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  defaultAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateStructureDto {
  @ApiProperty({ example: 'Cấu trúc Lương Kỹ sư Cao cấp' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: 'MONTHLY' })
  @IsOptional()
  @IsString()
  payrollFrequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: Array })
  @IsOptional()
  @IsArray()
  items?: { componentId: string; amount: number; formula?: string }[];
}

export class CreatePayrollRunDto {
  @ApiProperty({ example: 'Bảng Lương Tháng 08/2026' })
  @IsString()
  periodName: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2026-08-31T00:00:00.000Z' })
  @IsDateString()
  toDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordPayrollPaymentDto {
  @ApiProperty({ enum: ['BANK_TRANSFER', 'CASH', 'OTHER'], default: 'BANK_TRANSFER' })
  @IsIn(['BANK_TRANSFER', 'CASH', 'OTHER'])
  paymentMethod!: 'BANK_TRANSFER' | 'CASH' | 'OTHER';

  @ApiProperty({ description: 'Mã giao dịch ngân hàng hoặc số chứng từ chi' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  paymentReference!: string;
}

@Injectable()
export class HrmsPayrollService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly settings: RuntimeSettingsService) {}

  async listComponents() {
    return this.prisma.hrmsSalaryComponent.findMany({ orderBy: { type: 'asc' } });
  }

  async createComponent(actorId: string, dto: CreateComponentDto) {
    if (!/^[A-Z][A-Z_0-9]*$/.test(dto.code) || !Number.isFinite(dto.defaultAmount ?? 0) || (dto.defaultAmount ?? 0) < 0) throw new BadRequestException('Mã hoặc số tiền thành phần không hợp lệ');
    const res = await this.prisma.hrmsSalaryComponent.create({ data: dto });
    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsSalaryComponent',
      targetId: res.id,
      description: `Tạo thành phần lương: [${dto.code}] ${dto.name}`,
    });
    return res;
  }

  async updateComponent(actorId: string, id: string, dto: Partial<CreateComponentDto>) {
    const comp = await this.prisma.hrmsSalaryComponent.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException('Không tìm thấy thành phần lương');

    const res = await this.prisma.hrmsSalaryComponent.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      targetType: 'HrmsSalaryComponent',
      targetId: id,
      description: `Cập nhật thành phần lương: [${res.code}] ${res.name}`,
    });
    return res;
  }

  async deleteComponent(actorId: string, id: string) {
    const comp = await this.prisma.hrmsSalaryComponent.findUnique({ where: { id } });
    if (!comp) throw new NotFoundException('Không tìm thấy thành phần lương');

    if (await this.prisma.hrmsSalaryStructureItem.count({ where: { componentId: id } })) throw new ConflictException('Thành phần đang được dùng trong cấu trúc lương; không được xóa');
    await this.prisma.hrmsSalaryComponent.delete({ where: { id } });

    await this.audit.log({
      actorId,
      action: 'DELETE',
      targetType: 'HrmsSalaryComponent',
      targetId: id,
      description: `Xóa thành phần lương: [${comp.code}] ${comp.name}`,
    });
    return { success: true, message: 'Đã xóa thành phần lương thành công' };
  }

  async listStructures() {
    return this.prisma.hrmsSalaryStructure.findMany({
      include: {
        items: { include: { component: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listStructureAssignmentTargets() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, status: 'ACTIVE', employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
      select: { id: true, fullName: true, employeeCode: true, jobTitle: true, baseSalary: true, orgUnit: { select: { id: true, name: true } } },
      orderBy: [{ employeeCode: 'asc' }, { fullName: 'asc' }],
    });
    if (!users.length) return [];
    const assignments = await this.prisma.hrmsSalaryStructureAssignment.findMany({
      where: { userId: { in: users.map((user) => user.id) }, isActive: true },
      include: { structure: { select: { name: true } } },
    });
    const byUser = new Map(assignments.map((assignment) => [assignment.userId, assignment]));
    return users.map((user) => {
      const assignment = byUser.get(user.id);
      return {
        ...user,
        currentStructureName: assignment?.structure.name ?? null,
        hasPayrollBasis: Number(user.baseSalary ?? 0) > 0,
      };
    });
  }

  async createStructure(actorId: string, dto: CreateStructureDto) {
    const res = await this.prisma.hrmsSalaryStructure.create({
      data: {
        name: dto.name,
        payrollFrequency: dto.payrollFrequency ?? 'MONTHLY',
        description: dto.description,
        items: dto.items && dto.items.length > 0 ? {
          create: dto.items.map((item) => ({
            componentId: item.componentId,
            amount: item.amount,
            formula: item.formula,
          })),
        } : undefined,
      },
      include: { items: { include: { component: true } } },
    });

    await this.audit.log({
      actorId,
      action: 'CREATE',
      targetType: 'HrmsSalaryStructure',
      targetId: res.id,
      description: `Tạo cấu trúc lương: ${dto.name}`,
    });
    return res;
  }

  async assignStructure(actorId: string, structureId: string, userId: string, requestedBaseSalary?: number) {
    const structure = await this.prisma.hrmsSalaryStructure.findUnique({ where: { id: structureId } });
    if (!structure) throw new NotFoundException('Không tìm thấy cấu trúc lương');

    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null, status: 'ACTIVE' } });
    if (!user) throw new NotFoundException('Không tìm thấy nhân sự đang hoạt động');
    const baseSalary = Number(user.baseSalary ?? 0);
    if (!Number.isFinite(baseSalary) || baseSalary <= 0) throw new ConflictException('Nhân sự chưa có mức lương làm căn cứ. Hãy cập nhật từ hợp đồng hoặc quyết định lương trước khi gán cấu trúc.');
    if (requestedBaseSalary !== undefined && requestedBaseSalary !== baseSalary) throw new ConflictException('Mức lương gán không khớp hồ sơ nhân sự. Hệ thống sử dụng mức lương đã có hiệu lực.');
    const res = await this.prisma.$transaction(async tx=>{
      await tx.hrmsSalaryStructureAssignment.updateMany({where:{userId,isActive:true},data:{isActive:false}});
      return tx.hrmsSalaryStructureAssignment.create({data:{userId,structureId,baseSalary,fromDate:dateKey(new Date()),isActive:true},include:{structure:true}});
    },{isolationLevel:'Serializable'});

    await this.audit.log({
      actorId,
      action: 'ASSIGN_SALARY_STRUCTURE',
      targetType: 'HrmsSalaryStructureAssignment',
      targetId: res.id,
      description: `Gán cấu trúc lương ${structure.name} cho nhân sự ${userId} (Lương cơ bản: ${baseSalary.toLocaleString('vi-VN')} VND)`,
    });
    return res;
  }

  async listPayrollRuns() {
    return this.prisma.hrmsPayrollRun.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        slips: {
          orderBy: { employeeName: 'asc' },
        },
        _count: { select: { slips: true } },
      },
    });
  }

  async getPayrollRun(id: string) {
    const run = await this.prisma.hrmsPayrollRun.findUnique({
      where: { id },
      include: {
        slips: {
          orderBy: { employeeName: 'asc' },
        },
      },
    });
    if (!run) throw new NotFoundException('Không tìm thấy bảng lương');
    return run;
  }

  async deletePayrollRun(actorId: string, id: string) {
    const run = await this.prisma.hrmsPayrollRun.findUnique({ where: { id } });
    if (!run) throw new NotFoundException('Không tìm thấy bảng lương');

    if (run.status !== 'DRAFT' && run.status !== 'PROCESSED') throw new ConflictException('Không được xóa kỳ đã đối soát, duyệt, khóa hoặc thanh toán');
    await this.prisma.$transaction(async tx => {
      const deleted = await tx.hrmsPayrollRun.deleteMany({ where: { id, status: { in: ['DRAFT', 'PROCESSED'] } } });
      if (deleted.count !== 1) throw new ConflictException('Trạng thái kỳ lương đã thay đổi');
    }, { isolationLevel: 'Serializable' });

    await this.audit.log({
      actorId,
      action: 'DELETE',
      targetType: 'HrmsPayrollRun',
      targetId: id,
      description: `Xóa bảng lương: ${run.periodName}`,
    });
    return { success: true, message: 'Đã xóa bảng lương thành công' };
  }

  async createPayrollRun(actorId: string, dto: CreatePayrollRunDto, legacyPeriodId?: string) {
    const from = dateKey(dto.fromDate), to = dateKey(dto.toDate);
    if (from.getUTCDate() !== 1 || from.getUTCFullYear() !== to.getUTCFullYear() || from.getUTCMonth() !== to.getUTCMonth()
      || to.getUTCDate() !== new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() + 1, 0)).getUTCDate()) throw new BadRequestException('Kỳ lương phải bao phủ đúng một tháng');
    const year = from.getUTCFullYear(), month = from.getUTCMonth() + 1;
    const holidays = await this.settings.get<string[]>('HOLIDAYS', []);
    const policyDefinitions = currentPayrollPolicies(await this.settings.get<unknown>('PAYROLL_POLICIES', VN_PAYROLL_POLICIES));
    let policy: PayrollPolicy;
    try { policy = payrollPolicyFor(from, policyDefinitions); }
    catch (error) { throw new ConflictException(error instanceof Error ? error.message : 'Chưa cấu hình chính sách lương hiệu lực'); }
    const defaultDates = businessDates(from, to);
    if (!defaultDates.length) throw new BadRequestException('Kỳ không có ngày làm việc');
    const insuranceCap = Number(await this.settings.get(`INSURANCE_CAP_BHXH_${year}_${month}`, policy.bhxhCap));
    const result = await this.prisma.$transaction(async tx => {
      const attendancePeriod = await tx.attendancePeriod.findUnique({ where: { month_year: { month, year } } });
      if (!attendancePeriod || attendancePeriod.status !== 'FINALIZED') throw new ConflictException('Phải chốt công tháng trước khi tính lương');
      const overlap = await tx.hrmsPayrollRun.findFirst({ where: { fromDate: { lte: to }, toDate: { gte: from }, status: { not: 'CANCELLED' } } });
      if (overlap) throw new ConflictException('Đã có kỳ lương cho khoảng thời gian này; không tạo trùng');
      const rows = attendancePeriod.snapshot as unknown as { userId: string; workDate: string; status: string; workedMinutes: number; nightWorkedMinutes?: number; scheduledMinutes?: number; paidLeave?: boolean }[];
      const users = await tx.user.findMany({
        where: { deletedAt: null, id: { in: [...new Set(rows.map(r => r.userId))] } },
        select: { id: true, fullName: true, employeeCode: true, jobTitle: true, baseSalary: true, hireDate: true, taxDependentCount: true, taxResidency: true, minimumWageRegion: true, bankAccount: true, bankName: true, orgUnit: { select: { name: true } } },
      });
      const run = await tx.hrmsPayrollRun.create({ data: { periodName: dto.periodName, fromDate: from, toDate: to, attendancePeriodId: attendancePeriod.id, policySnapshot: { ...policy, holidays, defaultOfficeDayCount: defaultDates.length, calendarDays: Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1 }, legacyPeriodId, notes: dto.notes, status: 'PROCESSED', processedBy: actorId, processedAt: new Date() } });
      let totalGrossPay = 0, totalDeduction = 0, totalNetPay = 0;
      for (const user of users) {
        const employeeRows = rows.filter(row => row.userId === user.id).sort((a, b) => a.workDate.localeCompare(b.workDate));
        const attendanceByDate = new Map(employeeRows.map(row => [row.workDate.slice(0, 10), row]));
        const scheduleAssignments = await tx.hrmsShiftAssignment.findMany({
          where: { userId: user.id, status: 'ACTIVE', startDate: { lte: to }, OR: [{ endDate: null }, { endDate: { gte: from } }] },
          select: { startDate: true, endDate: true, workDays: true }, orderBy: { startDate: 'desc' },
        });
        const dates: Date[] = [];
        const scheduledMinutesByDate = new Map<string, number>();
        for (let time = from.getTime(); time <= to.getTime(); time += DAY_MS) {
          const day = new Date(time);
          const scheduled = scheduleAssignments.find(candidate => dateKey(candidate.startDate) <= day && (!candidate.endDate || dateKey(candidate.endDate) >= day));
          if (isScheduledWorkday(day, scheduled?.workDays ?? DEFAULT_WORK_DAYS)) {
            const key = day.toISOString().slice(0, 10);
            dates.push(day);
            scheduledMinutesByDate.set(key, attendanceByDate.get(key)?.scheduledMinutes ?? 480);
          }
        }
        if (!dates.length) throw new ConflictException(`Không có lịch làm việc cho ${user.fullName} trong kỳ lương`);
        const totalScheduledHours = [...scheduledMinutesByDate.values()].reduce((sum, minutes) => sum + minutes, 0) / 60;
        const assignments = await tx.hrmsSalaryStructureAssignment.findMany({ where: { userId: user.id, fromDate: { lte: to } }, include: { structure: { include: { items: { include: { component: true } } } } }, orderBy: { fromDate: 'desc' } });
        const contracts = await tx.contract.findMany({ where: { userId: user.id, startDate: { lte: to } }, orderBy: { startDate: 'desc' } });
        const actions = await tx.personnelAction.findMany({ where: { subjectId: user.id, status: 'APPROVED', effectiveAt: { lte: to } }, orderBy: { effectiveAt: 'asc' } });
        const resignation = actions.find(a => a.type === 'RESIGNATION');
        const eligible = dates.filter(day => (!user.hireDate || dateKey(user.hireDate) <= day) && (!resignation?.effectiveAt || day <= dateKey(resignation.effectiveAt)));
        const eligibleKeys = new Set(eligible.map(day => day.toISOString().slice(0, 10)));
        let baseTotal = 0, overtimeBaseTotal = 0, insuranceBaseTotal = 0, earnedBase = 0, paidDays = 0, attendanceDays = 0, unpaidFullDays = 0, standardHours = 0, nightWorkedHours = 0;
        const componentTotals = new Map<string, { code: string; name: string; type: 'EARNING' | 'DEDUCTION'; amount: number; taxable: boolean; periodAmount: true }>();
        for (const day of dates) {
          const assignment = assignments.find(a => dateKey(a.fromDate) <= day);
          const contract = contracts.find(c => dateKey(c.startDate) <= day && (!c.endDate || dateKey(c.endDate) >= day));
          const dailyBase = assignment && (!contract || assignment.fromDate >= contract.startDate) ? assignment.baseSalary : contract?.baseSalary ?? user.baseSalary ?? 0;
          const compensationBasis = contract?.compensationBasis ?? 'MONTHLY';
          const monthlyEquivalentBase = compensationBasis === 'DAILY' ? dailyBase * dates.length
            : compensationBasis === 'HOURLY' ? dailyBase * totalScheduledHours
              : dailyBase;
          baseTotal += monthlyEquivalentBase;
          const formulaValues: Record<string, number> = { baseSalary: monthlyEquivalentBase, BASIC: monthlyEquivalentBase, standardDays: dates.length };
          let insurableAllowances = 0, overtimeApplicableAllowances = 0;
          for (const item of assignment?.structure.items ?? []) {
            const formula = item.formula ?? (item.component.isFormulaBased ? item.component.formula : null);
            const amount = formula ? evaluateFormula(formula, formulaValues) : item.amount;
            formulaValues[item.component.code] = amount;
            if (item.component.type === 'EARNING' && item.component.isInsuranceApplicable) insurableAllowances += amount;
            if (item.component.type === 'EARNING' && item.component.isOvertimeApplicable && item.component.code !== 'LUNCH_ALLOW') overtimeApplicableAllowances += amount;
          }
          overtimeBaseTotal += monthlyEquivalentBase + overtimeApplicableAllowances;
          insuranceBaseTotal += Math.max(contract?.insuranceSalary ?? 0, monthlyEquivalentBase + insurableAllowances);
          const row = attendanceByDate.get(day.toISOString().slice(0, 10));
          const scheduledHours = (scheduledMinutesByDate.get(day.toISOString().slice(0, 10)) ?? 480) / 60;
          standardHours += scheduledHours;
          if (row) nightWorkedHours += Number(row.nightWorkedMinutes ?? 0) / 60;
          let actual = 0, paidFraction = 0;
          if (eligibleKeys.has(day.toISOString().slice(0, 10)) && row) {
            actual = ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(row.status) ? Math.min(1, row.workedMinutes / (row.scheduledMinutes ?? 480)) : 0;
            attendanceDays += actual;
            paidFraction = row.status === 'HOLIDAY' || row.status === 'ON_LEAVE' && row.paidLeave ? 1 : actual;
            if (paidFraction === 0) unpaidFullDays++;
            paidDays += paidFraction;
            if (compensationBasis === 'DAILY') earnedBase += dailyBase * paidFraction;
            else if (compensationBasis === 'HOURLY') {
              const paidHours = actual > 0 ? Math.min(row?.workedMinutes ?? 0, row?.scheduledMinutes ?? 480) / 60 : paidFraction * scheduledHours;
              earnedBase += dailyBase * paidHours;
            } else earnedBase += dailyBase * paidFraction / dates.length;
          }
          const componentFormulaValues: Record<string, number> = { baseSalary: monthlyEquivalentBase, BASIC: monthlyEquivalentBase, standardDays: dates.length, workingDays: 1, actualWorkDays: 1 };
          for (const item of assignment?.structure.items ?? []) {
            const formula = item.formula ?? (item.component.isFormulaBased ? item.component.formula : null);
            const amount = formula ? evaluateFormula(formula, componentFormulaValues) : item.amount;
            componentFormulaValues[item.component.code] = amount;
            const fraction = item.component.code === 'LUNCH_ALLOW' ? actual : paidFraction;
            const earnedAmount = amount * fraction / dates.length;
            const existing = componentTotals.get(item.component.code);
            if (existing) existing.amount += earnedAmount;
            else componentTotals.set(item.component.code, { code: item.component.code, name: item.component.name, type: item.component.type, amount: earnedAmount, taxable: item.component.isTaxApplicable, periodAmount: true });
          }
        }
        const base = baseTotal / dates.length;
        const overtimeBase = overtimeBaseTotal / dates.length;
        const insuranceSalary = insuranceBaseTotal / dates.length;
        const items = [...componentTotals.values()];
        const overtime = await tx.overtimeRequest.findMany({ where: { userId: user.id, status: 'APPROVED', workDate: { gte: from, lte: to } } });
        const hourly = monthlyHourlyRate(overtimeBase, standardHours);
        const otPay = overtime.reduce((sum, ot) => {
          const holiday = holidays.includes(ot.workDate.toISOString().slice(0, 10));
          const category = (holiday ? 'PUBLIC_HOLIDAY' : ot.dayCategory) as 'WEEKDAY' | 'WEEKLY_REST' | 'PUBLIC_HOLIDAY';
          const nightHours = Math.min(ot.hours, Math.max(0, ot.nightHours));
          return sum + calculateOvertimePay(ot.hours, nightHours, hourly, category, policy);
        }, 0);
        const bonus = actions.filter(a => a.type === 'AWARD' && a.effectiveAt && a.effectiveAt >= from).reduce((sum, a) => sum + Number((a.payload as { amount?: number }).amount ?? 0), 0);
        const loans = await tx.hrmsEmployeeLoan.findMany({ where: { userId: user.id, status: 'DISBURSED', disbursedAt: { lte: to }, payrollDeductionAuthorizedAt: { not: null } }, orderBy: { createdAt: 'asc' } });
        const overtimeTaxable = overtime.reduce((sum,ot)=>sum+ot.hours*hourly,0);
        const nightWorkBase = nightWorkedHours * hourly;
        const nightWorkPremium = nightWorkBase * policy.overtimeRates.nightAdditional;
        const firstMonthSick = user.hireDate && dateKey(user.hireDate) >= from && await tx.leaveRequest.count({where:{userId:user.id,type:'SICK',status:'APPROVED',startDate:{lte:to},endDate:{gte:from}}}) > 0;
        const region = ['I','II','III','IV'].includes(user.minimumWageRegion) ? user.minimumWageRegion : 'I';
        const unemploymentCap = Number(await this.settings.get(`INSURANCE_CAP_BHTN_${region}_${year}`, policy.unemploymentCapByRegion[region]));
        const resident = user.taxResidency !== 'NON_RESIDENT';
        const taxContract = contracts.find(c => c.type !== 'AMENDMENT' && dateKey(c.startDate) <= to && (!c.endDate || dateKey(c.endDate) >= from));
        const hasSalaryAmendment = contracts.some(c => c.type === 'AMENDMENT' && dateKey(c.startDate) <= to && (!c.endDate || dateKey(c.endDate) >= from));
        const flatTenPercent = resident && !hasSalaryAmendment && (!taxContract || Boolean(taxContract.type !== 'INDEFINITE' && taxContract.endDate && isUnderThreeMonths(taxContract.startDate, taxContract.endDate)));
        const calculated = calculatePayroll({ year, earnedBase, overtimeTaxable, nightWorkBase, nightWorkPremium, insuranceRequired: unpaidFullDays < 14 || Boolean(firstMonthSick), baseSalary: base, standardDays: dates.length, paidDays, attendanceDays, insuranceSalary, insuranceCap, unemploymentCap, dependents: user.taxDependentCount, taxResidency: resident ? 'RESIDENT' : 'NON_RESIDENT', taxWithholdingMode: flatTenPercent ? 'FLAT_10' : 'PROGRESSIVE', policy, overtime: otPay, bonus, items, loans: loans.map(l => ({ id: l.id, emi: l.monthlyEmi, remaining: l.remainingAmount })), minimumWageAudit: { region, contractualMonthlyWage: overtimeBase, standardHours }, overtimeBasis: { contractualMonthlyWage: overtimeBase, standardHours, hourlyRate: hourly } });
        const compensationBases = [...new Set(contracts.filter(c => dateKey(c.startDate) <= to && (!c.endDate || dateKey(c.endDate) >= from)).map(c => c.compensationBasis))];
        const breakdown = { ...calculated.breakdown, calculation: { ...calculated.breakdown.calculation, compensationBases, scheduledHours: totalScheduledHours } };
        await tx.hrmsPayrollSlip.create({ data: { payrollRunId: run.id, userId: user.id, employeeName: user.fullName, bankAccount: user.bankAccount, bankName: user.bankName, employeeCode: user.employeeCode, department: user.orgUnit?.name, jobTitle: user.jobTitle, workingDays: dates.length, actualWorkDays: paidDays, baseSalary: base, grossPay: calculated.grossPay, totalDeduction: calculated.totalDeduction, netPay: calculated.netPay, breakdown, status: 'DRAFT' } });
        for (const deduction of calculated.loanDeductions) await tx.payrollLoanDeduction.create({ data: { payrollRunId: run.id, userId: user.id, ...deduction } });
        totalGrossPay += calculated.grossPay; totalDeduction += calculated.totalDeduction; totalNetPay += calculated.netPay;
      }
      await tx.auditLog.create({ data: { actorId, action: 'PAYROLL_CALCULATED', entityType: 'HrmsPayrollRun', entityId: run.id, afterData: { attendancePeriodId: attendancePeriod.id, attendanceVersion: attendancePeriod.version, employees: users.length } } });
      return tx.hrmsPayrollRun.update({ where: { id: run.id }, data: { totalEmployees: users.length, totalGrossPay, totalDeduction, totalNetPay }, include: { slips: true } });
    }, { isolationLevel: 'Serializable', timeout: 120_000 });
    return result;
  }

  async transition(actorId: string, id: string, next: 'REVIEWED' | 'APPROVED' | 'LOCKED' | 'PAID', payment?: RecordPayrollPaymentDto) {
    if (next === 'PAID' && (!payment?.paymentReference?.trim() || !payment.paymentMethod)) throw new BadRequestException('Cần mã giao dịch hoặc chứng từ chi trước khi xác nhận đã trả lương');
    const expected = { REVIEWED: 'PROCESSED', APPROVED: 'REVIEWED', LOCKED: 'APPROVED', PAID: 'LOCKED' } as const;
    return this.prisma.$transaction(async tx => {
      const run = await tx.hrmsPayrollRun.findUnique({ where: { id } });
      if (!run) throw new NotFoundException('Không tìm thấy kỳ lương');
      if (run.status !== expected[next]) throw new ConflictException(`Phải ở trạng thái ${expected[next]} trước khi chuyển ${next}`);
      if (next === 'REVIEWED' && actorId === run.processedBy) throw new ForbiddenException('Người tính lương không được tự đối soát');
      if ((next === 'APPROVED' || next === 'LOCKED') && actorId === run.processedBy) throw new ForbiddenException('Người tính lương không được tự duyệt hoặc khóa kỳ của mình');
      if (next === 'APPROVED' && run.reviewedBy === actorId) throw new ForbiddenException('Người đối soát không được tự phê duyệt');
      if (next === 'PAID') {
        const reservations = await tx.payrollLoanDeduction.findMany({ where: { payrollRunId: id, appliedAt: null } });
        for (const reservation of reservations) {
          const loan = await tx.hrmsEmployeeLoan.findUniqueOrThrow({ where: { id: reservation.loanId } });
          if (loan.status !== 'DISBURSED' || !loan.payrollDeductionAuthorizedAt || loan.remainingAmount < reservation.amount) throw new ConflictException('Dư nợ hoặc ủy quyền đã thay đổi; phải đối soát trước thanh toán');
          const remaining = loan.remainingAmount - reservation.amount;
          await tx.hrmsEmployeeLoan.update({ where: { id: loan.id }, data: { remainingAmount: remaining, totalRepaid: { increment: reservation.amount }, status: remaining === 0 ? 'COMPLETED' : 'DISBURSED' } });
          await tx.payrollLoanDeduction.update({ where: { id: reservation.id }, data: { appliedAt: new Date() } });
        }
      }
      const changed = await tx.hrmsPayrollRun.updateMany({ where: { id, status: expected[next] }, data: { status: next, ...(next === 'REVIEWED' ? { reviewedBy: actorId, reviewedAt: new Date() } : {}), ...(next === 'LOCKED' ? { lockedBy: actorId, lockedAt: new Date() } : {}), ...(next === 'PAID' ? { paidBy: actorId, paidAt: new Date(), paymentMethod: payment!.paymentMethod, paymentReference: payment!.paymentReference.trim() } : {}) } });
      if (changed.count !== 1) throw new ConflictException('Kỳ lương vừa được xử lý bởi người khác');
      if (next === 'APPROVED' || next === 'PAID') await tx.hrmsPayrollSlip.updateMany({ where: { payrollRunId: id }, data: { status: next } });
      await tx.auditLog.create({ data: { actorId, action: `PAYROLL_${next}`, entityType: 'HrmsPayrollRun', entityId: id } });
      return tx.hrmsPayrollRun.findUniqueOrThrow({ where: { id }, include: { slips: true } });
    }, { isolationLevel: 'Serializable' });
  }

  async getSlip(id: string) {
    const slip = await this.prisma.hrmsPayrollSlip.findUnique({
      where: { id },
      include: { payrollRun: true },
    });
    if (!slip) throw new NotFoundException('Không tìm thấy phiếu lương');
    return slip;
  }

  async listSlipsByUser(userId: string) {
    return this.prisma.hrmsPayrollSlip.findMany({
      where: { userId, payrollRun: { status: { in: ['APPROVED', 'LOCKED', 'PAID'] } } },
      orderBy: { createdAt: 'desc' },
      include: { payrollRun: true },
    });
  }
}

@ApiTags('HRMS - Payroll & Compensation')
@ApiBearerAuth()
@Controller('hrms/payroll')
@Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD')
export class HrmsPayrollController {
  constructor(private readonly service: HrmsPayrollService) {}

  private redactBankDetails<T extends { bankAccount: string | null; bankName: string | null }>(slip: T) {
    const { bankAccount, bankName, ...safeSlip } = slip;
    void bankAccount;
    void bankName;
    return safeSlip;
  }

  @Get('components')
  listComponents() {
    return this.service.listComponents();
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post('components')
  createComponent(@Body() dto: CreateComponentDto, @CurrentUser() actor: AuthUser) {
    return this.service.createComponent(actor.id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Patch('components/:id')
  updateComponent(@Param('id') id: string, @Body() dto: Partial<CreateComponentDto>, @CurrentUser() actor: AuthUser) {
    return this.service.updateComponent(actor.id, id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Delete('components/:id')
  deleteComponent(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deleteComponent(actor.id, id);
  }

  @Get('structures')
  listStructures() {
    return this.service.listStructures();
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Get('assignment-targets')
  listStructureAssignmentTargets() {
    return this.service.listStructureAssignmentTargets();
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post('structures')
  createStructure(@Body() dto: CreateStructureDto, @CurrentUser() actor: AuthUser) {
    return this.service.createStructure(actor.id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post('structures/:id/assign')
  assign(@Param('id') id: string, @Body() body: { userId: string; baseSalary?: number }, @CurrentUser() actor: AuthUser) {
    return this.service.assignStructure(actor.id, id, body.userId, body.baseSalary);
  }

  @Get('runs')
  async listRuns(@CurrentUser() actor: AuthUser) {
    const runs = await this.service.listPayrollRuns();
    if (actor.roles.some(role => ['ADMIN', 'ACCOUNTANT'].includes(role))) return runs;
    return runs.map(run => ({ ...run, slips: run.slips.map(slip => this.redactBankDetails(slip)) }));
  }

  @Get('runs/:id')
  async getRun(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const run = await this.service.getPayrollRun(id);
    if (actor.roles.some(role => ['ADMIN', 'ACCOUNTANT'].includes(role))) return run;
    return { ...run, slips: run.slips.map(slip => this.redactBankDetails(slip)) };
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Delete('runs/:id')
  deleteRun(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.service.deletePayrollRun(actor.id, id);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB')
  @Post('runs')
  createRun(@Body() dto: CreatePayrollRunDto, @CurrentUser() actor: AuthUser) {
    return this.service.createPayrollRun(actor.id, dto);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT')
  @Post('runs/:id/review')
  review(@Param('id') id: string, @CurrentUser() actor: AuthUser) { return this.service.transition(actor.id, id, 'REVIEWED'); }

  @Roles('ADMIN', 'BOD')
  @Post('runs/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() actor: AuthUser) { return this.service.transition(actor.id, id, 'APPROVED'); }

  @Roles('ADMIN', 'BOD')
  @Post('runs/:id/lock')
  lock(@Param('id') id: string, @CurrentUser() actor: AuthUser) { return this.service.transition(actor.id, id, 'LOCKED'); }

  @Roles('ADMIN', 'ACCOUNTANT')
  @Post('runs/:id/pay')
  pay(@Param('id') id: string, @Body() dto: RecordPayrollPaymentDto, @CurrentUser() actor: AuthUser) { return this.service.transition(actor.id, id, 'PAID', dto); }

  @Get('slips/:id')
  async getSlip(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    const slip = await this.service.getSlip(id);
    return actor.roles.some(role => ['ADMIN', 'ACCOUNTANT'].includes(role)) ? slip : this.redactBankDetails(slip);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'USER', 'LINE_MANAGER', 'HR_CB', 'ACCOUNTANT', 'HR_RECRUITER', 'HR_TRAINER', 'BOD', 'AUDITOR')
  @Get('my-slips')
  mySlips(@CurrentUser() actor: AuthUser) {
    return this.service.listSlipsByUser(actor.id);
  }
}

@Module({
  controllers: [HrmsPayrollController],
  providers: [HrmsPayrollService],
  exports: [HrmsPayrollService],
})
export class HrmsPayrollModule {}
