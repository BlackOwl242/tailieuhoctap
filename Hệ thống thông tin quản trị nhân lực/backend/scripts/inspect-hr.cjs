const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hrUsers = await prisma.user.findMany({
    where: {
      OR: [
        { orgUnit: { code: { in: ['HR', 'HR-TA', 'HR-OPS', 'HR-CB', 'HR-LD'] } } },
        { jobTitle: { contains: 'Nhân sự' } },
        { jobTitle: { contains: 'HR' } },
      ],
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      jobTitle: true,
      orgUnit: { select: { code: true, name: true } },
      roles: { select: { roleCode: true } },
    },
    take: 10,
  });
  console.log('HR USERS:', JSON.stringify(hrUsers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
