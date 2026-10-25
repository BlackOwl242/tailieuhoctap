import { OvertimeService } from './overtime.module';

describe('Overtime actual-work confirmation', () => {
  function setup() {
    const row = { id: 'ot', userId: 'employee', workDate: new Date('2026-09-06'), status: 'APPROVED', hours: 4, actualConfirmedAt: null };
    const db: any = { overtimeRequest: { findUniqueOrThrow: jest.fn().mockResolvedValue(row), updateMany: jest.fn().mockResolvedValue({ count: 1 }) }, auditLog: { create: jest.fn() } };
    db.$transaction = async (fn: any) => fn(db);
    const access: any = { assertReviewer: jest.fn(async (actor, id) => { if (actor.id === id) throw new Error('Không tự xác nhận'); }) };
    const ledger: any = { assertMutable: jest.fn(), scheduledDates: jest.fn().mockResolvedValue([]) };
    const settings: any = { effective: jest.fn().mockResolvedValue({ HOLIDAYS: [] }) };
    return { db, row, ledger, service: new OvertimeService(db, {} as any, access, ledger, settings) };
  }
  const dto = { actualHours: 2, actualNightHours: 0, evidenceUrl: '/proof/ot.pdf', note: 'Đã đối chiếu với báo cáo công việc' };
  it('derives weekly rest classification from the assigned work calendar', async () => {
    const { db, service } = setup(); await service.confirmActual('ot', dto, { id: 'manager', email: 'm@test', roles: ['HR_CB'] });
    expect(db.overtimeRequest.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actualHours: 2, dayCategory: 'WEEKLY_REST', actualConfirmedBy: 'manager' }) }));
  });
  it.each([{ actualHours: 5, actualNightHours: 0 }, { actualHours: 2, actualNightHours: 3 }])('rejects actual hours beyond approved limits: %j', async hours => {
    const { db, service } = setup(); await expect(service.confirmActual('ot', { ...dto, ...hours }, { id: 'manager', email: 'm@test', roles: ['HR_CB'] })).rejects.toThrow('không vượt'); expect(db.overtimeRequest.updateMany).not.toHaveBeenCalled();
  });
  it('rejects self-confirmation', async () => {
    const { service } = setup(); await expect(service.confirmActual('ot', dto, { id: 'employee', email: 'e@test', roles: ['HR_CB'] })).rejects.toThrow('Không tự');
  });
  it('records zero actual hours when an approved plan was not performed', async () => {
    const { db, service } = setup(); await service.confirmActual('ot', { ...dto, actualHours: 0 }, { id: 'manager', email: 'm@test', roles: ['HR_CB'] });
    expect(db.overtimeRequest.updateMany.mock.calls[0][0].data.actualHours).toBe(0);
  });
});
