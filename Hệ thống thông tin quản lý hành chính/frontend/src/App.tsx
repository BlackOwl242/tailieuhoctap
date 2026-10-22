import { Fragment, useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'
import { CitizenApplicationForm, type SubmissionSchema } from './CitizenSubmission'
import { serviceModeLabel } from './procedureLabels'
import { InformationHome } from './InformationHome'
import { AdministrativeServiceDesk, PublicAdministrativeServices } from './AdministrativeServices'
import { CitizenProcedureCatalog } from './CitizenProcedureCatalog'
import { CitizenProcedureDetail } from './CitizenProcedureDetail'
import './StaffProcedureCatalog.css'
import { showcaseProcedureCodes } from './serviceTopics'

type User = { id: string; email: string; phone: string; name: string; role: string; emailVerified: boolean; agencyScope?: string; validFrom?: string; validUntil?: string; maySignStop?: boolean; maySignSandbox?: boolean; signingAuthorityRef?: string; mustChangePassword?: boolean; canManageAgencyAccounts?: boolean }
type Procedure = { ref?: string; sourceCode?: string; code: string; name: string; field: string; categoryKey?: string; categoryEdit?: { sourceUrl: string; checkedAt: string; reason: string; version: number; updatedBy: string; updatedAt: string }; level: string; agency: string; verified: boolean; submissionEnabled?: boolean; submissionDisabledReason?: string; serviceMode?: string; submission?: SubmissionSchema; localEdit?: { sourceUrl: string; checkedAt: string; reason: string; version: number; updatedBy: string; updatedAt: string }; routing?: { mode: string; status: string; summary: string; officialUrl: string; checkedAt?: string; observedAuthorities?: { locality: string; authority: string }[] } }
type ProcedureCategory = { key: string; name: string; count: number; source: 'reference' | 'internal'; procedures: Procedure[]; categoryEdit?: Procedure['categoryEdit'] | null }
type CaseFile = { code: string; procedureCode: string; procedure: Procedure; status: string; statusLabel: string; version: number; createdAt: string; deadline?: string; deadlineNote?: string; applicant: { name: string; phone: string; email: string; citizenId?: string; address?: string }; subject: { name: string; relation: string }; events: { title: string; detail: string; at: string; audience: string; actor?: string; role?: string; action?: string; id?: string }[]; supplement?: { reason: string; resumeStatus?: string; items?: string[]; citizenNote?: string; respondedAt?: string; requestedAt?: string; noticeDocument?: { name: string; url?: string; downloadUrl?: string } }; draftResult?: string; result?: { number: string; content: string; issuedAt?: string; document?: { name: string; url?: string; downloadUrl?: string } }; attachments?: { name: string; url?: string; downloadUrl?: string }[]; [key: string]: any }
type Bootstrap = { user?: User; procedures: Procedure[]; procedureCategories?: ProcedureCategory[]; cases: CaseFile[]; stats: { total?: number; open?: number; waiting?: number; supplement?: number; review?: number; overdue?: number; byStatus?: Record<string, number> }; storage?: { database: string; procedureCount: number; caseRecords: number; sampleCaseCount?: number; sampleDataVersion?: number; publishedNews: number; caseCountScope: string }; statusLabels: Record<string, string>; staff?: { id: string; name: string; role: string }[]; feedback?: { code: string; score: number; content: string; created_at: string }[]; outbox?: { code: string; status: string; attempts: number; lastError?: string; messageId?: string }[] }
type ManagedUser = { id: string; email: string; phone: string; name: string; role: string; active: boolean; agencyScope: string; validFrom: string; validUntil: string; maySignStop: boolean; signingAuthorityRef: string; mustChangePassword?: boolean; canManageAgencyAccounts?: boolean; createdAt: string }
type StaffAccessRequest = { id: string; userId: string; email: string; name: string; requestedBy: string; requestedById: string; role: string; agencyScope: string; validFrom: string; validUntil: string; maySignStop: boolean; signingAuthorityRef: string; reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; reviewedBy?: string; reviewNote: string; createdAt: string; reviewedAt?: string }
type AccountAccess = { role: string; active: boolean; agencyScope: string; validFrom: string; validUntil: string; canManageAgencyAccounts?: boolean }
type StaffAccountChange = { id: string; userId: string; email: string; name: string; requestedBy: string; requestedById: string; before: AccountAccess; proposed: AccountAccess; reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; reviewedBy?: string; reviewNote: string; createdAt: string; reviewedAt?: string }
type ManagedNews = { id: string; title: string; summary: string; body: string; category: string; image: string; sourceUrl: string; featured: boolean; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; publishedAt: string; date?: string; version: number; updatedAt: string }

let csrfToken = ''
let citizenCsrfToken = ''
async function api<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    const token = path.startsWith('/api/citizen/') || path.startsWith('/api/public/') || path === '/api/cases' ? citizenCsrfToken : csrfToken
    if (token) headers['X-CSRF-Token'] = token
  }
  const response = await fetch(path, { method: body === undefined ? 'GET' : 'POST', credentials: 'include', headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && (path.startsWith('/api/citizen/') || path.startsWith('/api/public/') || path === '/api/cases')) window.dispatchEvent(new Event('citizen-session-expired'))
    throw new Error(result.error || `Yêu cầu thất bại (${response.status}).`)
  }
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
type PortalRoute = 'citizen-login' | 'public' | 'staff' | 'guide' | 'catalog' | 'submit' | 'track' | 'citizen-services'
const routeFromPath = (): PortalRoute => window.location.pathname.startsWith('/dang-nhap') ? 'citizen-login' : window.location.pathname.startsWith('/staff') ? 'staff' : window.location.pathname.startsWith('/huong-dan') ? 'guide' : window.location.pathname.startsWith('/tien-ich') ? 'citizen-services' : window.location.pathname.startsWith('/thu-tuc') ? 'catalog' : window.location.pathname.startsWith('/nop-ho-so') ? 'submit' : window.location.pathname.startsWith('/tra-cuu-ho-so') ? 'track' : 'public'

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
        <button className="staff-back-link" onClick={onBack}> Quay về cổng thông tin</button>
        <span className="eyebrow">KHU VỰC LÀM VIỆC NỘI BỘ</span>
        <h1>Bàn làm việc nội bộ</h1>
        <p>Đăng nhập để tiếp nhận, phân công và theo dõi hồ sơ trong phạm vi tài khoản được cấp.</p>
        <div className="auth-guidance">
          <p><b>Tài khoản</b><span>Do quản trị viên của ứng dụng cấp (mật khẩu mặc định: <code>123</code>).</span></p>
          <p><b>Phân quyền</b><span>Theo vai trò, đơn vị công tác và thời hạn được giao.</span></p>
        </div>
      </div>
      <section className="auth-panel" aria-labelledby="staff-login-title"><div className="auth-card">
      <span className="eyebrow">ĐĂNG NHẬP CÁN BỘ</span><h2 id="staff-login-title">Truy cập bàn xử lý</h2><p className="muted">Dùng email và mật khẩu của tài khoản nội bộ đã được cấp (mặc định: <code>123</code>).</p>
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

function CitizenAuthScreen({ onAuthenticated, onBack }: { onAuthenticated: (user: User, csrf: string) => void; onBack: () => void }) {
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const result = await api<{ user: User; csrfToken: string }>(`/api/citizen/auth/${register ? 'register' : 'login'}`, values)
      onAuthenticated(result.user, result.csrfToken)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể xác thực tài khoản.') }
    finally { setBusy(false) }
  }
  return <main className="auth-page official-auth citizen-auth-page">
    <AgencyMasthead />
    <section className="auth-content">
      <div className="auth-intro">
        <button className="staff-back-link" onClick={onBack}>Quay về cổng thông tin</button>
        <span className="eyebrow">DỊCH VỤ DÀNH CHO CÔNG DÂN</span>
        <h1>Một tài khoản để sử dụng dịch vụ</h1>
        <p>Đăng nhập để nộp và theo dõi hồ sơ, bổ sung giấy tờ, đặt lịch hẹn và gửi phản ánh.</p>
        <div className="auth-guidance"><p><b>Hồ sơ của bạn</b><span>Theo dõi những hồ sơ được gửi bằng tài khoản này.</span></p></div>
      </div>
      <section className="auth-panel" aria-labelledby="citizen-auth-title"><div className="auth-card">
        <span className="eyebrow">TÀI KHOẢN CÔNG DÂN</span>
        <h2 id="citizen-auth-title">{register ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h2>
        <p className="muted">Tài khoản riêng của ứng dụng, chưa liên kết hoặc xác thực qua VNeID.</p>
        <form className="form-stack" onSubmit={submit} key={register ? 'register' : 'login'}>
          {register && <><label>Họ và tên<input name="name" autoComplete="name" minLength={2} maxLength={150} required /></label><label>Số điện thoại<input name="phone" type="tel" autoComplete="tel" minLength={8} maxLength={40} required /></label></>}
          <label>Email<input name="email" type="email" autoComplete="username" maxLength={254} required /></label>
          <label>Mật khẩu<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : undefined} maxLength={128} required /></label>
          {register && <><small className="muted">Từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số.</small><label>Nhập lại mật khẩu<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label></>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button primary full" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Đăng ký và tiếp tục' : 'Đăng nhập và tiếp tục'}</button>
          <button type="button" className="text-button" disabled={busy} onClick={() => { setRegister(value => !value); setError('') }}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
        </form>
      </div></section>
    </section>
    <footer className="auth-legal">Thông tin tài khoản do người dùng tự khai; chưa được xác minh danh tính hoặc liên thông với cơ quan nhà nước.</footer>
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
        {staff ? <b>HỆ THỐNG MỘT CỬA<br className="masthead-break" /> TIẾP NHẬN VÀ GIẢI QUYẾT TTHC</b> : <b>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG<br className="masthead-break" /> THÀNH PHỐ HÀ NỘI</b>}
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
    {!loading && !error && <><p className="catalog-status">Đang xem {Math.min(limit, results.length).toLocaleString('vi-VN')} trong {results.length.toLocaleString('vi-VN')} thủ tục tham chiếu</p><div className="public-procedure-results">{results.slice(0, limit).map(item => <article key={item.code}><div><small>{item.code} · {item.field || 'Chưa phân nhóm'} · {serviceModeLabel(item.level)}</small><h3>{item.name}</h3><p>{item.agency || 'Cơ quan thực hiện theo thủ tục trên Cổng quốc gia'}</p>{item.routing?.summary && <p className="public-route-summary">{item.routing.summary}</p>}</div><button className="procedure-detail-link" onClick={() => onOpenProcedure(item.code)}>Xem thông tin thủ tục</button></article>)}</div>{results.length === 0 && <div className="catalog-empty">Không tìm thấy kết quả. Thử từ khóa khác hoặc chọn tất cả lĩnh vực.</div>}{results.length > limit && <button className="button secondary catalog-more" onClick={() => setLimit(value => value + 8)}>Xem thêm thủ tục</button>}</>}
  </section>
}

type PublicView = 'public' | 'catalog' | 'submit' | 'track' | 'receipt'
type SubmissionReceipt = { code: string; accessKey?: string; status?: string; statusLabel?: string }

function PublicPortal({ onStaff, onGuide, onNavigate, onReceipt, receipt, signedIn, initialView, initialProcedureCode, citizenSignedIn = false }: { citizenSignedIn?: boolean; onStaff: () => void; onGuide: () => void; onNavigate: (route: PortalRoute, procedureCode?: string, applicantType?: 'citizen' | 'organization') => void; onReceipt: (value: SubmissionReceipt) => void; receipt: SubmissionReceipt | null; signedIn: boolean; initialView: 'public' | 'catalog' | 'submit' | 'track'; initialProcedureCode: string }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [view, setView] = useState<PublicView>(initialView)
  if (view !== 'public') return <CitizenWorkflow view={view} receipt={receipt} initialProcedureCode={initialProcedureCode} onBack={() => { setView('public'); onNavigate('public') }} onSubmit={() => { setView('submit'); onNavigate('submit') }} onTrack={() => { setView('track'); onNavigate('track') }} onCatalog={() => { setView('catalog'); onNavigate('catalog') }} onSubmitted={value => { onReceipt(value); setView('receipt') }} />
  return <div className="public-site">
    <AgencyMasthead />
    <header className={`public-header official-header${mobileNavOpen ? ' mobile-open' : ''}`}>
      <button className="mobile-nav-toggle" type="button" aria-expanded={mobileNavOpen} aria-controls="public-main-navigation" onClick={() => setMobileNavOpen(open => !open)}>
        <span aria-hidden="true">☰</span> Danh mục
     </button>
      <nav className="public-nav" id="public-main-navigation" aria-label="Điều hướng chính">
        <a className="nav-home" href="/" onClick={event => { event.preventDefault(); onNavigate('public') }}>⌂ <span>Trang chủ</span></a>
        <a href="/thu-tuc" onClick={event => { event.preventDefault(); onNavigate('catalog') }}>Danh mục thủ tục</a>
        <a href="/nop-ho-so" onClick={event => { event.preventDefault(); onNavigate('submit') }}>Nộp hồ sơ</a>
        <a href="/tra-cuu-ho-so" onClick={event => { event.preventDefault(); onNavigate('track') }}>Tra cứu hồ sơ</a>
        <a href="/tien-ich" onClick={event => { event.preventDefault(); onNavigate('citizen-services') }}>Lịch hẹn &amp; phản ánh</a>
        <a href="/huong-dan" onClick={event => { event.preventDefault(); onGuide() }}>Hướng dẫn sử dụng</a>
        <details className="official-nav-info"><summary>Thông tin</summary><div className="official-nav-info-menu">
          <a href="/#gioi-thieu">Giới thiệu</a>
          <a href="/#tin-tuc">Tin tức, sự kiện</a>
          <a href="/#thu-vien-anh">Thư viện ảnh</a>
          <a href="/#ho-tro">Liên hệ</a>
        </div></details>
      </nav>
      <div className="public-header-actions">
        {!citizenSignedIn && <button className="button staff-entry-button" onClick={onStaff}>{signedIn ? 'Mở bàn cán bộ' : 'Đăng nhập cán bộ'}</button>}
      </div>
    </header>
    <div className="official-announcement"><span>THÔNG TIN DỊCH VỤ CÔNG</span><p>Cổng này có luồng lập, gửi và theo dõi hồ sơ trong cơ sở dữ liệu của ứng dụng; hiện chưa liên thông giao dịch chính thức với cơ quan nhà nước.</p><a href={NATIONAL_PORTAL} target="_blank" rel="noreferrer">Đến Cổng Dịch vụ công quốc gia <b>↗</b></a></div>

    <main>
      <InformationHome />

      <PublicProcedureSearch onOpenProcedure={code => onNavigate('catalog', code)} />

      <section className="support-strip" id="ho-tro"><div><span className="eyebrow">CẦN HỖ TRỢ?</span><h2>Trung tâm Phục vụ hành chính công Hà Nội</h2><p>Thông tin, hướng dẫn và thông báo về việc thực hiện thủ tục hành chính tại Thành phố.</p></div><div className="support-actions"><a className="button secondary" href={CITY_SUPPORT} target="_blank" rel="noreferrer">Trang thông tin Trung tâm <span></span></a><a className="support-phone" href="tel:0241022">024 1022 <small>nhánh 7, 8</small></a><a className="support-phone" href="tel:19001009">1900 1009 <small>tổng đài thông minh</small></a></div></section>
    </main>

    <footer className="public-footer"><a className="public-brand" href={CENTER_HOME} aria-label="Mở Trang thông tin Trung tâm Phục vụ hành chính công Hà Nội"><img className="footer-emblem" src="/images/hanoi-logo.png" alt="" /><span><b>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG</b><small>THÀNH PHỐ HÀ NỘI</small></span></a><span>Giao dịch trực tuyến của cá nhân, tổ chức và doanh nghiệp được thực hiện trên Cổng Dịch vụ công quốc gia. Tuyến xử lý phụ thuộc thủ tục và cơ quan thực hiện được chọn.</span><a href={NATIONAL_PORTAL} target="_blank" rel="noreferrer">dichvucong.gov.vn ↗</a></footer>
  </div>
}

function CitizenWorkflow({ view, receipt, initialProcedureCode, onBack, onSubmit, onTrack, onCatalog, onSubmitted }: { view: PublicView; receipt: SubmissionReceipt | null; initialProcedureCode: string; onBack: () => void; onSubmit: () => void; onTrack: () => void; onCatalog: () => void; onSubmitted: (value: SubmissionReceipt) => void }) {
  return <div className="public-site citizen-workflow-site">
    <AgencyMasthead />
    <header className="citizen-workflow-header">
      <button className="text-button" onClick={onBack}> Về cổng dịch vụ</button>
      <nav aria-label="Dịch vụ công dân"><button className={view === 'catalog' ? 'active' : ''} onClick={onCatalog}>Danh mục thủ tục</button><button className={view === 'submit' ? 'active' : ''} onClick={onSubmit}>Nộp hồ sơ</button><button className={view === 'track' ? 'active' : ''} onClick={onTrack}>Tra cứu hồ sơ</button><a href="/huong-dan">Hướng dẫn</a></nav>
    </header>
    <main className="citizen-workflow-main">
      {view === 'catalog' && <CitizenProcedureCatalog request={api} />}
      {view === 'submit' && <CitizenApplicationForm request={api} initialProcedureCode={initialProcedureCode} onSubmitted={onSubmitted} />}
      {view === 'receipt' && receipt && <CitizenReceiptView receipt={receipt} onTrack={onTrack} />}
      {view === 'track' && <CitizenTrackingPage initialReceipt={receipt} />}
    </main>
    <footer className="citizen-workflow-footer"><span>Theo dõi hồ sơ trong tài khoản công dân. Với hồ sơ cũ, liên hệ cán bộ để nhận khóa tra cứu sau khi xác minh chủ hồ sơ.</span><button className="text-button" onClick={onBack}>Về trang chủ</button></footer>
  </div>
}

function PublicCitizenServicesPage({ onHome, onStaff, signedIn, citizenSignedIn = false }: { onHome: () => void; onStaff: () => void; signedIn: boolean; citizenSignedIn?: boolean }) {
  return <div className="public-site citizen-services-site">
    <AgencyMasthead />
    <header className="citizen-workflow-header citizen-services-header">
      <button className="text-button" onClick={onHome}>Về trang chủ</button>
      <nav aria-label="Điều hướng dịch vụ công"><a href="/thu-tuc">Danh mục thủ tục</a><a href="/nop-ho-so">Nộp hồ sơ</a><a href="/tra-cuu-ho-so">Tra cứu hồ sơ</a><a href="/huong-dan">Hướng dẫn</a></nav>
      {!citizenSignedIn && <button className="button secondary" onClick={onStaff}>{signedIn ? 'Mở bàn cán bộ' : 'Đăng nhập cán bộ'}</button>}
    </header>
    <main className="citizen-service-page-main">
      <div className="citizen-page-heading"><span className="eyebrow">HỖ TRỢ CÔNG DÂN</span><h1>Lịch hẹn và phản ánh, kiến nghị</h1><p>Đặt lịch làm việc tại cơ quan hoặc gửi phản ánh, kiến nghị. Nộp hồ sơ và tra cứu tiến độ hồ sơ đã gửi tại các trang riêng.</p></div>
      <PublicAdministrativeServices request={api} />
    </main>
    <footer className="citizen-workflow-footer"><span>Thông tin gửi tại đây được xử lý trong ứng dụng. Lịch hẹn không thay thế việc nộp hồ sơ theo thủ tục.</span><a className="text-link" href="/">Về trang chủ</a></footer>
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
    <div className="citizen-source-note"><b>Theo dõi bằng tài khoản</b><span>Hồ sơ đã gắn với tài khoản công dân của bạn. Chọn Theo dõi hồ sơ để xem tiến độ; không cần nhập khóa tra cứu cho hồ sơ của chính bạn.</span></div>
    <div className="citizen-receipt-actions"><button className="button secondary" onClick={copyReceipt}>{copied ? 'Đã sao chép' : 'Sao chép thông tin'}</button><button className="button primary" onClick={onTrack}>Theo dõi hồ sơ</button></div>
  </section>
}

