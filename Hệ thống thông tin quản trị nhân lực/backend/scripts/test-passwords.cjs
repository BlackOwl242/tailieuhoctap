const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'admin@demo.local',
          'ceo@saigontechnology.vn',
          'chairman@saigontechnology.vn',
          'km.manager@demo.local',
          'pm.java@demo.local',
          'dev.fresher@demo.local',
        ],
      },
    },
    select: { email: true, passwordHash: true },
  });

  for (const u of users) {
    console.log(u.email, { sharedPassword123: bcrypt.compareSync('123', u.passwordHash) });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
