import { ForbiddenException } from '@nestjs/common';
import { EmployeesService } from './employees.module';

describe('EmployeesService contract visibility', () => {
  const targetId = 'employee-1';
  const employee = {
    id: targetId,
    email: 'employee@example.test',
    fullName: 'Nguyễn An',
    employeeCode: 'NV0001',
    hireDate: new Date('2024-01-01'),
    employmentStatus: 'ACTIVE',
    jobTitle: 'Chuyên viên',
    status: 'ACTIVE',
    orgUnitId: 'unit-1',
    orgUnit: { id: 'unit-1', name: 'Phòng A', code: 'A' },
    contracts: [{ id: 'contract-1', contractNo: 'HD-001', baseSalary: 20_000_000 }],
    certificates: [],
    leaveBalances: [],
  };

  function createService(orgUnits: string[] = []) {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ ...employee }),
        findUnique: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
          const orgUnitId = where.id === targetId ? orgUnits[1] : orgUnits[0];
          return Promise.resolve({ orgUnitId });
        }),
      },
    };
    return { service: new EmployeesService(prisma as never, {} as never, {} as never), prisma };
  }

  it.each(['ADMIN', 'KM_MANAGER', 'HR_CB', 'ACCOUNTANT', 'BOD'])(
    '%s can read employee contract details', async (role) => {
      const { service } = createService();
      const result = await service.detail(targetId, { id: 'viewer-1', email: 'viewer@example.test', roles: [role] });
      expect(result.contracts).toEqual(employee.contracts);
    },
  );

  it('lets an employee read only their own contracts', async () => {
    const { service } = createService();
    const result = await service.detail(targetId, { id: targetId, email: employee.email, roles: ['USER'] });
    expect(result.contracts).toEqual(employee.contracts);
  });

  it('lets a line manager in the same unit read the employee contract', async () => {
    const { service } = createService(['unit-1', 'unit-1']);
    const result = await service.detail(targetId, { id: 'manager-1', email: 'manager@example.test', roles: ['LINE_MANAGER'] });
    expect(result.contracts).toEqual(employee.contracts);
  });

  it('denies a line manager outside the employee unit', async () => {
    const { service } = createService(['unit-2', 'unit-1']);
    await expect(service.detail(targetId, { id: 'manager-1', email: 'manager@example.test', roles: ['LINE_MANAGER'] }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not return contracts to another regular employee', async () => {
    const { service, prisma } = createService();
    await expect(service.detail(targetId, { id: 'viewer-1', email: 'viewer@example.test', roles: ['USER'] }))
      .rejects.toBeInstanceOf(ForbiddenException);
    const select = prisma.user.findFirst.mock.calls[0][0].select;
    expect(select.contracts).toBeUndefined();
  });
});
