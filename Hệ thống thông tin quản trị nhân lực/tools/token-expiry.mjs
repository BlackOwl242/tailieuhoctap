/**
 * Kiểm chứng xử lý token hết hạn (roll back về trang đăng nhập):
 * - Kịch bản A: access token giả + refresh token THẬT → tự refresh → vào được trang;
 * - Kịch bản B: cả hai đều giả → tự đăng xuất → về /login (không treo màn lỗi).
 * Chạy: node tools/token-expiry.mjs
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:8080';
const API = 'http://localhost:3001/api/v1';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
let pass = 0;
let fail = 0;
const check = (n, ok, extra = '') => {
  if (ok) { pass += 1; console.log(`  PASS  ${n}${extra ? ` — ${extra}` : ''}`); }
  else { fail += 1; console.log(`  FAIL  ${n}${extra ? ` — ${extra}` : ''}`); }
};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Phiên thật để lấy refresh token hợp lệ
  const tokens = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.local', password: 'Admin@123' }),
  }).then((r) => r.json());
  const me = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } }).then((r) => r.json());

  async function inject(accessToken, refreshToken) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
    await page.evaluate((a) => localStorage.setItem('kms-auth', JSON.stringify({ state: a, version: 0 })),
      { accessToken, refreshToken, user: me });
  }

  // --- Kịch bản A: access giả + refresh thật → tự refresh, vào được trang
  await inject('gia.access.token', tokens.refreshToken);
  await page.goto(`${BASE}/employees`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2500));
  check('A: access hết hạn + refresh còn hạn → tự refresh, không văng ra login',
    page.url().includes('/employees'), page.url());
  const loaded = await page.evaluate(() => document.body.innerText.includes('Hồ sơ nhân viên'));
  check('A: trang tải dữ liệu đầy đủ sau refresh', loaded);

  // --- Kịch bản B: cả hai giả → tự đăng xuất về /login
  await inject('gia.access.token', 'gia.refresh.token');
  await page.goto(`${BASE}/employees`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 3000));
  check('B: phiên chết hoàn toàn → tự roll back về /login', page.url().includes('/login'), page.url());
  const noErrorScreen = await page.evaluate(() => !document.body.innerText.includes('Token không hợp lệ'));
  check('B: không treo ở màn hình lỗi "Token không hợp lệ"', noErrorScreen);
  const cleared = await page.evaluate(() => {
    const raw = localStorage.getItem('kms-auth');
    return !raw || !JSON.parse(raw).state?.accessToken;
  });
  check('B: phiên cũ đã được xóa sạch khỏi localStorage', cleared);
} finally {
  await browser.close();
}

console.log(`\nTỔNG: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
