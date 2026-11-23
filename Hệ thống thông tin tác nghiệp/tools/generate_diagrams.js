const {
  wrapSvg,
  drawZone,
  drawBox,
  drawDatabase,
  drawConnector,
  drawLabelTag,
  drawStepCircle,
  renderDiagram
} = require('./svg_helpers');

// ---------------------------------------------------------------------------
// 1. Câu 1: Mô hình Thác nước (Waterfall)
// ---------------------------------------------------------------------------
function buildHinh01() {
  const w = 940, h = 620;
  const steps = [
    { b: '1', t: 'Khảo sát & Xác định yêu cầu', s: 'Đặc tả yêu cầu hệ thống (SRS)', v: 'accent' },
    { b: '2', t: 'Phân tích hệ thống', s: 'Mô hình logic: DFD, ERD, Use Case', v: 'default' },
    { b: '3', t: 'Thiết kế hệ thống', s: 'Kiến trúc, CSDL, giao diện UI/UX', v: 'default' },
    { b: '4', t: 'Xây dựng / Lập trình', s: 'Viết mã & kiểm thử đơn vị (Unit Test)', v: 'default' },
    { b: '5', t: 'Tích hợp & Kiểm thử hệ thống', s: 'Kiểm thử chức năng, bảo mật, UAT', v: 'default' },
    { b: '6', t: 'Triển khai / Chuyển giao', s: 'Cài đặt, chuyển dữ liệu & đào tạo', v: 'default' },
    { b: '7', t: 'Vận hành & Bảo trì', s: 'Sửa lỗi, thích nghi & nâng cấp', v: 'teal' }
  ];

  const x0 = 36, dx = 88, y0 = 84, dy = 66, bw = 244, bh = 50;
  let connectors = '';
  let boxes = '';

  // Forward arrows (vertical drop from step i into step i+1)
  for (let i = 0; i < steps.length - 1; i++) {
    const sx = x0 + (i + 1) * dx + 64; // overlaps both step i and step i+1 horizontally
    const sy1 = y0 + i * dy + bh;
    const sy2 = y0 + (i + 1) * dy;
    connectors += drawConnector({
      points: [{ x: sx, y: sy1 }, { x: sx, y: sy2 }],
      color: '#1d4ed8',
      width: 1.8,
      endMarker: 'arrow-accent'
    });
  }

  // Feedback dashed arrows (from top-right of step i+1 up and left into right edge of step i)
  const fbLabels = ['Chỉnh yêu cầu', 'Bổ sung đặc tả', 'Chỉnh thiết kế', 'Sửa lỗi lập trình'];
  for (let i = 0; i < 4; i++) {
    const xRightI = x0 + i * dx + bw;
    const yMidI = y0 + i * dy + bh / 2;
    const xExit = xRightI + 52; // safely inside step[i+1] top edge (step[i+1] ends at xRightI + 88)
    const yTopNext = y0 + (i + 1) * dy;
    connectors += drawConnector({
      points: [
        { x: xExit, y: yTopNext },
        { x: xExit, y: yMidI },
        { x: xRightI, y: yMidI }
      ],
      color: '#c2410c',
      width: 1.5,
      dashed: true,
      endMarker: 'arrow-warm'
    });
    boxes += drawLabelTag(xExit + 56, yMidI, fbLabels[i], {
      color: '#9a3412',
      border: '#fdba74',
      bg: '#fff7ed',
      w: 102,
      h: 18
    });
  }

  // Draw step boxes
  steps.forEach((st, i) => {
    const x = x0 + i * dx;
    const y = y0 + i * dy;
    boxes += drawBox({
      x, y, w: bw, h: bh,
      badge: st.b,
      title: st.t,
      lines: [st.s],
      variant: st.v,
      align: 'left'
    });
  });

  // Note card top-right (safe from steps 1-4 and feedback labels)
  boxes += drawBox({
    x: 646, y: 84, w: 262, h: 120,
    title: 'Điều kiện áp dụng hiệu quả',
    headerH: 30,
    variant: 'muted',
    align: 'left',
    lines: [
      '• Yêu cầu rõ ràng, ổn định từ đầu.',
      '• Quy trình nghiệp vụ ít biến động.',
      '• Công nghệ phát triển quen thuộc.',
      '• Cần tài liệu kiểm soát chặt từng pha.'
    ]
  });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Chuyển pha tuần tự nối tiếp' },
    { type: 'line', color: '#c2410c', dashed: true, marker: 'arrow-warm', label: 'Phản hồi hiệu chỉnh pha trước' },
    { type: 'box', fill: '#f0fdfa', stroke: '#0f766e', label: 'Pha vận hành dài hạn' }
  ];

  return wrapSvg(w, h, {
    title: 'QUY TRÌNH PHÁT TRIỂN HỆ THỐNG THEO MÔ HÌNH THÁC NƯỚC',
    subtitle: 'Trình tự tuyến tính 7 pha (W.W. Royce, 1970) — cho phép hiệu chỉnh pha liền kề khi có sai sót',
    legend
  }, connectors + boxes);
}

// ---------------------------------------------------------------------------
// 2. Câu 2: Mô hình Tăng trưởng (Incremental)
// ---------------------------------------------------------------------------
function buildHinh02() {
  const w = 940, h = 560;
  let body = '';

  // Top Core Architecture bar
  body += drawBox({
    x: 42, y: 84, w: 856, h: 52,
    title: 'PHÂN TÍCH YÊU CẦU TỔNG THỂ & THIẾT KẾ KIẾN TRÚC LÕI (CORE ARCHITECTURE)',
    lines: ['Phân rã chức năng theo độ ưu tiên — thiết kế nền tảng dữ liệu & tích hợp dùng chung'],
    variant: 'accent'
  });

  const rows = [
    {
      y: 164,
      zoneTitle: 'GIA TĂNG 1 — CHỨC NĂNG CỐT LÕI (VD: Hồ sơ nhân sự)',
      steps: ['Phân tích', 'Thiết kế', 'Lập trình', 'Kiểm thử'],
      verTitle: 'Phiên bản 1 (v1.0)',
      verSub: 'Đưa vào sử dụng ngay',
      verVar: 'teal'
    },
    {
      y: 280,
      zoneTitle: 'GIA TĂNG 2 — MỞ RỘNG & TÍCH HỢP (VD: Chấm công, nghỉ phép)',
      steps: ['Phân tích', 'Thiết kế', 'Lập trình & Tích hợp', 'Test hồi quy'],
      verTitle: 'Phiên bản 2 (v2.0)',
      verSub: 'Bổ sung trên nền v1.0',
      verVar: 'teal'
    },
    {
      y: 396,
      zoneTitle: 'GIA TĂNG n — HOÀN THIỆN PHẠM VI (VD: Tính lương & Báo cáo)',
      steps: ['Phân tích', 'Thiết kế', 'Lập trình & Tích hợp', 'Test toàn hệ'],
      verTitle: 'Hệ thống hoàn chỉnh',
      verSub: 'Đáp ứng đủ yêu cầu',
      verVar: 'accent'
    }
  ];

  let connectors = '';
  let boxes = '';

  // Vertical spine from Core Architecture down to rows
  connectors += drawConnector({
    points: [{ x: 110, y: 136 }, { x: 110, y: 164 }],
    color: '#1d4ed8',
    width: 1.8,
    endMarker: 'arrow-accent'
  });

  rows.forEach((row, idx) => {
    const zx = 42, zw = 608, zh = 86;
    boxes += drawZone(zx, row.y, zw, zh, row.zoneTitle, {
      fill: '#f8fafc',
      stroke: '#94a3b8',
      titleColor: '#1e293b'
    });

    const sw = 126, sh = 42, gap = 20, sx0 = zx + 16, sy = row.y + 32;
    row.steps.forEach((st, si) => {
      const sx = sx0 + si * (sw + gap);
      if (si < row.steps.length - 1) {
        connectors += drawConnector({
          points: [{ x: sx + sw, y: sy + sh / 2 }, { x: sx + sw + gap, y: sy + sh / 2 }],
          color: '#334155',
          width: 1.4,
          endMarker: 'arrow-ink'
        });
      }
      boxes += drawBox({
        x: sx, y: sy, w: sw, h: sh,
        title: st,
        variant: 'default',
        rx: 5
      });
    });

    // Release box on the right
    const vx = 688, vw = 210, vh = 76, vy = row.y + 5;
    connectors += drawConnector({
      points: [{ x: zx + zw, y: vy + vh / 2 }, { x: vx, y: vy + vh / 2 }],
      color: '#0f766e',
      width: 1.8,
      endMarker: 'arrow-teal'
    });
    boxes += drawBox({
      x: vx, y: vy, w: vw, h: vh,
      title: row.verTitle,
      lines: [row.verSub],
      variant: row.verVar
    });

    // Feedback / Next increment link
    if (idx < rows.length - 1) {
      const nextY = rows[idx + 1].y;
      connectors += drawConnector({
        points: [{ x: 346, y: row.y + zh }, { x: 346, y: nextY }],
        color: '#1d4ed8',
        width: 1.6,
        endMarker: 'arrow-accent'
      });
      connectors += drawConnector({
        points: [
          { x: vx + vw / 2, y: vy + vh },
          { x: vx + vw / 2, y: nextY + 14 },
          { x: zx + zw, y: nextY + 14 }
        ],
        color: '#c2410c',
        width: 1.5,
        dashed: true,
        endMarker: 'arrow-warm'
      });
      boxes += drawLabelTag(728, nextY - 8, 'Phản hồi người dùng', {
        color: '#9a3412',
        border: '#fdba74',
        bg: '#fff7ed',
        w: 124,
        h: 18
      });
    }
  });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Phát triển kế tiếp theo kiến trúc lõi' },
    { type: 'line', color: '#0f766e', marker: 'arrow-teal', label: 'Phát hành phiên bản sử dụng sớm' },
    { type: 'line', color: '#c2410c', dashed: true, marker: 'arrow-warm', label: 'Phản hồi thực tế hiệu chỉnh gia tăng sau' }
  ];

  return wrapSvg(w, h, {
    title: 'QUY TRÌNH PHÁT TRIỂN HỆ THỐNG THEO MÔ HÌNH TĂNG TRƯỞNG (GIA TĂNG)',
    subtitle: 'Xây dựng và phát hành nhiều phiên bản nối tiếp — mỗi phiên bản bổ sung nhóm chức năng mới',
    legend
  }, body + connectors + boxes);
}

