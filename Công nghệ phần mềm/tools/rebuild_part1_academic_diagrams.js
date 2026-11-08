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
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: Arial, "Segoe UI", sans-serif;
  }
  svg { display: block; width: ${width}px; height: ${height}px; }
</style>
</head>
<body>
  ${svgContent}
</body>
</html>`;
  fs.writeFileSync(htmlPath, html, 'utf8');
  execSync(`"${edgePath}" --headless --disable-gpu --hide-scrollbars --screenshot="${pngPath}" --window-size=${width},${height} "${htmlPath}"`);
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  console.log(`Rendered: ${name} (${fs.statSync(pngPath).size} bytes)`);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const DEFS = `
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M 0 1.2 L 9.2 5 L 0 8.8 z" fill="#111827" />
    </marker>
    <marker id="open-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 1 1.5 L 9 5 L 1 8.5" fill="none" stroke="#111827" stroke-width="1.6" />
    </marker>
  </defs>
`;

// Helper for Gane & Sarson Process Box (rounded rect with header divider, matching img_03 & img_04)
function dfdProcess(x, y, w, h, code, lines) {
  const headerH = 34;
  const bodyCenterY = y + headerH + (h - headerH) / 2;
  const lineSpacing = 21;
  const startY = bodyCenterY - ((lines.length - 1) * lineSpacing) / 2;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#ffffff" stroke="#111827" stroke-width="2"/>
      <line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" stroke="#111827" stroke-width="1.5"/>
      <text x="${x + w / 2}" y="${y + 23}" font-size="16" font-weight="bold" fill="#111827" text-anchor="middle">${esc(code)}</text>
      ${lines.map((line, i) => `
        <text x="${x + w / 2}" y="${startY + i * lineSpacing}" font-size="15.5" font-weight="bold" fill="#111827" text-anchor="middle" dominant-baseline="central">${esc(line)}</text>
      `).join('')}
    </g>
  `;
}

// Helper for External Entity Box (sharp rectangle with bold centered text, matching img_03 & img_04)
function dfdEntity(x, y, w, h, lines) {
  const lineSpacing = 22;
  const centerY = y + h / 2;
  const startY = centerY - ((lines.length - 1) * lineSpacing) / 2;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#111827" stroke-width="2"/>
      ${lines.map((line, i) => `
        <text x="${x + w / 2}" y="${startY + i * lineSpacing}" font-size="16.5" font-weight="bold" fill="#111827" text-anchor="middle" dominant-baseline="central">${esc(line)}</text>
      `).join('')}
    </g>
  `;
}

// Helper for Open-Right Data Store (matching img_03 & img_04)
function dfdStore(x, y, w, h, code, lines) {
  const codeW = 54;
  const lineSpacing = 20;
  const centerY = y + h / 2;
  const startY = centerY - ((lines.length - 1) * lineSpacing) / 2;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="none"/>
      <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="#111827" stroke-width="2"/>
      <line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#111827" stroke-width="2"/>
      <line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#111827" stroke-width="2"/>
      <line x1="${x + codeW}" y1="${y}" x2="${x + codeW}" y2="${y + h}" stroke="#111827" stroke-width="1.6"/>
      <text x="${x + codeW / 2}" y="${centerY}" font-size="15.5" font-weight="bold" fill="#111827" text-anchor="middle" dominant-baseline="central">${esc(code)}</text>
      ${lines.map((line, i) => `
        <text x="${x + codeW + (w - codeW) / 2}" y="${startY + i * lineSpacing}" font-size="15" fill="#111827" text-anchor="middle" dominant-baseline="central">${esc(line)}</text>
      `).join('')}
    </g>
  `;
}

function multiText(x, y, lines, anchor = 'middle', fontSize = 14, lineSpacing = 19, weight = 'normal') {
  return lines.map((l, i) =>
    `<text x="${x}" y="${y + i * lineSpacing}" font-size="${fontSize}" font-weight="${weight}" fill="#111827" text-anchor="${anchor}">${esc(l)}</text>`
  ).join('\n');
}

// ============================================================================
// 1. hinh_2_3_incremental.png
// ============================================================================
const svg2_3_inc = `
<svg width="680" height="760" viewBox="0 0 680 760" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="680" height="760" fill="#ffffff"/>

  <!-- Box 1 -->
  <rect x="35" y="25" width="220" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
  <text x="145" y="61" font-size="15" fill="#111827" text-anchor="middle">Xác định yêu cầu</text>
  <line x1="145" y1="87" x2="145" y2="142" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Box 2 -->
  <rect x="80" y="142" width="220" height="65" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
  <text x="190" y="180" font-size="15" fill="#111827" text-anchor="middle">Phân tích</text>
  <line x1="190" y1="207" x2="190" y2="262" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Box 3 -->
  <rect x="135" y="262" width="220" height="65" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
  <text x="245" y="300" font-size="15" fill="#111827" text-anchor="middle">Thiết kế kiến trúc</text>
  <line x1="245" y1="327" x2="245" y2="382" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Box 4 -->
  <rect x="160" y="382" width="265" height="118" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
  <text x="292.5" y="426" font-size="15" fill="#111827" text-anchor="middle">Với mỗi build thực hiện: Thiết kế</text>
  <text x="292.5" y="448" font-size="15" fill="#111827" text-anchor="middle">chi tiết, lập trình, tích hợp, kiểm thử</text>
  <text x="292.5" y="470" font-size="15" fill="#111827" text-anchor="middle">rồi chuyển giao cho khách hàng</text>

  <!-- Self loop on Box 4 -->
  <path d="M 358 500 L 358 524 L 448 524 L 448 470 L 425 470" fill="none" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Box 4 to Box 5 -->
  <path d="M 292 500 L 292 585 L 380 585" fill="none" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Box 5: Bảo trì -->
  <rect x="380" y="552" width="215" height="66" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
  <text x="487.5" y="590" font-size="15" fill="#111827" text-anchor="middle">Bảo trì</text>

  <!-- Dashed loop from Bảo trì back to Thiết kế kiến trúc -->
  <path d="M 487.5 552 L 487.5 295 L 355 295" fill="none" stroke="#111827" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#arrow)"/>

  <!-- Box 5 to Box 6 -->
  <line x1="487.5" y1="618" x2="487.5" y2="665" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Box 6: Thôi sử dụng -->
  <rect x="430" y="665" width="205" height="66" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
  <text x="532.5" y="703" font-size="15" fill="#111827" text-anchor="middle">Thôi sử dụng</text>

  <!-- Legend -->
  <line x1="415" y1="135" x2="530" y2="135" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>
  <text x="560" y="140" font-size="16" fill="#111827">Phát triển</text>

  <line x1="415" y1="185" x2="530" y2="185" stroke="#111827" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#arrow)"/>
  <text x="560" y="190" font-size="16" fill="#111827">Bảo trì</text>
</svg>
`;

