/**
 * Tạo/cập nhật bộ tài khoản demo theo vai trò RBAC để trình diễn giao diện theo cấp.
 * Chạy sau seed.cjs; không xóa dữ liệu nghiệp vụ và không đổi mật khẩu tài khoản đã có.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const roles = [
  ['ADMIN', 'Quản trị viên Hệ thống CNTT', 'Quản trị kỹ thuật, tài khoản, cấu hình và nhật ký hệ thống.'],
  ['BOD', 'Ban Giám Đốc điều hành', 'Lãnh đạo điều hành và phê duyệt nghiệp vụ cấp công ty.'],
  ['SHAREHOLDER', 'Cổ đông và Hội đồng Quản trị', 'Giám sát quản trị và xem thông tin dành cho cổ đông/HĐQT.'],
  ['KM_MANAGER', 'Cán bộ Quản trị Nhân sự', 'Quản lý nghiệp vụ nhân sự tổng thể.'],
  ['LINE_MANAGER', 'Quản lý trực tiếp', 'Quản lý nhóm, duyệt nghiệp vụ và đánh giá nhân viên trực thuộc.'],
  ['HR_CB', 'Chuyên viên C&B', 'Vận hành lương, phúc lợi và dữ liệu C&B.'],
  ['ACCOUNTANT', 'Kế toán doanh nghiệp', 'Đối soát thanh toán, tạm ứng và công tác phí.'],
  ['HR_RECRUITER', 'Chuyên viên Tuyển dụng', 'Quản lý tuyển dụng và tiếp nhận nhân sự.'],
  ['HR_TRAINER', 'Chuyên viên Đào tạo và Phát triển', 'Quản lý đào tạo và phát triển năng lực.'],
  ['AUDITOR', 'Kiểm toán Nội bộ và Pháp chế', 'Giám sát tuân thủ và kiểm tra nhật ký nghiệp vụ.'],
  ['USER', 'Nhân viên (Cổng ESS)', 'Tự phục vụ hồ sơ, chấm công và đơn từ cá nhân.'],
];

async function ensureUnit(code, name, parent, sortOrder = 0) {
  const current = await prisma.orgUnit.findUnique({ where: { code } });
  const data = {
    code,
    name,
    parentId: parent?.id ?? null,
    path: parent ? `${parent.path}${parent.id}/` : '/',
    sortOrder,
  };
  if (!current) return prisma.orgUnit.create({ data });
  return prisma.orgUnit.update({ where: { id: current.id }, data });
}

async function main() {
  for (const [code, name, description] of roles) {
    await prisma.role.upsert({ where: { code }, create: { code, name, description }, update: { name, description } });
  }

  const company = await ensureUnit('SG-TECH', 'CÔNG TY CỔ PHẦN SAIGON TECHNOLOGY', null, 0);
  const dhcdUnit = await ensureUnit('ĐHCĐ', 'Đại hội đồng Cổ đông', company, 0);
  await ensureUnit('BKS', 'Ban Kiểm soát', company, 1);
  const bodUnit = await ensureUnit('BGD', 'Ban Tổng Giám đốc', company, 2);
  const coreUnit = await ensureUnit('CORE-REVENUE', 'Khối Sản xuất và Kinh doanh (doanh thu cốt lõi)', bodUnit, 0);
  const supportUnit = await ensureUnit('SUPPORT-OPERATIONS', 'Khối Điều phối, Quản trị Nguồn lực và Hỗ trợ Vận hành Nội bộ', bodUnit, 1);
  const delivery = await ensureUnit('DELIVERY', 'Khối Kỹ thuật và Sản xuất Phần mềm (Delivery)', coreUnit, 0);
  const bizUnit = await ensureUnit('BIZ', 'Khối Phát triển Kinh doanh', coreUnit, 1);
  const hrBlock = await ensureUnit('HR', 'Khối Quản trị Nhân lực', supportUnit, 0);
  const opsBlock = await ensureUnit('OPS', 'Khối Vận hành và Pháp chế', supportUnit, 1);
  const finBlock = await ensureUnit('FIN', 'Khối Tài chính - Kế toán', supportUnit, 2);
  const cbUnit = await ensureUnit('HR-CB', 'Phòng Tiền lương & Phúc lợi (C&B)', hrBlock, 1);
  const recruitUnit = await ensureUnit('HR-TA', 'Phòng Tuyển dụng Công nghệ', hrBlock, 0);
  const trainerUnit = await ensureUnit('HR-LD', 'Phòng Đào tạo & Phát triển', hrBlock, 2);
  const hrOpsUnit = await ensureUnit('HR-OPS', 'Phòng Nhân sự Vận hành & Văn hóa', hrBlock, 3);
  const itUnit = await ensureUnit('OPS-IT', 'Phòng IT & An ninh mạng', opsBlock, 0);
  const legalUnit = await ensureUnit('OPS-LEGAL', 'Phòng Pháp chế & Tuân thủ', opsBlock, 2);
  const financeUnit = await ensureUnit('FIN-ACC', 'Phòng Kế toán Doanh nghiệp & Thuế', finBlock, 0);
  const center = await ensureUnit('DEV-SGN', 'Trung tâm Phần mềm TP.HCM', delivery, 2);
  const javaTeam = await ensureUnit('SQ-BE-SGN', 'Nhóm Backend Microservices', center, 1);

  const accounts = [
    { email: 'admin@demo.local', password: 'Admin@123', name: 'Nguyễn Hoàng Nam', title: 'Quản trị viên Hệ thống CNTT', unit: itUnit, employeeCode: 'NV0001', roles: ['ADMIN'] },
    { email: 'ceo@saigontechnology.vn', password: 'Admin@123', name: 'Trần Minh Hoàng', title: 'Tổng Giám đốc', unit: bodUnit, employeeCode: 'NVDEMO-CEO', roles: ['BOD'] },
    { email: 'chairman@saigontechnology.vn', password: 'Admin@123', name: 'Phạm Tiến Thành', title: 'Chủ tịch Hội đồng Quản trị', unit: dhcdUnit, employeeCode: 'NVDEMO-CHAIR', roles: ['SHAREHOLDER', 'BOD'] },
    { email: 'km.manager@demo.local', password: 'Manager@123', name: 'Dương Khánh Chi', title: 'Trưởng ban Quản trị Nhân sự', unit: hrOpsUnit, employeeCode: 'NV0002', roles: ['KM_MANAGER'] },
    { email: 'pm.java@demo.local', password: 'Pm@123456', name: 'Lê Minh Tuấn', title: 'Trưởng nhóm Java', unit: javaTeam, employeeCode: 'NV0003', roles: ['LINE_MANAGER'] },
    { email: 'dev.fresher@demo.local', password: 'Fresher@123', name: 'Đỗ Gia Hân', title: 'Lập trình viên Java', unit: javaTeam, employeeCode: 'NV0004', roles: ['USER'] },
    { email: 'cb.demo@demo.local', password: 'Cb@123456', name: 'Trần Thu Trang', title: 'Chuyên viên C&B', unit: cbUnit, employeeCode: 'NVDEMO-CB', roles: ['HR_CB'] },
    { email: 'accountant.demo@demo.local', password: 'Acc@123456', name: 'Nguyễn Thị Hồng', title: 'Kế toán thanh toán', unit: financeUnit, employeeCode: 'NVDEMO-ACC', roles: ['ACCOUNTANT'] },
    { email: 'recruiter.demo@demo.local', password: 'Recruit@123', name: 'Phạm Ngọc Mai', title: 'Chuyên viên Tuyển dụng', unit: recruitUnit, employeeCode: 'NVDEMO-TA', roles: ['HR_RECRUITER'] },
    { email: 'trainer.demo@demo.local', password: 'Trainer@123', name: 'Lê Hoàng Anh', title: 'Chuyên viên Đào tạo và Phát triển', unit: trainerUnit, employeeCode: 'NVDEMO-LD', roles: ['HR_TRAINER'] },
    { email: 'auditor.demo@demo.local', password: 'Audit@123', name: 'Vũ Minh Đức', title: 'Kiểm toán viên nội bộ', unit: legalUnit, employeeCode: 'NVDEMO-AUD', roles: ['AUDITOR'] },
  ];

  for (const account of accounts) {
    const { password, roles: roleCodes, ...profile } = account;
    const existing = await prisma.user.findUnique({ where: { email: profile.email } });
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      create: {
        email: profile.email,
        fullName: profile.name,
        jobTitle: profile.title,
        orgUnitId: profile.unit.id,
        employeeCode: profile.employeeCode,
        passwordHash: await bcrypt.hash(password, 12),
        status: 'ACTIVE',
        employmentStatus: 'ACTIVE',
        hireDate: new Date('2021-01-04'),
        roles: { create: roleCodes.map((roleCode) => ({ roleCode })) },
      },
      update: {
        fullName: profile.name,
        jobTitle: profile.title,
        orgUnitId: profile.unit.id,
        status: 'ACTIVE',
      },
    });
    if (existing) {
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.createMany({ data: roleCodes.map((roleCode) => ({ userId: user.id, roleCode })) });
    }
  }

  console.log(`Đã đồng bộ ${accounts.length} tài khoản demo cho ${roles.length} vai trò.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
