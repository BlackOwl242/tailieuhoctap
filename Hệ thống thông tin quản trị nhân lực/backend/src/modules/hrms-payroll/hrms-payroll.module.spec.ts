import { HrmsPayrollService } from './hrms-payroll.module';
import { businessDates } from '../../common/hr-time';

describe('Payroll close integrity', () => {
  function setup(run: any, period: any = { status: 'FINALIZED', version: 1 }) {
    const db: any = { hrmsPayrollRun: { findUnique: jest.fn().mockResolvedValue(run), updateMany: jest.fn().mockResolvedValue({ count: 1 }), findUniqueOrThrow: jest.fn().mockResolvedValue(run) }, attendancePeriod: { findUnique: jest.fn().mockResolvedValue(period) }, auditLog: { create: jest.fn() } };
    db.$transaction = async (fn: any) => fn(db);
    return { db, service: new HrmsPayrollService(db, {} as any, {} as any, {} as any) };
  }
  it.each([{ status: 'PAID' }, { status: 'LOCKED', paymentReference: 'BANK-001' }, { status: 'APPROVED', paidAt: new Date() }])('cannot cancel a payroll with recorded payment (%j)', async run => {
    const { db, service } = setup(run);
    await expect(service.cancelPayrollRunForRecalculation('hr', 'run')).rejects.toThrow('đã ghi nhận thanh toán');
    expect(db.hrmsPayrollRun.updateMany).not.toHaveBeenCalled();
  });
  it.each([{ status: 'OPEN', version: 2 }, { status: 'FINALIZED', version: 2 }, null])('rejects stale or reopened attendance (%j)', async period => {
    const { db, service } = setup({ status: 'PROCESSED', attendancePeriodId: 'period', attendanceVersion: 1, processedBy: 'hr' }, period);
    await expect(service.transition('accountant', 'run', 'REVIEWED')).rejects.toThrow('Dữ liệu công đã mở lại/thay đổi');
    expect(db.hrmsPayrollRun.updateMany).not.toHaveBeenCalled();
  });
  it('accepts an unchanged finalized attendance version', async () => {
    const { db, service } = setup({ status: 'PROCESSED', attendancePeriodId: 'period', attendanceVersion: 1, processedBy: 'hr' });
    await service.transition('accountant', 'run', 'REVIEWED'); expect(db.hrmsPayrollRun.updateMany).toHaveBeenCalled();
  });
});

