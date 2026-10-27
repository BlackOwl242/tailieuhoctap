import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import './CitizenWorkspace.css'

type Request = <T>(path: string, body?: unknown) => Promise<T>
type Case = { code: string; procedureCode: string; procedure?: { name: string }; status: string; statusLabel: string; createdAt: string; deadline?: string; receivingAgency: string; result?: { number?: string; content?: string }; fee?: { amount?: number; status?: string; basis?: string }; payments?: { transactionRef: string; amount: number; status: string; createdAt: string; payerReference?: string }[] }
type Draft = { id: string; title: string; procedureCode: string; version: number; updatedAt: string }
type Notice = { id: string; kind: string; code: string; title: string; detail: string; at: string; read: boolean }
type Appointment = { code: string; agency: string; procedure_name: string; appointment_date: string; time_slot: string; queue_number: number; status: string; counter_note: string }
type Feedback = { code: string; title: string; content: string; agency: string; status: string; reply: string; replied_at: string; created_at: string }
type Document = { id: string; code: string; name: string; kind: string; size: number; downloadUrl: string; at: string }
type Session = { createdAt: string; expiresAt: number; current: boolean }
type Workspace = { cases: Case[]; drafts: Draft[]; notifications: Notice[]; documents: Document[]; appointments: Appointment[]; feedback: Feedback[]; sessions: Session[]; sampleData?: boolean }
const tabs = [['', 'Tổng quan'], ['ho-so', 'Dịch vụ công của tôi'], ['ho-so-nhap', 'Hồ sơ nháp'], ['tai-lieu', 'Tài liệu điện tử'], ['thong-bao', 'Thông báo'], ['lich-hen', 'Lịch hẹn của tôi'], ['phan-anh', 'Phản ánh, kiến nghị'], ['khoan-thu', 'Khoản thu, thanh toán'], ['thong-tin-ca-nhan', 'Thông tin cá nhân'], ['bao-mat', 'Bảo mật tài khoản']] as const
const readTab = () => { const value = location.pathname.replace(/^\/tai-khoan\/?/, '').split('/')[0]; return tabs.some(([key]) => key === value) ? value : '' }
const closed = new Set(['HOAN_THANH', 'TU_CHOI', 'KHONG_GIAI_QUYET', 'DUNG'])
const labels: Record<string, string> = { BOOKED: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Đã đến quầy', COMPLETED: 'Đã phục vụ', CANCELLED: 'Đã hủy', RECEIVED: 'Đã tiếp nhận', REPLIED: 'Đã trả lời', CLOSED: 'Đã đóng', PENDING: 'Chờ khai chứng từ', DUE: 'Chờ nộp', PAID: 'Chờ đối chiếu chứng từ', RECONCILED: 'Đã đối chiếu', WAIVED: 'Đã miễn thu', REFUNDED: 'Đã ghi nhận hoàn trả' }
const formatDate = (value?: string) => value ? new Date(value).toLocaleString('vi-VN', value.includes('T') ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }) : 'Chưa có'
function Empty({ children }: { children: ReactNode }) { return <p className="workspace-empty">{children}</p> }

