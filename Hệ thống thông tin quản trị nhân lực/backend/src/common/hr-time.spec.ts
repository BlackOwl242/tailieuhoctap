import { dateKey, isScheduledWorkday, isUnderThreeMonths } from './hr-time';

describe('payroll work calendar', () => {
  it('rejects impossible calendar dates rather than silently rolling into another month', () => {
    expect(() => dateKey('2026-02-31')).toThrow();
    expect(() => dateKey('2026-02-29')).toThrow();
    expect(dateKey('2024-02-29').toISOString().slice(0, 10)).toBe('2024-02-29');
  });
  it('supports Saturday as a scheduled working day while retaining the office default', () => {
    const saturday = new Date('2026-10-03T00:00:00.000Z');
    expect(isScheduledWorkday(saturday)).toBe(false);
    expect(isScheduledWorkday(saturday, [1, 2, 3, 4, 5, 6])).toBe(true);
  });

  it('compares contract lengths in calendar months, including month-end dates', () => {
    expect(isUnderThreeMonths(new Date('2026-08-31'), new Date('2026-11-29'))).toBe(true);
    expect(isUnderThreeMonths(new Date('2026-08-31'), new Date('2026-11-30'))).toBe(false);
    expect(isUnderThreeMonths(new Date('2026-11-15'), new Date('2027-02-14'))).toBe(true);
    expect(isUnderThreeMonths(new Date('2026-11-15'), new Date('2027-02-15'))).toBe(false);
  });
});