// ============================================================================
// 2. hinh_2_3_concurrent_incremental.png
// ============================================================================
const svg2_3_conc = `
<svg width="980" height="450" viewBox="0 0 980 450" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="980" height="450" fill="#ffffff"/>

  <!-- Row 1: Phần 1 -->
  <text x="45" y="68" font-size="16.5" fill="#111827">Phần 1</text>
  <rect x="145" y="42" width="132" height="42" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="211" y="68" font-size="15" fill="#111827" text-anchor="middle">Phân tích</text>

  <rect x="328" y="42" width="132" height="42" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="394" y="68" font-size="15" fill="#111827" text-anchor="middle">Thiết kế</text>

  <rect x="518" y="28" width="135" height="65" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="585.5" y="56" font-size="14.5" fill="#111827" text-anchor="middle">Cài đặt và tích</text>
  <text x="585.5" y="76" font-size="14.5" fill="#111827" text-anchor="middle">hợp</text>

  <line x1="653" y1="60" x2="730" y2="60" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="730" y="22" width="175" height="78" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="817.5" y="56" font-size="14.5" fill="#111827" text-anchor="middle">Chuyển giao cho khách</text>
  <text x="817.5" y="76" font-size="14.5" fill="#111827" text-anchor="middle">hàng</text>

  <!-- Row 2: Phần 2 -->
  <text x="68" y="168" font-size="16.5" fill="#111827">Phần 2</text>
  <rect x="168" y="142" width="132" height="42" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="234" y="168" font-size="15" fill="#111827" text-anchor="middle">Phân tích</text>

  <rect x="355" y="142" width="132" height="42" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="421" y="168" font-size="15" fill="#111827" text-anchor="middle">Thiết kế</text>

  <rect x="543" y="132" width="135" height="65" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="610.5" y="160" font-size="14.5" fill="#111827" text-anchor="middle">Cài đặt và tích</text>
  <text x="610.5" y="180" font-size="14.5" fill="#111827" text-anchor="middle">hợp</text>

  <line x1="678" y1="164" x2="758" y2="164" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="758" y="126" width="175" height="78" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="845.5" y="160" font-size="14.5" fill="#111827" text-anchor="middle">Chuyển giao cho khách</text>
  <text x="845.5" y="180" font-size="14.5" fill="#111827" text-anchor="middle">hàng</text>

  <!-- Row 3: Phần k -->
  <text x="118" y="274" font-size="16.5" fill="#111827">Phần k</text>
  <rect x="218" y="248" width="132" height="42" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="284" y="274" font-size="15" fill="#111827" text-anchor="middle">Phân tích</text>

  <rect x="412" y="248" width="132" height="42" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="478" y="274" font-size="15" fill="#111827" text-anchor="middle">Thiết kế</text>

  <rect x="598" y="238" width="135" height="65" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="665.5" y="266" font-size="14.5" fill="#111827" text-anchor="middle">Cài đặt và tích</text>
  <text x="665.5" y="286" font-size="14.5" fill="#111827" text-anchor="middle">hợp</text>

  <line x1="733" y1="270" x2="785" y2="270" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <rect x="785" y="232" width="175" height="78" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="872.5" y="266" font-size="14.5" fill="#111827" text-anchor="middle">Chuyển giao cho khách</text>
  <text x="872.5" y="286" font-size="14.5" fill="#111827" text-anchor="middle">hàng</text>

  <!-- Diagonal connectors -->
  <!-- Nhóm phân tích (short dashed) -->
  <line x1="212" y1="84" x2="228" y2="142" stroke="#111827" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <line x1="236" y1="184" x2="282" y2="248" stroke="#111827" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#arrow)"/>

  <!-- Nhóm thiết kế (dash-dot) -->
  <line x1="395" y1="84" x2="421" y2="142" stroke="#111827" stroke-width="1.6" stroke-dasharray="8 3 2 3" marker-end="url(#arrow)"/>
  <line x1="423" y1="184" x2="468" y2="248" stroke="#111827" stroke-width="1.6" stroke-dasharray="8 3 2 3" marker-end="url(#arrow)"/>

  <!-- Nhóm cài đặt và tích hợp (long dashed) -->
  <line x1="585" y1="93" x2="611" y2="132" stroke="#111827" stroke-width="1.6" stroke-dasharray="9 6" marker-end="url(#arrow)"/>
  <line x1="612" y1="197" x2="642" y2="238" stroke="#111827" stroke-width="1.6" stroke-dasharray="9 6" marker-end="url(#arrow)"/>

  <!-- Legend -->
  <line x1="320" y1="352" x2="468" y2="352" stroke="#111827" stroke-width="1.6" stroke-dasharray="4 3" marker-end="url(#arrow)"/>
  <text x="490" y="357" font-size="16" fill="#111827">Nhóm phân tích</text>

  <line x1="320" y1="390" x2="468" y2="390" stroke="#111827" stroke-width="1.6" stroke-dasharray="8 3 2 3" marker-end="url(#arrow)"/>
  <text x="490" y="395" font-size="16" fill="#111827">Nhóm thiết kế</text>

  <line x1="320" y1="428" x2="468" y2="428" stroke="#111827" stroke-width="1.6" stroke-dasharray="9 6" marker-end="url(#arrow)"/>
  <text x="490" y="433" font-size="16" fill="#111827">Nhóm cài đặt và tích hợp</text>
</svg>
`;

// ============================================================================
// 3. hinh_3_3_1_a_giai_doan_phan_mem.png
// ============================================================================
const svg3_3_1_a = `
<svg width="860" height="1120" viewBox="0 0 860 1120" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="860" height="1120" fill="#ffffff"/>

  <!-- Block 1: Giai đoạn phân tích -->
  <rect x="20" y="15" width="820" height="145" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="430" y="44" font-size="16" font-weight="bold" fill="#111827" text-anchor="middle">Giai đoạn phân tích</text>

  <rect x="42" y="75" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="108" y="102" font-size="13.5" fill="#111827" text-anchor="middle">Mô hình</text>
  <text x="108" y="120" font-size="13.5" fill="#111827" text-anchor="middle">thông tin</text>

  <rect x="256" y="75" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="322" y="102" font-size="13.5" fill="#111827" text-anchor="middle">Mô hình</text>
  <text x="322" y="120" font-size="13.5" fill="#111827" text-anchor="middle">chức năng</text>

  <rect x="472" y="75" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="538" y="102" font-size="13.5" fill="#111827" text-anchor="middle">Mô hình</text>
  <text x="538" y="120" font-size="13.5" fill="#111827" text-anchor="middle">hành vi</text>

  <rect x="686" y="75" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="752" y="111" font-size="13.5" fill="#111827" text-anchor="middle">Các yêu cầu khác</text>

  <line x1="430" y1="160" x2="430" y2="220" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Block 2: Giai đoạn thiết kế -->
  <rect x="125" y="220" width="610" height="270" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="430" y="250" font-size="16" font-weight="bold" fill="#111827" text-anchor="middle">Giai đoạn thiết kế</text>

  <circle cx="430" cy="312" r="42" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="430" y="317" font-size="13.5" fill="#111827" text-anchor="middle">Thiết kế</text>

  <path d="M 430 354 L 430 375 L 214 375 L 214 405" fill="none" stroke="#111827" stroke-width="1.4" marker-end="url(#arrow)"/>
  <path d="M 430 354 L 430 375 L 646 375 L 646 405" fill="none" stroke="#111827" stroke-width="1.4" marker-end="url(#arrow)"/>

  <rect x="148" y="405" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="214" y="441" font-size="13.5" fill="#111827" text-anchor="middle">Thiết kế dữ liệu</text>

  <rect x="580" y="405" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="646" y="432" font-size="13.5" fill="#111827" text-anchor="middle">Thiết kế thủ tục /</text>
  <text x="646" y="450" font-size="13.5" fill="#111827" text-anchor="middle">kiến trúc</text>

  <line x1="430" y1="490" x2="430" y2="550" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Block 3: Giai đoạn xây dựng -->
  <rect x="342" y="550" width="176" height="248" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="430" y="578" font-size="16" font-weight="bold" fill="#111827" text-anchor="middle">Giai đoạn xây dựng</text>

  <circle cx="430" cy="635" r="42" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="430" y="640" font-size="13.5" fill="#111827" text-anchor="middle">Lập trình</text>

  <line x1="430" y1="677" x2="430" y2="715" stroke="#111827" stroke-width="1.4" marker-end="url(#arrow)"/>

  <rect x="364" y="715" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="430" y="742" font-size="13.5" fill="#111827" text-anchor="middle">Module</text>
  <text x="430" y="760" font-size="13.5" fill="#111827" text-anchor="middle">chương trình</text>

  <line x1="430" y1="798" x2="430" y2="852" stroke="#111827" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- Block 4: Giai đoạn kiểm thử -->
  <rect x="342" y="852" width="176" height="248" fill="#ffffff" stroke="#111827" stroke-width="1.5"/>
  <text x="430" y="880" font-size="16" font-weight="bold" fill="#111827" text-anchor="middle">Giai đoạn kiểm thử</text>

  <circle cx="430" cy="937" r="42" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="430" y="942" font-size="13.5" fill="#111827" text-anchor="middle">Kiểm thử</text>

  <line x1="430" y1="979" x2="430" y2="1017" stroke="#111827" stroke-width="1.4" marker-end="url(#arrow)"/>

  <rect x="364" y="1017" width="132" height="62" fill="#ffffff" stroke="#111827" stroke-width="1.4"/>
  <text x="430" y="1044" font-size="13.5" fill="#111827" text-anchor="middle">Phần mềm đã</text>
  <text x="430" y="1062" font-size="13.5" fill="#111827" text-anchor="middle">tích hợp và kiểm thử</text>
</svg>
`;

