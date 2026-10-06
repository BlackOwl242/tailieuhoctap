import { RecruitmentService } from './recruitment.module';
import type { PrismaService } from '../../common/prisma.service';
import type { AuditService } from '../../common/services/audit.service';

describe('RecruitmentService.closeRequisition', () => {
  const actor = { id: 'director-1', email: 'director@example.test', roles: ['BOD'] };

  function service(activeApplicants: number) {
    const tx = {
      jobRequisition: {
        findUnique: jest.fn().mockResolvedValue({ id: 'req-1', status: 'APPROVED' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'req-1', status: 'CLOSED' }),
      },
      hrmsJobOpening: {
        findUnique: jest.fn().mockResolvedValue({ id: 'opening-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      hrmsJobApplicant: { count: jest.fn().mockResolvedValue(activeApplicants) },
    };
    const prisma = { $transaction: jest.fn((work: (client: typeof tx) => unknown) => work(tx)) };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    return { subject: new RecruitmentService(prisma as unknown as PrismaService, audit as unknown as AuditService), tx, audit };
  }

  it('keeps the requisition and opening open while applicants or offers are still in progress', async () => {
    const { subject, tx, audit } = service(1);

    await expect(subject.closeRequisition('req-1', actor)).rejects.toThrow('hoàn tất hoặc từ chối');

    expect(tx.hrmsJobOpening.updateMany).not.toHaveBeenCalled();
    expect(tx.jobRequisition.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('closes both the opening and requisition after every applicant reaches a terminal state', async () => {
    const { subject, tx, audit } = service(0);

    await subject.closeRequisition('req-1', actor);

    expect(tx.hrmsJobOpening.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'CLOSED' } }));
    expect(tx.jobRequisition.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'CLOSED' } }));
    expect(audit.log).toHaveBeenCalled();
  });
});
