import {
  ArrowLeft,
  Bell,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Download,
  FileEdit,
  FilePlus2,
  FolderArchive,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState, type ComponentType, type FormEvent, type ReactNode } from 'react'
import { CitizenProfileEmbedBoundary } from './CitizenProfile'
import './CitizenWorkspace.css'
import { ConfirmDialog, MetricCard, StatusTag, type SemanticTone } from './design-system'
import type { ApiRequest, User } from './types'

type WorkspaceCase = {
  code: string
  procedureCode: string
  procedure?: { name: string }
  status: string
  statusLabel: string
  createdAt: string
  deadline?: string
  receivingAgency: string
  result?: { number?: string; content?: string }
  fee?: { amount?: number; status?: string; basis?: string }
  payments?: {
    transactionRef: string
    amount: number
    status: string
    createdAt: string
    payerReference?: string
  }[]
}

type Draft = {
  id: string
  title: string
  procedureCode: string
  version: number
  updatedAt: string
}

type Notice = {
  id: string
  kind: string
  code: string
  title: string
  detail: string
  at: string
  read: boolean
}

type Appointment = {
  code: string
  agency: string
  procedure_name: string
  appointment_date: string
  time_slot: string
  queue_number: number
  status: string
  counter_note: string
}

type Feedback = {
  code: string
  title: string
  content: string
  agency: string
  status: string
  reply: string
  replied_at: string
  created_at: string
}

type DocumentItem = {
  id: string
  code: string
  name: string
  kind: string
  size: number
  downloadUrl: string
  at: string
}

type SessionItem = {
  createdAt: string
  expiresAt: number
  current: boolean
}

type Workspace = {
  cases: WorkspaceCase[]
  drafts: Draft[]
  notifications: Notice[]
  documents: DocumentItem[]
  appointments: Appointment[]
  feedback: Feedback[]
  sessions: SessionItem[]
  sampleData?: boolean
}

type NavIcon = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>

type WorkspaceNavItem = {
  key: string
  label: string
  description: string
  icon: NavIcon
}

type WorkspaceNavGroup = {
  title: string
  items: WorkspaceNavItem[]
}

const WORKSPACE_GROUPS: WorkspaceNavGroup[] = [
  {
    title: 'Hồ sơ dịch vụ công',
    items: [
      {
        key: '',
        label: 'Tổng quan',
        description: 'Theo dõi tổng thể tiến độ hồ sơ và các việc cần thực hiện.',
        icon: LayoutDashboard,
      },
      {
        key: 'ho-so',
        label: 'Hồ sơ của tôi',
        description: 'Tra cứu hồ sơ đã nộp, gửi bổ sung hoặc đề nghị rút hồ sơ trực tuyến.',
        icon: FolderKanban,
      },
      {
        key: 'ho-so-nhap',
        label: 'Hồ sơ nháp',
        description: 'Các tờ khai điện tử đang lưu tạm trong tài khoản, chưa gửi đến cơ quan.',
        icon: FileEdit,
      },
      {
        key: 'tai-lieu',
        label: 'Kho tài liệu điện tử',
        description: 'Giấy tờ đã nộp và văn bản kết quả giải quyết gắn với tài khoản công dân.',
        icon: FolderArchive,
      },
    ],
  },
  {
    title: 'Tương tác & Nghĩa vụ',
    items: [
      {
        key: 'thong-bao',
        label: 'Thông báo',
        description: 'Cập nhật mới nhất về tiến độ hồ sơ, lịch hẹn Một cửa và trả lời phản ánh.',
        icon: Bell,
      },
      {
        key: 'khoan-thu',
        label: 'Khoản thu & Thanh toán',
        description: 'Theo dõi phí, lệ phí theo quy định và gửi chứng từ đối soát kế toán.',
        icon: CreditCard,
      },
      {
        key: 'lich-hen',
        label: 'Lịch hẹn Một cửa',
        description: 'Danh sách phiếu hẹn giao dịch trực tiếp tại Bộ phận Một cửa.',
        icon: CalendarClock,
      },
      {
        key: 'phan-anh',
        label: 'Phản ánh, kiến nghị',
        description: 'Theo dõi kết quả tiếp nhận và văn bản phản hồi kiến nghị của cơ quan.',
        icon: MessageSquare,
      },
    ],
  },
  {
    title: 'Định danh & Bảo mật',
    items: [
      {
        key: 'thong-tin-ca-nhan',
        label: 'Thông tin cá nhân',
        description: 'Cập nhật dữ liệu một lần để tự động điền biểu mẫu dịch vụ công trực tuyến.',
        icon: UserCheck,
      },
      {
        key: 'bao-mat',
        label: 'Bảo mật tài khoản',
        description: 'Đổi mật khẩu định danh và kiểm soát các phiên đăng nhập đang hoạt động.',
        icon: ShieldCheck,
      },
    ],
  },
]

const ALL_NAV_ITEMS: WorkspaceNavItem[] = WORKSPACE_GROUPS.flatMap(group => group.items)

