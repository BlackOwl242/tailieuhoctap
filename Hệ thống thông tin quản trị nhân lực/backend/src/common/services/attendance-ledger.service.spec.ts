import { AttendanceLedgerService } from './attendance-ledger.service';
import { PrismaService } from '../prisma.service';
import { RuntimeSettingsService } from './runtime-settings.service';

describe('Attendance ledger regressions', () => {
  let db: any;
  let service: AttendanceLedgerService;
  beforeEach(() => {
    db = { attendancePeriod: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue({ id: 'period', version: 1 }) }, hrmsPayrollRun: { findFirst: jest.fn().mockResolvedValue(null) }, hrmsShiftAssignment: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) }, attendanceEvent: { findMany: jest.fn().mockResolvedValue([]) }, hrmsAttendanceRegularization: { findFirst: jest.fn().mockResolvedValue({ requestedCheckIn: '09:00', requestedCheckOut: '10:00' }), count: jest.fn().mockResolvedValue(0) }, attendanceCorrection: { findMany: jest.fn().mockResolvedValue([]) }, leaveRequest: { findFirst: jest.fn().mockResolvedValue(null) }, attendanceDay: { upsert: jest.fn().mockImplementation((arg: any) => arg.create), count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) }, personnelAction: { findMany: jest.fn().mockResolvedValue([]) }, user: { findMany: jest.fn().mockResolvedValue([]) }, auditLog: { create: jest.fn().mockResolvedValue({}) }, $transaction: jest.fn(async (callback: any) => callback(db)), setting: { findUnique: jest.fn().mockResolvedValue(null) } };
    service = new AttendanceLedgerService(db as PrismaService, new RuntimeSettingsService(db));
  });
  it('one approved hour remains sixty minutes after recomputation', async () => {
    const first = await service.recompute('employee', new Date('2026-09-01T00:00:00Z'));
    expect(first.workedMinutes).toBe(60);
    db.attendanceEvent.findMany.mockResolvedValue([{ occurredAt: new Date('2026-09-01T01:00:00Z'), payload: { punch: 'IN' } }, { occurredAt: new Date('2026-09-01T12:00:00Z'), payload: { punch: 'OUT' } }]);
    const again = await service.recompute('employee', new Date('2026-09-01T00:00:00Z'));
    expect(again.workedMinutes).toBe(60);
    expect(again.firstInAt?.toISOString()).toBe('2026-09-01T02:00:00.000Z');
  });
  it('uses an overnight shift instead of the default office hours', async () => {
    db.hrmsShiftAssignment.findFirst.mockResolvedValue({ shiftType: { startTime: '22:00', endTime: '06:00', lateToleranceMinutes: 5, earlyExitToleranceMinutes: 5 } });
    const schedule = await service.schedule('employee', new Date('2026-09-01T00:00:00Z'));
    expect(schedule.startAt.toISOString()).toBe('2026-09-01T15:00:00.000Z');
    expect(schedule.endAt.toISOString()).toBe('2026-09-01T23:00:00.000Z');
  });
  it('captures actual scheduled hours worked overnight for the payroll premium', async () => {
    db.hrmsShiftAssignment.findFirst.mockResolvedValue({ shiftType: { startTime: '22:00', endTime: '06:00', lateToleranceMinutes: 5, earlyExitToleranceMinutes: 5 } });
    db.hrmsAttendanceRegularization.findFirst.mockResolvedValue({ requestedCheckIn: '22:00', requestedCheckOut: '06:00' });
    const result = await service.recompute('employee', new Date('2026-09-01T00:00:00Z'));
    expect(result.workedMinutes).toBe(480);
    expect(result.nightWorkedMinutes).toBe(480);
  });
  it('rejects corrections after monthly close before writing attendance', async () => {
    db.attendancePeriod.findUnique.mockResolvedValue({ status: 'FINALIZED' });
    await expect(service.recompute('employee', new Date('2026-09-01T00:00:00Z'))).rejects.toThrow('đã chốt');
    expect(db.attendanceDay.upsert).not.toHaveBeenCalled();
  });
  it('does not count the configured lunch break as paid working time', async()=>{
    db.hrmsAttendanceRegularization.findFirst.mockResolvedValue({requestedCheckIn:'08:00',requestedCheckOut:'16:00'});
    const result=await service.recompute('employee',new Date('2026-09-01'));
    expect(result.workedMinutes).toBe(390);expect(result.scheduledMinutes).toBe(480);
  });
  it('preserves paid holiday status without a punch pair', async()=>{
    db.hrmsAttendanceRegularization.findFirst.mockResolvedValue(null);
    db.setting.findUnique.mockImplementation(async({where}:any)=>where.key==='HOLIDAYS'?{value:['2026-09-02']}:null);
    const result=await service.recompute('employee',new Date('2026-09-02'));
    expect(result.status).toBe('HOLIDAY');expect(result.workedMinutes).toBe(0);
  });
  it('finalizes assigned Saturday shifts and excludes the employee weekly rest day', async () => {
    db.user.findMany.mockResolvedValue([{ id: 'employee', hireDate: new Date('2020-01-01T00:00:00.000Z') }]);
    db.hrmsShiftAssignment.findMany.mockResolvedValue([{
      userId: 'employee', startDate: new Date('2026-09-01T00:00:00.000Z'), endDate: new Date('2026-09-30T00:00:00.000Z'), workDays: [1, 2, 3, 4, 5, 6],
    }]);
    const recompute = jest.spyOn(service, 'recompute').mockResolvedValue({} as any);

    await service.finalize(9, 2026, 'manager');

    const days = recompute.mock.calls.map(([, day]) => day.toISOString().slice(0, 10));
    expect(days).toContain('2026-09-05');
    expect(days).toContain('2026-09-26');
    expect(days).not.toContain('2026-09-06');
  });

});