// ---------------------------------------------------------------------------
// 3. Câu 3: Mô hình Xoắn ốc (Spiral)
// ---------------------------------------------------------------------------
function buildHinh03() {
  const w = 960, h = 640;
  const cx = 480, cy = 335;
  let body = '';

  // Quadrant subtle backgrounds
  body += `<rect x="34" y="80" width="446" height="255" fill="#f8fafc" stroke="none"/>`;
  body += `<rect x="480" y="80" width="446" height="255" fill="#fffaf5" stroke="none"/>`;
  body += `<rect x="480" y="335" width="446" height="245" fill="#f5f8ff" stroke="none"/>`;
  body += `<rect x="34" y="335" width="446" height="245" fill="#f4fbf9" stroke="none"/>`;

  // Axes
  body += `<line x1="34" y1="${cy}" x2="926" y2="${cy}" stroke="#64748b" stroke-width="1.4" marker-end="url(#arrow-muted)"/>`;
  body += `<line x1="${cx}" y1="582" x2="${cx}" y2="82" stroke="#64748b" stroke-width="1.4" marker-end="url(#arrow-muted)"/>`;

  // Outer 4 quadrant cards tucked safely in corners (away from spiral r_max = 175)
  body += drawBox({
    x: 46, y: 92, w: 232, h: 86,
    badge: 'GÓC I',
    title: 'Xác định mục tiêu',
    lines: ['• Xác định mục tiêu vòng lặp', '• Đề xuất phương án & ràng buộc'],
    variant: 'default',
    headerH: 28,
    align: 'left'
  });
  body += drawBox({
    x: 682, y: 92, w: 232, h: 86,
    badge: 'GÓC II',
    title: 'Phân tích rủi ro',
    lines: ['• Nhận diện & đánh giá rủi ro', '• Thử nghiệm / làm Bản mẫu'],
    variant: 'warm',
    headerH: 28,
    align: 'left'
  });
  body += drawBox({
    x: 682, y: 482, w: 232, h: 86,
    badge: 'GÓC III',
    title: 'Phát triển & kiểm chứng',
    lines: ['• Thiết kế chi tiết & lập trình', '• Kiểm thử, tích hợp sản phẩm'],
    variant: 'accent',
    headerH: 28,
    align: 'left'
  });
  body += drawBox({
    x: 46, y: 482, w: 232, h: 86,
    badge: 'GÓC IV',
    title: 'Đánh giá & lập kế hoạch',
    lines: ['• Khách hàng rà soát kết quả', '• Chốt cam kết & kế hoạch vòng sau'],
    variant: 'teal',
    headerH: 28,
    align: 'left'
  });

  // Archimedean clockwise spiral: start left (-PI) and sweep 3.15 turns
  const totalSteps = 260;
  const maxTurns = 3.12;
  let pts = [];
  for (let i = 0; i <= totalSteps; i++) {
    const t = (i / totalSteps) * maxTurns; // turns
    const theta = -Math.PI + t * 2 * Math.PI; // clockwise in SVG (y down)
    const r = 14 + t * 50; // reaches ~170 px
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    pts.push({ x, y, t, theta, r });
  }

  let spiralD = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    spiralD += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  body += `<path d="${spiralD}" fill="none" stroke="#1d4ed8" stroke-width="2.4" marker-end="url(#arrow-accent)"/>`;

  // Center dot
  body += `<circle cx="${cx}" cy="${cy}" r="5" fill="#c2410c"/>`;

  // Prototype dots in Quadrant II (angle -PI/4)
  [0.375, 1.375, 2.375].forEach((turnVal, idx) => {
    const theta = -Math.PI + turnVal * 2 * Math.PI;
    const r = 14 + turnVal * 50;
    const px = cx + r * Math.cos(theta);
    const py = cy + r * Math.sin(theta);
    body += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4.5" fill="#c2410c" stroke="#ffffff" stroke-width="1.2"/>`;
    if (idx === 2) {
      body += drawLabelTag(px + 66, py - 14, 'Bản mẫu 1 → 2 → 3', {
        color: '#9a3412', border: '#fdba74', bg: '#fff7ed', w: 112, h: 18
      });
    }
  });

  // Axis annotations
  body += drawLabelTag(cx + 88, 96, 'Bán kính: Chi phí tích lũy', {
    color: '#334155', border: '#cbd5e1', bg: '#ffffff', w: 152, h: 20
  });
  body += drawLabelTag(824, cy + 20, 'Góc quay: Tiến độ', {
    color: '#334155', border: '#cbd5e1', bg: '#ffffff', w: 120, h: 20
  });
  body += drawLabelTag(cx - 10, cy + 215, 'Sản phẩm hoàn chỉnh (Vòng cuối)', {
    color: '#1e3a8a', border: '#93c5fd', bg: '#eff6ff', w: 196, h: 22
  });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Đường xoắn ốc tiến triển qua các vòng lặp' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Trọng tâm đánh giá rủi ro & bản mẫu' },
    { type: 'box', fill: '#eff6ff', stroke: '#1d4ed8', label: 'Xây dựng & kiểm chứng kỹ thuật' }
  ];

  return wrapSvg(w, h, {
    title: 'QUY TRÌNH PHÁT TRIỂN HỆ THỐNG THEO MÔ HÌNH XOẮN ỐC (SPIRAL MODEL)',
    subtitle: 'Chu trình lặp định hướng rủi ro (Barry Boehm, 1986) — mỗi vòng lặp gồm 4 góc phần tư',
    legend
  }, body);
}

// ---------------------------------------------------------------------------
// 4. Câu 5: Mô hình Kim tự tháp phân loại HTTT
// ---------------------------------------------------------------------------
function buildHinh05() {
  const w = 940, h = 570;
  let body = '';

  // 4 Pyramid trapezoid tiers centered at cx=470
  const cx = 470;
  const tiers = [
    { y1: 86, y2: 164, tw: 270, bw: 370, fill: '#fff7ed', stroke: '#c2410c', tc: '#9a3412', bc: '#7c2d12', t: 'ESS / EIS — Hỗ trợ điều hành cấp cao', l1: 'Lãnh đạo cấp cao (CEO / UBND) · Dài hạn', l2: 'VD: Dashboard KPI chiến lược, Trung tâm IOC' },
    { y1: 172, y2: 250, tw: 380, bw: 480, fill: '#eff6ff', stroke: '#1d4ed8', tc: '#1e3a8a', bc: '#1e40af', t: 'DSS — Hỗ trợ ra quyết định', l1: 'Quản lý cấp trung/cao · Phân tích kịch bản What-if', l2: 'VD: Dự báo tuyển sinh, tối ưu tuyến vận tải' },
    { y1: 258, y2: 336, tw: 490, bw: 586, fill: '#f0fdfa', stroke: '#0f766e', tc: '#115e59', bc: '#134e4a', t: 'MIS — Hệ thống thông tin quản lý', l1: 'Quản lý cấp trung · Báo cáo tổng hợp định kỳ', l2: 'VD: Báo cáo doanh thu, tồn kho hàng tháng' },
    { y1: 344, y2: 430, tw: 596, bw: 696, fill: '#ffffff', stroke: '#334155', tc: '#0f172a', bc: '#334155', t: 'TPS — Hệ thống xử lý giao dịch', l1: 'Nhân viên tác nghiệp · Dữ liệu chi tiết thực thời', l2: 'VD: Máy POS bán hàng, tiếp nhận hồ sơ một cửa' }
  ];

  tiers.forEach(tr => {
    const x1L = cx - tr.tw / 2, x1R = cx + tr.tw / 2;
    const x2L = cx - tr.bw / 2, x2R = cx + tr.bw / 2;
    body += `<polygon points="${x1L},${tr.y1} ${x1R},${tr.y1} ${x2R},${tr.y2} ${x2L},${tr.y2}" fill="${tr.fill}" stroke="${tr.stroke}" stroke-width="1.7"/>`;
    const ym = (tr.y1 + tr.y2) / 2;
    body += `<text x="${cx}" y="${ym - 12}" text-anchor="middle" class="t-head" fill="${tr.tc}">${tr.t}</text>`;
    body += `<text x="${cx}" y="${ym + 5}" text-anchor="middle" class="t-body" fill="${tr.bc}">${tr.l1}</text>`;
    body += `<text x="${cx}" y="${ym + 21}" text-anchor="middle" class="t-small" fill="${tr.bc}">${tr.l2}</text>`;
  });

  // Left vertical arrow UP: Detailed data bottom -> top
  body += drawConnector({
    points: [{ x: 88, y: 425 }, { x: 88, y: 92 }],
    color: '#0f766e',
    width: 2.2,
    endMarker: 'arrow-teal'
  });
  body += drawBox({
    x: 20, y: 214, w: 136, h: 80,
    title: 'Dữ liệu đi lên',
    lines: ['Chi tiết, khối lượng lớn', '↑ tổng hợp dần lên trên'],
    variant: 'teal'
  });

  // Right vertical arrow DOWN: Strategic decisions top -> bottom
  body += drawConnector({
    points: [{ x: 852, y: 92 }, { x: 852, y: 425 }],
    color: '#c2410c',
    width: 2.2,
    endMarker: 'arrow-warm'
  });
  body += drawBox({
    x: 784, y: 214, w: 136, h: 80,
    title: 'Quyết định đi xuống',
    lines: ['Định hướng chiến lược', '↓ triển khai tác nghiệp'],
    variant: 'warm'
  });

  // Bottom bar: Complementary functional & office systems
  body += drawBox({
    x: 42, y: 452, w: 856, h: 46,
    title: 'Các hệ thống hỗ trợ xuyên suốt & theo chức năng nghiệp vụ',
    lines: ['Văn phòng điện tử (OAS / eOffice) · Quản trị tri thức (KMS) · Chức năng: AIS (Kế toán), FIS (Tài chính), HRIS (Nhân lực), CRM, SCM, ERP'],
    variant: 'muted'
  });

  const legend = [
    { type: 'line', color: '#0f766e', marker: 'arrow-teal', label: 'Luồng tổng hợp dữ liệu từ tác nghiệp lên lãnh đạo' },
    { type: 'line', color: '#c2410c', marker: 'arrow-warm', label: 'Luồng chỉ đạo & quyết định từ lãnh đạo xuống cơ sở' }
  ];

  return wrapSvg(w, h, {
    title: 'MÔ HÌNH KIM TỰ THÁP PHÂN LOẠI HỆ THỐNG THÔNG TIN THEO CẤP QUẢN LÝ',
    subtitle: 'Kết hợp phân loại theo cấp quyết định (TPS – MIS – DSS – ESS) và các hệ thống chức năng hỗ trợ',
    legend
  }, body);
}