export function CitizenWorkspace<T>({ name, request, onChanged, renderProfile, renderCase, onSignOut }: { onSignOut: () => Promise<void>; name: string; request: Request; onChanged: (user: T) => void; renderProfile: (onDirtyChange: (dirty: boolean) => void) => ReactNode; renderCase: (code: string, onUpdated: () => void) => ReactNode }) {
  const [tab, setTab] = useState(readTab)
  const [caseCode, setCaseCode] = useState(() => new URLSearchParams(location.search).get('case') || '')
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
  const refresh = useCallback(async () => {
    setError(''); setRefreshing(true)
    try { const result = await request<Workspace>('/api/citizen/workspace'); setData(result) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa tải được dữ liệu tài khoản.') }
    finally { setRefreshing(false) }
  }, [request])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const sync = () => { setTab(readTab()); setCaseCode(new URLSearchParams(location.search).get('case') || ''); setPage(1) }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  function navigate(next: string, code = '') {
    if (profileDirty && next !== tab && !window.confirm('Thông tin cá nhân mới chưa được lưu. Bạn có muốn rời mục này?')) return
    if (next !== tab) setProfileDirty(false)
    history.pushState({ route: 'citizen-profile' }, '', `/tai-khoan${next ? '/' + next : ''}${code ? '?case=' + encodeURIComponent(code) : ''}`)
    setTab(next); setCaseCode(code); setQuery(''); setStatus(''); setPage(1); setNotice(''); setError(''); void refresh(); window.scrollTo(0, 0)
  }
  async function markRead(ids: string[]) {
    if (!ids.length) return
    setBusy(true); setError('')
    try { await request('/api/citizen/notifications/read', { ids }); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa cập nhật được thông báo.') }
    finally { setBusy(false) }
  }
  async function deleteDraft(draft: Draft) {
    if (!window.confirm(`Xóa hồ sơ nháp “${draft.title}”?`)) return
    setBusy(true); setError('')
    try { await request('/api/citizen/drafts', { id: draft.id, version: draft.version, action: 'delete' }); setNotice('Đã xóa hồ sơ nháp.'); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa xóa được hồ sơ nháp.') }
    finally { setBusy(false) }
  }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); setBusy(true); setError(''); setNotice('')
    try { const result = await request<{ user: T }>('/api/citizen/change-password', values); onChanged(result.user); form.reset(); setNotice('Đã đổi mật khẩu và đăng xuất các phiên khác. Phiên hiện tại tiếp tục hoạt động.'); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa đổi được mật khẩu.') }
    finally { setBusy(false) }
  }
  async function signOut() {
    setBusy(true); setError('')
    try { await onSignOut() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa đăng xuất được.') }
    finally { setBusy(false) }
  }
  async function revokeSessions() {
    setBusy(true); setError(''); setNotice('')
    try { await request('/api/citizen/revoke-other-sessions', {}); setNotice('Đã đăng xuất các phiên khác.'); await refresh() }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa đăng xuất được các phiên khác.') }
    finally { setBusy(false) }
  }
  const unread = data?.notifications.filter(item => !item.read) || []
  const cases = (data?.cases || []).filter(item => (!status || (status === '__ACTIVE__' ? !closed.has(item.status) : item.status === status)) && `${item.code} ${item.procedure?.name || item.procedureCode} ${item.receivingAgency}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi').trim()))
  const pages = Math.max(1, Math.ceil(cases.length / 10))
  function caseList(records: Case[]) {
    return records.length ? <div className="workspace-list">{records.map(item => <article className="workspace-row" key={item.code}><div><h3 className="workspace-title">{item.procedure?.name || item.procedureCode}</h3><p><b>{item.code}</b> · {item.receivingAgency}</p><p>Ngày gửi: {formatDate(item.createdAt)}{item.deadline && ` · Hạn trả: ${formatDate(item.deadline)}`}</p>{item.fee?.status === 'DUE' && <p className="workspace-task-note">Chờ chứng từ khoản thu: {Number(item.fee.amount || 0).toLocaleString('vi-VN')} đồng</p>}</div><div className="workspace-row-actions"><span className="workspace-state">{item.statusLabel}</span><button className="button secondary" onClick={() => navigate('ho-so', item.code)}>{item.status === 'CHO_BO_SUNG' ? 'Xem yêu cầu bổ sung' : item.fee?.status === 'DUE' ? 'Xem khoản thu' : item.status === 'DA_PHAT_HANH' || item.status === 'HOAN_THANH' ? 'Xem kết quả' : 'Xem chi tiết'}</button></div></article>)}</div> : <Empty>Chưa có hồ sơ phù hợp. <a href="/nop-ho-so">Lập hồ sơ mới</a> hoặc thay đổi bộ lọc.</Empty>
  }
  const primaryAction = tab === 'lich-hen' ? { href: '/tien-ich?tab=lich-hen', label: 'Đặt lịch hẹn' } : tab === 'phan-anh' ? { href: '/tien-ich?tab=phan-anh', label: 'Gửi phản ánh' } : ['', 'ho-so', 'ho-so-nhap', 'tai-lieu'].includes(tab) && !caseCode ? { href: '/nop-ho-so', label: 'Nộp hồ sơ mới' } : null
  return <div className="citizen-workspace"><header className="workspace-masthead"><a className="workspace-brand" href="/" aria-label="Về trang chủ Cổng dịch vụ công Hà Nội"><img src="/images/hanoi-logo.png" alt="Biểu trưng Hà Nội" /><span>CỔNG DỊCH VỤ CÔNG HÀ NỘI<small>Khu vực dành cho công dân</small></span></a><nav aria-label="Điều hướng chung"><a href="/">Về cổng dịch vụ</a><a href="/huong-dan">Hướng dẫn sử dụng</a><button type="button" className="text-button" disabled={busy} onClick={signOut}>Đăng xuất</button></nav></header><div className="workspace-layout">
    <aside className="workspace-sidebar"><div className="workspace-person"><span className="workspace-avatar" aria-hidden="true">{name.split(' ').filter(Boolean).slice(-2).map(value => value[0]).join('')}</span><div><strong>{name}</strong><small>Tài khoản công dân</small></div></div><label className="workspace-mobile-navigation">Chức năng tài khoản<select value={tab} onChange={event => navigate(event.target.value)}>{tabs.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><nav aria-label="Chức năng tài khoản công dân">{tabs.map(([key, label]) => <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} className={tab === key ? 'active' : ''} onClick={() => navigate(key)}>{label}{key === 'thong-bao' && unread.length > 0 && <span className="workspace-count">{unread.length}</span>}</button>)}</nav></aside>
    <main className="workspace-content"><div className="workspace-heading"><div><h1>{tab === '' ? 'Tổng quan tài khoản' : tabs.find(([key]) => key === tab)?.[1]}</h1><p>{tab === '' ? 'Theo dõi hồ sơ và các giao dịch hành chính của bạn.' : tab === 'ho-so' ? 'Tra cứu hồ sơ đã nộp và thực hiện yêu cầu từ cơ quan.' : tab === 'thong-tin-ca-nhan' ? 'Cập nhật thông tin để dùng lại khi làm thủ tục.' : ''}</p></div><div className="workspace-heading-actions">{tab !== 'thong-tin-ca-nhan' && <button type="button" className="button secondary" onClick={refresh} disabled={refreshing}>{refreshing ? 'Đang tải…' : 'Làm mới'}</button>}{primaryAction && <a className="button primary" href={primaryAction.href}>{primaryAction.label}</a>}</div></div>
      {data?.sampleData && <p className="workspace-sample-note">Tài khoản đã được bổ sung dữ liệu minh họa để thực hành trong học phần.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="citizen-success" role="status">{notice}</p>}
      {!data && !error && <p role="status">Đang tải dữ liệu của bạn…</p>}
      {tab === 'thong-tin-ca-nhan' ? renderProfile(setProfileDirty) : data && <>
        {tab === '' && <><div className="workspace-totals">{[['Hồ sơ đang xử lý', data.cases.filter(item => !closed.has(item.status)).length, 'ho-so'], ['Cần bổ sung', data.cases.filter(item => item.status === 'CHO_BO_SUNG').length, 'ho-so'], ['Đã hoàn thành', data.cases.filter(item => item.status === 'HOAN_THANH').length, 'ho-so'], ['Nháp chưa gửi', data.drafts.length, 'ho-so-nhap']].map(([label, count, next]) => <button key={label} onClick={() => { navigate(String(next)); if (label === 'Hồ sơ đang xử lý') setStatus('__ACTIVE__'); else if (label === 'Cần bổ sung') setStatus('CHO_BO_SUNG'); else if (label === 'Đã hoàn thành') setStatus('HOAN_THANH') }}><strong>{count}</strong><span>{label}</span></button>)}</div><section className="workspace-section"><h3>Việc cần thực hiện</h3>{data.cases.filter(item => item.status === 'CHO_BO_SUNG' || item.fee?.status === 'DUE').length ? caseList(data.cases.filter(item => item.status === 'CHO_BO_SUNG' || item.fee?.status === 'DUE')) : <Empty>Hiện chưa có yêu cầu bổ sung hoặc khoản thu đang chờ bạn thực hiện.</Empty>}</section><section className="workspace-section"><h3>Hồ sơ gần đây</h3>{caseList(data.cases.slice(0, 5))}</section></>}
        {tab === 'ho-so' && (caseCode ? <><button className="text-button workspace-back" onClick={() => navigate('ho-so')}>Về danh sách hồ sơ</button>{renderCase(caseCode, () => { void refresh() })}</> : <><div className="workspace-filters"><label>Tìm hồ sơ<input type="search" placeholder="Mã hồ sơ, tên thủ tục hoặc cơ quan" value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></label><label>Trạng thái<select value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">Tất cả trạng thái</option><option value="__ACTIVE__">Đang xử lý (chưa kết thúc)</option>{Array.from(new Map(data.cases.map(item => [item.status, item.statusLabel]))).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><span>{cases.length} hồ sơ</span></div>{caseList(cases.slice((Math.min(page, pages) - 1) * 10, Math.min(page, pages) * 10))}{pages > 1 && <div className="workspace-pagination"><button className="button secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Trang trước</button><span>Trang {Math.min(page, pages)} / {pages}</span><button className="button secondary" disabled={page >= pages} onClick={() => setPage(value => value + 1)}>Trang sau</button></div>}</>)}
        {tab === 'ho-so-nhap' && <><p>Nháp chỉ lưu nội dung tờ khai trong tài khoản, chưa gửi đến cơ quan. Tệp đính kèm cần được chọn lại khi mở nháp.</p>{data.drafts.length ? <div className="workspace-list">{data.drafts.map(item => <article className="workspace-row" key={item.id}><div><h3>{item.title}</h3><p>{item.procedureCode} · Lưu lúc {formatDate(item.updatedAt)}</p></div><div className="workspace-row-actions"><a className="button primary" href={`/nop-ho-so?procedure=${encodeURIComponent(item.procedureCode)}&draft=${encodeURIComponent(item.id)}`}>Tiếp tục khai</a><button className="text-button" disabled={busy} onClick={() => deleteDraft(item)}>Xóa nháp</button></div></article>)}</div> : <Empty>Bạn chưa lưu hồ sơ nháp. Khi đang lập hồ sơ, chọn “Lưu nháp vào tài khoản”.</Empty>}</>}
        {tab === 'tai-lieu' && <><p>Giấy tờ đã gửi và thông báo đã phát hành của các hồ sơ thuộc tài khoản. Giấy tờ tự nộp chưa được xem là dữ liệu đã xác thực. Khi lập hồ sơ mới, có thể chọn lại giấy tờ ở bước Thành phần hồ sơ.</p>{data.documents.length ? <div className="workspace-list">{data.documents.map(item => <article className="workspace-row" key={item.id}><div><h3>{item.name}</h3><p>{item.kind} · {item.code} · {(item.size / 1024).toFixed(0)} KB</p></div><div className="workspace-row-actions"><a className="button secondary" href={item.downloadUrl}>Tải tài liệu</a><button className="text-button" onClick={() => navigate('ho-so', item.code)}>Xem hồ sơ</button></div></article>)}</div> : <Empty>Chưa có tài liệu đã nộp hoặc thông báo phát hành trong tài khoản.</Empty>}<h3>Kết quả giải quyết</h3>{caseList(data.cases.filter(item => item.result && ['DA_PHAT_HANH', 'HOAN_THANH'].includes(item.status)))}</>}
        {tab === 'thong-bao' && <><div className="workspace-notice-tools"><label><input type="checkbox" checked={unreadOnly} onChange={event => setUnreadOnly(event.target.checked)} />Chỉ hiện chưa đọc</label><button className="button secondary" disabled={busy || !unread.length} onClick={() => markRead(unread.map(item => item.id))}>Đánh dấu tất cả đã đọc</button></div>{data.notifications.filter(item => !unreadOnly || !item.read).length ? <div className="workspace-list">{data.notifications.filter(item => !unreadOnly || !item.read).map(item => <article className={`workspace-row${item.read ? '' : ' unread'}`} key={item.id}><div><h3>{item.title}</h3><p>{item.detail}</p><p>{item.code} · {formatDate(item.at)} · {item.read ? 'Đã đọc' : 'Chưa đọc'}</p></div><div className="workspace-row-actions"><button className="button secondary" onClick={async () => { await markRead([item.id]); navigate(item.kind === 'case' ? 'ho-so' : item.kind === 'appointment' ? 'lich-hen' : 'phan-anh', item.kind === 'case' ? item.code : '') }}>Xem nội dung</button>{!item.read && <button className="text-button" disabled={busy} onClick={() => markRead([item.id])}>Đánh dấu đã đọc</button>}</div></article>)}</div> : <Empty>Chưa có thông báo phù hợp. Thông báo sẽ xuất hiện khi hồ sơ, lịch hẹn hoặc phản ánh của bạn có dữ liệu.</Empty>}</>}
        {tab === 'lich-hen' && <>{data.appointments.length ? <div className="workspace-list">{data.appointments.map(item => <article className="workspace-row" key={item.code}><div><h3>{item.procedure_name}</h3><p>{item.code} · {item.agency}</p><p>{formatDate(item.appointment_date)} · {item.time_slot} · Số thứ tự: {item.queue_number}</p>{item.counter_note && <p>Thông tin từ cơ quan: {item.counter_note}</p>}</div><span className="workspace-state">{labels[item.status] || item.status}</span></article>)}</div> : <Empty>Bạn chưa đặt lịch hẹn bằng tài khoản này.</Empty>}</>}
        {tab === 'phan-anh' && <>{data.feedback.length ? <div className="workspace-list">{data.feedback.map(item => <article className="workspace-feedback" key={item.code}><header><h3>{item.title}</h3><span className="workspace-state">{labels[item.status] || item.status}</span></header><p>{item.code} · {item.agency} · {formatDate(item.created_at)}</p><p>{item.content}</p>{item.reply && <div className="workspace-reply"><h4>Nội dung trả lời</h4><p>{item.reply}</p><small>{formatDate(item.replied_at)}</small></div>}</article>)}</div> : <Empty>Bạn chưa gửi phản ánh bằng tài khoản này.</Empty>}</>}
        {tab === 'khoan-thu' && <><p>Khoản thu và chứng từ do bạn khai, chờ cán bộ tài chính đối chiếu. Hệ thống chưa kết nối cổng thanh toán hoặc ngân hàng.</p>{data.cases.filter(item => item.fee?.amount || item.payments?.length).length ? <div className="workspace-list">{data.cases.filter(item => item.fee?.amount || item.payments?.length).map(item => <article className="workspace-row" key={item.code}><div><h3>{item.procedure?.name || item.procedureCode}</h3><p>{item.code} · {Number(item.fee?.amount || 0).toLocaleString('vi-VN')} đồng · {labels[item.fee?.status || ''] || item.fee?.status}</p><p>{item.fee?.basis}</p>{item.payments?.map(payment => <p key={payment.transactionRef}>{payment.transactionRef} · {Number(payment.amount).toLocaleString('vi-VN')} đồng · {labels[payment.status] || payment.status}{payment.payerReference && ` · Chứng từ: ${payment.payerReference}`}</p>)}</div><button className="button secondary" onClick={() => navigate('ho-so', item.code)}>Xem khoản thu, gửi chứng từ</button></article>)}</div> : <Empty>Tài khoản chưa có khoản thu phát sinh từ hồ sơ.</Empty>}</>}
        {tab === 'bao-mat' && <><section className="workspace-section"><h3>Đổi mật khẩu</h3><form className="form-stack workspace-password" onSubmit={changePassword}><label>Mật khẩu hiện tại<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} disabled={busy} /></label><label>Mật khẩu mới<input type="password" name="newPassword" autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} /></label><small>Từ 12 ký tự, gồm chữ hoa, chữ thường và chữ số.</small><label>Nhập lại mật khẩu mới<input type="password" name="confirmPassword" autoComplete="new-password" required minLength={12} maxLength={128} disabled={busy} /></label><button className="button primary" disabled={busy}>Đổi mật khẩu</button></form></section><section className="workspace-section"><h3>Phiên đăng nhập đang hoạt động</h3><p>{data.sessions.length} phiên. Không có thông tin thiết bị vì hệ thống hiện chưa thu thập dữ liệu này.</p><div className="workspace-list">{data.sessions.map((item, index) => <article className="workspace-row" key={`${item.createdAt}-${index}`}><div><h4>{item.current ? 'Phiên hiện tại' : 'Phiên khác'}</h4><p>Đăng nhập: {formatDate(item.createdAt)} · Hết hạn: {formatDate(new Date(item.expiresAt * 1000).toISOString())}</p></div></article>)}</div><button className="button secondary" disabled={busy || !data.sessions.some(item => !item.current)} onClick={revokeSessions}>Đăng xuất tất cả phiên khác</button></section></>}
      </>}
    </main></div></div>
}
