const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.join(projectRoot, 'assets', 'diagrams');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function renderSvgToPng(name, width, height, svgContent) {
  const htmlPath = path.join(__dirname, `temp_${name}.html`);
  const pngPath = path.join(outDir, name);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    background: #ffffff; 
    width: ${width}px; 
    height: ${height}px; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    font-family: "Times New Roman", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; 
  }
  svg { display: block; }
</style>
</head>
<body>
  ${svgContent}
</body>
</html>`;
  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${pngPath}" --window-size=${width},${height} "${htmlPath}"`);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  console.log(`Rendered: ${name} (${fs.statSync(pngPath).size} bytes)`);
}

const COMMON_DEFS = `
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1e293b" />
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1d4ed8" />
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#047857" />
    </marker>
    <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#b91c1c" />
    </marker>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>
`;

// =============================================================================
// DIAGRAM 1: KIẾN TRÚC TỔNG THỂ CHÍNH PHỦ ĐIỆN TỬ VÀ VỊ TRÍ HỆ THỐNG (Khung 3.0)
// =============================================================================
function generateDiagram1() {
  const w = 960, h = 620;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <!-- Title Header -->
    <rect x="30" y="20" width="900" height="42" rx="6" fill="#1e3a8a"/>
    <text x="480" y="47" font-size="16" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">KIẾN TRÚC TỔNG THỂ CHÍNH PHỦ ĐIỆN TỬ CẤP TỈNH VÀ VỊ TRÍ HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC</text>

    <!-- Layer 1: Đối tượng sử dụng -->
    <rect x="30" y="80" width="900" height="75" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" filter="url(#shadow)"/>
    <rect x="40" y="88" width="180" height="24" rx="4" fill="#0284c7"/>
    <text x="130" y="104" font-size="12" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG ĐỐI TƯỢNG SỬ DỤNG</text>
    
    <g transform="translate(240, 92)">
      <rect x="0" y="0" width="195" height="50" rx="5" fill="#ffffff" stroke="#0284c7" stroke-width="1.2"/>
      <text x="97" y="22" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">Công dân và Hộ gia đình</text>
      <text x="97" y="38" font-size="10.5" fill="#64748b" text-anchor="middle">VNeID, Thiết bị di động, Cổng dịch vụ</text>

      <rect x="220" y="0" width="195" height="50" rx="5" fill="#ffffff" stroke="#0284c7" stroke-width="1.2"/>
      <text x="317" y="22" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">Doanh nghiệp và Hợp tác xã</text>
      <text x="317" y="38" font-size="10.5" fill="#64748b" text-anchor="middle">Chữ ký số doanh nghiệp, Mã số thuế</text>

      <rect x="440" y="0" width="225" height="50" rx="5" fill="#ffffff" stroke="#0284c7" stroke-width="1.2"/>
      <text x="552" y="22" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">Cán bộ, Công chức, Viên chức</text>
      <text x="552" y="38" font-size="10.5" fill="#64748b" text-anchor="middle">Một cửa, Thụ lý chuyên môn, Lãnh đạo</text>
    </g>

    <!-- Arrow Down -->
    <line x1="480" y1="155" x2="480" y2="175" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Layer 2: Trọng tâm - Hệ thống thông tin giải quyết TTHC -->
    <rect x="30" y="180" width="900" height="185" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2" filter="url(#shadow)"/>
    <rect x="40" y="190" width="310" height="26" rx="4" fill="#1d4ed8"/>
    <text x="195" y="208" font-size="12" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC CẤP TỈNH</text>

    <!-- Subsystems -->
    <g transform="translate(50, 226)">
      <rect x="0" y="0" width="195" height="125" rx="5" fill="#ffffff" stroke="#3b82f6" stroke-width="1.2"/>
      <rect x="0" y="0" width="195" height="26" rx="5" fill="#dbeafe"/>
      <text x="97" y="18" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="middle">CỔNG DỊCH VỤ CÔNG</text>
      <text x="15" y="46" font-size="10.5" fill="#334155">• Tiếp nhận hồ sơ trực tuyến</text>
      <text x="15" y="66" font-size="10.5" fill="#334155">• Xác thực định danh điện tử</text>
      <text x="15" y="86" font-size="10.5" fill="#334155">• Thanh toán phí, lệ phí điện tử</text>
      <text x="15" y="106" font-size="10.5" fill="#334155">• Kho dữ liệu điện tử cá nhân</text>

      <rect x="215" y="0" width="195" height="125" rx="5" fill="#ffffff" stroke="#3b82f6" stroke-width="1.2"/>
      <rect x="215" y="0" width="195" height="26" rx="5" fill="#dbeafe"/>
      <text x="312" y="18" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="middle">HỆ THỐNG MỘT CỬA</text>
      <text x="230" y="46" font-size="10.5" fill="#334155">• Tiếp nhận trực tiếp tại Trung tâm</text>
      <text x="230" y="66" font-size="10.5" fill="#334155">• Số hóa hồ sơ tại nguồn</text>
      <text x="230" y="86" font-size="10.5" fill="#334155">• Cấp mã số hồ sơ tự động</text>
      <text x="230" y="106" font-size="10.5" fill="#334155">• Trả kết quả điện tử và bản giấy</text>

      <rect x="430" y="0" width="205" height="125" rx="5" fill="#ffffff" stroke="#3b82f6" stroke-width="1.2"/>
      <rect x="430" y="0" width="205" height="26" rx="5" fill="#dbeafe"/>
      <text x="532" y="18" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="middle">XỬ LÝ CHUYÊN MÔN</text>
      <text x="445" y="46" font-size="10.5" fill="#334155">• Phân công hồ sơ theo quy trình</text>
      <text x="445" y="66" font-size="10.5" fill="#334155">• Thẩm định nội dung nghiệp vụ</text>
      <text x="445" y="86" font-size="10.5" fill="#334155">• Lấy ý kiến liên ngành, liên cấp</text>
      <text x="445" y="106" font-size="10.5" fill="#334155">• Ký số văn bản kết quả điện tử</text>

      <rect x="655" y="0" width="195" height="125" rx="5" fill="#ffffff" stroke="#3b82f6" stroke-width="1.2"/>
      <rect x="655" y="0" width="195" height="26" rx="5" fill="#dbeafe"/>
      <text x="752" y="18" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="middle">GIÁM SÁT VÀ ĐIỀU HÀNH</text>
      <text x="670" y="46" font-size="10.5" fill="#334155">• Đánh giá Bộ chỉ số 766</text>
      <text x="670" y="66" font-size="10.5" fill="#334155">• Đo lường tỷ lệ đúng hạn, trễ hạn</text>
      <text x="670" y="86" font-size="10.5" fill="#334155">• Theo dõi tiến độ thời gian thực</text>
      <text x="670" y="106" font-size="10.5" fill="#334155">• Khảo sát mức độ hài lòng</text>
    </g>

    <!-- Arrow Down -->
    <line x1="480" y1="365" x2="480" y2="385" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Layer 3: Tầng kết nối tích hợp dữ liệu (LGSP / NDXP) -->
    <rect x="30" y="390" width="900" height="75" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" filter="url(#shadow)"/>
    <rect x="40" y="398" width="220" height="24" rx="4" fill="#15803d"/>
    <text x="150" y="414" font-size="12" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG KẾT NỐI VÀ CHIA SẺ DỮ LIỆU</text>
    
    <g transform="translate(280, 400)">
      <rect x="0" y="0" width="300" height="52" rx="5" fill="#ffffff" stroke="#16a34a" stroke-width="1.2"/>
      <text x="150" y="22" font-size="11.5" font-weight="bold" fill="#166534" text-anchor="middle">Nền tảng chia sẻ dữ liệu cấp tỉnh (LGSP)</text>
      <text x="150" y="40" font-size="10" fill="#4b5563" text-anchor="middle">Quản lý giao diện kết nối, điều phối thông điệp an toàn</text>

      <rect x="330" y="0" width="300" height="52" rx="5" fill="#ffffff" stroke="#16a34a" stroke-width="1.2"/>
      <text x="480" y="22" font-size="11.5" font-weight="bold" fill="#166534" text-anchor="middle">Nền tảng tích hợp dữ liệu quốc gia (NDXP)</text>
      <text x="480" y="40" font-size="10" fill="#4b5563" text-anchor="middle">Kết nối liên thông các Bộ, ngành và Cổng Dịch vụ công Quốc gia</text>
    </g>

    <!-- Arrow Down -->
    <line x1="480" y1="465" x2="480" y2="485" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Layer 4: Cơ sở dữ liệu và Hạ tầng kỹ thuật -->
    <rect x="30" y="490" width="900" height="110" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" filter="url(#shadow)"/>
    <rect x="40" y="498" width="230" height="24" rx="4" fill="#475569"/>
    <text x="155" y="514" font-size="12" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG DỮ LIỆU VÀ HẠ TẦNG SỐ</text>

    <g transform="translate(280, 500)">
      <rect x="0" y="0" width="145" height="88" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="72" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">CSDL Dân cư</text>
      <text x="72" y="40" font-size="9.5" fill="#64748b" text-anchor="middle">Đề án 06</text>
      <text x="72" y="58" font-size="9.5" fill="#64748b" text-anchor="middle">Xác thực VNeID</text>
      <text x="72" y="74" font-size="9.5" fill="#64748b" text-anchor="middle">Làm sạch hồ sơ</text>

      <rect x="160" y="0" width="145" height="88" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="232" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">CSDL Doanh nghiệp</text>
      <text x="232" y="40" font-size="9.5" fill="#64748b" text-anchor="middle">Đăng ký kinh doanh</text>
      <text x="232" y="58" font-size="9.5" fill="#64748b" text-anchor="middle">Mã số thuế</text>
      <text x="232" y="74" font-size="9.5" fill="#64748b" text-anchor="middle">Trạng thái hoạt động</text>

      <rect x="320" y="0" width="145" height="88" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="392" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">CSDL Đất đai, Tư pháp</text>
      <text x="392" y="40" font-size="9.5" fill="#64748b" text-anchor="middle">Hồ sơ địa chính</text>
      <text x="392" y="58" font-size="9.5" fill="#64748b" text-anchor="middle">Hộ tịch điện tử</text>
      <text x="392" y="74" font-size="9.5" fill="#64748b" text-anchor="middle">Lý lịch tư pháp</text>

      <rect x="480" y="0" width="150" height="88" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="555" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Kho Bạc & Biên Lai</text>
      <text x="555" y="40" font-size="9.5" fill="#64748b" text-anchor="middle">Thanh toán trực tuyến</text>
      <text x="555" y="58" font-size="9.5" fill="#64748b" text-anchor="middle">Biên lai điện tử có ký</text>
      <text x="555" y="74" font-size="9.5" fill="#64748b" text-anchor="middle">Đối soát ngân sách</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_1_1_mo_hinh_tong_the_chinh_phu_dien_tu.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 2: CHU TRÌNH NGHIỆP VỤ MỘT CỬA ĐIỆN TỬ VÀ SỐ HÓA HỒ SƠ
// =============================================================================
function generateDiagram2() {
  const w = 960, h = 420;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">QUY TRÌNH NGHIỆP VỤ GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH THEO CƠ CHẾ MỘT CỬA ĐIỆN TỬ</text>

    <!-- 5 Steps Horizontal -->
    <!-- Step 1 -->
    <g transform="translate(30, 80)">
      <rect x="0" y="0" width="165" height="230" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="32" rx="8" fill="#1d4ed8"/>
      <text x="82" y="21" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">BƯỚC 1: TIẾP NHẬN</text>
      
      <circle cx="82" cy="62" r="18" fill="#dbeafe"/>
      <text x="82" y="68" font-size="13" font-weight="bold" fill="#1d4ed8" text-anchor="middle">01</text>
      
      <text x="12" y="105" font-size="11" font-weight="bold" fill="#0f172a">• Kênh tiếp nhận:</text>
      <text x="20" y="123" font-size="10.5" fill="#334155">Cổng Dịch vụ công</text>
      <text x="20" y="139" font-size="10.5" fill="#334155">Trung tâm Phục vụ HCC</text>
      <text x="12" y="165" font-size="11" font-weight="bold" fill="#0f172a">• Nghiệp vụ xử lý:</text>
      <text x="20" y="183" font-size="10.5" fill="#334155">Kiểm tra tính hợp lệ</text>
      <text x="20" y="199" font-size="10.5" fill="#334155">Cấp Mã số hồ sơ điện tử</text>
      <text x="20" y="215" font-size="10.5" fill="#334155">Xuất Giấy tiếp nhận hẹn trả</text>
    </g>

    <!-- Arrow 1 -> 2 -->
    <line x1="200" y1="195" x2="218" y2="195" stroke="#1d4ed8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

    <!-- Step 2 -->
    <g transform="translate(222, 80)">
      <rect x="0" y="0" width="165" height="230" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="32" rx="8" fill="#15803d"/>
      <text x="82" y="21" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">BƯỚC 2: SỐ HÓA</text>
      
      <circle cx="82" cy="62" r="18" fill="#dcfce7"/>
      <text x="82" y="68" font-size="13" font-weight="bold" fill="#15803d" text-anchor="middle">02</text>
      
      <text x="12" y="105" font-size="11" font-weight="bold" fill="#0f172a">• Theo NĐ 107/2021:</text>
      <text x="20" y="123" font-size="10.5" fill="#334155">Quét hồ sơ giấy tại chỗ</text>
      <text x="20" y="139" font-size="10.5" fill="#334155">Định dạng PDF/A có lớp text</text>
      <text x="12" y="165" font-size="11" font-weight="bold" fill="#0f172a">• Ký số chứng thực:</text>
      <text x="20" y="183" font-size="10.5" fill="#334155">Ký số công chức tiếp nhận</text>
      <text x="20" y="199" font-size="10.5" fill="#334155">Gắn siêu dữ liệu bóc tách</text>
      <text x="20" y="215" font-size="10.5" fill="#334155">Đưa vào Kho dữ liệu số</text>
    </g>

    <!-- Arrow 2 -> 3 -->
    <line x1="392" y1="195" x2="410" y2="195" stroke="#15803d" stroke-width="2.5" marker-end="url(#arrow-green)"/>

    <!-- Step 3 -->
    <g transform="translate(414, 80)">
      <rect x="0" y="0" width="165" height="230" rx="8" fill="#fffbeb" stroke="#d97706" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="32" rx="8" fill="#b45309"/>
      <text x="82" y="21" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">BƯỚC 3: THỤ LÝ</text>
      
      <circle cx="82" cy="62" r="18" fill="#fef3c7"/>
      <text x="82" y="68" font-size="13" font-weight="bold" fill="#b45309" text-anchor="middle">03</text>
      
      <text x="12" y="105" font-size="11" font-weight="bold" fill="#0f172a">• Phân công hồ sơ:</text>
      <text x="20" y="123" font-size="10.5" fill="#334155">Chuyển phòng chuyên môn</text>
      <text x="20" y="139" font-size="10.5" fill="#334155">Phân bổ chuyên viên thụ lý</text>
      <text x="12" y="165" font-size="11" font-weight="bold" fill="#0f172a">• Thẩm định nội dung:</text>
      <text x="20" y="183" font-size="10.5" fill="#334155">Kiểm tra thực địa (nếu có)</text>
      <text x="20" y="199" font-size="10.5" fill="#334155">Lấy ý kiến phối hợp liên sở</text>
      <text x="20" y="215" font-size="10.5" fill="#334155">Dự thảo văn bản kết quả</text>
    </g>

    <!-- Arrow 3 -> 4 -->
    <line x1="584" y1="195" x2="602" y2="195" stroke="#d97706" stroke-width="2.5" marker-end="url(#arrow)"/>

    <!-- Step 4 -->
    <g transform="translate(606, 80)">
      <rect x="0" y="0" width="165" height="230" rx="8" fill="#fdf2f8" stroke="#db2777" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="32" rx="8" fill="#be185d"/>
      <text x="82" y="21" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">BƯỚC 4: PHÊ DUYỆT</text>
      
      <circle cx="82" cy="62" r="18" fill="#fce7f3"/>
      <text x="82" y="68" font-size="13" font-weight="bold" fill="#be185d" text-anchor="middle">04</text>
      
      <text x="12" y="105" font-size="11" font-weight="bold" fill="#0f172a">• Trình lãnh đạo:</text>
      <text x="20" y="123" font-size="10.5" fill="#334155">Trưởng phòng rà soát hồ sơ</text>
      <text x="20" y="139" font-size="10.5" fill="#334155">Trình Lãnh đạo cơ quan ký</text>
      <text x="12" y="165" font-size="11" font-weight="bold" fill="#0f172a">• Ký số công quyền:</text>
      <text x="20" y="183" font-size="10.5" fill="#334155">Ký số cá nhân lãnh đạo</text>
      <text x="20" y="199" font-size="10.5" fill="#334155">Ký số con dấu cơ quan nhà nước</text>
      <text x="20" y="215" font-size="10.5" fill="#334155">Phát hành kết quả điện tử</text>
    </g>

    <!-- Arrow 4 -> 5 -->
    <line x1="776" y1="195" x2="794" y2="195" stroke="#db2777" stroke-width="2.5" marker-end="url(#arrow)"/>

    <!-- Step 5 -->
    <g transform="translate(798, 80)">
      <rect x="0" y="0" width="135" height="230" rx="8" fill="#faf5ff" stroke="#7e22ce" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="135" height="32" rx="8" fill="#6b21a8"/>
      <text x="67" y="21" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">BƯỚC 5: TRẢ KẾT QUẢ</text>
      
      <circle cx="67" cy="62" r="18" fill="#f3e8ff"/>
      <text x="67" y="68" font-size="13" font-weight="bold" fill="#6b21a8" text-anchor="middle">05</text>
      
      <text x="10" y="105" font-size="11" font-weight="bold" fill="#0f172a">• Phương thức:</text>
      <text x="16" y="123" font-size="10" fill="#334155">Kho dữ liệu cá nhân</text>
      <text x="16" y="139" font-size="10" fill="#334155">Trực tiếp tại Một cửa</text>
      <text x="16" y="155" font-size="10" fill="#334155">Bưu chính công ích</text>
      <text x="10" y="180" font-size="11" font-weight="bold" fill="#0f172a">• Khảo sát:</text>
      <text x="16" y="198" font-size="10" fill="#334155">Đánh giá sự hài lòng</text>
      <text x="16" y="214" font-size="10" fill="#334155">Đóng hồ sơ lịch sử</text>
    </g>

    <!-- Bottom SLA & Monitoring Bar -->
    <rect x="30" y="335" width="900" height="65" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2"/>
    <text x="480" y="358" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">HỆ THỐNG GIÁM SÁT TIẾN ĐỘ THỜI GIAN THỰC THEO BỘ CHỈ SỐ 766 CỦA THỦ TƯỚNG CHÍNH PHỦ</text>
    <text x="480" y="380" font-size="10.5" fill="#475569" text-anchor="middle">Tự động cảnh báo trước hạn 24 giờ - Nghiêm cấm để quá hạn không có văn bản xin lỗi - Công khai tiến độ trên Cổng Dịch vụ công Quốc gia</text>
  </svg>`;
  renderSvgToPng('hinh_2_1_quy_trinh_nghiep_vu_mot_cua_dien_tu.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 3: LUỒNG NGHĨA VỤ TÀI CHÍNH TRỰC TUYẾN VÀ ĐỐI SOÁT BA BÊN
// =============================================================================
function generateDiagram3() {
  const w = 960, h = 500;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">QUY TRÌNH NGHĨA VỤ TÀI CHÍNH TRỰC TUYẾN, PHÁT HÀNH BIÊN LAI ĐIỆN TỬ VÀ ĐỐI SOÁT BA BÊN</text>

    <!-- Block 1: Công dân -->
    <g transform="translate(40, 80)">
      <rect x="0" y="0" width="220" height="110" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="220" height="28" rx="6" fill="#1d4ed8"/>
      <text x="110" y="19" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">NGƯỜI DÂN / DOANH NGHIỆP</text>
      <text x="15" y="48" font-size="10.5" fill="#1e293b">• Nhận thông báo nộp phí/lệ phí</text>
      <text x="15" y="68" font-size="10.5" fill="#1e293b">• Chọn phương thức thanh toán</text>
      <text x="15" y="88" font-size="10.5" fill="#1e293b">• Quét mã phản hồi nhanh / Thẻ nội địa</text>
    </g>

    <!-- Arrow 1 -> 2 -->
    <line x1="260" y1="135" x2="310" y2="135" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrow-blue)"/>
    <text x="285" y="125" font-size="9" fill="#1d4ed8" text-anchor="middle">Lệnh nộp tiền</text>

    <!-- Block 2: Cổng DVCQG / Trung gian thanh toán -->
    <g transform="translate(315, 80)">
      <rect x="0" y="0" width="260" height="110" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="260" height="28" rx="6" fill="#15803d"/>
      <text x="130" y="19" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">TRUNG GIAN THANH TOÁN / NGÂN HÀNG</text>
      <text x="15" y="48" font-size="10.5" fill="#1e293b">• Trừ tiền trong tài khoản người nộp</text>
      <text x="15" y="68" font-size="10.5" fill="#1e293b">• Trả gói tin phản hồi tức thời</text>
      <text x="15" y="88" font-size="10.5" fill="#1e293b">• Tập trung tiền thu vào tài khoản chuyên thu</text>
    </g>

    <!-- Arrow 2 -> 3 -->
    <line x1="575" y1="135" x2="625" y2="135" stroke="#16a34a" stroke-width="2" marker-end="url(#arrow-green)"/>
    <text x="600" y="125" font-size="9" fill="#16a34a" text-anchor="middle">Gói tin thành công</text>

    <!-- Block 3: Hệ thống Một cửa điện tử -->
    <g transform="translate(630, 80)">
      <rect x="0" y="0" width="290" height="110" rx="6" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="290" height="28" rx="6" fill="#a16207"/>
      <text x="145" y="19" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">HỆ THỐNG MỘT CỬA ĐIỆN TỬ TỈNH</text>
      <text x="15" y="48" font-size="10.5" fill="#1e293b">• Cập nhật trạng thái "Đã nộp phí, lệ phí"</text>
      <text x="15" y="68" font-size="10.5" fill="#1e293b">• Tự động kích hoạt bước thẩm định tiếp theo</text>
      <text x="15" y="88" font-size="10.5" fill="#1e293b">• Chuyển dữ liệu sang phần mềm Biên lai</text>
    </g>

    <!-- Arrow down from block 3 to Bien lai -->
    <line x1="775" y1="190" x2="775" y2="235" stroke="#a16207" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Block 4: Phát hành biên lai điện tử -->
    <g transform="translate(630, 240)">
      <rect x="0" y="0" width="290" height="100" rx="6" fill="#fdf2f8" stroke="#db2777" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="290" height="26" rx="6" fill="#be185d"/>
      <text x="145" y="18" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">HỆ THỐNG BIÊN LAI ĐIỆN TỬ CÓ KÝ SỐ</text>
      <text x="15" y="45" font-size="10" fill="#1e293b">• Tự động sinh biên lai thu phí/lệ phí</text>
      <text x="15" y="63" font-size="10" fill="#1e293b">• Ký số chuyên dùng cơ quan nhà nước</text>
      <text x="15" y="81" font-size="10" fill="#1e293b">• Đồng bộ vào Kho cá nhân và đính kèm hồ sơ</text>
    </g>

    <!-- Arrow back from Bien lai to Cong dan -->
    <path d="M 630 290 L 150 290 L 150 200" fill="none" stroke="#db2777" stroke-width="1.8" stroke-dasharray="5,4" marker-end="url(#arrow)"/>
    <text x="350" y="282" font-size="10" font-weight="bold" fill="#db2777" text-anchor="middle">Gửi biên lai điện tử có ký số vào Kho dữ liệu công dân</text>

    <!-- Reconciliation Layer: Đối soát 3 bên -->
    <rect x="40" y="360" width="880" height="125" rx="8" fill="#f8fafc" stroke="#475569" stroke-width="1.5" filter="url(#shadow)"/>
    <rect x="50" y="368" width="280" height="24" rx="4" fill="#334155"/>
    <text x="190" y="384" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">CƠ CHẾ ĐỐI SOÁT ĐỘC LẬP BA BÊN CUỐI NGÀY</text>

    <g transform="translate(60, 400)">
      <rect x="0" y="0" width="250" height="70" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="125" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Bên 1: Hệ thống Một cửa điện tử</text>
      <text x="15" y="40" font-size="9.5" fill="#475569">• Bảng kê hồ sơ hoàn thành nộp tiền</text>
      <text x="15" y="56" font-size="9.5" fill="#475569">• Mã định danh và số tiền thu được ghi nhận</text>

      <rect x="285" y="0" width="270" height="70" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="135" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Bên 2: Trung gian thanh toán / Cổng DVCQG</text>
      <text x="15" y="40" font-size="9.5" fill="#475569">• Bảng kê giao dịch trừ tiền thành công</text>
      <text x="15" y="56" font-size="9.5" fill="#475569">• Sao kê chi tiết từng giao dịch chuyển mạch</text>

      <rect x="585" y="0" width="255" height="70" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="127" y="20" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">Bên 3: Kho bạc Nhà nước tỉnh</text>
      <text x="15" y="40" font-size="9.5" fill="#475569">• Giấy báo Có vào tài khoản chuyên thu</text>
      <text x="15" y="56" font-size="9.5" fill="#475569">• Báo cáo tổng hợp số thu ngân sách nhà nước</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_2_2_luong_nghia_vu_tai_chinh_truc_tuyen.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 4: SƠ ĐỒ PHÂN RÃ CHỨC NĂNG (FDD)
// =============================================================================
function generateDiagram4() {
  const w = 960, h = 600;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <!-- Title -->
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">SƠ ĐỒ PHÂN RÃ CHỨC NĂNG (FDD) HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC</text>

    <!-- Level 0: Hệ thống gốc -->
    <rect x="280" y="70" width="400" height="42" rx="6" fill="#1e40af" filter="url(#shadow)"/>
    <text x="480" y="96" font-size="13.5" font-weight="bold" fill="#ffffff" text-anchor="middle">HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC CẤP TỈNH</text>

    <!-- Branch Lines -->
    <path d="M 480 112 L 480 145 M 85 145 L 875 145" fill="none" stroke="#64748b" stroke-width="1.8"/>
    
    <!-- 6 Sub-Functions (Level 1) -->
    <!-- F1 -->
    <line x1="85" y1="145" x2="85" y2="175" stroke="#64748b" stroke-width="1.8"/>
    <g transform="translate(15, 175)">
      <rect x="0" y="0" width="140" height="36" rx="4" fill="#0284c7"/>
      <text x="70" y="22" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">1. CỔNG DVC</text>
      
      <!-- Children -->
      <rect x="5" y="48" width="130" height="24" rx="3" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="70" y="64" font-size="9.5" fill="#0369a1" text-anchor="middle">1.1. Định danh VNeID</text>

      <rect x="5" y="78" width="130" height="24" rx="3" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="70" y="94" font-size="9.5" fill="#0369a1" text-anchor="middle">1.2. Nộp hồ sơ số</text>

      <rect x="5" y="108" width="130" height="24" rx="3" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="70" y="124" font-size="9.5" fill="#0369a1" text-anchor="middle">1.3. Tra cứu tiến độ</text>

      <rect x="5" y="138" width="130" height="24" rx="3" fill="#f0f9ff" stroke="#bae6fd"/>
      <text x="70" y="154" font-size="9.5" fill="#0369a1" text-anchor="middle">1.4. Kho dữ liệu cá nhân</text>
    </g>

    <!-- F2 -->
    <line x1="240" y1="145" x2="240" y2="175" stroke="#64748b" stroke-width="1.8"/>
    <g transform="translate(170, 175)">
      <rect x="0" y="0" width="140" height="36" rx="4" fill="#0d9488"/>
      <text x="70" y="22" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">2. MỘT CỬA ĐIỆN TỬ</text>

      <rect x="5" y="48" width="130" height="24" rx="3" fill="#f0fdfa" stroke="#99f6e4"/>
      <text x="70" y="64" font-size="9.5" fill="#0f766e" text-anchor="middle">2.1. Tiếp nhận hồ sơ</text>

      <rect x="5" y="78" width="130" height="24" rx="3" fill="#f0fdfa" stroke="#99f6e4"/>
      <text x="70" y="94" font-size="9.5" fill="#0f766e" text-anchor="middle">2.2. Kiểm tra tính hợp lệ</text>

      <rect x="5" y="108" width="130" height="24" rx="3" fill="#f0fdfa" stroke="#99f6e4"/>
      <text x="70" y="124" font-size="9.5" fill="#0f766e" text-anchor="middle">2.3. Số hóa hồ sơ gốc</text>

      <rect x="5" y="138" width="130" height="24" rx="3" fill="#f0fdfa" stroke="#99f6e4"/>
      <text x="70" y="154" font-size="9.5" fill="#0f766e" text-anchor="middle">2.4. Trả kết quả giấy/số</text>
    </g>

    <!-- F3 -->
    <line x1="400" y1="145" x2="400" y2="175" stroke="#64748b" stroke-width="1.8"/>
    <g transform="translate(330, 175)">
      <rect x="0" y="0" width="140" height="36" rx="4" fill="#16a34a"/>
      <text x="70" y="22" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">3. THỤ LÝ CHUYÊN MÔN</text>

      <rect x="5" y="48" width="130" height="24" rx="3" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="70" y="64" font-size="9.5" fill="#166534" text-anchor="middle">3.1. Phân công xử lý</text>

      <rect x="5" y="78" width="130" height="24" rx="3" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="70" y="94" font-size="9.5" fill="#166534" text-anchor="middle">3.2. Thẩm định điều kiện</text>

      <rect x="5" y="108" width="130" height="24" rx="3" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="70" y="124" font-size="9.5" fill="#166534" text-anchor="middle">3.3. Lấy ý kiến liên ngành</text>

      <rect x="5" y="138" width="130" height="24" rx="3" fill="#f0fdf4" stroke="#bbf7d0"/>
      <text x="70" y="154" font-size="9.5" fill="#166534" text-anchor="middle">3.4. Soạn thảo kết quả</text>
    </g>

    <!-- F4 -->
    <line x1="560" y1="145" x2="560" y2="175" stroke="#64748b" stroke-width="1.8"/>
    <g transform="translate(490, 175)">
      <rect x="0" y="0" width="140" height="36" rx="4" fill="#d97706"/>
      <text x="70" y="22" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">4. PHÊ DUYỆT & KÝ SỐ</text>

      <rect x="5" y="48" width="130" height="24" rx="3" fill="#fffbeb" stroke="#fde68a"/>
      <text x="70" y="64" font-size="9.5" fill="#92400e" text-anchor="middle">4.1. Thẩm tra dự thảo</text>

      <rect x="5" y="78" width="130" height="24" rx="3" fill="#fffbeb" stroke="#fde68a"/>
      <text x="70" y="94" font-size="9.5" fill="#92400e" text-anchor="middle">4.2. Ký số cá nhân lãnh đạo</text>

      <rect x="5" y="108" width="130" height="24" rx="3" fill="#fffbeb" stroke="#fde68a"/>
      <text x="70" y="124" font-size="9.5" fill="#92400e" text-anchor="middle">4.3. Đóng dấu số cơ quan</text>

      <rect x="5" y="138" width="130" height="24" rx="3" fill="#fffbeb" stroke="#fde68a"/>
      <text x="70" y="154" font-size="9.5" fill="#92400e" text-anchor="middle">4.4. Phát hành kết quả số</text>
    </g>

    <!-- F5 -->
    <line x1="715" y1="145" x2="715" y2="175" stroke="#64748b" stroke-width="1.8"/>
    <g transform="translate(645, 175)">
      <rect x="0" y="0" width="140" height="36" rx="4" fill="#9333ea"/>
      <text x="70" y="22" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">5. NGHĨA VỤ TÀI CHÍNH</text>

      <rect x="5" y="48" width="130" height="24" rx="3" fill="#faf5ff" stroke="#e9d5ff"/>
      <text x="70" y="64" font-size="9.5" fill="#6b21a8" text-anchor="middle">5.1. Định danh thanh toán</text>

      <rect x="5" y="78" width="130" height="24" rx="3" fill="#faf5ff" stroke="#e9d5ff"/>
      <text x="70" y="94" font-size="9.5" fill="#6b21a8" text-anchor="middle">5.2. Thu phí trực tuyến</text>

      <rect x="5" y="108" width="130" height="24" rx="3" fill="#faf5ff" stroke="#e9d5ff"/>
      <text x="70" y="124" font-size="9.5" fill="#6b21a8" text-anchor="middle">5.3. Xuất biên lai điện tử</text>

      <rect x="5" y="138" width="130" height="24" rx="3" fill="#faf5ff" stroke="#e9d5ff"/>
      <text x="70" y="154" font-size="9.5" fill="#6b21a8" text-anchor="middle">5.4. Đối soát Kho bạc</text>
    </g>

    <!-- F6 -->
    <line x1="875" y1="145" x2="875" y2="175" stroke="#64748b" stroke-width="1.8"/>
    <g transform="translate(805, 175)">
      <rect x="0" y="0" width="140" height="36" rx="4" fill="#dc2626"/>
      <text x="70" y="22" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">6. QUẢN TRỊ & BÁO CÁO</text>

      <rect x="5" y="48" width="130" height="24" rx="3" fill="#fef2f2" stroke="#fecaca"/>
      <text x="70" y="64" font-size="9.5" fill="#991b1b" text-anchor="middle">6.1. Giám sát chỉ số 766</text>

      <rect x="5" y="78" width="130" height="24" rx="3" fill="#fef2f2" stroke="#fecaca"/>
      <text x="70" y="94" font-size="9.5" fill="#991b1b" text-anchor="middle">6.2. Phân quyền người dùng</text>

      <rect x="5" y="108" width="130" height="24" rx="3" fill="#fef2f2" stroke="#fecaca"/>
      <text x="70" y="124" font-size="9.5" fill="#991b1b" text-anchor="middle">6.3. Cấu hình quy trình TTHC</text>

      <rect x="5" y="138" width="130" height="24" rx="3" fill="#fef2f2" stroke="#fecaca"/>
      <text x="70" y="154" font-size="9.5" fill="#991b1b" text-anchor="middle">6.4. Nhật ký kiểm toán</text>
    </g>

    <!-- Cross-Cutting Governance Layer -->
    <rect x="30" y="380" width="900" height="195" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.2"/>
    <text x="480" y="405" font-size="12.5" font-weight="bold" fill="#1e293b" text-anchor="middle">MA TRẬN ĐIỀU PHỐI VÀ TÍCH HỢP LIÊN THÔNG DỮ LIỆU ĐA CẤP ĐA NGÀNH</text>

    <g transform="translate(50, 420)">
      <rect x="0" y="0" width="260" height="135" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="130" y="24" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Liên thông dọc (Trung ương - Tỉnh)</text>
      <text x="15" y="50" font-size="10" fill="#334155">• Đồng bộ trạng thái về Cổng DVCQG</text>
      <text x="15" y="72" font-size="10" fill="#334155">• Tra cứu CSDL Dân cư (Đề án 06)</text>
      <text x="15" y="94" font-size="10" fill="#334155">• CSDL Doanh nghiệp, Hộ tịch điện tử</text>
      <text x="15" y="116" font-size="10" fill="#334155">• Thanh toán tập trung Cổng DVCQG</text>

      <rect x="295" y="0" width="260" height="135" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="130" y="24" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Liên thông ngang (Sở - Ban - Ngành)</text>
      <text x="15" y="50" font-size="10" fill="#334155">• Trục kết nối chia sẻ dữ liệu LGSP</text>
      <text x="15" y="72" font-size="10" fill="#334155">• Lấy ý kiến thẩm định chuyên môn liên Sở</text>
      <text x="15" y="94" font-size="10" fill="#334155">• Chia sẻ kết quả cấp phép số hóa</text>
      <text x="15" y="116" font-size="10" fill="#334155">• Tái sử dụng dữ liệu kho hồ sơ</text>

      <rect x="590" y="0" width="270" height="135" rx="5" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="135" y="24" font-size="11.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Liên thông 3 cấp (Tỉnh - Huyện - Xã)</text>
      <text x="15" y="50" font-size="10" fill="#334155">• Một nền tảng phần mềm dùng chung</text>
      <text x="15" y="72" font-size="10" fill="#334155">• Chuyển hồ sơ liên cấp trực tuyến 100%</text>
      <text x="15" y="94" font-size="10" fill="#334155">• Không chuyển hồ sơ giấy qua bưu cục</text>
      <text x="15" y="116" font-size="10" fill="#334155">• Giám sát tập trung từ UBND tỉnh</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_2_3_fdd_phan_ra_chuc_nang.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 5: SƠ ĐỒ LUỒNG DỮ LIỆU NGỮ CẢNH (DFD MỨC 0)
// =============================================================================
function generateDiagram5() {
  const w = 960, h = 560;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">SƠ ĐỒ LUỒNG DỮ LIỆU NGỮ CẢNH (DFD MỨC 0) HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC</text>

    <!-- Center System Circle -->
    <g transform="translate(480, 290)">
      <circle cx="0" cy="0" r="95" fill="#eff6ff" stroke="#1d4ed8" stroke-width="2.5" filter="url(#shadow)"/>
      <text x="0" y="-35" font-size="11.5" font-weight="bold" fill="#1e40af" text-anchor="middle">HỆ THỐNG THÔNG TIN</text>
      <text x="0" y="-15" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">GIẢI QUYẾT THỦ TỤC</text>
      <text x="0" y="5" font-size="12" font-weight="bold" fill="#1e40af" text-anchor="middle">HÀNH CHÍNH CẤP TỈNH</text>
      <text x="0" y="30" font-size="10.5" fill="#475569" text-anchor="middle">(Cổng DVC &amp; Một cửa)</text>
      <text x="0" y="50" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">Tiến trình 0.0</text>
    </g>

    <!-- Entity 1: Công dân / Doanh nghiệp (Top Left) -->
    <g transform="translate(40, 90)">
      <rect x="0" y="0" width="180" height="85" rx="5" fill="#ffffff" stroke="#0284c7" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="180" height="24" rx="5" fill="#0284c7"/>
      <text x="90" y="17" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">CÔNG DÂN / DOANH NGHIỆP</text>
      <text x="10" y="42" font-size="9.5" fill="#334155">• Nộp hồ sơ số / Kê khai</text>
      <text x="10" y="58" font-size="9.5" fill="#334155">• Thanh toán phí trực tuyến</text>
      <text x="10" y="74" font-size="9.5" fill="#334155">• Nhận kết quả &amp; Biên lai</text>
    </g>
    <!-- Flows with Entity 1 -->
    <line x1="220" y1="130" x2="395" y2="240" stroke="#0284c7" stroke-width="1.6" marker-end="url(#arrow)"/>
    <text x="290" y="170" font-size="9.5" fill="#0284c7" font-weight="500">Hồ sơ, Lệnh thanh toán</text>

    <line x1="410" y1="260" x2="220" y2="155" stroke="#0284c7" stroke-width="1.6" stroke-dasharray="4,3" marker-end="url(#arrow)"/>
    <text x="270" y="225" font-size="9.5" fill="#0284c7" font-weight="500">Giấy hẹn, Kết quả số, Biên lai</text>

    <!-- Entity 2: Cán bộ / Lãnh đạo cơ quan (Bottom Left) -->
    <g transform="translate(40, 400)">
      <rect x="0" y="0" width="180" height="85" rx="5" fill="#ffffff" stroke="#16a34a" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="180" height="24" rx="5" fill="#16a34a"/>
      <text x="90" y="17" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">CÁN BỘ, CÔNG CHỨC</text>
      <text x="10" y="42" font-size="9.5" fill="#334155">• Tiếp nhận &amp; Số hóa tại chỗ</text>
      <text x="10" y="58" font-size="9.5" fill="#334155">• Thẩm định nội dung nghiệp vụ</text>
      <text x="10" y="74" font-size="9.5" fill="#334155">• Ký số kết quả giải quyết</text>
    </g>
    <!-- Flows with Entity 2 -->
    <line x1="220" y1="420" x2="400" y2="330" stroke="#16a34a" stroke-width="1.6" marker-end="url(#arrow)"/>
    <text x="290" y="390" font-size="9.5" fill="#16a34a" font-weight="500">Ý kiến thẩm định, Ký số</text>

    <line x1="400" y1="350" x2="220" y2="445" stroke="#16a34a" stroke-width="1.6" stroke-dasharray="4,3" marker-end="url(#arrow)"/>
    <text x="280" y="425" font-size="9.5" fill="#16a34a" font-weight="500">Danh sách phân công, Hồ sơ số</text>

    <!-- Entity 3: Cổng DVC Quốc gia & CSDL Dân cư (Top Right) -->
    <g transform="translate(740, 90)">
      <rect x="0" y="0" width="180" height="85" rx="5" fill="#ffffff" stroke="#d97706" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="180" height="24" rx="5" fill="#d97706"/>
      <text x="90" y="17" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">CỔNG DVCQG &amp; ĐỀ ÁN 06</text>
      <text x="10" y="42" font-size="9.5" fill="#334155">• Định danh điện tử VNeID</text>
      <text x="10" y="58" font-size="9.5" fill="#334155">• Dữ liệu nhân thân xác thực</text>
      <text x="10" y="74" font-size="9.5" fill="#334155">• Đồng bộ trạng thái chỉ số 766</text>
    </g>
    <!-- Flows with Entity 3 -->
    <line x1="740" y1="140" x2="565" y2="240" stroke="#d97706" stroke-width="1.6" marker-end="url(#arrow)"/>
    <text x="610" y="175" font-size="9.5" fill="#d97706" font-weight="500">Gói tin xác thực VNeID</text>

    <line x1="550" y1="220" x2="740" y2="120" stroke="#d97706" stroke-width="1.6" stroke-dasharray="4,3" marker-end="url(#arrow)"/>
    <text x="610" y="225" font-size="9.5" fill="#d97706" font-weight="500">Đồng bộ hồ sơ, Chỉ số 766</text>

    <!-- Entity 4: Kho bạc & Biên lai điện tử (Bottom Right) -->
    <g transform="translate(740, 400)">
      <rect x="0" y="0" width="180" height="85" rx="5" fill="#ffffff" stroke="#9333ea" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="180" height="24" rx="5" fill="#9333ea"/>
      <text x="90" y="17" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">KHO BẠC &amp; BIÊN LAI ĐIỆN TỬ</text>
      <text x="10" y="42" font-size="9.5" fill="#334155">• Xác nhận trừ tiền thành công</text>
      <text x="10" y="58" font-size="9.5" fill="#334155">• Biên lai ký số điện tử</text>
      <text x="10" y="74" font-size="9.5" fill="#334155">• Sao kê đối soát ngân sách</text>
    </g>
    <!-- Flows with Entity 4 -->
    <line x1="565" y1="330" x2="740" y2="420" stroke="#9333ea" stroke-width="1.6" marker-end="url(#arrow)"/>
    <text x="620" y="385" font-size="9.5" fill="#9333ea" font-weight="500">Lệnh xuất biên lai, Quyết toán</text>

    <line x1="740" y1="440" x2="560" y2="350" stroke="#9333ea" stroke-width="1.6" stroke-dasharray="4,3" marker-end="url(#arrow)"/>
    <text x="620" y="425" font-size="9.5" fill="#9333ea" font-weight="500">Biên lai ký số, Đối soát</text>
  </svg>`;
  renderSvgToPng('hinh_2_4_dfd_ngu_canh_muc_0.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 6: DFD MỨC 1 - TIẾP NHẬN, SỐ HÓA VÀ PHÂN CÔNG HỒ SƠ
// =============================================================================
function generateDiagram6() {
  const w = 960, h = 540;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">SƠ ĐỒ LUỒNG DỮ LIỆU PHÂN RÃ MỨC 1: TIẾP NHẬN, SỐ HÓA VÀ PHÂN CÔNG HỒ SƠ</text>

    <!-- External Entity: Nguoi nop -->
    <g transform="translate(30, 100)">
      <rect x="0" y="0" width="140" height="70" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="0" y="0" width="140" height="20" rx="4" fill="#0284c7"/>
      <text x="70" y="14" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">NGƯỜI NỘP HỒ SƠ</text>
      <text x="10" y="38" font-size="9.5" fill="#334155">• Nộp trực tuyến</text>
      <text x="10" y="54" font-size="9.5" fill="#334155">• Hoặc nộp trực tiếp</text>
    </g>

    <!-- Process 1.1: Tiếp nhận và kiểm tra -->
    <g transform="translate(240, 95)">
      <circle cx="45" cy="45" r="45" fill="#eff6ff" stroke="#1d4ed8" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Tiếp nhận &amp;</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Kiểm tra hợp lệ</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">1.1</text>
    </g>

    <!-- Process 1.2: Số hóa và chứng thực số -->
    <g transform="translate(450, 95)">
      <circle cx="45" cy="45" r="45" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#15803d" text-anchor="middle">Số hóa &amp;</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#15803d" text-anchor="middle">Ký số bóc tách</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">1.2</text>
    </g>

    <!-- Process 1.3: Cấp mã & Sinh giấy tiếp nhận -->
    <g transform="translate(660, 95)">
      <circle cx="45" cy="45" r="45" fill="#fffbeb" stroke="#d97706" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#b45309" text-anchor="middle">Cấp mã hồ sơ &amp;</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#b45309" text-anchor="middle">Hẹn ngày trả</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">1.3</text>
    </g>

    <!-- Process 1.4: Phân công chuyên môn -->
    <g transform="translate(660, 270)">
      <circle cx="45" cy="45" r="45" fill="#faf5ff" stroke="#7e22ce" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">Điều phối &amp;</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">Phân công hồ sơ</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">1.4</text>
    </g>

    <!-- Arrows between processes -->
    <line x1="170" y1="140" x2="240" y2="140" stroke="#0284c7" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="205" y="132" font-size="9" fill="#0284c7" text-anchor="middle">Hồ sơ</text>

    <line x1="330" y1="140" x2="450" y2="140" stroke="#1d4ed8" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="390" y="132" font-size="9" fill="#1d4ed8" text-anchor="middle">Đủ điều kiện</text>

    <line x1="540" y1="140" x2="660" y2="140" stroke="#16a34a" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="600" y="132" font-size="9" fill="#16a34a" text-anchor="middle">Tệp số hóa</text>

    <line x1="705" y1="185" x2="705" y2="270" stroke="#d97706" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="735" y="225" font-size="9" fill="#d97706" text-anchor="middle">Hồ sơ số</text>

    <!-- Return to user -->
    <path d="M 705 95 L 705 65 L 100 65 L 100 100" fill="none" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow)"/>
    <text x="400" y="60" font-size="9.5" fill="#d97706" text-anchor="middle">Giấy tiếp nhận hồ sơ và hẹn trả kết quả điện tử</text>

    <!-- Data Stores (D1, D2, D3) -->
    <!-- D1: CSDL Hồ sơ -->
    <g transform="translate(240, 290)">
      <line x1="0" y1="0" x2="160" y2="0" stroke="#334155" stroke-width="2"/>
      <line x1="0" y1="35" x2="160" y2="35" stroke="#334155" stroke-width="2"/>
      <rect x="0" y="0" width="30" height="35" fill="#e2e8f0"/>
      <text x="15" y="22" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">D1</text>
      <text x="95" y="22" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">CSDL Hồ sơ TTHC</text>
    </g>

    <!-- D2: Kho số hóa -->
    <g transform="translate(430, 290)">
      <line x1="0" y1="0" x2="160" y2="0" stroke="#334155" stroke-width="2"/>
      <line x1="0" y1="35" x2="160" y2="35" stroke="#334155" stroke-width="2"/>
      <rect x="0" y="0" width="30" height="35" fill="#e2e8f0"/>
      <text x="15" y="22" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">D2</text>
      <text x="95" y="22" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Kho dữ liệu số hóa</text>
    </g>

    <!-- Lines to Data Stores -->
    <line x1="495" y1="185" x2="495" y2="290" stroke="#16a34a" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="535" y="240" font-size="9" fill="#16a34a">Lưu tệp số hóa</text>

    <line x1="660" y1="170" x2="380" y2="290" stroke="#d97706" stroke-width="1.5" marker-end="url(#arrow)"/>
    <text x="500" y="265" font-size="9" fill="#d97706">Tạo bản ghi hồ sơ</text>

    <!-- Receiver: Chuyên viên -->
    <g transform="translate(790, 275)">
      <rect x="0" y="0" width="140" height="70" rx="4" fill="#ffffff" stroke="#15803d" stroke-width="1.5"/>
      <rect x="0" y="0" width="140" height="20" rx="4" fill="#15803d"/>
      <text x="70" y="14" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">CHUYÊN VIÊN THỤ LÝ</text>
      <text x="10" y="38" font-size="9.5" fill="#334155">• Nhận việc trên bàn</text>
      <text x="10" y="54" font-size="9.5" fill="#334155">• Đồng hồ đếm ngược</text>
    </g>
    <line x1="750" y1="315" x2="790" y2="315" stroke="#7e22ce" stroke-width="1.8" marker-end="url(#arrow)"/>

    <!-- Bottom summary box -->
    <rect x="30" y="420" width="900" height="95" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2"/>
    <text x="480" y="445" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">NGUYÊN TẮC CỐT LÕI TRONG BƯỚC TIẾP NHẬN VÀ SỐ HÓA THEO NGHỊ ĐỊNH 107/2021/NĐ-CP</text>
    <text x="50" y="470" font-size="10" fill="#334155">1. Số hóa ngay khi tiếp nhận: Toàn bộ giấy tờ thành phần được chuyển đổi số, gắn mã vạch định danh và ký số xác thực.</text>
    <text x="50" y="490" font-size="10" fill="#334155">2. Nghiêm cấm yêu cầu nộp lại: Dữ liệu đã số hóa lưu vào kho để sử dụng lại vĩnh viễn, không bắt người dân xuất trình lại lần sau.</text>
    <text x="50" y="510" font-size="10" fill="#334155">3. Minh bạch tuyệt đối: Mã định danh hồ sơ công khai tra cứu 24/7 trên Cổng DVC Quốc gia và Hệ thống thông tin tỉnh.</text>
  </svg>`;
  renderSvgToPng('hinh_2_5_dfd_muc_1_tiep_nhan_xu_ly.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 7: DFD MỨC 1 - THẨM ĐỊNH, KÝ SỐ VÀ PHÁT HÀNH KẾT QUẢ
// =============================================================================
function generateDiagram7() {
  const w = 960, h = 540;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">SƠ ĐỒ LUỒNG DỮ LIỆU PHÂN RÃ MỨC 1: THẨM ĐỊNH, KÝ SỐ VÀ PHÁT HÀNH KẾT QUẢ</text>

    <!-- Chuyên viên thụ lý -->
    <g transform="translate(30, 95)">
      <rect x="0" y="0" width="150" height="75" rx="4" fill="#ffffff" stroke="#15803d" stroke-width="1.5"/>
      <rect x="0" y="0" width="150" height="22" rx="4" fill="#15803d"/>
      <text x="75" y="15" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">CHUYÊN VIÊN THỤ LÝ</text>
      <text x="10" y="42" font-size="9.5" fill="#334155">• Thẩm định hồ sơ</text>
      <text x="10" y="58" font-size="9.5" fill="#334155">• Soạn dự thảo kết quả</text>
    </g>

    <!-- Process 2.1: Thẩm định nghiệp vụ -->
    <g transform="translate(240, 90)">
      <circle cx="45" cy="45" r="45" fill="#eff6ff" stroke="#1d4ed8" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Thẩm định</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Nội dung TTHC</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">2.1</text>
    </g>

    <!-- Process 2.2: Lấy ý kiến phối hợp -->
    <g transform="translate(450, 90)">
      <circle cx="45" cy="45" r="45" fill="#fefce8" stroke="#ca8a04" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#a16207" text-anchor="middle">Phối hợp</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#a16207" text-anchor="middle">Liên Sở / Ngành</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">2.2</text>
    </g>

    <!-- Process 2.3: Trình ký và ký số lãnh đạo -->
    <g transform="translate(660, 90)">
      <circle cx="45" cy="45" r="45" fill="#fdf2f8" stroke="#db2777" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#be185d" text-anchor="middle">Lãnh đạo ký số</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#be185d" text-anchor="middle">&amp; Đóng dấu số</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">2.3</text>
    </g>

    <!-- Process 2.4: Trả kết quả và lưu trữ số -->
    <g transform="translate(660, 270)">
      <circle cx="45" cy="45" r="45" fill="#faf5ff" stroke="#7e22ce" stroke-width="1.8"/>
      <text x="45" y="38" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">Phát hành số &amp;</text>
      <text x="45" y="52" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">Lưu kho điện tử</text>
      <text x="45" y="68" font-size="9" fill="#dc2626" font-weight="bold" text-anchor="middle">2.4</text>
    </g>

    <!-- Arrows -->
    <line x1="180" y1="135" x2="240" y2="135" stroke="#15803d" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="210" y="125" font-size="9" fill="#15803d" text-anchor="middle">Dự thảo</text>

    <line x1="330" y1="135" x2="450" y2="135" stroke="#1d4ed8" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="390" y="125" font-size="9" fill="#1d4ed8" text-anchor="middle">Hồ sơ thẩm định</text>

    <line x1="540" y1="135" x2="660" y2="135" stroke="#ca8a04" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="600" y="125" font-size="9" fill="#ca8a04" text-anchor="middle">Ý kiến đồng thuận</text>

    <line x1="705" y1="180" x2="705" y2="270" stroke="#db2777" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="740" y="225" font-size="9" fill="#db2777" text-anchor="middle">Kết quả ký số</text>

    <!-- External Agencies -->
    <g transform="translate(420, 260)">
      <rect x="0" y="0" width="150" height="60" rx="4" fill="#ffffff" stroke="#64748b" stroke-width="1.2"/>
      <text x="75" y="22" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">CÁC SỞ, NGÀNH LIÊN QUAN</text>
      <text x="75" y="42" font-size="9" fill="#475569" text-anchor="middle">Phối hợp thẩm tra hồ sơ</text>
    </g>
    <line x1="495" y1="180" x2="495" y2="260" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arrow)"/>

    <!-- Data Store D2 & D4 -->
    <g transform="translate(240, 275)">
      <line x1="0" y1="0" x2="150" y2="0" stroke="#334155" stroke-width="2"/>
      <line x1="0" y1="35" x2="150" y2="35" stroke="#334155" stroke-width="2"/>
      <rect x="0" y="0" width="30" height="35" fill="#e2e8f0"/>
      <text x="15" y="22" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">D4</text>
      <text x="90" y="22" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">Kết quả TTHC điện tử</text>
    </g>
    <line x1="660" y1="300" x2="390" y2="300" stroke="#7e22ce" stroke-width="1.8" marker-end="url(#arrow)"/>
    <text x="525" y="292" font-size="9" fill="#7e22ce" text-anchor="middle">Lưu kết quả có chữ ký số</text>

    <!-- Out to citizen -->
    <g transform="translate(790, 270)">
      <rect x="0" y="0" width="140" height="70" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
      <rect x="0" y="0" width="140" height="20" rx="4" fill="#0284c7"/>
      <text x="70" y="14" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">CÔNG DÂN / DOANH NGHIỆP</text>
      <text x="10" y="38" font-size="9.5" fill="#334155">• Nhận kết quả điện tử</text>
      <text x="10" y="54" font-size="9.5" fill="#334155">• Tải từ Kho dữ liệu cá nhân</text>
    </g>
    <line x1="750" y1="315" x2="790" y2="315" stroke="#7e22ce" stroke-width="1.8" marker-end="url(#arrow)"/>

    <!-- Bottom box: Chữ ký số công vụ -->
    <rect x="30" y="415" width="900" height="100" rx="6" fill="#fdf2f8" stroke="#be185d" stroke-width="1.2"/>
    <text x="480" y="440" font-size="12" font-weight="bold" fill="#be185d" text-anchor="middle">QUY CHUẨN KÝ SỐ VĂN BẢN KẾT QUẢ ĐIỆN TỬ THEO NGHỊ ĐỊNH 30/2020/NĐ-CP</text>
    <text x="50" y="465" font-size="10" fill="#334155">1. Ký số cá nhân lãnh đạo: Ký số chuyên dùng công vụ do Ban Cơ yếu Chính phủ cấp, hiển thị họ tên, chức vụ.</text>
    <text x="50" y="485" font-size="10" fill="#334155">2. Ký số cơ quan: Hình ảnh con dấu màu đỏ trùm lên 1/3 chữ ký số cá nhân về phía bên trái, chứa chứng thư số cơ quan.</text>
    <text x="50" y="505" font-size="10" fill="#334155">3. Giá trị pháp lý: Kết quả điện tử có giá trị tương đương bản giấy có đóng dấu đỏ gốc, dùng vĩnh viễn trên môi trường số.</text>
  </svg>`;
  renderSvgToPng('hinh_2_6_dfd_muc_1_thu_ly_phe_duyet.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 8: KIẾN TRÚC CÔNG NGHỆ 4 TẦNG
// =============================================================================
function generateDiagram8() {
  const w = 960, h = 600;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">KIẾN TRÚC CÔNG NGHỆ 4 TẦNG HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC CẤP TỈNH</text>

    <!-- Layer 1: Presentation Layer -->
    <rect x="40" y="75" width="880" height="95" rx="6" fill="#f8fafc" stroke="#3b82f6" stroke-width="1.8" filter="url(#shadow)"/>
    <rect x="50" y="83" width="220" height="24" rx="4" fill="#2563eb"/>
    <text x="160" y="99" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG 1: TRÌNH DIỄN &amp; TƯƠNG TÁC</text>

    <g transform="translate(60, 115)">
      <rect x="0" y="0" width="190" height="45" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="95" y="20" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">Cổng DVC Trực tuyến</text>
      <text x="95" y="35" font-size="9.5" fill="#64748b" text-anchor="middle">Giao diện tương tác người dân</text>

      <rect x="210" y="0" width="190" height="45" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="305" y="20" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">Một cửa điện tử</text>
      <text x="305" y="35" font-size="9.5" fill="#64748b" text-anchor="middle">Bàn làm việc cán bộ công chức</text>

      <rect x="420" y="0" width="200" height="45" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="520" y="20" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">Bảng điều hành số 766</text>
      <text x="520" y="35" font-size="9.5" fill="#64748b" text-anchor="middle">Màn hình giám sát tiến độ thực</text>

      <rect x="640" y="0" width="190" height="45" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="735" y="20" font-size="11" font-weight="bold" fill="#1e40af" text-anchor="middle">Ứng dụng di động Công dân</text>
      <text x="735" y="35" font-size="9.5" fill="#64748b" text-anchor="middle">Tra cứu, Thông báo đẩy, Đánh giá</text>
    </g>

    <!-- Arrow 1 -> 2 -->
    <line x1="480" y1="170" x2="480" y2="195" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Layer 2: Application Business Services -->
    <rect x="40" y="195" width="880" height="115" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8" filter="url(#shadow)"/>
    <rect x="50" y="203" width="230" height="24" rx="4" fill="#15803d"/>
    <text x="165" y="219" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG 2: DỊCH VỤ NGHIỆP VỤ HỆ THỐNG</text>

    <g transform="translate(60, 235)">
      <rect x="0" y="0" width="155" height="65" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="77" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Dịch vụ Tiếp nhận</text>
      <text x="77" y="36" font-size="9" fill="#334155">• Cấp mã hồ sơ tự động</text>
      <text x="77" y="52" font-size="9" fill="#334155">• Kiểm tra danh mục TTHC</text>

      <rect x="170" y="0" width="155" height="65" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="247" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Dịch vụ Số hóa</text>
      <text x="247" y="36" font-size="9" fill="#334155">• Bóc tách OCR dữ liệu</text>
      <text x="247" y="52" font-size="9" fill="#334155">• Đóng dấu số chứng thực</text>

      <rect x="340" y="0" width="165" height="65" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="422" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Điều phối quy trình động</text>
      <text x="422" y="36" font-size="9" fill="#334155">• Động cơ quy trình BPMN</text>
      <text x="422" y="52" font-size="9" fill="#334155">• Phân luồng hồ sơ liên Sở</text>

      <rect x="520" y="0" width="155" height="65" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="597" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Dịch vụ Ký số</text>
      <text x="597" y="36" font-size="9" fill="#334155">• Ký số Cloud HSM</text>
      <text x="597" y="52" font-size="9" fill="#334155">• Kiểm tra thời hạn CKS</text>

      <rect x="690" y="0" width="150" height="65" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="765" y="20" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Dịch vụ Tài chính</text>
      <text x="765" y="36" font-size="9" fill="#334155">• Mã định danh nộp phí</text>
      <text x="765" y="52" font-size="9" fill="#334155">• Biên lai điện tử tự động</text>
    </g>

    <!-- Arrow 2 -> 3 -->
    <line x1="480" y1="310" x2="480" y2="335" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Layer 3: Integration & Interoperability -->
    <rect x="40" y="335" width="880" height="105" rx="6" fill="#fffbeb" stroke="#d97706" stroke-width="1.8" filter="url(#shadow)"/>
    <rect x="50" y="343" width="240" height="24" rx="4" fill="#b45309"/>
    <text x="170" y="359" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG 3: TÍCH HỢP &amp; LIÊN THÔNG DỮ LIỆU</text>

    <g transform="translate(60, 375)">
      <rect x="0" y="0" width="265" height="55" rx="4" fill="#ffffff" stroke="#fde68a"/>
      <text x="132" y="20" font-size="10.5" font-weight="bold" fill="#92400e" text-anchor="middle">Nền tảng chia sẻ tỉnh (LGSP)</text>
      <text x="132" y="38" font-size="9.5" fill="#475569" text-anchor="middle">Quản lý API, Xác thực bảo mật đường truyền</text>

      <rect x="285" y="0" width="280" height="55" rx="4" fill="#ffffff" stroke="#fde68a"/>
      <text x="140" y="20" font-size="10.5" font-weight="bold" fill="#92400e" text-anchor="middle">Nền tảng tích hợp quốc gia (NDXP)</text>
      <text x="140" y="38" font-size="9.5" fill="#475569" text-anchor="middle">Liên thông Cổng DVCQG và các Bộ, ngành</text>

      <rect x="585" y="0" width="255" height="55" rx="4" fill="#ffffff" stroke="#fde68a"/>
      <text x="127" y="20" font-size="10.5" font-weight="bold" fill="#92400e" text-anchor="middle">Cổng thanh toán &amp; Kho bạc</text>
      <text x="127" y="38" font-size="9.5" fill="#475569" text-anchor="middle">Kết nối Napas, Ngân hàng, Kho bạc tỉnh</text>
    </g>

    <!-- Arrow 3 -> 4 -->
    <line x1="480" y1="440" x2="480" y2="465" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Layer 4: Data & Storage Layer -->
    <rect x="40" y="465" width="880" height="110" rx="6" fill="#f8fafc" stroke="#475569" stroke-width="1.8" filter="url(#shadow)"/>
    <rect x="50" y="473" width="230" height="24" rx="4" fill="#334155"/>
    <text x="165" y="489" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">TẦNG 4: DỮ LIỆU &amp; LƯU TRỮ SỐ HÓA</text>

    <g transform="translate(60, 505)">
      <rect x="0" y="0" width="195" height="60" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="97" y="20" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">CSDL Nghiệp vụ quan hệ</text>
      <text x="97" y="38" font-size="9" fill="#64748b" text-anchor="middle">PostgreSQL / Oracle Cluster Cấp 3</text>

      <rect x="215" y="0" width="200" height="60" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="100" y="20" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Kho dữ liệu số hóa điện tử</text>
      <text x="100" y="38" font-size="9" fill="#64748b" text-anchor="middle">Lưu trữ đối tượng MinIO S3 an toàn</text>

      <rect x="435" y="0" width="195" height="60" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="97" y="20" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Kho chỉ mục tìm kiếm</text>
      <text x="97" y="38" font-size="9" fill="#64748b" text-anchor="middle">Tìm kiếm toàn văn tài liệu số</text>

      <rect x="650" y="0" width="190" height="60" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="95" y="20" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">Nhật ký kiểm toán an toàn</text>
      <text x="95" y="38" font-size="9" fill="#64748b" text-anchor="middle">Ghi vết không thể chỉnh sửa</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_3_1_kien_truc_cong_nghe_he_thong.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 9: SƠ ĐỒ THỰC THỂ QUAN HỆ CƠ SỞ DỮ LIỆU (ERD)
// =============================================================================
function generateDiagram9() {
  const w = 960, h = 640;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">SƠ ĐỒ QUAN HỆ THỰC THỂ CƠ SỞ DỮ LIỆU (ERD) HỆ THỐNG GIẢI QUYẾT TTHC</text>

    <!-- Entity 1: THU_TUC_HANH_CHINH (Top Left) -->
    <g transform="translate(40, 70)">
      <rect x="0" y="0" width="240" height="155" rx="5" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="240" height="26" rx="5" fill="#1e3a8a"/>
      <text x="120" y="18" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">THU_TUC_HANH_CHINH</text>
      
      <text x="12" y="44" font-size="10" font-weight="bold" fill="#b91c1c">PK  ma_thu_tuc: VARCHAR(50)</text>
      <text x="12" y="62" font-size="9.5" fill="#1e293b">ten_thu_tuc: NVARCHAR(255)</text>
      <text x="12" y="80" font-size="9.5" fill="#1e293b">ma_co_quan: VARCHAR(20)</text>
      <text x="12" y="98" font-size="9.5" fill="#1e293b">cap_thuc_hien: INT (Tỉnh/Huyện/Xã)</text>
      <text x="12" y="116" font-size="9.5" fill="#1e293b">thoi_han_giai_quyet: INT (Giờ)</text>
      <text x="12" y="134" font-size="9.5" fill="#1e293b">muc_do_cung_cap: INT (Toàn trình/1 phần)</text>
      <text x="12" y="150" font-size="9.5" fill="#1e293b">le_phi_chuan: DECIMAL(12,2)</text>
    </g>

    <!-- Entity 2: HO_SO_TIEP_NHAN (Center) -->
    <g transform="translate(350, 70)">
      <rect x="0" y="0" width="260" height="235" rx="5" fill="#eff6ff" stroke="#2563eb" stroke-width="2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="260" height="26" rx="5" fill="#1d4ed8"/>
      <text x="130" y="18" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">HO_SO_TIEP_NHAN</text>
      
      <text x="12" y="44" font-size="10" font-weight="bold" fill="#b91c1c">PK  ma_ho_so: VARCHAR(30)</text>
      <text x="12" y="62" font-size="9.5" font-weight="bold" fill="#1e40af">FK  ma_thu_tuc: VARCHAR(50)</text>
      <text x="12" y="80" font-size="9.5" font-weight="bold" fill="#1e40af">FK  so_dinh_danh_cong_dan: VARCHAR(12)</text>
      <text x="12" y="98" font-size="9.5" fill="#1e293b">ho_ten_nguoi_nop: NVARCHAR(100)</text>
      <text x="12" y="116" font-size="9.5" fill="#1e293b">so_dien_thoai: VARCHAR(15)</text>
      <text x="12" y="134" font-size="9.5" fill="#1e293b">ngay_tiep_nhan: DATETIME</text>
      <text x="12" y="152" font-size="9.5" fill="#1e293b">ngay_hen_tra: DATETIME</text>
      <text x="12" y="170" font-size="9.5" fill="#1e293b">trang_thai_ho_so: INT (1-Tiếp nhận, 2-Chờ phí...)</text>
      <text x="12" y="188" font-size="9.5" fill="#1e293b">hinh_thuc_nop: INT (Trực tuyến/Trực tiếp)</text>
      <text x="12" y="206" font-size="9.5" fill="#1e293b">ma_co_quan_giai_quyet: VARCHAR(20)</text>
      <text x="12" y="224" font-size="9.5" fill="#1e293b">ngay_hoan_thanh: DATETIME</text>
    </g>

    <!-- Entity 3: THANH_PHAN_HO_SO_SO_HOA (Top Right) -->
    <g transform="translate(680, 70)">
      <rect x="0" y="0" width="240" height="175" rx="5" fill="#ffffff" stroke="#16a34a" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="240" height="26" rx="5" fill="#16a34a"/>
      <text x="120" y="18" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">THANH_PHAN_HO_SO</text>
      
      <text x="12" y="44" font-size="10" font-weight="bold" fill="#b91c1c">PK  ma_giay_to: BIGINT AUTO</text>
      <text x="12" y="62" font-size="9.5" font-weight="bold" fill="#1e40af">FK  ma_ho_so: VARCHAR(30)</text>
      <text x="12" y="80" font-size="9.5" fill="#1e293b">ten_giay_to: NVARCHAR(255)</text>
      <text x="12" y="98" font-size="9.5" fill="#1e293b">duong_dan_tep_pdf: VARCHAR(500)</text>
      <text x="12" y="116" font-size="9.5" fill="#1e293b">ma_bam_sha256: VARCHAR(64)</text>
      <text x="12" y="134" font-size="9.5" fill="#1e293b">da_ky_so_chung_thuc: BOOLEAN</text>
      <text x="12" y="152" font-size="9.5" fill="#1e293b">ma_kho_du_lieu_ca_nhan: VARCHAR(50)</text>
      <text x="12" y="168" font-size="9.5" fill="#1e293b">ngay_so_hoa: DATETIME</text>
    </g>

    <!-- Entity 4: QUA_TRINH_XU_LY (Bottom Left) -->
    <g transform="translate(40, 360)">
      <rect x="0" y="0" width="240" height="185" rx="5" fill="#ffffff" stroke="#7e22ce" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="240" height="26" rx="5" fill="#6b21a8"/>
      <text x="120" y="18" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">QUA_TRINH_XU_LY</text>
      
      <text x="12" y="44" font-size="10" font-weight="bold" fill="#b91c1c">PK  ma_qua_trinh: BIGINT AUTO</text>
      <text x="12" y="62" font-size="9.5" font-weight="bold" fill="#1e40af">FK  ma_ho_so: VARCHAR(30)</text>
      <text x="12" y="80" font-size="9.5" font-weight="bold" fill="#1e40af">FK  ma_can_bo: VARCHAR(20)</text>
      <text x="12" y="98" font-size="9.5" fill="#1e293b">buoc_thuc_hien: NVARCHAR(100)</text>
      <text x="12" y="116" font-size="9.5" fill="#1e293b">noi_dung_y_kien: NVARCHAR(1000)</text>
      <text x="12" y="134" font-size="9.5" fill="#1e293b">thoi_gian_bat_dau: DATETIME</text>
      <text x="12" y="152" font-size="9.5" fill="#1e293b">thoi_gian_ket_thuc: DATETIME</text>
      <text x="12" y="170" font-size="9.5" fill="#1e293b">chu_ky_so_xac_thuc: TEXT</text>
    </g>

    <!-- Entity 5: GIAO_DICH_TAI_CHINH & BIEN_LAI (Bottom Center) -->
    <g transform="translate(350, 360)">
      <rect x="0" y="0" width="260" height="185" rx="5" fill="#ffffff" stroke="#d97706" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="260" height="26" rx="5" fill="#b45309"/>
      <text x="130" y="18" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">GIAO_DICH_TAI_CHINH</text>
      
      <text x="12" y="44" font-size="10" font-weight="bold" fill="#b91c1c">PK  ma_dinh_danh_thanh_toan: VARCHAR(35)</text>
      <text x="12" y="62" font-size="9.5" font-weight="bold" fill="#1e40af">FK  ma_ho_so: VARCHAR(30)</text>
      <text x="12" y="80" font-size="9.5" fill="#1e293b">so_tien_phi: DECIMAL(12,2)</text>
      <text x="12" y="98" font-size="9.5" fill="#1e293b">so_tien_le_phi: DECIMAL(12,2)</text>
      <text x="12" y="116" font-size="9.5" fill="#1e293b">kenh_thanh_toan: VARCHAR(50)</text>
      <text x="12" y="134" font-size="9.5" fill="#1e293b">trang_thai_nop: INT (Chờ/Thành công)</text>
      <text x="12" y="152" font-size="9.5" fill="#1e293b">so_bien_lai_dien_tu: VARCHAR(30)</text>
      <text x="12" y="170" font-size="9.5" fill="#1e293b">ma_co_quan_thue: VARCHAR(30)</text>
      <text x="12" y="182" font-size="9.5" fill="#1e293b">ngay_thanh_toan: DATETIME</text>
    </g>

    <!-- Entity 6: DANH_GIA_HAI_LONG (Bottom Right) -->
    <g transform="translate(680, 360)">
      <rect x="0" y="0" width="240" height="185" rx="5" fill="#ffffff" stroke="#db2777" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="240" height="26" rx="5" fill="#be185d"/>
      <text x="120" y="18" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">DANH_GIA_HAI_LONG_766</text>
      
      <text x="12" y="44" font-size="10" font-weight="bold" fill="#b91c1c">PK  ma_danh_gia: BIGINT AUTO</text>
      <text x="12" y="62" font-size="9.5" font-weight="bold" fill="#1e40af">FK  ma_ho_so: VARCHAR(30)</text>
      <text x="12" y="80" font-size="9.5" fill="#1e293b">diem_thai_do_can_bo: INT (1-5)</text>
      <text x="12" y="98" font-size="9.5" fill="#1e293b">diem_thoi_gian_giai_quyet: INT (1-5)</text>
      <text x="12" y="116" font-size="9.5" fill="#1e293b">diem_tinh_thuan_tien: INT (1-5)</text>
      <text x="12" y="134" font-size="9.5" fill="#1e293b">y_kien_dong_gop: NVARCHAR(500)</text>
      <text x="12" y="152" font-size="9.5" fill="#1e293b">kenh_danh_gia: INT (Kiosk/Cổng DVC/QR)</text>
      <text x="12" y="170" font-size="9.5" fill="#1e293b">thoi_gian_danh_gia: DATETIME</text>
    </g>

    <!-- Relationships -->
    <!-- THU_TUC 1 -- n HO_SO -->
    <line x1="280" y1="140" x2="350" y2="140" stroke="#1e293b" stroke-width="1.8"/>
    <text x="315" y="132" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">1 : N</text>

    <!-- HO_SO 1 -- n THANH_PHAN -->
    <line x1="610" y1="140" x2="680" y2="140" stroke="#1e293b" stroke-width="1.8"/>
    <text x="645" y="132" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">1 : N</text>

    <!-- HO_SO 1 -- n QUA_TRINH -->
    <line x1="420" y1="305" x2="200" y2="360" stroke="#1e293b" stroke-width="1.8"/>
    <text x="310" y="340" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">1 : N</text>

    <!-- HO_SO 1 -- 1 GIAO_DICH -->
    <line x1="480" y1="305" x2="480" y2="360" stroke="#1e293b" stroke-width="1.8"/>
    <text x="495" y="335" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">1 : 1</text>

    <!-- HO_SO 1 -- 1 DANH_GIA -->
    <line x1="550" y1="305" x2="740" y2="360" stroke="#1e293b" stroke-width="1.8"/>
    <text x="660" y="340" font-size="10" font-weight="bold" fill="#1e293b" text-anchor="middle">1 : 1</text>

    <!-- Footer Note -->
    <rect x="40" y="575" width="880" height="45" rx="5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>
    <text x="480" y="595" font-size="10.5" font-weight="bold" fill="#0f172a" text-anchor="middle">MÔ HÌNH DỮ LIỆU ĐẠT CHUẨN DẠNG CHUẨN 3 (3NF) - TÍCH HỢP KHÓA NGOẠI VÀ CHỈ MỤC TỐC ĐỘ CAO</text>
    <text x="480" y="610" font-size="9.5" fill="#64748b" text-anchor="middle">Bảo đảm tính toàn vẹn tham chiếu, tối ưu hóa truy vấn thời gian thực và đồng bộ hai chiều với Cổng Dịch vụ công Quốc gia</text>
  </svg>`;
  renderSvgToPng('hinh_3_2_mo_hinh_erd_quan_he_thuc_the.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 10: THIẾT KẾ MÔ PHỎNG GIAO DIỆN CỔNG DỊCH VỤ CÔNG TRỰC TUYẾN
// =============================================================================
function generateDiagram10() {
  const w = 960, h = 580;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#f1f5f9"/>
    
    <!-- Browser Chrome Frame -->
    <rect x="30" y="15" width="900" height="550" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
    <path d="M 30 15 L 930 15 A 8 8 0 0 1 930 45 L 30 45 Z" fill="#e2e8f0"/>
    <circle cx="50" cy="30" r="5" fill="#ef4444"/>
    <circle cx="68" cy="30" r="5" fill="#f59e0b"/>
    <circle cx="86" cy="30" r="5" fill="#10b981"/>
    <rect x="120" y="22" width="600" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/>
    <text x="135" y="35" font-size="9.5" fill="#475569">https://dichvucong.tinh.gov.vn/nop-ho-so/dang-ky-bien-dong-dat-dai</text>

    <!-- Top Navigation Header -->
    <rect x="30" y="45" width="900" height="50" fill="#1e3a8a"/>
    <text x="55" y="74" font-size="14" font-weight="bold" fill="#ffffff">CỔNG DỊCH VỤ CÔNG TỈNH</text>
    <text x="55" y="87" font-size="9" fill="#93c5fd">HỆ THỐNG THÔNG TIN GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH</text>
    
    <!-- Citizen Login Badge (VNeID Level 2) -->
    <rect x="710" y="55" width="200" height="30" rx="15" fill="#1e40af" stroke="#60a5fa" stroke-width="1"/>
    <circle cx="725" cy="70" r="8" fill="#22c55e"/>
    <text x="740" y="74" font-size="10" font-weight="bold" fill="#ffffff">LÊ VĂN AN (VNeID Mức 2)</text>

    <!-- Breadcrumb -->
    <rect x="30" y="95" width="900" height="28" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>
    <text x="55" y="113" font-size="10" fill="#64748b">Trang chủ &gt; Dịch vụ công trực tuyến toàn trình &gt; Đăng ký biến động quyền sử dụng đất &gt; Nộp hồ sơ</text>

    <!-- Form Content Left: Personal Info Auto-filled -->
    <g transform="translate(50, 135)">
      <rect x="0" y="0" width="410" height="360" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
      <rect x="0" y="0" width="410" height="32" rx="6" fill="#f0f9ff"/>
      <text x="15" y="21" font-size="11" font-weight="bold" fill="#0369a1">1. THÔNG TIN CHỦ HỒ SƠ (ĐÃ XÁC THỰC DÂN CƯ)</text>

      <text x="15" y="55" font-size="10" font-weight="bold" fill="#334155">Họ và tên người nộp (*):</text>
      <rect x="15" y="62" width="380" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
      <text x="25" y="79" font-size="10.5" fill="#0f172a">LÊ VĂN AN (Khóa cứng từ VNeID)</text>

      <text x="15" y="105" font-size="10" font-weight="bold" fill="#334155">Số định danh cá nhân / CCCD (*):</text>
      <rect x="15" y="112" width="380" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
      <text x="25" y="129" font-size="10.5" fill="#0f172a">001095012345 (Trung tâm DLQG về Dân cư xác thực)</text>

      <text x="15" y="155" font-size="10" font-weight="bold" fill="#334155">Ngày tháng năm sinh:</text>
      <rect x="15" y="162" width="180" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
      <text x="25" y="179" font-size="10.5" fill="#0f172a">15/08/1985</text>

      <text x="215" y="155" font-size="10" font-weight="bold" fill="#334155">Số điện thoại liên hệ (*):</text>
      <rect x="215" y="162" width="180" height="26" rx="4" fill="#ffffff" stroke="#94a3b8"/>
      <text x="225" y="179" font-size="10.5" fill="#0f172a">0912.345.678</text>

      <text x="15" y="205" font-size="10" font-weight="bold" fill="#334155">Địa chỉ thường trú:</text>
      <rect x="15" y="212" width="380" height="26" rx="4" fill="#f1f5f9" stroke="#cbd5e1"/>
      <text x="25" y="229" font-size="10.5" fill="#0f172a">Số 18, Phố Trần Phú, Phường Điện Biên, Quận Ba Đình</text>

      <text x="15" y="255" font-size="10" font-weight="bold" fill="#334155">Cơ quan tiếp nhận giải quyết (*):</text>
      <rect x="15" y="262" width="380" height="26" rx="4" fill="#ffffff" stroke="#94a3b8"/>
      <text x="25" y="279" font-size="10.5" fill="#0f172a">Văn phòng Đăng ký đất đai tỉnh - Chi nhánh Thành phố</text>

      <rect x="15" y="305" width="380" height="40" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="0.8"/>
      <text x="25" y="322" font-size="9" font-weight="bold" fill="#047857">✓ Dữ liệu nhân thân đã được làm sạch và xác thực</text>
      <text x="25" y="336" font-size="8.5" fill="#065f46">Người dân không phải xuất trình lại Căn cước công dân bản giấy.</text>
    </g>

    <!-- Form Content Right: Attachments & E-wallet -->
    <g transform="translate(480, 135)">
      <rect x="0" y="0" width="430" height="360" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
      <rect x="0" y="0" width="430" height="32" rx="6" fill="#f0fdf4"/>
      <text x="15" y="21" font-size="11" font-weight="bold" fill="#15803d">2. THÀNH PHẦN HỒ SƠ &amp; TÁI SỬ DỤNG KHO DỮ LIỆU</text>

      <!-- Document Item 1 -->
      <g transform="translate(15, 45)">
        <rect x="0" y="0" width="400" height="60" rx="4" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="10" y="18" font-size="10" font-weight="bold" fill="#0f172a">1. Đơn đăng ký biến động đất đai (Mẫu số 09/ĐK):</text>
        <rect x="10" y="26" width="130" height="24" rx="3" fill="#2563eb"/>
        <text x="75" y="42" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Kê khai trực tuyến</text>
        <text x="155" y="42" font-size="9" fill="#16a34a">✓ Đã hoàn tất kê khai</text>
      </g>

      <!-- Document Item 2 -->
      <g transform="translate(15, 115)">
        <rect x="0" y="0" width="400" height="65" rx="4" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="10" y="18" font-size="10" font-weight="bold" fill="#0f172a">2. Hợp đồng chuyển nhượng quyền sử dụng đất:</text>
        <rect x="10" y="28" width="150" height="24" rx="3" fill="#059669"/>
        <text x="85" y="44" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Trích xuất từ Kho cá nhân</text>
        <text x="175" y="44" font-size="8.5" fill="#475569">HopDong_CongChung_2026.pdf</text>
      </g>

      <!-- Document Item 3 -->
      <g transform="translate(15, 190)">
        <rect x="0" y="0" width="400" height="65" rx="4" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="10" y="18" font-size="10" font-weight="bold" fill="#0f172a">3. Giấy chứng nhận quyền sử dụng đất (Bản gốc số hóa):</text>
        <rect x="10" y="28" width="100" height="24" rx="3" fill="#475569"/>
        <text x="60" y="44" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Tải tệp PDF/A</text>
        <text x="125" y="44" font-size="8.5" fill="#16a34a">✓ Đã quét &amp; Ký số cá nhân</text>
      </g>

      <!-- Bottom Action Buttons -->
      <g transform="translate(15, 280)">
        <rect x="0" y="0" width="180" height="38" rx="5" fill="#f1f5f9" stroke="#94a3b8"/>
        <text x="90" y="24" font-size="11" font-weight="bold" fill="#475569" text-anchor="middle">Lưu bản nháp</text>

        <rect x="200" y="0" width="200" height="38" rx="5" fill="#dc2626"/>
        <text x="300" y="24" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">NỘP HỒ SƠ CHÍNH THỨC</text>
      </g>
    </g>

    <!-- Bottom Footer Status -->
    <rect x="50" y="510" width="860" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="480" y="534" font-size="9.5" fill="#64748b" text-anchor="middle">Hệ thống tuân thủ tiêu chuẩn an toàn an ninh mạng cấp độ 3 và bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP</text>
  </svg>`;
  renderSvgToPng('hinh_3_3_giao_dien_cong_dich_vu_cong.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 11: THIẾT KẾ MÔ PHỎNG BÀN LÀM VIỆC MỘT CỬA ĐIỆN TỬ
// =============================================================================
function generateDiagram11() {
  const w = 960, h = 580;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#f1f5f9"/>
    
    <!-- Browser Frame -->
    <rect x="30" y="15" width="900" height="550" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" filter="url(#shadow)"/>
    <path d="M 30 15 L 930 15 A 8 8 0 0 1 930 45 L 30 45 Z" fill="#e2e8f0"/>
    <circle cx="50" cy="30" r="5" fill="#ef4444"/>
    <circle cx="68" cy="30" r="5" fill="#f59e0b"/>
    <circle cx="86" cy="30" r="5" fill="#10b981"/>
    <rect x="120" y="22" width="600" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8"/>
    <text x="135" y="35" font-size="9.5" fill="#475569">https://motcua.tinh.gov.vn/ban-lam-viec/chuyen-vien-thu-ly</text>

    <!-- Top Admin Header -->
    <rect x="30" y="45" width="900" height="50" fill="#0f172a"/>
    <text x="55" y="74" font-size="13" font-weight="bold" fill="#ffffff">PHÂN HỆ MỘT CỬA ĐIỆN TỬ &amp; THỤ LÝ NGHIỆP VỤ</text>
    <text x="55" y="87" font-size="8.5" fill="#94a3b8">TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG TỈNH</text>
    
    <rect x="710" y="55" width="200" height="30" rx="4" fill="#1e293b"/>
    <text x="810" y="74" font-size="9.5" font-weight="bold" fill="#38bdf8" text-anchor="middle">Công chức: NGUYỄN VĂN HÙNG</text>

    <!-- Sidebar Left (Menu) -->
    <rect x="30" y="95" width="180" height="470" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <g transform="translate(40, 110)">
      <rect x="0" y="0" width="160" height="32" rx="4" fill="#0284c7"/>
      <text x="15" y="20" font-size="10.5" font-weight="bold" fill="#ffffff">Hồ sơ chờ thụ lý (12)</text>

      <rect x="0" y="40" width="160" height="30" rx="4" fill="#ffffff"/>
      <text x="15" y="59" font-size="10" fill="#475569">Hồ sơ đang xử lý (28)</text>

      <rect x="0" y="75" width="160" height="30" rx="4" fill="#ffffff"/>
      <text x="15" y="94" font-size="10" fill="#475569">Hồ sơ xin ý kiến (05)</text>

      <rect x="0" y="110" width="160" height="30" rx="4" fill="#ffffff"/>
      <text x="15" y="129" font-size="10" fill="#475569">Hồ sơ trình ký (07)</text>

      <rect x="0" y="145" width="160" height="30" rx="4" fill="#ffffff"/>
      <text x="15" y="164" font-size="10" fill="#475569">Hồ sơ đã hoàn thành (184)</text>

      <rect x="0" y="180" width="160" height="30" rx="4" fill="#ffffff"/>
      <text x="15" y="199" font-size="10" fill="#dc2626" font-weight="bold">Hồ sơ cảnh báo trễ (0)</text>

      <line x1="0" y1="230" x2="160" y2="230" stroke="#cbd5e1" stroke-width="1"/>
      <text x="15" y="255" font-size="9.5" font-weight="bold" fill="#0f172a">TIỆN ÍCH HỆ THỐNG</text>
      <text x="15" y="280" font-size="9.5" fill="#475569">• Quét hồ sơ (Scanner)</text>
      <text x="15" y="305" font-size="9.5" fill="#475569">• Ký số chứng thư công vụ</text>
      <text x="15" y="330" font-size="9.5" fill="#475569">• Tra cứu cơ sở dân cư</text>
      <text x="15" y="355" font-size="9.5" fill="#475569">• Xuất báo cáo thống kê</text>
    </g>

    <!-- Main Workspace Right -->
    <g transform="translate(225, 110)">
      <!-- Filter Bar -->
      <rect x="0" y="0" width="690" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="15" y="24" font-size="10" font-weight="bold" fill="#334155">Tìm kiếm hồ sơ:</text>
      <rect x="100" y="8" width="220" height="24" rx="3" fill="#f8fafc" stroke="#94a3b8"/>
      <text x="110" y="24" font-size="9.5" fill="#64748b">Nhập mã hồ sơ / Họ tên...</text>
      
      <rect x="340" y="8" width="140" height="24" rx="3" fill="#ffffff" stroke="#94a3b8"/>
      <text x="350" y="24" font-size="9" fill="#334155">Lĩnh vực: Đất đai</text>

      <rect x="580" y="8" width="95" height="24" rx="3" fill="#0284c7"/>
      <text x="627" y="24" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Tìm kiếm</text>

      <!-- Table Header -->
      <rect x="0" y="55" width="690" height="28" fill="#1e293b"/>
      <text x="15" y="73" font-size="9.5" font-weight="bold" fill="#ffffff">Mã số hồ sơ</text>
      <text x="155" y="73" font-size="9.5" font-weight="bold" fill="#ffffff">Chủ hồ sơ</text>
      <text x="290" y="73" font-size="9.5" font-weight="bold" fill="#ffffff">Tên thủ tục</text>
      <text x="460" y="73" font-size="9.5" font-weight="bold" fill="#ffffff">Hạn xử lý</text>
      <text x="560" y="73" font-size="9.5" font-weight="bold" fill="#ffffff">Trạng thái</text>
      <text x="645" y="73" font-size="9.5" font-weight="bold" fill="#ffffff">Thao tác</text>

      <!-- Row 1 -->
      <g transform="translate(0, 83)">
        <rect x="0" y="0" width="690" height="38" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>
        <text x="15" y="23" font-size="9" font-weight="bold" fill="#0284c7">000.00.01.H26-260930-0012</text>
        <text x="155" y="23" font-size="9" fill="#0f172a">Lê Văn An</text>
        <text x="290" y="16" font-size="8.5" fill="#334155">Đăng ký biến động quyền SD đất</text>
        <text x="290" y="30" font-size="8" fill="#64748b">Cấp GCN quyền sở hữu nhà</text>
        <text x="460" y="23" font-size="9" font-weight="bold" fill="#059669">Còn 42 giờ</text>
        <rect x="550" y="8" width="80" height="20" rx="10" fill="#dcfce7"/>
        <text x="590" y="22" font-size="8.5" font-weight="bold" fill="#15803d" text-anchor="middle">Đang thẩm định</text>
        <rect x="640" y="8" width="40" height="20" rx="3" fill="#2563eb"/>
        <text x="660" y="22" font-size="8.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Xử lý</text>
      </g>

      <!-- Row 2 -->
      <g transform="translate(0, 121)">
        <rect x="0" y="0" width="690" height="38" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.8"/>
        <text x="15" y="23" font-size="9" font-weight="bold" fill="#0284c7">000.00.01.H26-260930-0015</text>
        <text x="155" y="23" font-size="9" fill="#0f172a">Công ty CP Tân Phát</text>
        <text x="290" y="16" font-size="8.5" fill="#334155">Cấp giấy phép xây dựng công trình</text>
        <text x="290" y="30" font-size="8" fill="#64748b">Dự án công nghiệp nhẹ</text>
        <text x="460" y="23" font-size="9" font-weight="bold" fill="#d97706">Còn 18 giờ</text>
        <rect x="550" y="8" width="80" height="20" rx="10" fill="#fef3c7"/>
        <text x="590" y="22" font-size="8.5" font-weight="bold" fill="#b45309" text-anchor="middle">Chờ ý kiến Sở</text>
        <rect x="640" y="8" width="40" height="20" rx="3" fill="#2563eb"/>
        <text x="660" y="22" font-size="8.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Xử lý</text>
      </g>

      <!-- Row 3 -->
      <g transform="translate(0, 159)">
        <rect x="0" y="0" width="690" height="38" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.8"/>
        <text x="15" y="23" font-size="9" font-weight="bold" fill="#0284c7">000.00.01.H26-260930-0018</text>
        <text x="155" y="23" font-size="9" fill="#0f172a">Trần Thị Bích Ngọc</text>
        <text x="290" y="16" font-size="8.5" fill="#334155">Cấp bản sao trích lục hộ tịch</text>
        <text x="290" y="30" font-size="8" fill="#64748b">Dịch vụ công toàn trình</text>
        <text x="460" y="23" font-size="9" font-weight="bold" fill="#059669">Còn 04 giờ</text>
        <rect x="550" y="8" width="80" height="20" rx="10" fill="#fce7f3"/>
        <text x="590" y="22" font-size="8.5" font-weight="bold" fill="#be185d" text-anchor="middle">Chờ ký số</text>
        <rect x="640" y="8" width="40" height="20" rx="3" fill="#be185d"/>
        <text x="660" y="22" font-size="8.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Ký số</text>
      </g>

      <!-- Processing Detail Panel below table -->
      <g transform="translate(0, 210)">
        <rect x="0" y="0" width="690" height="235" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>
        <rect x="0" y="0" width="690" height="28" rx="6" fill="#e2e8f0"/>
        <text x="15" y="19" font-size="10.5" font-weight="bold" fill="#0f172a">CHI TIẾT THẨM ĐỊNH HỒ SƠ: 000.00.01.H26-260930-0012 (LÊ VĂN AN)</text>

        <!-- Sub Tabs -->
        <text x="20" y="52" font-size="9.5" font-weight="bold" fill="#2563eb">1. Tài liệu số hóa đính kèm (3 tệp)</text>
        <text x="220" y="52" font-size="9.5" fill="#64748b">2. Lịch sử luân chuyển (3 bước)</text>
        <text x="400" y="52" font-size="9.5" fill="#64748b">3. Thu phí/Lệ phí (Đã hoàn thành)</text>

        <!-- Audit list -->
        <g transform="translate(20, 65)">
          <rect x="0" y="0" width="650" height="110" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="15" y="25" font-size="9" fill="#334155">• 08:30 - Công dân nộp trực tuyến qua VNeID Mức 2 (Hệ thống xác thực hợp lệ)</text>
          <text x="15" y="50" font-size="9" fill="#334155">• 09:05 - Cán bộ Một cửa tiếp nhận, số hóa và cấp Giấy hẹn điện tử</text>
          <text x="15" y="75" font-size="9" fill="#334155">• 09:20 - Công dân thanh toán lệ phí 150.000 VNĐ qua Cổng DVCQG, xuất biên lai số 00412</text>
          <text x="15" y="100" font-size="9" fill="#16a34a" font-weight="bold">• 09:25 - Hồ sơ tự động kích hoạt chuyển Chuyên viên Nguyễn Văn Hùng thụ lý</text>
        </g>

        <!-- Actions -->
        <g transform="translate(20, 188)">
          <rect x="0" y="0" width="130" height="32" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
          <text x="65" y="20" font-size="9.5" fill="#334155" text-anchor="middle">Yêu cầu bổ sung</text>

          <rect x="145" y="0" width="140" height="32" rx="4" fill="#d97706"/>
          <text x="215" y="20" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">Xin ý kiến phối hợp</text>

          <rect x="490" y="0" width="160" height="32" rx="4" fill="#16a34a"/>
          <text x="570" y="20" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">DUYỆT &amp; TRÌNH KÝ SỐ</text>
        </g>
      </g>
    </g>
  </svg>`;
  renderSvgToPng('hinh_3_4_giao_dien_mot_cua_dien_tu.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 12: BẢNG ĐIỀU HÀNH GIÁM SÁT THEO BỘ CHỈ SỐ 766
// =============================================================================
function generateDiagram12() {
  const w = 960, h = 560;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#f8fafc"/>
    
    <!-- Top Header -->
    <rect x="30" y="15" width="900" height="50" rx="6" fill="#1e3a8a" filter="url(#shadow)"/>
    <text x="55" y="44" font-size="15" font-weight="bold" fill="#ffffff">TRUNG TÂM GIÁM SÁT ĐIỀU HÀNH THỦ TỤC HÀNH CHÍNH THEO BỘ CHỈ SỐ 766</text>
    <text x="880" y="44" font-size="10.5" fill="#93c5fd" text-anchor="end">Cập nhật thời gian thực: 26/09/2026 14:30:00</text>

    <!-- 5 Core Metric Cards (QĐ 766/QĐ-TTg) -->
    <!-- Metric 1: Công khai minh bạch -->
    <g transform="translate(30, 80)">
      <rect x="0" y="0" width="165" height="120" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="26" rx="6" fill="#0284c7"/>
      <text x="82" y="18" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">1. CÔNG KHAI MINH BẠCH</text>
      <text x="82" y="65" font-size="26" font-weight="bold" fill="#0284c7" text-anchor="middle">17.8/18</text>
      <text x="82" y="88" font-size="10" font-weight="bold" fill="#16a34a" text-anchor="middle">Đạt 98.8%</text>
      <text x="82" y="106" font-size="8.5" fill="#64748b" text-anchor="middle">100% TTHC công bố chuẩn</text>
    </g>

    <!-- Metric 2: Tiến độ giải quyết -->
    <g transform="translate(210, 80)">
      <rect x="0" y="0" width="165" height="120" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="26" rx="6" fill="#15803d"/>
      <text x="82" y="18" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">2. TIẾN ĐỘ GIẢI QUYẾT</text>
      <text x="82" y="65" font-size="26" font-weight="bold" fill="#15803d" text-anchor="middle">19.5/20</text>
      <text x="82" y="88" font-size="10" font-weight="bold" fill="#16a34a" text-anchor="middle">Đúng hạn 99.1%</text>
      <text x="82" y="106" font-size="8.5" fill="#64748b" text-anchor="middle">Hồ sơ quá hạn: 0.9%</text>
    </g>

    <!-- Metric 3: DVC Trực tuyến -->
    <g transform="translate(390, 80)">
      <rect x="0" y="0" width="175" height="120" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="175" height="26" rx="6" fill="#d97706"/>
      <text x="87" y="18" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">3. DỊCH VỤ CÔNG TRỰC TUYẾN</text>
      <text x="87" y="65" font-size="26" font-weight="bold" fill="#d97706" text-anchor="middle">11.6/12</text>
      <text x="87" y="88" font-size="10" font-weight="bold" fill="#16a34a" text-anchor="middle">Toàn trình 82.4%</text>
      <text x="87" y="106" font-size="8.5" fill="#64748b" text-anchor="middle">Thanh toán TT: 88.5%</text>
    </g>

    <!-- Metric 4: Số hóa hồ sơ -->
    <g transform="translate(580, 80)">
      <rect x="0" y="0" width="170" height="120" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="170" height="26" rx="6" fill="#7e22ce"/>
      <text x="85" y="18" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">4. MỨC ĐỘ SỐ HÓA HỒ SƠ</text>
      <text x="85" y="65" font-size="26" font-weight="bold" fill="#7e22ce" text-anchor="middle">21.2/22</text>
      <text x="85" y="88" font-size="10" font-weight="bold" fill="#16a34a" text-anchor="middle">Số hóa tại nguồn: 96.5%</text>
      <text x="85" y="106" font-size="8.5" fill="#64748b" text-anchor="middle">Tái sử dụng: 64.2%</text>
    </g>

    <!-- Metric 5: Mức độ hài lòng -->
    <g transform="translate(765, 80)">
      <rect x="0" y="0" width="165" height="120" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="165" height="26" rx="6" fill="#be185d"/>
      <text x="82" y="18" font-size="10.5" font-weight="bold" fill="#ffffff" text-anchor="middle">5. MỨC ĐỘ HÀI LÒNG</text>
      <text x="82" y="65" font-size="26" font-weight="bold" fill="#be185d" text-anchor="middle">17.6/18</text>
      <text x="82" y="88" font-size="10" font-weight="bold" fill="#16a34a" text-anchor="middle">Hài lòng 98.4%</text>
      <text x="82" y="106" font-size="8.5" fill="#64748b" text-anchor="middle">0 phản ánh tồn đọng</text>
    </g>

    <!-- Overall Score Box -->
    <rect x="30" y="215" width="900" height="50" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
    <text x="50" y="246" font-size="14" font-weight="bold" fill="#065f46">TỔNG ĐIỂM CHỈ SỐ PHỤC VỤ NGƯỜI DÂN, DOANH NGHIỆP CỦA TỈNH: 87.7 / 90 ĐIỂM (XẾP HẠNG: XUẤT SẮC)</text>

    <!-- Chart Panel Left: Tiến độ theo Sở, Ngành -->
    <g transform="translate(30, 280)">
      <rect x="0" y="0" width="440" height="260" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="440" height="30" rx="6" fill="#f1f5f9"/>
      <text x="15" y="20" font-size="11" font-weight="bold" fill="#0f172a">TỶ LỆ GIẢI QUYẾT ĐÚNG HẠN THEO CÁC ĐƠN VỊ DẪN ĐẦU</text>

      <!-- Bar 1: Sở Tư pháp -->
      <text x="15" y="60" font-size="10" font-weight="bold" fill="#334155">Sở Tư pháp</text>
      <rect x="150" y="48" width="220" height="16" rx="3" fill="#16a34a"/>
      <text x="380" y="61" font-size="10" font-weight="bold" fill="#166534">99.8%</text>

      <!-- Bar 2: Sở Kế hoạch và Đầu tư -->
      <text x="15" y="95" font-size="10" font-weight="bold" fill="#334155">Sở Kế hoạch &amp; Đầu tư</text>
      <rect x="150" y="83" width="215" height="16" rx="3" fill="#16a34a"/>
      <text x="380" y="96" font-size="10" font-weight="bold" fill="#166534">99.4%</text>

      <!-- Bar 3: Sở Giao thông Vận tải -->
      <text x="15" y="130" font-size="10" font-weight="bold" fill="#334155">Sở Giao thông Vận tải</text>
      <rect x="150" y="118" width="210" height="16" rx="3" fill="#16a34a"/>
      <text x="380" y="131" font-size="10" font-weight="bold" fill="#166534">98.9%</text>

      <!-- Bar 4: Sở Tài nguyên & Môi trường -->
      <text x="15" y="165" font-size="10" font-weight="bold" fill="#334155">Sở TN &amp; Môi trường</text>
      <rect x="150" y="153" width="202" height="16" rx="3" fill="#2563eb"/>
      <text x="380" y="166" font-size="10" font-weight="bold" fill="#1e40af">97.8%</text>

      <!-- Bar 5: UBND Cấp Huyện (Bình quân) -->
      <text x="15" y="200" font-size="10" font-weight="bold" fill="#334155">UBND Cấp Huyện (Trung bình)</text>
      <rect x="150" y="188" width="208" height="16" rx="3" fill="#2563eb"/>
      <text x="380" y="201" font-size="10" font-weight="bold" fill="#1e40af">98.5%</text>

      <text x="15" y="240" font-size="9" fill="#64748b">* Tự động đồng bộ số liệu sang Cổng Dịch vụ công Quốc gia vào 24h00 hằng ngày</text>
    </g>

    <!-- Chart Panel Right: Khảo sát sự hài lòng -->
    <g transform="translate(490, 280)">
      <rect x="0" y="0" width="440" height="260" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="440" height="30" rx="6" fill="#f1f5f9"/>
      <text x="15" y="20" font-size="11" font-weight="bold" fill="#0f172a">KẾT QUẢ ĐÁNH GIÁ SỰ HÀI LÒNG CỦA CÔNG DÂN THÁNG 09/2026</text>

      <g transform="translate(20, 50)">
        <circle cx="70" cy="70" r="55" fill="none" stroke="#e2e8f0" stroke-width="18"/>
        <circle cx="70" cy="70" r="55" fill="none" stroke="#10b981" stroke-width="18" stroke-dasharray="320, 360" stroke-dashoffset="0"/>
        <text x="70" y="76" font-size="18" font-weight="bold" fill="#047857" text-anchor="middle">98.4%</text>
        
        <g transform="translate(160, 15)">
          <rect x="0" y="5" width="12" height="12" fill="#10b981"/>
          <text x="22" y="16" font-size="10" fill="#334155">Rất hài lòng: 82.5% (14.280 lượt)</text>

          <rect x="0" y="32" width="12" height="12" fill="#3b82f6"/>
          <text x="22" y="43" font-size="10" fill="#334155">Hài lòng: 15.9% (2.750 lượt)</text>

          <rect x="0" y="59" width="12" height="12" fill="#f59e0b"/>
          <text x="22" y="70" font-size="10" fill="#334155">Bình thường: 1.2% (208 lượt)</text>

          <rect x="0" y="86" width="12" height="12" fill="#ef4444"/>
          <text x="22" y="97" font-size="10" fill="#334155">Không hài lòng: 0.4% (69 lượt)</text>
        </g>
      </g>

      <rect x="15" y="180" width="410" height="65" rx="4" fill="#f8fafc" stroke="#cbd5e1"/>
      <text x="25" y="200" font-size="9.5" font-weight="bold" fill="#0f172a">Xử lý kiến nghị của người dân:</text>
      <text x="25" y="218" font-size="9" fill="#334155">• Tiếp nhận qua Hệ thống phản ánh hiện trường: 69 phản ánh</text>
      <text x="25" y="234" font-size="9" fill="#16a34a" font-weight="bold">• 100% phản ánh đã được xác minh và trả lời công khai trong vòng 24 giờ</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_3_5_giao_dien_dashboard_chi_so_766.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 13: KIẾN TRÚC HẠ TẦNG VÀ AN TOÀN THÔNG TIN CẤP ĐỘ 3
// =============================================================================
function generateDiagram13() {
  const w = 960, h = 600;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">KIẾN TRÚC HẠ TẦNG TRUNG TÂM DỮ LIỆU VÀ AN TOÀN THÔNG TIN CẤP ĐỘ 3 (NĐ 85/2016)</text>

    <!-- Zone 1: Internet & WAN Chuyên dùng (Left) -->
    <g transform="translate(30, 75)">
      <rect x="0" y="0" width="160" height="490" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="160" height="28" rx="6" fill="#475569"/>
      <text x="80" y="19" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">KÊNH TRUY CẬP</text>

      <rect x="10" y="45" width="140" height="75" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="70" y="65" font-size="10.5" font-weight="bold" fill="#0284c7" text-anchor="middle">Internet Công cộng</text>
      <text x="70" y="82" font-size="9" fill="#475569" text-anchor="middle">Công dân, Doanh nghiệp</text>
      <text x="70" y="98" font-size="9" fill="#475569" text-anchor="middle">HTTPS / TLS 1.3</text>

      <rect x="10" y="140" width="140" height="85" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="70" y="160" font-size="10.5" font-weight="bold" fill="#16a34a" text-anchor="middle">Mạng Truyền số liệu</text>
      <text x="70" y="176" font-size="10" font-weight="bold" fill="#16a34a" text-anchor="middle">Chuyên dùng Cấp 2</text>
      <text x="70" y="195" font-size="9" fill="#475569" text-anchor="middle">Bộ, Ngành, UBND Tỉnh,</text>
      <text x="70" y="211" font-size="9" fill="#475569" text-anchor="middle">Huyện, Xã liên thông</text>

      <rect x="10" y="250" width="140" height="75" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="70" y="270" font-size="10.5" font-weight="bold" fill="#d97706" text-anchor="middle">Kênh Cổng DVCQG</text>
      <text x="70" y="288" font-size="9" fill="#475569" text-anchor="middle">Trục NDXP / VPN IPsec</text>
      <text x="70" y="305" font-size="9" fill="#475569" text-anchor="middle">Kênh riêng bảo mật</text>

      <rect x="10" y="345" width="140" height="125" rx="4" fill="#fef2f2" stroke="#ef4444"/>
      <text x="70" y="368" font-size="10" font-weight="bold" fill="#b91c1c" text-anchor="middle">BẢO VỆ BIÊN GIỚI</text>
      <text x="15" y="390" font-size="8.5" fill="#334155">• Chống tấn công DDoS</text>
      <text x="15" y="410" font-size="8.5" fill="#334155">• Cân bằng tải ngoài</text>
      <text x="15" y="430" font-size="8.5" fill="#334155">• Tường lửa ứng dụng WAF</text>
      <text x="15" y="450" font-size="8.5" fill="#334155">• Giám sát lưu lượng SOC</text>
    </g>

    <!-- Arrow 1 -> Firewall -->
    <line x1="190" y1="200" x2="225" y2="200" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Firewall Outer -->
    <g transform="translate(225, 120)">
      <rect x="0" y="0" width="30" height="380" rx="4" fill="#dc2626"/>
      <text x="15" y="200" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 15 200)">TƯỜNG LỬA THẾ HỆ MỚI (NGFW)</text>
    </g>

    <!-- Zone 2: DMZ Zone (Public facing services) -->
    <g transform="translate(275, 75)">
      <rect x="0" y="0" width="190" height="490" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="190" height="28" rx="6" fill="#1d4ed8"/>
      <text x="95" y="19" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">VÙNG BÁN CÔNG KHAI (DMZ)</text>

      <rect x="15" y="45" width="160" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="95" y="68" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Cụm Web Cổng DVC</text>
      <text x="95" y="86" font-size="9" fill="#475569" text-anchor="middle">Nginx Reverse Proxy</text>
      <text x="95" y="102" font-size="9" fill="#475569" text-anchor="middle">Cân bằng tải HAProxy</text>
      <text x="95" y="118" font-size="9" fill="#16a34a" text-anchor="middle">✓ Mô hình Active-Active</text>

      <rect x="15" y="150" width="160" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="95" y="173" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Cổng Giao tiếp LGSP</text>
      <text x="95" y="191" font-size="9" fill="#475569" text-anchor="middle">API Gateway bảo mật</text>
      <text x="95" y="207" font-size="9" fill="#475569" text-anchor="middle">Kiểm soát chứng thư số</text>
      <text x="95" y="223" font-size="9" fill="#16a34a" text-anchor="middle">✓ Giới hạn tần suất gọi</text>

      <rect x="15" y="255" width="160" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="95" y="173+105" font-size="10.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Máy chủ Xác thực VNeID</text>
      <text x="95" y="191+105" font-size="9" fill="#475569" text-anchor="middle">Xử lý phiên OAuth2/OIDC</text>
      <text x="95" y="207+105" font-size="9" fill="#475569" text-anchor="middle">Đồng bộ mã định danh</text>
      <text x="95" y="223+105" font-size="9" fill="#16a34a" text-anchor="middle">✓ Mã hóa kênh truyền</text>

      <rect x="15" y="360" width="160" height="110" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="95" y="382" font-size="10" font-weight="bold" fill="#1e40af" text-anchor="middle">Kiểm soát an ninh DMZ</text>
      <text x="25" y="405" font-size="8.5" fill="#334155">• Cô lập hoàn toàn với CSDL</text>
      <text x="25" y="425" font-size="8.5" fill="#334155">• Không lưu dữ liệu nhạy cảm</text>
      <text x="25" y="445" font-size="8.5" fill="#334155">• Giám sát kết nối bất thường</text>
    </g>

    <!-- Firewall Inner -->
    <g transform="translate(485, 120)">
      <rect x="0" y="0" width="30" height="380" rx="4" fill="#dc2626"/>
      <text x="15" y="200" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" transform="rotate(-90 15 200)">TƯỜNG LỬA NỘI BỘ (INTERNAL FW)</text>
    </g>

    <!-- Zone 3: Application Zone -->
    <g transform="translate(535, 75)">
      <rect x="0" y="0" width="190" height="490" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" filter="url(#shadow)"/>
      <rect x="0" y="0" width="190" height="28" rx="6" fill="#15803d"/>
      <text x="95" y="19" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">VÙNG ỨNG DỤNG NGHIỆP VỤ</text>

      <rect x="15" y="45" width="160" height="95" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="95" y="68" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Cụm Máy chủ Một cửa</text>
      <text x="95" y="86" font-size="9" fill="#475569" text-anchor="middle">Xử lý quy trình nghiệp vụ</text>
      <text x="95" y="102" font-size="9" fill="#475569" text-anchor="middle">Động cơ quy trình BPMN</text>
      <text x="95" y="118" font-size="9" fill="#475569" text-anchor="middle">Cụm 04 máy chủ ảo hóa</text>
      <text x="95" y="132" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Tự động nhân bản tải</text>

      <rect x="15" y="155" width="160" height="95" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="95" y="178" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Máy chủ Ký số HSM</text>
      <text x="95" y="196" font-size="9" fill="#475569" text-anchor="middle">Thiết bị phần cứng HSM</text>
      <text x="95" y="212" font-size="9" fill="#475569" text-anchor="middle">Chuẩn FIPS 140-2 Level 3</text>
      <text x="95" y="228" font-size="9" fill="#475569" text-anchor="middle">Ký số công vụ tập trung</text>
      <text x="95" y="242" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Tốc độ 1.000 chữ ký/giây</text>

      <rect x="15" y="265" width="160" height="95" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="95" y="288" font-size="10.5" font-weight="bold" fill="#166534" text-anchor="middle">Máy chủ Biên lai &amp; Đối soát</text>
      <text x="95" y="306" font-size="9" fill="#475569" text-anchor="middle">Kết nối Kho bạc &amp; Thuế</text>
      <text x="95" y="322" font-size="9" fill="#475569" text-anchor="middle">Phát hành chứng từ số</text>
      <text x="95" y="338" font-size="9" fill="#475569" text-anchor="middle">Chạy đối soát tự động</text>
      <text x="95" y="352" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Gửi gói tin bảo mật</text>

      <rect x="15" y="375" width="160" height="95" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="95" y="398" font-size="10" font-weight="bold" fill="#166534" text-anchor="middle">An toàn vùng ứng dụng</text>
      <text x="25" y="420" font-size="8.5" fill="#334155">• Xác thực hai yếu tố 2FA</text>
      <text x="25" y="440" font-size="8.5" fill="#334155">• Phân quyền ma trận vai trò</text>
      <text x="25" y="460" font-size="8.5" fill="#334155">• Rà quét mã độc định kỳ</text>
    </g>

    <!-- Zone 4: Database & Storage (Isolated) -->
    <g transform="translate(745, 75)">
      <rect x="0" y="0" width="185" height="490" rx="6" fill="#fef2f2" stroke="#b91c1c" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="185" height="28" rx="6" fill="#991b1b"/>
      <text x="92" y="19" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">VÙNG CƠ SỞ DỮ LIỆU CÔ LẬP</text>

      <rect x="12" y="45" width="160" height="110" rx="4" fill="#ffffff" stroke="#fca5a5"/>
      <text x="92" y="68" font-size="10.5" font-weight="bold" fill="#991b1b" text-anchor="middle">Cụm CSDL Chính (Master)</text>
      <text x="92" y="86" font-size="9" fill="#475569" text-anchor="middle">Hệ quản trị CSDL quan hệ</text>
      <text x="92" y="102" font-size="9" fill="#475569" text-anchor="middle">Mã hóa trong suốt TDE</text>
      <text x="92" y="118" font-size="9" fill="#475569" text-anchor="middle">Mã hóa lưu trữ AES-256</text>
      <text x="92" y="136" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Dự phòng nóng Standby</text>
      <text x="92" y="150" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Tự động chuyển đổi dự phòng</text>

      <rect x="12" y="170" width="160" height="95" rx="4" fill="#ffffff" stroke="#fca5a5"/>
      <text x="92" y="193" font-size="10.5" font-weight="bold" fill="#991b1b" text-anchor="middle">Kho Lưu trữ Số hóa</text>
      <text x="92" y="211" font-size="9" fill="#475569" text-anchor="middle">Hệ thống lưu trữ MinIO S3</text>
      <text x="92" y="227" font-size="9" fill="#475569" text-anchor="middle">Cơ chế chống ghi đè WORM</text>
      <text x="92" y="243" font-size="9" fill="#475569" text-anchor="middle">Kiểm tra mã băm SHA-256</text>
      <text x="92" y="258" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Bất biến tài liệu pháp lý</text>

      <rect x="12" y="280" width="160" height="95" rx="4" fill="#ffffff" stroke="#fca5a5"/>
      <text x="92" y="303" font-size="10.5" font-weight="bold" fill="#991b1b" text-anchor="middle">Máy chủ Nhật ký Kiểm toán</text>
      <text x="92" y="321" font-size="9" fill="#475569" text-anchor="middle">Hệ thống SIEM quản lý nhật ký</text>
      <text x="92" y="337" font-size="9" fill="#475569" text-anchor="middle">Ghi vết mọi thao tác CRUD</text>
      <text x="92" y="353" font-size="9" fill="#475569" text-anchor="middle">Lưu trữ tối thiểu 02 năm</text>
      <text x="92" y="368" font-size="8.5" fill="#16a34a" text-anchor="middle">✓ Không thể xóa, sửa nhật ký</text>

      <rect x="12" y="390" width="160" height="80" rx="4" fill="#ffffff" stroke="#fca5a5"/>
      <text x="92" y="412" font-size="10" font-weight="bold" fill="#991b1b" text-anchor="middle">An ninh vùng CSDL</text>
      <text x="20" y="433" font-size="8.5" fill="#334155">• Cấm hoàn toàn Internet</text>
      <text x="20" y="450" font-size="8.5" fill="#334155">• Chỉ nhận truy vấn từ Vùng Ứng dụng</text>
      <text x="20" y="467" font-size="8.5" fill="#334155">• Giám sát DBA qua hệ thống PAM</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_4_1_kien_truc_ha_tang_mang_an_toan_cap_3.png', w, h, svg);
}

// =============================================================================
// DIAGRAM 14: QUY TRÌNH VẬN HÀNH, SAO LƯU 3-2-1 VÀ PHỤC HỒI THẢM HỌA
// =============================================================================
function generateDiagram14() {
  const w = 960, h = 540;
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    ${COMMON_DEFS}
    <rect width="${w}" height="${h}" fill="#ffffff"/>
    
    <rect x="30" y="15" width="900" height="38" rx="5" fill="#1e3a8a"/>
    <text x="480" y="39" font-size="15" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">QUY TRÌNH VẬN HÀNH, CHIẾN LƯỢC SAO LƯU 3-2-1 VÀ PHỤC HỒI SAU THẢM HỌA (DRP)</text>

    <!-- Left Box: Hệ thống vận hành chính (DC) -->
    <g transform="translate(40, 80)">
      <rect x="0" y="0" width="260" height="230" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="260" height="30" rx="6" fill="#1d4ed8"/>
      <text x="130" y="20" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">TRUNG TÂM DỮ LIỆU CHÍNH (DC)</text>

      <text x="15" y="55" font-size="10.5" font-weight="bold" fill="#0f172a">Hoạt động thời gian thực 24/7:</text>
      <text x="15" y="75" font-size="10" fill="#334155">• Cụm máy chủ ứng dụng hoạt động</text>
      <text x="15" y="95" font-size="10" fill="#334155">• Cơ sở dữ liệu chính (Active Master)</text>
      <text x="15" y="115" font-size="10" fill="#334155">• Kho lưu trữ đối tượng chứa tệp số hóa</text>

      <line x1="15" y1="135" x2="245" y2="135" stroke="#cbd5e1" stroke-width="1"/>
      <text x="15" y="155" font-size="10.5" font-weight="bold" fill="#15803d">Chỉ số cam kết dịch vụ (SLA):</text>
      <text x="15" y="175" font-size="10" fill="#334155">• Độ sẵn sàng: 99.9% (Uptime Tier III)</text>
      <text x="15" y="195" font-size="10" fill="#334155">• RTO (Thời gian phục hồi): &lt; 30 phút</text>
      <text x="15" y="215" font-size="10" fill="#334155">• RPO (Mức mất mát dữ liệu): &lt; 5 phút</text>
    </g>

    <!-- Arrow Sync to DR Site -->
    <path d="M 300 150 L 660 150" fill="none" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
    <text x="480" y="140" font-size="10" font-weight="bold" fill="#1d4ed8" text-anchor="middle">Đồng bộ dữ liệu thời gian thực (Cáp quang chuyên dùng)</text>

    <!-- Right Box: Trung tâm dự phòng thảm họa (DR Site) -->
    <g transform="translate(660, 80)">
      <rect x="0" y="0" width="260" height="230" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.8" filter="url(#shadow)"/>
      <rect x="0" y="0" width="260" height="30" rx="6" fill="#15803d"/>
      <text x="130" y="20" font-size="11.5" font-weight="bold" fill="#ffffff" text-anchor="middle">TRUNG TÂM DỰ PHÒNG THẢM HỌA (DR)</text>

      <text x="15" y="55" font-size="10.5" font-weight="bold" fill="#0f172a">Vị trí địa lý cách biệt &gt; 30km:</text>
      <text x="15" y="75" font-size="10" fill="#334155">• Cơ sở dữ liệu dự phòng nóng (Standby)</text>
      <text x="15" y="95" font-size="10" fill="#334155">• Đồng bộ nhật ký giao dịch tức thời</text>
      <text x="15" y="115" font-size="10" fill="#334155">• Sẵn sàng tiếp quản khi DC gặp sự cố</text>

      <line x1="15" y1="135" x2="245" y2="135" stroke="#cbd5e1" stroke-width="1"/>
      <text x="15" y="155" font-size="10.5" font-weight="bold" fill="#166534">Quy trình kích hoạt chuyển đổi:</text>
      <text x="15" y="175" font-size="10" fill="#334155">• Phát hiện sự cố qua hệ thống Heartbeat</text>
      <text x="15" y="195" font-size="10" fill="#334155">• Chuyển hướng DNS tự động trong 5 phút</text>
      <text x="15" y="215" font-size="10" fill="#334155">• Không làm gián đoạn dịch vụ của dân</text>
    </g>

    <!-- Bottom Layer: Chiến lược sao lưu 3-2-1 -->
    <rect x="40" y="340" width="880" height="175" rx="6" fill="#fdf4ff" stroke="#a855f7" stroke-width="1.8" filter="url(#shadow)"/>
    <rect x="50" y="348" width="280" height="24" rx="4" fill="#7e22ce"/>
    <text x="190" y="364" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">MÔ HÌNH SAO LƯU TIÊU CHUẨN 3 - 2 - 1</text>

    <!-- 3 Copies -->
    <g transform="translate(60, 385)">
      <rect x="0" y="0" width="250" height="115" rx="5" fill="#ffffff" stroke="#d8b4fe"/>
      <rect x="0" y="0" width="250" height="24" rx="5" fill="#f3e8ff"/>
      <text x="125" y="17" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">3 BẢN SAO DỮ LIỆU</text>
      <text x="15" y="42" font-size="9.5" fill="#334155">• Bản 1: Dữ liệu vận hành thực tế tại DC</text>
      <text x="15" y="62" font-size="9.5" fill="#334155">• Bản 2: Bản sao lưu tại thiết bị lưu trữ cục bộ</text>
      <text x="15" y="82" font-size="9.5" fill="#334155">• Bản 3: Bản sao lưu tại Trung tâm DR Site</text>
      <text x="15" y="102" font-size="9" fill="#16a34a" font-weight="bold">✓ Loại trừ triệt để nguy cơ mất dữ liệu</text>
    </g>

    <!-- 2 Media -->
    <g transform="translate(345, 385)">
      <rect x="0" y="0" width="270" height="115" rx="5" fill="#ffffff" stroke="#d8b4fe"/>
      <rect x="0" y="0" width="270" height="24" rx="5" fill="#f3e8ff"/>
      <text x="135" y="17" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">2 ĐỊNH DẠNG MÔI TRƯỜNG LƯU TRỮ</text>
      <text x="15" y="42" font-size="9.5" fill="#334155">• Môi trường 1: Mảng đĩa cứng thể rắn SAN SSD</text>
      <text x="15" y="62" font-size="9.5" fill="#334155">• Môi trường 2: Hệ thống băng từ LTO / Ổ đĩa quang</text>
      <text x="15" y="82" font-size="9.5" fill="#334155">• Công nghệ chống mã độc tống tiền (Air-Gap)</text>
      <text x="15" y="102" font-size="9" fill="#16a34a" font-weight="bold">✓ Bảo vệ dữ liệu trước mã độc mã hóa</text>
    </g>

    <!-- 1 Offsite -->
    <g transform="translate(645, 385)">
      <rect x="0" y="0" width="255" height="115" rx="5" fill="#ffffff" stroke="#d8b4fe"/>
      <rect x="0" y="0" width="255" height="24" rx="5" fill="#f3e8ff"/>
      <text x="127" y="17" font-size="10.5" font-weight="bold" fill="#6b21a8" text-anchor="middle">1 BẢN LƯU TRỮ NGOẠI VI (OFF-SITE)</text>
      <text x="15" y="42" font-size="9.5" fill="#334155">• Đặt tại Trung tâm dữ liệu đám mây Quốc gia</text>
      <text x="15" y="62" font-size="9.5" fill="#334155">• Mã hóa toàn diện trước khi truyền tải</text>
      <text x="15" y="82" font-size="9.5" fill="#334155">• Diễn tập khôi phục định kỳ 06 tháng/lần</text>
      <text x="15" y="102" font-size="9" fill="#16a34a" font-weight="bold">✓ Khôi phục thành công 100% trong diễn tập</text>
    </g>
  </svg>`;
  renderSvgToPng('hinh_4_2_quy_trinh_van_hanh_sao_luu_du_phong.png', w, h, svg);
}

// Generate all diagrams
console.log('Generating all academic diagrams for Administrative MIS...');
generateDiagram1();
generateDiagram2();
generateDiagram3();
generateDiagram4();
generateDiagram5();
generateDiagram6();
generateDiagram7();
generateDiagram8();
generateDiagram9();
generateDiagram10();
generateDiagram11();
generateDiagram12();
generateDiagram13();
generateDiagram14();
console.log('All 14 diagrams generated successfully!');
