const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE_DIR = path.join(__dirname, '..');
const MAIN_MD = path.join(BASE_DIR, 'DE_CUONG_ON_TAP_HTTT_TAC_NGHIEP.md');
const QUICK_MD = path.join(BASE_DIR, 'ON_NHANH_TRUOC_KHI_THI.md');
const OUT_PDF = path.join(BASE_DIR, 'DE_CUONG_ON_TAP_HTTT_TAC_NGHIEP.pdf');
const TMP_HTML = path.join(__dirname, '_tmp_export_pdf.html');

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

const imageCache = new Map();
function imageToDataUri(relPath) {
  const cleanRel = decodeURIComponent(relPath.replace(/^\.\//, ''));
  const absPath = path.join(BASE_DIR, cleanRel.replace(/\//g, path.sep));
  if (!fs.existsSync(absPath)) {
    throw new Error(`Thieu tep anh: ${absPath}`);
  }
  if (!imageCache.has(absPath)) {
    const b64 = fs.readFileSync(absPath).toString('base64');
    imageCache.set(absPath, `data:image/png;base64,${b64}`);
  }
  return imageCache.get(absPath);
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugId(raw) {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function renderInline(text) {
  // Extract inline code first so markdown formatting inside code isn't touched
  const codeTokens = [];
  let s = text.replace(/`([^`]+)`/g, (_, code) => {
    const idx = codeTokens.length;
    codeTokens.push(`<code>${escHtml(code)}</code>`);
    return `\u0000CODE${idx}\u0000`;
  });

  s = escHtml(s);

  // Links [label](href)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    if (href.startsWith('#')) {
      return `<a href="#${slugId(href.slice(1))}">${label}</a>`;
    }
    if (href.endsWith('DE_CUONG_ON_TAP_HTTT_TAC_NGHIEP.md')) {
      return `<a href="#phan-1">${label}</a>`;
    }
    return `<span class="ext-link">${label}</span>`;
  });

  // Bold + italic
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic (single asterisks not surrounded by spaces)
  s = s.replace(/(^|[\s(>])\*([^*\n]+?)\*(?=[\s).,;:!?<]|$)/g, '$1<em>$2</em>');

  // Restore code tokens
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)]);
  return s;
}

function parseTable(lines, startIdx) {
  const rows = [];
  let i = startIdx;
  while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
    const rawCells = lines[i].trim().slice(1, -1).split('|').map(c => c.trim());
    rows.push(rawCells);
    i++;
  }
  if (rows.length < 2) return { html: '', nextIdx: startIdx + 1 };

  const header = rows[0];
  const bodyRows = rows.slice(2); // skip alignment row
  let html = '<table><thead><tr>';
  for (const h of header) html += `<th>${renderInline(h)}</th>`;
  html += '</tr></thead><tbody>';
  for (const r of bodyRows) {
    html += '<tr>';
    for (let c = 0; c < header.length; c++) {
      html += `<td>${renderInline(r[c] || '')}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return { html, nextIdx: i };
}

function parseMarkdown(mdText, options = {}) {
  const lines = mdText.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let i = 0;
  let listStack = [];

  function closeLists(targetIndent = -1) {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
      const top = listStack.pop();
      html += `</li></${top.tag}>`;
    }
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Anchor tag <a id="..."></a>
    const anchorM = trimmed.match(/^<a\s+id="([^"]+)"\s*><\/a>$/);
    if (anchorM) {
      closeLists();
      html += `<span id="${slugId(anchorM[1])}" class="anchor-target"></span>`;
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(trimmed)) {
      closeLists();
      if (!options.hideHr) html += '<hr class="sep"/>';
      i++;
      continue;
    }

    // Headings
    const hM = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (hM) {
      closeLists();
      const level = hM[1].length;
      const content = hM[2];
      if (level === 1 && options.skipH1) {
        i++;
        continue;
      }
      const cls = level === 3 && /^Câu\s+\d+/.test(content) ? ' class="q-heading"' : '';
      html += `<h${level}${cls}>${renderInline(content)}</h${level}>`;
      i++;
      continue;
    }

    // Figure: image followed optionally by italic caption
    const imgM = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) {
      closeLists();
      const alt = imgM[1];
      const src = imageToDataUri(imgM[2]);
      let caption = '';
      if (i + 1 < lines.length && !lines[i + 1].trim() && i + 2 < lines.length) {
        const capM = lines[i + 2].trim().match(/^\*(.+)\*$/);
        if (capM && /^Hình\s+\d+/.test(capM[1])) {
          caption = capM[1];
          i += 2;
        }
      } else if (i + 1 < lines.length) {
        const capM = lines[i + 1].trim().match(/^\*(.+)\*$/);
        if (capM && /^Hình\s+\d+/.test(capM[1])) {
          caption = capM[1];
          i += 1;
        }
      }
      html += `<figure class="diagram-fig"><img src="${src}" alt="${escHtml(alt)}"/>${caption ? `<figcaption>${renderInline(caption)}</figcaption>` : ''}</figure>`;
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      closeLists();
      const bqLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      html += `<blockquote class="tip-box">${bqLines.map(renderInline).join('<br/>')}</blockquote>`;
      continue;
    }

    // Table
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      closeLists();
      const tbl = parseTable(lines, i);
      html += tbl.html;
      i = tbl.nextIdx;
      continue;
    }

    // List item (ordered or unordered)
    const listM = line.match(/^(\s*)(\d+\.|[-*])\s+(.*)$/);
    if (listM) {
      const indent = listM[1].length;
      const isOrdered = /^\d+\./.test(listM[2]);
      const startNum = isOrdered ? parseInt(listM[2], 10) : 1;
      const tag = isOrdered ? 'ol' : 'ul';
      const itemText = listM[3];

      while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
        const top = listStack.pop();
        html += `</li></${top.tag}>`;
      }
      if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent || listStack[listStack.length - 1].tag !== tag) {
        if (listStack.length > 0 && listStack[listStack.length - 1].indent === indent && listStack[listStack.length - 1].tag !== tag) {
          const top = listStack.pop();
          html += `</li></${top.tag}>`;
        }
        listStack.push({ indent, tag });
        const startAttr = isOrdered && startNum !== 1 ? ` start="${startNum}"` : '';
        html += `<${tag}${startAttr}><li>${renderInline(itemText)}`;
      } else {
        html += `</li><li>${renderInline(itemText)}`;
      }
      i++;
      continue;
    }

    // Regular paragraph
    closeLists();
    const pLines = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4}\s|---+$|>|\s*\||\s*(\d+\.|-|\*)\s|!\[|<a\s+id=)/.test(lines[i])
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    let nextNonEmpty = i;
    while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') nextNonEmpty++;
    const nextTrim = nextNonEmpty < lines.length ? lines[nextNonEmpty].trim() : '';
    const keepNext = /^(!\[|\|)/.test(nextTrim) ? ' class="keep-with-next"' : '';
    html += `<p${keepNext}>${renderInline(pLines.join(' '))}</p>`;
  }

  closeLists();
  return html;
}

