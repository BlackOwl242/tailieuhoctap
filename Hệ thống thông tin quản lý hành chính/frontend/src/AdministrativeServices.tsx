import {
  ArrowRight,
  CalendarClock,
  FolderSearch,
  MessageSquarePlus,
  RefreshCw,
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react'
import { StatusTag, type SemanticTone } from './design-system'
import { handleTabArrows, isAbortError, toDate } from './portalUtils'
import type { ApiRequest, Procedure } from './types'
import './ProcedureDetail.css'

type Person = {
  role: string
  agencyScope?: string
}

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

type DeskSummaryValue = number | Record<string, number>

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

function deskStatusTone(status?: string): SemanticTone {
  const code = (status || '').toUpperCase()
  if (['COMPLETED', 'REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(code)) {
    return 'success'
  }
  if (['CANCELLED', 'DA_HUY', 'HUY'].includes(code)) {
    return 'danger'
  }
  if (['CONFIRMED', 'DA_XAC_NHAN', 'CHECKED_IN', 'DANG_XU_LY'].includes(code)) {
    return 'info'
  }
  if (['BOOKED', 'DA_DAT', 'CHO_XAC_NHAN', 'RECEIVED', 'MOI_TIEP_NHAN'].includes(code)) {
    return 'warning'
  }
  return 'neutral'
}

const nextStatuses: Record<string, string[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED'],
  DA_DAT: ['CONFIRMED', 'CANCELLED'],
  CHO_XAC_NHAN: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  DA_XAC_NHAN: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED'],
}

const TIME_SLOTS = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '14:00-15:00',
  '15:00-16:00',
] as const

const PAKN_TOPICS = [
  'Phản ánh về thái độ, tác phong phục vụ',
  'Chậm trễ giải quyết thủ tục hành chính',
  'Yêu cầu bổ sung giấy tờ ngoài quy định',
  'Vướng mắc biểu mẫu, kỹ thuật nộp trực tuyến',
  'Kiến nghị đơn giản hóa thủ tục hành chính',
] as const

const PUBLIC_SERVICE_TABS = ['appointments', 'pakn', 'lookup'] as const
type PublicServiceTab = (typeof PUBLIC_SERVICE_TABS)[number]

function readPublicTabFromUrl(): PublicServiceTab {
  const param = new URLSearchParams(window.location.search).get('tab')
  if (param === 'phan-anh' || param === 'pakn') return 'pakn'
  if (param === 'tra-cuu' || param === 'lookup') return 'lookup'
  return 'appointments'
}

function formatDeskSummary(value?: DeskSummaryValue): string {
  if (typeof value === 'number') {
    return `${value.toLocaleString('vi-VN')} bản ghi`
  }
  if (value && typeof value === 'object') {
    const parts = Object.entries(value).map(
      ([st, cnt]) => `${statusNames[st] || st}: ${cnt.toLocaleString('vi-VN')}`,
    )
    return parts.join(' · ') || 'Chưa có dữ liệu'
  }
  return 'Chưa có dữ liệu'
}

function tomorrowIsoDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function maxBookingIsoDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
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
  request: ApiRequest
  onChanged: () => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const options = nextStatuses[record.status] || []
  const closed =
    !canEdit ||
    (appointment ? !options.length : ['REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(record.status))

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
            <b className="case-code tabular-nums">{record.code}</b>
            <span>{record.citizen_name || record.sender_name || 'Công dân'}</span>
            <span className="account-cell-email tabular-nums">
              {[record.phone, record.email].filter(Boolean).join(' · ') || 'Chưa ghi liên hệ'}
            </span>
          </div>
        </td>

        {appointment ? (
          <>
            <td data-label="Lịch hẹn & Số thứ tự">
              <div className="account-cell-user tabular-nums">
                <b>{record.appointment_date || '—'}</b>
                <span className="account-cell-email">
                  {record.time_slot || 'Trong giờ hành chính'}
                  {record.queue_number ? ` · STT quầy: ${record.queue_number}` : ''}
                </span>
              </div>
            </td>
            <td data-label="Thủ tục & Cơ quan">
              <div className="account-cell-user">
                <b>
                  {record.procedure_code && (
                    <span className="tabular-nums">{record.procedure_code} · </span>
                  )}
                  {record.procedure_name || (!record.procedure_code ? 'Hướng dẫn chung' : '')}
                </b>
                <span className="account-cell-email">{record.agency}</span>
              </div>
            </td>
            <td data-label="Nội dung & Ghi chú">
              <div className="desk-cell-notes">
                {record.note ? (
                  <p>{record.note}</p>
                ) : (
                  <span className="account-cell-email">Không có ghi chú ban đầu</span>
                )}
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
                  <small className="account-cell-email tabular-nums">
                    {[record.replied_by, record.replied_at ? toDate(record.replied_at) : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </div>
              ) : (
                <span className="account-cell-email">Chưa có nội dung phản hồi</span>
              )}
            </td>
          </>
        )}

        <td data-label="Trạng thái">
          <StatusTag
            status={record.status}
            tone={deskStatusTone(record.status)}
            label={statusNames[record.status] || record.status}
          />
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
                  {appointment ? 'Xử lý lịch hẹn ' : 'Phản hồi kiến nghị '}
                  <span className="tabular-nums">{record.code}</span> ·{' '}
                  {record.citizen_name || record.sender_name || 'Công dân'}
                </b>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setExpanded(false)}
                >
                  Thu gọn
                </button>
              </div>

              <div className="form-grid account-form">
                {appointment && (
                  <label>
                    <span>Trạng thái chuyển tiếp</span>
                    <select
                      required
                      value={status}
                      onChange={event => setStatus(event.target.value)}
                    >
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
                  <span>
                    {appointment
                      ? 'Ghi chú tiếp đón / hướng dẫn tại quầy'
                      : 'Nội dung trả lời chính thức của cơ quan'}
                  </span>
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
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setExpanded(false)}
                  >
                    Hủy
                  </button>
                  <button className="button primary" disabled={busy}>
                    {busy
                      ? 'Đang lưu…'
                      : appointment
                        ? 'Lưu trạng thái lịch hẹn'
                        : 'Gửi nội dung phản hồi'}
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
  request: ApiRequest
  onCaseCreated?: (caseRecord: any) => Promise<void> | void
}) {
  const canIntake = user.role === 'intake'
  const [activeTab, setActiveTab] = useState<'intake' | 'appointments' | 'feedback'>(() =>
    canIntake ? 'intake' : 'appointments',
  )
  const [appointments, setAppointments] = useState<DeskRecord[]>([])
  const [feedback, setFeedback] = useState<DeskRecord[]>([])
  const [summary, setSummary] = useState<{
    appointments?: DeskSummaryValue
    feedback?: DeskSummaryValue
  } | null>(null)
  const [createdCase, setCreatedCase] = useState<any | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID())

  const eligible = ['intake', 'leader', 'admin'].includes(user.role)
  const canEdit = ['intake', 'leader'].includes(user.role)

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!eligible) return
      const result = await request<{
        appointments: DeskRecord[]
        feedback: DeskRecord[]
        summary?: { appointments?: DeskSummaryValue; feedback?: DeskSummaryValue }
      }>('/api/service-desk', undefined, signal)
      if (signal?.aborted) return
      setAppointments(result.appointments || [])
      setFeedback(result.feedback || [])
      setSummary(result.summary || null)
    },
    [eligible, request],
  )

  useEffect(() => {
    if (!eligible) return
    const controller = new AbortController()
    request<{
      appointments: DeskRecord[]
      feedback: DeskRecord[]
      summary?: { appointments?: DeskSummaryValue; feedback?: DeskSummaryValue }
    }>('/api/service-desk', undefined, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return
        setAppointments(result.appointments || [])
        setFeedback(result.feedback || [])
        setSummary(result.summary || null)
      })
      .catch(cause => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(cause instanceof Error ? cause.message : 'Không tải được dữ liệu quầy Một cửa.')
      })
    return () => controller.abort()
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
    ['BOOKED', 'DA_DAT', 'CHO_XAC_NHAN', 'CONFIRMED', 'DA_XAC_NHAN', 'CHECKED_IN'].includes(
      item.status,
    ),
  ).length
  const pendingFeedback = feedback.filter(
    item => !['REPLIED', 'DA_TRA_LOI', 'CLOSED'].includes(item.status),
  ).length

  const availableTabs: ('intake' | 'appointments' | 'feedback')[] = canIntake
    ? ['intake', 'appointments', 'feedback']
    : ['appointments', 'feedback']

  return (
    <div className="service-desk-workspace">
      <div
        className="staff-module-tabs"
        role="tablist"
        aria-label="Phân hệ Quầy một cửa"
        onKeyDown={event => handleTabArrows(event, availableTabs, activeTab, setActiveTab)}
      >
        {canIntake && (
          <button
            type="button"
            id="desk-tab-intake"
            role="tab"
            tabIndex={activeTab === 'intake' ? 0 : -1}
            aria-selected={activeTab === 'intake'}
            aria-controls="desk-panel-intake"
            className={`staff-module-tab${activeTab === 'intake' ? ' active' : ''}`}
            onClick={() => setActiveTab('intake')}
          >
            <span>Tiếp nhận hồ sơ tại quầy</span>
          </button>
        )}
        <button
          type="button"
          id="desk-tab-appointments"
          role="tab"
          tabIndex={activeTab === 'appointments' ? 0 : -1}
          aria-selected={activeTab === 'appointments'}
          aria-controls="desk-panel-appointments"
          className={`staff-module-tab${activeTab === 'appointments' ? ' active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <span>Lịch hẹn công dân</span>
          <b className="tabular-nums">{pendingAppointments || appointments.length}</b>
        </button>
        <button
          type="button"
          id="desk-tab-feedback"
          role="tab"
          tabIndex={activeTab === 'feedback' ? 0 : -1}
          aria-selected={activeTab === 'feedback'}
          aria-controls="desk-panel-feedback"
          className={`staff-module-tab${activeTab === 'feedback' ? ' active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <span>Phản ánh, kiến nghị</span>
          <b className="tabular-nums">{pendingFeedback || feedback.length}</b>
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
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Làm mới danh sách</span>
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
          <span className="tabular-nums">{notice}</span>
          {createdCase && onCaseCreated && (
            <button
              type="button"
              className="button primary compact-btn"
              onClick={() => void onCaseCreated(createdCase)}
            >
              <span className="tabular-nums">Mở hồ sơ {createdCase.code}</span>
              <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {summary && user.role === 'admin' && (
        <section className="panel service-desk-admin-summary">
          <div className="desk-summary-grid tabular-nums">
            <div>
              <small>Lịch hẹn toàn thành phố</small>
              <b>{formatDeskSummary(summary.appointments)}</b>
            </div>
            <div>
              <small>Phản ánh, kiến nghị toàn thành phố</small>
              <b>{formatDeskSummary(summary.feedback)}</b>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'intake' && canIntake && (
        <section
          id="desk-panel-intake"
          role="tabpanel"
          aria-labelledby="desk-tab-intake"
          className="panel service-desk-intake"
        >
          <div className="panel-title">
            <div>
              <h2>Lập hồ sơ tiếp nhận trực tiếp tại quầy Một cửa</h2>
              <p>
                Đối chiếu giấy tờ tùy thân và kiểm đếm thành phần hồ sơ giấy trước khi ghi nhận vào hệ thống.
              </p>
            </div>
          </div>
          <form className="form-grid account-form" onSubmit={create}>
            <label className="span-two">
              <span>Thủ tục hành chính</span>
              <select name="procedureCode" required>
                <option value="">Chọn thủ tục tiếp nhận tại quầy</option>
                {procedures
                  .filter(
                    procedure => (procedure.counterEnabled ?? procedure.submissionEnabled) === true,
                  )
                  .map(p => (
                    <option key={p.code} value={p.code}>
                      {p.code} · {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Cơ quan tiếp nhận</span>
              <input
                name="receivingAgency"
                required
                maxLength={180}
                defaultValue={user.agencyScope === 'Toàn thành phố' ? '' : user.agencyScope}
                readOnly={!!user.agencyScope && user.agencyScope !== 'Toàn thành phố'}
              />
            </label>
            <label>
              <span>Loại chủ thể nộp</span>
              <select name="applicantType">
                <option value="citizen">Cá nhân / Công dân</option>
                <option value="organization">Tổ chức / Doanh nghiệp</option>
              </select>
            </label>
            <label>
              <span>Họ và tên / Tên tổ chức</span>
              <input
                name="applicantName"
                required
                minLength={2}
                maxLength={150}
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label>
              <span>Số CCCD / Mã số định danh / MST</span>
              <input
                name="citizenId"
                className="tabular-nums"
                required
                minLength={3}
                maxLength={40}
                placeholder="00109xxxxxxx"
              />
            </label>
            <label>
              <span>Số điện thoại liên hệ</span>
              <input
                name="applicantPhone"
                type="tel"
                className="tabular-nums"
                required
                minLength={8}
                maxLength={40}
                placeholder="09xxxxxxxx"
              />
            </label>
            <label>
              <span>Địa chỉ Email (nếu có)</span>
              <input
                name="applicantEmail"
                type="email"
                maxLength={254}
                placeholder="congdan@example.com"
              />
            </label>
            <label className="span-two">
              <span>Địa chỉ thường trú / Trụ sở</span>
              <input name="applicantAddress" required minLength={3} maxLength={300} />
            </label>
            <label className="span-two">
              <span>Nội dung yêu cầu giải quyết</span>
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
              <span>Danh mục giấy tờ bản chính / bản sao đã nhận tại quầy</span>
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
              <input type="checkbox" name="identityVerified" required />
              <span>
                Đã đối chiếu giấy tờ tùy thân người nộp và kiểm đếm đủ thành phần hồ sơ giấy
              </span>
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
        <section
          id="desk-panel-appointments"
          role="tabpanel"
          aria-labelledby="desk-tab-appointments"
          className="panel"
        >
          <div className="panel-title">
            <div>
              <h2>
                Danh sách lịch hẹn làm việc tại cơ quan (
                <span className="tabular-nums">{appointments.length}</span>)
              </h2>
              <p>Xác nhận lịch hẹn, ghi nhận công dân đến quầy (check-in) và hoàn tất hướng dẫn.</p>
            </div>
            <span className="count-chip tabular-nums">{pendingAppointments} lịch đang mở</span>
          </div>
          {appointments.length ? (
            <div className="table-scroll data-table-wrap">
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
                      onChanged={() => load()}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              Chưa có lịch hẹn công dân trong phạm vi cơ quan.
            </div>
          )}
        </section>
      )}

      {activeTab === 'feedback' && (
        <section
          id="desk-panel-feedback"
          role="tabpanel"
          aria-labelledby="desk-tab-feedback"
          className="panel"
        >
          <div className="panel-title">
            <div>
              <h2>
                Phản ánh, kiến nghị gửi đến cơ quan (
                <span className="tabular-nums">{feedback.length}</span>)
              </h2>
              <p>Tiếp nhận và trả lời kiến nghị của người dân, tổ chức thuộc thẩm quyền giải quyết.</p>
            </div>
            <span className="count-chip tabular-nums">{pendingFeedback} chờ phản hồi</span>
          </div>
          {feedback.length ? (
            <div className="table-scroll data-table-wrap">
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
                      onChanged={() => load()}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              Chưa có phản ánh, kiến nghị trong phạm vi cơ quan.
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export function PublicAdministrativeServices({ request }: { request: ApiRequest }) {
  const [profile, setProfile] = useState<{ name: string; phone: string; email: string } | null>(
    null,
  )
  const [activeTab, setActiveTab] = useState<PublicServiceTab>(readPublicTabFromUrl)
  const [agencies, setAgencies] = useState<string[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [ownedAppointments, setOwnedAppointments] = useState<DeskRecord[]>([])
  const [ownedFeedback, setOwnedFeedback] = useState<DeskRecord[]>([])

  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [lookupCode, setLookupCode] = useState('')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupResult, setLookupResult] = useState<DeskRecord | null>(null)
  const [lookupBusy, setLookupBusy] = useState(false)

  const loadOwnedRecords = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const ws = await request<{
          appointments?: DeskRecord[]
          feedback?: DeskRecord[]
        }>('/api/citizen/workspace', undefined, signal)
        if (signal?.aborted) return
        setOwnedAppointments(ws.appointments || [])
        setOwnedFeedback(ws.feedback || [])
      } catch {
        /* Citizen may not have active workspace records yet */
      }
    },
    [request],
  )

  useEffect(() => {
    const syncTab = () => setActiveTab(readPublicTabFromUrl())
    window.addEventListener('popstate', syncTab)
    return () => window.removeEventListener('popstate', syncTab)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    request<{ profile: { name: string; phone: string; email: string } }>(
      '/api/citizen/profile',
      undefined,
      controller.signal,
    )
      .then(result => {
        if (!controller.signal.aborted) {
          setProfile(result.profile)
          setLookupPhone(prev => prev || result.profile.phone || '')
        }
      })
      .catch(() => {})
    request<{
      appointments?: DeskRecord[]
      feedback?: DeskRecord[]
    }>('/api/citizen/workspace', undefined, controller.signal)
      .then(ws => {
        if (!controller.signal.aborted) {
          setOwnedAppointments(ws.appointments || [])
          setOwnedFeedback(ws.feedback || [])
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [request])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      request<{ agencies: string[] }>('/api/public/agencies', undefined, controller.signal),
      request<{ procedures: Procedure[] }>('/api/procedures?summary=1', undefined, controller.signal),
    ])
      .then(([agencyData, procData]) => {
        if (controller.signal.aborted) return
        setAgencies(agencyData.agencies || [])
        setProcedures(procData.procedures || [])
      })
      .catch(cause => {
        if (controller.signal.aborted || isAbortError(cause)) return
        setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => controller.abort()
  }, [request])

  function switchTab(nextTab: PublicServiceTab) {
    setActiveTab(nextTab)
    setNotice('')
    setError('')
    const params = new URLSearchParams(window.location.search)
    if (nextTab === 'pakn') params.set('tab', 'phan-anh')
    else if (nextTab === 'lookup') params.set('tab', 'tra-cuu')
    else params.delete('tab')
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${params.size ? `?${params}` : ''}`,
    )
  }

  async function submitForm(
    event: FormEvent<HTMLFormElement>,
    endpoint: 'appointments' | 'pakn',
  ) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await request<{
        code: string
        queueNumber?: string | number
        message: string
      }>(`/api/public/${endpoint}`, values)
      const queueInfo = result.queueNumber ? ` Số thứ tự quầy: ${result.queueNumber}.` : ''
      setNotice(
        `${result.message} Mã theo dõi: ${result.code}.${queueInfo} Lưu lại mã này để tra cứu phản hồi tại thẻ Tra cứu lịch hẹn / PAKN.`,
      )
      setLookupCode(result.code)
      form.reset()
      void loadOwnedRecords()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa gửi được thông tin.')
    } finally {
      setBusy(false)
    }
  }

  async function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLookupBusy(true)
    setError('')
    setNotice('')
    setLookupResult(null)
    try {
      const result = await request<{ record: DeskRecord }>('/api/public/service-lookup', {
        code: lookupCode.trim(),
        phone: lookupPhone.trim(),
      })
      setLookupResult(result.record)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không tìm thấy lịch hẹn hoặc phản ánh kiến nghị khớp thông tin.',
      )
    } finally {
      setLookupBusy(false)
    }
  }

  const totalOwnedCount = ownedAppointments.length + ownedFeedback.length

  return (
    <section className="hcds-services-panel" aria-labelledby="public-services-heading">
      <div className="hcds-section-head">
        <div>
          <h1 id="public-services-heading">Tiện ích phục vụ công dân và tổ chức</h1>
          <p>
            Đăng ký lịch làm việc trước tại Bộ phận Một cửa, gửi phản ánh kiến nghị và tra cứu kết quả trả lời của cơ quan nhà nước.
          </p>
        </div>
        <a href="/tra-cuu-ho-so" className="procedure-return-link">
          <span>Tra cứu tiến độ hồ sơ TTHC</span>
          <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
        </a>
      </div>

      <div
        className="hcds-tabs"
        role="tablist"
        aria-label="Chọn tiện ích hành chính công"
        onKeyDown={event =>
          handleTabArrows(event, [...PUBLIC_SERVICE_TABS], activeTab, switchTab)
        }
      >
        <button
          type="button"
          id="public-service-tab-appointments"
          role="tab"
          tabIndex={activeTab === 'appointments' ? 0 : -1}
          aria-selected={activeTab === 'appointments'}
          aria-controls="public-service-panel-appointments"
          className="hcds-tab"
          onClick={() => switchTab('appointments')}
        >
          <CalendarClock size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Đặt lịch hẹn Một cửa</span>
        </button>

        <button
          type="button"
          id="public-service-tab-pakn"
          role="tab"
          tabIndex={activeTab === 'pakn' ? 0 : -1}
          aria-selected={activeTab === 'pakn'}
          aria-controls="public-service-panel-pakn"
          className="hcds-tab"
          onClick={() => switchTab('pakn')}
        >
          <MessageSquarePlus size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Gửi phản ánh kiến nghị (PAKN)</span>
        </button>

        <button
          type="button"
          id="public-service-tab-lookup"
          role="tab"
          tabIndex={activeTab === 'lookup' ? 0 : -1}
          aria-selected={activeTab === 'lookup'}
          aria-controls="public-service-panel-lookup"
          className="hcds-tab"
          onClick={() => switchTab('lookup')}
        >
          <FolderSearch size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>
            Tra cứu lịch hẹn / PAKN
            {totalOwnedCount > 0 ? (
              <span className="tabular-nums"> ({totalOwnedCount})</span>
            ) : null}
          </span>
        </button>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="citizen-success tabular-nums" role="status">
          {notice}
        </p>
      )}

      {activeTab === 'appointments' && (
        <div
          id="public-service-panel-appointments"
          role="tabpanel"
          aria-labelledby="public-service-tab-appointments"
        >
          <form
            className="hcds-services-form-grid"
            onSubmit={event => void submitForm(event, 'appointments')}
          >
            <label className="citizen-field">
              <span>Họ và tên người đặt lịch</span>
              <input
                name="name"
                defaultValue={profile?.name || ''}
                autoComplete="name"
                required
                minLength={2}
                maxLength={150}
              />
            </label>

            <label className="citizen-field">
              <span>Số điện thoại liên hệ</span>
              <input
                name="phone"
                type="tel"
                className="tabular-nums"
                defaultValue={profile?.phone || ''}
                autoComplete="tel"
                required
                minLength={8}
                maxLength={40}
              />
            </label>

            <label className="citizen-field">
              <span>Cơ quan tiếp đón</span>
              <select name="agency" required>
                <option value="">Chọn cơ quan thực hiện</option>
                {agencies.map(agency => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </label>

            <label className="citizen-field">
              <span>Mã thủ tục cần hướng dẫn / nộp</span>
              <input
                name="procedureCode"
                list="public-procedure-codes"
                className="tabular-nums"
                required
                maxLength={40}
                placeholder="Ví dụ: 2.000908 hoặc 1.004237"
              />
              <datalist id="public-procedure-codes">
                {procedures.slice(0, 250).map(proc => (
                  <option key={proc.code} value={proc.code}>
                    {proc.name}
                  </option>
                ))}
              </datalist>
            </label>

            <label className="citizen-field">
              <span>Ngày làm việc dự kiến</span>
              <input
                name="date"
                type="date"
                className="tabular-nums"
                min={tomorrowIsoDate()}
                max={maxBookingIsoDate()}
                required
              />
              <small className="tabular-nums">
                Áp dụng ngày làm việc hành chính từ ngày mai đến tối đa 30 ngày tới.
              </small>
            </label>

            <label className="citizen-field">
              <span>Khung giờ tiếp đón</span>
              <select name="timeSlot" className="tabular-nums" required>
                {TIME_SLOTS.map(slot => (
                  <option key={slot} value={slot}>
                    {slot} (tối đa 10 lượt hẹn)
                  </option>
                ))}
              </select>
            </label>

            <label className="citizen-field field-wide">
              <span>Nội dung cần hướng dẫn tại quầy (không bắt buộc)</span>
              <textarea
                name="note"
                rows={3}
                maxLength={1000}
                placeholder="Nêu tóm tắt trường hợp hồ sơ hoặc giấy tờ cần cán bộ Một cửa hướng dẫn…"
              />
            </label>

            <div className="field-wide">
              <button className="button primary" disabled={busy}>
                {busy ? 'Đang đăng ký lịch hẹn…' : 'Xác nhận đặt lịch hẹn'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'pakn' && (
        <div
          id="public-service-panel-pakn"
          role="tabpanel"
          aria-labelledby="public-service-tab-pakn"
        >
          <form
            className="hcds-services-form-grid"
            onSubmit={event => void submitForm(event, 'pakn')}
          >
            <label className="citizen-field">
              <span>Họ và tên người gửi</span>
              <input
                name="name"
                defaultValue={profile?.name || ''}
                autoComplete="name"
                required
                minLength={2}
                maxLength={150}
              />
            </label>

            <label className="citizen-field">
              <span>Số điện thoại xác minh</span>
              <input
                name="phone"
                type="tel"
                className="tabular-nums"
                defaultValue={profile?.phone || ''}
                autoComplete="tel"
                required
                minLength={8}
                maxLength={40}
              />
            </label>

            <label className="citizen-field">
              <span>Địa chỉ Email nhận phản hồi</span>
              <input
                name="email"
                defaultValue={profile?.email || ''}
                autoComplete="email"
                type="email"
                maxLength={254}
              />
            </label>

            <label className="citizen-field">
              <span>Cơ quan có thẩm quyền xử lý</span>
              <select name="agency" required>
                <option value="">Chọn cơ quan tiếp nhận phản ánh</option>
                {agencies.map(agency => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </label>

            <label className="citizen-field field-wide">
              <span>Chuyên đề phản ánh, kiến nghị</span>
              <select name="topic" defaultValue={PAKN_TOPICS[0]}>
                {PAKN_TOPICS.map(topic => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>

            <label className="citizen-field field-wide">
              <span>Tiêu đề phản ánh, kiến nghị</span>
              <input
                name="title"
                required
                minLength={8}
                maxLength={180}
                placeholder="Tóm tắt nội dung vướng mắc (tối thiểu 8 ký tự)"
              />
            </label>

            <label className="citizen-field field-wide">
              <span>Nội dung chi tiết</span>
              <textarea
                name="content"
                required
                minLength={20}
                maxLength={4000}
                rows={5}
                placeholder="Trình bày cụ thể thời gian, thủ tục, cơ quan liên quan và kiến nghị giải quyết (tối thiểu 20 ký tự)…"
              />
            </label>

            <div className="field-wide">
              <button className="button primary" disabled={busy}>
                {busy ? 'Đang gửi phản ánh…' : 'Gửi phản ánh, kiến nghị'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'lookup' && (
        <div
          id="public-service-panel-lookup"
          role="tabpanel"
          aria-labelledby="public-service-tab-lookup"
        >
          <form className="hcds-services-form-grid" onSubmit={event => void submitLookup(event)}>
            <label className="citizen-field">
              <span>Mã lịch hẹn hoặc Mã phản ánh</span>
              <input
                value={lookupCode}
                onChange={event => setLookupCode(event.target.value)}
                className="tabular-nums"
                required
                maxLength={40}
                placeholder="Ví dụ: LH-... hoặc PA-..."
              />
            </label>

            <label className="citizen-field">
              <span>Số điện thoại đã đăng ký</span>
              <input
                type="tel"
                value={lookupPhone}
                onChange={event => setLookupPhone(event.target.value)}
                className="tabular-nums"
                required
                minLength={8}
                maxLength={40}
                placeholder="Nhập số điện thoại khi gửi yêu cầu"
              />
            </label>

            <div className="field-wide">
              <button className="button primary" disabled={lookupBusy}>
                {lookupBusy ? 'Đang tra cứu…' : 'Tra cứu trạng thái xử lý'}
              </button>
            </div>
          </form>

          {lookupResult && (
            <div className="hcds-lookup-result" role="region" aria-label="Kết quả tra cứu">
              <div className="hcds-section-head">
                <h2 className="tabular-nums">Mã theo dõi: {lookupResult.code}</h2>
                <StatusTag
                  status={lookupResult.status}
                  tone={deskStatusTone(lookupResult.status)}
                  label={statusNames[lookupResult.status] || lookupResult.status}
                />
              </div>

              <dl className="hcds-kv-list">
                <div className="hcds-kv-row hcds-kv-row--two">
                  <dt>Cơ quan tiếp nhận</dt>
                  <dd>{lookupResult.agency}</dd>
                </div>
                {lookupResult.appointment_date && (
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Thời gian hẹn tại quầy</dt>
                    <dd className="tabular-nums">
                      {lookupResult.appointment_date} · {lookupResult.time_slot}
                      {lookupResult.queue_number
                        ? ` · STT quầy: ${lookupResult.queue_number}`
                        : ''}
                    </dd>
                  </div>
                )}
                {lookupResult.procedure_name && (
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Thủ tục đăng ký</dt>
                    <dd>
                      <span className="tabular-nums">{lookupResult.procedure_code}</span> ·{' '}
                      {lookupResult.procedure_name}
                    </dd>
                  </div>
                )}
                {lookupResult.title && (
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Tiêu đề phản ánh</dt>
                    <dd>
                      <b>{lookupResult.title}</b>
                      {lookupResult.topic ? ` (${lookupResult.topic})` : ''}
                    </dd>
                  </div>
                )}
                {(lookupResult.note || lookupResult.content) && (
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Nội dung đã gửi</dt>
                    <dd>{lookupResult.note || lookupResult.content}</dd>
                  </div>
                )}
                {(lookupResult.counter_note || lookupResult.reply) && (
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Phản hồi của cơ quan</dt>
                    <dd>
                      {lookupResult.counter_note || lookupResult.reply}
                      {lookupResult.replied_at && (
                        <div className="hcds-news-meta tabular-nums">
                          Cập nhật: {toDate(lookupResult.replied_at)}
                        </div>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {totalOwnedCount > 0 && (
            <div className="hcds-owned-records">
              <h2>
                Lịch hẹn và phản ánh thuộc tài khoản của bạn (
                <span className="tabular-nums">{totalOwnedCount}</span>)
              </h2>
              <div className="table-scroll data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã theo dõi</th>
                      <th>Phân loại &amp; Nội dung</th>
                      <th>Cơ quan</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...ownedAppointments, ...ownedFeedback].map(item => {
                      const isAppt = item.code.startsWith('LH-')
                      return (
                        <tr key={item.code}>
                          <td data-label="Mã theo dõi">
                            <b className="case-code tabular-nums">{item.code}</b>
                          </td>
                          <td data-label="Phân loại & Nội dung">
                            <div className="desk-cell-notes">
                              <b>
                                {isAppt
                                  ? `${item.procedure_code || ''} · ${item.procedure_name || 'Lịch hẹn Một cửa'}`
                                  : item.title || 'Phản ánh kiến nghị'}
                              </b>
                              {(item.counter_note || item.reply) && (
                                <small className="desk-reply-note">
                                  <b>Phản hồi:</b> {item.counter_note || item.reply}
                                </small>
                              )}
                            </div>
                          </td>
                          <td data-label="Cơ quan">{item.agency}</td>
                          <td data-label="Thời gian" className="tabular-nums">
                            {isAppt
                              ? `${item.appointment_date || ''} ${item.time_slot || ''}`.trim()
                              : toDate(item.created_at)}
                          </td>
                          <td data-label="Trạng thái">
                            <StatusTag
                              status={item.status}
                              tone={deskStatusTone(item.status)}
                              label={statusNames[item.status] || item.status}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AdministrativeServiceDesk
