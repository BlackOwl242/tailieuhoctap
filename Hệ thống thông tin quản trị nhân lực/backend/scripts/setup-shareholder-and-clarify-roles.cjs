const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== CẬP NHẬT PHÂN TÁCH VAI TRÒ ADMIN CNTT VS BAN GIÁM ĐỐC VS CỔ ĐÔNG ===');

  // 1. Tạo hoặc cập nhật vai trò SHAREHOLDER (Cổ đông & Hội đồng Quản trị)
  const shareholderRole = await prisma.role.upsert({
    where: { code: 'SHAREHOLDER' },
    update: {
      name: 'Cổ đông & Hội đồng Quản trị',
      description: 'Đại hội đồng Cổ đông & Hội đồng Quản trị: Giám sát quản trị tối cao, phê chuẩn cơ cấu tổ chức & định biên chiến lược, xem báo cáo cổ đông và kiểm toán.',
    },
    create: {
      code: 'SHAREHOLDER',
      name: 'Cổ đông & Hội đồng Quản trị',
      description: 'Đại hội đồng Cổ đông & Hội đồng Quản trị: Giám sát quản trị tối cao, phê chuẩn cơ cấu tổ chức & định biên chiến lược, xem báo cáo cổ đông và kiểm toán.',
    },
  });
  console.log('✓ Đã cập nhật vai trò SHAREHOLDER:', shareholderRole.name);

  // 2. Cập nhật rõ ràng vai trò ADMIN (Quản trị viên Hệ thống CNTT)
  await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {
      name: 'Quản trị viên Hệ thống CNTT',
      description: 'Quản trị kỹ thuật CNTT (IT SysAdmin): Quản trị hạ tầng phần mềm, phân quyền vai trò RBAC, quản lý tài khoản, kết nối máy chấm công và nhật ký kiểm toán. Không điều hành nghiệp vụ kinh doanh.',
    },
    create: {
      code: 'ADMIN',
      name: 'Quản trị viên Hệ thống CNTT',
      description: 'Quản trị kỹ thuật CNTT (IT SysAdmin): Quản trị hạ tầng phần mềm, phân quyền vai trò RBAC, quản lý tài khoản, kết nối máy chấm công và nhật ký kiểm toán. Không điều hành nghiệp vụ kinh doanh.',
    },
  });
  console.log('✓ Đã cập nhật vai trò ADMIN: Quản trị viên Hệ thống CNTT');

  // 3. Cập nhật vai trò BOD (Ban Giám Đốc Điều hành)
  await prisma.role.upsert({
    where: { code: 'BOD' },
    update: {
      name: 'Ban Giám Đốc Điều hành (Executive)',
      description: 'Ban Lãnh đạo điều hành doanh nghiệp (Tổng Giám đốc/CEO, Phó TGĐ): Phê duyệt kế hoạch tuyển dụng, ký duyệt hợp đồng lao động, phê duyệt bảng lương tháng, quyết định bổ nhiệm, khen thưởng và kỷ luật.',
    },
    create: {
      code: 'BOD',
      name: 'Ban Giám Đốc Điều hành (Executive)',
      description: 'Ban Lãnh đạo điều hành doanh nghiệp (Tổng Giám đốc/CEO, Phó TGĐ): Phê duyệt kế hoạch tuyển dụng, ký duyệt hợp đồng lao động, phê duyệt bảng lương tháng, quyết định bổ nhiệm, khen thưởng và kỷ luật.',
    },
  });
  console.log('✓ Đã cập nhật vai trò BOD: Ban Giám Đốc Điều hành (Executive)');

  // 4. Gán vai trò SHAREHOLDER & BOD cho Chủ tịch HĐQT (Phạm Tiến Thành)
  const chairman = await prisma.user.findFirst({
    where: { email: 'chairman@saigontechnology.vn' },
  });
  if (chairman) {
    await prisma.userRole.deleteMany({ where: { userId: chairman.id } });
    await prisma.userRole.createMany({
      data: [
        { userId: chairman.id, roleCode: 'SHAREHOLDER' },
        { userId: chairman.id, roleCode: 'BOD' },
      ],
    });
    console.log('✓ Đã gán vai trò SHAREHOLDER & BOD cho Chủ tịch HĐQT: Phạm Tiến Thành (chairman@saigontechnology.vn)');
  }

  // 5. Đảm bảo Tổng Giám đốc (Trần Minh Hoàng) có vai trò BOD
  const ceo = await prisma.user.findFirst({
    where: { email: 'ceo@saigontechnology.vn' },
  });
  if (ceo) {
    await prisma.userRole.deleteMany({ where: { userId: ceo.id } });
    await prisma.userRole.create({
      data: { userId: ceo.id, roleCode: 'BOD' },
    });
    console.log('✓ Đã đảm bảo Tổng Giám đốc (Trần Minh Hoàng) có vai trò BOD (ceo@saigontechnology.vn)');
  }

  // 6. Đảm bảo Quản trị viên IT (Nguyễn Hoàng Nam) có vai trò ADMIN
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@demo.local' },
  });
  if (admin) {
    await prisma.userRole.deleteMany({ where: { userId: admin.id } });
    await prisma.userRole.create({
      data: { userId: admin.id, roleCode: 'ADMIN' },
    });
    console.log('✓ Đã đảm bảo Quản trị viên IT (Nguyễn Hoàng Nam) có vai trò ADMIN (admin@demo.local)');
  }

  // 7. Đồng bộ tài khoản demo HR
  const hrUser = await prisma.user.findFirst({
    where: { email: 'km.manager@demo.local' },
  });
  if (hrUser) {
    await prisma.user.update({
      where: { id: hrUser.id },
      data: {
        fullName: 'Dương Khánh Chi',
        jobTitle: 'Cán bộ Quản trị Nhân sự & Vận hành (HR Manager)',
      },
    });
    await prisma.userRole.deleteMany({ where: { userId: hrUser.id } });
    await prisma.userRole.create({
      data: { userId: hrUser.id, roleCode: 'KM_MANAGER' },
    });
    console.log('✓ Đã cập nhật tài khoản km.manager@demo.local: Dương Khánh Chi (Cán bộ Quản trị Nhân sự)');
  }

  console.log('=== HOÀN TẤT PHÂN TÁCH VAI TRÒ DOANH NGHIỆP ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
