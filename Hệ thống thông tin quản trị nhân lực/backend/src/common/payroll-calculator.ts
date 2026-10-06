/** Shared calculator. Monetary values are rounded once per ledger line. */
export interface SalaryItem { code: string; name: string; type: 'EARNING' | 'DEDUCTION'; amount: number; taxable: boolean; formula?: string | null; periodAmount?: boolean }
export interface PayrollPolicy {
  version: string; effectiveFrom: string; effectiveTo?: string | null;
  personalRelief: number; dependentRelief: number; taxBrackets: [number | null, number][];
  nonResidentTaxRate: number; overtimeExemptMode: 'ALL' | 'PREMIUM_ONLY' | 'TAXABLE'; nightWorkExemptMode: 'ALL' | 'PREMIUM_ONLY' | 'TAXABLE';
  employeeRates: { socialInsurance: number; healthInsurance: number; unemployment: number };
  employerRates: { socialInsurance: number; healthInsurance: number; unemployment: number; occupationalAccident: number; tradeUnionFund: number };
  bhxhCap: number; unemploymentCapByRegion: Record<string, number>; minimumWageByRegion: Record<string, number>; minimumHourlyWageByRegion?: Record<string, number>;
  overtimeRates: { weekday: number; weeklyRest: number; publicHoliday: number; nightAdditional: number; nightOvertimeFactor: number };
  maxMonthlyOvertimeHours: number; maxAnnualOvertimeHours: number; loanDeductionCapRate: number;
}

export const VN_PAYROLL_POLICIES: PayrollPolicy[] = [
  {
    version: 'VN-PAYROLL-2025.02', effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31',
    personalRelief: 11_000_000, dependentRelief: 4_400_000,
    taxBrackets: [[5e6, .05], [10e6, .1], [18e6, .15], [32e6, .2], [52e6, .25], [80e6, .3], [null, .35]],
    nonResidentTaxRate: .2, overtimeExemptMode: 'PREMIUM_ONLY', nightWorkExemptMode: 'PREMIUM_ONLY',
    employeeRates: { socialInsurance: .08, healthInsurance: .015, unemployment: .01 },
    employerRates: { socialInsurance: .17, healthInsurance: .03, unemployment: .01, occupationalAccident: .005, tradeUnionFund: .02 },
    bhxhCap: 46_800_000,
    minimumWageByRegion: { I: 4_960_000, II: 4_410_000, III: 3_860_000, IV: 3_450_000 },
    minimumHourlyWageByRegion: { I: 23_800, II: 21_200, III: 18_600, IV: 16_600 },
    unemploymentCapByRegion: { I: 99_200_000, II: 88_200_000, III: 77_200_000, IV: 69_000_000 },
    overtimeRates: { weekday: 1.5, weeklyRest: 2, publicHoliday: 3, nightAdditional: .3, nightOvertimeFactor: .2 },
    maxMonthlyOvertimeHours: 40, maxAnnualOvertimeHours: 200, loanDeductionCapRate: 1,
  },
  {
    version: 'VN-PAYROLL-2026.02', effectiveFrom: '2026-01-01', effectiveTo: '2026-06-30',
    personalRelief: 15_500_000, dependentRelief: 6_200_000,
    taxBrackets: [[10e6, .05], [30e6, .1], [60e6, .2], [100e6, .3], [null, .35]],
    nonResidentTaxRate: .2, overtimeExemptMode: 'ALL', nightWorkExemptMode: 'ALL',
    employeeRates: { socialInsurance: .08, healthInsurance: .015, unemployment: .01 },
    employerRates: { socialInsurance: .17, healthInsurance: .03, unemployment: .01, occupationalAccident: .005, tradeUnionFund: .02 },
    bhxhCap: 46_800_000,
    minimumWageByRegion: { I: 5_310_000, II: 4_730_000, III: 4_140_000, IV: 3_700_000 },
    minimumHourlyWageByRegion: { I: 25_500, II: 22_700, III: 20_000, IV: 17_800 },
    unemploymentCapByRegion: { I: 106_200_000, II: 94_600_000, III: 82_800_000, IV: 74_000_000 },
    overtimeRates: { weekday: 1.5, weeklyRest: 2, publicHoliday: 3, nightAdditional: .3, nightOvertimeFactor: .2 },
    maxMonthlyOvertimeHours: 40, maxAnnualOvertimeHours: 200, loanDeductionCapRate: 1,
  },
];