// ============================================================================
// 4. hinh_3_1_dfd_context.png (Context DFD - Exact style of img_03_P68.png)
// ============================================================================
const svg3_1_context = `
<svg width="1420" height="740" viewBox="0 0 1420 740" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="1420" height="740" fill="#ffffff"/>

  <!-- Top External Entity: Ban quản trị hệ thống -->
  ${dfdEntity(540, 45, 340, 82, ['Ban quản trị hệ thống'])}

  <!-- Left External Entity: Người tìm việc -->
  ${dfdEntity(30, 355, 195, 115, ['Người tìm việc'])}

  <!-- Right External Entity: Nhà tuyển dụng -->
  ${dfdEntity(1195, 355, 195, 115, ['Nhà tuyển dụng'])}

  <!-- Center Process 0 -->
  ${dfdProcess(530, 320, 360, 185, '0', [
    'Hệ thống tuyển dụng',
    'và tìm kiếm việc làm',
    'TalentConnect'
  ])}

  <!-- Flows: Ban quản trị hệ thống <-> 0 -->
  <line x1="640" y1="127" x2="640" y2="320" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  ${multiText(620, 200, [
    'Quyết định xác thực doanh nghiệp,',
    'duyệt tin, quản lý tài khoản và danh mục'
  ], 'end', 14, 21)}

  <line x1="780" y1="320" x2="780" y2="127" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  ${multiText(800, 200, [
    'Hồ sơ doanh nghiệp và tin chờ duyệt,',
    'báo cáo thống kê vận hành'
  ], 'start', 14, 21)}

  <!-- Flows: Người tìm việc <-> 0 -->
  <line x1="225" y1="388" x2="530" y2="388" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  ${multiText(377, 345, [
    'Thông tin tài khoản, hồ sơ,',
    'tiêu chí tìm việc, đơn ứng tuyển'
  ], 'middle', 14, 21)}

  <line x1="530" y1="440" x2="225" y2="440" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  ${multiText(377, 468, [
    'Danh sách việc làm, việc làm gợi ý,',
    'trạng thái đơn, lịch phỏng vấn'
  ], 'middle', 14, 21)}

  <!-- Flows: Nhà tuyển dụng <-> 0 -->
  <line x1="1195" y1="388" x2="890" y2="388" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  ${multiText(1042, 345, [
    'Hồ sơ pháp lý doanh nghiệp, tin tuyển dụng,',
    'kết quả xử lý hồ sơ, lịch phỏng vấn'
  ], 'middle', 14, 21)}

  <line x1="890" y1="440" x2="1195" y2="440" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  ${multiText(1042, 468, [
    'Kết quả xác thực và duyệt tin, danh sách',
    'hồ sơ ứng tuyển, thống kê tuyển dụng'
  ], 'middle', 14, 21)}
</svg>
`;

