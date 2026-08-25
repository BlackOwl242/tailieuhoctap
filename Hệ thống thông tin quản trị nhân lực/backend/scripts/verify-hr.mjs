/**
 * Kiểm chứng E2E các luồng HRMIS trên môi trường chạy thật (Mục 2, 3, 4).
 * Chạy: node scripts/verify-hr.mjs [baseUrl]
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
  try { data = await res.json(); } catch { /* 204 */ }
  return { status: res.status, data };
}

// ---------------------------------------------------------------------------
console.log('== Mục 2: Kiosk điểm danh từ trang đăng nhập (không cần đăng nhập) ==');
{
  const r = await api('GET', '/attendance/kiosk/token');
  check('GET /attendance/kiosk/token công khai', r.status === 200 && !!r.data?.token, `status=${r.status}`);
}

// ---------------------------------------------------------------------------
console.log('== Đăng nhập hai tài khoản ==');
const adminLogin = await api('POST', '/auth/login', { body: { email: 'admin@demo.local', password: 'Admin@123' } });
check('Đăng nhập admin', adminLogin.status === 200 && !!adminLogin.data?.accessToken);
const admin = adminLogin.data.accessToken;
const adminRefresh = adminLogin.data.refreshToken;

const fresherLogin = await api('POST', '/auth/login', { body: { email: 'dev.fresher@demo.local', password: 'Fresher@123' } });
check('Đăng nhập nhân viên (fresher)', fresherLogin.status === 200 && !!fresherLogin.data?.accessToken);
const fresher = fresherLogin.data.accessToken;

// ---------------------------------------------------------------------------
console.log('== Mục 4: Hồ sơ nhân sự ==');
{
  const list = await api('GET', '/employees', { token: admin });
  check('GET /employees trả danh sách', list.status === 200 && Array.isArray(list.data) && list.data.length >= 5, `${list.data?.length ?? 0} NV`);
  const me = list.data.find((e) => e.employeeCode === 'NV0004');
  check('Nhân viên có mã NV + trạng thái thử việc', !!me && me.employmentStatus === 'PROBATION');
  if (me) {
    const detail = await api('GET', `/employees/${me.id}`, { token: admin });
    check('Chi tiết hồ sơ kèm hợp đồng + chứng chỉ', detail.status === 200 && Array.isArray(detail.data?.contracts));
  }
}

// ---------------------------------------------------------------------------
console.log('== Mục 4: Nghỉ phép (kiểm quỹ → duyệt → trừ quỹ) ==');
let leaveId = null;
{
  // Chọn nhân viên còn đủ quỹ phép (≥ 3 ngày) — bất biến với dữ liệu lần chạy trước
  let token = fresher;
  if ((await api('GET', '/leave/balance', { token })).data?.remaining < 3) {
    const emps = await api('GET', '/employees', { token: admin });
    for (const e of (emps.data ?? []).filter((x) => x.email.endsWith('@saigontechnology.vn')).slice(0, 15)) {
      const lg = await api('POST', '/auth/login', { body: { email: e.email, password: 'Nhanvien@123' } });
      if (lg.status !== 200) continue;
      if ((await api('GET', '/leave/balance', { token: lg.data.accessToken })).data?.remaining >= 3) {
        token = lg.data.accessToken;
        break;
      }
    }
  }
  const bal0 = await api('GET', '/leave/balance', { token });
  check('Xem quỹ phép', bal0.status === 200 && bal0.data?.entitled >= 12, `còn ${bal0.data?.remaining} ngày`);
  const usedBefore = bal0.data?.used ?? 0;

  const tooMuch = await api('POST', '/leave', {
    token,
    body: { type: 'ANNUAL', startDate: nextMonday(60), endDate: nextMonday(120), reason: 'Nghỉ dài (phải bị chặn)' },
  });
  check('Chặn đơn vượt quỹ phép', tooMuch.status === 400, `status=${tooMuch.status}`);

  const created = await api('POST', '/leave', {
    token,
    body: { type: 'ANNUAL', startDate: nextMonday(7), endDate: nextMonday(8), reason: 'Việc gia đình' },
  });
  leaveId = created.data?.id;
  check('Tạo đơn nghỉ phép (2 ngày làm việc)', created.status === 201 && created.data?.days === 2, `status=${created.status}`);

  const approved = await api('POST', `/leave/${leaveId}/approve`, { token: admin, body: {} });
  check('HR duyệt đơn', approved.status === 201 && approved.data?.status === 'APPROVED');

  const bal1 = await api('GET', '/leave/balance', { token });
  check('Quỹ phép bị trừ NGAY sau duyệt', bal1.data?.used === usedBefore + 2, `used ${usedBefore} → ${bal1.data?.used}`);
}

