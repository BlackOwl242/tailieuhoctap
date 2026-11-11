import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { QrCodeBadge } from './printSlips'
import { printInternalTable, printOfficialSlip } from './printUtils'
import { serviceModeLabel } from './procedureLabels'
import { matchesTopicField, normalizeTopicField, showcaseProcedureCodes } from './serviceTopics'
import {
  CLOSED_STATUSES,
  api,
  channelNames,
  encodeFile,
  feeStatusLabels,
  isAbortError,
  toDate,
  validateCitizenFiles,
} from './portalUtils'
import {
  CITIZEN_UPLOAD_LIMIT_TEXT,
  type CaseFile,
  type Procedure,
  type PublicStatusCheck,
  type SubmissionReceipt,
} from './types'

const NATIONAL_SERVICES = 'https://dichvucong.gov.vn/dvc-dich-vu-cong-truc-tuyen'

export function PublicProcedureSearch({
  onOpenProcedure,
}: {
  onOpenProcedure: (code: string) => void
}) {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [limit, setLimit] = useState(8)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    api<{ procedures: Procedure[] }>('/api/procedures', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setProcedures(result.procedures)
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setError(reason instanceof Error ? reason.message : 'Không tải được danh mục thủ tục.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const fields = useMemo(
    () =>
      [...new Set(procedures.map(item => normalizeTopicField(item.field)).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, 'vi'),
      ),
    [procedures],
  )

  const browseOrder = useMemo(() => {
    const featured = showcaseProcedureCodes
      .map(code => procedures.find(item => item.code === code))
      .filter((item): item is Procedure => Boolean(item))
    const byAgency = new Map<string, Procedure>()
    for (const item of procedures) {
      if (item.agency && !byAgency.has(item.agency)) byAgency.set(item.agency, item)
    }
    const first = [...featured, ...byAgency.values()]
    const seen = new Set(first.map(item => item.code))
    return [
      ...first.filter(
        (item, index) => first.findIndex(previous => previous.code === item.code) === index,
      ),
      ...procedures.filter(item => !seen.has(item.code)),
    ]
  }, [procedures])

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('vi')
    return browseOrder.filter(
      item =>
        (field === 'all' || matchesTopicField(item.field, field)) &&
        (!term ||
          [item.code, item.name, item.field, item.agency, item.level]
            .join(' ')
            .toLocaleLowerCase('vi')
            .includes(term)),
    )
  }, [browseOrder, query, field])

  return (
    <section
      className="portal-section public-procedure-search"
      id="tra-cuu-thu-tuc"
      aria-labelledby="public-procedure-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="public-procedure-title">
            Tra cứu {procedures.length.toLocaleString('vi-VN')} thủ tục hành chính theo lĩnh vực
          </h2>
        </div>
        <a className="plain-link" href={NATIONAL_SERVICES} target="_blank" rel="noreferrer">
          Cổng Dịch vụ công quốc gia ↗
        </a>
      </div>

      <div className="public-search-controls">
        <label htmlFor="public-procedure-query">
          <span>Tên hoặc mã thủ tục</span>
          <input
            id="public-procedure-query"
            type="search"
            value={query}
            onChange={event => {
              setQuery(event.target.value)
              setLimit(8)
            }}
            placeholder="Ví dụ: khai sinh, đăng ký hộ kinh doanh…"
          />
        </label>
        <label htmlFor="public-procedure-field">
          <span>Lĩnh vực</span>
          <select
            id="public-procedure-field"
            value={field}
            onChange={event => {
              setField(event.target.value)
              setLimit(8)
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
      </div>

      {loading && (
        <p className="catalog-status" role="status">
          Đang tải danh mục thủ tục…
        </p>
      )}
      {error && (
        <p className="catalog-status catalog-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <p className="catalog-status">
            Đang xem {Math.min(limit, results.length).toLocaleString('vi-VN')} trong{' '}
            {results.length.toLocaleString('vi-VN')} thủ tục hành chính
          </p>
          <div className="public-procedure-results">
            {results.slice(0, limit).map(item => (
              <article key={item.code}>
                <div>
                  <small>
                    {item.code} · {normalizeTopicField(item.field) || 'Chưa phân nhóm'} ·{' '}
                    {serviceModeLabel(item.level)}
                  </small>
                  <h3>{item.name}</h3>
                  <p>{item.agency || 'Cơ quan thực hiện theo thủ tục trên Cổng quốc gia'}</p>
                  {item.routing?.summary && (
                    <p className="public-route-summary">{item.routing.summary}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="procedure-detail-link"
                  onClick={() => onOpenProcedure(item.code)}
                >
                  Xem thông tin thủ tục
                </button>
              </article>
            ))}
          </div>

          {results.length === 0 && (
            <div className="catalog-empty">
              Không tìm thấy kết quả. Thử từ khóa khác hoặc chọn tất cả lĩnh vực.
            </div>
          )}

          {results.length > limit && (
            <button
              type="button"
              className="button secondary catalog-more"
              onClick={() => setLimit(value => value + 8)}
            >
              Xem thêm thủ tục
            </button>
          )}
        </>
      )}
    </section>
  )
}

export function CitizenReceiptView({
  receipt,
  onTrack,
}: {
  receipt: SubmissionReceipt
  onTrack: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(`Mã hồ sơ: ${receipt.code}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="citizen-receipt-page">
      <h1>Hồ sơ đã được gửi</h1>
      <p>
        Hồ sơ đã vào hàng đợi tiếp nhận. Hãy lưu mã hồ sơ bên dưới để tra cứu tiến độ hoặc liên hệ với cơ quan tiếp nhận.
      </p>

      <div className="receipt-credentials">
        <div>
          <small>MÃ HỒ SƠ</small>
          <b className="tabular-nums">{receipt.code}</b>
          {receipt.statusLabel && <span>Trạng thái: {receipt.statusLabel}</span>}
        </div>
        <QrCodeBadge code={receipt.code} size={84} />
      </div>

      <div className="citizen-source-note">
        <b>Theo dõi bằng tài khoản hoặc tra cứu nhanh công khai</b>
        <span>
          Hồ sơ đã gắn với tài khoản công dân của bạn. Chọn Theo dõi hồ sơ để xem toàn bộ tiến độ; hoặc dùng mã QR / mã hồ sơ trên để tra cứu nhanh trạng thái công khai bất kỳ lúc nào.
        </span>
      </div>

      <div className="citizen-receipt-actions">
        <button type="button" className="button secondary" onClick={() => void copyReceipt()}>
          {copied ? 'Đã sao chép mã hồ sơ' : 'Sao chép mã hồ sơ'}
        </button>
        <button type="button" className="button primary" onClick={onTrack}>
          Theo dõi hồ sơ
        </button>
      </div>
    </section>
  )
}

export function CaseDeclaration({ item }: { item: CaseFile }) {
  const schema = item.procedure?.submission
  if (!schema || !item.declaration) return null
  const entries = schema.fields.filter(field => Object.hasOwn(item.declaration, field.id))
  return (
    <section className="citizen-case-section">
      <h3>Tờ khai đã nộp</h3>
      <dl className="case-declaration">
        {entries.map(field => (
          <div key={field.id}>
            <dt>{field.label}</dt>
            <dd>{item.declaration[field.id] || 'Không khai'}</dd>
          </div>
        ))}
        <div>
          <dt>Nhận kết quả</dt>
          <dd>
            {channelNames[item.deliveryMethod || ''] || item.deliveryMethod || 'Chưa chọn'}
            {item.deliveryAddress && ` · ${item.deliveryAddress}`}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export type CitizenCaseActionKind =
  | 'submit_supplement'
  | 'feedback'
  | 'create_payment'
  | 'confirm_payment'
  | 'request_withdrawal'

export function CitizenCaseStatus({
  item,
  busy,
  onAction,
}: {
  item: CaseFile
  busy: boolean
  onAction: (action: CitizenCaseActionKind, payload: Record<string, unknown>) => Promise<void>
}) {
  const [score, setScore] = useState('5')
  const [feedback, setFeedback] = useState('')
  const [localError, setLocalError] = useState('')
  const [supplementFileNames, setSupplementFileNames] = useState<string[]>([])
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')

  async function submitSupplement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    const files = values
      .getAll('supplementFiles')
      .filter((value): value is File => value instanceof File && value.size > 0)
    const fileError = validateCitizenFiles(files)
    if (fileError) {
      setLocalError(fileError)
      return
    }
    setLocalError('')
    await onAction('submit_supplement', {
      note: values.get('note'),
      files: await Promise.all(files.map(encodeFile)),
    })
    form.reset()
    setSupplementFileNames([])
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onAction('feedback', { score: Number(score), content: feedback })
    setFeedback('')
  }

  async function submitWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (withdrawReason.trim().length < 10) {
      setLocalError('Lý do đề nghị rút/dừng hồ sơ cần ít nhất 10 ký tự.')
      return
    }
    setLocalError('')
    await onAction('request_withdrawal', { reason: withdrawReason.trim() })
    setWithdrawReason('')
    setWithdrawOpen(false)
  }

  const pendingPayment = (item.payments || []).find(
    (payment: { status: string }) => payment.status === 'PENDING',
  )

  async function confirmPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    if (!pendingPayment) return
    await onAction('confirm_payment', {
      transactionRef: pendingPayment.transactionRef,
      paymentMethod,
      paymentEvidence: values.get('paymentEvidence'),
    })
  }

  const noticeDoc = item.withdrawal?.noticeFile || item.withdrawal?.noticeDocument
  const supplementDue = item.supplementDueAt || item.supplement?.dueAt
  const mau04 = item.forms?.mau04
  const canRequestOnlineWithdrawal =
    !CLOSED_STATUSES.has(item.status) &&
    !item.withdrawal?.status &&
    !item.resultIssuedAt &&
    !item.decisionIssuedAt &&
    !item.resultNoticeIssuedAt

  const canPrintMau01 = Boolean(
    item.acceptedAt ||
      [
        'DA_TIEP_NHAN',
        'DANG_THU_LY',
        'TRINH_DUYET',
        'DA_PHE_DUYET',
        'DA_PHAT_HANH',
        'HOAN_THANH',
      ].includes(item.status),
  )
  const canPrintMau02 = Boolean(item.status === 'CHO_BO_SUNG' || item.supplement?.reason)
  const canPrintMau03 = item.status === 'TU_CHOI'
  const canPrintMau04 = Boolean(mau04)
  const canPrintMau06 = Boolean(item.withdrawal?.status === 'DA_PHAT_HANH')

  return (
    <article className="citizen-case-view">
      <header className="citizen-case-heading">
        <div>
          <h2>{item.procedure?.name || 'Hồ sơ thủ tục hành chính'}</h2>
          <p>
            Mã thủ tục <b>{item.procedureCode}</b> · Mã hồ sơ{' '}
            <b className="tabular-nums">{item.code}</b> · Cơ quan tiếp nhận: {item.receivingAgency}
          </p>
        </div>
        <div className="citizen-case-current-status">
          <small>TRẠNG THÁI HIỆN TẠI</small>
          <b>{item.statusLabel}</b>
        </div>
      </header>

      <div className="citizen-slip-bar">
        <QrCodeBadge code={item.code} size={68} />
        <div className="citizen-slip-actions">
          {canPrintMau01 && (
            <button
              type="button"
              className="button secondary compact-btn"
              onClick={() => printOfficialSlip('MAU_01', item, item.statusLabel)}
            >
              In dự thảo tiếp nhận
            </button>
          )}
          {canPrintMau02 && (
            <button
              type="button"
              className="button secondary compact-btn"
              onClick={() => printOfficialSlip('MAU_02', item, item.statusLabel)}
            >
              In dự thảo bổ sung
            </button>
          )}
          {canPrintMau03 && (
            <button
              type="button"
              className="button secondary compact-btn"
              onClick={() => printOfficialSlip('MAU_03', item, item.statusLabel)}
            >
              In dự thảo từ chối tiếp nhận
            </button>
          )}
          {canPrintMau04 && (
            <button
              type="button"
              className="button secondary compact-btn"
              onClick={() => printOfficialSlip('MAU_04', item, item.statusLabel)}
            >
              In dự thảo xin lỗi và gia hạn
            </button>
          )}
          {item.withdrawal?.reason && (
            <button type="button" className="button secondary compact-btn" onClick={() => printOfficialSlip('MAU_05', item)}>
              In dự thảo yêu cầu dừng
            </button>
          )}
          {canPrintMau06 && (
            <button
              type="button"
              className="button secondary compact-btn"
              onClick={() => printOfficialSlip('MAU_06', item, item.statusLabel)}
            >
              In dự thảo thông báo dừng
            </button>
          )}
        </div>
      </div>

      {item.milestones?.length > 0 && (
        <section className="citizen-case-section">
          <h3>Mốc kiểm tra và thông báo</h3>
          {item.milestones.map(
            (milestone: { id: string; label: string; dueDate: string; completedAt?: string }) => (
              <p key={milestone.id}>
                {milestone.label}: {toDate(milestone.dueDate)} ·{' '}
                {milestone.completedAt ? 'Đã thực hiện' : 'Đang theo dõi'}
              </p>
            ),
          )}
          <p>Đây là mốc xử lý trung gian, không phải hạn trả kết quả cuối cùng.</p>
        </section>
      )}

      <div className="citizen-progress evidence-progress" aria-label="Tiến độ xử lý hồ sơ">
        {(item.progress || []).map(
          (phase: { id: string; label: string; state: string; at?: string }, index: number) => (
            <div key={phase.id} className={phase.state}>
              <i>
                {phase.state === 'completed'
                  ? '✓'
                  : phase.state === 'terminated'
                    ? '×'
                    : index + 1}
              </i>
              <b>{phase.label}</b>
              <span>
                {(
                  {
                    completed: 'Đã hoàn tất',
                    current: 'Đang xử lý',
                    pending: 'Chưa thực hiện',
                    paused: 'Chờ bổ sung',
                    terminated: 'Đã kết thúc tại khâu này',
                  } as Record<string, string>
                )[phase.state]}
              </span>
              {phase.at && <time>{toDate(phase.at)}</time>}
            </div>
          ),
        )}
      </div>

      {mau04 && (
        <div className="citizen-request-warning">
          <b>Phiếu xin lỗi và hẹn lại ngày trả kết quả (Mẫu 04)</b>
          <p>
            Hạn cũ: {toDate(mau04.previousDeadline)} · Gia hạn thêm:{' '}
            <b>{mau04.addDays || 0} ngày</b> · Hạn trả mới:{' '}
            <b>{toDate(mau04.newDeadline || item.deadline)}</b>.
          </p>
          {mau04.reason && <p>Lý do cơ quan thông báo: {mau04.reason}</p>}
        </div>
      )}

      {item.status === 'CHO_BO_SUNG' && (
        <div className="citizen-request-warning">
          <b>Cơ quan đang yêu cầu bạn bổ sung thông tin (Mẫu 02)</b>
          <p>{item.supplement?.reason}</p>
          {supplementDue && (
            <p>
              <b>Thời hạn hoàn thiện bổ sung:</b> {toDate(supplementDue)}
            </p>
          )}
          {item.supplement?.items && item.supplement.items.length > 0 && (
            <ul>
              {item.supplement.items.map((entry: string, index: number) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {item.supplement?.citizenNote && (
        <div className="citizen-source-note">
          <b>Nội dung bạn đã giải trình / bổ sung:</b>
          <span>
            {item.supplement.citizenNote}
            {item.supplement.respondedAt ? ` (${toDate(item.supplement.respondedAt)})` : ''}
          </span>
        </div>
      )}

      {item.withdrawal?.status === 'CHO_KY_PHAT_HANH' && (
        <div className="citizen-request-warning">
          <b>Cơ quan đã tiếp nhận yêu cầu xin rút / dừng giải quyết hồ sơ</b>
          <p>
            Ngày tiếp nhận yêu cầu: {toDate(item.withdrawal.requestReceivedAt)} · Lý do:{' '}
            {item.withdrawal.reason}. Hồ sơ đang chờ người có thẩm quyền ký phát hành Thông báo dừng giải quyết (Mẫu 06).
          </p>
        </div>
      )}

      {item.withdrawal?.status === 'DA_PHAT_HANH' && (
        <div className="citizen-request-warning">
          <b>
            Đã phát hành Thông báo dừng giải quyết hồ sơ (Mẫu 06) số{' '}
            {item.withdrawal.noticeNumber}
          </b>
          <p>
            Ngày ban hành:{' '}
            {toDate(item.withdrawal.noticeDate || item.withdrawal.noticeIssuedAt)} · Kênh gửi:{' '}
            {channelNames[item.withdrawal.noticeDelivery?.channel] ||
              item.withdrawal.noticeDelivery?.channel ||
              'Trực tiếp'}
            {item.withdrawal.noticeDelivery?.reference
              ? ` (${item.withdrawal.noticeDelivery.reference})`
              : ''}
            .
          </p>
          {item.withdrawal.collectionOffice && (
            <p>
              <b>Đầu mối liên hệ nhận lại hồ sơ gốc / phí, lệ phí:</b>{' '}
              {item.withdrawal.collectionOffice}
            </p>
          )}
          {noticeDoc?.downloadUrl && (
            <p>
              <a className="button secondary" href={noticeDoc.downloadUrl}>
                Tải Thông báo dừng Mẫu 06 đã ký ({noticeDoc.name || 'Tệp đính kèm'})
              </a>
            </p>
          )}
        </div>
      )}

      {item.publicNote && (
        <div className="citizen-request-warning">
          <b>Thông tin từ cơ quan</b>
          <p>{item.publicNote}</p>
        </div>
      )}

      <div className="citizen-case-summary">
        <div>
          <small>Ngày gửi</small>
          <b>{toDate(item.createdAt)}</b>
        </div>
        <div>
          <small>Thời hạn</small>
          <b>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</b>
        </div>
        <div>
          <small>Người nộp</small>
          <b>{item.applicant?.name}</b>
        </div>
      </div>

      <CaseDeclaration item={item} />

      {typeof item.fee?.amount === 'number' && (
        <section className="citizen-case-section citizen-payment-section">
          <h3>Khoản thu phí, lệ phí theo hồ sơ</h3>
          <dl className="case-declaration">
            <div>
              <dt>Số tiền</dt>
              <dd>
                <b className="tabular-nums">
                  {Number(item.fee.amount).toLocaleString('vi-VN')} đồng
                </b>
              </dd>
            </div>
            <div>
              <dt>Căn cứ pháp lý thu phí</dt>
              <dd>{item.fee.basis}</dd>
            </div>
            <div>
              <dt>Trạng thái khoản thu</dt>
              <dd>{feeStatusLabels[item.fee.status] || item.fee.status}</dd>
            </div>
          </dl>
          <p className="field-help">
            Sau khi nộp theo hướng dẫn của cơ quan, gửi mã giao dịch hoặc số biên lai để kế toán đối chiếu.
          </p>
          <div className="citizen-payment-actions">
            {item.fee.status === 'DUE' &&
              (pendingPayment ? (
                <form
                  className="citizen-action-form citizen-payment-form"
                  onSubmit={confirmPayment}
                  aria-busy={busy}
                >
                  <h4>Thông tin chứng từ đã nộp</h4>
                  <p className="citizen-payment-reference">
                    Mã khoản thu: <b>{pendingPayment.transactionRef}</b>
                  </p>
                  <div className="citizen-payment-fields">
                    <label className="citizen-field">
                      <span>Hình thức đã nộp</span>
                      <select
                        value={paymentMethod}
                        onChange={event => setPaymentMethod(event.target.value)}
                        disabled={busy}
                      >
                        <option value="BANK_TRANSFER">Chuyển khoản</option>
                        <option value="COUNTER_RECEIPT">Nộp tại quầy có biên lai</option>
                        <option value="POSTAL_RECEIPT">Nộp qua bưu chính có chứng từ</option>
                        <option value="OTHER">Hình thức khác có chứng từ</option>
                      </select>
                    </label>
                    <label className="citizen-field">
                      <span>Mã giao dịch / số biên lai</span>
                      <input
                        name="paymentEvidence"
                        required
                        minLength={4}
                        maxLength={160}
                        disabled={busy}
                        autoComplete="off"
                      />
                      <small>Nhập đúng mã trên chứng từ bạn đã nộp.</small>
                    </label>
                  </div>
                  <button className="button primary" disabled={busy}>
                    {busy ? 'Đang gửi…' : 'Gửi chứng từ để đối chiếu'}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="button primary"
                  disabled={busy}
                  onClick={() => void onAction('create_payment', {})}
                >
                  Tạo mã theo dõi khoản thu
                </button>
              ))}
            {['PAID', 'RECONCILED', 'REFUNDED'].includes(item.fee.status) && (
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  printInternalTable(
                    'Phiếu theo dõi khoản thu',
                    `Hồ sơ ${item.code}`,
                    ['Số tiền', 'Trạng thái', 'Căn cứ'],
                    [
                      [
                        `${Number(item.fee.amount).toLocaleString('vi-VN')} đồng`,
                        feeStatusLabels[item.fee.status] || String(item.fee.status),
                        String(item.fee.basis),
                      ],
                    ],
                    item.code,
                  )
                }
              >
                In phiếu theo dõi khoản thu
              </button>
            )}
          </div>
        </section>
      )}

      <section className="citizen-case-section">
        <h3>Nội dung đề nghị</h3>
        <p>{item.requestSummary}</p>
        {item.attachments && item.attachments.length > 0 && (
          <div className="citizen-file-list">
            <b>Tài liệu đã gửi</b>
            {item.attachments.map((file, index) => (
              <span key={`${file.name}-${index}`}>{file.name}</span>
            ))}
          </div>
        )}
      </section>

      {item.status === 'CHO_BO_SUNG' && (
        <form className="citizen-action-form" onSubmit={submitSupplement}>
          <h3>Gửi nội dung bổ sung</h3>
          <label className="citizen-field">
            <span>Nội dung trả lời</span>
            <textarea
              name="note"
              rows={4}
              maxLength={1200}
              placeholder="Trả lời từng yêu cầu của cơ quan."
            />
          </label>
          <div className="citizen-field supplement-upload">
            <span id="supplement-files-label">Tài liệu bổ sung</span>
            <label className="supplement-upload-picker">
              <span className="supplement-upload-button">Chọn tệp</span>
              <span className="supplement-upload-names">{supplementFileNames.length ? supplementFileNames.join(', ') : 'Chưa chọn tệp'}</span>
              <input
              name="supplementFiles"
              type="file"
              aria-labelledby="supplement-files-label"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              multiple
              onChange={event => setSupplementFileNames(Array.from(event.currentTarget.files || [], file => file.name))}
            />
            </label>
            <small>{CITIZEN_UPLOAD_LIMIT_TEXT}</small>
          </div>
          {localError && (
            <div className="form-error" role="alert">
              {localError}
            </div>
          )}
          <button className="button primary" disabled={busy}>
            Gửi bổ sung
          </button>
        </form>
      )}

      {canRequestOnlineWithdrawal && (
        <section className="citizen-case-section citizen-withdrawal-box">
          <div className="citizen-withdrawal-head">
            <div>
              <h3>Đề nghị dừng / rút hồ sơ trực tuyến</h3>
              <p className="muted">
                Dành cho chủ hồ sơ khi chưa có kết quả giải quyết. Cơ quan sẽ xem xét và phát hành Thông báo dừng giải quyết (Mẫu 06).
              </p>
            </div>
            <button
              type="button"
              className="button secondary compact-btn"
              disabled={busy}
              aria-expanded={withdrawOpen}
              onClick={() => {
                setWithdrawOpen(open => !open)
                setLocalError('')
              }}
            >
              {withdrawOpen ? 'Thu gọn biểu mẫu' : 'Lập đề nghị rút hồ sơ'}
            </button>
          </div>

          {withdrawOpen && (
            <form className="citizen-action-form" onSubmit={submitWithdrawal}>
              <label className="citizen-field">
                <span>Lý do đề nghị dừng / rút hồ sơ</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={1200}
                  rows={3}
                  value={withdrawReason}
                  onChange={event => setWithdrawReason(event.target.value)}
                  placeholder="Nêu rõ lý do đề nghị dừng thực hiện thủ tục hành chính…"
                />
              </label>
              {localError && (
                <div className="form-error" role="alert">
                  {localError}
                </div>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setWithdrawOpen(false)}
                >
                  Hủy
                </button>
                <button className="button primary" disabled={busy}>
                  {busy ? 'Đang gửi đề nghị…' : 'Xác nhận gửi đề nghị dừng'}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {item.result && (
        <section className="citizen-case-section">
          <h3>Kết quả giải quyết</h3>
          <p>{item.result.content || 'Cơ quan đã ghi nhận kết quả.'}</p>
          {item.result.number && (
            <p>
              Số văn bản: <b>{item.result.number}</b>
            </p>
          )}
          {!!item.result.files?.length && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {item.result.files.map((file, idx) =>
                file.downloadUrl ? (
                  <a
                    key={`${file.name}-${idx}`}
                    className="button secondary compact-btn"
                    href={file.downloadUrl}
                  >
                    Tải văn bản kết quả điện tử ({file.name})
                  </a>
                ) : null,
              )}
            </div>
          )}
        </section>
      )}

      {item.delivery && (
        <section className="citizen-case-section">
          <h3>Thông tin trả kết quả</h3>
          <p>
            <b>Người nhận:</b> {item.delivery.receiver} · <b>Hình thức nhận:</b>{' '}
            {channelNames[item.delivery.channel] || item.delivery.channel}
          </p>
          <p>
            <b>Mã biên nhận / bưu gửi:</b> {item.delivery.evidence} · <b>Thời gian:</b>{' '}
            {toDate(item.delivery.deliveredAt || item.delivery.at)}
          </p>
        </section>
      )}

      <section className="citizen-case-section">
        <h3>Lịch sử xử lý</h3>
        {item.events?.length ? (
          <div className="citizen-timeline">
            {item.events.map((event, index) => (
              <article key={`${event.at}-${index}`}>
                <i />
                <div>
                  <b>{event.title}</b>
                  <time>{toDate(event.at)}</time>
                  {event.detail && <p>{event.detail}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Chưa có cập nhật.</p>
        )}
      </section>

      {CLOSED_STATUSES.has(item.status) && !item.feedbackSubmitted && (
        <form className="citizen-action-form" onSubmit={submitFeedback}>
          <h3>Đánh giá quá trình xử lý</h3>
          <label className="citizen-field">
            <span>Mức đánh giá</span>
            <select value={score} onChange={event => setScore(event.target.value)}>
              {[5, 4, 3, 2, 1].map(value => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </label>
          <label className="citizen-field">
            <span>Ý kiến</span>
            <textarea
              value={feedback}
              onChange={event => setFeedback(event.target.value)}
              rows={3}
              maxLength={1000}
            />
          </label>
          <button className="button secondary" disabled={busy}>
            Gửi đánh giá
          </button>
        </form>
      )}

      {item.feedbackSubmitted && (
        <p className="citizen-success">Ứng dụng đã ghi nhận đánh giá của hồ sơ này.</p>
      )}

      {item.result?.signature && (
        <section className="citizen-case-section">
          <h3>Kiểm tra chữ ký kết quả</h3>
          <p>
            {item.result.signature.verified
              ? 'Chữ ký số của văn bản kết quả hợp lệ.'
              : 'Không xác minh được chữ ký của nội dung hiện tại.'}
          </p>
          <p>
            Mã băm tài liệu: <code>{item.result.signature.documentHash}</code>
          </p>
          <p>
            Người ký: {item.result.signature.signer} · {toDate(item.result.signature.signedAt)}
          </p>
        </section>
      )}
    </article>
  )
}

function normalizeStatusCheck(raw: Record<string, any>): PublicStatusCheck {
  const payload = (raw.statusCheck || raw.case || raw.result || raw) as Record<string, any>
  return {
    code: String(payload.code || ''),
    procedureCode: payload.procedureCode || payload.procedure?.code || '',
    procedureName: payload.procedureName || payload.procedure?.name || '',
    receivingAgency: payload.receivingAgency || payload.agency || payload.agencyScope || '',
    status: String(payload.status || ''),
    statusLabel: String(payload.statusLabel || payload.status || ''),
    createdAt: payload.createdAt,
    acceptedAt: payload.acceptedAt,
    deadline: payload.deadline,
    deadlineNote: payload.deadlineNote,
    supplementDueAt: payload.supplementDueAt || payload.supplement?.dueAt,
    updatedAt: payload.updatedAt,
    hasMau04Extension: Boolean(
      payload.hasMau04Extension ?? payload.mau04Issued ?? payload.forms?.mau04,
    ),
    sampleData: Boolean(payload.sampleData),
  }
}

export function CitizenTrackingPage({
  initialReceipt,
  initialCode = '',
  embedded = false,
  citizenSignedIn = false,
  onRequireLogin,
  onUpdated,
}: {
  initialReceipt: SubmissionReceipt | null
  initialCode?: string
  embedded?: boolean
  citizenSignedIn?: boolean
  onRequireLogin?: () => void
  onUpdated?: () => void
}) {
  const urlCode = embedded ? '' : new URLSearchParams(window.location.search).get('code') || ''
  const startingCode = initialCode || initialReceipt?.code || urlCode

  const [ownedCases, setOwnedCases] = useState<CaseFile[]>([])
  const [quickCode, setQuickCode] = useState(startingCode)
  const [quickResult, setQuickResult] = useState<PublicStatusCheck | null>(null)
  const [quickBusy, setQuickBusy] = useState(false)
  const [quickError, setQuickError] = useState('')

  const [code, setCode] = useState(startingCode)
  const [accessKey, setAccessKey] = useState(initialReceipt?.accessKey || '')
  const [item, setItem] = useState<CaseFile | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (embedded || !citizenSignedIn) return
    const controller = new AbortController()
    api<{ cases: CaseFile[] }>('/api/citizen/cases', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setOwnedCases(result.cases)
      })
      .catch(reason => {
        if (controller.signal.aborted || isAbortError(reason)) return
        setError(reason instanceof Error ? reason.message : 'Chưa tải được danh sách hồ sơ.')
      })
    return () => controller.abort()
  }, [citizenSignedIn, embedded])

  useEffect(() => {
    if (!startingCode) return
    const controller = new AbortController()
    if (embedded || citizenSignedIn || initialReceipt?.accessKey) {
      api<{ case: CaseFile }>(
        '/api/public/cases/lookup',
        { code: startingCode, accessKey: initialReceipt?.accessKey || '' },
        controller.signal,
      )
        .then(result => {
          if (!controller.signal.aborted) setItem(result.case)
        })
        .catch(reason => {
          if (controller.signal.aborted || isAbortError(reason)) return
          if (!embedded) {
            void api<Record<string, any>>(
              `/api/public/status-check?code=${encodeURIComponent(startingCode)}`,
              undefined,
              controller.signal,
            )
              .then(raw => {
                if (!controller.signal.aborted) setQuickResult(normalizeStatusCheck(raw))
              })
              .catch(() => {})
          } else {
            setError(
              reason instanceof Error ? reason.message : 'Không tìm thấy hồ sơ với thông tin đã nhập.',
            )
          }
        })
    } else {
      api<Record<string, any>>(
        `/api/public/status-check?code=${encodeURIComponent(startingCode)}`,
        undefined,
        controller.signal,
      )
        .then(raw => {
          if (!controller.signal.aborted) setQuickResult(normalizeStatusCheck(raw))
        })
        .catch(reason => {
          if (controller.signal.aborted || isAbortError(reason)) return
          setQuickError(
            reason instanceof Error ? reason.message : 'Không tìm thấy trạng thái hồ sơ công khai.',
          )
        })
    }
    return () => controller.abort()
  }, [citizenSignedIn, embedded, initialReceipt?.accessKey, startingCode])

  async function runQuickCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = quickCode.trim().toUpperCase()
    if (!trimmed) return
    setQuickBusy(true)
    setQuickError('')
    try {
      const raw = await api<Record<string, any>>(
        `/api/public/status-check?code=${encodeURIComponent(trimmed)}`,
      )
      const normalized = normalizeStatusCheck(raw)
      setQuickResult(normalized)
      setCode(trimmed)
      const nextUrl = `/tra-cuu-ho-so?code=${encodeURIComponent(trimmed)}`
      if (window.location.pathname === '/tra-cuu-ho-so') {
        window.history.replaceState(window.history.state, '', nextUrl)
      }
    } catch (reason) {
      setQuickResult(null)
      setQuickError(
        reason instanceof Error ? reason.message : 'Không tìm thấy mã hồ sơ cần tra cứu.',
      )
    } finally {
      setQuickBusy(false)
    }
  }

  async function lookup(
    event?: FormEvent<HTMLFormElement>,
    credentials?: { code: string; accessKey: string },
  ) {
    event?.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const lookupCode = (credentials?.code || code).trim().toUpperCase()
    const lookupKey = credentials ? credentials.accessKey : accessKey
    if (credentials) {
      setCode(lookupCode)
      setAccessKey(lookupKey)
    }
    try {
      const result = await api<{ case: CaseFile }>('/api/public/cases/lookup', {
        code: lookupCode,
        accessKey: lookupKey,
      })
      setItem(result.case)
    } catch (reason) {
      setItem(null)
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không tìm thấy hồ sơ với thông tin đã nhập.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function citizenAction(action: CitizenCaseActionKind, payload: Record<string, unknown>) {
    if (!item) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await api<{ case: CaseFile }>(
        `/api/public/cases/${encodeURIComponent(item.code)}/actions`,
        {
          accessKey,
          action,
          expectedVersion: item.version,
          payload,
        },
      )
      setItem(result.case)
      onUpdated?.()
      const feedbackMessages: Record<CitizenCaseActionKind, string> = {
        submit_supplement: 'Đã gửi nội dung bổ sung hồ sơ.',
        feedback: 'Đã ghi nhận đánh giá mức độ hài lòng của bạn.',
        create_payment: 'Đã tạo mã theo dõi khoản thu trong hồ sơ.',
        confirm_payment:
          'Đã ghi nhận chứng từ người nộp khai; hồ sơ chờ cán bộ tài chính đối chiếu.',
        request_withdrawal:
          'Đã gửi đề nghị dừng / rút hồ sơ trực tuyến. Cơ quan sẽ xem xét và phát hành Mẫu 06.',
      }
      setMessage(feedbackMessages[action])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể ghi nhận thao tác.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="citizen-track-page">
      {!embedded && (
        <div className="citizen-page-heading">
          <h1>Tra cứu hồ sơ dịch vụ công</h1>
          <p>
            Tra cứu nhanh trạng thái công khai không cần đăng nhập, hoặc đăng nhập công dân / nhập khóa tra cứu để mở toàn bộ hồ sơ, nộp phí, bổ sung tài liệu và gửi đề nghị dừng hồ sơ.
          </p>
        </div>
      )}

      {!embedded && (
        <section className="public-quick-check" aria-labelledby="quick-check-heading">
          <div className="quick-check-header">
            <div>
              <h2 id="quick-check-heading">Tra cứu nhanh trạng thái theo Mã hồ sơ</h2>
            </div>
          </div>

          <form className="citizen-track-form quick-check-form" onSubmit={runQuickCheck}>
            <label className="citizen-field" htmlFor="public-quick-code">
              <span>Mã số hồ sơ</span>
              <input
                id="public-quick-code"
                value={quickCode}
                onChange={event => setQuickCode(event.target.value.toUpperCase())}
                placeholder="Ví dụ: HN-2026-XXXXXXXX"
                autoComplete="off"
                required
              />
            </label>
            <button className="button primary" disabled={quickBusy}>
              {quickBusy ? 'Đang kiểm tra…' : 'Tra cứu nhanh trạng thái'}
            </button>
          </form>

          {quickError && (
            <div className="form-error" role="alert">
              {quickError}
            </div>
          )}

          {quickResult && (
            <div className="quick-check-result" role="region" aria-label="Kết quả trạng thái công khai">
              <div className="quick-check-top">
                <div>
                  <small>MÃ HỒ SƠ: {quickResult.code}</small>
                  <h3>
                    {quickResult.procedureCode ? `${quickResult.procedureCode} · ` : ''}
                    {quickResult.procedureName || 'Hồ sơ thủ tục hành chính'}
                  </h3>
                  <p>Cơ quan tiếp nhận: {quickResult.receivingAgency || 'Theo phân tuyến thủ tục'}</p>
                </div>
                <span className={`status-pill status-${quickResult.status}`}>
                  {quickResult.statusLabel}
                </span>
              </div>

              <dl className="quick-check-facts">
                <div>
                  <dt>Ngày tiếp nhận / tạo</dt>
                  <dd>{toDate(quickResult.acceptedAt || quickResult.createdAt)}</dd>
                </div>
                <div>
                  <dt>Hạn hẹn trả kết quả</dt>
                  <dd>
                    {quickResult.deadline
                      ? toDate(quickResult.deadline)
                      : quickResult.deadlineNote || 'Theo quy định thủ tục'}
                  </dd>
                </div>
                {quickResult.supplementDueAt && (
                  <div>
                    <dt>Hạn bổ sung (Mẫu 02)</dt>
                    <dd>{toDate(quickResult.supplementDueAt)}</dd>
                  </div>
                )}
                {quickResult.hasMau04Extension && (
                  <div>
                    <dt>Gia hạn giải quyết</dt>
                    <dd>Đã ban hành Phiếu xin lỗi &amp; hẹn lại ngày trả (Mẫu 04)</dd>
                  </div>
                )}
              </dl>

              {!citizenSignedIn && !item && (
                <div className="quick-check-auth-prompt">
                  <span>
                    Để xem tờ khai chi tiết, tải tệp đính kèm, nộp phí, bổ sung hồ sơ hoặc gửi yêu cầu rút hồ sơ:
                  </span>
                  {onRequireLogin ? (
                    <button
                      type="button"
                      className="button secondary compact-btn"
                      onClick={onRequireLogin}
                    >
                      Đăng nhập công dân
                    </button>
                  ) : (
                    <a className="button secondary compact-btn" href="/dang-nhap">
                      Đăng nhập công dân
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {!embedded && citizenSignedIn && (
        <section className="citizen-owned-cases" aria-label="Hồ sơ của tôi">
          <h2>Hồ sơ thuộc tài khoản của bạn</h2>
          {ownedCases.length ? (
            <div className="citizen-owned-grid">
              {ownedCases.map(record => (
                <button
                  type="button"
                  className="citizen-owned-case"
                  key={record.code}
                  disabled={busy}
                  onClick={() => void lookup(undefined, { code: record.code, accessKey: '' })}
                >
                  <b className="tabular-nums">{record.code}</b>
                  <span>{record.procedure?.name || record.procedureCode}</span>
                  <small>{record.statusLabel || record.status}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">Bạn chưa gửi hồ sơ nào bằng tài khoản này.</p>
          )}
        </section>
      )}

      {!embedded && (
        <section className="citizen-full-lookup" aria-labelledby="full-lookup-heading">
          <h2 id="full-lookup-heading">
            {citizenSignedIn
              ? 'Mở chi tiết hồ sơ để thao tác'
              : 'Mở chi tiết hồ sơ bằng Khóa tra cứu (dành cho hồ sơ nộp tại quầy)'}
          </h2>
          <form className="citizen-track-form" onSubmit={lookup}>
            <label className="citizen-field" htmlFor="full-lookup-code">
              <span>Mã hồ sơ</span>
              <input
                id="full-lookup-code"
                value={code}
                onChange={event => setCode(event.target.value.toUpperCase())}
                placeholder="HN-2026-XXXXXXXX"
                autoComplete="off"
                required
              />
            </label>
            <label className="citizen-field" htmlFor="full-lookup-key">
              <span>
                Khóa tra cứu{!citizenSignedIn ? ' (bắt buộc nếu chưa đăng nhập)' : ' (nếu tra cứu hồ sơ quầy)'}
              </span>
              <input
                id="full-lookup-key"
                value={accessKey}
                onChange={event => setAccessKey(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                required={!citizenSignedIn}
              />
            </label>
            <button className="button secondary" disabled={busy}>
              {busy ? 'Đang mở hồ sơ…' : 'Mở chi tiết hồ sơ'}
            </button>
          </form>
        </section>
      )}

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="citizen-success" role="status">
          {message}
        </div>
      )}

      {item && <CitizenCaseStatus item={item} busy={busy} onAction={citizenAction} />}
    </section>
  )
}
