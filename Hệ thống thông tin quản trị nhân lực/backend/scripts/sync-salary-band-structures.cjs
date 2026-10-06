const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const bands = await prisma.hrmsSalaryBand.findMany({
    where: {
      status: 'ACTIVE',
      approvedAt: { not: null },
      effectiveFrom: { lte: today },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }],
    },
    orderBy: { code: 'asc' },
  });

  let created = 0;
  let updated = 0;
  for (const band of bands) {
    const matching = await prisma.hrmsSalaryStructure.findMany({
      where: { salaryBandId: band.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    const current = matching[0];
    const name = `Cấu trúc theo khung ${band.code}`;
    const description = `Tự động áp dụng cho nhân sự được gán khung ${band.code}. Lương cơ bản lấy từ hợp đồng/quyết định cá nhân; khoảng khung là mức tham chiếu, không tự thay lương. Chưa cộng phụ cấp/thưởng vì chưa có quy chế doanh nghiệp được ghi nhận làm căn cứ.`;
    const payload = {
      name,
      description,
      payrollFrequency: band.compensationBasis,
      jobTitle: null,
      orgUnitId: null,
      salaryBandId: band.id,
    };

    let structure;
    if (current) {
      structure = await prisma.hrmsSalaryStructure.update({ where: { id: current.id }, data: payload });
      updated++;
      if (matching.length > 1) {
        await prisma.hrmsSalaryStructure.updateMany({
          where: { id: { in: matching.slice(1).map((item) => item.id) } },
          data: { isActive: false },
        });
      }
    } else {
      structure = await prisma.hrmsSalaryStructure.create({ data: payload });
      created++;
    }

    await prisma.auditLog.create({
      data: {
        action: current ? 'SYNC_SALARY_STRUCTURE_TO_BAND' : 'CREATE_SALARY_STRUCTURE_FROM_BAND',
        entityType: 'HrmsSalaryStructure',
        entityId: structure.id,
        beforeData: current ? { salaryBandId: current.salaryBandId, name: current.name, description: current.description } : undefined,
        afterData: { salaryBandId: band.id, bandCode: band.code, name: structure.name, items: 0, appliedToJobTitles: band.jobTitles.length },
      },
    });
  }

  const activeCurrent = await prisma.hrmsSalaryStructure.count({
    where: { isActive: true, salaryBandId: { in: bands.map((band) => band.id) } },
  });
  console.log(JSON.stringify({ activeBands: bands.length, created, updated, activeLinkedStructures: activeCurrent }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