// ============================================================================
// 5. hinh_3_2_dfd_level0.png (Level 0 DFD - Exact style of img_03 & img_04)
// 100% planar, zero crossings, all 5 processes + 3 actors + 4 stores have I/O
// ============================================================================
const svg3_2_level0 = `
<svg width="1620" height="1220" viewBox="0 0 1620 1220" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="1620" height="1220" fill="#ffffff"/>

  <!-- External Entities (Left side) -->
  ${dfdEntity(45, 45, 205, 88, ['Ban quản trị', 'hệ thống'])}
  ${dfdEntity(45, 315, 205, 95, ['Người tìm việc'])}
  ${dfdEntity(45, 795, 205, 95, ['Nhà tuyển dụng'])}

  <!-- 5 Core Processes (Center column x=530, w=330, h=125) -->
  ${dfdProcess(530, 45, 330, 125, '1.0', [
    'Quản lý tài khoản,',
    'định danh và phân quyền'
  ])}

  ${dfdProcess(530, 275, 330, 125, '2.0', [
    'Quản lý hồ sơ',
    'năng lực trực tuyến'
  ])}

  ${dfdProcess(530, 505, 330, 125, '4.0', [
    'Tìm kiếm, gợi ý',
    'và nộp đơn ứng tuyển'
  ])}

  ${dfdProcess(530, 755, 330, 125, '3.0', [
    'Quản lý tin tuyển dụng',
    'và kiểm duyệt'
  ])}

  ${dfdProcess(530, 995, 330, 125, '5.0', [
    'Quản lý phễu tuyển dụng',
    'và báo cáo điều hành'
  ])}

  <!-- 4 Data Stores (Right column x=1160, w=380, h=74) -->
  ${dfdStore(1160, 65, 380, 74, 'D1', ['Tài khoản và Phân quyền'])}
  ${dfdStore(1160, 295, 380, 74, 'D2', ['Hồ sơ và Ứng viên'])}
  ${dfdStore(1160, 635, 380, 74, 'D3', ['Doanh nghiệp và Tin tuyển dụng'])}
  ${dfdStore(1160, 995, 380, 74, 'D4', ['Ứng tuyển và Vận hành'])}

  <!-- ==================== LEFT FLOWS: ENTITIES <-> PROCESSES ==================== -->
  <!-- Ban quản trị <-> 1.0 -->
  <line x1="250" y1="74" x2="530" y2="74" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="390" y="64" font-size="13.5" fill="#111827" text-anchor="middle">Quản lý tài khoản, xác thực DN</text>

  <line x1="530" y1="110" x2="250" y2="110" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="390" y="128" font-size="13.5" fill="#111827" text-anchor="middle">Danh sách tài khoản, hồ sơ DN</text>

  <!-- Người tìm việc -> 1.0 (routed cleanly at x=280, well to the right of Ban quản trị) -->
  <path d="M 250 325 L 280 325 L 280 154 L 530 154" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="405" y="172" font-size="13.5" fill="#111827" text-anchor="middle">Thông tin đăng ký, đăng nhập</text>

  <!-- Người tìm việc <-> 2.0 -->
  <line x1="250" y1="352" x2="530" y2="352" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="390" y="342" font-size="13.5" fill="#111827" text-anchor="middle">Thông tin hồ sơ, kỹ năng, tệp CV</text>

  <line x1="530" y1="385" x2="250" y2="385" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="390" y="405" font-size="13.5" fill="#111827" text-anchor="middle">Bản xem trước và tệp hồ sơ PDF</text>

  <!-- Người tìm việc <-> 4.0 -->
  <path d="M 195 410 L 195 545 L 530 545" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="365" y="535" font-size="13.5" fill="#111827" text-anchor="middle">Tiêu chí tìm kiếm, đơn ứng tuyển</text>

  <path d="M 530 585 L 135 585 L 135 410" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="340" y="605" font-size="13.5" fill="#111827" text-anchor="middle">Danh sách việc làm, gợi ý, trạng thái đơn</text>

  <!-- Nhà tuyển dụng <-> 3.0 -->
  <line x1="250" y1="818" x2="530" y2="818" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="390" y="808" font-size="13.5" fill="#111827" text-anchor="middle">Hồ sơ pháp lý DN, tin tuyển dụng</text>

  <line x1="530" y1="855" x2="250" y2="855" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="390" y="875" font-size="13.5" fill="#111827" text-anchor="middle">Kết quả xác thực và kiểm duyệt tin</text>

  <!-- Nhà tuyển dụng <-> 5.0 -->
  <path d="M 195 890 L 195 1025 L 530 1025" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="365" y="1015" font-size="13.5" fill="#111827" text-anchor="middle">Kết quả xử lý hồ sơ, lịch phỏng vấn</text>

  <path d="M 530 1065 L 135 1065 L 135 890" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="340" y="1085" font-size="13.5" fill="#111827" text-anchor="middle">Danh sách hồ sơ ứng tuyển, thống kê</text>

  <!-- Ban quản trị -> 3.0 & 5.0 -> Ban quản trị (via clean outer-left corridor x=16 & x=30) -->
  <path d="M 45 98 L 30 98 L 30 775 L 530 775" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="300" y="765" font-size="13.5" fill="#111827" text-anchor="middle">Quyết định kiểm duyệt tin tuyển dụng</text>

  <path d="M 530 1102 L 16 1102 L 16 68 L 45 68" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="280" y="1122" font-size="13.5" fill="#111827" text-anchor="middle">Báo cáo thống kê vận hành toàn hệ thống</text>

  <!-- ==================== RIGHT FLOWS: PROCESSES <-> DATA STORES ==================== -->
  <!-- 1.0 <-> D1 -->
  <line x1="860" y1="88" x2="1160" y2="88" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1010" y="78" font-size="13.5" fill="#111827" text-anchor="middle">Thông tin tài khoản, phân quyền</text>

  <line x1="1160" y1="122" x2="860" y2="122" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1010" y="142" font-size="13.5" fill="#111827" text-anchor="middle">Dữ liệu định danh, quyền hạn</text>

  <!-- 2.0 <-> D2 -->
  <line x1="860" y1="318" x2="1160" y2="318" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1010" y="308" font-size="13.5" fill="#111827" text-anchor="middle">Hồ sơ, học vấn, kinh nghiệm, kỹ năng</text>

  <line x1="1160" y1="352" x2="860" y2="352" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1010" y="372" font-size="13.5" fill="#111827" text-anchor="middle">Dữ liệu bản hồ sơ đã lưu</text>

  <!-- D2 -> 4.0 (all y <= 522) -->
  <path d="M 1270 369 L 1270 522 L 860 522" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1065" y="512" font-size="13.5" fill="#111827" text-anchor="middle">Hồ sơ và kỹ năng ứng viên</text>

  <!-- 4.0 -> D4 (straight through y=562 between D2 and D3 to outer right corridor x=1580, ZERO crossings!) -->
  <path d="M 860 562 L 1580 562 L 1580 1032 L 1540 1032" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1220" y="552" font-size="13.5" fill="#111827" text-anchor="middle">Đơn ứng tuyển mới và thông báo nộp đơn</text>

  <!-- D3 -> 4.0 (all y >= 602) -->
  <path d="M 1270 635 L 1270 602 L 860 602" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1065" y="620" font-size="13.5" fill="#111827" text-anchor="middle">Tin đang mở và kỹ năng yêu cầu</text>

  <!-- 3.0 <-> D3 -->
  <path d="M 860 785 L 1230 785 L 1230 709" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1045" y="775" font-size="13.5" fill="#111827" text-anchor="middle">Hồ sơ DN, tin tuyển dụng, trạng thái</text>

  <path d="M 1350 709 L 1350 835 L 860 835" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1105" y="855" font-size="13.5" fill="#111827" text-anchor="middle">Thông tin DN và tin chờ duyệt</text>

  <!-- 5.0 <-> D4 -->
  <line x1="860" y1="1018" x2="1160" y2="1018" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1010" y="1008" font-size="13.5" fill="#111827" text-anchor="middle">Trạng thái phễu, lịch phỏng vấn</text>

  <line x1="1160" y1="1052" x2="860" y2="1052" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1010" y="1072" font-size="13.5" fill="#111827" text-anchor="middle">Danh sách đơn, số liệu vận hành</text>
</svg>
`;

// ============================================================================
// 6. hinh_3_3_dfd_level1_jobs.png (Level 1 DFD - Process 3.0)
// Exact style of img_04_P78.png: 2 actors, 3 sub-processes (3.1, 3.2, 3.3), 2 stores (D3, D4)
// ============================================================================
const svg3_3_level1_jobs = `
<svg width="1460" height="960" viewBox="0 0 1460 960" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="1460" height="960" fill="#ffffff"/>

  <!-- External Entities (Left column) -->
  ${dfdEntity(45, 95, 220, 110, ['Nhà tuyển dụng'])}
  ${dfdEntity(45, 425, 220, 110, ['Ban quản trị', 'hệ thống'])}

  <!-- Sub-processes (Center column x=480, w=340, h=130) -->
  ${dfdProcess(480, 80, 340, 130, '3.1', [
    'Tiếp nhận và soạn thảo',
    'tin tuyển dụng'
  ])}

  ${dfdProcess(480, 410, 340, 130, '3.2', [
    'Thẩm định và kiểm duyệt',
    'tin tuyển dụng'
  ])}

  ${dfdProcess(480, 740, 340, 130, '3.3', [
    'Kiểm tra hạn nhận hồ sơ',
    'và đóng tin quá hạn'
  ])}

  <!-- Data Stores (Right column x=1040, w=380, h=78) -->
  ${dfdStore(1040, 105, 380, 78, 'D3', ['Doanh nghiệp và', 'Tin tuyển dụng'])}
  ${dfdStore(1040, 585, 380, 78, 'D4', ['Ứng tuyển và', 'Vận hành'])}

  <!-- ==================== FLOWS FOR 3.1 ==================== -->
  <!-- Nhà tuyển dụng -> 3.1 -->
  <line x1="265" y1="125" x2="480" y2="125" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="372" y="113" font-size="14" fill="#111827" text-anchor="middle">Thông tin tin tuyển dụng</text>

  <!-- 3.1 -> Nhà tuyển dụng -->
  <line x1="480" y1="175" x2="265" y2="175" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="372" y="197" font-size="14" fill="#111827" text-anchor="middle">Xác nhận gửi duyệt</text>

  <!-- D3 -> 3.1 -->
  <line x1="1040" y1="125" x2="820" y2="125" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="930" y="113" font-size="14" fill="#111827" text-anchor="middle">Trạng thái xác thực doanh nghiệp</text>

  <!-- 3.1 -> D3 -->
  <line x1="820" y1="168" x2="1040" y2="168" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="930" y="190" font-size="14" fill="#111827" text-anchor="middle">Tin mới chờ duyệt</text>

  <!-- ==================== FLOWS FOR 3.2 ==================== -->
  <!-- D3 -> 3.2 (Read pending jobs) -->
  <path d="M 1140 183 L 1140 435 L 820 435" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="980" y="423" font-size="14" fill="#111827" text-anchor="middle">Danh sách tin chờ duyệt</text>

  <!-- 3.2 -> Ban quản trị hệ thống -->
  <line x1="480" y1="455" x2="265" y2="455" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="372" y="443" font-size="14" fill="#111827" text-anchor="middle">Nội dung tin chờ thẩm định</text>

  <!-- Ban quản trị hệ thống -> 3.2 -->
  <line x1="265" y1="500" x2="480" y2="500" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="372" y="522" font-size="14" fill="#111827" text-anchor="middle">Quyết định duyệt hoặc từ chối</text>

  <!-- 3.2 -> D3 (Update job status) -->
  <path d="M 820 480 L 1270 480 L 1270 183" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1045" y="470" font-size="14" fill="#111827" text-anchor="middle">Trạng thái tin tuyển dụng</text>

  <!-- 3.2 -> D4 (Write moderation notification) -->
  <path d="M 820 518 L 940 518 L 940 610 L 1040 610" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="945" y="565" font-size="14" fill="#111827" text-anchor="start">Thông báo kết quả duyệt</text>

  <!-- 3.2 -> Nhà tuyển dụng (Return moderation result) -->
  <path d="M 550 410 L 550 305 L 155 305 L 155 205" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="352" y="293" font-size="14" fill="#111827" text-anchor="middle">Thông báo kết quả kiểm duyệt</text>

  <!-- ==================== FLOWS FOR 3.3 ==================== -->
  <!-- D3 -> 3.3 (Read expiration date of open jobs) -->
  <path d="M 1390 183 L 1390 770 L 820 770" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1105" y="758" font-size="14" fill="#111827" text-anchor="middle">Hạn nhận hồ sơ của tin đang mở</text>

  <!-- 3.3 -> D3 (Update expired status) -->
  <path d="M 820 825 L 1435 825 L 1435 183" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="1125" y="847" font-size="14" fill="#111827" text-anchor="middle">Trạng thái tin hết hạn</text>

  <!-- 3.3 -> D4 (Write auto-close notification & log) -->
  <path d="M 730 740 L 730 645 L 1040 645" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="885" y="635" font-size="14" fill="#111827" text-anchor="middle">Thông báo đóng tin quá hạn</text>

  <!-- D4 -> 3.3 (Read notification/audit state so D4 has both read & write) -->
  <path d="M 1180 663 L 1180 715 L 650 715 L 650 740" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="915" y="705" font-size="14" fill="#111827" text-anchor="middle">Trạng thái nhật ký kiểm tra định kỳ</text>

  <!-- 3.3 -> Nhà tuyển dụng (Send expiration notice via outer-left corridor) -->
  <path d="M 480 805 L 22 805 L 22 150 L 45 150" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#arrow)"/>
  <text x="250" y="793" font-size="14" fill="#111827" text-anchor="middle">Thông báo đóng tin quá hạn</text>
</svg>
`;

