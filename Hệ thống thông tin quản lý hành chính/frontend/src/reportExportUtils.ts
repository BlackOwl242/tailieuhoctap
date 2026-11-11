import type { TDocumentDefinitions } from 'pdfmake/interfaces'
import tinosRegular from './fonts/Tinos-Regular.ttf?url'
import tinosBold from './fonts/Tinos-Bold.ttf?url'

export type ReportData = { title: string; subtitle: string; headers: string[]; rows: string[][]; filename: string }

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function cellText(value: unknown): string {
  const s = String(value ?? '')
  const status: Record<string, string> = { NOT_CONFIGURED: 'Chưa cấu hình', SYNCED: 'Đã đồng bộ', PENDING: 'Đang chờ', ERROR: 'Lỗi' }
  if (status[s]) return status[s]
  if (/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}.*)?$/.test(s)) {
    const parsed = new Date(s.length === 10 ? `${s}T00:00:00+07:00` : s)
    if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', ...(s.length > 10 ? { timeStyle: 'short' as const } : {}) }).format(parsed)
  }
  return s
}

function excelDate(text: string): Date | null {
  const iso = text.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (iso) {
    const date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))
    return date.getUTCFullYear() === Number(iso[1]) && date.getUTCMonth() === Number(iso[2]) - 1 && date.getUTCDate() === Number(iso[3]) ? date : null
  }
  const normalized = text.trim().replace(/\s+thg\s+/i, '/').replace(/,\s*/g, '/')
  const match = normalized.match(/^(?:(\d{1,2}):(\d{2})\s+)?(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/)
  if (!match) return null
  let year = Number(match[5])
  if (year < 100) year += 2000
  const month = Number(match[4]), day = Number(match[3]), hour = Number(match[1] || 0), minute = Number(match[2] || 0)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && hour < 24 && minute < 60 ? date : null
}

export async function readCasesReport(): Promise<ReportData> {
  const response = await fetch('/api/export/cases.csv', { credentials: 'include' })
  if (!response.ok) throw new Error(response.status === 403 ? 'Tài khoản không có quyền xuất báo cáo.' : `Không tải được dữ liệu (${response.status}).`)
  const Papa = await import('papaparse')
  const result = Papa.default.parse<string[]>(await response.text(), { skipEmptyLines: true })
  if (result.errors.length) throw new Error('Không đọc được dữ liệu báo cáo; vui lòng thử lại.')
  const [headers, ...rows] = result.data
  if (!headers?.length) throw new Error('Báo cáo không có tiêu đề.')
  return { title: 'Danh sách hồ sơ', subtitle: 'Toàn bộ hồ sơ trong phạm vi tài khoản được cấp', filename: 'danh-sach-ho-so', headers, rows: rows.map(row => row.map(cellText)) }
}

