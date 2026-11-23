import { generateNextEmployeeCode } from './hr-code';

describe('generateNextEmployeeCode', () => {
  it('returns NV0001 when no numeric employee codes exist', async () => {
    const db = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    await expect(generateNextEmployeeCode(db)).resolves.toBe('NV0001');
  });

  it('returns NV0391 when highest numeric code is NV0390 and ignores non-numeric NV codes', async () => {
    const db = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          { employeeCode: 'NV0001' },
          { employeeCode: 'NV0390' },
          { employeeCode: 'NVDEMO-CEO' },
          { employeeCode: null },
        ]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    await expect(generateNextEmployeeCode(db)).resolves.toBe('NV0391');
  });

  it('skips colliding codes returned by findUnique', async () => {
    const findUnique = jest.fn()
      .mockResolvedValueOnce({ id: 'existing-1' })
      .mockResolvedValueOnce(null);
    const db = {
      user: {
        findMany: jest.fn().mockResolvedValue([{ employeeCode: 'NV0005' }]),
        findUnique,
      },
    };
    await expect(generateNextEmployeeCode(db)).resolves.toBe('NV0007');
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('respects configured EMPLOYEE_CODE_PREFIX and EMPLOYEE_CODE_PADDING', async () => {
    const findMany = jest.fn().mockResolvedValue([{ employeeCode: 'CB00010' }]);
    const db = {
      user: {
        findMany,
        findUnique: jest.fn().mockResolvedValue(null),
      },
      setting: {
        findMany: jest.fn().mockResolvedValue([
          { key: 'EMPLOYEE_CODE_PREFIX', value: 'cb' },
          { key: 'EMPLOYEE_CODE_PADDING', value: 5 },
        ]),
      },
    };
    await expect(generateNextEmployeeCode(db)).resolves.toBe('CB00011');
    expect(findMany).toHaveBeenCalledWith({
      where: { employeeCode: { startsWith: 'CB' } },
      select: { employeeCode: true },
    });
  });
});
