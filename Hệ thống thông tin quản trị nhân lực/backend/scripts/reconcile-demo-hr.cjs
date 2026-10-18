/** Explicit, idempotent academic fixture reconciliation. Never runs at startup. */
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');
const { createOrUpdateContracts } = require('../prisma/seed-demo-contracts.cjs');
const hash = value => parseInt(createHash('sha256').update(value).digest('hex').slice(0, 8), 16);
const clean = value => JSON.parse(JSON.stringify(value));

async function reconcile(prisma) {
  const actor = await prisma.user.findFirstOrThrow({ where: { deletedAt: null, roles: { some: { roleCode: 'ADMIN' } } } });
  const today = new Date(new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10));
  const resignations = await prisma.personnelAction.findMany({ where: { type: 'RESIGNATION', status: 'APPROVED' } });
  const leavingDates = new Map();
  for (const a of resignations) {
    const value = a.payload?.effectiveDate || a.effectiveAt;
    if (!value) continue;
    const date = new Date(new Date(value).toISOString().slice(0, 10));
    if (!leavingDates.has(a.subjectId) || date < leavingDates.get(a.subjectId)) leavingDates.set(a.subjectId, date);
    if (!a.effectiveAt || a.effectiveAt.getTime() !== date.getTime() || (date > today && a.appliedAt)) await prisma.$transaction(async tx => {
      await tx.personnelAction.update({ where: { id: a.id }, data: { effectiveAt: date, ...(date > today ? { appliedAt: null } : {}) } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'ACADEMIC_ACTION_EFFECTIVE_DATE_RECONCILED', entityType: 'PersonnelAction', entityId: a.id, beforeData: { effectiveAt: a.effectiveAt, appliedAt: a.appliedAt }, afterData: { effectiveAt: date.toISOString(), source: 'existing approved decision payload' } } });
    });
  }
  const users = await prisma.user.findMany({ where: { deletedAt: null }, include: { orgUnit: true, comprehensiveProfile: { include: { appointments: true } } }, orderBy: { id: 'asc' } });
  const usedCodes = new Set(users.map(u => u.employeeCode).filter(Boolean));
  const usedIdentities = new Set();
  let changed = 0, posts = 0, goalsAdded = 0;
  for (const user of users) {
    const h = hash(user.id), p = user.comprehensiveProfile;
    let employeeCode = user.employeeCode || `NV-${user.id.slice(0, 8).toUpperCase()}`;
    if (!user.employeeCode) { let suffix = 1; while (usedCodes.has(employeeCode)) employeeCode = `NV-${user.id.slice(0, 6).toUpperCase()}-${suffix++}`; usedCodes.add(employeeCode); }
    const hire = user.hireDate || today;
    const birthYear = Math.min(1980 + h % 22, hire.getUTCFullYear() - 20);
    const birthDate = user.birthDate || new Date(Date.UTC(birthYear, (h >>> 4) % 12, 1 + (h >>> 9) % 28));
    const gender = ['Nam', 'Nữ'].includes(p?.gender) ? p.gender : h % 2 ? 'Nữ' : 'Nam';
    const centuryCode = (Math.floor(birthDate.getUTCFullYear() / 100) - 19) * 2 + (gender === 'Nữ' ? 1 : 0);
    let serial = h % 1000000;
    let identity;
    do { identity = `079${centuryCode}${String(birthDate.getUTCFullYear()).slice(-2)}${String(serial++).padStart(6, '0')}`; } while (usedIdentities.has(identity));
    usedIdentities.add(identity);
    const left = leavingDates.has(user.id) && leavingDates.get(user.id) <= today;
    const employed = !left && ['ACTIVE', 'PROBATION'].includes(user.employmentStatus);
    const oldAddress = p?.currentAddress || p?.permanentAddress || user.address;
    const residence = !oldAddress || /Quận\s|Huyện\s|Thủ Đức/i.test(oldAddress) ? 'Địa chỉ cư trú mô phỏng tại phường Sài Gòn, Thành phố Hồ Chí Minh' : oldAddress;
    const userData = {
      employeeCode, birthDate, hireDate: hire,
      address: residence,
      ...(left ? { employmentStatus: 'RESIGNED' } : {}),
      bankAccount: user.bankAccount || `9900${String(h).padStart(10, '0')}`,
      bankName: user.bankName || 'Ngân hàng mô phỏng HRMIS',
      ...(!employed && user.status === 'ACTIVE' ? { status: 'DISABLED' } : {}),
    };
    const profileData = {
      gender, idCardNo: identity, idCardIssueDate: p?.idCardIssueDate || new Date('2021-01-01'), idCardIssuePlace: p?.idCardIssuePlace || 'Cơ quan cấp căn cước mô phỏng',
      currentAddress: residence,
      socialInsuranceNo: p?.socialInsuranceNo || String(h).padStart(10, '0'),
      mainDuty: p?.mainDuty || `Thực hiện nhiệm vụ ${user.jobTitle || 'theo vị trí'} tại ${user.orgUnit?.name || 'đơn vị'} theo mô tả công việc và mục tiêu được giao.`,
      verificationStatus: 'VERIFIED', verifiedAt: p?.verifiedAt || new Date(), verifiedById: actor.id, dataSource: 'ACADEMIC_SIMULATION',
    };
    const before = { user: Object.fromEntries(Object.keys(userData).map(k => [k, user[k]])), profile: Object.fromEntries(Object.keys(profileData).map(k => [k, p?.[k] ?? null])) };
    const after = { user: userData, profile: profileData };
    const needsUpdate = JSON.stringify(clean(before)) !== JSON.stringify(clean(after));
    if (needsUpdate) await prisma.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: userData });
      const profile = await tx.personnelComprehensiveProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, ...profileData }, update: profileData });
      if (!employed) {
        await tx.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
        await tx.faceEmbedding.updateMany({ where: { userId: user.id, active: true }, data: { active: false } });
      }
      const current = p?.appointments.filter(a => a.isCurrent) || [];
      const correctPost = current.length === 1 && current[0].positionTitle === user.jobTitle && current[0].orgUnitName === user.orgUnit?.name;
      if ((!correctPost && employed) || (!employed && current.length)) {
        await tx.personnelAppointment.updateMany({ where: { profileId: profile.id, isCurrent: true }, data: { isCurrent: false, expirationDate: new Date(today.getTime() - 86400000) } });
        if (employed) await tx.personnelAppointment.create({ data: { profileId: profile.id, orgUnitName: user.orgUnit?.name || 'Chưa phân đơn vị', positionTitle: user.jobTitle || 'Nhân viên', effectiveDate: today, isCurrent: true, decisionNo: `DEMO-RECON-${employeeCode}`, signer: actor.id } });
        posts++;
      }
      if (employed) {
        const year = today.getUTCFullYear();
        const years = Math.max(0, year - hire.getUTCFullYear());
        const entitled = 12 + Math.floor(years / 5);
        await tx.leaveBalance.upsert({ where: { userId_year: { userId: user.id, year } }, create: { userId: user.id, year, entitled }, update: {} });
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'ACADEMIC_HR_PROFILE_VERIFIED', entityType: 'User', entityId: user.id, beforeData: clean(before), afterData: clean(after) } });
      changed++;
    });
    if (left) user.employmentStatus = 'RESIGNED';
  }
  const setting = await prisma.setting.findUnique({ where: { key: 'ORG_PROFILE' } });
  const org = setting?.value || {};
  const ceo = users.find(u => u.email === 'ceo@saigontechnology.vn');
  const nextOrg = { ...org, orgName: org.orgName || 'CÔNG TY CỔ PHẦN SAIGON TECHNOLOGY', location: org.location || 'TP. Hồ Chí Minh',
    orgAddress: org.orgAddress || 'Văn phòng mô phỏng HRMIS, phường Sài Gòn, Thành phố Hồ Chí Minh',
    workLocation: org.workLocation || 'Văn phòng mô phỏng HRMIS, phường Sài Gòn, Thành phố Hồ Chí Minh',
    representativeName: org.representativeName || ceo?.fullName || actor.fullName,
    representativeTitle: org.representativeTitle || ceo?.jobTitle || 'Đại diện doanh nghiệp mô phỏng', payDay: org.payDay || 5,
    dataSource: 'ACADEMIC_SIMULATION' };
  if (JSON.stringify(org) !== JSON.stringify(nextOrg)) {
    await prisma.$transaction(async tx => {
      await tx.setting.upsert({ where: { key: 'ORG_PROFILE' }, create: { key: 'ORG_PROFILE', value: nextOrg, updatedBy: actor.id }, update: { value: nextOrg, updatedBy: actor.id } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: 'ACADEMIC_ORG_PROFILE_COMPLETED', entityType: 'Setting', entityId: 'ORG_PROFILE', beforeData: org, afterData: nextOrg } });
    });
  }
  const contracts = await createOrUpdateContracts(prisma);
  const cycle = await prisma.hrmsAppraisalCycle.findFirst({ where: { organizationSector: 'enterprise', year: today.getUTCFullYear(), status: 'ACTIVE' }, orderBy: { startDate: 'asc' } });
  if (cycle) for (const user of users.filter(u => ['ACTIVE', 'PROBATION'].includes(u.employmentStatus))) {
    const existing = await prisma.hrmsAppraisalGoal.findMany({ where: { cycleId: cycle.id, userId: user.id } });
    const remaining = Math.round((100 - existing.reduce((s, g) => s + g.weightage, 0)) * 100) / 100;
    if (remaining <= .001) continue;
    const title = `Hoàn thành nhiệm vụ vị trí ${user.jobTitle || 'được giao'}`;
    const row = await prisma.hrmsAppraisalGoal.create({ data: { cycleId: cycle.id, userId: user.id, employeeName: user.fullName,
      kraTitle: `${title} · khung mô phỏng`, description: `${title} tại ${user.orgUnit?.name || 'đơn vị'}; đo tỷ lệ nhiệm vụ hoàn thành đúng hạn và được nghiệm thu trên tổng số nhiệm vụ đã giao. Loại trừ thay đổi phạm vi được duyệt. Dữ liệu khung môn học; chưa có kết quả chấm.`,
      targetMetric: 'Tỷ lệ nhiệm vụ được nghiệm thu đúng hạn đạt ít nhất 95%; kết quả và mẫu số cần có minh chứng quản lý xác nhận.',
      weightage: remaining, criteriaGroup: 'RESULT', measurementMode: 'HIGHER_BETTER', targetValue: 95, measurementUnit: '%',
    } });
    await prisma.auditLog.create({ data: { actorId: actor.id, action: 'ACADEMIC_KPI_FRAMEWORK_COMPLETED', entityType: 'HrmsAppraisalGoal', entityId: row.id, afterData: { userId: user.id, weightage: remaining, dataSource: 'ACADEMIC_SIMULATION' } } });
    goalsAdded++;
  }
  return { users: users.length, changed, posts, goalsAdded, contracts };
}
module.exports = { reconcile };
if (require.main === module) {
  if (!process.argv.includes('--apply')) { console.error('Run audit-hr-data.cjs first. Explicit academic-data write requires --apply.'); process.exitCode = 1; }
  else {
    const prisma = new PrismaClient();
    reconcile(prisma).then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
  }
}
