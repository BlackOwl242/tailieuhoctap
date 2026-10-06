/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Idempotently aligns the demo organization tree with doc/PTTK_OOP_HR.md.
 * Staff remain attached to real units; legacy unit references are migrated
 * before obsolete duplicate nodes are removed.
 */
const { PrismaClient } = require('@prisma/client');
const { ALL_STAFF, UNIT_CODE_ALIASES } = require('../prisma/seed-all-employees.cjs');
const { EMPLOYEES, UNIT_CODE_BY_LABEL } = require('../prisma/seed-employees.cjs');

const prisma = new PrismaClient();

const units = [
  { code: 'SG-TECH', name: 'CÔNG TY CỔ PHẦN SAIGON TECHNOLOGY', parent: null, sort: 0 },
  { code: 'ĐHCĐ', name: 'Đại hội đồng Cổ đông', parent: 'SG-TECH', sort: 0 },
  { code: 'BKS', name: 'Ban Kiểm soát', parent: 'SG-TECH', sort: 1 },
  { code: 'BGD', name: 'Ban Tổng Giám đốc', parent: 'SG-TECH', sort: 2 },
  { code: 'CORE-REVENUE', name: 'Khối Sản xuất và Kinh doanh (doanh thu cốt lõi)', parent: 'BGD', sort: 0 },
  { code: 'SUPPORT-OPERATIONS', name: 'Khối Điều phối, Quản trị Nguồn lực và Hỗ trợ Vận hành Nội bộ', parent: 'BGD', sort: 1 },
  { code: 'DELIVERY', name: 'Khối Kỹ thuật và Sản xuất Phần mềm (Delivery)', parent: 'CORE-REVENUE', sort: 0 },
  { code: 'BIZ', name: 'Khối Phát triển Kinh doanh', parent: 'CORE-REVENUE', sort: 1 },
  { code: 'HR', name: 'Khối Quản trị Nhân lực', parent: 'SUPPORT-OPERATIONS', sort: 0 },
  { code: 'OPS', name: 'Khối Vận hành và Pháp chế', parent: 'SUPPORT-OPERATIONS', sort: 1 },
  { code: 'FIN', name: 'Khối Tài chính - Kế toán', parent: 'SUPPORT-OPERATIONS', sort: 2 },
  { code: 'PMO', name: 'Phòng Quản lý Dự án (PMO)', parent: 'DELIVERY', sort: 0 },
  { code: 'BA-UIUX', name: 'Phòng Phân tích Nghiệp vụ (BA & UI/UX)', parent: 'DELIVERY', sort: 1 },
  { code: 'DEV-SGN', name: 'Trung tâm Phần mềm TP.HCM', parent: 'DELIVERY', sort: 2 },
  { code: 'SQ-WEB-SGN', name: 'Nhóm Web Frontend & Fullstack', parent: 'DEV-SGN', sort: 0 },
  { code: 'SQ-BE-SGN', name: 'Nhóm Backend Microservices', parent: 'DEV-SGN', sort: 1 },
  { code: 'SQ-MOB-SGN', name: 'Nhóm Ứng dụng Di động', parent: 'DEV-SGN', sort: 2 },
  { code: 'SQ-DEVOPS-SGN', name: 'Nhóm DevOps & Cloud', parent: 'DEV-SGN', sort: 3 },
  { code: 'SQ-AI-SGN', name: 'Nhóm AI & Data Engineering', parent: 'DEV-SGN', sort: 4 },
  { code: 'DEV-DAD', name: 'Trung tâm Phần mềm Đà Nẵng', parent: 'DELIVERY', sort: 3 },
  { code: 'SQ-ENT-DAD', name: 'Nhóm Ứng dụng Doanh nghiệp', parent: 'DEV-DAD', sort: 0 },
  { code: 'SQ-WEB-DAD', name: 'Nhóm Web & Cloud Solutions', parent: 'DEV-DAD', sort: 1 },
  { code: 'SQ-MOB-DAD', name: 'Nhóm Mobile & IoT Solutions', parent: 'DEV-DAD', sort: 2 },
  { code: 'SQ-DEVOPS-DAD', name: 'Nhóm Hạ tầng & DevOps', parent: 'DEV-DAD', sort: 3 },
  { code: 'QA-QC', name: 'Phòng Đảm bảo Chất lượng (QA/QC)', parent: 'DELIVERY', sort: 4 },
  { code: 'QA-AUTO', name: 'Nhóm Kiểm thử Tự động (Automation QA)', parent: 'QA-QC', sort: 0 },
  { code: 'QA-MANUAL', name: 'Nhóm Kiểm thử Thủ công & Bảo mật', parent: 'QA-QC', sort: 1 },
  { code: 'BIZ-GLOBAL', name: 'Phòng Kinh doanh Quốc tế', parent: 'BIZ', sort: 0 },
  { code: 'BIZ-DOMESTIC', name: 'Phòng Kinh doanh Doanh nghiệp', parent: 'BIZ', sort: 1 },
  { code: 'BIZ-KAM', name: 'Phòng Khách hàng Chiến lược (KAM)', parent: 'BIZ', sort: 2 },
  { code: 'BIZ-MKT', name: 'Phòng Marketing & Truyền thông', parent: 'BIZ', sort: 3 },
  { code: 'HR-TA', name: 'Phòng Tuyển dụng Công nghệ', parent: 'HR', sort: 0 },
  { code: 'HR-CB', name: 'Phòng Tiền lương & Phúc lợi (C&B)', parent: 'HR', sort: 1 },
  { code: 'HR-LD', name: 'Phòng Đào tạo & Phát triển', parent: 'HR', sort: 2 },
  { code: 'HR-OPS', name: 'Phòng Nhân sự Vận hành & Văn hóa', parent: 'HR', sort: 3 },
  { code: 'OPS-IT', name: 'Phòng IT & An ninh mạng', parent: 'OPS', sort: 0 },
  { code: 'OPS-ADMIN', name: 'Phòng Hành chính & Cơ sở vật chất', parent: 'OPS', sort: 1 },
  { code: 'OPS-LEGAL', name: 'Phòng Pháp chế & Tuân thủ', parent: 'OPS', sort: 2 },
  { code: 'OPS-COORD', name: 'Điều phối Vận hành', parent: 'OPS', sort: 3 },
  { code: 'FIN-ACC', name: 'Phòng Kế toán Doanh nghiệp & Thuế', parent: 'FIN', sort: 0 },
  { code: 'FIN-TREASURY', name: 'Phòng Thanh toán & Dòng tiền', parent: 'FIN', sort: 1 },
  { code: 'FIN-FPA', name: 'Phòng Kế hoạch Tài chính (FP&A)', parent: 'FIN', sort: 2 },
  { code: 'FIN-PAYROLL', name: 'Kiểm soát Quỹ lương', parent: 'FIN', sort: 3 },
];

