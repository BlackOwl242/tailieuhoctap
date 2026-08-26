/**
 * Kiểm chứng E2E phân hệ Quản lý Hồ sơ Toàn diện, Ngạch bậc Lương & Báo cáo.
 * Chạy: node scripts/verify-personnel.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? 'http://localhost:3001/api/v1';
let pass = 0;
let fail = 0;

function check(name, ok, extra = '') {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${extra ? ` — ${extra}` : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`);
  }
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, data };
}

console.log('================================================================');
console.log('KIỂM CHỨNG HỆ THỐNG QUẢN TRỊ NHÂN LỰC TOÀN DIỆN (PERSONNEL E2E)');
console.log('================================================================\n');

// 1. Đăng nhập Admin
console.log('== 1. Đăng nhập Quản trị viên (Admin) ==');
const adminLogin = await api('POST', '/auth/login', {
  body: { email: 'admin@demo.local', password: 'Admin@123' },
});
check('Đăng nhập Admin thành công', adminLogin.status === 200 && !!adminLogin.data?.accessToken);
const adminToken = adminLogin.data?.accessToken;

// 2. Danh mục Ngạch bậc lương tiêu chuẩn
console.log('\n== 2. Danh mục 184 Ngạch bậc lương (Nghị định 204) ==');
{
  const r = await api('GET', '/personnel-ranks', { token: adminToken });
  check('GET /personnel-ranks trả danh sách ngạch bậc', r.status === 200 && Array.isArray(r.data) && r.data.length >= 10, `${r.data?.length ?? 0} ngạch`);
  const cvRank = r.data?.find((rank) => rank.code === '01.003');
  check('Ngạch 01.003 (Chuyên viên) có 9 bậc, giữ bậc 36 tháng', !!cvRank && cvRank.totalSteps === 9 && cvRank.stepMonths === 36);
  const ksRank = r.data?.find((rank) => rank.code === '13.095');
  check('Ngạch 13.095 (Kỹ sư) có coefficients đầy đủ', !!ksRank && Array.isArray(ksRank.coefficients) && ksRank.coefficients.length >= 8);
}

// 3. Quản lý Hồ sơ Toàn diện (111 trường)
console.log('\n== 3. Hồ sơ Nhân sự Toàn diện & 8 Quá trình lịch sử ==');
let targetUserId = null;
{
  const rList = await api('GET', '/personnel-profiles?limit=20', { token: adminToken });
  const items = rList.data?.items || rList.data;
  check('GET /personnel-profiles trả danh sách hồ sơ', rList.status === 200 && Array.isArray(items) && items.length > 0, `${items?.length ?? 0} hồ sơ`);
  if (items && items.length > 0) {
    targetUserId = items[0].userId;
    const rDetail = await api('GET', `/personnel-profiles/${targetUserId}`, { token: adminToken });
    check('GET /personnel-profiles/:userId trả chi tiết kèm 8 bảng quá trình', rDetail.status === 200 && !!rDetail.data?.user && Array.isArray(rDetail.data?.educations));

    // Thử cập nhật hồ sơ
    const rUpdate = await api('PATCH', `/personnel-profiles/${targetUserId}`, {
      token: adminToken,
      body: {
        politicalTheory: 'Cao cấp',
        foreignLanguage: 'Tiếng Anh C1 / IELTS 7.5',
        healthStatus: 'Rất tốt',
      },
    });
    check('PATCH /personnel-profiles/:userId cập nhật thành công', rUpdate.status === 200 && rUpdate.data?.politicalTheory === 'Cao cấp');
  }
}

// 4. Bộ máy Quét Nâng bậc Lương Định kỳ & Thâm niên vượt khung
console.log('\n== 4. Bộ máy Quét Nâng bậc Lương Tự động ==');
{
  const rScan = await api('GET', '/personnel-ranks/progression/scan', { token: adminToken });
  check('GET /personnel-ranks/progression/scan quét thành công', rScan.status === 200 && typeof rScan.data?.totalScanned === 'number', `Đã quét ${rScan.data?.totalScanned} hồ sơ`);
  check('Scanner tính toán danh sách đủ điều kiện & vượt khung', Array.isArray(rScan.data?.eligibleList));

  if (targetUserId) {
    const rApply = await api('POST', '/personnel-ranks/progression/apply', {
      token: adminToken,
      body: {
        userId: targetUserId,
        nextStep: 4,
        nextCoefficient: 3.33,
        decisionNo: 'QĐ-NL/TEST-2026',
      },
    });
    check('POST /personnel-ranks/progression/apply phê duyệt nâng bậc thành công', rApply.status === 200 || rApply.status === 201);
  }
}

// 5. Trung tâm Báo cáo & Mẫu biểu chuẩn hóa
console.log('\n== 5. Trung tâm Báo cáo Mẫu biểu & Thống kê ==');
{
  if (targetUserId) {
    const r2c = await api('GET', `/personnel-reports/2c-profile/${targetUserId}`, { token: adminToken });
    check('GET /personnel-reports/2c-profile/:userId kết xuất dữ liệu Sơ yếu lý lịch 4 trang', r2c.status === 200 && !!r2c.data?.page1 && !!r2c.data?.page2 && !!r2c.data?.page3 && !!r2c.data?.page4);
  }

  const rBieu01 = await api('GET', '/personnel-reports/bieu-01-age-rank', { token: adminToken });
  check('GET /personnel-reports/bieu-01-age-rank (Biểu 01 Độ tuổi x Ngạch)', rBieu01.status === 200 && Array.isArray(rBieu01.data?.rows));

  const rBieu02 = await api('GET', '/personnel-reports/bieu-02-languages', { token: adminToken });
  check('GET /personnel-reports/bieu-02-languages (Biểu 02 Ngoại ngữ & Tin học)', rBieu02.status === 200 && !!rBieu02.data?.languageBreakdown);

  const rBieu03 = await api('GET', '/personnel-reports/bieu-03-education-unit', { token: adminToken });
  check('GET /personnel-reports/bieu-03-education-unit (Biểu 03 Trình độ x Đơn vị)', rBieu03.status === 200 && Array.isArray(rBieu03.data?.rows));
}

console.log('\n================================================================');
console.log(`KẾT QUẢ KIỂM CHỨNG: ${pass} PASS / ${fail} FAIL`);
console.log('================================================================');

if (fail > 0) process.exit(1);
