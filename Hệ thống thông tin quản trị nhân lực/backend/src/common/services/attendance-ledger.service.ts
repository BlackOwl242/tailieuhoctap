import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DayStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { atClock, clockMinutes, dateKey, DAY_MS, DEFAULT_WORK_DAYS, isScheduledWorkday, VN_OFFSET, workDate } from '../hr-time';
import { RuntimeSettingsService } from './runtime-settings.service';

type Database = Prisma.TransactionClient | PrismaService;

function paidWorkMinutes(startAt: Date, endAt: Date, breakStart: Date, breakEnd: Date): number {
  return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60_000
    - Math.max(0, (Math.min(endAt.getTime(), breakEnd.getTime()) - Math.max(startAt.getTime(), breakStart.getTime())) / 60_000)));
}
@Injectable()
export class AttendanceLedgerService {
  constructor(private readonly prisma: PrismaService, private readonly settings: RuntimeSettingsService) {}

  async assertMutable(day: Date, db: Database = this.prisma): Promise<void> {
    const key = dateKey(day);
    const period = await db.attendancePeriod.findUnique({ where: { month_year: { month: key.getUTCMonth() + 1, year: key.getUTCFullYear() } } });
    const payroll = await db.hrmsPayrollRun.findFirst({ where: {
      fromDate: { lte: key }, toDate: { gte: key }, status: { in: ['REVIEWED', 'APPROVED', 'LOCKED', 'PAID'] },
    } });
    if (period?.status === 'FINALIZED' || payroll) throw new ConflictException('Kỳ công/lương đã chốt; cần mở lại công trước khi điều chỉnh');
  }

  async schedule(userId: string, day: Date, db: Database = this.prisma) {
    const key = dateKey(day);
    const assignment = await db.hrmsShiftAssignment.findFirst({
      where: { userId, status: 'ACTIVE', startDate: { lte: key }, OR: [{ endDate: null }, { endDate: { gte: key } }] },
      include: { shiftType: true }, orderBy: { startDate: 'desc' },
    });
    const shift = assignment?.shiftType;
    const start = shift?.startTime ?? await this.settings.get('WORK_START', process.env.ATTENDANCE_WORK_START || '08:00');
    const end = shift?.endTime ?? await this.settings.get('WORK_END', process.env.ATTENDANCE_WORK_END || '17:30');
    const breakStart = atClock(key, await this.settings.get('WORK_BREAK_START', '12:00'));
    const breakEnd = atClock(key, await this.settings.get('WORK_BREAK_END', '13:30'));
    const startAt = atClock(key, start);
    const endAt = atClock(key, end);
    if (endAt <= startAt) endAt.setTime(endAt.getTime() + DAY_MS);
    return { key, startAt, endAt, breakStart, breakEnd, shift, scheduledMinutes: paidWorkMinutes(startAt, endAt, breakStart, breakEnd), lateTolerance: shift?.lateToleranceMinutes ?? 15, earlyTolerance: shift?.earlyExitToleranceMinutes ?? 15 };
  }

  async dayForPunch(userId: string, at: Date): Promise<Date> {
    const today = workDate(at);
    const yesterday = new Date(today.getTime() - DAY_MS);
    const prior = await this.schedule(userId, yesterday);
    if (prior.shift && clockMinutes(prior.shift.endTime) <= clockMinutes(prior.shift.startTime) && at < new Date(prior.endAt.getTime() + 4 * 3_600_000)) return yesterday;
    return today;
  }

