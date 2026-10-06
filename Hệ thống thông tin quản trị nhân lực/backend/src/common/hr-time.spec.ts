import { isScheduledWorkday, isUnderThreeMonths } from './hr-time';

describe('payroll work calendar', () => {
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