// ============================================================================
// 7. Use Case Diagrams (hinh_3_6, hinh_3_7, hinh_3_8)
// Exact style of hinh_3_5_usecase_general.png (img_01_P23.png):
// Stick figure on left, system boundary box, serif font ("Times New Roman", serif),
// <<extend>> dashed arrow pointing LEFT (from extension UC to base UC),
// <<include>> dashed arrow pointing RIGHT (from base UC to included UC).
// ============================================================================
function buildSubsystemUseCaseSvg(subsystemTitle, actorName, rows) {
  // rows: [{ left: '...', right: '...', rel: 'extend' | 'include' }]
  const height = 820;
  const width = 1200;
  const boxX = 310, boxY = 45, boxW = 820, boxH = 730;
  const actorX = 120, actorY = 395;
  const leftCx = 575, rightCx = 955;
  const rxL = 135, ryL = 30;
  const rxR = 125, ryR = 28;
  const startY = 125;
  const stepY = (boxH - 130) / (rows.length - 1);

  let itemsSvg = '';
  rows.forEach((r, idx) => {
    const cy = Math.round(startY + idx * stepY);
    // Line from actor hand (actorX + 42, actorY - 15) to left edge of left oval (leftCx - rxL, cy)
    itemsSvg += `
      <line x1="${actorX + 42}" y1="${actorY - 15}" x2="${leftCx - rxL}" y2="${cy}" stroke="#111827" stroke-width="1.5"/>
      <ellipse cx="${leftCx}" cy="${cy}" rx="${rxL}" ry="${ryL}" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
      <text x="${leftCx}" y="${cy + 5}" font-family="'Times New Roman', Times, serif" font-size="15.5" fill="#111827" text-anchor="middle">${esc(r.left)}</text>
    `;
    if (r.right) {
      itemsSvg += `
        <ellipse cx="${rightCx}" cy="${cy}" rx="${rxR}" ry="${ryR}" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>
        <text x="${rightCx}" y="${cy + 5}" font-family="'Times New Roman', Times, serif" font-size="15.5" fill="#111827" text-anchor="middle">${esc(r.right)}</text>
      `;
      const x1 = leftCx + rxL;
      const x2 = rightCx - rxR;
      const midX = (x1 + x2) / 2;
      if (r.rel === 'extend') {
        // <<extend>> arrow points LEFT (from right oval x2 to left oval x1)
        itemsSvg += `
          <line x1="${x2}" y1="${cy}" x2="${x1 + 2}" y2="${cy}" stroke="#111827" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#open-arrow)"/>
          <text x="${midX}" y="${cy - 9}" font-family="'Times New Roman', Times, serif" font-size="14" fill="#111827" text-anchor="middle">&lt;&lt;extend&gt;&gt;</text>
        `;
      } else {
        // <<include>> arrow points RIGHT (from left oval x1 to right oval x2)
        itemsSvg += `
          <line x1="${x1}" y1="${cy}" x2="${x2 - 2}" y2="${cy}" stroke="#111827" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#open-arrow)"/>
          <text x="${midX}" y="${cy - 9}" font-family="'Times New Roman', Times, serif" font-size="14" fill="#111827" text-anchor="middle">&lt;&lt;include&gt;&gt;</text>
        `;
      }
    }
  });

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  ${DEFS}
  <rect width="${width}" height="${height}" fill="#ffffff"/>

  <!-- System Boundary -->
  <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="#ffffff" stroke="#111827" stroke-width="2"/>
  <text x="${boxX + 24}" y="${boxY + 34}" font-family="'Times New Roman', Times, serif" font-size="18" font-weight="bold" fill="#111827">${esc(subsystemTitle)}</text>

  <!-- Stick Figure Actor -->
  <g>
    <circle cx="${actorX}" cy="${actorY - 68}" r="19" fill="#ffffff" stroke="#111827" stroke-width="2"/>
    <line x1="${actorX}" y1="${actorY - 49}" x2="${actorX}" y2="${actorY + 12}" stroke="#111827" stroke-width="2"/>
    <line x1="${actorX - 34}" y1="${actorY - 26}" x2="${actorX + 34}" y2="${actorY - 26}" stroke="#111827" stroke-width="2"/>
    <line x1="${actorX}" y1="${actorY + 12}" x2="${actorX - 28}" y2="${actorY + 58}" stroke="#111827" stroke-width="2"/>
    <line x1="${actorX}" y1="${actorY + 12}" x2="${actorX + 28}" y2="${actorY + 58}" stroke="#111827" stroke-width="2"/>
    <text x="${actorX}" y="${actorY + 84}" font-family="'Times New Roman', Times, serif" font-size="18" font-weight="bold" fill="#111827" text-anchor="middle">${esc(actorName)}</text>
  </g>

  ${itemsSvg}
</svg>
  `;
}

const svg3_6_candidate = buildSubsystemUseCaseSvg('Phân hệ Người tìm việc', 'Người tìm việc', [
  { left: 'Đăng ký & Xác thực tài khoản' },
  { left: 'Biên soạn hồ sơ năng lực', right: 'Xuất tệp PDF', rel: 'extend' },
  { left: 'Tìm kiếm việc làm đa tiêu chí', right: 'Lưu việc làm quan tâm', rel: 'extend' },
  { left: 'Nộp đơn ứng tuyển', right: 'Đính kèm thư giới thiệu', rel: 'extend' },
  { left: 'Theo dõi trạng thái đơn ứng tuyển' },
  { left: 'Xem lịch phỏng vấn & Thông báo' }
]);

const svg3_7_employer = buildSubsystemUseCaseSvg('Phân hệ Nhà tuyển dụng', 'Nhà tuyển dụng', [
  { left: 'Cập nhật hồ sơ pháp lý doanh nghiệp' },
  { left: 'Đăng tin tuyển dụng mới', right: 'Thiết lập kỹ năng yêu cầu', rel: 'extend' },
  { left: 'Quản lý danh sách tin tuyển dụng' },
  { left: 'Quản lý bảng ứng viên theo giai đoạn', right: 'Chuyển giai đoạn ứng viên', rel: 'include' },
  { left: 'Lập lịch hẹn phỏng vấn' },
  { left: 'Đánh giá & Ghi chú nội bộ' },
  { left: 'Xem thống kê tuyển dụng' }
]);

const svg3_8_admin = buildSubsystemUseCaseSvg('Phân hệ Quản trị hệ thống', 'Ban quản trị hệ thống', [
  { left: 'Xác thực pháp lý doanh nghiệp' },
  { left: 'Kiểm duyệt tin tuyển dụng', right: 'Từ chối & Gửi lý do', rel: 'extend' },
  { left: 'Quản lý tài khoản & Phân quyền' },
  { left: 'Quản lý danh mục dùng chung' },
  { left: 'Xem thống kê vận hành' }
]);

// ============================================================================
// 8. hinh_3_9_fdd.png (Sơ đồ phân rã chức năng - 5 nhánh, KHÔNG CÓ MŨI TÊN)
// ============================================================================
const fddBranches = [
  {
    title: ['1. Quản lý tài khoản', '& Phân quyền'],
    children: [
      ['1.1. Đăng ký & Xác thực', 'tài khoản'],
      ['1.2. Quản lý phiên', 'đăng nhập'],
      ['1.3. Phân quyền theo', 'vai trò']
    ]
  },
  {
    title: ['2. Quản lý hồ sơ', 'trực tuyến'],
    children: [
      ['2.1. Biên soạn hồ sơ', 'năng lực'],
      ['2.2. Quản lý học vấn,', 'kinh nghiệm, kỹ năng'],
      ['2.3. Xem trước &', 'Xuất tệp PDF']
    ]
  },
  {
    title: ['3. Quản lý tin &', 'Kiểm duyệt'],
    children: [
      ['3.1. Xác thực pháp lý', 'doanh nghiệp'],
      ['3.2. Soạn thảo & Quản lý', 'tin tuyển dụng'],
      ['3.3. Kiểm duyệt', 'nội dung tin'],
      ['3.4. Tự động đóng tin', 'hết hạn']
    ]
  },
  {
    title: ['4. Tìm kiếm, gợi ý &', 'Ứng tuyển'],
    children: [
      ['4.1. Tìm kiếm & Lọc', 'việc làm đa tiêu chí'],
      ['4.2. Đối chiếu kỹ năng &', 'Gợi ý việc làm'],
      ['4.3. Kiểm tra & Nộp', 'đơn ứng tuyển'],
      ['4.4. Lưu việc làm', 'quan tâm']
    ]
  },
  {
    title: ['5. Xử lý ứng viên &', 'Điều hành'],
    children: [
      ['5.1. Quản lý bảng ứng', 'viên theo giai đoạn'],
      ['5.2. Đánh giá nội bộ &', 'Lập lịch phỏng vấn'],
      ['5.3. Thông báo trạng', 'thái hai chiều'],
      ['5.4. Thống kê vận hành', '& Nhật ký hệ thống']
    ]
  }
];

function buildFddSvg() {
  const width = 1560, height = 740;
  const rootW = 580, rootH = 68;
  const rootX = (width - rootW) / 2, rootY = 35;
  const busY = 142;

  const colW = 260;
  const gap = 38;
  const startX = (width - (5 * colW + 4 * gap)) / 2;

  let colsSvg = '';
  const colCenters = [];

  fddBranches.forEach((b, idx) => {
    const x = startX + idx * (colW + gap);
    const cx = x + colW / 2;
    colCenters.push(cx);
    const l1Y = 180, l1H = 64;

    // Vertical drop from busY to Level 1 box (NO ARROWHEAD!)
    colsSvg += `
      <line x1="${cx}" y1="${busY}" x2="${cx}" y2="${l1Y}" stroke="#111827" stroke-width="2"/>
      <rect x="${x}" y="${l1Y}" width="${colW}" height="${l1H}" fill="#eef2f6" stroke="#111827" stroke-width="2"/>
      <text x="${cx}" y="${l1Y + 26}" font-size="15" font-weight="bold" fill="#111827" text-anchor="middle">${esc(b.title[0])}</text>
      <text x="${cx}" y="${l1Y + 47}" font-size="15" font-weight="bold" fill="#111827" text-anchor="middle">${esc(b.title[1])}</text>
    `;

    // Vertical spine on left side of column for Level 2 children (NO ARROWHEADS!)
    const spineX = x + 18;
    const childX = x + 38;
    const childW = colW - 38;
    const childH = 62;
    const childStartY = 290;
    const childStepY = 102;
    const lastChildMidY = childStartY + (b.children.length - 1) * childStepY + childH / 2;

    colsSvg += `
      <line x1="${spineX}" y1="${l1Y + l1H}" x2="${spineX}" y2="${lastChildMidY}" stroke="#111827" stroke-width="1.8"/>
    `;

    b.children.forEach((ch, cIdx) => {
      const cyBox = childStartY + cIdx * childStepY;
      const midY = cyBox + childH / 2;
      colsSvg += `
        <line x1="${spineX}" y1="${midY}" x2="${childX}" y2="${midY}" stroke="#111827" stroke-width="1.8"/>
        <rect x="${childX}" y="${cyBox}" width="${childW}" height="${childH}" fill="#ffffff" stroke="#111827" stroke-width="1.7"/>
        <text x="${childX + childW / 2}" y="${cyBox + 26}" font-size="14" font-weight="bold" fill="#111827" text-anchor="middle">${esc(ch[0])}</text>
        <text x="${childX + childW / 2}" y="${cyBox + 46}" font-size="14" font-weight="bold" fill="#111827" text-anchor="middle">${esc(ch[1])}</text>
      `;
    });
  });

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>

  <!-- Root Box -->
  <rect x="${rootX}" y="${rootY}" width="${rootW}" height="${rootH}" fill="#eef2f6" stroke="#111827" stroke-width="2.2"/>
  <text x="${width / 2}" y="${rootY + 28}" font-size="16.5" font-weight="bold" fill="#111827" text-anchor="middle">HỆ THỐNG TUYỂN DỤNG VÀ TÌM KIẾM VIỆC LÀM</text>
  <text x="${width / 2}" y="${rootY + 51}" font-size="16.5" font-weight="bold" fill="#111827" text-anchor="middle">TALENTCONNECT</text>

  <!-- Root stem and horizontal bus (NO ARROWHEADS) -->
  <line x1="${width / 2}" y1="${rootY + rootH}" x2="${width / 2}" y2="${busY}" stroke="#111827" stroke-width="2"/>
  <line x1="${colCenters[0]}" y1="${busY}" x2="${colCenters[colCenters.length - 1]}" y2="${busY}" stroke="#111827" stroke-width="2"/>

  ${colsSvg}
</svg>
  `;
}

