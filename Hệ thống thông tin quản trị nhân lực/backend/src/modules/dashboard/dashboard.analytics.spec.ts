import {
  buildDssRecommendations,
  collectUnitSubtreeIds,
  computeTurnoverRate,
  evaluateSalaryBandStatus,
} from './dashboard-analytics.helper';

describe('Dashboard DSS Analytics helpers', () => {
  it('computes turnover rate safely without dividing by zero', () => {
    expect(computeTurnoverRate(0, 0, 0)).toBe(0);
    expect(computeTurnoverRate(3, 30, 30)).toBe(10);
    expect(computeTurnoverRate(2, 18, 22)).toBe(10);
  });

  it('evaluates salary band compliance boundaries accurately', () => {
    const band = { minSalary: 15_000_000, maxSalary: 25_000_000 };
    expect(evaluateSalaryBandStatus(14_999_999, band)).toBe('BELOW_RANGE');
    expect(evaluateSalaryBandStatus(15_000_000, band)).toBe('IN_RANGE');
    expect(evaluateSalaryBandStatus(25_000_000, band)).toBe('IN_RANGE');
    expect(evaluateSalaryBandStatus(25_000_001, band)).toBe('ABOVE_RANGE');
  });

  it('collects org unit subtree recursively', () => {
    const units = [
      { id: 'root', parentId: null },
      { id: 'dept-a', parentId: 'root' },
      { id: 'team-a1', parentId: 'dept-a' },
      { id: 'dept-b', parentId: 'root' },
    ];
    expect([...collectUnitSubtreeIds(units, 'dept-a')]).toEqual(['dept-a', 'team-a1']);
  });

  it('generates prioritized recommendations directly from real alert counts', () => {
    const recs = buildDssRecommendations({
      turnoverRatePct: 12.5,
      exitsInWindow: 5,
      expiringContracts: [
        { userId: 'u1', fullName: 'A', employeeCode: 'NV0001', contractNo: 'HD1', endDate: '2026-12-01', daysLeft: 10 },
      ],
      probationDue: [
        { userId: 'u2', fullName: 'B', employeeCode: 'NV0002', hireDate: '2026-09-01', daysInProbation: 50 },
      ],
      highOvertime: [
        { userId: 'u3', fullName: 'C', employeeCode: 'NV0003', monthHours: 36, yearHours: 140 },
      ],
      outOfBandSalaries: [
        { userId: 'u4', fullName: 'D', employeeCode: 'NV0004', salary: 9_000_000, bandCode: 'ENG-1', minSalary: 12_000_000, maxSalary: 20_000_000, status: 'BELOW_RANGE' },
      ],
      lowKpiPerformers: [
        { userId: 'u5', fullName: 'E', employeeCode: 'NV0005', score: 42, orgUnitName: 'Engineering' },
      ],
      offerAcceptanceRatePct: 50,
      openingsCount: 2,
    });

    expect(recs.some((r) => r.severity === 'HIGH' && r.category === 'COMPLIANCE')).toBe(true);
    expect(recs.some((r) => r.category === 'PAYROLL')).toBe(true);
    expect(recs.some((r) => r.category === 'PERFORMANCE')).toBe(true);
    expect(recs.some((r) => r.category === 'WORKFORCE' && r.title.includes('12.5%'))).toBe(true);
    expect(recs.some((r) => r.category === 'RECRUITMENT' && r.title.includes('50%'))).toBe(true);
  });

  it('returns empty recommendations when no thresholds are triggered', () => {
    const recs = buildDssRecommendations({
      turnoverRatePct: 2.0,
      exitsInWindow: 1,
      expiringContracts: [],
      probationDue: [],
      highOvertime: [],
      outOfBandSalaries: [],
      lowKpiPerformers: [],
      offerAcceptanceRatePct: 85,
      openingsCount: 1,
    });
    expect(recs).toEqual([]);
  });
});
