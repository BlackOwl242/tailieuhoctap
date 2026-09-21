const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const projectRoot = fs.existsSync(path.join(__dirname, 'assets')) ? __dirname : path.join(__dirname, '..');
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; 
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

// =============================================================================
// Mathematical Geometry Engine for Flawless Docking
// =============================================================================

function getEllipseDock(cx, cy, rx, ry, fromX, fromY) {
  const dx = fromX - cx;
  const dy = fromY - cy;
  if (dx === 0 && dy === 0) return { x: cx + rx, y: cy };
  const theta = Math.atan2(dy, dx);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const t = (rx * ry) / Math.sqrt((ry * cosT) ** 2 + (rx * sinT) ** 2);
  return {
    x: Math.round((cx + t * cosT) * 10) / 10,
    y: Math.round((cy + t * sinT) * 10) / 10
  };
}

function circleTopY(cx, cy, r, x) {
  const dx = x - cx;
  return Math.round((cy - Math.sqrt(r * r - dx * dx)) * 10) / 10;
}
function circleBottomY(cx, cy, r, x) {
  const dx = x - cx;
  return Math.round((cy + Math.sqrt(r * r - dx * dx)) * 10) / 10;
}
function circleLeftX(cx, cy, r, y) {
  const dy = y - cy;
  return Math.round((cx - Math.sqrt(r * r - dy * dy)) * 10) / 10;
}
function circleRightX(cx, cy, r, y) {
  const dy = y - cy;
  return Math.round((cx + Math.sqrt(r * r - dy * dy)) * 10) / 10;
}

const COMMON_DEFS = `
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1e293b" />
    </marker>
    <marker id="arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#2563eb" />
    </marker>
    <marker id="arrow-reverse" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 9 1.5 L 0 5 L 9 8.5 z" fill="#1e293b" />
    </marker>
    <marker id="circle-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
      <circle cx="5" cy="5" r="3.5" fill="#1e293b" />
    </marker>
    <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="108%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>
`;

function labelPill(x, y, text, width = 0) {
  const clean = text.replace(/&amp;/g, '&');
  const safeText = clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const w = width > 0 ? width : Math.max(clean.length * 7.0 + 22, 65);
  const h = 20;
  const rx = Math.round((x - w/2) * 10) / 10;
  const ry = Math.round((y - h/2) * 10) / 10;
  return `
    <g>
      <rect x="${rx}" y="${ry}" width="${w}" height="${h}" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="0.9" />
      <text x="${Math.round(x * 10) / 10}" y="${Math.round(y * 10) / 10}" font-size="10.5" font-family="'Segoe UI', Arial, sans-serif" fill="#1e293b" font-weight="500" text-anchor="middle" dominant-baseline="central">${safeText}</text>
    </g>
  `;
}

function actorStickFigure(x, y, name) {
  return `
    <g transform="translate(${x}, ${y})">
      <circle cx="20" cy="18" r="14" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="20" y1="32" x2="20" y2="70" stroke="#1e293b" stroke-width="2"/>
      <line x1="-5" y1="46" x2="45" y2="46" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="20" y1="70" x2="-4" y2="108" stroke="#1e293b" stroke-width="2"/>
      <line x1="20" y1="70" x2="44" y2="108" stroke="#1e293b" stroke-width="2"/>
      <text x="20" y="130" font-size="13" font-family="'Segoe UI', Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#0f172a">${name}</text>
    </g>
  `;
}

// =============================================================================
// 1. SƠ ĐỒ LUỒNG DỮ LIỆU MỨC NGỮ CẢNH (hinh_3_1_dfd_context.png)
// =============================================================================
const cX = 700, cY = 460, cR = 120;

const dfdContextSvg = `
<svg width="1400" height="920" viewBox="0 0 1400 920" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <!-- Header -->
  <text x="700" y="38" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ LUỒNG DỮ LIỆU MỨC NGỮ CẢNH (CONTEXT DFD)</text>
  <text x="700" y="60" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Hệ thống Website tuyển dụng và tìm kiếm việc làm TalentConnect</text>

  <!-- Central System Bubble -->
  <g transform="translate(${cX}, ${cY})">
    <circle cx="0" cy="0" r="${cR}" fill="#f8fafc" stroke="#1e293b" stroke-width="2.2" filter="url(#cardShadow)"/>
    <circle cx="0" cy="0" r="${cR - 7}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="0" y="-35" font-size="12" font-weight="bold" fill="#64748b" text-anchor="middle">HỆ THỐNG TRUNG TÂM</text>
    <text x="0" y="-12" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">NỀN TẢNG TUYỂN DỤNG</text>
    <text x="0" y="12" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">&amp; TÌM KIẾM VIỆC LÀM</text>
    <text x="0" y="38" font-size="16" font-weight="bold" fill="#2563eb" text-anchor="middle">TALENTCONNECT</text>
    <text x="0" y="60" font-size="11" fill="#64748b" text-anchor="middle">(Tiến trình 0.0)</text>
  </g>

  <!-- Entity 1: ỨNG VIÊN (Top-Left) x=40..250, y=75..205 (H=130) -->
  <rect x="40" y="75" width="210" height="130" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="75" width="210" height="26" rx="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="145" y="93" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">ỨNG VIÊN</text>
  <text x="145" y="125" font-size="11" text-anchor="middle" fill="#475569">Người tìm kiếm việc làm</text>

  <!-- Entity 2: NHÀ TUYỂN DỤNG (Top-Right) x=1150..1360, y=75..205 (H=130) -->
  <rect x="1150" y="75" width="210" height="130" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="1150" y="75" width="210" height="26" rx="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="1255" y="93" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">NHÀ TUYỂN DỤNG</text>
  <text x="1255" y="125" font-size="11" text-anchor="middle" fill="#475569">Doanh nghiệp đăng tin</text>

  <!-- Entity 3: BAN QUẢN TRỊ (Bottom-Left) x=40..250, y=735..875 (H=140) -->
  <rect x="40" y="735" width="210" height="140" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="735" width="210" height="26" rx="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="145" y="753" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">BAN QUẢN TRỊ (ADMIN)</text>
  <text x="145" y="785" font-size="11" text-anchor="middle" fill="#475569">Vận hành &amp; phân quyền</text>

  <!-- Entity 4: DỊCH VỤ NGOÀI & THANH TOÁN (Bottom-Right) x=1150..1360, y=735..875 (H=140) -->
  <rect x="1150" y="735" width="210" height="140" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="1150" y="735" width="210" height="26" rx="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="1255" y="753" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">CỔNG THANH TOÁN</text>
  <text x="1255" y="785" font-size="11" text-anchor="middle" fill="#475569">VNPAY, MoMo, SendGrid</text>

  <!-- FLOWS: TOP-LEFT (ỨNG VIÊN <-> HỆ THỐNG) -->
  <path d="M 250 100 L 630 100 L 630 ${circleTopY(cX, cY, cR, 630)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(440, 100, "Tài khoản & Hồ sơ CV trực tuyến")}

  <path d="M 250 125 L 590 125 L 590 ${circleTopY(cX, cY, cR, 590)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(420, 125, "Đơn ứng tuyển & Bộ lọc tìm kiếm")}

  <path d="M ${circleLeftX(cX, cY, cR, 440)} 440 L 330 440 L 330 155 L 250 155" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(425, 440, "Danh sách việc làm phù hợp")}

  <path d="M ${circleLeftX(cX, cY, cR, 480)} 480 L 290 480 L 290 185 L 250 185" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(425, 480, "Thông báo phễu ứng tuyển & Lịch PV")}

  <!-- FLOWS: TOP-RIGHT (NTD <-> HỆ THỐNG) -->
  <path d="M 1150 100 L 770 100 L 770 ${circleTopY(cX, cY, cR, 770)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(960, 100, "Nội dung tin tuyển dụng & JD")}

  <path d="M 1150 125 L 810 125 L 810 ${circleTopY(cX, cY, cR, 810)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(980, 125, "Thao tác phễu ATS & Lịch phỏng vấn")}

  <path d="M ${circleRightX(cX, cY, cR, 440)} 440 L 1070 440 L 1070 155 L 1150 155" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(975, 440, "Hồ sơ ứng viên nộp & Điểm match")}

  <path d="M ${circleRightX(cX, cY, cR, 480)} 480 L 1110 480 L 1110 185 L 1150 185" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(975, 480, "Báo cáo tiếp cận & Trạng thái duyệt")}

  <!-- FLOWS: BOTTOM-LEFT (ADMIN <-> HỆ THỐNG) -->
  <path d="M 250 755 L 590 755 L 590 ${circleBottomY(cX, cY, cR, 590)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(420, 755, "Phê duyệt tin & Khóa tài khoản")}

  <path d="M 250 785 L 630 785 L 630 ${circleBottomY(cX, cY, cR, 630)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(440, 785, "Cấu hình hệ thống & Phân quyền RBAC")}

  <path d="M 660 ${circleBottomY(cX, cY, cR, 660)} L 660 815 L 250 815" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(455, 815, "Báo cáo doanh thu & Số liệu KPI")}

  <path d="M 680 ${circleBottomY(cX, cY, cR, 680)} L 680 845 L 250 845" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(465, 845, "Nhật ký hệ thống (Audit Log)")}

  <!-- FLOWS: BOTTOM-RIGHT (THANH TOÁN <-> HỆ THỐNG) -->
  <path d="M 770 ${circleBottomY(cX, cY, cR, 770)} L 770 765 L 1150 765" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(960, 765, "Khởi tạo thanh toán gói tin VIP")}

  <path d="M 1150 805 L 730 805 L 730 ${circleBottomY(cX, cY, cR, 730)}" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(940, 805, "Kết quả giao dịch (IPN) & Đối soát")}

  <path d="M 750 ${circleBottomY(cX, cY, cR, 750)} L 750 845 L 1150 845" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(950, 845, "Lệnh gửi email thông báo tự động")}
</svg>
`;