// ============================================================================
// 9. hinh_3_11_erd.png (Crow's Foot ERD - Exact style of img_05_P91 & img_06_P101)
// All 19 core tables across the 6 database zones, 100% matching Data Dictionary
// ============================================================================
function erdTable(x, y, w, title, rows) {
  const headerH = 30;
  const rowH = 21;
  const h = headerH + rows.length * rowH + 8;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#111827" stroke-width="1.8"/>
      <rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="#eef2f6" stroke="#111827" stroke-width="1.6"/>
      <text x="${x + w / 2}" y="${y + 20}" font-size="14" font-weight="bold" fill="#111827" text-anchor="middle">${esc(title)}</text>
      ${rows.map((r, i) => `
        <text x="${x + 12}" y="${y + headerH + 17 + i * rowH}" font-size="13" fill="#111827">${esc(r)}</text>
      `).join('')}
    </g>
  `;
}

// Draw Crow's Foot dock symbol at (x, y) where `side` is which side of the table it attaches to:
// 'left' (line comes from left into x,y), 'right' (line comes from right into x,y),
// 'top' (line comes from top into x,y), 'bottom' (line comes from bottom into x,y).
// type: '11' (||), '01' (o|), '1N' (|{), '0N' (o{)
function crowDock(x, y, side, type) {
  const dir = {
    left: { dx: -1, dy: 0, px: 0, py: 1 },
    right: { dx: 1, dy: 0, px: 0, py: 1 },
    top: { dx: 0, dy: -1, px: 1, py: 0 },
    bottom: { dx: 0, dy: 1, px: 1, py: 0 }
  }[side];

  const s = 6.5;
  let out = '';

  const tickAt = (dist) => {
    const cx = x + dir.dx * dist;
    const cy = y + dir.dy * dist;
    return `<line x1="${cx - dir.px * s}" y1="${cy - dir.py * s}" x2="${cx + dir.px * s}" y2="${cy + dir.py * s}" stroke="#111827" stroke-width="1.7"/>`;
  };

  const circleAt = (dist) => {
    const cx = x + dir.dx * dist;
    const cy = y + dir.dy * dist;
    return `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#ffffff" stroke="#111827" stroke-width="1.6"/>`;
  };

  const footAt = (dist) => {
    const tipX = x + dir.dx * dist;
    const tipY = y + dir.dy * dist;
    const b1X = x - dir.px * s;
    const b1Y = y - dir.py * s;
    const b2X = x + dir.px * s;
    const b2Y = y + dir.py * s;
    return `
      <line x1="${tipX}" y1="${tipY}" x2="${b1X}" y2="${b1Y}" stroke="#111827" stroke-width="1.6"/>
      <line x1="${tipX}" y1="${tipY}" x2="${b2X}" y2="${b2Y}" stroke="#111827" stroke-width="1.6"/>
    `;
  };

  if (type === '11') {
    out += tickAt(6) + tickAt(12);
  } else if (type === '01') {
    out += tickAt(6) + circleAt(14);
  } else if (type === '1N') {
    out += footAt(12) + tickAt(14);
  } else if (type === '0N') {
    out += footAt(12) + circleAt(17);
  }
  return out;
}

