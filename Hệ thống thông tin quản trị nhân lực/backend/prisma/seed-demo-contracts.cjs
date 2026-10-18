const { PrismaClient } = require('@prisma/client');
const { mkdir, writeFile } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { join } = require('node:path');

const { renderContractHtml } = require('./contract-template.cjs');

function contractNumber(user, hireDate, id) {
  const year = hireDate ? hireDate.getUTCFullYear() : new Date().getUTCFullYear();
  const employee = (user.employeeCode || `NV-${id.slice(0, 8)}`).replace(/[^A-Za-z0-9-]/g, '-').toUpperCase();
  return `HDLD-${year}-${employee}`.slice(0, 40);
}

async function createOrUpdateContracts(prisma) {
  const administrator = await prisma.user.findFirst({
    where: { deletedAt: null, roles: { some: { roleCode: 'ADMIN' } } },
    select: { id: true },
  });
  if (!administrator) throw new Error('Không tìm thấy tài khoản ADMIN để ghi nhận người tạo hợp đồng.');

  const settings = await prisma.setting.findUnique({ where: { key: 'ORG_PROFILE' }, select: { value: true } });
  const org = settings?.value && typeof settings.value === 'object' ? settings.value : {};
  const structures = await prisma.hrmsSalaryStructure.findMany({ where: { isActive: true }, include: { items: { include: { component: true } } } });
  const runtime = await prisma.setting.findMany({ where: { key: { in: ['WORK_START', 'WORK_END', 'WORK_BREAK_START', 'WORK_BREAK_END'] } } });
  const config = Object.fromEntries(runtime.map(item => [item.key, item.value]));
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      orgUnit: { select: { name: true } },
      comprehensiveProfile: true,
      contracts: { orderBy: { startDate: 'desc' } },
    },
  });
  const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
  await mkdir(uploadDir, { recursive: true });
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let created = 0;
  let activated = 0;
  let ended = 0;
  let documents = 0;
  let missing = 0;

  for (const user of users) {
    const hireDate = user.hireDate || user.createdAt;
    const salary = Number(user.baseSalary);
    const isResigned = user.employmentStatus === 'RESIGNED' || user.employmentStatus === 'RETIRED';
    const resignation = isResigned ? await prisma.personnelAction.findFirst({
      where: { subjectId: user.id, type: 'RESIGNATION', status: 'APPROVED', effectiveAt: { not: null } },
      orderBy: { effectiveAt: 'desc' },
      select: { effectiveAt: true },
    }) : null;
    const endDate = resignation?.effectiveAt ?? undefined;
    const sampleRecord = user.contracts.find((item) => item.contractNo.startsWith('SAMPLE-'));
    const activeRecord = user.contracts.find((item) => item.status === 'ACTIVE'
      && item.startDate <= todayUtc && (!item.endDate || item.endDate >= todayUtc));
    let contract = sampleRecord || activeRecord || user.contracts[0];

    if (!contract) {
      if (!Number.isFinite(salary) || salary <= 0) { missing += 1; continue; }
      const startDate = new Date(Date.UTC(hireDate.getUTCFullYear(), hireDate.getUTCMonth(), hireDate.getUTCDate()));
      const number = contractNumber(user, startDate, user.id);
      contract = await prisma.contract.create({ data: {
        userId: user.id,
        contractNo: number,
        type: 'INDEFINITE',
        startDate,
        endDate,
        baseSalary: salary,
        compensationBasis: 'MONTHLY',
        status: isResigned ? 'TERMINATED' : 'ACTIVE',
        note: 'DỮ LIỆU MÔ PHỎNG HỌC PHẦN: hồ sơ đã xác minh mô phỏng; hiệu lực dùng để vận hành nghiệp vụ demo, không phải bằng chứng chữ ký thực tế.',
        createdById: administrator.id,
      } });
      created += 1;
      if (isResigned) ended += 1; else activated += 1;
    } else if (sampleRecord) {
      const nextStatus = isResigned ? 'TERMINATED' : 'ACTIVE';
      const baseNumber = contractNumber(user, contract.startDate || hireDate, user.id);
      let nextNumber = baseNumber;
      let suffix = 2;
      let numberOwner = await prisma.contract.findUnique({ where: { contractNo: nextNumber }, select: { id: true } });
      while (numberOwner && numberOwner.id !== contract.id) {
        nextNumber = `${baseNumber.slice(0, 36)}-${String(suffix).padStart(2, '0')}`;
        suffix += 1;
        numberOwner = await prisma.contract.findUnique({ where: { contractNo: nextNumber }, select: { id: true } });
      }
      contract = await prisma.contract.update({ where: { id: contract.id }, data: {
        contractNo: nextNumber,
        status: nextStatus,
        endDate: isResigned ? endDate ?? contract.endDate : contract.endDate,
        note: 'DỮ LIỆU MÔ PHỎNG HỌC PHẦN: hồ sơ đã xác minh mô phỏng; hiệu lực dùng để vận hành nghiệp vụ demo, không phải bằng chứng chữ ký thực tế.',
      } });
      if (isResigned) ended += 1; else activated += 1;
    } else if (isResigned && contract.status !== 'TERMINATED') {
      contract = await prisma.contract.update({ where: { id: contract.id }, data: {
        status: 'TERMINATED',
        endDate: endDate ?? contract.endDate,
        note: 'Trạng thái hợp đồng đồng bộ theo trạng thái nhân sự đã nghỉ; ngày chấm dứt cần lấy từ quyết định nhân sự nếu chưa có.',
      } });
      ended += 1;
    } else if (!isResigned && !activeRecord) {
      if (!Number.isFinite(salary) || salary <= 0) { missing += 1; continue; }
      const contractStart = todayUtc;
      const baseNumber = contractNumber(user, contractStart, user.id);
      let number = baseNumber;
      let suffix = 2;
      while (await prisma.contract.findUnique({ where: { contractNo: number }, select: { id: true } })) {
        number = `${baseNumber.slice(0, 36)}-${String(suffix).padStart(2, '0')}`;
        suffix += 1;
      }
      contract = await prisma.contract.create({ data: {
        userId: user.id,
        contractNo: number,
        type: 'INDEFINITE',
        startDate: contractStart,
        baseSalary: salary,
        compensationBasis: 'MONTHLY',
        status: 'ACTIVE',
        note: 'Hợp đồng gia hạn mô phỏng theo thông tin nhân sự và mức lương đang lưu trên HRMS.',
        createdById: administrator.id,
      } });
      created += 1;
      activated += 1;
    }

    for (const item of [...user.contracts.filter(item => item.id !== contract.id), contract]) {
    if (!item.fileUrl || (process.argv.includes('--refresh-generated') && item.fileName?.endsWith('.html'))) {
      const fileKey = `${randomUUID()}.html`;
      const fileName = `${item.contractNo}.html`;
      const structure = structures.find(s => s.salaryBandId === user.salaryBandId);
      const html = renderContractHtml({ org, user, contract: item, allowances: structure?.items || [], schedule: { start: config.WORK_START, end: config.WORK_END, breakStart: config.WORK_BREAK_START, breakEnd: config.WORK_BREAK_END } });
      await writeFile(join(uploadDir, fileKey), html, { flag: 'wx' });
      await prisma.contract.update({ where: { id: item.id }, data: { fileUrl: `/uploads/${fileKey}`, fileName } });
      await prisma.auditLog.create({ data: { actorId: administrator.id, action: 'CONTRACT_ELECTRONIC_COPY_CREATED', entityType: 'Contract', entityId: item.id, beforeData: { fileUrl: item.fileUrl }, afterData: { fileUrl: `/uploads/${fileKey}`, fileName, template: 'VN-HR-2026.10.17', source: 'ACADEMIC_SIMULATION' } } });
      documents += 1;
    }
    }
    if (sampleRecord) await prisma.auditLog.create({ data: { actorId: administrator.id, action: 'DEMO_CONTRACT_RECONCILED', entityType: 'Contract', entityId: contract.id, beforeData: { contractNo: sampleRecord.contractNo, status: sampleRecord.status }, afterData: { contractNo: contract.contractNo, status: contract.status, source: 'ACADEMIC_SIMULATION' } } });
  }
  console.log(`[seed-demo-contracts] tạo ${created} hồ sơ; chuyển ${activated} nhân viên đang làm sang hiệu lực, ghi nhận ${ended} hồ sơ đã nghỉ; tạo ${documents} bản điện tử; còn ${missing} hồ sơ thiếu lương để xử lý.`);
  return { created, activated, ended, documents, missing };
}

module.exports = { createOrUpdateContracts, renderContractHtml };

if (require.main === module) {
  const prisma = new PrismaClient();
  createOrUpdateContracts(prisma)
    .catch((error) => { console.error('[seed-demo-contracts] failed:', error); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
