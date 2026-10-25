import { LeaveService } from './leave.module';
import { AttendanceLedgerService } from '../../common/services/attendance-ledger.service';

describe('Leave uses the employee calendar and prorated annual allocation', () => {
  function setup(hire = '2026-12-15', workDays = [1, 2, 3, 4, 5]) {
    const db: any = {
      hrmsShiftAssignment: { findMany: jest.fn().mockResolvedValue([{ startDate: new Date('2020-01-01'), endDate: null, workDays }]) },
      user: { findUnique: jest.fn().mockResolvedValue({ hireDate: new Date(hire) }) }, personnelAction: { findFirst: jest.fn().mockResolvedValue(null) },
      leaveBalance: { upsert: jest.fn(async args => ({ ...args.create, used: 0 })) },
      leaveRequest: { findFirst: jest.fn().mockResolvedValue(null), aggregate: jest.fn().mockResolvedValue({ _sum: { days: 0 } }), create: jest.fn(async ({ data }) => ({ id: 'leave', ...data })) },
      attendancePeriod: { findUnique: jest.fn().mockResolvedValue(null) }, hrmsPayrollRun: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    db.$transaction = async (fn: any) => fn(db);
    const settings: any = { get: jest.fn(async (_key, fallback) => fallback) };
    const ledger = new AttendanceLedgerService(db, settings);
    const service = new LeaveService(db, { log: jest.fn() } as any, ledger, {} as any, settings);
    return { db, settings, ledger, service };
  }
  it('allocates one month for a December hire instead of twelve days', async () => {
    const { service } = setup(); const balance = await service.myBalance({ id: 'employee', email: 'e@test', roles: ['USER'] }, '2026'); expect(balance.entitled).toBe(1);
  });
  it('does not count a joining month with less than half its scheduled working days', async () => {
    const { service } = setup('2026-12-25'); const balance = await service.myBalance({ id: 'employee', email: 'e@test', roles: ['USER'] }, '2026'); expect(balance.entitled).toBe(0);
  });
  it('preserves a full annual allocation for an employee working the entire year', async () => {
    const { service } = setup('2025-01-01'); const balance = await service.myBalance({ id: 'employee', email: 'e@test', roles: ['USER'] }, '2026'); expect(balance.entitled).toBe(12);
  });
  it('accepts a Saturday shift and snapshots charged dates', async () => {
    const { db, service } = setup('2025-01-01', [2, 3, 4, 5, 6]);
    const leave = await service.create({ type: 'UNPAID', startDate: '2026-10-24', endDate: '2026-10-26', reason: 'Việc gia đình' }, { id: 'employee', email: 'e@test', roles: ['USER'] });
    expect(leave.days).toBe(1); expect(db.leaveRequest.create.mock.calls[0][0].data.chargedDates).toEqual(['2026-10-24']);
  });
  it('blocks approved leave from overriding an already confirmed business trip', async () => {
    const { db, ledger, settings } = setup();
    db.leaveRequest.findUnique = jest.fn().mockResolvedValue({ id: 'leave', userId: 'employee', status: 'PENDING', chargedDates: ['2026-10-20'] });
    db.leaveRequest.updateMany = jest.fn();
    db.hrmsTravelRequest = { findFirst: jest.fn().mockResolvedValue({ id: 'trip' }) };
    const service = new LeaveService(db, {} as any, ledger, { assertReviewer: jest.fn() } as any, settings);
    await expect(service.decide('leave', true, { id: 'hr', email: 'hr@test', roles: ['HR_CB'] })).rejects.toThrow('trùng công tác');
    expect(db.leaveRequest.updateMany).not.toHaveBeenCalled();
  });
});
