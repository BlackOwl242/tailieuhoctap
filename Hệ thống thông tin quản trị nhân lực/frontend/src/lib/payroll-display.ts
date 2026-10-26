const workDaysFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

/** Round for display only; preserve the original values used to calculate payroll. */
export function formatWorkDays(value: number): string {
  return Number.isFinite(value) ? workDaysFormatter.format(value) : '—';
}

export function payslipPeriodTitle(value: string): string {
  return value.replace(/\s*\(\s*đã hiệu chỉnh dữ liệu mô phỏng\s*\)/gi, '').trim();
}
