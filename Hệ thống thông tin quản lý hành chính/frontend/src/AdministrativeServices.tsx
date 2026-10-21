import { useCallback, useEffect, useState, type FormEvent } from 'react'

type Request = <T>(path: string, body?: unknown) => Promise<T>
type Person = { role: string; agencyScope?: string }
type Procedure = { code: string; name: string; submissionEnabled?: boolean }
type DeskRecord = {
  code: string
  agency: string
  status: string
  citizen_name?: string
  sender_name?: string
  phone?: string
  email?: string
  procedure_code?: string
  procedure_name?: string
  queue_number?: string | number
  note?: string
  topic?: string
  title?: string
  content?: string
  reply?: string
  replied_by?: string
  replied_at?: string
  appointment_date?: string
  time_slot?: string
  counter_note?: string
  created_at?: string
}
const statusNames: Record<string, string> = {
  BOOKED: 'Chờ xác nhận',
  DA_DAT: 'Đã đặt lịch',
  CHO_XAC_NHAN: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  CHECKED_IN: 'Đã đến quầy',
  COMPLETED: 'Đã phục vụ',
  CANCELLED: 'Đã hủy',
  DA_HUY: 'Đã hủy',
  HUY: 'Đã hủy',
  RECEIVED: 'Chờ trả lời',
  MOI_TIEP_NHAN: 'Mới tiếp nhận',
  DANG_XU_LY: 'Đang xử lý',
  REPLIED: 'Đã trả lời',
  DA_TRA_LOI: 'Đã trả lời',
  CLOSED: 'Đã đóng',
}
const nextStatuses: Record<string, string[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED'],
  DA_DAT: ['CONFIRMED', 'CANCELLED'],
  CHO_XAC_NHAN: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  DA_XAC_NHAN: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED'],
}

