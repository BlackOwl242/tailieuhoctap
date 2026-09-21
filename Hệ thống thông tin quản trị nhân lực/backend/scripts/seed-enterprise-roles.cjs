/**
 * Script khởi tạo danh mục vai trò doanh nghiệp & gán phân quyền thực tế cho 383 nhân sự
 * Chạy bằng: node scripts/seed-enterprise-roles.cjs
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ENTERPRISE_ROLES = [
  {
    code: 'ADMIN',
    name: 'Quản trị viên Hệ thống',
    description: 'Toàn quyền quản trị hệ thống: Cấu hình tham số, phân quyền vai trò RBAC, cơ cấu tổ chức và nhật ký kiểm toán.',
  },
  {
    code: 'BOD',
    name: 'Ban Giám Đốc (Executive)',
    description: 'Ban Lãnh đạo cấp cao: Phê duyệt kế hoạch nhân sự & ngân sách, xem báo cáo điều hành tổng thể và quỹ lương toàn công ty.',
  },
  {
    code: 'KM_MANAGER',
    name: 'Cán bộ Quản trị Nhân sự',
    description: 'Chủ trì toàn diện nghiệp vụ nhân sự: Hồ sơ nhân sự, Hợp đồng lao động, Chấm công, Tiền lương và Báo cáo BLLĐ.',
  },
  {
    code: 'LINE_MANAGER',
    name: 'Quản lý / Trưởng bộ phận',
    description: 'Quản lý trực tiếp: Duyệt đơn xin nghỉ phép, duyệt làm thêm giờ (OT), phân ca kíp và đánh giá hiệu suất KPI 360.',
  },
  {
    code: 'HR_CB',
    name: 'Chuyên viên C&B (Lương & Phúc lợi)',
    description: 'Vận hành bảng lương tự động, trích nộp BHXH/BHYT/BHTN, quyết toán thuế TNCN, theo dõi tạm ứng & khoản vay.',
  },
  {
    code: 'ACCOUNTANT',
    name: 'Kế toán Doanh nghiệp & Thanh toán',
    description: 'Đối soát bảng thanh toán lương, duyệt chi tạm ứng, quyết toán công tác phí (Expense Claims) và hạch toán dòng tiền ngân sách.',
  },
  {
    code: 'HR_RECRUITER',
    name: 'Chuyên viên Tuyển dụng (Recruiter)',
    description: 'Vận hành phân hệ Tuyển dụng ATS: Đăng tin tuyển dụng, quản lý ứng viên, điều phối phỏng vấn và tiếp nhận Onboarding.',
  },
  {
    code: 'HR_TRAINER',
    name: 'Chuyên viên Đào tạo & Phát triển (L&D)',
    description: 'Quản lý ngân hàng khóa học nội bộ, lộ trình đào tạo hội nhập, đánh giá năng lực và khảo sát sau đào tạo.',
  },
  {
    code: 'AUDITOR',
    name: 'Kiểm toán Nội bộ & Pháp chế',
    description: 'Giám sát tuân thủ Bộ luật Lao động, rà soát tính pháp lý hợp đồng, bảo mật dữ liệu và kiểm tra nhật ký kiểm toán.',
  },
  {
    code: 'USER',
    name: 'Nhân viên (Cổng ESS)',
    description: 'Cổng tự phục vụ ESS: Điểm danh chấm công, nộp đơn phép/OT, tra cứu phiếu lương cá nhân và sơ đồ tổ chức.',
  },
];

const FULL_RBAC_MATRIX = [
  {
    moduleKey: 'ESS',
    moduleName: 'Cổng Tự Phục Vụ (ESS) & Bàn Làm Việc',
    permissions: {
      USER: 'Tự phục vụ cá nhân (Điểm danh, đơn từ, phiếu lương)',
      LINE_MANAGER: 'Quyền cá nhân + Phê duyệt đơn từ của nhân viên trực thuộc',
      HR_RECRUITER: 'Quyền cá nhân + Theo dõi tiếp nhận ứng viên mới',
      HR_CB: 'Quyền cá nhân + Tra cứu nhanh dữ liệu lương & đãi ngộ',
      ACCOUNTANT: 'Quyền cá nhân + Theo dõi chứng từ thanh toán',
      HR_TRAINER: 'Quyền cá nhân + Lộ trình đào tạo cá nhân',
      AUDITOR: 'Quyền cá nhân + Giám sát tuân thủ quy trình',
      BOD: 'Quyền cá nhân + Xem bảng điều khiển điều hành Ban Giám Đốc',
      KM_MANAGER: 'Đầy đủ quyền cá nhân + Bảng điều khiển quản lý nhân sự',
      ADMIN: 'Toàn quyền truy cập và điều hành hệ thống',
    },
  },
  {
    moduleKey: 'EMPLOYEES',
    moduleName: 'Hồ Sơ Nhân Sự & Hợp Đồng Lao Động',
    permissions: {
      USER: 'Chỉ xem hồ sơ cá nhân của mình',
      LINE_MANAGER: 'Xem danh sách hồ sơ nhân viên trong bộ phận phụ trách',
      HR_RECRUITER: 'Tiếp nhận ứng viên trúng tuyển vào hồ sơ thử việc',
      HR_CB: 'Xem và quản lý hợp đồng lao động, mức lương đóng BHXH',
      ACCOUNTANT: 'Xem thông tin tài khoản ngân hàng và mã số thuế cá nhân',
      HR_TRAINER: 'Xem hồ sơ năng lực, bằng cấp và chứng chỉ chuyên môn',
      AUDITOR: 'Tra cứu hồ sơ nhân sự, rà soát tính pháp lý hợp đồng',
      BOD: 'Xem toàn bộ hồ sơ nhân sự và cơ cấu tổ chức công ty',
      KM_MANAGER: 'Toàn quyền tạo mới, sửa đổi, cập nhật hồ sơ và hợp đồng',
      ADMIN: 'Toàn quyền quản trị và phân bổ',
    },
  },
  {
    moduleKey: 'ATTENDANCE',
    moduleName: 'Chấm Công, Phân Ca & Máy Điểm Danh',
    permissions: {
      USER: 'Điểm danh cá nhân, nộp giải trình công',
      LINE_MANAGER: 'Duyệt giải trình công, phân ca kíp cho nhóm trực thuộc',
      HR_RECRUITER: 'Không có quyền truy cập',
      HR_CB: 'Tổng hợp công tháng, đối soát OT để chuyển sang tính lương',
      ACCOUNTANT: 'Xem tổng hợp ngày công thực tế tính lương',
      HR_TRAINER: 'Không có quyền truy cập',
      AUDITOR: 'Kiểm tra dữ liệu chấm công và tuân thủ thời giờ làm việc',
      BOD: 'Xem thống kê tỷ lệ đi làm và làm thêm giờ toàn công ty',
      KM_MANAGER: 'Phân ca nhân viên, tổng hợp và chốt bảng công tháng',
      ADMIN: 'Toàn quyền + Cấu hình kết nối thiết bị máy chấm công',
    },
  },
  {
    moduleKey: 'PAYROLL',
    moduleName: 'Vận Hành Tiền Lương & Khoản Vay',
    permissions: {
      USER: 'Chỉ xem phiếu lương cá nhân',
      LINE_MANAGER: 'Xem tổng hợp chi phí lương bộ phận (nếu được ủy quyền)',
      HR_RECRUITER: 'Không có quyền truy cập',
      HR_CB: 'Vận hành tính lương tự động, trích đóng BHXH, thuế TNCN',
      ACCOUNTANT: 'Đối soát bảng thanh toán, duyệt chi tạm ứng và công tác phí',
      HR_TRAINER: 'Không có quyền truy cập',
      AUDITOR: 'Kiểm toán tính chính xác công thức lương và khấu trừ thuế',
      BOD: 'Phê duyệt quỹ lương tháng, xem phân tích chi phí nhân công',
      KM_MANAGER: 'Tính lương tự động, kết xuất bảng thanh toán, duyệt vay',
      ADMIN: 'Toàn quyền + Cấu hình công thức và ngạch bậc lương',
    },
  },
  {
    moduleKey: 'RECRUITMENT',
    moduleName: 'Tuyển Dụng ATS & Tiếp Nhận Nhân Sự',
    permissions: {
      USER: 'Không có quyền truy cập',
      LINE_MANAGER: 'Đề xuất nhu cầu tuyển dụng, tham gia phỏng vấn chuyên môn',
      HR_RECRUITER: 'Toàn quyền quản trị tin tuyển dụng, CV, lịch phỏng vấn và ATS',
      HR_CB: 'Đề xuất khung lương offer cho ứng viên',
      ACCOUNTANT: 'Không có quyền truy cập',
      HR_TRAINER: 'Tiếp nhận danh sách trúng tuyển để chuẩn bị đào tạo',
      AUDITOR: 'Giám sát tính minh bạch trong quy trình tuyển dụng',
      BOD: 'Phê duyệt kế hoạch định biên và tuyển dụng năm',
      KM_MANAGER: 'Quản lý tin tuyển dụng, hồ sơ ứng viên, lịch phỏng vấn',
      ADMIN: 'Toàn quyền kiểm soát và phê duyệt',
    },
  },
  {
    moduleKey: 'PERFORMANCE',
    moduleName: 'Đánh Giá 360, Đào Tạo & Khiếu Nại',
    permissions: {
      USER: 'Tự đánh giá, đánh giá chéo, gửi khiếu nại',
      LINE_MANAGER: 'Giao KPI, đánh giá hiệu suất nhân viên bộ phận',
      HR_RECRUITER: 'Đánh giá năng lực ứng viên trong giai đoạn thử việc',
      HR_CB: 'Căn cứ kết quả KPI để tính thưởng hiệu suất',
      ACCOUNTANT: 'Không có quyền truy cập',
      HR_TRAINER: 'Quản trị ngân hàng khóa học, kế hoạch đào tạo và khảo sát',
      AUDITOR: 'Giám sát giải quyết khiếu nại và tuân thủ quy trình đánh giá',
      BOD: 'Phê duyệt khung KPI cấp công ty và kết quả xếp loại năm',
      KM_MANAGER: 'Quản trị chương trình đào tạo, tiếp nhận và giải quyết khiếu nại',
      ADMIN: 'Toàn quyền điều phối và giám sát',
    },
  },
  {
    moduleKey: 'REPORTS',
    moduleName: 'Báo Cáo Nhân Lực & Thống Kê BLLĐ',
    permissions: {
      USER: 'Không có quyền truy cập',
      LINE_MANAGER: 'Báo cáo nhân sự và hiệu suất của bộ phận',
      HR_RECRUITER: 'Báo cáo hiệu quả kênh tuyển dụng, tỷ lệ tuyển thành công',
      HR_CB: 'Báo cáo chi phí tiền lương, bảo hiểm và biến động thu nhập',
      ACCOUNTANT: 'Báo cáo chi phí công tác phí và ngân sách nhân sự',
      HR_TRAINER: 'Báo cáo đào tạo, thời lượng và tỷ lệ hoàn thành khóa học',
      AUDITOR: 'Báo cáo kiểm toán tuân thủ BLLĐ, rủi ro pháp lý',
      BOD: 'Toàn bộ báo cáo quản trị cấp cao, Dashboard biến động nhân sự',
      KM_MANAGER: 'Xem và xuất các báo cáo mẫu 2C-BNV, biến động lao động',
      ADMIN: 'Toàn quyền kết xuất và kiểm toán dữ liệu',
    },
  },
  {
    moduleKey: 'SYSTEM',
    moduleName: 'Cấu Hình Hệ Thống, Phân Quyền & Tham Số',
    permissions: {
      USER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      LINE_MANAGER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      HR_RECRUITER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      HR_CB: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      ACCOUNTANT: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      HR_TRAINER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      AUDITOR: 'Tra cứu nhật ký kiểm toán hệ thống (Audit Logs)',
      BOD: 'Xem thông tin cấu hình và tham số hệ thống',
      KM_MANAGER: 'Không có quyền truy cập (Bị ẩn & Khóa HTTP 403)',
      ADMIN: 'Toàn quyền: Phân quyền RBAC, Cơ cấu tổ chức, Cài đặt tham số, Nhật ký kiểm toán',
    },
  },
];

async function main() {
  console.log('=== 1. KHỞI TẠO DANH MỤC VAI TRÒ DOANH NGHIỆP ===');
  for (const r of ENTERPRISE_ROLES) {
    await prisma.role.upsert({
      where: { code: r.code },
      create: r,
      update: { name: r.name, description: r.description },
    });
    console.log(`  ✓ Vai trò: ${r.code.padEnd(14)} - ${r.name}`);
  }

  console.log('\n=== 2. CẬP NHẬT MA TRẬN PHÂN QUYỀN (RBAC MATRIX) ===');
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@demo.local' } });
  await prisma.setting.upsert({
    where: { key: 'RBAC_PERMISSIONS_MATRIX' },
    create: {
      key: 'RBAC_PERMISSIONS_MATRIX',
      value: FULL_RBAC_MATRIX,
      updatedBy: adminUser?.id,
    },
    update: {
      value: FULL_RBAC_MATRIX,
      updatedBy: adminUser?.id,
    },
  });
  console.log('  ✓ Đã lưu cấu hình ma trận 8 phân hệ cho 10 vai trò.');

  console.log('\n=== 3. GÁN PHÂN QUYỀN THỰC TẾ CHO TOÀN BỘ NHÂN SỰ ===');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      jobTitle: true,
      orgUnit: { select: { code: true, name: true } },
    },
  });

  console.log(`  Tổng số nhân sự cần phân quyền: ${users.length}`);

  for (const u of users) {
    const title = u.jobTitle || '';
    const orgCode = u.orgUnit?.code || '';
    let role = 'USER';

    if (u.email === 'admin@demo.local') {
      role = 'ADMIN';
    } else if (u.email === 'km.manager@demo.local') {
      role = 'KM_MANAGER';
    } else if (u.email === 'pm.java@demo.local') {
      role = 'LINE_MANAGER';
    } else if (
      orgCode === 'BGD' ||
      /Tổng Giám đốc|CEO|CFO|CCO|Phó Tổng Giám đốc|Giám đốc Trung tâm|Giám đốc Chi nhánh|Thư ký HĐQT/i.test(title)
    ) {
      role = 'BOD';
    } else if (/Pháp chế|Tuân thủ|Auditor|Kiểm toán/i.test(title) || orgCode === 'OPS-LEGAL') {
      role = 'AUDITOR';
    } else if (/Đào tạo|L&D|Agile Coach|CMMI/i.test(title) || orgCode === 'HR-LD') {
      role = 'HR_TRAINER';
    } else if (/Tuyển dụng|Recruiter|Talent Acquisition|Ứng viên/i.test(title) || orgCode === 'HR-TA') {
      role = 'HR_RECRUITER';
    } else if (
      /C&B|Tính lương|Thuế TNCN|Bảo hiểm Xã hội|BHXH|HRIS|Lương thưởng/i.test(title) ||
      orgCode === 'HR-CB'
    ) {
      role = 'HR_CB';
    } else if (
      /Kế toán|Thanh toán|Dòng tiền|Ngân sách/i.test(title) ||
      ['FIN', 'FIN-ACC', 'FIN-TREASURY', 'FIN-FPA'].includes(orgCode)
    ) {
      role = 'ACCOUNTANT';
    } else if (/Admin|Quản trị Mạng|An toàn Thông tin|SOC|Helpdesk/i.test(title) || orgCode === 'OPS-IT') {
      role = 'ADMIN';
    } else if (/Nhân sự|Hồ sơ|Hợp đồng|Onboarding|Văn thư/i.test(title) || ['HR', 'HR-OPS'].includes(orgCode)) {
      role = 'KM_MANAGER';
    } else if (/Trưởng|Lead|Director|Head|Tổ trưởng/i.test(title)) {
      role = 'LINE_MANAGER';
    }

    await prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId: u.id } }),
      prisma.userRole.create({ data: { userId: u.id, roleCode: role } }),
    ]);
  }

  console.log('\n=== 4. THỐNG KÊ PHÂN BỔ VAI TRÒ HOÀN TẤT ===');
  const roleStats = await prisma.role.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { code: 'asc' },
  });

  console.table(
    roleStats.map((r) => ({
      'Mã vai trò': r.code,
      'Tên vai trò': r.name,
      'Số tài khoản': r._count.users,
    }))
  );
}

main()
  .catch((e) => {
    console.error('Lỗi khởi tạo vai trò:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
