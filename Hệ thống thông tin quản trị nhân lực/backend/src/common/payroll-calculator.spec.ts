import { calculateOvertimePay, calculatePayroll, currentPayrollPolicies, evaluateFormula, monthlyHourlyRate, progressiveTax, VN_PAYROLL_POLICIES, PayrollInput } from './payroll-calculator';

const input = (patch: Partial<PayrollInput> = {}): PayrollInput => ({ year: 2026, baseSalary: 15e6, standardDays: 22, paidDays: 22, attendanceDays: 22, insuranceSalary: 15e6, insuranceCap: 50.6e6, unemploymentCap: 106.2e6, dependents: 0, overtime: 0, bonus: 0, items: [], loans: [], ...patch });
describe('Payroll business regressions', () => {
  it('does not turn missing/zero attendance into a full month', () => {
    const result = calculatePayroll(input({ paidDays: 0, attendanceDays: 0 }));
    expect(result.netPay).toBe(0);
    expect(result.breakdown.calculation.paidDays).toBe(0);
  });
  it('preserves a legitimate zero base salary', () => {
    expect(calculatePayroll(input({ baseSalary: 0, insuranceSalary: 0 })).netPay).toBe(0);
  });
  it('applies the correct progressive brackets for each tax year', () => {
    expect(progressiveTax(50e6, 2025)).toBe(9_250_000);
    expect(progressiveTax(50e6, 2026)).toBe(6_500_000);
    expect(progressiveTax(0, 2026)).toBe(0);
  });
  it('converts monthly salary to an hourly base without multiplying salary by working days', () => {
    expect(monthlyHourlyRate(15_000_000, 176)).toBeCloseTo(85_227.27, 1);
    expect(calculateOvertimePay(2, 0, monthlyHourlyRate(15_000_000, 176), 'WEEKDAY', VN_PAYROLL_POLICIES[1])).toBe(255_682);
  });
  it('uses included regular wage components in the OT hourly basis', () => {
    const hourly = monthlyHourlyRate(15_000_000 + 3_000_000, 176);
    expect(hourly).toBeCloseTo(102_272.73, 1);
    expect(calculateOvertimePay(2, 0, hourly, 'WEEKDAY', VN_PAYROLL_POLICIES[1])).toBe(306_818);
  });
  it('flags monthly and hourly minimum-wage gaps for payroll review', () => {
    const monthlyOnly = calculatePayroll(input({ minimumWageAudit: { region: 'I', contractualMonthlyWage: 5_000_000, standardHours: 176 } })).breakdown.calculation.minimumWageReview;
    expect(monthlyOnly).toMatchObject({ status: 'REVIEW', monthlyBelowMinimum: true, hourlyBelowMinimum: false, monthlyMinimum: 5_310_000, hourlyMinimum: 25_500 });

    const both = calculatePayroll(input({ minimumWageAudit: { region: 'I', contractualMonthlyWage: 4_000_000, standardHours: 176 } })).breakdown.calculation.minimumWageReview;
    expect(both).toMatchObject({ status: 'REVIEW', monthlyBelowMinimum: true, hourlyBelowMinimum: true });
  });
  it('applies the night work premium plus 20% of the overtime day-category rate', () => {
    const policy = VN_PAYROLL_POLICIES[1];
    expect(calculateOvertimePay(1, 1, 10_000, 'WEEKDAY', policy)).toBe(20_000);
    expect(calculateOvertimePay(1, 1, 10_000, 'WEEKLY_REST', policy)).toBe(27_000);
    expect(calculateOvertimePay(1, 1, 10_000, 'PUBLIC_HOLIDAY', policy)).toBe(39_000);
    expect(calculateOvertimePay(1, 0, 10_000, 'PUBLIC_HOLIDAY', policy)).toBe(30_000);
  });
  it('separates night-work earnings and applies the effective PIT exemption by period', () => {
    const night2026 = calculatePayroll(input({ nightWorkBase: 100_000, nightWorkPremium: 30_000 }));
    const regular2026 = calculatePayroll(input());
    expect(night2026.grossPay - regular2026.grossPay).toBe(30_000);
    expect(night2026.breakdown.calculation.taxableIncome).toBe(regular2026.breakdown.calculation.taxableIncome);

    const policy2025 = VN_PAYROLL_POLICIES[0];
    const night2025 = calculatePayroll(input({ year: 2025, nightWorkBase: 100_000, nightWorkPremium: 30_000, policy: policy2025 }));
    const regular2025 = calculatePayroll(input({ year: 2025, policy: policy2025 }));
    expect(night2025.breakdown.calculation.taxableIncome - regular2025.breakdown.calculation.taxableIncome).toBe(0);
  });
  it('upgrades previously stored built-in policies with the corrected night-pay rule', () => {
    const legacy = { ...VN_PAYROLL_POLICIES[1], version: 'VN-PAYROLL-2026.01', nightWorkExemptMode: undefined, overtimeRates: { weekday: 1.5, weeklyRest: 2, publicHoliday: 3, nightAdditional: 0.5 } };
    const [current] = currentPayrollPolicies([legacy]);
    expect(current.version).toBe('VN-PAYROLL-2026.02');
    expect(current.overtimeRates).toEqual({ weekday: 1.5, weeklyRest: 2, publicHoliday: 3, nightAdditional: 0.3, nightOvertimeFactor: 0.2 });
    expect(current.nightWorkExemptMode).toBe('ALL');
  });
  it('subtracts insurance and registered dependents before tax', () => {
    const result = calculatePayroll(input({ baseSalary: 30e6, insuranceSalary: 30e6, dependents: 1 }));
    expect(result.breakdown.calculation.taxableIncome).toBe(30e6 - 3_150_000 - 15_500_000 - 6_200_000);
  });
  it('withholds 10 percent for a resident short-contract payment at or above VND 5 million', () => {
    const result = calculatePayroll(input({ baseSalary: 5e6, insuranceSalary: 0, taxWithholdingMode: 'FLAT_10', dependents: 2 }));
    expect(result.breakdown.deductions.find(line => line.code === 'PIT')?.amount).toBe(500_000);
    expect(result.breakdown.calculation.personalRelief).toBe(0);
    expect(result.breakdown.calculation.dependentRelief).toBe(0);
  });
  it('does not withhold flat 10 percent below the per-payment threshold', () => {
    const result = calculatePayroll(input({ baseSalary: 4_999_999, insuranceSalary: 0, taxWithholdingMode: 'FLAT_10' }));
    expect(result.breakdown.deductions.find(line => line.code === 'PIT')?.amount).toBe(0);
  });
  it('applies approved monthly loan installments together without exceeding remaining debt or net wages', () => {
    const result = calculatePayroll(input({ loans: [{ id: 'A', emi: 3e6, remaining: 10e6 }, { id: 'B', emi: 3e6, remaining: 10e6 }] }));
    expect(result.loanDeductions.reduce((sum, item) => sum + item.amount, 0)).toBe(6_000_000);
  });
  it('includes the employer trade-union fund in total employment cost, not employee net deductions', () => {
    const result = calculatePayroll(input());
    expect(result.breakdown.calculation.employerContributions.tradeUnionFund).toBe(300_000);
    expect(result.breakdown.deductions.some(line => line.code === 'TRADE_UNION')).toBe(false);
  });
  it('uses structure components and reconciles the displayed ledger to net pay', () => {
    const result = calculatePayroll(input({ paidDays: 11, attendanceDays: 10, items: [{ code: 'POSITION_ALLOW', name: 'Position', type: 'EARNING', amount: 3e6, taxable: true }, { code: 'LUNCH_ALLOW', name: 'Lunch', type: 'EARNING', amount: 730000, taxable: false }] }));
    expect(result.breakdown.earnings.find(line => line.code === 'POSITION_ALLOW')?.amount).toBe(1_500_000);
    expect(result.breakdown.earnings.reduce((sum, line) => sum + line.amount, 0) - result.breakdown.deductions.reduce((sum, line) => sum + line.amount, 0)).toBe(result.netPay);
  });
  it('does not prorate a component twice when it was already earned day by day', () => {
    const result = calculatePayroll(input({
      paidDays: 11,
      attendanceDays: 10,
      items: [{ code: 'POSITION_ALLOW', name: 'Phụ cấp chức vụ', type: 'EARNING', amount: 1_500_000, taxable: true, periodAmount: true }],
    }));
    expect(result.breakdown.earnings.find(line => line.code === 'POSITION_ALLOW')?.amount).toBe(1_500_000);
  });
  it('evaluates arithmetic while rejecting executable expressions and divide by zero', () => {
    expect(evaluateFormula('baseSalary * (1 + 0.05)', { baseSalary: 10e6 })).toBe(10_500_000);
    expect(() => evaluateFormula('process.exit()', {})).toThrow();
    expect(() => evaluateFormula('1 / 0', {})).toThrow();
    expect(() => evaluateFormula('BASIC.constructor', { BASIC: 1 })).toThrow();
  });
  it('uses daily salary earnings after a mid-month salary change',()=>{
    const result=calculatePayroll(input({baseSalary:20e6,earnedBase:8e6,paidDays:11,attendanceDays:11}));
    expect(result.breakdown.earnings[0].amount).toBe(8e6);
  });
  it('exempts lawful overtime earnings from personal income tax in 2026',()=>{
    const regular=calculatePayroll(input({baseSalary:30e6}));
    const overtime=calculatePayroll(input({baseSalary:30e6,overtime:3e6}));
    expect(overtime.breakdown.calculation.taxableIncome).toBe(regular.breakdown.calculation.taxableIncome);
    expect(overtime.grossPay-regular.grossPay).toBe(3e6);
  });
  it('omits employee insurance deductions for a verified non-contributing month',()=>{
    expect(calculatePayroll(input({paidDays:5,attendanceDays:5,insuranceRequired:false})).breakdown.calculation.insurance).toBe(0);
  });

});
