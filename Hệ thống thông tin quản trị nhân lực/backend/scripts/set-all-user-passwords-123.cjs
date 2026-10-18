const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123', 12);
  const changedAt = new Date();
  const [users, sessions] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { deletedAt: null },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.refreshToken.updateMany({
      where: { revokedAt: null },
      data: { revokedAt: changedAt },
    }),
  ]);

  console.log(JSON.stringify({ updatedAccounts: users.count, revokedSessions: sessions.count }));
}

main()
  .catch((error) => {
    console.error('Không thể cập nhật mật khẩu cho tài khoản người dùng.');
    console.error(error?.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
