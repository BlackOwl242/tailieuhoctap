/** Fixed-date paid holiday added by Resolution 28/2026/QH16, effective 2026-07-01. */
export const FIXED_STATUTORY_HOLIDAYS = Array.from(
  { length: 2100 - 2026 + 1 },
  (_, index) => `${2026 + index}-11-24`,
);

export function effectiveHolidayCalendar(configured: unknown): string[] {
  const configuredDates = Array.isArray(configured)
    ? configured.filter((date): date is string => typeof date === 'string')
    : [];
  return [...new Set([...configuredDates, ...FIXED_STATUTORY_HOLIDAYS])].sort();
}
