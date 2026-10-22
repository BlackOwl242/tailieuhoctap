import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react'

type Request = <T>(path: string, body?: unknown) => Promise<T>
type Person = { role: string; agencyScope?: string }
type Procedure = { code: string; name: string; submissionEnabled?: boolean; counterEnabled?: boolean }
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

const statusBadgeClass: Record<string, string> = {
  BOOKED: 'request-pending',
  DA_DAT: 'request-pending',
  CHO_XAC_NHAN: 'request-pending',
  RECEIVED: 'request-pending',
  MOI_TIEP_NHAN: 'request-pending',
  DANG_XU_LY: 'status-DANG_THU_LY',
  CONFIRMED: 'status-DA_TIEP_NHAN',
  DA_XAC_NHAN: 'status-DA_TIEP_NHAN',
  CHECKED_IN: 'status-DANG_THU_LY',
  COMPLETED: 'request-approved',
  REPLIED: 'request-approved',
  DA_TRA_LOI: 'request-approved',
  CLOSED: 'request-approved',
  CANCELLED: 'request-rejected',
  DA_HUY: 'request-rejected',
  HUY: 'request-rejected',
}

const nextStatuses: Record<string, string[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED'],
  DA_DAT: ['CONFIRMED', 'CANCELLED'],
  CHO_XAC_NHAN: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  DA_XAC_NHAN: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED'],
}

