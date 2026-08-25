/**
 * Kiểm thử RBAC (phân quyền theo vai trò) — chạy sau khi triển khai quyền:
 *
 * A. API guard: gọi trực tiếp các endpoint nhạy cảm bằng từng vai trò
 *    (ADMIN / KM_MANAGER / USER) → kỳ vọng 403 khi thiếu quyền, 2xx khi đủ.
 * B. UI conditional rendering: crawl giao diện bằng từng tài khoản
 *    → menu "Quản trị" và mục "Biến động nhân sự" phải ẩn với non-admin,
 *    /admin/users phải bị chuyển hướng về /dashboard.
 * C. Dữ liệu lương: GET /employees do USER gọi không được chứa baseSalary.
 *
 * Chạy: node tools/rbac-check.mjs
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:8080';
const API = 'http://localhost:3001/api/v1';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ACCOUNTS = {
  admin: { email: 'admin@demo.local', password: 'Admin@123', label: 'ADMIN' },
  km: { email: 'km.manager@demo.local', password: 'Manager@123', label: 'KM_MANAGER' },
  user: { email: 'dev.fresher@demo.local', password: 'Fresher@123', label: 'USER' },
};

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass += 1; console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`); }
  else { fail += 1; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function login(accountKey) {
  const acc = ACCOUNTS[accountKey];
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: acc.email, password: acc.password }),
  });
  if (!res.ok) throw new Error(`Đăng nhập ${acc.email} thất bại: HTTP ${res.status}`);
  const tokens = await res.json();
  const me = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } }).then((r) => r.json());
  return { tokens, me };
}

/** Gọi API và trả về status + body JSON (nếu có). */
async function call(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* 204 hoặc body rỗng */ }
  return { status: res.status, data };
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  const sessions = {};
  for (const key of Object.keys(ACCOUNTS)) sessions[key] = await login(key);

  // ============================================================ A. API GUARD
  console.log('\n== A. API guard — gọi trực tiếp endpoint nhạy cảm ==');

  // USER không được làm gì hành chính cả
  const userCases = [
    ['GET', '/users', null, 'danh sách người dùng'],
    ['PATCH', '/users/00000000-0000-0000-0000-000000000000', { fullName: 'Hack' }, 'sửa người dùng'],
    ['GET', '/admin/audit-logs', null, 'nhật ký kiểm toán'],
    ['GET', '/admin/settings', null, 'cấu hình hệ thống'],
    ['POST', '/attendance/devices', { name: 'x', location: 'y' }, 'tạo thiết bị chấm công'],
    ['GET', '/personnel-actions', null, 'biến động nhân sự'],
    ['POST', '/payroll/periods', { month: '2099-01' }, 'tạo kỳ lương'],
    ['POST', '/spaces', { name: 'Rogue Space', slug: `rogue-${Date.now()}` }, 'tạo không gian'],
    ['GET', '/overtime', null, 'duyệt OT toàn công ty'],
  ];
  for (const [method, path, body, desc] of userCases) {
    const r = await call(sessions.user.tokens.accessToken, method, path, body);
    check(`USER bị chặn ${method} ${path} (${desc})`, r.status === 403 || r.status === 400 || r.status === 404, `HTTP ${r.status}`);
  }

  // KM_MANAGER: được HR nhưng không được quản trị hệ thống
  const kmDenied = [
    ['GET', '/users', 'quản lý người dùng'],
    ['GET', '/admin/audit-logs', 'nhật ký kiểm toán'],
    ['POST', '/attendance/devices', 'tạo thiết bị chấm công'],
  ];
  for (const [method, path, desc] of kmDenied) {
    const r = await call(sessions.km.tokens.accessToken, method, path);
    check(`KM_MANAGER bị chặn ${method} ${path} (${desc})`, r.status === 403 || r.status === 400 || r.status === 404, `HTTP ${r.status}`);
  }
  const kmAllowed = [
    ['GET', '/personnel-actions', 'biến động nhân sự'],
    ['GET', '/employees', 'hồ sơ nhân sự (có lương)'],
  ];
  for (const [method, path, desc] of kmAllowed) {
    const r = await call(sessions.km.tokens.accessToken, method, path);
    check(`KM_MANAGER được phép ${method} ${path} (${desc})`, r.status === 200, `HTTP ${r.status}`);
  }

  // ADMIN: được toàn bộ
  const adminAllowed = [
    ['GET', '/users', 'quản lý người dùng'],
    ['GET', '/admin/audit-logs', 'nhật ký kiểm toán'],
    ['GET', '/personnel-actions', 'biến động nhân sự'],
  ];
  for (const [method, path, desc] of adminAllowed) {
    const r = await call(sessions.admin.tokens.accessToken, method, path);
    check(`ADMIN được phép ${method} ${path} (${desc})`, r.status === 200, `HTTP ${r.status}`);
  }

  // ============================================== C. DỮ LIỆU LƯƠNG THEO VAI TRÒ
  console.log('\n== C. RBAC dữ liệu lương trên GET /employees ==');
  const empUser = await call(sessions.user.tokens.accessToken, 'GET', '/employees');
  const empKm = await call(sessions.km.tokens.accessToken, 'GET', '/employees');
  const userLeak = Array.isArray(empUser.data)
    ? empUser.data.some((e) => 'baseSalary' in e)
    : true;
  check('USER gọi GET /employees KHÔNG thấy baseSalary', empUser.status === 200 && !userLeak);
  check('KM_MANAGER gọi GET /employees CÓ baseSalary',
    empKm.status === 200 && Array.isArray(empKm.data) && empKm.data.some((e) => 'baseSalary' in e));
  if (Array.isArray(empUser.data) && empUser.data[0]) {
    const detailUser = await call(sessions.user.tokens.accessToken, 'GET', `/employees/${empUser.data[0].id}`);
    check('USER xem chi tiết nhân viên KHÔNG thấy contracts/baseSalary',
      detailUser.status === 200 && !('contracts' in (detailUser.data ?? {})) && !('baseSalary' in (detailUser.data ?? {})));
  }

  // ================================================================== B. UI
  console.log('\n== B. UI crawl theo vai trò — conditional rendering ==');
  for (const key of Object.keys(ACCOUNTS)) {
    const { tokens, me } = sessions[key];
    const label = ACCOUNTS[key].label;
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate((auth) => {
      localStorage.setItem('kms-auth', JSON.stringify({ state: auth, version: 0 }));
    }, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: me });

    // Sidebar: khu "Quản trị" chỉ ADMIN thấy
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    const adminNavVisible = await page.evaluate(() => document.body.innerText.includes('Quản trị'));
    const personnelVisible = await page.evaluate(() => document.body.innerText.includes('Biến động nhân sự'));
    // Ma trận quyền: Quản trị → chỉ ADMIN; Biến động nhân sự → ADMIN + KM_MANAGER
    const expectAdminNav = label === 'ADMIN';
    const expectPersonnel = label === 'ADMIN' || label === 'KM_MANAGER';
    check(`${label}: sidebar ${expectAdminNav ? 'HIỆN' : 'ẨN'} khu Quản trị`, adminNavVisible === expectAdminNav);
    check(`${label}: sidebar ${expectPersonnel ? 'HIỆN' : 'ẨN'} Biến động nhân sự`, personnelVisible === expectPersonnel);

    // Route guard: /admin/users phải đá non-admin về /dashboard
    await page.goto(`${BASE}/admin/users`, { waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1800));
    const finalUrl = page.url();
    if (label === 'ADMIN') {
      check(`${label}: vào được /admin/users`, finalUrl.includes('/admin/users'), finalUrl);
      const hasUserTable = await page.evaluate(() => document.body.innerText.includes('Người dùng'));
      check(`${label}: trang quản lý người dùng tải nội dung`, hasUserTable);
    } else {
      check(`${label}: bị chuyển hướng khỏi /admin/users`, !finalUrl.includes('/admin/users'), finalUrl);
    }
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`\nTỔNG RBAC: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
