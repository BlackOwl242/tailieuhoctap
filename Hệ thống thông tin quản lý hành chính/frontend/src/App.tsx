import {
  Activity,
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  CheckSquare,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Inbox,
  Info,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react'
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import './App.css'
import './StaffProcedureCatalog.css'
import { Index766Panel, PeriodBalancePanel } from './analytics766'
import { CitizenReceiptView, CitizenTrackingPage } from './CitizenTracking'
import {
  CivicShell,
  MetricCard,
  ModalDialog,
  PanelHeading,
  SLABadge,
  SkipLink,
  StatusTag,
} from './design-system'
import { InformationHome } from './InformationHome'
import {
  CLOSED_STATUSES,
  api,
  computeIndex766,
  computePeriodBalance,
  daysUntil,
  encodeFile,
  getActions,
  handleTabArrows,
  hanoiDate,
  reportDateDisplay,
  roleNames,
  setCitizenSessionToken,
  setStaffSessionToken,
  toDate,
} from './portalUtils'
import { ReportExportButtons } from './ReportExport'
import { readCasesReport } from './reportExportUtils'
import {
  CITIZEN_UPLOAD_LIMIT_TEXT,
  type Bootstrap,
  type CaseFile,
  type PortalRoute,
  type PublicView,
  type QueueFocus,
  type SubmissionReceipt,
  type User,
} from './types'

const LazyCaseDetail = lazy(() =>
  import('./StaffCaseDetail').then(mod => ({ default: mod.CaseDetail })),
)
const LazyCitizenApplicationForm = lazy(() => import('./CitizenSubmission'))
const LazyCitizenProfilePage = lazy(() => import('./CitizenProfile'))
const LazyCitizenWorkspace = lazy(() => import('./CitizenWorkspace'))
const LazyCitizenProcedureCatalog = lazy(() => import('./CitizenProcedureCatalog'))
const LazyAdministrativeServiceDesk = lazy(() =>
  import('./AdministrativeServices').then(mod => ({
    default: mod.AdministrativeServiceDesk,
  })),
)
const LazyPublicAdministrativeServices = lazy(() =>
  import('./AdministrativeServices').then(mod => ({
    default: mod.PublicAdministrativeServices,
  })),
)
const LazyPersonalAccount = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.PersonalAccount })),
)
const LazyStaffAccountManagement = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.StaffAccountManagement })),
)
const LazyAdministrativeReports = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.AdministrativeReports })),
)
const LazyNewsManagement = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.NewsManagement })),
)
const LazyAdminOverview = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.AdminOverview })),
)
const LazyProcedureCatalog = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.ProcedureCatalog })),
)
const LazyCaseActivityLog = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.CaseActivityLog })),
)
const LazyServiceConnections = lazy(() =>
  import('./StaffAdminModules').then(mod => ({ default: mod.ServiceConnections })),
)

const CITY_SUPPORT = 'https://ttpvhcc.hanoi.gov.vn/'
const RECEIPT_STORAGE_KEY = 'hanoiCitizenReceipt'

const OPERATION_STAGES = [
  { label: 'Tiếp nhận', statuses: ['CHO_TIEP_NHAN', 'DA_TIEP_NHAN'] },
  { label: 'Thẩm định', statuses: ['DANG_THU_LY', 'CHO_BO_SUNG'] },
  { label: 'Phê duyệt', statuses: ['TRINH_DUYET'] },
  { label: 'Phát hành', statuses: ['DA_PHE_DUYET'] },
  { label: 'Trả kết quả', statuses: ['DA_PHAT_HANH', 'HOAN_THANH'] },
]

const QUEUE_FILTERS = [
  { key: 'ALL', label: 'Tất cả hồ sơ', statuses: [] as string[] },
  { key: 'INTAKE', label: 'Chờ tiếp nhận', statuses: ['CHO_TIEP_NHAN'] },
  { key: 'PROCESSING', label: 'Đang thụ lý', statuses: ['DA_TIEP_NHAN', 'DANG_THU_LY'] },
  { key: 'REVIEW', label: 'Chờ phê duyệt', statuses: ['TRINH_DUYET'] },
  { key: 'SUPPLEMENT', label: 'Chờ bổ sung', statuses: ['CHO_BO_SUNG'] },
  { key: 'CLOSED', label: 'Đã kết thúc', statuses: [...CLOSED_STATUSES] },
]

const STAFF_DEMO_ACCOUNTS = [
  { label: 'Một cửa Tây Hồ', email: 'intake.tayho@example.test', password: '123' },
  { label: 'Lãnh đạo Tây Hồ', email: 'leader.tayho@example.test', password: '123' },
  { label: 'Quản trị hệ thống', email: 'admin01@example.test', password: '123' },
] as const

function routeFromPath(): PortalRoute {
  const pathname = window.location.pathname
  if (pathname === '/' || pathname === '') return 'public'
  if (pathname === '/tai-khoan' || pathname.startsWith('/tai-khoan/')) return 'citizen-profile'
  if (pathname === '/dang-nhap' || pathname.startsWith('/dang-nhap/')) return 'citizen-login'
  if (pathname === '/staff' || pathname.startsWith('/staff/')) return 'staff'
  if (pathname === '/huong-dan' || pathname.startsWith('/huong-dan/')) return 'guide'
  if (pathname === '/tien-ich' || pathname.startsWith('/tien-ich/')) return 'citizen-services'
  if (pathname === '/thu-tuc' || pathname.startsWith('/thu-tuc/')) return 'catalog'
  if (pathname === '/nop-ho-so' || pathname.startsWith('/nop-ho-so/')) return 'submit'
  if (pathname === '/tra-cuu-ho-so' || pathname.startsWith('/tra-cuu-ho-so/')) return 'track'
  return 'not-found'
}

function readStoredReceipt(): SubmissionReceipt | null {
  const params = new URLSearchParams(window.location.search)
  const urlCode = (params.get('code') || '').trim().toUpperCase()
  const isReceiptView = params.get('v') === 'receipt'
  try {
    const raw = sessionStorage.getItem(RECEIPT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as SubmissionReceipt
      if (parsed && typeof parsed.code === 'string' && parsed.code.trim()) {
        if (!urlCode || parsed.code.toUpperCase() === urlCode) return parsed
      }
    }
  } catch {
    /* Ignore malformed sessionStorage */
  }
  if (isReceiptView && urlCode) {
    return { code: urlCode }
  }
  return null
}

function persistReceipt(value: SubmissionReceipt | null): void {
  try {
    if (!value) sessionStorage.removeItem(RECEIPT_STORAGE_KEY)
    else sessionStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* Ignore storage quota errors */
  }
}

function buildStaffUrl(nextPage: string, caseCode?: string): string {
  const params = new URLSearchParams()
  if (nextPage) params.set('page', nextPage)
  if (caseCode) params.set('case', caseCode)
  const capture = new URLSearchParams(window.location.search).get('capture')
  if (capture) params.set('capture', capture)
  const query = params.toString()
  return query ? `/staff?${query}` : '/staff'
}

function actionableCases(user: User, cases: CaseFile[]): CaseFile[] {
  return cases.filter(item => getActions(user, item).length > 0)
}