// ---------------------------------------------------------------------------
// 5. Câu 6: Ma trận đối tượng & mô hình giao dịch điện tử
// ---------------------------------------------------------------------------
function buildHinh06() {
  const w = 980, h = 610;
  let body = '';

  // Left Zone: 3x3 Matrix
  body += drawZone(30, 82, 578, 376, 'MA TRẬN 3 × 3 = 9 MÔ HÌNH GIAO DỊCH TỪ 3 CHỦ THỂ CƠ BẢN (B, C, G)', {
    fill: '#f8fafc', stroke: '#94a3b8'
  });

  const startX = 160, startY = 164, cw = 138, ch = 84, gap = 8;
  const cols = ['B — Doanh nghiệp', 'C — Công dân / NTD', 'G — Chính phủ / CQNN'];
  const rows = ['B (DN)', 'C (Cá nhân)', 'G (CQNN)'];

  // Header corner & column headers
  body += drawBox({ x: 44, y: 114, w: 108, h: 42, title: 'Bên gửi ↓', lines: ['Bên nhận →'], variant: 'muted', rx: 4 });
  cols.forEach((c, ci) => {
    body += drawBox({ x: startX + ci * (cw + gap), y: 114, w: cw, h: 42, title: c, variant: 'default', rx: 4 });
  });

  const matrix = [
    [
      { k: 'B2B', s: 'DN ↔ DN', ex: 'Alibaba, EDI', v: 'accent' },
      { k: 'B2C', s: 'DN → Người dùng', ex: 'Shopee Mall, Tiki', v: 'accent' },
      { k: 'B2G', s: 'DN → Nhà nước', ex: 'Đấu thầu công', v: 'teal' }
    ],
    [
      { k: 'C2B', s: 'Cá nhân → DN', ex: 'Freelancer, đấu giá', v: 'accent' },
      { k: 'C2C', s: 'Cá nhân ↔ Cá nhân', ex: 'Chợ Tốt, FB Market', v: 'accent' },
      { k: 'C2G', s: 'Công dân → Nhà nước', ex: 'Thuế TNCN, iHanoi', v: 'teal' }
    ],
    [
      { k: 'G2B', s: 'Nhà nước → DN', ex: 'eTax, VNACCS', v: 'teal' },
      { k: 'G2C', s: 'Nhà nước → Công dân', ex: 'Cổng DVC, VNeID', v: 'teal' },
      { k: 'G2G', s: 'CQNN ↔ CQNN', ex: 'Trục văn bản, NDXP', v: 'teal' }
    ]
  ];

  rows.forEach((r, ri) => {
    const ry = startY + ri * (ch + gap);
    body += drawBox({ x: 44, y: ry, w: 108, h: ch, title: r, variant: 'default', rx: 4 });
    matrix[ri].forEach((cell, ci) => {
      const cx = startX + ci * (cw + gap);
      body += drawBox({
        x: cx, y: ry, w: cw, h: ch,
        title: cell.k,
        lines: [cell.s, `VD: ${cell.ex}`],
        variant: cell.v,
        headerH: 26,
        rx: 5
      });
    });
  });

  // Right Zone: Internal E models + Intermediaries
  body += drawZone(624, 82, 326, 206, 'MỞ RỘNG NỘI BỘ (+ CHỦ THỂ E: NHÂN VIÊN)', {
    fill: '#fffaf5', stroke: '#fdba74', titleColor: '#9a3412'
  });
  body += drawBox({
    x: 640, y: 118, w: 294, h: 72,
    title: 'G2E — Cơ quan Nhà nước ↔ Công chức',
    lines: ['Văn phòng điện tử eOffice, QL nhân sự CCVC,', 'lịch công tác, chấm công & đào tạo trực tuyến'],
    variant: 'warm',
    align: 'left'
  });
  body += drawBox({
    x: 640, y: 202, w: 294, h: 72,
    title: 'B2E — Doanh nghiệp ↔ Nhân viên',
    lines: ['Cổng nội bộ doanh nghiệp, duyệt nghỉ phép,', 'xem phiếu lương, trình duyệt chi tiêu điện tử'],
    variant: 'warm',
    align: 'left'
  });

  body += drawZone(624, 302, 326, 156, 'TỔ CHỨC TRUNG GIAN HỖ TRỢ (LUẬT GDĐT 2023)', {
    fill: '#f8fafc', stroke: '#94a3b8'
  });
  body += drawBox({
    x: 640, y: 336, w: 294, h: 108,
    lines: [
      '1. Nền tảng trung gian / Sàn giao dịch TMĐT',
      '2. Ngân hàng, ví điện tử & cổng thanh toán',
      '3. Tổ chức chứng thực chữ ký số (CA)',
      '4. Đơn vị bưu chính – vận chuyển (Logistics)'
    ],
    variant: 'default',
    align: 'left'
  });

  // Bottom summary bar
  body += drawBox({
    x: 30, y: 472, w: 920, h: 52,
    title: 'TỔNG HỢP: 3 × 3 = 9 MÔ HÌNH CƠ BẢN + 2 MÔ HÌNH NỘI BỘ (G2E, B2E) = 11 MÔ HÌNH GIAO DỊCH ĐIỆN TỬ',
    lines: ['7 mô hình trọng tâm thường gặp nhất: B2B · B2C · C2C (Thương mại điện tử) và G2C · G2B · G2G · G2E (Hành chính / Chính phủ điện tử)'],
    variant: 'muted'
  });

  const legend = [
    { type: 'box', fill: '#eff6ff', stroke: '#1d4ed8', label: 'Nhóm Thương mại & xã hội (B2B, B2C, C2C, C2B)' },
    { type: 'box', fill: '#f0fdfa', stroke: '#0f766e', label: 'Nhóm Khu vực công (G2C, G2B, G2G, B2G, C2G)' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Tác nghiệp nội bộ (G2E, B2E)' }
  ];

  return wrapSvg(w, h, {
    title: 'ĐỐI TƯỢNG THAM GIA VÀ MA TRẬN CÁC MÔ HÌNH GIAO DỊCH ĐIỆN TỬ',
    subtitle: 'Bốn chủ thể trực tiếp (G, B, C, E) cùng tổ chức trung gian hạ tầng – thanh toán – chứng thực số',
    legend
  }, body);
}

// ---------------------------------------------------------------------------
// 6. Câu 8: Khung Kiến trúc CPĐT Việt Nam 1.0 (Công văn 1178/BTTTT-THH)
// ---------------------------------------------------------------------------
function buildHinh08() {
  const w = 1020, h = 680;
  let connectors = '';
  let boxes = '';

  // (9) Top governance bar
  boxes += drawBox({
    x: 34, y: 84, w: 806, h: 48,
    badge: '9',
    title: 'QUẢN LÝ, CHỈ ĐẠO',
    lines: ['Cơ chế chính sách, pháp luật, tiêu chuẩn/quy chuẩn kỹ thuật & chỉ đạo điều hành xuyên suốt'],
    variant: 'warm',
    align: 'left'
  });

  // (10) Right vertical Information Security column
  boxes += drawBox({
    x: 856, y: 84, w: 130, h: 512,
    badge: '10',
    title: 'AN TOÀN',
    lines: [
      'THÔNG TIN',
      '',
      '• Bảo mật dữ liệu',
      '• An ninh mạng',
      '• Phòng chống mã độc',
      '• Giám sát & ứng cứu',
      '  sự cố xuyên suốt',
      '  toàn bộ các lớp',
      '  kiến trúc CPĐT'
    ],
    variant: 'warm',
    align: 'left'
  });

  // Layers (1) -> (2) -> (3) -> (4)
  const lx = 34, lw = 806;
  boxes += drawBox({
    x: lx, y: 146, w: lw, h: 48,
    badge: '1',
    title: 'NGƯỜI SỬ DỤNG',
    lines: ['Người dân   |   Doanh nghiệp   |   Cán bộ, công chức, viên chức (CBCCVC)'],
    variant: 'default',
    align: 'left'
  });

  boxes += drawBox({
    x: lx, y: 214, w: lw, h: 48,
    badge: '2',
    title: 'KÊNH GIAO TIẾP',
    lines: ['Cổng / Trang thông tin điện tử   |   Thiết bị di động   |   Kiosk công cộng   |   Trực tiếp tại cơ quan'],
    variant: 'default',
    align: 'left'
  });

  boxes += drawBox({
    x: lx, y: 282, w: lw, h: 50,
    badge: '3',
    title: 'CỔNG THÔNG TIN ĐIỆN TỬ CHÍNH PHỦ',
    lines: ['Đầu mối truy cập tập trung kết nối người dùng tới các ứng dụng & dịch vụ công Bộ, ngành, địa phương'],
    variant: 'teal',
    align: 'left'
  });

  boxes += drawBox({
    x: lx, y: 354, w: lw, h: 58,
    badge: '4',
    title: 'HỆ THỐNG KẾT NỐI, LIÊN THÔNG CÁC HTTT Ở TRUNG ƯƠNG VÀ ĐỊA PHƯƠNG',
    lines: ['Trục tích hợp và chia sẻ dữ liệu bảo đảm trao đổi thông tin thông suốt giữa Trung ương – Tỉnh – Huyện – Xã'],
    variant: 'accent',
    align: 'left'
  });

  // Bidirectional arrows between (1)<->(2)<->(3)<->(4)
  [
    [194, 214],
    [262, 282],
    [332, 354]
  ].forEach(([y1, y2]) => {
    connectors += drawConnector({
      points: [{ x: 437, y: y1 }, { x: 437, y: y2 }],
      color: '#334155',
      width: 1.6,
      startMarker: 'arrow-ink',
      endMarker: 'arrow-ink'
    });
  });

  // Row (5), (6), (7)
  const r5y = 436, r5h = 84;
  boxes += drawBox({
    x: 34, y: r5y, w: 258, h: r5h,
    badge: '5',
    title: 'Kiến trúc CPĐT Bộ / Tỉnh',
    lines: ['Mô hình, ứng dụng, CSDL & hạ tầng', 'triển khai tại từng Bộ, ngành, địa phương'],
    variant: 'default',
    align: 'left'
  });
  boxes += drawBox({
    x: 308, y: r5y, w: 266, h: r5h,
    badge: '6',
    title: 'HTTT / CSDL quốc gia',
    lines: ['Dữ liệu dùng chung cốt lõi: Dân cư,', 'Đất đai, Đăng ký DN, Bảo hiểm, Hộ tịch...'],
    variant: 'teal',
    align: 'left'
  });
  boxes += drawBox({
    x: 590, y: r5y, w: 250, h: r5h,
    badge: '7',
    title: 'HTTT ngoài cơ quan NN',
    lines: ['Ngân hàng, DN cung ứng dịch vụ,', 'bưu chính, chứng thực chữ ký số...'],
    variant: 'default',
    align: 'left'
  });

  // Arrows from (4) down to (5), (6), (7)
  [163, 441, 715].forEach(ax => {
    connectors += drawConnector({
      points: [{ x: ax, y: 412 }, { x: ax, y: r5y }],
      color: '#1d4ed8',
      width: 1.6,
      startMarker: 'arrow-accent',
      endMarker: 'arrow-accent'
    });
  });

  // Bottom (8) Infrastructure
  boxes += drawBox({
    x: lx, y: 540, w: lw, h: 56,
    badge: '8',
    title: 'HẠ TẦNG KỸ THUẬT',
    lines: ['Trung tâm dữ liệu (Data Center), máy chủ, lưu trữ, mạng LAN/WAN & mạng truyền số liệu chuyên dùng (MTSLCD)'],
    variant: 'muted',
    align: 'left'
  });

  [163, 441, 715].forEach(ax => {
    connectors += drawConnector({
      points: [{ x: ax, y: r5y + r5h }, { x: ax, y: 540 }],
      color: '#64748b',
      width: 1.4,
      endMarker: 'arrow-muted',
      startMarker: 'arrow-muted'
    });
  });

  const legend = [
    { type: 'box', fill: '#eff6ff', stroke: '#1d4ed8', label: 'Trục liên thông trọng yếu (Thành phần 4)' },
    { type: 'box', fill: '#f0fdfa', stroke: '#0f766e', label: 'Cổng TTĐT Chính phủ & CSDL quốc gia (3, 6)' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Chỉ đạo quản lý & An toàn thông tin (9, 10)' }
  ];

  return wrapSvg(w, h, {
    title: 'SƠ ĐỒ TỔNG THỂ KHUNG KIẾN TRÚC CHÍNH PHỦ ĐIỆN TỬ VIỆT NAM 1.0',
    subtitle: 'Ban hành kèm Công văn số 1178/BTTTT-THH ngày 21/4/2015 của Bộ Thông tin và Truyền thông (10 thành phần chính)',
    legend
  }, connectors + boxes);
}

// ---------------------------------------------------------------------------
// 7. Câu 9: Công nghệ & 4 tầng cấu thành Portal
// ---------------------------------------------------------------------------
function buildHinh09() {
  const w = 960, h = 610;
  let connectors = '';
  let boxes = '';

  // User top node
  boxes += drawBox({
    x: 280, y: 80, w: 400, h: 38,
    title: 'NGƯỜI DÙNG CUỐI (Trình duyệt PC / Ứng dụng di động)',
    variant: 'default',
    rx: 5
  });

  // Layer 1: Presentation
  boxes += drawZone(44, 138, 872, 92, '1. TẦNG TRÌNH BÀY (Presentation Layer) — HTML5, CSS3, JS/AJAX, Responsive Design', {
    fill: '#eff6ff', stroke: '#1d4ed8', titleColor: '#1e3a8a'
  });
  boxes += drawBox({ x: 60, y: 168, w: 264, h: 52, title: 'Theme & Layout', lines: ['Khung giao diện, menu điều hướng'], variant: 'default', rx: 5 });
  boxes += drawBox({ x: 344, y: 168, w: 272, h: 52, title: 'Portlets (JSR-168 / JSR-286, WSRP)', lines: ['Khối chức năng độc lập "cắm-và-chạy"'], variant: 'accent', rx: 5 });
  boxes += drawBox({ x: 636, y: 168, w: 264, h: 52, title: 'Aggregation Engine', lines: ['Tổng hợp & ghép Portlets thành trang'], variant: 'default', rx: 5 });

  // Layer 2: Runtime & Container
  boxes += drawZone(44, 248, 872, 84, '2. TẦNG THỰC THI (Runtime & Container Layer) — Liferay, SharePoint, WebSphere, Oracle WebCenter', {
    fill: '#f8fafc', stroke: '#475569', titleColor: '#0f172a'
  });
  boxes += drawBox({ x: 60, y: 276, w: 404, h: 46, title: 'Web Server (Nginx, Apache, IIS)', lines: ['Tiếp nhận HTTPS, giải mã SSL/TLS & cân bằng tải'], variant: 'default', rx: 5 });
  boxes += drawBox({ x: 496, y: 276, w: 404, h: 46, title: 'Portal Server & Portlet Container', lines: ['Quản lý vòng đời (init, action, render, destroy) của Portlets'], variant: 'default', rx: 5 });

  // Layer 3: Core Services
  boxes += drawZone(44, 350, 872, 92, '3. TẦNG DỊCH VỤ LÕI (Portal Core Services)', {
    fill: '#f0fdfa', stroke: '#0f766e', titleColor: '#115e59'
  });
  boxes += drawBox({ x: 60, y: 380, w: 272, h: 52, title: 'Định danh & Phân quyền', lines: ['SSO (SAML, OAuth2/OIDC), LDAP, RBAC'], variant: 'teal', rx: 5 });
  boxes += drawBox({ x: 350, y: 380, w: 260, h: 52, title: 'Cá nhân hóa & CMS', lines: ['Tùy biến giao diện theo vai trò, xuất bản tin'], variant: 'default', rx: 5 });
  boxes += drawBox({ x: 628, y: 380, w: 272, h: 52, title: 'Tìm kiếm & Workflow', lines: ['Solr / Elasticsearch, lịch & thông báo'], variant: 'default', rx: 5 });

  // Layer 4: Integration & Data
  boxes += drawZone(44, 460, 872, 90, '4. TẦNG TÍCH HỢP & DỮ LIỆU (Integration & Data Layer)', {
    fill: '#fff7ed', stroke: '#c2410c', titleColor: '#9a3412'
  });
  boxes += drawBox({ x: 60, y: 490, w: 500, h: 50, title: 'Tích hợp hệ thống: SOA / Web Services (SOAP, REST API) / ESB', lines: ['Kết nối dữ liệu thời gian thực tới ERP, CRM, HRM, eOffice & CSDL quốc gia'], variant: 'warm', rx: 5 });
  boxes += drawBox({ x: 580, y: 490, w: 320, h: 50, title: 'Cơ sở dữ liệu Portal', lines: ['Lưu tài khoản, phân quyền, cấu hình & CMS'], variant: 'default', rx: 5 });

  // Vertical bidirectional arrows between layers
  [
    [118, 138],
    [230, 248],
    [332, 350],
    [442, 460]
  ].forEach(([y1, y2]) => {
    connectors += drawConnector({
      points: [{ x: 480, y: y1 }, { x: 480, y: y2 }],
      color: '#1d4ed8',
      width: 1.7,
      startMarker: 'arrow-accent',
      endMarker: 'arrow-accent'
    });
  });

  const legend = [
    { type: 'box', fill: '#eff6ff', stroke: '#1d4ed8', label: 'Giao diện & Portlet chuẩn mở' },
    { type: 'box', fill: '#f0fdfa', stroke: '#0f766e', label: 'Dịch vụ lõi dùng chung (SSO, CMS, Search)' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Tích hợp API/ESB & CSDL' }
  ];

  return wrapSvg(w, h, {
    title: 'CÔNG NGHỆ VÀ CÁC THÀNH PHẦN CẤU THÀNH NÊN PORTAL',
    subtitle: 'Kiến trúc 4 tầng từ trình bày Portlet tới tích hợp liên thông dữ liệu đa hệ thống',
    legend
  }, connectors + boxes);
}

// ---------------------------------------------------------------------------
// 8. Câu 14 & 37: 4 Giai đoạn phát triển Hành chính điện tử
// ---------------------------------------------------------------------------
function buildHinh14() {
  const w = 960, h = 590;
  let body = '';
  let connectors = '';

  // Axes
  body += `<line x1="56" y1="428" x2="56" y2="86" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-muted)"/>`;
  body += `<line x1="56" y1="428" x2="922" y2="428" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-muted)"/>`;
  body += drawLabelTag(152, 94, 'Giá trị phục vụ & Mức tích hợp', {
    color: '#334155', border: '#cbd5e1', bg: '#ffffff', w: 176, h: 20
  });
  body += drawLabelTag(812, 412, 'Mức trưởng thành & Độ phức tạp', {
    color: '#334155', border: '#cbd5e1', bg: '#ffffff', w: 186, h: 20
  });

  const stages = [
    {
      x: 80, y: 318, w: 192, h: 94, b: 'GĐ 1',
      t: 'Hiện diện / Thông tin',
      l: ['• Cung cấp tin tức, quy định 1 chiều', '• Công khai thủ tục, biểu mẫu', 'VD: Cổng thông tin cơ quan'],
      v: 'default'
    },
    {
      x: 294, y: 248, w: 192, h: 94, b: 'GĐ 2',
      t: 'Tương tác (2 chiều)',
      l: ['• Tìm kiếm văn bản, hỏi đáp email', '• Tải biểu mẫu, khảo sát ý kiến', 'VD: Tải mẫu đơn, hỏi đáp online'],
      v: 'teal'
    },
    {
      x: 508, y: 178, w: 192, h: 94, b: 'GĐ 3',
      t: 'Giao dịch (Trực tuyến)',
      l: ['• Định danh VNeID, nộp hồ sơ số', '• Ký số, thanh toán & trả kết quả', 'VD: Cấp đổi GPLX toàn trình'],
      v: 'accent'
    },
    {
      x: 722, y: 108, w: 198, h: 94, b: 'GĐ 4',
      t: 'Chuyển đổi / Tích hợp',
      l: ['• Liên thông CSDL đa ngành (NDXP)', '• Khai báo 1 lần, dịch vụ chủ động', 'VD: Liên thông khai sinh 3 trong 1'],
      v: 'warm'
    }
  ];

  // Orthogonal stepped arrows connecting stages
  for (let i = 0; i < stages.length - 1; i++) {
    const a = stages[i];
    const b = stages[i + 1];
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const xm = (x1 + b.x) / 2;
    const y2 = b.y + b.h / 2;
    connectors += drawConnector({
      points: [
        { x: x1, y: y1 },
        { x: xm, y: y1 },
        { x: xm, y: y2 },
        { x: b.x, y: y2 }
      ],
      color: '#1d4ed8',
      width: 1.8,
      endMarker: 'arrow-accent',
      r: 5
    });
  }

  let boxes = '';
  stages.forEach(st => {
    boxes += drawBox({
      x: st.x, y: st.y, w: st.w, h: st.h,
      badge: st.b,
      title: st.t,
      lines: st.l,
      variant: st.v,
      headerH: 28,
      align: 'left'
    });
  });

  // Vietnam regulatory comparison bar below axis
  boxes += drawBox({
    x: 56, y: 446, w: 864, h: 78,
    title: 'ĐỐI CHIẾU CẤP ĐỘ DỊCH VỤ CÔNG TRỰC TUYẾN TẠI VIỆT NAM',
    headerH: 26,
    variant: 'muted',
    align: 'left',
    lines: [
      '• Trước 15/8/2022 (Nghị định 43/2011/NĐ-CP): Phân chia 4 mức độ (Mức 1: Thông tin → Mức 2: Tải mẫu → Mức 3: Nộp online → Mức 4: Thanh toán & trả KQ online).',
      '• Hiện hành từ 15/8/2022 (Nghị định 42/2022/NĐ-CP): Chuẩn hóa thành 2 mức độ thực chất — Dịch vụ công trực tuyến MỘT PHẦN và TOÀN TRÌNH.'
    ]
  });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Tiến trình nâng cấp qua 4 giai đoạn' },
    { type: 'box', fill: '#eff6ff', stroke: '#1d4ed8', label: 'Giao dịch trọn vẹn trên mạng (GĐ 3)' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Liên thông CSDL & dịch vụ chủ động (GĐ 4)' }
  ];

  return wrapSvg(w, h, {
    title: 'CÁC GIAI ĐOẠN PHÁT TRIỂN HÀNH CHÍNH ĐIỆN TỬ (GARTNER / LIÊN HỢP QUỐC)',
    subtitle: 'Quá trình tiến hóa từ cung cấp thông tin tĩnh một chiều đến liên thông dữ liệu toàn diện',
    legend
  }, body + connectors + boxes);
}

// ---------------------------------------------------------------------------
// 9. Câu 16: Nguyên tắc hoạt động của Web động (6 bước)
// ---------------------------------------------------------------------------
function buildHinh16() {
  const w = 980, h = 570;
  let connectors = '';
  let boxes = '';
  let labels = '';

  // 4 Major architectural components
  boxes += drawBox({
    x: 42, y: 98, w: 256, h: 130,
    title: 'TRÌNH DUYỆT (Client)',
    headerH: 32,
    variant: 'accent',
    align: 'left',
    lines: [
      '• Chrome, Edge, Firefox, Safari...',
      '• Người dùng nhập URL / Form.',
      '• Gửi Cookie / Session Token.',
      '• Hiển thị HTML/CSS/JS động.'
    ]
  });

  boxes += drawBox({
    x: 646, y: 98, w: 292, h: 130,
    title: 'WEB SERVER',
    headerH: 32,
    variant: 'default',
    align: 'left',
    lines: [
      '• Nginx, Apache, Microsoft IIS.',
      '• Tiếp nhận yêu cầu HTTP/HTTPS.',
      '• Trả trực tiếp tệp tĩnh (ảnh, CSS).',
      '• Chuyển yêu cầu động cho App Server.'
    ]
  });

  boxes += drawBox({
    x: 646, y: 334, w: 292, h: 140,
    title: 'APPLICATION SERVER',
    headerH: 32,
    variant: 'teal',
    align: 'left',
    lines: [
      '• PHP, Java, .NET, Node.js, Python.',
      '• Kiểm tra quyền & dữ liệu đầu vào.',
      '• Thực thi logic nghiệp vụ.',
      '• Điền dữ liệu vào Template HTML/JSON.'
    ]
  });

  boxes += drawDatabase({
    x: 42, y: 334, w: 256, h: 140,
    title: 'CƠ SỞ DỮ LIỆU (DB Server)',
    lines: [
      'MySQL, PostgreSQL, SQL Server, Oracle',
      'Thực thi truy vấn & trả ResultSet'
    ],
    variant: 'warm'
  });

  // (1) Client -> Web Server (top track y=134)
  connectors += drawConnector({
    points: [{ x: 298, y: 134 }, { x: 646, y: 134 }],
    color: '#1d4ed8',
    width: 2.0,
    endMarker: 'arrow-accent'
  });
  labels += drawLabelTag(472, 134, '(1) Gửi HTTP Request (URL, Form, Token)', {
    color: '#1e3a8a', border: '#93c5fd', bg: '#eff6ff', w: 248, h: 22
  });

  // (6) Web Server -> Client (bottom track y=194)
  connectors += drawConnector({
    points: [{ x: 646, y: 194 }, { x: 298, y: 194 }],
    color: '#c2410c',
    width: 1.9,
    dashed: true,
    endMarker: 'arrow-warm'
  });
  labels += drawLabelTag(472, 194, '(6) Trả HTTP Response (HTML động / JSON)', {
    color: '#9a3412', border: '#fdba74', bg: '#fff7ed', w: 248, h: 22
  });

  // (2) Web Server -> App Server (left vertical track x=720)
  connectors += drawConnector({
    points: [{ x: 720, y: 228 }, { x: 720, y: 334 }],
    color: '#1d4ed8',
    width: 2.0,
    endMarker: 'arrow-accent'
  });
  labels += drawLabelTag(706, 281, '(2) Chuyển xử lý', {
    color: '#1e3a8a', border: '#93c5fd', bg: '#eff6ff', w: 112, h: 22
  });

  // (5) App Server -> Web Server (right vertical track x=864)
  connectors += drawConnector({
    points: [{ x: 864, y: 334 }, { x: 864, y: 228 }],
    color: '#c2410c',
    width: 1.9,
    dashed: true,
    endMarker: 'arrow-warm'
  });
  labels += drawLabelTag(866, 281, '(5) Kết xuất HTML', {
    color: '#9a3412', border: '#fdba74', bg: '#fff7ed', w: 118, h: 22
  });

  // (3) App Server -> Database (top track y=374)
  connectors += drawConnector({
    points: [{ x: 646, y: 374 }, { x: 298, y: 374 }],
    color: '#1d4ed8',
    width: 2.0,
    endMarker: 'arrow-accent'
  });
  labels += drawLabelTag(472, 374, '(3) Gửi truy vấn SQL / NoSQL', {
    color: '#1e3a8a', border: '#93c5fd', bg: '#eff6ff', w: 204, h: 22
  });

  // (4) Database -> App Server (bottom track y=436)
  connectors += drawConnector({
    points: [{ x: 298, y: 436 }, { x: 646, y: 436 }],
    color: '#c2410c',
    width: 1.9,
    dashed: true,
    endMarker: 'arrow-warm'
  });
  labels += drawLabelTag(472, 436, '(4) Trả tập kết quả (ResultSet)', {
    color: '#9a3412', border: '#fdba74', bg: '#fff7ed', w: 204, h: 22
  });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Luồng yêu cầu & truy vấn đi vào (Bước 1 → 2 → 3)' },
    { type: 'line', color: '#c2410c', dashed: true, marker: 'arrow-warm', label: 'Luồng dữ liệu & trang HTML động trả về (Bước 4 → 5 → 6)' }
  ];

  return wrapSvg(w, h, {
    title: 'MÔ HÌNH NGUYÊN TẮC HOẠT ĐỘNG CỦA WEB ĐỘNG (6 BƯỚC)',
    subtitle: 'Nội dung HTML được kết xuất tức thời từ dữ liệu thực tế thay vì tệp tĩnh cố định',
    legend
  }, connectors + boxes + labels);
}

// ---------------------------------------------------------------------------
// 10. Câu 18: Thành phần & Kiến trúc Web Service (Publish – Find – Bind)
// ---------------------------------------------------------------------------
function buildHinh18() {
  const w = 960, h = 570;
  let connectors = '';
  let boxes = '';
  let labels = '';

  // Top center: Service Registry (UDDI)
  boxes += drawBox({
    x: 310, y: 86, w: 340, h: 86,
    title: 'SERVICE REGISTRY (UDDI)',
    headerH: 30,
    variant: 'warm',
    lines: [
      'Danh bạ trực tuyến lưu mô tả dịch vụ',
      'Giúp nhà cung cấp đăng ký & Client tìm kiếm'
    ]
  });

  // Bottom Left: Service Provider
  boxes += drawBox({
    x: 42, y: 294, w: 288, h: 120,
    title: 'SERVICE PROVIDER (Nhà cung cấp)',
    headerH: 30,
    variant: 'teal',
    align: 'left',
    lines: [
      '• Chứa logic nghiệp vụ & CSDL gốc.',
      '• Xuất bản tài liệu mô tả WSDL.',
      '• Tiếp nhận lời gọi & trả kết quả.'
    ]
  });

  // Bottom Right: Service Requestor
  boxes += drawBox({
    x: 630, y: 294, w: 288, h: 120,
    title: 'SERVICE REQUESTOR (Ứng dụng khách)',
    headerH: 30,
    variant: 'accent',
    align: 'left',
    lines: [
      '• Hệ thống Web, Mobile hoặc ERP/Portal.',
      '• Đọc WSDL / OpenAPI để hiểu hàm.',
      '• Gọi dịch vụ qua mạng chuẩn hóa.'
    ]
  });

  // (1) PUBLISH: Provider top (x=186, y=294) -> up to y=129 -> right to Registry (x=310, y=129)
  connectors += drawConnector({
    points: [
      { x: 186, y: 294 },
      { x: 186, y: 129 },
      { x: 310, y: 129 }
    ],
    color: '#c2410c',
    width: 1.9,
    endMarker: 'arrow-warm'
  });
  labels += drawLabelTag(186, 204, '(1) PUBLISH — Đăng ký WSDL', {
    color: '#9a3412', border: '#fdba74', bg: '#fff7ed', w: 182, h: 22
  });

  // (2) FIND: Registry right (x=650, y=129) -> right to x=774 -> down to Requestor top (x=774, y=294)
  connectors += drawConnector({
    points: [
      { x: 650, y: 129 },
      { x: 774, y: 129 },
      { x: 774, y: 294 }
    ],
    color: '#1d4ed8',
    width: 1.9,
    endMarker: 'arrow-accent'
  });
  labels += drawLabelTag(774, 204, '(2) FIND — Tìm & lấy WSDL/URI', {
    color: '#1e3a8a', border: '#93c5fd', bg: '#eff6ff', w: 194, h: 22
  });

  // (3a) BIND & INVOKE Request: Requestor -> Provider (y=334)
  connectors += drawConnector({
    points: [{ x: 630, y: 334 }, { x: 330, y: 334 }],
    color: '#1d4ed8',
    width: 1.9,
    endMarker: 'arrow-accent'
  });
  labels += drawLabelTag(480, 334, '(3a) BIND — Gửi SOAP/XML (hoặc REST/JSON)', {
    color: '#1e3a8a', border: '#93c5fd', bg: '#eff6ff', w: 256, h: 22
  });

  // (3b) Response: Provider -> Requestor (y=380)
  connectors += drawConnector({
    points: [{ x: 330, y: 380 }, { x: 630, y: 380 }],
    color: '#0f766e',
    width: 1.9,
    dashed: true,
    endMarker: 'arrow-teal'
  });
  labels += drawLabelTag(480, 380, '(3b) Trả kết quả qua HTTP / HTTPS', {
    color: '#115e59', border: '#5eead4', bg: '#f0fdfa', w: 222, h: 22
  });

  // Bottom Core Technology Stack summary
  boxes += drawBox({
    x: 42, y: 438, w: 876, h: 72,
    title: '4 THÀNH PHẦN CÔNG NGHỆ CỐT LÕI CỦA WEB SERVICE (NGĂN XẾP CHUẨN W3C)',
    headerH: 26,
    variant: 'muted',
    lines: [
      '• XML: Ngôn ngữ nền tảng đóng gói dữ liệu độc lập hệ điều hành     • SOAP / REST: Giao thức truyền thông điệp qua HTTP/HTTPS',
      '• WSDL / OpenAPI: Mô tả chi tiết hàm, tham số, địa chỉ Endpoint URI  • UDDI: Danh bạ điện tử phục vụ xuất bản & khám phá dịch vụ'
    ],
    align: 'left'
  });

  const legend = [
    { type: 'line', color: '#c2410c', marker: 'arrow-warm', label: 'Bước 1: Xuất bản mô tả dịch vụ' },
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Bước 2 & 3a: Tìm kiếm và gọi dịch vụ' },
    { type: 'line', color: '#0f766e', dashed: true, marker: 'arrow-teal', label: 'Bước 3b: Kết quả trả về' }
  ];

  return wrapSvg(w, h, {
    title: 'KIẾN TRÚC VÀ CÁC THÀNH PHẦN CỦA WEB SERVICE (PUBLISH – FIND – BIND)',
    subtitle: 'Cơ chế tương tác máy-với-máy (M2M) độc lập ngôn ngữ lập trình và nền tảng phần cứng',
    legend
  }, connectors + boxes + labels);
}

// ---------------------------------------------------------------------------
// 11. Câu 19: Quy trình 7 bước xây dựng giải pháp tác nghiệp trên Portal
// ---------------------------------------------------------------------------
function buildHinh19() {
  const w = 980, h = 570;
  let connectors = '';
  let boxes = '';
  let labels = '';

  const row1 = [
    { x: 40, b: 'B1', t: 'Khảo sát hiện trạng', l: ['• Nghiên cứu cơ cấu, nhiệm vụ', '• Đo lường điểm nghẽn hồ sơ'], v: 'default' },
    { x: 272, b: 'B2', t: 'Chuẩn hóa quy trình', l: ['• Cắt bước thừa trước số hóa', '• Chốt đầu vào/ra, SLA, quyền'], v: 'warm' },
    { x: 504, b: 'B3', t: 'Thiết kế trên Portal', l: ['• Portlet, CSDL, UI/UX thân thiện', '• Thiết kế SSO, RBAC & API'], v: 'accent' },
    { x: 736, b: 'B4', t: 'Lập trình & Tích hợp', l: ['• Cấu hình Workflow (BPM)', '• Tích hợp chữ ký số, API/ESB'], v: 'default' }
  ];

  const row2 = [
    { x: 736, b: 'B5', t: 'Kiểm thử & Thí điểm', l: ['• Test chức năng, tải, bảo mật', '• Chạy Pilot & hiệu chỉnh'], v: 'default' },
    { x: 504, b: 'B6', t: 'Đào tạo & Chuyển giao', l: ['• Tập huấn cán bộ, lãnh đạo', '• Vận hành chính thức'], v: 'default' },
    { x: 272, b: 'B7', t: 'Giám sát KPI & Cải tiến', l: ['• Đo thời gian chờ, tỷ lệ trả', '• Bảo trì & tối ưu liên tục'], v: 'teal' }
  ];

  const bw = 204, bh = 108, y1 = 98, y2 = 292;

  // Row 1 connectors: B1 -> B2 -> B3 -> B4
  for (let i = 0; i < 3; i++) {
    connectors += drawConnector({
      points: [{ x: row1[i].x + bw, y: y1 + bh / 2 }, { x: row1[i + 1].x, y: y1 + bh / 2 }],
      color: '#1d4ed8',
      width: 1.8,
      endMarker: 'arrow-accent'
    });
  }

  // Drop B4 -> B5
  connectors += drawConnector({
    points: [{ x: 736 + bw / 2, y: y1 + bh }, { x: 736 + bw / 2, y: y2 }],
    color: '#1d4ed8',
    width: 1.8,
    endMarker: 'arrow-accent'
  });

  // Row 2 connectors: B5 -> B6 -> B7 (right to left)
  for (let i = 0; i < 2; i++) {
    connectors += drawConnector({
      points: [{ x: row2[i].x, y: y2 + bh / 2 }, { x: row2[i + 1].x + bw, y: y2 + bh / 2 }],
      color: '#1d4ed8',
      width: 1.8,
      endMarker: 'arrow-accent'
    });
  }

  // Feedback dashed arrow: left of B7 -> x=142 -> up into bottom of B1
  connectors += drawConnector({
    points: [
      { x: 272, y: y2 + bh / 2 },
      { x: 142, y: y2 + bh / 2 },
      { x: 142, y: y1 + bh }
    ],
    color: '#c2410c',
    width: 1.7,
    dashed: true,
    endMarker: 'arrow-warm'
  });
  labels += drawLabelTag(142, 250, 'Đo lường & Cải tiến chu kỳ mới', {
    color: '#9a3412', border: '#fdba74', bg: '#fff7ed', w: 196, h: 22
  });

  [...row1].forEach(st => {
    boxes += drawBox({
      x: st.x, y: y1, w: bw, h: bh,
      badge: st.b, title: st.t, lines: st.l, variant: st.v, headerH: 30, align: 'left'
    });
  });
  [...row2].forEach(st => {
    boxes += drawBox({
      x: st.x, y: y2, w: bw, h: bh,
      badge: st.b, title: st.t, lines: st.l, variant: st.v, headerH: 30, align: 'left'
    });
  });

  // Concrete Example strip at bottom
  boxes += drawBox({
    x: 40, y: 428, w: 900, h: 78,
    title: 'VÍ DỤ MINH HỌA: GIẢI PHÁP MUA SẮM VÀ THANH TOÁN VẬT TƯ ĐIỆN TỬ TRÊN PORTAL NỘI BỘ',
    headerH: 26,
    variant: 'muted',
    align: 'left',
    lines: [
      '• Luồng chuẩn hóa 5 mắt xích: Đơn vị lập đề xuất → Trưởng bộ phận duyệt → Cung ứng lấy 3 báo giá → Kế toán kiểm tra ngân sách → Giám đốc ký số.',
      '• Kết quả: Tích hợp SSO + API sổ cái Kế toán + cảnh báo quá hạn SLA 24h giúp rút ngắn chu kỳ phê duyệt từ >7 ngày xuống <2 ngày, xóa nhập liệu lặp.'
    ]
  });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Trình tự triển khai 7 bước chuẩn' },
    { type: 'line', color: '#c2410c', dashed: true, marker: 'arrow-warm', label: 'Vòng lặp phản hồi tối ưu quy trình liên tục' }
  ];

  return wrapSvg(w, h, {
    title: 'QUY TRÌNH 7 BƯỚC XÂY DỰNG GIẢI PHÁP TÁC NGHIỆP TRÊN CỔNG THÔNG TIN ĐIỆN TỬ',
    subtitle: 'Nguyên tắc cốt lõi: Chuẩn hóa và tái cấu trúc quy trình nghiệp vụ trước khi số hóa lên Portal',
    legend
  }, connectors + boxes + labels);
}

// ---------------------------------------------------------------------------
// 12. Câu 21: Mô hình Yêu cầu Bảo mật (CIA + 4 yêu cầu mở rộng)
// ---------------------------------------------------------------------------
function buildHinh21() {
  const w = 960, h = 570;
  let body = '';
  let connectors = '';
  let boxes = '';

  // Left Zone: CIA Triad
  body += drawZone(34, 82, 466, 412, 'NHÓM 1: BA YÊU CẦU NỀN TẢNG (TAM GIÁC CIA)', {
    fill: '#f8fafc', stroke: '#94a3b8'
  });

  // Triangle lines connecting 3 CIA boxes
  const cTop = { x: 267, y: 158 };
  const cLeft = { x: 146, y: 418 };
  const cRight = { x: 388, y: 418 };
  connectors += `<polygon points="${cTop.x},${cTop.y} ${cLeft.x},${cLeft.y} ${cRight.x},${cRight.y}" fill="none" stroke="#1d4ed8" stroke-width="2.2"/>`;

  // Center core node
  boxes += drawBox({
    x: 199, y: 274, w: 136, h: 48,
    title: 'Tài sản HTTT',
    lines: ['Dữ liệu · Hệ thống'],
    variant: 'muted',
    rx: 6
  });

  // 3 CIA vertex boxes
  boxes += drawBox({
    x: 147, y: 114, w: 240, h: 78,
    badge: '1',
    title: 'BÍ MẬT (Confidentiality)',
    lines: ['Chỉ người có quyền mới truy cập', 'Biện pháp: Mã hóa AES/TLS, kiểm soát'],
    variant: 'accent',
    headerH: 26,
    align: 'left'
  });
  boxes += drawBox({
    x: 48, y: 384, w: 212, h: 90,
    badge: '2',
    title: 'TOÀN VẸN (Integrity)',
    lines: ['Chính xác, nguyên vẹn, không sửa', 'sai lệch (Hàm băm SHA, chữ ký số)'],
    variant: 'teal',
    headerH: 26,
    align: 'left'
  });
  boxes += drawBox({
    x: 274, y: 384, w: 212, h: 90,
    badge: '3',
    title: 'SẴN SÀNG (Availability)',
    lines: ['Hoạt động liên tục đúng lúc cần', '(Sao lưu 3-2-1, chống DDoS, dự phòng)'],
    variant: 'warm',
    headerH: 26,
    align: 'left'
  });

  // Right Zone: 4 Extended transaction requirements
  body += drawZone(528, 82, 398, 412, 'NHÓM 2: BỐN YÊU CẦU MỞ RỘNG TRONG GIAO DỊCH SỐ', {
    fill: '#f8fafc', stroke: '#94a3b8'
  });

  const ext = [
    { b: '4', t: 'Xác thực (Authentication)', s: 'Xác minh danh tính thực: Mật khẩu mạnh, MFA/OTP, VNeID, sinh trắc', v: 'default' },
    { b: '5', t: 'Phân quyền (Authorization / RBAC)', s: 'Kiểm soát quyền xem/sửa/duyệt theo nguyên tắc đặc quyền tối thiểu', v: 'default' },
    { b: '6', t: 'Chống chối bỏ (Non-repudiation)', s: 'Ngăn chối bỏ trách nhiệm giao dịch bằng chữ ký số & dấu thời gian', v: 'teal' },
    { b: '7', t: 'Truy vết & Kiểm toán (Auditability)', s: 'Ghi nhật ký Audit Log bất biến mọi thao tác phục vụ đối soát, điều tra', v: 'warm' }
  ];
  ext.forEach((it, idx) => {
    boxes += drawBox({
      x: 546, y: 118 + idx * 92, w: 362, h: 78,
      badge: it.b,
      title: it.t,
      lines: [it.s],
      variant: it.v,
      headerH: 28,
      align: 'left'
    });
  });

  // Bridge connector between zones
  connectors += drawConnector({
    points: [{ x: 500, y: 288 }, { x: 528, y: 288 }],
    color: '#1d4ed8',
    width: 2.0,
    startMarker: 'arrow-accent',
    endMarker: 'arrow-accent'
  });

  const legend = [
    { type: 'box', fill: '#eff6ff', stroke: '#1d4ed8', label: 'Bảo vệ bí mật & xác thực truy cập' },
    { type: 'box', fill: '#f0fdfa', stroke: '#0f766e', label: 'Bảo đảm toàn vẹn & chống chối bỏ' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Duy trì sẵn sàng & truy vết kiểm toán' }
  ];

  return wrapSvg(w, h, {
    title: 'MÔ HÌNH CÁC YÊU CẦU BẢO MẬT HỆ THỐNG THÔNG TIN (CIA + MỞ RỘNG)',
    subtitle: 'Ba trụ cột kỹ thuật cốt lõi kết hợp bốn yêu cầu bảo đảm pháp lý giao dịch tác nghiệp số',
    legend
  }, body + connectors + boxes);
}

// ---------------------------------------------------------------------------
// 13. Câu 28: Lưu đồ quy trình hoạt động chuẩn TMĐT B2C (6 bước)
// ---------------------------------------------------------------------------
function buildHinh28() {
  const w = 980, h = 540;
  let body = '';
  let connectors = '';
  let boxes = '';

  // 3 Swimlanes with left header band
  const lanes = [
    { y: 82, h: 122, t: 'NGƯỜI MUA', sub: '(Khách cá nhân)', fill: '#f5f8ff', stroke: '#93c5fd', tc: '#1e3a8a' },
    { y: 214, h: 122, t: 'NỀN TẢNG TMĐT', sub: '& Thanh toán', fill: '#ffffff', stroke: '#cbd5e1', tc: '#0f172a' },
    { y: 346, h: 118, t: 'KHO VẬN (3PL)', sub: '& Người bán', fill: '#f4fbf9', stroke: '#99f6e4', tc: '#115e59' }
  ];

  lanes.forEach(ln => {
    body += `<rect x="34" y="${ln.y}" width="912" height="${ln.h}" rx="6" fill="${ln.fill}" stroke="${ln.stroke}" stroke-width="1.2"/>`;
    body += `<rect x="34" y="${ln.y}" width="114" height="${ln.h}" rx="6" fill="#f1f5f9" stroke="${ln.stroke}" stroke-width="1.2"/>`;
    body += `<text x="91" y="${ln.y + ln.h / 2 - 4}" text-anchor="middle" class="t-head" fill="${ln.tc}">${ln.t}</text>`;
    body += `<text x="91" y="${ln.y + ln.h / 2 + 14}" text-anchor="middle" class="t-small" fill="#475569">${ln.sub}</text>`;
  });

  // 6 Steps positioned across the 3 lanes without collisions
  const s1 = { x: 168, y: 104, w: 184, h: 78 };
  const s2 = { x: 168, y: 236, w: 184, h: 78 };
  const s3 = { x: 404, y: 104, w: 196, h: 78 };
  const s4 = { x: 404, y: 236, w: 196, h: 78 };
  const s5 = { x: 404, y: 366, w: 296, h: 78 };
  const s6 = { x: 734, y: 104, w: 194, h: 78 };

  // Orthogonal arrows: 1 -> 2 -> 3 -> 4 -> 5 -> 6
  connectors += drawConnector({
    points: [{ x: 260, y: s1.y + s1.h }, { x: 260, y: s2.y }],
    color: '#1d4ed8', width: 1.8, endMarker: 'arrow-accent'
  });
  connectors += drawConnector({
    points: [
      { x: s2.x + s2.w, y: s2.y + s2.h / 2 },
      { x: 378, y: s2.y + s2.h / 2 },
      { x: 378, y: s3.y + s3.h / 2 },
      { x: s3.x, y: s3.y + s3.h / 2 }
    ],
    color: '#1d4ed8', width: 1.8, endMarker: 'arrow-accent'
  });
  connectors += drawConnector({
    points: [{ x: 502, y: s3.y + s3.h }, { x: 502, y: s4.y }],
    color: '#1d4ed8', width: 1.8, endMarker: 'arrow-accent'
  });
  connectors += drawConnector({
    points: [{ x: 502, y: s4.y + s4.h }, { x: 502, y: s5.y }],
    color: '#c2410c', width: 1.8, endMarker: 'arrow-warm'
  });
  connectors += drawConnector({
    points: [
      { x: s5.x + s5.w, y: s5.y + s5.h / 2 },
      { x: s6.x + s6.w / 2, y: s5.y + s5.h / 2 },
      { x: s6.x + s6.w / 2, y: s6.y + s6.h }
    ],
    color: '#0f766e', width: 1.9, endMarker: 'arrow-teal'
  });

  boxes += drawBox({ ...s1, badge: '1', title: 'Tìm kiếm & Xem hàng', lines: ['So sánh giá, đọc đánh giá'], variant: 'accent', headerH: 28, align: 'left' });
  boxes += drawBox({ ...s2, badge: '2', title: 'Giỏ hàng điện tử', lines: ['Chọn phân loại, tính tạm tiền'], variant: 'default', headerH: 28, align: 'left' });
  boxes += drawBox({ ...s3, badge: '3', title: 'Đặt hàng & Nhập địa chỉ', lines: ['Áp mã giảm giá, chọn vận chuyển'], variant: 'accent', headerH: 28, align: 'left' });
  boxes += drawBox({ ...s4, badge: '4', title: 'Thanh toán điện tử / COD', lines: ['Thẻ, Ví điện tử, VietQR, OTP'], variant: 'warm', headerH: 28, align: 'left' });
  boxes += drawBox({ ...s5, badge: '5', title: 'Xác nhận, Đóng gói & Giao hàng (3PL)', lines: ['Cập nhật mã vận đơn & hành trình thực thời'], variant: 'teal', headerH: 28, align: 'left' });
  boxes += drawBox({ ...s6, badge: '6', title: 'Nhận hàng & Đánh giá', lines: ['Kiểm hàng, hậu mãi & xếp hạng'], variant: 'teal', headerH: 28, align: 'left' });

  const legend = [
    { type: 'line', color: '#1d4ed8', marker: 'arrow-accent', label: 'Luồng chọn mua & đặt đơn của khách hàng' },
    { type: 'line', color: '#c2410c', marker: 'arrow-warm', label: 'Xác thực thanh toán chuyển sang kho vận' },
    { type: 'line', color: '#0f766e', marker: 'arrow-teal', label: 'Hoàn tất giao hàng & phản hồi sau bán' }
  ];

  return wrapSvg(w, h, {
    title: 'QUY TRÌNH GIAO DỊCH CHUẨN TRONG MÔ HÌNH THƯƠNG MẠI ĐIỆN TỬ B2C',
    subtitle: 'Chu trình 6 bước phối hợp giữa Người mua — Nền tảng TMĐT & Cổng thanh toán — Kho vận Logistics',
    legend
  }, body + connectors + boxes);
}

// ---------------------------------------------------------------------------
// 14. Câu 35 & 38: 4 Mối quan hệ đặc trưng của Hành chính điện tử
// ---------------------------------------------------------------------------
function buildHinh35() {
  const w = 960, h = 580;
  let body = '';
  let connectors = '';
  let boxes = '';
  let labels = '';

  // Top Center Hub: Government (G)
  boxes += drawBox({
    x: 300, y: 84, w: 360, h: 74,
    title: 'CƠ QUAN NHÀ NƯỚC / CHÍNH PHỦ (G)',
    headerH: 30,
    variant: 'accent',
    lines: ['Trung tâm điều phối quản lý nhà nước & cung cấp dịch vụ công số']
  });

  // Two grouping zones below (titles at bottom so top arrows never cross text!)
  body += `<rect x="34" y="266" width="444" height="238" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="5,4"/>`;
  body += `<text x="256" y="492" text-anchor="middle" class="t-zone" style="fill:#334155">NỀN TẢNG HÀNH CHÍNH ĐIỆN TỬ NỘI BỘ</text>`;
  body += `<rect x="490" y="266" width="436" height="238" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="5,4"/>`;
  body += `<text x="708" y="492" text-anchor="middle" class="t-zone" style="fill:#334155">ĐẦU RA PHỤC VỤ XÃ HỘI (CHÍNH QUYỀN ĐIỆN TỬ)</text>`;

  const cards = [
    {
      x: 48, y: 280, w: 200, h: 190,
      title: 'G2G (CQNN ↔ CQNN)',
      tag: 'G2G',
      v: 'teal',
      lines: [
        '• Liên thông văn bản ký số',
        '• Chia sẻ CSDL qua NDXP',
        '• Phối hợp hồ sơ liên ngành',
        '',
        'VD: Trục liên thông văn',
        'bản quốc gia, CSDL dân cư'
      ]
    },
    {
      x: 264, y: 280, w: 200, h: 190,
      title: 'G2E (CQNN ↔ Công chức)',
      tag: 'G2E',
      v: 'warm',
      lines: [
        '• Xử lý công việc nội bộ',
        '• QL hồ sơ, lương, lịch họp',
        '• Đánh giá KPI & đào tạo',
        '',
        'VD: Văn phòng điện tử',
        'eOffice, VNPT CCVC'
      ]
    },
    {
      x: 504, y: 280, w: 200, h: 190,
      title: 'G2C (CQNN ↔ Công dân)',
      tag: 'G2C / C2G',
      v: 'default',
      lines: [
        '• Dịch vụ công trực tuyến 24/7',
        '• Định danh số VNeID',
        '• Tiếp nhận phản ánh (C2G)',
        '',
        'VD: Cổng DVC Quốc gia,',
        'ứng dụng iHanoi'
      ]
    },
    {
      x: 716, y: 280, w: 198, h: 190,
      title: 'G2B (CQNN ↔ Doanh nghiệp)',
      tag: 'G2B / B2G',
      v: 'default',
      lines: [
        '• Thuế, Hải quan, ĐKDN online',
        '• Cấp phép đầu tư qua mạng',
        '• Đấu thầu công (B2G)',
        '',
        'VD: eTax, VNACCS,',
        'muasamcong.mpi.gov.vn'
      ]
    }
  ];

  // Orthogonal bus lines from G (x=480, y=158) down to bus y=198 and down to each card at y=280
  const busY = 198;
  connectors += drawConnector({
    points: [{ x: 480, y: 158 }, { x: 480, y: busY }],
    color: '#1d4ed8', width: 2.0, endMarker: ''
  });
  connectors += `<line x1="148" y1="${busY}" x2="815" y2="${busY}" stroke="#1d4ed8" stroke-width="2.0"/>`;

  cards.forEach(c => {
    const cx = c.x + c.w / 2;
    const clr = c.v === 'teal' ? '#0f766e' : (c.v === 'warm' ? '#c2410c' : '#1d4ed8');
    const mk = c.v === 'teal' ? 'arrow-teal' : (c.v === 'warm' ? 'arrow-warm' : 'arrow-accent');
    connectors += drawConnector({
      points: [{ x: cx, y: busY }, { x: cx, y: c.y }],
      color: clr,
      width: 1.8,
      startMarker: mk,
      endMarker: mk
    });
    labels += drawLabelTag(cx, 234, c.tag, {
      color: clr, border: '#cbd5e1', bg: '#ffffff', w: Math.max(c.tag.length * 7.2 + 16, 56), h: 20
    });
    boxes += drawBox({
      x: c.x, y: c.y, w: c.w, h: c.h,
      title: c.title,
      lines: c.lines,
      variant: c.v,
      headerH: 30,
      align: 'left'
    });
  });

  const legend = [
    { type: 'box', fill: '#f0fdfa', stroke: '#0f766e', label: 'Xương sống liên cơ quan (G2G)' },
    { type: 'box', fill: '#fff7ed', stroke: '#c2410c', label: 'Tác nghiệp công chức nội bộ (G2E)' },
    { type: 'box', fill: '#ffffff', stroke: '#334155', label: 'Cung cấp dịch vụ cho dân & DN (G2C, G2B)' }
  ];

  return wrapSvg(w, h, {
    title: '4 MỐI QUAN HỆ & LOẠI HÌNH GIAO DỊCH ĐẶC TRƯNG TRONG HÀNH CHÍNH ĐIỆN TỬ',
    subtitle: 'Kết nối đa chiều giữa Cơ quan nhà nước với nội bộ công vụ (G2G, G2E) và xã hội (G2C, G2B)',
    legend
  }, body + connectors + boxes + labels);
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
const JOBS = [
  { file: 'hinh_01_quy_trinh_thac_nuoc.png', w: 940, h: 620, build: buildHinh01 },
  { file: 'hinh_02_quy_trinh_tang_truong.png', w: 940, h: 560, build: buildHinh02 },
  { file: 'hinh_03_quy_trinh_xoan_oc.png', w: 960, h: 640, build: buildHinh03 },
  { file: 'hinh_05_kim_tu_thap_httt.png', w: 940, h: 570, build: buildHinh05 },
  { file: 'hinh_06_ma_tran_mo_hinh_giao_dich.png', w: 980, h: 610, build: buildHinh06 },
  { file: 'hinh_08_khung_kien_truc_cpdt_1_0.png', w: 1020, h: 680, build: buildHinh08 },
  { file: 'hinh_09_kien_truc_portal.png', w: 960, h: 610, build: buildHinh09 },
  { file: 'hinh_14_giai_doan_hanh_chinh_dien_tu.png', w: 960, h: 590, build: buildHinh14 },
  { file: 'hinh_16_nguyen_tac_web_dong.png', w: 980, h: 570, build: buildHinh16 },
  { file: 'hinh_18_kien_truc_web_service.png', w: 960, h: 570, build: buildHinh18 },
  { file: 'hinh_19_quy_trinh_giai_phap_tac_nghiep.png', w: 980, h: 570, build: buildHinh19 },
  { file: 'hinh_21_mo_hinh_bao_mat_cia.png', w: 960, h: 570, build: buildHinh21 },
  { file: 'hinh_28_luong_giao_dich_b2c.png', w: 980, h: 540, build: buildHinh28 },
  { file: 'hinh_35_moi_quan_he_hcdt.png', w: 960, h: 580, build: buildHinh35 }
];

for (const job of JOBS) {
  const svg = job.build();
  renderDiagram(job.file, job.w, job.h, svg);
}
console.log(`Hoan tat xuat ${JOBS.length} so do PNG!`);
