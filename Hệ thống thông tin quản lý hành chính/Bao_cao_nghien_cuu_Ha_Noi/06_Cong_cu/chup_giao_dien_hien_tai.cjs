const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('C:/Users/legen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/legen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

(async () => {
  const config = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
  const root = path.resolve(__dirname, '..');
  const out = path.join(root, '03_Thiet_ke', 'Anh_giao_dien_he_thong');
  const base = `http://127.0.0.1:${config.port}`;
  const browser = await chromium.launch({headless: true, channel:'msedge'});
  const manifest = [], errors = [];
  async function ready(page) {
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
  }
  async function capture(page, file, title, role='citizen', selector=null) {
    await ready(page);
    const target = selector ? page.locator(selector).first() : page;
    await target.screenshot({path:path.join(out,file),type:'jpeg',quality:91,animations:'disabled'});
    const meta = await sharp(path.join(out,file)).metadata();
    manifest.push({file,title,role,route:new URL(page.url()).pathname+new URL(page.url()).search,width:meta.width,height:meta.height,capturedAt:new Date().toISOString()});
    await fs.writeFile(path.join(out,'Danh_muc_anh_giao_dien.json'),JSON.stringify({version:'2026-10-16',dataScope:'Bản sao cơ sở dữ liệu ứng dụng chỉ dùng chụp tài liệu; không thay đổi dữ liệu đang vận hành',captures:manifest,errors},null,2),'utf8');
    console.log('CAPTURED',file);
  }
  async function task(name, fn) {try {await fn();}catch(e){errors.push({name,error:String(e)});console.log('FAILED',name,String(e).slice(0,250));}}
  const pub = await browser.newContext({viewport:{width:1440,height:1000},locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
  const p = await pub.newPage();
  p.setDefaultTimeout(6000);
  await p.goto(base);
  await capture(p,'01_cong_dan_may_tinh.jpg','Trang chủ trên máy tính sau khi bỏ khối tra cứu trùng');
  await p.setViewportSize({width:390,height:844});
  await capture(p,'02_cong_dan_dien_thoai.jpg','Trang chủ trên điện thoại');
  await p.setViewportSize({width:1440,height:1000});
  await p.goto(base+'/staff');
  await capture(p,'03_dang_nhap_can_bo.jpg','Đăng nhập bằng tài khoản nội bộ được cấp');
  await p.goto(base+'/?tin=khai-sinh');
  await capture(p,'12_cong_dan_tin_tuc.jpg','Chi tiết tin tức công khai trong hệ thống');
  await p.goto(base+'/thu-tuc');
  await capture(p,'17_danh_muc_cong_dan.jpg','Danh mục thủ tục dành cho công dân và tổ chức');
  await task('procedure detail',async()=>{
    const buttons=await p.locator('button').allTextContents();
    console.log('PUBLIC_CATALOG_BUTTONS',JSON.stringify(buttons.slice(0,20)));
    await p.getByRole('button',{name:/Cấp bản sao từ sổ gốc|Xem chi tiết/}).first().click();
    await p.locator('.dvc-detail-header').evaluate(el=>el.scrollIntoView({block:'start'}));
    await capture(p,'18_chi_tiet_thu_tuc.jpg','Chi tiết thủ tục và cơ quan thực hiện');
  });
  await p.goto(base+'/nop-ho-so');
  await p.getByPlaceholder('Nhập mã thủ tục hoặc tên thủ tục').fill('2.000908');
  await p.locator('.procedure-choice-list button').filter({hasText:'Cấp bản sao từ sổ gốc'}).first().click();
  await p.locator('.citizen-form-section select').last().selectOption({label:config.roles.intake.scope});
  await capture(p,'19_nop_ho_so.jpg','Bước 1 chọn thủ tục và cơ quan tiếp nhận');
  await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await capture(p,'42_nguoi_nop_ho_so.jpg','Bước 2 khai thông tin người yêu cầu');
  await p.getByLabel('Họ và tên người yêu cầu').fill('Người nộp minh họa');
  await p.getByLabel('Email',{exact:true}).fill('minhhoa@example.test');
  await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await capture(p,'43_to_khai_thu_tuc.jpg','Bước 3 tờ khai theo cấu hình chuyên ngành');
  await p.getByLabel('Địa chỉ liên hệ').fill('Địa chỉ minh họa dùng để trình bày giao diện');
  await p.getByLabel('Loại giấy tờ nhận dạng').selectOption({label:'Hộ chiếu'});
  await p.getByLabel('Số giấy tờ nhận dạng').fill('MINHHOA01');
  await p.getByLabel('Tư cách yêu cầu cấp bản sao').selectOption({label:'Người được cấp bản chính'});
  await p.getByLabel('Tên người hoặc tổ chức được cấp bản chính').fill('Người nộp minh họa');
  await p.getByLabel('Tên giấy tờ đề nghị cấp bản sao').fill('Văn bằng minh họa');
  await p.getByLabel('Số bản sao đề nghị cấp').fill('1');
  await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await capture(p,'44_thanh_phan_ho_so.jpg','Bước 4 tải tài liệu thực tế theo từng thành phần');
  await p.locator('.document-component input[type=file]').first().setInputFiles(path.join(config.work,'Tai_lieu_minh_hoa_giao_dien.pdf'));
  await p.getByRole('button',{name:'Tiếp tục',exact:true}).click();
  await capture(p,'45_kiem_tra_truoc_gui.jpg','Bước 5 kiểm tra hồ sơ với dữ liệu minh họa trước khi xác nhận gửi');
  await p.goto(base+'/tra-cuu-ho-so');
  await capture(p,'20_tra_cuu_ho_so.jpg','Trang tra cứu riêng bằng mã hồ sơ và khóa tra cứu');
  await p.goto(base);
  await capture(p,'21_lich_hen_cong_dan.jpg','Đặt lịch và tra cứu phiếu hẹn Một cửa','citizen','.public-utilities-panel');
  await p.getByRole('button',{name:'Phản ánh, kiến nghị (PAKN)',exact:true}).click();
  await p.locator('.public-utilities-panel').evaluate(el=>el.scrollIntoView({block:'start'}));
  await capture(p,'22_pakn_cong_dan.jpg','Gửi và theo dõi phản ánh kiến nghị');
  const guides=[['citizen','Công dân / Tổ chức'],['intake','Cán bộ tiếp nhận'],['specialist','Chuyên viên thụ lý'],['leader','Lãnh đạo phê duyệt'],['registrar','Văn thư phát hành'],['finance','Kế toán / Tài chính'],['admin','Quản trị hệ thống']];
  for(let i=0;i<guides.length;i++){
    const [role,label]=guides[i];
    await p.goto(base+'/huong-dan?role='+role);
    await p.getByRole('tab',{name:label,exact:true}).click();
    await capture(p,`${23+i}_huong_dan_${role}.jpg`,'Cẩm nang hướng dẫn dành cho '+label,role,'.guide-content');
  }
  for(const role of ['intake','admin','specialist','leader','registrar','finance']){
    const ctx=await browser.newContext({viewport:{width:1440,height:1000},locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh'});
    await ctx.addCookies([{name:'hni_session',value:config.roles[role].token,url:base,httpOnly:true,sameSite:'Strict'}]);
    const page=await ctx.newPage();
    page.setDefaultTimeout(6000);
    await page.goto(base+'/staff');await ready(page);
    async function nav(label){await page.locator('.nav-link').filter({hasText:label}).first().click();await ready(page);await page.evaluate(()=>window.scrollTo(0,0));}
    if(role==='intake'){
      await nav('Tổng quan');
      await capture(page,'04_tong_quan_can_bo.jpg','Tổng quan công việc của cán bộ tiếp nhận',role);
      await nav('Hộp xử lý');await capture(page,'05_hop_xu_ly.jpg','Hộp xử lý và hàng đợi hồ sơ theo phạm vi cơ quan',role);
      await task('counter intake',async()=>{await page.getByRole('button',{name:/Tiếp nhận trực tiếp tại quầy/}).click();await capture(page,'30_tiep_nhan_tai_quay.jpg','Lập phiếu tiếp nhận trực tiếp và ghi nhận tệp quét',role,'.counter-intake-panel');await page.getByRole('button',{name:'Đóng phiếu tiếp nhận tại quầy',exact:true}).click();});
      await page.locator('.queue-open').first().click();await capture(page,'06_chi_tiet_ho_so.jpg','Chi tiết hồ sơ và các thao tác theo trạng thái',role);
      await nav('Giám sát quy trình');await capture(page,'08_giam_sat_quy_trinh.jpg','Giám sát SLA và tiến độ hồ sơ trong đơn vị',role);
      await nav('Nhật ký hồ sơ');await capture(page,'10_nhat_ky_ho_so.jpg','Nhật ký xử lý và luân chuyển hồ sơ',role);
      await nav('Kết nối & Đối soát');await capture(page,'11_ket_noi_dich_vu.jpg','Trạng thái kết nối và các dịch vụ nội bộ',role);
      await task('profile',async()=>{await page.locator('.account-menu-button').click();await capture(page,'15_tai_khoan_ca_nhan.jpg','Thông tin tài khoản và phạm vi quyền nội bộ',role);await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await capture(page,'16_bao_mat_tai_khoan.jpg','Đổi mật khẩu và quản lý các phiên đăng nhập',role);});
    }else if(role==='admin'){
      await capture(page,'31_tong_quan_quan_tri.jpg','Tổng quan số liệu và tài khoản đang lưu trong hệ thống',role);
      await nav('Tài khoản & Phân quyền');await capture(page,'07_quan_ly_tai_khoan.jpg','Danh sách tài khoản theo vai trò và cơ quan',role);
      await task('RBAC matrix',async()=>{await page.getByRole('button',{name:/Ma trận|phân quyền RBAC/i}).first().click();await capture(page,'32_ma_tran_rbac.jpg','Ma trận phân quyền theo sáu vai trò cán bộ',role,'.rbac-matrix-panel');});
      await task('account create',async()=>{await page.getByRole('button',{name:'＋ Cấp tài khoản cán bộ mới',exact:true}).click();await capture(page,'33_cap_tai_khoan.jpg','Cấp tài khoản và chọn kích hoạt trực tiếp hoặc chờ duyệt',role,'.account-form');});
      await nav('Báo cáo theo cơ quan');await capture(page,'34_bao_cao_van_hanh.jpg','Báo cáo theo cơ quan kỳ thống kê và sổ Mẫu 08',role);
      await nav('Danh mục thủ tục');await capture(page,'09_danh_muc_thu_tuc.jpg','Quản trị danh mục thủ tục và cấu hình biểu mẫu',role);
      await task('procedure editor',async()=>{await page.getByRole('button',{name:/Chỉnh sửa|Sửa thủ tục/i}).first().click();await capture(page,'35_chinh_sua_thu_tuc.jpg','Cập nhật thủ tục và căn cứ pháp lý riêng của thủ tục',role,'.catalog-edit-form');});
      await nav('Tin tức cổng thông tin');await capture(page,'13_quan_ly_tin_tuc.jpg','Quản lý trạng thái tin tức trong CMS',role);
      await page.getByRole('button',{name:'＋ Soạn tin mới',exact:true}).click();await capture(page,'14_soan_tin_tuc.jpg','Biểu mẫu biên tập tin tức và nguồn công khai',role,'.news-editor-panel');
      await nav('Luồng tài chính & tích hợp');
      await task('internal signer',async()=>{await page.locator('.sandbox-signer-workspace h2').first().evaluate(el=>el.scrollIntoView({block:'start'}));await capture(page,'36_phan_cong_ky_noi_bo.jpg','Phân công và thu hồi quyền ký xác nhận Ed25519 nội bộ',role);});
    }else{
      await nav('Hộp xử lý');
      const names={specialist:'Chuyên viên thụ lý',leader:'Lãnh đạo phê duyệt',registrar:'Văn thư phát hành',finance:'Kế toán và tài chính'};
      await capture(page,`${{specialist:37,leader:38,registrar:39,finance:40}[role]}_ban_${role}.jpg`,'Hộp xử lý của '+names[role],role);
      if(role==='finance'){
        await nav('Kết nối & Đối soát');
        await page.locator('.sandbox-payment-workspace h2').first().evaluate(el=>el.scrollIntoView({block:'start'}));
        await capture(page,'41_so_khoan_thu.jpg','Sổ khoản thu đối chiếu và đề nghị hoàn phí',role);
      }
    }
    await ctx.close();
  }
  await fs.writeFile(path.join(out,'Danh_muc_anh_giao_dien.json'),JSON.stringify({version:'2026-10-16',dataScope:'Bản sao cơ sở dữ liệu ứng dụng chỉ dùng chụp tài liệu; không thay đổi dữ liệu đang vận hành',captures:manifest,errors},null,2),'utf8');
  await browser.close();
  console.log(JSON.stringify({captured:manifest.length,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
