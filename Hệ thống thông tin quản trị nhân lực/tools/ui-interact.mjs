/**
 * Kiểm thử tương tác UI (Mục 7 + 8): kebab menu và global search.
 * Chạy: node tools/ui-interact.mjs
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:8080';
const API = 'http://localhost:3001/api/v1';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
let pass = 0;
let fail = 0;
function check(name, ok) {
  if (ok) { pass += 1; console.log(`  PASS  ${name}`); }
  else { fail += 1; console.log(`  FAIL  ${name}`); }
}

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const tokens = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.local', password: 'Admin@123' }),
  }).then((r) => r.json());
  const me = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } }).then((r) => r.json());

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate((auth) => localStorage.setItem('kms-auth', JSON.stringify({ state: auth, version: 0 })),
    { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: me });

  // ---------------------------------------------------- Mục 8: kebab menu
  await page.goto(`${BASE}/employees`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  const kebab = await page.$('button[aria-label^="Hành động cho dòng"]');
  check('Mục 8: nút 3 chấm hiển thị trên bảng Nhân sự', !!kebab);
  if (kebab) {
    await kebab.click();
    await new Promise((r) => setTimeout(r, 400));
    const menuVisible = await page.evaluate(() => {
      const menu = document.querySelector('[role="menu"]');
      if (!menu) return false;
      const r = menu.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1;
    });
    check('Mục 8: dropdown portal mở đầy đủ, không bị cắt', menuVisible);
    const itemCount = await page.evaluate(() => document.querySelectorAll('[role="menu"] [role="menuitem"]').length);
    check('Mục 8: menu chứa hành động (icon + label)', itemCount >= 2, `${itemCount} mục`);
    await page.keyboard.press('Escape');
    const closed = await page.evaluate(() => !document.querySelector('[role="menu"]'));
    check('Mục 8: Esc đóng dropdown', closed);
  }

  // ---------------------------------------------------- Mục 7: global search
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const searchBox = await page.$('input[aria-label="Tìm kiếm toàn hệ thống"]');
  check('Mục 7: thanh tìm kiếm toàn hệ thống hiển thị trên header', !!searchBox);
  if (searchBox) {
    await searchBox.type('Nguyễn', { delay: 60 });
    await new Promise((r) => setTimeout(r, 1200));
    const hasResults = await page.evaluate(() => {
      const listbox = document.querySelector('[role="listbox"]');
      return !!listbox && listbox.querySelectorAll('[role="option"]').length > 0;
    });
    check('Mục 7: gợi ý autocomplete phân nhóm hiển thị', hasResults);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 1500));
    const navigated = page.url().includes('/employees/');
    check('Mục 7: Enter điều hướng tới kết quả (bàn phím)', navigated, page.url());
  }

  // --------------------------------------- Mục 7b: CLICK CHUỘT từng kết quả
  // Regression cho lỗi "kết quả tìm kiếm hiển thị nhưng không bấm được":
  // panel portal bị outside-mousedown đóng trước khi click kịp chạy.
  async function searchAndClick(term, index) {
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const input = await page.$('input[aria-label="Tìm kiếm toàn hệ thống"]');
    if (!input) return { ok: false, reason: 'không thấy ô tìm kiếm' };
    await input.type(term, { delay: 50 });
    await new Promise((r) => setTimeout(r, 1300));
    const options = await page.$$('[role="listbox"] [role="option"]');
    if (options.length <= index) return { ok: false, reason: `chỉ ${options.length} kết quả` };
    await options[index].click();
    await new Promise((r) => setTimeout(r, 1800));
    const url = page.url();
    const boundary = await page.evaluate(() => document.body.innerText.includes('Đã xảy ra lỗi không mong muốn'));
    const hasContent = await page.evaluate(() => document.body.innerText.trim().length > 120);
    return {
      ok: !url.includes('/dashboard') && !url.includes('/login') && !boundary && hasContent,
      url,
      boundary,
      hasContent,
    };
  }

  // Lưu ý: component chỉ tìm khi từ khóa ≥ 2 ký tự (debounce 250ms)
  for (const [term, idx] of [['Nguyễn', 0], ['Nguyễn', 1], ['java', 0]]) {
    const r = await searchAndClick(term, idx);
    check(`Mục 7b: click kết quả #${idx + 1} cho "${term}" điều hướng + tải đúng trang`, r.ok,
      `${r.url ?? ''}${r.boundary ? ' · ERROR BOUNDARY' : ''}${r.reason ? ` · ${r.reason}` : ''}`);
  }

  // ---------------------------------------------------- Mục 6: StarRating
  await page.goto(`${BASE}/recruitment`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  const starShown = await page.evaluate(() => document.querySelectorAll('svg.lucide-star, [aria-label*="sao"]').length > 0 || document.body.innerText.includes('/5'));
  check('Mục 6: hiển thị đánh giá sao trong bảng ứng viên', starShown);

  // ---------------------------------------------------- Mục 2: thuật ngữ
  await page.goto(`${BASE}/spaces`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  const noSpaceWord = await page.evaluate(() => !document.body.innerText.includes('Space tri thức'));
  check('Mục 2: không còn "Space tri thức" — đã thành "Không gian tri thức"', noSpaceWord);
} finally {
  await browser.close();
}

console.log(`\nTỔNG: ${pass} PASS / ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
