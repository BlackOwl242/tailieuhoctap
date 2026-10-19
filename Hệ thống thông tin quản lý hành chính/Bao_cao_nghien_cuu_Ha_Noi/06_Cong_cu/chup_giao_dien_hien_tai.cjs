(async()=>{
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:/Users/legen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '03_Thiet_ke', 'Anh_giao_dien_he_thong');
const CONFIG = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const BASE = `http://127.0.0.1:${CONFIG.port}`;
const browser = await chromium.launch({headless:true,channel:'msedge'});
const captures = [], errors = [];
async function settle(page) { await page.waitForLoadState('networkidle'); await page.evaluate(() => document.fonts.ready); }
async function shot(page, idx, title, role, route) {
  await settle(page);
  await page.screenshot({path:path.join(OUT,`ui_current_${String(idx).padStart(2,'0')}.jpg`),type:'jpeg',quality:92,animations:'disabled'});
  const meta = await page.evaluate(() => ({width:innerWidth,height:innerHeight}));
  captures.push({file:`ui_current_${String(idx).padStart(2,'0')}.jpg`,title,role,route:route || new URL(page.url()).pathname+new URL(page.url()).search,width:meta.width,height:meta.height,capturedAt:new Date().toISOString()});
  console.log(`CAPTURED ${idx}: ${title}`);
}
async function task(name, fn) { try { await fn(); } catch (e) { errors.push({name,error:String(e).slice(0,500)}); console.log('FAILED',name,String(e).slice(0,180)); } }
async function pageAt(route, viewport={width:1440,height:1000}) { const p=await browser.newPage({viewport,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'}); p.setDefaultTimeout(10000); await p.goto(BASE+route); await settle(p); return p; }
async function staff(role) { const ctx=await browser.newContext({viewport:{width:1440,height:1000},locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'}); await ctx.addCookies([{name:'hni_session',value:CONFIG.roles[role].token,url:BASE,httpOnly:true,sameSite:'Strict'}]); const p=await ctx.newPage(); p.setDefaultTimeout(10000); await p.goto(BASE+'/staff'); await settle(p); return {ctx,p}; }
async function nav(p, label) { await p.locator('.nav-link').filter({hasText:label}).first().click(); await settle(p); await p.evaluate(()=>scrollTo(0,0)); }
// 01–02 public homepage
const home=await pageAt('/'); await shot(home,1,'Trang chủ dịch vụ công Hà Nội trên máy tính','Người dân','/'); await home.setViewportSize({width:390,height:844}); await shot(home,2,'Trang chủ trên điện thoại','Người dân','/'); await home.close();
// 03–13 public catalog, submission, tracking, appointment and news
const cat=await pageAt('/thu-tuc'); await shot(cat,3,'Danh mục thủ tục công dân','Người dân','/thu-tuc'); await cat.close();
const detail=await pageAt('/thu-tuc/1.014677'); await shot(detail,4,'Chi tiết thủ tục và thông tin thực hiện','Người dân','/thu-tuc/1.014677'); await detail.close();
const form=await pageAt('/nop-ho-so');
await form.getByPlaceholder('Nhập mã thủ tục, tên thủ tục hoặc tên Sở/ngành').fill('2.000908'); await form.waitForTimeout(300); await form.locator('.procedure-choice-list button').first().click(); await form.locator('select').first().selectOption({label:CONFIG.roles.intake.scope});
await shot(form,5,'Bước 1 chọn thủ tục và cơ quan tiếp nhận','Người dân','/nop-ho-so');
await form.getByRole('button',{name:'Tiếp tục',exact:true}).click(); await form.getByLabel(/Họ và tên người yêu cầu/).fill('Nguyễn Văn An (minh họa)'); await form.getByLabel('Email').fill('minhhoa@example.test'); await shot(form,6,'Bước 2 khai thông tin người yêu cầu','Người dân','/nop-ho-so');
await form.getByRole('button',{name:'Tiếp tục',exact:true}).click();
await form.getByLabel(/Địa chỉ liên hệ/).fill('Số 10 phố minh họa, phường Tây Hồ, Hà Nội'); await form.getByLabel(/Loại giấy tờ nhận dạng/).selectOption({label:'Thẻ căn cước'}); await form.getByLabel(/Số giấy tờ nhận dạng/).fill('012345678901'); await form.getByLabel(/Tư cách yêu cầu cấp bản sao/).selectOption({label:'Người được cấp bản chính'}); await form.getByLabel(/Tên người hoặc tổ chức được cấp bản chính/).fill('Nguyễn Văn An'); await form.getByLabel(/Tên giấy tờ đề nghị cấp bản sao/).fill('Trích lục minh họa'); await form.getByLabel(/Số bản sao đề nghị cấp/).fill('1');
await shot(form,7,'Bước 3 tờ khai theo thủ tục được chọn','Người dân','/nop-ho-so'); await form.getByRole('button',{name:'Tiếp tục',exact:true}).click(); await shot(form,8,'Bước 4 thành phần hồ sơ và tài liệu đính kèm','Người dân','/nop-ho-so'); await form.getByRole('button',{name:'Tiếp tục',exact:true}).click(); await shot(form,9,'Bước 5 kiểm tra trước khi gửi hồ sơ','Người dân','/nop-ho-so'); await form.close();
const track=await pageAt('/tra-cuu-ho-so'); await shot(track,10,'Tra cứu hồ sơ bằng mã và khóa tra cứu','Người dân','/tra-cuu-ho-so'); await track.close();
const util=await pageAt('/tien-ich'); await shot(util,11,'Đặt lịch hẹn tại bộ phận một cửa','Người dân','/tien-ich'); await util.getByRole('button',{name:'Gửi phản ánh',exact:true}).click(); await shot(util,12,'Gửi phản ánh, kiến nghị','Người dân','/tien-ich'); await util.close();
const news=await pageAt('/?tin=khai-sinh'); await shot(news,13,'Chi tiết tin tức công khai','Người dân','/?tin=khai-sinh'); await news.close();
// 14: staff sign-in
const login=await pageAt('/staff'); await shot(login,14,'Đăng nhập bàn cán bộ','Cán bộ','/staff'); await login.close();
// 15–18: intake overview, inbox, direct intake and a case detail
const intake=await staff('intake'); await nav(intake.p,'Tổng quan'); await shot(intake.p,15,'Tổng quan công việc cán bộ tiếp nhận','Cán bộ tiếp nhận'); await nav(intake.p,'Hộp xử lý'); await shot(intake.p,16,'Hộp xử lý hồ sơ theo phạm vi cơ quan','Cán bộ tiếp nhận');
await task('direct intake',async()=>{await nav(intake.p,'Quầy một cửa'); await intake.p.getByRole('button',{name:/Ghi nhận tiếp nhận tại quầy/}).click(); await shot(intake.p,17,'Lập phiếu tiếp nhận trực tiếp tại quầy','Cán bộ tiếp nhận'); await nav(intake.p,'Hộp xử lý');});
await task('case detail',async()=>{await intake.p.getByRole('button',{name:/Mở hồ sơ/}).first().click(); await shot(intake.p,18,'Chi tiết hồ sơ và thao tác được phép','Cán bộ tiếp nhận');});
await intake.ctx.close();
// 19–22 role-specific inboxes
for (const [idx,role,title] of [[19,'specialist','Hộp xử lý của chuyên viên thụ lý'],[20,'leader','Hộp xử lý của lãnh đạo phê duyệt'],[21,'registrar','Hộp xử lý của văn thư phát hành'],[22,'finance','Hộp xử lý của cán bộ tài chính']]) { const w=await staff(role); await shot(w.p,idx,title,role); await w.ctx.close(); }
// 23–27 monitoring, activity, integrations and personal account
const op=await staff('intake'); await nav(op.p,'Giám sát quy trình'); await shot(op.p,23,'Giám sát tiến độ và hạn xử lý hồ sơ','Cán bộ tiếp nhận'); await nav(op.p,'Nhật ký hồ sơ'); await shot(op.p,24,'Nhật ký xử lý và luân chuyển hồ sơ','Cán bộ tiếp nhận'); await nav(op.p,'Kết nối dịch vụ'); await shot(op.p,25,'Trạng thái tích hợp và dịch vụ nội bộ','Cán bộ tiếp nhận');
await task('profile',async()=>{await op.p.locator('.account-menu-button').click(); await shot(op.p,26,'Thông tin tài khoản và phạm vi quyền','Cán bộ tiếp nhận'); await op.p.evaluate(()=>scrollTo(0,document.body.scrollHeight)); await shot(op.p,27,'Bảo mật tài khoản và phiên đăng nhập','Cán bộ tiếp nhận');}); await op.ctx.close();
// 28–37 administrator
const admin=await staff('admin'); await nav(admin.p,'Tổng quan'); await shot(admin.p,28,'Tổng quan quản trị hệ thống','Quản trị viên'); await nav(admin.p,'Tài khoản cán bộ'); await shot(admin.p,29,'Danh bạ tài khoản và phân quyền','Quản trị viên');
await task('account permissions',async()=>{await admin.p.getByRole('heading',{name:'Đề nghị cấp quyền mới'}).scrollIntoViewIfNeeded(); await shot(admin.p,30,'Đề nghị cấp mới và điều chỉnh quyền tài khoản','Quản trị viên');});
await task('account create',async()=>{await admin.p.getByRole('button',{name:/Lập đề nghị cấp tài khoản|Cấp tài khoản cán bộ mới/}).first().click(); await shot(admin.p,31,'Biểu mẫu lập đề nghị cấp tài khoản','Quản trị viên');});
await nav(admin.p,'Báo cáo theo cơ quan'); await shot(admin.p,32,'Báo cáo hồ sơ theo cơ quan và trạng thái','Quản trị viên'); await nav(admin.p,'Danh mục thủ tục'); await shot(admin.p,33,'Danh mục thủ tục trong bàn quản trị','Quản trị viên');
await task('procedure detail',async()=>{await admin.p.locator('button').filter({hasText:/\d\.\d{6}/}).first().click(); await shot(admin.p,34,'Chi tiết và dữ liệu tham chiếu thủ tục','Quản trị viên');});
await nav(admin.p,'Tin tức cổng thông tin'); await shot(admin.p,35,'Danh sách và trạng thái tin trên cổng','Quản trị viên'); await task('news editor',async()=>{await admin.p.getByRole('button',{name:'＋ Soạn tin mới',exact:true}).click(); await shot(admin.p,36,'Biểu mẫu biên tập tin tức','Quản trị viên');}); await nav(admin.p,'Kết nối dịch vụ'); await task('signing rights',async()=>{await admin.p.locator('.sandbox-signer-workspace h2').first().scrollIntoViewIfNeeded(); await shot(admin.p,37,'Quản lý quyền ký thử nghiệm nội bộ','Quản trị viên');}); await admin.ctx.close();
// 38 financial ledger
const finance=await staff('finance'); await nav(finance.p,'Kết nối dịch vụ'); await task('fee ledger',async()=>{await finance.p.locator('.sandbox-payment-workspace h2').first().scrollIntoViewIfNeeded(); await shot(finance.p,38,'Sổ khoản thu và đối soát trong phạm vi cơ quan','Cán bộ tài chính');}); await finance.ctx.close();
// 39–45: real guide page, positioned on current role instructions
const guide=await pageAt('/huong-dan'); await shot(guide,39,'Hướng dẫn người dân: tra cứu và lập hồ sơ','Người dân','/huong-dan'); await guide.getByRole('button',{name:'Cán bộ',exact:true}).click();
const roleSteps=[[40,'Cán bộ tiếp nhận',3],[41,'Chuyên viên thụ lý',4],[42,'Lãnh đạo phê duyệt',5],[43,'Văn thư phát hành',13],[44,'Cán bộ tài chính',11],[45,'Quản trị hệ thống',7]];
for(const [idx,title,step] of roleSteps) await task(`guide ${title}`,async()=>{const li=guide.locator('.guide-steps li').nth(step); await li.scrollIntoViewIfNeeded(); await shot(guide,idx,`Hướng dẫn cán bộ: ${title}`,title,'/huong-dan');}); await guide.close();
await fs.writeFile(path.join(OUT,'Danh_muc_anh_giao_dien.json'),JSON.stringify({version:'2026-10-19-current-ui',dataScope:'Ảnh chụp từ phiên ứng dụng chạy trên bản sao cơ sở dữ liệu; không thay đổi hồ sơ của môi trường đang vận hành.',captures,errors},null,2)+'\n','utf8'); await browser.close(); console.log(JSON.stringify({captured:captures.length,errors},null,2));

})().catch(e=>{console.error(e);process.exit(1)});