describe('Payroll employment dates and confirmed overtime', () => {
  function setup(overtime: any[] = [], hire = '2026-10-15') {
    const from = new Date('2026-10-01'), to = new Date('2026-10-31');
    const employee = { id: 'employee', fullName: 'Nhân viên mới', hireDate: new Date(hire), baseSalary: 30_000_000, minimumWageRegion: 'I', taxDependentCount: 0 };
    const snapshot = businessDates(employee.hireDate, to).map(day => ({ userId: employee.id, workDate: day.toISOString(), status: 'PRESENT', workedMinutes: 480, scheduledMinutes: 480 }));
    const db: any = {
      attendancePeriod: { findUnique: jest.fn().mockResolvedValue({ id: 'period', status: 'FINALIZED', version: 1, snapshot }) },
      setting: { findUnique: jest.fn().mockResolvedValue({ value: { orgSector: 'enterprise' } }) },
      hrmsPayrollRun: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'run' }), update: jest.fn(async ({ data }) => data) },
      user: { findMany: jest.fn().mockResolvedValue([employee]) }, hrmsSalaryStructure: { findMany: jest.fn().mockResolvedValue([]) }, hrmsSalaryBand: { findMany: jest.fn().mockResolvedValue([]) },
      hrmsShiftAssignment: { findMany: jest.fn().mockResolvedValue([]) }, hrmsSalaryStructureAssignment: { findMany: jest.fn().mockResolvedValue([]) },
      contract: { findMany: jest.fn().mockResolvedValue([{ id: 'contract', contractNo: 'CT-NEW', type: 'INDEFINITE', status: 'ACTIVE', startDate: employee.hireDate, endDate: null, baseSalary: 30_000_000, compensationBasis: 'MONTHLY' }]) },
      personnelAction: { findMany: jest.fn().mockResolvedValue([]) }, overtimeRequest: { findMany: jest.fn().mockResolvedValue(overtime) },
      hrmsEmployeeLoan: { findMany: jest.fn().mockResolvedValue([]) }, leaveRequest: { count: jest.fn().mockResolvedValue(0) },
      hrmsPayrollSlip: { create: jest.fn(async ({ data }) => data) }, auditLog: { create: jest.fn() }, payrollLoanDeduction: { create: jest.fn() },
    };
    db.$transaction = jest.fn(async (fn: any) => fn(db));
    const settings: any = { get: jest.fn(async (_key, fallback) => fallback) };
    const ledger: any = { ensureAutoAttendanceUpToDate: jest.fn().mockResolvedValue({}) };
    return { db, from, to, snapshot, service: new HrmsPayrollService(db, {} as any, settings, ledger) };
  }
  it('pays only employment days and keeps the full-month divisor for a midmonth hire', async () => {
    const { db, service, from, to, snapshot } = setup();
    await service.createPayrollRun('hr', { periodName: 'October', fromDate: from.toISOString(), toDate: to.toISOString() });
    const slip = db.hrmsPayrollSlip.create.mock.calls[0][0].data;
    expect(slip.actualWorkDays).toBe(snapshot.length);
    expect(slip.breakdown.calculation.earnedCompensation).toBe(Math.round(30_000_000 * snapshot.length / businessDates(from, to).length));
  });
  it('still rejects a missing salary source during actual employment', async () => {
    const { db, service } = setup();
    db.contract.findMany.mockResolvedValue([{ type: 'INDEFINITE', status: 'ACTIVE', startDate: new Date('2026-10-20'), baseSalary: 30_000_000, endDate: null }]);
    await expect(service.createPayrollRun('hr', { periodName: 'October', fromDate: '2026-10-01', toDate: '2026-10-31' })).rejects.toThrow('2026-10-15');
  });
  it('keeps the configured salary structure when an approved band version changes', async () => {
    const { db, service } = setup();
    const user = (await db.user.findMany())[0];
    user.jobTitle = 'Chuyên viên'; user.salaryBandId = 'old-band';
    db.hrmsSalaryBand.findMany.mockResolvedValue([{ id: 'new-band', code: 'ENG-02', effectiveFrom: new Date('2026-10-01'), effectiveTo: null, jobTitles: ['Chuyên viên'], compensationBasis: 'MONTHLY', minSalary: 20_000_000, midSalary: 30_000_000, maxSalary: 40_000_000 }]);
    db.hrmsSalaryStructure.findMany.mockResolvedValue([{ id: 'structure', name: 'Phụ cấp chuyên viên', salaryBandId: 'old-band', salaryBand: { code: 'ENG-02', effectiveFrom: new Date('2026-09-01') }, items: [] }]);
    await service.createPayrollRun('hr', { periodName: 'October', fromDate: '2026-10-01', toDate: '2026-10-31' });
    expect(db.hrmsPayrollSlip.create.mock.calls[0][0].data.breakdown.calculation.salaryStructureName).toBe('Phụ cấp chuyên viên');
  });
  it('does not pay approved plans without actual confirmation', async () => {
    const { db, service } = setup([{ workDate: new Date('2026-10-16'), status: 'APPROVED', hours: 4, nightHours: 0, dayCategory: 'WEEKDAY', actualConfirmedAt: null }]);
    await service.createPayrollRun('hr', { periodName: 'October', fromDate: '2026-10-01', toDate: '2026-10-31' });
    expect(db.hrmsPayrollSlip.create.mock.calls[0][0].data.breakdown.calculation.approvedOvertime).toEqual([]);
  });
  it('pays confirmed actual hours, including weekly rest days, and excludes pre-hire OT', async () => {
    const overtime = [
      { workDate: new Date('2026-10-18'), status: 'APPROVED', hours: 4, nightHours: 0, dayCategory: 'WEEKLY_REST', actualConfirmedAt: new Date(), actualHours: 2, actualNightHours: 0 },
      { workDate: new Date('2026-10-10'), status: 'APPROVED', hours: 4, nightHours: 0, dayCategory: 'WEEKLY_REST', actualConfirmedAt: new Date(), actualHours: 4, actualNightHours: 0 },
    ];
    const { db, service } = setup(overtime);
    await service.createPayrollRun('hr', { periodName: 'October', fromDate: '2026-10-01', toDate: '2026-10-31' });
    const paid = db.hrmsPayrollSlip.create.mock.calls[0][0].data.breakdown.calculation.approvedOvertime;
    expect(paid).toHaveLength(1); expect(paid[0]).toMatchObject({ workDate: '2026-10-18', hours: 2, category: 'WEEKLY_REST' });
    expect(paid[0].pay).toBeGreaterThan(0);
  });
  it('treats confirmed business trips as paid days without inventing punch hours', async () => {
    const { db, service, snapshot } = setup();
    snapshot[0].status = 'BUSINESS_TRIP'; snapshot[0].workedMinutes = 0;
    await service.createPayrollRun('hr', { periodName: 'October', fromDate: '2026-10-01', toDate: '2026-10-31' });
    const slip = db.hrmsPayrollSlip.create.mock.calls[0][0].data;
    expect(slip.actualWorkDays).toBe(snapshot.length); expect(slip.breakdown.calculation.attendance.workedHours).toBe((snapshot.length - 1) * 8);
  });
  it('can calculate a late-month hire without deducting full-month insurance from one day of salary', async () => {
    const { db, service } = setup([], '2026-10-30');
    await service.createPayrollRun('hr', { periodName: 'October', fromDate: '2026-10-01', toDate: '2026-10-31' });
    const slip = db.hrmsPayrollSlip.create.mock.calls[0][0].data;
    expect(slip.actualWorkDays).toBe(1); expect(slip.netPay).toBeGreaterThan(0);
  });
});