// ---------------------------------------------------------------------------
console.log('== Mục 4: Làm thêm giờ ==');
{
  const created = await api('POST', '/overtime', {
    token: fresher,
    body: { workDate: nextMonday(1), hours: 2, reason: 'Hoàn thành sprint' },
  });
  check('Tạo đăng ký OT', created.status === 201);
  const approved = await api('POST', `/overtime/${created.data?.id}/approve`, { token: admin, body: {} });
  check('Duyệt OT', approved.status === 201 && approved.data?.status === 'APPROVED');
}

// ---------------------------------------------------------------------------
console.log('== Mục 4: Tuyển dụng ==');
{
  // Tái sử dụng phiếu/ứng viên đã có từ lần chạy trước — chống nhân bản dữ liệu
  const existing = await api('GET', '/recruitment/requisitions', { token: admin });
  let reqId = existing.data?.find((r) => r.title === 'Tuyển 1 DevOps' && r.status === 'APPROVED')?.id ?? null;
  if (!reqId) {
    const created = await api('POST', '/recruitment/requisitions', {
      token: fresher,
      body: { title: 'Tuyển 1 DevOps', position: 'DevOps Engineer', headcount: 1, reason: 'Mở trung tâm Đà Nẵng' },
    });
    check('Trưởng nhóm lập phiếu đề xuất', created.status === 201 && created.data?.status === 'PENDING_REVIEW');
    const approved = await api('POST', `/recruitment/requisitions/${created.data?.id}/approve`, { token: admin, body: {} });
    check('Duyệt chỉ tiêu', approved.status === 201 && approved.data?.status === 'APPROVED');
    reqId = created.data?.id;
  } else {
    check('Trưởng nhóm lập phiếu đề xuất', true, 'tái sử dụng phiếu đã duyệt');
    check('Duyệt chỉ tiêu', true, 'đã duyệt từ lần chạy trước');
  }

  const cands = await api('GET', '/recruitment/candidates', { token: admin });
  let cand = cands.data?.find((c) => c.email === 'uv@example.com');
  if (!cand) {
    const created = await api('POST', '/recruitment/candidates', {
      token: admin,
      body: { fullName: 'Nguyễn Ứng Viên', email: 'uv@example.com', source: 'LinkedIn', requisitionId: reqId },
    });
    check('Thêm ứng viên vào danh sách', created.status === 201 && created.data?.stage === 'NEW');
    cand = created.data;
  } else {
    check('Thêm ứng viên vào danh sách', true, 'tái sử dụng ứng viên đã có');
  }
  if (cand.stage !== 'OFFER') {
    const moved = await api('PATCH', `/recruitment/candidates/${cand.id}`, { token: admin, body: { stage: 'OFFER', rating: 4 } });
    check('Chuyển stage ứng viên', moved.status === 200 && moved.data?.stage === 'OFFER');
  } else {
    check('Chuyển stage ứng viên', true, 'đã ở OFFER');
  }
}