function CitizenTrackingPage({ initialReceipt }: { initialReceipt: SubmissionReceipt | null }) {
  const [ownedCases, setOwnedCases] = useState<any[]>([])
  useEffect(() => { api<{ cases: any[] }>('/api/citizen/cases').then(result => setOwnedCases(result.cases)).catch(reason => setError(reason.message)) }, [])
  const [code, setCode] = useState(initialReceipt?.code || '')
  const [accessKey, setAccessKey] = useState(initialReceipt?.accessKey || '')
  const [item, setItem] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  async function lookup(event?: FormEvent<HTMLFormElement>, credentials?: { code: string; accessKey: string }) {
    event?.preventDefault(); setBusy(true); setError(''); setMessage('')
    const lookupCode = credentials?.code || code
    const lookupKey = credentials ? credentials.accessKey : accessKey
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
    <div className="citizen-page-heading"><span className="eyebrow">TRA CỨU TIẾN ĐỘ</span><h1>Tra cứu hồ sơ đã gửi</h1><p>Hồ sơ gửi bằng tài khoản này được hiển thị bên dưới. Hồ sơ cũ cần mã hồ sơ và khóa tra cứu do cán bộ cung cấp.</p></div>
    <section className="citizen-owned-cases" aria-label="Hồ sơ của tôi">{ownedCases.length ? ownedCases.map(record => <button type="button" className="citizen-owned-case" key={record.code} disabled={busy} onClick={() => lookup(undefined, { code: record.code, accessKey: '' })}><b>{record.code}</b><span>{record.procedure?.name || record.procedureCode}</span><small>{record.statusLabel || record.status}</small></button>) : <p className="muted">Bạn chưa gửi hồ sơ nào bằng tài khoản này.</p>}</section>
    <form className="citizen-track-form" onSubmit={lookup}><label className="citizen-field">Mã hồ sơ<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="HN-2026-XXXXXXXX" autoComplete="off" required /></label><label className="citizen-field">Khóa tra cứu<input value={accessKey} onChange={event => setAccessKey(event.target.value)} autoComplete="off" spellCheck={false} /></label><button className="button primary" disabled={busy}>{busy ? 'Đang tra cứu…' : 'Tra cứu hồ sơ'}</button></form>
    {error && <div className="form-error" role="alert">{error}</div>}{message && <div className="citizen-success" role="status">{message}</div>}
    {item && <CitizenCaseStatus item={item} busy={busy} onAction={citizenAction} />}
  </section>
}

const channelNames: Record<string, string> = {
  TRUC_TIEP: 'Trực tiếp tại Bộ phận Một cửa',
  BUU_CHINH: 'Qua dịch vụ bưu chính',
  DIEN_TU_SANDBOX: 'Điện tử (bản phát hành thử nghiệm)',
  TRUC_TUYEN: 'Trực tuyến trên Cổng Dịch vụ công',
}
const feeStatusLabels: Record<string, string> = {
  DUE: 'Chờ người nộp khai đã thanh toán',
  PAID: 'Đã khai thanh toán · chờ kế toán đối chiếu chứng từ',
  RECONCILED: 'Đã đối chiếu chứng từ trong hệ thống',
  WAIVED: 'Đã miễn thu phí, lệ phí',
  REFUNDED: 'Đã ghi nhận hoàn trả',
}

function CaseDeclaration({ item }: { item: CaseFile }) {
  const schema = item.procedure?.submission
  if (!schema || !item.declaration) return null
  const entries = schema.fields.filter(field => Object.hasOwn(item.declaration, field.id))
  return <section className="citizen-case-section"><h3>Tờ khai đã nộp</h3><dl className="case-declaration">{entries.map(field => <div key={field.id}><dt>{field.label}</dt><dd>{item.declaration[field.id] || 'Không khai'}</dd></div>)}<div><dt>Nhận kết quả</dt><dd>{channelNames[item.deliveryMethod] || item.deliveryMethod || 'Chưa chọn'}{item.deliveryAddress && ` · ${item.deliveryAddress}`}</dd></div></dl></section>
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
  const noticeDoc = item.withdrawal?.noticeFile || item.withdrawal?.noticeDocument

  return <article className="citizen-case-view">
    {item.sampleData && <aside className="sample-data-notice citizen-sample-note" role="note"><b>Hồ sơ tình huống mô phỏng</b><span>{item.sampleDataNote || 'Thông tin này được tạo để minh họa cách tra cứu, không phải hồ sơ thật và không có giá trị pháp lý.'}</span></aside>}
    <header className="citizen-case-heading"><div><span className="eyebrow">{item.procedureCode}</span><h2>{item.procedure?.name || 'Hồ sơ thủ tục hành chính'}</h2><p>Mã hồ sơ <b>{item.code}</b> · Cơ quan tiếp nhận: {item.receivingAgency}</p></div><div className="citizen-case-current-status"><small>TRẠNG THÁI HIỆN TẠI</small><b>{item.statusLabel}</b></div></header>
    {item.milestones?.length > 0 && <section className="citizen-case-section"><h3>Mốc kiểm tra và thông báo</h3>{item.milestones.map((milestone: { id: string; label: string; dueDate: string; completedAt?: string }) => <p key={milestone.id}>{milestone.label}: {toDate(milestone.dueDate)} · {milestone.completedAt ? 'Đã thực hiện' : 'Đang theo dõi'}</p>)}<p>Đây là mốc xử lý trung gian, không phải hạn trả kết quả cuối cùng.</p></section>}
    <div className="citizen-progress evidence-progress" aria-label="Tiến độ xử lý hồ sơ">{(item.progress || []).map((phase: { id: string; label: string; state: string; at?: string }, index: number) => <div key={phase.id} className={phase.state}><i>{phase.state === 'completed' ? '✓' : phase.state === 'terminated' ? '×' : index + 1}</i><b>{phase.label}</b><span>{({ completed: 'Đã hoàn tất', current: 'Đang xử lý', pending: 'Chưa thực hiện', paused: 'Chờ bổ sung', terminated: 'Đã kết thúc tại khâu này' } as Record<string, string>)[phase.state]}</span>{phase.at && <time>{toDate(phase.at)}</time>}</div>)}</div>
    {item.status === 'CHO_BO_SUNG' && <div className="citizen-request-warning"><b>Cơ quan đang yêu cầu bạn bổ sung thông tin (Mẫu 02)</b><p>{item.supplement?.reason}</p>{item.supplement?.items?.length > 0 && <ul>{item.supplement.items.map((entry: string, index: number) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul>}</div>}
    {item.supplement?.citizenNote && <div className="citizen-source-note"><b>Nội dung bạn đã giải trình / bổ sung:</b><span>{item.supplement.citizenNote}{item.supplement.respondedAt ? ` (${toDate(item.supplement.respondedAt)})` : ''}</span></div>}
    {item.withdrawal?.status === 'CHO_KY_PHAT_HANH' && <div className="citizen-request-warning"><b>Cơ quan đã tiếp nhận yêu cầu xin rút / dừng giải quyết hồ sơ</b><p>Ngày tiếp nhận yêu cầu: {toDate(item.withdrawal.requestReceivedAt)} · Lý do: {item.withdrawal.reason}. Hồ sơ đang chờ người có thẩm quyền ký phát hành Thông báo dừng giải quyết (Mẫu 06).</p></div>}
    {item.withdrawal?.status === 'DA_PHAT_HANH' && <div className="citizen-request-warning"><b>Đã phát hành Thông báo dừng giải quyết hồ sơ (Mẫu 06) số {item.withdrawal.noticeNumber}</b><p>Ngày ban hành: {toDate(item.withdrawal.noticeDate || item.withdrawal.noticeIssuedAt)} · Kênh gửi: {channelNames[item.withdrawal.noticeDelivery?.channel] || item.withdrawal.noticeDelivery?.channel || 'Trực tiếp'}{item.withdrawal.noticeDelivery?.reference ? ` (${item.withdrawal.noticeDelivery.reference})` : ''}.</p>{item.withdrawal.collectionOffice && <p><b>Đầu mối liên hệ nhận lại hồ sơ gốc / phí, lệ phí:</b> {item.withdrawal.collectionOffice}</p>}{noticeDoc?.downloadUrl && <p><a className="button secondary" href={noticeDoc.downloadUrl}>Tải Thông báo dừng Mẫu 06 đã ký ({noticeDoc.name || 'Tệp đính kèm'})</a></p>}</div>}
    {item.publicNote && <div className="citizen-request-warning"><b>Thông tin từ cơ quan</b><p>{item.publicNote}</p></div>}
    <div className="citizen-case-summary"><div><small>Ngày gửi</small><b>{toDate(item.createdAt)}</b></div><div><small>Thời hạn</small><b>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</b></div><div><small>Người nộp</small><b>{item.applicant?.name}</b></div></div>
    <CaseDeclaration item={item} />
    {item.fee?.amount && <section className="citizen-case-section citizen-payment-section"><h3>Khoản thu phí, lệ phí theo hồ sơ</h3><dl className="case-declaration"><div><dt>Số tiền</dt><dd><b>{Number(item.fee.amount).toLocaleString('vi-VN')} đồng</b></dd></div><div><dt>Căn cứ pháp lý thu phí</dt><dd>{item.fee.basis}</dd></div><div><dt>Trạng thái khoản thu</dt><dd>{feeStatusLabels[item.fee.status] || item.fee.status}</dd></div></dl><p className="field-help" style={{ margin: '6px 0 10px' }}>Mã khoản thu được lưu trong hồ sơ. Sau khi nộp theo hướng dẫn của cơ quan, nhập mã giao dịch hoặc số biên lai để kế toán đối chiếu.</p><div className="form-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>{item.fee.status === 'DUE' && (pendingPayment ? <form className="citizen-action-form" onSubmit={confirmPayment}><p>Mã khoản thu <b>{pendingPayment.transactionRef}</b></p><label className="citizen-field">Hình thức đã nộp<select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}><option value="BANK_TRANSFER">Chuyển khoản</option><option value="COUNTER_RECEIPT">Nộp tại quầy có biên lai</option><option value="POSTAL_RECEIPT">Nộp qua bưu chính có chứng từ</option><option value="OTHER">Hình thức khác có chứng từ</option></select></label><label className="citizen-field">Mã giao dịch / số biên lai<input name="paymentEvidence" required minLength={4} maxLength={160} /></label><button className="button primary" disabled={busy}>Gửi thông tin thanh toán để đối chiếu</button></form> : <button type="button" className="button primary" disabled={busy} onClick={() => onAction('create_payment', {})}>Tạo mã theo dõi khoản thu</button>)}{['PAID', 'RECONCILED', 'REFUNDED'].includes(item.fee.status) && <button type="button" className="button secondary" onClick={() => printInternalTable('Phiếu theo dõi khoản thu', `Hồ sơ ${item.code}`, ['Số tiền', 'Trạng thái', 'Căn cứ'], [[`${Number(item.fee.amount).toLocaleString('vi-VN')} đồng`, feeStatusLabels[item.fee.status] || String(item.fee.status), String(item.fee.basis)]])}>In phiếu theo dõi khoản thu</button>}</div></section>}
    <section className="citizen-case-section"><h3>Nội dung đề nghị</h3><p>{item.requestSummary}</p>{item.attachments?.length > 0 && <div className="citizen-file-list"><b>Tài liệu đã gửi</b>{item.attachments.map((file: any, index: number) => <span key={`${file.name}-${index}`}>{file.name}</span>)}</div>}</section>
    {item.status === 'CHO_BO_SUNG' && <form className="citizen-action-form" onSubmit={submitSupplement}><h3>Gửi nội dung bổ sung</h3><label className="citizen-field">Nội dung trả lời<textarea name="note" rows={4} maxLength={1200} placeholder="Trả lời từng yêu cầu của cơ quan." /></label><label className="citizen-field">Tài liệu bổ sung<input name="supplementFiles" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple /><small>Tối đa 8 tệp, 8 MB mỗi tệp; tổng dung lượng không quá 9 MB.</small></label>{localError && <div className="form-error" role="alert">{localError}</div>}<button className="button primary" disabled={busy}>Gửi bổ sung</button></form>}
    {item.result && <section className="citizen-case-section"><h3>Kết quả giải quyết</h3><p>{item.result.content || 'Cơ quan đã ghi nhận kết quả.'}</p>{item.result.number && <p>Số văn bản: <b>{item.result.number}</b></p>}</section>}
    {item.delivery && <section className="citizen-case-section"><h3>Thông tin trả kết quả</h3><p><b>Người nhận:</b> {item.delivery.receiver} · <b>Hình thức nhận:</b> {channelNames[item.delivery.channel] || item.delivery.channel}</p><p><b>Mã biên nhận / bưu gửi:</b> {item.delivery.evidence} · <b>Thời gian:</b> {toDate(item.delivery.at)}</p></section>}
    <section className="citizen-case-section"><h3>Lịch sử xử lý</h3>{item.events?.length ? <div className="citizen-timeline">{item.events.map((event: any, index: number) => <article key={`${event.at}-${index}`}><i /><div><b>{event.title}</b><time>{toDate(event.at)}</time>{event.detail && <p>{event.detail}</p>}</div></article>)}</div> : <p>Chưa có cập nhật.</p>}</section>
    {['HOAN_THANH', 'TU_CHOI', 'KHONG_GIAI_QUYET', 'DUNG'].includes(item.status) && !item.feedbackSubmitted && <form className="citizen-action-form" onSubmit={submitFeedback}><h3>Đánh giá quá trình xử lý</h3><label className="citizen-field">Mức đánh giá<select value={score} onChange={event => setScore(event.target.value)}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label><label className="citizen-field">Ý kiến<textarea value={feedback} onChange={event => setFeedback(event.target.value)} rows={3} maxLength={1000} /></label><button className="button secondary" disabled={busy}>Gửi đánh giá</button></form>}
    {item.feedbackSubmitted && <p className="citizen-success">Ứng dụng đã ghi nhận đánh giá của hồ sơ này.</p>}
    {item.result?.signature && <section className="citizen-case-section"><h3>Kiểm tra chữ ký kết quả</h3><p>{item.result.signature.verified ? 'Chữ ký toàn vẹn của môi trường thử nghiệm hợp lệ.' : 'Không xác minh được chữ ký của nội dung hiện tại.'}</p><p>Mã băm tài liệu: <code>{item.result.signature.documentHash}</code></p><p>Người ký: {item.result.signature.signer} · {toDate(item.result.signature.signedAt)}</p><p className="source-warning small-warning">Chữ ký Ed25519 trong ứng dụng chỉ để kiểm tra luồng và toàn vẹn dữ liệu; không phải chữ ký số công vụ/chứng thư số hợp pháp.</p></section>}
    <p className="citizen-boundary-note">Trạng thái hồ sơ, thanh toán và chữ ký ở đây thuộc cơ sở dữ liệu thử nghiệm cục bộ; ứng dụng chưa liên thông với hệ thống nhà nước, ngân hàng hoặc nhà cung cấp chữ ký số.</p>
  </article>
}

function App() {
  const [citizen, setCitizen] = useState<User | null>(null)
  const [citizenReady, setCitizenReady] = useState(false)
  const [citizenError, setCitizenError] = useState('')
  useEffect(() => {
    let active = true
    api<{ user: User | null; csrfToken: string | null }>('/api/citizen/auth/me').then(result => {
      if (active) { setCitizen(result.user); citizenCsrfToken = result.csrfToken || '' }
    }).catch(() => { if (active) setCitizenError('Chưa kiểm tra được phiên công dân. Hãy đăng nhập lại để tiếp tục.') })
      .finally(() => { if (active) setCitizenReady(true) })
    const expired = () => { setCitizen(null); citizenCsrfToken = ''; setCitizenError('Phiên công dân đã hết hạn. Vui lòng đăng nhập lại.') }
    window.addEventListener('citizen-session-expired', expired)
    return () => { active = false; window.removeEventListener('citizen-session-expired', expired) }
  }, [])
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
    const path = next === 'citizen-login' ? '/dang-nhap' : next === 'staff' ? '/staff' : next === 'guide' ? '/huong-dan' : next === 'citizen-services' ? '/tien-ich' : next === 'submit' ? '/nop-ho-so' : next === 'track' ? '/tra-cuu-ho-so' : '/'
    const targetPath = next === 'catalog' ? `/thu-tuc${procedureCode ? '/' + encodeURIComponent(procedureCode) : ''}` : path
    const queryParams = new URLSearchParams()
    if (procedureCode && next !== 'catalog') queryParams.set('procedure', procedureCode)
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
    if (action === selected.workflowGuard?.verificationAction) payload.evidence = Object.fromEntries((selected.workflowGuard.evidenceFields || []).map((field: { id: string }) => [field.id, String(formData.get(`workflow-${field.id}`) || '')]))
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

  const citizenServiceRoute = route === 'submit' || route === 'track' || route === 'citizen-services'
  const citizenAccountBar = <div className="citizen-account-bar"><span>{citizen ? `Công dân: ${citizen.name}` : 'Dịch vụ trực tuyến dành cho công dân'}</span><div>{citizen ? <><button type="button" className="text-button" onClick={() => navigateRoute('track')}>Hồ sơ của tôi</button><button type="button" className="text-button" onClick={async () => { try { await api('/api/citizen/auth/logout', {}); citizenCsrfToken = ''; setCitizen(null); setCitizenReceipt(null); setCitizenError(''); navigateRoute('public') } catch (reason) { setCitizenError(reason instanceof Error ? reason.message : 'Chưa đăng xuất được.') } }}>Đăng xuất</button></> : <button type="button" className="text-button" onClick={() => navigateRoute('citizen-login')}>Đăng nhập / Đăng ký công dân</button>}</div>{citizenError && <span role="alert">{citizenError}</span>}</div>
  if ((citizenServiceRoute || route === 'citizen-login') && !citizenReady) return <main className="auth-page"><p role="status">Đang kiểm tra phiên đăng nhập…</p></main>
  if ((citizenServiceRoute || route === 'citizen-login') && !citizen) return <CitizenAuthScreen onBack={() => navigateRoute('public')} onAuthenticated={(account, csrf) => { citizenCsrfToken = csrf; setCitizen(account); setCitizenError(''); if (route === 'citizen-login') navigateRoute('submit') }} />
  if (route === 'citizen-login') return <>{citizenAccountBar}<PublicPortal key="citizen-home" onStaff={() => navigateRoute('public')} onGuide={() => navigateRoute('guide')} onNavigate={navigateRoute} onReceipt={setCitizenReceipt} receipt={citizenReceipt} citizenSignedIn signedIn={false} initialView="public" initialProcedureCode="" /></>
  if (route === 'staff' && citizen && !user) return <main className="auth-page"><AgencyMasthead /><section className="auth-card"><h1>Tài khoản công dân</h1><p>Bàn cán bộ chỉ dành cho tài khoản nội bộ được cấp quyền.</p><button className="button primary" onClick={() => navigateRoute('public')}>Về cổng dịch vụ công dân</button></section></main>
  if (user?.mustChangePassword) return <PasswordChangeScreen onChanged={passwordChanged} onSignOut={signOut} />
  if (route === 'guide') return <StandaloneGuide signedIn={!!user} onHome={() => navigateRoute(user ? 'staff' : 'public')} onStaff={() => navigateRoute('staff')} />
  if (route === 'citizen-services') return <>{citizenAccountBar}<PublicCitizenServicesPage onHome={() => navigateRoute('public')} onStaff={() => navigateRoute('staff')} signedIn={!!user} citizenSignedIn={!!citizen && !user} /></>
  if (!user && route === 'staff') return <AuthScreen onAuthenticated={authenticate} onBack={() => navigateRoute('public')} />
  if (route === 'public' || route === 'catalog' || route === 'submit' || route === 'track') return <>{citizenAccountBar}<PublicPortal key={route} onStaff={() => navigateRoute(citizen && !user ? 'public' : 'staff')} onGuide={() => navigateRoute('guide')} onNavigate={navigateRoute} onReceipt={setCitizenReceipt} receipt={citizenReceipt} citizenSignedIn={!!citizen && !user} signedIn={!!user} initialView={route} initialProcedureCode={citizenProcedureCode} /></>
  if (!user) return <AuthScreen onAuthenticated={authenticate} onBack={() => navigateRoute('public')} />
  const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
    overview: { title: 'Tổng quan quản trị hệ thống', eyebrow: '', description: 'Theo dõi tài khoản cán bộ, thời hạn hiệu lực và các đề nghị phân quyền chờ duyệt.' },
    news: { title: 'Quản lý tin tức cổng thông tin', eyebrow: '', description: 'Soạn thảo, xuất bản và lưu trữ bài viết hiển thị trên cổng dịch vụ công.' },
    home: { title: 'Bàn điều hành & Giám sát', eyebrow: '', description: 'Theo dõi chỉ số xử lý, luồng trạng thái, tải công việc và hồ sơ cần ưu tiên giải quyết.' },
    inbox: { title: 'Hộp xử lý hồ sơ', eyebrow: '', description: 'Tra cứu, lọc theo trạng thái, thời hạn, chuyên viên phụ trách và thực hiện nghiệp vụ.' },
    service_desk: { title: 'Quầy một cửa & Lịch hẹn', eyebrow: '', description: 'Tiếp nhận hồ sơ trực tiếp tại quầy, xác nhận lịch hẹn công dân và phản hồi kiến nghị.' },
    monitoring: { title: 'Giám sát vận hành & Tiến độ', eyebrow: '', description: 'Phân tích tiến độ giải quyết, tồn đọng theo đơn vị, chuyên viên và chất lượng phục vụ.' },
    procedures: { title: 'Danh mục thủ tục hành chính', eyebrow: '', description: 'Tra cứu quy trình, biểu mẫu, thành phần hồ sơ và quản lý phân loại lĩnh vực.' },
    activity: { title: 'Nhật ký xử lý hồ sơ', eyebrow: '', description: 'Truy vết lịch sử thao tác, người thực hiện và mốc thời gian trên từng hồ sơ.' },
    connections: { title: 'Tài chính, Chữ ký & Tích hợp', eyebrow: '', description: 'Đối soát phí/lệ phí, quản lý thẩm quyền ký số nội bộ và theo dõi hàng chờ đồng bộ.' },
    users: { title: 'Quản lý tài khoản cán bộ', eyebrow: '', description: 'Quản trị danh bạ cán bộ, phạm vi cơ quan, thời hạn hiệu lực và phê duyệt cấp quyền.' },
    reports: { title: 'Báo cáo thống kê theo cơ quan', eyebrow: '', description: 'Tổng hợp số liệu hồ sơ theo đơn vị tiếp nhận, trạng thái và thủ tục hành chính.' },
    guide: { title: 'Hướng dẫn nghiệp vụ', eyebrow: '', description: 'Tài liệu hướng dẫn quy trình tiếp nhận, thụ lý, phê duyệt và trả kết quả trên hệ thống.' },
    profile: { title: 'Tài khoản cá nhân', eyebrow: '', description: 'Thông tin phân quyền, thẩm quyền ký, cập nhật liên hệ và bảo mật phiên đăng nhập.' },
    detail: { title: 'Chi tiết hồ sơ', eyebrow: '', description: '' },
  }
  const pageInfo = pageMeta[page] || pageMeta.home
  const actionOptions = selected ? getActions(user, selected) : []
  const navSections = user.role === 'admin' ? [
    { label: 'QUẢN TRỊ HỆ THỐNG', items: [
      { key: 'overview', label: 'Tổng quan quản trị', icon: 'dashboard', count: undefined as number | undefined },
      { key: 'users', label: 'Tài khoản cán bộ', icon: 'users', count: undefined as number | undefined },
      { key: 'reports', label: 'Báo cáo thống kê', icon: 'reports', count: undefined as number | undefined },
      { key: 'procedures', label: 'Danh mục thủ tục', icon: 'catalog', count: data.procedures.length },
      { key: 'connections', label: 'Tài chính & Tích hợp', icon: 'connections', count: undefined as number | undefined },
      { key: 'news', label: 'Tin tức cổng thông tin', icon: 'news', count: undefined as number | undefined },
      { key: 'guide', label: 'Hướng dẫn nghiệp vụ', icon: 'guide', count: undefined as number | undefined },
    ] },
  ] : [
    { label: 'ĐIỀU HÀNH & TÁC NGHIỆP', items: [
      { key: 'home', label: 'Bàn điều hành', icon: 'dashboard', count: (data.stats.overdue || 0) || undefined },
      { key: 'inbox', label: 'Hộp xử lý hồ sơ', icon: 'inbox', count: actionableCases(user, data.cases).length || data.cases.length },
      ...(['intake', 'leader'].includes(user.role) ? [{ key: 'service_desk', label: 'Quầy một cửa & Lịch hẹn', icon: 'desk', count: undefined as number | undefined }] : []),
    ] },
    { label: 'TRA CỨU & TRUY VẾT', items: [
      { key: 'procedures', label: 'Danh mục thủ tục', icon: 'catalog', count: data.procedures.length },
      { key: 'activity', label: 'Nhật ký xử lý', icon: 'activity', count: undefined as number | undefined },
    ] },
    { label: 'ĐỐI SOÁT & HỆ THỐNG', items: [
      { key: 'connections', label: 'Tài chính & Tích hợp', icon: 'connections', count: undefined as number | undefined },
      ...(user.canManageAgencyAccounts ? [{ key: 'users', label: 'Tài khoản cơ quan', icon: 'users', count: undefined as number | undefined }] : []),
      { key: 'guide', label: 'Hướng dẫn nghiệp vụ', icon: 'guide', count: undefined as number | undefined },
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

  const activeNavKey = page === 'detail' ? 'inbox' : page === 'monitoring' ? 'home' : page

  return <div className={`app-shell${captureMode ? ' capture-mode' : ''}`}>
    <header className="topbar">
      <button className="staff-menu-toggle" aria-label="Mở danh mục cán bộ" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(open => !open)}><span>☰</span><small>Danh mục</small></button>
      <button className="brand-lockup top-brand" aria-label="Trang chính hệ thống quản lý tiếp nhận và giải quyết thủ tục hành chính tại Hà Nội" onClick={() => openPage(user.role === 'admin' ? 'overview' : 'home')}>
        <img className="staff-system-logo" src="/images/hanoi-logo.png" alt="Biểu trưng cổng thông tin Hà Nội" />
        <span><b>HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC</b><small>{user.agencyScope || 'THÀNH PHỐ HÀ NỘI'}</small></span>
      </button>
      <div className="top-right">
        {!!data.storage?.sampleCaseCount && (
          <span className="staff-env-pill" title={`${data.storage.sampleCaseCount.toLocaleString('vi-VN')} hồ sơ tình huống mô phỏng dùng để kiểm thử quy trình`}>
            Dữ liệu mô phỏng ({data.storage.sampleCaseCount})
          </span>
        )}
        <button className="text-button staff-public-link" onClick={() => navigateRoute('public')}>Cổng công dân ↗</button>
        <button className="account-chip account-menu-button" aria-label="Mở tài khoản cá nhân" aria-current={page === 'profile' ? 'page' : undefined} onClick={() => openPage('profile')}>
          <span><b>{user.name}</b><small>{roleNames[user.role] || user.role}</small></span>
          <span className="account-mobile-label">Tài khoản</span>
        </button>
      </div>
    </header>
    {mobileNavOpen && <button className="staff-nav-backdrop" aria-label="Đóng danh mục" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`} aria-label="Điều hướng bàn cán bộ">
      <div className="staff-sidebar-head"><span className="nav-caption">BÀN LÀM VIỆC CÁN BỘ</span><button className="staff-nav-close" aria-label="Đóng danh mục" onClick={() => setMobileNavOpen(false)}>×</button></div>
      {navSections.map(section => (
        <div className="staff-nav-section" key={section.label}>
          <span className="nav-caption">{section.label}</span>
          {section.items.map(item => (
            <button
              key={item.key}
              className={`nav-link${activeNavKey === item.key ? ' active' : ''}`}
              aria-current={activeNavKey === item.key ? 'page' : undefined}
              onClick={() => openPage(item.key)}
            >
              <i aria-hidden="true"><StaffNavIcon name={item.icon} /></i>
              <span>{item.label}</span>
              {item.count !== undefined && <b className="nav-count">{item.count.toLocaleString('vi-VN')}</b>}
            </button>
          ))}
        </div>
      ))}
      <div className="sidebar-footer">
        <button className="nav-link sidebar-signout" onClick={signOut}>
          <i aria-hidden="true"><StaffNavIcon name="signout" /></i>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
    <main className="workspace">
      {page !== 'detail' && (
        <div className="page-heading staff-page-bar">
          <div className="staff-page-bar-title">
            <h1>{pageInfo.title}</h1>
            {pageInfo.description && <p>{pageInfo.description}</p>}
          </div>
          <div className="page-heading-tools">
            {pageHistory.length > 1 && <button className="staff-back-action" onClick={goBack}>← Quay lại</button>}
            {page !== 'profile' && (
              <>
                <span className="scope-stamp">{user.agencyScope || 'Phạm vi được cấp'}</span>
                <button className="refresh-data-button" onClick={() => refresh().then(() => setMessage('Đã đồng bộ lại dữ liệu.')).catch(e => setError(e instanceof Error ? e.message : 'Không thể tải lại dữ liệu.'))}>↻ Làm mới</button>
              </>
            )}
          </div>
        </div>
      )}
      {message && <div className="toast-success" role="status">✓ {message}<button onClick={() => setMessage('')}>Đóng</button></div>}
      {error && <div className="form-error page-error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}
      {page === 'inbox' && <CaseQueue key={queueFocusVersion} user={user} data={data} initialFocus={queueFocus} onOpen={openCase} />}
      {page === 'service_desk' && <div className="connections-workspace"><AdministrativeServiceDesk user={user} procedures={data.procedures} request={api} onCaseCreated={async created => { await refresh(); openCase(created) }} /></div>}
      {page === 'overview' && user.role === 'admin' && <AdminOverview onNavigate={openPage} />}
      {page === 'news' && user.role === 'admin' && <NewsManagement onNotice={setMessage} />}
      {page === 'users' && (user.role === 'admin' || user.canManageAgencyAccounts) && <StaffAccountManagement actor={user} onNotice={setMessage} />}
      {page === 'reports' && user.role === 'admin' && <AdministrativeReports data={data} onOpenQueue={openQueue} />}
      {page === 'detail' && selected && <CaseDetail key={`${selected.code}:${selected.withdrawal?.status || ''}:${selected.withdrawal?.requestReceivedAt || ''}:${JSON.stringify(selected.withdrawal?.noticeDraft || {})}`} item={selected} isStaff={isStaff} signingAuthorityRef={user.signingAuthorityRef || ''} labels={data.statusLabels} actionOptions={actionOptions} action={action} setAction={setAction} actionText={actionText} setActionText={setActionText} assignee={assignee} setAssignee={setAssignee} staff={data.staff || []} busy={busy} onSubmitAction={submitAction} onLookupKeyChanged={async () => { setSelected(await api<CaseFile>(`/api/cases/${encodeURIComponent(selected.code)}`)); await refresh() }} onBack={goBack} />}
      {page === 'detail' && !selected && <div className="panel empty-state">Hãy chọn một hồ sơ trong danh sách để xem chi tiết.</div>}
      {page === 'home' && isStaff && <StaffHome user={user} data={data} initialView="work" onOpen={openCase} onOpenQueue={openQueue} onNavigate={openPage} />}
      {page === 'monitoring' && <OperationsMonitor user={user} data={data} onOpen={openCase} onOpenQueue={openQueue} onNavigate={openPage} />}
      {page === 'procedures' && <ProcedureCatalog procedures={data.procedures} procedureCategories={data.procedureCategories || []} canManage={user.role === 'admin'} onUpdated={refresh} />}
      {page === 'activity' && <CaseActivityLog cases={data.cases} onOpen={openCase} />}
      {page === 'connections' && <ServiceConnections user={user} data={data} onNavigate={openPage} onOpenCase={async created => { await refresh(); openCase(created) }} />}
      {page === 'guide' && <GuideContent isStaff />}
      {page === 'profile' && <PersonalAccount user={user} onChanged={setUser} onNotice={setMessage} />}
    </main>
  </div>
}

function StaffNavIcon({ name }: { name: string }) {
  switch (name) {
    case 'dashboard':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>
    case 'inbox':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
    case 'desk':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /></svg>
    case 'catalog':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
    case 'activity':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    case 'connections':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
    case 'users':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    case 'reports':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
    case 'news':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
    case 'guide':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
    case 'signout':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
    default:
      return null
  }
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
      <div><dt>Quyền ký Mẫu 06</dt><dd>{user.maySignStop ? user.signingAuthorityRef || 'Đã được cấp' : 'Chưa được cấp'}</dd></div>
    </dl></section>
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
    <section className="panel personal-session-panel"><div><h2>Phiên đăng nhập</h2><p>{details ? `${details.activeSessions} phiên còn hiệu lực. Phiên hiện tại hết hạn ${toDate(details.sessionExpiresAt)}.` : 'Đang tải phiên đăng nhập…'}</p></div><button className="button secondary" disabled={!!busy || !details || details.activeSessions <= 1} onClick={closeOtherSessions}>{busy === 'sessions' ? 'Đang kết thúc…' : 'Kết thúc các phiên khác'}</button></section>
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
  const permitted: Record<string, string[]> = { intake: ['accept', 'request_supplement', 'reject_intake', 'assign', 'prepare_stop_notice', 'set_fee', 'digitize_documents', 'deliver', 'submit_supplement'], specialist: ['save_draft', 'submit_review', 'request_supplement', 'verify_original_register', 'assess_data_request', 'verify_published_procedure'], leader: ['approve', 'send_back', 'decline', 'waive_fee', 'sign_result'], registrar: ['issue', 'deliver'], finance: [] }
  const options = [...(all[status] || [])]
  const finish = (values: { value: string; label: string }[]) => values.filter(option => permitted[role]?.includes(option.value) && (!item.workflowGuard || !Array.isArray(item.workflowGuard.allowedActions) || item.workflowGuard.allowedActions.includes(option.value)))
  if (role === 'specialist' && status === 'DANG_THU_LY' && item.workflowGuard?.verificationAction) options.unshift({ value: item.workflowGuard.verificationAction, label: item.workflowGuard.verificationLabel })
  if (role === 'leader' && status === 'DA_PHE_DUYET' && !item.sandboxSignature?.verified) options.push({ value: 'send_back', label: 'Trả lại để kiểm tra, trình duyệt lại' })
  if (role === 'leader' && status === 'DA_PHE_DUYET' && (!item.approvedAt || !item.approvedById || String(item.draftResult || '').trim().length < 10)) {
    return finish(options.filter(option => option.value !== 'sign_result'))
  }
  if (role === 'intake' && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(status) && !item.fee?.amount) options.push({ value: 'set_fee', label: 'Ghi nhận khoản thu có căn cứ' })
  if (role === 'intake' && item.submissionChannel === 'TRUC_TIEP' && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(status)) options.push({ value: 'digitize_documents', label: 'Bổ sung bản quét tại quầy' })
  if (role === 'leader' && ['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET'].includes(status) && item.fee?.status === 'DUE') options.push({ value: 'waive_fee', label: 'Ghi nhận miễn khoản thu' })
  if (role === 'leader' && status === 'DA_PHE_DUYET' && !user.maySignSandbox) return finish(options.filter(option => option.value !== 'sign_result'))
  if (role === 'registrar' && status === 'DA_PHE_DUYET' && !item.sandboxSignature?.verified) return finish(options.filter(option => option.value !== 'issue'))
  const resume = item.supplement?.resumeStatus
  const eligibleSupplement = status === 'CHO_BO_SUNG' && !!resume && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(resume)
  if (role === 'intake' && !!item.acceptedAt && (['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET', 'DA_PHE_DUYET'].includes(status) || eligibleSupplement)) {
    if (!item.withdrawal?.status && !item.resultIssuedAt && !item.decisionIssuedAt && !item.resultNoticeIssuedAt) {
      options.push({ value: 'prepare_stop_notice', label: 'Tiếp nhận yêu cầu dừng · lập Mẫu 06' })
    }
  }
  return finish(options)
}

function StaffAccountManagement({ actor, onNotice }: { actor: User; onNotice: (message: string) => void }) {
  const isSystemAdmin = actor.role === 'admin'
  const [activeTab, setActiveTab] = useState<'directory' | 'requests'>('directory')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [requests, setRequests] = useState<StaffAccessRequest[]>([])
  const [changes, setChanges] = useState<StaffAccountChange[]>([])
  const [busy, setBusy] = useState(false)
  const [reviewing, setReviewing] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [proposedActive, setProposedActive] = useState(true)
  const [agencyFilter, setAgencyFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [accountQuery, setAccountQuery] = useState('')
  const [accountPage, setAccountPage] = useState(1)
  const [accountPageSize, setAccountPageSize] = useState(20)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [signingAuthorityChecks, setSigningAuthorityChecks] = useState<Record<string, boolean>>({})
  const [today] = useState(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  const accessState = (account: ManagedUser) => !account.active ? 'Chưa được duyệt' : account.validFrom && today < account.validFrom ? 'Chờ ngày hiệu lực' : account.validUntil && today > account.validUntil ? 'Hết thời hạn' : 'Đang hiệu lực'
  const agencyOptions = [...new Set(users.map(account => account.agencyScope).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'vi'))
  const visibleUsers = users.filter(account => {
    if (agencyFilter !== 'all' && account.agencyScope !== agencyFilter) return false
    if (roleFilter !== 'all' && account.role !== roleFilter) return false
    const effectiveState = !account.active ? 'Tạm ngưng' : accessState(account)
    if (statusFilter === 'active' && effectiveState !== 'Đang hiệu lực') return false
    if (statusFilter === 'suspended' && effectiveState !== 'Tạm ngưng') return false
    if (statusFilter === 'expired' && effectiveState !== 'Hết thời hạn') return false
    const term = accountQuery.trim().toLocaleLowerCase('vi')
    if (term && !`${account.name} ${account.email} ${roleNames[account.role] || account.role} ${account.agencyScope} ${account.signingAuthorityRef || ''}`.toLocaleLowerCase('vi').includes(term)) return false
    return true
  })
  const hasActiveFilter = accountQuery.trim() !== '' || agencyFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all'
  const accountPageCount = Math.max(1, Math.ceil(visibleUsers.length / accountPageSize))
  const currentAccountPage = Math.min(accountPage, accountPageCount)
  const pagedUsers = visibleUsers.slice((currentAccountPage - 1) * accountPageSize, currentAccountPage * accountPageSize)

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
      setShowCreateForm(false)
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
  const pendingTotal = requests.filter(r => r.status === 'PENDING').length + changes.filter(r => r.status === 'PENDING').length

  return <div className="account-workspace">
    <div className="staff-module-tabs" role="tablist" aria-label="Quản lý tài khoản cán bộ">
      <button type="button" role="tab" aria-selected={activeTab === 'directory'} className={`staff-module-tab${activeTab === 'directory' ? ' active' : ''}`} onClick={() => setActiveTab('directory')}>
        <span>Danh bạ tài khoản</span>
        <b>{users.length.toLocaleString('vi-VN')}</b>
      </button>
      <button type="button" role="tab" aria-selected={activeTab === 'requests'} className={`staff-module-tab${activeTab === 'requests' ? ' active' : ''}`} onClick={() => setActiveTab('requests')}>
        <span>Đề nghị chờ duyệt &amp; Lịch sử</span>
        <b>{pendingTotal}</b>
      </button>
      <div className="staff-module-tabs-end">
        <button type="button" className="button primary compact-btn" onClick={() => setShowCreateForm(open => !open)}>
          {showCreateForm ? 'Đóng biểu mẫu cấp tài khoản' : '+ Lập đề nghị cấp tài khoản'}
        </button>
      </div>
    </div>
    {error && <div className="form-error" role="alert">{error}</div>}
    {showCreateForm && <section className="panel account-create-panel">
      <div className="panel-title">
        <div>
          <h2>Lập đề nghị cấp tài khoản cán bộ</h2>
          <p>Tài khoản chỉ hoạt động sau khi một quản trị viên hệ thống độc lập phê duyệt.</p>
        </div>
        <button type="button" className="text-button" onClick={() => setShowCreateForm(false)}>Thu gọn</button>
      </div>
      <form className="form-grid account-form" onSubmit={createRequest}>
        <label>Họ và tên<input name="name" autoComplete="name" maxLength={150} required /></label>
        <label>Email công vụ<input name="email" type="email" autoComplete="off" maxLength={254} required /></label>
        <label>Số điện thoại<input name="phone" type="tel" autoComplete="off" maxLength={40} /></label>
        <label>Vai trò<select name="role" defaultValue="intake" required><option value="intake">Cán bộ tiếp nhận</option><option value="specialist">Chuyên viên thụ lý</option><option value="leader">Lãnh đạo phê duyệt</option><option value="registrar">Văn thư phát hành</option><option value="finance">Tài chính</option></select></label>
        <label className="span-two">Cơ quan / đơn vị được giao<input name="agencyScope" maxLength={180} defaultValue={isSystemAdmin ? '' : actor.agencyScope} readOnly={!isSystemAdmin} placeholder="Nhập đúng tên cơ quan/đơn vị theo danh mục nội bộ" required /></label>
        <label className="span-two check-row"><input name="maySignStop" type="checkbox" /> Đề nghị cấp quyền ký Thông báo dừng Mẫu 06 (chỉ dành cho người có văn bản phân công thẩm quyền)</label>
        <label className="span-two">Số văn bản phân công thẩm quyền ký Mẫu 06<input name="signingAuthorityRef" maxLength={180} placeholder="Chỉ nhập khi đề nghị quyền ký Mẫu 06" /></label>
        <label>Hiệu lực từ<input name="validFrom" type="date" min={today} defaultValue={today} required /></label>
        <label>Hiệu lực đến<input name="validUntil" type="date" min={today} required /></label>
        <label className="span-two">Căn cứ cấp quyền<textarea name="reason" rows={2} minLength={12} maxLength={1200} placeholder="Số quyết định, phân công nhiệm vụ hoặc căn cứ nghiệp vụ" required /></label>
        <label>Mật khẩu khởi tạo<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><small className="field-help">Tối thiểu 12 ký tự, có chữ hoa, chữ thường và chữ số.</small></label>
        <label>Xác nhận mật khẩu<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <div className="form-actions span-two"><button type="button" className="button secondary" onClick={() => setShowCreateForm(false)}>Hủy</button><button className="button primary" disabled={busy}>{busy ? 'Đang lập đề nghị…' : 'Gửi người duyệt'}</button></div>
      </form>
    </section>}
    {activeTab === 'directory' && <section className="panel account-directory-panel">
      <div className="account-list-tools" role="search" aria-label="Bộ lọc và tìm kiếm tài khoản">
        <label className="account-search-field">
          <span>Tìm kiếm tài khoản</span>
          <input className="search-input" type="search" value={accountQuery} onChange={e => { setAccountQuery(e.target.value); setAccountPage(1) }} placeholder="Nhập họ tên, email công vụ, cơ quan, vai trò…" />
        </label>
        {isSystemAdmin && <label className="account-filter-field">
          <span>Cơ quan / Đơn vị</span>
          <select value={agencyFilter} onChange={e => { setAgencyFilter(e.target.value); setAccountPage(1) }}>
            <option value="all">Tất cả cơ quan ({agencyOptions.length})</option>
            {agencyOptions.map(agency => <option key={agency} value={agency}>{agency}</option>)}
          </select>
        </label>}
        <label className="account-role-field">
          <span>Vai trò nghiệp vụ</span>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setAccountPage(1) }}>
            <option value="all">Tất cả vai trò</option>
            {Object.entries(roleNames).filter(([role]) => role !== 'citizen').map(([role, label]) => <option key={role} value={role}>{label}</option>)}
          </select>
        </label>
        <label className="account-status-field">
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setAccountPage(1) }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiệu lực</option>
            <option value="suspended">Tạm ngưng / Chưa duyệt</option>
            <option value="expired">Hết thời hạn</option>
          </select>
        </label>
        <div className="account-list-export">
          {hasActiveFilter && <button type="button" className="button secondary" onClick={() => { setAccountQuery(''); setAgencyFilter('all'); setRoleFilter('all'); setStatusFilter('all'); setAccountPage(1) }}>Xóa lọc</button>}
          <a className="button secondary" href={`/api/export/users.csv${agencyFilter !== 'all' ? `?agency=${encodeURIComponent(agencyFilter)}` : ''}`}>Xuất CSV</a>
          <button type="button" className="button secondary" onClick={() => printInternalTable('Danh sách tài khoản cán bộ', agencyFilter === 'all' ? 'Tất cả cơ quan trong phạm vi quản trị hệ thống' : agencyFilter, ['STT','Họ tên','Email công vụ','Vai trò','Cơ quan / Đơn vị','Thời hạn hiệu lực','Trạng thái','Quản lý TK cơ quan'], visibleUsers.map((account, idx) => [String(idx + 1), account.name, account.email, roleNames[account.role] || account.role, account.agencyScope, `${account.validFrom || 'Không giới hạn'} – ${account.validUntil || 'Không giới hạn'}`, !account.active ? 'Tạm ngưng' : accessState(account), account.canManageAgencyAccounts ? 'Có' : 'Không']))}>In danh sách</button>
        </div>
      </div>
      {visibleUsers.length ? <>
        <div className="data-table-wrap">
          <table className="data-table account-table">
            <thead>
              <tr>
                <th className="col-stt">STT</th>
                <th className="col-user">Họ tên &amp; Email công vụ</th>
                <th className="col-role">Vai trò</th>
                <th className="col-agency">Cơ quan / Đơn vị</th>
                <th className="col-validity">Thời hạn hiệu lực</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((account, index) => {
                const state = accessState(account)
                const pendingChange = changes.some(change => change.userId === account.id && change.status === 'PENDING')
                const stt = (currentAccountPage - 1) * accountPageSize + index + 1
                const isEditing = editing?.id === account.id
                return <Fragment key={account.id}>
                  <tr className={isEditing ? 'is-editing' : undefined}>
                    <td className="col-stt" data-label="STT">{stt}</td>
                    <td className="col-user" data-label="Tài khoản cán bộ">
                      <div className="account-cell-user">
                        <b>{account.name}</b>
                        <span className="account-cell-email">{account.email}</span>
                        {(account.canManageAgencyAccounts || account.maySignStop || account.mustChangePassword) && <div className="account-cell-badges">
                          {account.canManageAgencyAccounts && <span className="account-meta-tag">Quản lý TK cơ quan</span>}
                          {account.maySignStop && <span className="account-meta-tag">Ký Mẫu 06 · {account.signingAuthorityRef}</span>}
                          {account.mustChangePassword && <span className="account-meta-tag warning">Chưa đổi mật khẩu khởi tạo</span>}
                        </div>}
                      </div>
                    </td>
                    <td className="col-role" data-label="Vai trò">
                      <span className="account-role-badge">{roleNames[account.role] || account.role}</span>
                    </td>
                    <td className="col-agency" data-label="Cơ quan / Đơn vị">
                      <span className="account-cell-agency">{account.agencyScope || 'Chưa khai báo phạm vi'}</span>
                    </td>
                    <td className="col-validity" data-label="Thời hạn hiệu lực">
                      <span className="account-cell-validity">{account.validFrom || 'Không giới hạn'} <small>đến</small> {account.validUntil || 'Không giới hạn'}</span>
                    </td>
                    <td className="col-status" data-label="Trạng thái">
                      <span className={`request-status ${state === 'Đang hiệu lực' ? 'request-approved' : state === 'Hết thời hạn' || !account.active ? 'request-rejected' : 'request-pending'}`}>
                        {!account.active ? 'Tạm ngưng' : state}
                      </span>
                    </td>
                    <td className="col-actions" data-label="Thao tác">
                      <div className="managed-user-actions">
                        <button type="button" className="button secondary compact-btn" disabled={busy || pendingChange || account.id === actor.id || (!isSystemAdmin && account.role === 'admin')} onClick={() => isEditing ? setEditing(null) : beginAccountChange(account)}>
                          {pendingChange ? 'Chờ duyệt' : isEditing ? 'Đóng' : 'Điều chỉnh'}
                        </button>
                        {account.active && <button type="button" className="button secondary compact-btn" disabled={busy || pendingChange || account.id === actor.id || (!isSystemAdmin && account.role === 'admin')} onClick={() => beginAccountChange(account, false)}>
                          Tạm ngưng
                        </button>}
                        {isSystemAdmin && account.maySignStop && <button type="button" className="button secondary compact-btn" disabled={busy} onClick={() => revokeStopSigning(account)}>
                          Thu hồi ký Mẫu 06
                        </button>}
                      </div>
                    </td>
                  </tr>
                  {isEditing && <tr className="account-edit-row">
                    <td colSpan={7}>
                      <form className="account-change-form" onSubmit={submitAccountChange}>
                        <div className="account-change-form-title">
                          <b>Đề nghị thay đổi quyền truy cập · {account.name} ({account.email})</b>
                          <button type="button" className="text-button" onClick={() => setEditing(null)}>Đóng</button>
                        </div>
                        <div className="form-grid account-form">
                          <label>Vai trò<select name="role" defaultValue={account.role} required>{Object.entries(roleNames).filter(([role]) => isSystemAdmin || role !== 'admin').map(([role, label]) => <option key={role} value={role}>{label}</option>)}</select></label>
                          <label>Cơ quan / phạm vi<input name="agencyScope" defaultValue={account.agencyScope} maxLength={180} required readOnly={!isSystemAdmin} /></label>
                          <label>Hiệu lực từ<input name="validFrom" type="date" defaultValue={account.validFrom} /></label>
                          <label>Hiệu lực đến<input name="validUntil" type="date" defaultValue={account.validUntil} /></label>
                          {isSystemAdmin && account.role !== 'admin' && <label className="span-two check-row"><input name="canManageAgencyAccounts" type="checkbox" defaultChecked={account.canManageAgencyAccounts} /> Quản lý tài khoản cán bộ trong cơ quan được giao</label>}
                          <label className="span-two check-row"><input type="checkbox" checked={proposedActive} onChange={e => setProposedActive(e.target.checked)} /> Tài khoản được kích hoạt sau khi duyệt</label>
                          <label className="span-two">Căn cứ điều chỉnh<textarea name="reason" rows={2} minLength={12} maxLength={1200} placeholder="Quyết định điều động, phân công, chấm dứt nhiệm vụ hoặc căn cứ nghiệp vụ" required /></label>
                          <div className="form-actions span-two">
                            <button type="button" className="button secondary" onClick={() => setEditing(null)}>Hủy</button>
                            <button className="button primary" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi người duyệt'}</button>
                          </div>
                        </div>
                      </form>
                    </td>
                  </tr>}
                </Fragment>
              })}
            </tbody>
          </table>
        </div>
        <div className="account-pagination">
          <div className="account-pagination-info">
            <span>Hiển thị <b>{(currentAccountPage - 1) * accountPageSize + 1}–{Math.min(currentAccountPage * accountPageSize, visibleUsers.length)}</b> / <b>{visibleUsers.length.toLocaleString('vi-VN')}</b> tài khoản</span>
            <label className="account-pagesize-select">
              <span>Số dòng:</span>
              <select value={accountPageSize} onChange={e => { setAccountPageSize(Number(e.target.value)); setAccountPage(1) }}>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
                <option value={1000}>Tất cả</option>
              </select>
            </label>
          </div>
          {accountPageCount > 1 && <div className="account-pagination-controls">
            <button type="button" className="button secondary compact-btn" disabled={currentAccountPage <= 1} onClick={() => setAccountPage(1)}>« Đầu</button>
            <button type="button" className="button secondary compact-btn" disabled={currentAccountPage <= 1} onClick={() => setAccountPage(p => Math.max(1, p - 1))}>‹ Trước</button>
            <span className="account-page-indicator">Trang <b>{currentAccountPage}</b> / {accountPageCount}</span>
            <button type="button" className="button secondary compact-btn" disabled={currentAccountPage >= accountPageCount} onClick={() => setAccountPage(p => Math.min(accountPageCount, p + 1))}>Sau ›</button>
            <button type="button" className="button secondary compact-btn" disabled={currentAccountPage >= accountPageCount} onClick={() => setAccountPage(accountPageCount)}>Cuối »</button>
          </div>}
        </div>
      </> : <div className="empty-state">Không tìm thấy tài khoản phù hợp với điều kiện lọc.</div>}
    </section>}
    {activeTab === 'requests' && <div className="account-Secondary-grid">
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Đề nghị cấp quyền mới</h2>
            <p>Lịch sử lập và phê duyệt tài khoản mới.</p>
          </div>
          <span className="count-chip">{requests.filter(r => r.status === 'PENDING').length} chờ duyệt</span>
        </div>
        {requests.length ? <div className="access-request-list">{requests.map(request => <article className="access-request-card" key={request.id}>
          <div className="access-request-top"><div><b>{request.name}</b><small>{request.email} · {roleNames[request.role] || request.role}</small></div><span className={`request-status request-${request.status.toLowerCase()}`}>{request.status === 'PENDING' ? 'Chờ duyệt' : request.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</span></div>
          <div className="access-request-facts"><span><small>Cơ quan</small><b>{request.agencyScope}</b></span><span><small>Thời hạn</small><b>{request.validFrom} – {request.validUntil}</b></span><span><small>Người đề nghị</small><b>{request.requestedBy}</b></span>{request.reviewedBy && <span><small>Người duyệt</small><b>{request.reviewedBy}</b></span>}</div>
          {request.maySignStop && <p className="request-reason"><b>Đề nghị quyền ký Mẫu 06:</b> {request.signingAuthorityRef}.</p>}
          <p className="request-reason"><b>Căn cứ:</b> {request.reason}</p>
          {request.status === 'PENDING' && request.requestedById === actor.id && <p className="form-notice">Bạn đã lập đề nghị này; cần một quản trị viên khác xử lý.</p>}
          {!isSystemAdmin && request.status === 'PENDING' && request.requestedById !== actor.id && <p className="form-notice">Đề nghị đang chờ quản trị viên hệ thống duyệt.</p>}
          {isSystemAdmin && request.status === 'PENDING' && request.requestedById !== actor.id && <div className="request-review">{request.maySignStop && <label className="check-row"><input type="checkbox" checked={signingAuthorityChecks[request.id] === true} onChange={e => setSigningAuthorityChecks(current => ({ ...current, [request.id]: e.target.checked }))} /> Đã đối chiếu văn bản phân công thẩm quyền ký Mẫu 06</label>}<label>Ý kiến duyệt / căn cứ từ chối<textarea value={reviewNotes[request.id] || ''} onChange={e => setReviewNotes(current => ({ ...current, [request.id]: e.target.value }))} rows={2} maxLength={1200} /></label><div className="form-actions"><button className="button secondary" disabled={reviewing === request.id} onClick={() => reviewRequest(request, 'reject')}>Từ chối</button><button className="button primary" disabled={reviewing === request.id} onClick={() => reviewRequest(request, 'approve')}>{reviewing === request.id ? 'Đang xử lý…' : 'Duyệt quyền'}</button></div></div>}
          {request.status === 'REJECTED' && request.reviewNote && <p className="request-reason"><b>Căn cứ từ chối:</b> {request.reviewNote}</p>}
        </article>)}</div> : <div className="empty-state">Chưa có đề nghị cấp quyền mới.</div>}
      </section>
      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Đề nghị điều chỉnh tài khoản</h2>
            <p>Thay đổi vai trò, thời hạn hoặc trạng thái hoạt động.</p>
          </div>
          <span className="count-chip">{changes.filter(change => change.status === 'PENDING').length} chờ xử lý</span>
        </div>
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
    </div>}
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
  const [tab, setTab] = useState<'agency' | 'procedure'>('agency')
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
    <section className="panel report-filters">
      <label className="report-agency-field"><span>Cơ quan tiếp nhận</span><select value={agency} onChange={e => setAgency(e.target.value)}><option value="">Tất cả cơ quan</option>{(report?.agencies || []).map(item => <option key={item} value={item}>{item}</option>)}</select></label>
      <ReportDateField label="Từ ngày" value={from} onChange={setFrom} />
      <ReportDateField label="Đến ngày" value={to} onChange={setTo} />
      <div className="report-filter-actions">
        <a className="button secondary" href={`/api/reporting/summary.csv${suffix}`}>Xuất CSV</a>
        {report && <button className="button secondary" onClick={() => printInternalTable('Báo cáo vận hành hồ sơ theo cơ quan', subtitle, ['Nhóm tổng hợp','Đơn vị / giá trị','Số lượng'], [...report.byAgency.map(row => ['Theo cơ quan',row.name,String(row.count)]),...report.byStatus.map(row => ['Theo trạng thái',row.name,String(row.count)]),...report.byProcedure.map(row => ['Theo thủ tục',row.name,String(row.count)]),...report.byAgencyStatus.map(row => ['Cơ quan và trạng thái',`${row.agency} · ${row.status}`,String(row.count)])])}>In báo cáo</button>}
      </div>
    </section>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading && <section className="panel"><p>Đang tổng hợp dữ liệu…</p></section>}
    {report && !loading && <>
      <section className="metric-grid report-metrics">
        <MetricCard label="Tổng số hồ sơ" value={report.total} note={`${report.realTotal} phát sinh · ${report.sampleTotal} mô phỏng`} tone="navy" />
        <MetricCard label="Đơn vị có hồ sơ" value={report.byAgency.length} note="Cơ quan tiếp nhận trong kỳ" tone="blue" />
        <MetricCard label="Nhóm trạng thái" value={report.byStatus.length} note="Trạng thái xử lý hiện hành" tone="green" />
      </section>
      <div className="staff-module-tabs" role="tablist" aria-label="Chế độ xem báo cáo">
        <button type="button" role="tab" aria-selected={tab === 'agency'} className={`staff-module-tab${tab === 'agency' ? ' active' : ''}`} onClick={() => setTab('agency')}>
          <span>Theo cơ quan &amp; trạng thái</span>
          <b>{report.byAgencyStatus.length}</b>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'procedure'} className={`staff-module-tab${tab === 'procedure' ? ' active' : ''}`} onClick={() => setTab('procedure')}>
          <span>Theo thủ tục hành chính</span>
          <b>{report.byProcedure.length}</b>
        </button>
      </div>
      {tab === 'agency' ? (
        <section className="panel report-table-panel">
          <PanelHeading title="Tổng hợp hồ sơ theo cơ quan và trạng thái" description={subtitle} />
          {report.byAgencyStatus.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Cơ quan tiếp nhận</th><th>Trạng thái hiện tại</th><th>Số hồ sơ</th><th>Thao tác</th></tr></thead><tbody>{report.byAgencyStatus.map(row => { const statuses = Object.entries(data.statusLabels).filter(([, label]) => label === row.status).map(([code]) => code); return <tr key={`${row.agency}-${row.status}`}><td data-label="Cơ quan tiếp nhận">{row.agency}</td><td data-label="Trạng thái hiện tại">{row.status}</td><td data-label="Số hồ sơ"><b>{row.count}</b></td><td data-label="Thao tác"><button className="report-drilldown-link" onClick={() => onOpenQueue({ agencyFilter: row.agency, statuses, createdFrom: from, createdTo: to, label: `${row.agency} · ${row.status}` })}>Mở danh sách →</button></td></tr> })}</tbody></table></div> : <div className="report-compact-empty">Chưa có dòng tổng hợp theo cơ quan và trạng thái trong điều kiện đã chọn.</div>}
        </section>
      ) : (
        <section className="panel report-table-panel">
          <PanelHeading title="Phân bố hồ sơ theo thủ tục hành chính" description="Chọn một dòng để mở danh sách hồ sơ tương ứng." />
          {report.byProcedure.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Mã và tên thủ tục</th><th>Số hồ sơ</th><th>Thao tác</th></tr></thead><tbody>{report.byProcedure.map(row => { const code = row.name.split(' · ')[0]; return <tr key={row.name}><td data-label="Mã và tên thủ tục">{row.name}</td><td data-label="Số hồ sơ"><b>{row.count}</b></td><td data-label="Thao tác"><button className="report-drilldown-link" onClick={() => onOpenQueue({ procedureCode: code, createdFrom: from, createdTo: to, label: row.name })}>Mở danh sách →</button></td></tr> })}</tbody></table></div> : <div className="report-compact-empty">Chưa có hồ sơ để phân bổ theo thủ tục.</div>}
        </section>
      )}
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
    <div className="news-management-toolbar">
      <div className="news-management-stats">
        <div><b>{stats.total}</b><span>Tổng số bài</span></div>
        <div><b>{stats.published}</b><span>Đang công khai</span></div>
        <div><b>{stats.draft}</b><span>Bản nháp</span></div>
        <div><b>{stats.archived}</b><span>Đã lưu trữ</span></div>
      </div>
      <button className="button primary" onClick={newArticle}>＋ Soạn bài viết mới</button>
    </div>
    {error&&<div className="form-error" role="alert">{error}</div>}
    <div className="news-management-layout"><section className="news-list-panel"><div className="news-list-controls"><label>Tìm bài viết<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tiêu đề, tóm tắt, chuyên mục…" /></label><label>Trạng thái<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">Tất cả</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đang công khai</option><option value="ARCHIVED">Đã lưu trữ</option></select></label></div>{loading?<p role="status">Đang tải danh sách tin…</p>:shown.length?<div className="managed-news-list">{shown.map(article=><article className={`managed-news-row${editing?.id===article.id?' active':''}`} key={article.id}><button className="managed-news-select" onClick={()=>{setEditing(article);setError('')}}><span className={`news-status news-status-${article.status.toLowerCase()}`}>{article.status==='PUBLISHED'?'Đang công khai':article.status==='DRAFT'?'Bản nháp':'Đã lưu trữ'}</span><b>{article.title}</b><small>{article.category} · {article.date||toDate(article.updatedAt)}</small></button><div className="managed-news-actions">{article.status==='PUBLISHED'?<button className="text-button" disabled={busy} onClick={()=>void changeStatus(article,'archive')}>Lưu trữ</button>:article.status==='ARCHIVED'?<button className="text-button" disabled={busy} onClick={()=>void changeStatus(article,'draft')}>Khôi phục nháp</button>:null}</div></article>)}</div>:<div className="empty-state">Không có bài viết phù hợp.</div>}</section>
      <section className="news-editor-panel">{editing?<><div className="news-editor-heading"><div><h2>{editing.id?'Hiệu chỉnh bài viết':'Soạn bài viết mới'}</h2></div>{editing.id&&<span className={`news-status news-status-${editing.status.toLowerCase()}`}>{editing.status==='PUBLISHED'?'Đang công khai':editing.status==='DRAFT'?'Bản nháp':'Đã lưu trữ'}</span>}</div><form className="news-editor-form" onSubmit={submit} key={`${editing.id}:${editing.version}`}><input type="hidden" name="id" value={editing.id}/><input type="hidden" name="version" value={editing.version}/><label><span>Tiêu đề <b className="required-mark">*</b></span><input name="title" defaultValue={editing.title} required minLength={8} maxLength={180}/></label><label><span>Tóm tắt <b className="required-mark">*</b></span><textarea name="summary" defaultValue={editing.summary} rows={2} required minLength={20} maxLength={500}/></label><label><span>Nội dung <b className="required-mark">*</b></span><textarea name="body" defaultValue={editing.body} rows={8} required minLength={30} maxLength={20000} placeholder="Mỗi đoạn cách nhau bằng một dòng trống."/></label><div className="news-editor-grid"><label>Chuyên mục<select name="category" defaultValue={editing.category}>{categories.map(value=><option key={value}>{value}</option>)}</select></label><label>Ảnh đại diện<select name="image" defaultValue={editing.image}><option value="">Không dùng ảnh</option>{images.map(value=><option key={value} value={value}>{value}</option>)}</select></label></div><label>Nguồn tin chính thức (.gov.vn)<input name="sourceUrl" type="url" defaultValue={editing.sourceUrl} maxLength={600} placeholder="https://…gov.vn/…"/></label><label className="news-featured-check"><input type="checkbox" name="featured" defaultChecked={editing.featured}/> Đưa lên vị trí tin nổi bật</label><div className="news-editor-actions"><button className="button secondary" type="submit" value="save" disabled={busy}>{busy?'Đang lưu…':'Lưu bản nháp'}</button><button className="button primary" type="submit" value="publish" disabled={busy}>{editing.status==='PUBLISHED'?'Cập nhật công khai':'Xuất bản tin'}</button></div>{editing.id&&<small>Phiên bản {editing.version} · Cập nhật {toDate(editing.updatedAt)}</small>}</form></>:<div className="news-editor-empty"><h2>Chọn bài viết để biên tập</h2><p>Chọn một bài viết ở danh sách bên trái hoặc bấm “Soạn bài viết mới”.</p></div>}</section></div>
    <section className="news-audit-panel"><h2>Nhật ký biên tập gần đây</h2>{history.length?<div>{history.slice(0,8).map(item=><p key={item.id}><b>{item.actor_name}</b> · {item.action==='PUBLISH'?'xuất bản':item.action==='ARCHIVE'?'lưu trữ':item.action==='DRAFT'?'chuyển về bản nháp':item.action==='CREATE_DRAFT'?'tạo bản nháp':'cập nhật'} · {articles.find(article=>article.id===item.news_id)?.title||'Tin đã lưu trữ'} <time>{toDate(item.created_at)}</time></p>)}</div>:<p>Chưa có thao tác biên tập.</p>}</section>
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
      <MetricCard label="Tổng tài khoản cán bộ" value={accounts.length} note="Mở danh bạ tài khoản" tone="navy" onClick={() => onNavigate('users')} />
      <MetricCard label="Đang có hiệu lực" value={activeAccounts.length} note="Đã kích hoạt và còn hạn" tone="blue" onClick={() => onNavigate('users')} />
      <MetricCard label="Sắp hết hạn (≤ 30 ngày)" value={expiring.length} note="Cần rà soát gia hạn" tone="amber" onClick={() => onNavigate('users')} />
      <MetricCard label="Đề nghị chờ duyệt" value={pending.length} note="Cấp mới hoặc điều chỉnh quyền" tone="red" onClick={() => onNavigate('users')} />
    </section>
    {loading && <div className="panel empty-state" role="status">Đang tải danh sách tài khoản và lịch sử phê duyệt…</div>}
    <div className="dashboard-columns admin-overview-grid">
      <section className="panel dashboard-panel">
        <PanelHeading title="Phân bổ theo vai trò nghiệp vụ" description="Số lượng tài khoản theo nhóm thẩm quyền." action={<button className="text-button" onClick={() => onNavigate('users')}>Quản lý tài khoản →</button>} />
        {roleBreakdown.length ? <div className="admin-role-list">{roleBreakdown.map(item => <div key={item.role}><span>{item.label}</span><b>{item.count}</b><button className="text-button" onClick={() => onNavigate('users')}>Chi tiết</button></div>)}</div> : !loading && <div className="empty-state compact-empty">Chưa có tài khoản cán bộ.</div>}
      </section>
      <section className="panel dashboard-panel">
        <PanelHeading title="Đề nghị phân quyền chờ xử lý" description="Yêu cầu phê duyệt độc lập từ quản trị viên khác." action={<button className="text-button" onClick={() => onNavigate('users')}>Xử lý đề nghị →</button>} />
        {pending.length ? <div className="admin-review-list">{pending.slice(0, 6).map(item => <div key={`${item.kind}-${item.id}`}><span><b>{item.name}</b><small>{item.kind} · {item.detail}</small></span><time>{toDate(item.at)}</time></div>)}</div> : !loading && <div className="empty-state compact-empty">Không có đề nghị đang chờ duyệt.</div>}
      </section>
    </div>
    <div className="dashboard-columns admin-overview-grid">
      <section className="panel dashboard-panel">
        <PanelHeading title="Tài khoản sắp hết thời hạn" description="Trong vòng 30 ngày tới." action={<button className="text-button" onClick={() => onNavigate('users')}>Gia hạn →</button>} />
        {expiring.length ? <div className="admin-expiry-list">{expiring.map(account => <div key={account.id}><span><b>{account.name}</b><small>{account.email} · {account.agencyScope}</small></span><time>Hết hạn {toDate(account.validUntil)}</time></div>)}</div> : !loading && <div className="empty-state compact-empty">Không có tài khoản hết hạn trong 30 ngày tới.</div>}
      </section>
      <section className="panel dashboard-panel">
        <PanelHeading title="Lịch sử cấp và điều chỉnh gần đây" description="Truy vết các quyết định phân quyền mới nhất." action={<button className="text-button" onClick={() => onNavigate('users')}>Xem tất cả →</button>} />
        {recent.length ? <div className="admin-review-list">{recent.map(item => <div key={item.id}><span><b>{item.name}</b><small>{item.detail}</small></span><time>{toDate(item.at)}</time></div>)}</div> : !loading && <div className="empty-state compact-empty">Chưa có lịch sử cấp hoặc điều chỉnh.</div>}
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
      <section className="guide-lead"><h2>Tra cứu, gửi và theo dõi hồ sơ trực tuyến</h2><p>Hệ thống cung cấp đầy đủ thông tin thủ tục hành chính, biểu mẫu tờ khai điện tử và tra cứu tiến độ giải quyết hồ sơ trực tuyến.</p><div className="guide-links"><a className="button secondary" href="/thu-tuc">Tra cứu danh mục thủ tục</a><a className="button primary" href="/nop-ho-so">Mở trang nộp hồ sơ</a></div></section>
      <ol className="guide-steps">
        <li><b>Tìm và xem thông tin thủ tục</b><p>Mở “Danh mục thủ tục”, lọc theo tên, mã hoặc lĩnh vực rồi chọn một kết quả để xem trình tự, thành phần hồ sơ và cơ quan thực hiện.</p></li>
        <li><b>Chọn thủ tục, cơ quan và khai tờ khai</b><p>Trang nộp có 5 bước: chọn thủ tục &amp; cơ quan tiếp nhận, khai thông tin chủ hồ sơ, điền tờ khai chuyên ngành, đính kèm thành phần giấy tờ và xác nhận gửi.</p></li>
        <li><b>Đính kèm giấy tờ, kiểm tra và gửi</b><p>Tải giấy tờ theo từng thành phần, tối đa 8 tệp (mỗi tệp tối đa 8 MB). Kiểm tra lại tờ khai và chọn phương thức nhận kết quả.</p></li>
        <li><b>Theo dõi tiến độ và bổ sung hồ sơ</b><p>Mở “Tra cứu hồ sơ” để xem trạng thái xử lý theo thời gian thực, tải phiếu tiếp nhận hoặc gửi bổ sung tài liệu khi có yêu cầu.</p></li>
      </ol>
    </> : <>
      <section className="guide-lead"><h2>Quy trình tác nghiệp trên Bàn làm việc cán bộ</h2><p>Bàn cán bộ tổ chức tập trung theo luồng: Bàn điều hành &amp; Giám sát, Hộp xử lý hồ sơ, Quầy một cửa &amp; Lịch hẹn, Danh mục thủ tục và Đối soát tài chính.</p>{!isStaff && <a className="button primary" href="/staff">Đăng nhập bàn cán bộ</a>}</section>
      <section className="guide-note"><b>Tài khoản hệ thống và mật khẩu mặc định</b><p>Tài khoản cán bộ và quản trị viên được cấp theo cơ quan/đơn vị, sử dụng mật khẩu mặc định là <code>123</code>. Có thể đổi mật khẩu trong mục “Tài khoản cá nhân”.</p></section>
      <ol className="guide-steps">
        <li><b>Điều hành &amp; Chọn việc cần xử lý</b><p>Từ “Bàn điều hành”, theo dõi ngay các hồ sơ có thể xử lý theo vai trò, hồ sơ sắp đến hạn và quá hạn. Chuyển sang tab “Phân tích &amp; Giám sát hạn” để rà soát tải công việc theo đơn vị và chuyên viên.</p></li>
        <li><b>Tiếp nhận tại quầy &amp; Xử lý lịch hẹn</b><p>Tại “Quầy một cửa &amp; Lịch hẹn”, cán bộ Một cửa sử dụng 3 tab riêng biệt để lập hồ sơ trực tiếp tại quầy, xác nhận công dân đến theo lịch hẹn và trả lời phản ánh kiến nghị.</p></li>
        <li><b>Thẩm định, phê duyệt và phát hành trên Chi tiết hồ sơ 2 cột</b><p>Mở một hồ sơ từ “Hộp xử lý”: cột phải hiển thị ngay khung “Xử lý hồ sơ” cố định cùng tóm tắt thông tin chủ hồ sơ; cột trái chia thành 3 tab rõ ràng (Tờ khai &amp; Thành phần hồ sơ · Thẩm định, Tài chính &amp; Kết quả · Nhật ký xử lý).</p></li>
        <li><b>In biểu mẫu nội bộ (Mẫu 01, 02, 03, 06) &amp; Cấp khóa tra cứu</b><p>Ngay trên thanh tiêu đề của hồ sơ, cán bộ có thể in Phiếu tiếp nhận (Mẫu 01), Phiếu yêu cầu bổ sung (Mẫu 02), Phiếu từ chối (Mẫu 03) hoặc bấm “Mã &amp; Khóa tra cứu” để xem/cấp lại khóa cho công dân.</p></li>
      </ol>
    </>}
  </div>
}

function StandaloneGuide({ signedIn, onHome, onStaff }: { signedIn: boolean; onHome: () => void; onStaff: () => void }) {
  return <div className="public-site guide-site">
    <div className="agency-masthead"><div className="agency-masthead-inner"><a className="agency-emblem" href="/" aria-label="Về cổng thông tin Hà Nội"><img src="/images/hanoi-logo.png" alt="Biểu trưng Hà Nội" /></a><div className="agency-title"><span>TRANG THÔNG TIN ĐIỆN TỬ</span><b>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG<br /> THÀNH PHỐ HÀ NỘI</b><small>HƯỚNG DẪN THAO TÁC TRÊN CỔNG VÀ BÀN CÁN BỘ</small></div></div></div>
    <header className="guide-site-header"><button className="text-button" onClick={onHome}> {signedIn ? 'Về bàn cán bộ' : 'Về trang chủ'}</button><button className="button primary" onClick={onStaff}>{signedIn ? 'Mở bàn cán bộ' : 'Đăng nhập cán bộ'}</button></header>
    <main className="guide-site-main"><GuideContent /></main>
    <footer className="public-footer"><span>Hướng dẫn thao tác trong ứng dụng. Giao dịch chính thức cần thực hiện trên cổng có thẩm quyền.</span><a href="/thu-tuc">Về danh mục thủ tục</a></footer>
  </div>
}

function StaffHome({
  user,
  data,
  initialView = 'work',
  onOpen,
  onOpenQueue,
  onNavigate,
}: {
  user: User
  data: Bootstrap
  initialView?: 'work' | 'monitor'
  onOpen: (item: CaseFile) => void
  onOpenQueue: (focus?: QueueFocus) => void
  onNavigate: (page: string) => void
}) {
  const [viewMode, setViewMode] = useState<'work' | 'monitor'>(initialView)
  const [period, setPeriod] = useState('30')
  const [loadedAt] = useState(() => Date.now())
  const [workingDate] = useState(() =>
    new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  )

  const actionable = actionableCases(user, data.cases)
  const openCases = data.cases.filter(item => !CLOSED_STATUSES.has(item.status))
  const overdue = openCases.filter(item => (daysUntil(item.deadline) ?? 999) < 0)
  const dueSoon = openCases.filter(item => {
    const days = daysUntil(item.deadline)
    return days !== null && days >= 0 && days <= 3
  })
  const unassigned = data.cases.filter(item => item.status === 'DA_TIEP_NHAN' && !item.assignment?.assigneeId)
  const recent = caseEvents(data.cases).slice(0, 6)
  const attention = [
    ...new Map([...overdue, ...dueSoon, ...unassigned, ...actionable].map(item => [item.code, item])).values(),
  ]
    .sort((a, b) => (daysUntil(a.deadline) ?? 999) - (daysUntil(b.deadline) ?? 999))
    .slice(0, 8)

  // Monitoring & Period metrics
  const since = period === 'all' ? 0 : loadedAt - Number(period) * 86400000
  const updatedSince = period === 'all' ? '' : hanoiDate(new Date(since).toISOString())
  const periodCases = data.cases.filter(item => Date.parse(item.updatedAt || item.createdAt) >= since)
  const periodOpen = periodCases.filter(item => !CLOSED_STATUSES.has(item.status))
  const periodCompleted = periodCases.filter(item => ['HOAN_THANH', 'DA_PHAT_HANH'].includes(item.status)).length
  const periodOverdue = periodOpen.filter(item => (daysUntil(item.deadline) ?? 999) < 0)
  const statusRows = Object.entries(data.statusLabels)
    .map(([status, label]) => ({ status, label, count: periodCases.filter(item => item.status === status).length }))
    .filter(row => row.count)
    .sort((a, b) => b.count - a.count)
  const highestStatus = Math.max(1, ...statusRows.map(row => row.count))
  const byAgency = new Map<string, number>()
  const byAssignee = new Map<string, { name: string; count: number }>()
  periodOpen.forEach(item => {
    const agency = item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan'
    const assigneeId = item.assignment?.assigneeId || item.assignment?.assignee || item.assignment?.assigneeName || 'unassigned'
    const assigneeName = item.assignment?.assignee || item.assignment?.assigneeName || (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')
    byAgency.set(agency, (byAgency.get(agency) || 0) + 1)
    byAssignee.set(assigneeId, { name: assigneeName, count: (byAssignee.get(assigneeId)?.count || 0) + 1 })
  })
  const feedback = data.feedback || []
  const averageScore = feedback.length ? feedback.reduce((sum, row) => sum + Number(row.score), 0) / feedback.length : null
  const activeOutbox = (data.outbox || []).filter(row => ['ERROR', 'PENDING'].includes(row.status))
  const oldest = [...periodOpen].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).slice(0, 6)

  return (
    <div className="staff-dashboard">
      <div className="ops-command-bar">
        <div className="staff-module-tabs ops-view-tabs" role="tablist" aria-label="Chế độ bàn điều hành">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'work'}
            className={`staff-module-tab${viewMode === 'work' ? ' active' : ''}`}
            onClick={() => setViewMode('work')}
          >
            <span>Tác nghiệp trong ngày</span>
            <b>{actionable.length}</b>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'monitor'}
            className={`staff-module-tab${viewMode === 'monitor' ? ' active' : ''}`}
            onClick={() => setViewMode('monitor')}
          >
            <span>Phân tích &amp; Giám sát hạn</span>
            {overdue.length > 0 && <b className="badge-danger">{overdue.length}</b>}
          </button>
        </div>
        <div className="ops-command-actions">
          <span className="ops-working-date">{workingDate}</span>
          {viewMode === 'monitor' && (
            <select
              className="ops-period-select"
              aria-label="Kỳ dữ liệu giám sát"
              value={period}
              onChange={e => setPeriod(e.target.value)}
            >
              <option value="7">7 ngày gần nhất</option>
              <option value="30">30 ngày gần nhất</option>
              <option value="90">90 ngày gần nhất</option>
              <option value="all">Toàn bộ thời gian</option>
            </select>
          )}
          <a className="button secondary compact-btn" href="/api/export/cases.csv">
            Xuất CSV
          </a>
          <button className="button primary compact-btn" onClick={() => onNavigate('inbox')}>
            Mở hộp xử lý ({actionable.length}) →
          </button>
        </div>
      </div>

      {viewMode === 'work' ? (
        <>
          <section className="metric-grid" aria-label="Chỉ số công việc">
            <MetricCard
              label="Cần xử lý theo vai trò"
              value={actionable.length}
              note="Có thao tác nghiệp vụ ngay"
              tone="blue"
              onClick={
                actionable.length
                  ? () =>
                      onOpenQueue({
                        statuses: [...new Set(actionable.map(item => item.status))],
                        label: 'Hồ sơ đang chờ thao tác theo vai trò',
                      })
                  : () => onOpenQueue({ label: 'Toàn bộ hồ sơ trong phạm vi' })
              }
            />
            <MetricCard
              label="Đang mở trong phạm vi"
              value={openCases.length}
              note={`Tổng ${data.cases.length.toLocaleString('vi-VN')} hồ sơ được phân quyền`}
              tone="navy"
              onClick={() => onOpenQueue({ label: 'Toàn bộ hồ sơ trong phạm vi' })}
            />
            <MetricCard
              label="Sắp đến hạn (≤ 3 ngày)"
              value={dueSoon.length}
              note="Cần ưu tiên hoàn tất"
              tone="amber"
              onClick={dueSoon.length ? () => onOpenQueue({ deadlineFilter: 'soon', label: 'Hồ sơ đến hạn trong 3 ngày' }) : undefined}
            />
            <MetricCard
              label="Đã quá hạn giải quyết"
              value={overdue.length}
              note="Hồ sơ mở quá mốc hẹn trả"
              tone="red"
              onClick={overdue.length ? () => onOpenQueue({ deadlineFilter: 'overdue', label: 'Hồ sơ quá hạn' }) : undefined}
            />
          </section>

          <section className="panel stage-pipeline-panel">
            <div className="stage-pipeline-head">
              <h2>Luồng xử lý hồ sơ theo công đoạn</h2>
              <button className="text-button" onClick={() => onNavigate('inbox')}>
                Xem toàn bộ hộp xử lý →
              </button>
            </div>
            <div className="stage-pipeline-grid">
              {OPERATION_STAGES.map((stage, index) => {
                const count = data.cases.filter(item => stage.statuses.includes(item.status)).length
                const maxStage = Math.max(
                  1,
                  ...OPERATION_STAGES.map(s => data.cases.filter(item => s.statuses.includes(item.status)).length),
                )
                const width = data.cases.length ? Math.max(count ? 8 : 0, (count / maxStage) * 100) : 0
                return (
                  <button
                    type="button"
                    className="stage-pipeline-step"
                    key={stage.label}
                    onClick={() => onOpenQueue({ statuses: stage.statuses, label: `Giai đoạn ${stage.label}` })}
                  >
                    <div className="stage-pipeline-top">
                      <span className="stage-number">0{index + 1}</span>
                      <b>{count}</b>
                    </div>
                    <span className="stage-label">{stage.label}</span>
                    <span className="stage-track">
                      <i style={{ width: `${width}%` }} />
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="dashboard-columns">
            <section className="panel dashboard-panel">
              <PanelHeading
                title="Hồ sơ cần ưu tiên xử lý"
                description="Sắp xếp theo hạn giải quyết gần nhất và các hồ sơ đang chờ thao tác của bạn."
                action={
                  <button className="text-button" onClick={() => onNavigate('inbox')}>
                    Mở danh sách →
                  </button>
                }
              />
              {attention.length ? (
                <div className="attention-list">
                  {attention.map(item => (
                    <button className="attention-row" key={item.code} onClick={() => onOpen(item)}>
                      <span
                        className="attention-mark"
                        data-tone={
                          (daysUntil(item.deadline) ?? 999) < 0
                            ? 'red'
                            : item.status === 'DA_TIEP_NHAN' && !item.assignment?.assigneeId
                              ? 'amber'
                              : 'blue'
                        }
                      />
                      <span className="attention-main">
                        <b>{item.procedure?.name || item.procedureCode}</b>
                        <small>
                          <span className="case-code-inline">{item.code}</span> ·{' '}
                          {item.applicant?.name || 'Chưa có thông tin người nộp'} ·{' '}
                          {item.agencyScope || item.receivingAgency || ''}
                        </small>
                      </span>
                      <span className="attention-side">
                        <span className={`status-pill status-${item.status}`}>
                          {data.statusLabels[item.status] || item.status}
                        </span>
                        <small className={(daysUntil(item.deadline) ?? 999) < 0 ? 'text-danger' : ''}>{dueText(item)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">
                  Không có hồ sơ quá hạn, sắp đến hạn hoặc chờ thao tác trong phạm vi này.
                </div>
              )}
            </section>

            <div className="dashboard-side-stack">
              <section className="panel dashboard-panel">
                <PanelHeading
                  title="Tồn đọng theo người phụ trách"
                  description="Nhấp vào tên chuyên viên để lọc các hồ sơ đang mở."
                />
                <WorkloadList cases={openCases} onOpenQueue={onOpenQueue} />
              </section>
              <section className="panel dashboard-panel">
                <PanelHeading
                  title="Nhật ký tác nghiệp gần đây"
                  description="Các bước xử lý vừa thực hiện trong phạm vi."
                  action={
                    <button className="text-button" onClick={() => onNavigate('activity')}>
                      Mở nhật ký →
                    </button>
                  }
                />
                {recent.length ? (
                  <div className="recent-activity">
                    {recent.map((event, index) => (
                      <div className="recent-event" key={`${event.code}-${event.at}-${index}`}>
                        <span className="timeline-dot" />
                        <div>
                          <b>{event.title}</b>
                          <small>
                            {event.code} · {event.actor} · {toDate(event.at)}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state compact-empty">Chưa có sự kiện trong phạm vi tài khoản.</div>
                )}
              </section>
            </div>
          </div>
        </>
      ) : (
        <>
          <section className="metric-grid monitor-metrics">
            <MetricCard
              label="Hồ sơ trong kỳ"
              value={periodCases.length}
              note="Mở danh sách đã lọc theo kỳ"
              tone="navy"
              onClick={() =>
                onOpenQueue({
                  updatedSince,
                  label: `Hồ sơ cập nhật từ ${period === 'all' ? 'toàn bộ thời gian' : reportDateDisplay(updatedSince)}`,
                })
              }
            />
            <MetricCard
              label="Đang mở"
              value={periodOpen.length}
              note="Chưa ở trạng thái kết thúc"
              tone="blue"
              onClick={
                periodOpen.length
                  ? () =>
                      onOpenQueue({
                        statuses: [...new Set(periodOpen.map(item => item.status))],
                        updatedSince,
                        label: 'Hồ sơ đang mở trong kỳ',
                      })
                  : undefined
              }
            />
            <MetricCard
              label="Đã quá hạn"
              value={periodOverdue.length}
              note="Theo hạn đang lưu trên hồ sơ"
              tone="red"
              onClick={
                periodOverdue.length
                  ? () => onOpenQueue({ deadlineFilter: 'overdue', updatedSince, label: 'Hồ sơ quá hạn' })
                  : undefined
              }
            />
            <MetricCard
              label="Đã phát hành / hoàn tất"
              value={periodCompleted}
              note="Hồ sơ đã có kết quả"
              tone="green"
              onClick={
                periodCompleted
                  ? () =>
                      onOpenQueue({
                        statuses: [
                          ...new Set(
                            periodCases
                              .filter(item => ['HOAN_THANH', 'DA_PHAT_HANH'].includes(item.status))
                              .map(item => item.status),
                          ),
                        ],
                        updatedSince,
                        label: 'Hồ sơ đã phát hành hoặc hoàn tất',
                      })
                  : undefined
              }
            />
          </section>

          <div className="dashboard-columns monitor-columns">
            <section className="panel dashboard-panel">
              <PanelHeading
                title="Phân bố hồ sơ theo trạng thái"
                description="Chọn một trạng thái để mở danh sách hồ sơ tương ứng."
              />
              {statusRows.length ? (
                <div className="monitor-status-list">
                  {statusRows.map(row => (
                    <button
                      type="button"
                      className="monitor-status-row monitor-status-button"
                      key={row.status}
                      onClick={() => onOpenQueue({ statuses: [row.status], updatedSince, label: `Trạng thái: ${row.label}` })}
                    >
                      <span>{row.label}</span>
                      <i>
                        <b style={{ width: `${(row.count / highestStatus) * 100}%` }} />
                      </i>
                      <strong>{row.count}</strong>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">Không có hồ sơ trong kỳ.</div>
              )}
            </section>
            <section className="panel dashboard-panel">
              <PanelHeading
                title="Tải công việc theo đơn vị &amp; người phụ trách"
                description="Chọn một đơn vị hoặc chuyên viên để lọc các hồ sơ đang mở."
              />
              {[...byAgency.entries()].length ? (
                <div className="monitor-groups">
                  <h3>Cơ quan / đơn vị</h3>
                  {[...byAgency.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => (
                      <button
                        type="button"
                        className="monitor-group-row monitor-group-button"
                        key={name}
                        onClick={() =>
                          onOpenQueue({
                            agencyFilter: name,
                            updatedSince,
                            statuses: [
                              ...new Set(
                                periodOpen
                                  .filter(
                                    item => (item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan') === name,
                                  )
                                  .map(item => item.status),
                              ),
                            ],
                            label: `Cơ quan: ${name}`,
                          })
                        }
                      >
                        <span>{name}</span>
                        <b>{count}</b>
                      </button>
                    ))}
                  <h3>Người phụ trách</h3>
                  {[...byAssignee.entries()]
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 5)
                    .map(([id, item]) => (
                      <button
                        type="button"
                        className="monitor-group-row monitor-group-button"
                        key={id}
                        onClick={() =>
                          onOpenQueue({
                            assigneeFilter: id === 'unassigned' ? 'unassigned' : id,
                            updatedSince,
                            label: `Người phụ trách: ${item.name}`,
                          })
                        }
                      >
                        <span>{item.name}</span>
                        <b>{item.count}</b>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">Chưa có hồ sơ mở trong kỳ.</div>
              )}
            </section>
          </div>

          <div className="dashboard-columns monitor-columns">
            <section className="panel dashboard-panel">
              <PanelHeading
                title="Hồ sơ đang mở lâu nhất"
                description="Sắp xếp theo ngày tiếp nhận để rà soát chống tồn đọng."
                action={
                  <button className="text-button" onClick={() => onNavigate('inbox')}>
                    Mở hộp xử lý →
                  </button>
                }
              />
              {oldest.length ? (
                <div className="attention-list">
                  {oldest.map(item => (
                    <button className="attention-row" key={item.code} onClick={() => onOpen(item)}>
                      <span
                        className="attention-mark"
                        data-tone={daysUntil(item.deadline) !== null && (daysUntil(item.deadline) as number) < 0 ? 'red' : 'blue'}
                      />
                      <span className="attention-main">
                        <b>{item.procedure?.name || item.procedureCode}</b>
                        <small>
                          {item.code} · Tiếp nhận {toDate(item.createdAt)}
                        </small>
                      </span>
                      <span className="attention-side">
                        <span className={`status-pill status-${item.status}`}>
                          {data.statusLabels[item.status] || item.status}
                        </span>
                        <small>{dueText(item)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty-state compact-empty">Không có hồ sơ đang mở.</div>
              )}
            </section>
            <section className="panel dashboard-panel">
              <PanelHeading
                title="Đánh giá hài lòng &amp; Hàng chờ đồng bộ"
                description="Tổng hợp đánh giá của người dân sau khi nhận kết quả và trạng thái hàng chờ tích hợp."
                action={
                  <button className="text-button" onClick={() => onNavigate('connections')}>
                    Chi tiết tích hợp →
                  </button>
                }
              />
              {feedback.length ? (
                <>
                  <div className="feedback-score">
                    <b>{averageScore?.toFixed(1)}</b>
                    <span>/ 5.0</span>
                    <small>{feedback.length} lượt đánh giá</small>
                  </div>
                  <div className="feedback-list">
                    {feedback.slice(0, 3).map((row, index) => (
                      <article key={`${row.code}-${index}`}>
                        <b>
                          {'★'.repeat(row.score)}
                          {'☆'.repeat(5 - row.score)}
                        </b>
                        <span>{row.code}</span>
                        <p>{row.content || 'Không có nội dung nhận xét.'}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state compact-empty">Chưa có đánh giá sau kết quả trong phạm vi dữ liệu.</div>
              )}
              {activeOutbox.length > 0 && (
                <div className="outbox-list" style={{ marginTop: 12 }}>
                  {activeOutbox.slice(0, 3).map(row => (
                    <div className="outbox-row" key={row.code}>
                      <b>{row.code}</b>
                      <span className={`request-status ${row.status === 'ERROR' ? 'request-rejected' : 'request-pending'}`}>
                        {row.status === 'ERROR' ? 'Có lỗi' : 'Đang chờ'}
                      </span>
                      <span>{row.attempts} lần thử</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function PanelHeading({ kicker, title, description, action }: { kicker?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="ops-panel-heading"><div>{kicker && <span className="ops-kicker">{kicker}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action && <div className="ops-panel-action">{action}</div>}</div>
}
function MetricCard({ label, value, note, tone, onClick }: { label: string; value: number; note: string; tone: string; onClick?: () => void }) {
  const content = <><span className={`metric-accent ${tone}`} /><span className="metric-copy"><small>{label}</small><b>{value.toLocaleString('vi-VN')}</b><em>{note}</em></span>{onClick && <span className="metric-arrow">→</span>}</>
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
    <div className="staff-module-tabs" role="tablist" aria-label="Lọc nhóm trạng thái hồ sơ">
      {QUEUE_FILTERS.map(filter => (
        <button
          key={filter.key}
          type="button"
          role="tab"
          aria-selected={bucket === filter.key}
          className={`staff-module-tab${bucket === filter.key ? ' active' : ''}`}
          onClick={() => { setBucket(filter.key); setFocusedStatuses([]); setFocusLabel('') }}
        >
          <span>{filter.label}</span>
          <b>{counts(filter)}</b>
        </button>
      ))}
      <div className="staff-module-tabs-end">
        <button className="button secondary compact-btn" onClick={exportVisibleCases}>Xuất CSV ({filtered.length})</button>
        <button className="button secondary compact-btn" onClick={() => printInternalTable('Bảng kê hồ sơ đang xem', `${agencyFilter === 'all' ? user.agencyScope || 'Phạm vi được cấp' : agencyFilter} · ${filtered.length} hồ sơ`, ['Mã hồ sơ','Thủ tục',...(user.role === 'finance' ? [] : ['Người nộp']),'Trạng thái','Ngày gửi','Hạn giải quyết'], filtered.map(item => [item.code,`${item.procedureCode} · ${item.procedure?.name || ''}`,...(user.role === 'finance' ? [] : [item.applicant?.name || '']),data.statusLabels[item.status] || item.status,toDate(item.createdAt),toDate(item.deadline)]))}>In bảng kê ({filtered.length})</button>
      </div>
    </div>

    {focusLabel && (
      <div className="queue-focus-bar">
        <span>
          Đang lọc theo: <b>{focusLabel}</b>
          {(createdFrom || createdTo) && <small> · Ngày gửi {createdFrom || 'bất kỳ'} — {createdTo || 'hiện tại'}</small>}
          {updatedSince && <small> · Cập nhật từ {reportDateDisplay(updatedSince)}</small>}
        </span>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setBucket('ALL'); setFocusedStatuses([]); setFocusLabel(''); setAgencyFilter('all'); setDeadlineFilter('all'); setAssigneeFilter('all'); setProcedureFilter(''); setUpdatedSince(''); setCreatedFrom(''); setCreatedTo(''); setQuery('')
          }}
        >
          Xóa điều kiện lọc ×
        </button>
      </div>
    )}

    <section className="panel queue-panel">
      <div className="queue-filter-grid">
        <label className="queue-search">
          <span>Tìm kiếm nhanh</span>
          <input className="search-input" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Mã hồ sơ, mã/tên thủ tục, họ tên chủ hồ sơ…" />
        </label>
        {agencyOptions.length > 1 && (
          <label>
            <span>Cơ quan tiếp nhận</span>
            <select value={agencyFilter} onChange={e => setAgencyFilter(e.target.value)}>
              <option value="all">Tất cả cơ quan ({agencyOptions.length})</option>
              {agencyOptions.map(agency => <option key={agency} value={agency}>{agency}</option>)}
            </select>
          </label>
        )}
        {procedureFilter && (
          <label>
            <span>Mã thủ tục</span>
            <input value={procedureFilter} readOnly />
          </label>
        )}
        <label>
          <span>Tình trạng hạn</span>
          <select value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)}>
            <option value="all">Mọi thời hạn</option>
            <option value="overdue">Đã quá hạn</option>
            <option value="soon">Đến hạn ≤ 3 ngày</option>
            <option value="unknown">Chưa xác định hạn</option>
          </select>
        </label>
        <label>
          <span>Người phụ trách</span>
          <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="assigned">Đã phân công</option>
            <option value="unassigned">Chưa phân công</option>
            {assigneeOptions.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label>
          <span>Sắp xếp</span>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            <option value="deadline">Hạn giải quyết gần nhất</option>
            <option value="updated">Mới cập nhật</option>
            <option value="created">Mới tiếp nhận</option>
          </select>
        </label>
      </div>

      {filtered.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table queue-data-table">
            <thead>
              <tr>
                <th>Mã hồ sơ &amp; Kênh nộp</th>
                <th>Thủ tục hành chính &amp; Chủ hồ sơ</th>
                <th>Cơ quan &amp; Người phụ trách</th>
                <th>Trạng thái &amp; Hạn giải quyết</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <QueueItem key={item.code} item={item} label={data.statusLabels[item.status] || item.status} onOpen={onOpen} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">Không tìm thấy hồ sơ phù hợp. Hãy thay đổi từ khóa hoặc bỏ bớt điều kiện lọc.</div>
      )}

      <div className="queue-footer">
        <span>Hiển thị <b>{filtered.length.toLocaleString('vi-VN')}</b> / <b>{data.cases.length.toLocaleString('vi-VN')}</b> hồ sơ trong phạm vi phân quyền.</span>
      </div>
    </section>
  </div>
}

function QueueItem({ item, label, onOpen }: { item: CaseFile; label: string; onOpen: (item: CaseFile) => void }) {
  const assignee = item.assignment?.assignee || item.assignment?.assigneeName || (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')
  const dueDays = daysUntil(item.deadline)
  const tone = dueDays !== null && dueDays < 0 && !CLOSED_STATUSES.has(item.status) ? 'overdue' : dueDays !== null && dueDays <= 3 && !CLOSED_STATUSES.has(item.status) ? 'soon' : 'normal'
  return (
    <tr className="queue-table-row" onClick={() => onOpen(item)}>
      <td data-label="Mã hồ sơ & Kênh nộp">
        <div className="account-cell-user">
          <b className="case-code">{item.code}</b>
          <span className="account-cell-email">
            {item.submissionChannel === 'TRUC_TIEP' ? 'Trực tiếp tại quầy' : 'Trực tuyến'} · {toDate(item.createdAt)}
          </span>
        </div>
      </td>
      <td data-label="Thủ tục & Chủ hồ sơ">
        <div className="queue-cell-procedure">
          <b>{item.procedure?.name || item.procedureCode}</b>
          <span>
            <small className="procedure-code-tag">{item.procedureCode}</small> · Chủ hồ sơ:{' '}
            <strong>{item.applicant?.name || 'Chưa ghi nhận'}</strong>
          </span>
        </div>
      </td>
      <td data-label="Cơ quan & Phụ trách">
        <div className="account-cell-user">
          <span>{item.agencyScope || item.receivingAgency || item.procedure?.agency || 'Chưa xác định'}</span>
          <small className="account-cell-email">Phụ trách: {assignee}</small>
        </div>
      </td>
      <td data-label="Trạng thái & Hạn">
        <div className="queue-cell-status">
          <span className={`status-pill status-${item.status}`}>{label}</span>
          <span className={`deadline-mark ${tone}`}>{dueText(item)}</span>
        </div>
      </td>
      <td className="col-actions" data-label="Thao tác" onClick={e => e.stopPropagation()}>
        <button type="button" className="button secondary compact-btn" onClick={() => onOpen(item)} aria-label={`Mở hồ sơ ${item.code}`}>
          Xử lý →
        </button>
      </td>
    </tr>
  )
}

function OperationsMonitor({ user, data, onOpen, onOpenQueue, onNavigate }: { user: User; data: Bootstrap; onOpen: (item: CaseFile) => void; onOpenQueue: (focus?: QueueFocus) => void; onNavigate: (page: string) => void }) {
  return <StaffHome user={user} data={data} initialView="monitor" onOpen={onOpen} onOpenQueue={onOpenQueue} onNavigate={onNavigate} />
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
  const [detailOpen, setDetailOpen] = useState(false)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
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
  const configuredForms = procedures.filter(item => item.submissionEnabled === true).length
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
      await onUpdated(); setEditing(false); setShowHistory(false); setNotice('Đã lưu phiên bản danh mục nội bộ.')
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
      setNotice('Đã cập nhật tên lĩnh vực cho toàn bộ thủ tục thuộc nhóm này.')
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
      await onUpdated(); setSelectedCategoryKey(result.category.key); setNewCategoryOpen(false); setNotice('Đã tạo lĩnh vực nội bộ.')
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
      setNotice(`Đã chuyển ${result.moved.toLocaleString('vi-VN')} thủ tục sang lĩnh vực “${result.targetCategory}”.`)
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
  function openProcedure(code: string) {
    setSelectedCode(code); setDetailOpen(true); setEditing(false); setShowHistory(false); setError(''); setNotice('')
    document.querySelector('.workspace')?.scrollTo(0, 0); window.scrollTo(0, 0)
  }
  function returnToCatalog() {
    setDetailOpen(false); setEditing(false); setShowHistory(false); setError('')
    document.querySelector('.workspace')?.scrollTo(0, 0); window.scrollTo(0, 0)
  }
  if (detailOpen && selected) return <div className="staff-catalog-detail">
    <div className="staff-catalog-detail-toolbar"><button type="button" className="button secondary" disabled={saving} onClick={returnToCatalog}>← Về danh sách thủ tục</button><div>{canManage && !editing && <><button type="button" className="button secondary" onClick={toggleHistory}>{showHistory?'Ẩn lịch sử':'Lịch sử cập nhật'}</button><button type="button" className="button primary" onClick={startEdit}>Chỉnh sửa danh mục</button></>}<a className="button secondary" href={`/thu-tuc/${encodeURIComponent(selected.sourceCode || selected.code)}`} target="_blank" rel="noreferrer">Mở trang công dân ↗</a></div></div>
    {notice && <p className="form-notice" role="status">{notice}</p>}
    {error && !editing && <p className="form-error" role="alert">{error}</p>}
    {showHistory && canManage && <section className="panel staff-procedure-audit"><h2>Lịch sử cập nhật danh mục</h2><div className="catalog-history-list">{history.length?history.map(entry=><article key={`${entry.createdAt}-${entry.actor}`}><b>Phiên bản {String(entry.after.version ?? '—')} · {entry.actor}</b><time>{toDate(entry.createdAt)}</time><p>{entry.reason}</p></article>):<p>Thủ tục này chưa có lần chỉnh sửa nội bộ.</p>}</div></section>}
    {editing ? <section className="panel staff-procedure-editor">
      <div className="catalog-editor-heading"><div><h2>Chỉnh sửa danh mục nội bộ</h2><p>{selected.code}</p></div><button type="button" className="button secondary" disabled={saving} onClick={()=>setEditing(false)}>Hủy chỉnh sửa</button></div>
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
        <div className="catalog-editor-actions"><button className="button primary" disabled={saving}>{saving?'Đang lưu…':'Lưu phiên bản nội bộ'}</button><button type="button" className="button secondary" disabled={saving} onClick={()=>setEditing(false)}>Hủy chỉnh sửa</button></div>
      </form>
    </section> : <>
      <details className="staff-procedure-config" open={Boolean(selected.localEdit || selected.categoryEdit)}><summary>Thông tin cấu hình danh mục <span>{sourceStatus(selected)}</span></summary><dl><div><dt>Mã đang dùng</dt><dd>{selected.code}</dd></div><div><dt>Mã bản ghi nguồn</dt><dd>{selected.ref || 'Chưa có'}</dd></div><div><dt>Lĩnh vực</dt><dd>{selected.field}</dd></div><div><dt>Mức dịch vụ</dt><dd>{serviceModeLabel(selected.level)}</dd></div><div><dt>Cơ quan trong danh mục</dt><dd>{selected.agency}</dd></div>{selected.sourceCode && selected.sourceCode !== selected.code && <div><dt>Mã nguồn chính thức</dt><dd>{selected.sourceCode}</dd></div>}</dl>{(selected.localEdit || selected.categoryEdit) && <p>Bản cập nhật nội bộ bởi {selected.localEdit?.updatedBy || selected.categoryEdit?.updatedBy}, phiên bản {selected.localEdit?.version || selected.categoryEdit?.version}. Ngày đối chiếu: {toDate(selected.localEdit?.checkedAt || selected.categoryEdit?.checkedAt)}.</p>}</details>
      <section className="panel staff-procedure-detail-content"><CitizenProcedureDetail key={`${selected.sourceCode || selected.code}-${selected.localEdit?.version || 0}`} code={selected.sourceCode || selected.code} request={api} audience="staff" /></section>
    </>}
  </div>
  return <div className="catalog-workspace staff-catalog-workspace">
    <div className="staff-catalog-toolbar"><div className="staff-catalog-totals"><span><b>{procedures.length.toLocaleString('vi-VN')}</b> thủ tục</span><span><b>{classifiedFieldCount.toLocaleString('vi-VN')}</b> lĩnh vực</span><span><b>{configuredForms.toLocaleString('vi-VN')}</b> mở nộp trực tuyến &amp; tại quầy</span>{documentReferences > 0 && <span>{documentReferences.toLocaleString('vi-VN')} có hồ sơ tham chiếu</span>}</div><button type="button" className="button secondary compact-btn" aria-expanded={categoryManagerOpen} aria-controls="staff-category-manager" onClick={()=>setCategoryManagerOpen(open=>!open)}>{categoryManagerOpen?'Đóng phân loại lĩnh vực':canManage?'Quản lý lĩnh vực':'Duyệt theo lĩnh vực'}</button></div>
    {categoryManagerOpen && <div id="staff-category-manager"><section className="panel field-catalog-panel" aria-label="Danh mục lĩnh vực thủ tục">
      <div className="field-catalog-header"><div><h2>Lĩnh vực thủ tục ({classifiedFieldCount.toLocaleString('vi-VN')})</h2></div><div className="field-catalog-header-actions">{canManage&&<button className="button secondary compact-btn" onClick={()=>{setNewCategoryOpen(open=>!open);setError('')}}>{newCategoryOpen?'Đóng tạo lĩnh vực':'+ Tạo lĩnh vực'}</button>}<label className="field-catalog-search">Tìm lĩnh vực<input type="search" value={categoryQuery} onChange={event=>setCategoryQuery(event.target.value)} placeholder="Nhập tên lĩnh vực" /></label></div></div>
      {newCategoryOpen&&<form className="catalog-edit-form new-category-form" onSubmit={saveNewCategory}><h3>Tạo lĩnh vực nội bộ</h3><label>Tên lĩnh vực<input name="name" required minLength={3} maxLength={180} /></label><label>Nguồn chính thức nếu đã đối chiếu<input name="sourceUrl" type="url" maxLength={600} placeholder="https://...gov.vn/..." /></label><label>Ngày đối chiếu nếu có<input name="checkedAt" type="date" /></label><label>Mục đích và căn cứ tạo nhóm<textarea name="reason" rows={2} required minLength={20} maxLength={1200} /></label><div className="catalog-editor-actions"><button className="button primary" disabled={savingNewCategory}>{savingNewCategory?'Đang tạo…':'Lưu lĩnh vực nội bộ'}</button></div></form>}
      <div className="field-catalog-layout">
        <div className="field-catalog-list" role="listbox" aria-label="Các lĩnh vực">
          {visibleCategories.map(category=><button type="button" role="option" aria-selected={selectedCategory?.key===category.key} className={`field-catalog-row${selectedCategory?.key===category.key?' active':''}`} key={category.key} onClick={()=>{setSelectedCategoryKey(category.key);setEditingCategory(false);setShowCategoryHistory(false);setManagingMembers(false);setError('')}}><span>{category.name}</span><b>{category.procedures.length.toLocaleString('vi-VN')}</b></button>)}
          {!visibleCategories.length&&<p className="field-catalog-no-results">Không có lĩnh vực khớp từ khóa.</p>}
        </div>
        {selectedCategory&&<div className="field-catalog-detail">
          {editingCategory ? <>
            <div className="catalog-editor-heading"><div><h3>{selectedCategory.name}</h3></div><button type="button" className="text-button" onClick={()=>setEditingCategory(false)}>Hủy</button></div>
            <form className="catalog-edit-form" onSubmit={saveCategory}>
              <label>Tên lĩnh vực<input name="name" defaultValue={selectedCategory.name} required maxLength={180} /></label>
              <label>{selectedCategory.source==='reference'?'Nguồn chính thức':'Nguồn chính thức nếu đã đối chiếu'}<input name="sourceUrl" type="url" defaultValue={selectedCategory.categoryEdit?.sourceUrl || selectedCategory.procedures.find(item=>item.routing?.officialUrl)?.routing?.officialUrl || ''} required={selectedCategory.source==='reference'} maxLength={600} placeholder="https://...gov.vn/..." /></label>
              <label>Ngày đối chiếu{selectedCategory.source==='internal'?' nếu có':''}<input name="checkedAt" type="date" defaultValue={selectedCategory.categoryEdit?.checkedAt || (selectedCategory.source==='reference'?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date()):'')} required={selectedCategory.source==='reference'} /></label>
              <label>Căn cứ và nội dung đã đối chiếu<textarea name="reason" rows={3} defaultValue={selectedCategory.categoryEdit?.reason || ''} required minLength={20} maxLength={1200} /></label>
              {error&&<p className="form-error" role="alert">{error}</p>}
              <div className="catalog-editor-actions"><button className="button primary" disabled={savingCategory}>{savingCategory?'Đang lưu…':'Lưu lĩnh vực nội bộ'}</button></div>
            </form>
          </> : <>
            <div className="field-detail-heading"><div><h3>{selectedCategory.name}</h3><p>{selectedCategory.procedures.length.toLocaleString('vi-VN')} thủ tục thuộc lĩnh vực này</p></div>{canManage&&<div className="field-detail-actions"><button className="button secondary compact-btn" onClick={()=>{setError('');setEditingCategory(true)}}>Sửa tên lĩnh vực</button><button className="button secondary compact-btn" onClick={()=>{setManagingMembers(open=>!open);setError('')}}>{managingMembers?'Đóng quản lý thủ tục':'Chuyển nhóm thủ tục'}</button></div>}</div>
            {selectedCategory.categoryEdit&&<div className="field-catalog-provenance"><b>Phiên bản {selectedCategory.categoryEdit.version}</b><span>Cập nhật bởi {selectedCategory.categoryEdit.updatedBy} · {toDate(selectedCategory.categoryEdit.updatedAt)}</span><p>{selectedCategory.categoryEdit.reason}</p>{selectedCategory.categoryEdit.sourceUrl&&<a href={selectedCategory.categoryEdit.sourceUrl} target="_blank" rel="noreferrer">Mở nguồn đối chiếu ↗</a>}</div>}
            <div className="field-member-toolbar"><label>Tìm trong lĩnh vực<input type="search" value={memberQuery} onChange={event=>{setMemberQuery(event.target.value);setMemberPage(1);setSelectedMembers([])}} placeholder="Mã thủ tục hoặc tên thủ tục" /></label><span>{categoryMemberMatches.length.toLocaleString('vi-VN')} / {selectedCategory.procedures.length.toLocaleString('vi-VN')} thủ tục</span></div>
            {managingMembers&&canManage&&<form className="field-member-manager" onSubmit={moveSelectedMembers}><div className="field-member-selection"><span>Đã chọn {selectedMembers.length.toLocaleString('vi-VN')} thủ tục</span><div><button type="button" className="text-button" onClick={()=>setSelectedMembers(current=>[...new Set([...current,...categoryMemberShown.map(item=>item.sourceCode||item.code)])])}>Chọn trang này</button><button type="button" className="text-button" onClick={()=>setSelectedMembers(current=>current.filter(code=>!categoryMemberShown.some(item=>(item.sourceCode||item.code)===code)))}>Bỏ chọn trang này</button></div></div><label>Chuyển các thủ tục đã chọn sang lĩnh vực<select value={targetCategoryKey} onChange={event=>setTargetCategoryKey(event.target.value)} required><option value="">Chọn lĩnh vực đích</option>{categories.filter(item=>item.key!==selectedCategory.key).map(item=><option key={item.key} value={item.key}>{item.name} · {item.procedures.length.toLocaleString('vi-VN')}</option>)}</select></label><label>Nguồn chính thức nếu chuyển vào lĩnh vực tham chiếu<input name="sourceUrl" type="url" maxLength={600} placeholder="https://...gov.vn/..." /></label><label>Ngày đối chiếu nếu có<input name="checkedAt" type="date" /></label><label>Căn cứ phân loại và lý do chuyển nhóm<textarea name="reason" required minLength={20} maxLength={1200} rows={2} /></label><button className="button primary" disabled={savingMove||!selectedMembers.length||!targetCategoryKey}>{savingMove?'Đang chuyển…':`Chuyển ${selectedMembers.length.toLocaleString('vi-VN')} thủ tục`}</button></form>}
            <div className="field-procedure-list">{categoryMemberShown.map(item=><div className="field-procedure-row" key={item.sourceCode||item.code}>{managingMembers&&canManage&&<input type="checkbox" aria-label={`Chọn thủ tục ${item.code}`} checked={selectedMembers.includes(item.sourceCode||item.code)} onChange={event=>setSelectedMembers(current=>event.target.checked?[...current,item.sourceCode||item.code]:current.filter(code=>code!==(item.sourceCode||item.code)))} />}<button type="button" onClick={()=>{const stableCode=item.sourceCode||item.code;openProcedure(stableCode);setField(item.field);setMode('all');setQuery('');const group=procedures.filter(value=>value.field===item.field);setPage(Math.floor(group.findIndex(value=>(value.sourceCode||value.code)===stableCode)/pageSize)+1)}}><span><b>{item.code}</b> · {item.name}</span></button></div>)}{!categoryMemberShown.length&&<p className="field-catalog-no-results">Lĩnh vực này chưa có thủ tục khớp nội dung tìm kiếm.</p>}</div>
            {categoryMemberPages>1&&<div className="catalog-pagination field-member-pagination"><button className="button secondary compact-btn" disabled={memberPage<=1} onClick={()=>setMemberPage(value=>Math.max(1,value-1))}>‹ Trước</button><span>Trang {memberPage} / {categoryMemberPages}</span><button className="button secondary compact-btn" disabled={memberPage>=categoryMemberPages} onClick={()=>setMemberPage(value=>Math.min(categoryMemberPages,value+1))}>Sau ›</button></div>}
            {canManage&&<button className="text-button field-history-button" onClick={toggleCategoryHistory}>{showCategoryHistory?'Ẩn lịch sử lĩnh vực':'Xem lịch sử lĩnh vực'}</button>}
            {showCategoryHistory&&<div className="catalog-history-list">{categoryHistory.length?categoryHistory.map(entry=><article key={`${entry.createdAt}-${entry.actor}`}><b>{String(entry.after.version ?? '—')} · {entry.actor}</b><time>{toDate(entry.createdAt)}</time><p>{entry.reason}</p></article>):<p>Lĩnh vực này chưa có lần chỉnh sửa nội bộ.</p>}</div>}
            {error&&<p className="form-error" role="alert">{error}</p>}
          </>}
        </div>}
      </div>
    </section></div>}
    {notice && <p className="form-notice" role="status">{notice}</p>}
    <section className="panel catalog-controls">
      <label className="catalog-search"><span>Tìm theo mã, tên, lĩnh vực hoặc cơ quan</span><input className="search-input" type="search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Ví dụ: 2.000908, hộ tịch…" /></label>
      <label><span>Lĩnh vực</span><select value={field} onChange={e=>{setField(e.target.value);setPage(1)}}><option value="all">Tất cả lĩnh vực</option>{fields.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label><span>Mức dịch vụ</span><select value={mode} onChange={e=>{setMode(e.target.value);setPage(1)}}><option value="all">Tất cả mức</option><option value="FULL">Toàn trình</option><option value="PARTIAL">Một phần</option><option value="INFORMATION">Cung cấp thông tin</option></select></label>
      <div className="catalog-count"><b>{filtered.length.toLocaleString('vi-VN')}</b><small>thủ tục phù hợp</small></div>
    </section>
    <section className="panel staff-catalog-table-panel" aria-labelledby="staff-procedure-results-heading">
      <div className="catalog-list-head"><div><h2 id="staff-procedure-results-heading">Danh sách thủ tục hành chính</h2></div><span>{filtered.length ? `${(page-1)*pageSize+1}–${Math.min(page*pageSize,filtered.length)} / ${filtered.length.toLocaleString('vi-VN')}` : '0 kết quả'}</span></div>
      <div className="staff-procedure-results"><table className="staff-procedure-table"><thead><tr><th scope="col">Mã thủ tục</th><th scope="col">Tên thủ tục / mức dịch vụ</th><th scope="col">Cơ quan thực hiện</th><th scope="col">Tình trạng dữ liệu</th></tr></thead><tbody>{shown.map(item=>{const stableCode=item.sourceCode||item.code;return <tr key={`${stableCode}-${item.ref}`}><td data-label="Mã thủ tục"><span className="staff-procedure-code">{item.code}</span></td><td data-label="Tên thủ tục"><button type="button" className="staff-procedure-title" aria-label={`Xem chi tiết thủ tục ${item.code}: ${item.name}`} onClick={()=>openProcedure(stableCode)}>{item.name}</button><div className="staff-procedure-meta"><span>{item.field}</span><span>{serviceModeLabel(item.level)}</span></div></td><td data-label="Cơ quan">{item.agency || 'Chưa xác định'}</td><td data-label="Tình trạng dữ liệu"><span className={`staff-procedure-data-status${item.localEdit || item.categoryEdit?' internal':''}`}>{sourceStatus(item)}</span></td></tr>})}</tbody></table></div>
      {filtered.length===0&&<div className="empty-state">Không tìm thấy thủ tục phù hợp. Hãy kiểm tra từ khóa hoặc bỏ bớt bộ lọc.</div>}
      {filtered.length>pageSize&&<div className="catalog-pagination"><button type="button" className="button secondary compact-btn" disabled={page<=1} onClick={()=>setPage(current=>Math.max(1,current-1))}>‹ Trang trước</button><span>Trang {page} / {pageCount}</span><button type="button" className="button secondary compact-btn" disabled={page>=pageCount} onClick={()=>setPage(current=>Math.min(pageCount,current+1))}>Trang sau ›</button></div>}
    </section>
  </div>
}

function CaseActivityLog({ cases, onOpen }: { cases: CaseFile[]; onOpen: (item: CaseFile) => void }) {
  const [query, setQuery] = useState('')
  const [audience, setAudience] = useState('all')
  const events = useMemo(() => caseEvents(cases).filter(event => {
    const term = query.trim().toLocaleLowerCase('vi')
    return (audience==='all'||event.audience===audience) && (!term||`${event.code} ${event.title} ${event.actor} ${event.detail} ${event.procedureName}`.toLocaleLowerCase('vi').includes(term))
  }), [cases, query, audience])
  return <div className="activity-workspace">
    <section className="panel activity-controls">
      <label><span>Tìm trong nhật ký</span><input className="search-input" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Mã hồ sơ, thao tác, người thực hiện…" /></label>
      <label><span>Phạm vi sự kiện</span><select value={audience} onChange={e=>setAudience(e.target.value)}><option value="all">Công khai và nội bộ</option><option value="public">Hiển thị cho công dân</option><option value="internal">Chỉ nội bộ</option></select></label>
      <div className="catalog-count"><b>{events.length.toLocaleString('vi-VN')}</b><small>sự kiện</small></div>
    </section>
    <section className="panel activity-panel">
      {events.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Sự kiện &amp; Hồ sơ</th>
                <th>Người thực hiện</th>
                <th>Phạm vi</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={`${event.code}-${event.at}-${index}`}>
                  <td data-label="Thời điểm"><time className="account-cell-email">{toDate(event.at)}</time></td>
                  <td data-label="Sự kiện & Hồ sơ">
                    <div className="account-cell-user">
                      <b>{event.title}</b>
                      <button
                        type="button"
                        className="activity-case-link"
                        onClick={() => {
                          const item = cases.find(record => record.code === event.code)
                          if (item) onOpen(item)
                        }}
                      >
                        {event.code} · {event.procedureName}
                      </button>
                      {event.detail && <span className="account-cell-email">{event.detail}</span>}
                    </div>
                  </td>
                  <td data-label="Người thực hiện">
                    <div className="account-cell-user">
                      <b>{event.actor || 'Hệ thống'}</b>
                      <span className="account-cell-email">{roleNames[event.role || ''] || event.role || 'Tự động'}</span>
                    </div>
                  </td>
                  <td data-label="Phạm vi">
                    <span className={`request-status ${event.audience === 'internal' ? 'request-pending' : 'request-approved'}`}>
                      {event.audience === 'internal' ? 'Nội bộ' : 'Công khai'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">Chưa có sự kiện phù hợp trong phạm vi dữ liệu được cấp.</div>
      )}
    </section>
  </div>
}

type SandboxPayment = { transactionRef: string; caseCode: string; caseVersion: number; procedureCode: string; agency: string; caseStatus: string; amount: number; status: string; basis: string; createdAt: string; reconciledAt?: string; mode: string; method?: string; payerReference?: string; reconciliationReference?: string; events?: { action: string; actor_name: string; detail: string; created_at: string }[]; refund?: { status: string; reason: string; requested_by: string; requested_at: string; review_note: string; execution_reference?: string; executed_at?: string } | null }
type SandboxSigner = { id: string; full_name: string; email: string; agency_scope: string; valid_from: string; valid_until: string; authority_ref?: string; reason?: string; effective: boolean }

function ServiceConnections({ user, data, onNavigate }: { user: User; data: Bootstrap; onNavigate: (page: string) => void; onOpenCase?: (caseRecord: any) => Promise<void> | void }) {
  const canViewPayments = user.role === 'admin' || user.role === 'finance' || user.role === 'leader'
  const canManageSigners = user.role === 'admin'
  const [activeTab, setActiveTab] = useState<'payments' | 'signers' | 'integrations'>(() =>
    canViewPayments ? 'payments' : 'integrations',
  )
  const outbox = data.outbox || []
  const errorCount = outbox.filter(item=>item.status==='ERROR').length
  const pendingCount = outbox.filter(item=>item.status==='PENDING').length
  const services = [
    { name:'Cổng Dịch vụ công quốc gia', category:'Tiếp nhận và trao đổi hồ sơ', detail:'Định tuyến tra cứu và đồng bộ danh mục; luồng nhận hồ sơ liên thông trực tiếp đang ở chế độ cục bộ.', prerequisites:['Hợp đồng/API được cơ quan đầu mối cấp','Thông tin xác thực và môi trường kiểm thử','Quy tắc đối soát mã hồ sơ và trạng thái'] },
    { name:'Dịch vụ ký số nội bộ', category:'Ký và xác minh kết quả', detail:'Luồng Ed25519 cục bộ cấp quyền, ký nội dung đã duyệt và kiểm tra toàn vẹn mã băm SHA-256.', prerequisites:['Nhà cung cấp và chứng thư số được phê duyệt','Môi trường ký thử, quy trình ký và xác minh','Thẩm quyền ký và nhật ký bàn giao'] },
    { name:'Thanh toán và hoàn phí', category:'Thu, đối soát và hoàn', detail:'Sổ khoản thu ghi nhận chứng từ người nộp khai, đối chiếu chứng từ, duyệt đề nghị hoàn và lưu chứng từ hoàn.', prerequisites:['Đơn vị trung gian thanh toán được chấp thuận','API, khóa bí mật và cấu hình đối soát','Quy trình xử lý giao dịch lỗi/hoàn tiền'] },
    { name:'Thông báo và giao kết quả', category:'Thông báo, bưu chính, kho nhận', detail:'Quản lý kênh nhận kết quả trực tiếp, bưu chính và phát hành bản điện tử.', prerequisites:['Nhà cung cấp và tài khoản gửi được phê duyệt','Mẫu thông điệp, kênh nhận và chính sách bảo vệ dữ liệu','Biên nhận giao nhận có thể đối soát'] },
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
    if (user.role === 'finance' || user.role === 'admin' || user.role === 'leader') {
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
    <div className="staff-module-tabs" role="tablist" aria-label="Phân hệ Tài chính, Chữ ký và Tích hợp">
      {canViewPayments && (
        <button type="button" role="tab" aria-selected={activeTab === 'payments'} className={`staff-module-tab${activeTab === 'payments' ? ' active' : ''}`} onClick={() => setActiveTab('payments')}>
          <span>Đối soát phí &amp; Hoàn trả</span>
          <b>{payments.length}</b>
        </button>
      )}
      {canManageSigners && (
        <button type="button" role="tab" aria-selected={activeTab === 'signers'} className={`staff-module-tab${activeTab === 'signers' ? ' active' : ''}`} onClick={() => setActiveTab('signers')}>
          <span>Thẩm quyền ký số nội bộ</span>
          <b>{signers.filter(s => s.effective).length}</b>
        </button>
      )}
      <button type="button" role="tab" aria-selected={activeTab === 'integrations'} className={`staff-module-tab${activeTab === 'integrations' ? ' active' : ''}`} onClick={() => setActiveTab('integrations')}>
        <span>Trạng thái tích hợp &amp; Hàng chờ</span>
        <b>{outbox.length}</b>
      </button>
    </div>

    {error && <div className="form-error" role="alert">{error}</div>}
    {notice && <div className="citizen-success" role="status">{notice}</div>}

    {activeTab === 'payments' && canViewPayments && (
      <section className="panel sandbox-payment-workspace">
        <PanelHeading title="Giao dịch thu phí, đối soát chứng từ và hoàn trả" description="Quản lý nghĩa vụ tài chính phát sinh trên hồ sơ trong phạm vi đơn vị." />
        <div className="sandbox-payment-summary">
          <MetricCard label="Tổng giao dịch" value={payments.length} note="Trong phạm vi được phép xem" tone="navy" />
          <MetricCard label="Chờ đối soát" value={payments.filter(item=>item.status==='PAID').length} note="Người nộp đã khai chứng từ" tone="amber" />
          <MetricCard label="Chờ duyệt hoàn" value={payments.filter(item=>item.refund?.status==='PENDING').length} note="Cần người có thẩm quyền duyệt" tone="red" />
        </div>
        {payments.length ? <div className="sandbox-payment-list">{payments.map(payment=><SandboxPaymentRow key={payment.transactionRef} payment={payment} user={user} onChanged={async message=>{ await loadOperations(); setNotice(message) }} />)}</div> : <div className="connection-empty-state"><b>Chưa có giao dịch trong phạm vi này</b><p>Cán bộ tiếp nhận cấu hình khoản thu có căn cứ trên hồ sơ; người nộp tạo giao dịch tại trang tra cứu.</p></div>}
      </section>
    )}

    {activeTab === 'signers' && canManageSigners && (
      <section className="panel sandbox-signer-workspace">
        <PanelHeading title="Quản lý thẩm quyền ký số kết quả nội bộ (Ed25519)" description="Cấp hoặc thu hồi quyền ký kết quả cho lãnh đạo đơn vị." />
        <form className="sandbox-signer-form" onSubmit={event=>{event.preventDefault();void changeSigner('grant')}}>
          <label>Lãnh đạo<select value={signerId} onChange={event=>setSignerId(event.target.value)} required><option value="">Chọn tài khoản lãnh đạo</option>{signers.map(person=><option key={person.id} value={person.id}>{person.full_name} · {person.agency_scope} · {person.effective?'đang có quyền':'chưa có quyền'}</option>)}</select></label>
          <label>Căn cứ văn bản cấp quyền<input value={authorityRef} onChange={event=>setAuthorityRef(event.target.value)} minLength={4} maxLength={180} required placeholder="Số văn bản phân quyền nội bộ" /></label>
          <label>Lý do và phạm vi<input value={authorityReason} onChange={event=>setAuthorityReason(event.target.value)} minLength={12} maxLength={1200} required placeholder="Nêu lý do cấp quyền thử nghiệm" /></label>
          <button className="button primary" disabled={busy||!signerId}>{busy?'Đang lưu…':'Cấp quyền ký'}</button>
        </form>
        {signers.length ? <div className="data-table-wrap"><table className="data-table signer-table"><thead><tr><th className="col-stt">STT</th><th className="col-user">Lãnh đạo &amp; Email công vụ</th><th className="col-agency">Cơ quan / Đơn vị</th><th>Căn cứ phân quyền ký</th><th className="col-status">Trạng thái</th><th className="col-actions">Thao tác</th></tr></thead><tbody>{signers.map((person, idx)=><tr key={person.id}><td className="col-stt" data-label="STT">{idx + 1}</td><td className="col-user" data-label="Lãnh đạo & Email công vụ"><div className="account-cell-user"><b>{person.full_name}</b><span className="account-cell-email">{person.email}</span></div></td><td className="col-agency" data-label="Cơ quan / Đơn vị"><span className="account-cell-agency">{person.agency_scope}</span></td><td data-label="Căn cứ phân quyền ký">{person.authority_ref ? <div className="account-cell-user"><b>{person.authority_ref}</b><span className="account-cell-email">{person.reason || ''}</span></div> : <span className="account-cell-email">Chưa cấp quyền ký</span>}</td><td className="col-status" data-label="Trạng thái"><span className={`request-status ${person.effective ? 'request-approved' : 'request-pending'}`}>{person.effective ? 'Đang hiệu lực' : 'Chưa kích hoạt'}</span></td><td className="col-actions" data-label="Thao tác">{person.authority_ref ? <button type="button" className="button secondary compact-btn" disabled={busy||!person.effective} onClick={()=>{setSignerId(person.id);void changeSigner('revoke',person.id,'Thu hồi quyền ký thử nghiệm theo rà soát quản trị.')}}>Thu hồi</button> : <span className="account-cell-email">—</span>}</td></tr>)}</tbody></table></div>:<div className="connection-empty-state">Chưa có tài khoản lãnh đạo để cấp quyền ký.</div>}
      </section>
    )}

    {activeTab === 'integrations' && (
      <>
        <section className="panel connection-state-banner">
          <div>
            <h2>{storage?.database==='connected'?'Máy chủ ứng dụng & Cơ sở dữ liệu SQLite đang hoạt động':'Chưa xác nhận được kết nối cơ sở dữ liệu'}</h2>
            <p>{storage?.database==='connected'?`Đang lưu trữ ${(storage?.procedureCount ?? data.procedures.length).toLocaleString('vi-VN')} thủ tục tham chiếu, ${(storage?.caseRecords ?? data.cases.length).toLocaleString('vi-VN')} hồ sơ trong phạm vi và ${(storage?.publishedNews ?? 0).toLocaleString('vi-VN')} bài viết công khai.`:'Không đọc được trạng thái từ máy chủ.'}</p>
          </div>
          <span className={`environment-badge ${storage?.database==='connected'?'environment-connected':'environment-disconnected'}`}>{storage?.database==='connected'?'Đã kết nối nội bộ':'Mất kết nối'}</span>
        </section>
        <div className="integration-cards">{services.map(service=><article className="panel integration-card" key={service.name}><div className="integration-card-top"><span className="ops-kicker">{service.category}</span><span className="connection-state-text">Chế độ cục bộ</span></div><h3>{service.name}</h3><p>{service.detail}</p><div className="integration-prerequisites"><b>Điều kiện liên thông</b><ul>{service.prerequisites.map(item=><li key={item}>{item}</li>)}</ul></div></article>)}</div>
        <section className="panel integration-summary">
          <PanelHeading title="Hàng chờ đồng bộ bên ngoài (Outbox)" description="Theo dõi các bản ghi đồng bộ phát sinh từ luồng xử lý hồ sơ." action={<button className="text-button" onClick={()=>onNavigate('home')}>Về bàn điều hành →</button>} />
          <div className="outbox-summary"><MetricCard label="Tổng tác vụ" value={outbox.length} note="Bản ghi hàng chờ" tone="navy"/><MetricCard label="Đang chờ" value={pendingCount} note="Chưa được bên nhận xác nhận" tone="amber"/><MetricCard label="Có lỗi" value={errorCount} note="Cần kiểm tra lại" tone="red"/></div>
          {outbox.length ? <div className="outbox-list">{outbox.map(row=><div className="outbox-row" key={row.code}><b>{row.code}</b><span>{row.status}</span><span>{row.attempts} lần thử</span><small>{row.lastError||'Bản ghi hàng chờ cục bộ.'}</small></div>)}</div> : <div className="connection-empty-state"><b>Không có tác vụ tồn đọng</b><p>Hàng chờ đồng bộ hiện đang trống.</p></div>}
        </section>
      </>
    )}
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
  const canManagePayment = ['finance', 'leader'].includes(user.role)
  return <article className="sandbox-payment-row"><header><div><b>{payment.transactionRef}</b><span>Hồ sơ {payment.caseCode} · {payment.procedureCode}</span></div><strong>{Number(payment.amount).toLocaleString('vi-VN')} đồng</strong></header><div className="sandbox-payment-facts"><span>Trạng thái: <b>{({PENDING:'Chờ xác nhận',PAID:'Người nộp khai đã thanh toán · chờ đối soát',RECONCILED:'Đã đối soát nội bộ',REFUNDED:'Đã ghi nhận chứng từ hoàn'} as Record<string,string>)[payment.status]||payment.status}</b></span><span>{payment.agency}</span><span>{toDate(payment.createdAt)}</span></div><p>{payment.basis}</p>{payment.refund && <div className="sandbox-refund-status"><b>Đề nghị hoàn: {payment.refund.status === 'PENDING' ? 'Đang chờ xem xét' : payment.refund.status === 'APPROVED' ? 'Đã duyệt, chờ thực hiện hoàn' : payment.refund.status === 'EXECUTED' ? 'Đã ghi nhận thực hiện hoàn' : 'Đã từ chối'}</b><p>{payment.refund.reason}</p>{payment.refund.review_note && <small>Ý kiến: {payment.refund.review_note}</small>}</div>}{error && <div className="form-error" role="alert">{error}</div>}
    {!!payment.events?.length && <details className="sandbox-payment-events"><summary>Lịch sử giao dịch ({payment.events.length} sự kiện)</summary><ol>{payment.events.map((event,index)=><li key={`${event.created_at}-${index}`}><b>{({CREATED:'Tạo giao dịch',SANDBOX_CONFIRMED:'Xác nhận thử nghiệm cũ',PAID_DECLARED:'Người nộp khai chứng từ',REFUND_EXECUTED:'Ghi nhận thực hiện hoàn',RECONCILED:'Đối soát nội bộ',REFUND_REQUESTED:'Lập đề nghị hoàn',REFUND_APPROVED:'Duyệt đề nghị hoàn',REFUND_REJECTED:'Từ chối đề nghị hoàn'} as Record<string,string>)[event.action]||event.action}</b><time>{toDate(event.created_at)} · {event.actor_name}</time><p>{event.detail}</p></li>)}</ol></details>}
    {canManagePayment && payment.status === 'PAID' && <div className="sandbox-payment-action form-grid account-form"><label>Số chứng từ thu / dòng đối chiếu<input value={statementReference} onChange={event=>setStatementReference(event.target.value)} minLength={4} maxLength={180} required /></label><button className="button primary" disabled={busy||statementReference.trim().length<4} onClick={()=>void act('reconcile',{expectedVersion:payment.caseVersion,statementReference},'Đã đối chiếu chứng từ và ghi sổ khoản thu.')}>{busy?'Đang xử lý…':'Đối chiếu chứng từ khoản thu'}</button></div>}
    {canManagePayment && payment.status === 'RECONCILED' && terminalCase && (!payment.refund || payment.refund.status === 'REJECTED') && <details className="sandbox-payment-action"><summary>Lập đề nghị hoàn</summary><label>Căn cứ đề nghị<textarea value={reason} onChange={event=>setReason(event.target.value)} minLength={12} maxLength={1200} rows={3} required /></label><button className="button secondary" disabled={busy||reason.trim().length<12} onClick={()=>void act('refund-request',{reason},'Đã lập đề nghị hoàn, chờ người có thẩm quyền khác xem xét.')}>Gửi đề nghị</button></details>}
    {canManagePayment && payment.refund?.status === 'PENDING' && ownRefund && <p className="field-help">Tài khoản đã lập đề nghị này; cần cán bộ tài chính khác hoặc lãnh đạo đơn vị xem xét.</p>}
    {canManagePayment && payment.refund?.status === 'PENDING' && !ownRefund && <details className="sandbox-payment-action"><summary>Xem xét đề nghị hoàn</summary><label>Ý kiến xem xét<textarea value={reviewNote} onChange={event=>setReviewNote(event.target.value)} minLength={8} maxLength={1200} rows={3} required /></label><div className="form-actions"><button className="button primary" disabled={busy||reviewNote.trim().length<8} onClick={()=>void act('refund-review',{decision:'APPROVE',note:reviewNote,expectedVersion:payment.caseVersion},'Đã duyệt đề nghị; chờ chứng từ thực hiện hoàn.')}>Duyệt đề nghị hoàn</button><button className="button secondary" disabled={busy||reviewNote.trim().length<8} onClick={()=>void act('refund-review',{decision:'REJECT',note:reviewNote},'Đã từ chối đề nghị hoàn trong ứng dụng.')}>Từ chối</button></div></details>}
    {canManagePayment && payment.refund?.status === 'APPROVED' && <div className="sandbox-payment-action form-grid account-form"><label>Số chứng từ thực hiện hoàn<input value={executionReference} onChange={event => setExecutionReference(event.target.value)} minLength={4} maxLength={180} required /></label><button className="button primary" disabled={busy || executionReference.trim().length < 4} onClick={() => void act('refund-execute', { expectedVersion: payment.caseVersion, executionReference }, 'Đã ghi nhận chứng từ thực hiện hoàn.')}>Ghi nhận thực hiện hoàn</button></div>}
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
  return <section className="staff-lookup-key">
    <div className="staff-lookup-key-head">
      <div>
        <h3>Mã hồ sơ &amp; Khóa tra cứu của công dân</h3>
        <p>Chỉ cung cấp cho chủ hồ sơ hoặc người đại diện hợp pháp sau khi đối chiếu giấy tờ tùy thân. Mọi thao tác xem/cấp lại đều được ghi nhật ký.</p>
      </div>
      <div className="credential-actions">
        <button type="button" className="button secondary compact-btn" disabled={busy} onClick={()=>secret ? setSecret('') : operate('reveal')}>
          {secret ? 'Ẩn khóa tra cứu' : busy ? 'Đang lấy khóa…' : 'Hiện khóa tra cứu'}
        </button>
        {secret && <button type="button" className="button primary compact-btn" onClick={copy}>Sao chép mã &amp; khóa</button>}
        <button type="button" className="button secondary compact-btn" disabled={busy} onClick={()=>setRotateOpen(!rotateOpen)}>Cấp lại khóa mới</button>
      </div>
    </div>
    <div className="staff-lookup-key-fields">
      <label>Mã hồ sơ<input readOnly value={item.code} /></label>
      {secret && <label>Khóa tra cứu hiện hành<input readOnly value={secret} spellCheck={false} autoComplete="off" /></label>}
    </div>
    {rotateOpen && <div className="credential-confirm"><p>Cấp khóa mới sẽ vô hiệu hóa khóa cũ ngay lập tức. Cần cung cấp lại khóa mới cho chủ hồ sơ.</p><div className="form-actions"><button type="button" className="button primary compact-btn" disabled={busy} onClick={()=>operate('rotate')}>Xác nhận cấp khóa mới</button><button type="button" className="button secondary compact-btn" onClick={()=>setRotateOpen(false)}>Hủy</button></div></div>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {notice && <p role="status" className="citizen-success">{notice}</p>}
  </section>
}

function CaseDetail({ item, isStaff, signingAuthorityRef, labels, actionOptions, action, setAction, actionText, setActionText, assignee, setAssignee, staff, busy, onSubmitAction, onLookupKeyChanged, onBack }: { item: CaseFile; isStaff: boolean; signingAuthorityRef: string; labels: Record<string, string>; actionOptions: { value: string; label: string }[]; action: string; setAction: (s: string) => void; actionText: string; setActionText: (s: string) => void; assignee: string; setAssignee: (s: string) => void; staff: { id: string; name: string; role: string }[]; busy: boolean; onSubmitAction: (e: FormEvent<HTMLFormElement>) => void; onLookupKeyChanged: () => Promise<void>; onBack: () => void }) {
  const [detailTab, setDetailTab] = useState<'dossier' | 'assessment' | 'timeline'>('dossier')
  const [showLookupDrawer, setShowLookupDrawer] = useState(false)
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
  const noticeDoc = item.withdrawal?.noticeFile || item.withdrawal?.noticeDocument
  const dueDays = daysUntil(item.deadline)
  const dueTone = dueDays !== null && dueDays < 0 && !CLOSED_STATUSES.has(item.status) ? 'overdue' : dueDays !== null && dueDays <= 3 && !CLOSED_STATUSES.has(item.status) ? 'soon' : 'normal'

  const canPrintMau01 = Boolean(item.acceptedAt || ['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET', 'DA_PHE_DUYET', 'DA_PHAT_HANH', 'HOAN_THANH'].includes(item.status))
  const canPrintMau02 = Boolean(item.status === 'CHO_BO_SUNG' || item.supplement?.reason)
  const canPrintMau03 = Boolean(['TU_CHOI', 'KHONG_GIAI_QUYET'].includes(item.status))

  return (
    <div className="case-detail-workspace">
      <header className="panel case-detail-header">
        <div className="case-detail-topbar">
          <div className="case-detail-badges">
            <button type="button" className="staff-back-action" onClick={onBack}>
              ← Quay lại danh sách
            </button>
            <span className="case-code-badge">{item.code}</span>
            <span className="procedure-code-tag">{item.procedureCode}</span>
            <span className={`status-pill status-${item.status}`}>{labels[item.status] || item.status}</span>
            <span className={`deadline-mark ${dueTone}`}>{dueText(item)}</span>
            {item.sampleData && <span className="staff-env-pill" title={item.sampleDataNote}>Hồ sơ mô phỏng</span>}
          </div>
          {isStaff && (
            <div className="case-detail-utility-bar">
              {canPrintMau01 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() =>
                    printInternalTable(
                      'PHIẾU TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ (MẪU 01)',
                      `Cơ quan tiếp nhận: ${item.receivingAgency || item.procedure?.agency || ''} · Mã hồ sơ: ${item.code}`,
                      ['Chỉ tiêu', 'Nội dung ghi nhận'],
                      [
                        ['Mã hồ sơ', item.code],
                        ['Thủ tục hành chính', `${item.procedureCode} · ${item.procedure?.name || ''}`],
                        ['Người nộp hồ sơ', `${item.applicant?.name || ''} (${item.applicant?.phone || item.applicant?.email || ''})`],
                        ['Hình thức nộp', item.submissionChannel === 'TRUC_TIEP' ? 'Trực tiếp tại quầy Một cửa' : 'Trực tuyến'],
                        ['Thời điểm tiếp nhận', toDate(item.acceptedAt || item.createdAt)],
                        ['Thời hạn hẹn trả kết quả', item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Theo quy định'],
                        ['Phương thức nhận kết quả', channelNames[item.deliveryMethod] || item.deliveryMethod || 'Trực tiếp'],
                        ['Thành phần hồ sơ đã nhận', item.paperOriginals || (item.attachments || []).map(a => a.name).join('; ') || 'Theo tờ khai điện tử'],
                      ],
                    )
                  }
                >
                  In Mẫu 01 (Tiếp nhận)
                </button>
              )}
              {canPrintMau02 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() =>
                    printInternalTable(
                      'PHIẾU YÊU CẦU BỔ SUNG, HOÀN THIỆN HỒ SƠ (MẪU 02)',
                      `Cơ quan: ${item.receivingAgency || item.procedure?.agency || ''} · Mã hồ sơ: ${item.code}`,
                      ['Chỉ tiêu', 'Nội dung hướng dẫn'],
                      [
                        ['Mã hồ sơ', item.code],
                        ['Thủ tục hành chính', `${item.procedureCode} · ${item.procedure?.name || ''}`],
                        ['Người nộp hồ sơ', item.applicant?.name || ''],
                        ['Lý do và căn cứ yêu cầu bổ sung', item.supplement?.reason || ''],
                        ['Danh mục nội dung/giấy tờ cần bổ sung', (item.supplement?.items || []).join('; ') || item.supplement?.reason || ''],
                        ['Giải trình của công dân (nếu có)', item.supplement?.citizenNote || 'Chưa gửi'],
                      ],
                    )
                  }
                >
                  In Mẫu 02 (Bổ sung)
                </button>
              )}
              {canPrintMau03 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() =>
                    printInternalTable(
                      'PHIẾU TỪ CHỐI TIẾP NHẬN / KHÔNG GIẢI QUYẾT HỒ SƠ (MẪU 03)',
                      `Cơ quan: ${item.receivingAgency || item.procedure?.agency || ''} · Mã hồ sơ: ${item.code}`,
                      ['Chỉ tiêu', 'Nội dung'],
                      [
                        ['Mã hồ sơ', item.code],
                        ['Thủ tục hành chính', `${item.procedureCode} · ${item.procedure?.name || ''}`],
                        ['Người nộp hồ sơ', item.applicant?.name || ''],
                        ['Trạng thái kết luận', labels[item.status] || item.status],
                        ['Lý do và căn cứ từ chối', item.publicNote || (item.events || []).slice(-1)[0]?.detail || ''],
                      ],
                    )
                  }
                >
                  In Mẫu 03 (Từ chối)
                </button>
              )}
              {item.canManageLookupKey && (
                <button
                  type="button"
                  className={`button ${showLookupDrawer ? 'primary' : 'secondary'} compact-btn`}
                  aria-expanded={showLookupDrawer}
                  onClick={() => setShowLookupDrawer(open => !open)}
                >
                  {showLookupDrawer ? 'Đóng khóa tra cứu' : 'Mã & Khóa tra cứu'}
                </button>
              )}
            </div>
          )}
        </div>
        <h1 className="case-detail-title">{item.procedure?.name || item.procedureCode}</h1>
        {isStaff && item.canManageLookupKey && showLookupDrawer && (
          <StaffLookupKey key={item.code} item={item} onChanged={onLookupKeyChanged} />
        )}
      </header>

      <div className="detail-layout case-detail-grid">
        <div className="detail-main case-detail-main">
          <div className="staff-module-tabs" role="tablist" aria-label="Thông tin hồ sơ chi tiết">
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === 'dossier'}
              className={`staff-module-tab${detailTab === 'dossier' ? ' active' : ''}`}
              onClick={() => setDetailTab('dossier')}
            >
              <span>1. Tờ khai &amp; Thành phần hồ sơ</span>
              {item.attachments?.length ? <b>{item.attachments.length}</b> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === 'assessment'}
              className={`staff-module-tab${detailTab === 'assessment' ? ' active' : ''}`}
              onClick={() => setDetailTab('assessment')}
            >
              <span>2. Thẩm định, Tài chính &amp; Kết quả</span>
              {(item.draftResult || item.result || item.fee?.amount || item.workflowEvidence) ? <b>✓</b> : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === 'timeline'}
              className={`staff-module-tab${detailTab === 'timeline' ? ' active' : ''}`}
              onClick={() => setDetailTab('timeline')}
            >
              <span>3. Nhật ký xử lý</span>
              <b>{item.events?.length || 0}</b>
            </button>
          </div>

          {detailTab === 'dossier' && (
            <div className="case-tab-content">
              {item.supplement?.reason && (
                <div className="source-warning">
                  <b>Yêu cầu bổ sung hồ sơ (Mẫu 02):</b> {item.supplement.reason}
                  {(item.supplement.items || []).length > 0 && (
                    <ul>
                      {(item.supplement.items || []).map((entry: string, idx: number) => (
                        <li key={`${entry}-${idx}`}>{entry}</li>
                      ))}
                    </ul>
                  )}
                  {item.supplement.citizenNote && (
                    <p>
                      <b>Giải trình / bổ sung đã gửi:</b> {item.supplement.citizenNote}
                      {item.supplement.respondedAt ? ` (${toDate(item.supplement.respondedAt)})` : ''}
                    </p>
                  )}
                </div>
              )}

              {pendingNotice && (
                <div className="source-warning">
                  <b>Đã nhận yêu cầu dừng ngày {toDate(item.withdrawal.requestReceivedAt)}.</b> Trạng thái hồ sơ vẫn được giữ nguyên, chờ người có thẩm quyền ký và phát hành Mẫu 06.
                </div>
              )}
              {pendingNotice && item.withdrawal.noticeDraft && (
                <Mau06Draft draft={{ ...item.withdrawal.noticeDraft, ...noticeHeader }} />
              )}
              {item.withdrawal?.status === 'DA_PHAT_HANH' && (
                <div className="source-warning">
                  <b>Đã phát hành Thông báo dừng Mẫu 06 số {item.withdrawal.noticeNumber}.</b> Kênh gửi:{' '}
                  {item.withdrawal.noticeDelivery?.channel === 'BUU_CHINH' ? 'Bưu chính' : 'Trực tiếp'} ·{' '}
                  {item.withdrawal.noticeDelivery?.reference}
                  {noticeDoc?.downloadUrl && (
                    <p>
                      <a href={noticeDoc.downloadUrl}>Tải Thông báo dừng Mẫu 06 đã ký</a>
                    </p>
                  )}
                </div>
              )}
              {item.withdrawal?.status === 'KHONG_DU_DIEU_KIEN' && (
                <div className="source-warning">
                  <b>Không phát hành Mẫu 06:</b> {item.withdrawal.ineligibleReason}
                </div>
              )}

              {item.requestSummary && (
                <section className="panel citizen-case-section">
                  <h3>Nội dung yêu cầu giải quyết</h3>
                  <p>{item.requestSummary}</p>
                </section>
              )}

              <div className="panel dossier-declaration-panel">
                <CaseDeclaration item={item} />
                {(!item.procedure?.submission || !item.declaration) && (
                  <section className="citizen-case-section">
                    <h3>Tờ khai điện tử</h3>
                    <p className="muted">Hồ sơ tiếp nhận trực tiếp tại quầy hoặc không sử dụng biểu mẫu điện tử cấu trúc.</p>
                  </section>
                )}
              </div>

              <section className="panel citizen-case-section">
                <h3>Tệp đính kèm &amp; Hồ sơ giấy tiếp nhận tại quầy</h3>
                {item.attachments?.length ? (
                  <ul className="dossier-attachment-list">
                    {item.attachments.map(file => (
                      <li key={file.name}>
                        <a href={file.downloadUrl} target="_blank" rel="noreferrer">
                          📄 {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Chưa có tệp đính kèm điện tử.</p>
                )}

                {item.paperOriginals && (
                  <div className="dossier-paper-box">
                    <p>
                      <b>Bản giấy đã kiểm đếm tại quầy:</b> {item.paperOriginals}
                    </p>
                    {item.digitization ? (
                      <p>
                        <b>Đã số hóa:</b> {item.digitization.pageCount} trang · Sổ đăng ký:{' '}
                        {item.digitization.documentRegister} · Thực hiện bởi {item.digitization.digitizedBy} (
                        {toDate(item.digitization.digitizedAt)})
                      </p>
                    ) : (
                      <p className="field-help">Chưa đính kèm bản quét số hóa tại quầy.</p>
                    )}
                  </div>
                )}

                {Object.entries(item.documentExemptions || {}).length > 0 && (
                  <div className="dossier-paper-box">
                    <b>Giải trình thành phần hồ sơ của người nộp:</b>
                    {Object.entries(item.documentExemptions).map(([id, reason]) => (
                      <p key={id}>
                        <b>
                          {(item.procedure?.submission?.documents || []).find((doc: { id: string }) => doc.id === id)
                            ?.label || id}
                          :
                        </b>{' '}
                        {String(reason)}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {detailTab === 'assessment' && (
            <div className="case-tab-content">
              {item.workflowGuard && (
                <section className="panel citizen-case-section">
                  <div className="panel-title">
                    <div>
                      <h3>Quy trình nghiệp vụ &amp; Điều kiện chuyển bước</h3>
                      <p>
                        {item.workflow?.title || item.procedure?.name} · Phiên bản quy trình:{' '}
                        {item.workflowGuard.version || 'Mặc định'}
                      </p>
                    </div>
                    {item.workflowGuard.sourceUrl && (
                      <a className="button secondary compact-btn" href={item.workflowGuard.sourceUrl} target="_blank" rel="noreferrer">
                        Công bố chính thức ↗
                      </a>
                    )}
                  </div>
                  {item.workflowGuard.message && (
                    <div className="source-warning small-warning" role="note">
                      {item.workflowGuard.message}
                    </div>
                  )}
                  {!!item.workflowGuard.officialSteps?.length && (
                    <div className="workflow-steps-accordion">
                      {item.workflowGuard.officialSteps.map((step: { id: string; name: string; description: string }) => (
                        <details key={step.id}>
                          <summary>{step.name}</summary>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{step.description}</p>
                        </details>
                      ))}
                      {item.workflowGuard.conditions && (
                        <details>
                          <summary>Yêu cầu, điều kiện thực hiện thủ tục</summary>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{item.workflowGuard.conditions}</p>
                        </details>
                      )}
                    </div>
                  )}
                </section>
              )}

              {item.workflowEvidence && (
                <section className="panel citizen-case-section">
                  <h3>Kết quả thẩm định / kiểm tra chuyên ngành</h3>
                  <p>
                    <b>Kết luận kiểm tra:</b> {item.workflowEvidence.outcome} · {toDate(item.workflowEvidence.verifiedAt)}
                  </p>
                  {(item.workflowEvidence.registerReference || item.workflowEvidence.dataReference) && (
                    <p>
                      <b>Số sổ / Mã tham chiếu dữ liệu:</b>{' '}
                      {item.workflowEvidence.registerReference || item.workflowEvidence.dataReference}
                    </p>
                  )}
                  <p>
                    <b>Căn cứ thẩm định:</b> {item.workflowEvidence.verificationBasis}
                  </p>
                  {item.workflowEvidence.financialAssessment && (
                    <p>
                      <b>Xác định nghĩa vụ tài chính:</b> {item.workflowEvidence.financialAssessment}
                    </p>
                  )}
                </section>
              )}

              {item.milestones?.length > 0 && (
                <section className="panel citizen-case-section">
                  <h3>Mốc xử lý trung gian</h3>
                  {item.milestones.map((milestone: { id: string; label: string; dueDate: string; completedAt?: string }) => (
                    <p key={milestone.id}>
                      <b>{milestone.label}:</b> hạn {toDate(milestone.dueDate)} ·{' '}
                      {milestone.completedAt ? `Đã thực hiện ${toDate(milestone.completedAt)}` : 'Chưa hoàn tất'}
                    </p>
                  ))}
                </section>
              )}

              <section className="panel citizen-case-section">
                <h3>Nghĩa vụ tài chính (Phí / Lệ phí)</h3>
                {item.fee?.amount ? (
                  <>
                    <p>
                      <b>Số tiền: {Number(item.fee.amount).toLocaleString('vi-VN')} đồng</b> · {item.fee.basis}
                    </p>
                    <p>
                      Trạng thái:{' '}
                      <b>
                        {({
                          DUE: 'Chờ thanh toán',
                          PAID: 'Chờ kế toán đối soát',
                          RECONCILED: 'Đã đối soát chứng từ',
                          WAIVED: 'Đã miễn thu',
                          REFUNDED: 'Đã hoàn trả',
                        } as Record<string, string>)[item.fee.status] || item.fee.status}
                      </b>
                    </p>
                  </>
                ) : (
                  <p className="muted">Chưa phát sinh hoặc chưa cấu hình khoản thu trên hồ sơ này.</p>
                )}
              </section>

              <section className="panel citizen-case-section">
                <h3>Dự thảo, Phê duyệt &amp; Phát hành kết quả</h3>
                {item.draftResult ? (
                  <div className="dossier-paper-box">
                    <b>Dự thảo kết quả giải quyết:</b>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{item.draftResult}</p>
                    {item.approvalNote && (
                      <p>
                        <b>Ý kiến lãnh đạo phê duyệt:</b> {item.approvalNote}
                        {item.approvedAt ? ` (${toDate(item.approvedAt)})` : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="muted">Chưa có nội dung dự thảo kết quả.</p>
                )}

                {item.sandboxSignature && (
                  <div className={item.sandboxSignature.verified ? 'citizen-success' : 'form-error'} style={{ marginTop: 12 }}>
                    <b>{item.sandboxSignature.verified ? 'Đã ký số nội bộ hợp lệ (Ed25519)' : 'Chữ ký số không hợp lệ'}</b>
                    <p>
                      Người ký: {item.sandboxSignature.signer} · {toDate(item.sandboxSignature.signedAt)} · SHA-256:{' '}
                      <code>{item.sandboxSignature.documentHash}</code>
                    </p>
                  </div>
                )}

                {item.status === 'DA_PHE_DUYET' && !item.sandboxSignature && (
                  <div className="source-warning" style={{ marginTop: 12 }}>
                    <b>Hồ sơ đã phê duyệt, chờ ký số:</b>{' '}
                    {item.approvedAt && item.approvedById && String(item.draftResult || '').trim().length >= 10
                      ? 'Lãnh đạo có thẩm quyền ký số có thể thực hiện ký kết quả trước khi văn thư phát hành.'
                      : 'Cần bổ sung đầy đủ dự thảo và thông tin phê duyệt trước khi ký.'}
                  </div>
                )}

                {item.result && (
                  <div className="dossier-paper-box" style={{ marginTop: 12 }}>
                    <p>
                      <b>Số hiệu văn bản kết quả:</b> {item.result.number} · <b>Ngày phát hành:</b>{' '}
                      {toDate((item.result as any).issuedAt || item.resultIssuedAt)}
                    </p>
                    <p>{item.result.content}</p>
                  </div>
                )}

                {item.delivery && (
                  <div className="dossier-paper-box" style={{ marginTop: 12 }}>
                    <p>
                      <b>Người nhận kết quả:</b> {item.delivery.receiver} · <b>Kênh trả:</b>{' '}
                      {channelNames[item.delivery.channel] || item.delivery.channel}
                    </p>
                    <p>
                      <b>Biên nhận / Chứng cứ giao:</b> {item.delivery.evidence} · <b>Thời gian:</b>{' '}
                      {toDate(item.delivery.at)}
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {detailTab === 'timeline' && (
            <section className="panel citizen-case-section">
              <h3>Nhật ký xử lý hồ sơ ({item.events?.length || 0} mốc sự kiện)</h3>
              {item.events?.length > 0 ? (
                <div className="timeline">
                  {item.events.map((event, i) => (
                    <div className="timeline-item" key={`${event.at}-${i}`}>
                      <span className="timeline-dot" />
                      <div>
                        <b>{event.title}</b>
                        <small>
                          {toDate(event.at)}
                          {isStaff && event.actor ? ` · ${event.actor}` : ''}
                          {isStaff && event.audience === 'internal' ? ' · [Nội bộ]' : ''}
                        </small>
                        {(isStaff || event.audience !== 'internal') && event.detail && <p>{event.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Chưa có sự kiện xử lý.</p>
              )}
              {isStaff && item.withdrawal?.requestDocuments?.length > 0 && (
                <div className="dossier-paper-box" style={{ marginTop: 14 }}>
                  <b>Tài liệu yêu cầu dừng hồ sơ (Mẫu 05):</b>
                  {item.withdrawal.requestDocuments.map((file: any) => (
                    <div key={file.name}>
                      <a href={file.downloadUrl}>{file.name}</a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="detail-side case-detail-side">
          {(isStaff || actionOptions.length > 0) && (
            <section className="panel action-panel sticky-action-panel">
              <div className="action-panel-head">
                <h3>{isStaff ? 'Xử lý hồ sơ' : 'Gửi bổ sung hồ sơ'}{pendingNotice ? ' · Yêu cầu dừng' : ''}</h3>
                <span className="count-chip">{actionOptions.length} thao tác</span>
              </div>
              {item.workflowGuard?.message && actionOptions.length > 0 && (
                <p className="action-guard-hint">{item.workflowGuard.message}</p>
              )}
              {actionOptions.length ? (
                <form onSubmit={onSubmitAction}>
                  <label>
                    Chọn nghiệp vụ thực hiện
                    <select
                      value={action}
                      onChange={e => {
                        const next = e.target.value
                        setAction(next)
                        setActionText(['save_draft', 'submit_review'].includes(next) ? item.draftResult || '' : '')
                      }}
                      required
                    >
                      <option value="">— Chọn thao tác xử lý —</option>
                      {actionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {action === 'assign' && (
                    <label>
                      Chuyên viên được phân công
                      <select value={assignee} onChange={e => setAssignee(e.target.value)} required>
                        <option value="">Chọn chuyên viên thụ lý</option>
                        {staff.map(person => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {action === item.workflowGuard?.verificationAction &&
                    (item.workflowGuard.evidenceFields || []).map(
                      (field: { id: string; label: string; options?: string[]; minLength?: number }) => (
                        <label key={field.id}>
                          {field.label}
                          {field.options ? (
                            <select
                              name={`workflow-${field.id}`}
                              defaultValue={item.workflowEvidence?.[field.id] || ''}
                              required
                            >
                              <option value="" disabled>
                                Chọn kết quả kiểm tra
                              </option>
                              {field.options.map(value => (
                                <option key={value}>{value}</option>
                              ))}
                            </select>
                          ) : (
                            <textarea
                              name={`workflow-${field.id}`}
                              rows={3}
                              required
                              minLength={field.minLength || 1}
                              maxLength={1200}
                              defaultValue={item.workflowEvidence?.[field.id] || ''}
                            />
                          )}
                        </label>
                      ),
                    )}
                  {action === 'digitize_documents' && (
                    <label>
                      Số trang đã quét
                      <input name="pageCount" type="number" min="1" max="500" required />
                    </label>
                  )}
                  {action === 'set_fee' && (
                    <label>
                      Số tiền (đồng)
                      <input name="feeAmount" type="number" min="1" max="100000000" step="1" required />
                    </label>
                  )}
                  {needsReason && (
                    <label>
                      {['save_draft', 'submit_review'].includes(action)
                        ? 'Dự thảo kết quả giải quyết'
                        : action === 'submit_supplement'
                          ? 'Nội dung bổ sung'
                          : action === 'request_supplement'
                            ? 'Nội dung cần bổ sung (mỗi ý một dòng, nêu rõ căn cứ)'
                            : action === 'prepare_stop_notice'
                              ? 'Lý do đề nghị dừng theo Mẫu 05'
                              : action === 'digitize_documents'
                                ? 'Danh mục giấy tờ đối chiếu với bản gốc'
                                : action === 'set_fee'
                                  ? 'Căn cứ và nguồn xác định khoản thu'
                                  : 'Nội dung / căn cứ xử lý'}
                      <textarea
                        value={actionText}
                        onChange={e => setActionText(e.target.value)}
                        rows={4}
                        required
                        minLength={
                          ['save_draft', 'submit_review'].includes(action)
                            ? 10
                            : action === 'request_supplement' || action === 'set_fee'
                              ? 15
                              : action === 'prepare_stop_notice'
                                ? 8
                                : 3
                        }
                      />
                    </label>
                  )}
                  {action === 'sign_result' && (
                    <p className="source-warning small-warning">
                      Tạo chữ ký số nội bộ Ed25519 gắn với nội dung dự thảo đã duyệt.
                    </p>
                  )}
                  {action === 'issue' && (
                    <label>
                      Số hiệu văn bản kết quả
                      <input name="resultNumber" required minLength={3} maxLength={100} placeholder="SBX-2026-001" />
                    </label>
                  )}
                  {action === 'deliver' && (
                    <>
                      <label>
                        Người nhận kết quả
                        <input
                          name="deliveryReceiver"
                          required
                          minLength={2}
                          maxLength={180}
                          defaultValue={item.applicant?.name || ''}
                        />
                      </label>
                      <label>
                        Kênh trả
                        <select name="deliveryChannel" required defaultValue="">
                          <option value="" disabled>
                            Chọn kênh
                          </option>
                          <option value="TRUC_TIEP">Trực tiếp</option>
                          <option value="BUU_CHINH">Bưu chính (ghi nhận nội bộ)</option>
                          <option value="DIEN_TU_SANDBOX">Điện tử thử nghiệm</option>
                        </select>
                      </label>
                      <label>
                        Mã biên nhận/chứng cứ giao
                        <input name="deliveryEvidence" required minLength={3} maxLength={180} />
                      </label>
                    </>
                  )}
                  {action === 'prepare_stop_notice' && (
                    <>
                      <label>
                        Kênh nhận yêu cầu
                        <select name="stopChannel" required defaultValue="">
                          <option value="" disabled>
                            Chọn kênh
                          </option>
                          <option value="TRUC_TIEP">Trực tiếp tại Bộ phận Một cửa</option>
                          <option value="BUU_CHINH">Bưu chính</option>
                        </select>
                      </label>
                      <label>
                        Người yêu cầu
                        <select name="requesterType" required defaultValue="">
                          <option value="" disabled>
                            Chọn chủ thể
                          </option>
                          <option value="SELF">Chủ thể hồ sơ</option>
                          <option value="REPRESENTATIVE">Người đại diện</option>
                        </select>
                      </label>
                      <label>
                        Họ tên người yêu cầu theo Mẫu 05
                        <input
                          name="requesterName"
                          maxLength={150}
                          minLength={2}
                          defaultValue={item.applicant?.name || ''}
                          required
                        />
                      </label>
                      <label>
                        Số định danh cá nhân/mã số tổ chức theo Mẫu 05
                        <input name="requesterIdentifier" maxLength={80} minLength={3} required />
                      </label>
                      <label>
                        Địa chỉ người yêu cầu theo Mẫu 05
                        <input name="requesterAddress" maxLength={300} minLength={3} required />
                      </label>
                      <label>
                        Số điện thoại theo Mẫu 05
                        <input name="requesterPhone" type="tel" maxLength={40} />
                      </label>
                      <label>
                        Email theo Mẫu 05
                        <input name="requesterEmail" type="email" maxLength={254} />
                      </label>
                      <label>
                        Mã biên nhận trực tiếp hoặc mã bưu gửi
                        <input name="requestReference" maxLength={120} placeholder="Bắt buộc nếu nhận qua bưu chính" />
                      </label>
                      <label className="check-row">
                        <input name="identityVerified" type="checkbox" required /> Đã đối chiếu danh tính người yêu cầu
                      </label>
                      <label className="check-row">
                        <input name="authorizationVerified" type="checkbox" /> Nếu là người đại diện: đã đối chiếu giấy tờ chứng minh căn cứ đại diện
                      </label>
                      <label>
                        Văn bản yêu cầu dừng Mẫu 05 đã ký (PDF, PNG hoặc JPG)
                        <input
                          name="supportingFiles"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          required
                          multiple
                        />
                      </label>
                    </>
                  )}
                  {action === 'issue_stop_notice' && (
                    <>
                      <p className="source-warning small-warning">
                        Quyền ký được cấp theo văn bản {signingAuthorityRef}. Chỉ ghi nhận phát hành sau khi Mẫu 06 đã được ký.
                      </p>
                      <label>
                        Tên cấp tỉnh/Bộ, ngành/cấp xã ghi ở đầu biểu mẫu
                        <input
                          name="authorityName"
                          maxLength={180}
                          minLength={2}
                          value={noticeHeader.authorityName}
                          onChange={e => updateNoticeHeader('authorityName', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Tên Trung tâm/Bộ phận Tiếp nhận và Trả kết quả
                        <input
                          name="serviceOfficeName"
                          maxLength={180}
                          minLength={2}
                          value={noticeHeader.serviceOfficeName}
                          onChange={e => updateNoticeHeader('serviceOfficeName', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Địa danh ban hành
                        <input
                          name="noticeLocation"
                          maxLength={100}
                          minLength={2}
                          value={noticeHeader.noticeLocation}
                          onChange={e => updateNoticeHeader('noticeLocation', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Ngày trên Mẫu 06
                        <input
                          name="noticeDate"
                          type="date"
                          min={item.withdrawal?.requestReceivedAt?.slice(0, 10)}
                          max={todayInHanoi}
                          value={noticeHeader.noticeDate}
                          onChange={e => updateNoticeHeader('noticeDate', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Số văn bản đầy đủ theo sổ văn bản đi
                        <input
                          name="noticeNumber"
                          type="text"
                          inputMode="text"
                          pattern="[0-9]{1,20}/[^/]{2,80}"
                          maxLength={100}
                          placeholder="12/TTPVHCC (BPTNTKQ)"
                          value={noticeHeader.noticeNumber}
                          onChange={e => updateNoticeHeader('noticeNumber', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Kênh gửi thông báo
                        <select name="noticeDeliveryChannel" required defaultValue="">
                          <option value="" disabled>
                            Chọn kênh
                          </option>
                          <option value="TRUC_TIEP">Trực tiếp</option>
                          <option value="BUU_CHINH">Bưu chính</option>
                        </select>
                      </label>
                      <label>
                        Biên nhận giao hoặc mã bưu gửi
                        <input name="deliveryReference" maxLength={150} minLength={3} required />
                      </label>
                      <label>
                        Đầu mối liên hệ nhận lại hồ sơ giấy và khoản đã nộp
                        <input
                          name="collectionOffice"
                          maxLength={240}
                          minLength={3}
                          value={noticeHeader.collectionOffice}
                          onChange={e => updateNoticeHeader('collectionOffice', e.target.value)}
                          required
                        />
                      </label>
                      <label className="check-row">
                        <input name="signatureAttested" type="checkbox" required /> Tôi xác nhận bản Mẫu 06 đính kèm đã được người có thẩm quyền ký
                      </label>
                      <label>
                        Bản Thông báo dừng Mẫu 06 đã ký
                        <input
                          name="supportingFiles"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          required
                        />
                      </label>
                    </>
                  )}
                  {action === 'submit_supplement' && (
                    <label>
                      Tài liệu bổ sung
                      <input
                        name="supportingFiles"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        multiple
                      />
                    </label>
                  )}
                  {action &&
                    ![
                      'prepare_stop_notice',
                      'issue_stop_notice',
                      'submit_supplement',
                      'set_fee',
                      'waive_fee',
                      'sign_result',
                      'issue',
                      'deliver',
                    ].includes(action) && (
                      <label>
                        Tài liệu đính kèm (nếu cần)
                        <input
                          name="supportingFiles"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                          multiple
                        />
                      </label>
                    )}
                  {action && (
                    <div className="form-actions">
                      <button className="button primary full" disabled={busy}>
                        {busy
                          ? 'Đang lưu…'
                          : action === 'prepare_stop_notice'
                            ? 'Ghi nhận yêu cầu & lập Mẫu 06'
                            : action === 'issue_stop_notice'
                              ? 'Ghi nhận đã ký & phát hành Mẫu 06'
                              : action === 'set_fee'
                                ? 'Lưu khoản thu'
                                : action === 'sign_result'
                                  ? 'Ký thử nghiệm nội dung đã duyệt'
                                  : action === 'issue'
                                    ? 'Phát hành kết quả'
                                    : action === 'deliver'
                                      ? 'Ghi nhận trả kết quả'
                                      : action === 'waive_fee'
                                        ? 'Ghi nhận miễn khoản thu'
                                        : 'Xác nhận thực hiện'}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <p className="muted">
                  Không có thao tác khả dụng cho vai trò hiện tại ở trạng thái <b>{labels[item.status] || item.status}</b>.
                </p>
              )}
            </section>
          )}

          <section className="panel dossier-summary-card">
            <h3>Thông tin tóm tắt hồ sơ</h3>
            <dl className="dossier-meta-list">
              <div>
                <dt>Chủ hồ sơ</dt>
                <dd>
                  <b>{item.applicant?.name || '—'}</b>
                  {item.applicant?.citizenId && <small>Định danh/MST: {item.applicant.citizenId}</small>}
                </dd>
              </div>
              <div>
                <dt>Liên hệ</dt>
                <dd>
                  {[item.applicant?.phone, item.applicant?.email].filter(Boolean).join(' · ') || '—'}
                  {item.applicant?.address && <small>{item.applicant.address}</small>}
                </dd>
              </div>
              <div>
                <dt>Kênh nộp &amp; Nhận KQ</dt>
                <dd>
                  {item.submissionChannel === 'TRUC_TIEP' ? 'Trực tiếp tại quầy' : 'Trực tuyến'} · Nhận:{' '}
                  {channelNames[item.deliveryMethod] || item.deliveryMethod || 'Trực tiếp'}
                </dd>
              </div>
              <div>
                <dt>Cơ quan tiếp nhận</dt>
                <dd>{item.receivingAgency || item.procedure?.agency || '—'}</dd>
              </div>
              <div>
                <dt>Chuyên viên thụ lý</dt>
                <dd>
                  <b>{item.assignment?.assigneeName || item.assignment?.assignee || 'Chưa phân công'}</b>
                  {item.assignment?.assignedAt && <small>Phân công: {toDate(item.assignment.assignedAt)}</small>}
                </dd>
              </div>
              <div>
                <dt>Ngày tiếp nhận</dt>
                <dd>{toDate(item.acceptedAt || item.createdAt)}</dd>
              </div>
              <div>
                <dt>Hạn giải quyết</dt>
                <dd>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
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
