import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'
import { CitizenApplicationForm, type SubmissionSchema } from './CitizenSubmission'
import { serviceModeLabel } from './procedureLabels'
import { InformationHome } from './InformationHome'
import { AdministrativeServiceDesk, PublicAdministrativeServices } from './AdministrativeServices'
import { CitizenProcedureCatalog } from './CitizenProcedureCatalog'
import { showcaseProcedureCodes } from './serviceTopics'

type User = { id: string; email: string; phone: string; name: string; role: string; emailVerified: boolean; agencyScope?: string; validFrom?: string; validUntil?: string; maySignStop?: boolean; maySignSandbox?: boolean; signingAuthorityRef?: string; mustChangePassword?: boolean; canManageAgencyAccounts?: boolean }
type Procedure = { ref?: string; sourceCode?: string; code: string; name: string; field: string; categoryKey?: string; categoryEdit?: { sourceUrl: string; checkedAt: string; reason: string; version: number; updatedBy: string; updatedAt: string }; level: string; agency: string; verified: boolean; serviceMode?: string; submission?: SubmissionSchema; localEdit?: { sourceUrl: string; checkedAt: string; reason: string; version: number; updatedBy: string; updatedAt: string }; routing?: { mode: string; status: string; summary: string; officialUrl: string; checkedAt?: string; observedAuthorities?: { locality: string; authority: string }[] } }
type ProcedureCategory = { key: string; name: string; count: number; source: 'reference' | 'internal'; procedures: Procedure[]; categoryEdit?: Procedure['categoryEdit'] | null }
type CaseFile = { code: string; procedureCode: string; procedure: Procedure; status: string; statusLabel: string; version: number; createdAt: string; deadline?: string; deadlineNote?: string; applicant: { name: string; phone: string; email: string; citizenId?: string; address?: string }; subject: { name: string; relation: string }; events: { title: string; detail: string; at: string; audience: string; actor?: string; role?: string; action?: string; id?: string }[]; supplement?: { reason: string; resumeStatus?: string }; draftResult?: string; result?: { number: string; content: string }; attachments?: { name: string; url?: string; downloadUrl?: string }[]; [key: string]: any }
type Bootstrap = { user?: User; procedures: Procedure[]; procedureCategories?: ProcedureCategory[]; cases: CaseFile[]; stats: { total?: number; open?: number; waiting?: number; supplement?: number; review?: number; overdue?: number; byStatus?: Record<string, number> }; storage?: { database: string; procedureCount: number; caseRecords: number; sampleCaseCount?: number; sampleDataVersion?: number; publishedNews: number; caseCountScope: string }; statusLabels: Record<string, string>; staff?: { id: string; name: string; role: string }[]; feedback?: { code: string; score: number; content: string; created_at: string }[]; outbox?: { code: string; status: string; attempts: number; lastError?: string; messageId?: string }[] }
type ManagedUser = { id: string; email: string; phone: string; name: string; role: string; active: boolean; agencyScope: string; validFrom: string; validUntil: string; maySignStop: boolean; signingAuthorityRef: string; mustChangePassword?: boolean; canManageAgencyAccounts?: boolean; createdAt: string }
type StaffAccessRequest = { id: string; userId: string; email: string; name: string; requestedBy: string; requestedById: string; role: string; agencyScope: string; validFrom: string; validUntil: string; maySignStop: boolean; signingAuthorityRef: string; reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; reviewedBy?: string; reviewNote: string; createdAt: string; reviewedAt?: string }
type AccountAccess = { role: string; active: boolean; agencyScope: string; validFrom: string; validUntil: string; canManageAgencyAccounts?: boolean }
type StaffAccountChange = { id: string; userId: string; email: string; name: string; requestedBy: string; requestedById: string; before: AccountAccess; proposed: AccountAccess; reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; reviewedBy?: string; reviewNote: string; createdAt: string; reviewedAt?: string }
type ManagedNews = { id: string; title: string; summary: string; body: string; category: string; image: string; sourceUrl: string; featured: boolean; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; publishedAt: string; date?: string; version: number; updatedAt: string }

let csrfToken = ''
async function api<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  }
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'include', headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || `Yêu cầu thất bại (${response.status}).`)
  return result as T
}
const roleNames: Record<string, string> = { intake: 'Cán bộ tiếp nhận', specialist: 'Chuyên viên thụ lý', leader: 'Lãnh đạo phê duyệt', registrar: 'Văn thư phát hành', finance: 'Tài chính', admin: 'Quản trị hệ thống' }
const toDate = (value?: string) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value)) : 'Chưa xác định'
function printInternalTable(title: string, subtitle: string, headers: string[], rows: string[][]) {
  const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char))
  const popup = window.open('', '_blank')
  if (!popup) return
  popup.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escape(title)}</title><style>@page{size:A4 landscape;margin:16mm}body{font:10.5pt Arial,sans-serif;color:#162c43}h1{font-size:17pt;margin:0 0 8px}p{margin:0 0 16px;color:#52657a}.internal{font-size:9.5pt;margin:0 0 10px;color:#52657a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #8090a0;padding:7px;text-align:left;vertical-align:top}th{background:#eaf0f6}footer{margin-top:18px;color:#52657a;font-size:9pt}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="internal">BẢNG KÊ NỘI BỘ · TRÍCH XUẤT TỪ HỆ THỐNG</div><h1>${escape(title)}</h1><p>${escape(subtitle)}</p><table><thead><tr>${headers.map(item => `<th>${escape(item)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(item => `<td>${escape(item)}</td>`).join('')}</tr>`).join('')}</tbody></table><footer>Không phải biểu mẫu hoặc văn bản hành chính ban hành bởi cơ quan nhà nước. In lúc ${escape(new Date().toLocaleString('vi-VN'))}.</footer><script>window.onload=()=>window.print()</script></body></html>`)
  popup.document.close()
}
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const cell = (value: string) => {
    let safe = String(value ?? '')
    if (/^[\s]*[=+\-@]/.test(safe)) safe = `'${safe}`
    return `"${safe.replace(/"/g, '""')}"`
  }
  const content = '\ufeff' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const CLOSED_STATUSES = new Set(['HOAN_THANH', 'TU_CHOI', 'KHONG_GIAI_QUYET', 'DUNG'])
const OPERATION_STAGES = [
  { label: 'Tiếp nhận', statuses: ['CHO_TIEP_NHAN', 'DA_TIEP_NHAN'] },
  { label: 'Thẩm định', statuses: ['DANG_THU_LY', 'CHO_BO_SUNG'] },
  { label: 'Phê duyệt', statuses: ['TRINH_DUYET'] },
  { label: 'Phát hành', statuses: ['DA_PHE_DUYET'] },
  { label: 'Trả kết quả', statuses: ['DA_PHAT_HANH', 'HOAN_THANH'] },
]
type QueueFocus = { statuses?: string[]; deadlineFilter?: string; assigneeFilter?: string; agencyFilter?: string; procedureCode?: string; updatedSince?: string; createdFrom?: string; createdTo?: string; label?: string }
function hanoiDate(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}
function daysUntil(value?: string) {
  const day = hanoiDate(value)
  if (!day) return null
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  return Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
}
function dueText(item: CaseFile) {
  if (CLOSED_STATUSES.has(item.status)) return 'Đã kết thúc'
  const days = daysUntil(item.deadline)
  if (days === null) return item.deadlineNote || 'Chưa xác định hạn'
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
  if (days === 0) return 'Đến hạn hôm nay'
  if (days <= 3) return `Còn ${days} ngày`
  return `Hạn ${toDate(item.deadline)}`
}
function actionableCases(user: User, cases: CaseFile[]) {
  return cases.filter(item => getActions(user, item).length > 0)
}
function caseEvents(cases: CaseFile[]) {
  return cases.flatMap(item => (item.events || []).map(event => ({ ...event, code: item.code, procedureName: item.procedure?.name || item.procedureCode })))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
async function encodeFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  return { name: file.name, type: file.type, data: btoa(binary) }
}
function validateCitizenFiles(files: File[]) {
  if (files.length > 8) return 'Mỗi lần gửi nhận tối đa 8 tệp.'
  if (files.some(file => file.size > 8 * 1024 * 1024)) return 'Mỗi tệp không được vượt quá 8 MB.'
  if (files.reduce((sum, file) => sum + file.size, 0) > 9 * 1024 * 1024) return 'Tổng dung lượng tệp một lần gửi không được vượt quá 9 MB.'
  return ''
}
type PortalRoute = 'public' | 'staff' | 'guide' | 'catalog' | 'submit' | 'track'
const routeFromPath = (): PortalRoute => window.location.pathname.startsWith('/staff') ? 'staff' : window.location.pathname.startsWith('/huong-dan') ? 'guide' : window.location.pathname.startsWith('/thu-tuc') ? 'catalog' : window.location.pathname.startsWith('/nop-ho-so') ? 'submit' : window.location.pathname.startsWith('/tra-cuu-ho-so') ? 'track' : 'public'

function AuthScreen({ onAuthenticated, onBack }: { onAuthenticated: (user: User, csrf: string) => void; onBack: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const data = await api<{ user: User; csrfToken: string }>('/api/auth/login', values)
      onAuthenticated(data.user, data.csrfToken)
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể xử lý yêu cầu.') } finally { setBusy(false) }
  }
  return <main className="auth-page official-auth">
    <AgencyMasthead staff />
    <section className="auth-content">
      <div className="auth-intro">
        <button className="staff-back-link" onClick={onBack}>← Quay về cổng thông tin</button>
        <span className="eyebrow">KHU VỰC LÀM VIỆC NỘI BỘ</span>
        <h1>Bàn làm việc nội bộ</h1>
        <p>Đăng nhập để tiếp nhận, phân công và theo dõi hồ sơ trong phạm vi tài khoản được cấp.</p>
        <div className="auth-guidance">
          <p><b>Tài khoản</b><span>Do quản trị viên của ứng dụng cấp.</span></p>
          <p><b>Phân quyền</b><span>Theo vai trò, đơn vị công tác và thời hạn được giao.</span></p>
        </div>
      </div>
      <section className="auth-panel" aria-labelledby="staff-login-title"><div className="auth-card">
      <span className="eyebrow">ĐĂNG NHẬP CÁN BỘ</span><h2 id="staff-login-title">Truy cập bàn xử lý</h2><p className="muted">Dùng email và mật khẩu của tài khoản nội bộ đã được cấp.</p>
      <form onSubmit={submit} className="form-stack">
        <label>Email tài khoản<input name="email" type="email" autoComplete="username" maxLength={254} required /></label>
        <label>Mật khẩu<input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="button primary full" disabled={busy}>{busy ? 'Đang xác thực…' : 'Đăng nhập cán bộ'}</button>
      </form>
      <div className="auth-footnote"><span className="lock-icon" aria-hidden="true">i</span><span>Quản trị viên cấp tài khoản và giới hạn quyền theo vai trò, cơ quan, thời hạn.</span></div>
      </div></section>
    </section>
    <footer className="auth-legal">Hệ thống hiện vận hành độc lập; chưa kết nối dữ liệu, đăng nhập một lần hoặc tài khoản công vụ của cơ quan nhà nước.</footer>
  </main>
}

function PasswordChangeScreen({ onChanged, onSignOut }: { onChanged: (user: User) => void; onSignOut: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    if (values.newPassword !== values.confirmPassword) { setError('Mật khẩu xác nhận chưa khớp.'); return }
    setBusy(true); setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/change-password', { currentPassword: values.currentPassword, newPassword: values.newPassword })
      onChanged(result.user)
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể đổi mật khẩu.') } finally { setBusy(false) }
  }
  return <main className="auth-page official-auth">
    <AgencyMasthead staff />
    <section className="auth-content password-change-content">
      <div className="auth-intro"><span className="eyebrow">BẢO MẬT TÀI KHOẢN CÁN BỘ</span><h1>Đổi mật khẩu khởi tạo</h1><p>Đây là lần đăng nhập đầu tiên. Hãy đổi mật khẩu được bàn giao trước khi mở dữ liệu và chức năng nghiệp vụ.</p></div>
      <section className="auth-panel" aria-labelledby="password-change-title"><div className="auth-card">
        <span className="eyebrow">CẬP NHẬT THÔNG TIN ĐĂNG NHẬP</span><h2 id="password-change-title">Tạo mật khẩu riêng</h2><p className="muted">Mật khẩu cần có từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Mật khẩu khởi tạo<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label>
          <label>Mật khẩu mới<input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label>Nhập lại mật khẩu mới<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button primary full" disabled={busy}>{busy ? 'Đang cập nhật…' : 'Đổi mật khẩu và tiếp tục'}</button>
        </form>
      </div></section>
    </section>
    <footer className="auth-legal password-change-legal"><span>Tài khoản được cấp theo vai trò, cơ quan và thời hạn đã duyệt.</span><button type="button" className="text-button" onClick={onSignOut}>Đăng xuất</button></footer>
  </main>
}

const NATIONAL_PORTAL = 'https://dichvucong.gov.vn/'
const NATIONAL_SERVICES = 'https://dichvucong.gov.vn/dvc-dich-vu-cong-truc-tuyen'
const CENTER_HOME = 'https://ttpvhcc.hanoi.gov.vn/trang-chu'
const CITY_SUPPORT = 'https://ttpvhcc.hanoi.gov.vn/'
function AgencyMasthead({ staff = false }: { staff?: boolean }) {
  return <div className="agency-masthead">
    <div className="agency-masthead-inner">
      <a className="agency-emblem" href="/" aria-label="Trang chủ hệ thống">
        <img src="/images/hanoi-logo.png" alt="Biểu trưng Hà Nội" />
      </a>
      <div className="agency-title">
        <span>{staff ? 'KHU VỰC CÁN BỘ' : 'TRANG THÔNG TIN ĐIỆN TỬ'}</span>
        {staff ? <b>HỆ THỐNG THÔNG TIN<br className="masthead-break" /> QUẢN LÝ HÀNH CHÍNH</b> : <b>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG<br className="masthead-break" /> THÀNH PHỐ HÀ NỘI</b>}
        <small>{staff ? 'TIẾP NHẬN VÀ GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH' : 'HÀNH CHÍNH THÔNG MINH - TẬN TÂM PHỤC VỤ'}</small>
      </div>
      {!staff && <a className="national-portal-banner" href={NATIONAL_PORTAL} target="_blank" rel="noreferrer" aria-label="Mở Cổng Dịch vụ công quốc gia">
        <img src="/images/congdichvucongquocgia.png" alt="Cổng Dịch vụ công quốc gia" />
      </a>}
    </div>
  </div>
}

function PublicProcedureSearch({ onOpenProcedure }: { onOpenProcedure: (code: string) => void }) {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [limit, setLimit] = useState(8)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api<{ procedures: Procedure[] }>('/api/procedures')
      .then(result => { if (active) setProcedures(result.procedures) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được danh mục thủ tục.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const fields = useMemo(() => [...new Set(procedures.map(item => item.field).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [procedures])
  const browseOrder = useMemo(() => {
    const featured = showcaseProcedureCodes.map(code => procedures.find(item => item.code === code)).filter((item): item is Procedure => Boolean(item))
    const byAgency = new Map<string, Procedure>()
    for (const item of procedures) if (!byAgency.has(item.agency)) byAgency.set(item.agency, item)
    const first = [...featured, ...byAgency.values()]
    const seen = new Set(first.map(item => item.code))
    return [...first.filter((item, index) => first.findIndex(previous => previous.code === item.code) === index), ...procedures.filter(item => !seen.has(item.code))]
  }, [procedures])
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi')
    return browseOrder.filter(item => (field === 'all' || item.field === field) && (!term || [item.code, item.name, item.field, item.agency, item.level].join(' ').toLocaleLowerCase('vi').includes(term)))
  }, [browseOrder, query, field])

  return <section className="portal-section public-procedure-search" id="tra-cuu-thu-tuc" aria-labelledby="public-procedure-title">
    <div className="section-heading"><div><span className="eyebrow">DANH MỤC THAM CHIẾU</span><h2 id="public-procedure-title">Tra cứu {procedures.length.toLocaleString('vi-VN')} thủ tục theo lĩnh vực</h2></div><a className="plain-link" href={NATIONAL_SERVICES} target="_blank" rel="noreferrer">Mở danh mục chính thức ↗</a></div>
    <p className="catalog-disclaimer">Kết quả dưới đây giúp bạn định hướng tra cứu. Hãy đối chiếu thủ tục, thành phần, cơ quan và thời hạn trên Cổng Dịch vụ công quốc gia trước khi nộp.</p>
    <div className="public-search-controls"><label>Tên hoặc mã thủ tục<input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(8) }} placeholder="Ví dụ: khai sinh, đăng ký hộ kinh doanh…" /></label><label>Lĩnh vực<select value={field} onChange={event => { setField(event.target.value); setLimit(8) }}><option value="all">Tất cả lĩnh vực</option>{fields.map(value => <option key={value} value={value}>{value}</option>)}</select></label></div>
    {loading && <p className="catalog-status" role="status">Đang tải danh mục thủ tục…</p>}
    {error && <p className="catalog-status catalog-error" role="alert">{error}</p>}
    {!loading && !error && <><p className="catalog-status">Đang xem {Math.min(limit, results.length).toLocaleString('vi-VN')} trong {results.length.toLocaleString('vi-VN')} thủ tục tham chiếu</p><div className="public-procedure-results">{results.slice(0, limit).map(item => <article key={item.code}><div><small>{item.code} · {item.field || 'Chưa phân nhóm'} · {serviceModeLabel(item.level)}</small><h3>{item.name}</h3><p>{item.agency || 'Cơ quan thực hiện theo thủ tục trên Cổng quốc gia'}</p>{item.routing?.summary && <p className="public-route-summary">{item.routing.summary}</p>}</div><button className="procedure-detail-link" onClick={() => onOpenProcedure(item.code)}>Xem thông tin thủ tục →</button></article>)}</div>{results.length === 0 && <div className="catalog-empty">Không tìm thấy kết quả. Thử từ khóa khác hoặc chọn tất cả lĩnh vực.</div>}{results.length > limit && <button className="button secondary catalog-more" onClick={() => setLimit(value => value + 8)}>Xem thêm thủ tục</button>}</>}
  </section>
}

type PublicView = 'public' | 'catalog' | 'submit' | 'track' | 'receipt'
type SubmissionReceipt = { code: string; accessKey?: string; status?: string; statusLabel?: string }

function PublicPortal({ onStaff, onGuide, onNavigate, onStartProcedure, onReceipt, receipt, signedIn, initialView, initialProcedureCode }: { onStaff: () => void; onGuide: () => void; onNavigate: (route: PortalRoute, procedureCode?: string, applicantType?: 'citizen' | 'organization') => void; onStartProcedure: (code: string) => void; onReceipt: (value: SubmissionReceipt) => void; receipt: SubmissionReceipt | null; signedIn: boolean; initialView: 'public' | 'catalog' | 'submit' | 'track'; initialProcedureCode: string }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [view, setView] = useState<PublicView>(initialView)
  if (view !== 'public') return <CitizenWorkflow view={view} receipt={receipt} initialProcedureCode={initialProcedureCode} onBack={() => { setView('public'); onNavigate('public') }} onSubmit={() => { setView('submit'); onNavigate('submit') }} onTrack={() => { setView('track'); onNavigate('track') }} onCatalog={() => { setView('catalog'); onNavigate('catalog') }} onStartProcedure={onStartProcedure} onSubmitted={value => { onReceipt(value); setView('receipt') }} />
  return <div className="public-site">
    <AgencyMasthead />
    <header className={`public-header official-header${mobileNavOpen ? ' mobile-open' : ''}`}>
      <button className="mobile-nav-toggle" type="button" aria-expanded={mobileNavOpen} aria-controls="public-main-navigation" onClick={() => setMobileNavOpen(open => !open)}>
        <span aria-hidden="true">☰</span> Danh mục
      </button>
      <nav className="public-nav" id="public-main-navigation" aria-label="Điều hướng chính">
        <a className="nav-home" href="/" onClick={event => { event.preventDefault(); onNavigate('public') }}>⌂ <span>Trang chủ</span></a>
        <a href="/#gioi-thieu">Giới thiệu</a>
        <a href="/#tin-tuc">Tin tức, sự kiện</a>
        <a href="/#thu-vien-anh">Thư viện ảnh</a>
        <a href="#ho-tro">Liên hệ</a>
        <a href="/huong-dan" onClick={event => { event.preventDefault(); onGuide() }}>Hướng dẫn sử dụng</a>
      </nav>
      <div className="public-header-actions">
        <button className="button staff-entry-button" onClick={onStaff}>{signedIn ? 'Mở bàn cán bộ' : 'Đăng nhập cán bộ'}</button>
      </div>
    </header>
    <div className="official-announcement"><span>THÔNG TIN DỊCH VỤ CÔNG</span><p>Cổng này có luồng lập, gửi và theo dõi hồ sơ trong cơ sở dữ liệu của ứng dụng; hiện chưa liên thông giao dịch chính thức với cơ quan nhà nước.</p><a href={NATIONAL_PORTAL} target="_blank" rel="noreferrer">Đến Cổng Dịch vụ công quốc gia <b>↗</b></a></div>

    <main>
      <InformationHome />

      <PublicProcedureSearch onOpenProcedure={code => onNavigate('catalog', code)} />
      <PublicAdministrativeServices request={api} />

      <section className="support-strip" id="ho-tro"><div><span className="eyebrow">CẦN HỖ TRỢ?</span><h2>Trung tâm Phục vụ hành chính công Hà Nội</h2><p>Thông tin, hướng dẫn và thông báo về việc thực hiện thủ tục hành chính tại Thành phố.</p></div><div className="support-actions"><a className="button secondary" href={CITY_SUPPORT} target="_blank" rel="noreferrer">Trang thông tin Trung tâm <span>↗</span></a><a className="support-phone" href="tel:0241022">024 1022 <small>nhánh 7, 8</small></a><a className="support-phone" href="tel:19001009">1900 1009 <small>tổng đài thông minh</small></a></div></section>
    </main>

    <footer className="public-footer"><a className="public-brand" href={CENTER_HOME} aria-label="Mở Trang thông tin Trung tâm Phục vụ hành chính công Hà Nội"><img className="footer-emblem" src="/images/hanoi-logo.png" alt="" /><span><b>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG</b><small>THÀNH PHỐ HÀ NỘI</small></span></a><span>Giao dịch trực tuyến của cá nhân, tổ chức và doanh nghiệp được thực hiện trên Cổng Dịch vụ công quốc gia. Tuyến xử lý phụ thuộc thủ tục và cơ quan thực hiện được chọn.</span><a href={NATIONAL_PORTAL} target="_blank" rel="noreferrer">dichvucong.gov.vn ↗</a></footer>
  </div>
}

function CitizenWorkflow({ view, receipt, initialProcedureCode, onBack, onSubmit, onTrack, onCatalog, onStartProcedure, onSubmitted }: { view: PublicView; receipt: SubmissionReceipt | null; initialProcedureCode: string; onBack: () => void; onSubmit: () => void; onTrack: () => void; onCatalog: () => void; onStartProcedure: (code: string) => void; onSubmitted: (value: SubmissionReceipt) => void }) {
  return <div className="public-site citizen-workflow-site">
    <AgencyMasthead />
    <header className="citizen-workflow-header">
      <button className="text-button" onClick={onBack}>← Về cổng dịch vụ</button>
      <nav aria-label="Dịch vụ công dân"><button className={view === 'catalog' ? 'active' : ''} onClick={onCatalog}>Danh mục thủ tục</button><button className={view === 'submit' ? 'active' : ''} onClick={onSubmit}>Nộp hồ sơ</button><button className={view === 'track' ? 'active' : ''} onClick={onTrack}>Tra cứu hồ sơ</button><a href="/huong-dan">Hướng dẫn</a></nav>
    </header>
    <main className="citizen-workflow-main">
      {view === 'catalog' && <CitizenProcedureCatalog request={api} onStartProcedure={onStartProcedure} />}
      {view === 'submit' && <CitizenApplicationForm request={api} initialProcedureCode={initialProcedureCode} onSubmitted={onSubmitted} />}
      {view === 'receipt' && receipt && <CitizenReceiptView receipt={receipt} onTrack={onTrack} />}
      {view === 'track' && <CitizenTrackingPage initialReceipt={receipt} />}
    </main>
    <footer className="citizen-workflow-footer"><span>Giữ mã hồ sơ sau khi gửi. Khóa tra cứu do cán bộ tiếp nhận hoặc trả kết quả cung cấp cho chủ hồ sơ.</span><button className="text-button" onClick={onBack}>Về trang chủ</button></footer>
  </div>
}

function CitizenReceiptView({ receipt, onTrack }: { receipt: SubmissionReceipt; onTrack: () => void }) {
  const [copied, setCopied] = useState(false)
  async function copyReceipt() {
    try { await navigator.clipboard.writeText(`Mã hồ sơ: ${receipt.code}`); setCopied(true) }
    catch { setCopied(false) }
  }
  return <section className="citizen-receipt-page">
    <span className="eyebrow">ĐÃ GHI NHẬN HỒ SƠ</span><h1>Hồ sơ đã được gửi</h1><p>Hồ sơ đã vào hàng đợi tiếp nhận. Hãy lưu mã hồ sơ bên dưới để liên hệ với cơ quan tiếp nhận.</p>
    <div className="receipt-credentials"><div><small>MÃ HỒ SƠ</small><b>{receipt.code}</b></div></div>
    <div className="citizen-source-note"><b>Nhận khóa tra cứu</b><span>Cán bộ tiếp nhận hoặc trả kết quả quản lý mã hồ sơ và khóa tra cứu trong bàn làm việc. Liên hệ cơ quan tiếp nhận để được cung cấp khóa sau khi xác minh chủ hồ sơ. Chưa gửi SMS/email tự động.</span></div>
    <div className="citizen-receipt-actions"><button className="button secondary" onClick={copyReceipt}>{copied ? 'Đã sao chép' : 'Sao chép thông tin'}</button><button className="button primary" onClick={onTrack}>Theo dõi hồ sơ</button></div>
  </section>
}

function CitizenTrackingPage({ initialReceipt }: { initialReceipt: SubmissionReceipt | null }) {
  const [code, setCode] = useState(initialReceipt?.code || '')
  const [accessKey, setAccessKey] = useState(initialReceipt?.accessKey || '')
  const [item, setItem] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function lookup(event?: FormEvent<HTMLFormElement>, credentials?: { code: string; accessKey: string }) {
    event?.preventDefault(); setBusy(true); setError(''); setMessage('')
    const lookupCode = credentials?.code || code
    const lookupKey = credentials?.accessKey || accessKey
    if (credentials) { setCode(lookupCode); setAccessKey(lookupKey) }
    try { const result = await api<{ case: any }>('/api/public/cases/lookup', { code: lookupCode, accessKey: lookupKey }); setItem(result.case) }
    catch (reason) { setItem(null); setError(reason instanceof Error ? reason.message : 'Không tìm thấy hồ sơ với thông tin đã nhập.') }
    finally { setBusy(false) }
  }
  async function citizenAction(action: 'submit_supplement' | 'feedback' | 'create_payment' | 'confirm_payment', payload: Record<string, any>) {
    if (!item) return
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api<{ case: any }>(`/api/public/cases/${encodeURIComponent(item.code)}/actions`, { accessKey, action, expectedVersion: item.version, payload })
      setItem(result.case); setMessage(action === 'submit_supplement' ? 'Đã gửi nội dung bổ sung.' : action === 'feedback' ? 'Đã ghi nhận đánh giá của bạn.' : action === 'create_payment' ? 'Đã tạo mã theo dõi khoản thu trong hồ sơ.' : 'Đã ghi nhận chứng từ người nộp khai; hồ sơ chờ cán bộ tài chính đối chiếu.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể ghi nhận thao tác.') }
    finally { setBusy(false) }
  }
  return <section className="citizen-track-page">
    <div className="citizen-page-heading"><span className="eyebrow">TRA CỨU TIẾN ĐỘ</span><h1>Tra cứu hồ sơ đã gửi</h1><p>Nhập mã hồ sơ và khóa tra cứu do cán bộ tiếp nhận hoặc trả kết quả cung cấp. Không cần tài khoản công dân.</p></div>
    <form className="citizen-track-form" onSubmit={lookup}><label className="citizen-field">Mã hồ sơ<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="HN-2026-XXXXXXXX" autoComplete="off" required /></label><label className="citizen-field">Khóa tra cứu<input value={accessKey} onChange={event => setAccessKey(event.target.value)} autoComplete="off" spellCheck={false} required /></label><button className="button primary" disabled={busy}>{busy ? 'Đang tra cứu…' : 'Tra cứu hồ sơ'}</button></form>
    <aside className="sample-lookup-guidance" role="note"><div><b>Hồ sơ tình huống để xem thử</b><p>Dữ liệu dưới đây do ứng dụng tạo để minh họa thao tác tra cứu; không phải hồ sơ thật và không có giá trị pháp lý.</p></div><div className="sample-lookup-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => lookup(undefined, { code: 'HN-2026-34374F1C', accessKey: 'A11BA24C2898477D98F06C4CAD2ED22336492DA922666720412C947DC14EAF52' })}>Xem tình huống chờ bổ sung</button><button type="button" className="button secondary" disabled={busy} onClick={() => lookup(undefined, { code: 'HN-2026-37F2572D', accessKey: '73D3F359300354E0CEEFE0F29ABAAEE879669A1CB946AC01E6844C5E7EDCBB21' })}>Xem tình huống đã phát hành</button></div></aside>
    {error && <div className="form-error" role="alert">{error}</div>}{message && <div className="citizen-success" role="status">{message}</div>}
    {item && <CitizenCaseStatus item={item} busy={busy} onAction={citizenAction} />}
  </section>
}

function CaseDeclaration({ item }: { item: CaseFile }) {
  const schema = item.procedure?.submission
  if (!schema || !item.declaration) return null
  const entries = schema.fields.filter(field => Object.hasOwn(item.declaration, field.id))
  return <section className="citizen-case-section"><h3>Tờ khai đã nộp</h3><dl className="case-declaration">{entries.map(field => <div key={field.id}><dt>{field.label}</dt><dd>{item.declaration[field.id] || 'Không khai'}</dd></div>)}<div><dt>Nhận kết quả</dt><dd>{item.deliveryMethod || 'Chưa chọn'}{item.deliveryAddress && ` · ${item.deliveryAddress}`}</dd></div></dl></section>
}

