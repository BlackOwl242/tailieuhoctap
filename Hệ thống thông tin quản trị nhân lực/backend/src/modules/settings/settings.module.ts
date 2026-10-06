import { BadRequestException, Body, Controller, Get, Injectable, Module, Patch } from '@nestjs/common';
import { clockMinutes, dateKey } from '../../common/hr-time';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import { currentPayrollPolicies, VN_PAYROLL_POLICIES, type PayrollPolicy } from '../../common/payroll-calculator';
import { effectiveHolidayCalendar } from '../../common/services/holiday-calendar';

// Khóa cấu hình runtime và giá trị mặc định (tham số kiểu THAMSO của tài liệu)
export const SETTING_DEFAULTS: Record<string, unknown> = {
  ORG_PROFILE: {
    parentOrgName: '', orgName: 'CÔNG TY CỔ PHẦN SAIGON TECHNOLOGY',
    deptName: 'BAN TỔ CHỨC - HÀNH CHÍNH - NHÂN SỰ', orgLevel: 'DV_DNTN',
    orgSector: 'enterprise', publicPersonnelType: null, location: 'TP. Hồ Chí Minh',
    signerTitle1: 'Người lập biểu', signerTitle2: 'Trưởng phòng Nhân sự', signerTitle3: 'Tổng Giám đốc',
  },
  WORK_START: process.env.ATTENDANCE_WORK_START || '08:00',
  WORK_END: process.env.ATTENDANCE_WORK_END || '17:30',
  WORK_BREAK_START: '12:00', WORK_BREAK_END: '13:30',
  QR_TTL_SEC: Number(process.env.QR_TOKEN_TTL_SEC || 30),
  FACE_THRESHOLD: Number(process.env.FACE_MATCH_THRESHOLD || 0.95),
  REVIEW_DUE_DAYS: 7,
  LOGIN_MAX_ATTEMPTS: 5,
  LOCK_MINUTES: 15,
  HOLIDAYS: [],
  PAYROLL_POLICIES: VN_PAYROLL_POLICIES,
};

