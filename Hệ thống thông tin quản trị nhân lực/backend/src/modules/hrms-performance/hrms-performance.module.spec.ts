import { HrmsPerformanceService } from './hrms-performance.module';

describe('KPI cycle requires complete coverage of its participant scope', () => {
  function setup(scope = 'COMPANY', roster = ['a', 'b']) {
    const cycle = { id: 'cycle', name: 'KPI', organizationSector: 'enterprise', status: 'ACTIVE', participantScope: scope, participantIds: roster, startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') };
    const db: any = { hrmsAppraisalCycle: { findUniqueOrThrow: jest.fn().mockResolvedValue(cycle), update: jest.fn() }, user: { findMany: jest.fn().mockResolvedValue([{ id: 'a', fullName: 'A' }, { id: 'b', fullName: 'B' }]), findUnique: jest.fn(async ({ where }) => ({ fullName: where.id })) }, auditLog: { create: jest.fn() } };
    db.$transaction = async (fn: any) => fn(db);
    const service = new HrmsPerformanceService(db, {} as any, {} as any);
    const summary = jest.spyOn(service, 'summary').mockImplementation(async (_cycle, user) => user === 'a'
      ? { complete: true, weight: 100, score: 90, classification: 'EXCELLENT' as const, missingEvidence: false, framework: 'ENTERPRISE_KPI' }
      : { complete: false, weight: 0, score: null, classification: null, missingEvidence: false });
    return { db, service, summary };
  }
  it('blocks closure when one participant has no assigned goals', async () => {
    const { db, service } = setup(); await expect(service.updateCycle('hr', 'cycle', { status: 'COMPLETED' })).rejects.toThrow('b chưa được giao đủ KPI'); expect(db.hrmsAppraisalCycle.update).not.toHaveBeenCalled();
  });
  it('includes new eligible employees in a company-wide cycle before closing', async () => {
    const { db, service } = setup('COMPANY', ['a']); await expect(service.updateCycle('hr', 'cycle', { status: 'COMPLETED' })).rejects.toThrow('b chưa được giao đủ KPI'); expect(db.hrmsAppraisalCycle.update).not.toHaveBeenCalled();
  });
  it('permits an explicitly selected subset after all selected participants finish', async () => {
    const { db, service, summary } = setup('SELECTED', ['a']); await service.updateCycle('hr', 'cycle', { status: 'COMPLETED' });
    expect(summary).toHaveBeenCalledTimes(1); expect(db.hrmsAppraisalCycle.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'COMPLETED', participantIds: ['a'] } }));
  });
});