function CitizenCaseStatus({ item, busy, onAction }: { item: any; busy: boolean; onAction: (action: 'submit_supplement' | 'feedback' | 'create_payment' | 'confirm_payment', payload: Record<string, any>) => Promise<void> }) {
  const [score, setScore] = useState('5')
  const [feedback, setFeedback] = useState('')
  const [localError, setLocalError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  async function submitSupplement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const files = values.getAll('supplementFiles').filter((value): value is File => value instanceof File && value.size > 0)
    const fileError = validateCitizenFiles(files)
    if (fileError) { setLocalError(fileError); return }
    setLocalError('')
    await onAction('submit_supplement', { note: values.get('note'), files: await Promise.all(files.map(encodeFile)) })
    form.reset()
  }
  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onAction('feedback', { score: Number(score), content: feedback })
    setFeedback('')
  }
  const pendingPayment = (item.payments || []).find((payment: any) => payment.status === 'PENDING')
  async function confirmPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    if (!pendingPayment) return
    await onAction('confirm_payment', { transactionRef: pendingPayment.transactionRef, paymentMethod, paymentEvidence: values.get('paymentEvidence') })
  }

  return <article className="citizen-case-view">
    {item.sampleData && <aside className="sample-data-notice citizen-sample-note" role="note"><b>Hồ sơ tình huống mô phỏng</b><span>{item.sampleDataNote || 'Thông tin này được tạo để minh họa cách tra cứu, không phải hồ sơ thật và không có giá trị pháp lý.'}</span></aside>}
    <header className="citizen-case-heading"><div><span className="eyebrow">{item.procedureCode}</span><h2>{item.procedure?.name || 'Hồ sơ thủ tục hành chính'}</h2><p>Mã hồ sơ <b>{item.code}</b> · Cơ quan tiếp nhận: {item.receivingAgency}</p></div><div className="citizen-case-current-status"><small>TRẠNG THÁI HIỆN TẠI</small><b>{item.statusLabel}</b></div></header>
    <div className="citizen-progress evidence-progress" aria-label="Tiến độ xử lý hồ sơ">{(item.progress || []).map((phase: { id: string; label: string; state: string; at?: string }, index: number) => <div key={phase.id} className={phase.state}><i>{phase.state === 'completed' ? '✓' : phase.state === 'terminated' ? '×' : index + 1}</i><b>{phase.label}</b><span>{({ completed: 'Đã hoàn tất', current: 'Đang xử lý', pending: 'Chưa thực hiện', paused: 'Chờ bổ sung', terminated: 'Đã kết thúc tại khâu này' } as Record<string, string>)[phase.state]}</span>{phase.at && <time>{toDate(phase.at)}</time>}</div>)}</div>
    {item.status === 'CHO_BO_SUNG' && <div className="citizen-request-warning"><b>Cơ quan đang yêu cầu bạn bổ sung thông tin</b><p>{item.supplement?.reason}</p>{item.supplement?.items?.length > 0 && <ul>{item.supplement.items.map((entry: string, index: number) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul>}</div>}
    {item.publicNote && <div className="citizen-request-warning"><b>Thông tin từ cơ quan</b><p>{item.publicNote}</p></div>}
    <div className="citizen-case-summary"><div><small>Ngày gửi</small><b>{toDate(item.createdAt)}</b></div><div><small>Thời hạn</small><b>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</b></div><div><small>Người nộp</small><b>{item.applicant?.name}</b></div></div>
    <CaseDeclaration item={item} />
    {item.fee?.amount && <section className="citizen-case-section citizen-payment-section"><h3>Khoản thu phí, lệ phí theo hồ sơ</h3><dl className="case-declaration"><div><dt>Số tiền</dt><dd><b>{Number(item.fee.amount).toLocaleString('vi-VN')} đồng</b></dd></div><div><dt>Căn cứ pháp lý thu phí</dt><dd>{item.fee.basis}</dd></div><div><dt>Trạng thái khoản thu</dt><dd>{({ DUE: 'Chờ người nộp khai đã thanh toán', PAID: 'Đã khai thanh toán · chờ kế toán đối chiếu chứng từ', RECONCILED: 'Đã đối chiếu chứng từ trong hệ thống', WAIVED: 'Đã miễn thu phí, lệ phí', REFUNDED: 'Đã ghi nhận hoàn trả' } as Record<string, string>)[item.fee.status] || item.fee.status}</dd></div></dl><p className="field-help" style={{ margin: '6px 0 10px' }}>Mã khoản thu được lưu trong hồ sơ. Sau khi nộp theo hướng dẫn của cơ quan, nhập mã giao dịch hoặc số biên lai để kế toán đối chiếu.</p><div className="form-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>{item.fee.status === 'DUE' && (pendingPayment ? <form className="citizen-action-form" onSubmit={confirmPayment}><p>Mã khoản thu <b>{pendingPayment.transactionRef}</b></p><label className="citizen-field">Hình thức đã nộp<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option value="BANK_TRANSFER">Chuyển khoản</option><option value="COUNTER_RECEIPT">Nộp tại quầy có biên lai</option><option value="POSTAL_RECEIPT">Nộp qua bưu chính có chứng từ</option><option value="OTHER">Hình thức khác có chứng từ</option></select></label><label className="citizen-field">Mã giao dịch / số biên lai<input name="paymentEvidence" required minLength={4} maxLength={160} /></label><button className="button primary" disabled={busy}>Gửi thông tin thanh toán để đối chiếu</button></form> : <button type="button" className="button primary" disabled={busy} onClick={() => onAction('create_payment', {})}>Tạo mã theo dõi khoản thu</button>)}{['PAID', 'RECONCILED', 'REFUNDED'].includes(item.fee.status) && <button type="button" className="button secondary" onClick={() => printInternalTable('Phiếu theo dõi khoản thu', `Hồ sơ ${item.code}`, ['Số tiền', 'Trạng thái', 'Căn cứ'], [[String(item.fee.amount), String(item.fee.status), String(item.fee.basis)]])}>In phiếu theo dõi khoản thu</button>}</div></section>}
    <section className="citizen-case-section"><h3>Nội dung đề nghị</h3><p>{item.requestSummary}</p>{item.attachments?.length > 0 && <div className="citizen-file-list"><b>Tài liệu đã gửi</b>{item.attachments.map((file: any, index: number) => <span key={`${file.name}-${index}`}>{file.name}</span>)}</div>}</section>
    {item.status === 'CHO_BO_SUNG' && <form className="citizen-action-form" onSubmit={submitSupplement}><h3>Gửi nội dung bổ sung</h3><label className="citizen-field">Nội dung trả lời<textarea name="note" rows={4} maxLength={1200} placeholder="Trả lời từng yêu cầu của cơ quan." /></label><label className="citizen-field">Tài liệu bổ sung<input name="supplementFiles" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple /><small>Tối đa 8 tệp, 8 MB mỗi tệp; tổng dung lượng không quá 9 MB.</small></label>{localError && <div className="form-error" role="alert">{localError}</div>}<button className="button primary" disabled={busy}>Gửi bổ sung</button></form>}
    {item.result && <section className="citizen-case-section"><h3>Kết quả giải quyết</h3><p>{item.result.content || 'Cơ quan đã ghi nhận kết quả.'}</p>{item.result.number && <p>Số văn bản: <b>{item.result.number}</b></p>}</section>}
    <section className="citizen-case-section"><h3>Lịch sử xử lý</h3>{item.events?.length ? <div className="citizen-timeline">{item.events.map((event: any, index: number) => <article key={`${event.at}-${index}`}><i /><div><b>{event.title}</b><time>{toDate(event.at)}</time>{event.detail && <p>{event.detail}</p>}</div></article>)}</div> : <p>Chưa có cập nhật.</p>}</section>
    {['HOAN_THANH', 'TU_CHOI', 'KHONG_GIAI_QUYET', 'DUNG'].includes(item.status) && !item.feedbackSubmitted && <form className="citizen-action-form" onSubmit={submitFeedback}><h3>Đánh giá quá trình xử lý</h3><label className="citizen-field">Mức đánh giá<select value={score} onChange={event => setScore(event.target.value)}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label><label className="citizen-field">Ý kiến<textarea value={feedback} onChange={event => setFeedback(event.target.value)} rows={3} maxLength={1000} /></label><button className="button secondary" disabled={busy}>Gửi đánh giá</button></form>}
    {item.feedbackSubmitted && <p className="citizen-success">Ứng dụng đã ghi nhận đánh giá của hồ sơ này.</p>}
    {item.result?.signature && <section className="citizen-case-section"><h3>Kiểm tra chữ ký kết quả</h3><p>{item.result.signature.verified ? 'Chữ ký toàn vẹn của môi trường thử nghiệm hợp lệ.' : 'Không xác minh được chữ ký của nội dung hiện tại.'}</p><p>Mã băm tài liệu: <code>{item.result.signature.documentHash}</code></p><p>Người ký: {item.result.signature.signer} · {toDate(item.result.signature.signedAt)}</p><p className="source-warning small-warning">Chữ ký Ed25519 trong ứng dụng chỉ để kiểm tra luồng và toàn vẹn dữ liệu; không phải chữ ký số công vụ/chứng thư số hợp pháp.</p></section>}
    <p className="citizen-boundary-note">Trạng thái hồ sơ, thanh toán và chữ ký ở đây thuộc cơ sở dữ liệu thử nghiệm cục bộ; ứng dụng chưa liên thông với hệ thống nhà nước, ngân hàng hoặc nhà cung cấp chữ ký số.</p>
  </article>
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<Bootstrap>({ procedures: [], procedureCategories: [], cases: [], stats: {}, statusLabels: {}, staff: [] })
  const [route, setRoute] = useState<PortalRoute>(routeFromPath)
  const [citizenProcedureCode, setCitizenProcedureCode] = useState(() => new URLSearchParams(window.location.search).get('procedure') || '')
  const [citizenReceipt, setCitizenReceipt] = useState<SubmissionReceipt | null>(null)
  const [page, setPage] = useState('home')
  const [pageHistory, setPageHistory] = useState<string[]>(['home'])
  const [queueFocus, setQueueFocus] = useState<QueueFocus | null>(null)
  const [queueFocusVersion, setQueueFocusVersion] = useState(0)
  const [selected, setSelected] = useState<CaseFile | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [action, setAction] = useState('')
  const [actionText, setActionText] = useState('')
  const [assignee, setAssignee] = useState('')
  const captureMode = new URLSearchParams(window.location.search).get('capture') === '1'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    if (captureMode) document.documentElement.classList.add('capture-mode')
    else document.documentElement.classList.remove('capture-mode')
    return () => document.documentElement.classList.remove('capture-mode')
  }, [captureMode])

  function navigateRoute(next: PortalRoute, procedureCode = '', applicantType?: 'citizen' | 'organization') {
    const path = next === 'staff' ? '/staff' : next === 'guide' ? '/huong-dan' : next === 'submit' ? '/nop-ho-so' : next === 'track' ? '/tra-cuu-ho-so' : '/'
    const targetPath = next === 'catalog' ? '/thu-tuc' : path
    const queryParams = new URLSearchParams()
    if (procedureCode) queryParams.set(next === 'catalog' ? 'code' : 'procedure', procedureCode)
    if (applicantType) sessionStorage.setItem('hanoiApplicantType', applicantType)
    const activeApplicantType = applicantType || sessionStorage.getItem('hanoiApplicantType') || ''
    if (next === 'submit' && activeApplicantType) queryParams.set('applicant', activeApplicantType)
    const query = queryParams.size ? `?${queryParams.toString()}` : ''
    if (window.location.pathname + window.location.search !== targetPath + query) window.history.pushState({ route: next, page: next === 'staff' ? (user?.role === 'admin' ? 'overview' : 'inbox') : undefined, pageHistory }, '', targetPath + query)
    setCitizenProcedureCode(next === 'submit' ? procedureCode : '')
    setRoute(next)
  }

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = routeFromPath()
      setRoute(nextRoute)
      setCitizenProcedureCode(new URLSearchParams(window.location.search).get('procedure') || '')
      const restoredPage = window.history.state?.page
      const restoredHistory = window.history.state?.pageHistory
      if (nextRoute === 'staff' && typeof restoredPage === 'string') {
        setPage(restoredPage)
        setSelected(null)
        setMobileNavOpen(false)
        setPageHistory(Array.isArray(restoredHistory) ? restoredHistory : [restoredPage])
      }
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  const refresh = useCallback(async () => {
    const result = await api<Bootstrap>('/api/bootstrap')
    setData(result)
    if (result.user) setUser(result.user)
    setSelected(current => current ? result.cases.find(c => c.code === current.code) || null : null)
  }, [])
  useEffect(() => {
    api<{ user: User | null; csrfToken: string | null }>('/api/auth/me').then(async result => {
      if (result.user) {
        csrfToken = result.csrfToken || ''
        setUser(result.user)
        const firstPage = result.user.role === 'admin' ? 'overview' : 'inbox'
        const savedPage = window.history.state?.page
        const startPage = routeFromPath() === 'staff' && typeof savedPage === 'string' ? savedPage : firstPage
        const savedHistory = window.history.state?.pageHistory
        const startHistory = Array.isArray(savedHistory) ? savedHistory : [startPage]
        setPage(startPage); setPageHistory(startHistory)
        if (routeFromPath() === 'staff') window.history.replaceState({ ...(window.history.state || {}), route: 'staff', page: startPage, pageHistory: startHistory }, '', window.location.href)
        if (!result.user.mustChangePassword) await refresh()
      }
    }).catch(e => setError(e.message))
  }, [refresh])

  useEffect(() => {
    if (!user) return
    let active = true
    const validateSession = async () => {
      try {
        const result = await api<{ user: User | null }>('/api/auth/me')
        if (!active) return
        if (!result.user) {
          csrfToken = ''
          setUser(null); setSelected(null); setPage('home'); setMobileNavOpen(false)
          setData({ procedures: [], cases: [], stats: {}, statusLabels: {}, staff: [], feedback: [], outbox: [] })
          setRoute('public')
          if (window.location.pathname !== '/') window.history.replaceState({ route: 'public' }, '', '/')
          setError('Quyền tài khoản đã thay đổi hoặc bị thu hồi. Đăng nhập lại để tiếp tục.')
          return
        }
        const accessChanged = user.role !== result.user.role || user.agencyScope !== result.user.agencyScope || user.validFrom !== result.user.validFrom || user.validUntil !== result.user.validUntil || user.mustChangePassword !== result.user.mustChangePassword || user.maySignSandbox !== result.user.maySignSandbox
        if (accessChanged) {
          setUser(result.user); setSelected(null); setPage(result.user.role === 'admin' ? 'overview' : 'inbox')
          setData({ procedures: [], cases: [], stats: {}, statusLabels: {}, staff: [], feedback: [], outbox: [] })
          if (!result.user.mustChangePassword) await refresh()
        }
      } catch { /* A brief network failure does not invalidate an otherwise valid session. */ }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void validateSession() }
    const interval = window.setInterval(validateSession, 15_000)
    document.addEventListener('visibilitychange', onVisible)
    return () => { active = false; window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [user, refresh])

  const isStaff = !!user

  async function authenticate(account: User, csrf: string) { csrfToken = csrf; setUser(account); setError(''); navigateRoute('staff'); const firstPage = account.role === 'admin' ? 'overview' : 'inbox'; if (!account.mustChangePassword) { await refresh(); setPage(firstPage); setPageHistory([firstPage]); window.history.replaceState({ ...(window.history.state || {}), route: 'staff', page: firstPage, pageHistory: [firstPage] }, '', window.location.href) } }
  function passwordChanged(account: User) { const firstPage = account.role === 'admin' ? 'overview' : 'inbox'; setUser(account); setError(''); setPage(firstPage); setPageHistory([firstPage]); window.history.replaceState({ ...(window.history.state || {}), route: 'staff', page: firstPage, pageHistory: [firstPage] }, '', window.location.href); refresh().catch(e => setError(e instanceof Error ? e.message : 'Không tải được dữ liệu sau khi đổi mật khẩu.')) }
  async function signOut() { try { await api('/api/auth/logout', {}) } catch {} csrfToken = ''; setUser(null); setSelected(null); setPage('home'); setPageHistory(['home']); setMobileNavOpen(false); setData({ procedures: [], procedureCategories: [], cases: [], stats: {}, statusLabels: {}, staff: [], feedback: [], outbox: [] }); navigateRoute('public') }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !action) return
    const form = event.currentTarget
    const formData = new FormData(form)
    setBusy(true); setError('')
    const reasonActions = ['request_supplement', 'reject_intake', 'send_back', 'decline', 'waive_fee', 'prepare_stop_notice']
    const payload: Record<string, unknown> = {}
    if (reasonActions.includes(action)) payload.reason = actionText
    if (action === 'request_supplement') payload.items = actionText.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
    if (action === 'assign') { payload.assignee = assignee; payload.unit = user?.name }
    if (action === 'save_draft' || action === 'submit_review') payload.draft = actionText || selected.draftResult || ''
    if (action === 'approve') payload.note = actionText
    if (action === 'submit_supplement') payload.note = actionText
    if (action === 'digitize_documents') { payload.pageCount = Number(formData.get('pageCount')); payload.documentRegister = actionText }
    if (action === 'set_fee') { payload.amount = Number(formData.get('feeAmount')); payload.basis = actionText }
    if (action === 'deliver') { payload.receiver = formData.get('deliveryReceiver'); payload.evidence = formData.get('deliveryEvidence'); payload.channel = formData.get('deliveryChannel') }
    if (action === 'issue') payload.resultNumber = formData.get('resultNumber')
    if (action === 'prepare_stop_notice') {
      payload.channel = formData.get('stopChannel')
      payload.requesterType = formData.get('requesterType')
      payload.requesterName = formData.get('requesterName')
      payload.requesterIdentifier = formData.get('requesterIdentifier')
      payload.requesterAddress = formData.get('requesterAddress')
      payload.requesterPhone = formData.get('requesterPhone')
      payload.requesterEmail = formData.get('requesterEmail')
      payload.requestReference = formData.get('requestReference')
      payload.identityVerified = formData.has('identityVerified')
      payload.authorizationVerified = formData.has('authorizationVerified')
    }
    if (action === 'issue_stop_notice') {
      payload.signatureAttested = formData.has('signatureAttested')
      payload.noticeNumber = formData.get('noticeNumber')
      payload.authorityName = formData.get('authorityName')
      payload.serviceOfficeName = formData.get('serviceOfficeName')
      payload.noticeLocation = formData.get('noticeLocation')
      payload.noticeDate = formData.get('noticeDate')
      payload.deliveryChannel = formData.get('noticeDeliveryChannel')
      payload.deliveryReference = formData.get('deliveryReference')
      payload.collectionOffice = formData.get('collectionOffice')
    }
    const evidenceFiles = formData.getAll('supportingFiles').filter((value): value is File => value instanceof File && value.size > 0)
    if (evidenceFiles.length) payload.files = await Promise.all(evidenceFiles.map(encodeFile))
    try {
      const result = await api<CaseFile>(`/api/cases/${encodeURIComponent(selected.code)}/actions`, { action, payload, expectedVersion: selected.version })
      form.reset(); setAction(''); setActionText(''); setAssignee(''); setSelected(result); await refresh(); setMessage('Đã ghi nhận thao tác và cập nhật trạng thái hồ sơ.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật hồ sơ.') } finally { setBusy(false) }
  }

  if (user?.mustChangePassword) return <PasswordChangeScreen onChanged={passwordChanged} onSignOut={signOut} />
  if (route === 'guide') return <StandaloneGuide signedIn={!!user} onHome={() => navigateRoute(user ? 'staff' : 'public')} onStaff={() => navigateRoute('staff')} />
  if (!user && route === 'staff') return <AuthScreen onAuthenticated={authenticate} onBack={() => navigateRoute('public')} />
  if (route === 'public' || route === 'catalog' || route === 'submit' || route === 'track') return <PublicPortal key={route} onStaff={() => navigateRoute('staff')} onGuide={() => navigateRoute('guide')} onNavigate={navigateRoute} onStartProcedure={code => navigateRoute('submit', code)} onReceipt={setCitizenReceipt} receipt={citizenReceipt} signedIn={!!user} initialView={route} initialProcedureCode={citizenProcedureCode} />
  if (!user) return <AuthScreen onAuthenticated={authenticate} onBack={() => navigateRoute('public')} />
  const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
    overview: { title: 'Tổng quan quản trị', eyebrow: 'TÀI KHOẢN VÀ THẨM QUYỀN', description: 'Theo dõi đề nghị cấp quyền, thay đổi tài khoản, hiệu lực và phạm vi công tác.' },
    news: { title: 'Quản lý tin tức', eyebrow: 'CỔNG THÔNG TIN', description: 'Soạn, rà soát, xuất bản và lưu trữ nội dung hiển thị trên trang chủ.' },
    home: { title: 'Tổng quan điều hành', eyebrow: 'ĐIỀU HÀNH TÁC NGHIỆP', description: 'Theo dõi hồ sơ theo trạng thái, trách nhiệm và thời hạn trong phạm vi tài khoản được cấp.' },
    inbox: { title: 'Hộp xử lý hồ sơ', eyebrow: 'TIẾP NHẬN VÀ GIẢI QUYẾT', description: 'Lọc danh sách hồ sơ theo trạng thái, người phụ trách và tình trạng thời hạn.' },
    monitoring: { title: 'Giám sát quy trình', eyebrow: 'KIỂM SOÁT VẬN HÀNH', description: 'Các chỉ số được tính từ hồ sơ và sự kiện cán bộ có quyền xem; không cộng dữ liệu ngoài phạm vi.' },
    procedures: { title: 'Danh mục thủ tục', eyebrow: 'TRA CỨU NGHIỆP VỤ', description: 'Tra cứu danh mục tham chiếu và xem rõ tình trạng xác minh tuyến, hiệu lực và nguồn.' },
    activity: { title: 'Nhật ký hồ sơ', eyebrow: 'TRUY VẾT TÁC NGHIỆP', description: 'Lần theo mốc thời gian, người thực hiện và nội dung sự kiện trong hồ sơ được phép xem.' },
    connections: { title: 'Kết nối dịch vụ', eyebrow: 'TÍCH HỢP VÀ ĐỐI SOÁT', description: 'Theo dõi phụ thuộc bên ngoài và vận hành giao dịch thử nghiệm, đối soát, hoàn tiền cùng quyền ký nội bộ.' },
    users: { title: 'Quản lý tài khoản cán bộ', eyebrow: 'QUẢN TRỊ VÀ PHÂN QUYỀN', description: 'Cấp tài khoản theo cơ quan, vai trò, thời hạn và phê duyệt tách biệt.' },
    reports: { title: 'Báo cáo theo cơ quan', eyebrow: 'TỔNG HỢP VẬN HÀNH', description: 'Tổng hợp hồ sơ lưu trong ứng dụng theo cơ quan, trạng thái và kỳ dữ liệu.' },
    guide: { title: 'Hướng dẫn sử dụng', eyebrow: 'TRA CỨU CÁCH THAO TÁC', description: 'Hướng dẫn các thao tác đang có trong cổng tra cứu và bàn làm việc cán bộ.' },
    profile: { title: 'Tài khoản cá nhân', eyebrow: 'THÔNG TIN VÀ BẢO MẬT', description: 'Kiểm tra quyền được cấp, thông tin liên hệ và quản lý phiên đăng nhập của bạn.' },
    detail: { title: 'Chi tiết hồ sơ', eyebrow: 'HỒ SƠ VÀ LỊCH SỬ', description: 'Kiểm tra thông tin, chứng cứ, lịch sử và hành động được phép ở trạng thái hiện tại.' },
  }
  const pageInfo = pageMeta[page] || pageMeta.home
  const actionOptions = selected ? getActions(user, selected) : []
  const navSections = user.role === 'admin' ? [
    { label: 'QUẢN TRỊ DỊCH VỤ', items: [
      { key: 'overview', label: 'Tổng quan quản trị', icon: '▦', count: undefined as number | undefined },
      { key: 'news', label: 'Tin tức cổng thông tin', icon: '▤', count: undefined as number | undefined },
      { key: 'users', label: 'Tài khoản cán bộ', icon: '♙', count: undefined as number | undefined },
      { key: 'reports', label: 'Báo cáo theo cơ quan', icon: '▥', count: undefined as number | undefined },
      { key: 'procedures', label: 'Danh mục thủ tục', icon: '▧', count: data.procedures.length },
      { key: 'connections', label: 'Kết nối dịch vụ', icon: '⇄', count: undefined as number | undefined },
      { key: 'guide', label: 'Hướng dẫn sử dụng', icon: '☷', count: undefined as number | undefined },
    ] },
  ] : [
    { label: 'ĐIỀU HÀNH', items: [
      { key: 'home', label: 'Tổng quan', icon: '▦' },
      { key: 'inbox', label: 'Hộp xử lý', icon: '▤', count: user.role === 'admin' ? data.cases.length : actionableCases(user, data.cases).length },
      { key: 'monitoring', label: 'Giám sát quy trình', icon: '◷', count: (data.stats.overdue || 0) || undefined },
    ] },
    { label: 'TRA CỨU NGHIỆP VỤ', items: [
      { key: 'procedures', label: 'Danh mục thủ tục', icon: '▧', count: data.procedures.length },
      { key: 'activity', label: 'Nhật ký hồ sơ', icon: '≋' },
    ] },
    { label: 'QUẢN TRỊ DỊCH VỤ', items: [
      { key: 'connections', label: 'Kết nối dịch vụ', icon: '⇄' },
      ...(user.canManageAgencyAccounts ? [{ key: 'users', label: 'Tài khoản tại cơ quan', icon: '♙' }] : []),
    ] },
    { label: 'TRỢ GIÚP', items: [
      { key: 'guide', label: 'Hướng dẫn sử dụng', icon: '☷' },
    ] },
  ]
  function openPage(nextPage: string) {
    if (nextPage !== page) {
      const nextHistory = [...pageHistory, nextPage]
      window.history.pushState({ ...(window.history.state || {}), route: 'staff', page: nextPage, pageHistory: nextHistory }, '', window.location.href)
      setPageHistory(nextHistory)
    }
    setPage(nextPage); setSelected(null); setMobileNavOpen(false); setError('')
  }
  function openQueue(focus: QueueFocus = {}) {
    setQueueFocus(focus)
    setQueueFocusVersion(value => value + 1)
    openPage('inbox')
  }
  function openCase(item: CaseFile) {
    if (page !== 'detail') {
      const nextHistory = [...pageHistory, 'detail']
      window.history.pushState({ ...(window.history.state || {}), route: 'staff', page: 'detail', pageHistory: nextHistory }, '', window.location.href)
      setPageHistory(nextHistory)
    }
    setSelected(item); setPage('detail'); setMobileNavOpen(false); setError('')
  }
  function goBack() {
    if (pageHistory.length > 1) window.history.back()
    else if (page === 'detail') openPage('inbox')
    else openPage(user?.role === 'admin' ? 'overview' : 'home')
  }

  return <div className={`app-shell${captureMode ? ' capture-mode' : ''}`}>
    <header className="topbar"><button className="staff-menu-toggle" aria-label="Mở danh mục cán bộ" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(open => !open)}><span>☰</span><small>Danh mục</small></button><button className="brand-lockup top-brand" aria-label="Trang chính hệ thống thông tin quản lý hành chính" onClick={() => openPage(user.role === 'admin' ? 'overview' : 'home')}><img className="staff-system-logo" src="/images/hanoi-logo.png" alt="Biểu trưng cổng thông tin Hà Nội" /><span><b>HỆ THỐNG THÔNG TIN</b><small>QUẢN LÝ HÀNH CHÍNH</small></span></button><div className="top-right"><button className="text-button staff-public-link" onClick={() => navigateRoute('public')}>Cổng thông tin</button><button className="account-chip account-menu-button" aria-label="Mở tài khoản cá nhân" aria-current={page === 'profile' ? 'page' : undefined} onClick={() => openPage('profile')}><span><b>{user.name}</b><small>{roleNames[user.role] || user.role}</small></span><span className="account-mobile-label">Tài khoản</span></button></div></header>
    {mobileNavOpen && <button className="staff-nav-backdrop" aria-label="Đóng danh mục" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`} aria-label="Điều hướng bàn cán bộ">
      <div className="staff-sidebar-head"><span className="nav-caption">KHÔNG GIAN LÀM VIỆC</span><button className="staff-nav-close" aria-label="Đóng danh mục" onClick={() => setMobileNavOpen(false)}>×</button></div>
      {navSections.map(section => <div className="staff-nav-section" key={section.label}><span className="nav-caption">{section.label}</span>{section.items.map(item => <button key={item.key} className={`nav-link${page === item.key || (page === 'detail' && item.key === 'inbox') ? ' active' : ''}`} aria-current={page === item.key ? 'page' : undefined} onClick={() => openPage(item.key)}><i aria-hidden="true">{item.icon}</i><span>{item.label}</span>{item.count !== undefined && <b className="nav-count">{item.count.toLocaleString('vi-VN')}</b>}</button>)}</div>)}
      <div className="sidebar-footer"><button className="nav-link sidebar-signout" onClick={signOut}><i aria-hidden="true">↪</i><span>Đăng xuất</span></button></div>
    </aside>
    <main className="workspace">
       <div className="page-heading"><div><span className="eyebrow">{pageInfo.eyebrow}</span><h1>{pageInfo.title}</h1><p>{pageInfo.description}</p></div><div className="page-heading-tools">{pageHistory.length > 1 && <button className="staff-back-action" onClick={goBack}>← Quay lại</button>}{page !== 'profile' && <><span className="scope-stamp">{user.agencyScope || 'Phạm vi được cấp'}</span><button className="refresh-data-button" onClick={() => refresh().then(() => setMessage('Đã tải lại dữ liệu trong phạm vi tài khoản.')).catch(e => setError(e instanceof Error ? e.message : 'Không thể tải lại dữ liệu.'))}>↻ Tải lại dữ liệu</button></>}</div></div>
       {!!data.storage?.sampleCaseCount && <aside className="sample-data-notice" role="note"><b>Bộ dữ liệu tình huống mô phỏng</b><span>{data.storage.sampleCaseCount.toLocaleString('vi-VN')} hồ sơ dùng để thực hành và kiểm tra giao diện; không phải hồ sơ công dân hoặc số liệu báo cáo chính thức. Chi tiết vẫn bị giới hạn theo phạm vi tài khoản.</span></aside>}
      {message && <div className="toast-success" role="status">✓ {message}<button onClick={() => setMessage('')}>Đóng</button></div>}{error && <div className="form-error page-error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
       {page === 'inbox' && <CaseQueue key={queueFocusVersion} user={user} data={data} initialFocus={queueFocus} onOpen={openCase} />}
      {page === 'overview' && user.role === 'admin' && <AdminOverview onNavigate={openPage} />}
      {page === 'news' && user.role === 'admin' && <NewsManagement onNotice={setMessage} />}
      {page === 'users' && (user.role === 'admin' || user.canManageAgencyAccounts) && <StaffAccountManagement actor={user} onNotice={setMessage} />}
       {page === 'reports' && user.role === 'admin' && <AdministrativeReports data={data} onOpenQueue={openQueue} />}
      {page === 'detail' && selected && <CaseDetail key={`${selected.code}:${selected.withdrawal?.status || ''}:${selected.withdrawal?.requestReceivedAt || ''}:${JSON.stringify(selected.withdrawal?.noticeDraft || {})}`} item={selected} isStaff={isStaff} signingAuthorityRef={user.signingAuthorityRef || ''} labels={data.statusLabels} actionOptions={actionOptions} action={action} setAction={setAction} actionText={actionText} setActionText={setActionText} assignee={assignee} setAssignee={setAssignee} staff={data.staff || []} busy={busy} onSubmitAction={submitAction} onLookupKeyChanged={async () => { setSelected(await api<CaseFile>(`/api/cases/${encodeURIComponent(selected.code)}`)); await refresh() }} onBack={goBack} />}
      {page === 'detail' && !selected && <div className="panel empty-state">Hãy chọn một hồ sơ trong danh sách để xem chi tiết.</div>}
       {page === 'home' && isStaff && <StaffHome user={user} data={data} onOpen={openCase} onOpenQueue={openQueue} onNavigate={openPage} />}
       {page === 'monitoring' && <OperationsMonitor user={user} data={data} onOpen={openCase} onOpenQueue={openQueue} onNavigate={openPage} />}
      {page === 'procedures' && <ProcedureCatalog procedures={data.procedures} procedureCategories={data.procedureCategories || []} canManage={user.role === 'admin'} onUpdated={refresh} />}
      {page === 'activity' && <CaseActivityLog cases={data.cases} onOpen={openCase} />}
      {page === 'connections' && <ServiceConnections user={user} data={data} onNavigate={openPage} />}
      {page === 'guide' && <GuideContent isStaff />}
      {page === 'profile' && <PersonalAccount user={user} onChanged={setUser} onNotice={setMessage} />}
    </main>
  </div>
}

type PersonalAccountDetails = { user: User; accessSource: string; approval: null | { reviewer: string; reviewed_at: string; reason: string; review_note: string }; emailVerification: { verified: boolean; available: boolean }; activeSessions: number; sessionExpiresAt: string }

function PersonalAccount({ user, onChanged, onNotice }: { user: User; onChanged: (user: User) => void; onNotice: (message: string) => void }) {
  const [details, setDetails] = useState<PersonalAccountDetails | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [phone, setPhone] = useState(user.phone || '')
  useEffect(() => {
    let active = true
    api<PersonalAccountDetails>('/api/auth/account').then(result => { if (active) setDetails(result) }).catch(e => { if (active) setError(e.message) })
    return () => { active = false }
  }, [])
  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy('contact'); setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/contact', { phone, currentPassword: values.get('currentPassword') })
      onChanged(result.user); setPhone(result.user.phone); form.reset(); onNotice('Đã lưu số điện thoại liên hệ.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lưu thông tin liên hệ.') } finally { setBusy('') }
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    if (values.newPassword !== values.confirmPassword) { setError('Mật khẩu xác nhận chưa khớp.'); return }
    setBusy('password'); setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/change-password', { currentPassword: values.currentPassword, newPassword: values.newPassword })
      onChanged(result.user); form.reset(); setDetails(await api<PersonalAccountDetails>('/api/auth/account')); onNotice('Đã đổi mật khẩu và kết thúc các phiên đăng nhập khác.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể đổi mật khẩu.') } finally { setBusy('') }
  }
  async function closeOtherSessions() {
    setBusy('sessions'); setError('')
    try {
      await api('/api/auth/revoke-other-sessions', {})
      setDetails(await api<PersonalAccountDetails>('/api/auth/account')); onNotice('Đã kết thúc các phiên khác. Phiên hiện tại vẫn được giữ.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể kết thúc phiên.') } finally { setBusy('') }
  }
  return <div className="personal-account-workspace">
    {error && <div className="form-error" role="alert">{error}</div>}
    <section className="panel personal-access-panel"><h2>Thông tin và quyền truy cập</h2><dl className="personal-account-facts">
      <div><dt>Họ và tên</dt><dd>{user.name}</dd></div><div><dt>Email đăng nhập</dt><dd>{user.email}</dd></div>
      <div><dt>Vai trò</dt><dd>{roleNames[user.role] || user.role}</dd></div><div><dt>Cơ quan / phạm vi</dt><dd>{user.agencyScope || 'Chưa có thông tin'}</dd></div>
      <div><dt>Hiệu lực từ</dt><dd>{user.validFrom ? toDate(user.validFrom) : 'Không giới hạn ngày bắt đầu'}</dd></div><div><dt>Hiệu lực đến</dt><dd>{user.validUntil ? toDate(user.validUntil) : 'Không giới hạn ngày kết thúc'}</dd></div>
      <div><dt>Nguồn cấp quyền</dt><dd>{details?.accessSource || 'Đang tải thông tin…'}{details?.approval && <small>{details.approval.reviewer} · {toDate(details.approval.reviewed_at)}<br />Căn cứ: {details.approval.reason}</small>}</dd></div>
      <div><dt>Xác minh email</dt><dd>Chưa xác minh qua email<small>Hệ thống chưa có chức năng gửi mã hoặc liên kết xác minh email. Phê duyệt tài khoản là bước cấp quyền riêng.</small></dd></div>
      <div><dt>Quyền ký Mẫu 06</dt><dd>{user.maySignStop ? user.signingAuthorityRef || 'Đã được cấp' : 'Chưa được cấp'}</dd></div>
    </dl><p className="muted">Họ tên, email đăng nhập và quyền công tác do quản trị viên quản lý. Liên hệ quản trị viên khi cần điều chỉnh.</p></section>
    <div className="personal-account-forms">
      <section className="panel"><h2>Thông tin liên hệ</h2><p className="muted">Cập nhật số điện thoại của bạn bằng mật khẩu hiện tại.</p><form className="form-stack" onSubmit={saveContact}>
        <label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} /></label>
        <label>Mật khẩu hiện tại<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label>
        <button className="button primary" disabled={!!busy || phone === (user.phone || '')}>{busy === 'contact' ? 'Đang lưu…' : 'Lưu thông tin liên hệ'}</button>
      </form></section>
      <section className="panel"><h2>Đổi mật khẩu</h2><p className="muted">Từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số. Đổi mật khẩu sẽ kết thúc các phiên khác.</p><form className="form-stack" onSubmit={changePassword}>
        <label>Mật khẩu hiện tại<input name="currentPassword" type="password" autoComplete="current-password" maxLength={128} required /></label>
        <label>Mật khẩu mới<input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <label>Nhập lại mật khẩu mới<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <button className="button primary" disabled={!!busy}>{busy === 'password' ? 'Đang cập nhật…' : 'Đổi mật khẩu'}</button>
      </form></section>
    </div>
    <section className="panel personal-session-panel"><div><h2>Phiên đăng nhập</h2><p>{details ? `${details.activeSessions} phiên còn hiệu lực. Phiên hiện tại hết hạn ${toDate(details.sessionExpiresAt)}.` : 'Đang tải phiên đăng nhập…'}</p><p className="muted">Kết thúc các phiên khác nếu bạn đã đăng nhập trên máy dùng chung.</p></div><button className="button secondary" disabled={!!busy || !details || details.activeSessions <= 1} onClick={closeOtherSessions}>{busy === 'sessions' ? 'Đang kết thúc…' : 'Kết thúc các phiên khác'}</button></section>
  </div>
}

function getActions(user: User, item: CaseFile) {
  const { role, maySignStop } = user
  const status = item.status
  const all: Record<string, { value: string; label: string }[]> = {
    CHO_TIEP_NHAN: [{ value: 'accept', label: 'Tiếp nhận' }, { value: 'request_supplement', label: 'Yêu cầu bổ sung' }, { value: 'reject_intake', label: 'Từ chối tiếp nhận' }],
    DA_TIEP_NHAN: [{ value: 'assign', label: 'Phân công xử lý' }, { value: 'request_supplement', label: 'Yêu cầu bổ sung' }],
    DANG_THU_LY: [{ value: 'save_draft', label: 'Lưu dự thảo' }, { value: 'submit_review', label: 'Trình phê duyệt' }, { value: 'request_supplement', label: 'Yêu cầu bổ sung' }],
    TRINH_DUYET: [{ value: 'approve', label: 'Phê duyệt' }, { value: 'send_back', label: 'Yêu cầu chỉnh sửa' }, { value: 'decline', label: 'Kết luận không giải quyết' }],
    DA_PHE_DUYET: [{ value: 'sign_result', label: 'Ký thử nghiệm kết quả' }, { value: 'issue', label: 'Phát hành kết quả thử nghiệm' }],
    DA_PHAT_HANH: [{ value: 'deliver', label: 'Ghi nhận trả kết quả thử nghiệm' }],
    CHO_BO_SUNG: [{ value: 'submit_supplement', label: 'Gửi bổ sung' }],
  }
  if (role === 'admin') return []
  if (item.withdrawal?.status === 'CHO_KY_PHAT_HANH') {
    return role === 'leader' && maySignStop ? [{ value: 'issue_stop_notice', label: 'Ghi nhận phát hành Thông báo dừng Mẫu 06' }] : []
  }
  const permitted: Record<string, string[]> = { intake: ['accept', 'request_supplement', 'reject_intake', 'assign', 'prepare_stop_notice', 'set_fee', 'digitize_documents'], specialist: ['save_draft', 'submit_review', 'request_supplement'], leader: ['approve', 'send_back', 'decline', 'waive_fee', 'sign_result'], registrar: ['issue', 'deliver'], finance: [] }
  const options = [...(all[status] || [])]
  if (role === 'leader' && status === 'DA_PHE_DUYET' && (!item.approvedAt || !item.approvedById || String(item.draftResult || '').trim().length < 10)) {
    return options.filter(option => option.value !== 'sign_result' && permitted[role]?.includes(option.value))
  }
  if (role === 'intake' && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(status) && !item.fee?.amount) options.push({ value: 'set_fee', label: 'Ghi nhận khoản thu có căn cứ' })
  if (role === 'intake' && item.submissionChannel === 'TRUC_TIEP' && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(status)) options.push({ value: 'digitize_documents', label: 'Bổ sung bản quét tại quầy' })
  if (role === 'leader' && ['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET'].includes(status) && item.fee?.status === 'DUE') options.push({ value: 'waive_fee', label: 'Ghi nhận miễn khoản thu' })
  if (role === 'leader' && status === 'DA_PHE_DUYET' && !user.maySignSandbox) return options.filter(option => option.value !== 'sign_result' && permitted[role]?.includes(option.value))
  if (role === 'registrar' && status === 'DA_PHE_DUYET' && !item.sandboxSignature?.verified) return options.filter(option => option.value !== 'issue' && permitted[role]?.includes(option.value))
  const resume = item.supplement?.resumeStatus
  const eligibleSupplement = status === 'CHO_BO_SUNG' && !!resume && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(resume)
  if (role === 'intake' && !!item.acceptedAt && (['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET', 'DA_PHE_DUYET'].includes(status) || eligibleSupplement)) {
    if (!item.withdrawal?.status && !item.resultIssuedAt && !item.decisionIssuedAt && !item.resultNoticeIssuedAt) {
      options.push({ value: 'prepare_stop_notice', label: 'Tiếp nhận yêu cầu dừng · lập Mẫu 06' })
    }
  }
  return options.filter(option => permitted[role]?.includes(option.value))
}

function StaffAccountManagement({ actor, onNotice }: { actor: User; onNotice: (message: string) => void }) {
  const isSystemAdmin = actor.role === 'admin'
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [requests, setRequests] = useState<StaffAccessRequest[]>([])
  const [changes, setChanges] = useState<StaffAccountChange[]>([])
  const [busy, setBusy] = useState(false)
  const [reviewing, setReviewing] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [proposedActive, setProposedActive] = useState(true)
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [signingAuthorityChecks, setSigningAuthorityChecks] = useState<Record<string, boolean>>({})
  const [today] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  const accessState = (account: ManagedUser) => !account.active ? 'Chưa được duyệt' : account.validFrom && today < account.validFrom ? 'Chờ ngày hiệu lực' : account.validUntil && today > account.validUntil ? 'Hết thời hạn' : 'Đang hiệu lực'
  const agencyOptions = [...new Set(users.map(account => account.agencyScope).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'vi'))
  const managedAgencies = [...new Set(users.filter(account => account.canManageAgencyAccounts).map(account => account.agencyScope).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'vi'))
  const visibleUsers = users.filter(account => agencyFilter === 'all' || account.agencyScope === agencyFilter)

  async function refresh() {
    const result = await api<{ users: ManagedUser[]; accessRequests: StaffAccessRequest[]; accountChanges: StaffAccountChange[] }>('/api/users')
    setUsers(result.users)
    setRequests(result.accessRequests)
    setChanges(result.accountChanges)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const result = await api<{ users: ManagedUser[]; accessRequests: StaffAccessRequest[]; accountChanges: StaffAccountChange[] }>('/api/users')
        if (active) { setUsers(result.users); setRequests(result.accessRequests); setChanges(result.accountChanges) }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Không tải được tài khoản.')
      }
    }
    void load()
    return () => { active = false }
  }, [])

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    if (values.password !== values.confirmPassword) { setError('Mật khẩu khởi tạo và phần xác nhận chưa trùng khớp.'); return }
    const maySignStop = values.maySignStop === 'on'
    if (maySignStop && (values.role !== 'leader' || String(values.signingAuthorityRef || '').trim().length < 3)) { setError('Quyền ký Mẫu 06 chỉ áp dụng cho vai trò lãnh đạo; nhập số văn bản phân công thẩm quyền.'); return }
    setBusy(true); setError('')
    const { confirmPassword: _confirmPassword, ...request } = values
    try {
      await api('/api/users', { ...request, agencyScope: isSystemAdmin ? request.agencyScope : actor.agencyScope, maySignStop, signingAuthorityRef: String(values.signingAuthorityRef || '').trim() })
      form.reset()
      onNotice('Đã lập đề nghị cấp tài khoản. Tài khoản chỉ hoạt động sau khi một quản trị viên khác duyệt.')
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lập đề nghị cấp tài khoản.') } finally { setBusy(false) }
  }

  async function reviewRequest(request: StaffAccessRequest, decision: 'approve' | 'reject') {
    const note = reviewNotes[request.id] || ''
    if (decision === 'reject' && note.trim().length < 12) { setError('Cần ghi căn cứ từ chối từ 12 ký tự trở lên.'); return }
    const authorizeStopSigning = request.maySignStop && signingAuthorityChecks[request.id] === true
    if (decision === 'approve' && request.maySignStop && !authorizeStopSigning) { setError('Đối chiếu văn bản phân công thẩm quyền ký Mẫu 06 trước khi duyệt quyền này.'); return }
    setReviewing(request.id); setError('')
    try {
      await api(`/api/users/access-requests/${encodeURIComponent(request.id)}/review`, { decision, note, authorizeStopSigning })
      onNotice(decision === 'approve' ? `Đã duyệt quyền cho ${request.name}.` : `Đã từ chối đề nghị của ${request.name}.`)
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể xử lý đề nghị.') } finally { setReviewing('') }
  }

  async function revokeStopSigning(account: ManagedUser) {
    const reason = window.prompt(`Ghi căn cứ thu hồi quyền ký Mẫu 06 của ${account.name}:`)
    if (reason === null) return
    if (reason.trim().length < 12) { setError('Căn cứ thu hồi cần ít nhất 12 ký tự.'); return }
    setError(''); setBusy(true)
    try {
      await api(`/api/users/${encodeURIComponent(account.id)}/stop-signature-authority`, { reason })
      onNotice(`Đã thu hồi quyền ký Mẫu 06 của ${account.name}.`)
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể thu hồi quyền ký.') } finally { setBusy(false) }
  }

  function beginAccountChange(account: ManagedUser, active = account.active) {
    setEditing(account)
    setProposedActive(active)
    setError('')
  }

  async function submitAccountChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    setBusy(true); setError('')
    try {
      await api(`/api/users/${encodeURIComponent(editing.id)}/change-requests`, { ...values, active: proposedActive, canManageAgencyAccounts: isSystemAdmin && values.canManageAgencyAccounts === 'on' })
      setEditing(null)
      onNotice(`Đã gửi đề nghị điều chỉnh tài khoản ${editing.name}; cần quản trị viên khác duyệt.`)
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể lập đề nghị điều chỉnh tài khoản.') } finally { setBusy(false) }
  }

  async function reviewAccountChange(change: StaffAccountChange, decision: 'approve' | 'reject') {
    const note = reviewNotes[change.id] || ''
    if (decision === 'reject' && note.trim().length < 12) { setError('Cần ghi căn cứ từ chối từ 12 ký tự trở lên.'); return }
    setReviewing(change.id); setError('')
    try {
      await api(`/api/users/account-changes/${encodeURIComponent(change.id)}/review`, { decision, note })
      onNotice(decision === 'approve' ? `Đã áp dụng thay đổi tài khoản ${change.name}; phiên cũ đã bị thu hồi.` : `Đã từ chối đề nghị thay đổi tài khoản ${change.name}.`)
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể xử lý đề nghị thay đổi.') } finally { setReviewing('') }
  }

  const accessSummary = (value: AccountAccess) => `${roleNames[value.role] || value.role} · ${value.active ? 'Đang kích hoạt' : 'Tạm ngưng'} · ${value.agencyScope} · ${value.validFrom || 'Không giới hạn'} – ${value.validUntil || 'Không giới hạn'}${value.canManageAgencyAccounts ? ' · Có quyền quản lý tài khoản cơ quan' : ''}`

  return <div className="account-workspace">
    <section className="panel account-intro"><div><span className="eyebrow">QUẢN TRỊ QUYỀN CÁN BỘ</span><h2>Cấp và điều chỉnh quyền truy cập</h2><p>{isSystemAdmin ? 'Quản trị hệ thống xem danh sách tài khoản toàn hệ thống; quyền này không cho phép xem hồ sơ công dân.' : `Quản lý cơ quan chỉ lập đề nghị và xem tài khoản thuộc ${actor.agencyScope}; quản trị hệ thống khác phải duyệt.`} Khi thay đổi được duyệt, phiên đăng nhập cũ bị thu hồi.</p>{isSystemAdmin && <p><b>Cơ quan đã giao quyền quản lý tài khoản:</b> {managedAgencies.length ? managedAgencies.join('; ') : 'Chưa có cơ quan nào. Giao quyền qua đề nghị điều chỉnh và cần quản trị viên khác duyệt.'}</p>}</div><span className="count-chip">{requests.filter(r => r.status === 'PENDING').length + changes.filter(r => r.status === 'PENDING').length} chờ duyệt</span></section>
    {error && <div className="form-error" role="alert">{error}</div>}
    <section className="panel"><div className="panel-title"><div><h2>Lập đề nghị cấp tài khoản</h2><p>Cán bộ không tự đăng ký. Quản trị viên hệ thống hoặc người quản lý cơ quan được phân quyền lập đề nghị; tài khoản chỉ hoạt động sau khi quản trị viên hệ thống độc lập duyệt.</p></div></div>
      <form className="form-grid account-form" onSubmit={createRequest}>
        <label>Họ và tên<input name="name" autoComplete="name" maxLength={150} required /></label>
        <label>Email công vụ<input name="email" type="email" autoComplete="off" maxLength={254} required /></label>
        <label>Số điện thoại<input name="phone" type="tel" autoComplete="off" maxLength={40} /></label>
        <label>Vai trò<select name="role" defaultValue="intake" required><option value="intake">Cán bộ tiếp nhận</option><option value="specialist">Chuyên viên thụ lý</option><option value="leader">Lãnh đạo phê duyệt</option><option value="registrar">Văn thư phát hành</option><option value="finance">Tài chính</option></select></label>
        <label className="span-two">Cơ quan / đơn vị được giao<input name="agencyScope" maxLength={180} defaultValue={isSystemAdmin ? '' : actor.agencyScope} readOnly={!isSystemAdmin} placeholder="Nhập đúng tên cơ quan/đơn vị theo danh mục nội bộ" required /></label>
        <label className="span-two check-row"><input name="maySignStop" type="checkbox" /> Đề nghị cấp quyền ký Thông báo dừng Mẫu 06 (chỉ dành cho người có văn bản phân công thẩm quyền)</label>
        <label className="span-two">Số văn bản phân công thẩm quyền ký Mẫu 06<input name="signingAuthorityRef" maxLength={180} placeholder="Chỉ nhập khi đề nghị quyền ký Mẫu 06" /><small className="field-help">Quản trị viên thứ hai phải đối chiếu văn bản này trước khi cấp quyền.</small></label>
        <label>Hiệu lực từ<input name="validFrom" type="date" min={today} defaultValue={today} required /></label>
        <label>Hiệu lực đến<input name="validUntil" type="date" min={today} required /></label>
        <label className="span-two">Căn cứ cấp quyền<textarea name="reason" rows={3} minLength={12} maxLength={1200} placeholder="Số quyết định, phân công nhiệm vụ hoặc căn cứ nghiệp vụ" required /></label>
        <label>Mật khẩu khởi tạo<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><small className="field-help">Tối thiểu 12 ký tự, có chữ hoa, chữ thường và chữ số.</small></label>
        <label>Xác nhận mật khẩu<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <div className="form-actions span-two"><button className="button primary" disabled={busy}>{busy ? 'Đang lập đề nghị…' : 'Gửi người duyệt'}</button></div>
      </form>
    </section>
    <section className="panel"><div className="panel-title"><div><h2>Đề nghị cấp quyền</h2><p>Lưu lịch sử người lập, người duyệt, phạm vi và thời gian áp dụng.</p></div></div>
      {requests.length ? <div className="access-request-list">{requests.map(request => <article className="access-request-card" key={request.id}>
        <div className="access-request-top"><div><b>{request.name}</b><small>{request.email} · {roleNames[request.role] || request.role}</small></div><span className={`request-status request-${request.status.toLowerCase()}`}>{request.status === 'PENDING' ? 'Chờ duyệt' : request.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</span></div>
        <div className="access-request-facts"><span><small>Cơ quan</small><b>{request.agencyScope}</b></span><span><small>Thời hạn</small><b>{request.validFrom} – {request.validUntil}</b></span><span><small>Người đề nghị</small><b>{request.requestedBy}</b></span>{request.reviewedBy && <span><small>Người duyệt</small><b>{request.reviewedBy}</b></span>}</div>
        {request.maySignStop && <p className="request-reason"><b>Đề nghị quyền ký Mẫu 06:</b> {request.signingAuthorityRef}. Quyền chỉ có hiệu lực nếu người duyệt xác nhận đã đối chiếu văn bản phân công.</p>}
        <p className="request-reason"><b>Căn cứ:</b> {request.reason}</p>
        {request.status === 'PENDING' && request.requestedById === actor.id && <p className="form-notice">Bạn đã lập đề nghị này; cần một quản trị viên khác xử lý.</p>}
        {!isSystemAdmin && request.status === 'PENDING' && request.requestedById !== actor.id && <p className="form-notice">Đề nghị đang chờ quản trị viên hệ thống duyệt.</p>}
        {isSystemAdmin && request.status === 'PENDING' && request.requestedById !== actor.id && <div className="request-review">{request.maySignStop && <label className="check-row"><input type="checkbox" checked={signingAuthorityChecks[request.id] === true} onChange={e => setSigningAuthorityChecks(current => ({ ...current, [request.id]: e.target.checked }))} /> Đã đối chiếu văn bản phân công thẩm quyền ký Mẫu 06</label>}<label>Ý kiến duyệt / căn cứ từ chối<textarea value={reviewNotes[request.id] || ''} onChange={e => setReviewNotes(current => ({ ...current, [request.id]: e.target.value }))} rows={2} maxLength={1200} /></label><div className="form-actions"><button className="button secondary" disabled={reviewing === request.id} onClick={() => reviewRequest(request, 'reject')}>Từ chối</button><button className="button primary" disabled={reviewing === request.id} onClick={() => reviewRequest(request, 'approve')}>{reviewing === request.id ? 'Đang xử lý…' : 'Duyệt quyền'}</button></div></div>}
        {request.status === 'REJECTED' && request.reviewNote && <p className="request-reason"><b>Căn cứ từ chối:</b> {request.reviewNote}</p>}
      </article>)}</div> : <div className="empty-state">Chưa có đề nghị cấp quyền.</div>}
    </section>
    <section className="panel"><div className="panel-title"><div><h2>Đề nghị điều chỉnh tài khoản</h2><p>Thay đổi quyền hiện hữu hoặc tạm ngưng tài khoản sẽ có hiệu lực sau khi quản trị viên độc lập duyệt. Đề nghị liên quan tài khoản quản trị cần người thứ ba duyệt.</p></div><span className="count-chip">{changes.filter(change => change.status === 'PENDING').length} chờ xử lý</span></div>
      {changes.length ? <div className="access-request-list">{changes.map(change => <article className="access-request-card" key={change.id}>
        <div className="access-request-top"><div><b>{change.name}</b><small>{change.email}</small></div><span className={`request-status request-${change.status.toLowerCase()}`}>{change.status === 'PENDING' ? 'Chờ duyệt' : change.status === 'APPROVED' ? 'Đã áp dụng' : 'Từ chối'}</span></div>
        <div className="account-change-diff"><span><small>Quyền hiện tại</small><b>{accessSummary(change.before)}</b></span><span><small>Đề nghị mới</small><b>{accessSummary(change.proposed)}</b></span></div>
        <p className="request-reason"><b>Căn cứ:</b> {change.reason} · <b>Người lập:</b> {change.requestedBy}</p>
        {change.status === 'PENDING' && (change.requestedById === actor.id || change.userId === actor.id) && <p className="form-notice">Người lập và chủ tài khoản không được duyệt đề nghị này.</p>}
        {!isSystemAdmin && change.status === 'PENDING' && change.requestedById !== actor.id && change.userId !== actor.id && <p className="form-notice">Đề nghị đang chờ quản trị viên hệ thống duyệt.</p>}
        {isSystemAdmin && change.status === 'PENDING' && change.requestedById !== actor.id && change.userId !== actor.id && <div className="request-review"><label>Ý kiến duyệt / căn cứ từ chối<textarea value={reviewNotes[change.id] || ''} onChange={e => setReviewNotes(current => ({ ...current, [change.id]: e.target.value }))} rows={2} maxLength={1200} /></label><div className="form-actions"><button className="button secondary" disabled={reviewing === change.id} onClick={() => reviewAccountChange(change, 'reject')}>Từ chối</button><button className="button primary" disabled={reviewing === change.id} onClick={() => reviewAccountChange(change, 'approve')}>{reviewing === change.id ? 'Đang xử lý…' : 'Duyệt và áp dụng'}</button></div></div>}
        {change.reviewedBy && <p className="request-reason"><b>Người xử lý:</b> {change.reviewedBy}{change.reviewNote && <> · <b>Ý kiến:</b> {change.reviewNote}</>}</p>}
      </article>)}</div> : <div className="empty-state">Chưa có lịch sử điều chỉnh tài khoản.</div>}
    </section>
    <section className="panel"><div className="panel-title"><div><h2>Tài khoản theo cơ quan</h2><p>Danh sách không chứa mật khẩu; quyền chỉ có hiệu lực sau phê duyệt.</p></div><span className="count-chip">{visibleUsers.length} tài khoản</span></div>
      <div className="account-list-tools">{isSystemAdmin && <label>Cơ quan<select value={agencyFilter} onChange={e => setAgencyFilter(e.target.value)}><option value="all">Tất cả cơ quan</option>{agencyOptions.map(agency => <option key={agency} value={agency}>{agency}</option>)}</select></label>}<a className="button secondary" href={`/api/export/users.csv${agencyFilter !== 'all' ? `?agency=${encodeURIComponent(agencyFilter)}` : ''}`}>Xuất CSV</a><button className="button secondary" onClick={() => printInternalTable('Danh sách tài khoản cán bộ', agencyFilter === 'all' ? 'Tất cả cơ quan trong phạm vi quản trị hệ thống' : agencyFilter, ['Họ tên','Email','Vai trò','Cơ quan','Trạng thái','Hiệu lực','Quản lý tài khoản cơ quan'], visibleUsers.map(account => [account.name,account.email,roleNames[account.role] || account.role,account.agencyScope,!account.active?'Chưa kích hoạt / tạm ngưng':accessState(account),`${account.validFrom || 'Không giới hạn'} – ${account.validUntil || 'Không giới hạn'}`,account.canManageAgencyAccounts?'Có':'Không']))}>In danh sách</button></div>
      {visibleUsers.length ? <div className="managed-user-list">{visibleUsers.map(account => { const state = accessState(account); const pendingChange = changes.some(change => change.userId === account.id && change.status === 'PENDING'); return <article className="managed-user-row" key={account.id}><div><b>{account.name}</b><small>{account.email} · {roleNames[account.role] || account.role}</small>{account.canManageAgencyAccounts && <small>Được quản lý tài khoản tại cơ quan này</small>}{account.mustChangePassword && <small className="account-password-note">Chưa đổi mật khẩu khởi tạo</small>}{account.maySignStop && <small>Được ký Mẫu 06 · {account.signingAuthorityRef}</small>}</div><span className={`request-status ${state === 'Đang hiệu lực' ? 'request-approved' : state === 'Hết thời hạn' || !account.active ? 'request-rejected' : 'request-pending'}`}>{!account.active ? 'Tạm ngưng' : state}</span><span className="managed-user-scope">{account.agencyScope || 'Chưa khai báo phạm vi'}<small>{account.validFrom || 'Không giới hạn'} – {account.validUntil || 'Không giới hạn'}</small></span><div className="managed-user-actions">{isSystemAdmin && account.maySignStop && <button className="button secondary" disabled={busy} onClick={() => revokeStopSigning(account)}>Thu hồi quyền ký</button>}<button className="button secondary" disabled={busy || pendingChange || account.id === actor.id || (!isSystemAdmin && account.role === 'admin')} onClick={() => beginAccountChange(account)}>{pendingChange ? 'Đang chờ duyệt' : 'Điều chỉnh quyền'}</button>{account.active && <button className="button secondary" disabled={busy || pendingChange || account.id === actor.id || (!isSystemAdmin && account.role === 'admin')} onClick={() => beginAccountChange(account, false)}>Đề nghị tạm ngưng</button>}</div>{editing?.id === account.id && <form className="account-change-form" onSubmit={submitAccountChange}><div className="account-change-form-title"><b>Đề nghị thay đổi · {account.name}</b><button type="button" className="text-button" onClick={() => setEditing(null)}>Đóng</button></div><div className="form-grid account-form"><label>Vai trò<select name="role" defaultValue={account.role} required>{Object.entries(roleNames).filter(([role]) => isSystemAdmin || role !== 'admin').map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select></label><label>Cơ quan / phạm vi<input name="agencyScope" defaultValue={account.agencyScope} maxLength={180} required readOnly={!isSystemAdmin} /></label><label>Hiệu lực từ<input name="validFrom" type="date" defaultValue={account.validFrom} /></label><label>Hiệu lực đến<input name="validUntil" type="date" defaultValue={account.validUntil} /></label>{isSystemAdmin && account.role !== 'admin' && <label className="span-two check-row"><input name="canManageAgencyAccounts" type="checkbox" defaultChecked={account.canManageAgencyAccounts} /> Quản lý tài khoản cán bộ trong cơ quan được giao</label>}<label className="span-two check-row"><input type="checkbox" checked={proposedActive} onChange={e => setProposedActive(e.target.checked)} /> Tài khoản được kích hoạt sau khi duyệt</label><label className="span-two">Căn cứ điều chỉnh<textarea name="reason" rows={3} minLength={12} maxLength={1200} placeholder="Quyết định điều động, phân công, chấm dứt nhiệm vụ hoặc căn cứ nghiệp vụ" required /></label><div className="form-actions span-two"><button className="button primary" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi người duyệt'}</button></div></div></form>}</article> })}</div> : <div className="empty-state">Không có tài khoản trong cơ quan hoặc điều kiện lọc này.</div>}
    </section>
  </div>
}

function reportDateDisplay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}
function parseReportDate(value: string): string | null {
  const text = value.trim()
  if (!text) return ''
  const match = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text)
  if (!match) return null
  const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3])
  const dateValue = new Date(Date.UTC(year, month - 1, day))
  if (dateValue.getUTCFullYear() !== year || dateValue.getUTCMonth() !== month - 1 || dateValue.getUTCDate() !== day) return null
  return `${year.toString().padStart(4,'0')}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`
}
function ReportDateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(() => reportDateDisplay(value))
  const [invalid, setInvalid] = useState(false)
  useEffect(() => { setDraft(reportDateDisplay(value)); setInvalid(false) }, [value])
  function update(next: string) {
    setDraft(next); setInvalid(false)
    const parsed = parseReportDate(next)
    if (parsed !== null) onChange(parsed)
  }
  return <label className="report-date-field"><span>{label}</span><input type="text" inputMode="numeric" autoComplete="off" maxLength={10} placeholder="dd/mm/yyyy" value={draft} aria-invalid={invalid} onChange={event => update(event.target.value)} onBlur={() => { const parsed = parseReportDate(draft); setInvalid(parsed === null); if (parsed !== null) onChange(parsed) }} /><small>{invalid ? 'Nhập ngày theo dạng ngày/tháng/năm hợp lệ.' : 'Định dạng ngày/tháng/năm'}</small></label>
}

function AdministrativeReports({ data, onOpenQueue }: { data: Bootstrap; onOpenQueue: (focus: QueueFocus) => void }) {
  type Report = { reportKind: string; officialForm: boolean; agency: string; from: string; to: string; total: number; sampleTotal: number; realTotal: number; storedTotal: number; agencies: string[]; byAgency: {name:string;count:number}[]; byStatus: {name:string;count:number}[]; byProcedure: {name:string;count:number}[]; byAgencyStatus: {agency:string;status:string;count:number}[] }
  const [report, setReport] = useState<Report | null>(null)
  const [agency, setAgency] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const query = new URLSearchParams()
  if (agency) query.set('agency', agency)
  if (from) query.set('from', from)
  if (to) query.set('to', to)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    api<Report>(`/api/reporting/summary${suffix}`).then(value => { if (active) setReport(value) }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không tải được báo cáo.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [suffix])
  const subtitle = `${agency || 'Tất cả cơ quan'} · ${from ? reportDateDisplay(from) : 'Từ đầu dữ liệu'} đến ${to ? reportDateDisplay(to) : 'hiện tại'}`
  return <div className="report-workspace">
    <section className="panel report-boundary"><b>Báo cáo vận hành nội bộ</b><p>Số liệu lấy trực tiếp từ cơ sở dữ liệu cục bộ của ứng dụng. Biểu mẫu này không thay thế báo cáo pháp định và không giả lập Quốc hiệu, tiêu ngữ, tên cơ quan hay chữ ký trên văn bản phát hành chính thức.</p><p>Ứng dụng chưa kết nối Nền tảng báo cáo của Bộ Tư pháp. Biểu mẫu chính thức chưa được xác minh bản gốc và quy cách trình bày nên không được xuất từ đây.</p><div className="report-source-links"><a href="https://kstthc.moj.gov.vn/portal/tin-tuc/chi-tiet/bo-tu-phap-huong-toi-nen-tang-kiem-soat-thu-tuc-hanh-chinh-thong-minh-tjcjp0de4e.html" target="_blank" rel="noreferrer">Thông tin của Bộ Tư pháp ↗</a><a href="https://vbpl.moj.gov.vn/TW/Pages/home.aspx" target="_blank" rel="noreferrer">Cơ sở dữ liệu văn bản pháp luật ↗</a></div></section>
    <section className="panel report-filters"><label className="report-agency-field"><span>Cơ quan</span><select value={agency} onChange={e => setAgency(e.target.value)}><option value="">Tất cả cơ quan</option>{(report?.agencies || []).map(item => <option key={item} value={item}>{item}</option>)}</select></label><ReportDateField label="Từ ngày" value={from} onChange={setFrom} /><ReportDateField label="Đến ngày" value={to} onChange={setTo} /><div className="report-filter-actions"><a className="button secondary" href={`/api/reporting/summary.csv${suffix}`}>Xuất CSV</a>{report && <button className="button secondary" onClick={() => printInternalTable('Báo cáo vận hành hồ sơ theo cơ quan', subtitle, ['Nhóm tổng hợp','Đơn vị / giá trị','Số lượng'], [...report.byAgency.map(row => ['Theo cơ quan',row.name,String(row.count)]),...report.byStatus.map(row => ['Theo trạng thái',row.name,String(row.count)]),...report.byProcedure.map(row => ['Theo thủ tục',row.name,String(row.count)]),...report.byAgencyStatus.map(row => ['Cơ quan và trạng thái',`${row.agency} · ${row.status}`,String(row.count)])])}>In báo cáo nội bộ</button>}</div></section>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading && <section className="panel"><p>Đang tổng hợp dữ liệu…</p></section>}
    {report && !loading && <>
      <aside className="report-data-provenance" role="note"><b>Số liệu trong ứng dụng</b><span>{report.sampleTotal.toLocaleString('vi-VN')} tình huống mô phỏng · {report.realTotal.toLocaleString('vi-VN')} hồ sơ phát sinh thật trong ứng dụng. Tình huống mô phỏng không phải số liệu báo cáo chính thức.</span></aside>
      <section className="metric-grid report-metrics"><MetricCard label="Hồ sơ trong phạm vi" value={report.total} note="Gồm tình huống mô phỏng và dữ liệu ứng dụng" tone="navy" /><MetricCard label="Cơ quan có hồ sơ" value={report.byAgency.length} note="Theo cơ quan tiếp nhận lưu trên hồ sơ" tone="blue" /><MetricCard label="Nhóm trạng thái" value={report.byStatus.length} note="Theo trạng thái hiện tại" tone="green" /></section>
      {report.total===0&&<section className="report-empty-state"><h2>{report.storedTotal===0?'Chưa có hồ sơ nào được lưu trong ứng dụng':'Không có hồ sơ khớp điều kiện lọc'}</h2><p>{report.storedTotal===0?'Kết nối API và cơ sở dữ liệu đang hoạt động; hiện chưa có công dân gửi hồ sơ vào ứng dụng. Danh mục tham chiếu được nạp riêng và không được tính thành hồ sơ.':'Hồ sơ có trong cơ sở dữ liệu nhưng không thuộc cơ quan hoặc khoảng ngày đang chọn.'}</p>{report.storedTotal===0&&<a className="button secondary" href="/nop-ho-so">Mở luồng nộp hồ sơ của ứng dụng</a>}</section>}
      <section className="panel report-table-panel"><PanelHeading kicker="TỔNG HỢP THEO ĐƠN VỊ" title="Hồ sơ theo cơ quan và trạng thái" description={`${subtitle} · chọn một dòng để mở đúng nhóm hồ sơ.`} />{report.byAgencyStatus.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Cơ quan tiếp nhận</th><th>Trạng thái hiện tại</th><th>Số hồ sơ</th><th>Thao tác</th></tr></thead><tbody>{report.byAgencyStatus.map(row => { const statuses = Object.entries(data.statusLabels).filter(([, label]) => label === row.status).map(([code]) => code); return <tr key={`${row.agency}-${row.status}`}><td>{row.agency}</td><td>{row.status}</td><td>{row.count}</td><td><button className="report-drilldown-link" onClick={() => onOpenQueue({ agencyFilter: row.agency, statuses, createdFrom: from, createdTo: to, label: `${row.agency} · ${row.status}` })}>Mở hồ sơ →</button></td></tr> })}</tbody></table></div> : <div className="report-compact-empty">Chưa có dòng tổng hợp theo cơ quan và trạng thái trong điều kiện đã chọn.</div>}</section>
      <section className="panel report-table-panel"><PanelHeading kicker="THEO THỦ TỤC" title="Phân bố hồ sơ theo thủ tục" description="Chọn một dòng để mở danh sách hồ sơ tương ứng." />{report.byProcedure.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Mã và tên thủ tục</th><th>Số hồ sơ</th><th>Thao tác</th></tr></thead><tbody>{report.byProcedure.map(row => { const code = row.name.split(' · ')[0]; return <tr key={row.name}><td>{row.name}</td><td>{row.count}</td><td><button className="report-drilldown-link" onClick={() => onOpenQueue({ procedureCode: code, createdFrom: from, createdTo: to, label: row.name })}>Mở hồ sơ →</button></td></tr> })}</tbody></table></div> : <div className="report-compact-empty">Chưa có hồ sơ để phân bổ theo thủ tục.</div>}</section>
    </>}
  </div>
}

function NewsManagement({ onNotice }: { onNotice: (message: string) => void }) {
  const categories = ['Hoạt động của Trung tâm', 'Hành chính xung kích', 'Cải cách hành chính', 'Chuyển đổi số', 'Tiện ích công dân']
  const images = ['news-birth.jpg', 'news-security.jpg', 'news-support.jpg', 'news-evening.jpg', 'news-technology.jpg', 'news-education.jpg', 'news-receipt.png', 'news-copy.jpg']
  const [articles, setArticles] = useState<ManagedNews[]>([])
  const [history, setHistory] = useState<{id:number;news_id:string;actor_name:string;action:string;created_at:string}[]>([])
  const [editing, setEditing] = useState<ManagedNews | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function refresh() {
    const result = await api<{articles:ManagedNews[];history:{id:number;news_id:string;actor_name:string;action:string;created_at:string}[]}>('/api/news')
    setArticles(result.articles); setHistory(result.history)
  }
  useEffect(() => {
    let active = true
    api<{articles:ManagedNews[];history:{id:number;news_id:string;actor_name:string;action:string;created_at:string}[]}>('/api/news')
      .then(result => { if (active) { setArticles(result.articles); setHistory(result.history) } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Không tải được tin.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  function newArticle() { setEditing({id:'',title:'',summary:'',body:'',category:categories[0],image:'',sourceUrl:'',featured:false,status:'DRAFT',publishedAt:'',version:0,updatedAt:''}); setError('') }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form=event.currentTarget; const data=new FormData(form); const action=(event.nativeEvent as SubmitEvent).submitter instanceof HTMLButtonElement ? (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') || 'save' : 'save'
    const articleId=String(data.get('id')||'')
    const payload={action,id:articleId||undefined,expectedVersion:articleId?Number(data.get('version')):undefined,title:data.get('title'),summary:data.get('summary'),body:data.get('body'),category:data.get('category'),image:data.get('image'),sourceUrl:data.get('sourceUrl'),featured:data.get('featured')==='on'}
    setBusy(true); setError('')
    try { const result=await api<{article:ManagedNews}>('/api/news',payload); await refresh(); setEditing(result.article); onNotice(result.article.status==='PUBLISHED'?'Tin đã được xuất bản/cập nhật trên trang chủ.':'Bản nháp đã được lưu.') }
    catch(e){setError(e instanceof Error?e.message:'Không lưu được tin.')} finally{setBusy(false)}
  }
  async function changeStatus(article:ManagedNews,action:'archive'|'draft') {
    if(action==='archive'&&!window.confirm(`Lưu trữ tin “${article.title}”? Tin sẽ không còn hiển thị công khai.`))return
    setBusy(true);setError('')
    try{const result=await api<{article:ManagedNews}>('/api/news',{action,id:article.id,expectedVersion:article.version});await refresh();setEditing(result.article);onNotice(action==='archive'?'Đã lưu trữ tin.':'Đã chuyển tin về bản nháp.')}
    catch(e){setError(e instanceof Error?e.message:'Không cập nhật được trạng thái tin.')}finally{setBusy(false)}
  }
  const shown=articles.filter(item=>(filter==='ALL'||item.status===filter)&&`${item.title} ${item.summary} ${item.category}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))
  const stats={total:articles.length,draft:articles.filter(a=>a.status==='DRAFT').length,published:articles.filter(a=>a.status==='PUBLISHED').length,archived:articles.filter(a=>a.status==='ARCHIVED').length}
  return <div className="news-management">
    <div className="news-management-toolbar"><div><p>Chỉ quản trị viên hệ thống được xuất bản nội dung. Tin nháp và tin lưu trữ không hiển thị ở cổng công dân.</p></div><button className="button primary" onClick={newArticle}>＋ Soạn tin mới</button></div>
    <div className="news-management-stats"><div><b>{stats.total}</b><span>Tổng số tin</span></div><div><b>{stats.draft}</b><span>Bản nháp</span></div><div><b>{stats.published}</b><span>Đang công khai</span></div><div><b>{stats.archived}</b><span>Đã lưu trữ</span></div></div>
    {error&&<div className="form-error" role="alert">{error}</div>}
    <div className="news-management-layout"><section className="news-list-panel"><div className="news-list-controls"><label>Tìm tin<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tiêu đề, tóm tắt, chuyên mục" /></label><label>Trạng thái<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">Tất cả</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đang công khai</option><option value="ARCHIVED">Đã lưu trữ</option></select></label></div>{loading?<p role="status">Đang tải danh sách tin…</p>:shown.length?<div className="managed-news-list">{shown.map(article=><article className={`managed-news-row${editing?.id===article.id?' active':''}`} key={article.id}><button className="managed-news-select" onClick={()=>{setEditing(article);setError('')}}><span className={`news-status news-status-${article.status.toLowerCase()}`}>{article.status==='PUBLISHED'?'Đang công khai':article.status==='DRAFT'?'Bản nháp':'Đã lưu trữ'}</span><b>{article.title}</b><small>{article.category} · {article.date||toDate(article.updatedAt)}</small></button><div className="managed-news-actions">{article.status==='PUBLISHED'?<button className="text-button" disabled={busy} onClick={()=>void changeStatus(article,'archive')}>Lưu trữ</button>:article.status==='ARCHIVED'?<button className="text-button" disabled={busy} onClick={()=>void changeStatus(article,'draft')}>Khôi phục nháp</button>:null}</div></article>)}</div>:<div className="empty-state">Không có tin phù hợp.</div>}</section>
      <section className="news-editor-panel">{editing?<><div className="news-editor-heading"><div><span className="eyebrow">{editing.id?'BIÊN TẬP NỘI DUNG':'NỘI DUNG MỚI'}</span><h2>{editing.id?'Sửa tin tức':'Soạn tin mới'}</h2></div>{editing.id&&<span className={`news-status news-status-${editing.status.toLowerCase()}`}>{editing.status==='PUBLISHED'?'Đang công khai':editing.status==='DRAFT'?'Bản nháp':'Đã lưu trữ'}</span>}</div><form className="news-editor-form" onSubmit={submit} key={`${editing.id}:${editing.version}`}><input type="hidden" name="id" value={editing.id}/><input type="hidden" name="version" value={editing.version}/><label><span>Tiêu đề <b className="required-mark">*</b></span><input name="title" defaultValue={editing.title} required minLength={8} maxLength={180}/></label><label><span>Tóm tắt <b className="required-mark">*</b></span><textarea name="summary" defaultValue={editing.summary} rows={2} required minLength={20} maxLength={500}/></label><label><span>Nội dung <b className="required-mark">*</b></span><textarea name="body" defaultValue={editing.body} rows={8} required minLength={30} maxLength={20000} placeholder="Mỗi đoạn cách nhau bằng một dòng trống."/><small>Văn bản thuần, tối đa 20.000 ký tự. Không dán mã HTML.</small></label><div className="news-editor-grid"><label>Chuyên mục<select name="category" defaultValue={editing.category}>{categories.map(value=><option key={value}>{value}</option>)}</select></label><label>Ảnh đại diện<select name="image" defaultValue={editing.image}><option value="">Không dùng ảnh</option>{images.map(value=><option key={value} value={value}>{value}</option>)}</select></label></div><label>Nguồn tin chính thức<input name="sourceUrl" type="url" defaultValue={editing.sourceUrl} maxLength={600} placeholder="https://…gov.vn/…"/><small>Chỉ chấp nhận địa chỉ HTTPS thuộc miền .gov.vn.</small></label><label className="news-featured-check"><input type="checkbox" name="featured" defaultChecked={editing.featured}/> Đưa lên vị trí tin nổi bật</label><div className="news-editor-actions"><button className="button secondary" type="submit" value="save" disabled={busy}>{busy?'Đang lưu…':'Lưu bản nháp'}</button><button className="button primary" type="submit" value="publish" disabled={busy}>{editing.status==='PUBLISHED'?'Lưu và cập nhật công khai':'Xuất bản tin'}</button></div>{editing.id&&<small>Phiên bản {editing.version} · Cập nhật {toDate(editing.updatedAt)}</small>}</form></>:<div className="news-editor-empty"><span aria-hidden="true">▤</span><h2>Chọn tin để biên tập</h2><p>Chọn “Soạn tin mới” ở đầu trang để tạo bài viết. Bản nháp chỉ hiển thị trong khu quản trị.</p></div>}</section></div>
    <section className="news-audit-panel"><h2>Lịch sử biên tập gần đây</h2>{history.length?<div>{history.slice(0,8).map(item=><p key={item.id}><b>{item.actor_name}</b> · {item.action==='PUBLISH'?'xuất bản':item.action==='ARCHIVE'?'lưu trữ':item.action==='DRAFT'?'chuyển về bản nháp':item.action==='CREATE_DRAFT'?'tạo bản nháp':'cập nhật'} · {articles.find(article=>article.id===item.news_id)?.title||'Tin đã lưu trữ'} <time>{toDate(item.created_at)}</time></p>)}</div>:<p>Chưa có thao tác biên tập.</p>}</section>
  </div>
}