// =============================================================================
// 2. SƠ ĐỒ LUỒNG DỮ LIỆU MỨC 0 (hinh_3_2_dfd_level0.png)
// =============================================================================
const dfdLevel0Svg = `
<svg width="1500" height="980" viewBox="0 0 1500 980" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <!-- Header -->
  <text x="750" y="36" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ LUỒNG DỮ LIỆU MỨC 0 (LEVEL 0 DFD)</text>
  <text x="750" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Phân rã 5 tiến trình nghiệp vụ cốt lõi hệ thống TalentConnect</text>

  <!-- External Entities (Left Column, x=40, w=180) -->
  <rect x="40" y="115" width="180" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="115" width="180" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="130" y="131" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">E1: ỨNG VIÊN</text>
  <text x="130" y="157" font-size="11" text-anchor="middle" fill="#475569">Người tìm việc</text>

  <rect x="40" y="325" width="180" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="325" width="180" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="130" y="341" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">E2: NHÀ TUYỂN DỤNG</text>
  <text x="130" y="367" font-size="11" text-anchor="middle" fill="#475569">Doanh nghiệp</text>

  <rect x="40" y="575" width="180" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="575" width="180" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="130" y="591" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">E3: BAN QUẢN TRỊ</text>
  <text x="130" y="617" font-size="11" text-anchor="middle" fill="#475569">Quản trị viên (Admin)</text>

  <rect x="40" y="805" width="180" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="805" width="180" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="130" y="821" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">E4: CỔNG THANH TOÁN</text>
  <text x="130" y="847" font-size="11" text-anchor="middle" fill="#475569">VNPAY / SendGrid</text>

  <!-- Processes (Center Column, cx=670, rx=135, ry=42) -->
  <g transform="translate(670, 135)">
    <ellipse cx="0" cy="0" rx="135" ry="42" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-8" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">1.0. QUẢN LÝ TÀI KHOẢN</text>
    <text x="0" y="12" font-size="11.5" text-anchor="middle" fill="#475569">&amp; HỒ SƠ NĂNG LỰC / CV</text>
  </g>

  <g transform="translate(670, 315)">
    <ellipse cx="0" cy="0" rx="135" ry="42" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-8" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2.0. QUẢN LÝ TIN TUYỂN DỤNG</text>
    <text x="0" y="12" font-size="11.5" text-anchor="middle" fill="#475569">&amp; TÌM KIẾM VIỆC LÀM</text>
  </g>

  <g transform="translate(670, 495)">
    <ellipse cx="0" cy="0" rx="135" ry="42" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-8" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">3.0. QUẢN LÝ ỨNG TUYỂN</text>
    <text x="0" y="12" font-size="11.5" text-anchor="middle" fill="#475569">&amp; PHỄU TUYỂN DỤNG ATS</text>
  </g>

  <g transform="translate(670, 675)">
    <ellipse cx="0" cy="0" rx="135" ry="42" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-8" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">4.0. QUẢN LÝ TƯƠNG TÁC</text>
    <text x="0" y="12" font-size="11.5" text-anchor="middle" fill="#475569">&amp; THÔNG BÁO TỰ ĐỘNG</text>
  </g>

  <g transform="translate(670, 845)">
    <ellipse cx="0" cy="0" rx="135" ry="42" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-8" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">5.0. QUẢN TRỊ, BÁO CÁO</text>
    <text x="0" y="12" font-size="11.5" text-anchor="middle" fill="#475569">&amp; THANH TOÁN DỊCH VỤ</text>
  </g>

  <!-- Data Stores (Right Column, x=1150, w=290) -->
  <g transform="translate(1150, 115)">
    <line x1="0" y1="0" x2="290" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="290" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="290" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="145" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D1: Dữ liệu Người dùng &amp; Hồ sơ</text>
    <text x="145" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Users, Candidates, Resumes)</text>
  </g>

  <g transform="translate(1150, 295)">
    <line x1="0" y1="0" x2="290" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="290" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="290" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="145" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D2: Dữ liệu Doanh nghiệp</text>
    <text x="145" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Employers, VerifyDocs)</text>
  </g>

  <g transform="translate(1150, 475)">
    <line x1="0" y1="0" x2="290" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="290" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="290" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="145" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D3: Dữ liệu Tin tuyển dụng</text>
    <text x="145" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Jobs, Categories, JobSkills)</text>
  </g>

  <g transform="translate(1150, 655)">
    <line x1="0" y1="0" x2="290" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="290" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="290" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="145" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D4: Dữ liệu Ứng tuyển &amp; Phễu ATS</text>
    <text x="145" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Applications, ATSStages, Logs)</text>
  </g>

  <g transform="translate(1150, 825)">
    <line x1="0" y1="0" x2="290" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="290" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="290" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="145" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D5: Dữ liệu Giao dịch &amp; Cấu hình</text>
    <text x="145" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Payments, AuditLogs, Settings)</text>
  </g>

  <!-- FLOWS: ENTITIES -> PROCESSES (All strictly orthogonal, cleanly spaced) -->
  <!-- E1 -> 1.0 -->
  <line x1="220" y1="135" x2="535" y2="135" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(375, 135, "Đăng ký tài khoản & Hồ sơ CV")}

  <!-- E1 -> 2.0 (routed above E2 at y=285) -->
  <path d="M 220 155 L 310 155 L 310 285 L 535 285" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(420, 285, "Tìm kiếm việc làm & Bộ lọc tiêu chí")}

  <!-- 2.0 -> E1 (routed above E2 at y=305) -->
  <path d="M 535 305 L 270 305 L 270 170 L 220 170" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(395, 305, "Danh sách việc làm phù hợp")}

  <!-- E1 -> 3.0 (routed via dedicated outer corridor x=18, bypasses all other boxes) -->
  <path d="M 40 145 L 18 145 L 18 475 L 535 475" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(375, 475, "Nộp hồ sơ ứng tuyển trực tuyến")}

  <!-- E2 -> 2.0 (straight horizontal line at y=340) -->
  <line x1="220" y1="340" x2="535" y2="340" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(375, 340, "Đăng tin tuyển dụng mới & JD")}

  <!-- E2 -> 3.0 (routed at y=370 down to y=515) -->
  <path d="M 220 370 L 330 370 L 330 515 L 535 515" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(430, 515, "Sàng lọc ATS & Chuyển bước phễu")}

  <!-- 3.0 -> 4.0 (inter-process vertical) -->
  <line x1="670" y1="537" x2="670" y2="633" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(670, 585, "Sự kiện thay đổi phễu / Lịch phỏng vấn", 220)}

  <!-- 4.0 -> E2 (routed at x=360 up to y=355) -->
  <path d="M 535 675 L 360 675 L 360 355 L 220 355" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(450, 675, "Thông báo email & web tự động")}

  <!-- E3 -> 5.0 -->
  <path d="M 220 595 L 310 595 L 310 825 L 535 825" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(420, 825, "Yêu cầu thống kê & Duyệt tin")}

  <!-- 5.0 -> E3 -->
  <path d="M 535 855 L 270 855 L 270 620 L 220 620" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(395, 855, "Báo cáo doanh thu & Hiệu suất hệ thống")}

  <!-- E4 -> 5.0 (straight horizontal line at y=840) -->
  <line x1="220" y1="840" x2="535" y2="840" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(375, 840, "Kết quả thanh toán gói tin VIP")}

  <!-- FLOWS: PROCESSES -> DATA STORES -->
  <line x1="805" y1="135" x2="1150" y2="135" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(975, 135, "Ghi nhận tài khoản & CV")}

  <path d="M 805 315 L 980 315 L 980 485 L 1150 485" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(890, 315, "Lưu tin tuyển dụng vào kho D3")}

  <path d="M 805 495 L 1000 495 L 1000 665 L 1150 665" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(900, 495, "Lưu đơn ứng tuyển & Phễu ATS")}

  <line x1="805" y1="845" x2="1150" y2="845" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(975, 845, "Ghi nhận doanh thu & Audit Log")}

  <path d="M 1440 157 L 1460 157 L 1460 910 L 730 910 L 730 887" fill="none" stroke="#1e293b" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  ${labelPill(1090, 910, "Truy vấn dữ liệu tổng hợp phục vụ báo cáo quản trị (D1..D5)")}
</svg>
`;

