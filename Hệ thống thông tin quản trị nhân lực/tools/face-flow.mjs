/**
 * Kiểm chứng luồng khuôn mặt khi CHƯA đăng nhập:
 * từ /login bấm "Điểm danh khuôn mặt" → phải ở lại /check-in?mode=face
 * và hiện lời mời đăng nhập (không bị giật ngược về login).
 * Chạy: node tools/face-flow.mjs
 */
import puppeteer from 'puppeteer-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--use-fake-ui-for-media-stream'] });
let pass = 0;
let fail = 0;
const check = (n, ok, extra = '') => {
  if (ok) { pass += 1; console.log(`  PASS  ${n}${extra ? ` — ${extra}` : ''}`); }
  else { fail += 1; console.log(`  FAIL  ${n}${extra ? ` — ${extra}` : ''}`); }
};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Đảm bảo KHÔNG có phiên đăng nhập
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());

  // Bấm link "Điểm danh khuôn mặt" trên trang login
  const link = await page.evaluateHandle(() => {
    const els = [...document.querySelectorAll('a')];
    return els.find((a) => a.textContent?.includes('Điểm danh khuôn mặt'));
  });
  check('Tìm thấy link "Điểm danh khuôn mặt" trên trang login', !!link && !!link.asElement());
  await link.asElement().click();
  await new Promise((r) => setTimeout(r, 3000));

  check('Ở lại trang check-in (không bị giật ngược về login)', page.url().includes('/check-in?mode=face'), page.url());
  const hasPrompt = await page.evaluate(() => document.body.innerText.includes('Bạn cần đăng nhập để đăng ký và điểm danh khuôn mặt'));
  check('Hiển thị lời mời đăng nhập thân thiện', hasPrompt);
  const hasLoginBtn = await page.evaluate(() => !![...document.querySelectorAll('a')].find((a) => a.textContent?.includes('Đăng nhập')));
  check('Có nút "Đăng nhập" dẫn kèm ?next quay lại đúng màn', hasLoginBtn);
} finally {
  await browser.close();
}

console.log(`\nTỔNG: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
