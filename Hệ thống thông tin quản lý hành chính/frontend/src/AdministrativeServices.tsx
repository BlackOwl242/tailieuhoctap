import { useCallback, useEffect, useState, type FormEvent } from 'react'

type Request = <T>(path: string, body?: unknown) => Promise<T>
type Person = { role: string; agencyScope?: string }
type Procedure = { code: string; name: string }
type DeskRecord = { code: string; agency: string; status: string; citizen_name?: string; sender_name?: string; phone?: string; title?: string; content?: string; reply?: string; appointment_date?: string; time_slot?: string; counter_note?: string }
const statusNames: Record<string, string> = { BOOKED: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', CHECKED_IN: 'Đã đến quầy', COMPLETED: 'Đã phục vụ', CANCELLED: 'Đã hủy', RECEIVED: 'Chờ trả lời', REPLIED: 'Đã trả lời', DA_XAC_NHAN: 'Đã xác nhận', DA_TRA_LOI: 'Đã trả lời' }
const nextStatuses: Record<string, string[]> = { BOOKED: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['CHECKED_IN', 'CANCELLED'], CHECKED_IN: ['COMPLETED'], DA_XAC_NHAN: ['CHECKED_IN', 'CANCELLED'], DA_DAT: ['CONFIRMED', 'CANCELLED'], CHO_XAC_NHAN: ['CONFIRMED', 'CANCELLED'] }

function DeskRecordRow({ record, appointment, request, onChanged }: { record: DeskRecord; appointment: boolean; request: Request; onChanged: () => Promise<void> }) {
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const options = nextStatuses[record.status] || []
  const closed = appointment ? !options.length : ['REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(record.status)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await request('/api/service-desk/update', { code: record.code, expectedStatus: record.status, status, note })
      await onChanged(); setNote(''); setStatus('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được nội dung xử lý.') }
    finally { setBusy(false) }
  }
  return <article className="sandbox-payment-row">
    <header><div><b>{record.code} · {record.citizen_name || record.sender_name}</b><span>{record.agency} · {record.phone}</span></div><strong>{statusNames[record.status] || record.status}</strong></header>
    {appointment ? <p>{record.appointment_date} · {record.time_slot} · {record.counter_note}</p> : <><h3>{record.title}</h3><p>{record.content}</p>{record.reply && <p><b>Nội dung trả lời:</b> {record.reply}</p>}</>}
    {!closed && <form className="sandbox-payment-action form-grid account-form" onSubmit={save}>
      {appointment && <label>Trạng thái tiếp theo<select required value={status} onChange={event => setStatus(event.target.value)}><option value="">Chọn thao tác</option>{options.map(value => <option key={value} value={value}>{statusNames[value]}</option>)}</select></label>}
      <label>{appointment ? 'Ghi chú xử lý' : 'Nội dung trả lời'}<textarea required minLength={8} maxLength={2000} rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
      <button className="button primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu nội dung xử lý'}</button>
    </form>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </article>
}

export function AdministrativeServiceDesk({ user, procedures, request }: { user: Person; procedures: Procedure[]; request: Request }) {
  const [appointments, setAppointments] = useState<DeskRecord[]>([])
  const [feedback, setFeedback] = useState<DeskRecord[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID())
  const eligible = ['intake', 'leader'].includes(user.role)
  const load = useCallback(async () => {
    if (!eligible) return
    const result = await request<{ appointments: DeskRecord[]; feedback: DeskRecord[] }>('/api/service-desk')
    setAppointments(result.appointments); setFeedback(result.feedback)
  }, [eligible, request])
  useEffect(() => {
    if (!eligible) return
    let active = true
    void request<{ appointments: DeskRecord[]; feedback: DeskRecord[] }>('/api/service-desk').then(result => {
      if (active) { setAppointments(result.appointments); setFeedback(result.feedback) }
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Không tải được lịch hẹn.') })
    return () => { active = false }
  }, [eligible, request])
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form)); setBusy(true); setError(''); setNotice('')
    try {
      const result = await request<{ case: { code: string } }>('/api/cases/counter', { ...values, submissionKey, identityVerified: values.identityVerified === 'on' })
      setNotice(`Đã tiếp nhận hồ sơ ${result.case.code}. Mở lại bàn cán bộ để xem hồ sơ, cấp khóa tra cứu và thực hiện số hóa.`)
      setSubmissionKey(crypto.randomUUID()); form.reset()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa tiếp nhận được hồ sơ.') }
    finally { setBusy(false) }
  }
  if (!eligible) return null
  return <>
    {user.role === 'intake' && <section className="panel"><details><summary><b>Tiếp nhận hồ sơ trực tiếp tại quầy</b></summary>
      <p>Ghi nhận giấy tờ đã đối chiếu với người nộp. Tệp quét được bổ sung trong chi tiết hồ sơ sau khi tiếp nhận.</p>
      <form className="sandbox-signer-form form-grid account-form" onSubmit={create}>
        <label>Thủ tục<select name="procedureCode" required><option value="">Chọn thủ tục</option>{procedures.map(p => <option key={p.code} value={p.code}>{p.code} · {p.name}</option>)}</select></label>
        <label>Cơ quan tiếp nhận<input name="receivingAgency" required maxLength={180} defaultValue={user.agencyScope === 'Toàn thành phố' ? '' : user.agencyScope} readOnly={!!user.agencyScope && user.agencyScope !== 'Toàn thành phố'} /></label>
        <label>Chủ thể<select name="applicantType"><option value="citizen">Cá nhân</option><option value="organization">Tổ chức</option></select></label>
        <label>Họ tên / tên tổ chức<input name="applicantName" required minLength={2} maxLength={150} /></label>
        <label>Số định danh / mã tổ chức<input name="citizenId" required minLength={3} maxLength={40} /></label>
        <label>Điện thoại<input name="applicantPhone" type="tel" required minLength={8} maxLength={40} /></label>
        <label>Email<input name="applicantEmail" type="email" maxLength={254} /></label>
        <label>Địa chỉ<input name="applicantAddress" required minLength={3} maxLength={300} /></label>
        <label>Nội dung yêu cầu<textarea name="requestSummary" required minLength={8} maxLength={1200} rows={3} /></label>
        <label>Danh mục giấy tờ đã nhận<textarea name="paperOriginals" required minLength={8} maxLength={2000} rows={3} /></label>
        <label className="check-row"><input type="checkbox" name="identityVerified" style={{ minHeight: 16, padding: 0 }} required /> Đã đối chiếu người nộp và kiểm đếm giấy tờ tiếp nhận</label>
        <button className="button primary" disabled={busy}>{busy ? 'Đang tiếp nhận…' : 'Ghi nhận tiếp nhận tại quầy'}</button>
      </form>
    </details></section>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="citizen-success" role="status">{notice} <a href="/staff">Mở bàn cán bộ</a></p>}
    <section className="panel"><h2>Lịch hẹn tại cơ quan</h2><button className="text-button" onClick={() => { setError(''); void load().catch(cause => setError(String(cause))) }}>Tải lại danh sách</button>
      <div className="sandbox-payment-list">{appointments.map(record => <DeskRecordRow key={record.code} record={record} appointment request={request} onChanged={load} />)}</div>
      {!appointments.length && <p>Chưa có lịch hẹn trong phạm vi được cấp.</p>}
    </section>
    <section className="panel"><h2>Phản ánh, kiến nghị gửi đến cơ quan</h2>
      <div className="sandbox-payment-list">{feedback.map(record => <DeskRecordRow key={record.code} record={record} appointment={false} request={request} onChanged={load} />)}</div>
      {!feedback.length && <p>Chưa có phản ánh trong phạm vi được cấp.</p>}
    </section>
  </>
}

export function PublicAdministrativeServices({ request }: { request: Request }) {
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState('appointments')
  const [agencies, setAgencies] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [record, setRecord] = useState<DeskRecord | null>(null)
  useEffect(() => {
    if (!open) return
    void request<{ agencies: string[] }>('/api/public/agencies').then(r => setAgencies(r.agencies)).catch(cause => setError(String(cause)))
  }, [open, request])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form)); setBusy(true); setError(''); setNotice(''); setRecord(null)
    try {
      if (kind === 'lookup') {
        const result = await request<{ record: DeskRecord }>('/api/public/service-lookup', values); setRecord(result.record)
      } else {
        const result = await request<{ code: string; message: string }>(`/api/public/${kind}`, values)
        setNotice(`${result.message} Mã theo dõi: ${result.code}. Giữ mã này cùng số điện thoại đã khai để tra cứu.`); form.reset()
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa gửi được thông tin.') }
    finally { setBusy(false) }
  }
  return <section className="portal-section"><details onToggle={event => setOpen(event.currentTarget.open)}><summary><b>Đặt lịch hẹn, gửi phản ánh và tra cứu kết quả</b></summary>
    {open && <div className="panel"><div className="form-actions">{[['appointments', 'Đặt lịch hẹn'], ['pakn', 'Gửi phản ánh'], ['lookup', 'Tra cứu']].map(([value, label]) => <button type="button" className={`button ${kind === value ? 'primary' : 'secondary'}`} key={value} onClick={() => { setKind(value); setNotice(''); setError(''); setRecord(null) }}>{label}</button>)}</div>
      <form className="citizen-action-form" key={kind} onSubmit={submit}>
        {kind === 'lookup' ? <label className="citizen-field">Mã lịch hẹn / phản ánh<input name="code" required maxLength={40} /></label> : <>
          <label className="citizen-field">Họ và tên<input name="name" required minLength={2} maxLength={150} /></label>
          <label className="citizen-field">Cơ quan<select name="agency" required><option value="">Chọn cơ quan</option>{agencies.map(a => <option key={a}>{a}</option>)}</select></label>
        </>}
        <label className="citizen-field">Số điện thoại<input name="phone" type="tel" required minLength={8} maxLength={40} /></label>
        {kind === 'appointments' && <>
          <label className="citizen-field">Mã thủ tục<input name="procedureCode" required maxLength={40} placeholder="Mã thủ tục từ danh mục bên trên" /></label>
          <label className="citizen-field">Ngày hẹn<input name="date" type="date" required /></label>
          <label className="citizen-field">Khung giờ<select name="timeSlot" required>{['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'].map(slot => <option key={slot}>{slot}</option>)}</select></label>
          <label className="citizen-field">Nội dung cần hướng dẫn<textarea name="note" rows={3} maxLength={1000} /></label>
        </>}
        {kind === 'pakn' && <><label className="citizen-field">Email<input name="email" type="email" maxLength={254} /></label><label className="citizen-field">Tiêu đề<input name="title" required minLength={8} maxLength={180} /></label><label className="citizen-field">Nội dung<textarea name="content" required minLength={20} maxLength={4000} rows={5} /></label></>}
        <button className="button primary" disabled={busy}>{busy ? 'Đang xử lý…' : kind === 'lookup' ? 'Tra cứu' : 'Gửi thông tin'}</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="citizen-success" role="status">{notice}</p>}
      {record && <article className="citizen-case-section"><h3>{record.code} · {statusNames[record.status] || record.status}</h3><p>{record.agency}</p><p>{record.appointment_date} {record.time_slot}</p><p>{record.title}</p><p>{record.reply || record.counter_note || 'Chưa có nội dung trả lời mới.'}</p></article>}
    </div>}
  </details></section>
}