VN_PAYROLL_POLICIES.push({
  ...VN_PAYROLL_POLICIES[1],
  version: 'VN-PAYROLL-2026.07.02',
  effectiveFrom: '2026-07-01',
  effectiveTo: null,
  bhxhCap: 50_600_000,
});

/** Upgrade the application's previously stored built-in policy payloads in memory. */
export function currentPayrollPolicies(value: unknown): PayrollPolicy[] {
  if (!Array.isArray(value)) return VN_PAYROLL_POLICIES;
  return value.map((raw: unknown) => {
    const policy = raw as PayrollPolicy;
    if (!policy) return policy;
    let normalized = policy;
    if (['VN-PAYROLL-2025', 'VN-PAYROLL-2026.01', 'VN-PAYROLL-2026.07'].includes(policy.version)) {
      const effective = policy.effectiveFrom;
      const taxYear = effective >= '2026-01-01';
      const version = policy.version === 'VN-PAYROLL-2025' ? 'VN-PAYROLL-2025.02'
        : policy.version === 'VN-PAYROLL-2026.01' ? 'VN-PAYROLL-2026.02' : 'VN-PAYROLL-2026.07.02';
      normalized = {
        ...policy,
        version,
        nightWorkExemptMode: taxYear ? 'ALL' : 'PREMIUM_ONLY',
        overtimeRates: { ...policy.overtimeRates, nightAdditional: .3, nightOvertimeFactor: .2 },
        employerRates: { ...policy.employerRates, tradeUnionFund: .02 },
        loanDeductionCapRate: 1,
      };
    }
    if (normalized.minimumHourlyWageByRegion) return normalized;
    const source = normalized.effectiveFrom >= '2026-01-01' && normalized.effectiveFrom < '2027-01-01'
      ? VN_PAYROLL_POLICIES[1]
      : normalized.effectiveFrom >= '2024-07-01' && normalized.effectiveFrom < '2026-01-01'
        ? VN_PAYROLL_POLICIES[0] : undefined;
    return source ? { ...normalized, minimumHourlyWageByRegion: source.minimumHourlyWageByRegion } : normalized;
  });
}

export function payrollPolicyFor(date: Date, policies: PayrollPolicy[] = VN_PAYROLL_POLICIES): PayrollPolicy {
  const key = date.toISOString().slice(0, 10);
  const policy = policies.filter(p => p.effectiveFrom <= key && (!p.effectiveTo || p.effectiveTo >= key))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  if (!policy) throw new Error(`Chưa cấu hình chính sách lương có hiệu lực ngày ${key}`);
  if (!Number.isFinite(policy.personalRelief) || !Number.isFinite(policy.dependentRelief)
    || !Array.isArray(policy.taxBrackets) || !policy.taxBrackets.length
    || !Number.isFinite(policy.employeeRates.socialInsurance) || !Number.isFinite(policy.employerRates.socialInsurance)
    || !Number.isFinite(policy.employerRates.tradeUnionFund) || !Number.isFinite(policy.loanDeductionCapRate) || policy.loanDeductionCapRate < 0 || policy.loanDeductionCapRate > 1
    || !Number.isFinite(policy.overtimeRates.nightAdditional) || !Number.isFinite(policy.overtimeRates.nightOvertimeFactor)
    || !['ALL','PREMIUM_ONLY','TAXABLE'].includes(policy.nightWorkExemptMode)
    || (policy.minimumHourlyWageByRegion && ['I','II','III','IV'].some(region => {
      const minimum = policy.minimumHourlyWageByRegion?.[region];
      return minimum === undefined || !Number.isFinite(minimum) || minimum <= 0;
    }))) {
    throw new Error(`Cấu hình chính sách ${policy.version} không hợp lệ`);
  }
  return policy;
}