  async recompute(userId: string, day: Date, db: Database = this.prisma) {
    await this.assertMutable(day, db);
    const schedule = await this.schedule(userId, day, db);
    const lower = new Date(schedule.key.getTime() - VN_OFFSET);
    const upper = new Date(lower.getTime() + (schedule.endAt.getTime() > lower.getTime() + DAY_MS ? 2 : 1) * DAY_MS);
    const events = await db.attendanceEvent.findMany({
      where: { userId, occurredAt: { gte: lower, lt: upper } }, orderBy: { occurredAt: 'asc' },
    });
    const selected = events.filter(e => {
      const payload = e.payload as { workDate?: string };
      return payload?.workDate ? payload.workDate === schedule.key.toISOString().slice(0, 10) : e.occurredAt < schedule.endAt || e.occurredAt < new Date(schedule.endAt.getTime() + 4 * 3_600_000);
    });
    let firstIn: Date | null = null, lastOut: Date | null = null, open: Date | null = null;
    let workedIntervals: [Date, Date][] = [];
    const minutes = (a:Date,b:Date) => Math.max(0, (b.getTime()-a.getTime())/60000 - Math.max(0,(Math.min(b.getTime(),schedule.breakEnd.getTime())-Math.max(a.getTime(),schedule.breakStart.getTime()))/60000));
    const scheduledMinutes = schedule.scheduledMinutes;
    if (scheduledMinutes <= 0) throw new BadRequestException('Ca không có thời gian làm việc sau giờ nghỉ');
    let pairedMinutes = 0;
    for (const event of selected) {
      const payload = event.payload as { punch?: string };
      if (payload?.punch === 'IN') { firstIn ??= event.occurredAt; open ??= event.occurredAt; }
      else if (open) { lastOut = event.occurredAt; pairedMinutes += minutes(open,lastOut); workedIntervals.push([open, lastOut]); open = null; }
    }
    // Approved requests remain the authoritative correction, even after recomputation.
    const correction = await db.hrmsAttendanceRegularization.findFirst({
      where: { userId, workDate: schedule.key, status: 'APPROVED' }, orderBy: { updatedAt: 'desc' },
    });
    if (correction) {
      firstIn = correction.requestedCheckIn ? atClock(schedule.key, correction.requestedCheckIn) : firstIn;
      lastOut = correction.requestedCheckOut ? atClock(schedule.key, correction.requestedCheckOut) : lastOut;
      if (firstIn && lastOut && lastOut < firstIn && schedule.shift && clockMinutes(schedule.shift.endTime) <= clockMinutes(schedule.shift.startTime)) lastOut = new Date(lastOut.getTime() + DAY_MS);
      pairedMinutes = firstIn && lastOut ? minutes(firstIn,lastOut) : 0;
      workedIntervals = firstIn && lastOut ? [[firstIn, lastOut]] : [];
      open = firstIn && !lastOut ? firstIn : null;
    }
    const manuals = await db.attendanceCorrection.findMany({ where: { userId, workDate: schedule.key }, orderBy: { createdAt: 'asc' } });
    let overrideStatus: DayStatus | undefined;
    for (const manual of manuals) {
      if (manual.field === 'firstInAt' && manual.newValue) firstIn = atClock(schedule.key, manual.newValue);
      if (manual.field === 'lastOutAt' && manual.newValue) lastOut = atClock(schedule.key, manual.newValue);
      if (manual.field === 'status' && manual.newValue && Object.values(DayStatus).includes(manual.newValue as DayStatus)) overrideStatus = manual.newValue as DayStatus;
    }
    if (manuals.some(m => m.field !== 'status')) {
      if (firstIn && lastOut && lastOut < firstIn && schedule.shift && clockMinutes(schedule.shift.endTime) <= clockMinutes(schedule.shift.startTime)) lastOut = new Date(lastOut.getTime() + DAY_MS);
      pairedMinutes = firstIn && lastOut ? minutes(firstIn,lastOut) : 0;
      workedIntervals = firstIn && lastOut ? [[firstIn, lastOut]] : [];
      open = firstIn && !lastOut ? firstIn : null;
    }
    const lateMinutes = firstIn ? Math.max(0, Math.round((firstIn.getTime() - schedule.startAt.getTime()) / 60_000)) : 0;
    const earlyMinutes = lastOut ? Math.max(0, Math.round((schedule.endAt.getTime() - lastOut.getTime()) / 60_000)) : 0;
    const holidays = await this.settings.get<string[]>('HOLIDAYS', []);
    const leave = await db.leaveRequest.findFirst({ where: { userId, status: 'APPROVED', startDate: { lte: schedule.key }, endDate: { gte: schedule.key } } });
    let status: DayStatus = !firstIn && !lastOut ? 'ABSENT' : !firstIn || !lastOut || open ? 'MISSING_PAIR' : lateMinutes > schedule.lateTolerance ? 'LATE' : earlyMinutes > schedule.earlyTolerance ? 'EARLY_LEAVE' : 'PRESENT';
    if (leave) status = 'ON_LEAVE';
    if (holidays.includes(schedule.key.toISOString().slice(0, 10))) status = 'HOLIDAY';
    status = overrideStatus ?? status;
    let nightWorkedMinutes = 0;
    const firstNightDate = new Date(schedule.key.getTime() - DAY_MS);
    const finalNightDate = new Date(schedule.key.getTime() + DAY_MS);
    for (const [inAt, outAt] of workedIntervals) {
      const boundedIn = new Date(Math.max(inAt.getTime(), schedule.startAt.getTime()));
      const boundedOut = new Date(Math.min(outAt.getTime(), schedule.endAt.getTime()));
      if (boundedOut <= boundedIn) continue;
      for (let nightDate = firstNightDate; nightDate <= finalNightDate; nightDate = new Date(nightDate.getTime() + DAY_MS)) {
        const nightStart = atClock(nightDate, '22:00');
        const nightEnd = atClock(new Date(nightDate.getTime() + DAY_MS), '06:00');
        const overlapIn = new Date(Math.max(boundedIn.getTime(), nightStart.getTime()));
        const overlapOut = new Date(Math.min(boundedOut.getTime(), nightEnd.getTime()));
        if (overlapOut > overlapIn) nightWorkedMinutes += minutes(overlapIn, overlapOut);
      }
    }
    const data = { paidLeave: Boolean(leave && leave.type === 'ANNUAL'), leaveType: leave?.type ?? null, scheduledMinutes, firstInAt: firstIn, lastOutAt: lastOut, workedMinutes: Math.round(pairedMinutes), nightWorkedMinutes: Math.round(nightWorkedMinutes), lateMinutes, earlyMinutes, status, eventCount: selected.length };
    return db.attendanceDay.upsert({ where: { userId_workDate: { userId, workDate: schedule.key } }, create: { userId, workDate: schedule.key, ...data }, update: data });
  }

