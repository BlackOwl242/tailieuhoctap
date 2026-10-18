import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NotFoundException } from '@nestjs/common';
import { FilesService } from './files.module';

describe('FilesService contract file access', () => {
  const key = '123e4567-e89b-42d3-a456-426614174000.pdf';
  let directory: string;
  let service: FilesService;

  function setup(managerUnit = 'unit-1') {
    directory = mkdtempSync(join(tmpdir(), 'hr-contract-files-'));
    writeFileSync(join(directory, key), 'test contract');
    const prisma = {
      hrDocument: { findFirst: jest.fn().mockResolvedValue(null) },
      contract: { findFirst: jest.fn().mockResolvedValue({
        fileName: 'signed-contract.pdf', userId: 'employee-1', user: { orgUnitId: 'unit-1' },
      }) },
      user: { findUnique: jest.fn().mockResolvedValue({ orgUnitId: managerUnit }) },
      certificate: { findFirst: jest.fn().mockResolvedValue(null) },
      hrmsExpenseClaim: { findFirst: jest.fn().mockResolvedValue(null) },
      hrmsTrainingEnrollment: { findFirst: jest.fn().mockResolvedValue(null) },
      physicalRecordLoan: { findFirst: jest.fn().mockResolvedValue(null) },
      probationReview: { findFirst: jest.fn().mockResolvedValue(null) },
      hrmsAttendanceEvidence: { findFirst: jest.fn().mockResolvedValue(null) },
      hrmsJobOffer: { findFirst: jest.fn().mockResolvedValue(null) },
      attachment: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const config = { get: jest.fn().mockReturnValue(directory) };
    const articles = { assertCanReadAttachment: jest.fn() };
    service = new FilesService(prisma as never, config as never, articles as never);
  }

  afterEach(() => {
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it.each(['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD'])(
    '%s can open an employee contract file', async (role) => {
      setup();
      await expect(service.resolve(key, { id: 'viewer-1', email: 'viewer@example.test', roles: [role] }))
        .resolves.toMatchObject({ originalName: 'signed-contract.pdf' });
    },
  );

  it('lets the employee open their own contract file', async () => {
    setup();
    await expect(service.resolve(key, { id: 'employee-1', email: 'employee@example.test', roles: ['USER'] }))
      .resolves.toMatchObject({ originalName: 'signed-contract.pdf' });
  });

  it('lets a line manager open a contract only in the same unit', async () => {
    setup('unit-1');
    await expect(service.resolve(key, { id: 'manager-1', email: 'manager@example.test', roles: ['LINE_MANAGER'] }))
      .resolves.toMatchObject({ originalName: 'signed-contract.pdf' });
  });

  it('denies a line manager outside the employee unit', async () => {
    setup('unit-2');
    await expect(service.resolve(key, { id: 'manager-1', email: 'manager@example.test', roles: ['LINE_MANAGER'] }))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