function caseEvents(cases: CaseFile[]) {
  return cases
    .flatMap(item =>
      (item.events || []).map(event => ({
        ...event,
        code: item.code,
        procedureName: item.procedure?.name || item.procedureCode,
      })),
    )
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

function LoadingFallback({ label = 'Đang tải phân hệ…' }: { label?: string }) {
  return (
    <div className="panel empty-state" role="status">
      {label}
    </div>
  )
}

function StaffAgencyMasthead() {
  return (
    <div className="agency-masthead" data-surface="staff">
      <div className="agency-masthead-inner">
        <a className="agency-emblem" href="/" aria-label="Trang chủ hệ thống">
          <img src="/images/hanoi-logo.png" alt="Biểu trưng Thành phố Hà Nội" />
        </a>
        <div className="agency-title">
          <span>TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG THÀNH PHỐ HÀ NỘI</span>
          <b>HỆ THỐNG THÔNG TIN GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH</b>
          <small>PHÂN HỆ TÁC NGHIỆP MỘT CỬA &amp; ĐIỀU HÀNH NỘI BỘ</small>
        </div>
      </div>
    </div>
  )
}

function NotFoundSection({
  onHome,
  onCatalog,
}: {
  onHome: () => void
  onCatalog: () => void
}) {
  const attemptedPath = window.location.pathname
  return (
    <section className="not-found-page" aria-labelledby="not-found-heading">
      <div className="panel not-found-card">
        <h1 id="not-found-heading">404 — Không tìm thấy trang</h1>
        <p>
          Đường dẫn <code>{attemptedPath}</code> không tồn tại hoặc đã thay đổi trên hệ thống thông
          tin giải quyết thủ tục hành chính.
        </p>
        <div className="not-found-actions">
          <button type="button" className="button primary" onClick={onHome}>
            Về Trang chủ
          </button>
          <button type="button" className="button secondary" onClick={onCatalog}>
            Danh mục thủ tục
          </button>
        </div>
      </div>
    </section>
  )
}

function AuthScreen({
  onAuthenticated,
  onBack,
}: {
  onAuthenticated: (user: User, csrf: string) => void
  onBack: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-surface', 'staff')
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const data = await api<{ user: User; csrfToken: string }>('/api/auth/login', {
        email,
        password,
      })
      onAuthenticated(data.user, data.csrfToken)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xử lý yêu cầu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page official-auth" data-surface="staff">
      <StaffAgencyMasthead />
      <section className="auth-content">
        <div className="auth-intro">
          <button type="button" className="staff-back-link" onClick={onBack}>
            ← Quay về cổng dịch vụ công
          </button>
          <h1>Bàn làm việc nghiệp vụ Một cửa</h1>
          <p>
            Đăng nhập bằng tài khoản công vụ được phân quyền để tiếp nhận, phân công, thẩm định, ký
            duyệt kết quả và giám sát Bộ chỉ số 766 trong phạm vi cơ quan.
          </p>
          <div className="auth-guidance">
            <p>
              <b>Phân quyền theo vai trò &amp; đơn vị</b>
              <span>
                Tài khoản cán bộ được kiểm soát theo cơ quan tiếp nhận (cấp thành phố hoặc UBND
                phường, xã), vai trò chuyên môn và thời hạn hiệu lực.
              </span>
            </p>
            <p>
              <b>Bảo toàn trạng thái làm việc</b>
              <span>
                Mọi thao tác phê duyệt, yêu cầu bổ sung hoặc cấp khóa tra cứu đều ghi vết kiểm toán
                đầy đủ theo thời gian thực.
              </span>
            </p>
          </div>
        </div>

        <section className="auth-panel" aria-labelledby="staff-login-title">
          <div className="auth-card">
            <h2 id="staff-login-title">Đăng nhập cán bộ nội bộ</h2>
            <p className="muted">Sử dụng email công vụ và mật khẩu đã được cấp phát.</p>
            <form onSubmit={submit} className="form-stack">
              <label htmlFor="staff-login-email">
                <span>Email tài khoản công vụ</span>
                <input
                  id="staff-login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ten.canbo@hanoi.gov.vn"
                  autoComplete="username"
                  maxLength={254}
                  required
                />
              </label>
              <label htmlFor="staff-login-password">
                <span>Mật khẩu</span>
                <input
                  id="staff-login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
              </label>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? 'Đang xác thực…' : 'Đăng nhập bàn làm việc'}
              </button>
            </form>

            <div className="sandbox-demo-helper" aria-label="Tài khoản thực hành nội bộ">
              <div className="sandbox-demo-helper__title">
                <KeyRound size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>Tài khoản thực hành cục bộ (Bấm để điền nhanh)</span>
              </div>
              <div className="sandbox-demo-helper__chips">
                {STAFF_DEMO_ACCOUNTS.map(demo => (
                  <button
                    key={demo.email}
                    type="button"
                    className="sandbox-demo-chip"
                    onClick={() => {
                      setEmail(demo.email)
                      setPassword(demo.password)
                      setError('')
                    }}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-footnote">
              <Info size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>
                Quản trị viên cấp tài khoản và giới hạn quyền theo vai trò, cơ quan và thời hạn hiệu
                lực.
              </span>
            </div>
          </div>
        </section>
      </section>
      <footer className="auth-legal">
        Hệ thống thông tin giải quyết thủ tục hành chính Thành phố Hà Nội · Phân hệ nghiệp vụ nội
        bộ.
      </footer>
    </main>
  )
}

function CitizenAuthSection({
  onAuthenticated,
  onNavigatePath,
  returnContextLabel,
}: {
  onAuthenticated: (user: User, csrf: string, registered: boolean) => void
  onNavigatePath: (path: string) => void
  returnContextLabel?: string
}) {
  const [register, setRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const result = await api<{ user: User; csrfToken: string }>(
        `/api/citizen/auth/${register ? 'register' : 'login'}`,
        values,
      )
      onAuthenticated(result.user, result.csrfToken, register)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xác thực tài khoản.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-content">
      <div className="auth-intro">
        {returnContextLabel && (
          <div className="citizen-source-note" role="status">
            <strong>Yêu cầu xác thực tài khoản công dân</strong>
            <span>{returnContextLabel}</span>
          </div>
        )}
        <h1>
          Một tài khoản thống nhất để thực hiện{' '}
          <span className="auth-title-phrase">dịch vụ công trực tuyến</span>
        </h1>
        <p>
          Đăng nhập để nộp hồ sơ trực tuyến tự động điền thông tin định danh, theo dõi tiến độ chi
          tiết, bổ sung tài liệu, thanh toán phí/lệ phí, đặt lịch hẹn Một cửa và quản lý kho dữ liệu
          cá nhân.
        </p>
        <div className="auth-guidance">
          <p>
            <b>Tra cứu nhanh không cần đăng nhập</b>
            <span>
              Nếu chỉ cần kiểm tra trạng thái xử lý công khai bằng Mã hồ sơ, bạn có thể mở trực tiếp{' '}
              <a
                href="/tra-cuu-ho-so"
                className="plain-link"
                onClick={e => {
                  e.preventDefault()
                  onNavigatePath('/tra-cuu-ho-so')
                }}
              >
                Tra cứu hồ sơ
              </a>
              .
            </span>
          </p>
          <p>
            <b>Bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)</b>
            <span>
              Hệ thống không hiển thị công khai họ tên, số định danh hoặc tài liệu đính kèm khi chưa
              xác thực chủ hồ sơ.
            </span>
          </p>
        </div>
      </div>

      <section className="auth-panel" aria-labelledby="citizen-auth-title">
        <div className="auth-card">
          <h2 id="citizen-auth-title">
            {register ? 'Đăng ký tài khoản công dân' : 'Đăng nhập công dân / tổ chức'}
          </h2>

          <form className="form-stack" onSubmit={submit} key={register ? 'register' : 'login'}>
            {register && (
              <>
                <label htmlFor="citizen-reg-name">
                  <span>Họ và tên</span>
                  <input
                    id="citizen-reg-name"
                    name="name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={150}
                    required
                  />
                </label>
                <label htmlFor="citizen-reg-phone">
                  <span>Số điện thoại liên hệ</span>
                  <input
                    id="citizen-reg-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    minLength={8}
                    maxLength={40}
                    required
                  />
                </label>
              </>
            )}
            <label htmlFor="citizen-auth-email">
              <span>Email đăng nhập</span>
              <input
                id="citizen-auth-email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="congdan@example.vn"
                autoComplete="username"
                maxLength={254}
                required
              />
            </label>
            <label htmlFor="citizen-auth-password">
              <span>Mật khẩu</span>
              <input
                id="citizen-auth-password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={register ? 12 : undefined}
                maxLength={128}
                required
              />
            </label>
            {register && (
              <>
                <small className="muted">Từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số.</small>
                <label htmlFor="citizen-reg-confirm">
                  <span>Nhập lại mật khẩu</span>
                  <input
                    id="citizen-reg-confirm"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </label>
              </>
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? 'Đang xử lý…' : register ? 'Đăng ký và tiếp tục' : 'Đăng nhập và tiếp tục'}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => {
                setRegister(value => !value)
                setError('')
              }}
            >
              {register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký mới'}
            </button>
          </form>

          {!register && (
            <div className="sandbox-demo-helper" aria-label="Tài khoản công dân thực hành">
              <div className="sandbox-demo-helper__title">
                <ShieldCheck size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>Môi trường thực hành cục bộ (Bấm để điền mẫu)</span>
              </div>
              <div className="sandbox-demo-helper__chips">
                <button
                  type="button"
                  className="sandbox-demo-chip"
                  onClick={() => {
                    setEmail('congdan@example.test')
                    setPassword('123')
                    setError('')
                  }}
                >
                  Điền tài khoản mẫu: Nguyễn Văn An (congdan@example.test)
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

function StaffReauthModal({
  user,
  onReauthenticated,
  onSignOut,
}: {
  user: User
  onReauthenticated: (nextUser: User, csrf: string) => Promise<void>
  onSignOut: () => Promise<void>
}) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api<{ user: User; csrfToken: string }>('/api/auth/login', {
        email: user.email,
        password,
      })
      await onReauthenticated(result.user, result.csrfToken)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể xác thực lại phiên làm việc.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalDialog
      open
      title="Phiên làm việc cán bộ đã hết hạn"
      description="Hồ sơ đang mở và nội dung nhận xét/dự thảo chưa lưu của bạn vẫn được giữ nguyên trên màn hình. Vui lòng nhập lại mật khẩu để tiếp tục."
      onClose={() => {
        /* Modal stays open until re-authenticated or explicitly signed out */
      }}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label htmlFor="reauth-email">
          <span>Tài khoản cán bộ</span>
          <input id="reauth-email" type="email" value={user.email} readOnly />
        </label>
        <label htmlFor="reauth-password">
          <span>Mật khẩu xác thực lại</span>
          <input
            id="reauth-password"
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? 'Đang khôi phục phiên…' : 'Đăng nhập lại & giữ nội dung đang soạn'}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={() => void onSignOut()}
          >
            Đăng xuất về trang chủ
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}

function PasswordChangeScreen({
  onChanged,
  onSignOut,
}: {
  onChanged: (user: User) => void
  onSignOut: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    if (values.newPassword !== values.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      onChanged(result.user)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đổi mật khẩu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page official-auth" data-surface="staff">
      <StaffAgencyMasthead />
      <section className="auth-content password-change-content">
        <div className="auth-intro">
          <h1>Đổi mật khẩu khởi tạo</h1>
          <p>
            Đây là lần đăng nhập đầu tiên. Hãy đổi mật khẩu được bàn giao trước khi mở dữ liệu và
            chức năng nghiệp vụ.
          </p>
        </div>
        <section className="auth-panel" aria-labelledby="password-change-title">
          <div className="auth-card">
            <h2 id="password-change-title">Tạo mật khẩu riêng</h2>
            <p className="muted">
              Mật khẩu cần có từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số.
            </p>
            <form onSubmit={submit} className="form-stack">
              <label htmlFor="pw-current">
                <span>Mật khẩu khởi tạo</span>
                <input
                  id="pw-current"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
              </label>
              <label htmlFor="pw-new">
                <span>Mật khẩu mới</span>
                <input
                  id="pw-new"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label htmlFor="pw-confirm">
                <span>Nhập lại mật khẩu mới</span>
                <input
                  id="pw-confirm"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? 'Đang cập nhật…' : 'Đổi mật khẩu và tiếp tục'}
              </button>
            </form>
          </div>
        </section>
      </section>
      <footer className="auth-legal password-change-legal">
        <span>Tài khoản được cấp theo vai trò, cơ quan và thời hạn đã duyệt.</span>
        <button type="button" className="text-button" onClick={onSignOut}>
          Đăng xuất
        </button>
      </footer>
    </main>
  )
}

function GuideContent({
  isStaff = false,
  onNavigatePath,
}: {
  isStaff?: boolean
  onNavigatePath?: (path: string) => void
}) {
  const [audience, setAudience] = useState<'citizen' | 'staff'>(() =>
    isStaff || new URLSearchParams(window.location.search).get('role') === 'staff'
      ? 'staff'
      : 'citizen',
  )

  const go = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (!onNavigatePath) return
    e.preventDefault()
    onNavigatePath(path)
  }

  return (
    <div className="guide-content">
      <div className="citizen-page-heading">
        <h1>Hướng dẫn thực hiện thủ tục hành chính &amp; tác nghiệp</h1>
        <p>
          Tài liệu hướng dẫn từng bước dành cho người dân, tổ chức sử dụng dịch vụ công trực tuyến và
          cán bộ giải quyết hồ sơ Một cửa.
        </p>
      </div>

      <section className="guide-switch" aria-label="Chọn đối tượng hướng dẫn">
        <button
          type="button"
          className={audience === 'citizen' ? 'active' : ''}
          aria-pressed={audience === 'citizen'}
          onClick={() => setAudience('citizen')}
        >
          Người dân, tổ chức
        </button>
        <button
          type="button"
          className={audience === 'staff' ? 'active' : ''}
          aria-pressed={audience === 'staff'}
          onClick={() => setAudience('staff')}
        >
          Cán bộ Một cửa
        </button>
      </section>

      {audience === 'citizen' ? (
        <>
          <section className="guide-note">
            <b>Chuẩn bị tài khoản &amp; Dữ liệu cá nhân tái sử dụng</b>
            <p>
              Đăng nhập bằng tài khoản công dân. Trước khi lập hồ sơ, bạn có thể mở{' '}
              <a
                href="/tai-khoan/thong-tin-ca-nhan"
                onClick={e => go(e, '/tai-khoan/thong-tin-ca-nhan')}
              >
                Thông tin định danh &amp; Kho tài liệu
              </a>{' '}
              để kiểm tra dữ liệu tự động điền sẵn theo nguyên tắc kê khai một lần.
            </p>
          </section>
          <section className="guide-lead">
            <h2>Quy trình 4 bước thực hiện dịch vụ công trực tuyến</h2>
            <p>
              Hệ thống công khai đầy đủ thông tin pháp lý thủ tục hành chính, biểu mẫu điện tử, tra
              cứu tiến độ công khai và theo dõi kết quả giải quyết trực tuyến.
            </p>
            <div className="guide-links">
              <a className="button secondary" href="/thu-tuc" onClick={e => go(e, '/thu-tuc')}>
                Tra cứu danh mục thủ tục
              </a>
              <a className="button primary" href="/nop-ho-so" onClick={e => go(e, '/nop-ho-so')}>
                Nộp hồ sơ trực tuyến
              </a>
            </div>
          </section>
          <ol className="guide-steps">
            <li>
              <b>Tìm kiếm và xem thông tin tóm tắt thủ tục</b>
              <p>
                Mở “Danh mục thủ tục”, lọc ngay theo từ khóa, mức độ dịch vụ công hoặc lĩnh vực để
                xem thời hạn giải quyết, lệ phí, thành phần hồ sơ và cơ quan thực hiện.
              </p>
            </li>
            <li>
              <b>Chọn thủ tục, cơ quan tiếp nhận và điền tờ khai</b>
              <p>
                Quy trình nộp gồm 5 bước rõ ràng: chọn thủ tục &amp; cơ quan tiếp nhận, kiểm tra
                thông tin chủ hồ sơ đã đồng bộ, điền tờ khai chuyên ngành, đính kèm giấy tờ và xác
                nhận gửi.
              </p>
            </li>
            <li>
              <b>Đính kèm giấy tờ, rà soát và gửi hồ sơ</b>
              <p>
                Tải giấy tờ theo từng thành phần ({CITIZEN_UPLOAD_LIMIT_TEXT}), kiểm tra lại bản tóm
                tắt kê khai và lựa chọn hình thức nhận kết quả.
              </p>
            </li>
            <li>
              <b>Tra cứu tiến độ, nộp phí, bổ sung hoặc nhận kết quả</b>
              <p>
                Mở “Tra cứu hồ sơ” để kiểm tra nhanh tiến độ bằng Mã hồ sơ, hoặc đăng nhập để in
                phiếu Mẫu 01–06 kèm mã QR, nộp phí trực tuyến và tải kết quả điện tử.
              </p>
            </li>
          </ol>
        </>
      ) : (
        <>
          <section className="guide-lead">
            <h2>Quy trình tác nghiệp trên Bàn làm việc cán bộ</h2>
            <p>
              Bàn làm việc cán bộ được thiết kế chuẩn công thái học theo luồng xử lý: Bàn điều hành
              &amp; Bộ chỉ số 766, Hộp xử lý hồ sơ, Quầy một cửa &amp; Lịch hẹn, Thẩm định chia đôi
              màn hình và Đối soát tài chính.
            </p>
            {!isStaff && (
              <div className="guide-links">
                <a className="button primary" href="/staff" onClick={e => go(e, '/staff')}>
                  Mở Bàn làm việc cán bộ
                </a>
              </div>
            )}
          </section>
          <ol className="guide-steps">
            <li>
              <b>Điều hành tác nghiệp, Cân đối kỳ &amp; Bộ chỉ số 766</b>
              <p>
                Từ “Bàn điều hành”, theo dõi ngay các hồ sơ cần xử lý theo vai trò, hồ sơ sắp đến hạn
                và quá hạn. Chuyển sang tab “Phân tích, Cân đối kỳ &amp; Chỉ số 766” để giám sát theo
                Thông tư 09/2026/TT-BTP và Quyết định 766/QĐ-TTg.
              </p>
            </li>
            <li>
              <b>Tiếp nhận hàng loạt, lọc nhanh (phím /) &amp; Quầy một cửa</b>
              <p>
                Tại “Hộp xử lý hồ sơ”, nhấn phím <code>/</code> để tìm kiếm nhanh, tích chọn nhiều hồ
                sơ để tiếp nhận hoặc phân công hàng loạt. Tại “Quầy một cửa”, lập hồ sơ trực tiếp và
                xác nhận lịch hẹn công dân.
              </p>
            </li>
            <li>
              <b>Thẩm định chia đôi màn hình &amp; phê duyệt quyết định</b>
              <p>
                Mở hồ sơ để đối chiếu song song tờ khai/tài liệu đính kèm và bản xem trước phiếu A4
                chuẩn thể thức ở cột phải, đồng thời thực hiện phê duyệt, yêu cầu bổ sung hoặc gia
                hạn Mẫu 04 ngay trên thanh tác nghiệp.
              </p>
            </li>
            <li>
              <b>In biểu mẫu pháp lý chuẩn (Mẫu 01–06) tích hợp mã QR</b>
              <p>
                Cán bộ in trực tiếp các biểu mẫu hành chính chuẩn khổ A4 kèm mã QR định danh tra cứu
                không bị chặn cửa sổ bật lên, hoặc cấp lại khóa tra cứu bảo mật cho chủ hồ sơ.
              </p>
            </li>
          </ol>
        </>
      )}
    </div>
  )
}

function WorkloadList({
  cases,
  onOpenQueue,
}: {
  cases: CaseFile[]
  onOpenQueue: (focus?: QueueFocus) => void
}) {
  const workload = new Map<string, { name: string; count: number }>()
  cases.forEach(item => {
    const id =
      item.assignment?.assigneeId ||
      (item.assignment?.assignee || item.assignment?.assigneeName
        ? item.assignment?.assignee || item.assignment?.assigneeName || 'assigned'
        : 'unassigned')
    const name =
      item.assignment?.assignee ||
      item.assignment?.assigneeName ||
      (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')
    workload.set(id, { name, count: (workload.get(id)?.count || 0) + 1 })
  })
  const rows = [...workload.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6)
  const max = Math.max(1, ...rows.map(([, item]) => item.count))

  if (!rows.length) {
    return <div className="empty-state compact-empty">Chưa có hồ sơ đang mở.</div>
  }

  return (
    <div className="workload-list">
      {rows.map(([id, item]) => (
        <button
          type="button"
          className="workload-row workload-row-button"
          key={id}
          aria-label={`Mở ${item.count} hồ sơ của ${item.name}`}
          onClick={() =>
            onOpenQueue({
              assigneeFilter: id === 'unassigned' ? 'unassigned' : id,
              label: `Người phụ trách: ${item.name}`,
            })
          }
        >
          <span>{item.name}</span>
          <i>
            <b style={{ width: `${(item.count / max) * 100}%` }} />
          </i>
          <strong className="tabular-nums">{item.count}</strong>
        </button>
      ))}
    </div>
  )
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

  const actionable = actionableCases(user, data.cases)
  const openCases = data.cases.filter(item => !CLOSED_STATUSES.has(item.status))
  const overdue = openCases.filter(item => (daysUntil(item.deadline) ?? 999) < 0)
  const dueSoon = openCases.filter(item => {
    const days = daysUntil(item.deadline)
    return days !== null && days >= 0 && days <= 3
  })
  const unassigned = data.cases.filter(
    item => item.status === 'DA_TIEP_NHAN' && !item.assignment?.assigneeId,
  )
  const recent = caseEvents(data.cases).slice(0, 6)
  const attention = [
    ...new Map(
      [...overdue, ...dueSoon, ...unassigned, ...actionable].map(item => [item.code, item]),
    ).values(),
  ]
    .sort((a, b) => (daysUntil(a.deadline) ?? 999) - (daysUntil(b.deadline) ?? 999))
    .slice(0, 8)

  const since = period === 'all' ? 0 : loadedAt - Number(period) * 86400000
  const updatedSince = period === 'all' ? '' : hanoiDate(new Date(since).toISOString())
  const periodCases = data.cases.filter(
    item => Date.parse(item.updatedAt || item.createdAt) >= since,
  )
  const periodOpen = periodCases.filter(item => !CLOSED_STATUSES.has(item.status))
  const periodCompleted = periodCases.filter(item =>
    ['HOAN_THANH', 'DA_PHAT_HANH'].includes(item.status),
  ).length
  const periodOverdue = periodOpen.filter(item => (daysUntil(item.deadline) ?? 999) < 0)

  const statusRows = Object.entries(data.statusLabels)
    .map(([status, label]) => ({
      status,
      label,
      count: periodCases.filter(item => item.status === status).length,
    }))
    .filter(row => row.count > 0)
    .sort((a, b) => b.count - a.count)
  const highestStatus = Math.max(1, ...statusRows.map(row => row.count))

  const byAgency = new Map<string, number>()
  const byAssignee = new Map<string, { name: string; count: number }>()
  periodOpen.forEach(item => {
    const agency = item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan'
    const assigneeId =
      item.assignment?.assigneeId ||
      item.assignment?.assignee ||
      item.assignment?.assigneeName ||
      'unassigned'
    const assigneeName =
      item.assignment?.assignee ||
      item.assignment?.assigneeName ||
      (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')
    byAgency.set(agency, (byAgency.get(agency) || 0) + 1)
    byAssignee.set(assigneeId, {
      name: assigneeName,
      count: (byAssignee.get(assigneeId)?.count || 0) + 1,
    })
  })

  const feedback = useMemo(() => data.feedback || [], [data.feedback])
  const averageScore = feedback.length
    ? feedback.reduce((sum, row) => sum + Number(row.score), 0) / feedback.length
    : null
  const activeOutbox = (data.outbox || []).filter(row => ['ERROR', 'PENDING'].includes(row.status))
  const oldest = [...periodOpen]
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, 6)

  const index766Summary = useMemo(
    () => computeIndex766(data.cases, data.procedures, feedback, data.stats?.index766),
    [data.cases, data.procedures, data.stats?.index766, feedback],
  )
  const periodBalance = useMemo(
    () =>
      computePeriodBalance(
        data.cases,
        updatedSince || undefined,
        undefined,
        period === 'all' ? data.stats?.periodBalance : undefined,
      ),
    [data.cases, data.stats?.periodBalance, period, updatedSince],
  )

  const viewTabs: ('work' | 'monitor')[] = ['work', 'monitor']

  return (
    <div className="staff-dashboard">
      <div className="ops-command-bar">
        <div
          className="staff-module-tabs ops-view-tabs"
          role="tablist"
          aria-label="Chế độ bàn điều hành"
          onKeyDown={event => handleTabArrows(event, viewTabs, viewMode, setViewMode)}
        >
          <button
            type="button"
            id="ops-tab-work"
            role="tab"
            tabIndex={viewMode === 'work' ? 0 : -1}
            aria-selected={viewMode === 'work'}
            aria-controls="ops-panel-work"
            className={`staff-module-tab${viewMode === 'work' ? ' active' : ''}`}
            onClick={() => setViewMode('work')}
          >
            <span>Tác nghiệp trong ngày</span>
            <b className="tabular-nums">{actionable.length}</b>
          </button>
          <button
            type="button"
            id="ops-tab-monitor"
            role="tab"
            tabIndex={viewMode === 'monitor' ? 0 : -1}
            aria-selected={viewMode === 'monitor'}
            aria-controls="ops-panel-monitor"
            className={`staff-module-tab${viewMode === 'monitor' ? ' active' : ''}`}
            onClick={() => setViewMode('monitor')}
          >
            <span>Phân tích, Cân đối kỳ &amp; Chỉ số 766</span>
          </button>
        </div>

        <div className="ops-command-actions">
          {viewMode === 'monitor' && (
            <select
              className="ops-period-select"
              aria-label="Kỳ dữ liệu giám sát"
              value={period}
              onChange={event => setPeriod(event.target.value)}
            >
              <option value="7">7 ngày gần nhất</option>
              <option value="30">30 ngày gần nhất</option>
              <option value="90">90 ngày gần nhất</option>
              <option value="all">Toàn bộ thời gian</option>
            </select>
          )}
          <ReportExportButtons
            getReport={
              viewMode === 'work'
                ? readCasesReport
                : () => ({
                    title: 'Hồ sơ theo kỳ giám sát',
                    subtitle: `${period === 'all' ? 'Toàn bộ thời gian' : `${period} ngày gần nhất`} · Hồ sơ cập nhật trong kỳ · Phạm vi được cấp`,
                    filename: 'ho-so-theo-ky-giam-sat',
                    headers: [
                      'Mã hồ sơ',
                      'Mã thủ tục',
                      'Tên thủ tục',
                      'Cơ quan tiếp nhận',
                      ...(user.role === 'finance' ? [] : ['Người nộp']),
                      'Trạng thái',
                      'Ngày gửi',
                      'Hạn giải quyết',
                    ],
                    rows: periodCases.map(item => [
                      item.code,
                      item.procedureCode,
                      item.procedure?.name || '',
                      item.agencyScope || item.receivingAgency || '',
                      ...(user.role === 'finance' ? [] : [item.applicant?.name || '']),
                      data.statusLabels[item.status] || item.status,
                      toDate(item.createdAt),
                      toDate(item.deadline),
                    ]),
                  })
            }
            compact
          />
          <button
            type="button"
            className="button primary compact-btn"
            onClick={() => onNavigate('inbox')}
          >
            Mở hộp xử lý ({actionable.length}) →
          </button>
        </div>
      </div>

      {viewMode === 'work' ? (
        <div
          id="ops-panel-work"
          role="tabpanel"
          aria-labelledby="ops-tab-work"
          className="staff-dashboard"
        >
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
              onClick={
                dueSoon.length
                  ? () =>
                      onOpenQueue({ deadlineFilter: 'soon', label: 'Hồ sơ đến hạn trong 3 ngày' })
                  : undefined
              }
            />
            <MetricCard
              label="Đã quá hạn giải quyết"
              value={overdue.length}
              note="Hồ sơ mở quá mốc hẹn trả"
              tone="red"
              onClick={
                overdue.length
                  ? () => onOpenQueue({ deadlineFilter: 'overdue', label: 'Hồ sơ quá hạn' })
                  : undefined
              }
            />
          </section>

          <section className="panel stage-pipeline-panel">
            <div className="stage-pipeline-head">
              <h2>Luồng xử lý hồ sơ theo công đoạn</h2>
              <button type="button" className="text-button" onClick={() => onNavigate('inbox')}>
                Xem toàn bộ hộp xử lý →
              </button>
            </div>
            <div className="stage-pipeline-grid">
              {OPERATION_STAGES.map(stage => {
                const count = data.cases.filter(item => stage.statuses.includes(item.status)).length
                const maxStage = Math.max(
                  1,
                  ...OPERATION_STAGES.map(
                    s => data.cases.filter(item => s.statuses.includes(item.status)).length,
                  ),
                )
                const width = data.cases.length
                  ? Math.max(count ? 8 : 0, (count / maxStage) * 100)
                  : 0
                return (
                  <button
                    type="button"
                    className="stage-pipeline-step"
                    key={stage.label}
                    onClick={() =>
                      onOpenQueue({ statuses: stage.statuses, label: `Công đoạn: ${stage.label}` })
                    }
                  >
                    <div className="stage-pipeline-top">
                      <span className="stage-label">{stage.label}</span>
                      <b className="tabular-nums">{count}</b>
                    </div>
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
                  <button type="button" className="text-button" onClick={() => onNavigate('inbox')}>
                    Mở danh sách →
                  </button>
                }
              />
              {attention.length ? (
                <div className="attention-list">
                  {attention.map(item => {
                    const due = daysUntil(item.deadline)
                    return (
                      <button
                        type="button"
                        className="attention-row"
                        key={item.code}
                        onClick={() => onOpen(item)}
                      >
                        <span
                          className="attention-mark"
                          data-tone={
                            (due ?? 999) < 0
                              ? 'red'
                              : item.status === 'DA_TIEP_NHAN' && !item.assignment?.assigneeId
                                ? 'amber'
                                : 'blue'
                          }
                        />
                        <span className="attention-main">
                          <b>{item.procedure?.name || item.procedureCode}</b>
                          <small>
                            <span className="case-code-inline tabular-nums">{item.code}</span> ·{' '}
                            {item.applicant?.name || 'Chưa có thông tin người nộp'} ·{' '}
                            {item.agencyScope || item.receivingAgency || ''}
                          </small>
                        </span>
                        <span className="attention-side">
                          <StatusTag
                            status={item.status}
                            label={data.statusLabels[item.status] || item.status}
                          />
                          <SLABadge item={item} />
                        </span>
                      </button>
                    )
                  })}
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
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => onNavigate('activity')}
                    >
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
                  <div className="empty-state compact-empty">
                    Chưa có sự kiện trong phạm vi tài khoản.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="ops-panel-monitor"
          role="tabpanel"
          aria-labelledby="ops-tab-monitor"
          className="staff-dashboard"
        >
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
                  ? () =>
                      onOpenQueue({
                        deadlineFilter: 'overdue',
                        updatedSince,
                        label: 'Hồ sơ quá hạn',
                      })
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

          <PeriodBalancePanel
            balance={periodBalance}
            subtitle={
              period === 'all'
                ? `Tổng hợp toàn bộ thời gian (${user.agencyScope || 'Phạm vi được cấp'})`
                : `Kỳ giám sát từ ngày ${reportDateDisplay(updatedSince)} đến nay`
            }
          />

          <Index766Panel
            summary={index766Summary}
            subtitle={`Đánh giá chất lượng giải quyết TTHC trong phạm vi: ${user.agencyScope || 'Toàn thành phố'}`}
          />

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
                      onClick={() =>
                        onOpenQueue({
                          statuses: [row.status],
                          updatedSince,
                          label: `Trạng thái: ${row.label}`,
                        })
                      }
                    >
                      <span>{row.label}</span>
                      <i>
                        <b style={{ width: `${(row.count / highestStatus) * 100}%` }} />
                      </i>
                      <strong className="tabular-nums">{row.count}</strong>
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
                                    item =>
                                      (item.agencyScope ||
                                        item.receivingAgency ||
                                        'Chưa xác định cơ quan') === name,
                                  )
                                  .map(item => item.status),
                              ),
                            ],
                            label: `Cơ quan: ${name}`,
                          })
                        }
                      >
                        <span>{name}</span>
                        <b className="tabular-nums">{count}</b>
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
                        <b className="tabular-nums">{item.count}</b>
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
                  <button type="button" className="text-button" onClick={() => onNavigate('inbox')}>
                    Mở hộp xử lý →
                  </button>
                }
              />
              {oldest.length ? (
                <div className="attention-list">
                  {oldest.map(item => (
                    <button
                      type="button"
                      className="attention-row"
                      key={item.code}
                      onClick={() => onOpen(item)}
                    >
                      <span
                        className="attention-mark"
                        data-tone={(daysUntil(item.deadline) ?? 999) < 0 ? 'red' : 'blue'}
                      />
                      <span className="attention-main">
                        <b>{item.procedure?.name || item.procedureCode}</b>
                        <small>
                          {item.code} · Tiếp nhận {toDate(item.createdAt)}
                        </small>
                      </span>
                      <span className="attention-side">
                        <StatusTag
                          status={item.status}
                          label={data.statusLabels[item.status] || item.status}
                        />
                        <SLABadge item={item} />
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
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => onNavigate('connections')}
                  >
                    Chi tiết tích hợp →
                  </button>
                }
              />
              {feedback.length ? (
                <>
                  <div className="feedback-score">
                    <b className="tabular-nums">{averageScore?.toFixed(1)}</b>
                    <span>/ 5.0</span>
                    <small>{feedback.length} lượt đánh giá</small>
                  </div>
                  <div className="feedback-list">
                    {feedback.slice(0, 3).map((row, index) => (
                      <article key={`${row.code}-${index}`}>
                        <b aria-label={`${row.score} trên 5 sao`}>
                          {Array.from({ length: 5 }, (_, sIdx) => (
                            <Star
                              key={sIdx}
                              size={13}
                              strokeWidth={1.75}
                              fill={sIdx < row.score ? 'currentColor' : 'none'}
                              aria-hidden="true"
                            />
                          ))}
                        </b>
                        <span>{row.code}</span>
                        <p>{row.content || 'Không có nội dung nhận xét.'}</p>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state compact-empty">
                  Chưa có đánh giá sau kết quả trong phạm vi dữ liệu.
                </div>
              )}

              {activeOutbox.length > 0 && (
                <div className="outbox-list">
                  {activeOutbox.slice(0, 3).map(row => (
                    <div className="outbox-row" key={row.code}>
                      <b>{row.code}</b>
                      <span
                        className={`request-status ${row.status === 'ERROR' ? 'request-rejected' : 'request-pending'}`}
                      >
                        {row.status === 'ERROR' ? 'Có lỗi' : 'Đang chờ'}
                      </span>
                      <span>{row.attempts} lần thử</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function OperationsMonitor({
  user,
  data,
  onOpen,
  onOpenQueue,
  onNavigate,
}: {
  user: User
  data: Bootstrap
  onOpen: (item: CaseFile) => void
  onOpenQueue: (focus?: QueueFocus) => void
  onNavigate: (page: string) => void
}) {
  return (
    <StaffHome
      user={user}
      data={data}
      initialView="monitor"
      onOpen={onOpen}
      onOpenQueue={onOpenQueue}
      onNavigate={onNavigate}
    />
  )
}

function QueueItem({
  item,
  label,
  selected,
  onToggleSelect,
  onOpen,
}: {
  item: CaseFile
  label: string
  selected: boolean
  onToggleSelect: (code: string) => void
  onOpen: (item: CaseFile) => void
}) {
  const assignee =
    item.assignment?.assignee ||
    item.assignment?.assigneeName ||
    (item.assignment?.assigneeId ? 'Đã phân công' : 'Chưa phân công')

  return (
    <tr
      className={`queue-table-row${selected ? ' is-selected' : ''}`}
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={event => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onOpen(item)
        }
      }}
    >
      <td
        className="col-check"
        data-label="Chọn"
        onClick={event => event.stopPropagation()}
        onKeyDown={event => event.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.code)}
          aria-label={`Chọn hồ sơ ${item.code}`}
        />
      </td>
      <td data-label="Mã hồ sơ & Kênh nộp">
        <div className="account-cell-user">
          <b className="case-code tabular-nums">{item.code}</b>
          <span className="account-cell-email">
            {item.submissionChannel === 'TRUC_TIEP' ? 'Trực tiếp tại quầy' : 'Trực tuyến'} ·{' '}
            {toDate(item.createdAt)}
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
          <span>
            {item.agencyScope || item.receivingAgency || item.procedure?.agency || 'Chưa xác định'}
          </span>
          <small className="account-cell-email">Phụ trách: {assignee}</small>
        </div>
      </td>
      <td data-label="Trạng thái & Hạn">
        <div className="queue-cell-status">
          <StatusTag status={item.status} label={label} />
          <SLABadge item={item} />
        </div>
      </td>
      <td className="col-actions" data-label="Thao tác" onClick={event => event.stopPropagation()}>
        <button
          type="button"
          className="button secondary compact-btn"
          onClick={() => onOpen(item)}
          aria-label={`Mở hồ sơ ${item.code}`}
        >
          Xử lý →
        </button>
      </td>
    </tr>
  )
}

function CaseQueue({
  user,
  data,
  initialFocus,
  onOpen,
  onRefresh,
  onNotice,
}: {
  user: User
  data: Bootstrap
  initialFocus: QueueFocus | null
  onOpen: (item: CaseFile) => void
  onRefresh: () => Promise<Bootstrap>
  onNotice: (text: string) => void
}) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
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
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(() => new Set())
  const [bulkAssignee, setBulkAssignee] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkError, setBulkError] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const inEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (!inEditable && event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const agencyOptions = useMemo(
    () =>
      [
        ...new Set(
          data.cases.map(
            item => item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan',
          ),
        ),
      ].sort((a, b) => a.localeCompare(b, 'vi')),
    [data.cases],
  )

  const assigneeOptions = useMemo(
    () =>
      [
        ...new Map(
          data.cases
            .filter(
              item =>
                item.assignment?.assigneeId ||
                item.assignment?.assigneeName ||
                item.assignment?.assignee,
            )
            .map(item => {
              const id =
                item.assignment?.assigneeId ||
                item.assignment?.assigneeName ||
                item.assignment?.assignee ||
                ''
              return [
                id,
                {
                  id,
                  name:
                    item.assignment?.assigneeName ||
                    item.assignment?.assignee ||
                    'Đã phân công',
                },
              ] as const
            }),
        ).values(),
      ].filter(item => item.id),
    [data.cases],
  )

  const selectedBucket = QUEUE_FILTERS.find(item => item.key === bucket) || QUEUE_FILTERS[0]

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi')
    return [...data.cases]
      .filter(item => {
        if (selectedBucket.statuses.length && !selectedBucket.statuses.includes(item.status)) {
          return false
        }
        if (focusedStatuses.length && !focusedStatuses.includes(item.status)) return false
        if (
          agencyFilter !== 'all' &&
          (item.agencyScope || item.receivingAgency || 'Chưa xác định cơ quan') !== agencyFilter
        ) {
          return false
        }
        if (procedureFilter && item.procedureCode !== procedureFilter) return false
        if (updatedSince && hanoiDate(item.updatedAt || item.createdAt) < updatedSince) return false
        if (createdFrom && hanoiDate(item.createdAt) < createdFrom) return false
        if (createdTo && hanoiDate(item.createdAt) > createdTo) return false

        const haystack = [
          item.code,
          item.procedureCode,
          item.procedure?.name,
          item.procedure?.agency,
          item.applicant?.name,
          item.assignment?.assignee,
          item.assignment?.assigneeName,
        ]
          .join(' ')
          .toLocaleLowerCase('vi')
        if (term && !haystack.includes(term)) return false

        const days = daysUntil(item.deadline)
        if (
          deadlineFilter === 'overdue' &&
          (CLOSED_STATUSES.has(item.status) || days === null || days >= 0)
        ) {
          return false
        }
        if (
          deadlineFilter === 'soon' &&
          (CLOSED_STATUSES.has(item.status) || days === null || days < 0 || days > 3)
        ) {
          return false
        }
        if (deadlineFilter === 'unknown' && Boolean(item.deadline)) return false

        const assigned = Boolean(
          item.assignment?.assigneeId ||
            item.assignment?.assignee ||
            item.assignment?.assigneeName,
        )
        if (assigneeFilter === 'assigned' && !assigned) return false
        if (assigneeFilter === 'unassigned' && assigned) return false
        if (
          !['all', 'assigned', 'unassigned'].includes(assigneeFilter) &&
          item.assignment?.assigneeId !== assigneeFilter &&
          item.assignment?.assignee !== assigneeFilter &&
          item.assignment?.assigneeName !== assigneeFilter
        ) {
          return false
        }
        return true
      })
      .sort((a, b) =>
        sort === 'updated'
          ? Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt)
          : sort === 'created'
            ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
            : (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999),
      )
  }, [
    agencyFilter,
    assigneeFilter,
    createdFrom,
    createdTo,
    data.cases,
    deadlineFilter,
    focusedStatuses,
    procedureFilter,
    query,
    selectedBucket.statuses,
    sort,
    updatedSince,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, pageSize, safePage],
  )

  const selectedCases = useMemo(
    () => data.cases.filter(item => selectedCodes.has(item.code)),
    [data.cases, selectedCodes],
  )
  const bulkIntakeTargets = useMemo(
    () =>
      selectedCases.filter(item =>
        getActions(user, item).some(act => act.value === 'accept'),
      ),
    [selectedCases, user],
  )
  const bulkAssignTargets = useMemo(
    () => selectedCases.filter(item => getActions(user, item).some(act => act.value === 'assign')),
    [selectedCases, user],
  )
  const allPageSelected =
    pageItems.length > 0 && pageItems.every(item => selectedCodes.has(item.code))

  const toggleRow = (code: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleAllCurrentPage = () => {
    setSelectedCodes(prev => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageItems.forEach(item => next.delete(item.code))
      } else {
        pageItems.forEach(item => next.add(item.code))
      }
      return next
    })
  }

  async function runBulkIntake() {
    if (!bulkIntakeTargets.length) return
    setBulkBusy(true)
    setBulkError('')
    try {
      let okCount = 0
      for (const target of bulkIntakeTargets) {
        await api(`/api/cases/${encodeURIComponent(target.code)}/actions`, {
          action: 'accept',
          payload: {},
          expectedVersion: target.version,
        })
        okCount += 1
      }
      setSelectedCodes(new Set())
      await onRefresh()
      onNotice(`Đã tiếp nhận hàng loạt ${okCount} hồ sơ đủ điều kiện.`)
    } catch (cause) {
      setBulkError(cause instanceof Error ? cause.message : 'Không thể tiếp nhận hàng loạt.')
    } finally {
      setBulkBusy(false)
    }
  }

  async function runBulkAssign() {
    if (!bulkAssignTargets.length || !bulkAssignee) return
    setBulkBusy(true)
    setBulkError('')
    try {
      let okCount = 0
      for (const target of bulkAssignTargets) {
        await api(`/api/cases/${encodeURIComponent(target.code)}/actions`, {
          action: 'assign',
          payload: { assignee: bulkAssignee, unit: user.agencyScope || '' },
          expectedVersion: target.version,
        })
        okCount += 1
      }
      setSelectedCodes(new Set())
      await onRefresh()
      onNotice(`Đã phân công hàng loạt ${okCount} hồ sơ.`)
    } catch (cause) {
      setBulkError(cause instanceof Error ? cause.message : 'Không thể phân công hàng loạt.')
    } finally {
      setBulkBusy(false)
    }
  }

  const exportVisibleCases = () => ({
    title: 'Bảng kê hồ sơ đang xem',
    subtitle: [
      agencyFilter === 'all' ? user.agencyScope || 'Phạm vi được cấp' : agencyFilter,
      selectedBucket.label,
      focusLabel,
      query.trim() ? `Tìm: ${query.trim()}` : '',
      procedureFilter ? `Mã thủ tục: ${procedureFilter}` : '',
      createdFrom || createdTo
        ? `Ngày gửi: ${createdFrom || 'không giới hạn'} – ${createdTo || 'không giới hạn'}`
        : '',
      updatedSince ? `Cập nhật từ: ${updatedSince}` : '',
      `${filtered.length} hồ sơ`,
    ]
      .filter(Boolean)
      .join(' · '),
    filename: 'danh-sach-ho-so-trong-pham-vi',
    headers: [
      'Mã hồ sơ',
      'Mã thủ tục',
      'Tên thủ tục',
      'Cơ quan tiếp nhận',
      ...(user.role === 'finance' ? [] : ['Người nộp']),
      'Trạng thái',
      'Ngày gửi',
      'Hạn giải quyết',
    ],
    rows: filtered.map(item => [
      item.code,
      item.procedureCode,
      item.procedure?.name || '',
      item.agencyScope || item.receivingAgency || '',
      ...(user.role === 'finance' ? [] : [item.applicant?.name || '']),
      data.statusLabels[item.status] || item.status,
      toDate(item.createdAt),
      toDate(item.deadline),
    ]),
  })

  const counts = (filter: (typeof QUEUE_FILTERS)[number]) =>
    data.cases.filter(item => !filter.statuses.length || filter.statuses.includes(item.status))
      .length

  const bucketKeys = QUEUE_FILTERS.map(item => item.key)

  return (
    <div className="queue-workspace">
      <div
        className="staff-module-tabs"
        role="tablist"
        aria-label="Lọc nhóm trạng thái hồ sơ"
        onKeyDown={event =>
          handleTabArrows(event, bucketKeys, bucket, nextKey => {
            setBucket(nextKey)
            setFocusedStatuses([])
            setFocusLabel('')
            setCurrentPage(1)
          })
        }
      >
        {QUEUE_FILTERS.map(filter => (
          <button
            key={filter.key}
            id={`queue-tab-${filter.key}`}
            type="button"
            role="tab"
            tabIndex={bucket === filter.key ? 0 : -1}
            aria-selected={bucket === filter.key}
            aria-controls="queue-panel-results"
            className={`staff-module-tab${bucket === filter.key ? ' active' : ''}`}
            onClick={() => {
              setBucket(filter.key)
              setFocusedStatuses([])
              setFocusLabel('')
              setCurrentPage(1)
            }}
          >
            <span>{filter.label}</span>
            <b className="tabular-nums">{counts(filter)}</b>
          </button>
        ))}
        <div className="staff-module-tabs-end">
          <ReportExportButtons getReport={exportVisibleCases} compact />
        </div>
      </div>

      {focusLabel && (
        <div className="queue-focus-bar">
          <span>
            Đang lọc theo: <b>{focusLabel}</b>
            {(createdFrom || createdTo) && (
              <small>
                {' '}
                · Ngày gửi {createdFrom || 'bất kỳ'} — {createdTo || 'hiện tại'}
              </small>
            )}
            {updatedSince && <small> · Cập nhật từ {reportDateDisplay(updatedSince)}</small>}
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setBucket('ALL')
              setFocusedStatuses([])
              setFocusLabel('')
              setAgencyFilter('all')
              setDeadlineFilter('all')
              setAssigneeFilter('all')
              setProcedureFilter('')
              setUpdatedSince('')
              setCreatedFrom('')
              setCreatedTo('')
              setQuery('')
              setCurrentPage(1)
            }}
          >
            Xóa điều kiện lọc ×
          </button>
        </div>
      )}

      <section
        id="queue-panel-results"
        role="tabpanel"
        aria-labelledby={`queue-tab-${bucket}`}
        className="panel queue-panel"
      >
        <div className="queue-filter-grid">
          <label className="queue-search" htmlFor="queue-search-input">
            <span className="queue-search__head">
              <span>Tìm kiếm nhanh</span>
              <span className="queue-kbd-hint">
                Phím <kbd>/</kbd>
              </span>
            </span>
            <input
              ref={searchInputRef}
              id="queue-search-input"
              className="search-input"
              type="search"
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="Mã hồ sơ, mã/tên thủ tục, họ tên chủ hồ sơ"
            />
          </label>
          {agencyOptions.length > 1 && (
            <label htmlFor="queue-agency-select">
              <span>Cơ quan tiếp nhận</span>
              <select
                id="queue-agency-select"
                value={agencyFilter}
                onChange={event => {
                  setAgencyFilter(event.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="all">Tất cả cơ quan ({agencyOptions.length})</option>
                {agencyOptions.map(agency => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </label>
          )}
          {procedureFilter && (
            <label htmlFor="queue-procedure-input">
              <span>Mã thủ tục</span>
              <input id="queue-procedure-input" value={procedureFilter} readOnly />
            </label>
          )}
          <label htmlFor="queue-deadline-select">
            <span>Tình trạng hạn</span>
            <select
              id="queue-deadline-select"
              value={deadlineFilter}
              onChange={event => {
                setDeadlineFilter(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">Mọi thời hạn</option>
              <option value="overdue">Đã quá hạn</option>
              <option value="soon">Đến hạn ≤ 3 ngày</option>
              <option value="unknown">Chưa xác định hạn</option>
            </select>
          </label>
          <label htmlFor="queue-assignee-select">
            <span>Người phụ trách</span>
            <select
              id="queue-assignee-select"
              value={assigneeFilter}
              onChange={event => {
                setAssigneeFilter(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">Tất cả</option>
              <option value="assigned">Đã phân công</option>
              <option value="unassigned">Chưa phân công</option>
              {assigneeOptions.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="queue-sort-select">
            <span>Sắp xếp</span>
            <select
              id="queue-sort-select"
              value={sort}
              onChange={event => {
                setSort(event.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="deadline">Hạn giải quyết gần nhất</option>
              <option value="updated">Mới cập nhật</option>
              <option value="created">Mới tiếp nhận</option>
            </select>
          </label>
        </div>

        {bulkError && (
          <div className="form-error queue-bulk-error" role="alert">
            <span>{bulkError}</span>
            <button type="button" className="text-button" onClick={() => setBulkError('')}>
              Đóng
            </button>
          </div>
        )}

        {pageItems.length > 0 ? (
          <div className="table-scroll data-table-wrap">
            <table className="data-table queue-data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleAllCurrentPage}
                      aria-label="Chọn tất cả hồ sơ trên trang hiện tại"
                    />
                  </th>
                  <th>Mã hồ sơ &amp; Kênh nộp</th>
                  <th>Thủ tục hành chính &amp; Chủ hồ sơ</th>
                  <th>Cơ quan &amp; Người phụ trách</th>
                  <th>Trạng thái &amp; Hạn giải quyết</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(item => (
                  <QueueItem
                    key={item.code}
                    item={item}
                    label={data.statusLabels[item.status] || item.status}
                    selected={selectedCodes.has(item.code)}
                    onToggleSelect={toggleRow}
                    onOpen={onOpen}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            Không tìm thấy hồ sơ phù hợp. Hãy thay đổi từ khóa hoặc bỏ bớt điều kiện lọc.
          </div>
        )}

        <div className="queue-footer">
          <span>
            Hiển thị{' '}
            <b className="tabular-nums">
              {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)}
            </b>{' '}
            trên <b className="tabular-nums">{filtered.length.toLocaleString('vi-VN')}</b> hồ sơ lọc
            (tổng phạm vi <b className="tabular-nums">{data.cases.length.toLocaleString('vi-VN')}</b>
            ).
          </span>

          <div className="queue-pagination-controls">
            <label htmlFor="queue-page-size" className="queue-page-size-label">
              <span>Số dòng:</span>
              <select
                id="queue-page-size"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </label>
            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  className="button secondary compact-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                <span className="tabular-nums">
                  Trang <b>{safePage}</b> / {totalPages}
                </span>
                <button
                  type="button"
                  className="button secondary compact-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Sau →
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {selectedCodes.size > 0 && (
        <div className="hcds-bulk-bar" role="region" aria-label="Thao tác hồ sơ hàng loạt">
          <CheckSquare size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className="tabular-nums">
            Đã chọn <b>{selectedCodes.size}</b> hồ sơ
          </span>
          {bulkIntakeTargets.length > 0 && (
            <button
              type="button"
              className="button primary compact-btn"
              disabled={bulkBusy}
              onClick={() => void runBulkIntake()}
            >
              Tiếp nhận ({bulkIntakeTargets.length})
            </button>
          )}
          {bulkAssignTargets.length > 0 && (data.staff || []).length > 0 && (
            <div className="bulk-assign-group">
              <select
                aria-label="Chọn chuyên viên phân công hàng loạt"
                className="bulk-assign-select"
                value={bulkAssignee}
                onChange={e => setBulkAssignee(e.target.value)}
              >
                <option value="">— Chọn chuyên viên —</option>
                {(data.staff || []).map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({roleNames[member.role] || member.role})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button secondary compact-btn"
                disabled={bulkBusy || !bulkAssignee}
                onClick={() => void runBulkAssign()}
              >
                Phân công ({bulkAssignTargets.length})
              </button>
            </div>
          )}
          <button
            type="button"
            className="text-button bulk-clear-btn"
            disabled={bulkBusy}
            onClick={() => setSelectedCodes(new Set())}
          >
            Bỏ chọn
          </button>
        </div>
      )}
    </div>
  )
}

function StaffNavIcon({ name }: { name: string }) {
  switch (name) {
    case 'dashboard':
      return <LayoutDashboard size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'inbox':
      return <Inbox size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'desk':
      return <CalendarCheck2 size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'catalog':
      return <BookOpenCheck size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'activity':
      return <Activity size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'connections':
      return <CreditCard size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'users':
      return <Users size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'reports':
      return <BarChart3 size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'news':
      return <Newspaper size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'guide':
      return <HelpCircle size={16} strokeWidth={1.75} aria-hidden="true" />
    case 'signout':
      return <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
    default:
      return null
  }
}

export function App() {
  const [citizen, setCitizen] = useState<User | null>(null)
  const [citizenReady, setCitizenReady] = useState(false)
  const [citizenError, setCitizenError] = useState('')

  const [user, setUser] = useState<User | null>(null)
  const [staffSessionExpired, setStaffSessionExpired] = useState(false)
  const [data, setData] = useState<Bootstrap>({
    procedures: [],
    procedureCategories: [],
    cases: [],
    stats: {},
    statusLabels: {},
    staff: [],
  })
  const [route, setRoute] = useState<PortalRoute>(routeFromPath)
  const [citizenProcedureCode, setCitizenProcedureCode] = useState(
    () => new URLSearchParams(window.location.search).get('procedure') || '',
  )
  const [citizenReceipt, setCitizenReceipt] = useState<SubmissionReceipt | null>(readStoredReceipt)

  const [page, setPage] = useState(
    () => new URLSearchParams(window.location.search).get('page') || 'home',
  )
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
  const [extendDays, setExtendDays] = useState(5)

  const captureMode = new URLSearchParams(window.location.search).get('capture') === '1'

  useEffect(() => {
    let active = true
    api<{ user: User | null; csrfToken: string | null }>('/api/citizen/auth/me')
      .then(result => {
        if (active) {
          setCitizen(result.user)
          setCitizenSessionToken(result.csrfToken || '')
        }
      })
      .catch(() => {
        if (active) {
          setCitizenError('Chưa kiểm tra được phiên công dân. Hãy đăng nhập lại để tiếp tục.')
        }
      })
      .finally(() => {
        if (active) setCitizenReady(true)
      })

    const onCitizenExpired = () => {
      setCitizen(null)
      setCitizenSessionToken('')
      setCitizenError('Phiên công dân đã hết hạn. Vui lòng đăng nhập lại.')
    }
    const onStaffExpired = () => {
      setStaffSessionExpired(true)
    }

    window.addEventListener('citizen-session-expired', onCitizenExpired)
    window.addEventListener('staff-session-expired', onStaffExpired)
    return () => {
      active = false
      window.removeEventListener('citizen-session-expired', onCitizenExpired)
      window.removeEventListener('staff-session-expired', onStaffExpired)
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    if (route === 'staff') {
      document.documentElement.setAttribute('data-surface', 'staff')
    } else {
      document.documentElement.setAttribute('data-surface', 'citizen')
    }
  }, [route])

  useEffect(() => {
    if (captureMode) document.documentElement.classList.add('capture-mode')
    else document.documentElement.classList.remove('capture-mode')
    return () => document.documentElement.classList.remove('capture-mode')
  }, [captureMode])

  const updateReceipt = useCallback((value: SubmissionReceipt | null) => {
    persistReceipt(value)
    setCitizenReceipt(value)
    if (value && window.location.pathname.startsWith('/nop-ho-so')) {
      const nextUrl = `/nop-ho-so?v=receipt&code=${encodeURIComponent(value.code)}`
      if (window.location.pathname + window.location.search !== nextUrl) {
        window.history.replaceState(
          { ...(window.history.state || {}), route: 'submit', receiptCode: value.code },
          '',
          nextUrl,
        )
      }
    }
  }, [])

  const refresh = useCallback(async (): Promise<Bootstrap> => {
    const result = await api<Bootstrap>('/api/bootstrap')
    setData(result)
    if (result.user) setUser(result.user)
    setSelected(current =>
      current ? result.cases.find(c => c.code === current.code) || current : null,
    )
    return result
  }, [])

  function navigateRoute(
    next: PortalRoute,
    procedureCode = '',
    applicantType?: 'citizen' | 'organization',
  ) {
    if (next === 'submit' && !procedureCode) {
      persistReceipt(null)
      setCitizenReceipt(null)
    }
    const path =
      next === 'citizen-profile'
        ? '/tai-khoan'
        : next === 'citizen-login'
          ? '/dang-nhap'
          : next === 'staff'
            ? '/staff'
            : next === 'guide'
              ? '/huong-dan'
              : next === 'citizen-services'
                ? '/tien-ich'
                : next === 'submit'
                  ? '/nop-ho-so'
                  : next === 'track'
                    ? '/tra-cuu-ho-so'
                    : '/'

    const targetPath =
      next === 'catalog'
        ? `/thu-tuc${procedureCode ? `/${encodeURIComponent(procedureCode)}` : ''}`
        : path
    const queryParams = new URLSearchParams()
    if (procedureCode && next !== 'catalog') queryParams.set('procedure', procedureCode)
    if (applicantType) sessionStorage.setItem('hanoiApplicantType', applicantType)
    const activeApplicantType = applicantType || sessionStorage.getItem('hanoiApplicantType') || ''
    if (next === 'submit' && activeApplicantType) {
      queryParams.set('applicant', activeApplicantType)
    }
    if (next === 'staff') {
      const defaultPage = user?.role === 'admin' ? 'overview' : 'inbox'
      queryParams.set('page', defaultPage)
    }
    const query = queryParams.size ? `?${queryParams.toString()}` : ''
    if (window.location.pathname + window.location.search !== targetPath + query) {
      window.history.pushState(
        {
          route: next,
          page: next === 'staff' ? (user?.role === 'admin' ? 'overview' : 'inbox') : undefined,
          pageHistory,
        },
        '',
        targetPath + query,
      )
    }
    setCitizenProcedureCode(next === 'submit' ? procedureCode : '')
    setRoute(next)
    window.scrollTo(0, 0)
  }

  const navigateByPath = useCallback(
    (rawPath: string) => {
      if (rawPath === '/staff') {
        navigateRoute('staff')
        return
      }
      const url = new URL(rawPath, window.location.origin)
      if (url.pathname === '/nop-ho-so' && url.searchParams.get('v') !== 'receipt') {
        persistReceipt(null)
        setCitizenReceipt(null)
      }
      const target = `${url.pathname}${url.search}${url.hash}`
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== target) {
        window.history.pushState({ route: routeFromPath() }, '', target)
      }
      const nextRoute = routeFromPath()
      setCitizenProcedureCode(url.searchParams.get('procedure') || '')
      setRoute(nextRoute)
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo(0, 0)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, pageHistory],
  )

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = routeFromPath()
      setRoute(nextRoute)
      const searchParams = new URLSearchParams(window.location.search)
      setCitizenProcedureCode(searchParams.get('procedure') || '')
      setCitizenReceipt(readStoredReceipt())

      if (nextRoute === 'staff') {
        const urlPage = searchParams.get('page') || window.history.state?.page
        const urlCase = searchParams.get('case') || ''
        const restoredHistory = window.history.state?.pageHistory
        if (urlCase) {
          const found = data.cases.find(c => c.code === urlCase)
          setAction('')
          setActionText('')
          setAssignee('')
          setExtendDays(5)
          if (found) {
            setSelected(found)
            setPage('detail')
          } else if (user) {
            void api<CaseFile>(`/api/cases/${encodeURIComponent(urlCase)}`)
              .then(loaded => {
                setSelected(loaded)
                setPage('detail')
              })
              .catch(() => {
                setSelected(null)
                setPage('inbox')
              })
          }
        } else if (typeof urlPage === 'string' && urlPage) {
          setPage(urlPage)
          setSelected(null)
          setMobileNavOpen(false)
          setPageHistory(Array.isArray(restoredHistory) ? restoredHistory : [urlPage])
        }
      }
    }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [data.cases, user])

  useEffect(() => {
    api<{ user: User | null; csrfToken: string | null }>('/api/auth/me')
      .then(async result => {
        if (!result.user) return
        setStaffSessionToken(result.csrfToken || '', true)
        setUser(result.user)

        const firstPage = result.user.role === 'admin' ? 'overview' : 'inbox'
        const params = new URLSearchParams(window.location.search)
        const urlPage = params.get('page') || ''
        const urlCase = (params.get('case') || '').trim().toUpperCase()
        const savedPage = window.history.state?.page
        const isStaffRoute = routeFromPath() === 'staff'

        let startPage = firstPage
        if (isStaffRoute) {
          if (urlCase) startPage = 'detail'
          else if (urlPage) startPage = urlPage
          else if (typeof savedPage === 'string') startPage = savedPage
        }

        const savedHistory = window.history.state?.pageHistory
        const startHistory = Array.isArray(savedHistory) ? savedHistory : [startPage]
        setPage(startPage)
        setPageHistory(startHistory)

        if (!result.user.mustChangePassword) {
          const boot = await refresh()
          if (isStaffRoute && urlCase) {
            const matched = boot.cases.find(c => c.code.toUpperCase() === urlCase)
            if (matched) {
              setSelected(matched)
              setPage('detail')
            } else {
              try {
                const single = await api<CaseFile>(`/api/cases/${encodeURIComponent(urlCase)}`)
                setSelected(single)
                setPage('detail')
              } catch {
                startPage = 'inbox'
                setPage('inbox')
              }
            }
          }
        }

        if (isStaffRoute) {
          const syncedUrl = buildStaffUrl(startPage, startPage === 'detail' ? urlCase : undefined)
          window.history.replaceState(
            {
              ...(window.history.state || {}),
              route: 'staff',
              page: startPage,
              caseCode: startPage === 'detail' ? urlCase : undefined,
              pageHistory: startHistory,
            },
            '',
            syncedUrl,
          )
        }
      })
      .catch(cause => {
        setError(cause instanceof Error ? cause.message : 'Không kiểm tra được phiên đăng nhập.')
      })
  }, [refresh])

  useEffect(() => {
    if (!user) return
    let active = true

    const validateSession = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const result = await api<{ user: User | null; csrfToken?: string | null }>('/api/auth/me')
        if (!active) return
        if (!result.user) {
          if (routeFromPath() === 'staff') {
            setStaffSessionExpired(true)
            return
          }
          setStaffSessionToken('', false)
          setUser(null)
          setSelected(null)
          setPage('home')
          setMobileNavOpen(false)
          setData({
            procedures: [],
            cases: [],
            stats: {},
            statusLabels: {},
            staff: [],
            feedback: [],
            outbox: [],
          })
          return
        }
        if (result.csrfToken) {
          setStaffSessionToken(result.csrfToken, true)
        }
        const accessChanged =
          user.role !== result.user.role ||
          user.agencyScope !== result.user.agencyScope ||
          user.validFrom !== result.user.validFrom ||
          user.validUntil !== result.user.validUntil ||
          user.mustChangePassword !== result.user.mustChangePassword ||
          user.maySignSandbox !== result.user.maySignSandbox

        if (accessChanged) {
          setUser(result.user)
          setSelected(null)
          setPage(result.user.role === 'admin' ? 'overview' : 'inbox')
          setData({
            procedures: [],
            cases: [],
            stats: {},
            statusLabels: {},
            staff: [],
            feedback: [],
            outbox: [],
          })
          if (!result.user.mustChangePassword) await refresh()
        }
      } catch {
        /* Transient network glitch should not disrupt active work */
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void validateSession()
    }
    const interval = window.setInterval(validateSession, 15_000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, refresh])

  const isStaff = Boolean(user)

  async function authenticate(account: User, csrf: string) {
    setStaffSessionToken(csrf, true)
    setStaffSessionExpired(false)
    setUser(account)
    setError('')
    const firstPage = account.role === 'admin' ? 'overview' : 'inbox'
    setRoute('staff')
    if (!account.mustChangePassword) {
      await refresh()
      setPage(firstPage)
      setPageHistory([firstPage])
      window.history.pushState(
        { route: 'staff', page: firstPage, pageHistory: [firstPage] },
        '',
        buildStaffUrl(firstPage),
      )
    } else {
      window.history.pushState({ route: 'staff' }, '', '/staff')
    }
  }

  function passwordChanged(account: User) {
    const firstPage = account.role === 'admin' ? 'overview' : 'inbox'
    setUser(account)
    setError('')
    setPage(firstPage)
    setPageHistory([firstPage])
    window.history.replaceState(
      { ...(window.history.state || {}), route: 'staff', page: firstPage, pageHistory: [firstPage] },
      '',
      buildStaffUrl(firstPage),
    )
    refresh().catch(cause =>
      setError(
        cause instanceof Error ? cause.message : 'Không tải được dữ liệu sau khi đổi mật khẩu.',
      ),
    )
  }

  async function signOut() {
    try {
      await api('/api/auth/logout', {})
    } catch {
      /* Ignore logout error on expired session */
    }
    setStaffSessionToken('', false)
    setStaffSessionExpired(false)
    setUser(null)
    setSelected(null)
    setAction('')
    setActionText('')
    setAssignee('')
    setExtendDays(5)
    setPage('home')
    setPageHistory(['home'])
    setMobileNavOpen(false)
    setData({
      procedures: [],
      procedureCategories: [],
      cases: [],
      stats: {},
      statusLabels: {},
      staff: [],
      feedback: [],
      outbox: [],
    })
    navigateRoute('public')
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected || !action) return
    const form = event.currentTarget
    const formData = new FormData(form)
    setBusy(true)
    setError('')

    const reasonActions = new Set([
      'request_supplement',
      'reject_intake',
      'send_back',
      'decline',
      'waive_fee',
      'prepare_stop_notice',
      'return_to_intake',
      'return_to_leader',
      'reject_stop_notice',
      'close_expired_supplement',
    ])

    const payload: Record<string, unknown> = {}

    if (action === selected.workflowGuard?.verificationAction) {
      payload.evidence = Object.fromEntries(
        (selected.workflowGuard.evidenceFields || []).map((field: { id: string }) => [
          field.id,
          String(formData.get(`workflow-${field.id}`) || ''),
        ]),
      )
    }

    if (reasonActions.has(action)) payload.reason = actionText
    if (action === 'request_supplement') {
      payload.items = actionText
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(Boolean)
    }
    if (action === 'assign') {
      payload.assignee = assignee
      payload.unit = user?.agencyScope || ''
    }
    if (action === 'extend_deadline') {
      payload.addDays = Number(extendDays)
      payload.reason = actionText
    }
    if (action === 'confirm_paper_returned') {
      payload.note = actionText
      payload.reason = actionText
    }
    if (action === 'save_draft' || action === 'submit_review') {
      payload.draft = actionText || selected.draftResult || ''
    }
    if (action === 'approve' || action === 'submit_supplement') {
      payload.note = actionText
    }
    if (action === 'digitize_documents') {
      payload.pageCount = Number(formData.get('pageCount'))
      payload.documentRegister = actionText
    }
    if (action === 'set_fee') {
      payload.amount = Number(formData.get('feeAmount'))
      payload.basis = actionText
    }
    if (action === 'deliver') {
      payload.receiver = formData.get('deliveryReceiver')
      payload.evidence = formData.get('deliveryEvidence')
      payload.channel = formData.get('deliveryChannel')
    }
    if (action === 'issue') {
      payload.resultNumber = formData.get('resultNumber')
    }
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

    const evidenceFiles = formData
      .getAll('supportingFiles')
      .filter((value): value is File => value instanceof File && value.size > 0)
    if (evidenceFiles.length) {
      payload.files = await Promise.all(evidenceFiles.map(encodeFile))
    }

    try {
      const result = await api<CaseFile>(
        `/api/cases/${encodeURIComponent(selected.code)}/actions`,
        {
          action,
          payload,
          expectedVersion: selected.version,
        },
      )
      form.reset()
      setAction('')
      setActionText('')
      setAssignee('')
      setExtendDays(5)
      setSelected(result)
      await refresh()
      setMessage('Đã ghi nhận thao tác và cập nhật trạng thái hồ sơ.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể cập nhật hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  function openPage(nextPage: string) {
    const nextHistory = nextPage !== page ? [...pageHistory, nextPage] : pageHistory
    const nextUrl = buildStaffUrl(nextPage)
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.pushState(
        { ...(window.history.state || {}), route: 'staff', page: nextPage, pageHistory: nextHistory },
        '',
        nextUrl,
      )
    }
    setPageHistory(nextHistory)
    setPage(nextPage)
    setSelected(null)
    setAction('')
    setActionText('')
    setAssignee('')
    setExtendDays(5)
    setMobileNavOpen(false)
    setError('')
  }

  function openQueue(focus: QueueFocus = {}) {
    setQueueFocus(focus)
    setQueueFocusVersion(value => value + 1)
    openPage('inbox')
  }

  function openCase(item: CaseFile) {
    setAction('')
    setActionText('')
    setAssignee('')
    setExtendDays(5)

    const nextHistory = page !== 'detail' ? [...pageHistory, 'detail'] : pageHistory
    const nextUrl = buildStaffUrl('detail', item.code)
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.pushState(
        {
          ...(window.history.state || {}),
          route: 'staff',
          page: 'detail',
          caseCode: item.code,
          pageHistory: nextHistory,
        },
        '',
        nextUrl,
      )
    }
    setPageHistory(nextHistory)
    setSelected(item)
    setPage('detail')
    setMobileNavOpen(false)
    setError('')
  }

  function goBack() {
    if (pageHistory.length > 1) window.history.back()
    else if (page === 'detail') openPage('inbox')
    else openPage(user?.role === 'admin' ? 'overview' : 'home')
  }

  async function signOutCitizen() {
    try {
      await api('/api/citizen/auth/logout', {})
      setCitizenSessionToken('')
      setCitizen(null)
      updateReceipt(null)
      setCitizenError('')
      navigateRoute('public')
    } catch (reason) {
      setCitizenError(reason instanceof Error ? reason.message : 'Chưa đăng xuất được.')
    }
  }

  // Staff route handling (Auth, Password Change, or Staff Shell)
  if (route === 'staff' && citizen && !user) {
    return (
      <CivicShell
        currentPath="/staff"
        citizenUser={citizen}
        onNavigate={navigateByPath}
        onLogoutCitizen={() => void signOutCitizen()}
      >
        <section className="not-found-page">
          <div className="panel not-found-card">
            <h1>Khu vực nghiệp vụ nội bộ</h1>
            <p>
              Bạn đang đăng nhập bằng tài khoản công dân ({citizen.name}). Bàn làm việc Một cửa chỉ
              dành cho tài khoản cán bộ được phân quyền.
            </p>
            <div className="not-found-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => navigateRoute('public')}
              >
                Về Cổng dịch vụ công dân
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => void signOutCitizen().then(() => navigateRoute('staff'))}
              >
                Đăng xuất công dân &amp; mở đăng nhập cán bộ
              </button>
            </div>
          </div>
        </section>
      </CivicShell>
    )
  }

  if (route === 'staff' && user?.mustChangePassword) {
    return <PasswordChangeScreen onChanged={passwordChanged} onSignOut={() => void signOut()} />
  }

  if (route === 'staff' && !user) {
    return <AuthScreen onAuthenticated={authenticate} onBack={() => navigateRoute('public')} />
  }

  // Unified Citizen Surface (<CivicShell>) across ALL non-staff routes!
  if (route !== 'staff') {
    const currentPath = window.location.pathname || '/'
    const citizenProtectedRoute =
      route === 'citizen-profile' || route === 'submit' || route === 'citizen-services'

    const isReceiptQuery =
      route === 'submit' &&
      Boolean(citizenReceipt) &&
      new URLSearchParams(window.location.search).get('v') === 'receipt'
    const activeSubmitView: PublicView = isReceiptQuery ? 'receipt' : 'submit'

    const returnContextLabel =
      route === 'submit'
        ? 'Đăng nhập để kê khai tự động từ hồ sơ công dân và gửi hồ sơ trực tuyến (hệ thống sẽ giữ nguyên thủ tục bạn đã chọn).'
        : route === 'citizen-services'
          ? 'Đăng nhập để đặt lịch hẹn giao dịch Một cửa hoặc gửi phản ánh, kiến nghị có định danh.'
          : route === 'citizen-profile'
            ? 'Đăng nhập để truy cập Không gian công dân số, Kho tài liệu điện tử và danh sách hồ sơ của bạn.'
            : undefined

    return (
      <CivicShell
        currentPath={currentPath}
        citizenUser={citizen}
        onNavigate={navigateByPath}
        onLogoutCitizen={() => void signOutCitizen()}
      >
        {citizenError && (
          <div className="form-error citizen-alert-banner" role="alert">
            <span>{citizenError}</span>
            <button type="button" className="text-button" onClick={() => setCitizenError('')}>
              Đóng
            </button>
          </div>
        )}

        {(citizenProtectedRoute || route === 'citizen-login') && !citizenReady ? (
          <LoadingFallback label="Đang kiểm tra phiên xác thực công dân…" />
        ) : (citizenProtectedRoute || route === 'citizen-login') && !citizen ? (
          <CitizenAuthSection
            returnContextLabel={returnContextLabel}
            onNavigatePath={navigateByPath}
            onAuthenticated={(account, csrf, registered) => {
              setCitizenSessionToken(csrf)
              setCitizen(account)
              setCitizenError('')
              // Preserve current route when citizen signed in specifically to submit or book appointment!
              if (registered || route === 'citizen-login') {
                navigateRoute('citizen-profile')
              }
            }}
          />
        ) : route === 'not-found' ? (
          <NotFoundSection
            onHome={() => navigateRoute('public')}
            onCatalog={() => navigateRoute('catalog')}
          />
        ) : route === 'citizen-profile' ? (
          <Suspense fallback={<LoadingFallback label="Đang tải Không gian công dân số…" />}>
            <LazyCitizenWorkspace
              embeddedInCivicShell
              name={citizen?.name || ''}
              request={api}
              onChanged={(next: User) => setCitizen(next)}
              onSignOut={signOutCitizen}
              renderProfile={onDirtyChange => (
                <Suspense fallback={<LoadingFallback label="Đang tải thông tin định danh…" />}>
                  <LazyCitizenProfilePage
                    embedded
                    onDirtyChange={onDirtyChange}
                    request={api}
                    onChanged={(next: User) => setCitizen(next)}
                    onHome={() => navigateRoute('public')}
                    onSubmit={() => navigateRoute('submit')}
                  />
                </Suspense>
              )}
              renderCase={(code, onUpdated) => (
                <CitizenTrackingPage
                  key={code}
                  initialReceipt={null}
                  initialCode={code}
                  embedded
                  citizenSignedIn
                  onUpdated={onUpdated}
                />
              )}
            />
          </Suspense>
        ) : route === 'catalog' ? (
          <Suspense fallback={<LoadingFallback label="Đang tải danh mục thủ tục hành chính…" />}>
            <LazyCitizenProcedureCatalog request={api} />
          </Suspense>
        ) : route === 'submit' ? (
          activeSubmitView === 'receipt' && citizenReceipt ? (
            <CitizenReceiptView
              receipt={citizenReceipt}
              onTrack={() =>
                navigateByPath(`/tra-cuu-ho-so?code=${encodeURIComponent(citizenReceipt.code)}`)
              }
            />
          ) : (
            <Suspense fallback={<LoadingFallback label="Đang tải biểu mẫu nộp hồ sơ trực tuyến…" />}>
              <LazyCitizenApplicationForm
                request={api}
                initialProcedureCode={citizenProcedureCode}
                onSubmitted={value => updateReceipt(value)}
              />
            </Suspense>
          )
        ) : route === 'track' ? (
          <CitizenTrackingPage
            initialReceipt={citizenReceipt}
            citizenSignedIn={Boolean(citizen)}
            onRequireLogin={() => navigateRoute('citizen-login')}
          />
        ) : route === 'citizen-services' ? (
          <div>
            <div className="citizen-page-heading">
              <h1>Lịch hẹn giao dịch Một cửa &amp; Phản ánh, kiến nghị</h1>
              <p>
                Chủ động đặt lịch làm việc tại Bộ phận Một cửa để giảm thời gian chờ đợi hoặc gửi
                phản ánh, kiến nghị tới cơ quan có thẩm quyền.
              </p>
            </div>
            <Suspense fallback={<LoadingFallback label="Đang tải tiện ích công dân…" />}>
              <LazyPublicAdministrativeServices request={api} />
            </Suspense>
          </div>
        ) : route === 'guide' ? (
          <GuideContent isStaff={Boolean(user)} onNavigatePath={navigateByPath} />
        ) : (
          <>
            <InformationHome onNavigate={navigateByPath} />
            <section className="support-strip" id="ho-tro">
              <div>
                <h2>Trung tâm Phục vụ hành chính công Thành phố Hà Nội</h2>
                <p>
                  Hỗ trợ giải đáp quy trình, thành phần hồ sơ và hướng dẫn thực hiện dịch vụ công
                  trực tuyến 24/7.
                </p>
              </div>
              <div className="support-actions">
                <a className="button secondary" href={CITY_SUPPORT} target="_blank" rel="noreferrer">
                  Cổng thông tin Trung tâm
                </a>
                <a className="support-phone tabular-nums" href="tel:0241022">
                  024 1022 <small>nhánh 7, 8</small>
                </a>
                <a className="support-phone tabular-nums" href="tel:19001009">
                  1900 1009 <small>tổng đài thông minh</small>
                </a>
              </div>
            </section>
          </>
        )}
      </CivicShell>
    )
  }

  if (!user) {
    return <AuthScreen onAuthenticated={authenticate} onBack={() => navigateRoute('public')} />
  }

  const pageMeta: Record<string, { title: string; description: string }> = {
    overview: {
      title: 'Tổng quan quản trị hệ thống',
      description:
        'Theo dõi tài khoản cán bộ, thời hạn hiệu lực và các đề nghị phân quyền chờ duyệt.',
    },
    news: {
      title: 'Quản lý tin tức cổng thông tin',
      description: 'Soạn thảo, xuất bản và lưu trữ bài viết hiển thị trên cổng dịch vụ công.',
    },
    home: {
      title: 'Bàn điều hành & Giám sát',
      description:
        'Theo dõi chỉ số xử lý, luồng trạng thái, Bộ chỉ số 766 và hồ sơ cần ưu tiên giải quyết.',
    },
    inbox: {
      title: 'Hộp xử lý hồ sơ',
      description:
        'Tra cứu, lọc theo trạng thái, thời hạn, chuyên viên phụ trách và thực hiện nghiệp vụ.',
    },
    service_desk: {
      title: 'Quầy một cửa & Lịch hẹn',
      description:
        'Tiếp nhận hồ sơ trực tiếp tại quầy, xác nhận lịch hẹn công dân và phản hồi kiến nghị.',
    },
    monitoring: {
      title: 'Giám sát vận hành & Tiến độ',
      description:
        'Phân tích tiến độ giải quyết, cân đối kỳ TT 09/2026 và Bộ chỉ số 766 theo đơn vị.',
    },
    procedures: {
      title: 'Danh mục thủ tục hành chính',
      description: 'Tra cứu quy trình, biểu mẫu, thành phần hồ sơ và quản lý phân loại lĩnh vực.',
    },
    activity: {
      title: 'Nhật ký xử lý hồ sơ',
      description: 'Truy vết lịch sử thao tác, người thực hiện và mốc thời gian trên từng hồ sơ.',
    },
    connections: {
      title: 'Tài chính, Chữ ký & Tích hợp',
      description:
        'Đối soát phí/lệ phí, quản lý thẩm quyền ký số nội bộ và theo dõi hàng chờ đồng bộ.',
    },
    users: {
      title: 'Quản lý tài khoản cán bộ',
      description:
        'Quản trị danh bạ cán bộ, phạm vi cơ quan, thời hạn hiệu lực và phê duyệt cấp quyền.',
    },
    reports: {
      title: 'Báo cáo thống kê & Bộ chỉ số 766',
      description:
        'Tổng hợp cân đối kỳ (TT 09/2026/TT-BTP), Bộ chỉ số 766 và số liệu theo cơ quan, thủ tục.',
    },
    guide: {
      title: 'Hướng dẫn nghiệp vụ',
      description:
        'Tài liệu hướng dẫn quy trình tiếp nhận, thụ lý, phê duyệt và trả kết quả trên hệ thống.',
    },
    profile: {
      title: 'Tài khoản cá nhân',
      description:
        'Thông tin phân quyền, thẩm quyền ký, cập nhật liên hệ và bảo mật phiên đăng nhập.',
    },
    detail: { title: 'Chi tiết hồ sơ', description: '' },
  }

  const pageInfo = pageMeta[page] || pageMeta.home
  const actionOptions = selected ? getActions(user, selected) : []

  const navSections =
    user.role === 'admin'
      ? [
          {
            label: 'QUẢN TRỊ HỆ THỐNG',
            items: [
              {
                key: 'overview',
                label: 'Tổng quan quản trị',
                icon: 'dashboard',
                count: undefined as number | undefined,
              },
              {
                key: 'users',
                label: 'Tài khoản cán bộ',
                icon: 'users',
                count: undefined as number | undefined,
              },
              {
                key: 'reports',
                label: 'Báo cáo & Chỉ số 766',
                icon: 'reports',
                count: undefined as number | undefined,
              },
              {
                key: 'procedures',
                label: 'Danh mục thủ tục',
                icon: 'catalog',
                count: data.procedures.length,
              },
              {
                key: 'connections',
                label: 'Tài chính & Tích hợp',
                icon: 'connections',
                count: undefined as number | undefined,
              },
              {
                key: 'news',
                label: 'Tin tức cổng thông tin',
                icon: 'news',
                count: undefined as number | undefined,
              },
              {
                key: 'guide',
                label: 'Hướng dẫn nghiệp vụ',
                icon: 'guide',
                count: undefined as number | undefined,
              },
            ],
          },
        ]
      : [
          {
            label: 'ĐIỀU HÀNH & TÁC NGHIỆP',
            items: [
              {
                key: 'home',
                label: 'Bàn điều hành',
                icon: 'dashboard',
                count: (data.stats.overdue || 0) || undefined,
              },
              {
                key: 'inbox',
                label: 'Hộp xử lý hồ sơ',
                icon: 'inbox',
                count: actionableCases(user, data.cases).length || data.cases.length,
              },
              ...(['intake', 'leader'].includes(user.role)
                ? [
                    {
                      key: 'service_desk',
                      label: 'Quầy một cửa & Lịch hẹn',
                      icon: 'desk',
                      count: undefined as number | undefined,
                    },
                  ]
                : []),
            ],
          },
          {
            label: 'TRA CỨU & TRUY VẾT',
            items: [
              {
                key: 'procedures',
                label: 'Danh mục thủ tục',
                icon: 'catalog',
                count: data.procedures.length,
              },
              {
                key: 'activity',
                label: 'Nhật ký xử lý',
                icon: 'activity',
                count: undefined as number | undefined,
              },
            ],
          },
          {
            label: 'ĐỐI SOÁT & HỆ THỐNG',
            items: [
              {
                key: 'connections',
                label: 'Tài chính & Tích hợp',
                icon: 'connections',
                count: undefined as number | undefined,
              },
              ...(user.canManageAgencyAccounts
                ? [
                    {
                      key: 'users',
                      label: 'Tài khoản cơ quan',
                      icon: 'users',
                      count: undefined as number | undefined,
                    },
                  ]
                : []),
              {
                key: 'guide',
                label: 'Hướng dẫn nghiệp vụ',
                icon: 'guide',
                count: undefined as number | undefined,
              },
            ],
          },
        ]

  const activeNavKey = page === 'detail' ? 'inbox' : page === 'monitoring' ? 'home' : page

  return (
    <div className={`app-shell${captureMode ? ' capture-mode' : ''}`} data-surface="staff">
      <SkipLink targetId="staff-main-workspace" />

      {staffSessionExpired && (
        <StaffReauthModal
          user={user}
          onReauthenticated={async (nextUser, csrf) => {
            setStaffSessionToken(csrf, true)
            setStaffSessionExpired(false)
            setUser(nextUser)
            await refresh()
            setMessage('Đã khôi phục phiên làm việc. Bạn có thể tiếp tục xử lý hồ sơ.')
          }}
          onSignOut={signOut}
        />
      )}

      <header className="topbar">
        <button
          type="button"
          className="staff-menu-toggle"
          aria-label="Mở danh mục cán bộ"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(open => !open)}
        >
          <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
          <small>Danh mục</small>
        </button>

        <button
          type="button"
          className="brand-lockup top-brand"
          aria-label="Trang chính hệ thống quản lý tiếp nhận và giải quyết thủ tục hành chính tại Hà Nội"
          onClick={() => openPage(user.role === 'admin' ? 'overview' : 'home')}
        >
          <img
            className="staff-system-logo"
            src="/images/hanoi-logo.png"
            alt="Biểu trưng cổng thông tin Hà Nội"
          />
          <span>
            <b>HỆ THỐNG THÔNG TIN GIẢI QUYẾT TTHC</b>
            <small>{user.agencyScope || 'THÀNH PHỐ HÀ NỘI'}</small>
          </span>
        </button>

        <div className="top-right">
          <button
            type="button"
            className="text-button staff-public-link"
            onClick={() => navigateRoute('public')}
          >
            <span>Cổng công dân</span>
            <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="account-chip account-menu-button"
            aria-label="Mở tài khoản cá nhân"
            aria-current={page === 'profile' ? 'page' : undefined}
            onClick={() => openPage('profile')}
          >
            <span>
              <b>{user.name}</b>
              <small>{roleNames[user.role] || user.role}</small>
            </span>
            <span className="account-mobile-label">Tài khoản</span>
          </button>
        </div>
      </header>

      {mobileNavOpen && (
        <button
          type="button"
          className="staff-nav-backdrop"
          aria-label="Đóng danh mục"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`}
        aria-label="Điều hướng bàn cán bộ"
      >
        <div className="staff-sidebar-head">
          <span className="nav-caption">BÀN LÀM VIỆC CÁN BỘ</span>
          <button
            type="button"
            className="staff-nav-close"
            aria-label="Đóng danh mục"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {navSections.map(section => (
          <div className="staff-nav-section" key={section.label}>
            <span className="nav-caption">{section.label}</span>
            {section.items.map(item => (
              <button
                type="button"
                key={item.key}
                className={`nav-link${activeNavKey === item.key ? ' active' : ''}`}
                aria-current={activeNavKey === item.key ? 'page' : undefined}
                onClick={() => openPage(item.key)}
              >
                <i aria-hidden="true">
                  <StaffNavIcon name={item.icon} />
                </i>
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <b className="nav-count tabular-nums">{item.count.toLocaleString('vi-VN')}</b>
                )}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-link sidebar-signout"
            onClick={() => void signOut()}
          >
            <i aria-hidden="true">
              <StaffNavIcon name="signout" />
            </i>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main id="staff-main-workspace" className="workspace" tabIndex={-1}>
        {page !== 'detail' && (
          <div className="page-heading staff-page-bar">
            <div className="staff-page-bar-title">
              <h1>{pageInfo.title}</h1>
              {pageInfo.description && <p>{pageInfo.description}</p>}
            </div>
            {page !== 'profile' && (
              <div className="page-heading-tools">
                <button
                  type="button"
                  className="refresh-data-button"
                  onClick={() =>
                    refresh()
                      .then(() => setMessage('Đã đồng bộ lại dữ liệu.'))
                      .catch(cause =>
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : 'Không thể tải lại dữ liệu.',
                        ),
                      )
                  }
                >
                  <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
                  <span>Làm mới</span>
                </button>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="toast-success" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}>
              Đóng
            </button>
          </div>
        )}
        {error && (
          <div className="form-error page-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>
              Đóng
            </button>
          </div>
        )}

        {page === 'inbox' && (
          <CaseQueue
            key={queueFocusVersion}
            user={user}
            data={data}
            initialFocus={queueFocus}
            onOpen={openCase}
            onRefresh={refresh}
            onNotice={setMessage}
          />
        )}

        {page === 'service_desk' && (
          <div className="connections-workspace">
            <Suspense fallback={<LoadingFallback label="Đang tải Quầy một cửa…" />}>
              <LazyAdministrativeServiceDesk
                user={user}
                procedures={data.procedures}
                request={api}
                onCaseCreated={async created => {
                  await refresh()
                  openCase(created)
                }}
              />
            </Suspense>
          </div>
        )}

        {page === 'overview' && user.role === 'admin' && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyAdminOverview onNavigate={openPage} />
          </Suspense>
        )}

        {page === 'news' && user.role === 'admin' && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyNewsManagement onNotice={setMessage} />
          </Suspense>
        )}

        {page === 'users' && (user.role === 'admin' || user.canManageAgencyAccounts) && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyStaffAccountManagement actor={user} onNotice={setMessage} />
          </Suspense>
        )}

        {page === 'reports' && user.role === 'admin' && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyAdministrativeReports data={data} onOpenQueue={openQueue} />
          </Suspense>
        )}

        {page === 'detail' && selected && (
          <Suspense fallback={<LoadingFallback label="Đang tải hồ sơ nghiệp vụ…" />}>
            <LazyCaseDetail
              key={`${selected.code}:${selected.version}:${selected.withdrawal?.status || ''}`}
              item={selected}
              isStaff={isStaff}
              signingAuthorityRef={user.signingAuthorityRef || ''}
              labels={data.statusLabels}
              actionOptions={actionOptions}
              action={action}
              setAction={setAction}
              actionText={actionText}
              setActionText={setActionText}
              assignee={assignee}
              setAssignee={setAssignee}
              extendDays={extendDays}
              setExtendDays={setExtendDays}
              staff={data.staff || []}
              busy={busy}
              onSubmitAction={submitAction}
              onLookupKeyChanged={async () => {
                setSelected(await api<CaseFile>(`/api/cases/${encodeURIComponent(selected.code)}`))
                await refresh()
              }}
              onBack={goBack}
            />
          </Suspense>
        )}

        {page === 'detail' && !selected && (
          <div className="panel empty-state">
            Hãy chọn một hồ sơ trong danh sách để xem chi tiết.
          </div>
        )}

        {page === 'home' && isStaff && (
          <StaffHome
            user={user}
            data={data}
            initialView="work"
            onOpen={openCase}
            onOpenQueue={openQueue}
            onNavigate={openPage}
          />
        )}

        {page === 'monitoring' && (
          <OperationsMonitor
            user={user}
            data={data}
            onOpen={openCase}
            onOpenQueue={openQueue}
            onNavigate={openPage}
          />
        )}

        {page === 'procedures' && (
          <Suspense fallback={<LoadingFallback label="Đang tải danh mục thủ tục…" />}>
            <LazyProcedureCatalog
              procedures={data.procedures}
              procedureCategories={data.procedureCategories || []}
              canManage={user.role === 'admin'}
              onUpdated={async () => {
                await refresh()
              }}
            />
          </Suspense>
        )}

        {page === 'activity' && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyCaseActivityLog cases={data.cases} onOpen={openCase} />
          </Suspense>
        )}

        {page === 'connections' && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyServiceConnections
              user={user}
              data={data}
              onNavigate={openPage}
              onOpenCase={async created => {
                await refresh()
                openCase(created)
              }}
            />
          </Suspense>
        )}

        {page === 'guide' && <GuideContent isStaff onNavigatePath={navigateByPath} />}

        {page === 'profile' && (
          <Suspense fallback={<LoadingFallback />}>
            <LazyPersonalAccount user={user} onChanged={setUser} onNotice={setMessage} />
          </Suspense>
        )}
      </main>
    </div>
  )
}

export default App
