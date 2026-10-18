/** Read-only HR reconciliation. No seed, updates, password or identity exports. */
const { PrismaClient, Prisma } = require('@prisma/client');
const { existsSync, writeFileSync } = require('node:fs');
const { join, basename } = require('node:path');

async function auditHrData(prisma, at = new Date()) {
  const today = new Date(new Date(at.getTime() + 7 * 3600000).toISOString().slice(0, 10));
  const [users, assignments, goals, actions, components, settings, counts, payrollRuns, loans] = await Promise.all([
    prisma.user.findMany({ where: { deletedAt: null }, include: {
      roles: true, orgUnit: true, salaryBand: true, contracts: { orderBy: { startDate: 'desc' } },
      comprehensiveProfile: { include: { appointments: true, rewardDisciplines: true } },
    }, orderBy: { employeeCode: 'asc' } }),
    prisma.hrmsSalaryStructureAssignment.findMany({ include: { structure: true } }),
    prisma.hrmsAppraisalGoal.findMany({ include: { cycle: true, evidences: true } }),
    prisma.personnelAction.findMany({ where: { status: 'APPROVED' } }),
    prisma.hrmsSalaryComponent.findMany(),
    prisma.setting.findMany({ where: { key: { in: ['ORG_PROFILE', 'WORK_START', 'WORK_END', 'WORK_BREAK_START', 'WORK_BREAK_END'] } } }),
    Promise.all(Object.values(Prisma.ModelName).map(async name => {
      const delegate = name.charAt(0).toLowerCase() + name.slice(1);
      return [name, await prisma[delegate].count()];
    })),
    prisma.hrmsPayrollRun.findMany({ include: { slips: true } }),
    prisma.hrmsEmployeeLoan.findMany({ select: { id: true, remainingAmount: true } }),
  ]);
  const records = users.map(user => {
    const issues = [];
    const add = (code, detail, severity = 'REVIEW') => issues.push({ code, severity, detail });
    const employed = ['ACTIVE', 'PROBATION'].includes(user.employmentStatus);
    const contracts = user.contracts.filter(c => c.status === 'ACTIVE' && c.startDate <= today && (!c.endDate || c.endDate >= today));
    const contract = contracts[0];
    if (!user.employeeCode) add('EMPLOYEE_CODE_MISSING', 'Thiếu mã nhân viên');
    if (!user.orgUnitId) add('ORG_UNIT_MISSING', 'Thiếu đơn vị công tác');
    if (!user.jobTitle) add('JOB_TITLE_MISSING', 'Thiếu chức danh');
    if (!user.hireDate) add('HIRE_DATE_MISSING', 'Thiếu ngày tuyển dụng');
    if (!user.roles.length) add('ROLE_MISSING', 'Tài khoản không có vai trò', 'ERROR');
    if (!employed && user.status === 'ACTIVE') add('LEAVER_ACCESS_ACTIVE', 'Nhân sự đã nghỉ còn tài khoản hoạt động', 'ERROR');
    if (employed && !(user.baseSalary > 0)) add('SALARY_MISSING', 'Nhân sự đang làm thiếu mức lương', 'ERROR');
    if (employed && !contract) add('ACTIVE_CONTRACT_MISSING', 'Chưa có hợp đồng hiệu lực theo ngày', 'ERROR');
    if (contracts.filter(c => c.type !== 'AMENDMENT').length > 1 || contracts.filter(c => c.type === 'AMENDMENT').length > 1) add('CONTRACT_OVERLAP', 'Nhiều hợp đồng gốc hoặc nhiều phụ lục lương cùng hiệu lực', 'ERROR');
    if (!user.contracts.length) add('CONTRACT_HISTORY_MISSING', 'Chưa có hồ sơ hợp đồng');
    if (contract && user.baseSalary !== contract.baseSalary) add('CONTRACT_SALARY_MISMATCH', 'Lương hiện tại khác mức hợp đồng hiệu lực', 'ERROR');
    for (const item of user.contracts) {
      if (!item.fileUrl) add('CONTRACT_FILE_MISSING', `Thiếu bản điện tử ${item.contractNo}`);
      else if (item.fileUrl.startsWith('/uploads/') && !existsSync(join(process.env.UPLOAD_DIR || '/app/uploads', basename(item.fileUrl)))) add('CONTRACT_FILE_NOT_FOUND', `Tệp hợp đồng ${item.contractNo} không tồn tại`, 'ERROR');
      if (item.endDate && item.endDate < item.startDate) add('CONTRACT_DATE_INVALID', `Ngày kết thúc trước ngày bắt đầu ${item.contractNo}`, 'ERROR');
    }
    const profile = user.comprehensiveProfile;
    if (!profile) add('PROFILE_MISSING', 'Thiếu hồ sơ nhân sự toàn diện');
    if (profile && profile.verificationStatus !== 'VERIFIED') add('PROFILE_NOT_VERIFIED', 'Hồ sơ chưa qua xác minh');
    if (profile?.verificationStatus === 'VERIFIED' && (!profile.verifiedAt || !profile.verifiedById)) add('VERIFICATION_EVIDENCE_MISSING', 'Trạng thái xác minh thiếu người hoặc thời điểm xác minh', 'ERROR');
    if (profile?.idCardNo && !/^\d{12}$/.test(profile.idCardNo)) add('IDENTITY_FORMAT_INVALID', 'Căn cước cần 12 chữ số trong bộ dữ liệu đang sử dụng', 'ERROR');
    if (profile?.idCardNo && user.birthDate && /^\d{12}$/.test(profile.idCardNo)) {
      const year = 1900 + Math.floor(Number(profile.idCardNo[3]) / 2) * 100 + Number(profile.idCardNo.slice(4, 6));
      const female = Number(profile.idCardNo[3]) % 2 === 1;
      if (year !== user.birthDate.getUTCFullYear() || (profile.gender === 'Nữ') !== female) add('IDENTITY_BIRTH_GENDER_MISMATCH', 'Mã thế kỷ/giới tính/năm sinh trên căn cước khác hồ sơ', 'ERROR');
    }
    if (user.birthDate && user.hireDate && user.hireDate.getUTCFullYear() - user.birthDate.getUTCFullYear() < 18) add('EMPLOYMENT_AGE_REVIEW', 'Cần kiểm tra hồ sơ lao động chưa thành niên');
    for (const [field, label] of [['gender', 'giới tính'], ['idCardNo', 'định danh cá nhân'], ['currentAddress', 'địa chỉ cư trú']]) {
      if (!profile?.[field] && !(field === 'currentAddress' && (profile?.permanentAddress || user.address))) add('IDENTITY_INCOMPLETE', `Chưa khai báo ${label}`);
    }
    if (!user.birthDate) add('BIRTH_DATE_MISSING', 'Thiếu ngày sinh');
    if (!user.bankAccount || !user.bankName) add('BANK_INFO_MISSING', 'Thiếu thông tin nhận lương chuyển khoản');
    if (employed && !profile?.socialInsuranceNo) add('SOCIAL_INSURANCE_MISSING', 'Thiếu mã số BHXH');
    if (employed && !user.salaryBandId) add('SALARY_BAND_MISSING', 'Chưa gắn khung lương');
    const band = user.salaryBand;
    if (employed && band && (band.status !== 'ACTIVE' || band.effectiveFrom > today || (band.effectiveTo && band.effectiveTo < today))) add('SALARY_BAND_INACTIVE', 'Khung lương chưa hiệu lực', 'ERROR');
    if (employed && band && contract && (band.compensationBasis !== contract.compensationBasis || contract.baseSalary < band.minSalary || contract.baseSalary > band.maxSalary)) add('SALARY_OUTSIDE_BAND', 'Mức hoặc đơn vị trả lương ngoài khung', 'ERROR');
    const currentAssignments = assignments.filter(a => a.userId === user.id && a.isActive && a.fromDate <= today);
    if (currentAssignments.length > 1) add('SALARY_ASSIGNMENT_OVERLAP', 'Nhiều cấu trúc lương cá nhân cùng hoạt động', 'ERROR');
    for (const a of currentAssignments) if (!a.structure.isActive || (contract && a.baseSalary !== contract.baseSalary)) add('SALARY_STRUCTURE_MISMATCH', 'Cấu trúc lương ngừng hoạt động hoặc mức lương không khớp hợp đồng', 'ERROR');
    const currentPosts = profile?.appointments.filter(a => a.isCurrent) || [];
    if (currentPosts.length > 1) add('APPOINTMENT_OVERLAP', 'Nhiều chức vụ chính cùng hiện hành');
    for (const a of currentPosts) if (a.positionTitle !== user.jobTitle || a.orgUnitName !== user.orgUnit?.name) add('APPOINTMENT_MISMATCH', 'Quá trình bổ nhiệm khác chức danh/đơn vị hiện tại');
    for (const a of actions.filter(a => a.subjectId === user.id && a.effectiveAt && a.effectiveAt <= today)) {
      if (!a.appliedAt) add('ACTION_NOT_APPLIED', `Quyết định ${a.type} đã tới ngày nhưng chưa áp dụng`, 'ERROR');
      if (['AWARD', 'DISCIPLINE'].includes(a.type) && !profile?.rewardDisciplines.some(r => r.decisionNo === (a.payload?.decisionNo || a.id))) add('REWARD_HISTORY_MISSING', `Quyết định ${a.type} chưa nối lịch sử hồ sơ`);
    }
    return { id: user.id, employeeCode: user.employeeCode, fullName: user.fullName, email: user.email,
      roles: user.roles.map(r => r.roleCode), employmentStatus: user.employmentStatus, accountStatus: user.status,
      contractCount: user.contracts.length, effectiveContract: contract?.contractNo || null, issues };
  });
  const globalIssues = [];
  for (const run of payrollRuns) {
    for (const slip of run.slips) if (Math.abs(slip.grossPay - slip.totalDeduction - slip.netPay) > 1 || slip.netPay < 0) globalIssues.push({ code: 'PAYROLL_SLIP_ARITHMETIC', slipId: slip.id });
    for (const [totalField, lineField] of [['totalGrossPay', 'grossPay'], ['totalDeduction', 'totalDeduction'], ['totalNetPay', 'netPay']]) {
      if (Math.abs(run[totalField] - run.slips.reduce((sum, slip) => sum + slip[lineField], 0)) > 1) globalIssues.push({ code: 'PAYROLL_RUN_TOTAL_MISMATCH', runId: run.id, totalField });
    }
  }
  for (const loan of loans) if (loan.remainingAmount < 0) globalIssues.push({ code: 'LOAN_NEGATIVE_BALANCE', loanId: loan.id });
  const groups = new Map();
  for (const goal of goals) {
    const key = `${goal.cycleId}/${goal.userId}/${goal.criteriaGroup}`;
    const group = groups.get(key) || { cycle: goal.cycle.name, userId: goal.userId, weight: 0 };
    group.weight += goal.weightage; groups.set(key, group);
    const user = users.find(u => u.id === goal.userId);
    if (!user) globalIssues.push({ code: 'KPI_ORPHAN', goalId: goal.id });
    else if (goal.employeeName !== user.fullName) globalIssues.push({ code: 'KPI_NAME_MISMATCH', goalId: goal.id, userId: user.id });
    if (goal.managerScore !== null && !goal.evidences.length) globalIssues.push({ code: 'KPI_SCORE_WITHOUT_EVIDENCE', goalId: goal.id });
    if (goal.finalScore !== null && (!Number.isFinite(goal.finalScore) || goal.finalScore < 0 || goal.finalScore > 100)) globalIssues.push({ code: 'KPI_SCORE_INVALID', goalId: goal.id });
  }
  for (const [key, g] of groups) if (Math.abs(g.weight - 100) > .001) globalIssues.push({ code: 'KPI_WEIGHT_INCOMPLETE', key, ...g });
  for (const c of components) if (c.defaultAmount > 0 && (!c.basisReference || c.basisType === 'UNVERIFIED')) globalIssues.push({ code: 'COMPONENT_BASIS_MISSING', component: c.code });
  const byCode = {};
  for (const item of records.flatMap(r => r.issues)) byCode[item.code] = (byCode[item.code] || 0) + 1;
  return { asOf: today.toISOString().slice(0, 10), generatedAt: new Date().toISOString(), readOnly: true,
    counts: Object.fromEntries(counts), settings: Object.fromEntries(settings.map(s => [s.key, s.value])),
    summary: { users: records.length, errors: records.flatMap(r => r.issues).filter(i => i.severity === 'ERROR').length,
      reviews: records.flatMap(r => r.issues).filter(i => i.severity === 'REVIEW').length, byCode, globalIssues: globalIssues.length },
    globalIssues, records };
}
module.exports = { auditHrData };
if (require.main === module) {
  const prisma = new PrismaClient();
  auditHrData(prisma).then(result => {
    const target = process.argv[2] || '/tmp/hr-data-audit.json';
    writeFileSync(target, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ path: target, ...result.summary, counts: result.counts }, null, 2));
  }).catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
