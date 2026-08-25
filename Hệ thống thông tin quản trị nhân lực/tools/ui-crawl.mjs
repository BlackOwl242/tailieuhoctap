/**
 * Crawler kiểm thử UI bằng Edge headless:
 * - Đăng nhập qua API, inject phiên vào localStorage (kms-auth);
 * - Truy cập từng trang, bắt pageerror + console.error + lỗi boundary;
 * - Ghi nhận cả ảnh chụp trang lỗi (nếu có).
 * Chạy: node tools/ui-crawl.mjs
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:8080';
const API = 'http://localhost:3001/api/v1';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const ROUTES = [
  '/dashboard', '/employees', '/leave', '/overtime', '/payroll', '/recruitment',
  '/performance', '/training', '/personnel', '/documents', '/handover',
  '/attendance', '/people', '/spaces', '/search', '/review', '/onboarding',
  '/notifications', '/profile', '/admin/users', '/admin/org-units',
  '/admin/attendance', '/admin/settings', '/admin/audit', '/kiosk', '/login', '/check-in?mode=face',
];

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const tokens = await res.json();
  const me = await fetch(`${API}/auth/me`, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  }).then((r) => r.json());
  return { tokens, me };
}

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});

const results = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Đăng nhập admin và inject phiên
  const { tokens, me } = await login('admin@demo.local', 'Admin@123');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((auth) => {
    localStorage.setItem('kms-auth', JSON.stringify({ state: auth, version: 0 }));
  }, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: me });

  // Lấy thêm các trang động (chi tiết) để quét đầy đủ
  const auth = { Authorization: `Bearer ${tokens.accessToken}` };
  const [articles, spaces, employees] = await Promise.all([
    fetch(`${API}/search?q=a`, { headers: auth }).then((r) => r.json()).catch(() => null),
    fetch(`${API}/spaces`, { headers: auth }).then((r) => r.json()).catch(() => null),
    fetch(`${API}/employees`, { headers: auth }).then((r) => r.json()).catch(() => null),
  ]);
  const dynamic = [];
  const firstArticle = articles?.items?.[0]?.id;
  if (firstArticle) dynamic.push(`/articles/${firstArticle}`);
  const firstSpace = spaces?.items?.[0]?.slug;
  if (firstSpace) dynamic.push(`/spaces/${firstSpace}`);
  const firstEmp = employees?.[0]?.id;
  if (firstEmp) dynamic.push(`/employees/${firstEmp}`);

  for (const route of [...ROUTES, ...dynamic]) {
    const errors = [];
    const onConsole = (msg) => {
      if (msg.type() === 'error') errors.push(`console: ${msg.text().slice(0, 300)}`);
    };
    const onPageError = (err) => errors.push(`pageerror: ${String(err).slice(0, 300)}`);
    page.on('console', onConsole);
    page.on('pageerror', onPageError);
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1800)); // đợi query render
      const boundary = await page.$('text=Đã xảy ra lỗi không mong muốn').catch(() => null);
      const boundaryFound = await page.evaluate(() => document.body.innerText.includes('Đã xảy ra lỗi không mong muốn')).catch(() => false);
      const hasQr = route === '/kiosk'
        ? await page.evaluate(() => !!document.querySelector('img[alt="Mã QR điểm danh"]')).catch(() => false)
        : null;
      results.push({ route, ok: errors.length === 0 && !boundaryFound, boundaryFound, qrRendered: hasQr, errors });
    } catch (e) {
      results.push({ route, ok: false, errors: [`navigation: ${String(e).slice(0, 200)}`] });
    }
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
} finally {
  await browser.close();
}

let fail = 0;
for (const r of results) {
  const status = r.ok ? 'OK  ' : 'FAIL';
  if (!r.ok) fail += 1;
  console.log(`${status} ${r.route}${r.qrRendered !== null ? ` · QR=${r.qrRendered ? 'HIỆN' : 'KHÔNG HIỆN'}` : ''}`);
  for (const e of r.errors) console.log(`       ${e}`);
}
console.log(`\nTỔNG: ${results.length - fail}/${results.length} trang sạch lỗi runtime`);
process.exit(fail > 0 ? 1 : 0);
