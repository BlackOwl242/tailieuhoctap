import { useState, type FormEvent } from 'react'
import { CaseDeclaration } from './CitizenTracking'
import { QrCodeBadge } from './printSlips'
import { printOfficialSlip } from './printUtils'
import {
  CLOSED_STATUSES,
  api,
  channelNames,
  daysUntil,
  dueText,
  handleTabArrows,
  toDate,
} from './portalUtils'
import type { CaseFile } from './types'

function StaffLookupKey({
  item,
  onChanged,
}: {
  item: CaseFile
  onChanged: () => Promise<void>
}) {
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rotateOpen, setRotateOpen] = useState(false)
  const [notice, setNotice] = useState('')

  async function operate(action: 'reveal' | 'rotate') {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await api<{ accessKey: string }>(
        `/api/cases/${encodeURIComponent(item.code)}/lookup-key`,
        {
          action,
          expectedVersion: item.version,
        },
      )
      setSecret(result.accessKey)
      setRotateOpen(false)
      await onChanged()
      if (action === 'rotate') {
        setNotice(
          'Đã cấp khóa mới. Khóa cũ không còn dùng để tra cứu hoặc bổ sung hồ sơ.',
        )
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không lấy được khóa tra cứu.')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Mã hồ sơ: ${item.code}\nKhóa tra cứu: ${secret}`)
      setNotice(
        'Đã sao chép mã hồ sơ và khóa. Chỉ cung cấp cho đúng chủ hồ sơ sau khi xác minh.',
      )
    } catch {
      setError('Trình duyệt không cho phép sao chép. Hãy chọn và sao chép thủ công.')
    }
  }

  return (
    <section className="staff-lookup-key">
      <div className="staff-lookup-key-head">
        <div>
          <h3>Mã hồ sơ &amp; Khóa tra cứu của công dân</h3>
          <p>
            Chỉ cung cấp cho chủ hồ sơ hoặc người đại diện hợp pháp sau khi đối chiếu giấy tờ tùy thân. Mọi thao tác xem/cấp lại đều được ghi nhật ký.
          </p>
        </div>
        <div className="credential-actions">
          <button
            type="button"
            className="button secondary compact-btn"
            disabled={busy}
            onClick={() => (secret ? setSecret('') : void operate('reveal'))}
          >
            {secret ? 'Ẩn khóa tra cứu' : busy ? 'Đang lấy khóa…' : 'Hiện khóa tra cứu'}
          </button>
          {secret && (
            <button type="button" className="button primary compact-btn" onClick={() => void copy()}>
              Sao chép mã &amp; khóa
            </button>
          )}
          <button
            type="button"
            className="button secondary compact-btn"
            disabled={busy}
            onClick={() => setRotateOpen(!rotateOpen)}
          >
            Cấp lại khóa mới
          </button>
        </div>
      </div>

      <div className="staff-lookup-key-fields">
        <label>
          <span>Mã hồ sơ</span>
          <input readOnly value={item.code} />
        </label>
        {secret && (
          <label>
            <span>Khóa tra cứu hiện hành</span>
            <input readOnly value={secret} spellCheck={false} autoComplete="off" />
          </label>
        )}
      </div>

      {rotateOpen && (
        <div className="credential-confirm">
          <p>
            Cấp khóa mới sẽ vô hiệu hóa khóa cũ ngay lập tức. Cần cung cấp lại khóa mới cho chủ hồ sơ.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button primary compact-btn"
              disabled={busy}
              onClick={() => void operate('rotate')}
            >
              Xác nhận cấp khóa mới
            </button>
            <button
              type="button"
              className="button secondary compact-btn"
              onClick={() => setRotateOpen(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="citizen-success">
          {notice}
        </p>
      )}
    </section>
  )
}

function Mau06Draft({ draft }: { draft: Record<string, any> }) {
  const dateText = (value?: string) =>
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `ngày ${value.slice(8, 10)} tháng ${value.slice(5, 7)} năm ${value.slice(0, 4)}`
      : 'ngày …… tháng …… năm ……'

  return (
    <details className="mau06-preview">
      <summary>Xem trước dự thảo thông báo dừng</summary>
      <div className="mau06-print-actions">
        <span>
          Bản dự thảo chưa có số, chưa ký; đối chiếu đúng tên cơ quan/đơn vị trước khi phát hành.
        </span>
        <button className="button secondary" type="button" onClick={() => window.print()}>
          In hoặc lưu PDF
        </button>
      </div>
      <article className="mau06-document">
        <header className="mau06-heading">
          <div>
            <b>{draft.authorityName || '[TÊN CẤP TỈNH/BỘ, NGÀNH/CẤP XÃ]'}</b>
            <br />
            <b>
              {draft.serviceOfficeName ||
                '[TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG/BỘ PHẬN TIẾP NHẬN VÀ TRẢ KẾT QUẢ]'}
            </b>
            <hr />
            <span>Số: {draft.noticeNumber || '……/TBD-TTPVHCC (BPTNTKQ)'}</span>
          </div>
          <div>
            <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b>
            <br />
            <b>Độc lập - Tự do - Hạnh phúc</b>
            <hr />
            <span>
              {draft.noticeLocation || '……'}, {dateText(draft.noticeDate)}
            </span>
          </div>
        </header>
        <h2>THÔNG BÁO DỪNG GIẢI QUYẾT HỒ SƠ</h2>
        <p>
          {draft.serviceOfficeName ||
            'Trung tâm Phục vụ hành chính công/Bộ phận Tiếp nhận và Trả kết quả'}{' '}
          đã tiếp nhận hồ sơ của Ông (Bà)/Tổ chức: <b>{draft.applicantName || '……………………'}</b>.
        </p>
        <p>
          Số định danh cá nhân/tổ chức: <b>{draft.applicantIdentifier || '……………………'}</b>
          <br />
          Mã hồ sơ: <b>{draft.caseCode || '……………………'}</b>
          <br />
          Nội dung yêu cầu giải quyết: <b>{draft.procedureName || '……………………'}</b>
        </p>
        <p>
          Qua kiểm tra, đến nay, mã số hồ sơ <b>{draft.caseCode}</b> chưa có quyết định giải quyết thủ tục hành chính hoặc có văn bản thông báo kết quả giải quyết thủ tục hành chính.
        </p>
        <p>
          Theo đề nghị <b>{dateText(draft.requestDate?.slice(0, 10))}</b> của Ông (Bà)/Tổ chức{' '}
          <b>{draft.requesterName || draft.applicantName || '……………………'}</b> về việc dừng thực hiện hồ sơ giải quyết thủ tục hành chính, lý do:{' '}
          <b>{draft.reason || '……………………'}</b>.
        </p>
        <p>
          {draft.serviceOfficeName ||
            'Trung tâm Phục vụ hành chính công/Bộ phận Tiếp nhận và Trả kết quả'}{' '}
          thông báo dừng giải quyết hồ sơ nêu trên.
        </p>
        <p>
          Đề nghị Ông (Bà)/Tổ chức liên hệ <b>{draft.collectionOffice || '……………………'}</b> để nhận lại hồ sơ giấy và phí, lệ phí đã nộp (nếu có).
        </p>
        <p>Xin thông báo cho Ông (Bà)/Tổ chức được biết.</p>
        <div className="mau06-signature">
          <b>THỦ TRƯỞNG CƠ QUAN, ĐƠN VỊ</b>
          <br />
          (Ký và ghi rõ họ tên hoặc chữ ký số nếu là biểu mẫu điện tử)
        </div>
        <small className="mau06-draft-label">DỰ THẢO - CHƯA CÓ GIÁ TRỊ PHÁT HÀNH</small>
      </article>
    </details>
  )
}

const REASON_ACTIONS = new Set([
  'request_supplement',
  'reject_intake',
  'send_back',
  'decline',
  'waive_fee',
  'prepare_stop_notice',
  'set_fee',
  'digitize_documents',
  'save_draft',
  'submit_review',
  'approve',
  'submit_supplement',
  'return_to_intake',
  'return_to_leader',
  'extend_deadline',
  'reject_stop_notice',
  'confirm_paper_returned',
  'close_expired_supplement',
])

export function CaseDetail({
  item,
  isStaff,
  signingAuthorityRef,
  labels,
  actionOptions,
  action,
  setAction,
  actionText,
  setActionText,
  assignee,
  setAssignee,
  extendDays,
  setExtendDays,
  staff,
  busy,
  onSubmitAction,
  onLookupKeyChanged,
  onBack,
}: {
  item: CaseFile
  isStaff: boolean
  signingAuthorityRef: string
  labels: Record<string, string>
  actionOptions: { value: string; label: string }[]
  action: string
  setAction: (s: string) => void
  actionText: string
  setActionText: (s: string) => void
  assignee: string
  setAssignee: (s: string) => void
  extendDays: number
  setExtendDays: (days: number) => void
  staff: { id: string; name: string; role: string }[]
  busy: boolean
  onSubmitAction: (e: FormEvent<HTMLFormElement>) => void
  onLookupKeyChanged: () => Promise<void>
  onBack: () => void
}) {
  const [detailTab, setDetailTab] = useState<'dossier' | 'assessment' | 'timeline'>('dossier')
  const [showLookupDrawer, setShowLookupDrawer] = useState(false)
  const needsReason = REASON_ACTIONS.has(action)
  const pendingNotice = item.withdrawal?.status === 'CHO_KY_PHAT_HANH'
  const [todayInHanoi] = useState(() =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  )
  const [noticeHeader, setNoticeHeader] = useState<Record<string, string>>(() => ({
    authorityName: item.withdrawal?.noticeDraft?.authorityName || '',
    serviceOfficeName: item.withdrawal?.noticeDraft?.serviceOfficeName || '',
    noticeLocation: item.withdrawal?.noticeDraft?.noticeLocation || '',
    noticeDate: item.withdrawal?.noticeDraft?.issueDate || todayInHanoi,
    noticeNumber: '',
    collectionOffice: '',
  }))
  const updateNoticeHeader = (key: string, value: string) =>
    setNoticeHeader(current => ({ ...current, [key]: value }))

  const noticeDoc = item.withdrawal?.noticeFile || item.withdrawal?.noticeDocument
  const dueDays = daysUntil(item.deadline)
  const dueTone =
    dueDays !== null && dueDays < 0 && !CLOSED_STATUSES.has(item.status)
      ? 'overdue'
      : dueDays !== null && dueDays <= 3 && !CLOSED_STATUSES.has(item.status)
        ? 'soon'
        : 'normal'

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
  const canPrintMau04 = Boolean(item.forms?.mau04)
  const canPrintMau06 = Boolean(item.withdrawal?.status)

  const specialistOptions = staff.filter(
    person => person.role === 'specialist' || !person.role,
  )
  const assignableStaff = specialistOptions.length ? specialistOptions : staff

  const detailTabs: ('dossier' | 'assessment' | 'timeline')[] = [
    'dossier',
    'assessment',
    'timeline',
  ]

  const isNegativeVerification = Boolean(
    item.proposedDecision === 'DECLINE' ||
      (item.workflowEvidence?.outcome &&
        /không|chưa đủ|từ chối/i.test(String(item.workflowEvidence.outcome))),
  )

  return (
    <div className="case-detail-workspace">
      <header className="panel case-detail-header">
        <div className="case-detail-topbar">
          <div className="case-detail-badges">
            <button type="button" className="staff-back-action" onClick={onBack}>
              ← Quay lại danh sách
            </button>
          </div>

          {isStaff && (
            <div className="case-detail-utility-bar">
              {canPrintMau01 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() => printOfficialSlip('MAU_01', item, labels[item.status])}
                >
                  In dự thảo tiếp nhận
                </button>
              )}
              {canPrintMau02 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() => printOfficialSlip('MAU_02', item, labels[item.status])}
                >
                  In dự thảo bổ sung
                </button>
              )}
              {canPrintMau03 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() => printOfficialSlip('MAU_03', item, labels[item.status])}
                >
                  In dự thảo từ chối tiếp nhận
                </button>
              )}
              {canPrintMau04 && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() => printOfficialSlip('MAU_04', item, labels[item.status])}
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
                  onClick={() => printOfficialSlip('MAU_06', item, labels[item.status])}
                >
                  In dự thảo thông báo dừng
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
        <div className="case-detail-metadata">
          <span>Mã hồ sơ: <b className="tabular-nums">{item.code}</b></span>
          <span>Mã thủ tục: <b>{item.procedureCode}</b></span>
          <span className={`status-pill status-${item.status}`}>{labels[item.status] || item.status}</span>
          <span className={`deadline-mark ${dueTone}`}>{dueText(item)}</span>
        </div>
        {isStaff && item.canManageLookupKey && showLookupDrawer && (
          <StaffLookupKey key={item.code} item={item} onChanged={onLookupKeyChanged} />
        )}
      </header>

      <div className="detail-layout case-detail-grid">
        <div className="detail-main case-detail-main">
          <div
            className="staff-module-tabs"
            role="tablist"
            aria-label="Thông tin hồ sơ chi tiết"
            onKeyDown={event => handleTabArrows(event, detailTabs, detailTab, setDetailTab)}
          >
            <button
              type="button"
              id="case-tab-dossier"
              role="tab"
              tabIndex={detailTab === 'dossier' ? 0 : -1}
              aria-selected={detailTab === 'dossier'}
              aria-controls="case-panel-dossier"
              className={`staff-module-tab${detailTab === 'dossier' ? ' active' : ''}`}
              onClick={() => setDetailTab('dossier')}
            >
              <span>1. Tờ khai &amp; Thành phần hồ sơ</span>
            </button>
            <button
              type="button"
              id="case-tab-assessment"
              role="tab"
              tabIndex={detailTab === 'assessment' ? 0 : -1}
              aria-selected={detailTab === 'assessment'}
              aria-controls="case-panel-assessment"
              className={`staff-module-tab${detailTab === 'assessment' ? ' active' : ''}`}
              onClick={() => setDetailTab('assessment')}
            >
              <span>2. Thẩm định, Tài chính &amp; Kết quả</span>
            </button>
            <button
              type="button"
              id="case-tab-timeline"
              role="tab"
              tabIndex={detailTab === 'timeline' ? 0 : -1}
              aria-selected={detailTab === 'timeline'}
              aria-controls="case-panel-timeline"
              className={`staff-module-tab${detailTab === 'timeline' ? ' active' : ''}`}
              onClick={() => setDetailTab('timeline')}
            >
              <span>3. Nhật ký xử lý</span>
            </button>
          </div>

          {detailTab === 'dossier' && (
            <div
              id="case-panel-dossier"
              role="tabpanel"
              aria-labelledby="case-tab-dossier"
              className="case-tab-content"
            >
              {item.forms?.mau04 && (
                <div className="source-warning">
                  <b>Đã ban hành Phiếu xin lỗi &amp; gia hạn (Mẫu 04):</b> Gia hạn thêm{' '}
                  <b>{item.forms.mau04.addDays || 0} ngày</b> (từ{' '}
                  {toDate(item.forms.mau04.previousDeadline)} sang hạn mới{' '}
                  <b>{toDate(item.forms.mau04.newDeadline || item.deadline)}</b>). Lý do:{' '}
                  {item.forms.mau04.reason}
                </div>
              )}

              {item.supplement?.reason && (
                <div className="source-warning">
                  <b>Yêu cầu bổ sung hồ sơ (Mẫu 02):</b> {item.supplement.reason}
                  {(item.supplementDueAt || item.supplement.dueAt) && (
                    <p>
                      <b>Thời hạn hoàn thiện bổ sung:</b>{' '}
                      {toDate(item.supplementDueAt || item.supplement.dueAt)}
                    </p>
                  )}
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
                      {item.supplement.respondedAt
                        ? ` (${toDate(item.supplement.respondedAt)})`
                        : ''}
                    </p>
                  )}
                </div>
              )}

              {pendingNotice && (
                <div className="source-warning">
                  <b>Đã nhận yêu cầu dừng ngày {toDate(item.withdrawal.requestReceivedAt)}.</b>{' '}
                  Trạng thái hồ sơ vẫn được giữ nguyên, chờ người có thẩm quyền ký phát hành Mẫu 06 hoặc từ chối yêu cầu dừng.
                </div>
              )}
              {pendingNotice && item.withdrawal.noticeDraft && (
                <Mau06Draft draft={{ ...item.withdrawal.noticeDraft, ...noticeHeader }} />
              )}
              {item.withdrawal?.status === 'DA_PHAT_HANH' && (
                <div className="source-warning">
                  <b>Đã phát hành Thông báo dừng Mẫu 06 số {item.withdrawal.noticeNumber}.</b>{' '}
                  Kênh gửi:{' '}
                  {item.withdrawal.noticeDelivery?.channel === 'BUU_CHINH'
                    ? 'Bưu chính'
                    : 'Trực tiếp'}{' '}
                  · {item.withdrawal.noticeDelivery?.reference}
                  {item.withdrawal.returnPaperFollowUp && (
                    <p>
                      <b>Hoàn trả bản giấy gốc:</b>{' '}
                      {item.withdrawal.returnPaperFollowUp === 'DA_HOAN_TRA'
                        ? 'Đã đối chiếu và hoàn trả bản gốc'
                        : item.withdrawal.returnPaperFollowUp === 'CAN_DOI_CHIEU'
                          ? 'Đang chờ xác nhận hoàn trả bản giấy gốc tại quầy'
                          : 'Không phát sinh bản giấy gốc'}
                    </p>
                  )}
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
                    <p className="muted">
                      Hồ sơ tiếp nhận trực tiếp tại quầy hoặc không sử dụng biểu mẫu điện tử cấu trúc.
                    </p>
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
                          {file.name}
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
                        {item.digitization.documentRegister} · Thực hiện bởi{' '}
                        {item.digitization.digitizedBy} ({toDate(item.digitization.digitizedAt)})
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
                          {(item.procedure?.submission?.documents || []).find(
                            (doc: { id: string }) => doc.id === id,
                          )?.label || id}
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
            <div
              id="case-panel-assessment"
              role="tabpanel"
              aria-labelledby="case-tab-assessment"
              className="case-tab-content"
            >
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
                      <a
                        className="button secondary compact-btn"
                        href={item.workflowGuard.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
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
                      {item.workflowGuard.officialSteps.map(
                        (step: { id: string; name: string; description: string }) => (
                          <details key={step.id}>
                            <summary>{step.name}</summary>
                            <div className="workflow-step-content">
                              {step.description.split(/\n+/).filter(line => line.trim()).map((line, index) => (
                                <p key={index}>{line.trim()}</p>
                              ))}
                            </div>
                          </details>
                        ),
                      )}
                      {item.workflowGuard.conditions && (
                        <details>
                          <summary>Yêu cầu, điều kiện thực hiện thủ tục</summary>
                          <div className="workflow-step-content">
                            {String(item.workflowGuard.conditions).split(/\n+/).filter(line => line.trim()).map((line, index) => (
                              <p key={index}>{line.trim()}</p>
                            ))}
                          </div>
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
                    <b>Kết luận kiểm tra:</b> {item.workflowEvidence.outcome} ·{' '}
                    {toDate(item.workflowEvidence.verifiedAt)}
                  </p>
                  {item.proposedDecision && (
                    <p>
                      <b>Đề xuất trình lãnh đạo:</b>{' '}
                      {item.proposedDecision === 'DECLINE'
                        ? 'Đề nghị kết luận không giải quyết (KHONG_GIAI_QUYET)'
                        : 'Đề nghị phê duyệt giải quyết'}
                    </p>
                  )}
                  {(item.workflowEvidence.registerReference ||
                    item.workflowEvidence.dataReference) && (
                    <p>
                      <b>Số sổ / Mã tham chiếu dữ liệu:</b>{' '}
                      {item.workflowEvidence.registerReference ||
                        item.workflowEvidence.dataReference}
                    </p>
                  )}
                  <p>
                    <b>Căn cứ thẩm định:</b> {item.workflowEvidence.verificationBasis}
                  </p>
                  {item.workflowEvidence.financialAssessment && (
                    <p>
                      <b>Xác định nghĩa vụ tài chính:</b>{' '}
                      {item.workflowEvidence.financialAssessment}
                    </p>
                  )}
                </section>
              )}

              {item.milestones?.length > 0 && (
                <section className="panel citizen-case-section">
                  <h3>Mốc xử lý trung gian</h3>
                  {item.milestones.map(
                    (milestone: {
                      id: string
                      label: string
                      dueDate: string
                      completedAt?: string
                    }) => (
                      <p key={milestone.id}>
                        <b>{milestone.label}:</b> hạn {toDate(milestone.dueDate)} ·{' '}
                        {milestone.completedAt
                          ? `Đã thực hiện ${toDate(milestone.completedAt)}`
                          : 'Chưa hoàn tất'}
                      </p>
                    ),
                  )}
                </section>
              )}

              <section className="panel citizen-case-section">
                <h3>Nghĩa vụ tài chính (Phí / Lệ phí)</h3>
                {item.fee?.amount ? (
                  <>
                    <p>
                      <b>Số tiền: {Number(item.fee.amount).toLocaleString('vi-VN')} đồng</b> ·{' '}
                      {item.fee.basis}
                    </p>
                    <p>
                      Trạng thái:{' '}
                      <b>
                        {(
                          {
                            DUE: 'Chờ thanh toán',
                            PAID: 'Chờ kế toán đối soát',
                            RECONCILED: 'Đã đối soát chứng từ',
                            WAIVED: 'Đã miễn thu',
                            REFUNDED: 'Đã hoàn trả',
                          } as Record<string, string>
                        )[item.fee.status] || item.fee.status}
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
                  <div
                    className={item.sandboxSignature.verified ? 'citizen-success' : 'form-error'}
                    style={{ marginTop: 12 }}
                  >
                    <b>
                      {item.sandboxSignature.verified
                        ? 'Đã ký số nội bộ hợp lệ (Ed25519)'
                        : 'Chữ ký số không hợp lệ'}
                    </b>
                    <p>
                      Người ký: {item.sandboxSignature.signer} ·{' '}
                      {toDate(item.sandboxSignature.signedAt)} · SHA-256:{' '}
                      <code>{item.sandboxSignature.documentHash}</code>
                    </p>
                  </div>
                )}

                {item.status === 'DA_PHE_DUYET' && !item.sandboxSignature && (
                  <div className="source-warning" style={{ marginTop: 12 }}>
                    <b>Hồ sơ đã phê duyệt, chờ ký số:</b>{' '}
                    {item.approvedAt &&
                    item.approvedById &&
                    String(item.draftResult || '').trim().length >= 10
                      ? 'Lãnh đạo có thẩm quyền ký số có thể thực hiện ký kết quả trước khi văn thư phát hành.'
                      : 'Cần bổ sung đầy đủ dự thảo và thông tin phê duyệt trước khi ký.'}
                  </div>
                )}

                {item.result && (
                  <div className="dossier-paper-box" style={{ marginTop: 12 }}>
                    <p>
                      <b>Số hiệu văn bản kết quả:</b> {item.result.number} ·{' '}
                      <b>Ngày phát hành:</b> {toDate(item.result.issuedAt || item.resultIssuedAt)}
                    </p>
                    <p>{item.result.content}</p>
                    {!!item.result.files?.length && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {item.result.files.map((file, idx) =>
                          file.downloadUrl ? (
                            <a
                              key={`${file.name}-${idx}`}
                              className="button secondary compact-btn"
                              href={file.downloadUrl}
                            >
                              Tải bản kết quả điện tử: {file.name}
                            </a>
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                )}

                {item.delivery && (
                  <div className="dossier-paper-box" style={{ marginTop: 12 }}>
                    <p>
                      <b>Người nhận kết quả:</b> {item.delivery.receiver} · <b>Kênh trả:</b>{' '}
                      {channelNames[item.delivery.channel] || item.delivery.channel}
                    </p>
                    <p>
                      <b>Biên nhận / Chứng cứ giao:</b> {item.delivery.evidence} ·{' '}
                      <b>Thời gian:</b> {toDate(item.delivery.deliveredAt || item.delivery.at)}
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {detailTab === 'timeline' && (
            <section
              id="case-panel-timeline"
              role="tabpanel"
              aria-labelledby="case-tab-timeline"
              className="panel citizen-case-section"
            >
              <div className="section-head-clean">
                <h3>Nhật ký xử lý hồ sơ ({item.events?.length || 0} mốc sự kiện)</h3>
                <span className="section-head-note">Toàn bộ diễn tiến xử lý từ lúc tiếp nhận đến khi có kết quả</span>
              </div>
              {item.events?.length > 0 ? (
                <div className="timeline-flow">
                  {item.events.map((event, i) => (
                    <div className="timeline-flow-item" key={`${event.at}-${i}`}>
                      <div className="timeline-rail">
                        <span className="timeline-rail-dot" />
                        {i < item.events.length - 1 && <span className="timeline-rail-line" />}
                      </div>
                      <div className="timeline-card">
                        <div className="timeline-card-header">
                          <b className="timeline-card-title">{event.title}</b>
                          <div className="timeline-card-meta">
                            <span className="timeline-time-badge">{toDate(event.at)}</span>
                            {isStaff && event.actor && (
                              <span className="timeline-actor-pill">Cán bộ: {event.actor}</span>
                            )}
                            {isStaff && event.audience === 'internal' && (
                              <span className="timeline-internal-tag">Nội bộ</span>
                            )}
                          </div>
                        </div>
                        {(isStaff || event.audience !== 'internal') && event.detail && (
                          <div className="timeline-card-detail">{event.detail}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">Chưa có sự kiện xử lý.</p>
              )}

              {isStaff && item.withdrawal?.requestDocuments?.length > 0 && (
                <div className="dossier-paper-box" style={{ marginTop: 14 }}>
                  <b>Tài liệu yêu cầu dừng hồ sơ:</b>
                  {item.withdrawal.requestDocuments.map(
                    (file: { name: string; downloadUrl: string }) => (
                      <div key={file.name}>
                        <a href={file.downloadUrl}>{file.name}</a>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="detail-side case-detail-side">
          {actionOptions.length > 0 && (
            <section className="panel action-panel sticky-action-panel">
              <div className="action-panel-head">
                <h3>
                  {isStaff ? 'Xử lý hồ sơ' : 'Gửi bổ sung hồ sơ'}
                  {pendingNotice ? ' · Yêu cầu dừng' : ''}
                </h3>
              </div>

              {item.workflowGuard?.message && actionOptions.length > 0 && (
                <p className="action-guard-hint">{item.workflowGuard.message}</p>
              )}

              {actionOptions.length ? (
                <form onSubmit={onSubmitAction}>
                  <label>
                    <span>Chọn nghiệp vụ thực hiện</span>
                    <select
                      value={action}
                      onChange={e => {
                        const next = e.target.value
                        setAction(next)
                        setActionText(
                          ['save_draft', 'submit_review'].includes(next)
                            ? item.draftResult || ''
                            : '',
                        )
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

                  {action === 'send_back' && item.sandboxSignature?.verified && (
                    <p className="source-warning small-warning">
                      Lưu ý: Trả lại hồ sơ đã ký sẽ thu hồi chữ ký số hiện tại để chuyên viên/lãnh đạo chỉnh sửa và ký lại.
                    </p>
                  )}

                  {action === 'submit_review' && isNegativeVerification && (
                    <p className="source-warning small-warning">
                      Kết quả kiểm tra chuyên ngành đang ở trạng thái không đủ điều kiện: trình duyệt sẽ đề xuất Lãnh đạo ban hành kết luận không giải quyết (Mẫu 03).
                    </p>
                  )}

                  {action === 'assign' && (
                    <label>
                      <span>Chuyên viên được phân công</span>
                      <select
                        value={assignee}
                        onChange={e => setAssignee(e.target.value)}
                        required
                      >
                        <option value="">Chọn chuyên viên thụ lý</option>
                        {assignableStaff.map(person => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {action === 'extend_deadline' && (
                    <label>
                      <span>Số ngày gia hạn thêm (1–15 ngày)</span>
                      <input
                        type="number"
                        min={1}
                        max={15}
                        value={extendDays}
                        onChange={e => setExtendDays(Number(e.target.value))}
                        required
                      />
                    </label>
                  )}

                  {action === item.workflowGuard?.verificationAction &&
                    (item.workflowGuard.evidenceFields || []).map(
                      (field: {
                        id: string
                        label: string
                        options?: string[]
                        minLength?: number
                      }) => (
                        <label key={field.id}>
                          <span>{field.label}</span>
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
                                <option key={value} value={value}>
                                  {value}
                                </option>
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
                      <span>Số trang đã quét</span>
                      <input name="pageCount" type="number" min="1" max="500" required />
                    </label>
                  )}

                  {action === 'set_fee' && (
                    <label>
                      <span>Số tiền (đồng)</span>
                      <input
                        name="feeAmount"
                        type="number"
                        min="1"
                        max="100000000"
                        step="1"
                        required
                      />
                    </label>
                  )}

                  {needsReason && (
                    <label>
                      <span>
                        {['save_draft', 'submit_review'].includes(action)
                          ? 'Dự thảo kết quả giải quyết / đề xuất trình duyệt'
                          : action === 'submit_supplement'
                            ? 'Nội dung bổ sung'
                            : action === 'request_supplement'
                              ? 'Nội dung cần bổ sung (mỗi ý một dòng, nêu rõ căn cứ)'
                              : action === 'prepare_stop_notice'
                                ? 'Lý do đề nghị dừng'
                                : action === 'digitize_documents'
                                  ? 'Danh mục giấy tờ đối chiếu với bản gốc'
                                  : action === 'set_fee'
                                    ? 'Căn cứ và nguồn xác định khoản thu'
                                    : action === 'extend_deadline'
                                      ? 'Lý do chậm trễ và nội dung xin lỗi (Mẫu 04)'
                                      : action === 'return_to_intake'
                                        ? 'Nội dung đề nghị Một cửa kiểm tra lại'
                                        : action === 'return_to_leader'
                                          ? 'Nội dung đề nghị Lãnh đạo chỉnh sửa thể thức'
                                          : action === 'reject_stop_notice'
                                            ? 'Căn cứ từ chối yêu cầu dừng và tiếp tục thụ lý'
                                            : action === 'confirm_paper_returned'
                                              ? 'Ghi chú biên nhận hoàn trả bản giấy gốc'
                                              : action === 'close_expired_supplement'
                                                ? 'Căn cứ đóng hồ sơ quá hạn bổ sung'
                                                : 'Nội dung / căn cứ xử lý'}
                      </span>
                      <textarea
                        value={actionText}
                        onChange={e => setActionText(e.target.value)}
                        rows={4}
                        required
                        minLength={
                          ['save_draft', 'submit_review', 'extend_deadline'].includes(action)
                            ? 10
                            : action === 'request_supplement' || action === 'set_fee'
                              ? 15
                              : action === 'prepare_stop_notice'
                                ? 8
                                : 5
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
                      <span>Số hiệu văn bản kết quả</span>
                      <input
                        name="resultNumber"
                        required
                        minLength={3}
                        maxLength={100}
                        placeholder="QD-2026-001"
                      />
                    </label>
                  )}

                  {action === 'deliver' && (
                    <>
                      <label>
                        <span>Người nhận kết quả</span>
                        <input
                          name="deliveryReceiver"
                          required
                          minLength={2}
                          maxLength={180}
                          defaultValue={item.applicant?.name || ''}
                        />
                      </label>
                      <label>
                        <span>Kênh trả</span>
                        <select name="deliveryChannel" required defaultValue="">
                          <option value="" disabled>
                            Chọn kênh
                          </option>
                          <option value="TRUC_TIEP">Trực tiếp</option>
                          <option value="BUU_CHINH">Qua dịch vụ bưu chính</option>
                          <option value="DIEN_TU_SANDBOX">Bản điện tử trên Cổng Dịch vụ công</option>
                        </select>
                      </label>
                      <label>
                        <span>Mã biên nhận/chứng cứ giao</span>
                        <input name="deliveryEvidence" required minLength={3} maxLength={180} />
                      </label>
                    </>
                  )}

                  {action === 'prepare_stop_notice' && (
                    <>
                      <label>
                        <span>Kênh nhận yêu cầu</span>
                        <select name="stopChannel" required defaultValue="">
                          <option value="" disabled>
                            Chọn kênh
                          </option>
                          <option value="TRUC_TIEP">Trực tiếp tại Bộ phận Một cửa</option>
                          <option value="BUU_CHINH">Bưu chính</option>
                        </select>
                      </label>
                      <label>
                        <span>Người yêu cầu</span>
                        <select name="requesterType" required defaultValue="">
                          <option value="" disabled>
                            Chọn chủ thể
                          </option>
                          <option value="SELF">Chủ thể hồ sơ</option>
                          <option value="REPRESENTATIVE">Người đại diện</option>
                        </select>
                      </label>
                      <label>
                        <span>Họ tên người yêu cầu</span>
                        <input
                          name="requesterName"
                          maxLength={150}
                          minLength={2}
                          defaultValue={item.applicant?.name || ''}
                          required
                        />
                      </label>
                      <label>
                        <span>Số định danh cá nhân/mã số tổ chức</span>
                        <input name="requesterIdentifier" maxLength={80} minLength={3} required />
                      </label>
                      <label>
                        <span>Địa chỉ người yêu cầu</span>
                        <input name="requesterAddress" maxLength={300} minLength={3} required />
                      </label>
                      <label>
                        <span>Số điện thoại</span>
                        <input name="requesterPhone" type="tel" maxLength={40} />
                      </label>
                      <label>
                        <span>Email</span>
                        <input name="requesterEmail" type="email" maxLength={254} />
                      </label>
                      <label>
                        <span>Mã biên nhận trực tiếp hoặc mã bưu gửi</span>
                        <input
                          name="requestReference"
                          maxLength={120}
                          placeholder="Bắt buộc nếu nhận qua bưu chính"
                        />
                      </label>
                      <label className="check-row">
                        <input name="identityVerified" type="checkbox" required />
                        <span>Đã đối chiếu danh tính người yêu cầu</span>
                      </label>
                      <label className="check-row">
                        <input name="authorizationVerified" type="checkbox" />
                        <span>
                          Nếu là người đại diện: đã đối chiếu giấy tờ chứng minh căn cứ đại diện
                        </span>
                      </label>
                      <label>
                        <span>Văn bản yêu cầu dừng đã ký (PDF, PNG hoặc JPG)</span>
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
                        <span>Tên cấp tỉnh/Bộ, ngành/cấp xã ghi ở đầu biểu mẫu</span>
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
                        <span>Tên Trung tâm/Bộ phận Tiếp nhận và Trả kết quả</span>
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
                        <span>Địa danh ban hành</span>
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
                        <span>Ngày trên Mẫu 06</span>
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
                        <span>Số văn bản đầy đủ theo sổ văn bản đi</span>
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
                        <span>Kênh gửi thông báo</span>
                        <select name="noticeDeliveryChannel" required defaultValue="">
                          <option value="" disabled>
                            Chọn kênh
                          </option>
                          <option value="TRUC_TIEP">Trực tiếp</option>
                          <option value="BUU_CHINH">Bưu chính</option>
                        </select>
                      </label>
                      <label>
                        <span>Biên nhận giao hoặc mã bưu gửi</span>
                        <input name="deliveryReference" maxLength={150} minLength={3} required />
                      </label>
                      <label>
                        <span>Đầu mối liên hệ nhận lại hồ sơ giấy và khoản đã nộp</span>
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
                        <input name="signatureAttested" type="checkbox" required />
                        <span>
                          Tôi xác nhận bản Mẫu 06 đính kèm đã được người có thẩm quyền ký
                        </span>
                      </label>
                      <label>
                        <span>Bản Thông báo dừng Mẫu 06 đã ký</span>
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
                      <span>Tài liệu bổ sung</span>
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
                      'extend_deadline',
                      'reject_stop_notice',
                      'confirm_paper_returned',
                      'close_expired_supplement',
                      'return_to_intake',
                      'return_to_leader',
                    ].includes(action) && (
                      <label>
                        <span>Tài liệu đính kèm (nếu cần)</span>
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
                                  ? 'Ký số nội dung đã duyệt'
                                  : action === 'issue'
                                    ? 'Phát hành kết quả'
                                    : action === 'deliver'
                                      ? 'Ghi nhận trả kết quả'
                                      : action === 'waive_fee'
                                        ? 'Ghi nhận miễn khoản thu'
                                        : action === 'extend_deadline'
                                          ? 'Ban hành Phiếu xin lỗi & gia hạn Mẫu 04'
                                          : 'Xác nhận thực hiện'}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <p className="muted">
                  Không có thao tác khả dụng cho vai trò hiện tại ở trạng thái{' '}
                  <b>{labels[item.status] || item.status}</b>.
                </p>
              )}
            </section>
          )}

          <section className="panel dossier-summary-card">
            <div className="dossier-summary-top">
              <div className="dossier-summary-header">
                <h3>Thông tin tóm tắt hồ sơ</h3>
              </div>
              <div className="dossier-summary-qr">
                <QrCodeBadge code={item.code} size={58} />
              </div>
            </div>
            <dl className="dossier-meta-list">
              <div className="meta-card-item">
                <dt>Chủ hồ sơ</dt>
                <dd>
                  <b className="meta-highlight">{item.applicant?.name || '—'}</b>
                  {item.applicant?.citizenId && (
                    <small>Định danh/MST: {item.applicant.citizenId}</small>
                  )}
                </dd>
              </div>
              <div className="meta-card-item">
                <dt>Thông tin liên hệ</dt>
                <dd>
                  {[item.applicant?.phone, item.applicant?.email].filter(Boolean).join(' · ') ||
                    '—'}
                  {item.applicant?.address && <small>{item.applicant.address}</small>}
                </dd>
              </div>
              <div className="meta-card-item">
                <dt>Kênh nộp &amp; Nhận kết quả</dt>
                <dd>
                  {item.submissionChannel === 'TRUC_TIEP'
                    ? 'Trực tiếp tại quầy'
                    : 'Trực tuyến'}{' '}
                  · Nhận:{' '}
                  {channelNames[item.deliveryMethod || ''] || item.deliveryMethod || 'Trực tiếp'}
                </dd>
              </div>
              <div className="meta-card-item">
                <dt>Cơ quan tiếp nhận</dt>
                <dd className="meta-strong-text">{item.receivingAgency || item.procedure?.agency || '—'}</dd>
              </div>
              <div className="meta-card-item">
                <dt>Chuyên viên thụ lý</dt>
                <dd>
                  <b>
                    {item.assignment?.assigneeName ||
                      item.assignment?.assignee ||
                      'Chưa phân công'}
                  </b>
                  {item.assignment?.assignedAt && (
                    <small>Phân công: {toDate(item.assignment.assignedAt)}</small>
                  )}
                </dd>
              </div>
              <div className="meta-card-item">
                <dt>Thời điểm tiếp nhận</dt>
                <dd>{toDate(item.acceptedAt || item.createdAt)}</dd>
              </div>
              <div className="meta-card-item meta-card-deadline">
                <dt>Hạn giải quyết theo quy định</dt>
                <dd>
                  <b>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</b>
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}
