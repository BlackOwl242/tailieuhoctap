/**
 * Seed dữ liệu nhân viên DEMO thực tế — 42 nhân viên tên Việt, đa phòng ban.
 * - Idempotent: chạy lại không trùng (upsert theo email);
 * - Chạy standalone:  node prisma/seed-employees.cjs  (cần DATABASE_URL)
 * - Được seed.cjs gọi khi DB rỗng.
 */
const EMPLOYEES = [
  // --- Ban Giám đốc ---
  { name: 'Phạm Thanh', title: 'Tổng Giám đốc', unit: 'Ban Giám đốc', salary: 85000000, hire: '2012-05-02', status: 'ACTIVE' },
  { name: 'Lâm Chí Cường', title: 'Phó Tổng Giám đốc — Kinh doanh quốc tế', unit: 'Ban Giám đốc', salary: 65000000, hire: '2014-08-15', status: 'ACTIVE' },
  { name: 'Trần Đức Thịnh', title: 'Phó Tổng Giám đốc — Vận hành', unit: 'Ban Giám đốc', salary: 62000000, hire: '2015-03-20', status: 'ACTIVE' },
  // --- Ban Tổ chức – Hành chính – Nhân sự ---
  { name: 'Nguyễn Thị Mai Hương', title: 'Trưởng ban TC–HC–NS', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 45000000, hire: '2016-01-11', status: 'ACTIVE' },
  { name: 'Võ Thị Thanh Nhàn', title: 'Chuyên viên tuyển dụng cao cấp', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 28000000, hire: '2018-06-04', status: 'ACTIVE' },
  { name: 'Đặng Ngọc Lan', title: 'Chuyên viên tuyển dụng', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 22000000, hire: '2021-02-22', status: 'ACTIVE' },
  { name: 'Hoàng Thị Bích Ngọc', title: 'Chuyên viên hồ sơ và hợp đồng', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 24000000, hire: '2019-09-09', status: 'ACTIVE' },
  { name: 'Bùi Minh Quân', title: 'Chuyên viên tiền lương – bảo hiểm', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 26000000, hire: '2017-11-27', status: 'ACTIVE' },
  { name: 'Lý Thu Trang', title: 'Chuyên viên hành chính – văn thư', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 18000000, hire: '2022-04-18', status: 'ACTIVE' },
  { name: 'Phan Thị Kim Oanh', title: 'Chuyên viên chế độ – phúc lợi', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 23000000, hire: '2020-07-06', status: 'ACTIVE' },
  // --- Trung tâm TP.HCM ---
  { name: 'Nguyễn Văn Hùng', title: 'Giám đốc trung tâm TP.HCM', unit: 'Trung tâm TP.HCM', salary: 55000000, hire: '2015-10-01', status: 'ACTIVE' },
  { name: 'Trương Thanh Tùng', title: 'Trưởng nhóm Java', unit: 'Trung tâm TP.HCM', salary: 42000000, hire: '2018-03-12', status: 'ACTIVE' },
  { name: 'Lê Hoàng Việt', title: 'Lập trình viên Java cao cấp', unit: 'Trung tâm TP.HCM', salary: 35000000, hire: '2019-05-20', status: 'ACTIVE' },
  { name: 'Ngô Khánh Duy', title: 'Lập trình viên Java', unit: 'Trung tâm TP.HCM', salary: 26000000, hire: '2022-01-10', status: 'ACTIVE' },
  { name: 'Đỗ Thị Hồng Nhung', title: 'Lập trình viên .NET cao cấp', unit: 'Trung tâm TP.HCM', salary: 34000000, hire: '2019-08-19', status: 'ACTIVE' },
  { name: 'Cao Minh Đức', title: 'Lập trình viên .NET', unit: 'Trung tâm TP.HCM', salary: 25000000, hire: '2022-06-13', status: 'ACTIVE' },
  { name: 'Vũ Thị Quỳnh Anh', title: 'Lập trình viên ReactJS', unit: 'Trung tâm TP.HCM', salary: 27000000, hire: '2021-09-06', status: 'ACTIVE' },
  { name: 'Hồ Trọng Nghĩa', title: 'Kỹ sư DevOps', unit: 'Trung tâm TP.HCM', salary: 38000000, hire: '2020-02-17', status: 'ACTIVE' },
  { name: 'Châu Thị Mỹ Linh', title: 'Kiểm thử viên cao cấp', unit: 'Trung tâm TP.HCM', salary: 28000000, hire: '2020-10-05', status: 'ACTIVE' },
  { name: 'Tạ Quốc Bảo', title: 'Lập trình viên Flutter', unit: 'Trung tâm TP.HCM', salary: 29000000, hire: '2021-12-01', status: 'ACTIVE' },
  { name: 'Dương Văn Tuấn', title: 'Lập trình viên NodeJS', unit: 'Trung tâm TP.HCM', salary: 26000000, hire: '2022-08-22', status: 'ACTIVE' },
  { name: 'Mai Thị Thu Thảo', title: 'Lập trình viên Java (thử việc)', unit: 'Trung tâm TP.HCM', salary: 14000000, hire: '2026-07-01', status: 'PROBATION' },
  // --- Trung tâm Đà Nẵng ---
  { name: 'Trần Văn Lộc', title: 'Giám đốc trung tâm Đà Nẵng', unit: 'Trung tâm Đà Nẵng', salary: 52000000, hire: '2019-11-18', status: 'ACTIVE' },
  { name: 'Nguyễn Thị Hồng Nhung', title: 'Trưởng nhóm PHP/NodeJS', unit: 'Trung tâm Đà Nẵng', salary: 40000000, hire: '2020-01-06', status: 'ACTIVE' },
  { name: 'Phạm Công Danh', title: 'Lập trình viên PHP', unit: 'Trung tâm Đà Nẵng', salary: 24000000, hire: '2021-05-03', status: 'ACTIVE' },
  { name: 'Huỳnh Thị Cẩm Tiên', title: 'Lập trình viên ReactJS', unit: 'Trung tâm Đà Nẵng', salary: 26000000, hire: '2021-10-11', status: 'ACTIVE' },
  { name: 'Lâm Văn Phi', title: 'Kỹ sư DevOps', unit: 'Trung tâm Đà Nẵng', salary: 36000000, hire: '2021-03-15', status: 'ACTIVE' },
  { name: 'Đinh Bá Long', title: 'Lập trình viên Java', unit: 'Trung tâm Đà Nẵng', salary: 25000000, hire: '2022-03-28', status: 'ACTIVE' },
  { name: 'Ngô Thị Yến Nhi', title: 'Kiểm thử viên', unit: 'Trung tâm Đà Nẵng', salary: 20000000, hire: '2023-01-09', status: 'ACTIVE' },
  { name: 'Trịnh Công Sáng', title: 'Lập trình viên Flutter', unit: 'Trung tâm Đà Nẵng', salary: 28000000, hire: '2022-09-19', status: 'ACTIVE' },
  { name: 'Võ Tấn Phát', title: 'Lập trình viên NodeJS (thử việc)', unit: 'Trung tâm Đà Nẵng', salary: 13500000, hire: '2026-08-03', status: 'PROBATION' },
  // --- Khối Kinh doanh & Marketing ---
  { name: 'Lý Tuấn Kiệt', title: 'Giám đốc kinh doanh', unit: 'Kinh doanh & Marketing', salary: 48000000, hire: '2016-04-25', status: 'ACTIVE' },
  { name: 'Đặng Thị Mỹ Duyên', title: 'Quản lý tài khoản khách hàng', unit: 'Kinh doanh & Marketing', salary: 32000000, hire: '2019-02-14', status: 'ACTIVE' },
  { name: 'Hà Văn Thịnh', title: 'Chuyên viên tư vấn giải pháp (presale)', unit: 'Kinh doanh & Marketing', salary: 30000000, hire: '2020-08-31', status: 'ACTIVE' },
  { name: 'Tôn Nữ Bảo Trân', title: 'Chuyên viên marketing', unit: 'Kinh doanh & Marketing', salary: 22000000, hire: '2022-05-16', status: 'ACTIVE' },
  // --- Khối Công nghệ & Hạ tầng nội bộ ---
  { name: 'Trần Quốc Huy', title: 'Kiến trúc sư giải pháp trưởng', unit: 'Công nghệ & Hạ tầng', salary: 50000000, hire: '2017-06-19', status: 'ACTIVE' },
  { name: 'Nguyễn Văn Thịnh', title: 'Kỹ sư hạ tầng nội bộ', unit: 'Công nghệ & Hạ tầng', salary: 28000000, hire: '2020-09-07', status: 'ACTIVE' },
  { name: 'Lê Thị Ngọc Diệp', title: 'Kỹ sư R&D trí tuệ nhân tạo', unit: 'Công nghệ & Hạ tầng', salary: 40000000, hire: '2021-07-26', status: 'ACTIVE' },
  // --- Phòng Tài chính – Kế toán ---
  { name: 'Nguyễn Thị Hồng Vân', title: 'Kế toán trưởng', unit: 'Tài chính – Kế toán', salary: 42000000, hire: '2016-10-03', status: 'ACTIVE' },
  { name: 'Trương Thị Kim Anh', title: 'Kế toán tiền lương', unit: 'Tài chính – Kế toán', salary: 26000000, hire: '2019-12-09', status: 'ACTIVE' },
  { name: 'Phạm Thị Diệu Thúy', title: 'Kế toán bảo hiểm xã hội', unit: 'Tài chính – Kế toán', salary: 24000000, hire: '2021-04-12', status: 'ACTIVE' },
  // --- Nghỉ hưu / thôi việc (minh họa vòng đời) ---
  { name: 'Nguyễn Văn Kính', title: 'Cố vấn kỹ thuật (nghỉ hưu)', unit: 'Ban Giám đốc', salary: 0, hire: '2013-01-14', status: 'RETIRED' },
  { name: 'Ông Thị Bốn', title: 'Nhân viên hành chính (đã thôi việc)', unit: 'Ban Tổ chức – Hành chính – Nhân sự', salary: 0, hire: '2018-08-08', status: 'RESIGNED' },
];