async function moveReferences(tx, oldId, newId) {
  await tx.user.updateMany({ where: { orgUnitId: oldId }, data: { orgUnitId: newId } });
  await tx.space.updateMany({ where: { orgUnitId: oldId }, data: { orgUnitId: newId } });
  await tx.onboardingPath.updateMany({ where: { orgUnitId: oldId }, data: { orgUnitId: newId } });
  await tx.jobRequisition.updateMany({ where: { orgUnitId: oldId }, data: { orgUnitId: newId } });
  await tx.hrmsPublicAppraisalDecision.updateMany({ where: { orgUnitId: oldId }, data: { orgUnitId: newId } });
}

async function main() {
  let backfilledAssignments = 0;
  await prisma.$transaction(async (tx) => {
    const byCode = new Map((await tx.orgUnit.findMany()).map((unit) => [unit.code, unit]));

    for (const spec of units) {
      const parent = spec.parent ? byCode.get(spec.parent) : null;
      if (spec.parent && !parent) throw new Error(`Missing parent unit: ${spec.parent}`);
      let current = byCode.get(spec.code);
      if (!current) {
        current = await tx.orgUnit.create({
          data: {
            code: spec.code,
            name: spec.name,
            parentId: parent?.id ?? null,
            path: parent ? `${parent.path}${parent.id}/` : '/',
            sortOrder: spec.sort,
          },
        });
        byCode.set(current.code, current);
      } else {
        current = await tx.orgUnit.update({
          where: { id: current.id },
          data: {
            name: spec.name,
            parentId: parent?.id ?? null,
            sortOrder: spec.sort,
          },
        });
        byCode.set(current.code, current);
      }
    }

    const destinationMap = [
      ['TC-HC-NS', 'HR-OPS'],
      ['SQ-S1', 'SQ-BE-SGN'],
    ];
    for (const [legacyCode, destinationCode] of destinationMap) {
      const legacy = byCode.get(legacyCode);
      const destination = byCode.get(destinationCode);
      if (!legacy || !destination) continue;
      await moveReferences(tx, legacy.id, destination.id);
      await tx.orgUnit.delete({ where: { id: legacy.id } });
      byCode.delete(legacyCode);
    }

    // These accounts were created by the repository's demo staff seed. Some
    // used legacy unit codes that no longer exist, leaving them unassigned.
    // Only fill a missing assignment; preserve any manually assigned unit.
    for (const [index, staff] of ALL_STAFF.entries()) {
      const code = UNIT_CODE_ALIASES[staff.unitCode] || staff.unitCode;
      const unit = byCode.get(code);
      if (!unit) continue;
      const user = await tx.user.findFirst({
        where: { fullName: staff.name, jobTitle: staff.title, orgUnitId: null, deletedAt: null },
        select: { id: true },
      });
      if (user) {
        await tx.user.update({ where: { id: user.id }, data: { orgUnitId: unit.id } });
        backfilledAssignments += 1;
      }
    }
    for (const staff of EMPLOYEES) {
      const code = UNIT_CODE_BY_LABEL[staff.unit];
      const unit = code ? byCode.get(code) : null;
      if (!unit) continue;
      const user = await tx.user.findFirst({
        where: { fullName: staff.name, jobTitle: staff.title, orgUnitId: null, deletedAt: null },
        select: { id: true },
      });
      if (user) {
        await tx.user.update({ where: { id: user.id }, data: { orgUnitId: unit.id } });
        backfilledAssignments += 1;
      }
    }

    const all = await tx.orgUnit.findMany({ select: { id: true, code: true, parentId: true } });
    const byId = new Map(all.map((unit) => [unit.id, unit]));
    const pathCache = new Map();
    const resolvePath = (unit, visited = new Set()) => {
      if (pathCache.has(unit.id)) return pathCache.get(unit.id);
      if (visited.has(unit.id)) throw new Error(`Organization cycle detected at ${unit.code}`);
      if (!unit.parentId) {
        pathCache.set(unit.id, '/');
        return '/';
      }
      const nextVisited = new Set(visited).add(unit.id);
      const parent = byId.get(unit.parentId);
      if (!parent) throw new Error(`Missing parent while resolving path for ${unit.code}`);
      const path = `${resolvePath(parent, nextVisited)}${parent.id}/`;
      pathCache.set(unit.id, path);
      return path;
    };
    for (const unit of all) {
      await tx.orgUnit.update({ where: { id: unit.id }, data: { path: resolvePath(unit) } });
    }
  }, { maxWait: 15000, timeout: 60000 });

  const [result, unassigned] = await Promise.all([prisma.orgUnit.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { users: { where: { deletedAt: null } } } } },
  }), prisma.user.count({ where: { deletedAt: null, orgUnitId: null } })]);
  const assignedDirect = result.reduce((sum, unit) => sum + unit._count.users, 0);
  console.log(`Organization structure aligned: ${result.length} nodes; ${assignedDirect} directly assigned employees; ${unassigned} without a unit; ${backfilledAssignments} legacy demo assignments repaired.`);
}

main()
  .catch((error) => {
    console.error('[org-structure] Reconciliation failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
