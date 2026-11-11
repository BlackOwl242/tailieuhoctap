import {
  Fragment,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Index766Panel, PeriodBalancePanel } from './analytics766'
import { ReportExportButtons } from './ReportExport'
import { serviceModeLabel } from './procedureLabels'
import {
  api,
  computeIndex766,
  computePeriodBalance,
  handleTabArrows,
  isAbortError,
  parseReportDate,
  reportDateDisplay,
  roleNames,
  toDate,
} from './portalUtils'
import type {
  AccountAccess,
  Bootstrap,
  CaseFile,
  Index766Summary,
  ManagedNews,
  ManagedUser,
  PeriodBalanceSummary,
  Procedure,
  ProcedureCategory,
  QueueFocus,
  StaffAccessRequest,
  StaffAccountChange,
  User,
} from './types'

const LazyCitizenProcedureDetail = lazy(() => import('./CitizenProcedureDetail'))

export function PanelHeading({
  title,
  description,
  action,
}: {
  kicker?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="ops-panel-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="ops-panel-action">{action}</div>}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  note,
  tone,
  onClick,
}: {
  label: string
  value: number
  note: string
  tone: string
  onClick?: () => void
}) {
  const cls = `metric-card tone-${tone}${onClick ? ' metric-button' : ''}`
  const content = (
    <>
      <small className="metric-label">{label}</small>
      <b className="metric-value tabular-nums">{value.toLocaleString('vi-VN')}</b>
      <em className="metric-note">{note}</em>
    </>
  )
  return onClick ? (
    <button type="button" className={cls} onClick={onClick}>
      {content}
    </button>
  ) : (
    <article className={cls}>{content}</article>
  )
}

type PersonalAccountDetails = {
  user: User
  accessSource: string
  approval: null | { reviewer: string; reviewed_at: string; reason: string; review_note: string }
  emailVerification: { verified: boolean; available: boolean }
  activeSessions: number
  sessionExpiresAt: string
}