/** Khớp đơn vị theo số từ trùng giữa nhãn nhân viên và tên đơn vị trong DB. */
function findUnit(units, label) {
  const words = (s) => s.toLowerCase().split(/[^a-zà-ỹ0-9.]+/i).filter((w) => w.length > 2);
  const lw = words(label);
  let best = null;
  let bestScore = 0;
  for (const u of units) {
    const uw = words(u.name);
    const score = uw.filter((w) => lw.some((x) => x.includes(w) || w.includes(x))).length;
    if (score > bestScore) { best = u; bestScore = score; }
  }
  return best;
}

async function seedEmployees(prisma, hashOf) {
  const units = await prisma.orgUnit.findMany();
  const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
  const year = new Date().getFullYear();
  let created = 0;
  let skipped = 0;

  for (const [i, e] of EMPLOYEES.entries()) {
    const email = `${transliterate(e.name)}@saigontechnology.vn`;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) { skipped += 1; continue; }

    const unit = findUnit(units, e.unit);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashOf('Nhanvien@123'),
        fullName: e.name,
        jobTitle: e.title,
        orgUnitId: unit?.id ?? null,
        employeeCode: `NV${String(i + 6).padStart(4, '0')}`,
        hireDate: new Date(e.hire),
        employmentStatus: e.status,
        baseSalary: e.salary > 0 ? e.salary : null,
        phone: `09${String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8)}`,
        roles: userRole ? { create: [{ roleCode: 'USER' }] } : undefined,
      },
    });
    await prisma.leaveBalance.upsert({
      where: { userId_year: { userId: user.id, year } },
      create: { userId: user.id, year, entitled: 12 + Math.floor((Date.now() - new Date(e.hire).getTime()) / (5 * 365.25 * 86400000)) },
      update: {},
    });
    created += 1;
  }
  return { created, skipped };
}

/** Chuyển "Nguyễn Văn Hùng" → "nguyen.van.hung" cho email công ty. */
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

module.exports = { seedEmployees, EMPLOYEES };

// Chạy standalone: node prisma/seed-employees.cjs
if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  seedEmployees(prisma, (pw) => bcrypt.hashSync(pw, 10))
    .then(({ created, skipped }) => {
      console.log(`[seed-employees] tạo mới ${created}, bỏ qua (đã có) ${skipped}, tổng danh sách ${EMPLOYEES.length}`);
    })
    .catch((err) => { console.error(err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