const mainMd = fs.readFileSync(MAIN_MD, 'utf8');
const quickMd = fs.readFileSync(QUICK_MD, 'utf8');

const part1Html = parseMarkdown(mainMd, { skipH1: false });
const part2Html = parseMarkdown(quickMd, { skipH1: true });

const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Đề cương ôn tập vấn đáp — Hệ thống thông tin tác nghiệp</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 14mm 16mm 14mm;
  }
  * {
    box-sizing: border-box;
  }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.48;
    color: #0f172a;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  h1 {
    font-size: 16.5pt;
    font-weight: 700;
    text-align: center;
    color: #0f172a;
    background: #eff6ff;
    border: 1.5px solid #1d4ed8;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 0 0 12px 0;
  }
  h2 {
    font-size: 12.5pt;
    font-weight: 700;
    color: #1e3a8a;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 4px;
    margin: 16px 0 8px 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  h3.q-heading {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    background: #f8fafc;
    border-left: 4px solid #1d4ed8;
    border-top: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 6px 10px;
    margin: 14px 0 8px 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  h3 {
    font-size: 10.8pt;
    font-weight: 700;
    color: #0f172a;
    margin: 12px 0 6px 0;
    break-after: avoid;
    page-break-after: avoid;
  }
  p {
    margin: 4px 0 7px 0;
    text-align: justify;
  }
  p.keep-with-next {
    break-after: avoid;
    page-break-after: avoid;
  }
  ul, ol {
    margin: 3px 0 7px 0;
    padding-left: 19px;
  }
  li {
    margin: 2.5px 0;
  }
  li > ul, li > ol {
    margin-top: 2px;
    margin-bottom: 3px;
  }
  strong {
    color: #0f172a;
  }
  code {
    font-family: Consolas, 'Courier New', monospace;
    font-size: 9pt;
    background: #f1f5f9;
    color: #1e293b;
    padding: 1px 4px;
    border-radius: 3px;
    border: 0.5px solid #e2e8f0;
  }
  a {
    color: #1d4ed8;
    text-decoration: none;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 7px 0 10px 0;
    font-size: 9.2pt;
    line-height: 1.38;
  }
  thead {
    display: table-header-group;
  }
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 7px;
    vertical-align: top;
    text-align: left;
  }
  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }
  figure.diagram-fig {
    margin: 8px auto 10px auto;
    padding: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    text-align: center;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  figure.diagram-fig img {
    display: block;
    max-width: 100%;
    max-height: 112mm;
    width: auto;
    height: auto;
    margin: 0 auto;
  }
  figure.diagram-fig figcaption {
    margin-top: 5px;
    font-size: 8.8pt;
    font-style: italic;
    color: #475569;
  }
  blockquote.tip-box {
    margin: 7px 0 10px 0;
    padding: 6px 10px;
    background: #fff7ed;
    border-left: 3.5px solid #c2410c;
    border-top: 1px solid #fed7aa;
    border-right: 1px solid #fed7aa;
    border-bottom: 1px solid #fed7aa;
    border-radius: 4px;
    font-size: 9.4pt;
    color: #7c2d12;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  hr.sep {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 10px 0;
  }
  .page-break {
    page-break-before: always;
    break-before: page;
  }
  .part-banner {
    font-size: 14pt;
    font-weight: 700;
    text-align: center;
    color: #115e59;
    background: #f0fdfa;
    border: 1.5px solid #0f766e;
    border-radius: 6px;
    padding: 9px 14px;
    margin: 0 0 10px 0;
  }
  .anchor-target {
    display: block;
    height: 0;
  }
</style>
</head>
<body>
  <div id="phan-1">
    ${part1Html}
  </div>
  <div class="page-break"></div>
  <div id="phan-2">
    <div class="part-banner">PHỤ LỤC: TÓM TẮT ÔN NHANH 40 CÂU TRƯỚC KHI THI VẤN ĐÁP</div>
    ${part2Html}
  </div>
</body>
</html>`;

fs.writeFileSync(TMP_HTML, fullHtml, 'utf8');
try {
  execFileSync(BROWSER_EXE, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${OUT_PDF}`,
    TMP_HTML
  ], { stdio: 'inherit' });
} finally {
  try { fs.unlinkSync(TMP_HTML); } catch (_) {}
}

const pdfStats = fs.statSync(OUT_PDF);
console.log(`Generated PDF: ${OUT_PDF} (${pdfStats.size} bytes)`);