export function calculateOvertimePay(
  hours: number,
  nightHours: number,
  hourlyWage: number,
  dayCategory: 'WEEKDAY' | 'WEEKLY_REST' | 'PUBLIC_HOLIDAY',
  policy: PayrollPolicy,
): number {
  if (![hours, nightHours, hourlyWage].every(Number.isFinite) || hours < 0 || nightHours < 0 || nightHours > hours || hourlyWage < 0) {
    throw new Error('Số giờ hoặc đơn giá OT không hợp lệ');
  }
  const rate = dayCategory === 'PUBLIC_HOLIDAY' ? policy.overtimeRates.publicHoliday
    : dayCategory === 'WEEKLY_REST' ? policy.overtimeRates.weeklyRest : policy.overtimeRates.weekday;
  const referenceDayRate = dayCategory === 'WEEKDAY' ? 1 : rate;
  const nightAdditional = policy.overtimeRates.nightAdditional + policy.overtimeRates.nightOvertimeFactor * referenceDayRate;
  return Math.round(hours * hourlyWage * rate + nightHours * hourlyWage * nightAdditional);
}

export function monthlyHourlyRate(monthlySalary: number, standardHours: number): number {
  if (!Number.isFinite(monthlySalary) || monthlySalary < 0 || !Number.isFinite(standardHours) || standardHours < 0) throw new Error('Lương tháng hoặc giờ công chuẩn không hợp lệ');
  return standardHours > 0 ? monthlySalary / standardHours : 0;
}
export interface PayrollInput {
  earnedBase?: number; overtimeTaxable?: number; nightWorkBase?: number; nightWorkPremium?: number; insuranceRequired?: boolean; year: number; baseSalary: number; standardDays: number; paidDays: number; attendanceDays: number;
  insuranceSalary: number; insuranceCap: number; unemploymentCap: number; dependents: number;
  overtime: number; bonus: number; items: SalaryItem[]; loans: { id: string; emi: number; remaining: number }[];
  taxResidency?: 'RESIDENT' | 'NON_RESIDENT'; taxWithholdingMode?: 'PROGRESSIVE' | 'FLAT_10'; policy?: PayrollPolicy;
  minimumWageAudit?: { region: string; contractualMonthlyWage: number; standardHours: number };
  overtimeBasis?: { contractualMonthlyWage: number; standardHours: number; hourlyRate: number };
}
export function progressiveTax(taxable: number, year: number, customBrackets?: [number | null, number][]): number {
  const brackets: [number | null, number][] = customBrackets ?? (year >= 2026
    ? [[10e6, .05], [30e6, .1], [60e6, .2], [100e6, .3], [null, .35]]
    : [[5e6, .05], [10e6, .1], [18e6, .15], [32e6, .2], [52e6, .25], [80e6, .3], [null, .35]]);
  let tax = 0, previous = 0;
  for (const [limit, rate] of brackets) { const upper = limit ?? Infinity; tax += Math.max(0, Math.min(taxable, upper) - previous) * rate; previous = upper; }
  return Math.round(tax);
}

