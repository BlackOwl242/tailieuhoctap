import { businessDates, dateKey, DAY_MS, workDate } from '../../common/hr-time';
import { toMoney, toMoneyOrNull } from '../../common/money';
import { endsEmployment } from '../../common/personnel-action-rules';
import { effectiveHolidayCalendar } from '../../common/services/holiday-calendar';
import { Controller, ForbiddenException, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { SpaceAccessService } from '../../common/services/space-access.service';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';
import { CurrentUser, Roles } from '../../common/decorators';
import type { AuthUser } from '../../common/types/auth-user';
import {
  buildDssRecommendations,
  collectUnitSubtreeIds,
  computeTurnoverRate,
  evaluateSalaryBandStatus,
  type ExpiringContractAlert,
  type HighOvertimeAlert,
  type LowKpiAlert,
  type OutOfBandSalaryAlert,
  type ProbationDueAlert,
} from './dashboard-analytics.helper';

/**
 * KC21 — Bảng điều khiển & Hỗ trợ ra quyết định (DSS) theo vai:
 * số liệu tổng hợp thời gian thực 100% từ PostgreSQL, không dùng dữ liệu giả.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SpaceAccessService,
    private readonly ledger: AttendanceLedgerService,
  ) {}

  async stats(user: AuthUser) {
    await this.ledger.ensureAutoAttendanceUpToDate();
    const roles = await this.access.globalRoles(user.id);
    const privileged = this.access.isPrivileged(roles);

    // Hộp phê duyệt của tôi: bài PENDING_REVIEW trong Space mình quản lý
    const managed = await this.prisma.spaceMember.findMany({
      where: { userId: user.id, spaceRole: 'MANAGER' },
      select: { spaceId: true },
    });
    const pendingReviews = await this.prisma.article.count({
      where: {
        status: 'PENDING_REVIEW',
        deletedAt: null,
        ...(privileged ? {} : { spaceId: { in: managed.map((m) => m.spaceId) } }),
      },
    });

    // Onboarding của tôi còn bao nhiêu mục bắt buộc chưa xong
    const assignments = await this.prisma.onboardingAssignment.findMany({
      where: { userId: user.id, status: 'IN_PROGRESS' },
      include: { path: { include: { items: { where: { isRequired: true } } } }, progress: true },
    });
    let pendingOnboardingItems = 0;
    for (const a of assignments) {
      const doneIds = new Set(a.progress.map((p) => p.itemId));
      pendingOnboardingItems += a.path.items.filter((i) => !doneIds.has(i.id)).length;
    }

    // Chấm công hôm nay + 7 ngày gần nhất
    const todayStart = workDate();
    const weekAgo = new Date(todayStart.getTime() - 6 * DAY_MS);
    const monthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() + 1, 0));

    const [todayAttendance, weekDays, holidaySetting] = await Promise.all([
      this.prisma.attendanceDay.findUnique({
        where: { userId_workDate: { userId: user.id, workDate: todayStart } },
      }),
      this.prisma.attendanceDay.findMany({
        where: { userId: user.id, workDate: { gte: weekAgo } },
        orderBy: { workDate: 'asc' },
      }),
      this.prisma.setting.findUnique({ where: { key: 'HOLIDAYS' }, select: { value: true } }),
    ]);

    const holidays = effectiveHolidayCalendar(holidaySetting?.value);
    const workingDaysThisMonth = businessDates(monthStart, monthEnd, holidays).length;

    // Thống kê nội dung — chỉ đếm trong Space được phép nhìn thấy
    const visibility = this.access.visibilityWhere(privileged, user.id);
    const [publishedCount, pendingReviewCount, myDrafts] = await Promise.all([
      this.prisma.article.count({ where: { status: 'PUBLISHED', deletedAt: null, space: visibility } }),
      this.prisma.article.count({ where: { status: 'PENDING_REVIEW', deletedAt: null, space: visibility } }),
      this.prisma.article.count({ where: { authorId: user.id, status: 'DRAFT', deletedAt: null } }),
    ]);

    const topArticles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, space: visibility },
      orderBy: { viewCount: 'desc' },
      take: 5,
      select: { id: true, title: true, viewCount: true, helpfulCount: true },
    });
    const recentArticles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null, space: visibility },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        author: { select: { fullName: true } },
        space: { select: { name: true, slug: true } },
      },
    });

    // --- Số liệu HRMIS thời gian thực ---
    const [
      totalEmployees,
      identifiedEmployees,
      presentToday,
      lateToday,
      onLeaveToday,
      pendingLeave,
      pendingOvertime,
      pendingActions,
      latestRun,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          employmentStatus: { in: ['ACTIVE', 'PROBATION'] },
          employeeCode: { not: null },
          orgUnitId: { not: null },
        },
      }),
      this.prisma.attendanceDay.count({ where: { workDate: todayStart, status: { in: ['PRESENT', 'LATE', 'EARLY_LEAVE'] } } }),
      this.prisma.attendanceDay.count({ where: { workDate: todayStart, status: 'LATE' } }),
      this.prisma.attendanceDay.count({ where: { workDate: todayStart, status: 'ON_LEAVE' } }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.overtimeRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.personnelAction.count({ where: { status: 'PENDING' } }),
      this.prisma.hrmsPayrollRun.findFirst({
        where: { status: { not: 'CANCELLED' } },
        orderBy: { fromDate: 'desc' },
        select: { id: true, periodName: true, fromDate: true, status: true, totalNetPay: true },
      }),
    ]);

    const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);
    const latestPeriod = latestRun
      ? {
          id: latestRun.id,
          periodName: latestRun.periodName,
          fromDate: latestRun.fromDate,
          status: latestRun.status,
          month: latestRun.fromDate.getUTCMonth() + 1,
          year: latestRun.fromDate.getUTCFullYear(),
          totalNetPay: toMoney(latestRun.totalNetPay),
        }
      : null;

    return {
      me: { pendingReviews, pendingOnboardingItems, todayAttendance },
      content: { publishedCount, pendingReviewCount, myDrafts },
      attendanceWeek: weekDays.map((d) => ({ date: d.workDate, status: d.status, lateMinutes: d.lateMinutes })),
      topArticles,
      recentArticles,
      hr: {
        totalEmployees,
        identifiedEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeaveToday,
        pendingLeave,
        pendingOvertime,
        pendingActions,
        workingDaysThisMonth,
        latestPeriod,
      },
    };
  }

  /**
   * Trung tâm Phân tích & Hỗ trợ ra quyết định (DSS):
   * tổng hợp biến động nhân sự, quỹ lương, tuân thủ khung lương, KPI, tuyển dụng và cảnh báo rủi ro.
   */
  async analytics(actor: AuthUser, orgUnitId?: string, rawMonths = 6) {
    const months = Math.min(12, Math.max(3, Number.isFinite(Number(rawMonths)) ? Math.round(Number(rawMonths)) : 6));
    const today = workDate();
    const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const contractHorizon = new Date(today.getTime() + 60 * DAY_MS);

    const orgUnits = await this.prisma.orgUnit.findMany({
      select: { id: true, name: true, code: true, parentId: true },
      orderBy: { name: 'asc' },
    });
    const globalRoles = await this.access.globalRoles(actor.id);
    const fullVisibility = globalRoles.some((r) =>
      ['ADMIN', 'KM_MANAGER', 'BOD', 'SHAREHOLDER', 'HR_CB', 'ACCOUNTANT', 'AUDITOR'].includes(r),
    );

    let scopedUnitIds: Set<string> | null = orgUnitId ? collectUnitSubtreeIds(orgUnits, orgUnitId) : null;
    if (!fullVisibility) {
      if (!globalRoles.includes('LINE_MANAGER')) {
        throw new ForbiddenException('Không có quyền xem phân tích điều hành');
      }
      const actorRow = await this.prisma.user.findUnique({ where: { id: actor.id }, select: { orgUnitId: true } });
      if (!actorRow?.orgUnitId) throw new ForbiddenException('Tài khoản quản lý chưa gắn đơn vị tổ chức');
      const managerUnitIds = collectUnitSubtreeIds(orgUnits, actorRow.orgUnitId);
      scopedUnitIds = scopedUnitIds
        ? new Set([...scopedUnitIds].filter((id) => managerUnitIds.has(id)))
        : managerUnitIds;
    }

    const userWhere = {
      deletedAt: null,
      ...(scopedUnitIds ? { orgUnitId: { in: [...scopedUnitIds] } } : {}),
    };

    const [
      users,
      orgSetting,
      approvedBands,
      activeContracts,
      approvedProbationReviews,
      approvedOvertime,
      payrollRuns,
      openings,
      applicants,
      offers,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          fullName: true,
          employeeCode: true,
          orgUnitId: true,
          jobTitle: true,
          salaryBandId: true,
          baseSalary: true,
          hireDate: true,
          employmentStatus: true,
          orgUnit: { select: { id: true, name: true } },
        },
      }),
      this.prisma.setting.findUnique({ where: { key: 'ORG_PROFILE' }, select: { value: true } }),
      this.prisma.hrmsSalaryBand.findMany({
        where: {
          status: 'ACTIVE',
          approvedAt: { not: null },
          effectiveFrom: { lte: today },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }],
        },
        select: { id: true, code: true, name: true, minSalary: true, maxSalary: true, compensationBasis: true, jobTitles: true },
      }),
      this.prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          ...(scopedUnitIds ? { user: { orgUnitId: { in: [...scopedUnitIds] } } } : {}),
        },
        orderBy: { startDate: 'desc' },
        select: { id: true, userId: true, contractNo: true, startDate: true, endDate: true, baseSalary: true, compensationBasis: true },
      }),
      this.prisma.probationReview.findMany({
        where: { status: 'APPROVED' },
        select: { userId: true },
      }),
      this.prisma.overtimeRequest.findMany({
        where: {
          status: 'APPROVED',
          workDate: { gte: yearStart, lte: today },
          ...(scopedUnitIds ? { user: { orgUnitId: { in: [...scopedUnitIds] } } } : {}),
        },
        select: { userId: true, workDate: true, hours: true, actualHours: true, actualConfirmedAt: true },
      }),
      this.prisma.hrmsPayrollRun.findMany({
        where: { status: { not: 'CANCELLED' } },
        orderBy: { fromDate: 'desc' },
        take: months,
        select: {
          id: true,
          periodName: true,
          fromDate: true,
          toDate: true,
          status: true,
          totalEmployees: true,
          totalGrossPay: true,
          totalDeduction: true,
          totalNetPay: true,
          slips: {
            select: { userId: true, department: true, grossPay: true, totalDeduction: true, netPay: true, breakdown: true },
          },
        },
      }),
      this.prisma.hrmsJobOpening.findMany({ select: { id: true, vacancies: true, status: true } }),
      this.prisma.hrmsJobApplicant.findMany({ select: { id: true, stage: true, createdAt: true, updatedAt: true } }),
      this.prisma.hrmsJobOffer.findMany({ select: { id: true, status: true } }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const scopedUserIds = new Set(users.map((u) => u.id));
    const orgProfile = (orgSetting?.value ?? {}) as { orgSector?: string };
    const orgSector = orgProfile.orgSector === 'state' ? 'state' : 'enterprise';

    // --- 1. Workforce & Turnover ---
    const activeUsers = users.filter((u) => ['ACTIVE', 'PROBATION'].includes(u.employmentStatus));
    const probationUsers = activeUsers.filter((u) => u.employmentStatus === 'PROBATION');
    const resignedCount = users.filter((u) => u.employmentStatus === 'RESIGNED').length;
    const retiredCount = users.filter((u) => u.employmentStatus === 'RETIRED').length;

    const tenures = activeUsers
      .filter((u) => Boolean(u.hireDate))
      .map((u) => Math.max(0, (today.getTime() - dateKey(u.hireDate!).getTime()) / (30.4375 * DAY_MS)));
    const avgTenureMonths = tenures.length
      ? Math.round((tenures.reduce((s, x) => s + x, 0) / tenures.length) * 10) / 10
      : 0;

    const windowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1), 1));
    const exitActions = await this.prisma.personnelAction.findMany({
      where: {
        status: 'APPROVED',
        effectiveAt: { gte: windowStart, lte: today },
        ...(scopedUnitIds ? { subjectId: { in: [...scopedUserIds] } } : {}),
      },
      select: { subjectId: true, type: true, payload: true, effectiveAt: true },
    });
    const windowExits = exitActions.filter((a) => endsEmployment(a.type, (a.payload ?? {}) as Record<string, unknown>));

    const monthKeys: string[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      monthKeys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    }
    const monthlyMovement = monthKeys.map((key) => {
      const hires = users.filter((u) => u.hireDate && u.hireDate.toISOString().slice(0, 7) === key).length;
      const exits = windowExits.filter((e) => e.effectiveAt && e.effectiveAt.toISOString().slice(0, 7) === key).length;
      return { month: key, hires, exits };
    });

    const netMovement = monthlyMovement.reduce((s, m) => s + m.hires - m.exits, 0);
    const startActiveEstimate = Math.max(0, activeUsers.length - netMovement);
    const turnoverRatePct = computeTurnoverRate(windowExits.length, startActiveEstimate, activeUsers.length);

    const byUnitMap = new Map<string, { orgUnitId: string; orgUnitName: string; activeCount: number; probationCount: number }>();
    for (const u of activeUsers) {
      const key = u.orgUnitId ?? '__unassigned__';
      const current = byUnitMap.get(key) ?? {
        orgUnitId: key,
        orgUnitName: u.orgUnit?.name ?? 'Chưa phân đơn vị',
        activeCount: 0,
        probationCount: 0,
      };
      current.activeCount += 1;
      if (u.employmentStatus === 'PROBATION') current.probationCount += 1;
      byUnitMap.set(key, current);
    }
    const byOrgUnit = [...byUnitMap.values()].sort((a, b) => b.activeCount - a.activeCount);

    // --- 2. Payroll Trend, Department Breakdown & Band Compliance ---
    const monthlyTrend = [...payrollRuns]
      .reverse()
      .map((run) => {
        const relevantSlips = scopedUnitIds ? run.slips.filter((s) => scopedUserIds.has(s.userId)) : run.slips;
        const totalGrossPay = scopedUnitIds
          ? Math.round(relevantSlips.reduce((s, slip) => s + toMoney(slip.grossPay), 0))
          : toMoney(run.totalGrossPay);
        const totalDeduction = scopedUnitIds
          ? Math.round(relevantSlips.reduce((s, slip) => s + toMoney(slip.totalDeduction), 0))
          : toMoney(run.totalDeduction);
        const totalNetPay = scopedUnitIds
          ? Math.round(relevantSlips.reduce((s, slip) => s + toMoney(slip.netPay), 0))
          : toMoney(run.totalNetPay);
        const employerTotalCost = relevantSlips.length
          ? Math.round(
              relevantSlips.reduce((s, slip) => {
                const cost = (slip.breakdown as { calculation?: { employerTotalCost?: number } } | null)?.calculation?.employerTotalCost;
                return s + (typeof cost === 'number' && Number.isFinite(cost) ? cost : toMoney(slip.grossPay));
              }, 0),
            )
          : totalGrossPay;
        return {
          id: run.id,
          periodName: run.periodName,
          month: run.fromDate.toISOString().slice(0, 7),
          status: run.status,
          totalEmployees: scopedUnitIds ? relevantSlips.length : run.totalEmployees,
          totalGrossPay,
          totalDeduction,
          totalNetPay,
          employerTotalCost,
        };
      });

    const latestRun = payrollRuns[0];
    const latestSlips = latestRun
      ? (scopedUnitIds ? latestRun.slips.filter((s) => scopedUserIds.has(s.userId)) : latestRun.slips)
      : [];
    const deptPayrollMap = new Map<string, { department: string; employees: number; totalGrossPay: number; totalNetPay: number }>();
    for (const slip of latestSlips) {
      const dept = slip.department?.trim() || 'Chưa phân đơn vị';
      const entry = deptPayrollMap.get(dept) ?? { department: dept, employees: 0, totalGrossPay: 0, totalNetPay: 0 };
      entry.employees += 1;
      entry.totalGrossPay += toMoney(slip.grossPay);
      entry.totalNetPay += toMoney(slip.netPay);
      deptPayrollMap.set(dept, entry);
    }
    const payrollByDepartment = [...deptPayrollMap.values()].sort((a, b) => b.totalGrossPay - a.totalGrossPay);

    // Salary band compliance & out-of-band alerts
    const latestContractByUser = new Map<string, (typeof activeContracts)[number]>();
    for (const c of activeContracts) {
      if (!latestContractByUser.has(c.userId)) latestContractByUser.set(c.userId, c);
    }
    const bandCompliance = { inRange: 0, belowRange: 0, aboveRange: 0, unmapped: 0 };
    const outOfBandSalaries: OutOfBandSalaryAlert[] = [];

    for (const u of activeUsers) {
      const contract = orgSector === 'state' ? undefined : latestContractByUser.get(u.id);
      const salary = orgSector === 'state'
        ? toMoneyOrNull(u.baseSalary)
        : toMoneyOrNull(contract?.baseSalary) ?? toMoneyOrNull(u.baseSalary);
      const basis = orgSector === 'state' ? 'MONTHLY' : contract?.compensationBasis ?? 'MONTHLY';

      const byTitle = approvedBands.filter((b) => b.jobTitles.includes(u.jobTitle ?? ''));
      const band = (u.salaryBandId ? approvedBands.find((b) => b.id === u.salaryBandId) : undefined)
        ?? (byTitle.length === 1 ? byTitle[0] : undefined);

      if (!band || salary === null || salary <= 0 || band.compensationBasis !== basis) {
        bandCompliance.unmapped += 1;
        continue;
      }
      const minSalary = toMoney(band.minSalary);
      const maxSalary = toMoney(band.maxSalary);
      const bandStatus = evaluateSalaryBandStatus(salary, { minSalary, maxSalary });
      if (bandStatus === 'IN_RANGE') {
        bandCompliance.inRange += 1;
      } else {
        if (bandStatus === 'BELOW_RANGE') bandCompliance.belowRange += 1;
        else bandCompliance.aboveRange += 1;
        outOfBandSalaries.push({
          userId: u.id,
          fullName: u.fullName,
          employeeCode: u.employeeCode,
          salary,
          bandCode: band.code,
          minSalary,
          maxSalary,
          status: bandStatus,
        });
      }
    }

    // --- 3. Performance KPI Summary & Low-KPI Alerts ---
    const latestCycle =
      (await this.prisma.hrmsAppraisalCycle.findFirst({
        where: { organizationSector: orgSector },
        orderBy: [{ year: 'desc' }, { startDate: 'desc' }],
        include: {
          goals: {
            select: {
              userId: true,
              weightage: true,
              finalScore: true,
              criteriaGroup: true,
              quantityScore: true,
              qualityScore: true,
              progressScore: true,
              evidences: { select: { id: true } },
            },
          },
          publicDecisions: { select: { userId: true, finalClassification: true } },
        },
      })) ??
      (await this.prisma.hrmsAppraisalCycle.findFirst({
        orderBy: [{ year: 'desc' }, { startDate: 'desc' }],
        include: {
          goals: {
            select: {
              userId: true,
              weightage: true,
              finalScore: true,
              criteriaGroup: true,
              quantityScore: true,
              qualityScore: true,
              progressScore: true,
              evidences: { select: { id: true } },
            },
          },
          publicDecisions: { select: { userId: true, finalClassification: true } },
        },
      }));

    const distribution = { EXCELLENT: 0, GOOD: 0, SATISFACTORY: 0, UNSATISFACTORY: 0, INCOMPLETE: 0 };
    const lowKpiPerformers: LowKpiAlert[] = [];
    let performanceSummary: {
      cycleId: string | null;
      cycleName: string | null;
      status: string | null;
      totalParticipants: number;
      completedCount: number;
      averageScore: number | null;
      distribution: typeof distribution;
    } = {
      cycleId: null,
      cycleName: null,
      status: null,
      totalParticipants: 0,
      completedCount: 0,
      averageScore: null,
      distribution,
    };

    if (latestCycle) {
      const candidateIds =
        latestCycle.participantScope === 'COMPANY'
          ? [...new Set([...latestCycle.participantIds, ...users.filter((u) => !u.hireDate || u.hireDate <= latestCycle.endDate).map((u) => u.id)])]
          : latestCycle.participantIds;
      const participants = candidateIds.filter((id) => !scopedUnitIds || scopedUserIds.has(id));
      const goalsByUser = new Map<string, (typeof latestCycle.goals)[number][]>();
      for (const g of latestCycle.goals) {
        if (scopedUnitIds && !scopedUserIds.has(g.userId)) continue;
        const arr = goalsByUser.get(g.userId) ?? [];
        arr.push(g);
        goalsByUser.set(g.userId, arr);
      }
      const decisionMap = new Map(latestCycle.publicDecisions.map((d) => [d.userId, d.finalClassification]));
      const completedScores: number[] = [];

      for (const uid of participants) {
        const goals = goalsByUser.get(uid) ?? [];
        let score: number | null = null;
        let classification: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'UNSATISFACTORY' | null = null;

        if (latestCycle.organizationSector === 'state' && latestCycle.periodType !== 'ANNUAL') {
          const gen = goals.filter((g) => g.criteriaGroup === 'GENERAL');
          const res = goals.filter((g) => g.criteriaGroup === 'RESULT');
          const genW = gen.reduce((s, g) => s + g.weightage, 0);
          const resW = res.reduce((s, g) => s + g.weightage, 0);
          const missingEv = res.some((g) => g.evidences.length === 0);
          const missingDims = latestCycle.periodType !== 'CUSTOM' && res.some((g) => g.quantityScore === null || g.qualityScore === null || g.progressScore === null);
          if (goals.length > 0 && Math.abs(genW - 100) <= 0.001 && Math.abs(resW - 100) <= 0.001 && !goals.some((g) => g.finalScore === null) && !missingEv && !missingDims) {
            const genScore = gen.reduce((s, g) => s + (g.finalScore ?? 0) * g.weightage / 100, 0);
            const taskScore = res.reduce((s, g) => s + (g.finalScore ?? 0) * g.weightage / 100, 0);
            score = Math.round(((genScore * latestCycle.generalCriteriaWeight + taskScore * latestCycle.taskCriteriaWeight) / 100) * 100) / 100;
            classification = decisionMap.get(uid) ?? (score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'SATISFACTORY' : 'UNSATISFACTORY');
          }
        } else if (latestCycle.organizationSector === 'enterprise') {
          const w = goals.reduce((s, g) => s + g.weightage, 0);
          if (goals.length > 0 && Math.abs(w - 100) <= 0.001 && !goals.some((g) => g.finalScore === null || g.evidences.length === 0)) {
            score = Math.round(goals.reduce((s, g) => s + (g.finalScore ?? 0) * g.weightage / 100, 0) * 100) / 100;
            classification = score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : score >= 50 ? 'SATISFACTORY' : 'UNSATISFACTORY';
          }
        } else if (decisionMap.has(uid)) {
          classification = decisionMap.get(uid)!;
        }

        if (classification) {
          distribution[classification] += 1;
          if (score !== null) {
            completedScores.push(score);
            if (score < 50) {
              const u = userMap.get(uid);
              lowKpiPerformers.push({
                userId: uid,
                fullName: u?.fullName ?? uid,
                employeeCode: u?.employeeCode ?? null,
                score,
                orgUnitName: u?.orgUnit?.name ?? null,
              });
            }
          }
        } else {
          distribution.INCOMPLETE += 1;
        }
      }

      performanceSummary = {
        cycleId: latestCycle.id,
        cycleName: latestCycle.name,
        status: latestCycle.status,
        totalParticipants: participants.length,
        completedCount: distribution.EXCELLENT + distribution.GOOD + distribution.SATISFACTORY + distribution.UNSATISFACTORY,
        averageScore: completedScores.length
          ? Math.round((completedScores.reduce((s, x) => s + x, 0) / completedScores.length) * 100) / 100
          : null,
        distribution,
      };
    }

    // --- 4. Recruitment Funnel ---
    const activeOpenings = openings.filter((o) => ['OPEN', 'IN_PROGRESS'].includes(o.status));
    const totalVacancies = activeOpenings.reduce((s, o) => s + o.vacancies, 0);
    const byStage: Record<string, number> = {};
    const timeToHireDays: number[] = [];
    for (const app of applicants) {
      byStage[app.stage] = (byStage[app.stage] ?? 0) + 1;
      if (app.stage === 'HIRED') {
        const diffDays = Math.max(0, Math.round((app.updatedAt.getTime() - app.createdAt.getTime()) / DAY_MS));
        timeToHireDays.push(diffDays);
      }
    }
    const offersSent = offers.filter((o) => ['SENT', 'ACCEPTED', 'REJECTED'].includes(o.status)).length;
    const offersAccepted = offers.filter((o) => o.status === 'ACCEPTED').length;
    const offerAcceptanceRatePct = offersSent > 0 ? Math.round((offersAccepted / offersSent) * 1000) / 10 : null;
    const avgTimeToHireDays = timeToHireDays.length
      ? Math.round((timeToHireDays.reduce((s, x) => s + x, 0) / timeToHireDays.length) * 10) / 10
      : null;

    // --- 5. Early Alerts ---
    const expiringContracts: ExpiringContractAlert[] = [];
    for (const c of activeContracts) {
      if (!c.endDate) continue;
      const end = dateKey(c.endDate);
      if (end >= today && end <= contractHorizon) {
        const u = userMap.get(c.userId);
        if (!u || !['ACTIVE', 'PROBATION'].includes(u.employmentStatus)) continue;
        expiringContracts.push({
          userId: u.id,
          fullName: u.fullName,
          employeeCode: u.employeeCode,
          contractNo: c.contractNo,
          endDate: end.toISOString().slice(0, 10),
          daysLeft: Math.round((end.getTime() - today.getTime()) / DAY_MS),
        });
      }
    }
    expiringContracts.sort((a, b) => a.daysLeft - b.daysLeft);

    const approvedProbationUserIds = new Set(approvedProbationReviews.map((p) => p.userId));
    const probationDue: ProbationDueAlert[] = [];
    for (const u of probationUsers) {
      if (!u.hireDate || approvedProbationUserIds.has(u.id)) continue;
      const hire = dateKey(u.hireDate);
      const daysInProbation = Math.round((today.getTime() - hire.getTime()) / DAY_MS);
      if (daysInProbation >= 45) {
        probationDue.push({
          userId: u.id,
          fullName: u.fullName,
          employeeCode: u.employeeCode,
          hireDate: hire.toISOString().slice(0, 10),
          daysInProbation,
        });
      }
    }
    probationDue.sort((a, b) => b.daysInProbation - a.daysInProbation);

    const otByUser = new Map<string, { monthHours: number; yearHours: number }>();
    for (const ot of approvedOvertime) {
      const h = ot.actualConfirmedAt ? (ot.actualHours ?? ot.hours) : ot.hours;
      const entry = otByUser.get(ot.userId) ?? { monthHours: 0, yearHours: 0 };
      entry.yearHours += h;
      if (dateKey(ot.workDate) >= monthStart) entry.monthHours += h;
      otByUser.set(ot.userId, entry);
    }
    const highOvertime: HighOvertimeAlert[] = [];
    for (const [uid, hrs] of otByUser.entries()) {
      if (hrs.monthHours >= 32 || hrs.yearHours >= 160) {
        const u = userMap.get(uid);
        if (!u) continue;
        highOvertime.push({
          userId: uid,
          fullName: u.fullName,
          employeeCode: u.employeeCode,
          monthHours: Math.round(hrs.monthHours * 10) / 10,
          yearHours: Math.round(hrs.yearHours * 10) / 10,
        });
      }
    }
    highOvertime.sort((a, b) => b.monthHours - a.monthHours || b.yearHours - a.yearHours);

    const recommendations = buildDssRecommendations({
      turnoverRatePct,
      exitsInWindow: windowExits.length,
      expiringContracts,
      probationDue,
      highOvertime,
      outOfBandSalaries,
      lowKpiPerformers,
      offerAcceptanceRatePct,
      openingsCount: activeOpenings.length,
    });

    return {
      generatedAt: new Date().toISOString(),
      horizonMonths: months,
      orgSector,
      workforce: {
        totalActive: activeUsers.length,
        probationCount: probationUsers.length,
        resignedCount,
        retiredCount,
        avgTenureMonths,
        exitsInWindow: windowExits.length,
        turnoverRatePct,
        byOrgUnit,
        monthlyMovement,
      },
      payroll: {
        monthlyTrend,
        byDepartment: payrollByDepartment,
        salaryBandCompliance: bandCompliance,
      },
      performance: performanceSummary,
      recruitment: {
        openingsCount: activeOpenings.length,
        totalVacancies,
        totalApplicants: applicants.length,
        byStage,
        offersSent,
        offersAccepted,
        offerAcceptanceRatePct,
        avgTimeToHireDays,
      },
      alerts: {
        expiringContracts,
        probationDue,
        highOvertime,
        outOfBandSalaries,
        lowKpiPerformers,
      },
      recommendations,
    };
  }
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  stats(@CurrentUser() user: AuthUser) {
    return this.service.stats(user);
  }

  @Roles('ADMIN', 'KM_MANAGER', 'BOD', 'SHAREHOLDER', 'HR_CB', 'LINE_MANAGER', 'ACCOUNTANT', 'AUDITOR')
  @Get('analytics')
  @ApiOperation({ summary: 'Trung tâm Phân tích & Hỗ trợ ra quyết định điều hành (DSS)' })
  analytics(
    @CurrentUser() user: AuthUser,
    @Query('orgUnitId') orgUnitId?: string,
    @Query('months') months?: number,
  ) {
    return this.service.analytics(user, orgUnitId || undefined, months);
  }
}

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
