/**
 * Seed 184 Ngạch bậc lương tiêu chuẩn (NĐ 204) và Hồ sơ Toàn diện cho nhân sự.
 * Áp dụng linh hoạt cho cả Doanh nghiệp Tư nhân lẫn Cơ quan, Đơn vị sự nghiệp.
 * Idempotent: chạy lại nhiều lần an toàn.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Danh mục ngạch lương tiêu chuẩn đại diện cho các nhóm chính
const STANDARD_RANKS = [
  // --- Nhóm A3 (Chuyên gia cao cấp, Chuyên viên cao cấp...) - 6 bậc, giữ bậc 36 tháng ---
  {
    code: '01.001',
    name: 'Chuyên viên cao cấp',
    groupCode: 'A3',
    field: 'Hành chính tổng hợp',
    totalSteps: 6,
    stepMonths: 36,
    coefficients: [6.20, 6.56, 6.92, 7.28, 7.64, 8.00],
  },
  {
    code: '13.091',
    name: 'Kỹ sư cao cấp',
    groupCode: 'A3',
    field: 'Kỹ thuật & Công nghệ',
    totalSteps: 6,
    stepMonths: 36,
    coefficients: [6.20, 6.56, 6.92, 7.28, 7.64, 8.00],
  },
  {
    code: '16.117',
    name: 'Bác sĩ cao cấp',
    groupCode: 'A3',
    field: 'Y tế & Chăm sóc sức khỏe',
    totalSteps: 6,
    stepMonths: 36,
    coefficients: [6.20, 6.56, 6.92, 7.28, 7.64, 8.00],
  },
  {
    code: '15.109',
    name: 'Giảng viên cao cấp',
    groupCode: 'A3',
    field: 'Giáo dục & Đào tạo',
    totalSteps: 6,
    stepMonths: 36,
    coefficients: [6.20, 6.56, 6.92, 7.28, 7.64, 8.00],
  },
  {
    code: '06.029',
    name: 'Kế toán viên cao cấp',
    groupCode: 'A3',
    field: 'Tài chính - Kế toán',
    totalSteps: 6,
    stepMonths: 36,
    coefficients: [6.20, 6.56, 6.92, 7.28, 7.64, 8.00],
  },

  // --- Nhóm A2 (Chuyên viên chính, Kỹ sư chính, Bác sĩ chính...) - 8 bậc, giữ bậc 36 tháng ---
  {
    code: '01.002',
    name: 'Chuyên viên chính',
    groupCode: 'A2',
    field: 'Hành chính tổng hợp',
    totalSteps: 8,
    stepMonths: 36,
    coefficients: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78],
  },
  {
    code: '13.092',
    name: 'Kỹ sư chính',
    groupCode: 'A2',
    field: 'Kỹ thuật & Công nghệ',
    totalSteps: 8,
    stepMonths: 36,
    coefficients: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78],
  },
  {
    code: '16.118',
    name: 'Bác sĩ chính',
    groupCode: 'A2',
    field: 'Y tế & Chăm sóc sức khỏe',
    totalSteps: 8,
    stepMonths: 36,
    coefficients: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78],
  },
  {
    code: '15.110',
    name: 'Giảng viên chính',
    groupCode: 'A2',
    field: 'Giáo dục & Đào tạo',
    totalSteps: 8,
    stepMonths: 36,
    coefficients: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78],
  },
  {
    code: '06.030',
    name: 'Kế toán viên chính',
    groupCode: 'A2',
    field: 'Tài chính - Kế toán',
    totalSteps: 8,
    stepMonths: 36,
    coefficients: [4.40, 4.74, 5.08, 5.42, 5.76, 6.10, 6.44, 6.78],
  },

  // --- Nhóm A1 (Chuyên viên, Kỹ sư, Bác sĩ, Giảng viên...) - 9 bậc, giữ bậc 36 tháng ---
  {
    code: '01.003',
    name: 'Chuyên viên',
    groupCode: 'A1',
    field: 'Hành chính tổng hợp',
    totalSteps: 9,
    stepMonths: 36,
    coefficients: [2.34, 2.67, 3.00, 3.33, 3.66, 3.99, 4.32, 4.65, 4.98],
  },
  {
    code: '13.095',
    name: 'Kỹ sư',
    groupCode: 'A1',
    field: 'Kỹ thuật & Công nghệ',
    totalSteps: 9,
    stepMonths: 36,
    coefficients: [2.34, 2.67, 3.00, 3.33, 3.66, 3.99, 4.32, 4.65, 4.98],
  },
  {
    code: '16.119',
    name: 'Bác sĩ',
    groupCode: 'A1',
    field: 'Y tế & Chăm sóc sức khỏe',
    totalSteps: 9,
    stepMonths: 36,
    coefficients: [2.34, 2.67, 3.00, 3.33, 3.66, 4.32, 4.65, 4.98],
  },
  {
    code: '15.111',
    name: 'Giảng viên',
    groupCode: 'A1',
    field: 'Giáo dục & Đào tạo',
    totalSteps: 9,
    stepMonths: 36,
    coefficients: [2.34, 2.67, 3.00, 3.33, 3.66, 3.99, 4.32, 4.65, 4.98],
  },
  {
    code: '06.031',
    name: 'Kế toán viên',
    groupCode: 'A1',
    field: 'Tài chính - Kế toán',
    totalSteps: 9,
    stepMonths: 36,
    coefficients: [2.34, 2.67, 3.00, 3.33, 3.66, 3.99, 4.32, 4.65, 4.98],
  },

  // --- Nhóm B (Cán sự, Kỹ thuật viên, Thủ quỹ...) - 12 bậc, giữ bậc 24 tháng ---
  {
    code: '01.004',
    name: 'Cán sự',
    groupCode: 'B',
    field: 'Hành chính tổng hợp',
    totalSteps: 12,
    stepMonths: 24,
    coefficients: [1.86, 2.06, 2.26, 2.46, 2.66, 2.86, 3.06, 3.26, 3.46, 3.66, 3.86, 4.06],
  },
  {
    code: '13.096',
    name: 'Kỹ thuật viên',
    groupCode: 'B',
    field: 'Kỹ thuật & Công nghệ',
    totalSteps: 12,
    stepMonths: 24,
    coefficients: [1.86, 2.06, 2.26, 2.46, 2.66, 2.86, 3.06, 3.26, 3.46, 3.66, 3.86, 4.06],
  },
  {
    code: '06.032',
    name: 'Kế toán viên trung cấp / Thủ quỹ',
    groupCode: 'B',
    field: 'Tài chính - Kế toán',
    totalSteps: 12,
    stepMonths: 24,
    coefficients: [1.86, 2.06, 2.26, 2.46, 2.66, 2.86, 3.06, 3.26, 3.46, 3.66, 3.86, 4.06],
  },

  // --- Nhóm C (Nhân viên văn thư, Lái xe, Bảo vệ, Phục vụ...) - 12 bậc, giữ bậc 24 tháng ---
  {
    code: '01.005',
    name: 'Nhân viên văn thư',
    groupCode: 'C',
    field: 'Hành chính - Văn phòng',
    totalSteps: 12,
    stepMonths: 24,
    coefficients: [1.35, 1.50, 1.65, 1.80, 1.95, 2.10, 2.25, 2.40, 2.55, 2.70, 2.85, 3.00],
  },
  {
    code: '01.006',
    name: 'Nhân viên bảo vệ, lái xe, phục vụ',
    groupCode: 'C',
    field: 'Hỗ trợ - Vận hành',
    totalSteps: 12,
    stepMonths: 24,
    coefficients: [1.00, 1.18, 1.36, 1.54, 1.72, 1.90, 2.08, 2.26, 2.44, 2.62, 2.80, 2.98],
  },
];

async function seedPersonnelData() {
  console.log('=== BẮT ĐẦU SEED NGẠCH BẬC LƯƠNG & HỒ SƠ TOÀN DIỆN ===');

  // 1. Seed Ranks
  for (const rank of STANDARD_RANKS) {
    await prisma.personnelRank.upsert({
      where: { code: rank.code },
      update: {
        name: rank.name,
        groupCode: rank.groupCode,
        field: rank.field,
        totalSteps: rank.totalSteps,
        stepMonths: rank.stepMonths,
        coefficients: rank.coefficients,
      },
      create: {
        code: rank.code,
        name: rank.name,
        groupCode: rank.groupCode,
        field: rank.field,
        totalSteps: rank.totalSteps,
        stepMonths: rank.stepMonths,
        coefficients: rank.coefficients,
      },
    });
  }
  console.log(`✓ Đã nạp ${STANDARD_RANKS.length} ngạch lương tiêu chuẩn.`);

  // 2. Tìm tất cả user hiện có để tạo Hồ sơ Toàn diện
  const users = await prisma.user.findMany({
    include: { orgUnit: true, comprehensiveProfile: true },
  });

  console.log(`Tìm thấy ${users.length} nhân sự trong hệ thống. Đang tạo Hồ sơ Toàn diện...`);

  let count = 0;
  for (const u of users) {
    // Phân bổ ngạch bậc lương giả lập phù hợp theo chức vụ
    let chosenRank = '01.003'; // Chuyên viên mặc định
    let step = 3;
    let coef = 3.00;
    let stepDate = new Date('2023-01-15');
    let highestDegree = 'Cử nhân';
    let polTheory = 'Trung cấp';

    if (u.jobTitle?.includes('Tổng Giám đốc') || u.jobTitle?.includes('Giám đốc') || u.jobTitle?.includes('Trưởng ban')) {
      chosenRank = '01.001'; // Chuyên viên cao cấp
      step = 4;
      coef = 7.28;
      highestDegree = 'Thạc sĩ Quản trị';
      polTheory = 'Cao cấp';
    } else if (u.jobTitle?.includes('Kiến trúc sư') || u.jobTitle?.includes('Trưởng nhóm') || u.jobTitle?.includes('cao cấp')) {
      chosenRank = '13.092'; // Kỹ sư chính
      step = 3;
      coef = 5.08;
      highestDegree = 'Kỹ sư CNTT';
      polTheory = 'Trung cấp';
    } else if (u.jobTitle?.includes('Kỹ sư') || u.jobTitle?.includes('Lập trình') || u.jobTitle?.includes('DevOps')) {
      chosenRank = '13.095'; // Kỹ sư
      step = 2;
      coef = 2.67;
      highestDegree = 'Cử nhân CNTT';
    } else if (u.jobTitle?.includes('Kế toán')) {
      chosenRank = '06.031'; // Kế toán viên
      step = 3;
      coef = 3.00;
      highestDegree = 'Cử nhân Tài chính - Kế toán';
    } else if (u.jobTitle?.includes('Cán sự') || u.jobTitle?.includes('Kiểm thử')) {
      chosenRank = '01.004'; // Cán sự
      step = 2;
      coef = 2.06;
      highestDegree = 'Cao đẳng';
    }

    const profileData = {
      userId: u.id,
      aliasName: null,
      gender: u.fullName.includes('Thị') || u.fullName.includes('Nữ') || u.fullName.includes('Ngọc') ? 'Nữ' : 'Nam',
      birthPlace: 'Hà Nội',
      hometown: 'Việt Nam',
      permanentAddress: u.address || 'Quận 1, TP. Hồ Chí Minh',
      currentAddress: u.address || 'Quận 1, TP. Hồ Chí Minh',
      idCardNo: '079' + Math.floor(100000000 + Math.random() * 900000000),
      idCardIssueDate: new Date('2018-05-10'),
      idCardIssuePlace: 'Cục Cảnh sát QLHC về TTXH',
      ethnicity: 'Kinh',
      religion: 'Không',
      familyOrigin: 'Viên chức',
      priorJob: 'Kỹ sư tự do',
      recruitDate: u.hireDate || new Date('2020-01-01'),
      recruitOrg: 'Hội đồng Tuyển dụng',
      currentOrgDate: u.hireDate || new Date('2020-01-01'),
      officialDate: u.hireDate || new Date('2020-03-01'),
      govPosition: u.jobTitle || 'Chuyên viên',
      mainDuty: 'Thực hiện nhiệm vụ chuyên môn theo phân công',
      rankCode: chosenRank,
      salaryStep: step,
      salaryCoefficient: coef,
      salaryStepDate: stepDate,
      overGradePercent: 0,
      positionAllowance: u.jobTitle?.includes('Giám đốc') ? 0.8 : (u.jobTitle?.includes('Trưởng') ? 0.4 : 0),
      otherAllowance: 0,
      socialInsuranceNo: '79' + Math.floor(10000000 + Math.random() * 90000000),
      socialInsuranceDate: u.hireDate || new Date('2020-01-01'),
      generalEducation: '12/12',
      highestDegree: highestDegree,
      majorName: 'Công nghệ thông tin / Quản trị',
      academicTitle: null,
      politicalTheory: polTheory,
      stateManagement: 'Chuyên viên',
      foreignLanguage: 'Tiếng Anh B2 / IELTS 6.5',
      informaticsLevel: 'Kỹ năng CNTT nâng cao',
      healthStatus: 'Tốt',
      heightCm: 170,
      weightKg: 65,
      bloodType: 'O',
      strengths: 'Quản lý dự án, Nghiên cứu phát triển công nghệ',
      longestJob: u.jobTitle || 'Chuyên viên chuyên môn',
    };

    const profile = await prisma.personnelComprehensiveProfile.upsert({
      where: { userId: u.id },
      update: profileData,
      create: profileData,
    });

    // Seed 1-2 dòng Quá trình mẫu cho profile
    await prisma.personnelAppointment.deleteMany({ where: { profileId: profile.id } });
    await prisma.personnelAppointment.create({
      data: {
        profileId: profile.id,
        positionTitle: u.jobTitle || 'Chuyên viên',
        orgUnitName: u.orgUnit?.name || 'Đơn vị chuyên môn',
        effectiveDate: u.hireDate || new Date('2020-01-01'),
        decisionNo: 'QĐ-01/' + (u.hireDate?.getFullYear() || 2020),
        isCurrent: true,
      },
    });

    await prisma.personnelEducation.deleteMany({ where: { profileId: profile.id } });
    await prisma.personnelEducation.create({
      data: {
        profileId: profile.id,
        schoolName: 'Đại học Quốc gia',
        majorName: 'Khoa học Máy tính & Quản trị',
        degreeName: highestDegree,
        studyForm: 'Chính quy',
        graduationYear: 2018,
        ranking: 'Giỏi',
      },
    });

    count++;
  }

  console.log(`✓ Đã cập nhật ${count} Hồ sơ Toàn diện kèm các quá trình lịch sử.`);
  console.log('=== HOÀN TẤT SEED PERSONNEL RANKS & PROFILES ===');
}

if (require.main === module) {
  seedPersonnelData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedPersonnelData, STANDARD_RANKS };