/** Đọc tham số hiệu lực: ưu tiên DB, rơi về mặc định từ env. */
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async effective(): Promise<Record<string, unknown>> {
    const rows = await this.prisma.setting.findMany();
    const merged: Record<string, unknown> = { ...SETTING_DEFAULTS, HOLIDAYS: effectiveHolidayCalendar(SETTING_DEFAULTS.HOLIDAYS) };
    for (const row of rows) {
      merged[row.key] = row.key === 'PAYROLL_POLICIES'
        ? currentPayrollPolicies(row.value)
        : row.key === 'HOLIDAYS'
          ? effectiveHolidayCalendar(row.value)
          : row.value;
    }
    return merged;
  }

  async update(values: Record<string, unknown>, actor: AuthUser) {
    const allowed = new Set(Object.keys(SETTING_DEFAULTS));
    for (const [key, value] of Object.entries(values)) {
      if (!allowed.has(key) && !/^INSURANCE_CAP_(?:BHXH_\d{4}_(?:[1-9]|1[0-2])|BHTN_\d{4})$/.test(key)) throw new BadRequestException(`Khóa cấu hình không được hỗ trợ: ${key}`);
      if (key === 'PAYROLL_POLICIES') {
        if (!Array.isArray(value) || !value.length) throw new BadRequestException('Cần ít nhất một chính sách lương có ngày hiệu lực');
        for (const candidate of value as PayrollPolicy[]) {
          const rateValues = [candidate.employeeRates?.socialInsurance,candidate.employeeRates?.healthInsurance,candidate.employeeRates?.unemployment,candidate.employerRates?.socialInsurance,candidate.employerRates?.healthInsurance,candidate.employerRates?.unemployment,candidate.employerRates?.occupationalAccident,candidate.employerRates?.tradeUnionFund,candidate.nonResidentTaxRate,candidate.loanDeductionCapRate];
          if (!candidate.version?.trim() || !candidate.basisReference?.trim() || !candidate.effectiveFrom || dateKey(candidate.effectiveFrom).toISOString().slice(0,10) !== candidate.effectiveFrom
            || !Number.isFinite(candidate.personalRelief) || candidate.personalRelief < 0 || !Number.isFinite(candidate.dependentRelief) || candidate.dependentRelief < 0
            || !candidate.taxBrackets?.length || candidate.taxBrackets.some(([limit,rate]) => (limit !== null && (!Number.isFinite(limit) || limit <= 0)) || !Number.isFinite(rate) || rate < 0 || rate > 1)
            || rateValues.some(rate => !Number.isFinite(rate) || rate < 0 || rate > 1)
            || !Number.isFinite(candidate.bhxhCap) || candidate.bhxhCap <= 0
            || !candidate.minimumWageByRegion || !candidate.unemploymentCapByRegion
            || (candidate.minimumHourlyWageByRegion && ['I','II','III','IV'].some(region => {
              const minimum = candidate.minimumHourlyWageByRegion?.[region];
              return minimum === undefined || !Number.isFinite(minimum) || minimum <= 0;
            }))
            || !['ALL','PREMIUM_ONLY','TAXABLE'].includes(candidate.overtimeExemptMode)
            || !['ALL','PREMIUM_ONLY','TAXABLE'].includes(candidate.nightWorkExemptMode)
            || !Number.isFinite(candidate.overtimeRates?.nightAdditional) || candidate.overtimeRates.nightAdditional < 0
            || !Number.isFinite(candidate.overtimeRates?.nightOvertimeFactor) || candidate.overtimeRates.nightOvertimeFactor < 0
            || !Number.isFinite(candidate.maxMonthlyOvertimeHours) || candidate.maxMonthlyOvertimeHours <= 0
            || !Number.isFinite(candidate.maxAnnualOvertimeHours) || candidate.maxAnnualOvertimeHours <= 0) throw new BadRequestException(`Cấu hình chính sách lương ${candidate.version ?? ''} không hợp lệ`);
        }
      } else if (key === 'ORG_PROFILE') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Hồ sơ tổ chức không hợp lệ');
        const profile = value as Record<string, unknown>;
        if (!['enterprise', 'state'].includes(String(profile.orgSector))) throw new BadRequestException('Loại hình tổ chức phải là doanh nghiệp hoặc khu vực nhà nước');
        if (profile.orgSector === 'state' && !['CIVIL_SERVANT', 'PUBLIC_EMPLOYEE'].includes(String(profile.publicPersonnelType))) throw new BadRequestException('Khu vực nhà nước cần chọn chế độ công chức hoặc viên chức');
        if (typeof profile.orgName !== 'string' || !profile.orgName.trim()) throw new BadRequestException('Tên tổ chức không được để trống');
        for (const field of ['parentOrgName', 'deptName', 'orgLevel', 'location', 'signerTitle1', 'signerTitle2', 'signerTitle3']) {
          if (profile[field] !== undefined && typeof profile[field] !== 'string') throw new BadRequestException(`Trường ${field} trong hồ sơ tổ chức không hợp lệ`);
        }
      } else if (['WORK_START', 'WORK_END', 'WORK_BREAK_START', 'WORK_BREAK_END'].includes(key)) clockMinutes(String(value));
      else if (key === 'HOLIDAYS') {
        if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || dateKey(item).toISOString().slice(0,10) !== item)) throw new BadRequestException('Ngày lễ phải là danh sách YYYY-MM-DD');
      } else if (key === 'FACE_THRESHOLD') {
        if (typeof value !== 'number' || value <= 0 || value > 1) throw new BadRequestException('Ngưỡng khuôn mặt phải trong (0,1]');
      } else if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || !Number.isInteger(value)) throw new BadRequestException(`${key} phải là số nguyên dương`);
    }
    await this.prisma.$transaction(async tx => {
      for (const [key, value] of Object.entries(values)) await tx.setting.upsert({
        where: { key },
        create: { key, value: value as object, updatedBy: actor.id },
        update: { value: value as object, updatedBy: actor.id },
      });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'SETTINGS_UPDATED', entityType: 'Setting', afterData: values as import('@prisma/client').Prisma.InputJsonValue } });
    });
    return this.effective();
  }
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller()
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  /** Giá trị hiệu lực — mọi người đăng nhập đều đọc được (dùng cho FE hiển thị). */
  @Get('settings/effective')
  effective() {
    return this.service.effective();
  }

  @Roles('ADMIN')
  @Patch('admin/settings')
  update(@Body() body: { values?: Record<string, unknown> }, @CurrentUser() user: AuthUser) {
    return this.service.update(body.values ?? {}, user);
  }
}

@Module({ controllers: [SettingsController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
