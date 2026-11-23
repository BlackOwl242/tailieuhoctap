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

describe('360 reviews, PIP development plans, and KPI award proposals', () => {
  const hrActor = { id: 'hr1', email: 'hr@local', roles: ['HR_CB'] };
  const employeeActor = { id: 'emp1', email: 'emp1@local', roles: ['USER'] };
  const peerActor = { id: 'emp2', email: 'emp2@local', roles: ['USER'] };

  it('enforces SELF vs PEER relationship ownership on 360 review submission', async () => {
    const db: any = {
      hrmsAppraisalCycle: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'c1', status: 'ACTIVE' }) },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'emp1', fullName: 'Nguyen A' }),
        findUnique: jest.fn().mockResolvedValue({ fullName: 'Tran B' }),
      },
      hrmsAppraisalReview: { upsert: jest.fn().mockResolvedValue({ id: 'rev1', rating: 88 }) },
    };
    const audit: any = { log: jest.fn() };
    const service = new HrmsPerformanceService(db, audit, { assertReviewer: jest.fn() } as any);

    await expect(
      service.submitReview(peerActor, { cycleId: 'c1', userId: 'emp1', relationship: 'SELF', rating: 88, feedback: 'Tự đánh giá nhưng gửi hộ' }),
    ).rejects.toThrow('Tự đánh giá chỉ áp dụng cho chính tài khoản của bạn');

    await service.submitReview(peerActor, { cycleId: 'c1', userId: 'emp1', relationship: 'PEER', rating: 88, feedback: 'Phối hợp triển khai dự án tốt và đúng tiến độ.' });
    expect(db.hrmsAppraisalReview.upsert).toHaveBeenCalledTimes(1);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'APPRAISAL_360_REVIEW_SUBMITTED' }));
  });

  it('prevents employees from self-approving PIP completion while allowing progress notes', async () => {
    const db: any = {
      hrmsDevelopmentPlan: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'p1', userId: 'emp1', status: 'PROPOSED' }),
        update: jest.fn().mockResolvedValue({ id: 'p1', status: 'IN_PROGRESS' }),
      },
    };
    const audit: any = { log: jest.fn() };
    const service = new HrmsPerformanceService(db, audit, { assertReviewer: jest.fn() } as any);

    await expect(
      service.updateDevelopmentPlan(employeeActor, 'p1', { status: 'COMPLETED' }),
    ).rejects.toThrow('Nhân sự không được tự phê duyệt hoàn thành');

    await service.updateDevelopmentPlan(employeeActor, 'p1', { status: 'IN_PROGRESS', employeeNotes: 'Đã bắt đầu khóa học' });
    expect(db.hrmsDevelopmentPlan.update).toHaveBeenCalledTimes(1);
  });

  it('requires COMPLETED cycle, score >= 75, and blocks duplicate KPI award proposals', async () => {
    const db: any = {
      hrmsAppraisalCycle: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'c1', name: 'KPI Q3', status: 'COMPLETED' }) },
      personnelAction: {
        findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'pa1', payload: { kpiCycleId: 'c1' } }]),
        create: jest.fn().mockResolvedValue({ id: 'pa-new', type: 'AWARD', status: 'PENDING' }),
      },
    };
    const audit: any = { log: jest.fn() };
    const service = new HrmsPerformanceService(db, audit, { assertReviewer: jest.fn() } as any);
    jest.spyOn(service, 'summary').mockResolvedValue({
      complete: true, weight: 100, score: 92, classification: 'EXCELLENT', missingEvidence: false, framework: 'ENTERPRISE_KPI',
    });

    const created = await service.proposeKpiAward(hrActor, {
      cycleId: 'c1', userId: 'emp1', amount: 3_000_000, reason: 'Hoàn thành xuất sắc KPI quý 3 với 92/100 điểm.',
    });
    expect(created.id).toBe('pa-new');
    expect(db.personnelAction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'AWARD', status: 'PENDING', subjectId: 'emp1' }),
    }));

    await expect(
      service.proposeKpiAward(hrActor, {
        cycleId: 'c1', userId: 'emp1', amount: 3_000_000, reason: 'Đề xuất thưởng trùng kỳ thứ hai.',
      }),
    ).rejects.toThrow('Đã có đề xuất khen thưởng');
  });
});
