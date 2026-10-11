const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CYCLE_NAME = 'Chu kỳ đánh giá KPI Quý IV/2026';
const EMPLOYEE_NAME = 'Nguyễn Thị Hồng Hạnh';
const SAMPLE_PREFIX = '[Dữ liệu mẫu minh họa KPI]';

const examples = [
  {
    title: 'Thực hiện lịch nội dung',
    metricValue: '9/10 nội dung đúng lịch (90%)',
    description: `${SAMPLE_PREFIX} Báo cáo tiến độ đến 10/10/2026: 9 trong 10 nội dung đã phát hành đúng lịch; 1 nội dung đổi lịch có xác nhận. Quản lý chấm thử 90/100 để minh họa cách đối chiếu chỉ tiêu.`,
    managerScore: 90,
  },
  {
    title: 'Gắn thẻ và đo lường chiến dịch',
    metricValue: '3/4 chiến dịch có UTM hợp lệ (75%)',
    description: `${SAMPLE_PREFIX} Bảng rà soát đến 10/10/2026 ghi nhận 3 trong 4 chiến dịch đã gắn UTM và kiểm tra đường dẫn; chiến dịch còn lại đang chờ rà soát. Quản lý chấm thử 75/100 để minh họa cách đối chiếu chỉ tiêu.`,
    managerScore: 75,
  },
  {
    title: 'Khách hàng tiềm năng đủ điều kiện',
    metricValue: '45/60 MQL theo kế hoạch quý (75%)',
    description: `${SAMPLE_PREFIX} Báo cáo Marketing–Kinh doanh đến 10/10/2026 ghi nhận 45 MQL trên kế hoạch 60; còn chờ quản lý đối chiếu tiêu chí MQL và chấm điểm.`,
    managerScore: null,
  },
];

async function main() {
  const cycle = await prisma.hrmsAppraisalCycle.findFirst({
    where: { name: CYCLE_NAME, status: 'ACTIVE', organizationSector: 'enterprise' },
  });
  if (!cycle) throw new Error(`Không tìm thấy kỳ KPI doanh nghiệp đang mở: ${CYCLE_NAME}`);

  let addedEvidence = 0;
  let addedScores = 0;
  for (const example of examples) {
    const goal = await prisma.hrmsAppraisalGoal.findFirst({
      where: { cycleId: cycle.id, employeeName: EMPLOYEE_NAME, kraTitle: example.title },
      include: { evidences: true },
    });
    if (!goal) throw new Error(`Không tìm thấy KPI “${example.title}” của ${EMPLOYEE_NAME}`);

    const hasSampleEvidence = goal.evidences.some(evidence => evidence.description.startsWith(SAMPLE_PREFIX));
    if (!hasSampleEvidence && goal.evidences.length === 0) {
      await prisma.hrmsKraEvidence.create({
        data: {
          goalId: goal.id,
          submittedBy: goal.userId,
          metricValue: example.metricValue,
          description: example.description,
        },
      });
      addedEvidence += 1;
    }

    if (example.managerScore !== null && goal.managerScore === null && goal.finalScore === null) {
      await prisma.hrmsAppraisalGoal.update({
        where: { id: goal.id },
        data: { managerScore: example.managerScore, finalScore: example.managerScore, status: 'SUBMITTED' },
      });
      addedScores += 1;
    }
  }

  console.log(JSON.stringify({ cycle: cycle.name, employee: EMPLOYEE_NAME, addedEvidence, addedScores, note: 'Các minh chứng và điểm được gắn nhãn dữ liệu mẫu; không phải kết quả đánh giá chính thức.' }, null, 2));
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
