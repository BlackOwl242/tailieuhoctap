/**
 * Kiểm chứng bản in chuẩn báo cáo (Mục 6) trên NHIỀU trang:
 * với print media, mọi trang in phải: 0 dropdown, 0 nút bấm web (trừ tiêu đề
 * cột dạng chữ), ẩn sidebar/topbar, có khung tiêu đề doanh nghiệp.
 * Chạy: node tools/print-check.mjs
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

  const emps = await fetch('http://localhost:3001/api/v1/employees', { headers: { Authorization: `Bearer ${tokens.accessToken}` } }).then((r) => r.json());
  const routes = [
    ['/recruitment', 'Tuyển dụng'],
    ['/admin/org-units', 'Cơ cấu tổ chức'],
    [`/employees/${emps[0].id}`, `Hồ sơ NV (${emps[0].fullName})`],
    ['/leave', 'Nghỉ phép'],
    ['/payroll', 'Lương'],
  ];

  for (const [route, label] of routes) {
    await page.goto(`http://localhost:8080${route}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1800));
    await page.emulateMediaType('print');
    await new Promise((r) => setTimeout(r, 400));

    const audit = await page.evaluate(() => {
      const visible = (el) => !!el && el.getClientRects().length > 0 && el.offsetWidth > 0 && el.offsetHeight > 0;
      const pageW = document.documentElement.clientWidth;
      // "Bị khuyết" = phần tử hiển thị có mép phải vượt quá bề rộng trang in
      const clipped = [...document.querySelectorAll('.print-area *')].filter(
        (el) => visible(el) && el.getBoundingClientRect().right > pageW + 1,
      ).length;
      return {
        selects: [...document.querySelectorAll('select')].filter(visible).length,
        buttons: [...document.querySelectorAll('button')].filter((el) => visible(el) && !el.closest('th')).length,
        aside: visible(document.querySelector('aside')),
        header: visible(document.querySelector('header')),
        frame: visible(document.querySelector('.print-only')),
        clipped,
        pageW,
      };
    });

    console.log(`— ${label} (${route})`);
    check('  0 dropdown', audit.selects === 0, `${audit.selects}`);
    check('  0 nút bấm web', audit.buttons === 0, `${audit.buttons}`);
    check('  ẩn sidebar + topbar', !audit.aside && !audit.header);
    check('  có khung tiêu đề báo cáo', audit.frame);
    check('  không có phần tử nào bị khuyết quá mép trang', audit.clipped === 0, `${audit.clipped} phần tử tràn (pageW=${audit.pageW})`);
    await page.emulateMediaType('screen');
  }
} finally {
  await browser.close();
}

console.log(`\nTỔNG: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
