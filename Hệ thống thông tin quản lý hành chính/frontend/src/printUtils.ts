import QRCode from 'qrcode'
import { renderOfficialDraft, type OfficialSlipKind } from './officialForms'
import type { CaseFile } from './types'

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
        rects.push(`<rect x="${c + 4}" y="${r + 4}" width="1" height="1" fill="#000000" />`)
      }
    }
  }
  const viewSize = matrix.length + 8
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges" role="img" aria-label="Mã tra cứu hồ sơ ${escapeHtml(code)}"><rect width="${viewSize}" height="${viewSize}" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.6" />${rects.join('')}</svg>`
}

/**
 * Prints HTML markup reliably via a hidden iframe so popup blockers never swallow print jobs.
 */
export function printHtmlViaIframe(htmlMarkup: string, targetWindow?: Window): void {
  if (targetWindow) {
    targetWindow.document.open()
    targetWindow.document.write(htmlMarkup)
    targetWindow.document.close()
    return
  }

  const cleanHtml = htmlMarkup.replace(/<script>window\.onload=\(\)=>window\.print\(\)<\/script>/g, '')
  const existing = document.getElementById('hcds-print-iframe')
  if (existing) existing.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'hcds-print-iframe'
  iframe.title = 'Khung in biểu mẫu hành chính'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc || !iframe.contentWindow) {
    const popup = window.open('', '_blank')
    if (popup) {
      popup.document.write(htmlMarkup)
      popup.document.close()
    }
    return
  }

  doc.open()
  doc.write(cleanHtml)
  doc.close()

  window.setTimeout(() => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }, 150)
}

export function printOfficialSlip(
  kind: OfficialSlipKind,
  item: CaseFile,
  _statusLabel?: string,
): void {
  const html = renderOfficialDraft(kind, item, { autoPrint: false })
  printHtmlViaIframe(html)
}

export function printInternalTable(
  title: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
  lookupCode?: string,
  targetWindow?: Window,
): void {
  const qrBlock = lookupCode
    ? `<div class="qr-meta">${renderQrSvgMarkup(lookupCode, 64)}<div><b>Mã hồ sơ: ${escapeHtml(lookupCode)}</b><div>Tra cứu: ${escapeHtml(buildLookupUrl(lookupCode))}</div></div></div>`
    : ''
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 20mm 20mm 20mm 30mm; }
    body { font: 12pt/1.4 "Times New Roman", "Tinos", Times, serif; color: #000000; margin: 0; }
    .internal-header { border-bottom: 1px solid #000000; padding-bottom: 8pt; margin-bottom: 12pt; display: flex; justify-content: space-between; align-items: baseline; font-size: 11pt; }
    h1 { font-size: 14pt; margin: 0 0 6pt; color: #000000; text-align: center; text-transform: uppercase; }
    .notice { text-align: center; font-size: 10pt; margin: 0 0 10pt; font-style: italic; }
    p { margin: 0 0 10pt; color: #000000; }
    .qr-meta { display: flex; align-items: center; gap: 10pt; margin-bottom: 12pt; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000000; padding: 5px 6px; text-align: left; vertical-align: top; font-size: 10pt; overflow-wrap: anywhere; }
    th { background: #ffffff; color: #000000; font-weight: bold; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    footer { margin-top: 14pt; color: #000000; font-size: 10pt; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="internal-header"><b>HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC TP. HÀ NỘI</b><span>Bảng kê vận hành nội bộ</span></div>
  <h1>${escapeHtml(title)}</h1>
  <p class="notice">BẢN TRÍCH XUẤT DỮ LIỆU VẬN HÀNH — KHÔNG PHẢI BIỂU MẪU PHÁP ĐỊNH ĐÃ KÝ</p>
  <p>${escapeHtml(subtitle)}</p>
  ${qrBlock}
  <table>
    <thead><tr>${headers.map(item => `<th>${escapeHtml(item)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(row => `<tr>${row.map(item => `<td>${escapeHtml(item)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <footer>Trích xuất từ Hệ thống thông tin giải quyết TTHC TP. Hà Nội lúc ${escapeHtml(new Date().toLocaleString('vi-VN'))}.</footer>
  <script>window.onload=()=>window.print()</script>
</body>
</html>`
  printHtmlViaIframe(html, targetWindow)
}
