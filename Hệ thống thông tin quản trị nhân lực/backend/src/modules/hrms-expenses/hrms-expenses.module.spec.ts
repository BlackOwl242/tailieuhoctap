import { HrmsExpensesService } from './hrms-expenses.module';

describe('Expense ownership and scope', () => {
  function setup(roles = ['USER']) {
    const actor = { id: 'actor', email: 'a@test', roles: roles.map(roleCode => ({ roleCode })) };
    const db: any = {
      user: { findUniqueOrThrow: jest.fn().mockResolvedValue(actor), findMany: jest.fn().mockResolvedValue([{ id: 'actor' }, { id: 'colleague' }]), findFirst: jest.fn(async ({ where }: any) => ({ id: where.id, fullName: 'Target' })) },
      userRole: { findMany: jest.fn().mockResolvedValue(actor.roles) },
      hrmsExpenseClaim: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue({ id: 'claim', userId: 'other', status: 'SUBMITTED' }), delete: jest.fn(), create: jest.fn() },
      hrmsTravelRequest: { findMany: jest.fn().mockResolvedValue([]) }, hrmsEmployeeAdvance: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const access: any = { reviewScope: jest.fn().mockResolvedValue({ orgUnitId: 'unit' }), assertReviewer: jest.fn().mockRejectedValue(new Error('Ngoài phạm vi')) };
    return { db, access, service: new HrmsExpensesService(db, {} as any, {} as any, access) };
  }
  it('lists only the employee own records by default for all three endpoints', async () => {
    const { db, service } = setup();
    await service.listClaims('actor'); await service.listTravelRequests('actor'); await service.listAdvances('actor');
    for (const model of [db.hrmsExpenseClaim, db.hrmsTravelRequest, db.hrmsEmployeeAdvance]) expect(model.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: { in: ['actor'] } } }));
  });
  it('rejects a forged employee query and deletion of another employee request', async () => {
    const { db, service } = setup();
    await expect(service.listClaims('actor', 'other')).rejects.toThrow('Không có quyền xem');
    await expect(service.deleteClaim('actor', 'claim')).rejects.toThrow('Ngoài phạm vi'); expect(db.hrmsExpenseClaim.delete).not.toHaveBeenCalled();
  });
  it('cannot create a request on behalf of another employee without permission', async () => {
    const { db, service } = setup();
    await expect(service.createClaim('actor', { userId: 'other', title: 'Claim', totalAmount: 100, items: [{ item: 'Taxi', amount: 100 }] } as any)).rejects.toThrow('Ngoài phạm vi');
    expect(db.hrmsExpenseClaim.create).not.toHaveBeenCalled();
  });
  it('restricts a line manager list to the managed unit', async () => {
    const { db, service } = setup(['LINE_MANAGER']); await service.listClaims('actor');
    expect(db.hrmsExpenseClaim.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: { in: ['actor', 'colleague'] } } }));
    await expect(service.listClaims('actor', 'other')).rejects.toThrow('Không có quyền xem');
  });
  it('keeps an auditor read-only even on own records', async () => {
    const { db, service } = setup(['AUDITOR']); await service.listClaims('actor');
    db.hrmsExpenseClaim.findUnique.mockResolvedValue({ id: 'claim', userId: 'actor', status: 'SUBMITTED' });
    await expect(service.deleteClaim('actor', 'claim')).rejects.toThrow('chỉ có quyền xem'); expect(db.hrmsExpenseClaim.delete).not.toHaveBeenCalled();
  });
});

describe('Business travel attendance', () => {
  function setup() {
    const trip = { id: 'travel', userId: 'employee', status: 'APPROVED', departureDate: new Date('2026-09-01'), returnDate: new Date('2026-09-04'), confirmedWorkDates: [] };
    const db: any = { hrmsTravelRequest: { findUniqueOrThrow: jest.fn().mockResolvedValue(trip), update: jest.fn(async ({ data }) => ({ ...trip, ...data })) }, leaveRequest: { findFirst: jest.fn().mockResolvedValue(null) }, auditLog: { create: jest.fn() } };
    db.$transaction = async (fn: any) => fn(db);
    const ledger: any = { scheduledDates: jest.fn().mockResolvedValue([new Date('2026-09-01')]), assertMutable: jest.fn(), recompute: jest.fn() };
    const access: any = { assertReviewer: jest.fn(async (actor, userId) => { if (actor.id === userId) throw new Error('Không tự xác nhận'); }) };
    return { db, ledger, service: new HrmsExpensesService(db, {} as any, ledger, access) };
  }
  const actor = { id: 'manager', email: 'm@test', roles: ['HR_CB'] };
  it('records only confirmed scheduled days and recomputes attendance in the same transaction', async () => {
    const { db, ledger, service } = setup(); await service.confirmTravelAttendance(actor, 'travel', { workDates: ['2026-09-01'], evidenceUrl: '/trip-report.pdf' });
    expect(db.hrmsTravelRequest.update.mock.calls[0][0].data.confirmedWorkDates).toEqual(['2026-09-01']); expect(ledger.recompute).toHaveBeenCalledWith('employee', new Date('2026-09-01'), db);
  });
  it('rejects a date outside the trip work schedule', async () => {
    const { db, service } = setup(); await expect(service.confirmTravelAttendance(actor, 'travel', { workDates: ['2026-09-06'], evidenceUrl: '/trip.pdf' })).rejects.toThrow('trong chuyến đi'); expect(db.hrmsTravelRequest.update).not.toHaveBeenCalled();
  });
  it('rejects overlap with approved leave instead of paying the same absence twice', async () => {
    const { db, service } = setup(); db.leaveRequest.findFirst.mockResolvedValue({ id: 'leave' }); await expect(service.confirmTravelAttendance(actor, 'travel', { workDates: ['2026-09-01'], evidenceUrl: '/trip.pdf' })).rejects.toThrow('trùng nghỉ phép');
  });
});