  async finalize(month: number, year: number, actorId: string) {
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) throw new BadRequestException('Kỳ công không hợp lệ');
    const from = new Date(Date.UTC(year, month - 1, 1)), to = new Date(Date.UTC(year, month, 0));
    if (to >= workDate()) throw new ConflictException('Chỉ chốt kỳ công đã kết thúc');
    const current = await this.prisma.attendancePeriod.findUnique({ where: { month_year: { month, year } } });
    if (current?.status === 'FINALIZED') throw new ConflictException('Kỳ công đã chốt');
    const pending = await this.prisma.hrmsAttendanceRegularization.count({ where: { workDate: { gte: from, lte: to }, status: 'PENDING' } });
    if (pending) throw new ConflictException(`Còn ${pending} đơn giải trình chưa xử lý`);

    // Recompute unresolved rows outside the snapshot transaction so valid source events
    // remain refreshed even if other days still need HR review.
    const unresolvedRows = await this.prisma.attendanceDay.findMany({
      where: { workDate: { gte: from, lte: to }, status: 'MISSING_PAIR' },
      select: { userId: true, workDate: true },
    });
    for (const row of unresolvedRows) await this.recompute(row.userId, row.workDate);

    // Close the gap between recorded punches and the employee schedule before
    // freezing the period. Otherwise a no-punch employee has no snapshot rows
    // and is silently omitted from payroll.
    await this.materializeScheduledDays(from, to);