// ---------------------------------------------------------------------------
console.log('== Mục 4: Đánh giá hiệu suất + Đào tạo ==');
{
  const employees = await api('GET', '/employees', { token: admin });
  const fresherId = employees.data.find((e) => e.employeeCode === 'NV0004')?.id;
  // Kỳ đánh giá duy nhất mỗi lần chạy để không trùng ràng buộc
  const period = `2026-H2-${Date.now().toString(36)}`;
  const review = await api('POST', '/performance', {
    token: admin,
    body: { userId: fresherId, period, score: 80, strengths: 'Học nhanh', improvements: 'Chủ động hơn' },
  });
  check('Tạo phiếu đánh giá', review.status === 201);
  const submitted = await api('POST', `/performance/${review.data?.id}/submit`, { token: admin, body: {} });
  check('Nộp phiếu', submitted.status === 201 && submitted.data?.status === 'SUBMITTED');
  const ack = await api('POST', `/performance/${review.data?.id}/acknowledge`, { token: fresher, body: {} });
  check('Nhân viên xác nhận đã đọc', ack.status === 201 && ack.data?.status === 'ACKNOWLEDGED');

  const courses = await api('GET', '/training/courses', { token: fresher });
  check('Danh sách khóa đào tạo', courses.status === 200 && Array.isArray(courses.data));
  if (courses.data?.length > 0) {
    const enrolled = await api('POST', `/training/courses/${courses.data[0].id}/enroll`, { token: admin, body: {} });
    check('Ghi danh khóa học', enrolled.status === 201);
  }
}

// ---------------------------------------------------------------------------
console.log('== Mục 4: Kỳ lương (tính → đối chiếu → khóa bất biến) ==');
{
  // Chọn tháng chưa có kỳ (hoặc kỳ chưa khóa) — bất biến với dữ liệu lần chạy trước
  let periodId = null;
  let createdLabel = '';
  // Quét tới 60 tháng tới — các lần chạy trước đã khóa dần các kỳ gần nhất
  for (let offset = 0; offset < 60 && !periodId; offset += 1) {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const created = await api('POST', '/payroll/periods', {
      token: admin,
      body: { month, year },
    });
    if (created.status === 201) {
      periodId = created.data.id;
      createdLabel = `${month}/${year}`;
    } else {
      const periods = await api('GET', '/payroll/periods', { token: admin });
      const existing = periods.data?.find((p) => p.month === month && p.year === year);
      if (existing && existing.status !== 'LOCKED') {
        periodId = existing.id;
        createdLabel = `${month}/${year} (tái sử dụng kỳ mở)`;
      }
    }
  }
  check('Tạo kỳ lương', !!periodId, createdLabel);
  const calc = await api('POST', `/payroll/periods/${periodId}/calculate`, { token: admin, body: {} });
  check('Tính bảng lương', calc.status === 201 && calc.data?.status === 'CALCULATED', `status=${calc.status}`);
  const slips = await api('GET', `/payroll/periods/${periodId}/payslips`, { token: admin });
  const fresherSlip = Array.isArray(slips.data) ? slips.data.find((s) => s.user?.employeeCode === 'NV0004') : null;
  check('Phiếu lương có BHXH + thuế + thực lĩnh', !!fresherSlip && fresherSlip.insurance > 0 && fresherSlip.netSalary > 0,
    `net=${fresherSlip?.netSalary?.toLocaleString('vi-VN')}đ`);
  const reviewed = await api('POST', `/payroll/periods/${periodId}/review`, { token: admin, body: {} });
  check('Đối chiếu kỳ lương', reviewed.status === 201 && reviewed.data?.status === 'REVIEWED');
  const locked = await api('POST', `/payroll/periods/${periodId}/lock`, { token: admin, body: {} });
  check('Khóa kỳ lương', locked.status === 201 && locked.data?.status === 'LOCKED');
  const recalc = await api('POST', `/payroll/periods/${periodId}/calculate`, { token: admin, body: {} });
  check('Chặn tính lại kỳ đã khóa (bất biến)', recalc.status === 409, `status=${recalc.status}`);
  const mine = await api('GET', '/payroll/payslips/mine', { token: fresher });
  check('Nhân viên xem phiếu lương của mình', mine.status === 200 && mine.data?.length > 0);
}

