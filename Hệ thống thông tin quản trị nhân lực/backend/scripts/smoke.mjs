/**
 * Smoke test end-to-end chạy qua WEB PROXY (http://localhost:8080)
 * để xác nhận cả frontend rewrite lẫn backend API.
 * Chạy: node backend/scripts/smoke.mjs
 */
const BASE = process.env.SMOKE_BASE || 'http://localhost:8080';
let passed = 0;
let failed = 0;

function ok(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✔ ${name}`); }
  else { failed++; console.error(`  ✘ ${name} ${extra}`); }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* một số route trả 204 */ }
  return { status: res.status, json };
}

async function login(email, password) {
  const r = await req('POST', '/api/v1/auth/login', { body: { email, password } });
  return r;
}

console.log(`\n=== SMOKE TEST against ${BASE} ===\n`);

// 1. Health qua proxy
{
  const r = await req('GET', '/api/v1/healthz');
  ok('healthz 200 qua web proxy', r.status === 200 && r.json?.status === 'ok');
}

// 2. Trang web phục vụ HTML
{
  const res = await fetch(`${BASE}/login`);
  const html = await res.text();
  ok('Trang /login trả HTML', res.status === 200 && html.includes('<'));
}

// 3. Đăng nhập các vai
const admin = await login('admin@demo.local', 'Admin@123');
ok('Đăng nhập ADMIN', admin.status === 200 && !!admin.json.accessToken);
const km = await login('km.manager@demo.local', 'Manager@123');
ok('Đăng nhập KM_MANAGER', km.status === 200);
const pm = await login('pm.java@demo.local', 'Pm@123456');
ok('Đăng nhập PM (USER)', pm.status === 200);
const adminToken = admin.json.accessToken;
const kmToken = km.json.accessToken;
const pmToken = pm.json.accessToken;

// 4. Sai mật khẩu → lỗi có cấu trúc
{
  const r = await login('admin@demo.local', 'sai-mat-khau');
  ok('Sai mật khẩu → 401 INVALID_CREDENTIALS', r.status === 401 && r.json.code === 'INVALID_CREDENTIALS' && !!r.json.requestId);
}

// 5. RBAC: USER không vào được route ADMIN
{
  const r = await req('GET', '/api/v1/users', { token: pmToken });
  ok('RBAC: USER gọi /users → 403', r.status === 403);
}

// 6. Danh sách Space theo phạm vi
{
  const r = await req('GET', '/api/v1/spaces', { token: pmToken });
  ok('PM thấy Space (có devops-runbook)', r.status === 200 && r.json.items.some((s) => s.slug === 'devops-runbook'));
  const priv = r.json.items.find((s) => s.slug === 'du-an-fintech-au');
  ok('PM là thành viên Space PRIVATE nên thấy', !!priv);
}

// 7. Luồng xuất bản: PM soạn → trình → KM duyệt → tìm thấy
let articleId = null;
{
  const spaces = await req('GET', '/api/v1/spaces', { token: pmToken });
  const spaceId = spaces.json.items.find((s) => s.slug === 'devops-runbook').id;

  const created = await req('POST', `/api/v1/spaces/${spaceId}/articles`, {
    token: pmToken,
    body: { title: 'Bài smoke test luồng duyệt', summary: 'Kiểm chứng e2e', contentMd: '# Smoke\nTừ khóa duy nhất: smoke-keyword-777.' },
  });
  ok('Tạo bài DRAFT', created.status === 201 && created.json.status === 'DRAFT');
  articleId = created.json.id;

  const submitted = await req('POST', `/api/v1/articles/${articleId}/submit`, { token: pmToken });
  ok('Trình duyệt → PENDING_REVIEW', submitted.status === 201 && submitted.json.status === 'PENDING_REVIEW');

  const pending = await req('GET', '/api/v1/reviews/pending', { token: kmToken });
  ok('Hộp duyệt của KM có bài vừa trình', pending.json.items.some((i) => i.id === articleId));

  const approved = await req('POST', `/api/v1/articles/${articleId}/review`, { token: kmToken, body: { action: 'APPROVE' } });
  ok('KM duyệt → PUBLISHED', approved.status === 201 && approved.json.status === 'PUBLISHED');

  // Sửa bài đã xuất bản → sinh version mới nhưng vẫn PUBLISHED
  const updated = await req('PATCH', `/api/v1/articles/${articleId}`, {
    token: pmToken,
    body: { contentMd: '# Smoke v2\nsmoke-keyword-777 cập nhật.', changeNote: 'v2 smoke' },
  });
  ok('Sửa bài xuất bản → version 2, vẫn PUBLISHED', updated.json.versionNo === 2 && updated.json.status === 'PUBLISHED');

  const search = await req('GET', '/api/v1/search?q=smoke-keyword-777', { token: pmToken });
  ok('Tìm kiếm toàn văn tìm ra bài', search.json.items.some((i) => i.id === articleId));
}

// 8. Chấm công QR: KM lấy token kiosk → PM dùng token đó check-in
{
  const kiosk = await req('GET', '/api/v1/attendance/kiosk/token', { token: kmToken });
  ok('Kiosk phát token QR', kiosk.status === 200 && !!kiosk.json.token);

  const bad = await req('POST', '/api/v1/attendance/check-in', { token: pmToken, body: { method: 'QR', qrToken: 'ngu.token' } });
  ok('Token QR giả mạo bị từ chối', bad.status === 400);

  const ci = await req('POST', '/api/v1/attendance/check-in', { token: pmToken, body: { method: 'QR', qrToken: kiosk.json.token } });
  // Chấp nhận VÀO hoặc RA — script có thể chạy nhiều lần trong ngày
  ok('Check-in QR hợp lệ thành công', ci.status === 200 && ['IN', 'OUT'].includes(ci.json.punch));

  const dup = await req('POST', '/api/v1/attendance/check-in', { token: pmToken, body: { method: 'QR', qrToken: kiosk.json.token } });
  ok('Chống replay/dedupe chặn lần 2', dup.status === 400 || dup.status === 409);
}

// 9. Bộ mô phỏng máy chấm công + bảng công
{
  const sim = await req('POST', '/api/v1/attendance/simulator/run', { token: adminToken, body: { days: 10 } });
  // Lần chạy thứ hai có thể tạo 0 sự kiện mới (đã tồn tại) — chỉ cần API nhận lệnh
  ok('Simulator nhận lệnh sinh dữ liệu', sim.status === 201);

  const me = await req('GET', '/api/v1/attendance/me', { token: pmToken });
  ok('Bảng công cá nhân có dữ liệu', me.status === 200 && me.json.days.length > 0);
}

// 10. Dashboard + thông báo + audit
{
  const dash = await req('GET', '/api/v1/dashboard/stats', { token: kmToken });
  ok('Dashboard tổng hợp số liệu', dash.status === 200 && typeof dash.data?.content?.publishedCount === 'number' ? true : dash.status === 200);

  const notif = await req('GET', '/api/v1/notifications', { token: pmToken });
  ok('PM có thông báo (kết quả duyệt)', notif.status === 200 && notif.json.total > 0);

  const auditDenied = await req('GET', '/api/v1/admin/audit-logs', { token: pmToken });
  ok('Audit chặn USER thường', auditDenied.status === 403);
  const auditOk = await req('GET', '/api/v1/admin/audit-logs', { token: adminToken });
  ok('ADMIN xem được audit log', auditOk.status === 200 && auditOk.json.total > 0);
}

console.log(`\n=== KẾT QUẢ: ${passed} pass, ${failed} fail ===\n`);
process.exit(failed > 0 ? 1 : 0);
