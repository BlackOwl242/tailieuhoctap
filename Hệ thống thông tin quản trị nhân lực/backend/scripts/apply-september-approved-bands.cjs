/* eslint-disable */
// Retroactively aligns the local demo's September 2026 payroll and active
// employee salary profiles to the approved salary bands. Safe to run once;
// requires explicit --apply after reviewing the dry-run summary.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SEPTEMBER_START = new Date('2026-09-01T00:00:00.000Z');
const SEPTEMBER_END = new Date('2026-09-30T23:59:59.999Z');
const RUN_NAME = '09/2026';

function selectBand(title, bands) {
  const matches = bands.filter((band) => band.jobTitles.includes(title));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Chức danh khớp nhiều khung: ${title}`);

  const t = (title || '').toLocaleLowerCase('vi');
  const pick = (code) => {
    const band = bands.find((item) => item.code === code);
    if (!band) throw new Error(`Thiếu khung ${code} cho chức danh: ${title}`);
    return band;
  };
  if (/chủ tịch|tổng giám đốc|\bceo\b|chủ tịch hội đồng|trợ lý ban giám đốc/.test(t)) return pick('PM-ENG');
  if (/\bcfo\b|giám đốc tài chính|kiểm soát tài chính/.test(t)) return pick('FIN-CONTROLLER');
  if (/chro|giám đốc nhân sự/.test(t)) return pick('HR-CHRO');
  if (/phó tổng giám đốc kinh doanh|\bcc[o]\b|sales director|giám đốc bán hàng/.test(t)) return pick('SALES-DIR');
  if (/cto|head of technology|head of corporate operations|trưởng khối công nghệ|vp of engineering|giám đốc kỹ thuật|trưởng phòng.*it|\bciso\b|trưởng nhóm|tech lead|technical lead|lead developer|squad lead|trưởng nhóm mobile|trưởng nhóm web|trưởng nhóm java|trưởng nhóm \.net|ai lab lead|giám đốc trung tâm|giám đốc chi nhánh|phó giám đốc.*kỹ thuật/.test(t)) {
    if (/ai|data engineering/.test(t)) return pick('AI-ENG');
    if (/trưởng nhóm quản lý chất lượng|qa|qc/.test(t)) return pick('QA-MGR');
    if (/nhân sự|tuyển dụng/.test(t)) return pick('HR-MGR');
    if (/kế toán|thuế|thanh toán/.test(t)) return pick('FIN-CHIEF-ACC');
    if (/marketing|truyền thông/.test(t)) return pick('MKT-SPEC');
    if (/kinh doanh|account|khách hàng|sales/.test(t)) return pick('SALES-BDM');
    if (/vận hành nội bộ|cơ sở vật chất|hành chính|mua sắm|tòa nhà/.test(t)) return pick('IT-HELPDESK');
    if (/dự án|pmo|business analyst|phân tích nghiệp vụ/.test(t)) return pick('PM-ENG');
    if (/devops|cloud|network|hạ tầng|system|it support|\bit\b|ciso|bảo mật/.test(t)) return pick('ENG-DEVOPS');
    return pick('ENG-ARCH');
  }
  if (/fresher|junior|intern|\.net|java|nodejs|backend|frontend|fullstack|software engineer|lập trình viên|kỹ sư phần mềm|mobile developer|android|ios|flutter|react native|erp \/ crm integrator/.test(t)) {
    if (/ai|machine learning|computer vision|nlp|llm/.test(t)) return pick('AI-ENG');
    if (/data|bi specialist/.test(t)) return pick('DATA-ENG');
    if (/devops|cloud|sre/.test(t)) return pick('ENG-DEVOPS');
    if (/senior|cao cấp/.test(t)) return pick('ENG-SWE-02');
    return pick('ENG-SWE-01');
  }
  if (/ai|machine learning|computer vision|nlp|llm/.test(t)) return pick('AI-ENG');
  if (/data analyst|phân tích dữ liệu/.test(t)) return pick('DATA-ENG');
  if (/data engineer|dữ liệu lớn/.test(t)) return pick('DATA-ENG');
  if (/devops|cloud|network|mạng|system administrator|system admin|quản trị viên hệ thống|security|an toàn thông tin|hạ tầng|công nghệ thông tin|it support|helpdesk|ci\/cd|thiết bị.*phần mềm/.test(t)) return pick('ENG-DEVOPS');
  if (/kiểm thử|tester|qa|qc|chất lượng/.test(t)) return pick(/trưởng|lead|manager|giám đốc/.test(t) ? 'QA-MGR' : 'QA-ENG');
  if (/business analyst|\bba\b|phân tích nghiệp vụ/.test(t)) return pick('BA-ENG');
  if (/tuyển dụng|recruit|talent acquisition|headhunter|ứng viên/.test(t)) return pick(/trưởng|lead|manager/.test(t) ? 'HR-TA-MGR' : 'HR-EXEC');
  if (/nhân sự|hris|c&b|lương thưởng|đào tạo|hồ sơ nhân sự|hồ sơ & hợp đồng|số hóa.*hồ sơ|onboarding|kpi|nhân tài/.test(t)) return pick(/tổ trưởng|trưởng ban|trưởng phòng/.test(t) ? 'HR-MGR' : 'HR-EXEC');
  if (/kế toán trưởng|chief accountant|trưởng nhóm kế toán/.test(t)) return pick('FIN-CHIEF-ACC');
  if (/kế toán|kiểm toán|tài chính|\bfp&a\b|\baccountant\b|thuế|công nợ/.test(t)) return pick('FIN-OFF');
  if (/pháp chế|legal|luật|tuân thủ/.test(t)) return pick(/trưởng ban|chief legal/.test(t) ? 'LEGAL-HEAD' : 'LEGAL-SPEC');
  if (/sales director|giám đốc kinh doanh/.test(t)) return pick('SALES-DIR');
  if (/presales|tư vấn giải pháp/.test(t)) return pick('SALES-PRESALES-MGR');
  if (/business development|kinh doanh|bán hàng|sales|key account|khách hàng|customer success|retention/.test(t)) return pick(/trưởng phòng|head of|manager/.test(t) ? 'SALES-BDM' : 'SALES-BDE');
  if (/marketing|truyền thông|content|thiết kế đồ họa|graphic|event|quan hệ báo chí|thương hiệu/.test(t)) return pick('MKT-SPEC');
  if (/ui\/ux|ux |ux$|designer|design/.test(t)) return pick('UX-ENG');
  if (/scrum|agile|cmmi/.test(t)) return pick('SCRUM-ENG');
  if (/project|dự án|pmo/.test(t)) return pick('PM-ENG');
  if (/văn thư|lưu trữ|hành chính|lễ tân|hậu cần|mua sắm|procurement|tòa nhà|cơ sở vật chất|tài sản/.test(t)) return pick('FIN-OFF');
  throw new Error(`Chưa có cách ghép khung phù hợp cho chức danh: ${title}`);
}

function clamp(value, band) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return band.midSalary;
  return Math.min(band.maxSalary, Math.max(band.minSalary, amount));
}

function progressiveTax(taxableIncome) {
  const brackets = [[10000000, 0.05], [30000000, 0.10], [60000000, 0.20], [100000000, 0.30], [Infinity, 0.35]];
  let tax = 0;
  let previous = 0;
  for (const [limit, rate] of brackets) {
    const upper = Number(limit);
    tax += Math.max(0, Math.min(taxableIncome, upper) - previous) * Number(rate);
    previous = upper;
  }
  return Math.round(tax);
}

function recalculateSlip(slip, base, user) {
  const breakdown = structuredClone(slip.breakdown || {});
  const earnings = Array.isArray(breakdown.earnings) ? breakdown.earnings : [];
  const deductions = Array.isArray(breakdown.deductions) ? breakdown.deductions : [];
  const baseLine = earnings.find((line) => /lương cơ bản/i.test(line.name));
  if (!baseLine) throw new Error(`Phiếu ${slip.id} thiếu dòng lương cơ bản`);
  baseLine.amount = base;
  const gross = Math.round(earnings.reduce((sum, line) => sum + Number(line.amount || 0), 0));
  const missingDays = Math.max(0, Number(slip.workingDays || 22) - Number(slip.actualWorkDays || 0));
  const unpaid = Math.round((base / Number(slip.workingDays || 22)) * missingDays);
  const deductionLines = deductions.filter((line) => !/trừ công nghỉ\/vắng|bảo hiểm xã hội|bảo hiểm y tế|bảo hiểm thất nghiệp|thuế thu nhập cá nhân/i.test(line.name));
  if (unpaid > 0) deductionLines.unshift({ name: `Trừ công nghỉ/vắng (${missingDays} ngày)`, amount: unpaid });
  const region = user.minimumWageRegion || 'I';
  const unemploymentCaps = { I: 106200000, II: 94600000, III: 82800000, IV: 74000000 };
  const insuranceBase = Math.min(base, 50600000);
  const si = Math.round(insuranceBase * 0.08);
  const hi = Math.round(insuranceBase * 0.015);
  const ui = Math.round(Math.min(base, unemploymentCaps[region] || unemploymentCaps.I) * 0.01);
  deductionLines.push({ name: 'Bảo hiểm Xã hội (8%)', amount: si });
  deductionLines.push({ name: 'Bảo hiểm Y tế (1.5%)', amount: hi });
  deductionLines.push({ name: 'Bảo hiểm Thất nghiệp (1%)', amount: ui });
  const taxableEarnings = earnings.reduce((sum, line) => {
    if (/ăn trưa|lunch allowance|làm thêm giờ|overtime/i.test(line.name)) return sum;
    return sum + Number(line.amount || 0);
  }, 0);
  const dependentRelief = Number(user.taxDependentCount || 0) * 6200000;
  const taxable = Math.max(0, taxableEarnings - unpaid - si - hi - ui - 15500000 - dependentRelief);
  const pit = user.taxResidency === 'NON_RESIDENT' ? Math.round(taxableEarnings * 0.2) : progressiveTax(taxable);
  if (pit > 0) deductionLines.push({ name: 'Thuế Thu nhập Cá nhân (TNCN)', amount: pit });
  breakdown.deductions = deductionLines;
  const totalDeduction = Math.round(deductionLines.reduce((sum, line) => sum + Number(line.amount || 0), 0));
  return { baseSalary: base, grossPay: gross, totalDeduction, netPay: Math.max(0, gross - totalDeduction), breakdown };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const run = await prisma.hrmsPayrollRun.findFirst({
    where: { periodName: { contains: RUN_NAME }, fromDate: { gte: new Date('2026-09-01'), lt: new Date('2026-10-01') } },
    include: { slips: true },
  });
  if (!run) throw new Error('Không tìm thấy bảng lương tháng 09/2026');
  if (run.notes?.includes('RETROACTIVE_APPROVED_BANDS_2026-09')) throw new Error('Kỳ tháng 09 đã được cập nhật theo khung lương mới; dừng để tránh chạy lặp.');
  const bands = await prisma.hrmsSalaryBand.findMany({ where: { status: 'ACTIVE', approvedAt: { not: null } } });
  if (bands.length !== 34) throw new Error(`Mong đợi 34 khung lương được duyệt, hiện có ${bands.length}; dừng an toàn.`);
  const activeProfiles = await prisma.user.findMany({ where: { status: 'ACTIVE', deletedAt: null, employmentStatus: { in: ['ACTIVE', 'PROBATION'] } }, include: { orgUnit: { select: { name: true } } } });
  if (activeProfiles.length !== 388) throw new Error(`Mong đợi 388 hồ sơ nhân sự đang hoạt động, hiện có ${activeProfiles.length}; dừng an toàn.`);
  const slipUsers = await prisma.user.findMany({ where: { id: { in: run.slips.map((slip) => slip.userId) } }, include: { orgUnit: { select: { name: true } } } });
  const users = [...new Map([...activeProfiles, ...slipUsers].map((user) => [user.id, user])).values()];
  const byId = new Map(bands.map((band) => [band.id, band]));
  const titleToBand = new Map();
  for (const band of bands) for (const title of band.jobTitles) {
    const list = titleToBand.get(title) || [];
    list.push(band);
    titleToBand.set(title, list);
  }
  const assignments = users.map((user) => {
    if (!user.jobTitle) throw new Error(`Nhân viên ${user.fullName} chưa có chức danh`);
    const band = selectBand(user.jobTitle, bands);
    const current = clamp(user.baseSalary, band);
    return { user, band, salary: current };
  });
  const payrollUser = new Map(users.map((user) => [user.id, user]));
  if (run.slips.length !== 385) throw new Error(`Mong đợi 385 phiếu lương, hiện có ${run.slips.length}; dừng an toàn.`);
  const updates = run.slips.map((slip) => {
    const user = payrollUser.get(slip.userId);
    const assignment = assignments.find((item) => item.user.id === slip.userId);
    if (!user || !assignment) throw new Error(`Không tìm thấy hồ sơ cho phiếu ${slip.id}`);
    return { slip, assignment, values: recalculateSlip(slip, clamp(slip.baseSalary, assignment.band), assignment.user) };
  });
  const totals = updates.reduce((sum, item) => ({
    gross: sum.gross + item.values.grossPay,
    deductions: sum.deductions + item.values.totalDeduction,
    net: sum.net + item.values.netPay,
  }), { gross: 0, deductions: 0, net: 0 });
  const changedProfileSalaries = assignments.filter(({ user, salary }) => Number(user.baseSalary || 0) !== salary);
  const changedSlips = updates.filter(({ slip, values, assignment }) => slip.baseSalary !== values.baseSalary || assignment.user.salaryBandId !== assignment.band.id);
  const byBandSummary = new Map();
  for (const { slip, values, assignment } of updates) {
    const item = byBandSummary.get(assignment.band.code) || { band: assignment.band.code, employees: 0, baseBefore: 0, baseAfter: 0 };
    item.employees += 1;
    item.baseBefore += slip.baseSalary;
    item.baseAfter += values.baseSalary;
    byBandSummary.set(assignment.band.code, item);
  }
  console.log(JSON.stringify({
    mode: apply ? 'APPLY' : 'DRY RUN', runId: run.id, status: run.status,
    old: { employees: run.totalEmployees, gross: run.totalGrossPay, deductions: run.totalDeduction, net: run.totalNetPay },
    new: { employees: updates.length, ...totals },
    activeProfiles: activeProfiles.length, profileAssignments: assignments.length, changedProfileSalaries: changedProfileSalaries.length,
    unassignedBefore: users.filter((user) => !user.salaryBandId || !byId.has(user.salaryBandId)).length,
    matchedUniqueTitlesAfter: new Set(assignments.map(({ user }) => user.jobTitle)).size,
    bandsRevisedForRetroactivity: bands.length, changedSlips: changedSlips.length,
    sampleChanges: changedSlips.slice(0, 12).map(({ slip, values, assignment }) => ({
      employee: slip.employeeName, title: assignment.user.jobTitle, band: assignment.band.code,
      baseBefore: slip.baseSalary, baseAfter: values.baseSalary,
    })),
    salaryByBand: [...byBandSummary.values()].sort((a, b) => b.baseAfter - a.baseAfter),
  }, null, 2));
  if (!apply) return;

  const titleAdds = new Map();
  for (const { user, band } of assignments) {
    const set = titleAdds.get(band.id) || new Set(band.jobTitles);
    set.add(user.jobTitle);
    titleAdds.set(band.id, set);
  }
  const newSnapshot = {
    ...(run.policySnapshot && typeof run.policySnapshot === 'object' ? run.policySnapshot : {}),
    retroactiveDemoSalaryBands: {
      marker: 'RETROACTIVE_APPROVED_BANDS_2026-09',
      appliedAt: new Date().toISOString(),
      sourceRunId: run.id,
      salaryRule: 'clamp monthly base salary to approved band min/max; fill missing profile salary at band midpoint',
      attendanceRule: 'retain September attendance days; unpaid time = monthly base / scheduled days * missing days',
      deductionRule: 'VN-PAYROLL-2026.07.02; employee social/health insurance capped at VND 50,600,000, unemployment cap by region; progressive PIT after personal relief VND 15,500,000 and dependent relief VND 6,200,000 each; lunch and overtime exempt per configured policy',
      retroactiveEffectiveFrom: '2026-09-01',
      bandCount: bands.length,
      employeeCount: assignments.length,
      slipCount: updates.length,
    },
  };
  const note = `RETROACTIVE_APPROVED_BANDS_2026-09 — Dữ liệu demo được cập nhật hồi tố theo khung lương đã duyệt theo yêu cầu người dùng; giữ trong dải, dưới sàn lên sàn, trên trần về trần. Chấm công tháng 9 được giữ; các khoản công thiếu, bảo hiểm và thuế demo được tính lại.`;
  await prisma.$transaction(async (tx) => {
    for (const band of bands) {
      const titles = [...(titleAdds.get(band.id) || new Set(band.jobTitles))].sort((a, b) => a.localeCompare(b, 'vi'));
      await tx.hrmsSalaryBand.update({ where: { id: band.id }, data: { effectiveFrom: SEPTEMBER_START, jobTitles: titles } });
    }
    await tx.auditLog.createMany({ data: bands.map((band) => ({
      action: 'DEMO_SALARY_BAND_RETROACTIVE_TITLE_MAPPING',
      entityType: 'HrmsSalaryBand',
      entityId: band.id,
      beforeData: { effectiveFrom: band.effectiveFrom.toISOString(), jobTitles: band.jobTitles },
      afterData: { effectiveFrom: SEPTEMBER_START.toISOString(), jobTitles: [...(titleAdds.get(band.id) || new Set(band.jobTitles))].sort((a, b) => a.localeCompare(b, 'vi')) },
    })) });
    for (const { user, band, salary } of assignments) {
      await tx.user.update({ where: { id: user.id }, data: { salaryBandId: band.id, baseSalary: salary } });
    }
    for (const { slip, assignment, values } of updates) {
      await tx.hrmsPayrollSlip.update({ where: { id: slip.id }, data: {
        employeeName: assignment.user.fullName,
        bankAccount: assignment.user.bankAccount,
        bankName: assignment.user.bankName,
        employeeCode: assignment.user.employeeCode,
        department: assignment.user.orgUnit?.name || 'Văn phòng Trung tâm',
        jobTitle: assignment.user.jobTitle,
        ...values,
      } });
    }
    await tx.hrmsPayrollRun.update({ where: { id: run.id }, data: {
      totalEmployees: updates.length,
      totalGrossPay: totals.gross,
      totalDeduction: totals.deductions,
      totalNetPay: totals.net,
      policySnapshot: newSnapshot,
      notes: note,
    } });
    await tx.auditLog.create({ data: {
      action: 'DEMO_RETROACTIVE_SALARY_BAND_ALIGNMENT',
      entityType: 'HrmsPayrollRun',
      entityId: run.id,
      beforeData: { status: run.status, totalEmployees: run.totalEmployees, gross: run.totalGrossPay, deductions: run.totalDeduction, net: run.totalNetPay, profileCountUnassigned: users.filter((user) => !user.salaryBandId || !byId.has(user.salaryBandId)).length },
      afterData: { totalEmployees: updates.length, gross: totals.gross, deductions: totals.deductions, net: totals.net, activeProfiles: activeProfiles.length, profilesMapped: assignments.length, salaryProfilesChanged: changedProfileSalaries.length, slipsRecalculated: updates.length, approvedBandCount: bands.length, retroactiveEffectiveFrom: '2026-09-01', salaryRangeRule: 'clamp-to-approved-band' },
    } });
  }, { maxWait: 10000, timeout: 120000 });
  console.log('APPLIED: kỳ lương demo tháng 09/2026 và 388 hồ sơ đã được đồng bộ.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
