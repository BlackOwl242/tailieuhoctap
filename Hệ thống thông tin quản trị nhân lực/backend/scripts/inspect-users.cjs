const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  });
  console.log('ROLES COUNT:', roles.length);
  console.log('ROLES:', roles);

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'admin@demo.local',
          'ceo@saigontechnology.vn',
          'chairman@saigontechnology.vn',
          'km.manager@demo.local',
        ],
      },
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      jobTitle: true,
      orgUnit: { select: { code: true, name: true } },
      roles: { select: { roleCode: true } },
    },
  });
  console.log('KEY USERS:', JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
