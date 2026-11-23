const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BROWSER_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const BROWSER_EXE = BROWSER_CANDIDATES.find(p => fs.existsSync(p));
if (!BROWSER_EXE) {
  console.error('Khong tim thay Microsoft Edge hoac Google Chrome!');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, '..', 'assets', 'diagrams');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PALETTES = {
  default: {
    fill: '#ffffff',
    headerFill: '#f1f5f9',
    stroke: '#334155',
    strokeW: 1.5,
    titleColor: '#0f172a',
    textColor: '#334155',
    badgeBg: '#334155',
    badgeFg: '#ffffff'
  },
  accent: {
    fill: '#eff6ff',
    headerFill: '#dbeafe',
    stroke: '#1d4ed8',
    strokeW: 2.0,
    titleColor: '#1e3a8a',
    textColor: '#1e40af',
    badgeBg: '#1d4ed8',
    badgeFg: '#ffffff'
  },
  warm: {
    fill: '#fff7ed',
    headerFill: '#ffedd5',
    stroke: '#c2410c',
    strokeW: 1.6,
    titleColor: '#9a3412',
    textColor: '#7c2d12',
    badgeBg: '#c2410c',
    badgeFg: '#ffffff'
  },
  teal: {
    fill: '#f0fdfa',
    headerFill: '#ccfbf1',
    stroke: '#0f766e',
    strokeW: 1.6,
    titleColor: '#115e59',
    textColor: '#134e4a',
    badgeBg: '#0f766e',
    badgeFg: '#ffffff'
  },
  muted: {
    fill: '#f8fafc',
    headerFill: '#e2e8f0',
    stroke: '#475569',
    strokeW: 1.4,
    titleColor: '#1e293b',
    textColor: '#475569',
    badgeBg: '#475569',
    badgeFg: '#ffffff'
  }
};

