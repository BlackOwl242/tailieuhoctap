/**
 * Đổi tên 5 tài khoản demo cũ sang tên người Việt thực tế (Mục 3).
 * Idempotent — chỉ đổi tên, giữ nguyên email/mật khẩu/vai để kịch bản demo
 * không bị ảnh hưởng. Chạy: node prisma/rename-demo-users.cjs
 */
const RENAMES = [
  { email: 'admin@demo.local', fullName: 'Nguyễn Hoàng Nam' },
  { email: 'km.manager@demo.local', fullName: 'Võ Thị Thanh Hà' },
  { email: 'pm.java@demo.local', fullName: 'Lê Minh Tuấn' },
  { email: 'dev.fresher@demo.local', fullName: 'Đỗ Gia Hân' },
  { email: 'editor.qa@demo.local', fullName: 'Hồ Ngọc Sơn' },
];

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    for (const r of RENAMES) {
      const u = await prisma.user.update({ where: { email: r.email }, data: { fullName: r.fullName }, select: { employeeCode: true, fullName: true } });
      console.log(`Đã đổi: ${r.email} → ${u.fullName} (${u.employeeCode ?? '—'})`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