function readTab(): string {
  const value = window.location.pathname.replace(/^\/tai-khoan\/?/, '').split('/')[0]
  return ALL_NAV_ITEMS.some(item => item.key === value) ? value : ''
}

const CLOSED_STATUSES = new Set(['HOAN_THANH', 'TU_CHOI', 'KHONG_GIAI_QUYET', 'DUNG'])

const STATUS_LABELS: Record<string, string> = {
  BOOKED: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã đến quầy',
  COMPLETED: 'Đã phục vụ',
  CANCELLED: 'Đã hủy',
  RECEIVED: 'Đã tiếp nhận',
  REPLIED: 'Đã trả lời',
  CLOSED: 'Đã đóng',
  PENDING: 'Chờ khai chứng từ',
  DUE: 'Chờ nộp',
  PAID: 'Chờ đối chiếu chứng từ',
  RECONCILED: 'Đã đối chiếu',
  WAIVED: 'Đã miễn thu',
  REFUNDED: 'Đã ghi nhận hoàn trả',
}

function appointmentTone(status: string): SemanticTone {
  switch (status.toUpperCase()) {
    case 'COMPLETED':
      return 'success'
    case 'CONFIRMED':
    case 'CHECKED_IN':
      return 'info'
    case 'BOOKED':
      return 'warning'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}

function feedbackTone(status: string): SemanticTone {
  switch (status.toUpperCase()) {
    case 'REPLIED':
      return 'success'
    case 'RECEIVED':
      return 'info'
    default:
      return 'neutral'
  }
}

function formatDate(value?: string): string {
  if (!value) return 'Chưa có'
  return new Date(value).toLocaleString(
    'vi-VN',
    value.includes('T') ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' },
  )
}

function DateText({ value }: { value?: string }) {
  return <span className="tabular-nums">{formatDate(value)}</span>
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="workspace-empty">{children}</p>
}

export function CitizenWorkspace({
  name,
  request,
  onChanged,
  renderProfile,
  renderCase,
  onSignOut,
  embeddedInCivicShell = false,
}: {
  onSignOut: () => Promise<void>
  name: string
  request: ApiRequest
  onChanged: (user: User) => void
  renderProfile: (onDirtyChange: (dirty: boolean) => void, embedded: boolean) => ReactNode
  renderCase: (code: string, onUpdated: () => void) => ReactNode
  embeddedInCivicShell?: boolean
}) {
  const [tab, setTab] = useState(readTab)
  const [caseCode, setCaseCode] = useState(
    () => new URLSearchParams(window.location.search).get('case') || '',
  )
  const [data, setData] = useState<Workspace | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [profileDirty, setProfileDirty] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Accessible <ConfirmDialog> states for destructive and unsaved-navigation guards
  const [pendingNav, setPendingNav] = useState<{
    next: string
    code: string
    initialStatus: string
  } | null>(null)
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null)
  const [confirmMarkAllReadOpen, setConfirmMarkAllReadOpen] = useState(false)
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false)

  const refresh = useCallback(async () => {
    setError('')
    setRefreshing(true)
    try {
      const result = await request<Workspace>('/api/citizen/workspace')
      setData(result)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa tải được dữ liệu tài khoản.')
    } finally {
      setRefreshing(false)
    }
  }, [request])

  useEffect(() => {
    const controller = new AbortController()
    request<Workspace>('/api/citizen/workspace', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setData(result)
        }
      })
      .catch(reason => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Chưa tải được dữ liệu tài khoản.')
        }
      })
    return () => controller.abort()
  }, [request])

  useEffect(() => {
    const sync = () => {
      setTab(readTab())
      setCaseCode(new URLSearchParams(window.location.search).get('case') || '')
      setPage(1)
      setMobileNavOpen(false)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  function executeNavigate(next: string, code = '', initialStatus = '') {
    window.history.pushState(
      { route: 'citizen-profile' },
      '',
      `/tai-khoan${next ? '/' + next : ''}${code ? '?case=' + encodeURIComponent(code) : ''}`,
    )
    setTab(next)
    setCaseCode(code)
    setQuery('')
    setStatus(initialStatus)
    setPage(1)
    setNotice('')
    setError('')
    setMobileNavOpen(false)
    void refresh()
    window.scrollTo(0, 0)
  }

  function navigate(next: string, code = '', initialStatus = '') {
    if (profileDirty && next !== tab) {
      setPendingNav({ next, code, initialStatus })
      return
    }
    if (next !== tab) {
      setProfileDirty(false)
    }
    executeNavigate(next, code, initialStatus)
  }

  async function markRead(ids: string[]) {
    if (!ids.length) return
    setBusy(true)
    setError('')
    try {
      await request('/api/citizen/notifications/read', { ids })
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa cập nhật được thông báo.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeleteDraft() {
    if (!draftToDelete) return
    setBusy(true)
    setError('')
    try {
      await request('/api/citizen/drafts', {
        id: draftToDelete.id,
        version: draftToDelete.version,
        action: 'delete',
      })
      setDraftToDelete(null)
      setNotice('Đã xóa hồ sơ nháp khỏi tài khoản.')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa xóa được hồ sơ nháp.')
    } finally {
      setBusy(false)
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ user: User }>('/api/citizen/change-password', values)
      onChanged(result.user)
      form.reset()
      setNotice('Đã đổi mật khẩu và đăng xuất các phiên khác. Phiên hiện tại tiếp tục hoạt động.')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa đổi được mật khẩu.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError('')
    try {
      await onSignOut()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa đăng xuất được.')
    } finally {
      setBusy(false)
    }
  }

  async function revokeSessions() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await request('/api/citizen/revoke-other-sessions', {})
      setConfirmRevokeOpen(false)
      setNotice('Đã đăng xuất các phiên đăng nhập khác.')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa đăng xuất được các phiên khác.')
    } finally {
      setBusy(false)
    }
  }

  const unread = data?.notifications.filter(item => !item.read) || []
  const cases = (data?.cases || []).filter(
    item =>
      (!status ||
        (status === '__ACTIVE__' ? !CLOSED_STATUSES.has(item.status) : item.status === status)) &&
      `${item.code} ${item.procedure?.name || item.procedureCode} ${item.receivingAgency}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi').trim()),
  )
  const pages = Math.max(1, Math.ceil(cases.length / 10))
  const activeNavMeta = ALL_NAV_ITEMS.find(item => item.key === tab) || ALL_NAV_ITEMS[0]

  function renderCaseList(records: WorkspaceCase[]) {
    if (!records.length) {
      return (
        <Empty>
          Chưa có hồ sơ phù hợp. <a href="/nop-ho-so">Lập hồ sơ mới</a> hoặc thay đổi điều kiện lọc.
        </Empty>
      )
    }
    return (
      <div className="workspace-list">
        {records.map(item => (
          <article className="workspace-row" key={item.code}>
            <div>
              <h3 className="workspace-title">{item.procedure?.name || item.procedureCode}</h3>
              <p>
                <b className="mono-code tabular-nums">{item.code}</b> · {item.receivingAgency}
              </p>
              <p>
                Ngày gửi: <DateText value={item.createdAt} />
                {item.deadline && (
                  <>
                    {' '}
                    · Hạn trả: <DateText value={item.deadline} />
                  </>
                )}
              </p>
              {item.fee?.status === 'DUE' && (
                <p className="workspace-task-note tabular-nums">
                  Chờ chứng từ khoản thu: {Number(item.fee.amount || 0).toLocaleString('vi-VN')} đồng
                </p>
              )}
            </div>
            <div className="workspace-row-actions">
              <StatusTag status={item.status} label={item.statusLabel} />
              <button
                type="button"
                className="button secondary"
                onClick={() => navigate('ho-so', item.code)}
              >
                {item.status === 'CHO_BO_SUNG'
                  ? 'Xem yêu cầu bổ sung'
                  : item.fee?.status === 'DUE'
                    ? 'Xem khoản thu'
                    : item.status === 'DA_PHAT_HANH' || item.status === 'HOAN_THANH'
                      ? 'Xem kết quả'
                      : 'Xem chi tiết'}
              </button>
            </div>
          </article>
        ))}
      </div>
    )
  }

  const primaryAction =
    tab === 'lich-hen'
      ? { href: '/tien-ich?tab=lich-hen', label: 'Đặt lịch hẹn Một cửa' }
      : tab === 'phan-anh'
        ? { href: '/tien-ich?tab=phan-anh', label: 'Gửi phản ánh mới' }
        : ['', 'ho-so', 'ho-so-nhap', 'tai-lieu'].includes(tab) && !caseCode
          ? { href: '/nop-ho-so', label: 'Nộp hồ sơ mới' }
          : null

  const ContentTag = embeddedInCivicShell ? 'section' : 'main'

  return (
    <div
      className={`citizen-workspace ${embeddedInCivicShell ? 'citizen-workspace--embedded' : ''}`.trim()}
    >
      {!embeddedInCivicShell && (
        <header className="workspace-masthead">
          <a
            className="workspace-brand"
            href="/"
            aria-label="Về trang chủ Hệ thống Thông tin Giải quyết Thủ tục Hành chính TP. Hà Nội"
          >
            <img src="/images/hanoi-logo.png" alt="Biểu trưng Thành phố Hà Nội" />
            <span className="workspace-brand__titles">
              <span className="workspace-brand__governing">
                TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG THÀNH PHỐ HÀ NỘI
              </span>
              <span className="workspace-brand__system">
                HỆ THỐNG THÔNG TIN GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH
              </span>
              <span className="workspace-brand__subtitle">
                Không gian công dân số · Cổng dịch vụ công trực tuyến TP. Hà Nội
              </span>
            </span>
          </a>
          <nav className="workspace-masthead__nav" aria-label="Điều hướng chung">
            <a href="/">Về cổng dịch vụ</a>
            <a href="/huong-dan">Hướng dẫn sử dụng</a>
            <button type="button" className="text-button" disabled={busy} onClick={signOut}>
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </header>
      )}

      <div className="workspace-layout">
        <aside className="workspace-sidebar" aria-label="Điều hướng không gian công dân số">
          <div className="workspace-person">
            <span className="workspace-avatar" aria-hidden="true">
              {name
                .split(' ')
                .filter(Boolean)
                .slice(-2)
                .map(value => value[0])
                .join('')}
            </span>
            <div>
              <strong>{name}</strong>
              <small>Tài khoản công dân định danh</small>
            </div>
          </div>

          <button
            type="button"
            className="workspace-mobile-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="workspace-sidebar-nav"
            onClick={() => setMobileNavOpen(open => !open)}
          >
            <span className="workspace-mobile-toggle__lead">
              {mobileNavOpen ? (
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>Danh mục: {activeNavMeta.label}</span>
            </span>
            <span className="workspace-mobile-toggle__trail">
              {unread.length > 0 && (
                <span className="workspace-count tabular-nums">{unread.length}</span>
              )}
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className="workspace-mobile-toggle__chevron"
              />
            </span>
          </button>

          <nav
            id="workspace-sidebar-nav"
            className={`workspace-nav ${mobileNavOpen ? 'is-open' : ''}`.trim()}
            aria-label="Chức năng tài khoản công dân"
          >
            {WORKSPACE_GROUPS.map(group => (
              <div className="workspace-nav-group" key={group.title}>
                <p className="workspace-nav-group__title">{group.title}</p>
                {group.items.map(item => {
                  const Icon = item.icon
                  const isActive = tab === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      className={`workspace-nav-item ${isActive ? 'active' : ''}`.trim()}
                      onClick={() => navigate(item.key)}
                    >
                      <span className="workspace-nav-item__label">
                        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                      {item.key === 'thong-bao' && unread.length > 0 && (
                        <span className="workspace-count tabular-nums">{unread.length}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}

            <div className="workspace-sidebar-footer">
              <button
                type="button"
                className="workspace-nav-item workspace-signout-btn"
                disabled={busy}
                onClick={signOut}
              >
                <span className="workspace-nav-item__label">
                  <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
                  <span>Đăng xuất tài khoản</span>
                </span>
              </button>
            </div>
          </nav>
        </aside>

        <ContentTag
          id={embeddedInCivicShell ? undefined : 'main-content'}
          className="workspace-content"
          aria-label={embeddedInCivicShell ? 'Nội dung không gian công dân số' : undefined}
        >
          <div className="workspace-heading">
            <div>
              <h1>{tab === '' ? 'Tổng quan không gian công dân số' : activeNavMeta.label}</h1>
              <p>{activeNavMeta.description}</p>
            </div>
            <div className="workspace-heading-actions">
              {tab !== 'thong-tin-ca-nhan' && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={refresh}
                  disabled={refreshing}
                >
                  <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{refreshing ? 'Đang tải…' : 'Làm mới'}</span>
                </button>
              )}
              {primaryAction && (
                <a className="button primary" href={primaryAction.href}>
                  <FilePlus2 size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{primaryAction.label}</span>
                </a>
              )}
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="citizen-success" role="status">
              {notice}
            </p>
          )}
          {!data && !error && (
            <p className="workspace-lead-note" role="status">
              Đang tải dữ liệu của bạn…
            </p>
          )}

          {tab === 'thong-tin-ca-nhan' ? (
            <CitizenProfileEmbedBoundary>
              {renderProfile(setProfileDirty, true)}
            </CitizenProfileEmbedBoundary>
          ) : (
            data && (
              <>
                {tab === '' && (
                  <>
                    <div className="hcds-kpi-grid workspace-kpi-grid">
                      <MetricCard
                        label="Hồ sơ đang xử lý"
                        value={data.cases.filter(item => !CLOSED_STATUSES.has(item.status)).length}
                        hint="Đang trong quy trình giải quyết"
                        tone="blue"
                        onClick={() => navigate('ho-so', '', '__ACTIVE__')}
                      />
                      <MetricCard
                        label="Cần bổ sung"
                        value={data.cases.filter(item => item.status === 'CHO_BO_SUNG').length}
                        hint="Cơ quan đang chờ phản hồi"
                        tone="amber"
                        onClick={() => navigate('ho-so', '', 'CHO_BO_SUNG')}
                      />
                      <MetricCard
                        label="Đã hoàn thành"
                        value={data.cases.filter(item => item.status === 'HOAN_THANH').length}
                        hint="Đã ban hành kết quả giải quyết"
                        tone="green"
                        onClick={() => navigate('ho-so', '', 'HOAN_THANH')}
                      />
                      <MetricCard
                        label="Nháp chưa gửi"
                        value={data.drafts.length}
                        hint="Tờ khai lưu tạm trong tài khoản"
                        tone="navy"
                        onClick={() => navigate('ho-so-nhap')}
                      />
                    </div>

                    <section className="workspace-section">
                      <h2>Việc cần thực hiện</h2>
                      {data.cases.filter(
                        item => item.status === 'CHO_BO_SUNG' || item.fee?.status === 'DUE',
                      ).length ? (
                        renderCaseList(
                          data.cases.filter(
                            item => item.status === 'CHO_BO_SUNG' || item.fee?.status === 'DUE',
                          ),
                        )
                      ) : (
                        <Empty>
                          Hiện chưa có yêu cầu bổ sung hồ sơ hoặc khoản thu phí, lệ phí đang chờ bạn
                          thực hiện.
                        </Empty>
                      )}
                    </section>

                    <section className="workspace-section">
                      <h2>Hồ sơ gần đây</h2>
                      {renderCaseList(data.cases.slice(0, 5))}
                    </section>
                  </>
                )}

                {tab === 'ho-so' &&
                  (caseCode ? (
                    <>
                      <button
                        type="button"
                        className="text-button workspace-back"
                        onClick={() => navigate('ho-so')}
                      >
                        <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                        <span>Về danh sách hồ sơ của tôi</span>
                      </button>
                      {renderCase(caseCode, () => {
                        void refresh()
                      })}
                    </>
                  ) : (
                    <section className="workspace-panel">
                      <div className="workspace-filters">
                        <label htmlFor="workspace-case-search">
                          <span>Tìm hồ sơ</span>
                          <input
                            id="workspace-case-search"
                            type="search"
                            placeholder="Mã hồ sơ, tên thủ tục hoặc cơ quan tiếp nhận"
                            value={query}
                            onChange={event => {
                              setQuery(event.target.value)
                              setPage(1)
                            }}
                          />
                        </label>
                        <label htmlFor="workspace-case-status">
                          <span>Trạng thái</span>
                          <select
                            id="workspace-case-status"
                            value={status}
                            onChange={event => {
                              setStatus(event.target.value)
                              setPage(1)
                            }}
                          >
                            <option value="">Tất cả trạng thái</option>
                            <option value="__ACTIVE__">Đang xử lý (chưa kết thúc)</option>
                            {Array.from(
                              new Map(data.cases.map(item => [item.status, item.statusLabel])),
                            ).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <span className="workspace-filters__count tabular-nums">
                          {cases.length.toLocaleString('vi-VN')} hồ sơ
                        </span>
                      </div>

                      {renderCaseList(
                        cases.slice(
                          (Math.min(page, pages) - 1) * 10,
                          Math.min(page, pages) * 10,
                        ),
                      )}

                      {pages > 1 && (
                        <div className="workspace-pagination">
                          <button
                            type="button"
                            className="button secondary"
                            disabled={page <= 1}
                            onClick={() => setPage(value => value - 1)}
                          >
                            Trang trước
                          </button>
                          <span className="tabular-nums">
                            Trang {Math.min(page, pages)} / {pages}
                          </span>
                          <button
                            type="button"
                            className="button secondary"
                            disabled={page >= pages}
                            onClick={() => setPage(value => value + 1)}
                          >
                            Trang sau
                          </button>
                        </div>
                      )}
                    </section>
                  ))}

                {tab === 'ho-so-nhap' && (
                  <section className="workspace-panel">
                    <p className="workspace-lead-note">
                      Bản nháp chỉ lưu nội dung tờ khai trong tài khoản cá nhân, chưa gửi đến cơ
                      quan tiếp nhận. Tệp đính kèm cần được chọn lại khi mở nháp để nộp chính thức.
                    </p>
                    {data.drafts.length ? (
                      <div className="workspace-list">
                        {data.drafts.map(item => (
                          <article className="workspace-row" key={item.id}>
                            <div>
                              <h3>{item.title}</h3>
                              <p>
                                Mã thủ tục:{' '}
                                <b className="mono-code tabular-nums">{item.procedureCode}</b> · Lưu
                                lúc <DateText value={item.updatedAt} />
                              </p>
                            </div>
                            <div className="workspace-row-actions">
                              <StatusTag tone="neutral" label="Bản nháp" />
                              <a
                                className="button primary"
                                href={`/nop-ho-so?procedure=${encodeURIComponent(item.procedureCode)}&draft=${encodeURIComponent(item.id)}`}
                              >
                                Tiếp tục khai hồ sơ
                              </a>
                              <button
                                type="button"
                                className="text-button"
                                disabled={busy}
                                onClick={() => setDraftToDelete(item)}
                              >
                                <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                                <span>Xóa nháp</span>
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <Empty>
                        Bạn chưa lưu hồ sơ nháp. Khi đang lập hồ sơ trực tuyến, chọn “Lưu nháp vào
                        tài khoản” để lưu tạm.
                      </Empty>
                    )}
                  </section>
                )}

                {tab === 'tai-lieu' && (
                  <>
                    <section className="workspace-section">
                      <h2>Tài liệu đã gửi &amp; văn bản phát hành</h2>
                      <p className="workspace-lead-note">
                        Kho lưu trữ điện tử gồm thành phần hồ sơ đã nộp và thông báo, kết quả phát
                        hành thuộc tài khoản công dân. Bạn có thể tái sử dụng khi lập hồ sơ mới.
                      </p>
                      {data.documents.length ? (
                        <div className="workspace-list">
                          {data.documents.map(item => (
                            <article className="workspace-row" key={item.id}>
                              <div>
                                <h3>{item.name}</h3>
                                <p>
                                  {item.kind} · Hồ sơ{' '}
                                  <b className="mono-code tabular-nums">{item.code}</b> ·{' '}
                                  <span className="tabular-nums">
                                    {Math.max(1, Math.round(item.size / 1024)).toLocaleString(
                                      'vi-VN',
                                    )}{' '}
                                    KB
                                  </span>{' '}
                                  · Cập nhật <DateText value={item.at} />
                                </p>
                              </div>
                              <div className="workspace-row-actions">
                                <StatusTag
                                  tone={item.kind === 'Kết quả giải quyết' ? 'success' : 'info'}
                                  label={item.kind}
                                />
                                <a className="button secondary" href={item.downloadUrl}>
                                  <Download size={15} strokeWidth={1.75} aria-hidden="true" />
                                  <span>Tải tài liệu</span>
                                </a>
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => navigate('ho-so', item.code)}
                                >
                                  Xem hồ sơ gốc
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <Empty>
                          Chưa có tài liệu đã nộp hoặc văn bản phát hành trong kho tài liệu điện tử.
                        </Empty>
                      )}
                    </section>

                    <section className="workspace-section">
                      <h2>Hồ sơ đã có kết quả giải quyết</h2>
                      {renderCaseList(
                        data.cases.filter(
                          item =>
                            item.result && ['DA_PHAT_HANH', 'HOAN_THANH'].includes(item.status),
                        ),
                      )}
                    </section>
                  </>
                )}

                {tab === 'thong-bao' && (
                  <section className="workspace-panel">
                    <div className="workspace-notice-tools">
                      <label className="workspace-checkbox-label">
                        <input
                          type="checkbox"
                          checked={unreadOnly}
                          onChange={event => setUnreadOnly(event.target.checked)}
                        />
                        <span>Chỉ hiển thị thông báo chưa đọc</span>
                      </label>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy || !unread.length}
                        onClick={() => setConfirmMarkAllReadOpen(true)}
                      >
                        Đánh dấu tất cả đã đọc (<span className="tabular-nums">{unread.length}</span>
                        )
                      </button>
                    </div>
                    {data.notifications.filter(item => !unreadOnly || !item.read).length ? (
                      <div className="workspace-list">
                        {data.notifications
                          .filter(item => !unreadOnly || !item.read)
                          .map(item => (
                            <article
                              className={`workspace-row${item.read ? '' : ' unread'}`}
                              key={item.id}
                            >
                              <div>
                                <h3>{item.title}</h3>
                                <p>{item.detail}</p>
                                <p>
                                  Mã tham chiếu:{' '}
                                  <b className="mono-code tabular-nums">{item.code}</b> ·{' '}
                                  <DateText value={item.at} />
                                </p>
                              </div>
                              <div className="workspace-row-actions">
                                <StatusTag
                                  tone={item.read ? 'neutral' : 'info'}
                                  label={item.read ? 'Đã đọc' : 'Chưa đọc'}
                                />
                                <button
                                  type="button"
                                  className="button secondary"
                                  onClick={async () => {
                                    await markRead([item.id])
                                    navigate(
                                      item.kind === 'case'
                                        ? 'ho-so'
                                        : item.kind === 'appointment'
                                          ? 'lich-hen'
                                          : 'phan-anh',
                                      item.kind === 'case' ? item.code : '',
                                    )
                                  }}
                                >
                                  Xem nội dung
                                </button>
                                {!item.read && (
                                  <button
                                    type="button"
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() => markRead([item.id])}
                                  >
                                    Đánh dấu đã đọc
                                  </button>
                                )}
                              </div>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <Empty>
                        Chưa có thông báo phù hợp. Thông báo mới sẽ tự động ghi nhận khi hồ sơ, lịch
                        hẹn hoặc phản ánh có cập nhật.
                      </Empty>
                    )}
                  </section>
                )}

                {tab === 'lich-hen' && (
                  <section className="workspace-panel">
                    {data.appointments.length ? (
                      <div className="workspace-list">
                        {data.appointments.map(item => (
                          <article className="workspace-row" key={item.code}>
                            <div>
                              <h3>{item.procedure_name}</h3>
                              <p>
                                Mã lịch hẹn: <b className="mono-code tabular-nums">{item.code}</b> ·{' '}
                                {item.agency}
                              </p>
                              <p>
                                Ngày hẹn: <DateText value={item.appointment_date} /> · Khung giờ:{' '}
                                <span className="tabular-nums">{item.time_slot}</span> · Số thứ tự
                                quầy: <b className="tabular-nums">{item.queue_number}</b>
                              </p>
                              {item.counter_note && (
                                <p>Hướng dẫn từ Bộ phận Một cửa: {item.counter_note}</p>
                              )}
                            </div>
                            <div className="workspace-row-actions">
                              <StatusTag
                                tone={appointmentTone(item.status)}
                                label={STATUS_LABELS[item.status] || item.status}
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <Empty>
                        Bạn chưa đặt lịch hẹn giao dịch tại quầy bằng tài khoản này.{' '}
                        <a href="/tien-ich?tab=lich-hen">Đặt lịch hẹn Một cửa</a>.
                      </Empty>
                    )}
                  </section>
                )}

                {tab === 'phan-anh' && (
                  <section className="workspace-panel">
                    {data.feedback.length ? (
                      <div className="workspace-list">
                        {data.feedback.map(item => (
                          <article className="workspace-feedback" key={item.code}>
                            <header>
                              <h3>{item.title}</h3>
                              <StatusTag
                                tone={feedbackTone(item.status)}
                                label={STATUS_LABELS[item.status] || item.status}
                              />
                            </header>
                            <p>
                              Mã kiến nghị: <b className="mono-code tabular-nums">{item.code}</b> ·{' '}
                              {item.agency} · Gửi lúc <DateText value={item.created_at} />
                            </p>
                            <p>{item.content}</p>
                            {item.reply && (
                              <div className="workspace-reply">
                                <h4>Văn bản trả lời của cơ quan</h4>
                                <p>{item.reply}</p>
                                <small>
                                  Phản hồi lúc <DateText value={item.replied_at} />
                                </small>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <Empty>
                        Bạn chưa gửi phản ánh, kiến nghị bằng tài khoản này.{' '}
                        <a href="/tien-ich?tab=phan-anh">Gửi phản ánh mới</a>.
                      </Empty>
                    )}
                  </section>
                )}

                {tab === 'khoan-thu' && (
                  <section className="workspace-panel">
                    <p className="workspace-lead-note">
                      Khoản thu phí, lệ phí và chứng từ thanh toán do công dân kê khai được chuyển
                      bộ phận tài chính kế toán đối soát theo quy định.
                    </p>
                    {data.cases.filter(item => item.fee?.amount || item.payments?.length).length ? (
                      <div className="workspace-list">
                        {data.cases
                          .filter(item => item.fee?.amount || item.payments?.length)
                          .map(item => (
                            <article className="workspace-row" key={item.code}>
                              <div>
                                <h3>{item.procedure?.name || item.procedureCode}</h3>
                                <p>
                                  Hồ sơ <b className="mono-code tabular-nums">{item.code}</b> · Mức
                                  thu:{' '}
                                  <b className="tabular-nums">
                                    {Number(item.fee?.amount || 0).toLocaleString('vi-VN')} đồng
                                  </b>
                                </p>
                                {item.fee?.basis && <p>Căn cứ thu: {item.fee.basis}</p>}
                                {item.payments?.map(payment => (
                                  <p key={payment.transactionRef}>
                                    Mã giao dịch{' '}
                                    <span className="mono-code tabular-nums">
                                      {payment.transactionRef}
                                    </span>{' '}
                                    ·{' '}
                                    <span className="tabular-nums">
                                      {Number(payment.amount).toLocaleString('vi-VN')} đồng
                                    </span>{' '}
                                    · {STATUS_LABELS[payment.status] || payment.status} ·{' '}
                                    <DateText value={payment.createdAt} />
                                    {payment.payerReference && (
                                      <>
                                        {' '}
                                        · Chứng từ:{' '}
                                        <span className="tabular-nums">
                                          {payment.payerReference}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                ))}
                              </div>
                              <div className="workspace-row-actions">
                                <StatusTag
                                  status={item.fee?.status}
                                  label={
                                    STATUS_LABELS[item.fee?.status || ''] ||
                                    item.fee?.status ||
                                    'Chờ cập nhật'
                                  }
                                />
                                <button
                                  type="button"
                                  className="button secondary"
                                  onClick={() => navigate('ho-so', item.code)}
                                >
                                  Xem khoản thu &amp; gửi chứng từ
                                </button>
                              </div>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <Empty>Tài khoản chưa có khoản thu phí, lệ phí phát sinh từ hồ sơ.</Empty>
                    )}
                  </section>
                )}

                {tab === 'bao-mat' && (
                  <>
                    <section className="workspace-section">
                      <h2>Đổi mật khẩu tài khoản</h2>
                      <form className="form-stack workspace-password" onSubmit={changePassword}>
                        <label>
                          <span>Mật khẩu hiện tại</span>
                          <input
                            type="password"
                            name="currentPassword"
                            autoComplete="current-password"
                            required
                            maxLength={128}
                            disabled={busy}
                          />
                        </label>
                        <label>
                          <span>Mật khẩu mới</span>
                          <input
                            type="password"
                            name="newPassword"
                            autoComplete="new-password"
                            required
                            minLength={12}
                            maxLength={128}
                            disabled={busy}
                          />
                        </label>
                        <small className="field-help">
                          Tối thiểu 12 ký tự, bao gồm chữ hoa, chữ thường và chữ số.
                        </small>
                        <label>
                          <span>Nhập lại mật khẩu mới</span>
                          <input
                            type="password"
                            name="confirmPassword"
                            autoComplete="new-password"
                            required
                            minLength={12}
                            maxLength={128}
                            disabled={busy}
                          />
                        </label>
                        <div>
                          <button type="submit" className="button primary" disabled={busy}>
                            <KeyRound size={16} strokeWidth={1.75} aria-hidden="true" />
                            <span>Cập nhật mật khẩu</span>
                          </button>
                        </div>
                      </form>
                    </section>

                    <section className="workspace-section">
                      <h2>Phiên đăng nhập đang hoạt động</h2>
                      <p className="workspace-lead-note">
                        Hiện có{' '}
                        <b className="tabular-nums">
                          {data.sessions.length.toLocaleString('vi-VN')}
                        </b>{' '}
                        phiên đăng nhập còn hiệu lực đối với tài khoản của bạn.
                      </p>
                      <div className="workspace-list">
                        {data.sessions.map((item, index) => (
                          <article className="workspace-row" key={`${item.createdAt}-${index}`}>
                            <div>
                              <h3>{item.current ? 'Phiên đang sử dụng' : 'Phiên thiết bị khác'}</h3>
                              <p>
                                Đăng nhập lúc <DateText value={item.createdAt} /> · Hết hạn lúc{' '}
                                <DateText
                                  value={new Date(item.expiresAt * 1000).toISOString()}
                                />
                              </p>
                            </div>
                            <div className="workspace-row-actions">
                              <StatusTag
                                tone={item.current ? 'success' : 'neutral'}
                                label={item.current ? 'Phiên hiện tại' : 'Đang hiệu lực'}
                              />
                            </div>
                          </article>
                        ))}
                      </div>
                      <div className="workspace-session-actions">
                        <button
                          type="button"
                          className="button secondary"
                          disabled={busy || !data.sessions.some(item => !item.current)}
                          onClick={() => setConfirmRevokeOpen(true)}
                        >
                          Đăng xuất tất cả phiên khác
                        </button>
                      </div>
                    </section>
                  </>
                )}
              </>
            )
          )}
        </ContentTag>
      </div>

      <ConfirmDialog
        open={Boolean(pendingNav)}
        title="Chưa lưu thay đổi thông tin cá nhân"
        message="Thông tin cá nhân mới chỉnh sửa chưa được lưu. Bạn có muốn rời mục này và hủy các thay đổi chưa lưu?"
        confirmLabel="Rời mục này"
        cancelLabel="Tiếp tục chỉnh sửa"
        tone="danger"
        onConfirm={() => {
          if (!pendingNav) return
          const { next, code, initialStatus } = pendingNav
          setPendingNav(null)
          setProfileDirty(false)
          executeNavigate(next, code, initialStatus)
        }}
        onClose={() => setPendingNav(null)}
      />

      <ConfirmDialog
        open={Boolean(draftToDelete)}
        title="Xóa hồ sơ nháp"
        message={
          draftToDelete
            ? `Bạn có chắc chắn muốn xóa hồ sơ nháp “${draftToDelete.title}” (${draftToDelete.procedureCode})? Dữ liệu nháp đã xóa không thể khôi phục.`
            : ''
        }
        confirmLabel="Xóa hồ sơ nháp"
        cancelLabel="Giữ lại"
        tone="danger"
        busy={busy}
        onConfirm={() => void confirmDeleteDraft()}
        onClose={() => setDraftToDelete(null)}
      />

      <ConfirmDialog
        open={confirmMarkAllReadOpen}
        title="Đánh dấu tất cả thông báo đã đọc"
        message={`Xác nhận đánh dấu toàn bộ ${unread.length} thông báo chưa đọc trong tài khoản sang trạng thái đã đọc?`}
        confirmLabel="Đánh dấu tất cả đã đọc"
        cancelLabel="Hủy bỏ"
        tone="primary"
        busy={busy}
        onConfirm={async () => {
          await markRead(unread.map(item => item.id))
          setConfirmMarkAllReadOpen(false)
        }}
        onClose={() => setConfirmMarkAllReadOpen(false)}
      />

      <ConfirmDialog
        open={confirmRevokeOpen}
        title="Đăng xuất tất cả phiên khác"
        message="Tất cả các phiên đăng nhập trên trình duyệt hoặc thiết bị khác sẽ bị thu hồi ngay lập tức. Phiên hiện tại của bạn vẫn tiếp tục hoạt động."
        confirmLabel="Thu hồi các phiên khác"
        cancelLabel="Hủy bỏ"
        tone="danger"
        busy={busy}
        onConfirm={() => void revokeSessions()}
        onClose={() => setConfirmRevokeOpen(false)}
      />
    </div>
  )
}

export default CitizenWorkspace
