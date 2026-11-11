import type { CaseFile } from './types'
import QRCode from 'qrcode'
import { renderOfficialDraft, type OfficialSlipKind } from './officialForms'

export function buildVerificationMatrix(payload: string): boolean[][] {
  const modules = QRCode.create(payload, { errorCorrectionLevel: 'M' }).modules
  return Array.from({ length: modules.size }, (_, row) =>
    Array.from({ length: modules.size }, (_, col) => Boolean(modules.get(row, col))),
  )
}

export function buildLookupUrl(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8766'
  return `${origin}/tra-cuu-ho-so?code=${encodeURIComponent(code)}`
}

function escapeHtml(value: string): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    char =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] || char,
  )
}

export function renderQrSvgMarkup(code: string, size = 88): string {
  const url = buildLookupUrl(code)
  const matrix = buildVerificationMatrix(url)
  const rects: string[] = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        rects.push(`<rect x="${c + 4}" y="${r + 4}" width="1" height="1" fill="#000" />`)
      }
    }
  }
  const viewSize = matrix.length + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges" role="img" aria-label="Mã tra cứu hồ sơ ${escapeHtml(code)}"><rect width="${viewSize}" height="${viewSize}" fill="#ffffff" stroke="#d5dfec" stroke-width="0.6" />${rects.join('')}</svg>`
}

export function printOfficialSlip(kind: OfficialSlipKind, item: CaseFile, _statusLabel?: string): void {
  const popup = window.open('', '_blank')
  if (!popup) return
  popup.document.write(renderOfficialDraft(kind, item))
  popup.document.close()
}

export function printInternalTable(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
  lookupCode?: string,
  targetWindow?: Window,
): void {
  const popup = targetWindow || window.open('', '_blank')
  if (!popup) return
  const qrBlock = lookupCode
    ? `<div style="margin-bottom:14px"><b>Mã hồ sơ: ${escapeHtml(lookupCode)}</b><div>Tra cứu: ${escapeHtml(buildLookupUrl(lookupCode))}</div></div>`
    : ''
  popup.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 20mm 20mm 20mm 30mm; }
    body { font: 13pt/1.4 "Times New Roman", Times, serif; color: #000; margin: 0; }
    .official-header { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 20pt; }
    h1 { font-size: 14pt; margin: 0 0 6pt; color: #000; text-align: center; text-transform: uppercase; }
    .notice { text-align: center; font-size: 10pt; margin: 0 0 12pt; }
    p { margin: 0 0 10pt; color: #000; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 5px; text-align: left; vertical-align: top; font-size: 10pt; overflow-wrap: anywhere; }
    th { background: #fff; color: #000; font-weight: bold; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    footer { margin-top: 16px; color: #000; font-size: 10pt; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="official-header"><div>HỆ THỐNG THÔNG TIN GIẢI QUYẾT<br>THỦ TỤC HÀNH CHÍNH HÀ NỘI</div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div></div>
  <h1>${escapeHtml(title)}</h1>
  <p class="notice">BẢN TRÍCH XUẤT DỮ LIỆU — CHƯA KÝ, CHƯA BAN HÀNH</p>
  <p>${escapeHtml(subtitle)}</p>
  ${qrBlock}
  <table>
    <thead><tr>${headers.map(item => `<th>${escapeHtml(item)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(item => `<td>${escapeHtml(item)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <footer>Trích xuất từ Hệ thống thông tin quản lý hành chính lúc ${escapeHtml(new Date().toLocaleString('vi-VN'))}.</footer>
  <script>window.onload = () => window.print()</script>
</body>
</html>`)
  popup.document.close()
}
