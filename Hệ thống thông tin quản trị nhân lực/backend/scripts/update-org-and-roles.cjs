const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. CẬP NHẬT CƠ CẤU TỔ CHỨC THEO TÀI LIỆU PTTK ===');

  // Tìm các đơn vị quan trọng
  const sgTech = await prisma.orgUnit.findFirst({ where: { code: 'SG-TECH' } });
  const dhcd = await prisma.orgUnit.findFirst({ where: { code: 'ĐHCĐ' } });
  const bgd = await prisma.orgUnit.findFirst({ where: { code: 'BGD' } });
  const opsIt = await prisma.orgUnit.findFirst({ where: { code: 'OPS-IT' } });

  if (!sgTech || !bgd) {
    console.error('Không tìm thấy SG-TECH hoặc BGD trong cơ sở dữ liệu!');
    return;
  }

  // BGD trực thuộc SG-TECH (ngang hàng với ĐHCĐ thuộc cấp Lãnh đạo cao nhất)
  await prisma.orgUnit.update({
    where: { id: bgd.id },
    data: {
      parentId: sgTech.id,
      path: `/${sgTech.id}/`,
    },
  });
  console.log('✓ Đã cập nhật Ban Giám Đốc (BGD) trực thuộc SG-TECH');

  if (dhcd) {
    await prisma.orgUnit.update({
      where: { id: dhcd.id },
      data: {
        parentId: sgTech.id,
        path: `/${sgTech.id}/`,
      },
    });
    console.log('✓ Đã cập nhật Đại hội đồng Cổ đông (ĐHCĐ) trực thuộc SG-TECH');
  }

  // 2. Chuyển Vũ Đình Trọng từ SG-TECH về OPS-IT
  if (opsIt) {
    const trong = await prisma.user.findFirst({
      where: { fullName: { contains: 'Trọng' } },
    });
    if (trong) {
      await prisma.user.update({
        where: { id: trong.id },
        data: { orgUnitId: opsIt.id },
      });
      console.log('✓ Đã chuyển Vũ Đình Trọng về đúng Phòng IT & An ninh Mạng (OPS-IT)');
    }
  }

  // 3. Tách bạch tài khoản Tổng Giám đốc (CEO) và IT Admin
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // 3.1. Tìm hoặc tạo tài khoản Quản trị viên Hệ thống CNTT (System Administrator)
  let itAdmin = await prisma.user.findFirst({
    where: { email: { in: ['admin@hrmis.vn', 'it.admin@saigontechnology.vn', 'admin@demo.local'] } },
  });

  // Tìm tài khoản Trần Minh Hoàng
  const ceoUser = await prisma.user.findFirst({
    where: { fullName: { contains: 'Trần Minh Hoàng' } },
  });

  if (ceoUser) {
    // Cập nhật Trần Minh Hoàng thành Tổng Giám đốc với email riêng và vai trò BOD
    await prisma.user.update({
      where: { id: ceoUser.id },
      data: {
        email: 'ceo@saigontechnology.vn',
        jobTitle: 'Tổng Giám đốc (CEO)',
        orgUnitId: bgd.id,
        passwordHash,
      },
    });

    // Gán vai trò BOD cho Trần Minh Hoàng
    await prisma.userRole.deleteMany({ where: { userId: ceoUser.id } });
    await prisma.userRole.create({
      data: {
        userId: ceoUser.id,
        roleCode: 'BOD',
      },
    });
    console.log('✓ Đã cập nhật Trần Minh Hoàng: Tổng Giám đốc (CEO), đơn vị BGD, vai trò BOD, email: ceo@saigontechnology.vn');
  }

  // 3.2. Tạo / đảm bảo tài khoản IT Admin chuẩn: admin@demo.local (và admin@hrmis.vn)
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@demo.local' },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@demo.local',
        passwordHash,
        fullName: 'Nguyễn Hoàng Nam',
        jobTitle: 'Quản trị viên Hệ thống CNTT (System Admin)',
        employeeCode: 'IT-ADMIN',
        orgUnitId: opsIt ? opsIt.id : bgd.id,
        employmentStatus: 'ACTIVE',
        baseSalary: 35000000,
        hireDate: new Date('2018-01-15'),
      },
    });
    console.log('✓ Đã tạo mới tài khoản IT Admin: Nguyễn Hoàng Nam (admin@demo.local)');
  } else if (adminUser.id !== ceoUser?.id) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        fullName: 'Nguyễn Hoàng Nam',
        jobTitle: 'Quản trị viên Hệ thống CNTT (System Admin)',
        orgUnitId: opsIt ? opsIt.id : adminUser.orgUnitId,
        passwordHash,
      },
    });
    console.log('✓ Đã cập nhật tài khoản IT Admin: admin@demo.local');
  }

  // Gán vai trò ADMIN cho tài khoản admin@demo.local
  await prisma.userRole.deleteMany({ where: { userId: adminUser.id } });
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleCode: 'ADMIN',
    },
  });

  // 3.3. Tạo / cập nhật Chủ tịch HĐQT / Đại diện ĐHCĐ (Phạm Tiến Thành)
  if (dhcd) {
    let chairman = await prisma.user.findFirst({
      where: { fullName: { contains: 'Phạm Tiến Thành' } },
    });

    if (!chairman) {
      chairman = await prisma.user.create({
        data: {
          email: 'chairman@saigontechnology.vn',
          passwordHash,
          fullName: 'Phạm Tiến Thành',
          jobTitle: 'Chủ tịch Hội đồng Quản trị',
          employeeCode: 'NV0000',
          orgUnitId: dhcd.id,
          employmentStatus: 'ACTIVE',
          baseSalary: 100000000,
          hireDate: new Date('2012-01-01'),
        },
      });
      console.log('✓ Đã tạo tài khoản Chủ tịch HĐQT: Phạm Tiến Thành (chairman@saigontechnology.vn)');
    } else {
      await prisma.user.update({
        where: { id: chairman.id },
        data: {
          jobTitle: 'Chủ tịch Hội đồng Quản trị',
          orgUnitId: dhcd.id,
        },
      });
    }

    await prisma.userRole.deleteMany({ where: { userId: chairman.id } });
    await prisma.userRole.create({
      data: {
        userId: chairman.id,
        roleCode: 'BOD',
      },
    });
  }

  console.log('\n=== HOÀN TẤT CẬP NHẬT CƠ CẤU & PHÂN QUYỀN VAI TRÒ ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