function DeskRecordTableRow({
  record,
  appointment,
  canEdit,
  request,
  onChanged,
}: {
  record: DeskRecord
  appointment: boolean
  canEdit: boolean
  request: Request
  onChanged: () => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const options = nextStatuses[record.status] || []
  const closed = !canEdit || (appointment ? !options.length : ['REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(record.status))

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await request('/api/service-desk/update', {
        code: record.code,
        expectedStatus: record.status,
        status,
        note,
      })
      await onChanged()
      setNote('')
      setStatus('')
      setExpanded(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa lưu được nội dung xử lý.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Fragment>
      <tr className={expanded ? 'is-editing' : undefined}>
        <td data-label={appointment ? 'Mã hẹn & Người đặt' : 'Mã phản ánh & Người gửi'}>
          <div className="account-cell-user">
            <b className="case-code">{record.code}</b>
            <span>{record.citizen_name || record.sender_name || 'Công dân'}</span>
            <span className="account-cell-email">
              {[record.phone, record.email].filter(Boolean).join(' · ') || 'Chưa ghi liên hệ'}
            </span>
          </div>
        </td>
        {appointment ? (
          <>
            <td data-label="Lịch hẹn & Số thứ tự">
              <div className="account-cell-user">
                <b>{record.appointment_date || '—'}</b>
                <span className="account-cell-email">
                  {record.time_slot || 'Trong giờ hành chính'}
                  {record.queue_number ? ` · STT quầy: ${record.queue_number}` : ''}
                </span>
              </div>
            </td>
            <td data-label="Thủ tục & Cơ quan">
              <div className="account-cell-user">
                <b>{[record.procedure_code, record.procedure_name].filter(Boolean).join(' · ') || 'Hướng dẫn chung'}</b>
                <span className="account-cell-email">{record.agency}</span>
              </div>
            </td>
            <td data-label="Nội dung & Ghi chú">
              <div className="desk-cell-notes">
                {record.note ? <p>{record.note}</p> : <span className="account-cell-email">Không có ghi chú ban đầu</span>}
                {record.counter_note && (
                  <small className="desk-reply-note">
                    <b>Ghi chú quầy:</b> {record.counter_note}
                  </small>
                )}
              </div>
            </td>
          </>
        ) : (
          <>
            <td data-label="Cơ quan">{record.agency}</td>
            <td data-label="Nội dung phản ánh">
              <div className="desk-cell-notes">
                <b>
                  {record.title}
                  {record.topic ? ` (${record.topic})` : ''}
                </b>
                <p>{record.content}</p>
              </div>
            </td>
            <td data-label="Kết quả trả lời">
              {record.reply ? (
                <div className="desk-cell-notes">
                  <p>{record.reply}</p>
                  <small className="account-cell-email">
                    {[record.replied_by, record.replied_at].filter(Boolean).join(' · ')}
                  </small>
                </div>
              ) : (
                <span className="account-cell-email">Chưa có nội dung phản hồi</span>
              )}
            </td>
          </>
        )}
        <td data-label="Trạng thái">
          <span className={`request-status ${statusBadgeClass[record.status] || ''}`}>
            {statusNames[record.status] || record.status}
          </span>
        </td>
        <td className="col-actions" data-label="Thao tác">
          {!closed ? (
            <button
              type="button"
              className={`button ${expanded ? 'secondary' : 'primary'} compact-btn`}
              onClick={() => {
                setExpanded(open => !open)
                setError('')
                if (!status && options.length === 1) setStatus(options[0])
              }}
            >
              {expanded ? 'Đóng' : appointment ? 'Cập nhật lịch' : 'Trả lời'}
            </button>
          ) : (
            <span className="account-cell-email">Đã hoàn tất</span>
          )}
        </td>
      </tr>
      {expanded && !closed && (
        <tr className="account-edit-row">
          <td colSpan={6}>
            <form className="account-change-form desk-inline-form" onSubmit={save}>
              <div className="account-change-form-title">
                <b>
                  {appointment ? `Xử lý lịch hẹn ${record.code}` : `Phản hồi kiến nghị ${record.code}`} ·{' '}
                  {record.citizen_name || record.sender_name || 'Công dân'}
                </b>
                <button type="button" className="text-button" onClick={() => setExpanded(false)}>
                  Thu gọn
                </button>
              </div>
              <div className="form-grid account-form">
                {appointment && (
                  <label>
                    Trạng thái chuyển tiếp
                    <select required value={status} onChange={event => setStatus(event.target.value)}>
                      <option value="">Chọn trạng thái xử lý</option>
                      {options.map(value => (
                        <option key={value} value={value}>
                          {statusNames[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="span-two">
                  {appointment ? 'Ghi chú tiếp đón / hướng dẫn tại quầy' : 'Nội dung trả lời chính thức của cơ quan'}
                  <textarea
                    required
                    minLength={8}
                    maxLength={2000}
                    rows={3}
                    placeholder={
                      appointment
                        ? 'Ghi kết quả xác nhận lịch, thời điểm công dân đến quầy hoặc lý do hủy…'
                        : 'Nhập nội dung giải trình, hướng dẫn hoặc kết quả xử lý phản ánh kiến nghị…'
                    }
                    value={note}
                    onChange={event => setNote(event.target.value)}
                  />
                </label>
                {error && (
                  <p className="form-error span-two" role="alert">
                    {error}
                  </p>
                )}
                <div className="form-actions span-two">
                  <button type="button" className="button secondary" onClick={() => setExpanded(false)}>
                    Hủy
                  </button>
                  <button className="button primary" disabled={busy}>
                    {busy ? 'Đang lưu…' : appointment ? 'Lưu trạng thái lịch hẹn' : 'Gửi nội dung phản hồi'}
                  </button>
                </div>
              </div>
            </form>
          </td>
        </tr>
      )}
    </Fragment>
  )
}

export function AdministrativeServiceDesk({
  user,
  procedures,
  request,
  onCaseCreated,
}: {
  user: Person
  procedures: Procedure[]
  request: Request
  onCaseCreated?: (caseRecord: any) => Promise<void> | void
}) {
  const canIntake = user.role === 'intake'
  const [activeTab, setActiveTab] = useState<'intake' | 'appointments' | 'feedback'>(() =>
    canIntake ? 'intake' : 'appointments',
  )
  const [appointments, setAppointments] = useState<DeskRecord[]>([])
  const [feedback, setFeedback] = useState<DeskRecord[]>([])
  const [summary, setSummary] = useState<{
    appointments?: Record<string, number>
    feedback?: Record<string, number>
  } | null>(null)
  const [createdCase, setCreatedCase] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID())

  const eligible = ['intake', 'leader', 'admin'].includes(user.role)
  const canEdit = ['intake', 'leader'].includes(user.role)

  const load = useCallback(async () => {
    if (!eligible) return
    const result = await request<{
      appointments: DeskRecord[]
      feedback: DeskRecord[]
      summary?: { appointments?: Record<string, number>; feedback?: Record<string, number> }
    }>('/api/service-desk')
    setAppointments(result.appointments || [])
    setFeedback(result.feedback || [])
    setSummary(result.summary || null)
  }, [eligible, request])

  useEffect(() => {
    if (!eligible) return
    let active = true
    void request<{
      appointments: DeskRecord[]
      feedback: DeskRecord[]
      summary?: { appointments?: Record<string, number>; feedback?: Record<string, number> }
    }>('/api/service-desk')
      .then(result => {
        if (active) {
          setAppointments(result.appointments || [])
          setFeedback(result.feedback || [])
          setSummary(result.summary || null)
        }
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu quầy Một cửa.')
      })
    return () => {
      active = false
    }
  }, [eligible, request])

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    setNotice('')
    setCreatedCase(null)
    try {
      const result = await request<{ case: any }>('/api/cases/counter', {
        ...values,
        submissionKey,
        identityVerified: values.identityVerified === 'on',
      })
      setCreatedCase(result.case)
      setNotice(
        `Đã tiếp nhận hồ sơ ${result.case.code} tại quầy Một cửa. Có thể mở ngay hồ sơ để in Phiếu tiếp nhận (Mẫu 01), cấp khóa tra cứu và thực hiện số hóa.`,
      )
      setSubmissionKey(crypto.randomUUID())
      form.reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa tiếp nhận được hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  if (!eligible) return null

  const pendingAppointments = appointments.filter(item =>
    ['BOOKED', 'DA_DAT', 'CHO_XAC_NHAN', 'CONFIRMED', 'DA_XAC_NHAN', 'CHECKED_IN'].includes(item.status),
  ).length
  const pendingFeedback = feedback.filter(
    item => !['REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(item.status),
  ).length

  return (
    <div className="service-desk-workspace">
      <div className="staff-module-tabs" role="tablist" aria-label="Phân hệ Quầy một cửa">
        {canIntake && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'intake'}
            className={`staff-module-tab${activeTab === 'intake' ? ' active' : ''}`}
            onClick={() => setActiveTab('intake')}
          >
            <span>Tiếp nhận hồ sơ tại quầy</span>
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'appointments'}
          className={`staff-module-tab${activeTab === 'appointments' ? ' active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <span>Lịch hẹn công dân</span>
          <b>{pendingAppointments || appointments.length}</b>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'feedback'}
          className={`staff-module-tab${activeTab === 'feedback' ? ' active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <span>Phản ánh, kiến nghị</span>
          <b>{pendingFeedback || feedback.length}</b>
        </button>
        <div className="staff-module-tabs-end">
          <button
            type="button"
            className="button secondary compact-btn"
            onClick={() => {
              setError('')
              void load().catch(cause => setError(String(cause)))
            }}
          >
            ↻ Làm mới danh sách
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <div className="citizen-success service-desk-banner" role="status">
          <span>{notice}</span>
          {createdCase && onCaseCreated && (
            <button type="button" className="button primary compact-btn" onClick={() => void onCaseCreated(createdCase)}>
              Mở hồ sơ {createdCase.code} →
            </button>
          )}
        </div>
      )}

      {summary && user.role === 'admin' && (
        <section className="panel service-desk-admin-summary">
          <div className="desk-summary-grid">
            <div>
              <small>Lịch hẹn toàn thành phố</small>
              <b>
                {Object.entries(summary.appointments || {})
                  .map(([st, cnt]) => `${statusNames[st] || st}: ${cnt}`)
                  .join(' · ') || 'Chưa có dữ liệu'}
              </b>
            </div>
            <div>
              <small>Phản ánh, kiến nghị toàn thành phố</small>
              <b>
                {Object.entries(summary.feedback || {})
                  .map(([st, cnt]) => `${statusNames[st] || st}: ${cnt}`)
                  .join(' · ') || 'Chưa có dữ liệu'}
              </b>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'intake' && canIntake && (
        <section className="panel service-desk-intake">
          <div className="panel-title">
            <div>
              <h2>Lập hồ sơ tiếp nhận trực tiếp tại quầy Một cửa</h2>
              <p>Đối chiếu giấy tờ tùy thân và kiểm đếm thành phần hồ sơ giấy trước khi ghi nhận vào hệ thống.</p>
            </div>
          </div>
          <form className="form-grid account-form" onSubmit={create}>
            <label className="span-two">
              Thủ tục hành chính
              <select name="procedureCode" required>
                <option value="">Chọn thủ tục tiếp nhận tại quầy</option>
                {procedures
                  .filter(procedure => (procedure.counterEnabled ?? procedure.submissionEnabled) === true)
                  .map(p => (
                    <option key={p.code} value={p.code}>
                      {p.code} · {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Cơ quan tiếp nhận
              <input
                name="receivingAgency"
                required
                maxLength={180}
                defaultValue={user.agencyScope === 'Toàn thành phố' ? '' : user.agencyScope}
                readOnly={!!user.agencyScope && user.agencyScope !== 'Toàn thành phố'}
              />
            </label>
            <label>
              Loại chủ thể nộp
              <select name="applicantType">
                <option value="citizen">Cá nhân / Công dân</option>
                <option value="organization">Tổ chức / Doanh nghiệp</option>
              </select>
            </label>
            <label>
              Họ và tên / Tên tổ chức
              <input name="applicantName" required minLength={2} maxLength={150} placeholder="Nguyễn Văn A" />
            </label>
            <label>
              Số CCCD / Mã số định danh / MST
              <input name="citizenId" required minLength={3} maxLength={40} placeholder="00109xxxxxxx" />
            </label>
            <label>
              Số điện thoại liên hệ
              <input name="applicantPhone" type="tel" required minLength={8} maxLength={40} placeholder="09xxxxxxxx" />
            </label>
            <label>
              Địa chỉ Email (nếu có)
              <input name="applicantEmail" type="email" maxLength={254} placeholder="congdan@example.com" />
            </label>
            <label className="span-two">
              Địa chỉ thường trú / Trụ sở
              <input name="applicantAddress" required minLength={3} maxLength={300} />
            </label>
            <label className="span-two">
              Nội dung yêu cầu giải quyết
              <textarea
                name="requestSummary"
                required
                minLength={8}
                maxLength={1200}
                rows={2}
                placeholder="Tóm tắt yêu cầu giải quyết thủ tục hành chính của người nộp…"
              />
            </label>
            <label className="span-two">
              Danh mục giấy tờ bản chính / bản sao đã nhận tại quầy
              <textarea
                name="paperOriginals"
                required
                minLength={8}
                maxLength={2000}
                rows={3}
                placeholder="Ghi rõ tên từng văn bản, số bản chính, bản sao đã kiểm đếm…"
              />
            </label>
            <label className="span-two check-row">
              <input type="checkbox" name="identityVerified" required /> Đã đối chiếu giấy tờ tùy thân người nộp và kiểm đếm đủ thành phần hồ sơ giấy
            </label>
            <div className="form-actions span-two">
              <button className="button primary" disabled={busy}>
                {busy ? 'Đang tiếp nhận…' : 'Ghi nhận tiếp nhận & cấp Mã hồ sơ'}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'appointments' && (
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Danh sách lịch hẹn làm việc tại cơ quan ({appointments.length})</h2>
              <p>Xác nhận lịch hẹn, ghi nhận công dân đến quầy (check-in) và hoàn tất hướng dẫn.</p>
            </div>
            <span className="count-chip">{pendingAppointments} lịch đang mở</span>
          </div>
          {appointments.length ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã hẹn &amp; Người đặt</th>
                    <th>Ngày hẹn &amp; Khung giờ</th>
                    <th>Thủ tục &amp; Cơ quan</th>
                    <th>Nội dung cần hướng dẫn / Ghi chú</th>
                    <th>Trạng thái</th>
                    <th className="col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(record => (
                    <DeskRecordTableRow
                      key={record.code}
                      record={record}
                      appointment
                      canEdit={canEdit}
                      request={request}
                      onChanged={load}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact-empty">Chưa có lịch hẹn công dân trong phạm vi cơ quan.</div>
          )}
        </section>
      )}

      {activeTab === 'feedback' && (
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Phản ánh, kiến nghị gửi đến cơ quan ({feedback.length})</h2>
              <p>Tiếp nhận và trả lời kiến nghị của người dân, tổ chức thuộc thẩm quyền giải quyết.</p>
            </div>
            <span className="count-chip">{pendingFeedback} chờ phản hồi</span>
          </div>
          {feedback.length ? (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã PAKN &amp; Người gửi</th>
                    <th>Cơ quan</th>
                    <th>Tiêu đề &amp; Nội dung phản ánh</th>
                    <th>Kết quả phản hồi</th>
                    <th>Trạng thái</th>
                    <th className="col-actions">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.map(record => (
                    <DeskRecordTableRow
                      key={record.code}
                      record={record}
                      appointment={false}
                      canEdit={canEdit}
                      request={request}
                      onChanged={load}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact-empty">Chưa có phản ánh, kiến nghị trong phạm vi cơ quan.</div>
          )}
        </section>
      )}
    </div>
  )
}

export function PublicAdministrativeServices({ request }: { request: Request }) {
  const [kind, setKind] = useState('appointments')
  const [agencies, setAgencies] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    void request<{ agencies: string[] }>('/api/public/agencies')
      .then(r => setAgencies(r.agencies))
      .catch(cause => setError(String(cause)))
  }, [request])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{ code: string; queueNumber?: string | number; message: string }>(
        `/api/public/${kind}`,
        values,
      )
      const queueInfo = result.queueNumber ? ` Số thứ tự quầy: ${result.queueNumber}.` : ''
      setNotice(`${result.message} Mã theo dõi: ${result.code}.${queueInfo} Giữ mã này để liên hệ cơ quan xử lý.`)
      form.reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa gửi được thông tin.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="citizen-service-card">
      <div className="panel">
        <div className="form-actions citizen-service-tabs" role="group" aria-label="Chọn tiện ích">
          {[
            ['appointments', 'Đặt lịch hẹn'],
            ['pakn', 'Gửi phản ánh'],
          ].map(([value, label]) => (
            <button
              type="button"
              className={`button ${kind === value ? 'primary' : 'secondary'}`}
              aria-pressed={kind === value}
              key={value}
              onClick={() => {
                setKind(value)
                setNotice('')
                setError('')
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <form className="citizen-action-form" key={kind} onSubmit={submit}>
          <>
            <label className="citizen-field">
              Họ và tên
              <input name="name" required minLength={2} maxLength={150} />
            </label>
            <label className="citizen-field">
              Cơ quan
              <select name="agency" required>
                <option value="">Chọn cơ quan</option>
                {agencies.map(a => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
          </>
          <label className="citizen-field">
            Số điện thoại
            <input name="phone" type="tel" required minLength={8} maxLength={40} />
          </label>
          {kind === 'appointments' && (
            <>
              <label className="citizen-field">
                Mã thủ tục
                <input
                  name="procedureCode"
                  required
                  maxLength={40}
                  placeholder="Mã thủ tục từ danh mục bên trên"
                />
              </label>
              <label className="citizen-field">
                Ngày hẹn
                <input name="date" type="date" required />
              </label>
              <label className="citizen-field">
                Khung giờ
                <select name="timeSlot" required>
                  {['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'].map(slot => (
                    <option key={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <label className="citizen-field">
                Nội dung cần hướng dẫn
                <textarea name="note" rows={3} maxLength={1000} />
              </label>
            </>
          )}
          {kind === 'pakn' && (
            <>
              <label className="citizen-field">
                Email
                <input name="email" type="email" maxLength={254} />
              </label>
              <label className="citizen-field">
                Tiêu đề
                <input name="title" required minLength={8} maxLength={180} />
              </label>
              <label className="citizen-field">
                Nội dung
                <textarea name="content" required minLength={20} maxLength={4000} rows={5} />
              </label>
            </>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Gửi thông tin'}
          </button>
        </form>
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
        <p className="citizen-service-existing-track">
          Muốn xem tiến độ hồ sơ đã nộp? <a href="/tra-cuu-ho-so">Đến trang Tra cứu hồ sơ</a>.
        </p>
      </div>
    </section>
  )
}
