const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'km.manager@demo.local' },
    data: {
      fullName: 'Dương Khánh Chi',
      jobTitle: 'Chuyên viên Quản trị Hồ sơ Nhân sự & Vận hành',
    },
  });
  console.log('✓ Updated km.manager user details to Dương Khánh Chi');
}

main().catch(console.error).finally(() => prisma.$disconnect());