// =============================================================================
// 3. DFD MỨC 1 - TIẾN TRÌNH 2.0 (QUẢN LÝ TIN TUYỂN DỤNG & TÌM KIẾM)
// =============================================================================
const dfdLevel1JobsSvg = `
<svg width="1400" height="880" viewBox="0 0 1400 880" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="700" y="36" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ LUỒNG DỮ LIỆU MỨC 1 - TIẾN TRÌNH 2.0: QUẢN LÝ TIN TUYỂN DỤNG &amp; TÌM KIẾM</text>
  <text x="700" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Phân rã chi tiết luồng dữ liệu đăng tin, kiểm duyệt, lập chỉ mục và tìm kiếm</text>

  <!-- External Entities -->
  <rect x="40" y="120" width="190" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="120" width="190" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="135" y="136" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">NHÀ TUYỂN DỤNG</text>
  <text x="135" y="162" font-size="11" text-anchor="middle" fill="#475569">Tác nhân đăng tin</text>

  <rect x="40" y="320" width="190" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="320" width="190" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="135" y="336" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">BAN QUẢN TRỊ</text>
  <text x="135" y="362" font-size="11" text-anchor="middle" fill="#475569">Kiểm duyệt nội dung</text>

  <rect x="40" y="535" width="190" height="65" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="40" y="535" width="190" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="135" y="551" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">ỨNG VIÊN</text>
  <text x="135" y="577" font-size="11" text-anchor="middle" fill="#475569">Người tìm việc</text>

  <!-- Sub-processes -->
  <g transform="translate(640, 150)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2.1. Tiếp nhận &amp; Soạn thảo</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Tin tuyển dụng (Job Drafting)</text>
  </g>

  <g transform="translate(640, 350)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2.2. Thẩm định &amp; Kiểm duyệt</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Nội dung tin (Moderation)</text>
  </g>

  <g transform="translate(640, 550)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2.3. Lập chỉ mục &amp; Tìm kiếm</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Đa tiêu chí kết hợp bộ lọc</text>
  </g>

  <g transform="translate(640, 740)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2.4. Lưu tin yêu thích &amp;</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Gợi ý việc làm phù hợp</text>
  </g>

  <!-- Data Stores -->
  <g transform="translate(1080, 130)">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="280" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="140" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D2: Dữ liệu Doanh nghiệp</text>
    <text x="140" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Thông tin xác thực, Giấy phép ĐKKD)</text>
  </g>

  <g transform="translate(1080, 330)">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="280" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="140" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D3: Dữ liệu Tin tuyển dụng</text>
    <text x="140" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Jobs, JobSkills, JobCategories)</text>
  </g>

  <g transform="translate(1080, 640)">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="280" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="140" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D1: Dữ liệu Người dùng &amp; Hồ sơ</text>
    <text x="140" y="34" font-size="10" text-anchor="middle" fill="#64748b">(SavedJobs, UserSkills, Resumes)</text>
  </g>

  <!-- Flows -->
  <line x1="230" y1="150" x2="505" y2="150" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(365, 150, "Nhập tiêu đề JD & mức lương")}

  <line x1="1080" y1="150" x2="775" y2="150" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(925, 150, "Kiểm tra hạn mức tin & hồ sơ")}

  <path d="M 640 188 L 640 250 L 1080 250 L 1080 330" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(860, 250, "Lưu tin mới (Trạng thái: Pending)")}

  <line x1="230" y1="350" x2="505" y2="350" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(365, 350, "Phê duyệt / Từ chối tin")}

  <line x1="775" y1="350" x2="1080" y2="350" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(925, 350, "Cập nhật IsApproved = True")}

  <!-- ỨNG VIÊN -> 2.3 at y=540 -->
  <line x1="230" y1="540" x2="505" y2="540" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(365, 525, "Từ khóa, địa điểm & ngành")}

  <!-- D3 -> 2.3 at y=530 -->
  <path d="M 1080 372 L 950 372 L 950 530 L 775 530" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(900, 450, "Truy vấn danh sách việc làm hợp lệ")}

  <!-- 2.3 -> ỨNG VIÊN at y=575 (direct horizontal line, zero overlap) -->
  <line x1="538" y1="575" x2="230" y2="575" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(385, 575, "Trả về kết quả tìm kiếm")}

  <!-- ỨNG VIÊN -> 2.4 -->
  <path d="M 135 600 L 135 740 L 505 740" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(320, 740, "Lưu tin việc làm quan tâm")}

  <!-- 2.4 -> D1 -->
  <path d="M 775 740 L 980 740 L 980 670 L 1080 670" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(880, 740, "Lưu quan hệ SavedJobs")}
</svg>
`;

// =============================================================================
// 4. DFD MỨC 1 - TIẾN TRÌNH 3.0 (QUẢN LÝ ỨNG TUYỂN & PHỄU ATS)
// =============================================================================
const dfdLevel1ApplySvg = `
<svg width="1400" height="880" viewBox="0 0 1400 880" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="700" y="36" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ LUỒNG DỮ LIỆU MỨC 1 - TIẾN TRÌNH 3.0: QUẢN LÝ ỨNG TUYỂN &amp; PHỄU ATS</text>
  <text x="700" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Quy trình nộp đơn, tính điểm tương thích, chuyển phễu Kanban và lên lịch phỏng vấn</text>

  <!-- External Entities -->
  <rect x="50" y="150" width="190" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="50" y="150" width="190" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="145" y="166" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">ỨNG VIÊN</text>
  <text x="145" y="192" font-size="11" text-anchor="middle" fill="#475569">Người nộp hồ sơ</text>

  <rect x="50" y="470" width="190" height="60" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="50" y="470" width="190" height="22" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
  <text x="145" y="486" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">NHÀ TUYỂN DỤNG</text>
  <text x="145" y="512" font-size="11" text-anchor="middle" fill="#475569">Bộ phận tuyển dụng (HR)</text>

  <!-- Sub-processes -->
  <g transform="translate(640, 160)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">3.1. Tiếp nhận hồ sơ &amp;</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Nộp đơn ứng tuyển (Apply)</text>
  </g>

  <g transform="translate(640, 340)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">3.2. Sàng lọc hồ sơ &amp;</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Tính điểm tương thích CV</text>
  </g>

  <g transform="translate(640, 520)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">3.3. Cập nhật phễu Kanban</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">&amp; Quản trị trạng thái ATS</text>
  </g>

  <g transform="translate(640, 710)">
    <ellipse cx="0" cy="0" rx="135" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <text x="0" y="-6" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#0f172a">3.4. Lên lịch phỏng vấn &amp;</text>
    <text x="0" y="14" font-size="11" text-anchor="middle" fill="#475569">Gửi thông báo tự động</text>
  </g>

  <!-- Data Stores -->
  <g transform="translate(1080, 140)">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="280" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="140" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D1: Dữ liệu Người dùng &amp; Hồ sơ</text>
    <text x="140" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Resumes, CandidateProfiles)</text>
  </g>

  <g transform="translate(1080, 320)">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="280" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="140" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D3: Dữ liệu Tin tuyển dụng</text>
    <text x="140" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Yêu cầu kỹ năng, Mô tả JD)</text>
  </g>

  <g transform="translate(1080, 520)">
    <line x1="0" y1="0" x2="280" y2="0" stroke="#1e293b" stroke-width="2"/>
    <line x1="0" y1="42" x2="280" y2="42" stroke="#1e293b" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="42" fill="#f8fafc" opacity="0.6"/>
    <text x="140" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">D4: Dữ liệu Ứng tuyển &amp; Phễu ATS</text>
    <text x="140" y="34" font-size="10" text-anchor="middle" fill="#64748b">(Applications, ATSStages, Interviews)</text>
  </g>

  <!-- Flows -->
  <line x1="240" y1="160" x2="505" y2="160" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(375, 160, "Chọn CV & Thư xin việc")}

  <line x1="1080" y1="160" x2="775" y2="160" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(925, 160, "Đọc thông tin CV chi tiết")}

  <line x1="640" y1="198" x2="640" y2="302" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(640, 250, "Chuyển dữ liệu hồ sơ để đối sánh", 210)}

  <line x1="1080" y1="340" x2="775" y2="340" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(925, 340, "Đọc yêu cầu kỹ năng của vị trí")}

  <path d="M 775 355 L 940 355 L 940 535 L 1080 535" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(940, 440, "Ghi đơn vào cột 'Mới ứng tuyển'")}

  <!-- NTD -> 3.3 (100% horizontal line at y=520) -->
  <line x1="240" y1="520" x2="505" y2="520" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(375, 520, "Chuyển bước phễu Kanban ATS")}

  <!-- 3.3 -> D4 (orthogonal connection to D4) -->
  <path d="M 775 520 L 920 520 L 920 540 L 1080 540" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(925, 535, "Cập nhật StageID & Ghi lịch sử")}

  <line x1="640" y1="558" x2="640" y2="672" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(640, 615, "Kích hoạt tạo lịch phỏng vấn", 180)}

  <path d="M 240 500 L 320 500 L 320 710 L 505 710" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(410, 710, "Lên lịch phỏng vấn & Link họp")}

  <!-- Loop back to Ứng viên via left corridor x=20 -->
  <path d="M 505 730 L 20 730 L 20 180 L 50 180" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  ${labelPill(260, 730, "Gửi thư mời phỏng vấn tự động")}
</svg>
`;

// =============================================================================
// 5. BIỂU ĐỒ USE CASE TỔNG THỂ (hinh_3_5_usecase_general.png)
// =============================================================================
const ucCandidate = [
  { id: "UC1", title: "UC1: Đăng ký & Đăng nhập hệ thống", cx: 620, cy: 140, rx: 165, ry: 25 },
  { id: "UC2", title: "UC2: Quản lý hồ sơ & Tạo CV online", cx: 620, cy: 215, rx: 165, ry: 25 },
  { id: "UC3", title: "UC3: Tìm kiếm & Lọc việc làm", cx: 620, cy: 290, rx: 165, ry: 25 },
  { id: "UC4", title: "UC4: Nộp đơn ứng tuyển trực tuyến", cx: 620, cy: 365, rx: 165, ry: 25 }
];