function esc(str) {
  return String(str ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markerSet(idSuffix, color) {
  return `
    <marker id="arrow-${idSuffix}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M 0.5 1.5 L 9 5 L 0.5 8.5 z" fill="${color}" />
    </marker>
    <marker id="dot-${idSuffix}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5">
      <circle cx="5" cy="5" r="3.2" fill="${color}" />
    </marker>
  `;
}

function wrapSvg(w, h, { title, subtitle = '', legend = [] }, body) {
  const legendStrip = legend.length > 0 ? drawLegendStrip(w, h, legend) : '';
  const subEl = subtitle
    ? `<text x="${w / 2}" y="53" text-anchor="middle" class="t-sub" fill="#475569">${esc(subtitle)}</text>`
    : '';
  const ruleY = subtitle ? 66 : 52;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
  <title>${esc(title)}</title>
  <defs>
    <style>
      text { font-family: 'Segoe UI', Arial, sans-serif; }
      .t-title { font-size: 16.5px; font-weight: 700; fill: #0f172a; }
      .t-sub { font-size: 11.5px; font-weight: 500; fill: #475569; }
      .t-head { font-size: 12.5px; font-weight: 700; }
      .t-body { font-size: 11px; font-weight: 400; }
      .t-small { font-size: 10px; font-weight: 500; }
      .t-label { font-size: 10.5px; font-weight: 600; }
      .t-zone { font-size: 11px; font-weight: 700; fill: #334155; letter-spacing: 0.4px; }
      .t-badge { font-size: 10px; font-weight: 700; fill: #ffffff; }
    </style>
    ${markerSet('ink', '#334155')}
    ${markerSet('accent', '#1d4ed8')}
    ${markerSet('warm', '#c2410c')}
    ${markerSet('teal', '#0f766e')}
    ${markerSet('muted', '#64748b')}
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>
  <rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.2"/>
  <text x="${w / 2}" y="33" text-anchor="middle" class="t-title">${esc(title)}</text>
  ${subEl}
  <line x1="26" y1="${ruleY}" x2="${w - 26}" y2="${ruleY}" stroke="#e2e8f0" stroke-width="1"/>
  ${body}
  ${legendStrip}
</svg>`;
}

function drawLegendStrip(w, h, items) {
  const y = h - 38;
  let totalW = 0;
  const measured = items.map(it => {
    const itemW = (it.type === 'line' ? 38 : 22) + it.label.length * 6.3 + 22;
    totalW += itemW;
    return { ...it, itemW };
  });
  let cx = (w - totalW + 18) / 2;
  let out = `<line x1="26" y1="${y - 12}" x2="${w - 26}" y2="${y - 12}" stroke="#e2e8f0" stroke-width="1"/>`;
  for (const it of measured) {
    if (it.type === 'line') {
      const dash = it.dashed ? 'stroke-dasharray="5,4"' : '';
      const mk = it.marker ? `marker-end="url(#${it.marker})"` : '';
      out += `<line x1="${cx}" y1="${y + 4}" x2="${cx + 30}" y2="${y + 4}" stroke="${it.color}" stroke-width="1.8" ${dash} ${mk}/>`;
      out += `<text x="${cx + 36}" y="${y + 8}" class="t-small" fill="#334155">${esc(it.label)}</text>`;
    } else {
      out += `<rect x="${cx}" y="${y - 3}" width="16" height="13" rx="3" fill="${it.fill}" stroke="${it.stroke}" stroke-width="1.5"/>`;
      out += `<text x="${cx + 22}" y="${y + 7.5}" class="t-small" fill="#334155">${esc(it.label)}</text>`;
    }
    cx += it.itemW;
  }
  return out;
}

function drawZone(x, y, w, h, title, opts = {}) {
  const fill = opts.fill || '#f8fafc';
  const stroke = opts.stroke || '#94a3b8';
  const dashed = opts.dashed !== false ? 'stroke-dasharray="5,4"' : '';
  const titleColor = opts.titleColor || '#334155';
  const align = opts.align || 'left';
  const tx = align === 'center' ? x + w / 2 : x + 14;
  const anchor = align === 'center' ? 'middle' : 'start';
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.2" ${dashed}/>
    <text x="${tx}" y="${y + 20}" text-anchor="${anchor}" class="t-zone" style="fill:${titleColor}">${esc(title)}</text>
  `;
}

function drawBox({
  x, y, w, h,
  title = '',
  lines = [],
  variant = 'default',
  headerH = 0,
  align = 'center',
  badge = '',
  rx = 6,
  dashed = false
}) {
  const p = PALETTES[variant] || PALETTES.default;
  const dashAttr = dashed ? 'stroke-dasharray="5,4"' : '';
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeW}" ${dashAttr}/>`;

  if (headerH > 0) {
    s += `<path d="M ${x} ${y + headerH} L ${x} ${y + rx} Q ${x} ${y} ${x + rx} ${y} L ${x + w - rx} ${y} Q ${x + w} ${y} ${x + w} ${y + rx} L ${x + w} ${y + headerH} Z" fill="${p.headerFill}" stroke="${p.stroke}" stroke-width="${p.strokeW}"/>`;
    const titleY = y + headerH / 2 + 4.5;
    if (badge) {
      const bw = Math.max(badge.length * 7 + 12, 24);
      s += `<rect x="${x + 10}" y="${y + (headerH - 18) / 2}" width="${bw}" height="18" rx="3" fill="${p.badgeBg}"/>`;
      s += `<text x="${x + 10 + bw / 2}" y="${y + headerH / 2 + 3.5}" text-anchor="middle" class="t-badge">${esc(badge)}</text>`;
      s += `<text x="${x + 18 + bw}" y="${titleY}" text-anchor="start" class="t-head" fill="${p.titleColor}">${esc(title)}</text>`;
    } else {
      s += `<text x="${x + w / 2}" y="${titleY}" text-anchor="middle" class="t-head" fill="${p.titleColor}">${esc(title)}</text>`;
    }
    const bodyStartY = y + headerH + 20;
    const tx = align === 'center' ? x + w / 2 : x + 12;
    const anchor = align === 'center' ? 'middle' : 'start';
    lines.forEach((ln, idx) => {
      s += `<text x="${tx}" y="${bodyStartY + idx * 16}" text-anchor="${anchor}" class="t-body" fill="${p.textColor}">${esc(ln)}</text>`;
    });
  } else {
    const allLines = [];
    if (title) allLines.push({ text: title, isTitle: true });
    lines.forEach(ln => allLines.push({ text: ln, isTitle: false }));
    const lineH = 16;
    const totalTextH = allLines.length * lineH;
    let startY = y + (h - totalTextH) / 2 + 12;
    if (badge) {
      const bw = Math.max(badge.length * 6.8 + 12, 24);
      s += `<rect x="${x + 10}" y="${y + 8}" width="${bw}" height="18" rx="3" fill="${p.badgeBg}"/>`;
      s += `<text x="${x + 10 + bw / 2}" y="${y + 20.5}" text-anchor="middle" class="t-badge">${esc(badge)}</text>`;
      if (allLines.length > 0 && allLines[0].isTitle) {
        s += `<text x="${x + 18 + bw}" y="${y + 21.5}" text-anchor="start" class="t-head" fill="${p.titleColor}">${esc(allLines[0].text)}</text>`;
        allLines.slice(1).forEach((item, idx) => {
          const tx = align === 'center' ? x + w / 2 : x + 12;
          const anchor = align === 'center' ? 'middle' : 'start';
          s += `<text x="${tx}" y="${y + 42 + idx * 16}" text-anchor="${anchor}" class="t-body" fill="${p.textColor}">${esc(item.text)}</text>`;
        });
        return s;
      }
    }
    const tx = align === 'center' ? x + w / 2 : x + 12;
    const anchor = align === 'center' ? 'middle' : 'start';
    allLines.forEach((item, idx) => {
      const cls = item.isTitle ? 't-head' : 't-body';
      const clr = item.isTitle ? p.titleColor : p.textColor;
      const gap = item.isTitle ? 0 : (title ? 3 : 0);
      s += `<text x="${tx}" y="${startY + idx * lineH + gap}" text-anchor="${anchor}" class="${cls}" fill="${clr}">${esc(item.text)}</text>`;
    });
  }
  return s;
}

function drawDatabase({ x, y, w, h, title, lines = [], variant = 'teal' }) {
  const p = PALETTES[variant] || PALETTES.teal;
  const ry = 11;
  const cx = x + w / 2;
  const topY = y + ry;
  const botY = y + h - ry;
  let s = `
    <path d="M ${x} ${topY} L ${x} ${botY} A ${w / 2} ${ry} 0 0 0 ${x + w} ${botY} L ${x + w} ${topY} Z" fill="${p.fill}" stroke="${p.stroke}" stroke-width="${p.strokeW}"/>
    <ellipse cx="${cx}" cy="${topY}" rx="${w / 2}" ry="${ry}" fill="${p.headerFill}" stroke="${p.stroke}" stroke-width="${p.strokeW}"/>
  `;
  const startY = topY + ry + (botY - topY - ry) / 2 - ((lines.length) * 15) / 2 + 2;
  s += `<text x="${cx}" y="${startY}" text-anchor="middle" class="t-head" fill="${p.titleColor}">${esc(title)}</text>`;
  lines.forEach((ln, idx) => {
    s += `<text x="${cx}" y="${startY + 17 + idx * 15}" text-anchor="middle" class="t-body" fill="${p.textColor}">${esc(ln)}</text>`;
  });
  return s;
}

function orthoPath(points, r = 8) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    const rr = Math.min(r, len1 / 2, len2 / 2);
    if (rr <= 0.5) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }
    const p1x = curr.x - (dx1 / len1) * rr;
    const p1y = curr.y - (dy1 / len1) * rr;
    const p2x = curr.x + (dx2 / len2) * rr;
    const p2y = curr.y + (dy2 / len2) * rr;
    d += ` L ${p1x.toFixed(1)} ${p1y.toFixed(1)} Q ${curr.x} ${curr.y} ${p2x.toFixed(1)} ${p2y.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

function drawConnector({
  points,
  color = '#334155',
  width = 1.6,
  dashed = false,
  endMarker = 'arrow-ink',
  startMarker = '',
  r = 8
}) {
  const d = orthoPath(points, r);
  const dash = dashed ? 'stroke-dasharray="5,4"' : '';
  const me = endMarker ? `marker-end="url(#${endMarker})"` : '';
  const ms = startMarker ? `marker-start="url(#${startMarker})"` : '';
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${dash} ${ms} ${me}/>`;
}

function drawLabelTag(x, y, text, opts = {}) {
  const color = opts.color || '#1e293b';
  const border = opts.border || '#cbd5e1';
  const bg = opts.bg || '#ffffff';
  const padX = opts.padX || 9;
  const h = opts.h || 20;
  const w = opts.w || Math.max(text.length * 6.2 + padX * 2, 48);
  const rx = x - w / 2;
  const ry = y - h / 2;
  return `
    <g>
      <rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" rx="4" fill="${bg}" stroke="${border}" stroke-width="0.9"/>
      <text x="${x}" y="${y + 3.8}" text-anchor="middle" class="t-label" fill="${color}">${esc(text)}</text>
    </g>
  `;
}

function drawStepCircle(x, y, num, bg = '#1d4ed8') {
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="10" fill="${bg}"/>
      <text x="${x}" y="${y + 3.8}" text-anchor="middle" class="t-badge">${esc(num)}</text>
    </g>
  `;
}

function renderDiagram(filename, width, height, svgContent) {
  const tmpHtml = path.join(__dirname, `_tmp_${filename.replace('.png', '.html')}`);
  const outPng = path.join(OUT_DIR, filename);
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; overflow: hidden; background: #ffffff; }
  svg { display: block; width: ${width}px; height: ${height}px; }
</style>
</head>
<body>${svgContent}</body>
</html>`;

  fs.writeFileSync(tmpHtml, html, 'utf8');
  try {
    execFileSync(BROWSER_EXE, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      `--window-size=${width},${height}`,
      `--screenshot=${outPng}`,
      tmpHtml
    ], { stdio: 'ignore' });
  } finally {
    try { fs.unlinkSync(tmpHtml); } catch (_) {}
  }
  const size = fs.statSync(outPng).size;
  console.log(`Rendered: ${filename} (${width}x${height} -> 2x HiDPI, ${size} bytes)`);
}

module.exports = {
  PALETTES,
  esc,
  wrapSvg,
  drawZone,
  drawBox,
  drawDatabase,
  drawConnector,
  drawLabelTag,
  drawStepCircle,
  renderDiagram
};