/** Arithmetic parser: no eval, properties, function calls or executable JS. */
export function evaluateFormula(formula: string, values: Record<string, number>): number {
  const tokens = formula.match(/[A-Za-z_][A-Za-z_0-9]*|(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/]/g) ?? [];
  if (tokens.join('') !== formula.replace(/\s/g, '')) throw new Error('Công thức chứa ký tự không được hỗ trợ');
  let i = 0;
  function atom(): number {
    const token = tokens[i++];
    if (token === '-') return -atom();
    if (token === '+') return atom();
    if (token === '(') { const n = add(); if (tokens[i++] !== ')') throw new Error('Thiếu dấu đóng ngoặc'); return n; }
    if (token && /^\d|^\./.test(token)) return Number(token);
    if (token && Object.prototype.hasOwnProperty.call(values, token)) return values[token];
    throw new Error(`Biến công thức chưa được định nghĩa: ${token ?? ''}`);
  }
  function mul(): number { let n = atom(); while (tokens[i] === '*' || tokens[i] === '/') { const op = tokens[i++], next = atom(); if (op === '/' && next === 0) throw new Error('Công thức chia cho 0'); n = op === '*' ? n * next : n / next; } return n; }
  function add(): number { let n = mul(); while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++], next = mul(); n = op === '+' ? n + next : n - next; } return n; }
  const result = add();
  if (i !== tokens.length || !Number.isFinite(result) || result < 0) throw new Error('Kết quả công thức không hợp lệ');
  return Math.round(result);
}