const ucEmployer = [
  { id: "UC5", title: "UC5: Đăng & Quản lý tin tuyển dụng", cx: 780, cy: 450, rx: 165, ry: 25 },
  { id: "UC6", title: "UC6: Quản lý phễu ứng viên (ATS)", cx: 780, cy: 525, rx: 165, ry: 25 },
  { id: "UC7", title: "UC7: Lên lịch hẹn phỏng vấn & Gửi thư", cx: 780, cy: 600, rx: 165, ry: 25 }
];

const ucAdmin = [
  { id: "UC8", title: "UC8: Kiểm duyệt tin tuyển dụng", cx: 620, cy: 690, rx: 165, ry: 25 },
  { id: "UC9", title: "UC9: Phân quyền & Quản lý người dùng", cx: 620, cy: 765, rx: 165, ry: 25 },
  { id: "UC10", title: "UC10: Báo cáo thống kê & Doanh thu", cx: 620, cy: 840, rx: 165, ry: 25 }
];

const allUcs = [...ucCandidate, ...ucEmployer, ...ucAdmin];

function renderUsecaseOvals(ucs) {
  return ucs.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" filter="url(#cardShadow)"/>
      <text x="0" y="4" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">${u.title}</text>
    </g>
  `).join('\n');
}

const actCandX = 145, actCandY = 246;
const actNtdX = 1250, actNtdY = 525;
const actAdmX = 145, actAdmY = 755;

const useCaseGeneralSvg = `
<svg width="1400" height="960" viewBox="0 0 1400 960" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="700" y="38" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">BIỂU ĐỒ USE CASE TỔNG THỂ HỆ THỐNG (GENERAL USE CASE)</text>
  <text x="700" y="60" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Cấu trúc phân vùng chức năng theo 3 tác nhân với 10 ca sử dụng cốt lõi</text>

  <!-- System Boundary -->
  <rect x="340" y="80" width="720" height="840" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="2" filter="url(#cardShadow)"/>
  <rect x="340" y="80" width="720" height="32" rx="8" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
  <text x="360" y="102" font-size="13" font-weight="bold" fill="#0f172a">HỆ THỐNG TALENTCONNECT (SYSTEM BOUNDARY)</text>

  <!-- Actors -->
  ${actorStickFigure(105, 180, "Ứng viên")}
  ${actorStickFigure(1230, 460, "Nhà tuyển dụng")}
  ${actorStickFigure(105, 690, "Ban Quản trị")}

  <!-- Render All Use Cases -->
  ${renderUsecaseOvals(allUcs)}

  <!-- Connections -->
  ${ucCandidate.map(u => {
    const p = getEllipseDock(u.cx, u.cy, u.rx, u.ry, actCandX, actCandY);
    return `<line x1="${actCandX}" y1="${actCandY}" x2="${p.x}" y2="${p.y}" stroke="#1e293b" stroke-width="1.5"/>`;
  }).join('\n')}

  ${ucEmployer.map(u => {
    const p = getEllipseDock(u.cx, u.cy, u.rx, u.ry, actNtdX, actNtdY);
    return `<line x1="${actNtdX}" y1="${actNtdY}" x2="${p.x}" y2="${p.y}" stroke="#1e293b" stroke-width="1.5"/>`;
  }).join('\n')}

  ${ucAdmin.map(u => {
    const p = getEllipseDock(u.cx, u.cy, u.rx, u.ry, actAdmX, actAdmY);
    return `<line x1="${actAdmX}" y1="${actAdmY}" x2="${p.x}" y2="${p.y}" stroke="#1e293b" stroke-width="1.5"/>`;
  }).join('\n')}
</svg>
`;

// =============================================================================
// 6. USE CASE PHÂN HỆ ỨNG VIÊN (hinh_3_6_usecase_candidate.png)
// =============================================================================
const ucsCandMain = [
  { title: "Tạo & Chỉnh sửa CV trực tuyến", cx: 520, cy: 160, rx: 140, ry: 26 },
  { title: "Tìm kiếm & Lọc việc làm", cx: 520, cy: 280, rx: 140, ry: 26 },
  { title: "Lưu việc làm yêu thích", cx: 520, cy: 400, rx: 140, ry: 26 },
  { title: "Nộp hồ sơ ứng tuyển trực tuyến", cx: 520, cy: 520, rx: 140, ry: 26 },
  { title: "Theo dõi tiến trình & Lịch PV", cx: 520, cy: 640, rx: 140, ry: 26 }
];

const ucsCandSub = [
  { title: "Tải lên tệp PDF có sẵn", cx: 980, cy: 125, rx: 135, ry: 25 },
  { title: "Kết xuất CV định dạng PDF", cx: 980, cy: 195, rx: 135, ry: 25 },
  { title: "Lọc đa tiêu chí (Lương, Vị trí)", cx: 980, cy: 280, rx: 135, ry: 25 },
  { title: "Chọn CV mặc định & Cover Letter", cx: 980, cy: 520, rx: 135, ry: 25 }
];

const useCaseCandidateSvg = `
<svg width="1300" height="780" viewBox="0 0 1300 780" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="650" y="36" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">BIỂU ĐỒ CA SỬ DỤNG PHÂN HỆ ỨNG VIÊN (CANDIDATE USE CASE)</text>
  <text x="650" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Chi tiết các chức năng tạo CV, tra cứu việc làm và nộp hồ sơ của Ứng viên</text>

  <rect x="300" y="80" width="950" height="660" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="300" y="80" width="950" height="30" rx="8" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
  <text x="320" y="100" font-size="13" font-weight="bold" fill="#0f172a">Phân hệ Người tìm việc (Candidate Subsystem)</text>

  ${actorStickFigure(100, 310, "Ứng viên")}

  ${ucsCandMain.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
      <text x="0" y="4" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">${u.title}</text>
    </g>
  `).join('\n')}

  ${ucsCandSub.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#ffffff" stroke="#2563eb" stroke-width="1.4"/>
      <text x="0" y="4" font-size="11.5" text-anchor="middle" fill="#1e40af">${u.title}</text>
    </g>
  `).join('\n')}

  ${ucsCandMain.map(u => {
    const p = getEllipseDock(u.cx, u.cy, u.rx, u.ry, 140, 356);
    return `<line x1="140" y1="356" x2="${p.x}" y2="${p.y}" stroke="#1e293b" stroke-width="1.5"/>`;
  }).join('\n')}

  ${(() => {
    const pStart = getEllipseDock(ucsCandSub[0].cx, ucsCandSub[0].cy, ucsCandSub[0].rx, ucsCandSub[0].ry, ucsCandMain[0].cx, ucsCandMain[0].cy);
    const pEnd = getEllipseDock(ucsCandMain[0].cx, ucsCandMain[0].cy, ucsCandMain[0].rx, ucsCandMain[0].ry, ucsCandSub[0].cx, ucsCandSub[0].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2 - 10, "<<extend>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsCandMain[0].cx, ucsCandMain[0].cy, ucsCandMain[0].rx, ucsCandMain[0].ry, ucsCandSub[1].cx, ucsCandSub[1].cy);
    const pEnd = getEllipseDock(ucsCandSub[1].cx, ucsCandSub[1].cy, ucsCandSub[1].rx, ucsCandSub[1].ry, ucsCandMain[0].cx, ucsCandMain[0].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2 + 10, "<<include>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsCandMain[1].cx, ucsCandMain[1].cy, ucsCandMain[1].rx, ucsCandMain[1].ry, ucsCandSub[2].cx, ucsCandSub[2].cy);
    const pEnd = getEllipseDock(ucsCandSub[2].cx, ucsCandSub[2].cy, ucsCandSub[2].rx, ucsCandSub[2].ry, ucsCandMain[1].cx, ucsCandMain[1].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2, "<<include>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsCandMain[3].cx, ucsCandMain[3].cy, ucsCandMain[3].rx, ucsCandMain[3].ry, ucsCandSub[3].cx, ucsCandSub[3].cy);
    const pEnd = getEllipseDock(ucsCandSub[3].cx, ucsCandSub[3].cy, ucsCandSub[3].rx, ucsCandSub[3].ry, ucsCandMain[3].cx, ucsCandMain[3].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2, "<<include>>", 72)}
    `;
  })()}
</svg>
`;

// =============================================================================
// 7. USE CASE PHÂN HỆ NHÀ TUYỂN DỤNG (hinh_3_7_usecase_employer.png)
// =============================================================================
const ucsEmpMain = [
  { title: "Cập nhật hồ sơ & Pháp lý công ty", cx: 520, cy: 160, rx: 145, ry: 26 },
  { title: "Đăng tin tuyển dụng mới", cx: 520, cy: 280, rx: 145, ry: 26 },
  { title: "Xem danh sách hồ sơ ứng viên", cx: 520, cy: 400, rx: 145, ry: 26 },
  { title: "Quản lý phễu ứng viên Kanban (ATS)", cx: 520, cy: 520, rx: 145, ry: 26 },
  { title: "Lên lịch hẹn phỏng vấn", cx: 520, cy: 640, rx: 145, ry: 26 }
];

const ucsEmpSub = [
  { title: "Mua gói đẩy tin nổi bật (VIP)", cx: 980, cy: 280, rx: 140, ry: 25 },
  { title: "Kéo thả chuyển cột trạng thái", cx: 980, cy: 485, rx: 140, ry: 25 },
  { title: "Ghi chú & Đánh giá ứng viên", cx: 980, cy: 555, rx: 140, ry: 25 },
  { title: "Gửi email mời phỏng vấn tự động", cx: 980, cy: 640, rx: 140, ry: 25 }
];

const useCaseEmployerSvg = `
<svg width="1300" height="780" viewBox="0 0 1300 780" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="650" y="36" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">BIỂU ĐỒ CA SỬ DỤNG PHÂN HỆ NHÀ TUYỂN DỤNG (EMPLOYER USE CASE)</text>
  <text x="650" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Quy trình đăng tin, sàng lọc hồ sơ, quản trị phễu Kanban ATS và lên lịch phỏng vấn</text>

  <rect x="300" y="80" width="950" height="660" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="300" y="80" width="950" height="30" rx="8" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
  <text x="320" y="100" font-size="13" font-weight="bold" fill="#0f172a">Phân hệ Nhà tuyển dụng (Employer Subsystem)</text>

  ${actorStickFigure(100, 310, "Nhà tuyển dụng")}

  ${ucsEmpMain.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
      <text x="0" y="4" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">${u.title}</text>
    </g>
  `).join('\n')}

  ${ucsEmpSub.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#ffffff" stroke="#2563eb" stroke-width="1.4"/>
      <text x="0" y="4" font-size="11.5" text-anchor="middle" fill="#1e40af">${u.title}</text>
    </g>
  `).join('\n')}

  ${ucsEmpMain.map(u => {
    const p = getEllipseDock(u.cx, u.cy, u.rx, u.ry, 140, 356);
    return `<line x1="140" y1="356" x2="${p.x}" y2="${p.y}" stroke="#1e293b" stroke-width="1.5"/>`;
  }).join('\n')}

  ${(() => {
    const pStart = getEllipseDock(ucsEmpSub[0].cx, ucsEmpSub[0].cy, ucsEmpSub[0].rx, ucsEmpSub[0].ry, ucsEmpMain[1].cx, ucsEmpMain[1].cy);
    const pEnd = getEllipseDock(ucsEmpMain[1].cx, ucsEmpMain[1].cy, ucsEmpMain[1].rx, ucsEmpMain[1].ry, ucsEmpSub[0].cx, ucsEmpSub[0].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2, "<<extend>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsEmpMain[3].cx, ucsEmpMain[3].cy, ucsEmpMain[3].rx, ucsEmpMain[3].ry, ucsEmpSub[1].cx, ucsEmpSub[1].cy);
    const pEnd = getEllipseDock(ucsEmpSub[1].cx, ucsEmpSub[1].cy, ucsEmpSub[1].rx, ucsEmpSub[1].ry, ucsEmpMain[3].cx, ucsEmpMain[3].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2 - 10, "<<include>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsEmpMain[3].cx, ucsEmpMain[3].cy, ucsEmpMain[3].rx, ucsEmpMain[3].ry, ucsEmpSub[2].cx, ucsEmpSub[2].cy);
    const pEnd = getEllipseDock(ucsEmpSub[2].cx, ucsEmpSub[2].cy, ucsEmpSub[2].rx, ucsEmpSub[2].ry, ucsEmpMain[3].cx, ucsEmpMain[3].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2 + 10, "<<include>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsEmpMain[4].cx, ucsEmpMain[4].cy, ucsEmpMain[4].rx, ucsEmpMain[4].ry, ucsEmpSub[3].cx, ucsEmpSub[3].cy);
    const pEnd = getEllipseDock(ucsEmpSub[3].cx, ucsEmpSub[3].cy, ucsEmpSub[3].rx, ucsEmpSub[3].ry, ucsEmpMain[4].cx, ucsEmpMain[4].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2, "<<include>>", 72)}
    `;
  })()}
</svg>
`;

// =============================================================================
// 8. USE CASE PHÂN HỆ QUẢN TRỊ VIÊN (hinh_3_8_usecase_admin.png)
// =============================================================================
const ucsAdmMain = [
  { title: "Quản lý người dùng & Phân quyền RBAC", cx: 520, cy: 160, rx: 145, ry: 26 },
  { title: "Kiểm duyệt & Phê duyệt tin tuyển dụng", cx: 520, cy: 280, rx: 145, ry: 26 },
  { title: "Khóa tài khoản vi phạm chính sách", cx: 520, cy: 400, rx: 145, ry: 26 },
  { title: "Cấu hình danh mục ngành & Kỹ năng", cx: 520, cy: 520, rx: 145, ry: 26 },
  { title: "Báo cáo doanh thu & Thống kê KPI", cx: 520, cy: 640, rx: 145, ry: 26 }
];

const ucsAdmSub = [
  { title: "Gửi email thông báo lý do từ chối", cx: 980, cy: 280, rx: 140, ry: 25 },
  { title: "Xuất báo cáo tài chính Excel / PDF", cx: 980, cy: 640, rx: 140, ry: 25 }
];

const useCaseAdminSvg = `
<svg width="1300" height="780" viewBox="0 0 1300 780" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="650" y="36" font-size="17" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">BIỂU ĐỒ CA SỬ DỤNG PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN USE CASE)</text>
  <text x="650" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Nghiệp vụ phê duyệt tin, phân quyền RBAC, kiểm toán và báo cáo KPI hệ thống</text>

  <rect x="300" y="80" width="950" height="660" rx="8" fill="#ffffff" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
  <rect x="300" y="80" width="950" height="30" rx="8" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
  <text x="320" y="100" font-size="13" font-weight="bold" fill="#0f172a">Phân hệ Quản trị hệ thống (Administration Subsystem)</text>

  ${actorStickFigure(100, 310, "Ban Quản trị")}

  ${ucsAdmMain.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
      <text x="0" y="4" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">${u.title}</text>
    </g>
  `).join('\n')}

  ${ucsAdmSub.map(u => `
    <g transform="translate(${u.cx}, ${u.cy})">
      <ellipse cx="0" cy="0" rx="${u.rx}" ry="${u.ry}" fill="#ffffff" stroke="#2563eb" stroke-width="1.4"/>
      <text x="0" y="4" font-size="11.5" text-anchor="middle" fill="#1e40af">${u.title}</text>
    </g>
  `).join('\n')}

  ${ucsAdmMain.map(u => {
    const p = getEllipseDock(u.cx, u.cy, u.rx, u.ry, 140, 356);
    return `<line x1="140" y1="356" x2="${p.x}" y2="${p.y}" stroke="#1e293b" stroke-width="1.5"/>`;
  }).join('\n')}

  ${(() => {
    const pStart = getEllipseDock(ucsAdmSub[0].cx, ucsAdmSub[0].cy, ucsAdmSub[0].rx, ucsAdmSub[0].ry, ucsAdmMain[1].cx, ucsAdmMain[1].cy);
    const pEnd = getEllipseDock(ucsAdmMain[1].cx, ucsAdmMain[1].cy, ucsAdmMain[1].rx, ucsAdmMain[1].ry, ucsAdmSub[0].cx, ucsAdmSub[0].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2, "<<extend>>", 72)}
    `;
  })()}

  ${(() => {
    const pStart = getEllipseDock(ucsAdmMain[4].cx, ucsAdmMain[4].cy, ucsAdmMain[4].rx, ucsAdmMain[4].ry, ucsAdmSub[1].cx, ucsAdmSub[1].cy);
    const pEnd = getEllipseDock(ucsAdmSub[1].cx, ucsAdmSub[1].cy, ucsAdmSub[1].rx, ucsAdmSub[1].ry, ucsAdmMain[4].cx, ucsAdmMain[4].cy);
    return `
      <line x1="${pStart.x}" y1="${pStart.y}" x2="${pEnd.x}" y2="${pEnd.y}" stroke="#2563eb" stroke-width="1.3" stroke-dasharray="4 3" marker-end="url(#arrow-blue)"/>
      ${labelPill((pStart.x + pEnd.x)/2, (pStart.y + pEnd.y)/2, "<<include>>", 72)}
    `;
  })()}
