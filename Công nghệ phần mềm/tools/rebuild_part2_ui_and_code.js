const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'assets', 'diagrams');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function renderHtmlToPng(name, width, height, contentHtml, bg = '#dce5ec') {
  const htmlPath = path.join(__dirname, `temp_${name}.html`);
  const pngPath = path.join(outDir, name);
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: ${bg};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }
  .browser-shell {
    width: ${width - 36}px;
    height: ${height - 36}px;
    margin: 18px;
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #cbd5e1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .browser-Chrome {
    height: 40px;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    padding: 0 18px;
    position: relative;
    flex-shrink: 0;
  }
  .dots { display: flex; gap: 8px; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot.r { background: #ef4444; }
  .dot.y { background: #f59e0b; }
  .dot.g { background: #22c55e; }
  .url-bar {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 460px;
    height: 25px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11.5px;
    color: #334155;
  }
  .app-nav {
    height: 60px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    flex-shrink: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.3px;
  }
  .brand-logo {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #ff4522;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 17px;
  }
  .brand span.orange { color: #ff4522; }
  .nav-links {
    display: flex;
    gap: 28px;
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }
  .nav-links .active {
    color: #ff4522;
    font-weight: 700;
  }
  .nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .pill-btn {
    padding: 7px 15px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #0f172a;
    font-size: 13px;
    font-weight: 600;
  }
  .primary-btn {
    padding: 8px 16px;
    border-radius: 8px;
    background: #ff4522;
    color: #ffffff;
    font-size: 13.5px;
    font-weight: 700;
    border: none;
    text-align: center;
  }
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #d8b4fe;
    color: #0f172a;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .viewport {
    flex: 1;
    padding: 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
    background: #f8fafc;
  }
  .highlight-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .h-card {
    border-radius: 12px;
    padding: 15px 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 118px;
  }
  .h-card.yellow { background: #fde067; }
  .h-card.purple { background: #d8b4fe; }
  .h-card.blue { background: #bae6fd; }
  .h-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    font-weight: 700;
    color: #0f172a;
  }
  .h-title {
    font-size: 15.5px;
    font-weight: 800;
    color: #0f172a;
    margin: 5px 0 4px 0;
  }
  .h-desc {
    font-size: 12.5px;
    color: #1e293b;
    line-height: 1.4;
  }
  .h-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    font-size: 12.5px;
  }
  .h-foot .link {
    color: #ff4522;
    font-weight: 700;
  }
  .dark-panel {
    background: #0f172a;
    color: #ffffff;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card-white {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px 20px;
  }
</style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;
  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(`"${edgePath}" --headless --disable-gpu --hide-scrollbars --screenshot="${pngPath}" --window-size=${width},${height} "${htmlPath}"`);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  console.log(`Rendered: ${name} (${fs.statSync(pngPath).size} bytes)`);
}

// ============================================================================
// 10.1. hinh_3_12_ui_home.png (Trang chủ talentconnect.vn)
// ============================================================================
const html3_12_home = `
<div class="browser-shell">
  <div class="browser-Chrome">
    <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
    <div class="url-bar">talentconnect.vn</div>
  </div>
  <div class="app-nav">
    <div class="brand"><div class="brand-logo">T</div><div>Talent<span class="orange">Connect</span></div></div>
    <div class="nav-links">
      <span class="active">Khám phá việc làm</span>
      <span>Gợi ý theo kỹ năng</span>
      <span>Hồ sơ trực tuyến</span>
      <span>Doanh nghiệp</span>
    </div>
    <div class="nav-right">
      <div class="pill-btn">Hỗ trợ</div>
      <div class="pill-btn" style="border:1px solid #cbd5e1;background:#fff;">Đăng nhập</div>
      <div class="primary-btn">Đăng ký tài khoản</div>
    </div>
  </div>
  <div class="viewport">
    <!-- Search bar row matching img_07_P120.png -->
    <div style="display:grid;grid-template-columns: 1fr 240px 230px 175px;gap:12px;background:#ffffff;padding:12px;border-radius:12px;border:1px solid #e2e8f0;">
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;font-size:14px;color:#0f172a;display:flex;align-items:center;">
        Frontend Developer, ReactJS
      </div>
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;font-size:14px;color:#0f172a;display:flex;justify-content:space-between;align-items:center;">
        <span>Hà Nội</span><span style="color:#64748b;font-size:11px;">▼</span>
      </div>
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:10px 14px;font-size:14px;color:#0f172a;display:flex;justify-content:space-between;align-items:center;">
        <span>Công nghệ thông tin</span><span style="color:#64748b;font-size:11px;">▼</span>
      </div>
      <div class="primary-btn" style="display:flex;align-items:center;justify-content:center;font-size:14.5px;">Tìm kiếm</div>
    </div>

    <!-- 3 Pastel Highlight Cards -->
    <div class="highlight-grid">
      <div class="h-card yellow">
        <div>
          <div class="h-top"><span>Việc làm Công nghệ thông tin</span><span>Đã xác thực doanh nghiệp</span></div>
          <div class="h-title">Tin tuyển dụng kiểm duyệt minh bạch</div>
          <div class="h-desc">Công khai mức lương, yêu cầu kỹ năng, địa điểm làm việc và hạn nhận hồ sơ của từng vị trí.</div>
        </div>
        <div class="h-foot"><span>ReactJS · TypeScript · Java · .NET</span><span class="link">Khám phá việc làm</span></div>
      </div>
      <div class="h-card purple">
        <div>
          <div class="h-top"><span>Hồ sơ trực tuyến</span><span>Lưu nhiều phiên bản và xuất PDF</span></div>
          <div class="h-title">Biên soạn hồ sơ năng lực chuẩn hóa</div>
          <div class="h-desc">Quản lý học vấn, kinh nghiệm, kỹ năng chuyên môn và kết xuất tệp PDF phục vụ ứng tuyển.</div>
        </div>
        <div class="h-foot"><span>Hỗ trợ xem trước trang A4</span><span class="link">Tạo hồ sơ ngay</span></div>
      </div>
      <div class="h-card blue">
        <div>
          <div class="h-top"><span>Theo dõi trạng thái đơn</span><span>Nhận thông báo từng giai đoạn</span></div>
          <div class="h-title">Quy trình ứng tuyển rõ ràng hai chiều</div>
          <div class="h-desc">Cập nhật tự động khi doanh nghiệp xem hồ sơ, chuyển sang sơ loại, mời phỏng vấn hoặc phản hồi.</div>
        </div>
        <div class="h-foot"><span>Lưu vết lịch sử xử lý đơn</span><span class="link">Tra cứu đơn đã nộp</span></div>
      </div>
    </div>

    <!-- Main 2-column content -->
    <div style="display:grid;grid-template-columns: 1fr 340px;gap:16px;flex:1;overflow:hidden;">
      <div class="card-white" style="display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div>
            <span style="font-size:17px;font-weight:800;color:#0f172a;">Việc làm mới công bố</span>
            <span style="font-size:12.5px;color:#64748b;margin-left:12px;">Chỉ hiển thị tin đã duyệt và còn hạn nhận hồ sơ</span>
          </div>
          <div style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:7px;font-size:12.5px;color:#334155;background:#f8fafc;">
            Sắp xếp: Mới cập nhật &nbsp;▼
          </div>
        </div>

        <!-- Job rows -->
        <div style="display:flex;flex-direction:column;gap:9px;">
          <div style="display:grid;grid-template-columns:46px 1fr 120px 150px;align-items:center;gap:14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
            <div style="width:44px;height:44px;border-radius:9px;background:#fde067;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12.5px;">FPT</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#0f172a;">Frontend Developer (ReactJS / TypeScript)</div>
              <div style="font-size:12.5px;color:#475569;margin-top:2px;">FPT Software · Cầu Giấy, Hà Nội · 1 - 3 năm · ReactJS, TypeScript, Git</div>
            </div>
            <div><span style="background:#dcfce7;color:#166534;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;">Đã xác thực</span></div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:700;color:#15803d;">14 - 22 triệu</div>
              <div style="font-size:11.5px;color:#64748b;">Hạn nộp: 30/11/2026</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:46px 1fr 120px 150px;align-items:center;gap:14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
            <div style="width:44px;height:44px;border-radius:9px;background:#d8b4fe;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12.5px;">VNPT</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#0f172a;">Lập trình viên Frontend ReactJS</div>
              <div style="font-size:12.5px;color:#475569;margin-top:2px;">VNPT Technology · Hà Nội · 1 - 3 năm · ReactJS, HTML/CSS</div>
            </div>
            <div><span style="background:#dcfce7;color:#166534;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;">Đã xác thực</span></div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:700;color:#15803d;">16 - 25 triệu</div>
              <div style="font-size:11.5px;color:#64748b;">Hạn nộp: 25/11/2026</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:46px 1fr 120px 150px;align-items:center;gap:14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
            <div style="width:44px;height:44px;border-radius:9px;background:#bae6fd;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12.5px;">VTT</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#0f172a;">Backend Java / Spring Boot Developer</div>
              <div style="font-size:12.5px;color:#475569;margin-top:2px;">Viettel Digital · Hà Nội · 2 - 4 năm · Java, SQL Server, RESTful API</div>
            </div>
            <div><span style="background:#dcfce7;color:#166534;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;">Đã xác thực</span></div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:700;color:#15803d;">18 - 28 triệu</div>
              <div style="font-size:11.5px;color:#64748b;">Hạn nộp: 28/11/2026</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:46px 1fr 120px 150px;align-items:center;gap:14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
            <div style="width:44px;height:44px;border-radius:9px;background:#fde067;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12.5px;">FTEL</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#0f172a;">Lập trình viên giao diện web</div>
              <div style="font-size:12.5px;color:#475569;margin-top:2px;">FPT Telecom · Hà Nội · 1 - 3 năm · ReactJS, TypeScript, Git</div>
            </div>
            <div><span style="background:#dcfce7;color:#166534;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;">Đã xác thực</span></div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:700;color:#15803d;">18 - 25 triệu</div>
              <div style="font-size:11.5px;color:#64748b;">Hạn nộp: 20/11/2026</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:46px 1fr 120px 150px;align-items:center;gap:14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
            <div style="width:44px;height:44px;border-radius:9px;background:#d8b4fe;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12.5px;">CMC</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#0f172a;">Chuyên viên Kiểm thử phần mềm (QA / Tester)</div>
              <div style="font-size:12.5px;color:#475569;margin-top:2px;">CMC Global · Hà Nội · 1 - 2 năm · Kiểm thử API, SQL, Postman</div>
            </div>
            <div><span style="background:#dcfce7;color:#166534;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;">Đã xác thực</span></div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:700;color:#15803d;">13 - 19 triệu</div>
              <div style="font-size:11.5px;color:#64748b;">Hạn nộp: 18/11/2026</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Dark Panel -->
      <div class="dark-panel">
        <div>
          <div style="font-size:16px;font-weight:800;margin-bottom:12px;">Danh mục ngành nghề & Doanh nghiệp tiêu biểu</div>
          <div style="font-size:12.5px;color:#94a3b8;margin-bottom:10px;">Nhóm ngành đang tuyển dụng</div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;background:#1e293b;padding:8px 12px;border-radius:7px;font-size:12.5px;">
              <span>Phát triển phần mềm Web / Mobile</span><span style="color:#fde067;font-weight:700;">48 tin</span>
            </div>
            <div style="display:flex;justify-content:space-between;background:#1e293b;padding:8px 12px;border-radius:7px;font-size:12.5px;">
              <span>Kiểm thử & Đảm bảo chất lượng</span><span style="color:#fde067;font-weight:700;">19 tin</span>
            </div>
            <div style="display:flex;justify-content:space-between;background:#1e293b;padding:8px 12px;border-radius:7px;font-size:12.5px;">
              <span>Quản trị hệ thống & CSDL</span><span style="color:#fde067;font-weight:700;">15 tin</span>
            </div>
            <div style="display:flex;justify-content:space-between;background:#1e293b;padding:8px 12px;border-radius:7px;font-size:12.5px;">
              <span>Phân tích nghiệp vụ (BA)</span><span style="color:#fde067;font-weight:700;">14 tin</span>
            </div>
          </div>
          <div style="font-size:12.5px;color:#94a3b8;margin-bottom:8px;">Doanh nghiệp đã xác thực pháp lý</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            <span style="background:#1e293b;border:1px solid #334155;padding:5px 10px;border-radius:6px;font-size:12px;">FPT Software</span>
            <span style="background:#1e293b;border:1px solid #334155;padding:5px 10px;border-radius:6px;font-size:12px;">VNPT Technology</span>
            <span style="background:#1e293b;border:1px solid #334155;padding:5px 10px;border-radius:6px;font-size:12px;">Viettel Digital</span>
            <span style="background:#1e293b;border:1px solid #334155;padding:5px 10px;border-radius:6px;font-size:12px;">FPT Telecom</span>
            <span style="background:#1e293b;border:1px solid #334155;padding:5px 10px;border-radius:6px;font-size:12px;">CMC Global</span>
          </div>
        </div>
        <div class="primary-btn" style="padding:11px;font-size:13.5px;">Tạo hồ sơ và nhận gợi ý việc làm</div>
      </div>
    </div>
  </div>
</div>
`;

// ============================================================================
// 10.2. hinh_3_16_ui_auth.png (Đăng nhập và Đăng ký talentconnect.vn/auth/login)
// ============================================================================
const html3_16_auth = `
<div class="browser-shell">
  <div class="browser-Chrome">
    <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
    <div class="url-bar">talentconnect.vn/auth/login</div>
  </div>
  <div class="app-nav">
    <div class="brand"><div class="brand-logo">T</div><div>Talent<span class="orange">Connect</span></div></div>
    <div class="nav-right">
      <div class="pill-btn">← Quay lại trang chủ</div>
      <div class="pill-btn">Hỗ trợ</div>
    </div>
  </div>
  <div class="viewport" style="display:grid;grid-template-columns: 560px 1fr;gap:28px;padding:28px 42px;align-items:stretch;">
    <!-- Left Dark Panel -->
    <div class="dark-panel" style="padding:36px 34px;border-radius:16px;">
      <div>
        <div class="brand" style="color:#ffffff;margin-bottom:24px;">
          <div class="brand-logo">T</div><div>Talent<span class="orange">Connect</span></div>
        </div>
        <div style="font-size:26px;font-weight:800;line-height:1.3;margin-bottom:14px;">
          Hệ thống tuyển dụng và tìm kiếm việc làm trực tuyến
        </div>
        <div style="font-size:14px;color:#cbd5e1;line-height:1.6;margin-bottom:28px;">
          Kết nối người tìm việc và doanh nghiệp thông qua quy trình tuyển dụng chuẩn hóa, đối chiếu kỹ năng minh bạch và cập nhật trạng thái hai chiều.
        </div>

        <div style="display:flex;flex-direction:column;gap:18px;">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="width:24px;height:24px;border-radius:6px;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;">✓</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#ffffff;">Tin tuyển dụng từ doanh nghiệp đã xác thực pháp lý</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Mọi doanh nghiệp đăng tin đều được kiểm tra mã số thuế và kiểm duyệt nội dung trước khi công bố.</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="width:24px;height:24px;border-radius:6px;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;">✓</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#ffffff;">Tạo hồ sơ trực tuyến và gợi ý việc làm theo mức khớp kỹ năng</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Lưu trữ nhiều phiên bản hồ sơ, xuất tệp PDF và tự động đối chiếu kỹ năng với từng vị trí tuyển dụng.</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start;">
            <div style="width:24px;height:24px;border-radius:6px;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;">✓</div>
            <div>
              <div style="font-size:14.5px;font-weight:700;color:#ffffff;">Theo dõi trạng thái xử lý đơn ứng tuyển minh bạch</div>
              <div style="font-size:13px;color:#94a3b8;margin-top:3px;">Nhận thông báo ngay khi doanh nghiệp xem hồ sơ, chuyển giai đoạn sơ loại hoặc gửi lịch phỏng vấn.</div>
            </div>
          </div>
        </div>
      </div>

      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px 18px;font-size:13px;color:#cbd5e1;line-height:1.5;">
        <div style="font-weight:700;color:#fde067;margin-bottom:4px;">Phân quyền truy cập theo vai trò (RBAC)</div>
        Tài khoản được phân tách quyền hạn độc lập giữa <b>Người tìm việc</b>, <b>Nhà tuyển dụng</b> và <b>Ban quản trị hệ thống</b>.
      </div>
    </div>

    <!-- Right Login Form Card -->
    <div class="card-white" style="border-radius:16px;padding:42px 56px;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px;">Đăng nhập hệ thống</div>
      <div style="font-size:14px;color:#64748b;margin-bottom:24px;">Chọn vai trò truy cập và nhập thông tin tài khoản đã đăng ký trên TalentConnect.</div>

      <!-- Role switcher -->
      <div style="display:grid;grid-template-columns:1fr 1fr;background:#f1f5f9;padding:5px;border-radius:10px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <div style="background:#0f172a;color:#ffffff;text-align:center;padding:10px;border-radius:8px;font-size:13.5px;font-weight:700;">Người tìm việc</div>
        <div style="color:#475569;text-align:center;padding:10px;font-size:13.5px;font-weight:600;">Nhà tuyển dụng</div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:7px;">Địa chỉ Email</div>
        <div style="border:1px solid #cbd5e1;border-radius:9px;padding:12px 14px;font-size:14px;color:#0f172a;background:#f8fafc;">
          minhanh.it@gmail.com
        </div>
      </div>

      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:7px;">
          <span style="font-size:13px;font-weight:700;color:#1e293b;">Mật khẩu</span>
          <span style="font-size:12.5px;font-weight:600;color:#ff4522;">Quên mật khẩu?</span>
        </div>
        <div style="border:1px solid #cbd5e1;border-radius:9px;padding:12px 14px;font-size:14px;color:#0f172a;background:#f8fafc;letter-spacing:2px;">
          ••••••••••••
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;font-size:13px;color:#334155;">
        <div style="width:18px;height:18px;border-radius:4px;background:#ff4522;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">✓</div>
        <span>Duy trì phiên đăng nhập an toàn trên trình duyệt này</span>
      </div>

      <div class="primary-btn" style="padding:14px;font-size:15px;border-radius:10px;margin-bottom:20px;">
        Đăng nhập
      </div>

      <div style="text-align:center;font-size:13.5px;color:#64748b;">
        Bạn chưa có tài khoản trên hệ thống? <span style="color:#ff4522;font-weight:700;">Đăng ký tài khoản mới</span>
      </div>
    </div>
  </div>
</div>
`;

// ============================================================================
// 10.3. hinh_3_13_ui_cv_builder.png (Tạo hồ sơ trực tuyến talentconnect.vn/resumes/41/edit)
// Khớp 100% với dữ liệu CV_MinhAnh_Frontend_2026.pdf trong img_12_P140.png
// ============================================================================
const html3_13_cv = `
<div class="browser-shell">
  <div class="browser-Chrome">
    <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
    <div class="url-bar">talentconnect.vn/resumes/41/edit</div>
  </div>
  <div class="app-nav">
    <div class="brand"><div class="brand-logo">T</div><div>Talent<span class="orange">Connect</span></div></div>
    <div class="nav-links">
      <span>Khám phá việc làm</span>
      <span>Gợi ý theo kỹ năng</span>
      <span class="active">Hồ sơ trực tuyến</span>
      <span>Đơn đã ứng tuyển</span>
    </div>
    <div class="nav-right">
      <div class="pill-btn">Hỗ trợ</div>
      <div class="avatar">MA</div>
      <span style="font-size:14px;font-weight:700;">Minh Anh</span>
    </div>
  </div>
  <div class="viewport">
    <!-- Top action bar -->
    <div style="display:flex;justify-content:space-between;align-items:center;background:#ffffff;padding:12px 18px;border-radius:10px;border:1px solid #e2e8f0;">
      <div>
        <div style="font-size:17px;font-weight:800;color:#0f172a;">Biên soạn hồ sơ năng lực trực tuyến</div>
        <div style="font-size:12.5px;color:#475569;margin-top:2px;">Bản hồ sơ: <b>CV_MinhAnh_Frontend_2026.pdf</b> · Cập nhật: 04/10/2026 · Trạng thái: <b>Bản mặc định</b></div>
      </div>
      <div style="display:flex;gap:10px;">
        <div class="pill-btn" style="border:1px solid #cbd5e1;background:#ffffff;">Lưu bản hồ sơ</div>
        <div class="pill-btn" style="background:#bae6fd;color:#0f172a;">✓ Đặt làm mặc định</div>
        <div class="primary-btn">Xuất tệp PDF</div>
      </div>
    </div>

    <!-- 2-column editor + A4 live preview -->
    <div style="display:grid;grid-template-columns: 1fr 580px;gap:16px;flex:1;overflow:hidden;">
      <!-- Left: Form fields -->
      <div class="card-white" style="display:flex;flex-direction:column;justify-content:space-between;padding:16px 20px;">
        <div>
          <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px;">1. Thông tin cá nhân & Liên hệ</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:7px 11px;">
              <div style="font-size:11px;color:#64748b;">Họ và tên</div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;">Nguyễn Minh Anh</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:7px 11px;">
              <div style="font-size:11px;color:#64748b;">Chức danh chuyên môn</div>
              <div style="font-size:13px;font-weight:700;color:#0f172a;">Lập trình viên giao diện web</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:7px 11px;">
              <div style="font-size:11px;color:#64748b;">Email nhận phản hồi</div>
              <div style="font-size:13px;font-weight:600;color:#0f172a;">minhanh.it@gmail.com</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:7px 11px;">
              <div style="font-size:11px;color:#64748b;">Số điện thoại & Địa chỉ</div>
              <div style="font-size:13px;font-weight:600;color:#0f172a;">090 123 4567 · Cầu Giấy, Hà Nội</div>
            </div>
          </div>

          <div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:6px;">2. Mục tiêu nghề nghiệp</div>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:8px 11px;font-size:12.5px;color:#1e293b;line-height:1.45;margin-bottom:12px;">
            Phát triển giao diện web dễ sử dụng; vận dụng ReactJS và TypeScript vào hệ thống có người dùng thực tế.
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:14px;font-weight:800;color:#0f172a;">3. Kinh nghiệm và dự án</span>
            <span style="font-size:12px;font-weight:700;color:#ff4522;">+ Thêm kinh nghiệm</span>
          </div>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:9px 11px;font-size:12.5px;color:#1e293b;line-height:1.45;margin-bottom:12px;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:3px;">Website quản lý đào tạo | 2025 - 2026</div>
            Xây dựng màn hình khóa học, đăng ký học và tra cứu kết quả. Kết nối dữ liệu, kiểm tra biểu mẫu và xử lý lỗi. Phối hợp trong nhóm 4 người, sử dụng Git để quản lý thay đổi.
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:14px;font-weight:800;color:#0f172a;">4. Học vấn</span>
            <span style="font-size:12px;font-weight:700;color:#ff4522;">+ Thêm học vấn</span>
          </div>
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:7px;padding:9px 11px;font-size:12.5px;color:#1e293b;line-height:1.45;margin-bottom:12px;">
            <div style="font-weight:700;color:#0f172a;margin-bottom:3px;">Công nghệ thông tin | 2022 - 2026</div>
            Thực hiện đồ án website quản lý đào tạo, tập trung vào giao diện và trao đổi dữ liệu với máy chủ.
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:14px;font-weight:800;color:#0f172a;">5. Kỹ năng đã khai báo (CandidateSkills)</span>
            <span style="font-size:12px;font-weight:700;color:#ff4522;">+ Chọn kỹ năng từ danh mục</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <span style="background:#fde067;padding:5px 12px;border-radius:6px;font-size:12.5px;font-weight:700;">ReactJS · Thành thạo</span>
            <span style="background:#d8b4fe;padding:5px 12px;border-radius:6px;font-size:12.5px;font-weight:700;">TypeScript · Khá</span>
            <span style="background:#bae6fd;padding:5px 12px;border-radius:6px;font-size:12.5px;font-weight:700;">Git · Thành thạo</span>
          </div>
        </div>
      </div>

      <!-- Right: A4 Preview matching img_12_P140.png -->
      <div style="background:#e2e8f0;border:1px solid #cbd5e1;border-radius:12px;padding:16px 22px;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12.5px;color:#334155;font-weight:600;">
          <span>Xem trước trang A4 · CV_MinhAnh_Frontend_2026.pdf</span>
          <span style="background:#ffffff;padding:3px 10px;border-radius:6px;border:1px solid #cbd5e1;">Trang 1 / 1</span>
        </div>
        <div style="background:#ffffff;flex:1;border-radius:6px;padding:24px 28px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #cbd5e1;">
          <div>
            <div style="font-size:21px;font-weight:800;color:#0f172a;letter-spacing:0.2px;">NGUYỄN MINH ANH</div>
            <div style="font-size:14.5px;font-weight:700;color:#ff4522;margin:3px 0 6px 0;">Lập trình viên giao diện web</div>
            <div style="font-size:12.5px;color:#334155;margin-bottom:16px;">minhanh.it@gmail.com · 090 123 4567 · Cầu Giấy, Hà Nội</div>

            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:5px;">MỤC TIÊU NGHỀ NGHIỆP</div>
            <div style="font-size:12.5px;color:#1e293b;line-height:1.5;margin-bottom:14px;">
              Phát triển giao diện web dễ sử dụng; vận dụng ReactJS và TypeScript vào hệ thống có người dùng thực tế.
            </div>

            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:5px;">KINH NGHIỆM VÀ DỰ ÁN</div>
            <div style="font-size:12.5px;color:#1e293b;line-height:1.5;margin-bottom:14px;">
              <div style="font-weight:600;margin-bottom:2px;">Website quản lý đào tạo | 2025 - 2026</div>
              Xây dựng màn hình khóa học, đăng ký học và tra cứu kết quả. Kết nối dữ liệu, kiểm tra biểu mẫu và xử lý lỗi. Phối hợp trong nhóm 4 người, sử dụng Git để quản lý thay đổi.
            </div>

            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:5px;">HỌC VẤN</div>
            <div style="font-size:12.5px;color:#1e293b;line-height:1.5;margin-bottom:14px;">
              <div style="font-weight:600;margin-bottom:2px;">Công nghệ thông tin | 2022 - 2026</div>
              Thực hiện đồ án website quản lý đào tạo, tập trung vào giao diện và trao đổi dữ liệu với máy chủ.
            </div>

            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-bottom:5px;">KỸ NĂNG</div>
            <div style="font-size:12.5px;color:#1e293b;line-height:1.5;">
              <div style="font-weight:600;margin-bottom:2px;">ReactJS · TypeScript · Git</div>
              Thiết kế biểu mẫu, chia thành phần giao diện, đọc và xử lý dữ liệu trả về từ máy chủ.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

// ============================================================================
// 10.4. hinh_3_15_ui_kanban_ats.png (Bảng quản lý ứng viên theo giai đoạn)
// 5 cột chuẩn: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc, Chưa phù hợp
// ============================================================================
const html3_15_kanban = `
<div class="browser-shell">
  <div class="browser-Chrome">
    <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
    <div class="url-bar">talentconnect.vn/employer/jobs/241/applications</div>
  </div>
  <div class="app-nav">
    <div class="brand"><div class="brand-logo">T</div><div>Talent<span class="orange">Connect</span></div></div>
    <div class="nav-links">
      <span>Tổng quan</span>
      <span>Tin tuyển dụng</span>
      <span class="active">Bảng quản lý ứng viên</span>
      <span>Lịch phỏng vấn</span>
      <span>Thống kê tuyển dụng</span>
    </div>
    <div class="nav-right">
      <div class="pill-btn">Hỗ trợ</div>
      <div class="avatar" style="background:#fde067;">FPT</div>
      <span style="font-size:14px;font-weight:700;">FPT Software</span>
    </div>
  </div>
  <div class="viewport" style="gap:12px;">
    <!-- Job Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;background:#ffffff;padding:12px 18px;border-radius:10px;border:1px solid #e2e8f0;">
      <div>
        <div style="font-size:16.5px;font-weight:800;color:#0f172a;">
          Bảng quản lý ứng viên: Frontend Developer (ReactJS / TypeScript) · Mã tin TC-J0241
        </div>
        <div style="font-size:12.5px;color:#475569;margin-top:2px;">
          Doanh nghiệp: <b>FPT Software</b> · Địa điểm: Cầu Giấy, Hà Nội · Mức lương: 14 - 22 triệu đồng · Hạn nhận hồ sơ: 30/11/2026
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="background:#dcfce7;color:#166534;padding:6px 12px;border-radius:7px;font-size:12.5px;font-weight:700;">Đang mở nhận hồ sơ</span>
        <span style="background:#f1f5f9;color:#0f172a;padding:6px 12px;border-radius:7px;font-size:12.5px;font-weight:700;">Tổng số: 08 đơn ứng tuyển</span>
      </div>
    </div>

    <!-- 5 Stage Columns -->
    <div style="display:grid;grid-template-columns: repeat(5, 1fr);gap:12px;flex:1;overflow:hidden;">
      <!-- Col 1: Hồ sơ mới nộp -->
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:9px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;">
          <span style="font-size:13px;font-weight:800;color:#0f172a;">1. Hồ sơ mới nộp</span>
          <span style="background:#fde067;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:10px;">2</span>
        </div>
        <!-- Card: Nguyễn Minh Anh (Selected) -->
        <div style="background:#ffffff;border:2px solid #ff4522;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13.5px;font-weight:800;color:#0f172a;">Nguyễn Minh Anh</span>
            <span style="background:#bae6fd;color:#0f172a;font-size:11px;font-weight:800;padding:2px 7px;border-radius:5px;">88%</span>
          </div>
          <div style="font-size:11.5px;color:#334155;font-weight:600;">Mã đơn: TC-000381</div>
          <div style="font-size:11.5px;color:#475569;">CV_MinhAnh_Frontend_2026.pdf</div>
          <div style="font-size:11px;color:#15803d;font-weight:600;">Khớp 3/4 kỹ năng: ReactJS, TS, Git</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px;">Nộp lúc: 09:32 · 04/10/2026</div>
        </div>
        <!-- Card 2 -->
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Trần Văn Bình</span>
            <span style="background:#e2e8f0;color:#0f172a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">75%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000379</div>
          <div style="font-size:11.5px;color:#475569;">CV_TranVanBinh_Frontend.pdf</div>
          <div style="font-size:11px;color:#64748b;">Nộp lúc: 16:15 · 03/10/2026</div>
        </div>
      </div>

      <!-- Col 2: Đạt sơ loại -->
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:9px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;">
          <span style="font-size:13px;font-weight:800;color:#0f172a;">2. Đạt sơ loại</span>
          <span style="background:#bae6fd;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:10px;">2</span>
        </div>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Phạm Minh Tuấn</span>
            <span style="background:#bae6fd;color:#0f172a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">88%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000365</div>
          <div style="font-size:11.5px;color:#475569;">Đánh giá nội bộ: 4/5 sao</div>
          <div style="font-size:11px;color:#15803d;font-weight:600;">Đã kiểm tra hồ sơ PDF</div>
        </div>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Vũ Thị Mai</span>
            <span style="background:#e2e8f0;color:#0f172a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">75%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000362</div>
          <div style="font-size:11.5px;color:#475569;">Đánh giá nội bộ: 4/5 sao</div>
          <div style="font-size:11px;color:#64748b;">Chờ xếp lịch phỏng vấn</div>
        </div>
      </div>

      <!-- Col 3: Mời phỏng vấn -->
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:9px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;">
          <span style="font-size:13px;font-weight:800;color:#0f172a;">3. Mời phỏng vấn</span>
          <span style="background:#d8b4fe;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:10px;">2</span>
        </div>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Lê Hoàng Long</span>
            <span style="background:#bae6fd;color:#0f172a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">88%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000350 · Vòng 1</div>
          <div style="font-size:11px;color:#6d28d9;font-weight:700;">Lịch PV: 09:00 · 08/10/2026</div>
          <div style="font-size:11px;color:#64748b;">Hình thức: Trực tiếp tại văn phòng</div>
        </div>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Hoàng Gia Huy</span>
            <span style="background:#e2e8f0;color:#0f172a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">75%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000348 · Vòng 1</div>
          <div style="font-size:11px;color:#6d28d9;font-weight:700;">Lịch PV: 14:00 · 08/10/2026</div>
          <div style="font-size:11px;color:#64748b;">Hình thức: Phỏng vấn trực tuyến</div>
        </div>
      </div>

      <!-- Col 4: Đề xuất nhận việc -->
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:9px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;">
          <span style="font-size:13px;font-weight:800;color:#0f172a;">4. Đề xuất nhận việc</span>
          <span style="background:#dcfce7;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:10px;">1</span>
        </div>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Vũ Phương Thảo</span>
            <span style="background:#dcfce7;color:#166534;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">100%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000331</div>
          <div style="font-size:11.5px;color:#475569;">Đánh giá nội bộ: 5/5 sao</div>
          <div style="font-size:11px;color:#15803d;font-weight:700;">Đã gửi thư đề nghị nhận việc</div>
        </div>
      </div>

      <!-- Col 5: Chưa phù hợp -->
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:10px;display:flex;flex-direction:column;gap:9px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 4px;">
          <span style="font-size:13px;font-weight:800;color:#0f172a;">5. Chưa phù hợp</span>
          <span style="background:#e2e8f0;font-size:11.5px;font-weight:800;padding:2px 8px;border-radius:10px;">1</span>
        </div>
        <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:9px;padding:11px;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:#0f172a;">Đặng Quốc Cường</span>
            <span style="background:#f1f5f9;color:#475569;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">38%</span>
          </div>
          <div style="font-size:11.5px;color:#475569;">Mã đơn: TC-000329</div>
          <div style="font-size:11px;color:#64748b;">Ghi chú: Chưa có kinh nghiệm ReactJS</div>
          <div style="font-size:11px;color:#64748b;">Đã gửi thông báo phản hồi</div>
        </div>
      </div>
    </div>

    <!-- Bottom Evaluation & Action Drawer for selected candidate Nguyễn Minh Anh (TC-000381) -->
    <div style="background:#0f172a;color:#ffffff;border-radius:12px;padding:14px 20px;display:grid;grid-template-columns: 310px 1fr 370px;gap:18px;align-items:center;">
      <div>
        <div style="font-size:14px;font-weight:800;color:#fde067;">Đang chọn: Nguyễn Minh Anh (TC-000381)</div>
        <div style="font-size:12px;color:#cbd5e1;margin-top:3px;">Hồ sơ: CV_MinhAnh_Frontend_2026.pdf · Mức khớp: 88%</div>
        <div style="font-size:12px;color:#fde067;margin-top:3px;">Đánh giá nội bộ (InternalRating): ★★★★☆ (4/5 sao)</div>
      </div>
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:9px 14px;font-size:12px;color:#e2e8f0;line-height:1.45;">
        <b>Ghi chú đánh giá (ChangeNote):</b> Hồ sơ có dự án Website quản lý đào tạo phù hợp vị trí Frontend Developer, đáp ứng ReactJS, TypeScript và Git (7/8 điểm trọng số). Đề xuất chuyển sang giai đoạn Mời phỏng vấn.
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <div class="pill-btn" style="background:#1e293b;color:#ffffff;border:1px solid #475569;">Xem hồ sơ PDF</div>
        <div class="pill-btn" style="background:#bae6fd;color:#0f172a;">Lập lịch phỏng vấn</div>
        <div class="primary-btn">Chuyển giai đoạn</div>
      </div>
    </div>
  </div>
</div>
`;

// ============================================================================
// 10.5. hinh_3_17_ui_admin_dashboard.png (Bảng điều khiển Quản trị viên và Kiểm duyệt)
// ============================================================================
const html3_17_admin = `
<div class="browser-shell">
  <div class="browser-Chrome">
    <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
    <div class="url-bar">talentconnect.vn/admin/moderation</div>
  </div>
  <div class="app-nav">
    <div class="brand"><div class="brand-logo">T</div><div>Talent<span class="orange">Connect</span></div></div>
    <div class="nav-links">
      <span class="active">Kiểm duyệt & Xác thực</span>
      <span>Quản lý tài khoản</span>
      <span>Danh mục ngành & kỹ năng</span>
      <span>Thống kê vận hành</span>
    </div>
    <div class="nav-right">
      <div class="pill-btn">Nhật ký hệ thống</div>
      <div class="avatar" style="background:#0f172a;color:#ffffff;">AD</div>
      <span style="font-size:14px;font-weight:700;">Ban quản trị</span>
    </div>
  </div>
  <div class="viewport">
    <!-- 3 Pastel Highlight Cards -->
    <div class="highlight-grid">
      <div class="h-card yellow">
        <div>
          <div class="h-top"><span>Doanh nghiệp chờ xác thực</span><span>04 hồ sơ mới</span></div>
          <div class="h-title">Kiểm tra mã số thuế và giấy phép ĐKKD</div>
          <div class="h-desc">Đối chiếu thông tin pháp lý doanh nghiệp trước khi cấp quyền đăng tin tuyển dụng trên hệ thống.</div>
        </div>
        <div class="h-foot"><span>VerificationStatus = 'Pending'</span><span class="link">Xác thực doanh nghiệp</span></div>
      </div>
      <div class="h-card purple">
        <div>
          <div class="h-top"><span>Tin tuyển dụng chờ duyệt</span><span>06 tin chờ xử lý</span></div>
          <div class="h-title">Kiểm tra nội dung, mức lương và hạn nộp</div>
          <div class="h-desc">Rà soát mô tả công việc, yêu cầu kỹ năng và tính minh bạch của tin tuyển dụng trước khi mở hiển thị.</div>
        </div>
        <div class="h-foot"><span>JobStatus = 'Pending'</span><span class="link">Mở hàng đợi duyệt tin</span></div>
      </div>
      <div class="h-card blue">
        <div>
          <div class="h-top"><span>Thống kê hoạt động</span><span>Vận hành ổn định</span></div>
          <div class="h-title">Tài khoản, tin đang mở và đơn ứng tuyển</div>
          <div class="h-desc">Theo dõi số lượng người tìm việc, nhà tuyển dụng, tin còn hiệu lực và tổng số đơn ứng tuyển.</div>
        </div>
        <div class="h-foot"><span>96 tin đang mở · 381 đơn ứng tuyển</span><span class="link">Xem báo cáo chi tiết</span></div>
      </div>
    </div>

    <!-- Main 2-column content -->
    <div style="display:grid;grid-template-columns: 1fr 355px;gap:16px;flex:1;overflow:hidden;">
      <div class="card-white" style="display:flex;flex-direction:column;justify-content:flex-start;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:16.5px;font-weight:800;color:#0f172a;">Hàng đợi xác thực doanh nghiệp và kiểm duyệt tin tuyển dụng</span>
          </div>
          <span style="font-size:12.5px;font-weight:700;color:#ff4522;">Xem toàn bộ hàng đợi →</span>
        </div>

        <!-- Column Headers -->
        <div style="display:grid;grid-template-columns: 215px 1fr 145px 215px;align-items:center;gap:12px;padding:8px 14px;background:#f1f5f9;border-radius:8px;font-size:12px;font-weight:800;color:#334155;">
          <div>Doanh nghiệp & Pháp lý</div>
          <div>Nội dung tin / Hồ sơ chờ duyệt</div>
          <div>Trạng thái hiện tại</div>
          <div style="text-align:right;">Thao tác kiểm duyệt</div>
        </div>

        <div style="display:flex;flex-direction:column;gap:9px;">
          <!-- Row 1: FPT Software -->
          <div style="display:grid;grid-template-columns: 215px 1fr 145px 215px;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
            <div>
              <div style="font-size:13.5px;font-weight:800;color:#0f172a;">FPT Software</div>
              <div style="font-size:12px;color:#475569;">MST: 0101601092 · Đã xác thực</div>
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#0f172a;">Frontend Developer (ReactJS / TypeScript)</div>
              <div style="font-size:12px;color:#475569;">Mã tin: TC-J0241 · 14 - 22 triệu · Hạn nộp: 30/11/2026</div>
            </div>
            <div><span style="background:#dcfce7;color:#166534;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;white-space:nowrap;">Đã duyệt (Active)</span></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <span style="background:#e2e8f0;color:#334155;font-size:12px;font-weight:600;padding:6px 12px;border-radius:6px;">Xem chi tiết</span>
            </div>
          </div>

          <!-- Row 2 -->
          <div style="display:grid;grid-template-columns: 215px 1fr 145px 215px;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;">
            <div>
              <div style="font-size:13.5px;font-weight:800;color:#0f172a;">VNPT Technology</div>
              <div style="font-size:12px;color:#475569;">MST: 0105004128 · Đã xác thực</div>
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#0f172a;">Lập trình viên Frontend ReactJS</div>
              <div style="font-size:12px;color:#475569;">Mã tin: TC-J0245 · 16 - 25 triệu · Hạn nộp: 25/11/2026</div>
            </div>
            <div><span style="background:#fef08a;color:#854d0e;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;white-space:nowrap;">Chờ duyệt (Pending)</span></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <span style="background:#16a34a;color:#ffffff;font-size:12px;font-weight:700;padding:6px 10px;border-radius:6px;">Chấp thuận</span>
              <span style="background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;padding:6px 10px;border-radius:6px;">Từ chối kèm lý do</span>
            </div>
          </div>

          <!-- Row 3 -->
          <div style="display:grid;grid-template-columns: 215px 1fr 145px 215px;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;">
            <div>
              <div style="font-size:13.5px;font-weight:800;color:#0f172a;">Viettel Digital</div>
              <div style="font-size:12px;color:#475569;">MST: 0100109106 · Đã xác thực</div>
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#0f172a;">Backend Java / Spring Boot Developer</div>
              <div style="font-size:12px;color:#475569;">Mã tin: TC-J0248 · 18 - 28 triệu · Hạn nộp: 28/11/2026</div>
            </div>
            <div><span style="background:#fef08a;color:#854d0e;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;white-space:nowrap;">Chờ duyệt (Pending)</span></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <span style="background:#16a34a;color:#ffffff;font-size:12px;font-weight:700;padding:6px 10px;border-radius:6px;">Chấp thuận</span>
              <span style="background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;padding:6px 10px;border-radius:6px;">Từ chối kèm lý do</span>
            </div>
          </div>

          <!-- Row 4 -->
          <div style="display:grid;grid-template-columns: 215px 1fr 145px 215px;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;">
            <div>
              <div style="font-size:13.5px;font-weight:800;color:#0f172a;">Công ty Phần mềm Sao Khuê</div>
              <div style="font-size:12px;color:#475569;">MST: 0109882341 · ĐKKD đính kèm</div>
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#0f172a;">Yêu cầu xác thực pháp lý doanh nghiệp mới</div>
              <div style="font-size:12px;color:#475569;">Tệp đính kèm: GPKD_SaoKhue_2026.pdf · Cầu Giấy, Hà Nội</div>
            </div>
            <div><span style="background:#bae6fd;color:#0f172a;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:6px;white-space:nowrap;">Chờ xác thực DN</span></div>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <span style="background:#0f172a;color:#ffffff;font-size:12px;font-weight:700;padding:6px 10px;border-radius:6px;">Xác thực ĐKKD</span>
              <span style="background:#fee2e2;color:#b91c1c;font-size:12px;font-weight:700;padding:6px 10px;border-radius:6px;">Từ chối kèm lý do</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Dark Panel -->
      <div class="dark-panel">
        <div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">Cấu hình vận hành & Lưu trữ</div>
          <div style="display:inline-block;background:#fde067;color:#0f172a;font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:6px;margin-bottom:12px;">
            Hệ thống hoạt động bình thường
          </div>
          <div style="font-size:17px;font-weight:800;margin-bottom:14px;">Trạng thái hệ thống & Cơ sở dữ liệu</div>

          <div style="display:flex;flex-direction:column;gap:10px;font-size:12.5px;color:#e2e8f0;">
            <div style="background:#1e293b;padding:9px 12px;border-radius:8px;border:1px solid #334155;">
              <div style="color:#94a3b8;font-size:11px;">Dịch vụ ứng dụng phía máy chủ</div>
              <div style="font-weight:700;margin-top:2px;">Node.js / Express RESTful API</div>
            </div>
            <div style="background:#1e293b;padding:9px 12px;border-radius:8px;border:1px solid #334155;">
              <div style="color:#94a3b8;font-size:11px;">Hệ quản trị cơ sở dữ liệu</div>
              <div style="font-weight:700;color:#38bdf8;margin-top:2px;">Microsoft SQL Server 2022</div>
            </div>
            <div style="background:#1e293b;padding:9px 12px;border-radius:8px;border:1px solid #334155;">
              <div style="color:#94a3b8;font-size:11px;">Cấu trúc lược đồ dữ liệu</div>
              <div style="font-weight:700;margin-top:2px;">28 bảng dữ liệu quan hệ (3NF)</div>
            </div>
            <div style="background:#1e293b;padding:9px 12px;border-radius:8px;border:1px solid #334155;">
              <div style="color:#94a3b8;font-size:11px;">Tiến trình định kỳ (Tiến trình 3.3)</div>
              <div style="font-weight:700;color:#4ade80;margin-top:2px;">Tác vụ ngầm đóng tin quá hạn: Đang hoạt động</div>
            </div>
          </div>
        </div>
        <div class="primary-btn" style="padding:11px;font-size:13.5px;">Quản lý danh mục & Nhật ký hệ thống</div>
      </div>
    </div>
  </div>
</div>
`;

// ============================================================================
// Helper for VS Code screenshots (11.1 to 11.4)
// ============================================================================
function renderVsCodeWindow(name, tabName, rightHeader, codeLines, showSidebar = false) {
  const width = 1280, height = 780;
  const sidebarHtml = showSidebar ? `
    <div style="width:270px;background:#252526;border-right:1px solid #1e1e1e;padding:14px 16px;font-family:'Consolas','Courier New',monospace;font-size:13px;color:#cccccc;line-height:1.85;flex-shrink:0;">
      <div style="font-family:'Segoe UI',sans-serif;font-size:11.5px;font-weight:700;color:#bbbbbb;letter-spacing:0.5px;margin-bottom:8px;">EXPLORER: TALENTCONNECT-BACKEND</div>
      <div style="color:#569cd6;font-weight:700;">▼ src/</div>
      <div style="padding-left:14px;color:#569cd6;">▼ controllers/</div>
      <div style="padding-left:30px;">📄 auth.controller.js</div>
      <div style="padding-left:30px;">📄 job.controller.js</div>
      <div style="padding-left:30px;">📄 application.controller.js</div>
      <div style="padding-left:14px;color:#569cd6;">▼ services/</div>
      <div style="padding-left:30px;color:#dcdcaa;font-weight:700;">📄 job.service.js</div>
      <div style="padding-left:30px;">📄 application.service.js</div>
      <div style="padding-left:30px;">📄 notification.service.js</div>
      <div style="padding-left:14px;color:#569cd6;">▼ repositories/</div>
      <div style="padding-left:30px;">📄 job.repository.js</div>
      <div style="padding-left:30px;">📄 application.repository.js</div>
      <div style="padding-left:14px;color:#569cd6;">▼ middlewares/</div>
      <div style="padding-left:30px;">📄 auth.middleware.js</div>
      <div style="padding-left:30px;">📄 rbac.middleware.js</div>
      <div style="padding-left:14px;color:#569cd6;">▼ config/</div>
      <div style="padding-left:30px;">📄 database.config.js</div>
    </div>
  ` : '';

  const linesHtml = codeLines.map((line, idx) => `
    <div style="display:flex;line-height:1.48;font-family:'Consolas','Courier New',monospace;font-size:13.2px;">
      <div style="width:42px;color:#858585;text-align:right;padding-right:18px;user-select:none;flex-shrink:0;">${idx + 1}</div>
      <div style="white-space:pre;color:#d4d4d4;">${line}</div>
    </div>
  `).join('');

  const html = `
  <div style="width:${width}px;height:${height}px;background:#1e1e1e;display:flex;flex-direction:column;overflow:hidden;">
    <!-- Title bar -->
    <div style="height:36px;background:#323233;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#cccccc;font-size:12.5px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
        <span>TalentConnect — Visual Studio Code</span>
      </div>
      <div style="color:#9cdcfe;">${rightHeader}</div>
    </div>
    <!-- Tab bar -->
    <div style="height:38px;background:#252526;display:flex;align-items:center;border-bottom:1px solid #1e1e1e;">
      <div style="height:38px;background:#1e1e1e;border-top:2px solid #007acc;padding:0 20px;display:flex;align-items:center;gap:8px;color:#ffffff;font-size:13px;font-weight:600;">
        <span style="color:#569cd6;">❖</span><span>${tabName}</span>
      </div>
    </div>
    <!-- Main body -->
    <div style="flex:1;display:flex;overflow:hidden;">
      ${sidebarHtml}
      <div style="flex:1;padding:12px 22px;overflow:hidden;">
        ${linesHtml}
      </div>
    </div>
    <!-- Status bar -->
    <div style="height:26px;background:#007acc;color:#ffffff;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:12px;">
      <div>main* &nbsp;|&nbsp; UTF-8 &nbsp;|&nbsp; Node.js / Express &amp; ReactJS</div>
      <div>Microsoft SQL Server 2022 (3NF) &nbsp;|&nbsp; Ln 1, Col 1</div>
    </div>
  </div>
  `;
  renderHtmlToPng(name, width, height, html, '#1e1e1e');
}

// 11.1. hinh_3_18_code_structure.png
renderVsCodeWindow(
  'hinh_3_18_code_structure.png',
  'job.service.js',
  'src/services/job.service.js — Đối khớp kỹ năng & Tìm kiếm việc làm',
  [
    `<span style="color:#6a9955;">// =========================================================================</span>`,
    `<span style="color:#6a9955;">// TalentConnect - job.service.js: Lọc tin đang mở và tính điểm khớp kỹ năng</span>`,
    `<span style="color:#6a9955;">// =========================================================================</span>`,
    `<span style="color:#569cd6;">const</span> jobRepository = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'../repositories/job.repository'</span>);`,
    ``,
    `<span style="color:#569cd6;">class</span> <span style="color:#4ec9b0;">JobService</span> {`,
    `  <span style="color:#6a9955;">// 1. Tìm kiếm việc làm đa tiêu chí (Chỉ lấy tin JobStatus = 'Active' và còn hạn)</span>`,
    `  <span style="color:#569cd6;">async</span> <span style="color:#dcdcaa;">searchActiveJobs</span>(filters) {`,
    `    <span style="color:#569cd6;">const</span> { keyword, categoryId, city, salaryMin, experienceLevel, page = <span style="color:#b5cea8;">1</span> } = filters;`,
    `    <span style="color:#569cd6;">return await</span> jobRepository.<span style="color:#dcdcaa;">findActiveJobsWithPagination</span>({`,
    `      keyword: keyword?.<span style="color:#dcdcaa;">trim</span>() || <span style="color:#569cd6;">null</span>,`,
    `      categoryId: <span style="color:#dcdcaa;">parseInt</span>(categoryId, <span style="color:#b5cea8;">10</span>) || <span style="color:#569cd6;">null</span>,`,
    `      city: city || <span style="color:#569cd6;">null</span>,`,
    `      salaryMin: <span style="color:#dcdcaa;">parseFloat</span>(salaryMin) || <span style="color:#569cd6;">null</span>,`,
    `      experienceLevel: experienceLevel || <span style="color:#569cd6;">null</span>,`,
    `      jobStatus: <span style="color:#ce9178;">'Active'</span>, <span style="color:#6a9955;">// Tin đã kiểm duyệt và đang mở nhận hồ sơ</span>`,
    `      pageSize: <span style="color:#b5cea8;">10</span>, offset: (page - <span style="color:#b5cea8;">1</span>) * <span style="color:#b5cea8;">10</span>`,
    `    });`,
    `  }`,
    ``,
    `  <span style="color:#6a9955;">// 2. Tính mức khớp kỹ năng MatchScore (%) theo trọng số PriorityWeight</span>`,
    `  <span style="color:#dcdcaa;">calculateSkillMatchScore</span>(candidateSkills, jobSkills) {`,
    `    <span style="color:#569cd6;">if</span> (!jobSkills || jobSkills.length === <span style="color:#b5cea8;">0</span>) <span style="color:#569cd6;">return</span> <span style="color:#b5cea8;">100</span>;`,
    `    <span style="color:#569cd6;">const</span> ownedSkillIds = <span style="color:#569cd6;">new</span> <span style="color:#4ec9b0;">Set</span>(candidateSkills.<span style="color:#dcdcaa;">map</span>(s => s.SkillID));`,
    `    <span style="color:#569cd6;">const</span> totalWeight = jobSkills.<span style="color:#dcdcaa;">reduce</span>((sum, js) => sum + (js.PriorityWeight || <span style="color:#b5cea8;">1</span>), <span style="color:#b5cea8;">0</span>);`,
    `    <span style="color:#569cd6;">const</span> matchedWeight = jobSkills.<span style="color:#dcdcaa;">reduce</span>((sum, js) => {`,
    `      <span style="color:#569cd6;">return</span> ownedSkillIds.<span style="color:#dcdcaa;">has</span>(js.SkillID) ? sum + (js.PriorityWeight || <span style="color:#b5cea8;">1</span>) : sum;`,
    `    }, <span style="color:#b5cea8;">0</span>);`,
    `    <span style="color:#6a9955;">// Ví dụ tin TC-J0241: ReactJS(3) + TypeScript(2) + Git(2) = 7/8 -> MatchScore = 88%</span>`,
    `    <span style="color:#569cd6;">return</span> Math.<span style="color:#dcdcaa;">round</span>((matchedWeight / totalWeight) * <span style="color:#b5cea8;">100</span>);`,
    `  }`,
    `}`,
    `module.exports = <span style="color:#569cd6;">new</span> <span style="color:#4ec9b0;">JobService</span>();`
  ],
  true
);

// 11.2. hinh_3_4_2_b_ui_code.png
renderVsCodeWindow(
  'hinh_3_4_2_b_ui_code.png',
  'ApplyJobModal.jsx',
  'src/components/jobs/ApplyJobModal.jsx — Tầng Giao diện ReactJS',
  [
    `<span style="color:#569cd6;">import</span> React, { useState } <span style="color:#569cd6;">from</span> <span style="color:#ce9178;">'react'</span>;`,
    `<span style="color:#569cd6;">import</span> axiosClient <span style="color:#569cd6;">from</span> <span style="color:#ce9178;">'../../api/axiosClient'</span>;`,
    ``,
    `<span style="color:#6a9955;">// Thành phần giao diện kiểm tra hồ sơ và xác nhận nộp đơn ứng tuyển (Tiến trình 4.3)</span>`,
    `<span style="color:#569cd6;">export const</span> <span style="color:#dcdcaa;">ApplyJobModal</span> = ({ job, resumes, defaultResumeId, onSuccess }) => {`,
    `  <span style="color:#569cd6;">const</span> [selectedResumeId, setSelectedResumeId] = <span style="color:#dcdcaa;">useState</span>(defaultResumeId);`,
    `  <span style="color:#569cd6;">const</span> [coverLetter, setCoverLetter] = <span style="color:#dcdcaa;">useState</span>(<span style="color:#ce9178;">''</span>);`,
    `  <span style="color:#569cd6;">const</span> [consentConfirmed, setConsentConfirmed] = <span style="color:#dcdcaa;">useState</span>(<span style="color:#569cd6;">false</span>);`,
    `  <span style="color:#569cd6;">const</span> [errorMsg, setErrorMsg] = <span style="color:#dcdcaa;">useState</span>(<span style="color:#569cd6;">null</span>);`,
    `  <span style="color:#569cd6;">const</span> [isSubmitting, setIsSubmitting] = <span style="color:#dcdcaa;">useState</span>(<span style="color:#569cd6;">false</span>);`,
    ``,
    `  <span style="color:#569cd6;">const</span> <span style="color:#dcdcaa;">handleApplySubmit</span> = <span style="color:#569cd6;">async</span> (e) => {`,
    `    e.<span style="color:#dcdcaa;">preventDefault</span>();`,
    `    <span style="color:#569cd6;">if</span> (!selectedResumeId) <span style="color:#569cd6;">return</span> <span style="color:#dcdcaa;">setErrorMsg</span>(<span style="color:#ce9178;">'Vui lòng chọn một bản hồ sơ PDF để ứng tuyển.'</span>);`,
    `    <span style="color:#569cd6;">if</span> (!consentConfirmed) {`,
    `      <span style="color:#569cd6;">return</span> <span style="color:#dcdcaa;">setErrorMsg</span>(<span style="color:#ce9178;">'Vui lòng xác nhận đồng ý gửi hồ sơ và thông tin liên hệ đến doanh nghiệp.'</span>);`,
    `    }`,
    `    <span style="color:#dcdcaa;">setIsSubmitting</span>(<span style="color:#569cd6;">true</span>); <span style="color:#dcdcaa;">setErrorMsg</span>(<span style="color:#569cd6;">null</span>);`,
    `    <span style="color:#569cd6;">try</span> {`,
    `      <span style="color:#569cd6;">const</span> res = <span style="color:#569cd6;">await</span> axiosClient.<span style="color:#dcdcaa;">post</span>(<span style="color:#ce9178;">'/api/v1/applications/apply'</span>, {`,
    `        jobId: job.JobID,`,
    `        resumeId: selectedResumeId,`,
    `        coverLetter: coverLetter.<span style="color:#dcdcaa;">trim</span>() || <span style="color:#569cd6;">null</span>`,
    `      });`,
    `      <span style="color:#6a9955;">// Trả về ApplicationID = 381 (Mã đơn TC-000381), ApplicationStatus = 'Submitted'</span>`,
    `      <span style="color:#dcdcaa;">onSuccess</span>(res.data);`,
    `    } <span style="color:#569cd6;">catch</span> (err) {`,
    `      <span style="color:#dcdcaa;">setErrorMsg</span>(err.response?.data?.message || <span style="color:#ce9178;">'Không thể gửi đơn ứng tuyển.'</span>);`,
    `    } <span style="color:#569cd6;">finally</span> { <span style="color:#dcdcaa;">setIsSubmitting</span>(<span style="color:#569cd6;">false</span>); }`,
    `  };`,
    `  <span style="color:#569cd6;">return</span> (<span style="color:#808080;">/* Biểu mẫu chọn hồ sơ, thư giới thiệu và xác nhận gửi */</span>);`,
    `};`
  ],
  false
);

// 11.3. hinh_3_4_2_c_backend_code.png
renderVsCodeWindow(
  'hinh_3_4_2_c_backend_code.png',
  'application.controller.js',
  'src/controllers/application.controller.js — Tầng Nghiệp vụ Node.js / Express',
  [
    `<span style="color:#569cd6;">const</span> express = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'express'</span>);`,
    `<span style="color:#569cd6;">const</span> router = express.<span style="color:#dcdcaa;">Router</span>();`,
    `<span style="color:#569cd6;">const</span> applicationService = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'../services/application.service'</span>);`,
    `<span style="color:#569cd6;">const</span> notificationService = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'../services/notification.service'</span>);`,
    `<span style="color:#569cd6;">const</span> { verifyToken, requireRole } = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'../middlewares/auth.middleware'</span>);`,
    ``,
    `<span style="color:#569cd6;">const</span> VALID_STATUSES = [<span style="color:#ce9178;">'Submitted'</span>, <span style="color:#ce9178;">'Viewed'</span>, <span style="color:#ce9178;">'Interview'</span>, <span style="color:#ce9178;">'Offered'</span>, <span style="color:#ce9178;">'Accepted'</span>, <span style="color:#ce9178;">'Rejected'</span>];`,
    ``,
    `<span style="color:#6a9955;">// API Cập nhật trạng thái đơn ứng tuyển và ghi lịch sử ApplicationHistories</span>`,
    `router.<span style="color:#dcdcaa;">patch</span>(<span style="color:#ce9178;">'/applications/:id/status'</span>, verifyToken, <span style="color:#dcdcaa;">requireRole</span>([<span style="color:#ce9178;">'Employer'</span>]), <span style="color:#569cd6;">async</span> (req, res) => {`,
    `  <span style="color:#569cd6;">const</span> applicationId = <span style="color:#dcdcaa;">parseInt</span>(req.params.id, <span style="color:#b5cea8;">10</span>);`,
    `  <span style="color:#569cd6;">const</span> { toStatus, changeNote, internalRating } = req.body;`,
    `  <span style="color:#569cd6;">const</span> changedByUserId = req.user.userId;`,
    ``,
    `  <span style="color:#569cd6;">if</span> (!VALID_STATUSES.<span style="color:#dcdcaa;">includes</span>(toStatus)) {`,
    `    <span style="color:#569cd6;">return</span> res.<span style="color:#dcdcaa;">status</span>(<span style="color:#b5cea8;">400</span>).<span style="color:#dcdcaa;">json</span>({ message: <span style="color:#ce9178;">'Trạng thái chuyển đổi không hợp lệ.'</span> });`,
    `  }`,
    `  <span style="color:#6a9955;">// 1. Cập nhật Applications.ApplicationStatus & ghi vết vào ApplicationHistories</span>`,
    `  <span style="color:#569cd6;">const</span> result = <span style="color:#569cd6;">await</span> applicationService.<span style="color:#dcdcaa;">updateApplicationStatus</span>({`,
    `    applicationId, toStatus, changedByUserId, changeNote, internalRating`,
    `  });`,
    `  <span style="color:#6a9955;">// 2. Tạo bản ghi thông báo tự động trong bảng Notifications cho Người tìm việc</span>`,
    `  <span style="color:#569cd6;">await</span> notificationService.<span style="color:#dcdcaa;">createNotification</span>({`,
    `    userId: result.candidateUserId,`,
    `    notificationType: <span style="color:#ce9178;">'APPLICATION_STATUS'</span>,`,
    `    title: <span style="color:#ce9178;">'Cập nhật trạng thái đơn ứng tuyển'</span>,`,
    `    content: <span style="color:#ce9178;">\`Đơn ứng tuyển mã TC-\${String(applicationId).padStart(6, '0')} đã chuyển sang: \${toStatus}\`</span>,`,
    `    referenceId: applicationId`,
    `  });`,
    `  <span style="color:#569cd6;">return</span> res.<span style="color:#dcdcaa;">status</span>(<span style="color:#b5cea8;">200</span>).<span style="color:#dcdcaa;">json</span>({ success: <span style="color:#569cd6;">true</span>, data: result });`,
    `});`
  ],
  false
);

// 11.4. hinh_3_4_2_d_db_code.png
renderVsCodeWindow(
  'hinh_3_4_2_d_db_code.png',
  'application.repository.js',
  'src/repositories/application.repository.js — Giao dịch Microsoft SQL Server 2022',
  [
    `<span style="color:#569cd6;">const</span> sql = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'mssql'</span>);`,
    `<span style="color:#569cd6;">const</span> { getDatabasePool } = <span style="color:#dcdcaa;">require</span>(<span style="color:#ce9178;">'../config/database.config'</span>);`,
    ``,
    `<span style="color:#569cd6;">async function</span> <span style="color:#dcdcaa;">createApplicationWithTransaction</span>({ jobId, candidateId, resumeId, coverLetter, matchScore }) {`,
    `  <span style="color:#569cd6;">const</span> pool = <span style="color:#569cd6;">await</span> <span style="color:#dcdcaa;">getDatabasePool</span>();`,
    `  <span style="color:#569cd6;">const</span> transaction = <span style="color:#569cd6;">new</span> sql.<span style="color:#4ec9b0;">Transaction</span>(pool);`,
    `  <span style="color:#569cd6;">await</span> transaction.<span style="color:#dcdcaa;">begin</span>();`,
    `  <span style="color:#569cd6;">try</span> {`,
    `    <span style="color:#569cd6;">const</span> req = <span style="color:#569cd6;">new</span> sql.<span style="color:#4ec9b0;">Request</span>(transaction);`,
    `    req.<span style="color:#dcdcaa;">input</span>(<span style="color:#ce9178;">'JobID'</span>, sql.Int, jobId);`,
    `    req.<span style="color:#dcdcaa;">input</span>(<span style="color:#ce9178;">'CandidateID'</span>, sql.Int, candidateId);`,
    `    req.<span style="color:#dcdcaa;">input</span>(<span style="color:#ce9178;">'ResumeID'</span>, sql.Int, resumeId);`,
    `    req.<span style="color:#dcdcaa;">input</span>(<span style="color:#ce9178;">'CoverLetter'</span>, sql.<span style="color:#dcdcaa;">NVarChar</span>(<span style="color:#b5cea8;">2000</span>), coverLetter);`,
    `    req.<span style="color:#dcdcaa;">input</span>(<span style="color:#ce9178;">'MatchScore'</span>, sql.<span style="color:#dcdcaa;">Decimal</span>(<span style="color:#b5cea8;">5</span>, <span style="color:#b5cea8;">2</span>), matchScore);`,
    ``,
    `    <span style="color:#6a9955;">// 1. Kiểm tra tin đang mở (JobStatus = 'Active'), đúng chủ sở hữu ResumeID và chưa nộp trùng</span>`,
    `    <span style="color:#569cd6;">const</span> checkResult = <span style="color:#569cd6;">await</span> req.<span style="color:#dcdcaa;">query</span>(<span style="color:#ce9178;">\`</span>`,
    `<span style="color:#ce9178;">      SELECT j.JobID, j.EmployerID,</span>`,
    `<span style="color:#ce9178;">        (SELECT COUNT(1) FROM Resumes WHERE ResumeID = @ResumeID AND CandidateID = @CandidateID AND IsDeleted = 0) AS ValidResume,</span>`,
    `<span style="color:#ce9178;">        (SELECT COUNT(1) FROM Applications WHERE JobID = @JobID AND CandidateID = @CandidateID) AS ExistingApp</span>`,
    `<span style="color:#ce9178;">      FROM Jobs j WHERE j.JobID = @JobID AND j.JobStatus = 'Active' AND j.ExpirationDate >= CAST(GETDATE() AS DATE);</span>`,
    `<span style="color:#ce9178;">    \`</span>);`,
    `    <span style="color:#6a9955;">// 2. Thêm mới bản ghi vào bảng Applications với trạng thái khởi tạo 'Submitted'</span>`,
    `    <span style="color:#569cd6;">const</span> insertResult = <span style="color:#569cd6;">await</span> req.<span style="color:#dcdcaa;">query</span>(<span style="color:#ce9178;">\`</span>`,
    `<span style="color:#ce9178;">      INSERT INTO Applications (JobID, CandidateID, ResumeID, CoverLetter, ApplicationStatus, MatchScore, AppliedAt, UpdatedAt)</span>`,
    `<span style="color:#ce9178;">      OUTPUT INSERTED.ApplicationID, INSERTED.ApplicationStatus, INSERTED.AppliedAt</span>`,
    `<span style="color:#ce9178;">      VALUES (@JobID, @CandidateID, @ResumeID, @CoverLetter, 'Submitted', @MatchScore, SYSDATETIME(), SYSDATETIME());</span>`,
    `<span style="color:#ce9178;">    \`</span>);`,
    `    <span style="color:#569cd6;">await</span> transaction.<span style="color:#dcdcaa;">commit</span>();`,
    `    <span style="color:#569cd6;">return</span> insertResult.recordset[<span style="color:#b5cea8;">0</span>];`,
    `  } <span style="color:#569cd6;">catch</span> (err) { <span style="color:#569cd6;">await</span> transaction.<span style="color:#dcdcaa;">rollback</span>(); <span style="color:#569cd6;">throw</span> err; }`,
    `}`
  ],
  false
);

// ============================================================================
// 11.5. hinh_3_19_testing_api.png (Postman Collection Runner)
// ============================================================================
const html3_19_postman = `
<div style="width:1440px;height:900px;background:#18181b;color:#f4f4f5;display:flex;flex-direction:column;overflow:hidden;">
  <!-- Top Bar -->
  <div style="height:42px;background:#27272a;border-bottom:1px solid #3f3f46;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:12.5px;">
    <div style="display:flex;align-items:center;gap:14px;">
      <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
      <span style="background:#ff6c37;color:#fff;font-weight:800;padding:2px 8px;border-radius:4px;">Postman</span>
      <span style="color:#d4d4d8;">Collection Runner — TalentConnect RESTful API Test Suite</span>
    </div>
    <div style="display:flex;align-items:center;gap:14px;">
      <span style="background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;padding:4px 12px;border-radius:6px;font-weight:600;">
        Environment: Localhost · Node.js + Microsoft SQL Server 2022
      </span>
      <span style="background:#3f3f46;padding:4px 10px;border-radius:6px;">TalentConnect QA</span>
    </div>
  </div>

  <!-- Body -->
  <div style="flex:1;display:grid;grid-template-columns:285px 1fr;overflow:hidden;">
    <!-- Sidebar -->
    <div style="background:#202023;border-right:1px solid #3f3f46;padding:16px;font-size:12.5px;line-height:2;">
      <div style="font-size:11px;font-weight:700;color:#a1a1aa;letter-spacing:0.5px;margin-bottom:8px;">COLLECTIONS: TALENTCONNECT API v1</div>
      <div style="font-weight:700;color:#e4e4e7;">▼ 01. Quản lý Tài khoản & Phân quyền</div>
      <div style="padding-left:14px;"><span style="color:#f59e0b;font-weight:700;">POST</span> /api/v1/auth/login</div>
      <div style="padding-left:14px;"><span style="color:#f59e0b;font-weight:700;">POST</span> /api/v1/auth/login (Sai mật khẩu)</div>
      <div style="font-weight:700;color:#e4e4e7;margin-top:6px;">▼ 02. Việc làm & Đối khớp kỹ năng</div>
      <div style="padding-left:14px;"><span style="color:#22c55e;font-weight:700;">GET</span> &nbsp;/api/v1/jobs/search</div>
      <div style="padding-left:14px;"><span style="color:#22c55e;font-weight:700;">GET</span> &nbsp;/api/v1/jobs/241/match-score</div>
      <div style="font-weight:700;color:#e4e4e7;margin-top:6px;">▼ 03. Ứng tuyển & Phễu tuyển dụng</div>
      <div style="padding-left:14px;"><span style="color:#f59e0b;font-weight:700;">POST</span> /api/v1/applications/apply</div>
      <div style="padding-left:14px;"><span style="color:#f59e0b;font-weight:700;">POST</span> /api/v1/applications/apply (Trùng)</div>
      <div style="padding-left:14px;"><span style="color:#38bdf8;font-weight:700;">PATCH</span> /api/v1/applications/381/status</div>
    </div>

    <!-- Main Runner Content -->
    <div style="display:flex;flex-direction:column;justify-content:space-between;padding:18px 24px;overflow:hidden;">
      <!-- Summary Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #3f3f46;">
        <div>
          <div style="font-size:17px;font-weight:800;color:#ffffff;">Collection Runner: Kiểm thử tích hợp API & Cơ sở dữ liệu (KT-01 → KT-12)</div>
          <div style="font-size:12.5px;color:#a1a1aa;margin-top:2px;">Hệ quản trị CSDL: <b>Microsoft SQL Server 2022 (TalentConnect_DB)</b> · 1 Iteration · 18 Assertions</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center;">
          <div style="background:#052e16;border:1px solid #22c55e;color:#4ade80;padding:8px 16px;border-radius:8px;font-weight:800;font-size:13.5px;">✓ 18 / 18 Passed</div>
          <div style="background:#27272a;border:1px solid #3f3f46;padding:8px 14px;border-radius:8px;font-size:12.5px;">0 Failed</div>
          <div style="background:#27272a;border:1px solid #3f3f46;padding:8px 14px;border-radius:8px;font-size:12.5px;">Total: 258 ms</div>
          <div style="background:#ff6c37;color:#ffffff;padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;">Run Again</div>
        </div>
      </div>

      <!-- 6 Test cards -->
      <div style="display:flex;flex-direction:column;gap:9px;margin:10px 0;">
        <div style="background:#202023;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div><span style="background:#f59e0b;color:#18181b;font-weight:800;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:8px;">POST</span><b>http://localhost:5000/api/v1/auth/login</b> <span style="color:#a1a1aa;">— [KT-02] Đăng nhập tài khoản Người tìm việc (minhanh.it@gmail.com)</span></div>
            <div><span style="background:#052e16;color:#4ade80;padding:2px 8px;border-radius:4px;font-size:11.5px;font-weight:700;">200 OK</span> <span style="color:#a1a1aa;font-size:12px;margin-left:6px;">38 ms</span></div>
          </div>
          <div style="font-size:12px;color:#4ade80;margin-top:5px;">✓ Status code is 200 OK &nbsp;&nbsp; ✓ Bảng Users: AccountStatus = 'Active', UserID = 104 &nbsp;&nbsp; ✓ Bảng UserRoles: RoleCode = 'CANDIDATE', trả về JWT hợp lệ</div>
        </div>

        <div style="background:#202023;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div><span style="background:#22c55e;color:#18181b;font-weight:800;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:8px;">GET</span><b>http://localhost:5000/api/v1/jobs/search?keyword=Frontend&amp;city=HaNoi</b> <span style="color:#a1a1aa;">— [KT-07] Tìm kiếm và lọc việc làm đa tiêu chí</span></div>
            <div><span style="background:#052e16;color:#4ade80;padding:2px 8px;border-radius:4px;font-size:11.5px;font-weight:700;">200 OK</span> <span style="color:#a1a1aa;font-size:12px;margin-left:6px;">52 ms</span></div>
          </div>
          <div style="font-size:12px;color:#4ade80;margin-top:5px;">✓ Status code is 200 OK &nbsp;&nbsp; ✓ Trả về 12 việc làm thỏa điều kiện JobStatus = 'Active' và ExpirationDate &gt;= GETDATE() &nbsp;&nbsp; ✓ Khớp tin JobID = 241 (FPT Software)</div>
        </div>

        <div style="background:#202023;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div><span style="background:#22c55e;color:#18181b;font-weight:800;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:8px;">GET</span><b>http://localhost:5000/api/v1/jobs/241/match-score?candidateId=41</b> <span style="color:#a1a1aa;">— [KT-08] Đối chiếu kỹ năng CandidateSkills &amp; JobSkills</span></div>
            <div><span style="background:#052e16;color:#4ade80;padding:2px 8px;border-radius:4px;font-size:11.5px;font-weight:700;">200 OK</span> <span style="color:#a1a1aa;font-size:12px;margin-left:6px;">31 ms</span></div>
          </div>
          <div style="font-size:12px;color:#4ade80;margin-top:5px;">✓ Status code is 200 OK &nbsp;&nbsp; ✓ Khớp 3/4 kỹ năng: ReactJS (3) + TypeScript (2) + Git (2) = 7 / 8 điểm trọng số &nbsp;&nbsp; ✓ MatchScore tính chính xác = 88%</div>
        </div>

        <div style="background:#202023;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div><span style="background:#f59e0b;color:#18181b;font-weight:800;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:8px;">POST</span><b>http://localhost:5000/api/v1/applications/apply</b> <span style="color:#a1a1aa;">— [KT-09] Nộp đơn ứng tuyển hợp lệ (JobID = 241, ResumeID = 41)</span></div>
            <div><span style="background:#052e16;color:#4ade80;padding:2px 8px;border-radius:4px;font-size:11.5px;font-weight:700;">201 Created</span> <span style="color:#a1a1aa;font-size:12px;margin-left:6px;">64 ms</span></div>
          </div>
          <div style="font-size:12px;color:#4ade80;margin-top:5px;">✓ Status code is 201 Created &nbsp;&nbsp; ✓ INSERT INTO Applications sinh ApplicationID = 381 (Mã đơn TC-000381) &nbsp;&nbsp; ✓ ApplicationStatus = 'Submitted', MatchScore = 88</div>
        </div>

        <div style="background:#202023;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div><span style="background:#f59e0b;color:#18181b;font-weight:800;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:8px;">POST</span><b>http://localhost:5000/api/v1/applications/apply</b> <span style="color:#a1a1aa;">— [KT-10] Kiểm thử chặn nộp trùng đơn vào cùng vị trí JobID = 241</span></div>
            <div><span style="background:#422006;color:#fbbf24;padding:2px 8px;border-radius:4px;font-size:11.5px;font-weight:700;">409 Conflict</span> <span style="color:#a1a1aa;font-size:12px;margin-left:6px;">24 ms</span></div>
          </div>
          <div style="font-size:12px;color:#4ade80;margin-top:5px;">✓ Status code is 409 Conflict &nbsp;&nbsp; ✓ Ràng buộc UNIQUE (JobID, CandidateID) giữ nguyên đơn cũ TC-000381, không sinh bản ghi trùng</div>
        </div>

        <div style="background:#202023;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">
            <div><span style="background:#38bdf8;color:#18181b;font-weight:800;padding:2px 7px;border-radius:4px;font-size:11px;margin-right:8px;">PATCH</span><b>http://localhost:5000/api/v1/applications/381/status</b> <span style="color:#a1a1aa;">— [KT-11] Chuyển giai đoạn ứng viên &amp; lưu lịch sử ApplicationHistories</span></div>
            <div><span style="background:#052e16;color:#4ade80;padding:2px 8px;border-radius:4px;font-size:11.5px;font-weight:700;">200 OK</span> <span style="color:#a1a1aa;font-size:12px;margin-left:6px;">49 ms</span></div>
          </div>
          <div style="font-size:12px;color:#4ade80;margin-top:5px;">✓ Status code is 200 OK &nbsp;&nbsp; ✓ Cập nhật ApplicationStatus = 'Interview' &nbsp;&nbsp; ✓ Ghi bảng ApplicationHistories (FromStatus='Submitted' → ToStatus='Interview') &amp; Notifications</div>
        </div>
      </div>

      <!-- Bottom Console -->
      <div style="background:#121214;border:1px solid #3f3f46;border-radius:8px;padding:10px 14px;font-family:'Consolas',monospace;font-size:12px;line-height:1.6;color:#d4d4d8;">
        <div style="color:#38bdf8;font-weight:700;margin-bottom:3px;">Console Output &amp; SQL Server Verification Log (0 errors)</div>
        <div>[09:32:10] POST /api/v1/applications/apply -&gt; 201 Created | ApplicationID: 381 (TC-000381) | ResumeID: 41 | MatchScore: 88.00</div>
        <div>[09:32:12] POST /api/v1/applications/apply -&gt; 409 Conflict | Duplicate blocked for (JobID=241, CandidateID=41), existing ApplicationID=381</div>
        <div>[09:32:15] PATCH /api/v1/applications/381/status -&gt; 200 OK | ApplicationHistories.HistoryID=912 ('Submitted' -&gt; 'Interview') | Notifications.NotificationID=1408</div>
      </div>
    </div>
  </div>
</div>
`;

// ============================================================================
// 11.6. hinh_3_5_2_d_test_apply_kanban.png (Playwright E2E Test UI)
// ============================================================================
const html3_5_2_d_playwright = `
<div style="width:1440px;height:900px;background:#0f172a;color:#f8fafc;display:flex;flex-direction:column;overflow:hidden;">
  <!-- Top Bar -->
  <div style="height:42px;background:#1e293b;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:12.5px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="dots"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div></div>
      <span style="font-weight:800;color:#ffffff;">Playwright Test UI</span>
      <span style="background:#16a34a;color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;">v1.42</span>
      <span style="color:#94a3b8;">tests/e2e/recruitment-workflow.spec.ts</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="background:#052e16;border:1px solid #22c55e;color:#4ade80;padding:4px 12px;border-radius:6px;font-weight:700;">✓ 5 / 5 Passed (100%)</span>
      <span style="background:#334155;padding:4px 10px;border-radius:6px;">⏱ 0.96s</span>
      <span style="background:#2563eb;color:#ffffff;padding:4px 14px;border-radius:6px;font-weight:700;">▶ Run All</span>
    </div>
  </div>

  <!-- Main Body -->
  <div style="flex:1;display:grid;grid-template-columns:340px 1fr;overflow:hidden;">
    <!-- Left Test Explorer -->
    <div style="background:#111827;border-right:1px solid #334155;padding:14px;display:flex;flex-direction:column;gap:10px;font-size:12.5px;">
      <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:#94a3b8;">
        <span>KỊCH BẢN KIỂM THỬ (KT-07 → KT-11)</span>
        <span style="color:#4ade80;">5 PASSED</span>
      </div>

      <div style="background:#1e293b;border:1px solid #334155;border-radius:7px;padding:9px 12px;display:flex;justify-content:space-between;">
        <span><b style="color:#4ade80;">✓</b> [KT-07] Tìm kiếm và lọc việc làm đa tiêu chí</span>
        <span style="color:#94a3b8;">165ms</span>
      </div>

      <div style="background:#1e293b;border:1px solid #334155;border-radius:7px;padding:9px 12px;display:flex;justify-content:space-between;">
        <span><b style="color:#4ade80;">✓</b> [KT-08] Đối chiếu kỹ năng đạt 88% (7/8 điểm)</span>
        <span style="color:#94a3b8;">120ms</span>
      </div>

      <div style="background:#1e293b;border:1px solid #334155;border-radius:7px;padding:9px 12px;display:flex;justify-content:space-between;">
        <span><b style="color:#4ade80;">✓</b> [KT-09] Nộp đơn hợp lệ mã TC-000381</span>
        <span style="color:#94a3b8;">240ms</span>
      </div>

      <div style="background:#1e293b;border:1px solid #334155;border-radius:7px;padding:9px 12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span><b style="color:#4ade80;">✓</b> <b>[KT-10] Chặn nộp đơn trùng lặp (JobID=241)</b></span>
          <span style="color:#94a3b8;">145ms</span>
        </div>
        <div style="padding-left:14px;font-size:11.5px;color:#cbd5e1;line-height:1.7;">
          <div><span style="color:#4ade80;">✓</span> page.goto('/jobs/241/apply/review')</div>
          <div><span style="color:#4ade80;">✓</span> expect(alert).toContainText('Bạn đã ứng tuyển vị trí này')</div>
          <div><span style="color:#4ade80;">✓</span> expect(code).toHaveText('TC-000381')</div>
        </div>
      </div>

      <div style="background:#1e293b;border:1.5px solid #38bdf8;border-radius:7px;padding:9px 12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span><b style="color:#4ade80;">✓</b> <b>[KT-11] Chuyển giai đoạn &amp; Gửi thông báo</b></span>
          <span style="color:#94a3b8;">290ms</span>
        </div>
        <div style="padding-left:14px;font-size:11.5px;color:#cbd5e1;line-height:1.7;">
          <div><span style="color:#4ade80;">✓</span> card('#TC-000381').dragTo('#col-Interview')</div>
          <div><span style="color:#4ade80;">✓</span> expect(db.Applications.Status).toBe('Interview')</div>
          <div><span style="color:#4ade80;">✓</span> expect(db.ApplicationHistories).toHaveCount(1)</div>
          <div><span style="color:#4ade80;">✓</span> expect(db.Notifications).toHaveCount(1)</div>
        </div>
      </div>
    </div>

    <!-- Right DOM Preview & Audit Log -->
    <div style="display:flex;flex-direction:column;justify-content:space-between;background:#f8fafc;color:#0f172a;overflow:hidden;">
      <!-- Sub URL bar -->
      <div style="height:38px;background:#0f172a;color:#cbd5e1;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:12px;">
        <span style="background:#1e293b;padding:4px 12px;border-radius:12px;color:#38bdf8;">
          http://localhost:3000/employer/jobs/241/applications
        </span>
        <span>DOM Snapshot · Tiến trình 5.1 &amp; 5.3</span>
      </div>

      <!-- Preview Canvas -->
      <div style="flex:1;padding:14px 18px;display:flex;flex-direction:column;gap:10px;overflow:hidden;">
        <!-- Success Banner -->
        <div style="background:#dcfce7;border:1px solid #22c55e;border-radius:8px;padding:9px 14px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;font-weight:800;color:#166534;">✓ [KT-11] Chuyển giai đoạn ứng viên thành công!</div>
            <div style="font-size:12px;color:#15803d;">Đã chuyển hồ sơ <b>Nguyễn Minh Anh (Mã đơn TC-000381)</b> sang cột <b>"3. Mời phỏng vấn"</b> và gửi thông báo cho ứng viên.</div>
          </div>
          <span style="background:#ffffff;color:#166534;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:6px;border:1px solid #86efac;">HTTP 200 OK</span>
        </div>

        <!-- Job Summary -->
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:9px 14px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="background:#eff6ff;color:#1d4ed8;font-weight:700;font-size:12px;padding:3px 8px;border-radius:5px;margin-right:8px;">FPT Software</span>
            <span style="font-size:14px;font-weight:800;">Frontend Developer (ReactJS / TypeScript) · Mã tin TC-J0241</span>
            <span style="font-size:12px;color:#64748b;margin-left:10px;">Lương: 14 - 22 triệu · Cầu Giấy, Hà Nội</span>
          </div>
          <span style="background:#f1f5f9;border:1px solid #cbd5e1;font-size:11.5px;font-weight:600;padding:4px 10px;border-radius:6px;">
            ✓ Đã kiểm tra chống nộp trùng (KT-10)
          </span>
        </div>

        <!-- 5 Stage Columns in Playwright Preview -->
        <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:10px;flex:1;overflow:hidden;">
          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:8px;">
            <div style="font-size:12px;font-weight:800;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>1. Hồ sơ mới nộp</span><span style="background:#e2e8f0;padding:1px 6px;border-radius:8px;">1</span>
            </div>
            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px;font-size:11.5px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;"><span>Trần Văn Bình</span><span style="color:#15803d;">75%</span></div>
              <div style="color:#64748b;margin-top:3px;">Mã đơn: TC-000379</div>
              <div style="color:#64748b;">03/10/2026</div>
            </div>
          </div>

          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:8px;">
            <div style="font-size:12px;font-weight:800;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>2. Đạt sơ loại</span><span style="background:#e2e8f0;padding:1px 6px;border-radius:8px;">2</span>
            </div>
            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px;font-size:11.5px;margin-bottom:7px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;"><span>Phạm Minh Tuấn</span><span style="color:#15803d;">88%</span></div>
              <div style="color:#64748b;margin-top:3px;">Mã đơn: TC-000365</div>
            </div>
            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px;font-size:11.5px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;"><span>Vũ Thị Mai</span><span style="color:#15803d;">75%</span></div>
              <div style="color:#64748b;margin-top:3px;">Mã đơn: TC-000362</div>
            </div>
          </div>

          <!-- Highlighted target column 3 -->
          <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:8px;padding:8px;">
            <div style="font-size:12px;font-weight:800;color:#1d4ed8;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>3. Mời phỏng vấn</span><span style="background:#2563eb;color:#fff;padding:1px 6px;border-radius:8px;">3</span>
            </div>
            <div style="background:#ffffff;border:2px solid #2563eb;border-radius:7px;padding:8px;font-size:11.5px;margin-bottom:7px;">
              <div style="display:flex;justify-content:space-between;font-weight:800;color:#1e3a8a;">
                <span>Nguyễn Minh Anh</span><span style="background:#dcfce7;color:#166534;padding:1px 5px;border-radius:4px;">88%</span>
              </div>
              <div style="font-weight:700;color:#0f172a;margin-top:3px;">Mã đơn: TC-000381</div>
              <div style="color:#475569;">CV_MinhAnh_Frontend_2026.pdf</div>
              <div style="color:#15803d;font-weight:700;margin-top:3px;">✓ Mời phỏng vấn Vòng 1</div>
            </div>
            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px;font-size:11.5px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;"><span>Lê Hoàng Long</span><span style="color:#15803d;">88%</span></div>
              <div style="color:#64748b;margin-top:3px;">Mã đơn: TC-000350</div>
            </div>
          </div>

          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:8px;">
            <div style="font-size:12px;font-weight:800;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>4. Đề xuất nhận việc</span><span style="background:#e2e8f0;padding:1px 6px;border-radius:8px;">1</span>
            </div>
            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px;font-size:11.5px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;"><span>Vũ Phương Thảo</span><span style="color:#15803d;">100%</span></div>
              <div style="color:#64748b;margin-top:3px;">Mã đơn: TC-000331</div>
            </div>
          </div>

          <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:8px;">
            <div style="font-size:12px;font-weight:800;margin-bottom:8px;display:flex;justify-content:space-between;">
              <span>5. Chưa phù hợp</span><span style="background:#e2e8f0;padding:1px 6px;border-radius:8px;">1</span>
            </div>
            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:7px;padding:8px;font-size:11.5px;">
              <div style="display:flex;justify-content:space-between;font-weight:700;"><span>Đặng Quốc Cường</span><span style="color:#64748b;">38%</span></div>
              <div style="color:#64748b;margin-top:3px;">Mã đơn: TC-000329</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom SQL Server Audit Log -->
      <div style="background:#0f172a;color:#e2e8f0;border-top:1px solid #334155;padding:10px 18px;font-family:'Consolas',monospace;font-size:12px;line-height:1.62;">
        <div style="color:#38bdf8;font-weight:700;margin-bottom:2px;">Assertions (5/5 Passed) &amp; Microsoft SQL Server Audit Trail</div>
        <div style="color:#4ade80;">[14:28:44.201] ✓ [KT-07, KT-08] Tìm kiếm trả về tin JobID = 241 (JobStatus = 'Active'), tính điểm khớp kỹ năng MatchScore = 88% (7/8 trọng số)</div>
        <div style="color:#4ade80;">[14:28:44.230] ✓ [KT-09, KT-10] Đã tạo đơn ApplicationID = 381 (TC-000381) và chặn nộp trùng lần 2 vào cùng JobID = 241</div>
        <div style="color:#4ade80;">[14:28:44.415] ✓ [DATABASE] UPDATE Applications SET ApplicationStatus = 'Interview' WHERE ApplicationID = 381</div>
        <div style="color:#4ade80;">[14:28:44.430] ✓ [AUDIT &amp; NOTIFY] INSERT INTO ApplicationHistories (FromStatus='Submitted', ToStatus='Interview') &amp; INSERT INTO Notifications (UserID=104)</div>
      </div>
    </div>
  </div>
</div>
`;

console.log('>>> Rendering Part 2: UI Mockups & Code/Testing Screenshots...');
renderHtmlToPng('hinh_3_12_ui_home.png', 1440, 860, html3_12_home);
renderHtmlToPng('hinh_3_16_ui_auth.png', 1440, 860, html3_16_auth);
renderHtmlToPng('hinh_3_13_ui_cv_builder.png', 1440, 860, html3_13_cv);
renderHtmlToPng('hinh_3_15_ui_kanban_ats.png', 1440, 860, html3_15_kanban);
renderHtmlToPng('hinh_3_17_ui_admin_dashboard.png', 1440, 860, html3_17_admin);
renderHtmlToPng('hinh_3_19_testing_api.png', 1440, 900, html3_19_postman, '#18181b');
renderHtmlToPng('hinh_3_5_2_d_test_apply_kanban.png', 1440, 900, html3_5_2_d_playwright, '#0f172a');
console.log('>>> Part 2 complete!');
