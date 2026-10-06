import { ConflictException } from '@nestjs/common';
import { HrmsLoansService } from './hrms-loans.module';

describe('HrmsLoansService', () => {
  it('does not approve a loan without recorded payroll deduction consent', async () => {
    const prisma = {
      hrmsEmployeeLoan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'loan-1', userId: 'employee-1', status: 'PENDING',
          payrollDeductionAuthorizedAt: null, deductionConsentVersion: null,
        }),
        update: jest.fn(),
      },
    };
    const audit = { log: jest.fn() };
    const service = new HrmsLoansService(prisma as never, audit as never);

    await expect(service.decide('reviewer-1', 'loan-1', { status: 'APPROVED' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.hrmsEmployeeLoan.update).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('does not disburse a loan without recorded payroll deduction consent', async () => {
    const loan = {
      id: 'loan-1',
      userId: 'employee-1',
      status: 'APPROVED',
      payrollDeductionAuthorizedAt: null,
      deductionConsentVersion: null,
    };
    const prisma = {
      hrmsEmployeeLoan: {
        findUnique: jest.fn().mockResolvedValue(loan),
        updateMany: jest.fn(),
      },
    };
    const audit = { log: jest.fn() };
    const service = new HrmsLoansService(prisma as never, audit as never);

    await expect(service.disburse('accountant-1', 'loan-1', { method: 'BANK', reference: 'TX-1' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.hrmsEmployeeLoan.updateMany).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });
});