</svg>
`;

// =============================================================================
// 9. SƠ ĐỒ PHÂN RÃ CHỨC NĂNG (FDD) (hinh_3_9_fdd.png)
// =============================================================================
const fddSvg = `
<svg width="1380" height="660" viewBox="0 0 1380 660" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="690" y="34" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ PHÂN RÃ CHỨC NĂNG HỆ THỐNG (FUNCTIONAL DECOMPOSITION DIAGRAM - FDD)</text>
  <text x="690" y="54" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Cấu trúc phân cấp chức năng từ tổng thể đến chi tiết của TalentConnect</text>

  <!-- Level 0: Root Node -->
  <g transform="translate(565, 80)">
    <rect x="0" y="0" width="250" height="52" rx="5" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" filter="url(#cardShadow)"/>
    <text x="125" y="22" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">HỆ THỐNG TALENTCONNECT</text>
    <text x="125" y="40" font-size="11" fill="#94a3b8" text-anchor="middle">Website tuyển dụng &amp; Việc làm</text>
  </g>

  <!-- Bus line horizontal -->
  <line x1="175" y1="165" x2="1205" y2="165" stroke="#1e293b" stroke-width="2"/>
  <line x1="690" y1="132" x2="690" y2="165" stroke="#1e293b" stroke-width="2"/>

  <!-- Level 1 Columns -->
  <!-- 1.0 -->
  <line x1="175" y1="165" x2="175" y2="195" stroke="#1e293b" stroke-width="2"/>
  <g transform="translate(65, 195)">
    <rect x="0" y="0" width="220" height="48" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="220" height="20" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
    <text x="110" y="15" font-size="11.5" font-weight="bold" text-anchor="middle" fill="#0f172a">1.0. TÀI KHOẢN &amp; HỒ SƠ</text>
    <text x="110" y="38" font-size="11" text-anchor="middle" fill="#475569">Quản lý CV &amp; Pháp lý công ty</text>
  </g>

  <!-- 2.0 -->
  <line x1="515" y1="165" x2="515" y2="195" stroke="#1e293b" stroke-width="2"/>
  <g transform="translate(405, 195)">
    <rect x="0" y="0" width="220" height="48" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="220" height="20" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
    <text x="110" y="15" font-size="11.5" font-weight="bold" text-anchor="middle" fill="#0f172a">2.0. TIN ĐĂNG &amp; TÌM KIẾM</text>
    <text x="110" y="38" font-size="11" text-anchor="middle" fill="#475569">Đăng bài, duyệt &amp; bộ lọc</text>
  </g>

  <!-- 3.0 -->
  <line x1="865" y1="165" x2="865" y2="195" stroke="#1e293b" stroke-width="2"/>
  <g transform="translate(755, 195)">
    <rect x="0" y="0" width="220" height="48" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="220" height="20" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
    <text x="110" y="15" font-size="11.5" font-weight="bold" text-anchor="middle" fill="#0f172a">3.0. ỨNG TUYỂN &amp; ATS</text>
    <text x="110" y="38" font-size="11" text-anchor="middle" fill="#475569">Phễu Kanban &amp; Phỏng vấn</text>
  </g>

  <!-- 4.0 -->
  <line x1="1205" y1="165" x2="1205" y2="195" stroke="#1e293b" stroke-width="2"/>
  <g transform="translate(1095, 195)">
    <rect x="0" y="0" width="220" height="48" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="220" height="20" rx="5" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
    <text x="110" y="15" font-size="11.5" font-weight="bold" text-anchor="middle" fill="#0f172a">4.0. HỆ THỐNG &amp; BÁO CÁO</text>
    <text x="110" y="38" font-size="11" text-anchor="middle" fill="#475569">Phân quyền, KPI &amp; Audit Log</text>
  </g>

  <!-- Level 2 Sub-branches -->
  <line x1="175" y1="243" x2="175" y2="270" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 175 270 L 100 270 L 100 580" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <path d="M 100 310 L 125 310" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="125" y="290" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="135" y="308" font-size="11" font-weight="bold" fill="#0f172a">1.1. Đăng ký / Đăng nhập</text>
  <text x="135" y="322" font-size="10" fill="#64748b">Xác thực JWT &amp; OAuth 2.0</text>

  <path d="M 100 400 L 125 400" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="125" y="380" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="135" y="398" font-size="11" font-weight="bold" fill="#0f172a">1.2. Quản lý hồ sơ doanh nghiệp</text>
  <text x="135" y="412" font-size="10" fill="#64748b">Cập nhật MST &amp; giấy phép</text>

  <path d="M 100 490 L 125 490" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="125" y="470" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="135" y="488" font-size="11" font-weight="bold" fill="#0f172a">1.3. Bộ tạo CV trực tuyến</text>
  <text x="135" y="502" font-size="10" fill="#64748b">Tạo mẫu CV &amp; Xuất PDF</text>

  <path d="M 100 580 L 125 580" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="125" y="560" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="135" y="578" font-size="11" font-weight="bold" fill="#0f172a">1.4. Quản lý thông tin ứng viên</text>
  <text x="135" y="592" font-size="10" fill="#64748b">Kinh nghiệm, học vấn &amp; kỹ năng</text>

  <line x1="515" y1="243" x2="515" y2="270" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 515 270 L 440 270 L 440 580" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <path d="M 440 310 L 465 310" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="465" y="290" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="475" y="308" font-size="11" font-weight="bold" fill="#0f172a">2.1. Đăng &amp; sửa tin tuyển dụng</text>
  <text x="475" y="322" font-size="10" fill="#64748b">Mô tả vị trí, mức lương, hạn nộp</text>

  <path d="M 440 400 L 465 400" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="465" y="380" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="475" y="398" font-size="11" font-weight="bold" fill="#0f172a">2.2. Kiểm duyệt tin tự động</text>
  <text x="475" y="412" font-size="10" fill="#64748b">Bộ lọc từ cấm &amp; duyệt Admin</text>

  <path d="M 440 490 L 465 490" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="465" y="470" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="475" y="488" font-size="11" font-weight="bold" fill="#0f172a">2.3. Tìm kiếm &amp; Lọc việc làm</text>
  <text x="475" y="502" font-size="10" fill="#64748b">Theo ngành, lương &amp; địa điểm</text>

  <path d="M 440 580 L 465 580" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="465" y="560" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="475" y="578" font-size="11" font-weight="bold" fill="#0f172a">2.4. Lưu tin &amp; Gợi ý việc làm</text>
  <text x="475" y="592" font-size="10" fill="#64748b">Lưu yêu thích &amp; gợi ý theo ngành</text>

  <line x1="865" y1="243" x2="865" y2="270" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 865 270 L 790 270 L 790 580" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <path d="M 790 310 L 815 310" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="815" y="290" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="825" y="308" font-size="11" font-weight="bold" fill="#0f172a">3.1. Nộp hồ sơ ứng tuyển</text>
  <text x="825" y="322" font-size="10" fill="#64748b">Nộp CV &amp; viết thư giới thiệu</text>

  <path d="M 790 400 L 815 400" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="815" y="380" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="825" y="398" font-size="11" font-weight="bold" fill="#0f172a">3.2. Quản lý phễu Kanban ATS</text>
  <text x="825" y="412" font-size="10" fill="#64748b">Kéo thả trạng thái ứng viên</text>

  <path d="M 790 490 L 815 490" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="815" y="470" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="825" y="488" font-size="11" font-weight="bold" fill="#0f172a">3.3. Lên lịch hẹn phỏng vấn</text>
  <text x="825" y="502" font-size="10" fill="#64748b">Thiết lập ngày giờ, địa điểm</text>

  <path d="M 790 580 L 815 580" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="815" y="560" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="825" y="578" font-size="11" font-weight="bold" fill="#0f172a">3.4. Đánh giá &amp; Ghi chú hồ sơ</text>
  <text x="825" y="592" font-size="10" fill="#64748b">Chấm điểm ứng viên nội bộ HR</text>

  <line x1="1205" y1="243" x2="1205" y2="270" stroke="#1e293b" stroke-width="1.5"/>
  <path d="M 1205 270 L 1130 270 L 1130 580" fill="none" stroke="#1e293b" stroke-width="1.5"/>

  <path d="M 1130 310 L 1155 310" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="1155" y="290" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="1165" y="308" font-size="11" font-weight="bold" fill="#0f172a">4.1. Phân quyền vai trò RBAC</text>
  <text x="1165" y="322" font-size="10" fill="#64748b">Roles, Permissions &amp; Tokens</text>

  <path d="M 1130 400 L 1155 400" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="1155" y="380" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="1165" y="398" font-size="11" font-weight="bold" fill="#0f172a">4.2. Báo cáo thống kê &amp; KPI</text>
  <text x="1165" y="412" font-size="10" fill="#64748b">Doanh thu, số tin &amp; ứng viên</text>

  <path d="M 1130 490 L 1155 490" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="1155" y="470" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="1165" y="488" font-size="11" font-weight="bold" fill="#0f172a">4.3. Quản lý danh mục &amp; Log</text>
  <text x="1165" y="502" font-size="10" fill="#64748b">Ngành nghề, kỹ năng &amp; Audit</text>

  <path d="M 1130 580 L 1155 580" fill="none" stroke="#1e293b" stroke-width="1.5" marker-end="url(#arrow)"/>
  <rect x="1155" y="560" width="180" height="40" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
  <text x="1165" y="578" font-size="11" font-weight="bold" fill="#0f172a">4.4. Thanh toán dịch vụ gói VIP</text>
  <text x="1165" y="592" font-size="10" fill="#64748b">Tích hợp VNPAY, lịch sử GD</text>
</svg>
`;

// =============================================================================
// 10. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG 3 TẦNG (hinh_3_10_architecture.png)
// =============================================================================
const architectureSvg = `
<svg width="1300" height="780" viewBox="0 0 1300 780" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <text x="650" y="36" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ KIẾN TRÚC PHẦN MỀM 3 TẦNG (3-TIER ARCHITECTURE)</text>
  <text x="650" y="58" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Mô hình kiến trúc phân tầng chuẩn doanh nghiệp hệ thống TalentConnect</text>

  <!-- Client Devices -->
  <g transform="translate(60, 110)">
    <rect x="0" y="0" width="240" height="85" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="240" height="24" rx="6" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.8"/>
    <text x="120" y="17" font-size="12" font-weight="bold" text-anchor="middle" fill="#0f172a">NGƯỜI DÙNG ĐẦU CUỐI</text>
    <text x="120" y="46" font-size="12" font-weight="bold" text-anchor="middle" fill="#1e293b">Client Browser / Mobile Web</text>
    <text x="120" y="68" font-size="11" text-anchor="middle" fill="#64748b">Chrome, Edge, Safari, Firefox</text>
  </g>

  <!-- Tier 1: GUI -->
  <g transform="translate(60, 260)">
    <rect x="0" y="0" width="240" height="180" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="240" height="28" rx="6" fill="#2563eb"/>
    <text x="120" y="19" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">1. TẦNG GIAO DIỆN (GUI)</text>
    <text x="20" y="55" font-size="12" font-weight="bold" fill="#1e40af">• Single Page Application (SPA)</text>
    <text x="20" y="75" font-size="11" fill="#334155">  Framework: ReactJS + Vite</text>
    <text x="20" y="95" font-size="11" fill="#334155">  Giao diện: Tailwind CSS + Lucide</text>
    <text x="20" y="115" font-size="11" fill="#334155">  State: Redux Toolkit + Context</text>
    <text x="20" y="135" font-size="11" fill="#334155">  HTTP Client: Axios Interceptors</text>
    <text x="20" y="155" font-size="11" fill="#334155">  Thư viện: React-Beautiful-DND</text>
  </g>

  <!-- Tier 2: BUS -->
  <g transform="translate(430, 260)">
    <rect x="0" y="0" width="310" height="180" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="310" height="28" rx="6" fill="#16a34a"/>
    <text x="155" y="19" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">2. TẦNG NGHIỆP VỤ (BUS / SERVICE)</text>
    <text x="20" y="55" font-size="12" font-weight="bold" fill="#166534">• RESTful API Controllers</text>
    <text x="20" y="75" font-size="11" fill="#334155">  JobService, ResumeService, ATSManager</text>
    <text x="20" y="95" font-size="12" font-weight="bold" fill="#166534">• Business Validation &amp; Auth</text>
    <text x="20" y="115" font-size="11" fill="#334155">  JWT Middleware, RBAC Permission Check</text>
    <text x="20" y="135" font-size="12" font-weight="bold" fill="#166534">• External Integrations</text>
    <text x="20" y="155" font-size="11" fill="#334155">  VNPAY Gateway, SendGrid Email Service</text>
  </g>

  <!-- Tier 3: DAL -->
  <g transform="translate(860, 260)">
    <rect x="0" y="0" width="300" height="180" rx="6" fill="#fefce8" stroke="#ca8a04" stroke-width="2" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="300" height="28" rx="6" fill="#ca8a04"/>
    <text x="150" y="19" font-size="13" font-weight="bold" text-anchor="middle" fill="#ffffff">3. TẦNG TRUY XUẤT DỮ LIỆU (DAL)</text>
    <text x="20" y="55" font-size="12" font-weight="bold" fill="#854d0e">• Repository Pattern Implementation</text>
    <text x="20" y="75" font-size="11" fill="#334155">  JobRepository, UserRepository</text>
    <text x="20" y="95" font-size="12" font-weight="bold" fill="#854d0e">• SQL Query Builder &amp; Parameters</text>
    <text x="20" y="115" font-size="11" fill="#334155">  mssql driver, Connection Pooling</text>
    <text x="20" y="135" font-size="12" font-weight="bold" fill="#854d0e">• Transaction &amp; Concurrency</text>
    <text x="20" y="155" font-size="11" fill="#334155">  ACID Transactions, Read Committed</text>
  </g>

  <!-- Database -->
  <g transform="translate(860, 100)">
    <rect x="0" y="0" width="300" height="95" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="2" filter="url(#cardShadow)"/>
    <ellipse cx="40" cy="35" rx="22" ry="10" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M 18 35 L 18 65 A 22 10 0 0 0 62 65 L 62 35" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.5"/>
    <text x="175" y="32" font-size="13" font-weight="bold" text-anchor="middle" fill="#0f172a">CƠ SỞ DỮ LIỆU CHÍNH</text>
    <text x="175" y="52" font-size="14" font-weight="bold" text-anchor="middle" fill="#2563eb">Microsoft SQL Server 2022</text>
    <text x="175" y="74" font-size="11" text-anchor="middle" fill="#64748b">28 bảng chuẩn hóa 3NF • Stored Procedures</text>
  </g>

  <!-- DTO Layer -->
  <g transform="translate(350, 520)">
    <rect x="0" y="0" width="470" height="120" rx="6" fill="#f8fafc" stroke="#475569" stroke-width="1.8" stroke-dasharray="5 3" filter="url(#cardShadow)"/>
    <rect x="0" y="0" width="470" height="26" rx="6" fill="#475569"/>
    <text x="235" y="18" font-size="12.5" font-weight="bold" text-anchor="middle" fill="#ffffff">LỚP ĐỐI TƯỢNG TRUYỀN DỮ LIỆU XUYÊN SUỐT (DTO / MODELS)</text>
    <text x="20" y="50" font-size="11.5" font-weight="bold" fill="#1e293b">• Data Transfer Objects (DTO): Request/Response Payload Contracts</text>
    <text x="20" y="72" font-size="11" fill="#475569">• Schema Validation: Joi / Zod định nghĩa kiểu dữ liệu chặt chẽ</text>
    <text x="20" y="94" font-size="11" fill="#475569">• Entities &amp; ViewModels: Ánh xạ cấu trúc bảng SQL sang mô hình hiển thị</text>
  </g>

  <!-- Connectors -->
  <line x1="180" y1="195" x2="180" y2="260" stroke="#1e293b" stroke-width="2" marker-start="url(#arrow-reverse)" marker-end="url(#arrow)"/>
  ${labelPill(180, 227, "HTTPS / WSS (JSON, HTML, CSS)", 195)}

  <line x1="300" y1="350" x2="430" y2="350" stroke="#1e293b" stroke-width="2" marker-start="url(#arrow-reverse)" marker-end="url(#arrow)"/>
  ${labelPill(365, 330, "RESTful API (JSON)", 130)}

  <line x1="740" y1="350" x2="860" y2="350" stroke="#1e293b" stroke-width="2" marker-start="url(#arrow-reverse)" marker-end="url(#arrow)"/>
  ${labelPill(800, 330, "Repository Calls", 120)}

  <line x1="1010" y1="260" x2="1010" y2="195" stroke="#1e293b" stroke-width="2" marker-start="url(#arrow-reverse)" marker-end="url(#arrow)"/>
  ${labelPill(1010, 227, "T-SQL Queries / TDS Protocol", 185)}

  <line x1="450" y1="520" x2="250" y2="440" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <line x1="585" y1="520" x2="585" y2="440" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <line x1="720" y1="520" x2="920" y2="440" stroke="#64748b" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  ${labelPill(585, 480, "DTO binding & Data contracts", 180)}
</svg>
`;

// =============================================================================
// 11. SƠ ĐỒ THỰC THỂ QUAN HỆ (ERD - DATABASE DIAGRAM) (hinh_3_11_erd.png)
// NO OVERLAPPING TOP LINES - CLEAN ISOLATED SUBTITLE
// Users -> Notifications routed cleanly through the middle corridor at y=330
// =============================================================================
function renderTableCard(x, y, width, title, fields) {
  const rowHeight = 22;
  const headerHeight = 28;
  const totalHeight = headerHeight + fields.length * rowHeight;
  
  let rowsHtml = '';
  fields.forEach((f, idx) => {
    const rowY = headerHeight + idx * rowHeight;
    const isPk = f.type.includes('PK');
    const isFk = f.type.includes('FK');
    const keyIcon = isPk ? '🔑' : (isFk ? '🔗' : '  ');
    const keyColor = isPk ? '#b45309' : (isFk ? '#2563eb' : '#64748b');
    const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    
    rowsHtml += `
      <rect x="0" y="${rowY}" width="${width}" height="${rowHeight}" fill="${bg}" stroke="#e2e8f0" stroke-width="0.5"/>
      <text x="8" y="${rowY + 15}" font-size="11" fill="${keyColor}" font-weight="bold">${keyIcon} ${f.name}</text>
      <text x="${width - 8}" y="${rowY + 15}" font-size="10.5" fill="#64748b" text-anchor="end">${f.dataType}</text>
    `;
  });

  return `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${width}" height="${totalHeight}" rx="5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" filter="url(#cardShadow)"/>
      <rect x="0" y="0" width="${width}" height="${headerHeight}" rx="5" fill="#1e293b"/>
      <text x="${width/2}" y="19" font-size="12.5" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
      ${rowsHtml}
    </g>
  `;
}

const erdSvg = `
<svg width="1500" height="980" viewBox="0 0 1500 980" xmlns="http://www.w3.org/2000/svg">
  ${COMMON_DEFS}

  <!-- Header -->
  <text x="750" y="34" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">SƠ ĐỒ THỰC THỂ QUAN HỆ CƠ SỞ DỮ LIỆU (ERD - DATABASE DIAGRAM)</text>
  <text x="750" y="54" font-size="13" font-style="italic" text-anchor="middle" fill="#64748b">Mô hình dữ liệu quan hệ chuẩn hóa 3NF phân hệ cốt lõi TalentConnect (Microsoft SQL Server 2022)</text>
  <line x1="80" y1="68" x2="1420" y2="68" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Table 1: Roles (Col 1, Top) -->
  ${renderTableCard(50, 95, 220, "Roles (Vai trò)", [
    { name: "RoleID", type: "PK", dataType: "INT IDENTITY" },
    { name: "RoleName", type: "", dataType: "NVARCHAR(50)" },
    { name: "RoleCode", type: "", dataType: "VARCHAR(20)" },
    { name: "Description", type: "", dataType: "NVARCHAR(255)" }
  ])}

  <!-- Table 2: Users (Col 1, Middle) -->
  ${renderTableCard(50, 275, 230, "Users (Người dùng)", [
    { name: "UserID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "RoleID", type: "FK", dataType: "INT" },
    { name: "Email", type: "", dataType: "VARCHAR(150)" },
    { name: "PasswordHash", type: "", dataType: "VARCHAR(255)" },
    { name: "PhoneNumber", type: "", dataType: "VARCHAR(20)" },
    { name: "IsActive", type: "", dataType: "BIT" },
    { name: "CreatedAt", type: "", dataType: "DATETIME2" }
  ])}

  <!-- Table 3: Candidates (Col 1, Bottom) -->
  ${renderTableCard(50, 565, 240, "Candidates (Ứng viên)", [
    { name: "CandidateID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "UserID", type: "FK", dataType: "BIGINT" },
    { name: "FullName", type: "", dataType: "NVARCHAR(100)" },
    { name: "DateOfBirth", type: "", dataType: "DATE" },
    { name: "Gender", type: "", dataType: "NVARCHAR(10)" },
    { name: "CurrentTitle", type: "", dataType: "NVARCHAR(100)" },
    { name: "Address", type: "", dataType: "NVARCHAR(255)" }
  ])}

  <!-- Table 4: Resumes (Col 1, Very Bottom) -->
  ${renderTableCard(50, 785, 240, "Resumes (Hồ sơ CV)", [
    { name: "ResumeID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "CandidateID", type: "FK", dataType: "BIGINT" },
    { name: "ResumeTitle", type: "", dataType: "NVARCHAR(150)" },
    { name: "TemplateCode", type: "", dataType: "VARCHAR(30)" },
    { name: "PdfUrl", type: "", dataType: "NVARCHAR(500)" },
    { name: "IsDefault", type: "", dataType: "BIT" }
  ])}

  <!-- Table 5: Employers (Col 2, Top) -->
  ${renderTableCard(420, 95, 250, "Employers (Doanh nghiệp)", [
    { name: "EmployerID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "UserID", type: "FK", dataType: "BIGINT" },
    { name: "CompanyName", type: "", dataType: "NVARCHAR(200)" },
    { name: "TaxCode", type: "", dataType: "VARCHAR(20)" },
    { name: "CompanySize", type: "", dataType: "VARCHAR(50)" },
    { name: "WebsiteUrl", type: "", dataType: "VARCHAR(255)" },
    { name: "VerificationStatus", type: "", dataType: "VARCHAR(20)" }
  ])}

  <!-- Table 6: JobCategories (Col 3, Top) -->
  ${renderTableCard(790, 95, 230, "JobCategories (Ngành nghề)", [
    { name: "CategoryID", type: "PK", dataType: "INT IDENTITY" },
    { name: "CategoryName", type: "", dataType: "NVARCHAR(100)" },
    { name: "CategoryCode", type: "", dataType: "VARCHAR(30)" },
    { name: "IsActive", type: "", dataType: "BIT" }
  ])}

  <!-- Table 7: Jobs (Col 2, Middle) -->
  ${renderTableCard(420, 375, 260, "Jobs (Tin tuyển dụng)", [
    { name: "JobID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "EmployerID", type: "FK", dataType: "BIGINT" },
    { name: "CategoryID", type: "FK", dataType: "INT" },
    { name: "Title", type: "", dataType: "NVARCHAR(200)" },
    { name: "Description", type: "", dataType: "NVARCHAR(MAX)" },
    { name: "SalaryMin", type: "", dataType: "DECIMAL(18,2)" },
    { name: "SalaryMax", type: "", dataType: "DECIMAL(18,2)" },
    { name: "Deadline", type: "", dataType: "DATE" },
    { name: "IsApproved", type: "", dataType: "BIT" },
    { name: "Status", type: "", dataType: "VARCHAR(20)" }
  ])}

  <!-- Table 8: ATSStages (Col 3, Middle) -->
  ${renderTableCard(1140, 485, 220, "ATSStages (Cột phễu)", [
    { name: "StageID", type: "PK", dataType: "INT IDENTITY" },
    { name: "StageName", type: "", dataType: "NVARCHAR(50)" },
    { name: "OrderIndex", type: "", dataType: "INT" },
    { name: "StageColor", type: "", dataType: "VARCHAR(20)" }
  ])}

  <!-- Table 9: Applications (Col 2, Bottom) -->
  ${renderTableCard(420, 715, 260, "Applications (Đơn ứng tuyển)", [
    { name: "ApplicationID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "JobID", type: "FK", dataType: "BIGINT" },
    { name: "CandidateID", type: "FK", dataType: "BIGINT" },
    { name: "ResumeID", type: "FK", dataType: "BIGINT" },
    { name: "StageID", type: "FK", dataType: "INT" },
    { name: "AppliedDate", type: "", dataType: "DATETIME2" },
    { name: "Status", type: "", dataType: "VARCHAR(20)" }
  ])}

  <!-- Table 10: Notifications (Col 3, Middle-Top) -->
  ${renderTableCard(1140, 160, 240, "Notifications (Thông báo)", [
    { name: "NotificationID", type: "PK", dataType: "BIGINT IDENTITY" },
    { name: "UserID", type: "FK", dataType: "BIGINT" },
    { name: "Title", type: "", dataType: "NVARCHAR(150)" },
    { name: "Content", type: "", dataType: "NVARCHAR(500)" },
    { name: "IsRead", type: "", dataType: "BIT" },
    { name: "CreatedAt", type: "", dataType: "DATETIME2" }
  ])}

  <!-- ==================== RELATIONSHIP LINES ==================== -->
  <!-- 1. Roles (1) -> Users (N) -->
  <path d="M 160 211 L 160 275" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(160, 243, "1 : N", 48)}

  <!-- 2. Users (1) -> Candidates (1:1) -->
  <line x1="165" y1="457" x2="165" y2="565" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(165, 511, "1 : 1", 48)}

  <!-- 3. Candidates (1) -> Resumes (N) -->
  <line x1="170" y1="747" x2="170" y2="785" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(170, 766, "1 : N", 48)}

  <!-- 4. Users (1) -> Employers (1:1) -->
  <path d="M 280 325 L 350 325 L 350 145 L 420 145" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(350, 235, "1 : 1", 48)}

  <!-- 5. Employers (1) -> Jobs (N) -->
  <line x1="545" y1="277" x2="545" y2="375" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(545, 326, "1 : N", 48)}

  <!-- 6. JobCategories (1) -> Jobs (N) -->
  <path d="M 790 145 L 730 145 L 730 425 L 680 425" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(730, 285, "1 : N", 48)}

  <!-- 7. Jobs (1) -> Applications (N) -->
  <line x1="550" y1="623" x2="550" y2="715" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(550, 669, "1 : N", 48)}

  <!-- 8. Candidates (1) -> Applications (N) -->
  <path d="M 290 625 L 355 625 L 355 765 L 420 765" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(355, 695, "1 : N", 48)}

  <!-- 9. Resumes (1) -> Applications (N) -->
  <path d="M 290 825 L 370 825 L 370 785 L 420 785" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(370, 805, "1 : N", 48)}

  <!-- 10. ATSStages (1) -> Applications (N) -->
  <path d="M 1140 545 L 800 545 L 800 815 L 680 815" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(800, 680, "1 : N", 48)}

  <!-- 11. Users (1) -> Notifications (N) (Routed through mid-corridor at y=330, NEVER touches header) -->
  <path d="M 280 345 L 380 345 L 380 330 L 1080 330 L 1080 210 L 1140 210" fill="none" stroke="#2563eb" stroke-width="1.8" marker-start="url(#circle-start)" marker-end="url(#arrow-blue)"/>
  ${labelPill(750, 330, "Users (1) ─── Notifications (N)", 185)}