export function PersonalAccount({
  user,
  onChanged,
  onNotice,
}: {
  user: User
  onChanged: (user: User) => void
  onNotice: (message: string) => void
}) {
  const [details, setDetails] = useState<PersonalAccountDetails | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [phone, setPhone] = useState(user.phone || '')

  useEffect(() => {
    const controller = new AbortController()
    api<PersonalAccountDetails>('/api/auth/account', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setDetails(result)
      })
      .catch(cause => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(cause instanceof Error ? cause.message : 'Không tải được thông tin tài khoản.')
      })
    return () => controller.abort()
  }, [])

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy('contact')
    setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/contact', {
        phone,
        currentPassword: values.get('currentPassword'),
      })
      onChanged(result.user)
      setPhone(result.user.phone)
      form.reset()
      onNotice('Đã lưu số điện thoại liên hệ.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu thông tin liên hệ.')
    } finally {
      setBusy('')
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    if (values.newPassword !== values.confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.')
      return
    }
    setBusy('password')
    setError('')
    try {
      const result = await api<{ user: User }>('/api/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      onChanged(result.user)
      form.reset()
      setDetails(await api<PersonalAccountDetails>('/api/auth/account'))
      onNotice('Đã đổi mật khẩu và kết thúc các phiên đăng nhập khác.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đổi mật khẩu.')
    } finally {
      setBusy('')
    }
  }

  async function closeOtherSessions() {
    setBusy('sessions')
    setError('')
    try {
      await api('/api/auth/revoke-other-sessions', {})
      setDetails(await api<PersonalAccountDetails>('/api/auth/account'))
      onNotice('Đã kết thúc các phiên khác. Phiên hiện tại vẫn được giữ.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể kết thúc phiên.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="personal-account-workspace">
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <section className="panel personal-access-panel">
        <h2>Thông tin và quyền truy cập</h2>
        <dl className="personal-account-facts">
          <div>
            <dt>Họ và tên</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email đăng nhập</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Vai trò</dt>
            <dd>{roleNames[user.role] || user.role}</dd>
          </div>
          <div>
            <dt>Cơ quan / phạm vi</dt>
            <dd>{user.agencyScope || 'Chưa có thông tin'}</dd>
          </div>
          <div>
            <dt>Hiệu lực từ</dt>
            <dd>{user.validFrom ? toDate(user.validFrom) : 'Không giới hạn ngày bắt đầu'}</dd>
          </div>
          <div>
            <dt>Hiệu lực đến</dt>
            <dd>{user.validUntil ? toDate(user.validUntil) : 'Không giới hạn ngày kết thúc'}</dd>
          </div>
          <div>
            <dt>Nguồn cấp quyền</dt>
            <dd>
              {details?.accessSource || 'Đang tải thông tin…'}
              {details?.approval && (
                <small>
                  {details.approval.reviewer} · {toDate(details.approval.reviewed_at)}
                  <br />
                  Căn cứ: {details.approval.reason}
                </small>
              )}
            </dd>
          </div>
          <div>
            <dt>Quyền ký Mẫu 06</dt>
            <dd>{user.maySignStop ? user.signingAuthorityRef || 'Đã được cấp' : 'Chưa được cấp'}</dd>
          </div>
        </dl>
      </section>

      <div className="personal-account-forms">
        <section className="panel">
          <h2>Thông tin liên hệ</h2>
          <p className="muted">Cập nhật số điện thoại của bạn bằng mật khẩu hiện tại.</p>
          <form className="form-stack" onSubmit={saveContact}>
            <label>
              <span>Số điện thoại</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </label>
            <label>
              <span>Mật khẩu hiện tại</span>
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                required
              />
            </label>
            <button className="button primary" disabled={!!busy || phone === (user.phone || '')}>
              {busy === 'contact' ? 'Đang lưu…' : 'Lưu thông tin liên hệ'}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Đổi mật khẩu</h2>
          <p className="muted">
            Từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số. Đổi mật khẩu sẽ kết thúc các phiên khác.
          </p>
          <form className="form-stack" onSubmit={changePassword}>
            <label>
              <span>Mật khẩu hiện tại</span>
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                required
              />
            </label>
            <label>
              <span>Mật khẩu mới</span>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
            <label>
              <span>Nhập lại mật khẩu mới</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
            <button className="button primary" disabled={!!busy}>
              {busy === 'password' ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
            </button>
          </form>
        </section>
      </div>

      <section className="panel personal-session-panel">
        <div>
          <h2>Phiên đăng nhập</h2>
          <p>
            {details
              ? `${details.activeSessions} phiên còn hiệu lực. Phiên hiện tại hết hạn ${toDate(details.sessionExpiresAt)}.`
              : 'Đang tải phiên đăng nhập…'}
          </p>
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={!!busy || !details || details.activeSessions <= 1}
          onClick={() => void closeOtherSessions()}
        >
          {busy === 'sessions' ? 'Đang kết thúc…' : 'Kết thúc các phiên khác'}
        </button>
      </section>
    </div>
  )
}

export function StaffAccountManagement({
  actor,
  onNotice,
}: {
  actor: User
  onNotice: (message: string) => void
}) {
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
  const [revokingAccount, setRevokingAccount] = useState<ManagedUser | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [today] = useState(() =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  )

  useEffect(() => {
    if (!revokingAccount) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        setRevokingAccount(null)
        setRevokeReason('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [busy, revokingAccount])

  const accessState = (account: ManagedUser) =>
    !account.active
      ? 'Chưa được duyệt'
      : account.validFrom && today < account.validFrom
        ? 'Chờ ngày hiệu lực'
        : account.validUntil && today > account.validUntil
          ? 'Hết thời hạn'
          : 'Đang hiệu lực'

  const agencyOptions = [...new Set(users.map(account => account.agencyScope).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'vi'),
  )

  const visibleUsers = users.filter(account => {
    if (agencyFilter !== 'all' && account.agencyScope !== agencyFilter) return false
    if (roleFilter !== 'all' && account.role !== roleFilter) return false
    const effectiveState = !account.active ? 'Tạm ngưng' : accessState(account)
    if (statusFilter === 'active' && effectiveState !== 'Đang hiệu lực') return false
    if (statusFilter === 'suspended' && effectiveState !== 'Tạm ngưng') return false
    if (statusFilter === 'expired' && effectiveState !== 'Hết thời hạn') return false
    const term = accountQuery.trim().toLocaleLowerCase('vi')
    if (
      term &&
      !`${account.name} ${account.email} ${roleNames[account.role] || account.role} ${account.agencyScope} ${account.signingAuthorityRef || ''}`
        .toLocaleLowerCase('vi')
        .includes(term)
    ) {
      return false
    }
    return true
  })

  const hasActiveFilter =
    accountQuery.trim() !== '' ||
    agencyFilter !== 'all' ||
    roleFilter !== 'all' ||
    statusFilter !== 'all'
  const accountPageCount = Math.max(1, Math.ceil(visibleUsers.length / accountPageSize))
  const currentAccountPage = Math.min(accountPage, accountPageCount)
  const pagedUsers = visibleUsers.slice(
    (currentAccountPage - 1) * accountPageSize,
    currentAccountPage * accountPageSize,
  )

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const result = await api<{
      users: ManagedUser[]
      accessRequests: StaffAccessRequest[]
      accountChanges: StaffAccountChange[]
    }>('/api/users', undefined, signal)
    if (signal?.aborted) return
    setUsers(result.users)
    setRequests(result.accessRequests)
    setChanges(result.accountChanges)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    api<{
      users: ManagedUser[]
      accessRequests: StaffAccessRequest[]
      accountChanges: StaffAccountChange[]
    }>('/api/users', undefined, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return
        setUsers(result.users)
        setRequests(result.accessRequests)
        setChanges(result.accountChanges)
      })
      .catch(cause => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(cause instanceof Error ? cause.message : 'Không tải được tài khoản.')
      })
    return () => controller.abort()
  }, [])

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form).entries())
    if (values.password !== values.confirmPassword) {
      setError('Mật khẩu khởi tạo và phần xác nhận chưa trùng khớp.')
      return
    }
    const maySignStop = values.maySignStop === 'on'
    if (
      maySignStop &&
      (values.role !== 'leader' || String(values.signingAuthorityRef || '').trim().length < 3)
    ) {
      setError(
        'Quyền ký Mẫu 06 chỉ áp dụng cho vai trò lãnh đạo; nhập số văn bản phân công thẩm quyền.',
      )
      return
    }
    setBusy(true)
    setError('')
    const { confirmPassword: _confirmPassword, ...requestPayload } = values
    try {
      await api('/api/users', {
        ...requestPayload,
        agencyScope: isSystemAdmin ? requestPayload.agencyScope : actor.agencyScope,
        maySignStop,
        signingAuthorityRef: String(values.signingAuthorityRef || '').trim(),
      })
      form.reset()
      setShowCreateForm(false)
      onNotice(
        'Đã lập đề nghị cấp tài khoản. Tài khoản chỉ hoạt động sau khi một quản trị viên khác duyệt.',
      )
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lập đề nghị cấp tài khoản.')
    } finally {
      setBusy(false)
    }
  }

  async function reviewRequest(requestItem: StaffAccessRequest, decision: 'approve' | 'reject') {
    const note = reviewNotes[requestItem.id] || ''
    if (decision === 'reject' && note.trim().length < 12) {
      setError('Cần ghi căn cứ từ chối từ 12 ký tự trở lên.')
      return
    }
    const authorizeStopSigning =
      requestItem.maySignStop && signingAuthorityChecks[requestItem.id] === true
    if (decision === 'approve' && requestItem.maySignStop && !authorizeStopSigning) {
      setError(
        'Đối chiếu văn bản phân công thẩm quyền ký Mẫu 06 trước khi duyệt quyền này.',
      )
      return
    }
    setReviewing(requestItem.id)
    setError('')
    try {
      await api(
        `/api/users/access-requests/${encodeURIComponent(requestItem.id)}/review`,
        {
          decision,
          note,
          authorizeStopSigning,
        },
      )
      onNotice(
        decision === 'approve'
          ? `Đã duyệt quyền cho ${requestItem.name}.`
          : `Đã từ chối đề nghị của ${requestItem.name}.`,
      )
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xử lý đề nghị.')
    } finally {
      setReviewing('')
    }
  }

  async function submitRevokeStopSigning(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!revokingAccount) return
    if (revokeReason.trim().length < 12) {
      setError('Căn cứ thu hồi cần ít nhất 12 ký tự.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await api(
        `/api/users/${encodeURIComponent(revokingAccount.id)}/stop-signature-authority`,
        {
          reason: revokeReason.trim(),
        },
      )
      onNotice(`Đã thu hồi quyền ký Mẫu 06 của ${revokingAccount.name}.`)
      setRevokingAccount(null)
      setRevokeReason('')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể thu hồi quyền ký.')
    } finally {
      setBusy(false)
    }
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
    setBusy(true)
    setError('')
    try {
      await api(`/api/users/${encodeURIComponent(editing.id)}/change-requests`, {
        ...values,
        active: proposedActive,
        canManageAgencyAccounts: isSystemAdmin && values.canManageAgencyAccounts === 'on',
      })
      setEditing(null)
      onNotice(
        `Đã gửi đề nghị điều chỉnh tài khoản ${editing.name}; cần quản trị viên khác duyệt.`,
      )
      await refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể lập đề nghị điều chỉnh tài khoản.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function reviewAccountChange(change: StaffAccountChange, decision: 'approve' | 'reject') {
    const note = reviewNotes[change.id] || ''
    if (decision === 'reject' && note.trim().length < 12) {
      setError('Cần ghi căn cứ từ chối từ 12 ký tự trở lên.')
      return
    }
    setReviewing(change.id)
    setError('')
    try {
      await api(`/api/users/account-changes/${encodeURIComponent(change.id)}/review`, {
        decision,
        note,
      })
      onNotice(
        decision === 'approve'
          ? `Đã áp dụng thay đổi tài khoản ${change.name}; phiên cũ đã bị thu hồi.`
          : `Đã từ chối đề nghị thay đổi tài khoản ${change.name}.`,
      )
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể xử lý đề nghị thay đổi.')
    } finally {
      setReviewing('')
    }
  }

  const accessSummary = (value: AccountAccess) =>
    `${roleNames[value.role] || value.role} · ${value.active ? 'Đang kích hoạt' : 'Tạm ngưng'} · ${value.agencyScope} · ${value.validFrom || 'Không giới hạn'} – ${value.validUntil || 'Không giới hạn'}${value.canManageAgencyAccounts ? ' · Có quyền quản lý tài khoản cơ quan' : ''}`

  const pendingTotal =
    requests.filter(r => r.status === 'PENDING').length +
    changes.filter(r => r.status === 'PENDING').length

  const accountTabs: ('directory' | 'requests')[] = ['directory', 'requests']

  return (
    <div className="account-workspace">
      <div
        className="staff-module-tabs"
        role="tablist"
        aria-label="Quản lý tài khoản cán bộ"
        onKeyDown={event => handleTabArrows(event, accountTabs, activeTab, setActiveTab)}
      >
        <button
          type="button"
          id="account-tab-directory"
          role="tab"
          tabIndex={activeTab === 'directory' ? 0 : -1}
          aria-selected={activeTab === 'directory'}
          aria-controls="account-panel-directory"
          className={`staff-module-tab${activeTab === 'directory' ? ' active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <span>Danh bạ tài khoản</span>
          <b className="tabular-nums">{users.length.toLocaleString('vi-VN')}</b>
        </button>
        <button
          type="button"
          id="account-tab-requests"
          role="tab"
          tabIndex={activeTab === 'requests' ? 0 : -1}
          aria-selected={activeTab === 'requests'}
          aria-controls="account-panel-requests"
          className={`staff-module-tab${activeTab === 'requests' ? ' active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <span>Đề nghị chờ duyệt &amp; Lịch sử</span>
          <b className="tabular-nums">{pendingTotal}</b>
        </button>
        <div className="staff-module-tabs-end">
          <button
            type="button"
            className="button primary compact-btn"
            onClick={() => setShowCreateForm(open => !open)}
          >
            {showCreateForm ? 'Đóng biểu mẫu cấp tài khoản' : '+ Lập đề nghị cấp tài khoản'}
          </button>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {revokingAccount && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            if (!busy) {
              setRevokingAccount(null)
              setRevokeReason('')
            }
          }}
        >
          <div
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-mau06-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <h2 id="revoke-mau06-title">
                  Thu hồi quyền ký Mẫu 06 · {revokingAccount.name}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Đóng hộp thoại"
                disabled={busy}
                onClick={() => {
                  setRevokingAccount(null)
                  setRevokeReason('')
                }}
              >
                ×
              </button>
            </div>
            <form className="form-stack" onSubmit={submitRevokeStopSigning}>
              <p className="muted">
                Văn bản phân công hiện hành: <b>{revokingAccount.signingAuthorityRef || '—'}</b>. Nhập rõ căn cứ thu hồi (tối thiểu 12 ký tự) để lưu nhật ký kiểm toán.
              </p>
              <label>
                <span>Căn cứ thu hồi quyền ký Mẫu 06</span>
                <textarea
                  required
                  minLength={12}
                  maxLength={1200}
                  rows={3}
                  autoFocus
                  value={revokeReason}
                  onChange={event => setRevokeReason(event.target.value)}
                  placeholder="Số quyết định điều động, thay đổi phân công nhiệm vụ…"
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setRevokingAccount(null)
                    setRevokeReason('')
                  }}
                >
                  Hủy
                </button>
                <button className="button primary" disabled={busy || revokeReason.trim().length < 12}>
                  {busy ? 'Đang thu hồi…' : 'Xác nhận thu hồi quyền ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateForm && (
        <section className="panel account-create-panel">
          <div className="panel-title">
            <div>
              <h2>Lập đề nghị cấp tài khoản cán bộ</h2>
              <p>Tài khoản chỉ hoạt động sau khi một quản trị viên hệ thống độc lập phê duyệt.</p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => setShowCreateForm(false)}
            >
              Thu gọn
            </button>
          </div>
          <form className="form-grid account-form" onSubmit={createRequest}>
            <label>
              <span>Họ và tên</span>
              <input name="name" autoComplete="name" maxLength={150} required />
            </label>
            <label>
              <span>Email công vụ</span>
              <input name="email" type="email" autoComplete="off" maxLength={254} required />
            </label>
            <label>
              <span>Số điện thoại</span>
              <input name="phone" type="tel" autoComplete="off" maxLength={40} />
            </label>
            <label>
              <span>Vai trò</span>
              <select name="role" defaultValue="intake" required>
                <option value="intake">Cán bộ tiếp nhận</option>
                <option value="specialist">Chuyên viên thụ lý</option>
                <option value="leader">Lãnh đạo phê duyệt</option>
                <option value="registrar">Văn thư phát hành</option>
                <option value="finance">Tài chính</option>
              </select>
            </label>
            <label className="span-two">
              <span>Cơ quan / đơn vị được giao</span>
              <input
                name="agencyScope"
                maxLength={180}
                defaultValue={isSystemAdmin ? '' : actor.agencyScope}
                readOnly={!isSystemAdmin}
                placeholder="Nhập đúng tên cơ quan/đơn vị theo danh mục nội bộ"
                required
              />
            </label>
            <label className="span-two check-row">
              <input name="maySignStop" type="checkbox" />
              <span>
                Đề nghị cấp quyền ký Thông báo dừng Mẫu 06 (chỉ dành cho người có văn bản phân công thẩm quyền)
              </span>
            </label>
            <label className="span-two">
              <span>Số văn bản phân công thẩm quyền ký Mẫu 06</span>
              <input
                name="signingAuthorityRef"
                maxLength={180}
                placeholder="Chỉ nhập khi đề nghị quyền ký Mẫu 06"
              />
            </label>
            <label>
              <span>Hiệu lực từ</span>
              <input name="validFrom" type="date" min={today} defaultValue={today} required />
            </label>
            <label>
              <span>Hiệu lực đến</span>
              <input name="validUntil" type="date" min={today} required />
            </label>
            <label className="span-two">
              <span>Căn cứ cấp quyền</span>
              <textarea
                name="reason"
                rows={2}
                minLength={12}
                maxLength={1200}
                placeholder="Số quyết định, phân công nhiệm vụ hoặc căn cứ nghiệp vụ"
                required
              />
            </label>
            <label>
              <span>Mật khẩu khởi tạo</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
              <small className="field-help">
                Tối thiểu 12 ký tự, có chữ hoa, chữ thường và chữ số.
              </small>
            </label>
            <label>
              <span>Xác nhận mật khẩu</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
            <div className="form-actions span-two">
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Hủy
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Đang lập đề nghị…' : 'Gửi người duyệt'}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'directory' && (
        <section
          id="account-panel-directory"
          role="tabpanel"
          aria-labelledby="account-tab-directory"
          className="panel account-directory-panel"
        >
          <div className="account-list-tools" role="search" aria-label="Bộ lọc và tìm kiếm tài khoản">
            <label className="account-search-field" htmlFor="staff-account-query">
              <span>Tìm kiếm tài khoản</span>
              <input
                id="staff-account-query"
                className="search-input"
                type="search"
                value={accountQuery}
                onChange={e => {
                  setAccountQuery(e.target.value)
                  setAccountPage(1)
                }}
                placeholder="Nhập họ tên, email công vụ, cơ quan, vai trò…"
              />
            </label>

            {isSystemAdmin && (
              <label className="account-filter-field" htmlFor="staff-account-agency">
                <span>Cơ quan / Đơn vị</span>
                <select
                  id="staff-account-agency"
                  value={agencyFilter}
                  onChange={e => {
                    setAgencyFilter(e.target.value)
                    setAccountPage(1)
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

            <label className="account-role-field" htmlFor="staff-account-role">
              <span>Vai trò nghiệp vụ</span>
              <select
                id="staff-account-role"
                value={roleFilter}
                onChange={e => {
                  setRoleFilter(e.target.value)
                  setAccountPage(1)
                }}
              >
                <option value="all">Tất cả vai trò</option>
                {Object.entries(roleNames)
                  .filter(([role]) => role !== 'citizen')
                  .map(([role, label]) => (
                    <option key={role} value={role}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="account-status-field" htmlFor="staff-account-status">
              <span>Trạng thái</span>
              <select
                id="staff-account-status"
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value)
                  setAccountPage(1)
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hiệu lực</option>
                <option value="suspended">Tạm ngưng / Chưa duyệt</option>
                <option value="expired">Hết thời hạn</option>
              </select>
            </label>

            <div className="account-list-export">
              {hasActiveFilter && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setAccountQuery('')
                    setAgencyFilter('all')
                    setRoleFilter('all')
                    setStatusFilter('all')
                    setAccountPage(1)
                  }}
                >
                  Xóa lọc
                </button>
              )}
              <ReportExportButtons getReport={() => ({
                title: 'Danh sách tài khoản cán bộ',
                subtitle: `${agencyFilter === 'all' ? 'Trong phạm vi quản lý được cấp' : agencyFilter} · Theo bộ lọc hiện tại`,
                filename: 'danh-sach-tai-khoan-can-bo',
                headers: ['STT', 'Họ tên', 'Email công vụ', 'Vai trò', 'Cơ quan / Đơn vị', 'Hiệu lực từ', 'Hiệu lực đến', 'Trạng thái', 'Quản lý tài khoản cơ quan'],
                rows: visibleUsers.map((account, idx) => [String(idx + 1), account.name, account.email, roleNames[account.role] || account.role, account.agencyScope, account.validFrom || 'Không giới hạn', account.validUntil || 'Không giới hạn', !account.active ? 'Tạm ngưng' : accessState(account), account.canManageAgencyAccounts ? 'Có' : 'Không']),
              })} />
            </div>
          </div>

          {visibleUsers.length ? (
            <>
              <div className="table-scroll data-table-wrap">
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
                      const pendingChange = changes.some(
                        change => change.userId === account.id && change.status === 'PENDING',
                      )
                      const stt = (currentAccountPage - 1) * accountPageSize + index + 1
                      const isEditing = editing?.id === account.id
                      return (
                        <Fragment key={account.id}>
                          <tr className={isEditing ? 'is-editing' : undefined}>
                            <td className="col-stt tabular-nums" data-label="STT">
                              {stt}
                            </td>
                            <td className="col-user" data-label="Tài khoản cán bộ">
                              <div className="account-cell-user">
                                <b>{account.name}</b>
                                <span className="account-cell-email">{account.email}</span>
                                {(account.canManageAgencyAccounts ||
                                  account.maySignStop ||
                                  account.mustChangePassword) && (
                                  <div className="account-cell-badges">
                                    {account.canManageAgencyAccounts && (
                                      <span className="account-meta-tag">Quản lý TK cơ quan</span>
                                    )}
                                    {account.maySignStop && (
                                      <span className="account-meta-tag">
                                        Ký Mẫu 06 · {account.signingAuthorityRef}
                                      </span>
                                    )}
                                    {account.mustChangePassword && (
                                      <span className="account-meta-tag warning">
                                        Chưa đổi mật khẩu khởi tạo
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="col-role" data-label="Vai trò">
                              <span className="account-role-badge">
                                {roleNames[account.role] || account.role}
                              </span>
                            </td>
                            <td className="col-agency" data-label="Cơ quan / Đơn vị">
                              <span className="account-cell-agency">
                                {account.agencyScope || 'Chưa khai báo phạm vi'}
                              </span>
                            </td>
                            <td className="col-validity" data-label="Thời hạn hiệu lực">
                              <span className="account-cell-validity">
                                {account.validFrom || 'Không giới hạn'} <small>đến</small>{' '}
                                {account.validUntil || 'Không giới hạn'}
                              </span>
                            </td>
                            <td className="col-status" data-label="Trạng thái">
                              <span
                                className={`request-status ${
                                  state === 'Đang hiệu lực'
                                    ? 'request-approved'
                                    : state === 'Hết thời hạn' || !account.active
                                      ? 'request-rejected'
                                      : 'request-pending'
                                }`}
                              >
                                {!account.active ? 'Tạm ngưng' : state}
                              </span>
                            </td>
                            <td className="col-actions" data-label="Thao tác">
                              <div className="managed-user-actions">
                                <button
                                  type="button"
                                  className="button secondary compact-btn"
                                  disabled={
                                    busy ||
                                    pendingChange ||
                                    account.id === actor.id ||
                                    (!isSystemAdmin && account.role === 'admin')
                                  }
                                  onClick={() =>
                                    isEditing ? setEditing(null) : beginAccountChange(account)
                                  }
                                >
                                  {pendingChange
                                    ? 'Chờ duyệt'
                                    : isEditing
                                      ? 'Đóng'
                                      : 'Điều chỉnh'}
                                </button>
                                {account.active && (
                                  <button
                                    type="button"
                                    className="button secondary compact-btn"
                                    disabled={
                                      busy ||
                                      pendingChange ||
                                      account.id === actor.id ||
                                      (!isSystemAdmin && account.role === 'admin')
                                    }
                                    onClick={() => beginAccountChange(account, false)}
                                  >
                                    Tạm ngưng
                                  </button>
                                )}
                                {isSystemAdmin && account.maySignStop && (
                                  <button
                                    type="button"
                                    className="button secondary compact-btn"
                                    disabled={busy}
                                    onClick={() => {
                                      setRevokingAccount(account)
                                      setRevokeReason('')
                                      setError('')
                                    }}
                                  >
                                    Thu hồi ký Mẫu 06
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isEditing && (
                            <tr className="account-edit-row">
                              <td colSpan={7}>
                                <form className="account-change-form" onSubmit={submitAccountChange}>
                                  <div className="account-change-form-title">
                                    <b>
                                      Đề nghị thay đổi quyền truy cập · {account.name} (
                                      {account.email})
                                    </b>
                                    <button
                                      type="button"
                                      className="text-button"
                                      onClick={() => setEditing(null)}
                                    >
                                      Đóng
                                    </button>
                                  </div>
                                  <div className="form-grid account-form">
                                    <label>
                                      <span>Vai trò</span>
                                      <select name="role" defaultValue={account.role} required>
                                        {Object.entries(roleNames)
                                          .filter(([role]) => isSystemAdmin || role !== 'admin')
                                          .map(([role, label]) => (
                                            <option key={role} value={role}>
                                              {label}
                                            </option>
                                          ))}
                                      </select>
                                    </label>
                                    <label>
                                      <span>Cơ quan / phạm vi</span>
                                      <input
                                        name="agencyScope"
                                        defaultValue={account.agencyScope}
                                        maxLength={180}
                                        required
                                        readOnly={!isSystemAdmin}
                                      />
                                    </label>
                                    <label>
                                      <span>Hiệu lực từ</span>
                                      <input
                                        name="validFrom"
                                        type="date"
                                        defaultValue={account.validFrom}
                                      />
                                    </label>
                                    <label>
                                      <span>Hiệu lực đến</span>
                                      <input
                                        name="validUntil"
                                        type="date"
                                        defaultValue={account.validUntil}
                                      />
                                    </label>
                                    {isSystemAdmin && account.role !== 'admin' && (
                                      <label className="span-two check-row">
                                        <input
                                          name="canManageAgencyAccounts"
                                          type="checkbox"
                                          defaultChecked={account.canManageAgencyAccounts}
                                        />
                                        <span>
                                          Quản lý tài khoản cán bộ trong cơ quan được giao
                                        </span>
                                      </label>
                                    )}
                                    <label className="span-two check-row">
                                      <input
                                        type="checkbox"
                                        checked={proposedActive}
                                        onChange={e => setProposedActive(e.target.checked)}
                                      />
                                      <span>Tài khoản được kích hoạt sau khi duyệt</span>
                                    </label>
                                    <label className="span-two">
                                      <span>Căn cứ điều chỉnh</span>
                                      <textarea
                                        name="reason"
                                        rows={2}
                                        minLength={12}
                                        maxLength={1200}
                                        placeholder="Quyết định điều động, phân công, chấm dứt nhiệm vụ hoặc căn cứ nghiệp vụ"
                                        required
                                      />
                                    </label>
                                    <div className="form-actions span-two">
                                      <button
                                        type="button"
                                        className="button secondary"
                                        onClick={() => setEditing(null)}
                                      >
                                        Hủy
                                      </button>
                                      <button className="button primary" disabled={busy}>
                                        {busy ? 'Đang gửi…' : 'Gửi người duyệt'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="account-pagination">
                <div className="account-pagination-info">
                  <span>
                    Hiển thị{' '}
                    <b className="tabular-nums">
                      {(currentAccountPage - 1) * accountPageSize + 1}–
                      {Math.min(currentAccountPage * accountPageSize, visibleUsers.length)}
                    </b>{' '}
                    / <b className="tabular-nums">{visibleUsers.length.toLocaleString('vi-VN')}</b>{' '}
                    tài khoản
                  </span>
                  <label className="account-pagesize-select">
                    <span>Số dòng:</span>
                    <select
                      value={accountPageSize}
                      onChange={e => {
                        setAccountPageSize(Number(e.target.value))
                        setAccountPage(1)
                      }}
                    >
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                      <option value={100}>100 / trang</option>
                      <option value={1000}>Tất cả</option>
                    </select>
                  </label>
                </div>

                {accountPageCount > 1 && (
                  <div className="account-pagination-controls">
                    <button
                      type="button"
                      className="button secondary compact-btn"
                      disabled={currentAccountPage <= 1}
                      onClick={() => setAccountPage(1)}
                    >
                      « Đầu
                    </button>
                    <button
                      type="button"
                      className="button secondary compact-btn"
                      disabled={currentAccountPage <= 1}
                      onClick={() => setAccountPage(p => Math.max(1, p - 1))}
                    >
                      ‹ Trước
                    </button>
                    <span className="account-page-indicator">
                      Trang <b>{currentAccountPage}</b> / {accountPageCount}
                    </span>
                    <button
                      type="button"
                      className="button secondary compact-btn"
                      disabled={currentAccountPage >= accountPageCount}
                      onClick={() => setAccountPage(p => Math.min(accountPageCount, p + 1))}
                    >
                      Sau ›
                    </button>
                    <button
                      type="button"
                      className="button secondary compact-btn"
                      disabled={currentAccountPage >= accountPageCount}
                      onClick={() => setAccountPage(accountPageCount)}
                    >
                      Cuối »
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">Không tìm thấy tài khoản phù hợp với điều kiện lọc.</div>
          )}
        </section>
      )}

      {activeTab === 'requests' && (
        <div
          id="account-panel-requests"
          role="tabpanel"
          aria-labelledby="account-tab-requests"
          className="account-Secondary-grid"
        >
          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>Đề nghị cấp quyền mới</h2>
                <p>Lịch sử lập và phê duyệt tài khoản mới.</p>
              </div>
              <span className="count-chip">
                {requests.filter(r => r.status === 'PENDING').length} chờ duyệt
              </span>
            </div>
            {requests.length ? (
              <div className="access-request-list">
                {requests.map(requestItem => (
                  <article className="access-request-card" key={requestItem.id}>
                    <div className="access-request-top">
                      <div>
                        <b>{requestItem.name}</b>
                        <small>
                          {requestItem.email} · {roleNames[requestItem.role] || requestItem.role}
                        </small>
                      </div>
                      <span className={`request-status request-${requestItem.status.toLowerCase()}`}>
                        {requestItem.status === 'PENDING'
                          ? 'Chờ duyệt'
                          : requestItem.status === 'APPROVED'
                            ? 'Đã duyệt'
                            : 'Từ chối'}
                      </span>
                    </div>
                    <div className="access-request-facts">
                      <span>
                        <small>Cơ quan</small>
                        <b>{requestItem.agencyScope}</b>
                      </span>
                      <span>
                        <small>Thời hạn</small>
                        <b>
                          {requestItem.validFrom} – {requestItem.validUntil}
                        </b>
                      </span>
                      <span>
                        <small>Người đề nghị</small>
                        <b>{requestItem.requestedBy}</b>
                      </span>
                      {requestItem.reviewedBy && (
                        <span>
                          <small>Người duyệt</small>
                          <b>{requestItem.reviewedBy}</b>
                        </span>
                      )}
                    </div>
                    {requestItem.maySignStop && (
                      <p className="request-reason">
                        <b>Đề nghị quyền ký Mẫu 06:</b> {requestItem.signingAuthorityRef}.
                      </p>
                    )}
                    <p className="request-reason">
                      <b>Căn cứ:</b> {requestItem.reason}
                    </p>
                    {requestItem.status === 'PENDING' && requestItem.requestedById === actor.id && (
                      <p className="form-notice">
                        Bạn đã lập đề nghị này; cần một quản trị viên khác xử lý.
                      </p>
                    )}
                    {!isSystemAdmin &&
                      requestItem.status === 'PENDING' &&
                      requestItem.requestedById !== actor.id && (
                        <p className="form-notice">
                          Đề nghị đang chờ quản trị viên hệ thống duyệt.
                        </p>
                      )}
                    {isSystemAdmin &&
                      requestItem.status === 'PENDING' &&
                      requestItem.requestedById !== actor.id && (
                        <div className="request-review">
                          {requestItem.maySignStop && (
                            <label className="check-row">
                              <input
                                type="checkbox"
                                checked={signingAuthorityChecks[requestItem.id] === true}
                                onChange={e =>
                                  setSigningAuthorityChecks(current => ({
                                    ...current,
                                    [requestItem.id]: e.target.checked,
                                  }))
                                }
                              />
                              <span>
                                Đã đối chiếu văn bản phân công thẩm quyền ký Mẫu 06
                              </span>
                            </label>
                          )}
                          <label>
                            <span>Ý kiến duyệt / căn cứ từ chối</span>
                            <textarea
                              value={reviewNotes[requestItem.id] || ''}
                              onChange={e =>
                                setReviewNotes(current => ({
                                  ...current,
                                  [requestItem.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              maxLength={1200}
                            />
                          </label>
                          <div className="form-actions">
                            <button
                              type="button"
                              className="button secondary"
                              disabled={reviewing === requestItem.id}
                              onClick={() => void reviewRequest(requestItem, 'reject')}
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              className="button primary"
                              disabled={reviewing === requestItem.id}
                              onClick={() => void reviewRequest(requestItem, 'approve')}
                            >
                              {reviewing === requestItem.id ? 'Đang xử lý…' : 'Duyệt quyền'}
                            </button>
                          </div>
                        </div>
                      )}
                    {requestItem.status === 'REJECTED' && requestItem.reviewNote && (
                      <p className="request-reason">
                        <b>Căn cứ từ chối:</b> {requestItem.reviewNote}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">Chưa có đề nghị cấp quyền mới.</div>
            )}
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>Đề nghị điều chỉnh tài khoản</h2>
                <p>Thay đổi vai trò, thời hạn hoặc trạng thái hoạt động.</p>
              </div>
              <span className="count-chip">
                {changes.filter(change => change.status === 'PENDING').length} chờ xử lý
              </span>
            </div>
            {changes.length ? (
              <div className="access-request-list">
                {changes.map(change => (
                  <article className="access-request-card" key={change.id}>
                    <div className="access-request-top">
                      <div>
                        <b>{change.name}</b>
                        <small>{change.email}</small>
                      </div>
                      <span className={`request-status request-${change.status.toLowerCase()}`}>
                        {change.status === 'PENDING'
                          ? 'Chờ duyệt'
                          : change.status === 'APPROVED'
                            ? 'Đã áp dụng'
                            : 'Từ chối'}
                      </span>
                    </div>
                    <div className="account-change-diff">
                      <span>
                        <small>Quyền hiện tại</small>
                        <b>{accessSummary(change.before)}</b>
                      </span>
                      <span>
                        <small>Đề nghị mới</small>
                        <b>{accessSummary(change.proposed)}</b>
                      </span>
                    </div>
                    <p className="request-reason">
                      <b>Căn cứ:</b> {change.reason} · <b>Người lập:</b> {change.requestedBy}
                    </p>
                    {change.status === 'PENDING' &&
                      (change.requestedById === actor.id || change.userId === actor.id) && (
                        <p className="form-notice">
                          Người lập và chủ tài khoản không được duyệt đề nghị này.
                        </p>
                      )}
                    {!isSystemAdmin &&
                      change.status === 'PENDING' &&
                      change.requestedById !== actor.id &&
                      change.userId !== actor.id && (
                        <p className="form-notice">
                          Đề nghị đang chờ quản trị viên hệ thống duyệt.
                        </p>
                      )}
                    {isSystemAdmin &&
                      change.status === 'PENDING' &&
                      change.requestedById !== actor.id &&
                      change.userId !== actor.id && (
                        <div className="request-review">
                          <label>
                            <span>Ý kiến duyệt / căn cứ từ chối</span>
                            <textarea
                              value={reviewNotes[change.id] || ''}
                              onChange={e =>
                                setReviewNotes(current => ({
                                  ...current,
                                  [change.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              maxLength={1200}
                            />
                          </label>
                          <div className="form-actions">
                            <button
                              type="button"
                              className="button secondary"
                              disabled={reviewing === change.id}
                              onClick={() => void reviewAccountChange(change, 'reject')}
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              className="button primary"
                              disabled={reviewing === change.id}
                              onClick={() => void reviewAccountChange(change, 'approve')}
                            >
                              {reviewing === change.id ? 'Đang xử lý…' : 'Duyệt và áp dụng'}
                            </button>
                          </div>
                        </div>
                      )}
                    {change.reviewedBy && (
                      <p className="request-reason">
                        <b>Người xử lý:</b> {change.reviewedBy}
                        {change.reviewNote && (
                          <>
                            {' '}
                            · <b>Ý kiến:</b> {change.reviewNote}
                          </>
                        )}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">Chưa có lịch sử điều chỉnh tài khoản.</div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function ReportDateInput({
  label,
  initialValue,
  onChange,
}: {
  label: string
  initialValue: string
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(() => reportDateDisplay(initialValue))
  const [invalid, setInvalid] = useState(false)

  function update(next: string) {
    setDraft(next)
    setInvalid(false)
    const parsed = parseReportDate(next)
    if (parsed !== null) onChange(parsed)
  }

  return (
    <label className="report-date-field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder="dd/mm/yyyy"
        value={draft}
        aria-invalid={invalid}
        onChange={event => update(event.target.value)}
        onBlur={() => {
          const parsed = parseReportDate(draft)
          setInvalid(parsed === null)
          if (parsed !== null) onChange(parsed)
        }}
      />
      <small>
        {invalid ? 'Nhập ngày theo dạng ngày/tháng/năm hợp lệ.' : 'Định dạng ngày/tháng/năm'}
      </small>
    </label>
  )
}

function ReportDateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return <ReportDateInput key={value} label={label} initialValue={value} onChange={onChange} />
}

export function AdministrativeReports({
  data,
  onOpenQueue,
}: {
  data: Bootstrap
  onOpenQueue: (focus: QueueFocus) => void
}) {
  type Report = {
    reportKind: string
    officialForm: boolean
    agency: string
    from: string
    to: string
    total: number
    sampleTotal: number
    realTotal: number
    storedTotal: number
    agencies: string[]
    byAgency: { name: string; count: number }[]
    byStatus: { name: string; count: number }[]
    byProcedure: { name: string; count: number }[]
    byAgencyStatus: { agency: string; status: string; count: number }[]
    index766?: Index766Summary
    periodBalance?: PeriodBalanceSummary
  }

  const [report, setReport] = useState<Report | null>(null)
  const [loadedSuffix, setLoadedSuffix] = useState<string | null>(null)
  const [agency, setAgency] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'agency' | 'procedure'>('agency')

  const query = new URLSearchParams()
  if (agency) query.set('agency', agency)
  if (from) query.set('from', from)
  if (to) query.set('to', to)
  const suffix = query.toString() ? `?${query.toString()}` : ''

  useEffect(() => {
    const controller = new AbortController()
    api<Report>(`/api/reporting/summary${suffix}`, undefined, controller.signal)
      .then(value => {
        if (!controller.signal.aborted) {
          setReport(value)
          setError('')
          setLoadedSuffix(suffix)
        }
      })
      .catch(cause => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(cause instanceof Error ? cause.message : 'Không tải được báo cáo.')
        setLoadedSuffix(suffix)
      })
    return () => controller.abort()
  }, [suffix])

  const loading = loadedSuffix !== suffix
  const subtitle = `${agency || 'Tất cả cơ quan'} · ${from ? reportDateDisplay(from) : 'Từ đầu dữ liệu'} đến ${to ? reportDateDisplay(to) : 'hiện tại'}`

  const filteredCases = useMemo(
    () =>
      data.cases.filter(
        item =>
          !agency ||
          (item.agencyScope || item.receivingAgency || item.procedure?.agency || '') === agency,
      ),
    [agency, data.cases],
  )

  const resolved766 = useMemo(
    () =>
      computeIndex766(
        filteredCases,
        data.procedures,
        data.feedback || [],
        report?.index766 || data.stats.index766,
      ),
    [data.feedback, data.procedures, data.stats.index766, filteredCases, report?.index766],
  )

  const resolvedBalance = useMemo(
    () =>
      computePeriodBalance(
        filteredCases,
        from,
        to,
        report?.periodBalance || (!from && !to && !agency ? data.stats.periodBalance : undefined),
      ),
    [agency, data.stats.periodBalance, filteredCases, from, report?.periodBalance, to],
  )

  const reportTabs: ('agency' | 'procedure')[] = ['agency', 'procedure']

  return (
    <div className="report-workspace">
      <section className="panel report-filters">
        <label className="report-agency-field" htmlFor="report-agency-select">
          <span>Cơ quan tiếp nhận</span>
          <select
            id="report-agency-select"
            value={agency}
            onChange={e => setAgency(e.target.value)}
          >
            <option value="">Tất cả cơ quan</option>
            {(report?.agencies || []).map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <ReportDateField label="Từ ngày" value={from} onChange={setFrom} />
        <ReportDateField label="Đến ngày" value={to} onChange={setTo} />
        <div className="report-filter-actions">
          <ReportExportButtons disabled={!report || loading || !!error} getReport={() => ({
            title: 'Báo cáo vận hành hồ sơ', subtitle, filename: 'bao-cao-van-hanh-ho-so',
            headers: ['Nhóm tổng hợp', 'Đơn vị / Chỉ tiêu', 'Số lượng / Giá trị'],
            rows: [
              ['Tổng quan', 'Tổng hồ sơ trong kỳ', String(report?.total ?? 0)],
              ['Cân đối kỳ', 'Tồn đầu kỳ', String(resolvedBalance.opening)],
              ['Cân đối kỳ', 'Nhận trong kỳ', String(resolvedBalance.received)],
              ['Cân đối kỳ', 'Giải quyết đúng hạn', String(resolvedBalance.resolvedOnTime)],
              ['Cân đối kỳ', 'Giải quyết quá hạn', String(resolvedBalance.resolvedOverdue)],
              ['Cân đối kỳ', 'Dừng / Từ chối', String(resolvedBalance.stoppedOrRejected)],
              ['Cân đối kỳ', 'Tồn cuối kỳ', String(resolvedBalance.closing)],
              ['Chỉ số 766', 'Tổng điểm', String(resolved766.total)],
              ...((report?.byAgency || []).map(row => ['Theo cơ quan', row.name, String(row.count)])),
              ...((report?.byStatus || []).map(row => ['Theo trạng thái', row.name, String(row.count)])),
              ...((report?.byProcedure || []).map(row => ['Theo thủ tục', row.name, String(row.count)])),
              ...((report?.byAgencyStatus || []).map(row => ['Cơ quan và trạng thái', `${row.agency} · ${row.status}`, String(row.count)])),
            ],
          })} />
        </div>
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loading && (
        <section className="panel">
          <p role="status">Đang tổng hợp dữ liệu…</p>
        </section>
      )}

      {report && !loading && (
        <>
          <section className="metric-grid report-metrics">
            <MetricCard
              label="Tổng số hồ sơ"
              value={report.total}
              note="Hồ sơ tiếp nhận và theo dõi trong kỳ"
              tone="navy"
            />
            <MetricCard
              label="Đơn vị có hồ sơ"
              value={report.byAgency.length}
              note="Cơ quan tiếp nhận trong kỳ"
              tone="blue"
            />
            <MetricCard
              label="Nhóm trạng thái"
              value={report.byStatus.length}
              note="Trạng thái xử lý hiện hành"
              tone="green"
            />
          </section>

          <PeriodBalancePanel balance={resolvedBalance} subtitle={subtitle} />
          <Index766Panel summary={resolved766} subtitle={subtitle} />

          <div
            className="staff-module-tabs"
            role="tablist"
            aria-label="Chế độ xem báo cáo"
            onKeyDown={event => handleTabArrows(event, reportTabs, tab, setTab)}
          >
            <button
              type="button"
              id="report-tab-agency"
              role="tab"
              tabIndex={tab === 'agency' ? 0 : -1}
              aria-selected={tab === 'agency'}
              aria-controls="report-panel-agency"
              className={`staff-module-tab${tab === 'agency' ? ' active' : ''}`}
              onClick={() => setTab('agency')}
            >
              <span>Theo cơ quan &amp; trạng thái</span>
              <b className="tabular-nums">{report.byAgencyStatus.length}</b>
            </button>
            <button
              type="button"
              id="report-tab-procedure"
              role="tab"
              tabIndex={tab === 'procedure' ? 0 : -1}
              aria-selected={tab === 'procedure'}
              aria-controls="report-panel-procedure"
              className={`staff-module-tab${tab === 'procedure' ? ' active' : ''}`}
              onClick={() => setTab('procedure')}
            >
              <span>Theo thủ tục hành chính</span>
              <b className="tabular-nums">{report.byProcedure.length}</b>
            </button>
          </div>

          {tab === 'agency' ? (
            <section
              id="report-panel-agency"
              role="tabpanel"
              aria-labelledby="report-tab-agency"
              className="panel report-table-panel"
            >
              <PanelHeading
                title="Tổng hợp hồ sơ theo cơ quan và trạng thái"
                description={subtitle}
              />
              {report.byAgencyStatus.length ? (
                <div className="table-scroll report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Cơ quan tiếp nhận</th>
                        <th>Trạng thái hiện tại</th>
                        <th>Số hồ sơ</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byAgencyStatus.map(row => {
                        const statuses = Object.entries(data.statusLabels)
                          .filter(([, label]) => label === row.status)
                          .map(([code]) => code)
                        return (
                          <tr key={`${row.agency}-${row.status}`}>
                            <td data-label="Cơ quan tiếp nhận">{row.agency}</td>
                            <td data-label="Trạng thái hiện tại">{row.status}</td>
                            <td data-label="Số hồ sơ">
                              <b className="tabular-nums">{row.count}</b>
                            </td>
                            <td data-label="Thao tác">
                              <button
                                type="button"
                                className="report-drilldown-link"
                                onClick={() =>
                                  onOpenQueue({
                                    agencyFilter: row.agency,
                                    statuses,
                                    createdFrom: from,
                                    createdTo: to,
                                    label: `${row.agency} · ${row.status}`,
                                  })
                                }
                              >
                                Mở danh sách →
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="report-compact-empty">
                  Chưa có dòng tổng hợp theo cơ quan và trạng thái trong điều kiện đã chọn.
                </div>
              )}
            </section>
          ) : (
            <section
              id="report-panel-procedure"
              role="tabpanel"
              aria-labelledby="report-tab-procedure"
              className="panel report-table-panel"
            >
              <PanelHeading
                title="Phân bố hồ sơ theo thủ tục hành chính"
                description="Chọn một dòng để mở danh sách hồ sơ tương ứng."
              />
              {report.byProcedure.length ? (
                <div className="table-scroll report-table-wrap">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Mã và tên thủ tục</th>
                        <th>Số hồ sơ</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byProcedure.map(row => {
                        const code = row.name.split(' · ')[0]
                        return (
                          <tr key={row.name}>
                            <td data-label="Mã và tên thủ tục">{row.name}</td>
                            <td data-label="Số hồ sơ">
                              <b className="tabular-nums">{row.count}</b>
                            </td>
                            <td data-label="Thao tác">
                              <button
                                type="button"
                                className="report-drilldown-link"
                                onClick={() =>
                                  onOpenQueue({
                                    procedureCode: code,
                                    createdFrom: from,
                                    createdTo: to,
                                    label: row.name,
                                  })
                                }
                              >
                                Mở danh sách →
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="report-compact-empty">
                  Chưa có hồ sơ để phân bổ theo thủ tục.
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}

export function NewsManagement({ onNotice }: { onNotice: (message: string) => void }) {
  const categories = [
    'Hoạt động của Trung tâm',
    'Hành chính xung kích',
    'Cải cách hành chính',
    'Chuyển đổi số',
    'Tiện ích công dân',
  ]
  const images = [
    'news-birth.jpg',
    'news-security.jpg',
    'news-support.jpg',
    'news-evening.jpg',
    'news-technology.jpg',
    'news-education.jpg',
    'news-receipt.png',
    'news-copy.jpg',
  ]

  const [articles, setArticles] = useState<ManagedNews[]>([])
  const [history, setHistory] = useState<
    { id: number; news_id: string; actor_name: string; action: string; created_at: string }[]
  >([])
  const [editing, setEditing] = useState<ManagedNews | null>(null)
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const result = await api<{
      articles: ManagedNews[]
      history: {
        id: number
        news_id: string
        actor_name: string
        action: string
        created_at: string
      }[]
    }>('/api/news')
    setArticles(result.articles)
    setHistory(result.history)
  }

  useEffect(() => {
    const controller = new AbortController()
    api<{
      articles: ManagedNews[]
      history: {
        id: number
        news_id: string
        actor_name: string
        action: string
        created_at: string
      }[]
    }>('/api/news', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setArticles(result.articles)
          setHistory(result.history)
        }
      })
      .catch(cause => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(cause instanceof Error ? cause.message : 'Không tải được tin.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  function newArticle() {
    setEditing({
      id: '',
      title: '',
      summary: '',
      body: '',
      category: categories[0],
      image: '',
      sourceUrl: '',
      featured: false,
      status: 'DRAFT',
      publishedAt: '',
      version: 0,
      updatedAt: '',
    })
    setError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const action =
      submitter instanceof HTMLButtonElement ? submitter.getAttribute('value') || 'save' : 'save'
    const articleId = String(data.get('id') || '')
    const payload = {
      action,
      id: articleId || undefined,
      expectedVersion: articleId ? Number(data.get('version')) : undefined,
      title: data.get('title'),
      summary: data.get('summary'),
      body: data.get('body'),
      category: data.get('category'),
      image: data.get('image'),
      sourceUrl: data.get('sourceUrl'),
      featured: data.get('featured') === 'on',
    }
    setBusy(true)
    setError('')
    try {
      const result = await api<{ article: ManagedNews }>('/api/news', payload)
      await refresh()
      setEditing(result.article)
      onNotice(
        result.article.status === 'PUBLISHED'
          ? 'Tin đã được xuất bản/cập nhật trên trang chủ.'
          : 'Bản nháp đã được lưu.',
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được tin.')
    } finally {
      setBusy(false)
    }
  }

  async function changeStatus(article: ManagedNews, action: 'archive' | 'draft') {
    if (
      action === 'archive' &&
      !window.confirm(`Lưu trữ tin “${article.title}”? Tin sẽ không còn hiển thị công khai.`)
    ) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api<{ article: ManagedNews }>('/api/news', {
        action,
        id: article.id,
        expectedVersion: article.version,
      })
      await refresh()
      setEditing(result.article)
      onNotice(action === 'archive' ? 'Đã lưu trữ tin.' : 'Đã chuyển tin về bản nháp.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không cập nhật được trạng thái tin.')
    } finally {
      setBusy(false)
    }
  }

  const shown = articles.filter(
    item =>
      (filter === 'ALL' || item.status === filter) &&
      `${item.title} ${item.summary} ${item.category}`
        .toLocaleLowerCase('vi')
        .includes(query.toLocaleLowerCase('vi')),
  )

  const stats = {
    total: articles.length,
    draft: articles.filter(a => a.status === 'DRAFT').length,
    published: articles.filter(a => a.status === 'PUBLISHED').length,
    archived: articles.filter(a => a.status === 'ARCHIVED').length,
  }

  return (
    <div className="news-management">
      <div className="news-management-toolbar">
        <div className="news-management-stats">
          <div>
            <b className="tabular-nums">{stats.total}</b>
            <span>Tổng số bài</span>
          </div>
          <div>
            <b className="tabular-nums">{stats.published}</b>
            <span>Đang công khai</span>
          </div>
          <div>
            <b className="tabular-nums">{stats.draft}</b>
            <span>Bản nháp</span>
          </div>
          <div>
            <b className="tabular-nums">{stats.archived}</b>
            <span>Đã lưu trữ</span>
          </div>
        </div>
        <button type="button" className="button primary" onClick={newArticle}>
          ＋ Soạn bài viết mới
        </button>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="news-management-layout">
        <section className="news-list-panel">
          <div className="news-list-controls">
            <label>
              <span>Tìm bài viết</span>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tiêu đề, tóm tắt, chuyên mục…"
              />
            </label>
            <label>
              <span>Trạng thái</span>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="PUBLISHED">Đang công khai</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p role="status">Đang tải danh sách tin…</p>
          ) : shown.length ? (
            <div className="managed-news-list">
              {shown.map(article => (
                <article
                  className={`managed-news-row${editing?.id === article.id ? ' active' : ''}`}
                  key={article.id}
                >
                  <button
                    type="button"
                    className="managed-news-select"
                    onClick={() => {
                      setEditing(article)
                      setError('')
                    }}
                  >
                    <span className={`news-status news-status-${article.status.toLowerCase()}`}>
                      {article.status === 'PUBLISHED'
                        ? 'Đang công khai'
                        : article.status === 'DRAFT'
                          ? 'Bản nháp'
                          : 'Đã lưu trữ'}
                    </span>
                    <b>{article.title}</b>
                    <small>
                      {article.category} · {article.date || toDate(article.updatedAt)}
                    </small>
                  </button>
                  <div className="managed-news-actions">
                    {article.status === 'PUBLISHED' ? (
                      <button
                        type="button"
                        className="text-button"
                        disabled={busy}
                        onClick={() => void changeStatus(article, 'archive')}
                      >
                        Lưu trữ
                      </button>
                    ) : article.status === 'ARCHIVED' ? (
                      <button
                        type="button"
                        className="text-button"
                        disabled={busy}
                        onClick={() => void changeStatus(article, 'draft')}
                      >
                        Khôi phục nháp
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">Không có bài viết phù hợp.</div>
          )}
        </section>

        <section className="news-editor-panel">
          {editing ? (
            <>
              <div className="news-editor-heading">
                <div>
                  <h2>{editing.id ? 'Hiệu chỉnh bài viết' : 'Soạn bài viết mới'}</h2>
                </div>
                {editing.id && (
                  <span className={`news-status news-status-${editing.status.toLowerCase()}`}>
                    {editing.status === 'PUBLISHED'
                      ? 'Đang công khai'
                      : editing.status === 'DRAFT'
                        ? 'Bản nháp'
                        : 'Đã lưu trữ'}
                  </span>
                )}
              </div>
              <form
                className="news-editor-form"
                onSubmit={submit}
                key={`${editing.id}:${editing.version}`}
              >
                <input type="hidden" name="id" value={editing.id} />
                <input type="hidden" name="version" value={editing.version} />
                <label>
                  <span>
                    Tiêu đề <b className="required-mark">*</b>
                  </span>
                  <input
                    name="title"
                    defaultValue={editing.title}
                    required
                    minLength={8}
                    maxLength={180}
                  />
                </label>
                <label>
                  <span>
                    Tóm tắt <b className="required-mark">*</b>
                  </span>
                  <textarea
                    name="summary"
                    defaultValue={editing.summary}
                    rows={2}
                    required
                    minLength={20}
                    maxLength={500}
                  />
                </label>
                <label>
                  <span>
                    Nội dung <b className="required-mark">*</b>
                  </span>
                  <textarea
                    name="body"
                    defaultValue={editing.body}
                    rows={8}
                    required
                    minLength={30}
                    maxLength={20000}
                    placeholder="Mỗi đoạn cách nhau bằng một dòng trống."
                  />
                </label>
                <div className="news-editor-grid">
                  <label>
                    <span>Chuyên mục</span>
                    <select name="category" defaultValue={editing.category}>
                      {categories.map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Ảnh đại diện</span>
                    <select name="image" defaultValue={editing.image}>
                      <option value="">Không dùng ảnh</option>
                      {images.map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  <span>Nguồn tin chính thức (.gov.vn)</span>
                  <input
                    name="sourceUrl"
                    type="url"
                    defaultValue={editing.sourceUrl}
                    maxLength={600}
                    placeholder="https://…gov.vn/…"
                  />
                </label>
                <label className="news-featured-check">
                  <input type="checkbox" name="featured" defaultChecked={editing.featured} />
                  <span>Đưa lên vị trí tin nổi bật</span>
                </label>
                <div className="news-editor-actions">
                  <button className="button secondary" type="submit" value="save" disabled={busy}>
                    {busy ? 'Đang lưu…' : 'Lưu bản nháp'}
                  </button>
                  <button className="button primary" type="submit" value="publish" disabled={busy}>
                    {editing.status === 'PUBLISHED' ? 'Cập nhật công khai' : 'Xuất bản tin'}
                  </button>
                </div>
                {editing.id && (
                  <small>
                    Phiên bản {editing.version} · Cập nhật {toDate(editing.updatedAt)}
                  </small>
                )}
              </form>
            </>
          ) : (
            <div className="news-editor-empty">
              <h2>Chọn bài viết để biên tập</h2>
              <p>Chọn một bài viết ở danh sách bên trái hoặc bấm “Soạn bài viết mới”.</p>
            </div>
          )}
        </section>
      </div>

      <section className="news-audit-panel">
        <h2>Nhật ký biên tập gần đây</h2>
        {history.length ? (
          <div>
            {history.slice(0, 8).map(item => (
              <p key={item.id}>
                <b>{item.actor_name}</b> ·{' '}
                {item.action === 'PUBLISH'
                  ? 'xuất bản'
                  : item.action === 'ARCHIVE'
                    ? 'lưu trữ'
                    : item.action === 'DRAFT'
                      ? 'chuyển về bản nháp'
                      : item.action === 'CREATE_DRAFT'
                        ? 'tạo bản nháp'
                        : 'cập nhật'}{' '}
                ·{' '}
                {articles.find(article => article.id === item.news_id)?.title || 'Tin đã lưu trữ'}{' '}
                <time>{toDate(item.created_at)}</time>
              </p>
            ))}
          </div>
        ) : (
          <p>Chưa có thao tác biên tập.</p>
        )}
      </section>
    </div>
  )
}

export function AdminOverview({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [accounts, setAccounts] = useState<ManagedUser[]>([])
  const [requests, setRequests] = useState<StaffAccessRequest[]>([])
  const [changes, setChanges] = useState<StaffAccountChange[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [today] = useState(() =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  )
  const expiryLimit = useMemo(() => {
    const date = new Date(`${today}T00:00:00+07:00`)
    date.setUTCDate(date.getUTCDate() + 30)
    return date.toISOString().slice(0, 10)
  }, [today])

  useEffect(() => {
    const controller = new AbortController()
    api<{
      users: ManagedUser[]
      accessRequests: StaffAccessRequest[]
      accountChanges: StaffAccountChange[]
    }>('/api/users', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setAccounts(result.users)
          setRequests(result.accessRequests)
          setChanges(result.accountChanges)
        }
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setError(reason instanceof Error ? reason.message : 'Không tải được số liệu quản trị.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const validNow = (account: ManagedUser) =>
    account.active &&
    (!account.validFrom || account.validFrom <= today) &&
    (!account.validUntil || account.validUntil >= today)

  const activeAccounts = accounts.filter(validNow)
  const expiring = accounts.filter(
    account =>
      validNow(account) &&
      account.validUntil &&
      account.validUntil >= today &&
      account.validUntil <= expiryLimit,
  )

  const pending = [
    ...requests
      .filter(item => item.status === 'PENDING')
      .map(item => ({
        id: item.id,
        name: item.name,
        detail: `${roleNames[item.role] || item.role} · ${item.agencyScope}`,
        at: item.createdAt,
        kind: 'Cấp tài khoản',
      })),
    ...changes
      .filter(item => item.status === 'PENDING')
      .map(item => ({
        id: item.id,
        name: item.name,
        detail: item.reason,
        at: item.createdAt,
        kind: 'Điều chỉnh quyền',
      })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  const roleBreakdown = Object.entries(roleNames)
    .filter(([role]) => role !== 'citizen')
    .map(([role, label]) => ({
      role,
      label,
      count: accounts.filter(account => account.role === role).length,
    }))
    .filter(item => item.count > 0)

  const recent = [
    ...requests.map(item => ({
      id: item.id,
      name: item.name,
      detail: `${item.status === 'PENDING' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'} · cấp ${roleNames[item.role] || item.role}`,
      at: item.reviewedAt || item.createdAt,
    })),
    ...changes.map(item => ({
      id: item.id,
      name: item.name,
      detail: `${item.status === 'PENDING' ? 'Chờ duyệt' : item.status === 'APPROVED' ? 'Đã áp dụng' : 'Từ chối'} · điều chỉnh tài khoản`,
      at: item.reviewedAt || item.createdAt,
    })),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 6)

  return (
    <div className="admin-overview">
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <section className="metric-grid" aria-label="Chỉ số quản trị">
        <MetricCard
          label="Tổng tài khoản cán bộ"
          value={accounts.length}
          note="Mở danh bạ tài khoản"
          tone="navy"
          onClick={() => onNavigate('users')}
        />
        <MetricCard
          label="Đang có hiệu lực"
          value={activeAccounts.length}
          note="Đã kích hoạt và còn hạn"
          tone="blue"
          onClick={() => onNavigate('users')}
        />
        <MetricCard
          label="Sắp hết hạn (≤ 30 ngày)"
          value={expiring.length}
          note="Cần rà soát gia hạn"
          tone="amber"
          onClick={() => onNavigate('users')}
        />
        <MetricCard
          label="Đề nghị chờ duyệt"
          value={pending.length}
          note="Cấp mới hoặc điều chỉnh quyền"
          tone="red"
          onClick={() => onNavigate('users')}
        />
      </section>

      {loading && (
        <div className="panel empty-state" role="status">
          Đang tải danh sách tài khoản và lịch sử phê duyệt…
        </div>
      )}

      <div className="dashboard-columns admin-overview-grid">
        <section className="panel dashboard-panel">
          <PanelHeading
            title="Phân bổ theo vai trò nghiệp vụ"
            description="Số lượng tài khoản theo nhóm thẩm quyền."
            action={
              <button type="button" className="text-button" onClick={() => onNavigate('users')}>
                Quản lý tài khoản →
              </button>
            }
          />
          {roleBreakdown.length ? (
            <div className="admin-role-list">
              {roleBreakdown.map(item => (
                <div key={item.role}>
                  <span>{item.label}</span>
                  <b className="tabular-nums">{item.count}</b>
                  <button type="button" className="text-button" onClick={() => onNavigate('users')}>
                    Chi tiết
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !loading && <div className="empty-state compact-empty">Chưa có tài khoản cán bộ.</div>
          )}
        </section>

        <section className="panel dashboard-panel">
          <PanelHeading
            title="Đề nghị phân quyền chờ xử lý"
            description="Yêu cầu phê duyệt độc lập từ quản trị viên khác."
            action={
              <button type="button" className="text-button" onClick={() => onNavigate('users')}>
                Xử lý đề nghị →
              </button>
            }
          />
          {pending.length ? (
            <div className="admin-review-list">
              {pending.slice(0, 6).map(item => (
                <div key={`${item.kind}-${item.id}`}>
                  <span>
                    <b>{item.name}</b>
                    <small>
                      {item.kind} · {item.detail}
                    </small>
                  </span>
                  <time>{toDate(item.at)}</time>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="empty-state compact-empty">Không có đề nghị đang chờ duyệt.</div>
            )
          )}
        </section>
      </div>

      <div className="dashboard-columns admin-overview-grid">
        <section className="panel dashboard-panel">
          <PanelHeading
            title="Tài khoản sắp hết thời hạn"
            description="Trong vòng 30 ngày tới."
            action={
              <button type="button" className="text-button" onClick={() => onNavigate('users')}>
                Gia hạn →
              </button>
            }
          />
          {expiring.length ? (
            <div className="admin-expiry-list">
              {expiring.map(account => (
                <div key={account.id}>
                  <span>
                    <b>{account.name}</b>
                    <small>
                      {account.email} · {account.agencyScope}
                    </small>
                  </span>
                  <time>Hết hạn {toDate(account.validUntil)}</time>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="empty-state compact-empty">
                Không có tài khoản hết hạn trong 30 ngày tới.
              </div>
            )
          )}
        </section>

        <section className="panel dashboard-panel">
          <PanelHeading
            title="Lịch sử cấp và điều chỉnh gần đây"
            description="Truy vết các quyết định phân quyền mới nhất."
            action={
              <button type="button" className="text-button" onClick={() => onNavigate('users')}>
                Xem tất cả →
              </button>
            }
          />
          {recent.length ? (
            <div className="admin-review-list">
              {recent.map(item => (
                <div key={item.id}>
                  <span>
                    <b>{item.name}</b>
                    <small>{item.detail}</small>
                  </span>
                  <time>{toDate(item.at)}</time>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="empty-state compact-empty">Chưa có lịch sử cấp hoặc điều chỉnh.</div>
            )
          )}
        </section>
      </div>
    </div>
  )
}

export function ProcedureCatalog({
  procedures,
  procedureCategories,
  canManage,
  onUpdated,
}: {
  procedures: Procedure[]
  procedureCategories: ProcedureCategory[]
  canManage: boolean
  onUpdated: () => Promise<void>
}) {
  type CatalogAudit = {
    actor: string
    action: string
    reason: string
    before: Record<string, unknown> | null
    after: Record<string, unknown>
    createdAt: string
  }
  type CategoryAudit = {
    actor: string
    reason: string
    before: Record<string, unknown> | null
    after: Record<string, unknown>
    createdAt: string
  }

  const [todayInHanoi] = useState(() =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  )
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [mode, setMode] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedCode, setSelectedCode] = useState(
    () => procedures[0]?.sourceCode || procedures[0]?.code || '',
  )
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

  const fields = useMemo(
    () =>
      [...new Set(procedures.map(item => item.field).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, 'vi'),
      ),
    [procedures],
  )

  const categories = useMemo(() => {
    const grouped = new Map<string, ProcedureCategory>()
    for (const category of procedureCategories) {
      grouped.set(category.key, { ...category, procedures: [] })
    }
    for (const item of procedures) {
      const key = item.categoryKey || item.field
      const existing = grouped.get(key)
      if (existing) existing.procedures.push(item)
      else {
        grouped.set(key, {
          key,
          name: item.field,
          count: 0,
          source: key.startsWith('local:') ? 'internal' : 'reference',
          procedures: [item],
          categoryEdit: item.categoryEdit,
        })
      }
    }
    for (const category of grouped.values()) category.count = category.procedures.length
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [procedures, procedureCategories])

  const visibleCategories = categories.filter(item =>
    item.name.toLocaleLowerCase('vi').includes(categoryQuery.trim().toLocaleLowerCase('vi')),
  )
  const selectedCategory =
    categories.find(item => item.key === selectedCategoryKey) || categories[0] || null
  const classifiedFieldCount = categories.filter(item => item.key !== 'Chưa phân loại').length
  const selected =
    procedures.find(item => (item.sourceCode || item.code) === selectedCode) ||
    procedures[0] ||
    null

  const categoryMemberMatches =
    selectedCategory?.procedures.filter(item =>
      `${item.code} ${item.name}`
        .toLocaleLowerCase('vi')
        .includes(memberQuery.trim().toLocaleLowerCase('vi')),
    ) || []
  const categoryMemberPages = Math.max(1, Math.ceil(categoryMemberMatches.length / memberPageSize))
  const categoryMemberShown = categoryMemberMatches.slice(
    (memberPage - 1) * memberPageSize,
    memberPage * memberPageSize,
  )

  const configuredForms = procedures.filter(item => item.submissionEnabled === true).length
  const documentReferences = procedures.filter(
    item => item.submission?.sourceStatus === 'official-document-list-only',
  ).length

  const filtered = useMemo(
    () =>
      procedures.filter(item => {
        const term = query.trim().toLocaleLowerCase('vi')
        return (
          (field === 'all' || item.field === field) &&
          (mode === 'all' || item.serviceMode === mode) &&
          (!term ||
            `${item.code} ${item.name} ${item.field} ${item.agency} ${item.level}`
              .toLocaleLowerCase('vi')
              .includes(term))
        )
      }),
    [procedures, query, field, mode],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize)

  const sourceStatus = (item: Procedure) =>
    item.localEdit
      ? 'Chỉnh sửa nội bộ · cần đối chiếu'
      : item.categoryEdit
        ? 'Lĩnh vực sửa nội bộ · cần đối chiếu'
        : item.routing?.status === 'partially-verified'
          ? 'Đối chiếu một phần'
          : item.routing?.status === 'unverified'
            ? 'Cần xác minh'
            : item.routing?.status === 'catalog-reference-only'
              ? 'Đã công bố'
              : item.verified
                ? 'Đã xác minh'
                : 'Cần xác minh'

  function selectCategory(key: string) {
    setSelectedCategoryKey(key)
    setMemberPage(1)
    setMemberQuery('')
    setSelectedMembers([])
    setTargetCategoryKey('')
    setEditingCategory(false)
    setShowCategoryHistory(false)
    setManagingMembers(false)
    setError('')
  }

  function startEdit() {
    if (!selected) return
    setError('')
    setNotice('')
    setEditing(true)
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const form = new FormData(event.currentTarget)
    const categoryKey = String(form.get('categoryKey') || '')
    const target = categories.find(item => item.key === categoryKey)
    const payload = {
      code: String(form.get('code') || ''),
      name: String(form.get('name') || ''),
      field: target?.name || '',
      categoryKey,
      level: String(form.get('level') || ''),
      agency: String(form.get('agency') || ''),
      sourceUrl: String(form.get('sourceUrl') || ''),
      checkedAt: String(form.get('checkedAt') || ''),
      reason: String(form.get('reason') || ''),
      expectedVersion: selected.localEdit?.version || 0,
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await api<{ procedure: Procedure }>(
        `/api/procedures/${encodeURIComponent(selected.sourceCode || selected.code)}/edit`,
        payload,
      )
      await onUpdated()
      setEditing(false)
      setShowHistory(false)
      setNotice('Đã lưu phiên bản danh mục nội bộ.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được danh mục.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleHistory() {
    if (!selected || !canManage) return
    if (showHistory) {
      setShowHistory(false)
      return
    }
    setError('')
    try {
      const result = await api<{ history: CatalogAudit[] }>(
        `/api/procedures/${encodeURIComponent(selected.sourceCode || selected.code)}/history`,
      )
      setHistory(result.history)
      setShowHistory(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được lịch sử danh mục.')
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCategory) return
    const values = new FormData(event.currentTarget)
    const payload = {
      sourceName: selectedCategory.key,
      name: String(values.get('name') || ''),
      sourceUrl: String(values.get('sourceUrl') || ''),
      checkedAt: String(values.get('checkedAt') || ''),
      reason: String(values.get('reason') || ''),
      expectedVersion: selectedCategory.categoryEdit?.version || 0,
    }
    setSavingCategory(true)
    setError('')
    try {
      await api('/api/procedure-categories/edit', payload)
      await onUpdated()
      setEditingCategory(false)
      setShowCategoryHistory(false)
      setNotice('Đã cập nhật tên lĩnh vực cho toàn bộ thủ tục thuộc nhóm này.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lưu được lĩnh vực.')
    } finally {
      setSavingCategory(false)
    }
  }

  async function saveNewCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setSavingNewCategory(true)
    setError('')
    try {
      const result = await api<{ category: ProcedureCategory }>(
        '/api/procedure-categories/create',
        {
          name: String(values.get('name') || ''),
          sourceUrl: String(values.get('sourceUrl') || ''),
          checkedAt: String(values.get('checkedAt') || ''),
          reason: String(values.get('reason') || ''),
        },
      )
      await onUpdated()
      selectCategory(result.category.key)
      setNewCategoryOpen(false)
      setNotice('Đã tạo lĩnh vực nội bộ.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được lĩnh vực.')
    } finally {
      setSavingNewCategory(false)
    }
  }

  async function moveSelectedMembers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedCategory || !selectedMembers.length || !targetCategoryKey) return
    const values = new FormData(event.currentTarget)
    const selectedProcedures = selectedCategory.procedures.filter(item =>
      selectedMembers.includes(item.sourceCode || item.code),
    )
    setSavingMove(true)
    setError('')
    try {
      const result = await api<{ moved: number; targetCategory: string }>(
        '/api/procedure-categories/move',
        {
          procedureCodes: selectedProcedures.map(item => item.sourceCode || item.code),
          targetCategoryKey,
          expectedVersions: Object.fromEntries(
            selectedProcedures.map(item => [
              item.sourceCode || item.code,
              item.localEdit?.version || 0,
            ]),
          ),
          sourceUrl: String(values.get('sourceUrl') || ''),
          checkedAt: String(values.get('checkedAt') || ''),
          reason: String(values.get('reason') || ''),
        },
      )
      await onUpdated()
      setSelectedMembers([])
      setManagingMembers(false)
      setShowCategoryHistory(false)
      setNotice(
        `Đã chuyển ${result.moved.toLocaleString('vi-VN')} thủ tục sang lĩnh vực “${result.targetCategory}”.`,
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không chuyển được thủ tục.')
    } finally {
      setSavingMove(false)
    }
  }

  async function toggleCategoryHistory() {
    if (!selectedCategory || !canManage) return
    if (showCategoryHistory) {
      setShowCategoryHistory(false)
      return
    }
    setError('')
    try {
      const params = new URLSearchParams({ key: selectedCategory.key })
      const result = await api<{ history: CategoryAudit[] }>(
        `/api/procedure-categories/history?${params.toString()}`,
      )
      setCategoryHistory(result.history)
      setShowCategoryHistory(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được lịch sử lĩnh vực.')
    }
  }

  function openProcedure(code: string) {
    setSelectedCode(code)
    setDetailOpen(true)
    setEditing(false)
    setShowHistory(false)
    setError('')
    setNotice('')
    document.querySelector('.workspace')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }

  function returnToCatalog() {
    setDetailOpen(false)
    setEditing(false)
    setShowHistory(false)
    setError('')
    document.querySelector('.workspace')?.scrollTo(0, 0)
    window.scrollTo(0, 0)
  }

  if (detailOpen && selected) {
    return (
      <div className="staff-catalog-detail">
        <div className="staff-catalog-detail-toolbar">
          <button
            type="button"
            className="button secondary"
            disabled={saving}
            onClick={returnToCatalog}
          >
            ← Về danh sách thủ tục
          </button>
          <div>
            {canManage && !editing && (
              <>
                <button type="button" className="button secondary" onClick={() => void toggleHistory()}>
                  {showHistory ? 'Ẩn lịch sử' : 'Lịch sử cập nhật'}
                </button>
                <button type="button" className="button primary" onClick={startEdit}>
                  Chỉnh sửa danh mục
                </button>
              </>
            )}
            <a
              className="button secondary"
              href={`/thu-tuc/${encodeURIComponent(selected.sourceCode || selected.code)}`}
              target="_blank"
              rel="noreferrer"
            >
              Mở trang công dân ↗
            </a>
          </div>
        </div>

        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
        {error && !editing && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {showHistory && canManage && (
          <section className="panel staff-procedure-audit">
            <h2>Lịch sử cập nhật danh mục</h2>
            <div className="catalog-history-list">
              {history.length ? (
                history.map(entry => (
                  <article key={`${entry.createdAt}-${entry.actor}`}>
                    <b>
                      Phiên bản {String(entry.after.version ?? '—')} · {entry.actor}
                    </b>
                    <time>{toDate(entry.createdAt)}</time>
                    <p>{entry.reason}</p>
                  </article>
                ))
              ) : (
                <p>Thủ tục này chưa có lần chỉnh sửa nội bộ.</p>
              )}
            </div>
          </section>
        )}

        {editing ? (
          <section className="panel staff-procedure-editor">
            <div className="catalog-editor-heading">
              <div>
                <h2>Chỉnh sửa danh mục nội bộ</h2>
                <p>{selected.code}</p>
              </div>
              <button
                type="button"
                className="button secondary"
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                Hủy chỉnh sửa
              </button>
            </div>
            <form className="catalog-edit-form" onSubmit={saveEdit}>
              <label>
                <span>Mã thủ tục</span>
                <input
                  name="code"
                  defaultValue={selected.code}
                  required
                  minLength={2}
                  maxLength={40}
                  autoCapitalize="characters"
                />
              </label>
              <label>
                <span>Tên thủ tục</span>
                <input name="name" defaultValue={selected.name} required maxLength={500} />
              </label>
              <label>
                <span>Lĩnh vực / danh mục</span>
                <select
                  name="categoryKey"
                  defaultValue={selected.categoryKey || selected.field}
                  required
                >
                  {categories.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.name}
                      {category.source === 'internal' ? ' · nội bộ' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Mức dịch vụ</span>
                <select name="level" defaultValue={selected.level} required>
                  <option value="Toàn trình">Toàn trình</option>
                  <option value="Một phần">Một phần</option>
                  <option value="Cung cấp thông tin">Cung cấp thông tin</option>
                </select>
              </label>
              <label>
                <span>Cơ quan thực hiện theo nguồn</span>
                <input name="agency" defaultValue={selected.agency} required maxLength={300} />
              </label>
              <label>
                <span>Nguồn chính thức nếu đã đối chiếu</span>
                <input
                  name="sourceUrl"
                  type="url"
                  defaultValue={selected.localEdit?.sourceUrl || selected.routing?.officialUrl || ''}
                  maxLength={600}
                  placeholder="https://...gov.vn/..."
                />
              </label>
              <label>
                <span>Ngày đối chiếu nếu có</span>
                <input
                  name="checkedAt"
                  type="date"
                  defaultValue={selected.localEdit?.checkedAt || selected.routing?.checkedAt || ''}
                />
              </label>
              <label>
                <span>Căn cứ và nội dung đã đối chiếu</span>
                <textarea
                  name="reason"
                  rows={3}
                  defaultValue={selected.localEdit?.reason || ''}
                  required
                  minLength={20}
                  maxLength={1200}
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="catalog-editor-actions">
                <button className="button primary" disabled={saving}>
                  {saving ? 'Đang lưu…' : 'Lưu phiên bản nội bộ'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                >
                  Hủy chỉnh sửa
                </button>
              </div>
            </form>
          </section>
        ) : (
          <>
            <details
              className="staff-procedure-config"
              open={Boolean(selected.localEdit || selected.categoryEdit)}
            >
              <summary>
                Thông tin cấu hình danh mục <span>{sourceStatus(selected)}</span>
              </summary>
              <dl>
                <div>
                  <dt>Mã đang dùng</dt>
                  <dd>{selected.code}</dd>
                </div>
                <div>
                  <dt>Mã bản ghi nguồn</dt>
                  <dd>{selected.ref || 'Chưa có'}</dd>
                </div>
                <div>
                  <dt>Lĩnh vực</dt>
                  <dd>{selected.field}</dd>
                </div>
                <div>
                  <dt>Mức dịch vụ</dt>
                  <dd>{serviceModeLabel(selected.level)}</dd>
                </div>
                <div>
                  <dt>Cơ quan trong danh mục</dt>
                  <dd>{selected.agency}</dd>
                </div>
                {selected.sourceCode && selected.sourceCode !== selected.code && (
                  <div>
                    <dt>Mã nguồn chính thức</dt>
                    <dd>{selected.sourceCode}</dd>
                  </div>
                )}
              </dl>
              {(selected.localEdit || selected.categoryEdit) && (
                <p>
                  Bản cập nhật nội bộ bởi{' '}
                  {selected.localEdit?.updatedBy || selected.categoryEdit?.updatedBy}, phiên bản{' '}
                  {selected.localEdit?.version || selected.categoryEdit?.version}. Ngày đối chiếu:{' '}
                  {toDate(selected.localEdit?.checkedAt || selected.categoryEdit?.checkedAt)}.
                </p>
              )}
            </details>
            <section className="panel staff-procedure-detail-content">
              <Suspense fallback={<p role="status">Đang tải chi tiết thủ tục…</p>}>
                <LazyCitizenProcedureDetail
                  key={`${selected.sourceCode || selected.code}-${selected.localEdit?.version || 0}`}
                  code={selected.sourceCode || selected.code}
                  request={api}
                  audience="staff"
                />
              </Suspense>
            </section>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="catalog-workspace staff-catalog-workspace">
      <div className="staff-catalog-toolbar">
        <div className="staff-catalog-totals">
          <span>
            <b>{procedures.length.toLocaleString('vi-VN')}</b> thủ tục
          </span>
          <span>
            <b>{classifiedFieldCount.toLocaleString('vi-VN')}</b> lĩnh vực
          </span>
          <span>
            <b>{configuredForms.toLocaleString('vi-VN')}</b> mở nộp trực tuyến &amp; tại quầy
          </span>
          {documentReferences > 0 && (
            <span>{documentReferences.toLocaleString('vi-VN')} có biểu mẫu đính kèm</span>
          )}
        </div>
        <button
          type="button"
          className="button secondary compact-btn"
          aria-expanded={categoryManagerOpen}
          aria-controls="staff-category-manager"
          onClick={() => setCategoryManagerOpen(open => !open)}
        >
          {categoryManagerOpen
            ? 'Đóng phân loại lĩnh vực'
            : canManage
              ? 'Quản lý lĩnh vực'
              : 'Duyệt theo lĩnh vực'}
        </button>
      </div>

      {categoryManagerOpen && (
        <div id="staff-category-manager">
          <section className="panel field-catalog-panel" aria-label="Danh mục lĩnh vực thủ tục">
            <div className="field-catalog-header">
              <div>
                <h2>Lĩnh vực thủ tục ({classifiedFieldCount.toLocaleString('vi-VN')})</h2>
              </div>
              <div className="field-catalog-header-actions">
                {canManage && (
                  <button
                    type="button"
                    className="button secondary compact-btn"
                    onClick={() => {
                      setNewCategoryOpen(open => !open)
                      setError('')
                    }}
                  >
                    {newCategoryOpen ? 'Đóng tạo lĩnh vực' : '+ Tạo lĩnh vực'}
                  </button>
                )}
                <label className="field-catalog-search">
                  <span>Tìm lĩnh vực</span>
                  <input
                    type="search"
                    value={categoryQuery}
                    onChange={event => setCategoryQuery(event.target.value)}
                    placeholder="Nhập tên lĩnh vực"
                  />
                </label>
              </div>
            </div>

            {newCategoryOpen && (
              <form className="catalog-edit-form new-category-form" onSubmit={saveNewCategory}>
                <h3>Tạo lĩnh vực nội bộ</h3>
                <label>
                  <span>Tên lĩnh vực</span>
                  <input name="name" required minLength={3} maxLength={180} />
                </label>
                <label>
                  <span>Nguồn chính thức nếu đã đối chiếu</span>
                  <input
                    name="sourceUrl"
                    type="url"
                    maxLength={600}
                    placeholder="https://...gov.vn/..."
                  />
                </label>
                <label>
                  <span>Ngày đối chiếu nếu có</span>
                  <input name="checkedAt" type="date" />
                </label>
                <label>
                  <span>Mục đích và căn cứ tạo nhóm</span>
                  <textarea name="reason" rows={2} required minLength={20} maxLength={1200} />
                </label>
                <div className="catalog-editor-actions">
                  <button className="button primary" disabled={savingNewCategory}>
                    {savingNewCategory ? 'Đang tạo…' : 'Lưu lĩnh vực nội bộ'}
                  </button>
                </div>
              </form>
            )}

            <div className="field-catalog-layout">
              <div className="field-catalog-list" role="listbox" aria-label="Các lĩnh vực">
                {visibleCategories.map(category => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedCategory?.key === category.key}
                    className={`field-catalog-row${selectedCategory?.key === category.key ? ' active' : ''}`}
                    key={category.key}
                    onClick={() => selectCategory(category.key)}
                  >
                    <span>{category.name}</span>
                    <b className="tabular-nums">
                      {category.procedures.length.toLocaleString('vi-VN')}
                    </b>
                  </button>
                ))}
                {!visibleCategories.length && (
                  <p className="field-catalog-no-results">Không có lĩnh vực khớp từ khóa.</p>
                )}
              </div>

              {selectedCategory && (
                <div className="field-catalog-detail">
                  {editingCategory ? (
                    <>
                      <div className="catalog-editor-heading">
                        <div>
                          <h3>{selectedCategory.name}</h3>
                        </div>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setEditingCategory(false)}
                        >
                          Hủy
                        </button>
                      </div>
                      <form className="catalog-edit-form" onSubmit={saveCategory}>
                        <label>
                          <span>Tên lĩnh vực</span>
                          <input
                            name="name"
                            defaultValue={selectedCategory.name}
                            required
                            maxLength={180}
                          />
                        </label>
                        <label>
                          <span>
                            {selectedCategory.source === 'reference'
                              ? 'Nguồn chính thức'
                              : 'Nguồn chính thức nếu đã đối chiếu'}
                          </span>
                          <input
                            name="sourceUrl"
                            type="url"
                            defaultValue={
                              selectedCategory.categoryEdit?.sourceUrl ||
                              selectedCategory.procedures.find(item => item.routing?.officialUrl)
                                ?.routing?.officialUrl ||
                              ''
                            }
                            required={selectedCategory.source === 'reference'}
                            maxLength={600}
                            placeholder="https://...gov.vn/..."
                          />
                        </label>
                        <label>
                          <span>
                            Ngày đối chiếu
                            {selectedCategory.source === 'internal' ? ' nếu có' : ''}
                          </span>
                          <input
                            name="checkedAt"
                            type="date"
                            defaultValue={
                              selectedCategory.categoryEdit?.checkedAt ||
                              (selectedCategory.source === 'reference' ? todayInHanoi : '')
                            }
                            required={selectedCategory.source === 'reference'}
                          />
                        </label>
                        <label>
                          <span>Căn cứ và nội dung đã đối chiếu</span>
                          <textarea
                            name="reason"
                            rows={3}
                            defaultValue={selectedCategory.categoryEdit?.reason || ''}
                            required
                            minLength={20}
                            maxLength={1200}
                          />
                        </label>
                        {error && (
                          <p className="form-error" role="alert">
                            {error}
                          </p>
                        )}
                        <div className="catalog-editor-actions">
                          <button className="button primary" disabled={savingCategory}>
                            {savingCategory ? 'Đang lưu…' : 'Lưu lĩnh vực nội bộ'}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      <div className="field-detail-heading">
                        <div>
                          <h3>{selectedCategory.name}</h3>
                          <p>
                            {selectedCategory.procedures.length.toLocaleString('vi-VN')} thủ tục thuộc lĩnh vực này
                          </p>
                        </div>
                        {canManage && (
                          <div className="field-detail-actions">
                            <button
                              type="button"
                              className="button secondary compact-btn"
                              onClick={() => {
                                setError('')
                                setEditingCategory(true)
                              }}
                            >
                              Sửa tên lĩnh vực
                            </button>
                            <button
                              type="button"
                              className="button secondary compact-btn"
                              onClick={() => {
                                setManagingMembers(open => !open)
                                setError('')
                              }}
                            >
                              {managingMembers ? 'Đóng quản lý thủ tục' : 'Chuyển nhóm thủ tục'}
                            </button>
                          </div>
                        )}
                      </div>

                      {selectedCategory.categoryEdit && (
                        <div className="field-catalog-provenance">
                          <b>Phiên bản {selectedCategory.categoryEdit.version}</b>
                          <span>
                            Cập nhật bởi {selectedCategory.categoryEdit.updatedBy} ·{' '}
                            {toDate(selectedCategory.categoryEdit.updatedAt)}
                          </span>
                          <p>{selectedCategory.categoryEdit.reason}</p>
                          {selectedCategory.categoryEdit.sourceUrl && (
                            <a
                              href={selectedCategory.categoryEdit.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Mở nguồn đối chiếu ↗
                            </a>
                          )}
                        </div>
                      )}

                      <div className="field-member-toolbar">
                        <label>
                          <span>Tìm trong lĩnh vực</span>
                          <input
                            type="search"
                            value={memberQuery}
                            onChange={event => {
                              setMemberQuery(event.target.value)
                              setMemberPage(1)
                              setSelectedMembers([])
                            }}
                            placeholder="Mã thủ tục hoặc tên thủ tục"
                          />
                        </label>
                        <span>
                          {categoryMemberMatches.length.toLocaleString('vi-VN')} /{' '}
                          {selectedCategory.procedures.length.toLocaleString('vi-VN')} thủ tục
                        </span>
                      </div>

                      {managingMembers && canManage && (
                        <form className="field-member-manager" onSubmit={moveSelectedMembers}>
                          <div className="field-member-selection">
                            <span>
                              Đã chọn {selectedMembers.length.toLocaleString('vi-VN')} thủ tục
                            </span>
                            <div>
                              <button
                                type="button"
                                className="text-button"
                                onClick={() =>
                                  setSelectedMembers(current => [
                                    ...new Set([
                                      ...current,
                                      ...categoryMemberShown.map(
                                        item => item.sourceCode || item.code,
                                      ),
                                    ]),
                                  ])
                                }
                              >
                                Chọn trang này
                              </button>
                              <button
                                type="button"
                                className="text-button"
                                onClick={() =>
                                  setSelectedMembers(current =>
                                    current.filter(
                                      code =>
                                        !categoryMemberShown.some(
                                          item => (item.sourceCode || item.code) === code,
                                        ),
                                    ),
                                  )
                                }
                              >
                                Bỏ chọn trang này
                              </button>
                            </div>
                          </div>
                          <label>
                            <span>Chuyển các thủ tục đã chọn sang lĩnh vực</span>
                            <select
                              value={targetCategoryKey}
                              onChange={event => setTargetCategoryKey(event.target.value)}
                              required
                            >
                              <option value="">Chọn lĩnh vực đích</option>
                              {categories
                                .filter(item => item.key !== selectedCategory.key)
                                .map(item => (
                                  <option key={item.key} value={item.key}>
                                    {item.name} · {item.procedures.length.toLocaleString('vi-VN')}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label>
                            <span>Nguồn chính thức nếu chuyển vào lĩnh vực tham chiếu</span>
                            <input
                              name="sourceUrl"
                              type="url"
                              maxLength={600}
                              placeholder="https://...gov.vn/..."
                            />
                          </label>
                          <label>
                            <span>Ngày đối chiếu nếu có</span>
                            <input name="checkedAt" type="date" />
                          </label>
                          <label>
                            <span>Căn cứ phân loại và lý do chuyển nhóm</span>
                            <textarea
                              name="reason"
                              required
                              minLength={20}
                              maxLength={1200}
                              rows={2}
                            />
                          </label>
                          <button
                            className="button primary"
                            disabled={savingMove || !selectedMembers.length || !targetCategoryKey}
                          >
                            {savingMove
                              ? 'Đang chuyển…'
                              : `Chuyển ${selectedMembers.length.toLocaleString('vi-VN')} thủ tục`}
                          </button>
                        </form>
                      )}

                      <div className="field-procedure-list">
                        {categoryMemberShown.map(item => (
                          <div className="field-procedure-row" key={item.sourceCode || item.code}>
                            {managingMembers && canManage && (
                              <input
                                type="checkbox"
                                aria-label={`Chọn thủ tục ${item.code}`}
                                checked={selectedMembers.includes(item.sourceCode || item.code)}
                                onChange={event =>
                                  setSelectedMembers(current =>
                                    event.target.checked
                                      ? [...current, item.sourceCode || item.code]
                                      : current.filter(
                                          code => code !== (item.sourceCode || item.code),
                                        ),
                                  )
                                }
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const stableCode = item.sourceCode || item.code
                                openProcedure(stableCode)
                                setField(item.field)
                                setMode('all')
                                setQuery('')
                                const group = procedures.filter(
                                  value => value.field === item.field,
                                )
                                setPage(
                                  Math.floor(
                                    group.findIndex(
                                      value => (value.sourceCode || value.code) === stableCode,
                                    ) / pageSize,
                                  ) + 1,
                                )
                              }}
                            >
                              <span>
                                <b>{item.code}</b> · {item.name}
                              </span>
                            </button>
                          </div>
                        ))}
                        {!categoryMemberShown.length && (
                          <p className="field-catalog-no-results">
                            Lĩnh vực này chưa có thủ tục khớp nội dung tìm kiếm.
                          </p>
                        )}
                      </div>

                      {categoryMemberPages > 1 && (
                        <div className="catalog-pagination field-member-pagination">
                          <button
                            type="button"
                            className="button secondary compact-btn"
                            disabled={memberPage <= 1}
                            onClick={() => setMemberPage(value => Math.max(1, value - 1))}
                          >
                            ‹ Trước
                          </button>
                          <span>
                            Trang {memberPage} / {categoryMemberPages}
                          </span>
                          <button
                            type="button"
                            className="button secondary compact-btn"
                            disabled={memberPage >= categoryMemberPages}
                            onClick={() =>
                              setMemberPage(value => Math.min(categoryMemberPages, value + 1))
                            }
                          >
                            Sau ›
                          </button>
                        </div>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          className="text-button field-history-button"
                          onClick={() => void toggleCategoryHistory()}
                        >
                          {showCategoryHistory ? 'Ẩn lịch sử lĩnh vực' : 'Xem lịch sử lĩnh vực'}
                        </button>
                      )}

                      {showCategoryHistory && (
                        <div className="catalog-history-list">
                          {categoryHistory.length ? (
                            categoryHistory.map(entry => (
                              <article key={`${entry.createdAt}-${entry.actor}`}>
                                <b>
                                  {String(entry.after.version ?? '—')} · {entry.actor}
                                </b>
                                <time>{toDate(entry.createdAt)}</time>
                                <p>{entry.reason}</p>
                              </article>
                            ))
                          ) : (
                            <p>Lĩnh vực này chưa có lần chỉnh sửa nội bộ.</p>
                          )}
                        </div>
                      )}

                      {error && (
                        <p className="form-error" role="alert">
                          {error}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}

      <section className="panel catalog-controls">
        <label className="catalog-search" htmlFor="staff-catalog-query">
          <span>Tìm theo mã, tên, lĩnh vực hoặc cơ quan</span>
          <input
            id="staff-catalog-query"
            className="search-input"
            type="search"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Ví dụ: 2.000908, hộ tịch…"
          />
        </label>
        <label htmlFor="staff-catalog-field">
          <span>Lĩnh vực</span>
          <select
            id="staff-catalog-field"
            value={field}
            onChange={e => {
              setField(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Tất cả lĩnh vực</option>
            {fields.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="staff-catalog-mode">
          <span>Mức dịch vụ</span>
          <select
            id="staff-catalog-mode"
            value={mode}
            onChange={e => {
              setMode(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Tất cả mức</option>
            <option value="FULL">Toàn trình</option>
            <option value="PARTIAL">Một phần</option>
            <option value="INFORMATION">Cung cấp thông tin</option>
          </select>
        </label>
        <div className="catalog-count">
          <b className="tabular-nums">{filtered.length.toLocaleString('vi-VN')}</b>
          <small>thủ tục phù hợp</small>
        </div>
      </section>

      <section
        className="panel staff-catalog-table-panel"
        aria-labelledby="staff-procedure-results-heading"
      >
        <div className="catalog-list-head">
          <div>
            <h2 id="staff-procedure-results-heading">Danh sách thủ tục hành chính</h2>
          </div>
          <span>
            {filtered.length
              ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} / ${filtered.length.toLocaleString('vi-VN')}`
              : '0 kết quả'}
          </span>
        </div>

        <div className="table-scroll staff-procedure-results">
          <table className="staff-procedure-table">
            <thead>
              <tr>
                <th scope="col">Mã thủ tục</th>
                <th scope="col">Tên thủ tục / mức dịch vụ</th>
                <th scope="col">Cơ quan thực hiện</th>
                <th scope="col">Tình trạng dữ liệu</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(item => {
                const stableCode = item.sourceCode || item.code
                return (
                  <tr key={`${stableCode}-${item.ref}`}>
                    <td data-label="Mã thủ tục">
                      <span className="staff-procedure-code">{item.code}</span>
                    </td>
                    <td data-label="Tên thủ tục">
                      <button
                        type="button"
                        className="staff-procedure-title"
                        aria-label={`Xem chi tiết thủ tục ${item.code}: ${item.name}`}
                        onClick={() => openProcedure(stableCode)}
                      >
                        {item.name}
                      </button>
                      <div className="staff-procedure-meta">
                        <span>{item.field}</span>
                        <span>{serviceModeLabel(item.level)}</span>
                      </div>
                    </td>
                    <td data-label="Cơ quan">{item.agency || 'Chưa xác định'}</td>
                    <td data-label="Tình trạng dữ liệu">
                      <span
                        className={`staff-procedure-data-status${item.localEdit || item.categoryEdit ? ' internal' : ''}`}
                      >
                        {sourceStatus(item)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            Không tìm thấy thủ tục phù hợp. Hãy kiểm tra từ khóa hoặc bỏ bớt bộ lọc.
          </div>
        )}

        {filtered.length > pageSize && (
          <div className="catalog-pagination">
            <button
              type="button"
              className="button secondary compact-btn"
              disabled={page <= 1}
              onClick={() => setPage(current => Math.max(1, current - 1))}
            >
              ‹ Trang trước
            </button>
            <span>
              Trang {page} / {pageCount}
            </span>
            <button
              type="button"
              className="button secondary compact-btn"
              disabled={page >= pageCount}
              onClick={() => setPage(current => Math.min(pageCount, current + 1))}
            >
              Trang sau ›
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

export function CaseActivityLog({
  cases,
  onOpen,
}: {
  cases: CaseFile[]
  onOpen: (item: CaseFile) => void
}) {
  const [query, setQuery] = useState('')
  const [audience, setAudience] = useState('all')

  const events = useMemo(
    () =>
      cases
        .flatMap(item =>
          (item.events || []).map(event => ({
            ...event,
            code: item.code,
            procedureName: item.procedure?.name || item.procedureCode,
          })),
        )
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
        .filter(event => {
          const term = query.trim().toLocaleLowerCase('vi')
          return (
            (audience === 'all' || event.audience === audience) &&
            (!term ||
              `${event.code} ${event.title} ${event.actor} ${event.detail} ${event.procedureName}`
                .toLocaleLowerCase('vi')
                .includes(term))
          )
        }),
    [cases, query, audience],
  )

  return (
    <div className="activity-workspace">
      <section className="panel activity-controls">
        <label htmlFor="activity-search">
          <span>Tìm trong nhật ký</span>
          <input
            id="activity-search"
            className="search-input"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Mã hồ sơ, thao tác, người thực hiện…"
          />
        </label>
        <label htmlFor="activity-audience">
          <span>Phạm vi sự kiện</span>
          <select
            id="activity-audience"
            value={audience}
            onChange={e => setAudience(e.target.value)}
          >
            <option value="all">Công khai và nội bộ</option>
            <option value="public">Hiển thị cho công dân</option>
            <option value="internal">Chỉ nội bộ</option>
          </select>
        </label>
        <div className="catalog-count">
          <b className="tabular-nums">{events.length.toLocaleString('vi-VN')}</b>
          <small>sự kiện</small>
        </div>
      </section>

      <section className="panel activity-panel">
        {events.length ? (
          <div className="table-scroll data-table-wrap">
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
                    <td data-label="Thời điểm">
                      <time className="account-cell-email">{toDate(event.at)}</time>
                    </td>
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
                        {event.detail && (
                          <span className="account-cell-email">{event.detail}</span>
                        )}
                      </div>
                    </td>
                    <td data-label="Người thực hiện">
                      <div className="account-cell-user">
                        <b>{event.actor || 'Hệ thống'}</b>
                        <span className="account-cell-email">
                          {roleNames[event.role || ''] || event.role || 'Tự động'}
                        </span>
                      </div>
                    </td>
                    <td data-label="Phạm vi">
                      <span
                        className={`request-status ${event.audience === 'internal' ? 'request-pending' : 'request-approved'}`}
                      >
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
  )
}

type SandboxPayment = {
  transactionRef: string
  caseCode: string
  caseVersion: number
  procedureCode: string
  agency: string
  caseStatus: string
  amount: number
  status: string
  basis: string
  createdAt: string
  reconciledAt?: string
  mode: string
  method?: string
  payerReference?: string
  reconciliationReference?: string
  events?: { action: string; actor_name: string; detail: string; created_at: string }[]
  refund?: {
    status: string
    reason: string
    requested_by: string
    requested_at: string
    review_note: string
    execution_reference?: string
    executed_at?: string
  } | null
}

type SandboxSigner = {
  id: string
  full_name: string
  email: string
  agency_scope: string
  valid_from: string
  valid_until: string
  authority_ref?: string
  reason?: string
  effective: boolean
}

export function ServiceConnections({
  user,
  data,
  onNavigate,
}: {
  user: User
  data: Bootstrap
  onNavigate: (page: string) => void
  onOpenCase?: (caseRecord: CaseFile) => Promise<void> | void
}) {
  const canViewPayments =
    user.role === 'admin' || user.role === 'finance' || user.role === 'leader'
  const canManageSigners = user.role === 'admin'
  const [activeTab, setActiveTab] = useState<'payments' | 'signers' | 'integrations'>(() =>
    canViewPayments ? 'payments' : 'integrations',
  )
  const outbox = data.outbox || []
  const errorCount = outbox.filter(item => item.status === 'ERROR').length
  const pendingCount = outbox.filter(item => item.status === 'PENDING').length

  const services = [
    {
      name: 'Cổng Dịch vụ công quốc gia',
      category: 'Tiếp nhận và trao đổi hồ sơ',
      detail:
        'Đồng bộ danh mục thủ tục hành chính và định tuyến tiếp nhận hồ sơ theo đơn vị.',
      prerequisites: [
        'Hợp đồng/API được cơ quan đầu mối cấp',
        'Thông tin xác thực và cấu hình kết nối',
        'Quy tắc đối soát mã hồ sơ và trạng thái',
      ],
    },
    {
      name: 'Dịch vụ ký số nội bộ',
      category: 'Ký và xác minh kết quả',
      detail:
        'Cấp thẩm quyền ký số Ed25519, ký phê duyệt dự thảo và xác thực mã băm SHA-256.',
      prerequisites: [
        'Nhà cung cấp và chứng thư số được phê duyệt',
        'Quy trình ký số và xác thực toàn vẹn văn bản',
        'Thẩm quyền ký và nhật ký bàn giao',
      ],
    },
    {
      name: 'Thanh toán và hoàn phí',
      category: 'Thu, đối soát và hoàn',
      detail:
        'Sổ khoản thu ghi nhận chứng từ người nộp khai, đối chiếu chứng từ, duyệt đề nghị hoàn và lưu chứng từ hoàn.',
      prerequisites: [
        'Đơn vị trung gian thanh toán được chấp thuận',
        'API, khóa bí mật và cấu hình đối soát',
        'Quy trình xử lý giao dịch lỗi/hoàn tiền',
      ],
    },
    {
      name: 'Thông báo và giao kết quả',
      category: 'Thông báo, bưu chính, kho nhận',
      detail: 'Quản lý kênh nhận kết quả trực tiếp, bưu chính và phát hành bản điện tử.',
      prerequisites: [
        'Nhà cung cấp và tài khoản gửi được phê duyệt',
        'Mẫu thông điệp, kênh nhận và chính sách bảo vệ dữ liệu',
        'Biên nhận giao nhận có thể đối soát',
      ],
    },
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

  const loadOperations = useCallback(
    async (signal?: AbortSignal) => {
      if (user.role === 'finance' || user.role === 'admin' || user.role === 'leader') {
        const result = await api<{ payments: SandboxPayment[] }>(
          '/api/payments',
          undefined,
          signal,
        )
        if (!signal?.aborted) setPayments(result.payments)
      }
      if (user.role === 'admin') {
        const result = await api<{ signers: SandboxSigner[] }>(
          '/api/sandbox-signers',
          undefined,
          signal,
        )
        if (!signal?.aborted) {
          setSigners(result.signers)
          setSignerId(
            current =>
              current ||
              result.signers.find(person => !person.effective)?.id ||
              result.signers[0]?.id ||
              '',
          )
        }
      }
    },
    [user.role],
  )

  useEffect(() => {
    const controller = new AbortController()
    const tasks: Promise<void>[] = []
    if (user.role === 'finance' || user.role === 'admin' || user.role === 'leader') {
      tasks.push(
        api<{ payments: SandboxPayment[] }>('/api/payments', undefined, controller.signal).then(
          result => {
            if (!controller.signal.aborted) setPayments(result.payments)
          },
        ),
      )
    }
    if (user.role === 'admin') {
      tasks.push(
        api<{ signers: SandboxSigner[] }>(
          '/api/sandbox-signers',
          undefined,
          controller.signal,
        ).then(result => {
          if (!controller.signal.aborted) {
            setSigners(result.signers)
            setSignerId(
              current =>
                current ||
                result.signers.find(person => !person.effective)?.id ||
                result.signers[0]?.id ||
                '',
            )
          }
        }),
      )
    }
    void Promise.all(tasks).catch(reason => {
      if (controller.signal.aborted || isAbortError(reason)) return
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không tải được thông tin thanh toán/quyền ký.',
      )
    })
    return () => controller.abort()
  }, [user.role])

  async function changeSigner(action: 'grant' | 'revoke', targetId = signerId, revokeReason = '') {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await api('/api/sandbox-signers', {
        action,
        userId: targetId,
        authorityRef,
        reason: revokeReason || authorityReason,
      })
      setAuthorityRef('')
      setAuthorityReason('')
      await loadOperations()
      setNotice(
        action === 'grant'
          ? 'Đã cấp thẩm quyền ký số cho tài khoản lãnh đạo.'
          : 'Đã thu hồi thẩm quyền ký số.',
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không cập nhật được quyền ký.')
    } finally {
      setBusy(false)
    }
  }

  const connectionTabs: ('payments' | 'signers' | 'integrations')[] = [
    ...(canViewPayments ? (['payments'] as const) : []),
    ...(canManageSigners ? (['signers'] as const) : []),
    'integrations',
  ]

  return (
    <div className="connections-workspace">
      <div
        className="staff-module-tabs"
        role="tablist"
        aria-label="Phân hệ Tài chính, Chữ ký và Tích hợp"
        onKeyDown={event => handleTabArrows(event, connectionTabs, activeTab, setActiveTab)}
      >
        {canViewPayments && (
          <button
            type="button"
            id="conn-tab-payments"
            role="tab"
            tabIndex={activeTab === 'payments' ? 0 : -1}
            aria-selected={activeTab === 'payments'}
            aria-controls="conn-panel-payments"
            className={`staff-module-tab${activeTab === 'payments' ? ' active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <span>Đối soát phí &amp; Hoàn trả</span>
            <b className="tabular-nums">{payments.length}</b>
          </button>
        )}
        {canManageSigners && (
          <button
            type="button"
            id="conn-tab-signers"
            role="tab"
            tabIndex={activeTab === 'signers' ? 0 : -1}
            aria-selected={activeTab === 'signers'}
            aria-controls="conn-panel-signers"
            className={`staff-module-tab${activeTab === 'signers' ? ' active' : ''}`}
            onClick={() => setActiveTab('signers')}
          >
            <span>Thẩm quyền ký số nội bộ</span>
            <b className="tabular-nums">{signers.filter(s => s.effective).length}</b>
          </button>
        )}
        <button
          type="button"
          id="conn-tab-integrations"
          role="tab"
          tabIndex={activeTab === 'integrations' ? 0 : -1}
          aria-selected={activeTab === 'integrations'}
          aria-controls="conn-panel-integrations"
          className={`staff-module-tab${activeTab === 'integrations' ? ' active' : ''}`}
          onClick={() => setActiveTab('integrations')}
        >
          <span>Trạng thái tích hợp &amp; Hàng chờ</span>
          <b className="tabular-nums">{outbox.length}</b>
        </button>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="citizen-success" role="status">
          {notice}
        </div>
      )}

      {activeTab === 'payments' && canViewPayments && (
        <section
          id="conn-panel-payments"
          role="tabpanel"
          aria-labelledby="conn-tab-payments"
          className="panel sandbox-payment-workspace"
        >
          <PanelHeading
            title="Giao dịch thu phí, đối soát chứng từ và hoàn trả"
            description="Quản lý nghĩa vụ tài chính phát sinh trên hồ sơ trong phạm vi đơn vị."
          />
          <div className="sandbox-payment-summary">
            <MetricCard
              label="Tổng giao dịch"
              value={payments.length}
              note="Trong phạm vi được phép xem"
              tone="navy"
            />
            <MetricCard
              label="Chờ đối soát"
              value={payments.filter(item => item.status === 'PAID').length}
              note="Người nộp đã khai chứng từ"
              tone="amber"
            />
            <MetricCard
              label="Chờ duyệt hoàn"
              value={payments.filter(item => item.refund?.status === 'PENDING').length}
              note="Cần người có thẩm quyền duyệt"
              tone="red"
            />
          </div>
          {payments.length ? (
            <div className="sandbox-payment-list">
              {payments.map(payment => (
                <SandboxPaymentRow
                  key={payment.transactionRef}
                  payment={payment}
                  user={user}
                  onChanged={async message => {
                    await loadOperations()
                    setNotice(message)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="connection-empty-state">
              <b>Chưa có giao dịch trong phạm vi này</b>
              <p>
                Cán bộ tiếp nhận cấu hình khoản thu có căn cứ trên hồ sơ; người nộp tạo giao dịch tại trang tra cứu.
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'signers' && canManageSigners && (
        <section
          id="conn-panel-signers"
          role="tabpanel"
          aria-labelledby="conn-tab-signers"
          className="panel sandbox-signer-workspace"
        >
          <PanelHeading
            title="Quản lý thẩm quyền ký số kết quả nội bộ (Ed25519)"
            description="Cấp hoặc thu hồi quyền ký kết quả cho lãnh đạo đơn vị."
          />
          <form
            className="sandbox-signer-form"
            onSubmit={event => {
              event.preventDefault()
              void changeSigner('grant')
            }}
          >
            <label>
              <span>Lãnh đạo</span>
              <select value={signerId} onChange={event => setSignerId(event.target.value)} required>
                <option value="">Chọn tài khoản lãnh đạo</option>
                {signers.map(person => (
                  <option key={person.id} value={person.id}>
                    {person.full_name} · {person.agency_scope} ·{' '}
                    {person.effective ? 'đang có quyền' : 'chưa có quyền'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Căn cứ văn bản cấp quyền</span>
              <input
                value={authorityRef}
                onChange={event => setAuthorityRef(event.target.value)}
                minLength={4}
                maxLength={180}
                required
                placeholder="Số văn bản phân quyền nội bộ"
              />
            </label>
            <label>
              <span>Lý do và phạm vi</span>
              <input
                value={authorityReason}
                onChange={event => setAuthorityReason(event.target.value)}
                minLength={12}
                maxLength={1200}
                required
                placeholder="Nêu căn cứ và phạm vi cấp thẩm quyền ký số"
              />
            </label>
            <button className="button primary" disabled={busy || !signerId}>
              {busy ? 'Đang lưu…' : 'Cấp quyền ký'}
            </button>
          </form>

          {signers.length ? (
            <div className="table-scroll data-table-wrap">
              <table className="data-table signer-table">
                <thead>
                  <tr>
                    <th className="col-stt">STT</th>
                    <th className="col-user">Lãnh đạo &amp; Email công vụ</th>
                    <th className="col-agency">Cơ quan / Đơn vị</th>
                    <th>Căn cứ phân quyền ký</th>
                    <th className="col-status">Trạng thái</th>
                    <th className="col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {signers.map((person, idx) => (
                    <tr key={person.id}>
                      <td className="col-stt tabular-nums" data-label="STT">
                        {idx + 1}
                      </td>
                      <td className="col-user" data-label="Lãnh đạo & Email công vụ">
                        <div className="account-cell-user">
                          <b>{person.full_name}</b>
                          <span className="account-cell-email">{person.email}</span>
                        </div>
                      </td>
                      <td className="col-agency" data-label="Cơ quan / Đơn vị">
                        <span className="account-cell-agency">{person.agency_scope}</span>
                      </td>
                      <td data-label="Căn cứ phân quyền ký">
                        {person.authority_ref ? (
                          <div className="account-cell-user">
                            <b>{person.authority_ref}</b>
                            <span className="account-cell-email">{person.reason || ''}</span>
                          </div>
                        ) : (
                          <span className="account-cell-email">Chưa cấp quyền ký</span>
                        )}
                      </td>
                      <td className="col-status" data-label="Trạng thái">
                        <span
                          className={`request-status ${person.effective ? 'request-approved' : 'request-pending'}`}
                        >
                          {person.effective ? 'Đang hiệu lực' : 'Chưa kích hoạt'}
                        </span>
                      </td>
                      <td className="col-actions" data-label="Thao tác">
                        {person.authority_ref ? (
                          <button
                            type="button"
                            className="button secondary compact-btn"
                            disabled={busy || !person.effective}
                            onClick={() => {
                              setSignerId(person.id)
                              void changeSigner(
                                'revoke',
                                person.id,
                                'Thu hồi thẩm quyền ký số theo quyết định rà soát quản trị.',
                              )
                            }}
                          >
                            Thu hồi
                          </button>
                        ) : (
                          <span className="account-cell-email">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="connection-empty-state">
              Chưa có tài khoản lãnh đạo để cấp quyền ký.
            </div>
          )}
        </section>
      )}

      {activeTab === 'integrations' && (
        <div
          id="conn-panel-integrations"
          role="tabpanel"
          aria-labelledby="conn-tab-integrations"
        >
          <section className="panel connection-state-banner">
            <div>
              <h2>
                {storage?.database === 'connected'
                  ? 'Máy chủ ứng dụng & Cơ sở dữ liệu SQLite đang hoạt động'
                  : 'Chưa xác nhận được kết nối cơ sở dữ liệu'}
              </h2>
              <p>
                {storage?.database === 'connected'
                  ? `Đang lưu trữ ${(storage?.procedureCount ?? data.procedures.length).toLocaleString('vi-VN')} thủ tục hành chính, ${(storage?.caseRecords ?? data.cases.length).toLocaleString('vi-VN')} hồ sơ trong phạm vi và ${(storage?.publishedNews ?? 0).toLocaleString('vi-VN')} bài viết công khai.`
                  : 'Không đọc được trạng thái từ máy chủ.'}
              </p>
            </div>
            <span
              className={`environment-badge ${storage?.database === 'connected' ? 'environment-connected' : 'environment-disconnected'}`}
            >
              {storage?.database === 'connected' ? 'Đã kết nối nội bộ' : 'Mất kết nối'}
            </span>
          </section>

          <div className="integration-cards">
            {services.map(service => (
              <article className="panel integration-card" key={service.name}>
                <div className="integration-card-top">
                  <span className="integration-category">{service.category}</span>
                  <span className="connection-state-text">Đang vận hành</span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.detail}</p>
                <div className="integration-prerequisites">
                  <b>Điều kiện liên thông</b>
                  <ul>
                    {service.prerequisites.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <section className="panel integration-summary">
            <PanelHeading
              title="Hàng chờ đồng bộ bên ngoài (Outbox)"
              description="Theo dõi các bản ghi đồng bộ phát sinh từ luồng xử lý hồ sơ."
              action={
                <button type="button" className="text-button" onClick={() => onNavigate('home')}>
                  Về bàn điều hành →
                </button>
              }
            />
            <div className="outbox-summary">
              <MetricCard
                label="Tổng tác vụ"
                value={outbox.length}
                note="Bản ghi hàng chờ"
                tone="navy"
              />
              <MetricCard
                label="Đang chờ"
                value={pendingCount}
                note="Chưa được bên nhận xác nhận"
                tone="amber"
              />
              <MetricCard
                label="Có lỗi"
                value={errorCount}
                note="Cần kiểm tra lại"
                tone="red"
              />
            </div>
            {outbox.length ? (
              <div className="outbox-list">
                {outbox.map(row => (
                  <div className="outbox-row" key={row.code}>
                    <b>{row.code}</b>
                    <span>{row.status}</span>
                    <span>{row.attempts} lần thử</span>
                    <small>{row.lastError || 'Đang chờ xử lý đồng bộ.'}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="connection-empty-state">
                <b>Không có tác vụ tồn đọng</b>
                <p>Hàng chờ đồng bộ hiện đang trống.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function SandboxPaymentRow({
  payment,
  user,
  onChanged,
}: {
  payment: SandboxPayment
  user: User
  onChanged: (message: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [statementReference, setStatementReference] = useState('')
  const [executionReference, setExecutionReference] = useState('')

  async function act(action: string, payload: Record<string, unknown>, message: string) {
    setBusy(true)
    setError('')
    try {
      await api(`/api/payments/${encodeURIComponent(payment.transactionRef)}/${action}`, payload)
      await onChanged(message)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thực hiện được thao tác giao dịch.',
      )
    } finally {
      setBusy(false)
    }
  }

  const terminalCase = ['DUNG', 'TU_CHOI', 'KHONG_GIAI_QUYET'].includes(payment.caseStatus)
  const ownRefund = payment.refund?.requested_by === user.id
  const canManagePayment = ['finance', 'leader'].includes(user.role)

  return (
    <article className="sandbox-payment-row">
      <header>
        <div className="sandbox-payment-identity">
          <b>{payment.transactionRef}</b>
          <span>
            Hồ sơ {payment.caseCode} · Mã thủ tục {payment.procedureCode}
          </span>
        </div>
        <strong className="tabular-nums">
          {Number(payment.amount).toLocaleString('vi-VN')} đồng
        </strong>
      </header>

      <div className="sandbox-payment-facts">
        <span>
          Trạng thái:{' '}
          <b>
            {(
              {
                PENDING: 'Chờ xác nhận',
                PAID: 'Người nộp khai đã thanh toán · chờ đối soát',
                RECONCILED: 'Đã đối soát nội bộ',
                REFUNDED: 'Đã ghi nhận chứng từ hoàn',
              } as Record<string, string>
            )[payment.status] || payment.status}
          </b>
        </span>
        <span>{payment.agency}</span>
        <span>{toDate(payment.createdAt)}</span>
      </div>

      <p className="sandbox-payment-basis"><span>Căn cứ thu: </span>{payment.basis}</p>

      {payment.refund && (
        <div className="sandbox-refund-status">
          <b>
            Đề nghị hoàn:{' '}
            {payment.refund.status === 'PENDING'
              ? 'Đang chờ xem xét'
              : payment.refund.status === 'APPROVED'
                ? 'Đã duyệt, chờ thực hiện hoàn'
                : payment.refund.status === 'EXECUTED'
                  ? 'Đã ghi nhận thực hiện hoàn'
                  : 'Đã từ chối'}
          </b>
          <p>{payment.refund.reason}</p>
          {payment.refund.review_note && <small>Ý kiến: {payment.refund.review_note}</small>}
        </div>
      )}

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      {!!payment.events?.length && (
        <details className="sandbox-payment-events">
          <summary>Lịch sử giao dịch ({payment.events.length} sự kiện)</summary>
          <ol>
            {payment.events.map((event, index) => (
              <li key={`${event.created_at}-${index}`}>
                <b>
                  {(
                    {
                      CREATED: 'Tạo giao dịch',
                      SANDBOX_CONFIRMED: 'Đã xác nhận thanh toán',
                      PAID_DECLARED: 'Người nộp khai chứng từ',
                      REFUND_EXECUTED: 'Ghi nhận thực hiện hoàn',
                      RECONCILED: 'Đối soát nội bộ',
                      REFUND_REQUESTED: 'Lập đề nghị hoàn',
                      REFUND_APPROVED: 'Duyệt đề nghị hoàn',
                      REFUND_REJECTED: 'Từ chối đề nghị hoàn',
                    } as Record<string, string>
                  )[event.action] || event.action}
                </b>
                <time>
                  {toDate(event.created_at)} · {event.actor_name}
                </time>
                <p>{event.detail}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {canManagePayment && payment.status === 'PAID' && (
        <div className="sandbox-payment-action form-grid account-form">
          <label>
            <span>Số chứng từ thu / dòng đối chiếu</span>
            <input
              value={statementReference}
              onChange={event => setStatementReference(event.target.value)}
              minLength={4}
              maxLength={180}
              required
            />
          </label>
          <button
            type="button"
            className="button primary"
            disabled={busy || statementReference.trim().length < 4}
            onClick={() =>
              void act(
                'reconcile',
                { expectedVersion: payment.caseVersion, statementReference },
                'Đã đối chiếu chứng từ và ghi sổ khoản thu.',
              )
            }
          >
            {busy ? 'Đang xử lý…' : 'Đối chiếu chứng từ khoản thu'}
          </button>
        </div>
      )}

      {canManagePayment &&
        payment.status === 'RECONCILED' &&
        terminalCase &&
        (!payment.refund || payment.refund.status === 'REJECTED') && (
          <details className="sandbox-payment-action">
            <summary>Lập đề nghị hoàn</summary>
            <label>
              <span>Căn cứ đề nghị</span>
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                minLength={12}
                maxLength={1200}
                rows={3}
                required
              />
            </label>
            <button
              type="button"
              className="button secondary"
              disabled={busy || reason.trim().length < 12}
              onClick={() =>
                void act(
                  'refund-request',
                  { reason },
                  'Đã lập đề nghị hoàn, chờ người có thẩm quyền khác xem xét.',
                )
              }
            >
              Gửi đề nghị
            </button>
          </details>
        )}

      {canManagePayment && payment.refund?.status === 'PENDING' && ownRefund && (
        <p className="field-help">
          Tài khoản đã lập đề nghị này; cần cán bộ tài chính khác hoặc lãnh đạo đơn vị xem xét.
        </p>
      )}

      {canManagePayment && payment.refund?.status === 'PENDING' && !ownRefund && (
        <details className="sandbox-payment-action">
          <summary>Xem xét đề nghị hoàn</summary>
          <label>
            <span>Ý kiến xem xét</span>
            <textarea
              value={reviewNote}
              onChange={event => setReviewNote(event.target.value)}
              minLength={8}
              maxLength={1200}
              rows={3}
              required
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="button primary"
              disabled={busy || reviewNote.trim().length < 8}
              onClick={() =>
                void act(
                  'refund-review',
                  { decision: 'APPROVE', note: reviewNote, expectedVersion: payment.caseVersion },
                  'Đã duyệt đề nghị; chờ chứng từ thực hiện hoàn.',
                )
              }
            >
              Duyệt đề nghị hoàn
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy || reviewNote.trim().length < 8}
              onClick={() =>
                void act(
                  'refund-review',
                  { decision: 'REJECT', note: reviewNote },
                  'Đã từ chối đề nghị hoàn trong ứng dụng.',
                )
              }
            >
              Từ chối
            </button>
          </div>
        </details>
      )}

      {canManagePayment && payment.refund?.status === 'APPROVED' && (
        <div className="sandbox-payment-action form-grid account-form">
          <label>
            <span>Số chứng từ thực hiện hoàn</span>
            <input
              value={executionReference}
              onChange={event => setExecutionReference(event.target.value)}
              minLength={4}
              maxLength={180}
              required
            />
          </label>
          <button
            type="button"
            className="button primary"
            disabled={busy || executionReference.trim().length < 4}
            onClick={() =>
              void act(
                'refund-execute',
                { expectedVersion: payment.caseVersion, executionReference },
                'Đã ghi nhận chứng từ thực hiện hoàn.',
              )
            }
          >
            Ghi nhận thực hiện hoàn
          </button>
        </div>
      )}

      {payment.refund?.execution_reference && (
        <p>
          Chứng từ thực hiện hoàn: {payment.refund.execution_reference} ·{' '}
          {toDate(payment.refund.executed_at)}
        </p>
      )}
    </article>
  )
}
