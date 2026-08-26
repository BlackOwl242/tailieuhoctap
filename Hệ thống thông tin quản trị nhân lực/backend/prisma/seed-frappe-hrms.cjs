const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFrappeHrms() {
  console.log('Seeding Frappe HRMS Enterprise Modules...');

  // 1. Shift Types
  const shiftTypes = [
    { name: 'Ca Hành chính', startTime: '08:00', endTime: '17:00', lateToleranceMinutes: 15, earlyExitToleranceMinutes: 15, color: '#3b82f6', description: 'Ca làm việc tiêu chuẩn từ 8:00 đến 17:00, nghỉ trưa 1 tiếng' },
    { name: 'Ca Sáng', startTime: '06:00', endTime: '14:00', lateToleranceMinutes: 10, earlyExitToleranceMinutes: 10, color: '#10b981', description: 'Ca làm việc buổi sáng cho khối sản xuất & vận hành' },
    { name: 'Ca Chiều', startTime: '14:00', endTime: '22:00', lateToleranceMinutes: 10, earlyExitToleranceMinutes: 10, color: '#f59e0b', description: 'Ca làm việc buổi chiều/tối' },
    { name: 'Ca Đêm', startTime: '22:00', endTime: '06:00', lateToleranceMinutes: 10, earlyExitToleranceMinutes: 10, color: '#8b5cf6', description: 'Ca làm việc ban đêm (phụ cấp ca đêm 30%)' },
  ];

  for (const st of shiftTypes) {
    const existing = await prisma.hrmsShiftType.findFirst({ where: { name: st.name } });
    if (!existing) {
      await prisma.hrmsShiftType.create({ data: st });
    }
  }

  // 2. Salary Components
  const salaryComponents = [
    { code: 'BASIC', name: 'Lương Cơ bản', type: 'EARNING', isTaxApplicable: true, isFormulaBased: false, defaultAmount: 12000000, description: 'Lương thỏa thuận trên hợp đồng lao động' },
    { code: 'POSITION_ALLOW', name: 'Phụ cấp Chức vụ', type: 'EARNING', isTaxApplicable: true, isFormulaBased: false, defaultAmount: 3000000, description: 'Phụ cấp trách nhiệm theo cấp bậc quản lý' },
    { code: 'LUNCH_ALLOW', name: 'Phụ cấp Ăn trưa', type: 'EARNING', isTaxApplicable: false, isFormulaBased: false, defaultAmount: 730000, description: 'Phụ cấp tiền ăn giữa ca miễn thuế' },
    { code: 'KPI_BONUS', name: 'Thưởng Hiệu suất KPI', type: 'EARNING', isTaxApplicable: true, isFormulaBased: false, defaultAmount: 2500000, description: 'Thưởng căn cứ theo kết quả hoàn thành mục tiêu' },
    { code: 'BHXH', name: 'Trừ Bảo hiểm Xã hội (8%)', type: 'DEDUCTION', isTaxApplicable: false, isFormulaBased: true, formula: 'baseSalary * 0.08', defaultAmount: 960000, description: 'Đóng BHXH người lao động' },
    { code: 'BHYT', name: 'Trừ Bảo hiểm Y tế (1.5%)', type: 'DEDUCTION', isTaxApplicable: false, isFormulaBased: true, formula: 'baseSalary * 0.015', defaultAmount: 180000, description: 'Đóng BHYT người lao động' },
    { code: 'BHTN', name: 'Trừ Bảo hiểm Thất nghiệp (1%)', type: 'DEDUCTION', isTaxApplicable: false, isFormulaBased: true, formula: 'baseSalary * 0.01', defaultAmount: 120000, description: 'Đóng BHTN người lao động' },
    { code: 'PIT', name: 'Thuế Thu nhập Cá nhân (TNCN)', type: 'DEDUCTION', isTaxApplicable: false, isFormulaBased: true, formula: 'taxableIncome * 0.1', defaultAmount: 450000, description: 'Trừ thuế TNCN biểu lũy tiến từng phần' },
  ];

  for (const sc of salaryComponents) {
    const existing = await prisma.hrmsSalaryComponent.findUnique({ where: { code: sc.code } });
    if (!existing) {
      await prisma.hrmsSalaryComponent.create({ data: sc });
    }
  }

  // 3. Salary Structures
  const compMap = {};
  const allComps = await prisma.hrmsSalaryComponent.findMany();
  for (const c of allComps) compMap[c.code] = c.id;

  const structStandard = await prisma.hrmsSalaryStructure.upsert({
    where: { id: 'struct-standard-tech' },
    update: {},
    create: {
      id: 'struct-standard-tech',
      name: 'Cấu trúc Lương Khối Công nghệ & Kỹ thuật',
      payrollFrequency: 'MONTHLY',
      description: 'Áp dụng cho Software Engineers, Solution Architects, DevOps',
    },
  });

  if (compMap['BASIC'] && compMap['LUNCH_ALLOW'] && compMap['BHXH'] && compMap['BHYT'] && compMap['BHTN']) {
    await prisma.hrmsSalaryStructureItem.deleteMany({ where: { structureId: structStandard.id } });
    await prisma.hrmsSalaryStructureItem.createMany({
      data: [
        { structureId: structStandard.id, componentId: compMap['BASIC'], amount: 18000000 },
        { structureId: structStandard.id, componentId: compMap['LUNCH_ALLOW'], amount: 730000 },
        { structureId: structStandard.id, componentId: compMap['BHXH'], amount: 1440000, formula: 'BASIC * 0.08' },
        { structureId: structStandard.id, componentId: compMap['BHYT'], amount: 270000, formula: 'BASIC * 0.015' },
        { structureId: structStandard.id, componentId: compMap['BHTN'], amount: 180000, formula: 'BASIC * 0.01' },
      ],
    });
  }

  // 4. Job Openings & Applicants
  const openingDev = await prisma.hrmsJobOpening.upsert({
    where: { id: 'job-dev-senior' },
    update: {},
    create: {
      id: 'job-dev-senior',
      title: 'Tuyển dụng Kỹ sư Phần mềm Senior Full-Stack',
      department: 'Phòng Phát triển Phần mềm',
      designation: 'Senior Software Engineer',
      vacancies: 3,
      minExperience: 4,
      salaryRange: '25.000.000 - 45.000.000 VND',
      description: 'Chịu trách nhiệm thiết kế kiến trúc, phát triển các dịch vụ backend và giao diện web hiện đại cho hệ thống HRMIS & KMS.',
      requirements: 'Thành thạo TypeScript, Node.js / NestJS, Next.js / React, PostgreSQL, Docker. Có kinh nghiệm tối ưu hóa hiệu năng.',
      status: 'OPEN',
    },
  });

  const openingHr = await prisma.hrmsJobOpening.upsert({
    where: { id: 'job-hr-specialist' },
    update: {},
    create: {
      id: 'job-hr-specialist',
      title: 'Tuyển dụng Chuyên viên Quản trị Nhân lực & C&B',
      department: 'Phòng Nhân sự & Đào tạo',
      designation: 'HR Specialist',
      vacancies: 2,
      minExperience: 2,
      salaryRange: '14.000.000 - 20.000.000 VND',
      description: 'Phụ trách theo dõi hợp đồng, chấm công, tính lương, chế độ bảo hiểm và phúc lợi người lao động.',
      requirements: 'Am hiểu Luật Lao động Việt Nam, thành thạo nghiệp vụ bảo hiểm, tính thuế TNCN và các phần mềm quản trị nhân sự.',
      status: 'OPEN',
    },
  });

  // Applicants
  const app1 = await prisma.hrmsJobApplicant.upsert({
    where: { id: 'app-nguyen-van-an' },
    update: {},
    create: {
      id: 'app-nguyen-van-an',
      jobOpeningId: openingDev.id,
      candidateName: 'Nguyễn Văn An',
      email: 'an.nguyen.candidate@gmail.com',
      phone: '0912345678',
      stage: 'INTERVIEW_ROUND_2',
      rating: 5,
      notes: 'Ứng viên có kỹ năng thuật toán xuất sắc, 5 năm kinh nghiệm NestJS và React. Vòng 1 phỏng vấn đạt 92/100.',
    },
  });

  const app2 = await prisma.hrmsJobApplicant.upsert({
    where: { id: 'app-tran-thi-mai' },
    update: {},
    create: {
      id: 'app-tran-thi-mai',
      jobOpeningId: openingHr.id,
      candidateName: 'Trần Thị Mai',
      email: 'mai.tran.hr@gmail.com',
      phone: '0987654321',
      stage: 'OFFER_SENT',
      rating: 4,
      notes: 'Kinh nghiệm 3 năm chuyên sâu C&B, nắm vững luật lao động và các biểu mẫu quy chuẩn.',
    },
  });

  // 5. Onboarding Tasks
  const onboardingTasks = [
    { title: 'Tạo tài khoản email công ty & cấp quyền truy cập hệ thống', category: 'IT', assignee: 'IT Support' },
    { title: 'Bàn giao Laptop, màn hình và thẻ nhân viên', category: 'ADMIN', assignee: 'Hành chính Quản trị' },
    { title: 'Ký kết Hợp đồng lao động và bàn giao sổ BHXH', category: 'HR', assignee: 'Chuyên viên Nhân sự' },
    { title: 'Đào tạo Định hướng Văn hóa doanh nghiệp & Quy chế nội bộ', category: 'HR', assignee: 'Phòng Đào tạo' },
    { title: 'Gặp gỡ Quản lý trực tiếp & phân công Mentor hướng dẫn', category: 'DEPARTMENT', assignee: 'Trưởng bộ phận' },
  ];

  for (const t of onboardingTasks) {
    const existing = await prisma.hrmsOnboardingTask.findFirst({ where: { title: t.title } });
    if (!existing) {
      await prisma.hrmsOnboardingTask.create({ data: t });
    }
  }

  // 6. Appraisal Cycle & Goals
  const cycle = await prisma.hrmsAppraisalCycle.upsert({
    where: { id: 'cycle-annual-2026' },
    update: {},
    create: {
      id: 'cycle-annual-2026',
      name: 'Kỳ Đánh giá Hiệu suất & Năng lực Toàn diện 2026',
      year: 2026,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      description: 'Chu kỳ đánh giá mục tiêu KPI/KRA và phản hồi 360 độ thường niên',
    },
  });

  // 7. Travel Requests & Expense Claims
  const users = await prisma.user.findMany({ take: 5 });
  if (users.length > 0) {
    const sampleUser = users[0];
    const travelReq = await prisma.hrmsTravelRequest.upsert({
      where: { id: 'travel-danang-01' },
      update: {},
      create: {
        id: 'travel-danang-01',
        userId: sampleUser.id,
        employeeName: sampleUser.fullName,
        purpose: 'Khảo sát & Triển khai Hệ thống Quản trị tại Chi nhánh Miền Trung (Đà Nẵng)',
        fromLocation: 'TP. Hồ Chí Minh',
        toLocation: 'TP. Đà Nẵng',
        departureDate: new Date('2026-09-01'),
        returnDate: new Date('2026-09-05'),
        estimatedBudget: 15000000,
        status: 'APPROVED',
        notes: 'Đã duyệt vé máy bay khứ hồi và khách sạn công tác theo định mức',
      },
    });

    await prisma.hrmsExpenseClaim.upsert({
      where: { id: 'claim-danang-01' },
      update: {},
      create: {
        id: 'claim-danang-01',
        userId: sampleUser.id,
        employeeName: sampleUser.fullName,
        travelRequestId: travelReq.id,
        title: 'Thanh quyết toán Vé máy bay & Khách sạn công tác Đà Nẵng',
        category: 'TRAVEL',
        totalAmount: 12850000,
        approvedAmount: 12850000,
        status: 'APPROVED',
        items: [
          { item: 'Vé máy bay Vietnam Airlines SGN - DAD khứ hồi', amount: 4850000, date: '2026-09-01' },
          { item: 'Khách sạn Novotel Danang (4 đêm)', amount: 6000000, date: '2026-09-05' },
          { item: 'Công tác phí lưu trú & di chuyển taxi', amount: 2000000, date: '2026-09-05' },
        ],
      },
    });
  }

  // 8. Training Programs
  const trainProg = await prisma.hrmsTrainingProgram.upsert({
    where: { id: 'train-security-2026' },
    update: {},
    create: {
      id: 'train-security-2026',
      name: 'Khóa Đào tạo: Tiêu chuẩn An toàn Thông tin & ISO 27001 trong Doanh nghiệp',
      trainerName: 'Chuyên gia An ninh Mạng — Viện Công nghệ',
      location: 'Hội trường Tầng 5 & Trực tuyến qua Microsoft Teams',
      startDate: new Date('2026-09-10T09:00:00Z'),
      endDate: new Date('2026-09-11T17:00:00Z'),
      maxParticipants: 50,
      status: 'UPCOMING',
      description: 'Nâng cao nhận thức bảo mật, phòng chống phishing, quản trị phân quyền dữ liệu và tuân thủ quy chuẩn an toàn thông tin.',
    },
  });

  // 9. Grievances
  if (users.length > 1) {
    const user2 = users[1];
    await prisma.hrmsGrievance.upsert({
      where: { id: 'grievance-sample-01' },
      update: {},
      create: {
        id: 'grievance-sample-01',
        userId: user2.id,
        employeeName: user2.fullName,
        subject: 'Đề xuất nâng cấp đường truyền Internet & Thiết bị họp trực tuyến',
        category: 'WORK_ENVIRONMENT',
        description: 'Phòng họp B thường xuyên bị gián đoạn tín hiệu khi tổ chức họp trực tuyến với các chi nhánh, đề xuất IT kiểm tra nâng cấp Router Wifi 6.',
        status: 'RESOLVED',
        resolution: 'Đội ngũ IT đã thay thế bộ phát Access Point chuyên dụng Aruba và bàn giao thiết bị họp trực tuyến Jabra Panacast.',
        resolvedBy: 'Admin IT',
        resolvedAt: new Date(),
      },
    });
  }

  console.log('Frappe HRMS Enterprise Modules seeded successfully!');
}

module.exports = { seedFrappeHrms };

if (require.main === module) {
  seedFrappeHrms()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