function AdminOverview({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [accounts, setAccounts] = useState<ManagedUser[]>([])
  const [requests, setRequests] = useState<StaffAccessRequest[]>([])
  const [changes, setChanges] = useState<StaffAccountChange[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [today] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  const expiryLimit = useMemo(() => { const date = new Date(`${today}T00:00:00+07:00`); date.setUTCDate(date.getUTCDate() + 30); return date.toISOString().slice(0, 10) }, [today])

  useEffect(() => {
    let active = true
    api<{ users: ManagedUser[]; accessRequests: StaffAccessRequest[]; accountChanges: StaffAccountChange[] }>('/api/users')
      .then(result => { if (active) { setAccounts(result.users); setRequests(result.accessRequests); setChanges(result.accountChanges) } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Không tải được số liệu quản trị.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const validNow = (account: ManagedUser) => account.active && (!account.validFrom || account.validFrom <= today) && (!account.validUntil || account.validUntil >= today)
  const activeAccounts = accounts.filter(validNow)
  const expiring = accounts.filter(account => validNow(account) && account.validUntil && account.validUntil >= today && account.validUntil <= expiryLimit)
  const pending = [...requests.filter(item => item.status === 'PENDING').map(item => ({ id: item.id, name: item.name, detail: `${roleNames[item.role] || item.role} · ${item.agencyScope}`, at: item.createdAt, kind: 'Cấp tài khoản' })), ...changes.filter(item => item.status === 'PENDING').map(item => ({ id: item.id, name: item.name, detail: item.reason, at: item.createdAt, kind: 'Điều chỉnh quyền' }))].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  const roleBreakdown = Object.entries(roleNames).filter(([role]) => role !== 'citizen').map(([role, label]) => ({ role, label, count: accounts.filter(account => account.role === role).length })).filter(item => item.count > 0)
  const recent = [...requests.map(item => ({ id: item.id, name: item.name, detail: `${item.status === 'PENDING' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'} · cấp ${roleNames[item.role] || item.role}`, at: item.reviewedAt || item.createdAt })), ...changes.map(item => ({ id: item.id, name: item.name, detail: `${item.status === 'PENDING' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã áp dụng' : 'Từ chối'} · điều chỉnh tài khoản`, at: item.reviewedAt || item.createdAt }))].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 6)

  return <div className="admin-overview">
    {error && <div className="form-error" role="alert">{error}</div>}
    <section className="metric-grid" aria-label="Chỉ số quản trị">
      <MetricCard label="Tài khoản cán bộ" value={accounts.length} note="Tài khoản được cấp trong hệ thống" tone="navy" onClick={() => onNavigate('users')} />
      <MetricCard label="Đang có hiệu lực" value={activeAccounts.length} note="Đã kích hoạt và còn thời hạn" tone="blue" onClick={() => onNavigate('users')} />
      <MetricCard label="Sắp hết hạn" value={expiring.length} note="Trong 30 ngày tới" tone="amber" onClick={() => onNavigate('users')} />
      <MetricCard label="Chờ phê duyệt" value={pending.length} note="Cấp mới hoặc thay đổi quyền" tone="red" onClick={() => onNavigate('users')} />
    </section>
    {loading && <div className="panel empty-state" role="status">Đang tải danh sách tài khoản và lịch sử phê duyệt…</div>}
    <div className="dashboard-columns admin-overview-grid">
      <section className="panel dashboard-panel">
        <PanelHeading kicker="PHÂN QUYỀN" title="Tài khoản theo vai trò" description="Số liệu đọc từ danh sách cán bộ đang được cấp trong hệ thống." action={<button className="text-button" onClick={() => onNavigate('users')}>Mở quản lý tài khoản →</button>} />
        {roleBreakdown.length ? <div className="admin-role-list">{roleBreakdown.map(item => <div key={item.role}><span>{item.label}</span><b>{item.count}</b><button className="text-button" onClick={() => onNavigate('users')}>Xem tài khoản</button></div>)}</div> : !loading && <div className="empty-state compact-empty">Chưa có tài khoản cán bộ. Quản trị viên có thể lập đề nghị cấp tài khoản tại mục Tài khoản cán bộ.</div>}
      </section>
      <section className="panel dashboard-panel">
        <PanelHeading kicker="CẦN XỬ LÝ" title="Đề nghị chờ duyệt" description="Đề nghị chỉ có hiệu lực sau khi người có thẩm quyền độc lập xử lý." action={<button className="text-button" onClick={() => onNavigate('users')}>Mở hàng chờ →</button>} />
        {pending.length ? <div className="admin-review-list">{pending.slice(0, 6).map(item => <div key={`${item.kind}-${item.id}`}><span><b>{item.name}</b><small>{item.kind} · {item.detail}</small></span><time>{toDate(item.at)}</time></div>)}</div> : !loading && <div className="empty-state compact-empty">Không có đề nghị cấp mới hoặc điều chỉnh quyền đang chờ.</div>}
      </section>
    </div>
    <div className="dashboard-columns admin-overview-grid">
      <section className="panel dashboard-panel">
        <PanelHeading kicker="THỜI HẠN TRUY CẬP" title="Tài khoản sắp hết hạn" description="Kiểm tra căn cứ điều động hoặc lập đề nghị gia hạn trước khi quyền truy cập kết thúc." action={<button className="text-button" onClick={() => onNavigate('users')}>Quản lý thời hạn →</button>} />
        {expiring.length ? <div className="admin-expiry-list">{expiring.map(account => <div key={account.id}><span><b>{account.name}</b><small>{account.email} · {account.agencyScope}</small></span><time>Hết hạn {toDate(account.validUntil)}</time></div>)}</div> : !loading && <div className="empty-state compact-empty">Không có tài khoản còn hiệu lực sẽ hết hạn trong 30 ngày tới.</div>}
      </section>
      <section className="panel dashboard-panel">
        <PanelHeading kicker="LỊCH SỬ QUYỀN" title="Cấp và điều chỉnh gần đây" description="Lần theo người lập, trạng thái và thời điểm cập nhật quyền." action={<button className="text-button" onClick={() => onNavigate('users')}>Mở toàn bộ lịch sử →</button>} />
        {recent.length ? <div className="admin-review-list">{recent.map(item => <div key={item.id}><span><b>{item.name}</b><small>{item.detail}</small></span><time>{toDate(item.at)}</time></div>)}</div> : !loading && <div className="empty-state compact-empty">Chưa có lịch sử cấp hoặc điều chỉnh tài khoản.</div>}
      </section>
    </div>
  </div>
}

function GuideContent({ isStaff = false }: { isStaff?: boolean }) {
  const [audience, setAudience] = useState<'citizen' | 'staff'>(() => isStaff || new URLSearchParams(location.search).get('role') === 'staff' ? 'staff' : 'citizen')
  return <div className="guide-content">
    <section className="guide-switch" aria-label="Chọn hướng dẫn">
      <button className={audience === 'citizen' ? 'active' : ''} aria-pressed={audience === 'citizen'} onClick={() => setAudience('citizen')}>Người dân, tổ chức</button>
      <button className={audience === 'staff' ? 'active' : ''} aria-pressed={audience === 'staff'} onClick={() => setAudience('staff')}>Cán bộ</button>
    </section>
    {audience === 'citizen' ? <>
      <section className="guide-lead"><span className="eyebrow">HƯỚNG DẪN NGƯỜI DÂN VÀ TỔ CHỨC</span><h2>Tra cứu, gửi và theo dõi hồ sơ</h2><p>Người dân không cần đăng ký tài khoản. Mã hồ sơ cùng khóa tra cứu được dùng để trở lại hồ sơ và phản hồi các yêu cầu của cơ quan.</p><div className="guide-links"><a className="button secondary" href="/thu-tuc">Tra cứu danh mục thủ tục →</a><a className="button primary" href="/nop-ho-so">Mở trang nộp hồ sơ →</a></div></section>
      <ol className="guide-steps">
        <li><b>Tìm và xem thông tin thủ tục</b><p>Mở “Danh mục thủ tục”, lọc theo tên, mã hoặc lĩnh vực rồi chọn một kết quả. Trang chi tiết cho biết dữ liệu tham chiếu, cơ quan trong danh mục, mốc đối chiếu nếu có và đường dẫn nguồn. Chọn “Lập hồ sơ theo thủ tục này” để chuyển sang biểu mẫu trong ứng dụng.</p></li>
        <li><b>Chọn thủ tục, cơ quan và khai tờ khai</b><p>Trang nộp có 5 bước. Ở bước 1, xác nhận thủ tục và cơ quan Hà Nội; bước 2 khai cá nhân hoặc tổ chức cùng thông tin liên hệ; bước 3 điền tờ khai riêng của thủ tục. Lựa chọn đối tượng sẽ thay đổi trường và giấy tờ bắt buộc. Thủ tục chưa có biểu mẫu được cấu hình chỉ xem được thông tin.</p></li>
        <li><b>Đính kèm giấy tờ, kiểm tra và gửi</b><p>Bước 4: tải giấy tờ theo từng thành phần, tối đa 8 tệp, mỗi tệp 8 MB và tổng 9 MB. Bước 5: đọc lại tờ khai, chọn cách nhận kết quả, xác nhận rồi bấm “Xác nhận và gửi hồ sơ”. Có thể quay lại sửa các bước. Nếu cơ quan chưa có tài khoản tiếp nhận còn hiệu lực, ứng dụng giữ việc lập hồ sơ ở bước chuẩn bị và chưa nhận hồ sơ.</p></li>
        <li><b>Lưu mã hồ sơ và nhận khóa tra cứu</b><p>Trang xác nhận hiển thị mã hồ sơ. Cán bộ tiếp nhận hoặc trả kết quả xem khóa trong chi tiết hồ sơ và cung cấp cho đúng chủ hồ sơ sau khi xác minh. Chưa có SMS/email tự động. Nếu khóa bị lộ, liên hệ cơ quan để cấp lại; khóa cũ sẽ hết hiệu lực.</p></li>
        <li><b>Theo dõi và bổ sung</b><p>Mở “Tra cứu hồ sơ”, nhập đúng mã và khóa để xem trạng thái, hạn (nếu đã xác định), tiến độ từng khâu, lịch sử xử lý và yêu cầu bổ sung. “Đã gửi” chưa có nghĩa “đã tiếp nhận”. Các khâu chưa có sự kiện thực hiện không được đánh dấu hoàn tất. Khi hồ sơ chờ bổ sung, gửi giải trình/tài liệu ngay trong trang tra cứu.</p></li>
        <li><b>Đánh giá sau khi kết thúc</b><p>Với hồ sơ đã kết thúc, người nộp có thể gửi một đánh giá. Nội dung đánh giá được lưu cùng hồ sơ và không làm thay đổi quyết định xử lý.</p></li>
      </ol>
      <section className="guide-note"><b>Phạm vi đang vận hành</b><p>Hồ sơ và lịch sử trong trang này được lưu ở cơ sở dữ liệu của ứng dụng. Nếu cán bộ đã cấu hình khoản thu, bạn có thể tạo và xác nhận giao dịch thử nghiệm ngay trong trang tra cứu; trạng thái chỉ có giá trị trong ứng dụng, không chuyển tiền. Ứng dụng chưa kết nối VNeID, Cổng quốc gia, ngân hàng hoặc nhà cung cấp chữ ký số và không phát hành kết quả hành chính chính thức.</p></section>
    </> : <>
      <section className="guide-lead"><span className="eyebrow">HƯỚNG DẪN CÁN BỘ</span><h2>Làm việc theo quyền được cấp</h2><p>Bàn cán bộ có các màn hình tổng quan, hộp xử lý, giám sát, danh mục thủ tục, nhật ký và kết nối. Hồ sơ và thao tác chỉ hiện theo vai trò, cơ quan, trạng thái và dữ liệu đã có trong cơ sở dữ liệu.</p>{!isStaff && <a className="button primary" href="/staff">Đăng nhập bàn cán bộ</a>}</section>
      <section className="guide-note"><b>Khởi tạo tài khoản lần đầu</b><p>Người vận hành chạy <code>python app.py create-admin</code> trong thư mục ứng dụng để tạo quản trị viên đầu tiên; chạy lệnh thêm lần nữa để có quản trị viên thứ hai duyệt độc lập. Sau đó, quản trị viên đăng nhập bàn cán bộ, lập đề nghị cấp tài khoản tiếp nhận theo đúng cơ quan và chờ quản trị viên còn lại phê duyệt. Không có đăng ký cán bộ công khai và không dùng tài khoản mẫu.</p></section>
      <ol className="guide-steps">
        <li><b>Đăng nhập và kiểm tra phạm vi</b><p>Dùng tài khoản nội bộ đã được cấp. Tên vai trò và cơ quan ở đầu bàn làm việc cho biết phạm vi đang áp dụng; tài khoản hết hạn hoặc bị thu hồi sẽ không truy cập được. Mật khẩu hiện có được giữ nguyên; chỉ đổi trong phần “Tài khoản cá nhân” khi chủ tài khoản chủ động cần đổi.</p></li>
        <li><b>Quản lý tài khoản cá nhân và đăng xuất</b><p>Nhấp tên của bạn ở góc trên bên phải để xem vai trò, cơ quan, thời hạn và căn cứ cấp quyền. Trong “Tài khoản cá nhân”, bạn có thể đổi điện thoại bằng mật khẩu hiện tại, đổi mật khẩu hoặc kết thúc các phiên đăng nhập khác. Hệ thống ghi rõ email chưa được xác minh qua mã hoặc liên kết. Nút “Đăng xuất” nằm ở cuối thanh bên; trên điện thoại, mở “Danh mục” để dùng nút này.</p></li>
         <li><b>Dùng Tổng quan để chọn việc cần làm</b><p>Các ô chỉ số mở danh sách đã lọc theo việc cần xử lý, hạn gần đến hoặc quá hạn. Nhấp từng giai đoạn trong “Luồng hồ sơ” để mở đúng nhóm trạng thái; nhấp tên người phụ trách để lọc hồ sơ của người đó. Từ “Hồ sơ cần chú ý”, mở thẳng hồ sơ để xem căn cứ, lịch sử và bước được phép làm tiếp.</p></li>
        <li><b>Lọc Hộp xử lý và mở hồ sơ</b><p>Trong “Hộp xử lý”, tìm theo thông tin hồ sơ, lọc trạng thái, hạn hoặc người phụ trách rồi mở một dòng để xem chi tiết. Nếu danh sách trống, hiện chưa có hồ sơ thuộc phạm vi tài khoản được nạp; ứng dụng không tự tạo hồ sơ mẫu.</p></li>
        <li><b>Thực hiện thao tác khả dụng</b><p>Ở chi tiết hồ sơ, chọn một thao tác trong danh sách được phép ở trạng thái hiện tại. Tùy thao tác, nhập căn cứ, dự thảo, người được phân công hoặc đính kèm tài liệu; kiểm tra lại nội dung rồi xác nhận. Máy chủ kiểm tra quyền và điều kiện trạng thái, sau đó cập nhật hồ sơ và nhật ký.</p></li>
        <li><b>Giám sát, tra cứu và truy vết</b><p>“Giám sát quy trình” tổng hợp hạn, tồn đọng, tải việc và các thông tin vận hành có sẵn. “Danh mục thủ tục” tìm theo mã, tên, lĩnh vực, cơ quan và cấp thực hiện; xem nguồn cùng trạng thái xác minh trước khi dùng. “Nhật ký hồ sơ” lần theo mốc thời gian, người thao tác và nội dung sự kiện.</p></li>
        <li><b>Cung cấp mã và khóa tra cứu</b><p>Cán bộ tiếp nhận hoặc trả kết quả mở hồ sơ trong phạm vi cơ quan, chọn “Xem khóa tra cứu”, rồi sao chép mã và khóa để cung cấp cho chủ hồ sơ sau khi xác minh. “Ẩn khóa” đóng nội dung đang xem. Nếu cần cấp lại, chọn “Cấp lại khóa” và xác nhận; khóa cũ mất hiệu lực. Các lần xem và cấp lại được ghi nhật ký nội bộ.</p></li>
        <li><b>Quản lý tài khoản theo cơ quan nếu được giao</b><p>Quản trị viên hệ thống có thể đề nghị giao quyền này cho một cán bộ không giữ vai trò quản trị hệ thống. Sau khi quản trị viên khác duyệt, người được giao mở “Tài khoản tại cơ quan”; danh sách và thao tác chỉ giới hạn ở đúng cơ quan của mình. Người quản lý cơ quan có thể lập đề nghị cấp mới, thay đổi hoặc tạm ngưng tài khoản, nhưng không tự duyệt, không chuyển tài khoản sang cơ quan khác và không quản lý tài khoản quản trị hệ thống. Quản trị viên hệ thống duyệt độc lập; quyết định và căn cứ được ghi nhật ký.</p></li>
        <li><b>In và xuất danh sách theo phạm vi</b><p>Trong “Tài khoản cán bộ” hoặc “Tài khoản tại cơ quan”, chọn cơ quan rồi dùng “In danh sách” để in bảng nội bộ hoặc “Xuất CSV” để lưu dữ liệu. Tệp tài khoản không chứa mật khẩu. Trong “Hộp xử lý”, cán bộ chỉ in/xuất các hồ sơ đã được máy chủ trả về trong phạm vi tài khoản; không gửi tệp ra ngoài nếu chưa có căn cứ công vụ.</p></li>
         <li><b>Xem báo cáo vận hành</b><p>Quản trị viên hệ thống mở “Báo cáo vận hành”, lọc theo cơ quan và thời gian, xem tổng hợp theo trạng thái/thủ tục, rồi in hoặc xuất CSV. Chọn “Mở hồ sơ” ở một dòng tổng hợp để xem đúng danh sách chi tiết với cùng điều kiện cơ quan và kỳ báo cáo. Báo cáo này chỉ thống kê dữ liệu đang có trong ứng dụng. Nó không phải biểu mẫu báo cáo pháp định, không có Quốc hiệu, tiêu ngữ, chữ ký hay tên cơ quan phát hành. Chỉ dùng mẫu nhà nước khi đã có bản gốc chính thức, đúng phiên bản và căn cứ áp dụng.</p></li>
        <li><b>Biên tập tin trên cổng nếu là quản trị viên</b><p>Mở “Tin tức cổng thông tin” để tìm/lọc bài, soạn bản nháp, sửa tiêu đề, tóm tắt và nội dung, chọn chuyên mục/ảnh, điền nguồn chính thức, rồi lưu nháp hoặc xuất bản. Chỉ bài đã xuất bản hiện ở trang chủ. Tin đang công khai có thể lưu trữ; tin lưu trữ khôi phục về bản nháp và cần xuất bản lại. Kiểm tra thông tin nguồn trước khi công khai; hệ thống chưa tự đồng bộ bài từ trang Trung tâm.</p></li>
        <li><b>Cấu hình và đối soát khoản thu thử nghiệm</b><p>Cán bộ tiếp nhận mở hồ sơ đang tiếp nhận/giải quyết, chọn “Ghi nhận khoản thu có căn cứ”, nhập số tiền và căn cứ/nguồn đã được kiểm tra. Người nộp dùng mã hồ sơ và khóa tra cứu để tạo rồi xác nhận giao dịch thử nghiệm. Cán bộ tài chính cùng phạm vi mở “Kết nối dịch vụ”, đối chiếu mã giao dịch và chọn “Đối soát nội bộ”. Trạng thái sandbox không chứng minh tiền đã vào Kho bạc/ngân hàng; chỉ cấu hình khoản thu theo căn cứ đã được cơ quan xác nhận.</p></li>
        <li><b>Cấp quyền ký và ký bản kết quả thử nghiệm</b><p>Quản trị viên mở “Kết nối dịch vụ”, chọn một tài khoản lãnh đạo còn hiệu lực, ghi số văn bản căn cứ và lý do để cấp quyền ký thử nghiệm. Một lãnh đạo khác với người phê duyệt mở hồ sơ đã duyệt và chọn “Ký thử nghiệm kết quả”. Ứng dụng ký Ed25519 lên nội dung đã duyệt và kiểm tra lại mã băm/chữ ký khi xem; đây là chữ ký mật mã cục bộ, không phải chứng thư số hoặc chữ ký công vụ.</p></li>
        <li><b>Phát hành và ghi nhận trả trong môi trường cục bộ</b><p>Văn thư chỉ thấy “Phát hành kết quả thử nghiệm” khi hồ sơ đã duyệt, chữ ký nội bộ hợp lệ và khoản thu (nếu cấu hình) đã đối soát/miễn. Nhập số kết quả nội bộ; sau đó ghi người nhận, kênh và chứng cứ giao để hoàn tất. Không dùng số và văn bản này làm quyết định thật hoặc gửi ra ngoài ứng dụng.</p></li>
        <li><b>Theo dõi giao dịch và đề nghị hoàn</b><p>Cán bộ tài chính chỉ xem hồ sơ trong phạm vi cơ quan. Khi hồ sơ đã dừng/từ chối/không giải quyết hoặc có Thông báo dừng đã phát hành, tài khoản tài chính lập đề nghị hoàn từ giao dịch đã đối soát; một cán bộ tài chính khác phải duyệt hoặc từ chối. Các thao tác chỉ ghi sổ sandbox, không gọi ngân hàng và không chuyển tiền thật.</p></li>
        <li><b>Ghi nhận yêu cầu dừng theo Mẫu 05/06</b><p>Chỉ dùng khi nhận được yêu cầu thuộc trường hợp áp dụng. Đối chiếu danh tính và căn cứ đại diện, ghi kênh tiếp nhận, lưu văn bản Mẫu 05; người có thẩm quyền ký phải tải lên bản Mẫu 06 đã ký và xác nhận thông tin phát hành. Ứng dụng lưu chứng cứ, không tự tạo chữ ký số.</p></li>
      </ol>
      <section className="guide-note"><b>Phạm vi hiện tại</b><p>Hướng dẫn áp dụng cho chính ứng dụng đang mở. Tài khoản, quyền, hồ sơ, khoản thu thử nghiệm, chữ ký mật mã thử nghiệm, đối soát và đề nghị hoàn được xử lý trong cơ sở dữ liệu cục bộ. Chưa có kết nối VNeID, Cổng Dịch vụ công quốc gia, ngân hàng, chứng thư số công vụ hoặc hệ thống tác nghiệp thật; không coi kết quả sandbox là giao dịch hay văn bản có giá trị pháp lý.</p></section>
    </>}
  </div>
}

function StandaloneGuide({ signedIn, onHome, onStaff }: { signedIn: boolean; onHome: () => void; onStaff: () => void }) {
  return <div className="public-site guide-site">
    <div className="agency-masthead"><div className="agency-masthead-inner"><a className="agency-emblem" href="/" aria-label="Về cổng thông tin Hà Nội"><img src="/images/hanoi-logo.png" alt="Biểu trưng Hà Nội" /></a><div className="agency-title"><span>TRANG THÔNG TIN ĐIỆN TỬ</span><b>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG<br /> THÀNH PHỐ HÀ NỘI</b><small>HƯỚNG DẪN THAO TÁC TRÊN CỔNG VÀ BÀN CÁN BỘ</small></div></div></div>
    <header className="guide-site-header"><button className="text-button" onClick={onHome}>← {signedIn ? 'Về bàn cán bộ' : 'Về trang chủ'}</button><button className="button primary" onClick={onStaff}>{signedIn ? 'Mở bàn cán bộ' : 'Đăng nhập cán bộ'}</button></header>
    <main className="guide-site-main"><GuideContent /></main>
    <footer className="public-footer"><span>Hướng dẫn thao tác trong ứng dụng. Giao dịch chính thức cần thực hiện trên cổng có thẩm quyền.</span><a href="/#tra-cuu-thu-tuc">Về danh mục tra cứu trong ứng dụng ↑</a></footer>
  </div>
}

function StaffHome({ user, data, onOpen, onOpenQueue, onNavigate }: { user: User; data: Bootstrap; onOpen: (item: CaseFile) => void; onOpenQueue: (focus?: QueueFocus) => void; onNavigate: (page: string) => void }) {
  const [workingDate] = useState(() => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  const actionable = actionableCases(user, data.cases)
  const openCases = data.cases.filter(item => !CLOSED_STATUSES.has(item.status))
  const overdue = openCases.filter(item => (daysUntil(item.deadline) ?? 999) < 0)
  const dueSoon = openCases.filter(item => { const days = daysUntil(item.deadline); return days !== null && days >= 0 && days <= 3 })
  const unassigned = data.cases.filter(item => item.status === 'DA_TIEP_NHAN' && !item.assignment?.assigneeId)
  const recent = caseEvents(data.cases).slice(0, 7)
  const attention = [...new Map([...overdue, ...dueSoon, ...unassigned, ...actionable].map(item => [item.code, item])).values()]
    .sort((a, b) => (daysUntil(a.deadline) ?? 999) - (daysUntil(b.deadline) ?? 999)).slice(0, 6)
  return <div className="staff-dashboard">
    <section className="welcome-banner staff-banner ops-welcome"><div><span className="eyebrow">KHÔNG GIAN CÔNG VIỆC · {user.agencyScope || 'PHẠM VI ĐƯỢC CẤP'}</span><h2>{roleNames[user.role] || 'Cán bộ'}</h2><p>Ưu tiên công việc theo hạn và trạng thái. Dữ liệu trên màn hình được giới hạn theo vai trò, cơ quan và hồ sơ tài khoản được phép xem.</p><button className="button light" onClick={() => onNavigate('inbox')}>Mở hàng đợi của tôi <span>→</span></button></div><div className="ops-date"><small>NGÀY LÀM VIỆC</small><b>{workingDate}</b><span>{actionable.length} hồ sơ đang có thao tác khả dụng</span></div></section>
     <section className="metric-grid" aria-label="Chỉ số công việc"><MetricCard label="Trong phạm vi" value={data.cases.length} note="Mở danh sách hồ sơ được xem" tone="navy" onClick={() => onOpenQueue({ label: 'Toàn bộ hồ sơ trong phạm vi' })} /><MetricCard label="Có thể xử lý" value={actionable.length} note="Theo vai trò và trạng thái" tone="blue" onClick={actionable.length ? () => onOpenQueue({ statuses: [...new Set(actionable.map(item => item.status))], label: 'Hồ sơ đang chờ thao tác theo vai trò' }) : undefined} /><MetricCard label="Sắp đến hạn" value={dueSoon.length} note="Trong 3 ngày theo lịch" tone="amber" onClick={dueSoon.length ? () => onOpenQueue({ deadlineFilter: 'soon', label: 'Hồ sơ đến hạn trong 3 ngày' }) : undefined} /><MetricCard label="Đã quá hạn" value={overdue.length} note="Hồ sơ còn đang mở" tone="red" onClick={overdue.length ? () => onOpenQueue({ deadlineFilter: 'overdue', label: 'Hồ sơ quá hạn' }) : undefined} /></section>
    <div className="dashboard-columns">
      <section className="panel dashboard-panel"><PanelHeading kicker="TRẠNG THÁI HIỆN TẠI" title="Luồng hồ sơ" description="Số hồ sơ đang hiển thị theo từng nhóm trạng thái." action={<button className="text-button" onClick={() => onNavigate('inbox')}>Mở danh sách →</button>} />
         <div className="stage-list">{OPERATION_STAGES.map((stage, index) => { const count = data.cases.filter(item => stage.statuses.includes(item.status)).length; const width = data.cases.length ? Math.max(count ? 5 : 0, count / Math.max(...OPERATION_STAGES.map(s => data.cases.filter(item => s.statuses.includes(item.status)).length), 1) * 100) : 0; return <button type="button" className="stage-row stage-row-button" key={stage.label} aria-label={`Mở ${count} hồ sơ ở giai đoạn ${stage.label}`} onClick={() => onOpenQueue({ statuses: stage.statuses, label: `Giai đoạn ${stage.label}` })}><span className="stage-number">0{index + 1}</span><span className="stage-label">{stage.label}</span><span className="stage-track"><i style={{ width: `${width}%` }} /></span><b>{count}</b></button> })}</div>
        <div className="stage-footnote">Bảng điều hành này không tự kết luận đúng hạn/nghiệp vụ; hãy mở hồ sơ để xem căn cứ, lịch sử và bước kế tiếp.</div>
      </section>
      <section className="panel dashboard-panel"><PanelHeading kicker="ƯU TIÊN XỬ LÝ" title="Hồ sơ cần chú ý" description="Sắp xếp theo hạn gần nhất; không thay quyết định của cán bộ." action={<button className="text-button" onClick={() => onNavigate('monitoring')}>Xem giám sát →</button>} />
        {attention.length ? <div className="attention-list">{attention.map(item => <button className="attention-row" key={item.code} onClick={() => onOpen(item)}><span className="attention-mark" data-tone={(daysUntil(item.deadline) ?? 999) < 0 ? 'red' : item.status === 'DA_TIEP_NHAN' && !item.assignment?.assigneeId ? 'amber' : 'blue'} /><span className="attention-main"><b>{item.procedure?.name || item.procedureCode}</b><small>{item.code} · {item.applicant?.name || 'Chưa có thông tin người nộp'}</small></span><span className="attention-side"><span className={`status-pill status-${item.status}`}>{data.statusLabels[item.status] || item.status}</span><small>{dueText(item)}</small></span></button>)}</div> : <div className="empty-state compact-empty">Chưa có hồ sơ quá hạn, sắp đến hạn hoặc chờ thao tác trong phạm vi này.</div>}
      </section>
    </div>
    <div className="dashboard-columns lower-columns">
      <section className="panel dashboard-panel"><PanelHeading kicker="TRÁCH NHIỆM" title="Tồn theo người phụ trách" description="Chỉ đếm các hồ sơ đang mở và đã có thông tin phân công." />
         <WorkloadList cases={openCases} onOpenQueue={onOpenQueue} />
      </section>
      <section className="panel dashboard-panel"><PanelHeading kicker="TRUY VẾT" title="Hoạt động gần đây" description="Các sự kiện gần nhất trong hồ sơ mà tài khoản được phép xem." action={<button className="text-button" onClick={() => onNavigate('activity')}>Mở nhật ký →</button>} />
        {recent.length ? <div className="recent-activity">{recent.map((event, index) => <div className="recent-event" key={`${event.code}-${event.at}-${index}`}><span className="timeline-dot"/><div><b>{event.title}</b><small>{event.code} · {event.actor} · {toDate(event.at)}</small></div></div>)}</div> : <div className="empty-state compact-empty">Chưa có sự kiện trong phạm vi tài khoản.</div>}
      </section>
    </div>
  </div>
}

function PanelHeading({ kicker, title, description, action }: { kicker?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="ops-panel-heading"><div>{kicker && <span className="ops-kicker">{kicker}</span>}<h2>{title}</h2><p>{description}</p></div>{action && <div className="ops-panel-action">{action}</div>}</div>
}
function MetricCard({ label, value, note, tone, onClick }: { label: string; value: number; note: string; tone: string; onClick?: () => void }) {
  const content = <><span className={`metric-accent ${tone}`} /><span className="metric-copy"><small>{label}</small><b>{value.toLocaleString('vi-VN')}</b><em>{note}</em></span><span className="metric-arrow">↗</span></>
  return onClick ? <button className="metric-card metric-button" onClick={onClick}>{content}</button> : <article className="metric-card">{content}</article>
}
function WorkloadList({ cases, onOpenQueue }: { cases: CaseFile[]; onOpenQueue: (focus?: QueueFocus) => void }) {
  const workload = new Map<string, { name: string; count: number }>()
  cases.forEach(item => { const id = item.assignment?.assigneeId || (item.assignment?.assignee || item.assignment?.assigneeName ? item.assignment?.assignee || item.assignment?.assigneeName || 'assigned' : 'unassigned'); const name = item.assignment?.assignee || item.assignment?.assigneeName || (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công'); workload.set(id, { name, count: (workload.get(id)?.count || 0) + 1 }) })
  const rows = [...workload.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6)
  const max = Math.max(1, ...rows.map(([, item]) => item.count))
  return rows.length ? <div className="workload-list">{rows.map(([id, item]) => <button type="button" className="workload-row workload-row-button" key={id} aria-label={`Mở ${item.count} hồ sơ của ${item.name}`} onClick={() => onOpenQueue({ assigneeFilter: id === 'unassigned' ? 'unassigned' : id, label: `Người phụ trách: ${item.name}` })}><span>{item.name}</span><i><b style={{ width: `${item.count / max * 100}%` }} /></i><strong>{item.count}</strong></button>)}</div> : <div className="empty-state compact-empty">Chưa có hồ sơ đang mở.</div>
}
const QUEUE_FILTERS = [
  { key: 'ALL', label: 'Tất cả hồ sơ', statuses: [] as string[] },
  { key: 'INTAKE', label: 'Chờ tiếp nhận', statuses: ['CHO_TIEP_NHAN'] },
  { key: 'PROCESSING', label: 'Đang thụ lý', statuses: ['DA_TIEP_NHAN', 'DANG_THU_LY'] },
  { key: 'REVIEW', label: 'Chờ phê duyệt', statuses: ['TRINH_DUYET'] },
  { key: 'SUPPLEMENT', label: 'Chờ bổ sung', statuses: ['CHO_BO_SUNG'] },
  { key: 'CLOSED', label: 'Đã kết thúc', statuses: [...CLOSED_STATUSES] },
]
function CaseQueue({ user, data, initialFocus, onOpen }: { user: User; data: Bootstrap; initialFocus: QueueFocus | null; onOpen: (item: CaseFile) => void }) {
  const [query, setQuery] = useState('')
  const [bucket, setBucket] = useState('ALL')
  const [focusedStatuses, setFocusedStatuses] = useState(initialFocus?.statuses || [])
  const [focusLabel, setFocusLabel] = useState(initialFocus?.label || '')
  const [agencyFilter, setAgencyFilter] = useState(initialFocus?.agencyFilter || 'all')
  const [deadlineFilter, setDeadlineFilter] = useState(initialFocus?.deadlineFilter || 'all')
  const [assigneeFilter, setAssigneeFilter] = useState(initialFocus?.assigneeFilter || 'all')
  const [procedureFilter, setProcedureFilter] = useState(initialFocus?.procedureCode || '')
  const [updatedSince, setUpdatedSince] = useState(initialFocus?.updatedSince || '')
  const [createdFrom, setCreatedFrom] = useState(initialFocus?.createdFrom || '')
  const [createdTo, setCreatedTo] = useState(initialFocus?.createdTo || '')
  const [sort, setSort] = useState('deadline')
  const agencyOptions = [...new Set(data.cases.map(item => item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan'))].sort((a,b) => a.localeCompare(b, 'vi'))
  const assigneeOptions = [...new Map(data.cases.filter(item => item.assignment?.assigneeId || item.assignment?.assigneeName || item.assignment?.assignee).map(item => [item.assignment?.assigneeId || item.assignment?.assigneeName || item.assignment?.assignee || '', { id: item.assignment?.assigneeId || item.assignment?.assigneeName || item.assignment?.assignee || '', name: item.assignment?.assigneeName || item.assignment?.assignee || 'Đã phân công' }])).values()].filter(item => item.id)
  const selectedBucket = QUEUE_FILTERS.find(item => item.key === bucket) || QUEUE_FILTERS[0]
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi')
    return [...data.cases].filter(item => {
      if (selectedBucket.statuses.length && !selectedBucket.statuses.includes(item.status)) return false
      if (focusedStatuses.length && !focusedStatuses.includes(item.status)) return false
      if (agencyFilter !== 'all' && (item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan') !== agencyFilter) return false
      if (procedureFilter && item.procedureCode !== procedureFilter) return false
      if (updatedSince && hanoiDate(item.updatedAt || item.createdAt) < updatedSince) return false
      if (createdFrom && hanoiDate(item.createdAt) < createdFrom) return false
      if (createdTo && hanoiDate(item.createdAt) > createdTo) return false
      const haystack = [item.code, item.procedureCode, item.procedure?.name, item.procedure?.agency, item.applicant?.name, item.assignment?.assignee, item.assignment?.assigneeName].join(' ').toLocaleLowerCase('vi')
      if (term && !haystack.includes(term)) return false
      const days = daysUntil(item.deadline)
      if (deadlineFilter === 'overdue' && (CLOSED_STATUSES.has(item.status) || days === null || days >= 0)) return false
      if (deadlineFilter === 'soon' && (CLOSED_STATUSES.has(item.status) || days === null || days < 0 || days > 3)) return false
      if (deadlineFilter === 'unknown' && !!item.deadline) return false
      const assigned = !!(item.assignment?.assigneeId || item.assignment?.assignee || item.assignment?.assigneeName)
      if (assigneeFilter === 'assigned' && !assigned) return false
      if (assigneeFilter === 'unassigned' && assigned) return false
      if (!['all', 'assigned', 'unassigned'].includes(assigneeFilter) && item.assignment?.assigneeId !== assigneeFilter && item.assignment?.assignee !== assigneeFilter && item.assignment?.assigneeName !== assigneeFilter) return false
      return true
    }).sort((a, b) => sort === 'updated' ? Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt) : sort === 'created' ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999))
  }, [data.cases, query, agencyFilter, selectedBucket.statuses, focusedStatuses, deadlineFilter, assigneeFilter, procedureFilter, updatedSince, createdFrom, createdTo, sort])
  const exportVisibleCases = () => downloadCsv('danh-sach-ho-so-trong-pham-vi.csv', ['Mã hồ sơ','Mã thủ tục','Tên thủ tục','Cơ quan tiếp nhận',...(user.role === 'finance' ? [] : ['Người nộp']),'Trạng thái','Ngày gửi','Hạn giải quyết'], filtered.map(item => [item.code,item.procedureCode,item.procedure?.name || '',item.agencyScope || item.receivingAgency || '',...(user.role === 'finance' ? [] : [item.applicant?.name || '']),data.statusLabels[item.status] || item.status,toDate(item.createdAt),toDate(item.deadline)]))
  const counts = (filter: typeof QUEUE_FILTERS[number]) => data.cases.filter(item => !filter.statuses.length || filter.statuses.includes(item.status)).length
  return <div className="queue-workspace">
    <section className="panel queue-overview"><div><span className="ops-kicker">PHẠM VI ĐƯỢC PHÉP</span><h2>{agencyFilter === 'all' ? user.agencyScope || 'Theo vai trò tài khoản' : agencyFilter}</h2><p>Danh sách không chứa hồ sơ ngoài phạm vi cấp quyền. Mở từng hồ sơ để xem điều kiện chuyển trạng thái và thao tác hiện hành.</p></div><div className="queue-export-actions"><button className="button secondary" onClick={exportVisibleCases}>Xuất CSV · {filtered.length}</button><button className="button secondary" onClick={() => printInternalTable('Bảng kê hồ sơ đang xem', `${agencyFilter === 'all' ? user.agencyScope || 'Phạm vi được cấp' : agencyFilter} · ${filtered.length} hồ sơ`, ['Mã hồ sơ','Thủ tục',...(user.role === 'finance' ? [] : ['Người nộp']),'Trạng thái','Ngày gửi','Hạn giải quyết'], filtered.map(item => [item.code,`${item.procedureCode} · ${item.procedure?.name || ''}`,...(user.role === 'finance' ? [] : [item.applicant?.name || '']),data.statusLabels[item.status] || item.status,toDate(item.createdAt),toDate(item.deadline)]))}>In danh sách · {filtered.length}</button></div></section>
     {focusLabel && <div className="queue-focus-bar"><span>Danh sách lọc từ: <b>{focusLabel}</b>{(createdFrom || createdTo) && <small> · Ngày gửi {createdFrom || 'bất kỳ'} — {createdTo || 'hiện tại'}</small>}{updatedSince && <small> · Cập nhật từ {reportDateDisplay(updatedSince)}</small>}</span><button type="button" className="text-button" onClick={() => { setBucket('ALL'); setFocusedStatuses([]); setFocusLabel(''); setAgencyFilter('all'); setDeadlineFilter('all'); setAssigneeFilter('all'); setProcedureFilter(''); setUpdatedSince(''); setCreatedFrom(''); setCreatedTo(''); setQuery('') }}>Xóa điều kiện lọc</button></div>}
     <div className="queue-tabs" role="tablist" aria-label="Lọc nhóm trạng thái hồ sơ">{QUEUE_FILTERS.map(filter => <button key={filter.key} role="tab" aria-selected={bucket === filter.key} className={bucket === filter.key ? 'queue-tab active' : 'queue-tab'} onClick={() => { setBucket(filter.key); setFocusedStatuses([]); setFocusLabel('') }}><span>{filter.label}</span><b>{counts(filter)}</b></button>)}</div>
    <section className="panel queue-panel"><PanelHeading kicker="DANH SÁCH TÁC NGHIỆP" title={`${filtered.length.toLocaleString('vi-VN')} hồ sơ`} description="Tìm theo mã, tên thủ tục, người nộp, cơ quan hoặc người được phân công." />
        <div className="queue-filter-grid"><label className="queue-search"><span>Tìm hồ sơ</span><input className="search-input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Mã hồ sơ, thủ tục, người nộp…" /></label>{agencyOptions.length > 1 && <label><span>Cơ quan tiếp nhận</span><select value={agencyFilter} onChange={e => setAgencyFilter(e.target.value)}><option value="all">Tất cả trong phạm vi</option>{agencyOptions.map(agency => <option key={agency} value={agency}>{agency}</option>)}</select></label>}{procedureFilter && <label><span>Mã thủ tục</span><input value={procedureFilter} readOnly /></label>}<label><span>Thời hạn</span><select value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)}><option value="all">Mọi thời hạn</option><option value="overdue">Quá hạn</option><option value="soon">Đến hạn trong 3 ngày</option><option value="unknown">Chưa xác định</option></select></label><label><span>Phân công</span><select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}><option value="all">Tất cả</option><option value="assigned">Đã phân công</option><option value="unassigned">Chưa phân công</option>{assigneeOptions.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label><span>Sắp xếp</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="deadline">Hạn gần nhất</option><option value="updated">Cập nhật gần nhất</option><option value="created">Mới tiếp nhận</option></select></label></div>
      <div className="queue-list">{filtered.map(item => <QueueItem key={item.code} item={item} label={data.statusLabels[item.status] || item.status} onOpen={onOpen} />)}{filtered.length === 0 && <div className="empty-state">Không tìm thấy hồ sơ phù hợp. Hãy thay từ khóa hoặc bỏ bớt điều kiện lọc.</div>}</div>
       <div className="queue-footer"><span>Đang xem {filtered.length.toLocaleString('vi-VN')} / {data.cases.length.toLocaleString('vi-VN')} hồ sơ trong phạm vi.</span><span>Bản in và CSV lấy đúng danh sách sau các bộ lọc đang chọn.</span></div>
    </section>
  </div>
}
function QueueItem({ item, label, onOpen }: { item: CaseFile; label: string; onOpen: (item: CaseFile) => void }) {
  const assignee = item.assignment?.assignee || item.assignment?.assigneeName || (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')
  const dueDays = daysUntil(item.deadline)
  const tone = dueDays !== null && dueDays < 0 && !CLOSED_STATUSES.has(item.status) ? 'overdue' : dueDays !== null && dueDays <= 3 && !CLOSED_STATUSES.has(item.status) ? 'soon' : 'normal'
  return <article className="queue-item"><div className="queue-item-main"><span className="case-code">{item.code}</span><h3>{item.procedure?.name || item.procedureCode}</h3><p>{item.applicant?.name || 'Chưa có thông tin người nộp'} · Gửi {toDate(item.createdAt)}</p></div><div className="queue-item-facts"><span><small>Cơ quan</small><b>{item.agencyScope || item.receivingAgency || item.procedure?.agency || 'Chưa xác định'}</b></span><span><small>Người phụ trách</small><b>{assignee}</b></span></div><div className="queue-item-status"><span className={`status-pill status-${item.status}`}>{label}</span><span className={`deadline-mark ${tone}`}>{dueText(item)}</span></div><button className="queue-open" onClick={() => onOpen(item)} aria-label={`Mở hồ sơ ${item.code}`}>Mở hồ sơ <b>→</b></button></article>
}

function OperationsMonitor({ user, data, onOpen, onOpenQueue, onNavigate }: { user: User; data: Bootstrap; onOpen: (item: CaseFile) => void; onOpenQueue: (focus?: QueueFocus) => void; onNavigate: (page: string) => void }) {
  const [period, setPeriod] = useState('30')
  const [loadedAt] = useState(() => Date.now())
  const since = period === 'all' ? 0 : loadedAt - Number(period) * 86400000
  const updatedSince = period === 'all' ? '' : hanoiDate(new Date(since).toISOString())
  const cases = data.cases.filter(item => Date.parse(item.updatedAt || item.createdAt) >= since)
  const open = cases.filter(item => !CLOSED_STATUSES.has(item.status))
  const completed = cases.filter(item => ['HOAN_THANH', 'DA_PHAT_HANH'].includes(item.status)).length
  const overdue = open.filter(item => (daysUntil(item.deadline) ?? 999) < 0)
  const statusRows = Object.entries(data.statusLabels).map(([status, label]) => ({ status, label, count: cases.filter(item => item.status === status).length })).filter(row => row.count).sort((a, b) => b.count - a.count)
  const byAgency = new Map<string, number>()
  const byAssignee = new Map<string, { name: string; count: number }>()
  open.forEach(item => {
    const agency = item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan'
    const assigneeId = item.assignment?.assigneeId || item.assignment?.assignee || item.assignment?.assigneeName || 'unassigned'
    const assignee = item.assignment?.assignee || item.assignment?.assigneeName || (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')
    byAgency.set(agency, (byAgency.get(agency) || 0) + 1); byAssignee.set(assigneeId, { name: assignee, count: (byAssignee.get(assigneeId)?.count || 0) + 1 })
  })
  const highestStatus = Math.max(1, ...statusRows.map(row => row.count))
  const feedback = data.feedback || []
  const averageScore = feedback.length ? feedback.reduce((sum, row) => sum + Number(row.score), 0) / feedback.length : null
  const activeOutbox = (data.outbox || []).filter(row => ['ERROR', 'PENDING'].includes(row.status))
  const oldest = [...open].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).slice(0, 5)
  return <div className="monitor-workspace">
    <section className="panel monitor-controls"><div><span className="ops-kicker">BỘ LỌC PHẠM VI</span><b>{user.agencyScope || 'Theo phạm vi tài khoản'}</b><small>Phân quyền dữ liệu do máy chủ áp dụng trước khi trả danh sách.</small></div><label>Kỳ theo ngày cập nhật<select value={period} onChange={e => setPeriod(e.target.value)}><option value="7">7 ngày gần nhất</option><option value="30">30 ngày gần nhất</option><option value="90">90 ngày gần nhất</option><option value="all">Toàn bộ hồ sơ thấy được</option></select></label><a className="button secondary" href="/api/export/cases.csv">Tải báo cáo CSV</a></section>
     <section className="metric-grid monitor-metrics"><MetricCard label="Hồ sơ trong kỳ" value={cases.length} note="Mở danh sách đã lọc theo kỳ" tone="navy" onClick={() => onOpenQueue({ updatedSince, label: `Hồ sơ cập nhật từ ${period === 'all' ? 'toàn bộ thời gian' : reportDateDisplay(updatedSince)}` })} /><MetricCard label="Đang mở" value={open.length} note="Chưa ở trạng thái kết thúc" tone="blue" onClick={open.length ? () => onOpenQueue({ statuses: [...new Set(open.map(item => item.status))], updatedSince, label: 'Hồ sơ đang mở trong kỳ' }) : undefined} /><MetricCard label="Quá hạn" value={overdue.length} note="Theo hạn đang lưu trên hồ sơ" tone="red" onClick={overdue.length ? () => onOpenQueue({ deadlineFilter: 'overdue', updatedSince, label: 'Hồ sơ quá hạn' }) : undefined} /><MetricCard label="Đã phát hành / hoàn tất" value={completed} note="Không bao gồm hồ sơ từ chối" tone="green" onClick={completed ? () => onOpenQueue({ statuses: [...new Set(cases.filter(item => ['HOAN_THANH', 'DA_PHAT_HANH'].includes(item.status)).map(item => item.status))], updatedSince, label: 'Hồ sơ đã phát hành hoặc hoàn tất' }) : undefined} /></section>
     <div className="dashboard-columns monitor-columns"><section className="panel dashboard-panel"><PanelHeading kicker="PHÂN BỐ TỒN" title="Hồ sơ theo trạng thái" description="Chọn một trạng thái để mở danh sách đúng nhóm hồ sơ trong phạm vi." />{statusRows.length ? <div className="monitor-status-list">{statusRows.map(row => <button type="button" className="monitor-status-row monitor-status-button" key={row.status} onClick={() => onOpenQueue({ statuses: [row.status], updatedSince, label: `Trạng thái: ${row.label}` })}><span>{row.label}</span><i><b style={{ width: `${row.count / highestStatus * 100}%` }} /></i><strong>{row.count}</strong></button>)}</div> : <div className="empty-state compact-empty">Không có hồ sơ trong kỳ.</div>}</section>
       <section className="panel dashboard-panel"><PanelHeading kicker="TẢI CÔNG VIỆC" title="Theo cơ quan và người phụ trách" description="Chọn một nhóm để mở các hồ sơ đang mở tương ứng." />{[...byAgency.entries()].length ? <div className="monitor-groups"><h3>Cơ quan / đơn vị</h3>{[...byAgency.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=><button type="button" className="monitor-group-row monitor-group-button" key={name} onClick={() => onOpenQueue({ agencyFilter: name, updatedSince, statuses: [...new Set(open.filter(item => (item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan') === name).map(item => item.status))], label: `Cơ quan: ${name}` })}><span>{name}</span><b>{count}</b></button>)}<h3>Người phụ trách</h3>{[...byAssignee.entries()].sort((a,b)=>b[1].count-a[1].count).slice(0,5).map(([id,item])=><button type="button" className="monitor-group-row monitor-group-button" key={id} onClick={() => onOpenQueue({ assigneeFilter: id === 'unassigned' ? 'unassigned' : id, updatedSince, label: `Người phụ trách: ${item.name}` })}><span>{item.name}</span><b>{item.count}</b></button>)}</div> : <div className="empty-state compact-empty">Chưa có hồ sơ mở trong kỳ.</div>}</section></div>
    <div className="dashboard-columns monitor-columns"><section className="panel dashboard-panel"><PanelHeading kicker="TUỔI HỒ SƠ" title="Hồ sơ đang mở lâu nhất" description="Sắp theo ngày tạo; cần xem nhật ký để biết thời gian thực tế ở từng bước." action={<button className="text-button" onClick={() => onNavigate('inbox')}>Mở hàng đợi →</button>} />{oldest.length ? <div className="attention-list">{oldest.map(item => <button className="attention-row" key={item.code} onClick={() => onOpen(item)}><span className="attention-mark" data-tone={daysUntil(item.deadline) !== null && (daysUntil(item.deadline) as number) < 0 ? 'red' : 'blue'} /><span className="attention-main"><b>{item.procedure?.name || item.procedureCode}</b><small>{item.code} · Tạo {toDate(item.createdAt)}</small></span><span className="attention-side"><span className={`status-pill status-${item.status}`}>{data.statusLabels[item.status] || item.status}</span><small>{dueText(item)}</small></span></button>)}</div> : <div className="empty-state compact-empty">Không có hồ sơ đang mở.</div>}</section>
      <section className="panel dashboard-panel"><PanelHeading kicker="CHẤT LƯỢNG PHỤC VỤ" title="Phản hồi sau kết quả" description="Chỉ tổng hợp đánh giá đã lưu; nội dung không làm thay đổi quyết định hồ sơ." />{feedback.length ? <><div className="feedback-score"><b>{averageScore?.toFixed(1)}</b><span>/ 5</span><small>{feedback.length} phản hồi trong phạm vi dữ liệu được phép</small></div><div className="feedback-list">{feedback.slice(0,4).map((row,index)=><article key={`${row.code}-${index}`}><b>{'★'.repeat(row.score)}{'☆'.repeat(5-row.score)}</b><span>{row.code}</span><p>{row.content || 'Không có nội dung nhận xét.'}</p></article>)}</div></> : <div className="empty-state compact-empty">Chưa có đánh giá trong dữ liệu hồ sơ được phép xem.</div>}</section></div>
    <section className="panel integration-summary"><PanelHeading kicker="PHỤ THUỘC HỆ THỐNG" title="Hàng chờ đồng bộ" description="Dữ liệu hàng chờ trong ứng dụng; đây không phải xác nhận đã kết nối tới hệ thống bên ngoài." action={<button className="text-button" onClick={() => onNavigate('connections')}>Chi tiết kết nối →</button>} />{activeOutbox.length ? <div className="outbox-list">{activeOutbox.map(row=><div className="outbox-row" key={row.code}><b>{row.code}</b><span className={`request-status ${row.status === 'ERROR' ? 'request-rejected' : 'request-pending'}`}>{row.status === 'ERROR' ? 'Có lỗi' : 'Đang chờ'}</span><span>{row.attempts} lần thử</span><small>{row.lastError || 'Chưa có phản hồi xác nhận.'}</small></div>)}</div> : <div className="empty-state compact-empty">Không có bản ghi PENDING/ERROR trong hàng chờ hiện tại.</div>}</section>
  </div>
}

function ProcedureCatalog({ procedures, procedureCategories, canManage, onUpdated }: { procedures: Procedure[]; procedureCategories: ProcedureCategory[]; canManage: boolean; onUpdated: () => Promise<void> }) {
  type CatalogAudit = { actor: string; action: string; reason: string; before: Record<string, unknown> | null; after: Record<string, unknown>; createdAt: string }
  type CategoryAudit = { actor: string; reason: string; before: Record<string, unknown> | null; after: Record<string, unknown>; createdAt: string }
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [mode, setMode] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedCode, setSelectedCode] = useState(() => procedures[0]?.sourceCode || procedures[0]?.code || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [history, setHistory] = useState<CatalogAudit[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('')
  const [editingCategory, setEditingCategory] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)
  const [categoryHistory, setCategoryHistory] = useState<CategoryAudit[]>([])
  const [showCategoryHistory, setShowCategoryHistory] = useState(false)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [savingNewCategory, setSavingNewCategory] = useState(false)
  const [managingMembers, setManagingMembers] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberPage, setMemberPage] = useState(1)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [targetCategoryKey, setTargetCategoryKey] = useState('')
  const [savingMove, setSavingMove] = useState(false)
  const memberPageSize = 20
  const pageSize = 12
  const fields = useMemo(() => [...new Set(procedures.map(item => item.field).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi')), [procedures])
  const categories = useMemo(() => {
    const grouped = new Map<string, ProcedureCategory>()
    for (const category of procedureCategories) grouped.set(category.key, { ...category, procedures: [] })
    for (const item of procedures) {
      const key = item.categoryKey || item.field
      const existing = grouped.get(key)
      if (existing) existing.procedures.push(item)
      else grouped.set(key, { key, name: item.field, count: 0, source: key.startsWith('local:') ? 'internal' : 'reference', procedures: [], categoryEdit: item.categoryEdit })
    }
    for (const category of grouped.values()) category.count = category.procedures.length
    return [...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'))
  }, [procedures, procedureCategories])
  const visibleCategories = categories.filter(item => item.name.toLocaleLowerCase('vi').includes(categoryQuery.trim().toLocaleLowerCase('vi')))
  const selectedCategory = categories.find(item => item.key === selectedCategoryKey) || categories[0] || null
  const classifiedFieldCount = categories.filter(item => item.key !== 'Chưa phân loại').length
  const selected = procedures.find(item => (item.sourceCode || item.code) === selectedCode) || procedures[0] || null
  const categoryMemberMatches = selectedCategory?.procedures.filter(item => `${item.code} ${item.name}`.toLocaleLowerCase('vi').includes(memberQuery.trim().toLocaleLowerCase('vi'))) || []
  const categoryMemberPages = Math.max(1, Math.ceil(categoryMemberMatches.length / memberPageSize))
  const categoryMemberShown = categoryMemberMatches.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize)
  const configuredForms = procedures.filter(item => item.submission && item.submission.sourceStatus !== 'official-document-list-only').length
  const documentReferences = procedures.filter(item => item.submission?.sourceStatus === 'official-document-list-only').length
  const filtered = useMemo(() => procedures.filter(item => {
    const term = query.trim().toLocaleLowerCase('vi')
    return (field === 'all' || item.field === field) && (mode === 'all' || item.serviceMode === mode) && (!term || `${item.code} ${item.name} ${item.field} ${item.agency} ${item.level}`.toLocaleLowerCase('vi').includes(term))
  }), [procedures, query, field, mode])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page-1)*pageSize, page*pageSize)
  const sourceStatus = (item: Procedure) => item.localEdit ? 'Chỉnh sửa nội bộ · cần đối chiếu' : item.categoryEdit ? 'Lĩnh vực sửa nội bộ · cần đối chiếu' : item.routing?.status === 'partially-verified' ? 'Đối chiếu một phần' : item.routing?.status === 'unverified' ? 'Cần xác minh' : item.routing?.status === 'catalog-reference-only' ? 'Dữ liệu tham chiếu' : item.verified ? 'Đã xác minh' : 'Cần xác minh'
  useEffect(() => {
    if (!procedures.some(item => (item.sourceCode || item.code) === selectedCode)) setSelectedCode(procedures[0]?.sourceCode || procedures[0]?.code || '')
  }, [procedures, selectedCode])
  useEffect(() => {
    if (!categories.some(item => item.key === selectedCategoryKey)) setSelectedCategoryKey(categories[0]?.key || '')
  }, [categories, selectedCategoryKey])
  useEffect(() => { setMemberPage(1); setMemberQuery(''); setSelectedMembers([]); setTargetCategoryKey('') }, [selectedCategoryKey])
  function startEdit() {
    if (!selected) return
    setError(''); setNotice(''); setEditing(true)
  }
  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const form = new FormData(event.currentTarget)
    const categoryKey = String(form.get('categoryKey') || '')
    const target = categories.find(item => item.key === categoryKey)
    const payload = {
      code: String(form.get('code') || ''), name: String(form.get('name') || ''), field: target?.name || '', categoryKey, level: String(form.get('level') || ''),
      agency: String(form.get('agency') || ''), sourceUrl: String(form.get('sourceUrl') || ''), checkedAt: String(form.get('checkedAt') || ''),
      reason: String(form.get('reason') || ''), expectedVersion: selected.localEdit?.version || 0,
    }
    setSaving(true); setError(''); setNotice('')
    try {
      await api<{procedure:Procedure}>(`/api/procedures/${encodeURIComponent(selected.sourceCode || selected.code)}/edit`, payload)
      await onUpdated(); setEditing(false); setShowHistory(false); setNotice('Đã lưu phiên bản danh mục nội bộ. Bản sửa vẫn cần được đối chiếu với nguồn chính thức trước khi dùng làm căn cứ nghiệp vụ.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được danh mục.') }
    finally { setSaving(false) }
  }
  async function toggleHistory() {
    if (!selected || !canManage) return
    if (showHistory) { setShowHistory(false); return }
    setError('')
    try {
      const result = await api<{history:CatalogAudit[]}>(`/api/procedures/${encodeURIComponent(selected.sourceCode || selected.code)}/history`)
      setHistory(result.history); setShowHistory(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được lịch sử danh mục.') }
  }
  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCategory) return
    const values = new FormData(event.currentTarget)
    const payload = { sourceName: selectedCategory.key, name: String(values.get('name') || ''), sourceUrl: String(values.get('sourceUrl') || ''), checkedAt: String(values.get('checkedAt') || ''), reason: String(values.get('reason') || ''), expectedVersion: selectedCategory.categoryEdit?.version || 0 }
    setSavingCategory(true); setError('')
    try {
      await api('/api/procedure-categories/edit', payload)
      await onUpdated(); setEditingCategory(false); setShowCategoryHistory(false)
      setNotice('Đã cập nhật tên lĩnh vực cho toàn bộ thủ tục thuộc nhóm này. Phiên bản nội bộ đã được ghi lịch sử.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được lĩnh vực.') }
    finally { setSavingCategory(false) }
  }
  async function saveNewCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setSavingNewCategory(true); setError('')
    try {
      const result = await api<{category:ProcedureCategory}>('/api/procedure-categories/create', {
        name: String(values.get('name') || ''), sourceUrl: String(values.get('sourceUrl') || ''), checkedAt: String(values.get('checkedAt') || ''), reason: String(values.get('reason') || ''),
      })
      await onUpdated(); setSelectedCategoryKey(result.category.key); setNewCategoryOpen(false); setNotice('Đã tạo lĩnh vực nội bộ. Hãy chuyển thủ tục vào nhóm và ghi căn cứ đối chiếu trước khi dùng nghiệp vụ.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tạo được lĩnh vực.') }
    finally { setSavingNewCategory(false) }
  }
  async function moveSelectedMembers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCategory || !selectedMembers.length || !targetCategoryKey) return
    const values = new FormData(event.currentTarget)
    const selectedProcedures = selectedCategory.procedures.filter(item => selectedMembers.includes(item.sourceCode || item.code))
    setSavingMove(true); setError('')
    try {
      const result = await api<{moved:number; targetCategory:string}>('/api/procedure-categories/move', {
        procedureCodes: selectedProcedures.map(item => item.sourceCode || item.code), targetCategoryKey,
        expectedVersions: Object.fromEntries(selectedProcedures.map(item => [item.sourceCode || item.code, item.localEdit?.version || 0])),
        sourceUrl: String(values.get('sourceUrl') || ''), checkedAt: String(values.get('checkedAt') || ''), reason: String(values.get('reason') || ''),
      })
      await onUpdated(); setSelectedMembers([]); setManagingMembers(false); setShowCategoryHistory(false)
      setNotice(`Đã chuyển ${result.moved.toLocaleString('vi-VN')} thủ tục sang lĩnh vực “${result.targetCategory}”. Lịch sử được lưu cho từng mã thủ tục.`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Không chuyển được thủ tục.') }
    finally { setSavingMove(false) }
  }
  async function toggleCategoryHistory() {
    if (!selectedCategory || !canManage) return
    if (showCategoryHistory) { setShowCategoryHistory(false); return }
    setError('')
    try {
      const params = new URLSearchParams({ key: selectedCategory.key })
      const result = await api<{history:CategoryAudit[]}>(`/api/procedure-categories/history?${params.toString()}`)
      setCategoryHistory(result.history); setShowCategoryHistory(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được lịch sử lĩnh vực.') }
  }
  return <div className="catalog-workspace">
    <section className="catalog-summary-grid" aria-label="Tình trạng danh mục">
      <article className="catalog-summary"><span>Thủ tục đã nạp</span><b>{procedures.length.toLocaleString('vi-VN')}</b><small>Dữ liệu tham chiếu lưu trong ứng dụng</small></article>
      <article className="catalog-summary"><span>Lĩnh vực đã phân loại</span><b>{classifiedFieldCount.toLocaleString('vi-VN')}</b><small>{categories.some(item=>item.key==='Chưa phân loại')?'Còn bản ghi chưa phân loại':'Nhóm theo danh mục hiện có'}</small></article>
      <article className="catalog-summary"><span>Tờ khai có thể tiếp nhận cục bộ</span><b>{configuredForms.toLocaleString('vi-VN')}</b><small>{documentReferences.toLocaleString('vi-VN')} thủ tục có thành phần hồ sơ tham chiếu nhưng chưa có cấu trúc tờ khai điện tử</small></article>
    </section>
    <section className="panel catalog-source-note"><b>Nguồn dữ liệu</b><p>Danh mục 2.075 thủ tục trong ứng dụng được giữ theo bộ tham chiếu hiện có. Phần đối chiếu Cổng Dịch vụ công quốc gia được tái tạo từ dữ liệu công khai ngày 18/10/2026 sau khi khôi phục dự án, không tự đồng bộ trực tiếp khi nguồn thay đổi. Mọi chỉnh sửa tại đây là dữ liệu nội bộ, có ghi phiên bản và nguồn đối chiếu, không tự trở thành thông tin đã được cơ quan có thẩm quyền xác nhận.</p></section>
    <section className="panel field-catalog-panel" aria-label="Danh mục lĩnh vực thủ tục">
      <div className="field-catalog-header"><div><span className="ops-kicker">DANH MỤC PHÂN LOẠI</span><h2>Lĩnh vực thủ tục</h2><p>{classifiedFieldCount.toLocaleString('vi-VN')} lĩnh vực đã phân loại{categories.some(item=>item.key==='Chưa phân loại')?' · có nhóm thủ tục chưa phân loại':''} · mở nhóm để quản lý đầy đủ các thủ tục trực thuộc.</p></div><div className="field-catalog-header-actions">{canManage&&<button className="button secondary" onClick={()=>{setNewCategoryOpen(open=>!open);setError('')}}>{newCategoryOpen?'Đóng tạo lĩnh vực':'Tạo lĩnh vực'}</button>}<label className="field-catalog-search">Tìm lĩnh vực<input type="search" value={categoryQuery} onChange={event=>setCategoryQuery(event.target.value)} placeholder="Nhập tên lĩnh vực" /></label></div></div>
      {newCategoryOpen&&<form className="catalog-edit-form new-category-form" onSubmit={saveNewCategory}><h3>Tạo lĩnh vực nội bộ</h3><p>Nhóm mới bắt đầu ở trạng thái nội bộ. Có thể chuyển thủ tục vào nhóm; chỉ gắn nguồn chính thức khi đã đối chiếu thật.</p><label>Tên lĩnh vực<input name="name" required minLength={3} maxLength={180} /></label><label>Nguồn chính thức nếu đã đối chiếu<input name="sourceUrl" type="url" maxLength={600} placeholder="https://...gov.vn/..." /></label><label>Ngày đối chiếu nếu có<input name="checkedAt" type="date" /></label><label>Mục đích và căn cứ tạo nhóm<textarea name="reason" rows={2} required minLength={20} maxLength={1200} /></label><div className="catalog-editor-actions"><button className="button primary" disabled={savingNewCategory}>{savingNewCategory?'Đang tạo…':'Lưu lĩnh vực nội bộ'}</button></div></form>}
      <div className="field-catalog-layout">
        <div className="field-catalog-list" role="listbox" aria-label="Các lĩnh vực">
          {visibleCategories.map(category=><button type="button" role="option" aria-selected={selectedCategory?.key===category.key} className={`field-catalog-row${selectedCategory?.key===category.key?' active':''}`} key={category.key} onClick={()=>{setSelectedCategoryKey(category.key);setEditingCategory(false);setShowCategoryHistory(false);setManagingMembers(false);setError('')}}><span>{category.name}</span><b>{category.procedures.length.toLocaleString('vi-VN')}</b></button>)}
          {!visibleCategories.length&&<p className="field-catalog-no-results">Không có lĩnh vực khớp từ khóa.</p>}
        </div>
        {selectedCategory&&<div className="field-catalog-detail">
          {editingCategory ? <>
            <div className="catalog-editor-heading"><div><span className="ops-kicker">CHỈNH SỬA LĨNH VỰC · {selectedCategory.procedures.length.toLocaleString('vi-VN')} THỦ TỤC</span><h3>{selectedCategory.name}</h3></div><button type="button" className="text-button" onClick={()=>setEditingCategory(false)}>Hủy</button></div>
            <p className="catalog-editor-warning">Tên mới áp dụng cho toàn bộ thủ tục trong nhóm. Lịch sử giữ tên cũ; lĩnh vực tham chiếu cần nguồn chính thức, nhóm nội bộ được ghi rõ là nội bộ.</p>
            <form className="catalog-edit-form" onSubmit={saveCategory}>
              <label>Tên lĩnh vực<input name="name" defaultValue={selectedCategory.name} required maxLength={180} /></label>
              <label>{selectedCategory.source==='reference'?'Nguồn chính thức':'Nguồn chính thức nếu đã đối chiếu'}<input name="sourceUrl" type="url" defaultValue={selectedCategory.categoryEdit?.sourceUrl || selectedCategory.procedures.find(item=>item.routing?.officialUrl)?.routing?.officialUrl || ''} required={selectedCategory.source==='reference'} maxLength={600} placeholder="https://...gov.vn/..." /></label>
              <label>Ngày đối chiếu{selectedCategory.source==='internal'?' nếu có':''}<input name="checkedAt" type="date" defaultValue={selectedCategory.categoryEdit?.checkedAt || (selectedCategory.source==='reference'?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date()):'')} required={selectedCategory.source==='reference'} /></label>
              <label>Căn cứ và nội dung đã đối chiếu<textarea name="reason" rows={3} defaultValue={selectedCategory.categoryEdit?.reason || ''} required minLength={20} maxLength={1200} /></label>
              {error&&<p className="form-error" role="alert">{error}</p>}
              <div className="catalog-editor-actions"><button className="button primary" disabled={savingCategory}>{savingCategory?'Đang lưu…':'Lưu lĩnh vực nội bộ'}</button></div>
            </form>
          </> : <>
            <div className="field-detail-heading"><div><span className="ops-kicker">THÔNG TIN LĨNH VỰC · {selectedCategory.source==='internal'?'NHÓM NỘI BỘ':'DANH MỤC THAM CHIẾU'}</span><h3>{selectedCategory.name}</h3><p>{selectedCategory.procedures.length.toLocaleString('vi-VN')} thủ tục hiện thuộc lĩnh vực này</p></div>{canManage&&<div className="field-detail-actions"><button className="button secondary" onClick={()=>{setError('');setEditingCategory(true)}}>Sửa tên lĩnh vực</button><button className="button secondary" onClick={()=>{setManagingMembers(open=>!open);setError('')}}>{managingMembers?'Đóng quản lý thủ tục':'Quản lý thủ tục'}</button></div>}</div>
            {selectedCategory.categoryEdit&&<div className="field-catalog-provenance"><b>{selectedCategory.source==='internal'?'Nhóm lĩnh vực nội bộ':'Phiên bản nội bộ'} {selectedCategory.categoryEdit.version}</b><span>Cập nhật bởi {selectedCategory.categoryEdit.updatedBy} · {toDate(selectedCategory.categoryEdit.updatedAt)}{selectedCategory.source==='reference'?' · cần cơ quan nghiệp vụ xác nhận':' · không phải nhóm phân loại chính thức'}</span><p>{selectedCategory.categoryEdit.reason}</p>{selectedCategory.categoryEdit.sourceUrl&&<a href={selectedCategory.categoryEdit.sourceUrl} target="_blank" rel="noreferrer">Mở nguồn đối chiếu ↗</a>}</div>}
            <div className="field-member-toolbar"><label>Tìm trong lĩnh vực<input type="search" value={memberQuery} onChange={event=>{setMemberQuery(event.target.value);setMemberPage(1);setSelectedMembers([])}} placeholder="Mã thủ tục hoặc tên thủ tục" /></label><span>{categoryMemberMatches.length.toLocaleString('vi-VN')} / {selectedCategory.procedures.length.toLocaleString('vi-VN')} thủ tục</span></div>
            {managingMembers&&canManage&&<form className="field-member-manager" onSubmit={moveSelectedMembers}><div className="field-member-selection"><span>Đã chọn {selectedMembers.length.toLocaleString('vi-VN')} thủ tục · chọn trong trang hiện tại</span><div><button type="button" className="text-button" onClick={()=>setSelectedMembers(current=>[...new Set([...current,...categoryMemberShown.map(item=>item.sourceCode||item.code)])])}>Chọn trang này</button><button type="button" className="text-button" onClick={()=>setSelectedMembers(current=>current.filter(code=>!categoryMemberShown.some(item=>(item.sourceCode||item.code)===code)))}>Bỏ chọn trang này</button></div></div><label>Chuyển các thủ tục đã chọn sang lĩnh vực<select value={targetCategoryKey} onChange={event=>setTargetCategoryKey(event.target.value)} required><option value="">Chọn lĩnh vực đích</option>{categories.filter(item=>item.key!==selectedCategory.key).map(item=><option key={item.key} value={item.key}>{item.name} · {item.procedures.length.toLocaleString('vi-VN')}</option>)}</select></label><label>Nguồn chính thức nếu chuyển vào lĩnh vực tham chiếu<input name="sourceUrl" type="url" maxLength={600} placeholder="https://...gov.vn/..." /></label><label>Ngày đối chiếu nếu có<input name="checkedAt" type="date" /></label><label>Căn cứ phân loại và lý do chuyển nhóm<textarea name="reason" required minLength={20} maxLength={1200} rows={2} /></label><button className="button primary" disabled={savingMove||!selectedMembers.length||!targetCategoryKey}>{savingMove?'Đang chuyển…':`Chuyển ${selectedMembers.length.toLocaleString('vi-VN')} thủ tục`}</button></form>}
            <div className="field-procedure-list"><b>Thủ tục trong lĩnh vực</b>{categoryMemberShown.map(item=><div className="field-procedure-row" key={item.sourceCode||item.code}>{managingMembers&&canManage&&<input type="checkbox" aria-label={`Chọn thủ tục ${item.code}`} checked={selectedMembers.includes(item.sourceCode||item.code)} onChange={event=>setSelectedMembers(current=>event.target.checked?[...current,item.sourceCode||item.code]:current.filter(code=>code!==(item.sourceCode||item.code)))} />}<button type="button" onClick={()=>{const stableCode=item.sourceCode||item.code;setSelectedCode(stableCode);setField(item.field);setMode('all');setQuery('');const group=procedures.filter(value=>value.field===item.field);setPage(Math.floor(group.findIndex(value=>(value.sourceCode||value.code)===stableCode)/pageSize)+1)}}><span><b>{item.code}</b> · {item.name}</span><span aria-hidden="true">›</span></button></div>)}{!categoryMemberShown.length&&<p className="field-catalog-no-results">Lĩnh vực này chưa có thủ tục{memberQuery?' khớp nội dung tìm kiếm':''}. Chọn “Quản lý thủ tục” để phân loại bản ghi vào nhóm.</p>}</div>
            {categoryMemberPages>1&&<div className="catalog-pagination field-member-pagination"><button className="button secondary" disabled={memberPage<=1} onClick={()=>setMemberPage(value=>Math.max(1,value-1))}>← Trang trước</button><span>Trang {memberPage} / {categoryMemberPages}</span><button className="button secondary" disabled={memberPage>=categoryMemberPages} onClick={()=>setMemberPage(value=>Math.min(categoryMemberPages,value+1))}>Trang sau →</button></div>}
            {canManage&&<button className="text-button field-history-button" onClick={toggleCategoryHistory}>{showCategoryHistory?'Ẩn lịch sử lĩnh vực':'Xem lịch sử lĩnh vực'}</button>}
            {showCategoryHistory&&<div className="catalog-history-list">{categoryHistory.length?categoryHistory.map(entry=><article key={`${entry.createdAt}-${entry.actor}`}><b>{String(entry.after.version ?? '—')} · {entry.actor}</b><time>{toDate(entry.createdAt)}</time><p>{entry.reason}</p></article>):<p>Lĩnh vực này chưa có lần chỉnh sửa nội bộ.</p>}</div>}
            {error&&<p className="form-error" role="alert">{error}</p>}
          </>}
        </div>}
      </div>
    </section>
    <section className="panel catalog-controls">
      <label className="catalog-search"><span>Tìm theo mã, tên, lĩnh vực hoặc cơ quan</span><input className="search-input" type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Ví dụ: 2.000908, hộ tịch…" /></label>
      <label><span>Lĩnh vực</span><select value={field} onChange={e=>{setField(e.target.value);setPage(1)}}><option value="all">Tất cả lĩnh vực</option>{fields.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>Mức dịch vụ</span><select value={mode} onChange={e=>{setMode(e.target.value);setPage(1)}}><option value="all">Tất cả mức</option><option value="FULL">Toàn trình</option><option value="PARTIAL">Một phần</option><option value="INFORMATION">Cung cấp thông tin</option></select></label>
      <div className="catalog-count"><b>{filtered.length.toLocaleString('vi-VN')}</b><small>thủ tục phù hợp</small></div>
    </section>
    <div className="catalog-layout">
      <section className="panel catalog-list-panel"><div className="catalog-list-head"><div><span className="ops-kicker">DANH MỤC THAM CHIẾU</span><h2>Kết quả tra cứu</h2><p>Chọn một dòng để xem đầy đủ thông tin khả dụng.</p></div><span>{filtered.length ? `${(page-1)*pageSize+1}–${Math.min(page*pageSize,filtered.length)} / ${filtered.length}` : '0 kết quả'}</span></div>
        <div className="catalog-list">{shown.map(item=>{const stableCode=item.sourceCode||item.code;const isSelected=(selected?.sourceCode||selected?.code)===stableCode;return <button aria-label={`Xem thông tin thủ tục ${item.code}: ${item.name}`} aria-pressed={isSelected} className={`catalog-row${isSelected?' selected':''}`} key={`${stableCode}-${item.ref}`} onClick={()=>{setSelectedCode(stableCode);setEditing(false);setShowHistory(false);setError('')}}><span className="catalog-row-code">{item.code}</span><span className="catalog-row-main"><b>{item.name}</b><small>{item.field} · {serviceModeLabel(item.level)}</small></span><span className={`catalog-verify ${item.localEdit || item.categoryEdit || item.routing?.status==='catalog-reference-only' || item.routing?.status==='unverified'?'unverified':'verified'}`}>{sourceStatus(item)}</span><span className="row-arrow" aria-hidden="true">›</span></button>})}</div>
        {filtered.length===0&&<div className="empty-state">Không tìm thấy thủ tục phù hợp. Hãy kiểm tra từ khóa hoặc bỏ bớt bộ lọc.</div>}
        {filtered.length>pageSize&&<div className="catalog-pagination"><button className="button secondary" disabled={page<=1} onClick={()=>setPage(current=>Math.max(1,current-1))}>← Trước</button><span>Trang {page} / {pageCount}</span><button className="button secondary" disabled={page>=pageCount} onClick={()=>setPage(current=>Math.min(pageCount,current+1))}>Tiếp →</button></div>}
      </section>
      <aside className="panel procedure-detail-panel" aria-live="polite">
        {selected ? editing ? <>
          <div className="catalog-editor-heading"><div><span className="ops-kicker">CHỈNH SỬA NỘI BỘ</span><h2>{selected.code}</h2></div><button type="button" className="text-button" onClick={()=>setEditing(false)}>Hủy</button></div>
          <p className="catalog-editor-warning">Mã, tên, lĩnh vực và mức dịch vụ được lưu thành phiên bản nội bộ. Chỉ ghi nguồn và ngày khi đã đối chiếu thật với trang HTTPS thuộc miền .gov.vn hoặc chinhphu.vn; nếu bỏ trống, bản sửa vẫn được đánh dấu cần xác minh.</p>
          <form className="catalog-edit-form" onSubmit={saveEdit}>
            <label>Mã thủ tục<input name="code" defaultValue={selected.code} required minLength={2} maxLength={40} autoCapitalize="characters" /></label>
            <label>Tên thủ tục<input name="name" defaultValue={selected.name} required maxLength={500} /></label>
            <label>Lĩnh vực / danh mục<select name="categoryKey" defaultValue={selected.categoryKey || selected.field} required>{categories.map(category=><option key={category.key} value={category.key}>{category.name}{category.source==='internal'?' · nội bộ':''}</option>)}</select></label>
            <label>Mức dịch vụ<select name="level" defaultValue={selected.level} required><option value="Toàn trình">Toàn trình</option><option value="Một phần">Một phần</option><option value="Cung cấp thông tin">Cung cấp thông tin</option></select></label>
            <label>Cơ quan thực hiện theo nguồn<input name="agency" defaultValue={selected.agency} required maxLength={300} /></label>
            <label>Nguồn chính thức nếu đã đối chiếu<input name="sourceUrl" type="url" defaultValue={selected.localEdit?.sourceUrl || selected.routing?.officialUrl || ''} maxLength={600} placeholder="https://...gov.vn/..." /></label>
            <label>Ngày đối chiếu nếu có<input name="checkedAt" type="date" defaultValue={selected.localEdit?.checkedAt || selected.routing?.checkedAt || ''} /></label>
            <label>Căn cứ và nội dung đã đối chiếu<textarea name="reason" rows={3} defaultValue={selected.localEdit?.reason || ''} required minLength={20} maxLength={1200} /></label>
            {error&&<p className="form-error" role="alert">{error}</p>}
            <div className="catalog-editor-actions"><button className="button primary" disabled={saving}>{saving?'Đang lưu…':'Lưu phiên bản nội bộ'}</button></div>
          </form>
        </> : <>
          <div className="procedure-detail-heading"><div><span className="ops-kicker">THÔNG TIN THỦ TỤC</span><small className="procedure-detail-code">Mã đang dùng: {selected.code}{selected.ref ? ` · Mã bản ghi tham chiếu: ${selected.ref}` : ''}{selected.sourceCode&&selected.sourceCode!==selected.code?` · Mã nguồn: ${selected.sourceCode}`:''}</small></div>{canManage&&<button className="button secondary" onClick={startEdit}>Chỉnh sửa</button>}</div>
          <h2>{selected.name}</h2>
          <dl className="procedure-facts"><div><dt>Lĩnh vực</dt><dd>{selected.field || 'Chưa xác định'}</dd></div><div><dt>Mức dịch vụ</dt><dd>{serviceModeLabel(selected.level)}</dd></div><div><dt>Cơ quan trong bản tham chiếu</dt><dd>{selected.agency || 'Chưa xác định'}</dd></div><div><dt>Mã bản ghi</dt><dd>{selected.ref || 'Không có mã tham chiếu trong tệp nguồn'}</dd></div></dl>
          {selected.submission ? <section className="procedure-form-detail"><h3>{selected.submission.sourceStatus === 'official-document-list-only' ? 'Thành phần hồ sơ tham chiếu từ nguồn công khai' : selected.submission.title}</h3><p><b>Căn cứ pháp lý:</b> {selected.submission.legalBasis}</p><p><b>Thời hạn:</b> {selected.submission.deadlineText}</p><p><b>Phí:</b> {selected.submission.feeText}</p>{selected.submission.sourceStatus === 'official-document-list-only' && <p className="routing-evidence warning">Nguồn công khai hiện không trả cấu trúc tờ khai điện tử. Ứng dụng hiển thị dữ liệu giấy tờ để tham khảo và không nhận hồ sơ cục bộ cho thủ tục này.</p>}<div className="procedure-requirement-list"><b>{selected.submission.sourceStatus === 'official-document-list-only' ? 'Thành phần hồ sơ theo nguồn (chưa xác nhận cờ bắt buộc)' : 'Trường khai báo và giấy tờ đã cấu hình'}</b>{[...selected.submission.fields,...selected.submission.documents].slice(0,12).map((entry,index)=><div key={`${entry.id}-${index}`}><span>{entry.label}</span><small>{selected.submission?.sourceStatus === 'official-document-list-only' ? (entry.officialAttachmentNames?.length ? `Tệp mẫu được liệt kê: ${entry.officialAttachmentNames.join('; ')}` : 'Cờ bắt buộc chưa được nguồn công khai xác nhận') : entry.required?'Bắt buộc':'Tùy trường hợp / không bắt buộc'}</small></div>)}{selected.submission.fields.length+selected.submission.documents.length>12&&<small>Hiển thị 12 mục đầu; mở nguồn chính thức để xem toàn bộ.</small>}</div>{selected.submission.sourceStatus === 'official-document-list-only' ? <a className="source-link text-link" href={selected.submission.formSourceUrl || selected.submission.sourceUrl} target="_blank" rel="noreferrer">{selected.submission.formSourceLabel || 'Mở thành phần hồ sơ trên nguồn chính thức ↗'}</a> : <><a className="source-link text-link" href={selected.submission.sourceUrl} target="_blank" rel="noreferrer">Mở nguồn thủ tục ↗</a>{selected.submission.formSourceUrl&&<a className="source-link text-link" href={selected.submission.formSourceUrl} target="_blank" rel="noreferrer">{selected.submission.formSourceLabel || 'Mở nguồn biểu mẫu ↗'}</a>}</>}</section> : <div className="routing-evidence warning"><b>Chưa cấu hình biểu mẫu tiếp nhận trong ứng dụng</b><p>Danh mục có thông tin tham chiếu nhưng chưa đủ căn cứ để nhận hồ sơ điện tử cho thủ tục này. Ứng dụng sẽ không tự dựng tờ khai hoặc thành phần hồ sơ còn thiếu.</p></div>}
          <div className={`routing-evidence ${selected.localEdit || selected.categoryEdit || selected.routing?.status==='catalog-reference-only' || selected.routing?.status==='unverified'?'warning':'confirmed'}`}><b>{sourceStatus(selected)}</b><p>{selected.localEdit ? `Đã cập nhật tại ứng dụng bởi ${selected.localEdit.updatedBy}, phiên bản ${selected.localEdit.version}. Cần cơ quan nghiệp vụ đối chiếu trước khi dùng.` : selected.categoryEdit ? `Lĩnh vực được cập nhật nội bộ bởi ${selected.categoryEdit.updatedBy}, phiên bản ${selected.categoryEdit.version}. Cần cơ quan nghiệp vụ đối chiếu trước khi dùng.` : selected.routing?.summary || 'Bản ghi lấy từ danh mục tham chiếu; cần chọn địa bàn/cơ quan và xác minh trên Cổng quốc gia trước khi hướng dẫn giao dịch.'}</p>{selected.localEdit&&<small>Ngày đối chiếu khai báo: {toDate(selected.localEdit.checkedAt)} · Lưu lúc {toDate(selected.localEdit.updatedAt)}</small>}{selected.categoryEdit&&<small>Ngày đối chiếu khai báo: {toDate(selected.categoryEdit.checkedAt)} · Lưu lúc {toDate(selected.categoryEdit.updatedAt)}</small>}{selected.routing?.checkedAt&&!selected.localEdit&&!selected.categoryEdit&&<small>Mốc đối chiếu: {toDate(selected.routing.checkedAt)}</small>}</div>
          {(selected.localEdit?.sourceUrl || selected.categoryEdit?.sourceUrl || selected.routing?.officialUrl)&&<a className="button secondary source-link" href={selected.localEdit?.sourceUrl || selected.categoryEdit?.sourceUrl || selected.routing?.officialUrl} target="_blank" rel="noreferrer">Mở nguồn công khai ↗</a>}
          {canManage&&<div className="catalog-history-control"><button className="text-button" onClick={toggleHistory}>{showHistory?'Ẩn lịch sử':'Xem lịch sử chỉnh sửa'}</button>{showHistory&&<div className="catalog-history-list">{history.length?history.map(entry=><article key={`${entry.createdAt}-${entry.actor}`}><b>Phiên bản {String(entry.after.version ?? '—')} · {entry.actor}</b><time>{toDate(entry.createdAt)}</time><p>{entry.reason}</p></article>):<p>Thủ tục này chưa có lần chỉnh sửa nội bộ.</p>}</div>}</div>}
        </> : <div className="catalog-placeholder"><h2>Chưa có thủ tục phù hợp</h2><p>Thay điều kiện tìm kiếm để xem chi tiết bản ghi.</p></div>}
        {notice&&!editing&&<p className="form-notice" role="status">{notice}</p>}
      </aside>
    </div>
  </div>
}

function CaseActivityLog({ cases, onOpen }: { cases: CaseFile[]; onOpen: (item: CaseFile) => void }) {
  const [query, setQuery] = useState('')
  const [audience, setAudience] = useState('all')
  const events = useMemo(() => caseEvents(cases).filter(event => {
    const term = query.trim().toLocaleLowerCase('vi')
    return (audience==='all'||event.audience===audience) && (!term||`${event.code} ${event.title} ${event.actor} ${event.detail} ${event.procedureName}`.toLocaleLowerCase('vi').includes(term))
  }), [cases, query, audience])
  return <div className="activity-workspace"><section className="panel activity-controls"><label><span>Tìm trong nhật ký</span><input className="search-input" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Mã hồ sơ, thao tác, cán bộ…" /></label><label><span>Phạm vi sự kiện</span><select value={audience} onChange={e=>setAudience(e.target.value)}><option value="all">Công khai và nội bộ</option><option value="public">Sự kiện hiển thị cho người nộp</option><option value="internal">Sự kiện nội bộ</option></select></label><div className="catalog-count"><b>{events.length.toLocaleString('vi-VN')}</b><small>sự kiện có thể xem</small></div></section>
    <section className="panel activity-panel"><PanelHeading kicker="NHẬT KÝ THEO HỒ SƠ" title="Dòng thời gian xử lý" description="Mỗi sự kiện gắn với một hồ sơ; quyền xem hồ sơ được máy chủ kiểm tra trước." /><div className="activity-table-head"><span>Mốc thời gian</span><span>Sự kiện và hồ sơ</span><span>Người thực hiện</span><span>Phạm vi</span></div>{events.length ? <div className="activity-list">{events.map((event,index)=><article className="activity-row" key={`${event.code}-${event.at}-${index}`}><time>{toDate(event.at)}</time><div><b>{event.title}</b><button className="activity-case-link" onClick={() => { const item = cases.find(record => record.code === event.code); if (item) onOpen(item) }}>{event.code} · {event.procedureName}</button><p>{event.detail || 'Không có nội dung chi tiết.'}</p></div><span>{event.actor || 'Không rõ'}<small>{roleNames[event.role || ''] || event.role || 'Hệ thống'}</small></span><span className={`activity-audience ${event.audience==='internal'?'internal':'public'}`}>{event.audience==='internal'?'Nội bộ':'Theo dõi hồ sơ'}</span></article>)}</div> : <div className="empty-state">Chưa có sự kiện phù hợp trong phạm vi dữ liệu được cấp.</div>}</section>
  </div>
}

type SandboxPayment = { transactionRef: string; caseCode: string; caseVersion: number; procedureCode: string; agency: string; caseStatus: string; amount: number; status: string; basis: string; createdAt: string; reconciledAt?: string; mode: string; method?: string; payerReference?: string; reconciliationReference?: string; events?: { action: string; actor_name: string; detail: string; created_at: string }[]; refund?: { status: string; reason: string; requested_by: string; requested_at: string; review_note: string; execution_reference?: string; executed_at?: string } | null }
type SandboxSigner = { id: string; full_name: string; email: string; agency_scope: string; valid_from: string; valid_until: string; authority_ref?: string; reason?: string; effective: boolean }

function ServiceConnections({ user, data, onNavigate }: { user: User; data: Bootstrap; onNavigate: (page: string) => void }) {
  const outbox = data.outbox || []
  const errorCount = outbox.filter(item=>item.status==='ERROR').length
  const pendingCount = outbox.filter(item=>item.status==='PENDING').length
  const services = [
    { name:'Cổng Dịch vụ công quốc gia', category:'Tiếp nhận và trao đổi hồ sơ', detail:'Ứng dụng hiện hướng người dân tới cổng chính thức, chưa nhận hồ sơ trực tiếp từ Cổng quốc gia.', prerequisites:['Hợp đồng/API được cơ quan đầu mối cấp','Thông tin xác thực và môi trường kiểm thử','Quy tắc đối soát mã hồ sơ và trạng thái'] },
    { name:'Dịch vụ ký số', category:'Ký và xác minh kết quả', detail:'Chưa tích hợp nhà cung cấp chữ ký số. Luồng Ed25519 cục bộ vẫn có thể cấp quyền, ký nội dung đã duyệt và kiểm tra toàn vẹn trong sandbox.', prerequisites:['Nhà cung cấp và chứng thư số được phê duyệt','Môi trường ký thử, quy trình ký và xác minh','Thẩm quyền ký và nhật ký bàn giao'] },
    { name:'Thanh toán và hoàn phí', category:'Thu, đối soát và hoàn', detail:'Cổng thanh toán thật chưa kết nối. Sổ khoản thu ghi nhận thông tin người nộp khai, đối chiếu chứng từ, duyệt đề nghị hoàn và lưu chứng từ thực hiện hoàn.', prerequisites:['Đơn vị trung gian thanh toán được chấp thuận','API, khóa bí mật và cấu hình đối soát','Quy trình xử lý giao dịch lỗi/hoàn tiền'] },
    { name:'Thông báo và giao kết quả', category:'Thông báo, bưu chính, kho nhận', detail:'Ứng dụng chưa gửi SMS, email, bưu chính hoặc xác nhận giao kết quả.', prerequisites:['Nhà cung cấp và tài khoản gửi được phê duyệt','Mẫu thông điệp, kênh nhận và chính sách bảo vệ dữ liệu','Biên nhận giao nhận có thể đối soát'] },
  ]
  const storage = data.storage
  const [payments, setPayments] = useState<SandboxPayment[]>([])
  const [signers, setSigners] = useState<SandboxSigner[]>([])
  const [signerId, setSignerId] = useState('')
  const [authorityRef, setAuthorityRef] = useState('')
  const [authorityReason, setAuthorityReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const loadOperations = useCallback(async () => {
    if (user.role === 'finance' || user.role === 'admin') {
      const result = await api<{ payments: SandboxPayment[] }>('/api/payments')
      setPayments(result.payments)
    }
    if (user.role === 'admin') {
      const result = await api<{ signers: SandboxSigner[] }>('/api/sandbox-signers')
      setSigners(result.signers)
      setSignerId(current => current || result.signers.find(person => !person.effective)?.id || result.signers[0]?.id || '')
    }
  }, [user.role])
  useEffect(() => { void loadOperations().catch(reason => setError(reason instanceof Error ? reason.message : 'Không tải được thông tin thanh toán/quyền ký.')) }, [loadOperations])
  async function changeSigner(action: 'grant' | 'revoke', targetId = signerId, revokeReason = '') {
    setBusy(true); setError(''); setNotice('')
    try {
      await api('/api/sandbox-signers', { action, userId: targetId, authorityRef, reason: revokeReason || authorityReason })
      setAuthorityRef(''); setAuthorityReason(''); await loadOperations(); setNotice(action === 'grant' ? 'Đã cấp quyền ký thử nghiệm cho tài khoản lãnh đạo.' : 'Đã thu hồi quyền ký thử nghiệm.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không cập nhật được quyền ký.') }
    finally { setBusy(false) }
  }
  return <div className="connections-workspace">
    <AdministrativeServiceDesk user={user} procedures={data.procedures} request={api} />
    {error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="citizen-success" role="status">{notice}</div>}
    {(user.role === 'admin' || user.role === 'finance') && <section className="panel sandbox-payment-workspace"><PanelHeading kicker="NGHIỆP VỤ TÀI CHÍNH CỤC BỘ" title="Giao dịch, đối soát và hoàn thử nghiệm" description="Dữ liệu được lưu trong SQLite của ứng dụng. Mọi thao tác ở đây chỉ thay đổi bản ghi sandbox, không gọi ngân hàng hoặc chuyển tiền." /><div className="sandbox-payment-summary"><MetricCard label="Tổng giao dịch" value={payments.length} note="Trong phạm vi được phép xem" tone="navy"/><MetricCard label="Chờ đối soát" value={payments.filter(item=>item.status==='PAID').length} note="Chờ đối chiếu chứng từ" tone="amber"/><MetricCard label="Đang chờ hoàn" value={payments.filter(item=>item.refund?.status==='PENDING').length} note="Cần người khác xem xét" tone="red"/></div>{payments.length ? <div className="sandbox-payment-list">{payments.map(payment=><SandboxPaymentRow key={payment.transactionRef} payment={payment} user={user} onChanged={async message=>{ await loadOperations(); setNotice(message) }} />)}</div> : <div className="connection-empty-state"><b>Chưa có giao dịch trong phạm vi này</b><p>Cán bộ tiếp nhận cấu hình khoản thu có căn cứ trên hồ sơ; người nộp tạo giao dịch tại trang tra cứu.</p></div>}</section>}
    {user.role === 'admin' && <section className="panel sandbox-signer-workspace"><PanelHeading kicker="THẨM QUYỀN NỘI BỘ" title="Quản lý quyền ký thử nghiệm" description="Quyền riêng, cấp/thu hồi có căn cứ và lưu nhật ký. Không thay thế quyết định phân công hay chứng thư số công vụ." />{error && <div className="form-error" role="alert">{error}</div>}{notice && <div className="citizen-success" role="status">{notice}</div>}<form className="sandbox-signer-form" onSubmit={event=>{event.preventDefault();void changeSigner('grant')}}><label>Lãnh đạo<select value={signerId} onChange={event=>setSignerId(event.target.value)} required><option value="">Chọn tài khoản lãnh đạo</option>{signers.map(person=><option key={person.id} value={person.id}>{person.full_name} · {person.agency_scope} · {person.effective?'đang có quyền':'chưa có quyền'}</option>)}</select></label><label>Căn cứ văn bản cấp quyền<input value={authorityRef} onChange={event=>setAuthorityRef(event.target.value)} minLength={4} maxLength={180} required placeholder="Số văn bản phân quyền nội bộ" /></label><label>Lý do và phạm vi<input value={authorityReason} onChange={event=>setAuthorityReason(event.target.value)} minLength={12} maxLength={1200} required placeholder="Nêu lý do cấp quyền thử nghiệm" /></label><button className="button primary" disabled={busy||!signerId}>{busy?'Đang lưu…':'Cấp quyền ký thử nghiệm'}</button></form>{signers.length ? <div className="sandbox-signer-list">{signers.map(person=><article key={person.id}><div><b>{person.full_name}</b><span>{person.agency_scope} · {person.email}</span><small>{person.authority_ref ? `Căn cứ: ${person.authority_ref} · ${person.reason||''}` : 'Chưa có quyền ký thử nghiệm'}</small></div><span>{person.effective?'Đang hiệu lực':'Không hoạt động'}</span>{person.authority_ref && <button type="button" className="button secondary" disabled={busy||!person.effective} onClick={()=>{setSignerId(person.id);void changeSigner('revoke',person.id,'Thu hồi quyền ký thử nghiệm theo rà soát quản trị.')}}>Thu hồi</button>}</article>)}</div>:<div className="connection-empty-state">Chưa có tài khoản lãnh đạo để cấp quyền ký.</div>}</section>}
    <section className="panel connection-state-banner"><div><span className="ops-kicker">KẾT NỐI NỘI BỘ</span><h2>{storage?.database==='connected'?'API và cơ sở dữ liệu đang hoạt động':'Chưa xác nhận được kết nối cơ sở dữ liệu'}</h2><p>{storage?.database==='connected'?'Dữ liệu dưới đây vừa được đọc từ máy chủ ứng dụng và SQLite cục bộ. Đây là kết nối nội bộ, không đồng nghĩa với liên thông hệ thống Chính phủ.':'Không đọc được trạng thái từ máy chủ. Tải lại dữ liệu hoặc kiểm tra tiến trình backend.'}</p></div><span className={`environment-badge ${storage?.database==='connected'?'environment-connected':'environment-disconnected'}`}>{storage?.database==='connected'?'Đã kết nối nội bộ':'Mất kết nối'}</span></section>
    <section className="local-data-grid" aria-label="Dữ liệu đang lưu cục bộ"><article><span>Thủ tục tham chiếu</span><b>{(storage?.procedureCount ?? data.procedures.length).toLocaleString('vi-VN')}</b><small>Tệp danh mục trong dự án; chưa đồng bộ trực tuyến</small><button className="text-button" onClick={()=>onNavigate('procedures')}>Mở danh mục và chi tiết →</button></article><article><span>Hồ sơ đã lưu</span><b>{(storage?.caseRecords ?? data.cases.length).toLocaleString('vi-VN')}</b><small>{storage?.caseCountScope || 'Phạm vi được cấp'} · cơ sở dữ liệu hiện tại</small><a className="text-link" href="/nop-ho-so">Mở luồng nộp hồ sơ →</a></article><article><span>Tin đang công khai</span><b>{(storage?.publishedNews ?? 0).toLocaleString('vi-VN')}</b><small>Nội dung đã lưu tại ứng dụng</small></article></section>
    <section className="panel external-boundary"><h2>Các dịch vụ bên ngoài</h2><p>Các kết nối này chưa được thiết lập. Cần hợp đồng, thông tin truy cập và quy trình kiểm thử do cơ quan/nhà cung cấp cấp; ứng dụng không tự dò hoặc giả lập kết nối thật.</p></section>
    <div className="integration-cards">{services.map(service=><article className="panel integration-card" key={service.name}><div className="integration-card-top"><span className="ops-kicker">{service.category}</span><span className="connection-state-text">Chưa kết nối</span></div><h3>{service.name}</h3><p>{service.detail}</p><div className="integration-prerequisites"><b>Điều kiện cần cấu hình</b><ul>{service.prerequisites.map(item=><li key={item}>{item}</li>)}</ul></div></article>)}</div>
    <section className="panel integration-summary"><PanelHeading kicker="THEO DÕI TÁC VỤ" title="Hàng chờ đồng bộ bên ngoài" description="Các mục chỉ xuất hiện khi ứng dụng đã ghi nhận tác vụ. Chúng không thay thế biên nhận từ hệ thống đích." action={<button className="text-button" onClick={()=>onNavigate('monitoring')}>Mở giám sát quy trình →</button>} /><div className="outbox-summary"><MetricCard label="Tổng tác vụ" value={outbox.length} note="Bản ghi hàng chờ đọc từ ứng dụng" tone="navy"/><MetricCard label="Đang chờ" value={pendingCount} note="Chưa được bên nhận xác nhận" tone="amber"/><MetricCard label="Có lỗi" value={errorCount} note="Cần xem lại chi tiết tác vụ" tone="red"/></div>{outbox.length ? <div className="outbox-list">{outbox.map(row=><div className="outbox-row" key={row.code}><b>{row.code}</b><span>{row.status}</span><span>{row.attempts} lần thử</span><small>{row.lastError||'Bản ghi hàng chờ cục bộ; chưa phải xác nhận giao nhận bên ngoài.'}</small></div>)}</div> : <div className="connection-empty-state"><b>Chưa có tác vụ đồng bộ</b><p>Hiện chưa có dịch vụ ngoài nào được kết nối để nhận hồ sơ hoặc phản hồi trạng thái.</p></div>}</section>
    <section className="panel integration-boundary"><b>Điều kiện mở kết nối</b><p>Đơn vị quản lý cần cấp đầu mối, hợp đồng giao tiếp, thông tin xác thực môi trường thử, quy tắc chống gửi lặp và quy trình đối soát. Sau khi có các căn cứ này mới có thể cấu hình và kiểm thử từng dịch vụ.</p></section>
  </div>
}
function SandboxPaymentRow({ payment, user, onChanged }: { payment: SandboxPayment; user: User; onChanged: (message: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [statementReference, setStatementReference] = useState('')
  const [executionReference, setExecutionReference] = useState('')
  async function act(action: string, payload: Record<string, unknown>, message: string) {
    setBusy(true); setError('')
    try { await api(`/api/payments/${encodeURIComponent(payment.transactionRef)}/${action}`, payload); await onChanged(message) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thực hiện được thao tác giao dịch.') }
    finally { setBusy(false) }
  }
  const terminalCase = ['DUNG', 'TU_CHOI', 'KHONG_GIAI_QUYET'].includes(payment.caseStatus)
  const ownRefund = payment.refund?.requested_by === user.id
  return <article className="sandbox-payment-row"><header><div><b>{payment.transactionRef}</b><span>Hồ sơ {payment.caseCode} · {payment.procedureCode}</span></div><strong>{Number(payment.amount).toLocaleString('vi-VN')} đồng</strong></header><div className="sandbox-payment-facts"><span>Trạng thái: <b>{({PENDING:'Chờ xác nhận',PAID:'Người nộp khai đã thanh toán · chờ đối soát',RECONCILED:'Đã đối soát nội bộ',REFUNDED:'Đã ghi nhận chứng từ hoàn'} as Record<string,string>)[payment.status]||payment.status}</b></span><span>{payment.agency}</span><span>{toDate(payment.createdAt)}</span></div><p>{payment.basis}</p><small>Sổ theo dõi trong hệ thống; trạng thái được cập nhật từ khai báo và đối chiếu chứng từ.</small>{payment.refund && <div className="sandbox-refund-status"><b>Đề nghị hoàn: {payment.refund.status === 'PENDING' ? 'Đang chờ xem xét' : payment.refund.status === 'APPROVED' ? 'Đã duyệt, chờ thực hiện hoàn' : payment.refund.status === 'EXECUTED' ? 'Đã ghi nhận thực hiện hoàn' : 'Đã từ chối'}</b><p>{payment.refund.reason}</p>{payment.refund.review_note && <small>Ý kiến: {payment.refund.review_note}</small>}</div>}{error && <div className="form-error" role="alert">{error}</div>}
    {!!payment.events?.length && <details className="sandbox-payment-events"><summary>Lịch sử giao dịch ({payment.events.length} sự kiện)</summary><ol>{payment.events.map((event,index)=><li key={`${event.created_at}-${index}`}><b>{({CREATED:'Tạo giao dịch',SANDBOX_CONFIRMED:'Xác nhận thử nghiệm cũ',PAID_DECLARED:'Người nộp khai chứng từ',REFUND_EXECUTED:'Ghi nhận thực hiện hoàn',RECONCILED:'Đối soát nội bộ',REFUND_REQUESTED:'Lập đề nghị hoàn',REFUND_APPROVED:'Duyệt đề nghị hoàn',REFUND_REJECTED:'Từ chối đề nghị hoàn'} as Record<string,string>)[event.action]||event.action}</b><time>{toDate(event.created_at)} · {event.actor_name}</time><p>{event.detail}</p></li>)}</ol></details>}
    {user.role === 'finance' && payment.status === 'PAID' && <div className="sandbox-payment-action form-grid account-form"><label>Số chứng từ thu / dòng đối chiếu<input value={statementReference} onChange={event=>setStatementReference(event.target.value)} minLength={4} maxLength={180} required /></label><button className="button primary" disabled={busy||statementReference.trim().length<4} onClick={()=>void act('reconcile',{expectedVersion:payment.caseVersion,statementReference},'Đã đối chiếu chứng từ và ghi sổ khoản thu.')}>{busy?'Đang xử lý…':'Đối chiếu chứng từ khoản thu'}</button></div>}
    {user.role === 'finance' && payment.status === 'RECONCILED' && terminalCase && (!payment.refund || payment.refund.status === 'REJECTED') && <details className="sandbox-payment-action"><summary>Lập đề nghị hoàn</summary><label>Căn cứ đề nghị<textarea value={reason} onChange={event=>setReason(event.target.value)} minLength={12} maxLength={1200} rows={3} required /></label><button className="button secondary" disabled={busy||reason.trim().length<12} onClick={()=>void act('refund-request',{reason},'Đã lập đề nghị hoàn, chờ một cán bộ tài chính khác xem xét.')}>Gửi đề nghị</button></details>}
    {user.role === 'finance' && payment.refund?.status === 'PENDING' && ownRefund && <p className="field-help">Tài khoản đã lập đề nghị này; cần cán bộ tài chính khác xem xét.</p>}
    {user.role === 'finance' && payment.refund?.status === 'PENDING' && !ownRefund && <details className="sandbox-payment-action"><summary>Xem xét đề nghị hoàn</summary><label>Ý kiến xem xét<textarea value={reviewNote} onChange={event=>setReviewNote(event.target.value)} minLength={8} maxLength={1200} rows={3} required /></label><div className="form-actions"><button className="button primary" disabled={busy||reviewNote.trim().length<8} onClick={()=>void act('refund-review',{decision:'APPROVE',note:reviewNote,expectedVersion:payment.caseVersion},'Đã duyệt đề nghị; chờ chứng từ thực hiện hoàn.')}>Duyệt đề nghị hoàn</button><button className="button secondary" disabled={busy||reviewNote.trim().length<8} onClick={()=>void act('refund-review',{decision:'REJECT',note:reviewNote},'Đã từ chối đề nghị hoàn trong ứng dụng.')}>Từ chối</button></div></details>}
    {user.role === 'finance' && payment.refund?.status === 'APPROVED' && <div className="sandbox-payment-action form-grid account-form"><label>Số chứng từ thực hiện hoàn<input value={executionReference} onChange={event => setExecutionReference(event.target.value)} minLength={4} maxLength={180} required /></label><button className="button primary" disabled={busy || executionReference.trim().length < 4} onClick={() => void act('refund-execute', { expectedVersion: payment.caseVersion, executionReference }, 'Đã ghi nhận chứng từ thực hiện hoàn.')}>Ghi nhận thực hiện hoàn</button></div>}
    {payment.refund?.execution_reference && <p>Chứng từ thực hiện hoàn: {payment.refund.execution_reference} · {toDate(payment.refund.executed_at)}</p>}

  </article>
}

function StaffLookupKey({ item, onChanged }: { item: CaseFile; onChanged: () => Promise<void> }) {
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rotateOpen, setRotateOpen] = useState(false)
  const [notice, setNotice] = useState('')
  async function operate(action: 'reveal' | 'rotate') {
    setBusy(true); setError(''); setNotice('')
    try { const result = await api<{accessKey:string}>(`/api/cases/${encodeURIComponent(item.code)}/lookup-key`, {action,expectedVersion:item.version}); setSecret(result.accessKey); setRotateOpen(false); await onChanged(); if (action === 'rotate') setNotice('Đã cấp khóa mới. Khóa cũ không còn dùng để tra cứu hoặc bổ sung hồ sơ.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Không lấy được khóa tra cứu.') }
    finally { setBusy(false) }
  }
  async function copy() { try { await navigator.clipboard.writeText(`Mã hồ sơ: ${item.code}\nKhóa tra cứu: ${secret}`); setNotice('Đã sao chép mã hồ sơ và khóa. Chỉ cung cấp cho đúng chủ hồ sơ sau khi xác minh.') } catch { setError('Trình duyệt không cho phép sao chép. Hãy chọn và sao chép thủ công.') } }
  return <section className="staff-lookup-key"><h3>Mã hồ sơ và khóa tra cứu</h3><p>Chỉ cung cấp cho chủ hồ sơ hoặc người đại diện hợp lệ sau khi xác minh. Mỗi lần xem hoặc cấp lại được ghi vào nhật ký nội bộ.</p><label>Mã hồ sơ<input readOnly value={item.code} /></label>{secret && <label>Khóa tra cứu<input readOnly value={secret} spellCheck={false} autoComplete="off" /></label>}<div className="credential-actions"><button type="button" className="button secondary" disabled={busy} onClick={()=>secret ? setSecret('') : operate('reveal')}>{secret ? 'Ẩn khóa' : busy ? 'Đang lấy khóa…' : 'Xem khóa tra cứu'}</button>{secret && <button type="button" className="button primary" onClick={copy}>Sao chép mã và khóa</button>}<button type="button" className="text-button" disabled={busy} onClick={()=>setRotateOpen(!rotateOpen)}>Cấp lại khóa</button></div>{rotateOpen && <div className="credential-confirm"><p>Cấp khóa mới sẽ vô hiệu hóa khóa cũ. Cần cung cấp lại cho chủ hồ sơ.</p><button type="button" className="button primary" disabled={busy} onClick={()=>operate('rotate')}>Xác nhận cấp khóa mới</button><button type="button" className="button secondary" onClick={()=>setRotateOpen(false)}>Hủy</button></div>}{error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status">{notice}</p>}</section>
}

function CaseDetail({ item, isStaff, signingAuthorityRef, labels, actionOptions, action, setAction, actionText, setActionText, assignee, setAssignee, staff, busy, onSubmitAction, onLookupKeyChanged, onBack }: { item: CaseFile; isStaff: boolean; signingAuthorityRef: string; labels: Record<string, string>; actionOptions: { value: string; label: string }[]; action: string; setAction: (s: string) => void; actionText: string; setActionText: (s: string) => void; assignee: string; setAssignee: (s: string) => void; staff: { id: string; name: string; role: string }[]; busy: boolean; onSubmitAction: (e: FormEvent<HTMLFormElement>) => void; onLookupKeyChanged: () => Promise<void>; onBack: () => void }) {
  const reasonActions = ['request_supplement', 'reject_intake', 'send_back', 'decline', 'waive_fee', 'prepare_stop_notice', 'set_fee', 'digitize_documents']
  const needsReason = reasonActions.includes(action) || ['save_draft', 'submit_review', 'approve', 'submit_supplement'].includes(action)
  const pendingNotice = item.withdrawal?.status === 'CHO_KY_PHAT_HANH'
  const [todayInHanoi] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  const [noticeHeader, setNoticeHeader] = useState<Record<string, string>>(() => ({
    authorityName: item.withdrawal?.noticeDraft?.authorityName || '',
    serviceOfficeName: item.withdrawal?.noticeDraft?.serviceOfficeName || '',
    noticeLocation: item.withdrawal?.noticeDraft?.noticeLocation || '',
    noticeDate: item.withdrawal?.noticeDraft?.issueDate || todayInHanoi, noticeNumber: '', collectionOffice: '',
  }))
  const updateNoticeHeader = (key: string, value: string) => setNoticeHeader(current => ({ ...current, [key]: value }))
  return <div className="detail-layout">
    <section className="panel detail-main">
      <button className="back-link" onClick={onBack}>← Quay lại danh sách</button>
      <div className="detail-heading"><div><span className="eyebrow">{item.procedureCode} · {item.code}</span><h2>{item.procedure?.name}</h2></div><span className={`status-pill status-${item.status}`}>{labels[item.status] || item.status}</span></div>
      {item.sampleData && <aside className="sample-data-notice case-sample-note" role="note"><b>Hồ sơ tình huống mô phỏng</b><span>{item.sampleDataNote || 'Thông tin được tạo để thực hành; không phải hồ sơ thật và không có giá trị pháp lý hoặc báo cáo chính thức.'}</span></aside>}
      {isStaff && item.canManageLookupKey && <StaffLookupKey key={item.code} item={item} onChanged={onLookupKeyChanged} />}
      <div className="detail-facts"><div><small>Người nộp</small><b>{item.applicant?.name}</b></div><div><small>Ngày gửi</small><b>{toDate(item.createdAt)}</b></div><div><small>Thời hạn</small><b>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</b></div><div><small>Người có thông tin</small><b>{item.subject?.name}</b></div></div>
      <CaseDeclaration item={item} />
      {item.requestSummary && <section className="citizen-case-section"><h3>Nội dung đề nghị của người nộp</h3><p>{item.requestSummary}</p></section>}
      {item.supplement?.reason && <div className="source-warning"><b>Yêu cầu bổ sung:</b> {item.supplement.reason}</div>}
      {pendingNotice && <div className="source-warning"><b>Đã nhận yêu cầu dừng ngày {toDate(item.withdrawal.requestReceivedAt)}.</b> Trạng thái hồ sơ vẫn được giữ nguyên, chờ người có thẩm quyền ký và phát hành Mẫu 06.</div>}
      {pendingNotice && item.withdrawal.noticeDraft && <Mau06Draft draft={{ ...item.withdrawal.noticeDraft, ...noticeHeader }} />}
      {item.withdrawal?.status === 'DA_PHAT_HANH' && <div className="source-warning"><b>Đã phát hành Thông báo dừng Mẫu 06 số {item.withdrawal.noticeNumber}.</b> Kênh gửi: {item.withdrawal.noticeDelivery?.channel === 'BUU_CHINH' ? 'Bưu chính' : 'Trực tiếp'} · {item.withdrawal.noticeDelivery?.reference}{item.withdrawal.noticeDocument?.downloadUrl && <p><a href={item.withdrawal.noticeDocument.downloadUrl}>Tải Thông báo dừng Mẫu 06 đã ký</a></p>}</div>}
      {item.withdrawal?.status === 'KHONG_DU_DIEU_KIEN' && <div className="source-warning"><b>Không phát hành Mẫu 06:</b> {item.withdrawal.ineligibleReason}</div>}
      {item.fee?.amount && <section className="panel case-fee-record"><h3>Khoản thu trong ứng dụng</h3><p><b>{Number(item.fee.amount).toLocaleString('vi-VN')} đồng</b> · {item.fee.basis}</p><p>Trạng thái: {({ DUE: 'Chờ thanh toán', PAID: 'Chờ đối soát', RECONCILED: 'Đã đối soát nội bộ', WAIVED: 'Đã miễn', REFUNDED: 'Đã ghi nhận hoàn thử nghiệm' } as Record<string, string>)[item.fee.status] || item.fee.status}</p><small>Môi trường LOCAL_SANDBOX; không thu tiền thật và không thay thế cổng thanh toán được cơ quan phê duyệt.</small></section>}
      {item.sandboxSignature && <div className={item.sandboxSignature.verified ? 'citizen-success' : 'form-error'}><b>{item.sandboxSignature.verified ? 'Chữ ký thử nghiệm hợp lệ' : 'Chữ ký thử nghiệm không hợp lệ'}</b><p>{item.sandboxSignature.signer} · {toDate(item.sandboxSignature.signedAt)} · SHA-256 {item.sandboxSignature.documentHash}</p><small>Chữ ký cục bộ chỉ kiểm tra toàn vẹn, không phải chữ ký số công vụ.</small></div>}
      {item.status === 'DA_PHE_DUYET' && !item.sandboxSignature && <div className="source-warning"><b>Kết quả đã được phê duyệt.</b> {item.approvedAt && item.approvedById && String(item.draftResult || '').trim().length >= 10 ? 'Lãnh đạo có quyền ký thử nghiệm có thể ký bản đã chốt; văn thư chỉ phát hành sau khi chữ ký và khoản thu (nếu có) được xác nhận trong ứng dụng.' : 'Hồ sơ chưa đủ thông tin dự thảo hoặc căn cứ phê duyệt để ký. Hãy kiểm tra lịch sử và bổ sung dữ liệu phê duyệt hợp lệ trước khi tiếp tục.'}</div>}
      {item.events?.length > 0 && <div className="timeline"><h3>Lịch sử xử lý</h3>{item.events.map((event, i) => <div className="timeline-item" key={`${event.at}-${i}`}><span className="timeline-dot" /><div><b>{event.title}</b><small>{toDate(event.at)}</small>{event.audience !== 'internal' && <p>{event.detail}</p>}</div></div>)}</div>}
      {(isStaff || actionOptions.length > 0) && <div className="action-panel"><h3>{isStaff ? 'Thao tác theo vai trò' : 'Gửi bổ sung hồ sơ'}{pendingNotice && ' · yêu cầu dừng'}</h3>
        {actionOptions.length ? <form onSubmit={onSubmitAction}>
          <label>Thao tác<select value={action} onChange={e => { setAction(e.target.value); setActionText('') }} required><option value="">Chọn thao tác</option>{actionOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {action === 'assign' && <label>Chuyên viên được phân công<select value={assignee} onChange={e => setAssignee(e.target.value)} required><option value="">Chọn chuyên viên</option>{staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
          {action === 'digitize_documents' && <label>Số trang đã quét<input name="pageCount" type="number" min="1" max="500" required /></label>}
          {action === 'set_fee' && <label>Số tiền (đồng)<input name="feeAmount" type="number" min="1" max="100000000" step="1" required /></label>}
          {needsReason && <label>{['save_draft', 'submit_review'].includes(action) ? 'Dự thảo kết quả' : action === 'submit_supplement' ? 'Nội dung bổ sung' : action === 'request_supplement' ? 'Nội dung cần bổ sung (mỗi ý một dòng, nêu rõ căn cứ)' : action === 'prepare_stop_notice' ? 'Lý do đề nghị dừng theo Mẫu 05' : action === 'digitize_documents' ? 'Danh mục giấy tờ đối chiếu với bản gốc' : action === 'set_fee' ? 'Căn cứ và nguồn xác định khoản thu' : 'Nội dung / căn cứ'}<textarea value={actionText} onChange={e => setActionText(e.target.value)} rows={5} required minLength={['save_draft', 'submit_review'].includes(action) ? 10 : action === 'request_supplement' || action === 'set_fee' ? 15 : action === 'prepare_stop_notice' ? 8 : 3} /></label>}
          {action === 'sign_result' && <p className="source-warning small-warning">Tạo chữ ký Ed25519 thử nghiệm gắn với nội dung đã duyệt. Chỉ dùng kiểm tra luồng và tính toàn vẹn; không có chứng thư số công vụ và không tạo hiệu lực pháp lý.</p>}
          {action === 'issue' && <label>Số kết quả nội bộ thử nghiệm<input name="resultNumber" required minLength={3} maxLength={100} placeholder="SBX-2026-001" /></label>}
          {action === 'deliver' && <><label>Người nhận kết quả<input name="deliveryReceiver" required minLength={2} maxLength={180} defaultValue={item.applicant?.name || ''} /></label><label>Kênh trả<select name="deliveryChannel" required defaultValue=""><option value="" disabled>Chọn kênh</option><option value="TRUC_TIEP">Trực tiếp</option><option value="BUU_CHINH">Bưu chính (ghi nhận nội bộ)</option><option value="DIEN_TU_SANDBOX">Điện tử thử nghiệm</option></select></label><label>Mã biên nhận/chứng cứ giao<input name="deliveryEvidence" required minLength={3} maxLength={180} /></label></>}
          {action === 'prepare_stop_notice' && <>
            <label>Kênh nhận yêu cầu<select name="stopChannel" required defaultValue=""><option value="" disabled>Chọn kênh</option><option value="TRUC_TIEP">Trực tiếp tại Bộ phận Một cửa</option><option value="BUU_CHINH">Bưu chính</option></select></label>
            <label>Người yêu cầu<select name="requesterType" required defaultValue=""><option value="" disabled>Chọn chủ thể</option><option value="SELF">Chủ thể hồ sơ</option><option value="REPRESENTATIVE">Người đại diện</option></select></label>
            <label>Họ tên người yêu cầu theo Mẫu 05<input name="requesterName" maxLength={150} minLength={2} defaultValue={item.applicant?.name || ''} required /></label>
            <label>Số định danh cá nhân/mã số tổ chức theo Mẫu 05<input name="requesterIdentifier" maxLength={80} minLength={3} required /></label>
            <label>Địa chỉ người yêu cầu theo Mẫu 05<input name="requesterAddress" maxLength={300} minLength={3} required /></label>
            <label>Số điện thoại theo Mẫu 05<input name="requesterPhone" type="tel" maxLength={40} /></label>
            <label>Email theo Mẫu 05<input name="requesterEmail" type="email" maxLength={254} /></label>
            <label>Mã biên nhận trực tiếp hoặc mã bưu gửi<input name="requestReference" maxLength={120} placeholder="Bắt buộc nếu nhận qua bưu chính" /></label>
            <label className="check-row"><input name="identityVerified" type="checkbox" required /> Đã đối chiếu danh tính người yêu cầu</label>
            <label className="check-row"><input name="authorizationVerified" type="checkbox" /> Nếu là người đại diện: đã đối chiếu giấy tờ chứng minh căn cứ đại diện</label>
            <label>Văn bản yêu cầu dừng Mẫu 05 đã ký (PDF, PNG hoặc JPG)<input name="supportingFiles" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required multiple /><small className="field-help">Nếu người yêu cầu là đại diện, chọn thêm tệp chứng minh căn cứ đại diện.</small></label>
            <p className="field-help">Yêu cầu trực tuyến được xử lý trên Cổng Dịch vụ công quốc gia. Nhận yêu cầu tại đây chưa làm hồ sơ chuyển trạng thái DỪNG.</p>
          </>}
          {action === 'issue_stop_notice' && <>
            <p className="source-warning small-warning">Quyền ký được cấp theo văn bản {signingAuthorityRef}. Chỉ ghi nhận phát hành sau khi Mẫu 06 đã được ký.</p>
            <p className="field-help">Điền đúng phần đầu biểu mẫu trước, xem bản in phía trên, ký theo quy trình của đơn vị rồi tải lên bản đã ký. Ứng dụng chỉ lưu bản và xác nhận của cán bộ; không xác minh chữ ký số.</p>
            <label>Tên cấp tỉnh/Bộ, ngành/cấp xã ghi ở đầu biểu mẫu<input name="authorityName" maxLength={180} minLength={2} value={noticeHeader.authorityName} onChange={e => updateNoticeHeader('authorityName', e.target.value)} required /></label>
            <label>Tên Trung tâm/Bộ phận Tiếp nhận và Trả kết quả<input name="serviceOfficeName" maxLength={180} minLength={2} value={noticeHeader.serviceOfficeName} onChange={e => updateNoticeHeader('serviceOfficeName', e.target.value)} required /></label>
            <label>Địa danh ban hành<input name="noticeLocation" maxLength={100} minLength={2} value={noticeHeader.noticeLocation} onChange={e => updateNoticeHeader('noticeLocation', e.target.value)} required /></label>
            <label>Ngày trên Mẫu 06<input name="noticeDate" type="date" min={item.withdrawal?.requestReceivedAt?.slice(0, 10)} max={todayInHanoi} value={noticeHeader.noticeDate} onChange={e => updateNoticeHeader('noticeDate', e.target.value)} required /></label>
            <label>Số văn bản đầy đủ theo sổ văn bản đi<input name="noticeNumber" type="text" inputMode="text" pattern="[0-9]{1,20}/[^/]{2,80}" maxLength={100} placeholder="12/TTPVHCC (BPTNTKQ)" value={noticeHeader.noticeNumber} onChange={e => updateNoticeHeader('noticeNumber', e.target.value)} required /><small className="field-help">Thay phần TBD của mẫu bằng đúng mã đơn vị được cơ quan sử dụng; số này phải khớp bản Mẫu 06 đã ký.</small></label>
            <label>Kênh gửi thông báo<select name="noticeDeliveryChannel" required defaultValue=""><option value="" disabled>Chọn kênh</option><option value="TRUC_TIEP">Trực tiếp</option><option value="BUU_CHINH">Bưu chính</option></select></label>
            <label>Biên nhận giao hoặc mã bưu gửi<input name="deliveryReference" maxLength={150} minLength={3} required /></label>
            <label>Đầu mối liên hệ nhận lại hồ sơ giấy và khoản đã nộp<input name="collectionOffice" maxLength={240} minLength={3} value={noticeHeader.collectionOffice} onChange={e => updateNoticeHeader('collectionOffice', e.target.value)} required /></label>
            <label className="check-row"><input name="signatureAttested" type="checkbox" required /> Tôi xác nhận bản Mẫu 06 đính kèm đã được người có thẩm quyền ký</label>
            <label>Bản Thông báo dừng Mẫu 06 đã ký<input name="supportingFiles" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required /><small className="field-help">Ứng dụng lưu bản ký và thông tin phát hành; không xác thực mật mã chữ ký số.</small></label>
          </>}
          {action === 'submit_supplement' && <label>Tài liệu bổ sung<input name="supportingFiles" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple /></label>}
          {action && !['prepare_stop_notice', 'issue_stop_notice', 'submit_supplement', 'set_fee', 'waive_fee', 'sign_result', 'issue', 'deliver'].includes(action) && <label>Tài liệu đính kèm (nếu cần)<input name="supportingFiles" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple /></label>}
          {action && <div className="form-actions"><button className="button primary" disabled={busy}>{busy ? 'Đang lưu…' : action === 'prepare_stop_notice' ? 'Ghi nhận yêu cầu và lập dự thảo Mẫu 06' : action === 'issue_stop_notice' ? 'Ghi nhận đã ký và phát hành Mẫu 06' : action === 'set_fee' ? 'Lưu khoản thu' : action === 'sign_result' ? 'Ký thử nghiệm nội dung đã duyệt' : action === 'issue' ? 'Phát hành kết quả thử nghiệm' : action === 'deliver' ? 'Ghi nhận trả kết quả' : action === 'waive_fee' ? 'Ghi nhận miễn khoản thu' : 'Xác nhận thao tác'}</button></div>}
        </form> : <p className="muted">Không có thao tác khả dụng cho vai trò này ở trạng thái hiện tại. Với hồ sơ chờ Mẫu 06, chỉ tài khoản được cấp riêng quyền ký mới có thể ghi nhận phát hành.</p>}
      </div>}
    </section>
    <aside className="panel detail-side"><h3>Thông tin hồ sơ</h3><div className="side-fact"><small>Cơ quan theo hồ sơ</small><b>{item.procedure?.agency}</b></div>{item.procedure?.routing && <div className="source-warning small-warning">{item.procedure.routing.summary} <a href={item.procedure.routing.officialUrl} target="_blank" rel="noreferrer">Kiểm tra tuyến trên Cổng quốc gia ↗</a></div>}<div className="side-fact"><small>Người nộp</small><b>{item.applicant?.name}</b></div><div className="side-fact"><small>Điện thoại</small><b>{item.applicant?.phone}</b></div><div className="side-fact"><small>Email</small><b>{item.applicant?.email}</b></div><div className="side-fact"><small>Kênh nhận kết quả</small><b>{item.deliveryMethod || 'Chưa chọn'}</b></div>{item.attachments?.length ? <div className="side-fact"><small>Tệp đính kèm</small>{item.attachments.map(file => <div key={file.name}><a href={file.downloadUrl}>{file.name}</a></div>)}</div> : null}{isStaff && item.withdrawal?.requestDocuments?.length > 0 && <div className="side-fact"><small>Tài liệu yêu cầu dừng</small>{item.withdrawal.requestDocuments.map((file: any) => <div key={file.name}><a href={file.downloadUrl}>{file.name}</a></div>)}</div>}{isStaff && item.withdrawal?.noticeFile?.downloadUrl && <div className="side-fact"><small>Thông báo dừng đã ký</small><a href={item.withdrawal.noticeFile.downloadUrl}>{item.withdrawal.noticeFile.name}</a></div>}<div className="source-warning small-warning">Đây là môi trường phát triển cục bộ, chưa kết nối dữ liệu hoặc giao dịch của cơ quan nhà nước.</div></aside>
  </div>
}

function Mau06Draft({ draft }: { draft: Record<string, any> }) {
  const dateText = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? `ngày ${value.slice(8, 10)} tháng ${value.slice(5, 7)} năm ${value.slice(0, 4)}` : 'ngày …… tháng …… năm ……'
  return <details className="mau06-preview">
    <summary>Xem trước dự thảo Thông báo dừng Mẫu 06</summary>
    <div className="mau06-print-actions"><span>Bản dự thảo chưa có số, chưa ký; đối chiếu đúng tên cơ quan/đơn vị trước khi phát hành.</span><button className="button secondary" type="button" onClick={() => window.print()}>In hoặc lưu PDF</button></div>
    <article className="mau06-document">
      <header className="mau06-heading"><div><b>{draft.authorityName || '[TÊN CẤP TỈNH/BỘ, NGÀNH/CẤP XÃ]'}</b><br /><b>{draft.serviceOfficeName || '[TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG/BỘ PHẬN TIẾP NHẬN VÀ TRẢ KẾT QUẢ]'}</b><hr /><span>Số: {draft.noticeNumber || '……/TBD-TTPVHCC (BPTNTKQ)'}</span></div><div><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br /><b>Độc lập - Tự do - Hạnh phúc</b><hr /><span>{draft.noticeLocation || '……'}, {dateText(draft.noticeDate)}</span></div></header>
      <h2>THÔNG BÁO DỪNG GIẢI QUYẾT HỒ SƠ</h2>
      <p>{draft.serviceOfficeName || 'Trung tâm Phục vụ hành chính công/Bộ phận Tiếp nhận và Trả kết quả'} đã tiếp nhận hồ sơ của Ông (Bà)/Tổ chức: <b>{draft.applicantName || '……………………'}</b>.</p>
      <p>Số định danh cá nhân/tổ chức: <b>{draft.applicantIdentifier || '……………………'}</b><br />Mã hồ sơ: <b>{draft.caseCode || '……………………'}</b><br />Nội dung yêu cầu giải quyết: <b>{draft.procedureName || '……………………'}</b></p>
      <p>Qua kiểm tra, đến nay, mã số hồ sơ <b>{draft.caseCode}</b> chưa có quyết định giải quyết thủ tục hành chính hoặc có văn bản thông báo kết quả giải quyết thủ tục hành chính.</p>
      <p>Theo đề nghị <b>{dateText(draft.requestDate?.slice(0, 10))}</b> của Ông (Bà)/Tổ chức <b>{draft.requesterName || draft.applicantName || '……………………'}</b> về việc dừng thực hiện hồ sơ giải quyết thủ tục hành chính, lý do: <b>{draft.reason || '……………………'}</b>.</p>
      <p>{draft.serviceOfficeName || 'Trung tâm Phục vụ hành chính công/Bộ phận Tiếp nhận và Trả kết quả'} thông báo dừng giải quyết hồ sơ nêu trên.</p>
      <p>Đề nghị Ông (Bà)/Tổ chức liên hệ <b>{draft.collectionOffice || '……………………'}</b> để nhận lại hồ sơ giấy và phí, lệ phí đã nộp (nếu có).</p>
      <p>Xin thông báo cho Ông (Bà)/Tổ chức được biết.</p>
      <div className="mau06-signature"><b>THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ</b><br />(Ký và ghi rõ họ tên hoặc chữ ký số nếu là biểu mẫu điện tử)</div>
      <small className="mau06-draft-label">DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁT HÀNH</small>
    </article>
  </details>
}

export default App
