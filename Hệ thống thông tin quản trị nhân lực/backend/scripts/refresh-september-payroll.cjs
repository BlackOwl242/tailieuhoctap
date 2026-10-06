/* eslint-disable */
/**
 * Script tính lại bảng lương Tháng 09/2026 theo dữ liệu chấm công mới
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[Recalc Payroll] Xóa bảng lương cũ tháng 09/2026...');
  
  const oldRuns = await prisma.hrmsPayrollRun.findMany({
    where: {
      OR: [
        { periodName: { contains: '09/2026' } },
        { periodName: { contains: 'Tháng 9' } },
      ],
    },
  });

  const closedRun = oldRuns.find((run) => ['APPROVED', 'REVIEWED', 'LOCKED', 'PAID'].includes(run.status));
  if (closedRun) {
    throw new Error(`Không ghi đè kỳ lương ${closedRun.periodName} ở trạng thái ${closedRun.status}. Phiếu hiện tại là ảnh chụp đã chốt; cần quy trình điều chỉnh riêng có đối soát.`);
  }

  for (const r of oldRuns) {
    await prisma.hrmsPayrollSlip.deleteMany({ where: { payrollRunId: r.id } });
    await prisma.hrmsPayrollRun.delete({ where: { id: r.id } });
    console.log(`[Recalc Payroll] Đã xóa bảng lương cũ ID: ${r.id} (${r.periodName})`);
  }

  const fromDate = new Date('2026-09-01T00:00:00.000Z');
  const toDate = new Date('2026-09-30T23:59:59.999Z');

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: {
      id: true,
      fullName: true,
      employeeCode: true,
      jobTitle: true,
      baseSalary: true,
      orgUnit: { select: { name: true } },
    },
  });

  console.log(`[Recalc Payroll] Đang tổng hợp chấm công cho ${users.length} nhân viên...`);

  const attendance = await prisma.attendanceDay.groupBy({
    by: ['userId'],
    _count: { workDate: true },
    where: {
      workDate: { gte: fromDate, lte: toDate },
      status: { in: ['PRESENT', 'LATE', 'EARLY_LEAVE', 'ON_LEAVE', 'HOLIDAY'] },
    },
  });

  const attendanceMap = new Map();
  attendance.forEach((a) => {
    attendanceMap.set(a.userId, a._count.workDate);
  });

  const newRun = await prisma.hrmsPayrollRun.create({
    data: {
      periodName: 'Bảng Lương Tháng 09/2026 (Chấm công thực tế)',
      fromDate,
      toDate,
      status: 'APPROVED',
      totalEmployees: users.length,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeduction: 0,
    },
  });

  let sumGross = 0;
  let sumNet = 0;
  let sumDeduction = 0;

  const slipsData = [];

  for (const u of users) {
    const base = Number(u.baseSalary) || 12000000;
    const standardWorkingDays = 22;
    const actualDays = attendanceMap.get(u.id) ?? 0;
    const unpaidDays = Math.max(0, standardWorkingDays - actualDays);

    const lunchAllowancePerDay = 35000;
    const lunchAllowance = Math.round(lunchAllowancePerDay * actualDays);
    const grossPay = base + lunchAllowance;

    const unpaidDeduction = Math.round((base / standardWorkingDays) * unpaidDays);
    const socialInsurance = Math.round(base * 0.08);
    const healthInsurance = Math.round(base * 0.015);
    const unemploymentInsurance = Math.round(base * 0.01);
    const insuranceTotal = socialInsurance + healthInsurance + unemploymentInsurance;

    const personalRelief = 11000000;
    const taxableIncome = Math.max(0, grossPay - unpaidDeduction - insuranceTotal - personalRelief);
    const pitTax = Math.round(taxableIncome * 0.05);

    const totalDeduction = unpaidDeduction + insuranceTotal + pitTax;
    const netPay = Math.max(0, grossPay - totalDeduction);

    sumGross += grossPay;
    sumDeduction += totalDeduction;
    sumNet += netPay;

    const deductionsList = [
      { name: 'Bảo hiểm Xã hội (8%)', amount: socialInsurance },
      { name: 'Bảo hiểm Y tế (1.5%)', amount: healthInsurance },
      { name: 'Bảo hiểm Thất nghiệp (1%)', amount: unemploymentInsurance },
    ];

    if (unpaidDeduction > 0) {
      deductionsList.unshift({
        name: `Trừ công nghỉ/vắng (${unpaidDays} ngày)`,
        amount: unpaidDeduction,
      });
    }

    if (pitTax > 0) {
      deductionsList.push({ name: 'Thuế Thu nhập Cá nhân (TNCN)', amount: pitTax });
    }

    slipsData.push({
      payrollRunId: newRun.id,
      userId: u.id,
      employeeName: u.fullName,
      employeeCode: u.employeeCode,
      department: u.orgUnit?.name || 'Văn phòng Trung tâm',
      jobTitle: u.jobTitle || 'Chuyên viên Nghiệp vụ',
      workingDays: standardWorkingDays,
      actualWorkDays: actualDays,
      baseSalary: base,
      grossPay,
      totalDeduction,
      netPay,
      status: 'APPROVED',
      breakdown: {
        earnings: [
          { name: 'Lương Cơ Bản Theo Hợp Đồng', amount: base },
          { name: `Phụ Cấp Ăn Trưa (${actualDays} ngày thực tế)`, amount: lunchAllowance },
        ],
        deductions: deductionsList,
      },
    });
  }

  // Insert slips in chunks
  const chunkSize = 50;
  for (let i = 0; i < slipsData.length; i += chunkSize) {
    const chunk = slipsData.slice(i, i + chunkSize);
    await prisma.hrmsPayrollSlip.createMany({ data: chunk });
  }

  await prisma.hrmsPayrollRun.update({
    where: { id: newRun.id },
    data: {
      totalGrossPay: sumGross,
      totalDeduction: sumDeduction,
      totalNetPay: sumNet,
    },
  });

  console.log(`[Recalc Payroll] HOÀN TẤT: Tạo bảng lương ID: ${newRun.id}`);
  console.log(`- Tổng nhân viên: ${slipsData.length}`);
  console.log(`- Tổng Gross: ${sumGross.toLocaleString('vi-VN')} đ`);
  console.log(`- Tổng Net: ${sumNet.toLocaleString('vi-VN')} đ`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