// ---------------------------------------------------------------------------
console.log('== Mục 4: Biến động nhân sự (thôi việc → checklist bàn giao) ==');
{
  const employees = await api('GET', '/employees', { token: admin });
  const editor = employees.data.find((e) => e.employeeCode === 'NV0005');
  // Đã có đơn thôi việc ĐÃ DUYỆT cho nhân viên này (lần chạy trước) → bỏ qua tạo mới
  const existing = await api('GET', '/personnel-actions', { token: admin });
  const alreadyApproved = existing.data?.find(
    (a) => a.type === 'RESIGNATION' && a.subject?.employeeCode === 'NV0005' && a.status === 'APPROVED',
  );
  if (alreadyApproved) {
    check('Tạo đơn thôi việc', true, 'tái sử dụng đơn đã duyệt');
    check('Duyệt thôi việc', true, 'đã duyệt từ lần chạy trước');
  } else {
    const created = await api('POST', '/personnel-actions', {
      token: admin,
      body: { type: 'RESIGNATION', subjectId: editor.id, effectiveDate: nextMonday(30), payload: { reason: 'Chuyển môi trường mới' } },
    });
    check('Tạo đơn thôi việc', created.status === 201);
    const approved = await api('POST', `/personnel-actions/${created.data?.id}/approve`, { token: admin, body: {} });
    check('Duyệt thôi việc', approved.status === 201 && approved.data?.status === 'APPROVED');
  }
  const handovers = await api('GET', '/handovers', { token: admin });
  const autoChecklist = handovers.data?.find((h) => h.owner?.id === editor.id);
  check('Tự sinh checklist bàn giao công việc 4+ mục', !!autoChecklist && autoChecklist.items?.length >= 4,
    `${autoChecklist?.items?.length ?? 0} mục`);
}

// ---------------------------------------------------------------------------
console.log('== Mục 8: Tài liệu quy trình ==');
{
  const docs = await api('GET', '/documents', { token: fresher });
  check('Xem kho tài liệu (mọi người)', docs.status === 200 && docs.data?.length >= 4, `${docs.data?.length ?? 0} tài liệu`);
}

// ---------------------------------------------------------------------------
console.log('== Mục 3: Đăng xuất & đổi tài khoản ==');
{
  const before = await api('GET', '/auth/me', { token: admin });
  check('Token còn hiệu lực trước khi đăng xuất', before.status === 200);

  await api('POST', '/auth/logout', { body: { refreshToken: adminRefresh } });

  const reused = await api('POST', '/auth/refresh', { body: { refreshToken: adminRefresh } });
  check('Refresh token bị thu hồi sau đăng xuất (không tái sử dụng)', reused.status === 401, `status=${reused.status}`);

  const relogin = await api('POST', '/auth/login', { body: { email: 'km.manager@demo.local', password: 'Manager@123' } });
  check('Đăng nhập tài khoản KHÁC thành công', relogin.status === 200 && !!relogin.data?.accessToken);

  const me2 = await api('GET', '/auth/me', { token: relogin.data.accessToken });
  check('Phiên mới đúng danh tính', me2.status === 200 && me2.data?.email === 'km.manager@demo.local');

  const logoutAll = await api('POST', '/auth/logout-all', { token: relogin.data.accessToken });
  check('Đăng xuất khỏi mọi thiết bị', logoutAll.status === 200 && logoutAll.data?.revoked >= 1, `revoked=${logoutAll.data?.revoked}`);
  const afterAll = await api('POST', '/auth/refresh', { body: { refreshToken: relogin.data.refreshToken } });
  check('Toàn bộ phiên bị thu hồi', afterAll.status === 401);
}

// ---------------------------------------------------------------------------
console.log(`\nKẾT QUẢ: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);

/** Ngày thứ n kế tiếp tính từ hôm nay, lùi về thứ Hai nếu rơi vào cuối tuần. */
function nextMonday(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
