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
    const isPwAdmin = bcrypt.compareSync('Admin@123', u.passwordHash);
    const isPwManager = bcrypt.compareSync('Manager@123', u.passwordHash);
    const isPwPm = bcrypt.compareSync('Pm@123456', u.passwordHash);
    const isPwFresher = bcrypt.compareSync('Fresher@123', u.passwordHash);
    console.log(u.email, {
      'Admin@123': isPwAdmin,
      'Manager@123': isPwManager,
      'Pm@123456': isPwPm,
      'Fresher@123': isPwFresher,
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
