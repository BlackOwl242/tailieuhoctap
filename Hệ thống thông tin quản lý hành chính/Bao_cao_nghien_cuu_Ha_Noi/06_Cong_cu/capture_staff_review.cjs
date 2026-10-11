const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '03_Thiet_ke', 'Anh_giao_dien_he_thong');
const base = process.argv[2];
if (!base) throw new Error('Pass the disposable screenshot server URL.');

(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  const context = await browser.newContext({viewport: {width: 1440, height: 1050}, deviceScaleFactor: 1});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function screenshot(file, fullPage = false) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path: path.join(output, file), type: 'jpeg', quality: 94, fullPage});
  }
  async function login(email) {
    await page.goto(base + '/staff?capture=1');
    await page.locator('input[name=email]').fill(email);
    await page.locator('input[name=password]').fill('ReviewPassword2026');
    await page.getByRole('button', {name: 'Đăng nhập cán bộ', exact: true}).click();
    await page.locator('.sidebar').waitFor();
  }
  async function nav(label, title) {
    await page.locator('.sidebar').getByRole('button', {name: label, exact: false}).click();
    await page.getByRole('heading', {level: 1, name: title, exact: true}).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.goto(base + '/?capture=1');
  await page.locator('.public-site').waitFor();
  await screenshot('01_cong_dan_may_tinh.jpg');
  await page.setViewportSize({width:390,height:844});
  await screenshot('02_cong_dan_dien_thoai.jpg');
  await page.setViewportSize({width:1440,height:1500});
  await screenshot('12_cong_dan_tin_tuc.jpg');
  await page.setViewportSize({width:1440,height:1050});
  await page.goto(base + '/staff?capture=1');
  await page.locator('#staff-login-title').waitFor();
  await screenshot('03_dang_nhap_can_bo.jpg');
  await login('intake@example.test');
  if (await page.getByRole('button', {name: 'Đăng xuất', exact: true}).count() !== 1) throw new Error('Repeated logout buttons.');
  if (await page.locator('.topbar .signout, .note-dot, .scope-stamp i').count()) throw new Error('Old logout or status dots remain.');
  await nav('Tổng quan', 'Tổng quan điều hành'); await screenshot('04_tong_quan_can_bo.jpg');
  await nav('Hộp xử lý', 'Hộp xử lý hồ sơ'); await screenshot('05_hop_xu_ly.jpg');
  await page.getByRole('button', {name: 'Mở hồ sơ CASE-A', exact: true}).click();
  await page.getByRole('heading', {level: 1, name: 'Chi tiết hồ sơ', exact: true}).waitFor();
  await screenshot('06_chi_tiet_ho_so.jpg');
  await nav('Giám sát quy trình', 'Giám sát quy trình'); await screenshot('08_giam_sat_quy_trinh.jpg');
  await nav('Danh mục thủ tục', 'Danh mục thủ tục'); await screenshot('09_danh_muc_thu_tuc.jpg');
  await nav('Nhật ký hồ sơ', 'Nhật ký hồ sơ'); await screenshot('10_nhat_ky_ho_so.jpg');
  await nav('Kết nối dịch vụ', 'Kết nối dịch vụ'); await screenshot('11_ket_noi_dich_vu.jpg');
  await page.getByRole('button', {name: 'Mở tài khoản cá nhân', exact: true}).click();
  await page.getByText('Đã được quản trị viên duyệt', {exact: false}).waitFor();
  await page.setViewportSize({width:1440,height:760});
  await screenshot('15_tai_khoan_ca_nhan.jpg');
  await page.setViewportSize({width:1440,height:1050});
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await screenshot('16_bao_mat_tai_khoan.jpg');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({width: 390, height: 844});
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile profile overflow.');
  await page.getByRole('button', {name: 'Mở danh mục cán bộ', exact: true}).click();
  await page.getByRole('button', {name: 'Đăng xuất', exact: true}).click();
  await page.locator('.app-shell').waitFor({state:'detached'});
  await page.setViewportSize({width:1440,height:1050});
  await login('admin1@example.test');
  await nav('Tài khoản cán bộ', 'Quản lý tài khoản cán bộ'); await screenshot('07_quan_ly_tai_khoan.jpg');
  await nav('Tin tức cổng thông tin', 'Quản lý tin tức');
  await page.getByRole('button', {name: /Tạo tin|Viết tin|Soạn tin|Tin mới|Thêm tin/}).first().waitFor();
  await screenshot('13_quan_ly_tin_tuc.jpg');
  await page.getByRole('button', {name: /Tạo tin|Viết tin|Soạn tin|Tin mới|Thêm tin/}).first().click();
  await page.locator('.news-editor-form').waitFor();
  await screenshot('14_soan_tin_tuc.jpg', true);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured updated staff screens; mobile layout, single logout and browser runtime checks passed.');
  await browser.close();
})().catch(error => {console.error(error);process.exit(1);});
