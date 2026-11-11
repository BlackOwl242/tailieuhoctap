import { useEffect, useRef, useState } from 'react'
import { exportReportExcel, exportReportPdf, type ReportData } from './reportExportUtils'
import { printInternalTable } from './printUtils'

export function ReportExportButtons({ getReport, compact = false, disabled = false }: { getReport: () => ReportData | Promise<ReportData>; compact?: boolean; disabled?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const menu = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  async function run(format: 'xlsx' | 'pdf' | 'print') {
    if (menu.current) menu.current.open = false
    const preview = format === 'print' ? window.open('', '_blank') : null
    if (format === 'print' && !preview) { setError('Trình duyệt đang chặn cửa sổ in. Hãy cho phép cửa sổ bật lên và thử lại.'); return }
    setBusy(true)
    setError('')
    try {
      const report = await getReport()
      if (!report.headers.length) throw new Error('Báo cáo không có cột dữ liệu.')
      if (format === 'xlsx') await exportReportExcel(report)
      else if (format === 'pdf') await exportReportPdf(report)
      else if (preview) printInternalTable(report.title, report.subtitle, report.headers, report.rows, undefined, preview)
    } catch (cause) { preview?.close(); setError(cause instanceof Error ? cause.message : 'Không thể xuất báo cáo.') }
    finally { setBusy(false) }
  }
  return <><details ref={menu} className="report-export-menu" onKeyDown={event => { if (event.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus() } }}>
    <summary className={`button secondary${compact ? ' compact-btn' : ''}`} aria-disabled={busy || disabled} onClick={event => { if (busy || disabled) event.preventDefault() }}>{busy ? 'Đang chuẩn bị…' : 'Xuất / In báo cáo'} <span aria-hidden="true">▾</span></summary>
    <div className="report-export-options">
      <button type="button" disabled={busy || disabled} onClick={() => void run('xlsx')}>Tải Excel (.xlsx)</button>
      <button type="button" disabled={busy || disabled} onClick={() => void run('pdf')}>Tải PDF (.pdf)</button>
      <button type="button" disabled={busy || disabled} onClick={() => void run('print')}>In báo cáo</button>
    </div>
  </details>{error && <span role="alert" className="text-danger">{error}</span>}</>
}