    return this.prisma.$transaction(async tx => {
      const existing = await tx.attendancePeriod.findUnique({ where: { month_year: { month, year } } });
      if (existing?.status === 'FINALIZED') throw new ConflictException('Kỳ công đã chốt');
      const pendingInside = await tx.hrmsAttendanceRegularization.count({ where: { workDate: { gte: from, lte: to }, status: 'PENDING' } });
      if (pendingInside) throw new ConflictException(`Còn ${pendingInside} đơn giải trình chưa xử lý`);
      const unresolved = await tx.attendanceDay.count({ where: { workDate: { gte: from, lte: to }, status: 'MISSING_PAIR' } });
      if (unresolved) throw new ConflictException(`Còn ${unresolved} ngày thiếu cặp vào/ra; cần giải trình trước khi chốt`);
      const rows = await tx.attendanceDay.findMany({ where: { workDate: { gte: from, lte: to } }, orderBy: [{ userId: 'asc' }, { workDate: 'asc' }] });
      const period = await tx.attendancePeriod.upsert({ where: { month_year: { month, year } },
        create: { month, year, status: 'FINALIZED', closedBy: actorId, closedAt: new Date(), snapshot: JSON.parse(JSON.stringify(rows)) },
        update: { status: 'FINALIZED', closedBy: actorId, closedAt: new Date(), snapshot: JSON.parse(JSON.stringify(rows)) },
      });
      await tx.auditLog.create({ data: { actorId, action: 'ATTENDANCE_FINALIZED', entityType: 'AttendancePeriod', entityId: period.id, afterData: { version: period.version, month, year } } });
      return period;
    }, { isolationLevel: 'Serializable', timeout: 120_000 });
  }

  private async materializeScheduledDays(from: Date, to: Date) {
    const currentUsers = await this.prisma.user.findMany({
      where: { deletedAt: null, employmentStatus: { in: ['PROBATION', 'ACTIVE'] } },
      select: { id: true, hireDate: true },
    });
    const resignationActions = await this.prisma.personnelAction.findMany({
      where: { type: 'RESIGNATION', status: 'APPROVED', effectiveAt: { lte: to } },
      select: { subjectId: true, effectiveAt: true },
      orderBy: { effectiveAt: 'asc' },
    });
    const firstResignationByUser = new Map<string, Date>();
    for (const action of resignationActions) {
      if (action.effectiveAt && !firstResignationByUser.has(action.subjectId)) firstResignationByUser.set(action.subjectId, dateKey(action.effectiveAt));
    }
    const currentIds = new Set(currentUsers.map(user => user.id));
    const resignationIds = [...firstResignationByUser]
      .filter(([, effectiveAt]) => effectiveAt >= from && effectiveAt <= to)
      .map(([userId]) => userId)
      .filter(userId => !currentIds.has(userId));
    const resignedInPeriod = resignationIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: resignationIds }, deletedAt: null }, select: { id: true, hireDate: true } })
      : [];
    const users = [...currentUsers, ...resignedInPeriod]
      .filter(user => (firstResignationByUser.get(user.id) ?? to) >= from)
      .filter((user, index, all) => all.findIndex(candidate => candidate.id === user.id) === index);
    if (!users.length) return;

    const userIds = users.map(user => user.id);
    const [assignments, existingDays, approvedLeaves, events, corrections, approvedRegularizations, holidays, defaultStart, defaultEnd, breakStartClock, breakEndClock] = await Promise.all([
      this.prisma.hrmsShiftAssignment.findMany({
        where: { userId: { in: userIds }, status: 'ACTIVE', startDate: { lte: to }, OR: [{ endDate: null }, { endDate: { gte: from } }] },
        include: { shiftType: true }, orderBy: { startDate: 'desc' },
      }),
      this.prisma.attendanceDay.findMany({ where: { userId: { in: userIds }, workDate: { gte: from, lte: to } }, select: { userId: true, workDate: true } }),
      this.prisma.leaveRequest.findMany({ where: { userId: { in: userIds }, status: 'APPROVED', startDate: { lte: to }, endDate: { gte: from } }, select: { userId: true, startDate: true, endDate: true, type: true } }),
      this.prisma.attendanceEvent.findMany({
        where: { userId: { in: userIds }, occurredAt: { gte: new Date(from.getTime() - VN_OFFSET), lt: new Date(to.getTime() + DAY_MS + VN_OFFSET) } },
        select: { userId: true, occurredAt: true, payload: true },
      }),
      this.prisma.attendanceCorrection.findMany({ where: { userId: { in: userIds }, workDate: { gte: from, lte: to } }, select: { userId: true, workDate: true } }),
      this.prisma.hrmsAttendanceRegularization.findMany({ where: { userId: { in: userIds }, workDate: { gte: from, lte: to }, status: 'APPROVED' }, select: { userId: true, workDate: true } }),
      this.settings.get<string[]>('HOLIDAYS', []),
      this.settings.get('WORK_START', process.env.ATTENDANCE_WORK_START || '08:00'),
      this.settings.get('WORK_END', process.env.ATTENDANCE_WORK_END || '17:30'),
      this.settings.get('WORK_BREAK_START', '12:00'),
      this.settings.get('WORK_BREAK_END', '13:30'),
    ]);
    const assignmentByUser = new Map<string, typeof assignments>();
    for (const assignment of assignments) assignmentByUser.set(assignment.userId, [...(assignmentByUser.get(assignment.userId) ?? []), assignment]);
    const existingKeys = new Set(existingDays.map(row => `${row.userId}:${dateKey(row.workDate).toISOString().slice(0, 10)}`));
    const evidenceKeys = new Set<string>();
    for (const event of events) {
      const payload = event.payload as { workDate?: unknown } | null;
      const logicalDate = typeof payload?.workDate === 'string' ? dateKey(payload.workDate) : workDate(event.occurredAt);
      evidenceKeys.add(`${event.userId}:${logicalDate.toISOString().slice(0, 10)}`);
    }
    for (const row of [...corrections, ...approvedRegularizations]) evidenceKeys.add(`${row.userId}:${dateKey(row.workDate).toISOString().slice(0, 10)}`);

    const rowsToCreate: Prisma.AttendanceDayCreateManyInput[] = [];
    for (const user of users) {
      const startDate = user.hireDate ? dateKey(user.hireDate) : from;
      const resignationDate = firstResignationByUser.get(user.id) ?? to;
      const userAssignments = assignmentByUser.get(user.id) ?? [];
      for (let time = Math.max(from.getTime(), startDate.getTime()); time <= Math.min(to.getTime(), resignationDate.getTime()); time += DAY_MS) {
        const day = new Date(time);
        const dayText = day.toISOString().slice(0, 10);
        const assignment = userAssignments.find(candidate => dateKey(candidate.startDate) <= day && (!candidate.endDate || dateKey(candidate.endDate) >= day));
        if (!isScheduledWorkday(day, assignment?.workDays ?? DEFAULT_WORK_DAYS)) continue;
        const key = `${user.id}:${dayText}`;
        if (existingKeys.has(key)) continue;
        if (evidenceKeys.has(key)) {
          await this.recompute(user.id, day);
          continue;
        }

        const startAt = atClock(day, assignment?.shiftType.startTime ?? defaultStart);
        const endAt = atClock(day, assignment?.shiftType.endTime ?? defaultEnd);
        if (endAt <= startAt) endAt.setTime(endAt.getTime() + DAY_MS);
        const scheduledMinutes = paidWorkMinutes(startAt, endAt, atClock(day, breakStartClock), atClock(day, breakEndClock));
        if (scheduledMinutes <= 0) throw new ConflictException(`Ca làm việc không hợp lệ của nhân sự ${user.id} ngày ${dayText}`);
        const leave = approvedLeaves.find(item => item.userId === user.id && dateKey(item.startDate) <= day && dateKey(item.endDate) >= day);
        const holiday = holidays.includes(dayText);
        rowsToCreate.push({
          userId: user.id, workDate: day, scheduledMinutes, workedMinutes: 0, nightWorkedMinutes: 0,
          lateMinutes: 0, earlyMinutes: 0, firstInAt: null, lastOutAt: null, eventCount: 0,
          paidLeave: Boolean(leave && leave.type === 'ANNUAL'), leaveType: leave?.type ?? null,
          status: holiday ? 'HOLIDAY' : leave ? 'ON_LEAVE' : 'ABSENT',
        });
        existingKeys.add(key);
      }
    }
    if (rowsToCreate.length) await this.prisma.attendanceDay.createMany({ data: rowsToCreate, skipDuplicates: true });
  }

  async reopen(id: string, reason: string, actorId: string) {
    if (!reason || reason.trim().length < 5) throw new BadRequestException('Cần lý do mở lại kỳ công');
    return this.prisma.$transaction(async tx => {
    const period = await tx.attendancePeriod.findUniqueOrThrow({ where: { id } });
    if (period.status !== 'FINALIZED') throw new ConflictException('Kỳ công chưa chốt');
    const from = new Date(Date.UTC(period.year, period.month - 1, 1)), to = new Date(Date.UTC(period.year, period.month, 0));
    const run = await tx.hrmsPayrollRun.findFirst({ where: { fromDate: { lte: to }, toDate: { gte: from }, status: { in: ['REVIEWED', 'APPROVED', 'LOCKED', 'PAID'] } } });
    if (run) throw new ConflictException('Kỳ lương đã duyệt/khóa; điều chỉnh qua kỳ sau');
      await tx.auditLog.create({ data: { actorId, action: 'ATTENDANCE_REOPENED', entityType: 'AttendancePeriod', entityId: id, afterData: { reason } } });
      return tx.attendancePeriod.update({ where: { id }, data: { status: 'OPEN', version: { increment: 1 }, reason } });
    }, { isolationLevel: 'Serializable' });
  }
}