export function calculatePayroll(input: PayrollInput) {
  const { baseSalary, standardDays, paidDays, attendanceDays, year } = input;
  const policy = input.policy ?? payrollPolicyFor(new Date(Date.UTC(year, 0, 1)));
  if (![baseSalary, standardDays, paidDays, attendanceDays, input.insuranceSalary, input.insuranceCap, input.unemploymentCap, input.dependents, input.overtime, input.bonus].every(Number.isFinite)
    || baseSalary < 0 || standardDays <= 0 || paidDays < 0 || paidDays > standardDays || attendanceDays < 0 || input.insuranceSalary < 0 || input.insuranceCap <= 0 || input.unemploymentCap <= 0 || input.overtime < 0 || input.bonus < 0 || input.dependents < 0 || !Number.isInteger(input.dependents)) throw new Error('Đầu vào lương không hợp lệ');
  if (input.earnedBase !== undefined && (!Number.isFinite(input.earnedBase) || input.earnedBase < 0)) throw new Error('Lương theo ngày không hợp lệ');
  if (![input.nightWorkBase ?? 0, input.nightWorkPremium ?? 0].every(Number.isFinite) || (input.nightWorkBase ?? 0) < 0 || (input.nightWorkPremium ?? 0) < 0) throw new Error('Dữ liệu giờ làm ban đêm không hợp lệ');
  if (input.loans.some(l => !Number.isFinite(l.emi) || !Number.isFinite(l.remaining) || l.emi < 0 || l.remaining < 0)) throw new Error('Dữ liệu khoản vay không hợp lệ');
  const prorated = Math.round(input.earnedBase ?? baseSalary * paidDays / standardDays);
  const earnings = [{ code: 'BASIC', name: 'Lương theo công được hưởng', amount: prorated }];
  const deductions: { code: string; name: string; amount: number }[] = [];
  let taxableEarnings = prorated;
  if ((input.nightWorkPremium ?? 0) > 0) earnings.push({ code: 'NIGHT_WORK', name: 'Phụ trội làm việc ban đêm', amount: Math.round(input.nightWorkPremium!) });
  const values: Record<string, number> = { baseSalary, BASIC: baseSalary, standardDays, workingDays: paidDays, actualWorkDays: attendanceDays };
  for (const item of input.items) {
    if (['BASIC', 'BHXH', 'BHYT', 'BHTN', 'PIT'].includes(item.code)) continue;
    const amount = item.periodAmount ? Math.round(item.amount)
      : item.formula ? evaluateFormula(item.formula, values)
        : Math.round(item.amount * (item.code === 'LUNCH_ALLOW' ? attendanceDays / standardDays : paidDays / standardDays));
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Thành phần lương không hợp lệ');
    values[item.code] = amount;
    if (item.type === 'EARNING') { earnings.push({ code: item.code, name: item.name, amount }); if (item.taxable) taxableEarnings += amount; }
    else deductions.push({ code: item.code, name: item.name, amount });
  }
  if (input.overtime) {
    earnings.push({ code: 'OT', name: 'Làm thêm giờ đã duyệt', amount: Math.round(input.overtime) });
    const taxableOvertime = policy.overtimeExemptMode === 'ALL' ? 0
      : policy.overtimeExemptMode === 'PREMIUM_ONLY' ? Math.min(input.overtime, Math.max(0, Math.round(input.overtimeTaxable ?? input.overtime)))
      : Math.round(input.overtime);
    taxableEarnings += taxableOvertime;
  }
  if (policy.nightWorkExemptMode === 'ALL') taxableEarnings = Math.max(0, taxableEarnings - Math.round(input.nightWorkBase ?? 0));
  if (input.bonus) { earnings.push({ code: 'BONUS', name: 'Khen thưởng đã có hiệu lực', amount: Math.round(input.bonus) }); taxableEarnings += Math.round(input.bonus); }
  const insuranceBase = (paidDays === 0 || input.insuranceRequired === false) ? 0 : Math.min(input.insuranceSalary, input.insuranceCap);
  const socialBase = Math.min(insuranceBase, input.insuranceCap);
  const unemploymentBase = (paidDays === 0 || input.insuranceRequired === false) ? 0 : Math.min(input.insuranceSalary, input.unemploymentCap);
  const bhxh = Math.round(socialBase * policy.employeeRates.socialInsurance), bhyt = Math.round(socialBase * policy.employeeRates.healthInsurance);
  const bhtn = Math.round(unemploymentBase * policy.employeeRates.unemployment);
  const insurance = bhxh + bhyt + bhtn;
  deductions.push({ code: 'BHXH', name: `Bảo hiểm xã hội (${policy.employeeRates.socialInsurance * 100}%)`, amount: bhxh }, { code: 'BHYT', name: `Bảo hiểm y tế (${policy.employeeRates.healthInsurance * 100}%)`, amount: bhyt }, { code: 'BHTN', name: `Bảo hiểm thất nghiệp (${policy.employeeRates.unemployment * 100}%)`, amount: bhtn });
  const taxResidency = input.taxResidency ?? 'RESIDENT';
  const taxWithholdingMode = taxResidency === 'NON_RESIDENT' ? 'PROGRESSIVE' : input.taxWithholdingMode ?? 'PROGRESSIVE';
  const shortContractWithholding = taxResidency === 'RESIDENT' && taxWithholdingMode === 'FLAT_10';
  const personalRelief = taxResidency === 'RESIDENT' && !shortContractWithholding ? policy.personalRelief : 0;
  const dependentRelief = taxResidency === 'RESIDENT' && !shortContractWithholding ? input.dependents * policy.dependentRelief : 0;
  const taxableIncome = Math.max(0, taxableEarnings - insurance - personalRelief - dependentRelief);
  const pit = taxResidency === 'NON_RESIDENT'
    ? Math.round(taxableEarnings * policy.nonResidentTaxRate)
    : shortContractWithholding
      ? (taxableEarnings >= 5_000_000 ? Math.round(taxableEarnings * 0.1) : 0)
      : progressiveTax(taxableIncome, year, policy.taxBrackets);
  const taxLabel = taxResidency === 'NON_RESIDENT'
    ? `Thuế TNCN cá nhân không cư trú (${policy.nonResidentTaxRate * 100}%)`
    : shortContractWithholding ? 'Khấu trừ TNCN 10% hợp đồng dưới 3 tháng (ngưỡng chi trả 5 triệu đồng)' : `Thuế TNCN lũy tiến năm ${year}`;
  deductions.push({ code: 'PIT', name: taxLabel, amount: pit });
  const grossPay = earnings.reduce((sum, line) => sum + line.amount, 0);
  const beforeLoan = Math.max(0, grossPay - deductions.reduce((sum, line) => sum + line.amount, 0));
  let available = Math.floor(beforeLoan * policy.loanDeductionCapRate);
  const loanDeductions: { loanId: string; amount: number }[] = [];
  for (const loan of input.loans) {
    const amount = Math.min(Math.max(0, loan.emi), Math.max(0, loan.remaining), available);
    if (amount > 0) { deductions.push({ code: `LOAN_${loan.id}`, name: 'Khấu trừ vay phúc lợi', amount }); loanDeductions.push({ loanId: loan.id, amount }); available -= amount; }
  }
  const totalDeduction = deductions.reduce((sum, line) => sum + line.amount, 0);
  if (totalDeduction > grossPay) throw new Error('Các khoản khấu trừ vượt thu nhập; cần đối soát trước khi tính lương');
  const employerInsuranceBase = (paidDays === 0 || input.insuranceRequired === false) ? 0 : Math.min(input.insuranceSalary, policy.bhxhCap);
  const employerUnemploymentBase = (paidDays === 0 || input.insuranceRequired === false) ? 0 : Math.min(input.insuranceSalary, input.unemploymentCap);
  const employerContributions = {
    socialInsurance: Math.round(employerInsuranceBase * policy.employerRates.socialInsurance),
    healthInsurance: Math.round(employerInsuranceBase * policy.employerRates.healthInsurance),
    unemployment: Math.round(employerUnemploymentBase * policy.employerRates.unemployment),
    occupationalAccident: Math.round(employerInsuranceBase * policy.employerRates.occupationalAccident),
    tradeUnionFund: Math.round(employerInsuranceBase * policy.employerRates.tradeUnionFund),
  };
  const minimumWageReview = input.minimumWageAudit ? (() => {
    const { region, contractualMonthlyWage, standardHours: hours } = input.minimumWageAudit!;
    const valid = Number.isFinite(contractualMonthlyWage) && contractualMonthlyWage >= 0 && Number.isFinite(hours) && hours >= 0;
    if (!valid) throw new Error('Dữ liệu đối chiếu lương tối thiểu không hợp lệ');
    const monthlyMinimum = policy.minimumWageByRegion[region] ?? null;
    const hourlyMinimum = policy.minimumHourlyWageByRegion?.[region] ?? null;
    const hourlyEquivalent = monthlyHourlyRate(contractualMonthlyWage, hours);
    const monthlyBelowMinimum = monthlyMinimum !== null && contractualMonthlyWage < monthlyMinimum;
    const hourlyBelowMinimum = hourlyMinimum !== null && hourlyEquivalent < hourlyMinimum;
    return {
      region, contractualMonthlyWage: Math.round(contractualMonthlyWage), standardHours: hours,
      monthlyMinimum, hourlyEquivalent: Math.round(hourlyEquivalent), hourlyMinimum,
      monthlyBelowMinimum, hourlyBelowMinimum,
      status: monthlyMinimum === null && hourlyMinimum === null ? 'UNCONFIGURED' : monthlyBelowMinimum || hourlyBelowMinimum ? 'REVIEW' : 'PASS',
    } as const;
  })() : undefined;
  return { grossPay, totalDeduction, netPay: grossPay - totalDeduction, loanDeductions,
    breakdown: { earnings, deductions, calculation: { year, baseSalary, standardDays, paidDays, attendanceDays, insuranceSalary: input.insuranceSalary, insuranceCap: input.insuranceCap, unemploymentCap: input.unemploymentCap, personalRelief, dependentRelief, dependents: taxResidency === 'RESIDENT' && !shortContractWithholding ? input.dependents : 0, taxResidency, taxWithholdingMode: shortContractWithholding ? 'FLAT_10' : taxResidency, taxableIncome, insurance, employerContributions, employerTotalCost: grossPay + Object.values(employerContributions).reduce((s, n) => s + n, 0), otAmount: input.overtime, bonus: input.bonus, policyVersion: policy.version, policyEffectiveFrom: policy.effectiveFrom, overtimeExemptMode: policy.overtimeExemptMode, loanDeductionCapRate: policy.loanDeductionCapRate, minimumWageReview, overtimeBasis: input.overtimeBasis } },
  };
}
