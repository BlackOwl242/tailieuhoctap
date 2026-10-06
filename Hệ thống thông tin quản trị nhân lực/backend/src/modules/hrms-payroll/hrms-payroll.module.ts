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

  @ApiPropertyOptional({ description: 'Chức danh áp dụng; đối chiếu chính xác với chức danh trên hồ sơ nhân sự' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Đơn vị áp dụng cụ thể; để trống thì áp dụng cho chức danh ở mọi đơn vị' })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

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
    if (SYSTEM_MANAGED_PAYROLL_COMPONENTS.has(comp.code) || (dto.code && SYSTEM_MANAGED_PAYROLL_COMPONENTS.has(dto.code))) {
      throw new ConflictException('Khoản lương nền và các khoản khấu trừ luật định được hệ thống tính tự động, không chỉnh sửa tại danh mục thành phần.');
    }

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
    if (SYSTEM_MANAGED_PAYROLL_COMPONENTS.has(comp.code)) {
      throw new ConflictException('Khoản lương nền và các khoản khấu trừ luật định là thành phần hệ thống, không thể xóa.');
    }

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
    const structures = await this.prisma.hrmsSalaryStructure.findMany({
      include: {
        items: { include: { component: true } },
        orgUnit: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const [users, assignments] = await Promise.all([
      this.prisma.user.findMany({ where: { deletedAt: null, status: 'ACTIVE', employmentStatus: { in: ['ACTIVE', 'PROBATION'] } }, select: { id: true, jobTitle: true, orgUnitId: true } }),
      this.prisma.hrmsSalaryStructureAssignment.findMany({ where: { isActive: true }, select: { userId: true, structureId: true } }),
    ]);
    const assignedUsers = new Set(assignments.map((assignment) => assignment.userId));
    return structures.map((structure) => ({
      ...structure,
      _count: { assignments: assignments.filter((assignment) => assignment.structureId === structure.id).length },
      positionEmployeeCount: structure.jobTitle ? users.filter((user) => user.jobTitle === structure.jobTitle
        && (!structure.orgUnitId || user.orgUnitId === structure.orgUnitId) && !assignedUsers.has(user.id)).length : 0,
    }));
  }

  async listApprovedSalaryBands() {
    const today = dateKey(new Date());
    const [bands, users] = await Promise.all([
      this.prisma.hrmsSalaryBand.findMany({
        where: { status: 'ACTIVE', approvedAt: { not: null }, effectiveFrom: { lte: today }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }] },
        orderBy: { code: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null, status: 'ACTIVE', employmentStatus: { in: ['ACTIVE', 'PROBATION'] } },
        select: { salaryBandId: true, jobTitle: true, baseSalary: true },
      }),
    ]);
    const currentBandIds = new Set(bands.map((band) => band.id));
    return bands.map((band) => {
      const matched = users.filter((user) => {
        if (user.salaryBandId && currentBandIds.has(user.salaryBandId)) return user.salaryBandId === band.id;
        const candidates = bands.filter((candidate) => candidate.jobTitles.includes(user.jobTitle ?? ''));
        return candidates.length === 1 && candidates[0].id === band.id;
      });
      const comparable = band.compensationBasis === 'MONTHLY' ? matched.filter((user) => Number(user.baseSalary ?? 0) > 0) : [];
      return {
        id: band.id, code: band.code, name: band.name, levelTitle: band.levelTitle,
        minSalary: band.minSalary, midSalary: band.midSalary, maxSalary: band.maxSalary,
        compensationBasis: band.compensationBasis, effectiveFrom: band.effectiveFrom, effectiveTo: band.effectiveTo,
        jobTitles: band.jobTitles, employeeCount: matched.length,
        withinRange: comparable.filter((user) => Number(user.baseSalary) >= band.minSalary && Number(user.baseSalary) <= band.maxSalary).length,
        belowRange: comparable.filter((user) => Number(user.baseSalary) < band.minSalary).length,
        aboveRange: comparable.filter((user) => Number(user.baseSalary) > band.maxSalary).length,
      };
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
    const jobTitle = dto.jobTitle?.trim() || null;
    const orgUnitId = dto.orgUnitId?.trim() || null;
    if (orgUnitId && !(await this.prisma.orgUnit.findUnique({ where: { id: orgUnitId }, select: { id: true } }))) {
      throw new BadRequestException('Đơn vị áp dụng không tồn tại');
    }
    if (jobTitle) {
      const duplicate = await this.prisma.hrmsSalaryStructure.findFirst({ where: { isActive: true, jobTitle, orgUnitId } });
      if (duplicate) throw new ConflictException(`Đã có khung lương áp dụng cho chức danh “${jobTitle}”${orgUnitId ? ' tại đơn vị này' : ' trên toàn hệ thống'}. Hãy sửa khung hiện có hoặc chọn phạm vi đơn vị cụ thể.`);
    }
    const componentIds = [...new Set((dto.items ?? []).map((item) => item.componentId))];
    if (componentIds.length !== (dto.items ?? []).length) throw new BadRequestException('Mỗi thành phần chỉ được chọn một lần trong cấu trúc lương.');
    if ((dto.items ?? []).some((item) => !Number.isFinite(item.amount) || item.amount <= 0)) throw new BadRequestException('Mức cấu phần phải lớn hơn 0; không tạo cấu hình từ số tiền mẫu hoặc chưa được duyệt.');
    if (componentIds.length) {
      const selectedComponents = await this.prisma.hrmsSalaryComponent.findMany({ where: { id: { in: componentIds } }, select: { id: true, code: true } });
      if (selectedComponents.length !== componentIds.length) throw new BadRequestException('Có thành phần lương không còn tồn tại.');
      const protectedComponent = selectedComponents.find((component) => SYSTEM_MANAGED_PAYROLL_COMPONENTS.has(component.code));
      if (protectedComponent) throw new BadRequestException('Lương hợp đồng và BHXH, BHYT, BHTN, thuế TNCN được tính tự động; không thêm các khoản này vào cấu trúc lương.');
    }
    const res = await this.prisma.hrmsSalaryStructure.create({
      data: {
        name: dto.name,
        payrollFrequency: dto.payrollFrequency ?? 'MONTHLY',
        description: dto.description,
        jobTitle,
        orgUnitId,
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
      const rows = attendancePeriod.snapshot as unknown as { userId: string; workDate: string; status: string; workedMinutes: number; nightWorkedMinutes?: number; scheduledMinutes?: number; paidLeave?: boolean; leaveType?: string | null; lateMinutes?: number; earlyMinutes?: number }[];
      const users = await tx.user.findMany({
        where: { deletedAt: null, id: { in: [...new Set(rows.map(r => r.userId))] } },
        select: { id: true, fullName: true, employeeCode: true, jobTitle: true, orgUnitId: true, salaryBandId: true, baseSalary: true, hireDate: true, taxDependentCount: true, taxResidency: true, minimumWageRegion: true, bankAccount: true, bankName: true, orgUnit: { select: { id: true, name: true } } },
      });
      const positionStructures = await tx.hrmsSalaryStructure.findMany({
        where: { isActive: true, jobTitle: { not: null } },
        include: { items: { include: { component: true } } },
      });
      const approvedBands = await tx.hrmsSalaryBand.findMany({
        where: { status: 'ACTIVE', approvedAt: { not: null }, effectiveFrom: { lte: to }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: from } }] },
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
        const assignments = await tx.hrmsSalaryStructureAssignment.findMany({ where: { userId: user.id, fromDate: { lte: to } }, include: { structure: { include: { items: { include: { component: true } } } } }, orderBy: [{ fromDate: 'desc' }, { createdAt: 'desc' }] });
        const contracts = await tx.contract.findMany({ where: { userId: user.id, startDate: { lte: to } }, orderBy: { startDate: 'desc' } });
        const actions = await tx.personnelAction.findMany({ where: { subjectId: user.id, status: 'APPROVED', effectiveAt: { lte: to } }, orderBy: { effectiveAt: 'asc' } });
        const transfers = await tx.personnelAction.findMany({ where: { subjectId: user.id, type: 'TRANSFER', status: 'APPROVED', effectiveAt: { not: null } }, orderBy: { effectiveAt: 'asc' } });
        const resignation = actions.find(a => a.type === 'RESIGNATION');
        const eligible = dates.filter(day => (!user.hireDate || dateKey(user.hireDate) <= day) && (!resignation?.effectiveAt || day <= dateKey(resignation.effectiveAt)));
        const eligibleKeys = new Set(eligible.map(day => day.toISOString().slice(0, 10)));
        let baseTotal = 0, overtimeBaseTotal = 0, insuranceBaseTotal = 0, earnedBase = 0, paidDays = 0, attendanceDays = 0, unpaidFullDays = 0, standardHours = 0;
        let lateMinutesTotal = 0, earlyMinutesTotal = 0, workedMinutesTotal = 0, shortMinutesTotal = 0;
        let lateDays = 0, earlyLeaveDays = 0, absenceDays = 0, paidLeaveDays = 0, unpaidLeaveDays = 0, socialInsuranceLeaveDays = 0, missingPairDays = 0;
        const salaryStructuresUsed = new Set<string>();
        const salarySourcesUsed = new Set<'EMPLOYEE_ASSIGNMENT' | 'POSITION_RULE' | 'CONTRACT_ONLY'>();
        const payRatesUsed = new Map<string, { basis: string; rate: number }>();
        const overtimeHourlyRateByDate = new Map<string, number>();
        const salaryBandReviews = new Map<string, { code: string; name: string; minSalary: number; midSalary: number; maxSalary: number; compensationBasis: string; statuses: Set<string>; days: number }>();
        let daysWithoutApprovedBand = 0;
        const componentTotals = new Map<string, { code: string; name: string; type: 'EARNING' | 'DEDUCTION'; amount: number; taxable: boolean; periodAmount: true }>();
        for (const day of dates) {
          const assignment = assignments.find(a => dateKey(a.fromDate) <= day);
          const transferBefore = transfers.filter((action) => dateKey(action.effectiveAt!) <= day).at(-1);
          const transferAfter = transfers.find((action) => dateKey(action.effectiveAt!) > day);
          const beforePayload = transferBefore?.payload as { newJobTitle?: string; newOrgUnitId?: string } | undefined;
          const afterPayload = transferAfter?.payload as { oldJobTitle?: string; oldOrgUnitId?: string } | undefined;
          const effectiveJobTitle = transferBefore
            ? beforePayload?.newJobTitle || afterPayload?.oldJobTitle || user.jobTitle
            : afterPayload?.oldJobTitle || user.jobTitle;
          const effectiveOrgUnitId = transferBefore
            ? beforePayload?.newOrgUnitId || afterPayload?.oldOrgUnitId || user.orgUnitId
            : afterPayload?.oldOrgUnitId || user.orgUnitId;
          const positionMatches = positionStructures.filter((structure) => structure.jobTitle === effectiveJobTitle && (!structure.orgUnitId || structure.orgUnitId === effectiveOrgUnitId));
          const scopedPositionMatches = positionMatches.filter((structure) => structure.orgUnitId === effectiveOrgUnitId);
          const selectedPositionMatches = scopedPositionMatches.length ? scopedPositionMatches : positionMatches.filter((structure) => !structure.orgUnitId);
          if (selectedPositionMatches.length > 1) throw new ConflictException(`Có nhiều khung lương áp dụng cho ${user.fullName} (${effectiveJobTitle || 'chưa có chức danh'}). Hãy xử lý cấu hình trùng trước khi tính kỳ.`);
          const positionStructure = selectedPositionMatches[0] ?? null;
          const appliedStructure = assignment?.structure ?? positionStructure;
          if (appliedStructure) {
            salaryStructuresUsed.add(appliedStructure.name);
            salarySourcesUsed.add(assignment ? 'EMPLOYEE_ASSIGNMENT' : 'POSITION_RULE');
          } else {
            salarySourcesUsed.add('CONTRACT_ONLY');
          }
          const contract = contracts.find(c => dateKey(c.startDate) <= day && (!c.endDate || dateKey(c.endDate) >= day));
          const assignmentSalary = assignment && (!contract || dateKey(assignment.fromDate) >= dateKey(contract.startDate)) ? assignment.baseSalary : null;
          const dailyBase = assignmentSalary ?? contract?.baseSalary ?? user.baseSalary ?? 0;
          if (!Number.isFinite(dailyBase) || dailyBase <= 0) throw new ConflictException(`Không có lương hợp đồng/quyết định hợp lệ cho ${user.fullName} từ ${day.toISOString().slice(0, 10)}; chưa thể tính bảng lương.`);
          const compensationBasis = contract?.compensationBasis ?? 'MONTHLY';
          payRatesUsed.set(`${compensationBasis}:${dailyBase}`, { basis: compensationBasis, rate: dailyBase });
          const monthlyEquivalentBase = compensationBasis === 'DAILY' ? dailyBase * dates.length
            : compensationBasis === 'HOURLY' ? dailyBase * totalScheduledHours
              : dailyBase;
          const dayBandMatches = approvedBands.filter((band) => dateKey(band.effectiveFrom) <= day && (!band.effectiveTo || dateKey(band.effectiveTo) >= day) && band.jobTitles.includes(effectiveJobTitle ?? ''));
          const salaryBand = dayBandMatches.find((band) => band.id === user.salaryBandId) ?? (dayBandMatches.length === 1 ? dayBandMatches[0] : null);
          if (!salaryBand) daysWithoutApprovedBand++;
          else {
            const comparisonRate = salaryBand.compensationBasis === compensationBasis ? dailyBase
              : salaryBand.compensationBasis === 'MONTHLY' ? monthlyEquivalentBase : null;
            const status = comparisonRate === null ? 'BASIS_MISMATCH'
              : comparisonRate < salaryBand.minSalary ? 'BELOW_RANGE'
                : comparisonRate > salaryBand.maxSalary ? 'ABOVE_RANGE' : 'IN_RANGE';
            const review = salaryBandReviews.get(salaryBand.id) ?? { code: salaryBand.code, name: salaryBand.name, minSalary: salaryBand.minSalary, midSalary: salaryBand.midSalary, maxSalary: salaryBand.maxSalary, compensationBasis: salaryBand.compensationBasis, statuses: new Set<string>(), days: 0 };
            review.statuses.add(status);
            review.days++;
            salaryBandReviews.set(salaryBand.id, review);
          }
          baseTotal += monthlyEquivalentBase;
          const formulaValues: Record<string, number> = { baseSalary: monthlyEquivalentBase, BASIC: monthlyEquivalentBase, standardDays: dates.length };
          let insurableAllowances = 0, overtimeApplicableAllowances = 0;
          for (const item of appliedStructure?.items ?? []) {
            const formula = item.formula ?? (item.component.isFormulaBased ? item.component.formula : null);
            const amount = formula ? evaluateFormula(formula, formulaValues) : item.amount;
            formulaValues[item.component.code] = amount;
            if (item.component.type === 'EARNING' && item.component.isInsuranceApplicable) insurableAllowances += amount;
            if (item.component.type === 'EARNING' && item.component.isOvertimeApplicable && item.component.code !== 'LUNCH_ALLOW') overtimeApplicableAllowances += amount;
          }
          overtimeBaseTotal += monthlyEquivalentBase + overtimeApplicableAllowances;
          overtimeHourlyRateByDate.set(day.toISOString().slice(0, 10), monthlyHourlyRate(monthlyEquivalentBase + overtimeApplicableAllowances, totalScheduledHours));
          insuranceBaseTotal += Math.max(contract?.insuranceSalary ?? 0, monthlyEquivalentBase + insurableAllowances);
          const row = attendanceByDate.get(day.toISOString().slice(0, 10));
          const scheduledHours = (scheduledMinutesByDate.get(day.toISOString().slice(0, 10)) ?? 480) / 60;
          standardHours += scheduledHours;
          let actual = 0, paidFraction = 0;
          if (eligibleKeys.has(day.toISOString().slice(0, 10)) && row) {
            actual = ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(row.status) ? Math.min(1, row.workedMinutes / (row.scheduledMinutes ?? 480)) : 0;
            workedMinutesTotal += Number(row.workedMinutes ?? 0);
            if (row.status === 'LATE') lateDays++;
            if (row.status === 'EARLY_LEAVE') earlyLeaveDays++;
            if (row.status === 'ABSENT') absenceDays++;
            if (row.status === 'MISSING_PAIR') missingPairDays++;
            lateMinutesTotal += Number(row.lateMinutes ?? 0);
            earlyMinutesTotal += Number(row.earlyMinutes ?? 0);
            if (['PRESENT', 'LATE', 'EARLY_LEAVE', 'MISSING_PAIR'].includes(row.status)) shortMinutesTotal += Math.max(0, (row.scheduledMinutes ?? 480) - Number(row.workedMinutes ?? 0));
            attendanceDays += actual;
            paidFraction = row.status === 'HOLIDAY' || row.status === 'ON_LEAVE' && row.paidLeave ? 1 : actual;
            if (row.status === 'ON_LEAVE') {
              if (row.leaveType === 'ANNUAL' && row.paidLeave) paidLeaveDays++;
              else if (row.leaveType === 'SICK' || row.leaveType === 'MATERNITY') socialInsuranceLeaveDays++;
              else unpaidLeaveDays++;
            }
            if (paidFraction === 0) unpaidFullDays++;
            paidDays += paidFraction;
            if (compensationBasis === 'DAILY') earnedBase += dailyBase * paidFraction;
            else if (compensationBasis === 'HOURLY') {
              const paidHours = actual > 0 ? Math.min(row?.workedMinutes ?? 0, row?.scheduledMinutes ?? 480) / 60 : paidFraction * scheduledHours;
              earnedBase += dailyBase * paidHours;
            } else earnedBase += dailyBase * paidFraction / dates.length;
          }
          const componentFormulaValues: Record<string, number> = { baseSalary: monthlyEquivalentBase, BASIC: monthlyEquivalentBase, standardDays: dates.length, workingDays: 1, actualWorkDays: 1 };
          for (const item of appliedStructure?.items ?? []) {
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
        const overtimeRequests = await tx.overtimeRequest.findMany({ where: { userId: user.id, workDate: { gte: from, lte: to } }, orderBy: { workDate: 'asc' } });
        const hourly = monthlyHourlyRate(overtimeBase, standardHours);
        const approvedOvertime = overtimeRequests.filter((ot) => ot.status === 'APPROVED');
        const overtimeDetails = approvedOvertime.map((ot) => {
          const workDate = ot.workDate.toISOString().slice(0, 10);
          const holiday = holidays.includes(workDate);
          const category = (holiday ? 'PUBLIC_HOLIDAY' : ot.dayCategory) as 'WEEKDAY' | 'WEEKLY_REST' | 'PUBLIC_HOLIDAY';
          const nightHours = Math.min(ot.hours, Math.max(0, ot.nightHours));
          const hourlyRate = overtimeHourlyRateByDate.get(workDate) ?? hourly;
          return { workDate, hours: ot.hours, nightHours, category, hourlyRate, pay: calculateOvertimePay(ot.hours, nightHours, hourlyRate, category, policy) };
        });
        const otPay = overtimeDetails.reduce((sum, ot) => sum + ot.pay, 0);
        const bonus = actions.filter(a => a.type === 'AWARD' && a.effectiveAt && a.effectiveAt >= from).reduce((sum, a) => sum + Number((a.payload as { amount?: number }).amount ?? 0), 0);
        const loans = await tx.hrmsEmployeeLoan.findMany({ where: { userId: user.id, status: 'DISBURSED', disbursedAt: { lte: to }, payrollDeductionAuthorizedAt: { not: null } }, orderBy: { createdAt: 'asc' } });
        const overtimeTaxable = overtimeDetails.reduce((sum, ot) => sum + ot.hours * ot.hourlyRate, 0);
        const nightWorkBase = employeeRows.reduce((sum, row) => sum + Number(row.nightWorkedMinutes ?? 0) / 60 * (overtimeHourlyRateByDate.get(row.workDate.slice(0, 10)) ?? hourly), 0);
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
        const breakdown = {
          ...calculated.breakdown,
          calculation: {
            ...calculated.breakdown.calculation,
            compensationBases,
            scheduledHours: totalScheduledHours,
            salarySource: salarySourcesUsed.size > 1 ? 'MIXED' : [...salarySourcesUsed][0] ?? 'CONTRACT_ONLY',
            salaryStructureName: [...salaryStructuresUsed].join(' · ') || null,
            salaryBandReview: {
              bands: [...salaryBandReviews.values()].map((review) => ({
                code: review.code, name: review.name, minSalary: review.minSalary, midSalary: review.midSalary,
                maxSalary: review.maxSalary, compensationBasis: review.compensationBasis,
                status: review.statuses.size === 1 ? [...review.statuses][0] : 'MIXED', days: review.days,
              })),
              daysWithoutApprovedBand,
            },
            contractNo: contracts[0]?.contractNo ?? null,
            payRatesUsed: [...payRatesUsed.values()],
            attendance: {
              standardDays: dates.length,
              paidDays: Number(paidDays.toFixed(2)),
              actualWorkDays: Number(attendanceDays.toFixed(2)),
              workedHours: Number((workedMinutesTotal / 60).toFixed(2)),
              scheduledHours: totalScheduledHours,
              shortHours: Number((shortMinutesTotal / 60).toFixed(2)),
              lateDays,
              lateMinutes: lateMinutesTotal,
              earlyLeaveDays,
              earlyLeaveMinutes: earlyMinutesTotal,
              absenceDays,
              paidLeaveDays,
              unpaidLeaveDays,
              socialInsuranceLeaveDays,
              missingPairDays,
            },
            attendanceDays: employeeRows.filter((row) => eligibleKeys.has(row.workDate.slice(0, 10))).map((row) => ({
              workDate: row.workDate.slice(0, 10), status: row.status,
              scheduledMinutes: row.scheduledMinutes ?? 480, workedMinutes: row.workedMinutes ?? 0,
              lateMinutes: row.lateMinutes ?? 0, earlyMinutes: row.earlyMinutes ?? 0,
              leaveType: row.leaveType ?? null, paidLeave: Boolean(row.paidLeave),
            })),
            overtimeRequests: overtimeRequests.map((ot) => ({
              workDate: ot.workDate.toISOString().slice(0, 10), status: ot.status, hours: ot.hours,
              nightHours: ot.nightHours, dayCategory: ot.dayCategory, paid: ot.status === 'APPROVED',
            })),
            approvedOvertime: overtimeDetails,
          },
        };
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

const SYSTEM_MANAGED_PAYROLL_COMPONENTS = new Set(['BASIC', 'BHXH', 'BHYT', 'BHTN', 'PIT']);

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

  @Get('approved-bands')
  listApprovedSalaryBands() {
    return this.service.listApprovedSalaryBands();
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
