import { BadRequestException } from '@nestjs/common';

export const DAY_MS = 86_400_000;
export const VN_OFFSET = 7 * 3_600_000;
/** Logical Vietnamese work date, stored as UTC midnight in PostgreSQL DATE. */
export function workDate(at: Date = new Date()): Date {
  return new Date(new Date(at.getTime() + VN_OFFSET).toISOString().slice(0, 10) + 'T00:00:00.000Z');
}
export function dateKey(value: Date | string): Date {
  const text = typeof value === 'string' ? value : value.toISOString();
  const result = new Date(text.slice(0, 10) + 'T00:00:00.000Z');
  if (!Number.isFinite(result.getTime())) throw new BadRequestException('Ngày không hợp lệ');
  return result;
}
export function clockMinutes(clock: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) throw new BadRequestException('Giờ phải có định dạng HH:mm');
  const [h, m] = clock.split(':').map(Number);
  return h * 60 + m;
}
export function atClock(day: Date, clock: string): Date {
  return new Date(dateKey(day).getTime() - VN_OFFSET + clockMinutes(clock) * 60_000);
}
export function businessDates(from: Date, to: Date, holidays: string[] = []): Date[] {
  const days: Date[] = [];
  for (let time = dateKey(from).getTime(); time <= dateKey(to).getTime(); time += DAY_MS) {
    const d = new Date(time);
    if (![0, 6].includes(d.getUTCDay()) && !holidays.includes(d.toISOString().slice(0, 10))) days.push(d);
  }
  return days;
}

export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
/** Day-of-week uses JavaScript numbering: Sunday=0 ... Saturday=6. */
export function isScheduledWorkday(day: Date, workDays: number[] = DEFAULT_WORK_DAYS): boolean {
  return workDays.includes(dateKey(day).getUTCDay());
}

export function isUnderThreeMonths(startValue: Date, endValue: Date): boolean {
  const start = dateKey(startValue), end = dateKey(endValue);
  const targetMonth = start.getUTCMonth() + 3;
  const year = start.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = targetMonth % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const threeMonthDate = new Date(Date.UTC(year, month, Math.min(start.getUTCDate(), lastDay)));
  return end < threeMonthDate;
}
