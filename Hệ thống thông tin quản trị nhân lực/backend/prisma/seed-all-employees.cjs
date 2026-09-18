const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const ALL_STAFF = [
  // ==========================================
  // 1. BAN GIÁM ĐỐC (BGD)
  // ==========================================
  { name: 'Trần Minh Hoàng', title: 'Tổng Giám đốc (CEO)', unitCode: 'BGD', salary: 95000000, hire: '2012-05-02', status: 'ACTIVE', phone: '0903112233' },
  { name: 'Lâm Chí Cường', title: 'Phó Tổng Giám đốc — Kinh doanh Quốc tế', unitCode: 'BGD', salary: 75000000, hire: '2014-08-15', status: 'ACTIVE', phone: '0903223344' },
  { name: 'Lê Quốc Tuấn', title: 'Giám đốc Kỹ thuật (CTO)', unitCode: 'BGD', salary: 72000000, hire: '2015-03-20', status: 'ACTIVE', phone: '0903334455' },
  { name: 'Phan Thị Mai Phương', title: 'Giám đốc Tài chính (CFO)', unitCode: 'BGD', salary: 68000000, hire: '2016-02-10', status: 'ACTIVE', phone: '0903445566' },
  { name: 'Hoàng Kim Dung', title: 'Giám đốc Nhân sự (CHRO)', unitCode: 'BGD', salary: 65000000, hire: '2016-01-11', status: 'ACTIVE', phone: '0903556677' },

  // ==========================================
  // 2. BAN TỔ CHỨC – HÀNH CHÍNH – NHÂN SỰ (TC-HC-NS)
  // ==========================================
  { name: 'Nguyễn Thị Mai Hương', title: 'Trưởng ban TC–HC–NS', unitCode: 'TC-HC-NS', salary: 48000000, hire: '2016-06-01', status: 'ACTIVE', phone: '0912111222' },
  { name: 'Trần Đình Trọng', title: 'Phó Ban Quản trị Nhân sự', unitCode: 'TC-HC-NS', salary: 38000000, hire: '2018-04-15', status: 'ACTIVE', phone: '0912222333' },

  // --- HR-1: Tổ Tuyển dụng ---
  { name: 'Nguyễn Thị Mai', title: 'Tổ trưởng Tuyển dụng', unitCode: 'HR-1', salary: 32000000, hire: '2018-06-04', status: 'ACTIVE', phone: '0913111001' },
  { name: 'Võ Thị Thanh Nhàn', title: 'Chuyên viên Tuyển dụng Cao cấp (Senior Recruiter)', unitCode: 'HR-1', salary: 28000000, hire: '2019-03-12', status: 'ACTIVE', phone: '0913111002' },
  { name: 'Đặng Ngọc Lan', title: 'Chuyên viên Thu hút Nhân tài (Tech Talent Acquisition)', unitCode: 'HR-1', salary: 24000000, hire: '2021-02-22', status: 'ACTIVE', phone: '0913111003' },
  { name: 'Phạm Hồng Nhung', title: 'Chuyên viên Tuyển dụng Fresher/Intern', unitCode: 'HR-1', salary: 19000000, hire: '2022-08-15', status: 'ACTIVE', phone: '0913111004' },

  // --- HR-2: Tổ Hồ sơ & Hợp đồng ---
  { name: 'Vũ Thu Trang', title: 'Tổ trưởng Quản lý Hồ sơ & Hợp đồng', unitCode: 'HR-2', salary: 30000000, hire: '2018-09-01', status: 'ACTIVE', phone: '0913222001' },
  { name: 'Hoàng Thị Bích Ngọc', title: 'Chuyên viên Pháp chế Lao động & Hợp đồng', unitCode: 'HR-2', salary: 25000000, hire: '2019-09-09', status: 'ACTIVE', phone: '0913222002' },
  { name: 'Lê Thùy Dương', title: 'Chuyên viên Tiếp nhận Nhân sự (Onboarding Specialist)', unitCode: 'HR-2', salary: 22000000, hire: '2021-05-18', status: 'ACTIVE', phone: '0913222003' },
  { name: 'Nguyễn Đức Thắng', title: 'Chuyên viên Số hóa & Hồ sơ 2C-BNV', unitCode: 'HR-2', salary: 18000000, hire: '2023-02-01', status: 'ACTIVE', phone: '0913222004' },

  // --- HR-3: Tổ Tiền lương – Bảo hiểm (C&B) ---
  { name: 'Phạm Minh Đức', title: 'Tổ trưởng C&B (Total Rewards Lead)', unitCode: 'HR-3', salary: 35000000, hire: '2017-11-27', status: 'ACTIVE', phone: '0913333001' },
  { name: 'Bùi Minh Quân', title: 'Chuyên viên Tính lương & Thuế TNCN', unitCode: 'HR-3', salary: 27000000, hire: '2019-01-10', status: 'ACTIVE', phone: '0913333002' },
  { name: 'Phan Thị Kim Oanh', title: 'Chuyên viên Bảo hiểm Xã hội & Chế độ Phúc lợi', unitCode: 'HR-3', salary: 24000000, hire: '2020-07-06', status: 'ACTIVE', phone: '0913333003' },
  { name: 'Trương Mỹ Linh', title: 'Chuyên viên Đánh giá KPI & Thưởng Hiệu suất', unitCode: 'HR-3', salary: 22000000, hire: '2022-03-14', status: 'ACTIVE', phone: '0913333004' },

  // --- HR-4: Tổ Hành chính – Văn thư ---
  { name: 'Đỗ Văn Thành', title: 'Tổ trưởng Hành chính & Quản trị Tòa nhà', unitCode: 'HR-4', salary: 28000000, hire: '2018-02-01', status: 'ACTIVE', phone: '0913444001' },
  { name: 'Lý Thu Trang', title: 'Chuyên viên Văn thư & Lưu trữ Dấu', unitCode: 'HR-4', salary: 20000000, hire: '2020-04-18', status: 'ACTIVE', phone: '0913444002' },
  { name: 'Nguyễn Thành Trung', title: 'Chuyên viên Mua sắm & Quản lý Tài sản', unitCode: 'HR-4', salary: 21000000, hire: '2021-11-08', status: 'ACTIVE', phone: '0913444003' },
  { name: 'Vũ Thị Thanh Tâm', title: 'Lễ tân & Điều phối Hậu cần Sự kiện', unitCode: 'HR-4', salary: 16000000, hire: '2023-06-12', status: 'ACTIVE', phone: '0913444004' },

  // ==========================================
  // 3. KHỐI CHUYỂN GIAO DỰ ÁN (DELIVERY)
  // ==========================================
  { name: 'Phạm Hoàng Nam', title: 'Giám đốc Vận hành Dự án (Head of Delivery)', unitCode: 'DELIVERY', salary: 65000000, hire: '2015-08-01', status: 'ACTIVE', phone: '0908111999' },
  { name: 'Trần Bích Thủy', title: 'Trưởng ban Quản lý Chất lượng Dự án (PMO Lead)', unitCode: 'DELIVERY', salary: 45000000, hire: '2017-05-15', status: 'ACTIVE', phone: '0908222999' },

  // ==========================================
  // 4. TRUNG TÂM TP.HCM (DEV-SGN)
  // ==========================================
  { name: 'Nguyễn Văn Hùng', title: 'Giám đốc Trung tâm Công nghệ TP.HCM', unitCode: 'DEV-SGN', salary: 58000000, hire: '2015-10-01', status: 'ACTIVE', phone: '0909001001' },
  { name: 'Vũ Quốc Cường', title: 'Phó Giám đốc Kỹ thuật TP.HCM', unitCode: 'DEV-SGN', salary: 50000000, hire: '2017-03-01', status: 'ACTIVE', phone: '0909001002' },

  // --- SQ-S1: Nhóm Java TP.HCM ---
  { name: 'Lê Minh Tuấn', title: 'Trưởng nhóm Kỹ thuật Java (Tech Lead)', unitCode: 'SQ-S1', salary: 45000000, hire: '2018-03-12', status: 'ACTIVE', phone: '0909111001' },
  { name: 'Lê Hoàng Việt', title: 'Kỹ sư Java Cao cấp (Senior Java Engineer)', unitCode: 'SQ-S1', salary: 36000000, hire: '2019-05-20', status: 'ACTIVE', phone: '0909111002' },
  { name: 'Ngô Khánh Duy', title: 'Kỹ sư Java (Java Developer)', unitCode: 'SQ-S1', salary: 27000000, hire: '2021-01-10', status: 'ACTIVE', phone: '0909111003' },
  { name: 'Đoàn Nhật Nam', title: 'Kỹ sư Java (Java Developer)', unitCode: 'SQ-S1', salary: 25000000, hire: '2022-04-15', status: 'ACTIVE', phone: '0909111004' },
  { name: 'Mai Thị Thu Thảo', title: 'Lập trình viên Java (Junior)', unitCode: 'SQ-S1', salary: 18000000, hire: '2023-07-01', status: 'ACTIVE', phone: '0909111005' },

  // --- SQ-S2: Nhóm .NET TP.HCM ---
  { name: 'Trần Văn Hải', title: 'Trưởng nhóm .NET (Tech Lead)', unitCode: 'SQ-S2', salary: 44000000, hire: '2018-07-16', status: 'ACTIVE', phone: '0909222001' },
  { name: 'Đỗ Thị Hồng Nhung', title: 'Kỹ sư .NET Cao cấp (Senior .NET Engineer)', unitCode: 'SQ-S2', salary: 35000000, hire: '2019-08-19', status: 'ACTIVE', phone: '0909222002' },
  { name: 'Cao Minh Đức', title: 'Kỹ sư .NET C# (C# Developer)', unitCode: 'SQ-S2', salary: 26000000, hire: '2021-06-13', status: 'ACTIVE', phone: '0909222003' },
  { name: 'Bùi Tuấn Anh', title: 'Kỹ sư .NET Core & Microservices', unitCode: 'SQ-S2', salary: 28000000, hire: '2022-02-20', status: 'ACTIVE', phone: '0909222004' },

  // --- SQ-S3: Nhóm PHP/NodeJS TP.HCM ---
  { name: 'Dương Văn Tuấn', title: 'Trưởng nhóm Fullstack NodeJS (Lead Developer)', unitCode: 'SQ-S3', salary: 42000000, hire: '2019-04-01', status: 'ACTIVE', phone: '0909333001' },
  { name: 'Vũ Thị Quỳnh Anh', title: 'Kỹ sư Frontend React/Next.js Cao cấp', unitCode: 'SQ-S3', salary: 32000000, hire: '2020-09-06', status: 'ACTIVE', phone: '0909333002' },
  { name: 'Nguyễn Tấn Đạt', title: 'Kỹ sư Backend NodeJS & GraphQL', unitCode: 'SQ-S3', salary: 27000000, hire: '2021-10-15', status: 'ACTIVE', phone: '0909333003' },
  { name: 'Hoàng Quốc Việt', title: 'Kỹ sư Web PHP/Laravel', unitCode: 'SQ-S3', salary: 24000000, hire: '2022-08-22', status: 'ACTIVE', phone: '0909333004' },

  // --- SQ-S4: Nhóm Ứng dụng di động TP.HCM ---
  { name: 'Tạ Quốc Bảo', title: 'Trưởng nhóm Mobile App (Lead Mobile)', unitCode: 'SQ-S4', salary: 43000000, hire: '2019-02-15', status: 'ACTIVE', phone: '0909444001' },
  { name: 'Nguyễn Đình Hưng', title: 'Kỹ sư Flutter/iOS Cao cấp', unitCode: 'SQ-S4', salary: 33000000, hire: '2020-11-20', status: 'ACTIVE', phone: '0909444002' },
  { name: 'Lê Thị Thu Cúc', title: 'Kỹ sư React Native (Mobile Dev)', unitCode: 'SQ-S4', salary: 26000000, hire: '2022-03-01', status: 'ACTIVE', phone: '0909444003' },

  // --- SQ-S5: Nhóm Kiểm thử TP.HCM ---
  { name: 'Nguyễn Thị Bích', title: 'Trưởng nhóm Đảm bảo Chất lượng (QA/QC Lead)', unitCode: 'SQ-S5', salary: 38000000, hire: '2018-10-01', status: 'ACTIVE', phone: '0909555001' },
  { name: 'Châu Thị Mỹ Linh', title: 'Kỹ sư Kiểm thử Tự động (Senior Automation QA)', unitCode: 'SQ-S5', salary: 30000000, hire: '2020-10-05', status: 'ACTIVE', phone: '0909555002' },
  { name: 'Trần Thảo Ly', title: 'Kiểm thử viên Chức năng (Manual QA)', unitCode: 'SQ-S5', salary: 21000000, hire: '2022-05-10', status: 'ACTIVE', phone: '0909555003' },
  { name: 'Phan Bảo Trân', title: 'Kiểm thử viên Hiệu năng & Bảo mật (Security QA)', unitCode: 'SQ-S5', salary: 25000000, hire: '2023-01-15', status: 'ACTIVE', phone: '0909555004' },

  // --- SQ-S6: Nhóm DevOps TP.HCM ---
  { name: 'Hồ Trọng Nghĩa', title: 'Trưởng nhóm Hạ tầng & Cloud (DevOps Lead)', unitCode: 'SQ-S6', salary: 48000000, hire: '2018-05-07', status: 'ACTIVE', phone: '0909666001' },
  { name: 'Lâm Văn Khoa', title: 'Kỹ sư Kubernetes & SRE', unitCode: 'SQ-S6', salary: 36000000, hire: '2020-02-17', status: 'ACTIVE', phone: '0909666002' },
  { name: 'Đỗ Trọng Hiếu', title: 'Kỹ sư CI/CD & An toàn Đám mây (DevSecOps)', unitCode: 'SQ-S6', salary: 32000000, hire: '2021-12-01', status: 'ACTIVE', phone: '0909666003' },

  // ==========================================
  // 5. TRUNG TÂM ĐÀ NẴNG (DEV-DAD)
  // ==========================================
  { name: 'Trần Văn Lộc', title: 'Giám đốc Chi nhánh Trung tâm Đà Nẵng', unitCode: 'DEV-DAD', salary: 55000000, hire: '2018-11-18', status: 'ACTIVE', phone: '0935001001' },
  { name: 'Phan Thanh Hải', title: 'Phó Giám đốc Phụ trách Kỹ thuật (Đà Nẵng)', unitCode: 'DEV-DAD', salary: 48000000, hire: '2019-06-01', status: 'ACTIVE', phone: '0935001002' },

  // --- SQ-D1: Nhóm Java Đà Nẵng ---
  { name: 'Đinh Bá Long', title: 'Trưởng nhóm Java Đà Nẵng (Tech Lead)', unitCode: 'SQ-D1', salary: 38000000, hire: '2020-03-28', status: 'ACTIVE', phone: '0935111001' },
  { name: 'Nguyễn Văn Quang', title: 'Kỹ sư Java Spring Boot Cao cấp', unitCode: 'SQ-D1', salary: 30000000, hire: '2021-04-12', status: 'ACTIVE', phone: '0935111002' },
  { name: 'Lê Hữu Phước', title: 'Kỹ sư Java Backend', unitCode: 'SQ-D1', salary: 23000000, hire: '2022-09-05', status: 'ACTIVE', phone: '0935111003' },

  // --- SQ-D2: Nhóm .NET Đà Nẵng ---
  { name: 'Phan Minh Hoàng', title: 'Trưởng nhóm .NET Đà Nẵng (Tech Lead)', unitCode: 'SQ-D2', salary: 38000000, hire: '2020-02-15', status: 'ACTIVE', phone: '0935222001' },
  { name: 'Trần Công Thành', title: 'Kỹ sư C# .NET Core', unitCode: 'SQ-D2', salary: 27000000, hire: '2021-08-20', status: 'ACTIVE', phone: '0935222002' },
  { name: 'Võ Thành Đạt', title: 'Kỹ sư Fullstack .NET + Angular', unitCode: 'SQ-D2', salary: 25000000, hire: '2022-11-10', status: 'ACTIVE', phone: '0935222003' },

  // --- SQ-D3: Nhóm PHP/NodeJS Đà Nẵng ---
  { name: 'Nguyễn Thị Hồng Nhung', title: 'Trưởng nhóm Web & Node (Lead Developer)', unitCode: 'SQ-D3', salary: 40000000, hire: '2020-01-06', status: 'ACTIVE', phone: '0935333001' },
  { name: 'Phạm Công Danh', title: 'Kỹ sư Fullstack Node.js / React', unitCode: 'SQ-D3', salary: 28000000, hire: '2021-05-03', status: 'ACTIVE', phone: '0935333002' },
  { name: 'Huỳnh Thị Cẩm Tiên', title: 'Kỹ sư Frontend Vue.js / Tailwind', unitCode: 'SQ-D3', salary: 25000000, hire: '2021-10-11', status: 'ACTIVE', phone: '0935333003' },
  { name: 'Võ Tấn Phát', title: 'Lập trình viên NodeJS (Junior)', unitCode: 'SQ-D3', salary: 18000000, hire: '2023-08-03', status: 'ACTIVE', phone: '0935333004' },

  // --- SQ-D4: Nhóm Ứng dụng di động Đà Nẵng ---
  { name: 'Trịnh Công Sáng', title: 'Trưởng nhóm Mobile Đà Nẵng (Mobile Lead)', unitCode: 'SQ-D4', salary: 38000000, hire: '2020-09-19', status: 'ACTIVE', phone: '0935444001' },
  { name: 'Hoàng Văn Phúc', title: 'Kỹ sư iOS Swift', unitCode: 'SQ-D4', salary: 27000000, hire: '2021-12-05', status: 'ACTIVE', phone: '0935444002' },
  { name: 'Đoàn Thị Yến', title: 'Kỹ sư Android Kotlin', unitCode: 'SQ-D4', salary: 25000000, hire: '2022-07-18', status: 'ACTIVE', phone: '0935444003' },

  // --- SQ-D5: Nhóm Kiểm thử Đà Nẵng ---
  { name: 'Ngô Thị Yến Nhi', title: 'Trưởng nhóm QA Đà Nẵng (QA Lead)', unitCode: 'SQ-D5', salary: 34000000, hire: '2020-04-15', status: 'ACTIVE', phone: '0935555001' },
  { name: 'Nguyễn Thị Thu Hà', title: 'Kiểm thử viên Tự động (Automation QA)', unitCode: 'SQ-D5', salary: 26000000, hire: '2021-09-01', status: 'ACTIVE', phone: '0935555002' },
  { name: 'Lê Văn Khải', title: 'Kiểm thử viên Thủ công (Manual QA)', unitCode: 'SQ-D5', salary: 20000000, hire: '2023-01-09', status: 'ACTIVE', phone: '0935555003' },

  // --- SQ-D6: Nhóm DevOps Đà Nẵng ---
  { name: 'Lâm Văn Phi', title: 'Trưởng nhóm DevOps Đà Nẵng (DevOps Lead)', unitCode: 'SQ-D6', salary: 42000000, hire: '2020-03-15', status: 'ACTIVE', phone: '0935666001' },
  { name: 'Trần Hữu Thắng', title: 'Kỹ sư Hạ tầng Cloud AWS/GCP', unitCode: 'SQ-D6', salary: 30000000, hire: '2022-01-10', status: 'ACTIVE', phone: '0935666002' },
];

