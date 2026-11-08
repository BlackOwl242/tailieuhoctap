const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const edgeExe = edgePaths.find(p => fs.existsSync(p));
if (!edgeExe) {
  console.error('Microsoft Edge not found!');
  process.exit(1);
}

const outDirs = [
  'C:\\Users\\legen\\.gemini\\antigravity\\brain\\5e0bafcb-0923-43e5-b661-9e5ebda749fe\\assets\\diagrams',
  path.join(__dirname, 'assets', 'diagrams')
];
for (const d of outDirs) {
  fs.mkdirSync(d, { recursive: true });
}

const logoSrc = 'C:\\Users\\legen\\OneDrive\\Documents\\GitHub\\tailieuhoctap\\Công nghệ phần mềm\\assets\\diagrams\\logo_hoc_vien.png';
if (fs.existsSync(logoSrc)) {
  for (const d of outDirs) {
    fs.copyFileSync(logoSrc, path.join(d, 'logo_hoc_vien.png'));
  }
}

function esc(s) {
  return String(s ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapSvg(w, h, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <style>
      text { font-family: 'Times New Roman', Times, serif; fill: #000000; }
      .t-title { font-size: 16px; font-weight: bold; }
      .t-sub { font-size: 13.5px; font-weight: bold; }
      .t-norm { font-size: 13px; }
      .t-italic { font-size: 12px; font-style: italic; }
      .t-small { font-size: 11.5px; }
      .box { fill: #ffffff; stroke: #000000; stroke-width: 1.4; }
      .box-header { fill: #f1f5f9; stroke: #000000; stroke-width: 1.4; }
      .line-solid { stroke: #000000; stroke-width: 1.3; fill: none; }
      .line-dashed { stroke: #000000; stroke-width: 1.2; stroke-dasharray: 6,4; fill: none; }
      .lifeline { stroke: #000000; stroke-width: 1.1; stroke-dasharray: 5,5; fill: none; }
      .activation { fill: #ffffff; stroke: #000000; stroke-width: 1.2; }
    </style>
    <marker id="arrow-filled" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#000000" stroke="#000000" stroke-width="0.8"/>
    </marker>
    <marker id="arrow-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 1 1.5 L 9 5 L 1 8.5" fill="none" stroke="#000000" stroke-width="1.3"/>
    </marker>
    <marker id="arrow-inherit" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
      <path d="M 1 1.5 L 11 6 L 1 10.5 z" fill="#ffffff" stroke="#000000" stroke-width="1.3"/>
    </marker>
    <marker id="diamond-filled" viewBox="0 0 14 10" refX="1" refY="5" markerWidth="12" markerHeight="9" orient="auto">
      <polygon points="1,5 7,1.5 13,5 7,8.5" fill="#000000" stroke="#000000" stroke-width="1"/>
    </marker>
    <marker id="diamond-filled-end" viewBox="0 0 14 10" refX="13" refY="5" markerWidth="12" markerHeight="9" orient="auto">
      <polygon points="1,5 7,1.5 13,5 7,8.5" fill="#000000" stroke="#000000" stroke-width="1"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>
  ${body}
</svg>`;
}

function drawActor(cx, cy, labelLines, scale = 1.0) {
  const r = 9 * scale;
  const bodyTop = cy - 16 * scale;
  const bodyBot = cy + 6 * scale;
  const armY = cy - 8 * scale;
  const legBot = cy + 24 * scale;
  let s = `<g>
    <circle cx="${cx}" cy="${bodyTop - r}" r="${r}" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <line x1="${cx}" y1="${bodyTop}" x2="${cx}" y2="${bodyBot}" stroke="#000000" stroke-width="1.5"/>
    <line x1="${cx - 14 * scale}" y1="${armY}" x2="${cx + 14 * scale}" y2="${armY}" stroke="#000000" stroke-width="1.5"/>
    <line x1="${cx}" y1="${bodyBot}" x2="${cx - 12 * scale}" y2="${legBot}" stroke="#000000" stroke-width="1.5"/>
    <line x1="${cx}" y1="${bodyBot}" x2="${cx + 12 * scale}" y2="${legBot}" stroke="#000000" stroke-width="1.5"/>`;
  const lines = Array.isArray(labelLines) ? labelLines : [labelLines];
  lines.forEach((l, i) => {
    s += `<text x="${cx}" y="${legBot + 16 + i * 15}" text-anchor="middle" class="t-sub" font-size="13">${esc(l)}</text>`;
  });
  s += `</g>`;
  return s;
}

function drawUseCase(cx, cy, rx, ry, labelLines) {
  const lines = Array.isArray(labelLines) ? labelLines : [labelLines];
  const startY = cy - ((lines.length - 1) * 15) / 2 + 4;
  let s = `<g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>`;
  lines.forEach((l, i) => {
    s += `<text x="${cx}" y="${startY + i * 15}" text-anchor="middle" class="t-norm">${esc(l)}</text>`;
  });
  s += `</g>`;
  return s;
}

function drawStereotypeParticipant(cx, topY, type, labelLines) {
  let icon = '';
  const icY = topY + 18;
  if (type === 'actor') {
    icon = `<circle cx="${cx}" cy="${icY - 9}" r="6.5" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
      <line x1="${cx}" y1="${icY - 2.5}" x2="${cx}" y2="${icY + 9}" stroke="#000000" stroke-width="1.4"/>
      <line x1="${cx - 9}" y1="${icY + 2}" x2="${cx + 9}" y2="${icY + 2}" stroke="#000000" stroke-width="1.4"/>
      <line x1="${cx}" y1="${icY + 9}" x2="${cx - 7}" y2="${icY + 19}" stroke="#000000" stroke-width="1.4"/>
      <line x1="${cx}" y1="${icY + 9}" x2="${cx + 7}" y2="${icY + 19}" stroke="#000000" stroke-width="1.4"/>`;
  } else if (type === 'boundary') {
    icon = `<line x1="${cx - 15}" y1="${icY - 10}" x2="${cx - 15}" y2="${icY + 14}" stroke="#000000" stroke-width="1.5"/>
      <line x1="${cx - 15}" y1="${icY + 2}" x2="${cx - 7}" y2="${icY + 2}" stroke="#000000" stroke-width="1.5"/>
      <circle cx="${cx + 4}" cy="${icY + 2}" r="11" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>`;
  } else if (type === 'control') {
    icon = `<circle cx="${cx}" cy="${icY + 3}" r="11" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
      <polygon points="${cx - 2},${icY - 8} ${cx + 5},${icY - 12} ${cx + 3},${icY - 4}" fill="#000000"/>`;
  } else if (type === 'entity') {
    icon = `<circle cx="${cx}" cy="${icY + 1}" r="11" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
      <line x1="${cx - 12}" y1="${icY + 13}" x2="${cx + 12}" y2="${icY + 13}" stroke="#000000" stroke-width="1.5"/>`;
  } else if (type === 'db') {
    icon = `<path d="M ${cx - 14} ${icY - 5} L ${cx - 14} ${icY + 11} A 14 4.5 0 0 0 ${cx + 14} ${icY + 11} L ${cx + 14} ${icY - 5}" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
      <ellipse cx="${cx}" cy="${icY - 5}" rx="14" ry="4.5" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>`;
  }
  const lines = Array.isArray(labelLines) ? labelLines : [labelLines];
  let textSvg = '';
  lines.forEach((l, i) => {
    textSvg += `<text x="${cx}" y="${topY + 52 + i * 14}" text-anchor="middle" class="t-sub" font-size="12.5">${esc(l)}</text>`;
  });
  return `<g>${icon}${textSvg}</g>`;
}

function drawClassBox(x, y, w, title, stereotype, attrs, methods) {
  const headerH = stereotype ? 38 : 26;
  const attrH = Math.max(22, attrs.length * 16 + 8);
  const methH = Math.max(22, methods.length * 16 + 8);
  const totalH = headerH + attrH + methH;
  let s = `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${totalH}" class="box"/>
    <rect x="${x}" y="${y}" width="${w}" height="${headerH}" class="box-header"/>`;
  if (stereotype) {
    s += `<text x="${x + w / 2}" y="${y + 14}" text-anchor="middle" class="t-italic">&lt;&lt;${esc(stereotype)}&gt;&gt;</text>`;
    s += `<text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" class="t-sub">${esc(title)}</text>`;
  } else {
    s += `<text x="${x + w / 2}" y="${y + 18}" text-anchor="middle" class="t-sub">${esc(title)}</text>`;
  }
  s += `<line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" class="line-solid"/>`;
  attrs.forEach((a, i) => {
    s += `<text x="${x + 8}" y="${y + headerH + 15 + i * 16}" class="t-norm" font-size="12">${esc(a)}</text>`;
  });
  s += `<line x1="${x}" y1="${y + headerH + attrH}" x2="${x + w}" y2="${y + headerH + attrH}" class="line-solid"/>`;
  methods.forEach((m, i) => {
    s += `<text x="${x + 8}" y="${y + headerH + attrH + 15 + i * 16}" class="t-norm" font-size="12">${esc(m)}</text>`;
  });
  s += `</g>`;
  return { svg: s, h: totalH };
}

function drawErdEntity(x, y, w, tableName, cols) {
  const headerH = 28;
  const bodyH = cols.length * 18 + 10;
  const totalH = headerH + bodyH;
  let s = `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${totalH}" class="box"/>
    <rect x="${x}" y="${y}" width="${w}" height="${headerH}" class="box-header"/>
    <text x="${x + w / 2}" y="${y + 19}" text-anchor="middle" class="t-sub">${esc(tableName)}</text>
    <line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" class="line-solid"/>`;
  cols.forEach((c, i) => {
    const cy = y + headerH + 17 + i * 18;
    s += `<text x="${x + 8}" y="${cy}" class="t-sub" font-size="11.5">${esc(c.key || '')}</text>`;
    s += `<line x1="${x + 42}" y1="${y + headerH}" x2="${x + 42}" y2="${y + totalH}" stroke="#cbd5e1" stroke-width="0.9"/>`;
    s += `<text x="${x + 48}" y="${cy}" class="t-norm" font-size="12">${esc(c.name)}</text>`;
    if (c.type) {
      s += `<text x="${x + w - 8}" y="${cy}" text-anchor="end" class="t-italic" font-size="11.5">${esc(c.type)}</text>`;
    }
  });
  s += `</g>`;
  return { svg: s, h: totalH };
}

// 1. diag_1_1_quy_trinh_mo_hinh.png
function buildDiag1_1() {
  const w = 980, h = 500;
  let b = `
    <rect x="20" y="15" width="940" height="470" fill="none" stroke="#000000" stroke-width="1.4"/>
    <text x="490" y="42" text-anchor="middle" class="t-title">MỐI QUAN HỆ GIỮA QUY TRÌNH XỬ LÝ THÔNG TIN VÀ BA MÔ HÌNH BIỂU DIỄN HỆ THỐNG</text>
    
    <rect x="45" y="60" width="890" height="145" fill="none" stroke="#000000" stroke-width="1.2" stroke-dasharray="6,4"/>
    <text x="60" y="80" class="t-sub">1. Chu trình xử lý thông tin cơ bản và vòng phản hồi điều khiển</text>

    <rect x="70" y="95" width="195" height="65" class="box"/>
    <text x="167" y="118" text-anchor="middle" class="t-sub">DỮ LIỆU ĐẦU VÀO (INPUT)</text>
    <text x="167" y="136" text-anchor="middle" class="t-norm">Yêu cầu tìm chuyến, thông tin</text>
    <text x="167" y="151" text-anchor="middle" class="t-norm">hành khách, giao dịch thanh toán</text>

    <line x1="265" y1="127" x2="325" y2="127" class="line-solid" marker-end="url(#arrow-filled)"/>

    <rect x="325" y="95" width="215" height="65" class="box"/>
    <text x="432" y="118" text-anchor="middle" class="t-sub">XỬ LÝ VÀ LƯU TRỮ (PROCESS)</text>
    <text x="432" y="136" text-anchor="middle" class="t-norm">Kiểm tra chỗ trống, tính giá vé,</text>
    <text x="432" y="151" text-anchor="middle" class="t-norm">tạo mã đặt chỗ PNR, cấp ghế ngồi</text>

    <line x1="540" y1="127" x2="600" y2="127" class="line-solid" marker-end="url(#arrow-filled)"/>

    <rect x="600" y="95" width="215" height="65" class="box"/>
    <text x="707" y="118" text-anchor="middle" class="t-sub">THÔNG TIN ĐẦU RA (OUTPUT)</text>
    <text x="707" y="136" text-anchor="middle" class="t-norm">Vé điện tử, thẻ lên máy bay,</text>
    <text x="707" y="151" text-anchor="middle" class="t-norm">báo cáo doanh thu và hệ số ghế</text>

    <path d="M 848 103 L 848 148 A 34 9 0 0 0 916 148 L 916 103" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
    <ellipse cx="882" cy="103" rx="34" ry="9" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
    <text x="882" y="128" text-anchor="middle" class="t-sub" font-size="12">CSDL</text>
    <text x="882" y="143" text-anchor="middle" class="t-norm" font-size="11.5">Tập trung</text>
    <line x1="815" y1="127" x2="846" y2="127" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>

    <path d="M 707 160 L 707 190 L 167 190 L 167 162" class="line-dashed" marker-end="url(#arrow-open)"/>
    <rect x="330" y="178" width="220" height="20" fill="#ffffff"/>
    <text x="440" y="192" text-anchor="middle" class="t-italic">Phản hồi điều chỉnh lịch bay và phân bổ chỗ</text>

    <line x1="490" y1="205" x2="490" y2="235" class="line-solid" marker-end="url(#arrow-filled)"/>

    <rect x="45" y="238" width="890" height="225" fill="none" stroke="#000000" stroke-width="1.2"/>
    <rect x="45" y="238" width="890" height="28" class="box-header"/>
    <text x="490" y="257" text-anchor="middle" class="t-sub">2. Ba mô hình biểu diễn hệ thống thông tin và 5 thành phần cấu thành</text>

    <rect x="70" y="285" width="250" height="155" class="box"/>
    <rect x="70" y="285" width="250" height="28" class="box-header"/>
    <text x="195" y="304" text-anchor="middle" class="t-sub">MÔ HÌNH NGOÀI (Bề mặt giao tiếp)</text>
    <text x="82" y="328" class="t-norm">• Câu hỏi: Hệ thống giao tiếp thế nào?</text>
    <text x="82" y="348" class="t-norm">• Biểu diễn: Tác nhân, giao diện Web/</text>
    <text x="92" y="365" class="t-norm">ứng dụng di động, mẫu vé và thẻ bay.</text>
    <text x="82" y="387" class="t-norm">• Thành phần gắn kết: Con người,</text>
    <text x="92" y="404" class="t-norm">Phần mềm giao diện người dùng.</text>
    <text x="82" y="425" class="t-italic">→ Góc nhìn của người sử dụng</text>

    <line x1="320" y1="362" x2="365" y2="362" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>

    <rect x="365" y="285" width="250" height="155" class="box"/>
    <rect x="365" y="285" width="250" height="28" class="box-header"/>
    <text x="490" y="304" text-anchor="middle" class="t-sub">MÔ HÌNH LÔ-GÍC (Nghiệp vụ cốt lõi)</text>
    <text x="377" y="328" class="t-norm">• Câu hỏi: Hệ thống làm những gì?</text>
    <text x="377" y="348" class="t-norm">• Biểu diễn: Biểu đồ Use Case, biểu đồ</text>
    <text x="387" y="365" class="t-norm">hoạt động, trình tự và biểu đồ lớp.</text>
    <text x="377" y="387" class="t-norm">• Thành phần gắn kết: Quy trình</text>
    <text x="387" y="404" class="t-norm">nghiệp vụ, cấu trúc Dữ liệu logic.</text>
    <text x="377" y="425" class="t-italic">→ Góc nhìn phân tích nghiệp vụ</text>

    <line x1="615" y1="362" x2="660" y2="362" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>

    <rect x="660" y="285" width="250" height="155" class="box"/>
    <rect x="660" y="285" width="250" height="28" class="box-header"/>
    <text x="785" y="304" text-anchor="middle" class="t-sub">MÔ HÌNH VẬT LÝ (Kỹ thuật cài đặt)</text>
    <text x="672" y="328" class="t-norm">• Câu hỏi: Hệ thống vận hành ra sao?</text>
    <text x="672" y="348" class="t-norm">• Biểu diễn: Kiến trúc 3 tầng, sơ đồ</text>
    <text x="682" y="365" class="t-norm">bảng cơ sở dữ liệu (ERD), mạng.</text>
    <text x="672" y="387" class="t-norm">• Thành phần gắn kết: Phần cứng,</text>
    <text x="682" y="404" class="t-norm">Mạng viễn thông, Hệ quản trị CSDL.</text>
    <text x="672" y="425" class="t-italic">→ Góc nhìn triển khai công nghệ</text>
  `;
  return wrapSvg(w, h, b);
}

// 2. diag_2_1_phan_cap_tac_nhan.png
function buildDiag2_1() {
  const w = 920, h = 430;
  let b = `
    <rect x="15" y="15" width="890" height="400" fill="none" stroke="#000000" stroke-width="1.3"/>
    <text x="460" y="42" text-anchor="middle" class="t-title">SƠ ĐỒ PHÂN CẤP TÁC NHÂN HỆ THỐNG ĐẶT VÉ VÀ LÀM THỦ TỤC TRỰC TUYẾN</text>

    <rect x="40" y="65" width="460" height="330" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="5,4"/>
    <text x="270" y="86" text-anchor="middle" class="t-sub">Nhóm tác nhân khách hàng (Kế thừa quyền hạn)</text>

    ${drawActor(115, 220, ['Khách vãng lai', '(Chưa có mã đặt chỗ)'])}
    ${drawActor(270, 220, ['Hành khách', '(Đã có mã đặt chỗ PNR)'])}
    ${drawActor(425, 220, ['Hội viên', 'Bông Sen Vàng'])}

    <line x1="230" y1="215" x2="155" y2="215" class="line-solid" marker-end="url(#arrow-inherit)"/>
    <text x="192" y="205" text-anchor="middle" class="t-italic">kế thừa</text>

    <line x1="385" y1="215" x2="310" y2="215" class="line-solid" marker-end="url(#arrow-inherit)"/>
    <text x="347" y="205" text-anchor="middle" class="t-italic">kế thừa</text>

    <rect x="65" y="305" width="410" height="72" class="box"/>
    <text x="77" y="325" class="t-norm">• Khách vãng lai: Tra cứu lịch bay, xem giá vé, khởi tạo đặt chỗ mới.</text>
    <text x="77" y="345" class="t-norm">• Hành khách: Kế thừa khách vãng lai + Quản lý mã PNR, làm thủ tục.</text>
    <text x="77" y="365" class="t-norm">• Hội viên Bông Sen Vàng: Kế thừa hành khách + Tích/đổi dặm thưởng.</text>

    <rect x="520" y="65" width="365" height="330" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="5,4"/>
    <text x="702" y="86" text-anchor="middle" class="t-sub">Nhóm tác nhân nội bộ và hệ thống liên thông</text>

    ${drawActor(610, 165, ['Nhân viên bán vé', 'và phục vụ mặt đất'], 0.9)}
    ${drawActor(795, 165, ['Quản trị viên', 'hệ thống'], 0.9)}

    ${drawActor(702, 310, ['Hệ thống thanh toán ngân hàng', 'và Định danh điện tử VNeID'], 0.9)}
    <text x="702" y="268" text-anchor="middle" class="t-italic">&lt;&lt;Tác nhân hệ thống ngoài&gt;&gt;</text>
  `;
  return wrapSvg(w, h, b);
}

// 3. diag_2_2_usecase_tong_quat.png
function buildDiag2_2() {
  const w = 980, h = 580;
  let b = `
    <rect x="10" y="10" width="960" height="560" fill="none" stroke="#000000" stroke-width="1.3"/>
    <rect x="200" y="30" width="580" height="520" fill="none" stroke="#000000" stroke-width="1.6"/>
    <text x="490" y="55" text-anchor="middle" class="t-title">Hệ thống đặt vé và làm thủ tục trực tuyến Vietnam Airlines</text>
    <line x1="200" y1="68" x2="780" y2="68" class="line-solid"/>

    ${drawActor(90, 125, ['Khách vãng lai'])}
    ${drawActor(90, 295, ['Hành khách'])}
    ${drawActor(90, 465, ['Hội viên', 'Bông Sen Vàng'])}

    <line x1="90" y1="255" x2="90" y2="175" class="line-solid" marker-end="url(#arrow-inherit)"/>
    <line x1="90" y1="425" x2="90" y2="345" class="line-solid" marker-end="url(#arrow-inherit)"/>

    ${drawActor(890, 145, ['Cổng thanh toán', 'Ngân hàng / Ví'])}
    ${drawActor(890, 310, ['Hệ thống định danh', 'điện tử VNeID'])}
    ${drawActor(890, 470, ['Nhân viên và', 'Quản trị viên'])}

    ${drawUseCase(335, 115, 108, 29, ['Tra cứu chuyến bay', 'và xem giá vé'])}
    ${drawUseCase(335, 205, 108, 29, ['Đặt vé máy bay', 'trực tuyến'])}
    ${drawUseCase(645, 160, 105, 28, ['Thanh toán tiền vé', 'trực tuyến'])}
    ${drawUseCase(645, 250, 105, 28, ['Mua thêm hành lý', 'và dịch vụ bổ trợ'])}

    ${drawUseCase(335, 305, 108, 29, ['Quản lý hồ sơ đặt chỗ', '(Tra cứu mã PNR)'])}
    ${drawUseCase(335, 395, 108, 29, ['Làm thủ tục trực tuyến', '(Online Check-in)'])}
    ${drawUseCase(645, 355, 105, 28, ['Chọn ghế ngồi trên', 'sơ đồ khoang tàu'])}
    ${drawUseCase(645, 435, 105, 28, ['Xác thực giấy tờ', 'sinh trắc học'])}

    ${drawUseCase(335, 490, 108, 29, ['Đăng nhập và sử dụng', 'dặm Bông Sen Vàng'])}
    ${drawUseCase(645, 505, 108, 28, ['Quản trị lịch bay,', 'chỗ trống và đối soát'])}

    <line x1="125" y1="120" x2="227" y2="115" class="line-solid"/>
    <line x1="125" y1="130" x2="227" y2="200" class="line-solid"/>

    <line x1="125" y1="290" x2="227" y2="305" class="line-solid"/>
    <line x1="125" y1="305" x2="227" y2="395" class="line-solid"/>

    <line x1="125" y1="465" x2="227" y2="490" class="line-solid"/>

    <line x1="750" y1="160" x2="845" y2="145" class="line-solid"/>
    <line x1="750" y1="435" x2="845" y2="315" class="line-solid"/>
    <line x1="753" y1="505" x2="845" y2="470" class="line-solid"/>

    <!-- <<include>> and <<extend>> relationships with generous gap -->
    <line x1="440" y1="194" x2="542" y2="168" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="490" y="172" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="542" y1="242" x2="440" y2="216" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="490" y="246" text-anchor="middle" class="t-italic">&lt;&lt;extend&gt;&gt;</text>

    <line x1="440" y1="384" x2="542" y2="362" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="490" y="364" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="542" y1="428" x2="440" y2="405" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="490" y="432" text-anchor="middle" class="t-italic">&lt;&lt;extend&gt;&gt;</text>
  `;
  return wrapSvg(w, h, b);
}

// 4. diag_2_3_usecase_dat_ve_checkin.png
function buildDiag2_3() {
  const w = 980, h = 540;
  let b = `
    <rect x="10" y="10" width="960" height="520" fill="none" stroke="#000000" stroke-width="1.3"/>
    <rect x="195" y="28" width="590" height="484" fill="none" stroke="#000000" stroke-width="1.5"/>
    <text x="490" y="52" text-anchor="middle" class="t-title">Phân rã Use Case Đặt vé trực tuyến và Làm thủ tục chuyến bay</text>
    <line x1="195" y1="64" x2="785" y2="64" class="line-solid"/>

    ${drawActor(88, 175, ['Hành khách'])}
    ${drawActor(88, 395, ['Hội viên', 'Bông Sen Vàng'])}
    <line x1="88" y1="355" x2="88" y2="225" class="line-solid" marker-end="url(#arrow-inherit)"/>

    ${drawActor(892, 165, ['Cổng thanh toán', 'trực tuyến'])}
    ${drawActor(892, 395, ['Hệ thống', 'VNeID / Sân bay'])}

    <!-- Nhóm 1: Phân rã Đặt vé -->
    <rect x="212" y="78" width="556" height="205" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="225" y="96" class="t-sub" font-size="12.5">Phân hệ Đặt vé và Xuất vé điện tử</text>

    ${drawUseCase(325, 165, 96, 27, ['Đặt vé máy bay', 'trực tuyến'])}
    ${drawUseCase(640, 115, 110, 24, ['Chọn chuyến bay và hạng vé'])}
    ${drawUseCase(640, 172, 110, 24, ['Kê khai thông tin hành khách'])}
    ${drawUseCase(640, 228, 110, 24, ['Thanh toán và xuất vé điện tử'])}
    ${drawUseCase(325, 248, 98, 22, ['Áp dụng mã giảm giá / Dặm'])}

    <line x1="125" y1="175" x2="229" y2="165" class="line-solid"/>
    <line x1="125" y1="385" x2="227" y2="252" class="line-solid"/>
    <line x1="750" y1="228" x2="848" y2="175" class="line-solid"/>

    <line x1="418" y1="152" x2="532" y2="120" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="472" y="127" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="421" y1="167" x2="530" y2="171" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="475" y="163" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="418" y1="180" x2="532" y2="222" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="472" y="214" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="325" y1="226" x2="325" y2="193" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="368" y="214" text-anchor="middle" class="t-italic">&lt;&lt;extend&gt;&gt;</text>

    <!-- Nhóm 2: Phân rã Làm thủ tục trực tuyến -->
    <rect x="212" y="295" width="556" height="202" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="225" y="313" class="t-sub" font-size="12.5">Phân hệ Làm thủ tục trực tuyến (Check-in)</text>

    ${drawUseCase(325, 390, 96, 27, ['Làm thủ tục', 'trực tuyến'])}
    ${drawUseCase(640, 338, 110, 24, ['Xác thực mã đặt chỗ PNR'])}
    ${drawUseCase(640, 395, 110, 24, ['Chọn ghế và xác nhận an ninh'])}
    ${drawUseCase(640, 452, 110, 24, ['Cấp thẻ lên máy bay (BCBP)'])}

    <line x1="125" y1="190" x2="229" y2="385" class="line-solid"/>
    <line x1="750" y1="452" x2="848" y2="405" class="line-solid"/>

    <line x1="418" y1="376" x2="532" y2="344" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="472" y="352" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="421" y1="392" x2="530" y2="395" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="475" y="388" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>

    <line x1="418" y1="404" x2="532" y2="446" class="line-dashed" marker-end="url(#arrow-open)"/>
    <text x="472" y="438" text-anchor="middle" class="t-italic">&lt;&lt;include&gt;&gt;</text>
  `;
  return wrapSvg(w, h, b);
}

// 5. diag_2_4_activity_dat_ve.png
function buildDiag2_4() {
  const w = 960, h = 650;
  const act = (cx, cy, bw, bh, lines) => {
    const arr = Array.isArray(lines) ? lines : [lines];
    const sy = cy - ((arr.length - 1) * 15) / 2 + 4;
    let s = `<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="14" ry="14" class="box"/>`;
    arr.forEach((l, i) => {
      s += `<text x="${cx}" y="${sy + i * 15}" text-anchor="middle" class="t-norm">${esc(l)}</text>`;
    });
    return s;
  };
  const diamond = (cx, cy, rw, rh) => `<polygon points="${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}" class="box"/>`;

  let b = `
    <rect x="25" y="15" width="910" height="620" fill="none" stroke="#000000" stroke-width="1.5"/>
    <rect x="25" y="15" width="300" height="36" class="box-header"/>
    <rect x="325" y="15" width="350" height="36" class="box-header"/>
    <rect x="675" y="15" width="260" height="36" class="box-header"/>
    <text x="175" y="38" text-anchor="middle" class="t-title">Hành khách</text>
    <text x="500" y="38" text-anchor="middle" class="t-title">Hệ thống đặt vé Vietnam Airlines</text>
    <text x="805" y="38" text-anchor="middle" class="t-title">Cổng thanh toán ngân hàng</text>

    <line x1="325" y1="15" x2="325" y2="635" class="line-solid"/>
    <line x1="675" y1="15" x2="675" y2="635" class="line-solid"/>

    <circle cx="175" cy="72" r="9" fill="#000000"/>
    <line x1="175" y1="81" x2="175" y2="105" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(175, 127, 230, 44, ['Nhập điểm đi/đến, ngày bay', 'và số lượng hành khách'])}
    <line x1="290" y1="127" x2="380" y2="127" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 127, 240, 44, ['Truy vấn lịch bay và kiểm tra', 'số ghế trống theo hạng vé'])}
    <line x1="500" y1="149" x2="500" y2="177" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${diamond(500, 197, 36, 20)}
    <text x="546" y="192" class="t-italic">[Hết chỗ]</text>
    <path d="M 536 197 L 645 197 L 645 72 L 192 72" class="line-solid" marker-end="url(#arrow-filled)"/>
    <text x="508" y="232" class="t-italic">[Còn chỗ]</text>
    <line x1="500" y1="217" x2="500" y2="245" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 267, 240, 44, ['Hiển thị danh sách chuyến bay', 'và điều kiện giá vé tương ứng'])}
    <line x1="380" y1="267" x2="290" y2="267" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(175, 267, 230, 44, ['Chọn chuyến bay, hạng vé và', 'nhập thông tin hành khách'])}
    <line x1="175" y1="289" x2="175" y2="345" class="line-solid"/>
    <line x1="175" y1="345" x2="380" y2="345" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 345, 240, 44, ['Khóa chỗ tạm thời và tạo', 'hồ sơ đặt chỗ (Mã PNR 6 ký tự)'])}
    <line x1="620" y1="345" x2="805" y2="345" class="line-solid"/>
    <line x1="805" y1="345" x2="805" y2="375" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(805, 397, 210, 44, ['Xác thực giao dịch thanh toán', '(QR Ngân hàng / Thẻ / Ví)'])}
    <line x1="805" y1="419" x2="805" y2="450" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${diamond(805, 470, 36, 20)}
    <text x="760" y="462" text-anchor="end" class="t-italic">[Thất bại / Quá hạn]</text>
    <line x1="769" y1="470" x2="620" y2="470" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 470, 240, 42, ['Hủy giữ chỗ tạm thời và', 'trả lại ghế trống vào kho chỗ'])}

    <text x="815" y="505" class="t-italic">[Thành công]</text>
    <line x1="805" y1="490" x2="805" y2="545" class="line-solid"/>
    <line x1="805" y1="545" x2="620" y2="545" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 545, 240, 44, ['Trừ chỗ chính thức và phát hành', 'Vé điện tử (13 chữ số)'])}
    <line x1="380" y1="545" x2="290" y2="545" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(175, 545, 230, 44, ['Nhận mã đặt chỗ PNR và', 'vé điện tử qua thư điện tử'])}
    <line x1="175" y1="567" x2="175" y2="600" class="line-solid" marker-end="url(#arrow-filled)"/>

    <path d="M 500 491 L 500 512 L 345 512 L 345 612 L 189 612" class="line-solid" marker-end="url(#arrow-filled)"/>

    <circle cx="175" cy="612" r="11" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <circle cx="175" cy="612" r="6.5" fill="#000000"/>
  `;
  return wrapSvg(w, h, b);
}

// 6. diag_2_5_activity_checkin.png
function buildDiag2_5() {
  const w = 960, h = 590;
  const act = (cx, cy, bw, bh, lines) => {
    const arr = Array.isArray(lines) ? lines : [lines];
    const sy = cy - ((arr.length - 1) * 15) / 2 + 4;
    let s = `<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="14" ry="14" class="box"/>`;
    arr.forEach((l, i) => {
      s += `<text x="${cx}" y="${sy + i * 15}" text-anchor="middle" class="t-norm">${esc(l)}</text>`;
    });
    return s;
  };
  const diamond = (cx, cy, rw, rh) => `<polygon points="${cx},${cy - rh} ${cx + rw},${cy} ${cx},${cy + rh} ${cx - rw},${cy}" class="box"/>`;

  let b = `
    <rect x="25" y="15" width="910" height="560" fill="none" stroke="#000000" stroke-width="1.5"/>
    <rect x="25" y="15" width="300" height="36" class="box-header"/>
    <rect x="325" y="15" width="350" height="36" class="box-header"/>
    <rect x="675" y="15" width="260" height="36" class="box-header"/>
    <text x="175" y="38" text-anchor="middle" class="t-title">Hành khách</text>
    <text x="500" y="38" text-anchor="middle" class="t-title">Hệ thống làm thủ tục Vietnam Airlines</text>
    <text x="805" y="38" text-anchor="middle" class="t-title">Hệ thống VNeID và Sân bay</text>

    <line x1="325" y1="15" x2="325" y2="575" class="line-solid"/>
    <line x1="675" y1="15" x2="675" y2="575" class="line-solid"/>

    <circle cx="175" cy="72" r="9" fill="#000000"/>
    <line x1="175" y1="81" x2="175" y2="105" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(175, 127, 230, 44, ['Nhập mã đặt chỗ PNR (6 ký tự)', 'và Họ của hành khách'])}
    <line x1="290" y1="127" x2="380" y2="127" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 127, 240, 44, ['Kiểm tra trạng thái vé điện tử và', 'thời gian mở làm thủ tục (24h–1h)'])}
    <line x1="500" y1="149" x2="500" y2="177" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${diamond(500, 197, 36, 20)}
    <text x="546" y="192" class="t-italic">[Không hợp lệ]</text>
    <path d="M 536 197 L 645 197 L 645 72 L 192 72" class="line-solid" marker-end="url(#arrow-filled)"/>
    <text x="508" y="232" class="t-italic">[Hợp lệ]</text>
    <line x1="500" y1="217" x2="500" y2="245" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 267, 240, 44, ['Hiển thị sơ đồ ghế trống trên', 'khoang tàu bay theo hạng vé'])}
    <line x1="380" y1="267" x2="290" y2="267" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(175, 267, 230, 44, ['Chọn vị trí ghế ngồi và xác nhận', 'quy định an toàn hàng không'])}
    <line x1="175" y1="289" x2="175" y2="345" class="line-solid"/>
    <line x1="175" y1="345" x2="380" y2="345" class="line-solid" marker-end="url(#arrow-filled)"/>

    ${act(500, 345, 240, 44, ['Gán số ghế chính thức và phát', 'hành Thẻ lên máy bay (BCBP)'])}

    <rect x="440" y="405" width="120" height="5" fill="#000000"/>
    <line x1="500" y1="367" x2="500" y2="405" class="line-solid" marker-end="url(#arrow-filled)"/>

    <path d="M 465 410 L 465 445 L 290 445" class="line-solid" marker-end="url(#arrow-filled)"/>
    ${act(175, 445, 230, 44, ['Lưu thẻ lên máy bay vào điện', 'thoại hoặc in tại quầy tự động'])}

    <path d="M 535 410 L 535 445 L 695 445" class="line-solid" marker-end="url(#arrow-filled)"/>
    ${act(805, 445, 220, 44, ['Đồng bộ dữ liệu thẻ bay với', 'cổng kiểm soát an ninh và VNeID'])}

    <rect x="440" y="505" width="120" height="5" fill="#000000"/>
    <path d="M 175 467 L 175 507 L 440 507" class="line-solid" marker-end="url(#arrow-filled)"/>
    <path d="M 805 467 L 805 507 L 560 507" class="line-solid" marker-end="url(#arrow-filled)"/>

    <line x1="500" y1="510" x2="500" y2="540" class="line-solid" marker-end="url(#arrow-filled)"/>
    <circle cx="500" cy="552" r="11" fill="#ffffff" stroke="#000000" stroke-width="1.5"/>
    <circle cx="500" cy="552" r="6.5" fill="#000000"/>
  `;
  return wrapSvg(w, h, b);
}

// 7. diag_2_6_sequence_dat_ve.png
function buildDiag2_6() {
  const w = 980, h = 620;
  const cols = [
    { cx: 80, type: 'actor', label: [':Hành khách'] },
    { cx: 245, type: 'boundary', label: [':GiaoDienDatVe'] },
    { cx: 425, type: 'control', label: [':DieuKhienDatCho'] },
    { cx: 595, type: 'entity', label: [':ChuyenBay'] },
    { cx: 750, type: 'entity', label: [':HoSoDatCho'] },
    { cx: 900, type: 'db', label: [':CSDL và ThanhToan'] }
  ];
  let b = `<rect x="10" y="10" width="960" height="600" fill="none" stroke="#000000" stroke-width="1.3"/>`;
  cols.forEach(c => {
    b += drawStereotypeParticipant(c.cx, 18, c.type, c.label);
    b += `<line x1="${c.cx}" y1="88" x2="${c.cx}" y2="590" class="lifeline"/>`;
  });

  const actBar = (cx, y1, y2) => `<rect x="${cx - 5}" y="${y1}" width="10" height="${y2 - y1}" class="activation"/>`;
  b += actBar(80, 105, 570);
  b += actBar(245, 110, 565);
  b += actBar(425, 125, 555);
  b += actBar(595, 140, 200);
  b += actBar(750, 255, 330);
  b += actBar(900, 365, 435);
  b += actBar(750, 465, 515);

  const msg = (x1, x2, y, text, dashed = false) => {
    const cls = dashed ? 'line-dashed' : 'line-solid';
    const mk = dashed ? 'url(#arrow-open)' : 'url(#arrow-filled)';
    const tx = (x1 + x2) / 2;
    return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="${cls}" marker-end="${mk}"/>
      <text x="${tx}" y="${y - 5}" text-anchor="middle" class="t-small">${esc(text)}</text>`;
  };

  b += msg(85, 240, 115, '1: nhapHanhTrinh(diemDi, diemDen)');
  b += msg(250, 420, 134, '2: timChuyenBay(diemDi, ngayBay)');
  b += msg(430, 590, 152, '3: kiemTraGheTrong()');
  b += msg(590, 430, 188, '4: dsChuyenBayVaGiaVe', true);
  b += msg(420, 250, 205, '5: hienThiChuyenBay()', true);

  b += msg(85, 240, 232, '6: chonChuyenVaNhapKhach()');
  b += msg(250, 420, 250, '7: yeuCauTaoDatCho(dsKhach)');
  b += msg(430, 745, 268, '8: khoaChoTamVaSinhMaPNR()');
  b += msg(745, 430, 315, '9: thongTinMaPNR(maPNR, hanGiu)', true);

  b += msg(420, 250, 335, '10: yeuCauThanhToan(tongTien)', true);
  b += msg(85, 240, 355, '11: xacNhanThanhToan()');
  b += msg(250, 895, 375, '12: xuLyGiaoDichThanhToan(maPNR, soTien)');

  b += `
    <rect x="55" y="400" width="880" height="175" fill="none" stroke="#000000" stroke-width="1.3"/>
    <polygon points="55,400 100,400 110,410 100,420 55,420" fill="#f1f5f9" stroke="#000000" stroke-width="1.2"/>
    <text x="79" y="414" text-anchor="middle" class="t-sub" font-size="12">alt</text>
    <text x="122" y="415" class="t-italic">[Thanh toán thành công]</text>
  `;
  b += msg(895, 430, 430, '13: ketQuaThanhToanHopLe(maGD)', true);
  b += msg(430, 745, 472, '14: truChoChinhThucVaXuatVe(maPNR)');
  b += msg(745, 430, 502, '15: danhSachSoVeDienTu(13So)', true);
  b += msg(420, 250, 518, '16: hienThiVeVaGuiEmail()', true);

  b += `
    <line x1="55" y1="530" x2="935" y2="530" class="line-dashed"/>
    <text x="122" y="545" class="t-italic">[Thanh toán thất bại hoặc quá hạn giữ chỗ]</text>
  `;
  b += msg(430, 745, 555, '17: huyGiuChoVaTraGheTrong(maPNR)');
  b += msg(420, 250, 568, '18: thongBaoLoiThanhToan()', true);

  return wrapSvg(w, h, b);
}

// 8. diag_2_7_sequence_checkin.png
function buildDiag2_7() {
  const w = 980, h = 560;
  const cols = [
    { cx: 80, type: 'actor', label: [':Hành khách'] },
    { cx: 255, type: 'boundary', label: [':GiaoDienCheckIn'] },
    { cx: 435, type: 'control', label: [':DieuKhienThuTuc'] },
    { cx: 615, type: 'entity', label: [':HoSoDatCho'] },
    { cx: 775, type: 'entity', label: [':SoDoGheTauBay'] },
    { cx: 910, type: 'db', label: [':TheLenMayBay'] }
  ];
  let b = `<rect x="10" y="10" width="960" height="540" fill="none" stroke="#000000" stroke-width="1.3"/>`;
  cols.forEach(c => {
    b += drawStereotypeParticipant(c.cx, 18, c.type, c.label);
    b += `<line x1="${c.cx}" y1="88" x2="${c.cx}" y2="530" class="lifeline"/>`;
  });

  const actBar = (cx, y1, y2) => `<rect x="${cx - 5}" y="${y1}" width="10" height="${y2 - y1}" class="activation"/>`;
  b += actBar(80, 105, 510);
  b += actBar(255, 110, 505);
  b += actBar(435, 125, 495);
  b += actBar(615, 145, 210);
  b += actBar(775, 240, 360);
  b += actBar(910, 385, 465);

  const msg = (x1, x2, y, text, dashed = false) => {
    const cls = dashed ? 'line-dashed' : 'line-solid';
    const mk = dashed ? 'url(#arrow-open)' : 'url(#arrow-filled)';
    const tx = (x1 + x2) / 2;
    return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="${cls}" marker-end="${mk}"/>
      <text x="${tx}" y="${y - 5}" text-anchor="middle" class="t-small">${esc(text)}</text>`;
  };

  b += msg(85, 250, 115, '1: nhapMaDatCho(maPNR, hoKhach)');
  b += msg(260, 430, 135, '2: xacThucHoSo(maPNR, hoKhach)');
  b += msg(440, 610, 155, '3: kiemTraTrangThaiVe()');
  b += msg(610, 440, 195, '4: hoSoHopLe', true);

  b += msg(440, 770, 248, '5: laySoDoGheTrong(maChuyenBay)');
  b += msg(770, 440, 275, '6: dsGheTrongKhoangTau', true);
  b += msg(430, 260, 292, '7: hienThiSoDoGhe()', true);

  b += msg(85, 250, 320, '8: chonGheVaXacNhanAnNinh(soGhe)');
  b += msg(260, 430, 338, '9: yeuCauGanGhe(maPNR, soGhe)');
  b += msg(440, 770, 355, '10: capNhatGheDaChon(soGhe)');

  b += msg(440, 905, 395, '11: sinhMaVachVaCapTheBay(maPNR, soGhe)');
  b += msg(905, 440, 450, '12: theLenMayBayDienTu(maQR, soThuTu)', true);
  b += msg(430, 260, 478, '13: hienThiTheLenMayBay()', true);
  b += msg(250, 85, 498, '14: luuTheLenMayBay()', true);

  return wrapSvg(w, h, b);
}

// 9. diag_2_8_class_diagram.png
function buildDiag2_8() {
  const w = 980, h = 660;
  let b = `
    <rect x="10" y="10" width="960" height="640" fill="none" stroke="#000000" stroke-width="1.3"/>
    <text x="490" y="36" text-anchor="middle" class="t-title">BIỂU ĐỒ LỚP THỰC THỂ MIỀN (DOMAIN CLASS DIAGRAM CHUẨN UML 2.5)</text>
  `;

  const c1 = drawClassBox(40, 55, 245, 'ChuyenBay', null, [
    '- maChuyenBay: String',
    '- sanBayDi: String',
    '- sanBayDen: String',
    '- gioKhoiHanh: DateTime',
    '- loaiTauBay: String',
    '- trangThaiChuyen: String'
  ], [
    '+ kiemTraGheTrong(): List',
    '+ capNhatSoGheTrong(): void'
  ]);
  const c2 = drawClassBox(365, 55, 245, 'GheTrenChuyenBay', null, [
    '- maGheChuyenBay: String',
    '- soGhe: String',
    '- hangGhe: String',
    '- giaCoBan: Decimal',
    '- trangThaiGhe: String'
  ], [
    '+ khoaGheTamThoi(): Boolean',
    '+ ganGheChinhThuc(): Boolean'
  ]);
  const c3 = drawClassBox(690, 55, 250, 'HoSoDatCho', null, [
    '- maPNR: String',
    '- ngayTao: DateTime',
    '- thoiHanGiuCho: DateTime',
    '- tongTien: Decimal',
    '- trangThaiDatCho: String'
  ], [
    '+ tinhTongTien(): Decimal',
    '+ huyHoSoQuaHan(): void'
  ]);

  const c4 = drawClassBox(40, 265, 245, 'HanhKhach', null, [
    '- maHanhKhach: String',
    '- hoVaTen: String',
    '- ngaySinh: Date',
    '- soGiayToTuyThan: String',
    '- soDienThoai: String',
    '- email: String'
  ], [
    '+ capNhatThongTin(): void',
    '+ xacThucGiayTo(): Boolean'
  ]);
  const c5 = drawClassBox(365, 265, 245, 'VeDienTu', null, [
    '- soVeDienTu: String',
    '- dieuKienGiaVe: String',
    '- hanhLyKyGuiKg: Integer',
    '- ngayPhatHanh: DateTime',
    '- trangThaiVe: String'
  ], [
    '+ phatHanhVe(): Boolean',
    '+ doiChuyenBay(): Boolean'
  ]);
  const c6 = drawClassBox(690, 265, 250, 'GiaoDichThanhToan', null, [
    '- maGiaoDich: String',
    '- phuongThuc: String',
    '- soTienThanhToan: Decimal',
    '- thoiGianGiaoDich: DateTime',
    '- ketQuaGiaoDich: String'
  ], [
    '+ xacThucThanhToan(): Boolean',
    '+ hoanTienVe(): Boolean'
  ]);

  const c7 = drawClassBox(40, 485, 245, 'HoiVienBongSenVang', null, [
    '- soTheHoiVien: String',
    '- hangThe: String',
    '- soDamTichLuy: Integer'
  ], [
    '+ congDamThuong(): void',
    '+ quyDoiDamThuong(): Decimal'
  ]);
  const c8 = drawClassBox(365, 475, 245, 'TheLenMayBay', null, [
    '- maTheLenMayBay: String',
    '- soThuTuCheckIn: Integer',
    '- cuaRaTauBay: String',
    '- gioLenTauBay: DateTime',
    '- maVach2D: String'
  ], [
    '+ sinhMaVachBCBP(): String',
    '+ xacNhanLenTau(): void'
  ]);

  b += c1.svg + c2.svg + c3.svg + c4.svg + c5.svg + c6.svg + c7.svg + c8.svg;

  // 1. ChuyenBay (1) *-- (1..*) GheTrenChuyenBay
  b += `<line x1="285" y1="130" x2="365" y2="130" class="line-solid" marker-start="url(#diamond-filled)"/>
    <text x="302" y="123" class="t-small">1</text>
    <text x="338" y="123" class="t-small">1..*</text>`;

  // 2. HoSoDatCho (1) *-- (1..*) VeDienTu
  b += `<path d="M 690 145 L 645 145 L 645 340 L 610 340" class="line-solid" marker-start="url(#diamond-filled)"/>
    <text x="672" y="138" class="t-small">1</text>
    <text x="618" y="333" class="t-small">1..*</text>`;

  // 3. HoSoDatCho (1) -- (0..*) GiaoDichThanhToan
  b += `<line x1="815" y1="${55 + c3.h}" x2="815" y2="265" class="line-solid"/>
    <text x="822" y="${55 + c3.h + 15}" class="t-small">1</text>
    <text x="822" y="258" class="t-small">0..*</text>`;

  // 4. HanhKhach (1) -- (1..*) VeDienTu
  b += `<line x1="285" y1="340" x2="365" y2="340" class="line-solid"/>
    <text x="295" y="333" class="t-small">1</text>
    <text x="338" y="333" class="t-small">1..*</text>`;

  // 5. GheTrenChuyenBay (1) -- (0..1) VeDienTu
  b += `<line x1="487" y1="${55 + c2.h}" x2="487" y2="265" class="line-solid"/>
    <text x="495" y="${55 + c2.h + 15}" class="t-small">1</text>
    <text x="495" y="258" class="t-small">0..1</text>`;

  // 6. VeDienTu (1) -- (0..1) TheLenMayBay
  b += `<line x1="487" y1="${265 + c5.h}" x2="487" y2="475" class="line-solid"/>
    <text x="495" y="${265 + c5.h + 14}" class="t-small">1</text>
    <text x="495" y="468" class="t-small">0..1</text>`;

  // 7. HoiVienBongSenVang --|> HanhKhach
  b += `<line x1="162" y1="485" x2="162" y2="${265 + c4.h}" class="line-solid" marker-end="url(#arrow-inherit)"/>`;

  return wrapSvg(w, h, b);
}

// 10. diag_2_9_erd_csdl.png
function buildDiag2_9() {
  const w = 980, h = 610;
  let b = `
    <rect x="10" y="10" width="960" height="590" fill="none" stroke="#000000" stroke-width="1.3"/>
    <text x="490" y="36" text-anchor="middle" class="t-title">LƯỢC ĐỒ QUAN HỆ CƠ SỞ DỮ LIỆU ĐẠT DẠNG CHUẨN 3 (3NF - CROW'S FOOT ERD)</text>
  `;

  const e1 = drawErdEntity(35, 50, 260, 'CHUYEN_BAY', [
    { key: 'PK', name: 'ma_chuyen_bay', type: 'VARCHAR(10)' },
    { key: '', name: 'san_bay_di', type: 'CHAR(3)' },
    { key: '', name: 'san_bay_den', type: 'CHAR(3)' },
    { key: '', name: 'gio_khoi_hanh', type: 'DATETIME' },
    { key: '', name: 'loai_tau_bay', type: 'VARCHAR(20)' },
    { key: '', name: 'trang_thai', type: 'VARCHAR(20)' }
  ]);

  const e2 = drawErdEntity(360, 50, 260, 'GHE_CHUYEN_BAY', [
    { key: 'PK', name: 'ma_ghe_chuyen', type: 'VARCHAR(16)' },
    { key: 'FK', name: 'ma_chuyen_bay', type: 'VARCHAR(10)' },
    { key: '', name: 'so_ghe', type: 'VARCHAR(5)' },
    { key: '', name: 'hang_ghe', type: 'CHAR(1)' },
    { key: '', name: 'gia_co_ban', type: 'DECIMAL(12,0)' },
    { key: '', name: 'trang_thai_ghe', type: 'VARCHAR(15)' }
  ]);

  const e3 = drawErdEntity(685, 50, 260, 'HO_SO_DAT_CHO', [
    { key: 'PK', name: 'ma_pnr', type: 'CHAR(6)' },
    { key: 'FK', name: 'ma_hanh_khach_lh', type: 'VARCHAR(12)' },
    { key: '', name: 'ngay_tao', type: 'DATETIME' },
    { key: '', name: 'han_giu_cho', type: 'DATETIME' },
    { key: '', name: 'tong_tien', type: 'DECIMAL(12,0)' },
    { key: '', name: 'trang_thai_pnr', type: 'VARCHAR(15)' }
  ]);

  const e4 = drawErdEntity(35, 255, 260, 'HANH_KHACH', [
    { key: 'PK', name: 'ma_hanh_khach', type: 'VARCHAR(12)' },
    { key: '', name: 'ho_va_ten', type: 'NVARCHAR(100)' },
    { key: '', name: 'ngay_sinh', type: 'DATE' },
    { key: '', name: 'so_cccd_ho_chieu', type: 'VARCHAR(20)' },
    { key: '', name: 'so_dien_thoai', type: 'VARCHAR(15)' },
    { key: '', name: 'email', type: 'VARCHAR(100)' }
  ]);

  const e5 = drawErdEntity(360, 255, 260, 'VE_DIEN_TU', [
    { key: 'PK', name: 'so_ve_13_so', type: 'CHAR(13)' },
    { key: 'FK', name: 'ma_pnr', type: 'CHAR(6)' },
    { key: 'FK', name: 'ma_hanh_khach', type: 'VARCHAR(12)' },
    { key: 'FK', name: 'ma_ghe_chuyen', type: 'VARCHAR(16)' },
    { key: '', name: 'hanh_ly_kg', type: 'INT' },
    { key: '', name: 'trang_thai_ve', type: 'VARCHAR(15)' }
  ]);

  const e6 = drawErdEntity(685, 255, 260, 'GIAO_DICH_THANH_TOAN', [
    { key: 'PK', name: 'ma_giao_dich', type: 'VARCHAR(20)' },
    { key: 'FK', name: 'ma_pnr', type: 'CHAR(6)' },
    { key: '', name: 'phuong_thuc', type: 'VARCHAR(30)' },
    { key: '', name: 'so_tien', type: 'DECIMAL(12,0)' },
    { key: '', name: 'thoi_gian_tt', type: 'DATETIME' },
    { key: '', name: 'ket_qua_tt', type: 'VARCHAR(15)' }
  ]);

  const e8 = drawErdEntity(35, 455, 260, 'HOI_VIEN_BSV', [
    { key: 'PK', name: 'so_the_bsv', type: 'VARCHAR(16)' },
    { key: 'FK', name: 'ma_hanh_khach', type: 'VARCHAR(12)' },
    { key: '', name: 'hang_the', type: 'VARCHAR(20)' },
    { key: '', name: 'so_dam_tich_luy', type: 'INT' },
    { key: '', name: 'ngay_gia_nhap', type: 'DATE' }
  ]);

  const e7 = drawErdEntity(360, 455, 260, 'THE_LEN_MAY_BAY', [
    { key: 'PK', name: 'ma_the_bay', type: 'VARCHAR(16)' },
    { key: 'FK', name: 'so_ve_13_so', type: 'CHAR(13)' },
    { key: '', name: 'so_thu_tu_seq', type: 'INT' },
    { key: '', name: 'cua_ra_tau_bay', type: 'VARCHAR(10)' },
    { key: '', name: 'ma_vach_bcbp', type: 'VARCHAR(255)' }
  ]);

  const e9 = drawErdEntity(685, 455, 260, 'DICH_VU_BO_TRO', [
    { key: 'PK', name: 'ma_dich_vu_bt', type: 'VARCHAR(16)' },
    { key: 'FK', name: 'so_ve_13_so', type: 'CHAR(13)' },
    { key: '', name: 'loai_dich_vu', type: 'NVARCHAR(50)' },
    { key: '', name: 'so_luong_kg', type: 'INT' },
    { key: '', name: 'don_gia', type: 'DECIMAL(12,0)' }
  ]);

  b += e1.svg + e2.svg + e3.svg + e4.svg + e5.svg + e6.svg + e7.svg + e8.svg + e9.svg;

  const crowH = (x1, x2, y) => `
    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="line-solid"/>
    <line x1="${x1 + 8}" y1="${y - 6}" x2="${x1 + 8}" y2="${y + 6}" class="line-solid"/>
    <line x1="${x1 + 13}" y1="${y - 6}" x2="${x1 + 13}" y2="${y + 6}" class="line-solid"/>
    <line x1="${x2 - 12}" y1="${y - 6}" x2="${x2 - 12}" y2="${y + 6}" class="line-solid"/>
    <line x1="${x2 - 12}" y1="${y}" x2="${x2}" y2="${y - 6}" class="line-solid"/>
    <line x1="${x2 - 12}" y1="${y}" x2="${x2}" y2="${y + 6}" class="line-solid"/>`;

  const crowV = (x, y1, y2, isManyBottom = true) => `
    <line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="line-solid"/>
    <line x1="${x - 6}" y1="${y1 + 8}" x2="${x + 6}" y2="${y1 + 8}" class="line-solid"/>
    <line x1="${x - 6}" y1="${y1 + 13}" x2="${x + 6}" y2="${y1 + 13}" class="line-solid"/>
    ${isManyBottom ? `
      <circle cx="${x}" cy="${y2 - 14}" r="4" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
      <line x1="${x}" y1="${y2 - 10}" x2="${x - 6}" y2="${y2}" class="line-solid"/>
      <line x1="${x}" y1="${y2 - 10}" x2="${x + 6}" y2="${y2}" class="line-solid"/>
    ` : `
      <circle cx="${x}" cy="${y2 - 13}" r="4" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
      <line x1="${x - 6}" y1="${y2 - 6}" x2="${x + 6}" y2="${y2 - 6}" class="line-solid"/>
    `}`;

  b += crowH(295, 360, 115);
  b += crowH(295, 360, 325);
  b += crowV(490, 50 + e2.h, 255, false);
  b += crowV(815, 50 + e3.h, 255, true);
  b += crowV(490, 255 + e5.h, 455, false);
  b += crowV(165, 255 + e4.h, 455, false);
  b += `
    <path d="M 685 130 L 652 130 L 652 325 L 620 325" class="line-solid"/>
    <line x1="676" y1="124" x2="676" y2="136" class="line-solid"/>
    <line x1="671" y1="124" x2="671" y2="136" class="line-solid"/>
    <line x1="632" y1="319" x2="632" y2="331" class="line-solid"/>
    <line x1="632" y1="325" x2="620" y2="319" class="line-solid"/>
    <line x1="632" y1="325" x2="620" y2="331" class="line-solid"/>
    <path d="M 620 355 L 652 355 L 652 515 L 685 515" class="line-solid"/>
    <line x1="628" y1="349" x2="628" y2="361" class="line-solid"/>
    <line x1="633" y1="349" x2="633" y2="361" class="line-solid"/>
    <circle cx="671" cy="515" r="4" fill="#ffffff" stroke="#000000" stroke-width="1.2"/>
    <line x1="675" y1="515" x2="685" y2="509" class="line-solid"/>
    <line x1="675" y1="515" x2="685" y2="521" class="line-solid"/>
  `;

  return wrapSvg(w, h, b);
}

// 11. diag_2_10_kien_truc_he_thong.png
function buildDiag2_10() {
  const w = 980, h = 480;
  let b = `
    <rect x="15" y="15" width="950" height="450" fill="none" stroke="#000000" stroke-width="1.4"/>
    <text x="490" y="42" text-anchor="middle" class="t-title">SƠ ĐỒ KIẾN TRÚC TRIỂN KHAI HỆ THỐNG 3 TẦNG (3-TIER ARCHITECTURE)</text>

    <rect x="40" y="65" width="255" height="375" class="box"/>
    <rect x="40" y="65" width="255" height="34" class="box-header"/>
    <text x="167" y="87" text-anchor="middle" class="t-sub">TẦNG GIAO DIỆN (CLIENT TIER)</text>

    <rect x="62" y="120" width="210" height="72" class="box"/>
    <text x="167" y="143" text-anchor="middle" class="t-sub">Website Đặt vé trực tuyến</text>
    <text x="167" y="162" text-anchor="middle" class="t-norm">(Trình duyệt máy tính / điện thoại</text>
    <text x="167" y="178" text-anchor="middle" class="t-norm">vietnamairlines.com)</text>

    <rect x="62" y="215" width="210" height="72" class="box"/>
    <text x="167" y="238" text-anchor="middle" class="t-sub">Ứng dụng di động VNA</text>
    <text x="167" y="257" text-anchor="middle" class="t-norm">(Ứng dụng iOS / Android tích hợp</text>
    <text x="167" y="273" text-anchor="middle" class="t-norm">lưu thẻ lên máy bay điện tử)</text>

    <rect x="62" y="310" width="210" height="72" class="box"/>
    <text x="167" y="333" text-anchor="middle" class="t-sub">Quầy làm thủ tục tự động</text>
    <text x="167" y="352" text-anchor="middle" class="t-norm">(Kiosk Check-in và Cổng kiểm soát</text>
    <text x="167" y="368" text-anchor="middle" class="t-norm">sinh trắc học tại sân bay)</text>

    <line x1="295" y1="156" x2="360" y2="156" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>
    <text x="327" y="148" text-anchor="middle" class="t-small">HTTPS</text>
    <line x1="295" y1="251" x2="360" y2="251" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>
    <text x="327" y="243" text-anchor="middle" class="t-small">REST API</text>
    <line x1="295" y1="346" x2="360" y2="346" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>

    <rect x="360" y="65" width="265" height="375" class="box"/>
    <rect x="360" y="65" width="265" height="34" class="box-header"/>
    <text x="492" y="87" text-anchor="middle" class="t-sub">TẦNG XỬ LÝ NGHIỆP VỤ (APP TIER)</text>

    <rect x="382" y="115" width="220" height="58" class="box"/>
    <text x="492" y="138" text-anchor="middle" class="t-sub">Cổng điều phối và Cân bằng tải</text>
    <text x="492" y="156" text-anchor="middle" class="t-norm">Kiểm soát truy cập, phân phối tải</text>

    <rect x="382" y="188" width="220" height="62" class="box"/>
    <text x="492" y="210" text-anchor="middle" class="t-sub">Phân hệ Đặt chỗ và Giá vé</text>
    <text x="492" y="228" text-anchor="middle" class="t-norm">Tìm chuyến bay, tính giá, khóa chỗ</text>
    <text x="492" y="243" text-anchor="middle" class="t-norm">tạm thời và cấp mã đặt chỗ PNR</text>

    <rect x="382" y="265" width="220" height="62" class="box"/>
    <text x="492" y="287" text-anchor="middle" class="t-sub">Phân hệ Xuất vé và Thanh toán</text>
    <text x="492" y="305" text-anchor="middle" class="t-norm">Kết nối ngân hàng, phát hành vé</text>
    <text x="492" y="320" text-anchor="middle" class="t-norm">điện tử 13 số và hóa đơn điện tử</text>

    <rect x="382" y="342" width="220" height="62" class="box"/>
    <text x="492" y="364" text-anchor="middle" class="t-sub">Phân hệ Làm thủ tục và Hội viên</text>
    <text x="492" y="382" text-anchor="middle" class="t-norm">Cấp ghế ngồi, sinh mã vạch thẻ bay,</text>
    <text x="492" y="397" text-anchor="middle" class="t-norm">tích lũy và trừ dặm Bông Sen Vàng</text>

    <line x1="625" y1="215" x2="690" y2="215" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>
    <line x1="625" y1="365" x2="690" y2="365" class="line-solid" marker-start="url(#arrow-filled)" marker-end="url(#arrow-filled)"/>

    <rect x="690" y="65" width="250" height="375" class="box"/>
    <rect x="690" y="65" width="250" height="34" class="box-header"/>
    <text x="815" y="87" text-anchor="middle" class="t-sub">TẦNG DỮ LIỆU VÀ LIÊN THÔNG</text>

    <path d="M 718 132 L 718 185 A 97 12 0 0 0 912 185 L 912 132" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
    <ellipse cx="815" cy="132" rx="97" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
    <text x="815" y="160" text-anchor="middle" class="t-sub">CSDL Đặt chỗ và Lịch bay</text>
    <text x="815" y="177" text-anchor="middle" class="t-norm">(Hồ sơ PNR, Vé, Sơ đồ ghế)</text>

    <path d="M 718 225 L 718 278 A 97 12 0 0 0 912 278 L 912 225" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
    <ellipse cx="815" cy="225" rx="97" ry="12" fill="#ffffff" stroke="#000000" stroke-width="1.4"/>
    <text x="815" y="253" text-anchor="middle" class="t-sub">CSDL Khách hàng và Hội viên</text>
    <text x="815" y="270" text-anchor="middle" class="t-norm">(Hồ sơ khách, Dặm thưởng)</text>

    <rect x="712" y="315" width="206" height="95" class="box"/>
    <text x="815" y="338" text-anchor="middle" class="t-sub">Hệ thống liên thông bên ngoài</text>
    <text x="815" y="358" text-anchor="middle" class="t-norm">• Cổng thanh toán ngân hàng</text>
    <text x="815" y="376" text-anchor="middle" class="t-norm">• Ứng dụng định danh VNeID</text>
    <text x="815" y="394" text-anchor="middle" class="t-norm">• Hệ thống cửa sân bay và Kế toán</text>
  `;
  return wrapSvg(w, h, b);
}

// 12. diag_3_1_bieu_do_khao_sat.png
function buildDiag3_1() {
  const w = 940, h = 440;
  const items = [
    { name: '1. Hạ tầng phần cứng và thiết bị sân bay', mean: 3.79, rate: '75,8%' },
    { name: '2. Phần mềm ứng dụng (Web / App đặt vé)', mean: 3.49, rate: '69,8%' },
    { name: '3. Cơ sở dữ liệu (Lịch bay, PNR, Vé, Dặm)', mean: 3.92, rate: '78,4%' },
    { name: '4. Mạng viễn thông và đường truyền kết nối', mean: 3.55, rate: '71,0%' },
    { name: '5. Con người và quy trình hỗ trợ nghiệp vụ', mean: 3.49, rate: '69,8%' },
    { name: 'Điểm trung bình toàn hệ thống (N = 150)', mean: 3.65, rate: '73,0%', bold: true }
  ];
  let b = `
    <rect x="15" y="15" width="910" height="410" fill="none" stroke="#000000" stroke-width="1.4"/>
    <text x="470" y="42" text-anchor="middle" class="t-title">KẾT QUẢ KHẢO SÁT ĐÁNH GIÁ 5 THÀNH PHẦN HỆ THỐNG (THANG ĐIỂM 5, N = 150)</text>

    <line x1="335" y1="75" x2="335" y2="365" class="line-solid"/>
    <line x1="335" y1="365" x2="835" y2="365" class="line-solid"/>
  `;
  for (let v = 0; v <= 5; v++) {
    const gx = 335 + v * 100;
    b += `<line x1="${gx}" y1="75" x2="${gx}" y2="365" stroke="${v === 0 ? '#000' : '#cbd5e1'}" stroke-width="1" ${v > 0 ? 'stroke-dasharray="4,4"' : ''}/>`;
    b += `<text x="${gx}" y="385" text-anchor="middle" class="t-norm">${v},0</text>`;
  }
  b += `<text x="585" y="408" text-anchor="middle" class="t-italic">Điểm đánh giá trung bình (Thang Likert 1,0 – 5,0)</text>`;

  items.forEach((it, idx) => {
    const y = 88 + idx * 46;
    const bw = it.mean * 100;
    const fill = it.bold ? '#cbd5e1' : '#e2e8f0';
    b += `<text x="323" y="${y + 18}" text-anchor="end" class="${it.bold ? 't-sub' : 't-norm'}">${esc(it.name)}</text>`;
    b += `<rect x="335" y="${y}" width="${bw}" height="26" fill="${fill}" stroke="#000000" stroke-width="1.3"/>`;
    b += `<text x="${335 + bw + 10}" y="${y + 18}" class="t-sub">${String(it.mean).replace('.', ',')} / 5,0 (${it.rate})</text>`;
  });

  return wrapSvg(w, h, b);
}

// 13. diag_3_2_ma_tran_rui_ro.png
function buildDiag3_2() {
  const w = 960, h = 470;
  let b = `
    <rect x="15" y="15" width="930" height="440" fill="none" stroke="#000000" stroke-width="1.4"/>
    <text x="480" y="42" text-anchor="middle" class="t-title">MA TRẬN ĐÁNH GIÁ RỦI RO DỮ LIỆU VÀ VẬN HÀNH HỆ THỐNG (5x5)</text>

    <text x="315" y="68" text-anchor="middle" class="t-sub">MỨC ĐỘ TÁC ĐỘNG ĐẾN HOẠT ĐỘNG KHAI THÁC VÀ DỮ LIỆU (1 → 5)</text>
  `;
  const startX = 115, startY = 104, cw = 82, ch = 56;
  const impactLabels = ['1. Rất nhẹ', '2. Nhẹ', '3. Trung bình', '4. Nghiêm trọng', '5. Thảm họa'];
  const probLabels = ['5. Rất cao', '4. Cao', '3. Trung bình', '2. Thấp', '1. Hiếm gặp'];

  impactLabels.forEach((lb, c) => {
    b += `<rect x="${startX + c * cw}" y="${startY - 26}" width="${cw}" height="26" class="box-header"/>`;
    b += `<text x="${startX + c * cw + cw / 2}" y="${startY - 9}" text-anchor="middle" class="t-small" font-weight="bold" font-size="11">${esc(lb)}</text>`;
  });

  for (let r = 0; r < 5; r++) {
    const prob = 5 - r;
    b += `<rect x="28" y="${startY + r * ch}" width="87" height="${ch}" class="box-header"/>`;
    b += `<text x="71" y="${startY + r * ch + 32}" text-anchor="middle" class="t-small" font-weight="bold">${esc(probLabels[r])}</text>`;
    for (let c = 0; c < 5; c++) {
      const imp = c + 1;
      const score = prob * imp;
      const fill = score >= 15 ? '#cbd5e1' : (score >= 9 ? '#f1f5f9' : '#ffffff');
      const cx = startX + c * cw;
      const cy = startY + r * ch;
      b += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${fill}" stroke="#000000" stroke-width="1.2"/>`;
      b += `<text x="${cx + 6}" y="${cy + 15}" class="t-small" fill="#475569">${score}</text>`;
    }
  }

  const markers = [
    { r: 1, c: 3, code: 'R1 (16đ)', sub: 'Trừ tiền chậm vé' },
    { r: 1, c: 2, code: 'R4 (12đ)', sub: 'Quá tải săn vé' },
    { r: 2, c: 3, code: 'R2 (12đ)', sub: 'Lệch sơ đồ ghế' },
    { r: 3, c: 4, code: 'R5 (10đ)', sub: 'Lộ mã PNR' },
    { r: 2, c: 2, code: 'R3 (9đ)', sub: 'Lỗi đọc VNeID' }
  ];
  markers.forEach(m => {
    const cx = startX + m.c * cw + cw / 2;
    const cy = startY + m.r * ch + 31;
    b += `<text x="${cx}" y="${cy}" text-anchor="middle" class="t-sub" font-size="11.5">${m.code}</text>`;
    b += `<text x="${cx}" y="${cy + 15}" text-anchor="middle" class="t-small" font-size="10">${m.sub}</text>`;
  });

  b += `
    <rect x="542" y="78" width="385" height="342" class="box"/>
    <rect x="542" y="78" width="385" height="30" class="box-header"/>
    <text x="734" y="98" text-anchor="middle" class="t-sub">CHÚ GIẢI MÃ RỦI RO TRỌNG YẾU</text>

    <text x="554" y="128" class="t-sub">• R1 (Điểm 16 - Cao): Khấu trừ tiền nhưng chậm xuất vé</text>
    <text x="564" y="146" class="t-norm">Bản tin xác nhận thanh toán trả về sau khi hết thời</text>
    <text x="564" y="162" class="t-norm">gian giữ chỗ tạm thời (15 phút), gây treo giao dịch.</text>

    <text x="554" y="190" class="t-sub">• R4 (Điểm 12 - Khá cao): Nghẽn mạch giờ cao điểm</text>
    <text x="564" y="208" class="t-norm">Lượng truy cập tăng đột biến dịp mở bán vé Tết hoặc</text>
    <text x="564" y="224" class="t-norm">khuyến mãi làm chậm tốc độ tải trang và tra cứu.</text>

    <text x="554" y="252" class="t-sub">• R2 (Điểm 12 - Khá cao): Lệch sơ đồ ghế khi đổi tàu</text>
    <text x="564" y="270" class="t-norm">Thay đổi loại tàu bay sát giờ khởi hành dẫn đến phải</text>
    <text x="564" y="286" class="t-norm">xếp lại ghế ngồi đã chọn trước của hành khách.</text>

    <text x="554" y="314" class="t-sub">• R5 (Điểm 10 - Trung bình): Nguy cơ lộ mã đặt chỗ PNR</text>
    <text x="564" y="332" class="t-norm">Hành khách chụp ảnh thẻ lên máy bay đăng lên mạng</text>
    <text x="564" y="348" class="t-norm">xã hội làm lộ mã PNR 6 ký tự và họ tên cá nhân.</text>

    <text x="554" y="376" class="t-sub">• R3 (Điểm 9 - Trung bình): Chậm kết nối sinh trắc học</text>
    <text x="564" y="394" class="t-norm">Đường truyền hoặc thiết bị quét tại sân bay phản hồi</text>
    <text x="564" y="410" class="t-norm">chậm, hành khách chuyển sang kiểm tra giấy tờ thủ công.</text>
  `;

  return wrapSvg(w, h, b);
}

// 14. diag_4_1_kien_truc_nang_cap.png
function buildDiag4_1() {
  const w = 980, h = 500;
  let b = `
    <rect x="15" y="15" width="950" height="470" fill="none" stroke="#000000" stroke-width="1.4"/>
    <text x="490" y="42" text-anchor="middle" class="t-title">MÔ HÌNH GIẢI PHÁP NÂNG CẤP ĐỒNG BỘ 5 THÀNH PHẦN HỆ THỐNG THÔNG TIN</text>

    <rect x="35" y="65" width="285" height="175" class="box"/>
    <rect x="35" y="65" width="285" height="30" class="box-header"/>
    <text x="177" y="85" text-anchor="middle" class="t-sub">1. NÂNG CẤP PHẦN CỨNG</text>
    <text x="48" y="112" class="t-norm">• Mở rộng cụm máy chủ ảo hóa tự</text>
    <text x="58" y="129" class="t-norm">động co giãn theo lưu lượng đặt vé.</text>
    <text x="48" y="150" class="t-norm">• Bổ sung quầy làm thủ tục tự động</text>
    <text x="58" y="167" class="t-norm">(Kiosk) và cổng sinh trắc học tại</text>
    <text x="58" y="184" class="t-norm">các sân bay Nội Bài, Tân Sơn Nhất,</text>
    <text x="58" y="201" class="t-norm">Đà Nẵng để giảm xếp hàng.</text>

    <rect x="347" y="65" width="285" height="175" class="box"/>
    <rect x="347" y="65" width="285" height="30" class="box-header"/>
    <text x="490" y="85" text-anchor="middle" class="t-sub">2. NÂNG CẤP PHẦN MỀM</text>
    <text x="360" y="112" class="t-norm">• Tối ưu giao diện đặt vé 4 bước tinh</text>
    <text x="370" y="129" class="t-norm">gọn, hiển thị rõ tổng giá vé cuối cùng.</text>
    <text x="360" y="150" class="t-norm">• Bổ sung hàng đợi ảo khi săn vé Tết</text>
    <text x="370" y="167" class="t-norm">và tính năng tự đổi chuyến/hoàn vé</text>
    <text x="370" y="184" class="t-norm">trực tuyến ngay trên ứng dụng mà</text>
    <text x="370" y="201" class="t-norm">không cần gọi tổng đài.</text>

    <rect x="660" y="65" width="285" height="175" class="box"/>
    <rect x="660" y="65" width="285" height="30" class="box-header"/>
    <text x="802" y="85" text-anchor="middle" class="t-sub">3. CHUẨN HÓA CƠ SỞ DỮ LIỆU</text>
    <text x="673" y="112" class="t-norm">• Cơ chế đối soát thanh toán tự động</text>
    <text x="683" y="129" class="t-norm">2 chiều (trong vòng 30 giây) để xử lý</text>
    <text x="683" y="146" class="t-norm">triệt để lỗi trừ tiền nhưng chậm vé.</text>
    <text x="673" y="167" class="t-norm">• Đồng bộ tức thời trạng thái vé, ghế</text>
    <text x="683" y="184" class="t-norm">ngồi và dặm thưởng Bông Sen Vàng;</text>
    <text x="683" y="201" class="t-norm">xác thực 2 lớp khi tra cứu mã PNR.</text>

    <rect x="35" y="280" width="285" height="180" class="box"/>
    <rect x="35" y="280" width="285" height="30" class="box-header"/>
    <text x="177" y="300" text-anchor="middle" class="t-sub">4. NÂNG CẤP MẠNG VIỄN THÔNG</text>
    <text x="48" y="327" class="t-norm">• Duy trì đường truyền đôi dự phòng</text>
    <text x="58" y="344" class="t-norm">tự động chuyển mạch tới các sân bay.</text>
    <text x="48" y="365" class="t-norm">• Tối ưu mạng phân phối nội dung</text>
    <text x="58" y="382" class="t-norm">(CDN) và bộ lọc chống truy cập</text>
    <text x="58" y="399" class="t-norm">tự động trái phép (Bot) bảo vệ</text>
    <text x="58" y="416" class="t-norm">băng thông cho hành khách thực.</text>

    <rect x="347" y="280" width="285" height="180" class="box"/>
    <rect x="347" y="280" width="285" height="30" class="box-header"/>
    <text x="490" y="300" text-anchor="middle" class="t-sub">5. ĐÀO TẠO CON NGƯỜI VÀ QUY TRÌNH</text>
    <text x="360" y="327" class="t-norm">• Đào tạo nhân viên mặt đất và tổng</text>
    <text x="370" y="344" class="t-norm">đài xử lý nhanh sự cố vé và sinh trắc.</text>
    <text x="360" y="365" class="t-norm">• Tích hợp hướng dẫn trực quan ngay</text>
    <text x="370" y="382" class="t-norm">trên màn hình đặt vé giúp hành khách</text>
    <text x="370" y="399" class="t-norm">lần đầu dễ dàng tự làm thủ tục và</text>
    <text x="370" y="416" class="t-norm">bảo mật mã đặt chỗ cá nhân.</text>

    <rect x="660" y="280" width="285" height="180" class="box"/>
    <rect x="660" y="280" width="285" height="30" class="box-header"/>
    <text x="802" y="300" text-anchor="middle" class="t-sub">HIỆU QUẢ MỤC TIÊU ĐẠT ĐƯỢC</text>
    <text x="673" y="327" class="t-sub">• Độ sẵn sàng hệ thống: ≥ 99,95%</text>
    <text x="673" y="350" class="t-sub">• Giảm lỗi treo thanh toán: &lt; 0,05%</text>
    <text x="673" y="373" class="t-sub">• Tỷ lệ làm thủ tục trực tuyến: ≥ 70%</text>
    <text x="673" y="396" class="t-sub">• Thời gian phản hồi tìm vé: &lt; 1,5 giây</text>
    <text x="673" y="419" class="t-sub">• Mức độ hài lòng người dùng: ≥ 4,3/5</text>

    <line x1="320" y1="152" x2="347" y2="152" class="line-solid" marker-end="url(#arrow-filled)"/>
    <line x1="632" y1="152" x2="660" y2="152" class="line-solid" marker-end="url(#arrow-filled)"/>
    <line x1="177" y1="240" x2="177" y2="280" class="line-solid" marker-end="url(#arrow-filled)"/>
    <line x1="490" y1="240" x2="490" y2="280" class="line-solid" marker-end="url(#arrow-filled)"/>
    <line x1="802" y1="240" x2="802" y2="280" class="line-solid" marker-end="url(#arrow-filled)"/>
    <line x1="320" y1="370" x2="347" y2="370" class="line-solid" marker-end="url(#arrow-filled)"/>
    <line x1="632" y1="370" x2="660" y2="370" class="line-solid" marker-end="url(#arrow-filled)"/>
  `;
  return wrapSvg(w, h, b);
}

const diagrams = [
  { name: 'diag_1_1_quy_trinh_mo_hinh', w: 980, h: 500, fn: buildDiag1_1 },
  { name: 'diag_2_1_phan_cap_tac_nhan', w: 920, h: 430, fn: buildDiag2_1 },
  { name: 'diag_2_2_usecase_tong_quat', w: 980, h: 580, fn: buildDiag2_2 },
  { name: 'diag_2_3_usecase_dat_ve_checkin', w: 980, h: 540, fn: buildDiag2_3 },
  { name: 'diag_2_4_activity_dat_ve', w: 960, h: 650, fn: buildDiag2_4 },
  { name: 'diag_2_5_activity_checkin', w: 960, h: 590, fn: buildDiag2_5 },
  { name: 'diag_2_6_sequence_dat_ve', w: 980, h: 620, fn: buildDiag2_6 },
  { name: 'diag_2_7_sequence_checkin', w: 980, h: 560, fn: buildDiag2_7 },
  { name: 'diag_2_8_class_diagram', w: 980, h: 660, fn: buildDiag2_8 },
  { name: 'diag_2_9_erd_csdl', w: 980, h: 610, fn: buildDiag2_9 },
  { name: 'diag_2_10_kien_truc_he_thong', w: 980, h: 480, fn: buildDiag2_10 },
  { name: 'diag_3_1_bieu_do_khao_sat', w: 940, h: 440, fn: buildDiag3_1 },
  { name: 'diag_3_2_ma_tran_rui_ro', w: 960, h: 470, fn: buildDiag3_2 },
  { name: 'diag_4_1_kien_truc_nang_cap', w: 980, h: 500, fn: buildDiag4_1 }
];

for (const d of diagrams) {
  const svgContent = d.fn();
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${d.w}px; height: ${d.h}px; overflow: hidden; background: #ffffff; }
</style>
</head>
<body>${svgContent}</body>
</html>`;

  const tmpHtml = path.join(outDirs[1], `${d.name}.html`);
  const outPng = path.join(outDirs[1], `${d.name}.png`);
  fs.writeFileSync(tmpHtml, htmlContent, 'utf8');

  execFileSync(edgeExe, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=2',
    `--window-size=${d.w},${d.h}`,
    `--screenshot=${outPng}`,
    tmpHtml
  ]);

  fs.copyFileSync(outPng, path.join(outDirs[0], `${d.name}.png`));
  try { fs.unlinkSync(tmpHtml); } catch (e) {}
  console.log(`Rendered ${d.name}.png (${d.w}x${d.h})`);
}
console.log('All 14 UML 2.5 & academic diagrams re-rendered cleanly!');