function crowRel(pts, startSide, startType, endSide, endType) {
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const p0 = pts[0];
  const pN = pts[pts.length - 1];
  return `
    <path d="${d}" fill="none" stroke="#111827" stroke-width="1.7"/>
    ${crowDock(p0[0], p0[1], startSide, startType)}
    ${crowDock(pN[0], pN[1], endSide, endType)}
  `;
}

// Layout 19 entities across 5 clean columns on a 1840 x 1220 canvas:
// Col 1 (x=35, w=265): Roles, Users, UserRoles, Notifications
// Col 2 (x=385, w=285): Candidates, CandidateEducations, CandidateExperiences, CandidateSkills, Resumes
// Col 3 (x=765, w=280): Categories, Skills, SavedJobs, Applications, ApplicationHistories, Interviews
// Col 4 (x=1140, w=285): Employers, CompanyLocations, Jobs, JobSkills
const svg3_11_erd = `
<svg width="1500" height="1220" viewBox="0 0 1500 1220" xmlns="http://www.w3.org/2000/svg">
  <rect width="1500" height="1220" fill="#ffffff"/>

  <!-- ==================== COLUMN 1: AUTH & NOTIFICATIONS (x=35, w=265) ==================== -->
  <!-- Roles: y=35..148 -->
  ${erdTable(35, 35, 265, 'Roles (Vai trò)', [
    'PK  RoleID',
    '    RoleCode  UNIQUE',
    '    RoleName',
    '    Description'
  ])}

  <!-- UserRoles: y=195..308 -->
  ${erdTable(35, 195, 265, 'UserRoles (Phân quyền)', [
    'PK  UserRoleID',
    'FK  UserID',
    'FK  RoleID',
    '    AssignedAt'
  ])}

  <!-- Users: y=365..520 -->
  ${erdTable(35, 365, 265, 'Users (Tài khoản)', [
    'PK  UserID',
    '    Email  UNIQUE',
    '    PasswordHash',
    '    PhoneNumber',
    '    AccountStatus',
    '    CreatedAt, UpdatedAt'
  ])}

  <!-- Notifications: y=600..755 -->
  ${erdTable(35, 600, 265, 'Notifications (Thông báo)', [
    'PK  NotificationID',
    'FK  UserID',
    '    NotificationType',
    '    Title, Content',
    '    ReferenceID, IsRead',
    '    CreatedAt'
  ])}

  <!-- ==================== COLUMN 2: CANDIDATE & RESUME (x=385, w=285) ==================== -->
  <!-- Candidates: y=35..190 -->
  ${erdTable(385, 35, 285, 'Candidates (Ứng viên)', [
    'PK  CandidateID',
    'FK  UserID  UNIQUE',
    '    FullName, Headline',
    '    DateOfBirth, Gender',
    '    Address, City',
    '    CareerObjective'
  ])}

  <!-- CandidateEducations: y=240..374 -->
  ${erdTable(385, 240, 285, 'CandidateEducations (Học vấn)', [
    'PK  EducationID',
    'FK  CandidateID',
    '    InstitutionName, Major',
    '    Degree, StartDate, EndDate',
    '    Description'
  ])}

  <!-- CandidateExperiences: y=420..554 -->
  ${erdTable(385, 420, 285, 'CandidateExperiences (Kinh nghiệm)', [
    'PK  ExperienceID',
    'FK  CandidateID',
    '    CompanyName, PositionTitle',
    '    StartDate, EndDate',
    '    WorkDescription'
  ])}

  <!-- CandidateSkills: y=600..713 -->
  ${erdTable(385, 600, 285, 'CandidateSkills (Kỹ năng UV)', [
    'PK  CandidateSkillID',
    'FK  CandidateID',
    'FK  SkillID',
    '    ProficiencyLevel'
  ])}

  <!-- Resumes: y=775..930 -->
  ${erdTable(385, 775, 285, 'Resumes (Bản hồ sơ)', [
    'PK  ResumeID',
    'FK  CandidateID',
    '    ResumeTitle',
    '    ResumeJSON, FileURL',
    '    TemplateID, ThemeColor',
    '    IsDefault, UpdatedAt'
  ])}

  <!-- ==================== COLUMN 3: TAXONOMY & APPLICATIONS (x=765, w=285) ==================== -->
  <!-- Categories: y=35..148 -->
  ${erdTable(765, 35, 285, 'Categories (Ngành nghề)', [
    'PK  CategoryID',
    '    CategoryName',
    '    Slug  UNIQUE',
    '    IsActive'
  ])}

  <!-- Skills: y=200..313 -->
  ${erdTable(765, 200, 285, 'Skills (Danh mục kỹ năng)', [
    'PK  SkillID',
    'FK  CategoryID',
    '    SkillName  UNIQUE',
    '    IsActive'
  ])}

  <!-- SavedJobs: y=375..488 -->
  ${erdTable(765, 375, 285, 'SavedJobs (Việc làm đã lưu)', [
    'PK  SavedJobID',
    'FK  CandidateID',
    'FK  JobID',
    '    SavedAt'
  ])}

  <!-- Applications: y=555..752 -->
  ${erdTable(765, 555, 285, 'Applications (Đơn ứng tuyển)', [
    'PK  ApplicationID',
    'FK  JobID',
    'FK  CandidateID',
    'FK  ResumeID',
    '    CoverLetter',
    '    ApplicationStatus, MatchScore',
    '    InternalRating',
    '    AppliedAt, UpdatedAt'
  ])}

  <!-- ApplicationHistories: y=810..965 -->
  ${erdTable(765, 810, 285, 'ApplicationHistories (Lịch sử đơn)', [
    'PK  HistoryID',
    'FK  ApplicationID',
    'FK  ChangedByUserID',
    '    FromStatus, ToStatus',
    '    ChangeNote',
    '    ChangedAt'
  ])}

  <!-- Interviews: y=1015..1170 -->
  ${erdTable(765, 1015, 285, 'Interviews (Lịch phỏng vấn)', [
    'PK  InterviewID',
    'FK  ApplicationID',
    '    RoundNumber, InterviewDate',
    '    InterviewType, LocationOrLink',
    '    InterviewerNote, ResultStatus',
    '    CreatedAt'
  ])}

  <!-- ==================== COLUMN 4: EMPLOYERS & JOBS (x=1145, w=320) ==================== -->
  <!-- Employers: y=35..190 -->
  ${erdTable(1145, 35, 320, 'Employers (Doanh nghiệp)', [
    'PK  EmployerID',
    'FK  UserID  UNIQUE',
    '    CompanyName, TaxCode',
    '    BusinessLicenseURL',
    '    CompanySize, WebsiteURL',
    '    VerificationStatus'
  ])}

  <!-- CompanyLocations: y=245..379 -->
  ${erdTable(1145, 245, 320, 'CompanyLocations (Địa điểm DN)', [
    'PK  LocationID',
    'FK  EmployerID',
    '    BranchName, AddressDetail',
    '    City, District',
    '    IsHeadquarter'
  ])}

  <!-- Jobs: y=440..658 -->
  ${erdTable(1145, 440, 320, 'Jobs (Tin tuyển dụng)', [
    'PK  JobID',
    'FK  EmployerID',
    'FK  CategoryID',
    'FK  LocationID  NULL',
    '    JobTitle, Description',
    '    Requirements, Benefits',
    '    SalaryMin, SalaryMax',
    '    ExperienceLevel, JobType',
    '    JobStatus, ExpirationDate'
  ])}

  <!-- JobSkills: y=735..848 -->
  ${erdTable(1145, 735, 320, 'JobSkills (Kỹ năng yêu cầu)', [
    'PK  JobSkillID',
    'FK  JobID',
    'FK  SkillID',
    '    IsRequired, PriorityWeight'
  ])}

  <!-- ==================== CROW'S FOOT RELATIONSHIPS ==================== -->
  <!-- Roles ||--o{ UserRoles -->
  ${crowRel([[167, 148], [167, 195]], 'bottom', '11', 'top', '0N')}

  <!-- Users ||--o{ UserRoles -->
  ${crowRel([[167, 365], [167, 308]], 'top', '11', 'bottom', '0N')}

  <!-- Users ||--o{ Notifications -->
  ${crowRel([[167, 520], [167, 600]], 'bottom', '11', 'top', '0N')}

  <!-- Users ||--o| Candidates (via corridor x=316) -->
  ${crowRel([[300, 415], [316, 415], [316, 75], [385, 75]], 'right', '11', 'left', '01')}

  <!-- Users ||--o| Employers (via top corridor y=15) -->
  ${crowRel([[300, 390], [332, 390], [332, 15], [1305, 15], [1305, 35]], 'right', '11', 'top', '01')}

  <!-- Candidates ||--o{ CandidateEducations (direct vertical center) -->
  ${crowRel([[527, 190], [527, 240]], 'bottom', '11', 'top', '0N')}

  <!-- Candidates ||--o{ CandidateExperiences -->
  ${crowRel([[385, 115], [366, 115], [366, 480], [385, 480]], 'left', '11', 'left', '0N')}

  <!-- Candidates ||--o{ CandidateSkills -->
  ${crowRel([[385, 145], [352, 145], [352, 650], [385, 650]], 'left', '11', 'left', '0N')}

  <!-- Candidates ||--o{ Resumes -->
  ${crowRel([[385, 175], [338, 175], [338, 845], [385, 845]], 'left', '11', 'left', '0N')}

  <!-- Candidates ||--o{ SavedJobs (via corridor x=715) -->
  ${crowRel([[670, 95], [715, 95], [715, 425], [765, 425]], 'right', '11', 'left', '0N')}

  <!-- Candidates ||--o{ Applications (via corridor x=700) -->
  ${crowRel([[670, 135], [700, 135], [700, 615], [765, 615]], 'right', '11', 'left', '0N')}

  <!-- Resumes ||--o{ Applications -->
  ${crowRel([[670, 845], [725, 845], [725, 695], [765, 695]], 'right', '11', 'left', '0N')}

  <!-- Categories ||--o{ Skills -->
  ${crowRel([[907, 148], [907, 200]], 'bottom', '11', 'top', '0N')}

  <!-- Categories ||--o{ Jobs -->
  ${crowRel([[1050, 90], [1095, 90], [1095, 495], [1145, 495]], 'right', '11', 'left', '0N')}

  <!-- Skills ||--o{ CandidateSkills -->
  ${crowRel([[765, 260], [735, 260], [735, 655], [670, 655]], 'left', '11', 'right', '0N')}

  <!-- Skills ||--o{ JobSkills -->
  ${crowRel([[1050, 260], [1080, 260], [1080, 790], [1145, 790]], 'right', '11', 'left', '0N')}

  <!-- Employers ||--o{ CompanyLocations -->
  ${crowRel([[1305, 190], [1305, 245]], 'bottom', '11', 'top', '0N')}

  <!-- CompanyLocations o|--o{ Jobs -->
  ${crowRel([[1305, 379], [1305, 440]], 'bottom', '01', 'top', '0N')}

  <!-- Employers ||--o{ Jobs (via right edge x=1485) -->
  ${crowRel([[1465, 115], [1485, 115], [1485, 535], [1465, 535]], 'right', '11', 'right', '0N')}

  <!-- Jobs ||--o{ JobSkills -->
  ${crowRel([[1305, 658], [1305, 735]], 'bottom', '11', 'top', '0N')}

  <!-- Jobs ||--o{ SavedJobs -->
  ${crowRel([[1145, 465], [1112, 465], [1112, 430], [1050, 430]], 'left', '11', 'right', '0N')}

  <!-- Jobs ||--o{ Applications -->
  ${crowRel([[1145, 615], [1050, 615]], 'left', '11', 'right', '0N')}

  <!-- Applications ||--o{ ApplicationHistories -->
  ${crowRel([[907, 752], [907, 810]], 'bottom', '11', 'top', '0N')}

  <!-- Applications ||--o{ Interviews (via right corridor of col 3 x=1068) -->
  ${crowRel([[1050, 710], [1068, 710], [1068, 1085], [1050, 1085]], 'right', '11', 'right', '0N')}
</svg>
`;

