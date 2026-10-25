import { HrWorkflowsService } from './hr-workflows.module';

describe('Probation failure is an approved outcome, not a rejected review', () => {
  function setup() {
    const review = { id: 'review', userId: 'employee', managerId: 'manager', hrVerifiedBy: 'hr', recommendation: 'FAIL', status: 'HR_VERIFIED', effectiveDate: new Date('2026-10-24'), assessment: 'Không đạt mục tiêu thử việc', evidenceUrl: '/review.pdf', contractSalary: null, contractType: null };
    const db: any = {
      probationReview: { findUniqueOrThrow: jest.fn().mockResolvedValue(review), update: jest.fn().mockResolvedValue({ ...review, status: 'APPROVED' }), count: jest.fn().mockResolvedValue(0), create: jest.fn(async ({ data }) => data) },
      user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ employmentStatus: 'PROBATION' }) }, hrmsPayrollRun: { findFirst: jest.fn().mockResolvedValue(null) },
      personnelAction: { create: jest.fn() }, handoverChecklist: { create: jest.fn() }, auditLog: { create: jest.fn() },
    };
    db.$transaction = async (fn: any) => fn(db);
    const effects: any = { applyDue: jest.fn() };
    return { db, effects, service: new HrWorkflowsService(db, { assertReviewer: jest.fn() } as any, effects) };
  }
  it('accepts a failed review without fictitious official salary or contract terms', async () => {
    const { db, service } = setup();
    await service.submitProbation({ id: 'manager', email: 'm@test', roles: ['HR_CB'] }, { userId: 'employee', score: 30, assessment: 'Không đạt mục tiêu thử việc', evidenceUrl: '/review.pdf', recommendation: 'FAIL', effectiveDate: '2026-10-24' });
    expect(db.probationReview.create.mock.calls[0][0].data).toMatchObject({ contractSalary: null, contractType: null });
  });
  it('creates a dated termination decision and handover after independent approval', async () => {
    const { db, effects, service } = setup();
    await service.decideProbation({ id: 'director', email: 'd@test', roles: ['BOD'] }, 'review', { status: 'APPROVED', note: 'Phê duyệt kết luận không đạt' });
    expect(db.personnelAction.create.mock.calls[0][0].data).toMatchObject({ type: 'PROBATION_FAIL', status: 'APPROVED', subjectId: 'employee' });
    expect(db.handoverChecklist.create).toHaveBeenCalled(); expect(effects.applyDue).toHaveBeenCalled();
  });
  it('does not let the HR verifier also approve the conclusion', async () => {
    const { db, service } = setup();
    await expect(service.decideProbation({ id: 'hr', email: 'h@test', roles: ['BOD'] }, 'review', { status: 'APPROVED', note: 'Đồng ý kết luận' })).rejects.toThrow('khác người thẩm định');
    expect(db.personnelAction.create).not.toHaveBeenCalled();
  });
});