export async function exportReportExcel(report: ReportData): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Hệ thống giải quyết thủ tục hành chính Hà Nội'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Báo cáo', { views: [{ state: 'frozen', ySplit: 5 }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } })
  const count = report.headers.length
  for (let r = 1; r <= 3; r++) if (count > 1) sheet.mergeCells(r, 1, r, count)
  sheet.getCell('A1').value = report.title
  sheet.getCell('A1').font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1B365D' } }
  sheet.getCell('A2').value = report.subtitle
  sheet.getCell('A3').value = `Xuất lúc: ${new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date())} · ${report.rows.length.toLocaleString('vi-VN')} dòng`
  sheet.getCell('A2').font = sheet.getCell('A3').font = { name: 'Arial', size: 10, color: { argb: 'FF526477' } }
  sheet.getRow(1).height = 25
  const header = sheet.getRow(5)
  report.headers.forEach((text, index) => {
    const c = header.getCell(index + 1)
    c.value = text
    c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B365D' } }
    c.alignment = { vertical: 'middle', wrapText: true }
    const longest = Math.max(text.length, ...report.rows.slice(0, 500).map(row => (row[index] || '').length))
    sheet.getColumn(index + 1).width = Math.min(48, Math.max(16, longest + 2))
  })
  header.height = 30
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: count } }
  report.rows.forEach((row, index) => {
    const target = sheet.getRow(index + 6)
    report.headers.forEach((label, col) => {
      const cell = target.getCell(col + 1)
      const text = String(row[col] ?? '')
      const parsedDate = /^(Ngày gửi|Hạn giải quyết|Hiệu lực từ|Hiệu lực đến)$/i.test(label) ? excelDate(text) : null
      if (parsedDate) {
        cell.value = parsedDate
        cell.numFmt = text.includes(':') ? 'dd/mm/yyyy hh:mm' : 'dd/mm/yyyy'
      } else if (/^(STT|Số lượng \/ Giá trị|Số lượng|Số hồ sơ)$/i.test(label) && /^-?\d+(?:\.\d+)?$/.test(text)) {
        cell.value = Number(text)
        cell.numFmt = '0.##'
      } else {
        cell.value = text
        cell.numFmt = '@'
      }
      cell.font = { name: 'Arial', size: 10 }
      cell.alignment = { vertical: 'top', wrapText: true }
      if (index % 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F6FA' } }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFD5DFEC' } } }
    })
  })
  const buffer = await workbook.xlsx.writeBuffer()
  download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${report.filename}.xlsx`)
}

export async function exportReportPdf(report: ReportData): Promise<void> {
  const [pdfModule, regularResponse, boldResponse] = await Promise.all([import('pdfmake/build/pdfmake'), fetch(tinosRegular), fetch(tinosBold)])
  if (!regularResponse.ok || !boldResponse.ok) throw new Error('Không tải được phông chữ cho báo cáo PDF.')
  const pdf = pdfModule.default
  const base64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
    return btoa(binary)
  }
  pdf.addVirtualFileSystem({ 'Tinos-Regular.ttf': base64(await regularResponse.arrayBuffer()), 'Tinos-Bold.ttf': base64(await boldResponse.arrayBuffer()) })
  pdf.addFonts({ Tinos: { normal: 'Tinos-Regular.ttf', bold: 'Tinos-Bold.ttf', italics: 'Tinos-Regular.ttf', bolditalics: 'Tinos-Bold.ttf' } })
  const body = [report.headers.map(text => ({ text, bold: true })), ...report.rows.map(row => report.headers.map((_, index) => ({ text: String(row[index] ?? '') })))]
  const timestamp = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date())
  const doc: TDocumentDefinitions = {
    pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [85, 57, 57, 57],
    defaultStyle: { font: 'Tinos', fontSize: 11, color: '#000000' },
    header: (currentPage: number) => currentPage > 1 ? { text: String(currentPage), alignment: 'center', fontSize: 13, margin: [0, 18, 0, 0] } : { text: '' },
    content: [
      { columns: [{ text: 'HỆ THỐNG THÔNG TIN GIẢI QUYẾT\nTHỦ TỤC HÀNH CHÍNH HÀ NỘI', alignment: 'center', bold: true, fontSize: 11 }, { text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc', alignment: 'center', bold: true, fontSize: 12 }], columnGap: 20, margin: [0, 0, 0, 18] },
      { text: report.title.toLocaleUpperCase('vi-VN'), bold: true, alignment: 'center', fontSize: 14, margin: [0, 0, 0, 5] },
      { text: 'BẢN TRÍCH XUẤT DỮ LIỆU — CHƯA KÝ, CHƯA BAN HÀNH', alignment: 'center', fontSize: 10, margin: [0, 0, 0, 10] },
      { text: `Phạm vi: ${report.subtitle}\nThời điểm trích xuất: ${timestamp} · ${report.rows.length.toLocaleString('vi-VN')} dòng`, margin: [0, 0, 0, 10] },
      { table: { headerRows: 1, widths: report.headers.map(() => '*'), body }, fontSize: report.headers.length >= 8 ? 9 : 10, layout: { hLineColor: () => '#000000', vLineColor: () => '#000000', paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 5, paddingBottom: () => 5 } },
    ],
  }
  pdf.createPdf(doc).download(`${report.filename}.pdf`)
}