function transliterate(name) {
  const map = {
    à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a', â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩ: 'a', ẫ: 'a',
    ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a', è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
    ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e', ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
    ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o', ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o',
    ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o', ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u',
    ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u', ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
    đ: 'd',
  };
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.split('').map((c) => map[c] ?? c).join(''))
    .join('.');
}

async function seedAll() {
  console.log('Seeding full enterprise personnel tree across all 21 units...');

  const units = await prisma.orgUnit.findMany();
  const unitMap = new Map();
  for (const u of units) {
    unitMap.set(u.code, u.id);
  }

  const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
  const year = new Date().getFullYear();

  let count = 0;
  for (const [idx, s] of ALL_STAFF.entries()) {
    const email = `${transliterate(s.name)}.${idx + 1}@saigontechnology.vn`;
    const unitId = unitMap.get(s.unitCode) || null;
    const employeeCode = `NV${String(idx + 1).padStart(4, '0')}`;

    // Upsert User
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { fullName: s.name },
          { employeeCode },
        ],
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: s.name,
          jobTitle: s.title,
          orgUnitId: unitId,
          baseSalary: s.salary,
          employmentStatus: s.status,
          phone: s.phone,
        },
      });
    } else {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: bcrypt.hashSync('Nhanvien@123', 10),
          fullName: s.name,
          jobTitle: s.title,
          employeeCode,
          orgUnitId: unitId,
          hireDate: new Date(s.hire),
          employmentStatus: s.status,
          baseSalary: s.salary,
          phone: s.phone,
          roles: userRole ? { create: [{ roleCode: 'USER' }] } : undefined,
        },
      });

      await prisma.leaveBalance.upsert({
        where: { userId_year: { userId: user.id, year } },
        create: { userId: user.id, year, entitled: 14 },
        update: {},
      });
    }
    count++;
  }

  console.log(`Successfully seeded/updated ${count} employees across all 21 organizational units!`);
}

module.exports = { seedAll, ALL_STAFF };

if (require.main === module) {
  seedAll()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