console.log('>>> Rendering Part 1: Group 1 & Group 2 Academic Diagrams...');
renderSvgToPng('hinh_2_3_incremental.png', 680, 760, svg2_3_inc);
renderSvgToPng('hinh_2_3_concurrent_incremental.png', 980, 450, svg2_3_conc);
renderSvgToPng('hinh_3_3_1_a_giai_doan_phan_mem.png', 860, 1120, svg3_3_1_a);
renderSvgToPng('hinh_3_1_dfd_context.png', 1420, 740, svg3_1_context);
renderSvgToPng('hinh_3_2_dfd_level0.png', 1620, 1220, svg3_2_level0);
renderSvgToPng('hinh_3_3_dfd_level1_jobs.png', 1460, 960, svg3_3_level1_jobs);
renderSvgToPng('hinh_3_6_usecase_candidate.png', 1200, 820, svg3_6_candidate);
renderSvgToPng('hinh_3_7_usecase_employer.png', 1200, 820, svg3_7_employer);
renderSvgToPng('hinh_3_8_usecase_admin.png', 1200, 820, svg3_8_admin);
renderSvgToPng('hinh_3_9_fdd.png', 1560, 740, buildFddSvg());
renderSvgToPng('hinh_3_11_erd.png', 1500, 1220, svg3_11_erd);
console.log('>>> Part 1 complete!');
