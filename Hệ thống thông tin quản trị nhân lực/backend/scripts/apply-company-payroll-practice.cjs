const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const RESPONSIBILITY_REFERENCE = 'Chính sách lương Saigon Technology cập nhật 07/10/2026; mức 1.500.000 đ/tháng đã được áp dụng trên 385/385 phiếu lương thanh toán T09/2026. Phụ cấp trả thường xuyên được tính vào căn cứ BHXH theo Điều 31 Luật BHXH 41/2024/QH15 và căn cứ OT theo Điều 98 Bộ luật Lao động 45/2019/QH14.';
const LUNCH_REFERENCE = 'Chính sách phúc lợi Saigon Technology cập nhật 07/10/2026; mức 35.000 đ cho mỗi ngày có chấm công theo 385/385 phiếu lương thanh toán T09/2026. Khoản ăn ca đến 1.200.000 đ/tháng không tính TNCN theo điểm g khoản 2 Điều 8 Nghị định 253/2026/NĐ-CP từ 01/07/2026; ghi thành phúc lợi riêng, không thuộc căn cứ BHXH.';

async function main() {
  const asOf = new Date();
  asOf.setUTCHours(0, 0, 0, 0);
  const bands = await prisma.hrmsSalaryBand.findMany({
    where: { status: 'ACTIVE', approvedAt: { not: null }, effectiveFrom: { lte: asOf }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOf } }] },
    select: { id: true, code: true },
    orderBy: { code: 'asc' },
  });
  if (!bands.length) throw new Error('Không có khung lương đã duyệt đang hiệu lực.');

  const bandIds = bands.map((band) => band.id);
  await prisma.$transaction(async (tx) => {
    const components = await tx.hrmsSalaryComponent.findMany({ where: { code: { in: ['RESPONSIBILITY_ALLOW', 'LUNCH_ALLOW'] } } });
    const byCode = new Map(components.map((component) => [component.code, component]));
    if (!byCode.has('RESPONSIBILITY_ALLOW') || !byCode.has('LUNCH_ALLOW')) throw new Error('Thiếu thành phần phụ cấp trách nhiệm hoặc ăn trưa.');

    const responsibility = byCode.get('RESPONSIBILITY_ALLOW');
    const lunch = byCode.get('LUNCH_ALLOW');
    await tx.hrmsSalaryComponent.update({
      where: { id: responsibility.id },
      data: {
        defaultAmount: 1500000,
        isTaxApplicable: true,
        isInsuranceApplicable: true,
        isOvertimeApplicable: true,
        isFormulaBased: false,
        formula: null,
        basisType: 'COMPANY_POLICY',
        basisReference: RESPONSIBILITY_REFERENCE,
        description: '1.500.000 đ/tháng theo khoản đang được doanh nghiệp chi trả; tính chịu thuế, căn cứ BHXH và căn cứ OT. Tự phân bổ theo ngày được trả lương.',
      },
    });
    await tx.hrmsSalaryComponent.update({
      where: { id: lunch.id },
      data: {
        defaultAmount: 35000,
        isTaxApplicable: false,
        isInsuranceApplicable: false,
        isOvertimeApplicable: false,
        isFormulaBased: true,
        formula: 'unitAmount * standardDays',
        basisType: 'COMPANY_POLICY',
        basisReference: LUNCH_REFERENCE,
        description: '35.000 đ × số ngày có chấm công thực tế; không tính cho ngày nghỉ/vắng. Tối đa 1.085.000 đ nếu tháng có 31 ngày, dưới ngưỡng miễn thuế 1.200.000 đ/tháng.',
      },
    });

    for (const component of [responsibility, lunch]) {
      await tx.auditLog.create({
        data: {
          action: 'APPLY_COMPANY_PAYROLL_PRACTICE',
          entityType: 'HrmsSalaryComponent',
          entityId: component.id,
          beforeData: { defaultAmount: component.defaultAmount, isTaxApplicable: component.isTaxApplicable, isInsuranceApplicable: component.isInsuranceApplicable, isOvertimeApplicable: component.isOvertimeApplicable, basisReference: component.basisReference },
          afterData: component.code === 'RESPONSIBILITY_ALLOW'
            ? { code: component.code, monthlyAmount: 1500000, tax: true, insuranceBase: true, overtimeBase: true, sourcePeriod: '09/2026' }
            : { code: component.code, dailyAmount: 35000, formula: 'unitAmount * standardDays', taxFreeCeiling: 1200000, sourcePeriod: '09/2026' },
        },
      });
    }

    const structures = await tx.hrmsSalaryStructure.findMany({
      where: { isActive: true, salaryBandId: { in: bandIds } },
      include: { items: true, salaryBand: { select: { code: true } } },
    });
    if (structures.length !== bands.length) throw new Error(`Cần ${bands.length} cấu trúc theo khung, hiện có ${structures.length}.`);

    for (const structure of structures) {
      const items = [
        { componentId: responsibility.id, amount: 1500000, formula: null, code: 'RESPONSIBILITY_ALLOW' },
        { componentId: lunch.id, amount: 35000, formula: 'unitAmount * standardDays', code: 'LUNCH_ALLOW' },
      ];
      for (const item of items) {
        const matching = structure.items.filter((existing) => existing.componentId === item.componentId);
        if (matching.length > 1) throw new Error(`Thành phần ${item.code} bị trùng trong cấu trúc ${structure.name}.`);
        const current = matching[0];
        if (current) {
          await tx.hrmsSalaryStructureItem.update({ where: { id: current.id }, data: { amount: item.amount, formula: item.formula } });
        } else {
          await tx.hrmsSalaryStructureItem.create({ data: { structureId: structure.id, componentId: item.componentId, amount: item.amount, formula: item.formula } });
        }
        await tx.auditLog.create({
          data: {
            action: 'SYNC_BENEFIT_TO_SALARY_BAND_STRUCTURE',
            entityType: 'HrmsSalaryStructure',
            entityId: structure.id,
            beforeData: current ? { componentCode: item.code, amount: current.amount, formula: current.formula } : undefined,
            afterData: { bandCode: structure.salaryBand?.code, componentCode: item.code, amount: item.amount, formula: item.formula, effectiveForFutureRuns: true },
          },
        });
      }
    }

    const activeItemCount = await tx.hrmsSalaryStructureItem.count({ where: { structure: { isActive: true, salaryBandId: { in: bandIds } }, componentId: { in: [responsibility.id, lunch.id] } } });
    console.log(JSON.stringify({ activeBands: bands.length, updatedComponents: 2, synchronizedStructures: structures.length, items: activeItemCount }, null, 2));
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
