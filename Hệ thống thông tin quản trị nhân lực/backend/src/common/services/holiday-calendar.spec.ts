import { effectiveHolidayCalendar } from './holiday-calendar';

describe('effectiveHolidayCalendar', () => {
  it('always includes the fixed paid holiday from 2026 onward, including when the configured list is empty', () => {
    expect(effectiveHolidayCalendar([])).toContain('2026-11-24');
    expect(effectiveHolidayCalendar([])).toContain('2027-11-24');
  });

  it('keeps configured holidays, removes duplicates, and sorts dates', () => {
    const dates = effectiveHolidayCalendar(['2026-09-02', '2026-11-24', '2026-01-01']);
    expect(dates).toContain('2026-01-01');
    expect(dates).toContain('2026-09-02');
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toEqual([...dates].sort());
  });
});