function DeskRecordRow({ record, appointment, canEdit, request, onChanged }: { record: DeskRecord; appointment: boolean; canEdit: boolean; request: Request; onChanged: () => Promise<void> }) {
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const options = nextStatuses[record.status] || []
  const closed = !canEdit || (appointment ? !options.length : ['REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(record.status))
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await request('/api/service-desk/update', { code: record.code, expectedStatus: record.status, status, note })
      await onChanged(); setNote(''); setStatus('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được nội dung xử lý.') }
    finally { setBusy(false) }
  }
  return <article className="sandbox-payment-row">
    <header><div><b>{record.code} · {record.citizen_name || record.sender_name || 'Công dân'}</b><span>{record.agency}{record.phone ? ` · ${record.phone}` : ''}{record.email ? ` · ${record.email}` : ''}</span></div><strong>{statusNames[record.status] || record.status}</strong></header>
    {appointment ? <>
      <p><b>Lịch hẹn:</b> {record.appointment_date} · {record.time_slot}{record.queue_number ? ` · Số thứ tự: ${record.queue_number}` : ''}</p>
      {(record.procedure_code || record.procedure_name) && <p><b>Thủ tục:</b> {[record.procedure_code, record.procedure_name].filter(Boolean).join(' · ')}</p>}
      {record.note && <p><b>Nội dung công dân đăng ký:</b> {record.note}</p>}
      {record.counter_note && <p><b>Ghi chú quầy một cửa:</b> {record.counter_note}</p>}
    </> : <>
      <h3>{record.title}{record.topic ? ` (${record.topic})` : ''}</h3>
      <p>{record.content}</p>
      {record.reply && <p><b>Nội dung trả lời:</b> {record.reply}{record.replied_by ? ` — ${record.replied_by}` : ''}{record.replied_at ? ` (${record.replied_at})` : ''}</p>}
    </>}
    {!closed && <form className="sandbox-payment-action form-grid account-form" onSubmit={save}>
      {appointment && <label className="span-two">Trạng thái tiếp theo<select required value={status} onChange={event => setStatus(event.target.value)}><option value="">Chọn thao tác</option>{options.map(value => <option key={value} value={value}>{statusNames[value]}</option>)}</select></label>}
      <label className="span-two">{appointment ? 'Ghi chú xử lý' : 'Nội dung trả lời'}<textarea required minLength={8} maxLength={2000} rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
      <div className="form-actions span-two"><button className="button primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu nội dung xử lý'}</button></div>
    </form>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </article>
}

export function AdministrativeServiceDesk({ user, procedures, request, onCaseCreated }: { user: Person; procedures: Procedure[]; request: Request; onCaseCreated?: (caseRecord: any) => Promise<void> | void }) {
  const [appointments, setAppointments] = useState<DeskRecord[]>([])
  const [feedback, setFeedback] = useState<DeskRecord[]>([])
  const [summary, setSummary] = useState<{ appointments?: Record<string, number>; feedback?: Record<string, number> } | null>(null)
  const [createdCase, setCreatedCase] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID())
  const eligible = ['intake', 'leader', 'admin'].includes(user.role)
  const canEdit = ['intake', 'leader'].includes(user.role)
  const load = useCallback(async () => {
    if (!eligible) return
    const result = await request<{ appointments: DeskRecord[]; feedback: DeskRecord[]; summary?: { appointments?: Record<string, number>; feedback?: Record<string, number> } }>('/api/service-desk')
    setAppointments(result.appointments || []); setFeedback(result.feedback || []); setSummary(result.summary || null)
  }, [eligible, request])
  useEffect(() => {
    if (!eligible) return
    let active = true
    void request<{ appointments: DeskRecord[]; feedback: DeskRecord[]; summary?: { appointments?: Record<string, number>; feedback?: Record<string, number> } }>('/api/service-desk').then(result => {
      if (active) { setAppointments(result.appointments || []); setFeedback(result.feedback || []); setSummary(result.summary || null) }
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không tải được lịch hẹn.') })
    return () => { active = false }
  }, [eligible, request])
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form)); setBusy(true); setError(''); setNotice(''); setCreatedCase(null)
    try {
      const result = await request<{ case: any }>('/api/cases/counter', { ...values, submissionKey, identityVerified: values.identityVerified === 'on' })
      setCreatedCase(result.case)
      setNotice(`Đã tiếp nhận hồ sơ ${result.case.code} tại quầy Một cửa. Bạn có thể mở trực tiếp hồ sơ để in Phiếu tiếp nhận (Mẫu 01), cấp khóa tra cứu và thực hiện số hóa.`)
      setSubmissionKey(crypto.randomUUID()); form.reset()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa tiếp nhận được hồ sơ.') }
    finally { setBusy(false) }
  }
  if (!eligible) return null
  return <>
    {user.role === 'intake' && <section className="panel service-desk-intake"><details open><summary className="service-desk-summary"><b>Tiếp nhận hồ sơ trực tiếp tại quầy Một cửa</b></summary>
      <p className="muted" style={{ margin: '8px 0 16px' }}>Ghi nhận giấy tờ bản chính/bản sao đã đối chiếu với người nộp. Tệp quét số hóa được bổ sung trong chi tiết hồ sơ sau khi tiếp nhận.</p>
      <form className="form-grid account-form" onSubmit={create}>
        <label className="span-two">Thủ tục<select name="procedureCode" required><option value="">Chọn thủ tục</option>{procedures.filter(procedure => procedure.submissionEnabled === true).map(p => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}</select></label>
        <label>Cơ quan tiếp nhận<input name="receivingAgency" required maxLength={180} defaultValue={user.agencyScope === 'Toàn thành phố' ? '' : user.agencyScope} readOnly={!!user.agencyScope && user.agencyScope !== 'Toàn thành phố'} /></label>
        <label>Chủ thể<select name="applicantType"><option value="citizen">Cá nhân</option><option value="organization">Tổ chức</option></select></label>
        <label>Họ tên / tên tổ chức<input name="applicantName" required minLength={2} maxLength={150} /></label>
        <label>Số định danh / mã tổ chức<input name="citizenId" required minLength={3} maxLength={40} /></label>
        <label>Điện thoại<input name="applicantPhone" type="tel" required minLength={8} maxLength={40} /></label>
        <label>Email<input name="applicantEmail" type="email" maxLength={254} /></label>
        <label className="span-two">Địa chỉ<input name="applicantAddress" required minLength={3} maxLength={300} /></label>
        <label className="span-two">Nội dung yêu cầu<textarea name="requestSummary" required minLength={8} maxLength={1200} rows={3} /></label>
        <label className="span-two">Danh mục giấy tờ đã nhận<textarea name="paperOriginals" required minLength={8} maxLength={2000} rows={3} /></label>
        <label className="span-two check-row"><input type="checkbox" name="identityVerified" required /> Đã đối chiếu người nộp và kiểm đếm giấy tờ tiếp nhận</label>
        <div className="form-actions span-two"><button className="button primary" disabled={busy}>{busy ? 'Đang tiếp nhận…' : 'Ghi nhận tiếp nhận tại quầy'}</button></div>
      </form>
    </details></section>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="citizen-success" role="status">{notice} {createdCase && onCaseCreated && <button type="button" className="button secondary" style={{ marginLeft: 8 }} onClick={() => void onCaseCreated(createdCase)}>Mở hồ sơ {createdCase.code}</button>}</p>}
    {summary && user.role === 'admin' && <section className="panel"><div className="panel-title"><div><h2>Tổng hợp Lịch hẹn &amp; Phản ánh kiến nghị toàn thành phố</h2><p>Thống kê theo trạng thái xử lý trên toàn hệ thống.</p></div></div>
      <p><b>Lịch hẹn:</b> {Object.entries(summary.appointments || {}).map(([st, cnt]) => `${statusNames[st] || st}: ${cnt}`).join(' · ') || 'Chưa có dữ liệu'}</p>
      <p><b>Phản ánh, kiến nghị:</b> {Object.entries(summary.feedback || {}).map(([st, cnt]) => `${statusNames[st] || st}: ${cnt}`).join(' · ') || 'Chưa có dữ liệu'}</p>
    </section>}
    {canEdit && <>
      <section className="panel"><div className="panel-title"><div><h2>Lịch hẹn tại cơ quan ({appointments.length})</h2><p>Xác nhận lịch hẹn, ghi nhận công dân đến quầy và kết quả hướng dẫn.</p></div><button className="button secondary" onClick={() => { setError(''); void load().catch(cause => setError(String(cause))) }}>↻ Tải lại danh sách</button></div>
        <div className="sandbox-payment-list">{appointments.map(record => <DeskRecordRow key={record.code} record={record} appointment canEdit={canEdit} request={request} onChanged={load} />)}</div>
        {!appointments.length && <div className="empty-state compact-empty">Chưa có lịch hẹn trong phạm vi được cấp.</div>}
      </section>
      <section className="panel"><div className="panel-title"><div><h2>Phản ánh, kiến nghị gửi đến cơ quan ({feedback.length})</h2><p>Tiếp nhận và phản hồi kiến nghị của người dân, tổ chức thuộc thẩm quyền cơ quan.</p></div></div>
        <div className="sandbox-payment-list">{feedback.map(record => <DeskRecordRow key={record.code} record={record} appointment={false} canEdit={canEdit} request={request} onChanged={load} />)}</div>
        {!feedback.length && <div className="empty-state compact-empty">Chưa có phản ánh trong phạm vi được cấp.</div>}
      </section>
    </>}
  </>
}

export function PublicAdministrativeServices({ request }: { request: Request }) {
  const [kind, setKind] = useState('appointments')
  const [agencies, setAgencies] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void request<{ agencies: string[] }>('/api/public/agencies').then(r => setAgencies(r.agencies)).catch(cause => setError(String(cause)))
  }, [request])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form)); setBusy(true); setError(''); setNotice('')
    try {
      const result = await request<{ code: string; queueNumber?: string | number; message: string }>(`/api/public/${kind}`, values)
      const queueInfo = result.queueNumber ? ` Số thứ tự quầy: ${result.queueNumber}.` : ''
      setNotice(`${result.message} Mã theo dõi: ${result.code}.${queueInfo} Giữ mã này để liên hệ cơ quan xử lý.`); form.reset()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa gửi được thông tin.') }
    finally { setBusy(false) }
  }
  return <section className="citizen-service-card"><div className="panel"><div className="form-actions citizen-service-tabs" role="group" aria-label="Chọn tiện ích">{[['appointments', 'Đặt lịch hẹn'], ['pakn', 'Gửi phản ánh']].map(([value, label]) => <button type="button" className={`button ${kind === value ? 'primary' : 'secondary'}`} aria-pressed={kind === value} key={value} onClick={() => { setKind(value); setNotice(''); setError('') }}>{label}</button>)}</div>
      <form className="citizen-action-form" key={kind} onSubmit={submit}>
        <>
          <label className="citizen-field">Họ và tên<input name="name" required minLength={2} maxLength={150} /></label>
          <label className="citizen-field">Cơ quan<select name="agency" required><option value="">Chọn cơ quan</option>{agencies.map(a => <option key={a}>{a}</option>)}</select></label>
        </>
        <label className="citizen-field">Số điện thoại<input name="phone" type="tel" required minLength={8} maxLength={40} /></label>
        {kind === 'appointments' && <>
          <label className="citizen-field">Mã thủ tục<input name="procedureCode" required maxLength={40} placeholder="Mã thủ tục từ danh mục bên trên" /></label>
          <label className="citizen-field">Ngày hẹn<input name="date" type="date" required /></label>
          <label className="citizen-field">Khung giờ<select name="timeSlot" required>{['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'].map(slot => <option key={slot}>{slot}</option>)}</select></label>
          <label className="citizen-field">Nội dung cần hướng dẫn<textarea name="note" rows={3} maxLength={1000} /></label>
        </>}
        {kind === 'pakn' && <><label className="citizen-field">Email<input name="email" type="email" maxLength={254} /></label><label className="citizen-field">Tiêu đề<input name="title" required minLength={8} maxLength={180} /></label><label className="citizen-field">Nội dung<textarea name="content" required minLength={20} maxLength={4000} rows={5} /></label></>}
        <button className="button primary" disabled={busy}>{busy ? 'Đang xử lý…' : 'Gửi thông tin'}</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="citizen-success" role="status">{notice}</p>}
      <p className="citizen-service-existing-track">Muốn xem tiến độ hồ sơ đã nộp? <a href="/tra-cuu-ho-so">Đến trang Tra cứu hồ sơ</a>.</p>
    </div></section>
}
