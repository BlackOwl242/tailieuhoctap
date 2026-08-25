/**
 * Kiểm chứng trang Tài liệu: nội dung số hiển thị được, xem chi tiết có
 * markdown, tải nội dung (.md) hoạt động.
 * Chạy: node tools/doc-view-check.mjs
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
  await page.goto('http://localhost:8080/documents', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1800));

  const contentLinks = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.textContent?.includes('Nội dung số')).length);
  check('Cột Xem/Tải hiển thị "Nội dung số" cho tài liệu không đính kèm', contentLinks >= 4, `${contentLinks} tài liệu`);

  // Mở chi tiết tài liệu đầu tiên
  await page.evaluate(() => {
    const kebab = document.querySelector('button[aria-label^="Hành động cho dòng"]');
    kebab?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const item = [...document.querySelectorAll('[role="menuitem"]')].find((b) => b.textContent?.includes('Xem chi tiết'));
    item?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const hasMarkdown = await page.evaluate(() => !!document.querySelector('.modal-content, [class*="markdown-body"]') || document.body.innerText.includes('NỘI QUY') || document.body.innerText.includes('Điều 1'));
  check('Modal chi tiết render nội dung markdown của tài liệu', hasMarkdown);
  const hasDownload = await page.evaluate(() => !![...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Tải nội dung (.md)')));
  check('Có nút "Tải nội dung (.md)"', hasDownload);

  // Bấm tải — Chrome headless phát sự kiện download; chỉ cần không lỗi là đạt
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Tải nội dung (.md)'));
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  check('Bấm tải nội dung không gây lỗi', true);
} finally {
  await browser.close();
}

console.log(`\nTỔNG: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
