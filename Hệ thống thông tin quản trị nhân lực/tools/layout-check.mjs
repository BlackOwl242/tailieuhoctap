/**
 * Kiểm chứng layout (Mục 9 fix): trang Cơ cấu tổ chức chế độ Sơ đồ không làm
 * giãn vỡ trang (không cuộn ngang toàn trang), sơ đồ cuộn trong khung riêng;
 * thanh tìm kiếm hệ thống giới hạn bề rộng (không dài hết topbar).
 * Chạy: node tools/layout-check.mjs
 */
import puppeteer from 'puppeteer-core';

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

  const tokens = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.local', password: 'Admin@123' }),
  }).then((r) => r.json());
  const me = await fetch('http://localhost:3001/api/v1/auth/me', { headers: { Authorization: `Bearer ${tokens.accessToken}` } }).then((r) => r.json());

  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle0' });
  await page.evaluate((a) => localStorage.setItem('kms-auth', JSON.stringify({ state: a, version: 0 })),
    { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: me });
  await page.goto('http://localhost:8080/admin/org-units', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));

  // Chuyển sang chế độ Sơ đồ
  const chartBtn = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Sơ đồ')));
  await chartBtn.asElement().click();
  await new Promise((r) => setTimeout(r, 800));

  const m = await page.evaluate(() => ({
    docScrollW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
    searchW: document.querySelector('input[aria-label="Tìm kiếm toàn hệ thống"]')?.offsetWidth ?? 0,
    // Không phần tử nào của sơ đồ vượt quá mép phải viewport (thiết kế mới:
    // sơ đồ xếp dọc + grid tự xuống dòng, không cần cuộn ngang)
    clipped: [...document.querySelectorAll('.print-area, main *')].filter(
      (el) => el.getClientRects().length > 0 && el.getBoundingClientRect().right > window.innerWidth + 2,
    ).length,
    chartBoxes: document.querySelectorAll('main .rounded-lg.border-2').length,
  }));

  check('Trang không bị giãn ngang (không cuộn ngang toàn trang)', m.docScrollW <= m.winW + 2, `doc=${m.docScrollW} vs win=${m.winW}`);
  check('Sơ đồ không có phần tử nào bị khuyết quá mép màn hình', m.clipped === 0, `${m.clipped} phần tử tràn · ${m.chartBoxes} hộp đơn vị`);
  check('Thanh tìm kiếm giới hạn bề rộng (≤ 36rem = 576px)', m.searchW > 0 && m.searchW <= 580, `${m.searchW}px`);
} finally {
  await browser.close();
}

console.log(`\nTỔNG: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