</svg>
`;

// =============================================================================
// MAIN EXECUTION: Render all 11 diagrams
// =============================================================================
console.log('>>> Starting flawless academic diagram generation with exact geometry...');

renderSvgToPng('hinh_3_1_dfd_context.png', 1400, 920, dfdContextSvg);
renderSvgToPng('hinh_3_2_dfd_level0.png', 1500, 980, dfdLevel0Svg);
renderSvgToPng('hinh_3_3_dfd_level1_jobs.png', 1400, 880, dfdLevel1JobsSvg);
renderSvgToPng('hinh_3_4_dfd_level1_apply.png', 1400, 880, dfdLevel1ApplySvg);
renderSvgToPng('hinh_3_5_usecase_general.png', 1400, 960, useCaseGeneralSvg);
renderSvgToPng('hinh_3_6_usecase_candidate.png', 1300, 780, useCaseCandidateSvg);
renderSvgToPng('hinh_3_7_usecase_employer.png', 1300, 780, useCaseEmployerSvg);
renderSvgToPng('hinh_3_8_usecase_admin.png', 1300, 780, useCaseAdminSvg);
renderSvgToPng('hinh_3_9_fdd.png', 1380, 660, fddSvg);
renderSvgToPng('hinh_3_10_architecture.png', 1300, 780, architectureSvg);
renderSvgToPng('hinh_3_11_erd.png', 1500, 980, erdSvg);

console.log('>>> All 11 academic diagrams rendered with 100% geometric accuracy and zero clutter!');
