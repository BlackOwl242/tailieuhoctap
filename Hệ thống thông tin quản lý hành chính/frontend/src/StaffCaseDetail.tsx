import {
  ArrowLeft,
  ChevronDown,
  Columns2,
  Download,
  ExternalLink,
  Eye,
  FileSignature,
  FileText,
  KeyRound,
  MoreHorizontal,
  Play,
  Printer,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CaseDeclaration } from './CitizenTracking'
import { ModalDialog, SideDrawer, SLABadge, SplitDossierViewer, StatusTag } from './design-system'
import type { OfficialSlipKind } from './officialForms'
import {
  api,
  channelNames,
  feeStatusLabels,
  handleTabArrows,
  roleNames,
  toDate,
} from './portalUtils'
import { QrCodeBadge } from './printSlips'
import { printOfficialSlip } from './printUtils'
import type { CaseFile } from './types'

function formatChannel(code?: string, fallback = 'Trực tiếp tại Bộ phận Một cửa'): string {
  if (!code) return fallback
  return channelNames[code] || code
}

function setNativeSelectValue(select: HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  setter?.call(select, value)
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

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
    <section className="staff-lookup-key staff-lookup-key--modal">
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
          className="button warning compact-btn"
          disabled={busy}
          onClick={() => setRotateOpen(!rotateOpen)}
        >
          Cấp lại khóa mới
        </button>
      </div>

      <div className="staff-lookup-key-fields">
        <label>
          <span>Mã hồ sơ</span>
          <input className="mono-code tabular-nums" readOnly value={item.code} />
        </label>
        {secret && (
          <label>
            <span>Khóa tra cứu hiện hành</span>
            <input
              className="mono-code tabular-nums"
              readOnly
              value={secret}
              spellCheck={false}
              autoComplete="off"
            />
          </label>
        )}
      </div>

      {rotateOpen && (
        <div className="source-warning small-warning">
          <p className="case-reset-margin">
            Cấp khóa mới sẽ vô hiệu hóa khóa cũ ngay lập tức. Cần cung cấp lại khóa mới cho chủ hồ sơ.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button warning compact-btn"
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

const DESTRUCTIVE_WORKFLOW_ACTIONS = new Set([
  'reject_intake',
  'decline',
  'reject_stop_notice',
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
  const [splitOpen, setSplitOpen] = useState(true)
  const [lookupModalOpen, setLookupModalOpen] = useState(false)

  const printMenuRef = useRef<HTMLDetailsElement>(null)
  const moreActionsRef = useRef<HTMLDetailsElement>(null)
  const viewerPaneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (printMenuRef.current?.open && !printMenuRef.current.contains(target)) {
        printMenuRef.current.open = false
      }
      if (moreActionsRef.current?.open && !moreActionsRef.current.contains(target)) {
        moreActionsRef.current.open = false
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

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
  const canPrintMau03 = Boolean(item.status === 'TU_CHOI' || item.status === 'KHONG_GIAI_QUYET')
  const canPrintMau04 = Boolean(item.forms?.mau04)
  const canPrintMau05 = Boolean(item.withdrawal?.reason)
  const canPrintMau06 = Boolean(item.withdrawal?.status)

  const slipMenuOptions = useMemo<
    { kind: OfficialSlipKind; label: string; active: boolean }[]
  >(
    () => [
      { kind: 'MAU_01', label: 'Mẫu 01 · Giấy tiếp nhận & hẹn trả', active: canPrintMau01 },
      { kind: 'MAU_02', label: 'Mẫu 02 · Phiếu yêu cầu bổ sung', active: canPrintMau02 },
      { kind: 'MAU_03', label: 'Mẫu 03 · Phiếu từ chối tiếp nhận', active: canPrintMau03 },
      { kind: 'MAU_04', label: 'Mẫu 04 · Phiếu xin lỗi & gia hạn', active: canPrintMau04 },
      { kind: 'MAU_05', label: 'Mẫu 05 · Yêu cầu rút / dừng hồ sơ', active: canPrintMau05 },
      { kind: 'MAU_06', label: 'Mẫu 06 · Thông báo dừng giải quyết', active: canPrintMau06 },
    ],
    [canPrintMau01, canPrintMau02, canPrintMau03, canPrintMau04, canPrintMau05, canPrintMau06],
  )

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

  const { primaryActions, secondaryActions } = useMemo(() => {
    if (!actionOptions.length) {
      return {
        primaryActions: [] as { value: string; label: string }[],
        secondaryActions: [] as { value: string; label: string }[],
      }
    }
    const preferredOrder = [
      item.workflowGuard?.verificationAction,
      'accept',
      'assign',
      'submit_review',
      'save_draft',
      'approve',
      'sign_result',
      'issue',
      'deliver',
      'complete',
      'submit_supplement',
      'issue_stop_notice',
      'request_supplement',
    ].filter(Boolean) as string[]

    const sorted = [...actionOptions].sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.value)
      const idxB = preferredOrder.indexOf(b.value)
      const scoreA = idxA === -1 ? 999 : idxA
      const scoreB = idxB === -1 ? 999 : idxB
      return scoreA - scoreB
    })

    const topTwo = sorted.slice(0, 2)
    const topSet = new Set(topTwo.map(itemOpt => itemOpt.value))
    return {
      primaryActions: topTwo,
      secondaryActions: actionOptions.filter(itemOpt => !topSet.has(itemOpt.value)),
    }
  }, [actionOptions, item.workflowGuard?.verificationAction])

  function openActionWithValue(next: string) {
    setAction(next)
    setActionText(
      ['save_draft', 'submit_review'].includes(next) ? item.draftResult || '' : '',
    )
    if (moreActionsRef.current) {
      moreActionsRef.current.open = false
    }
  }

  function closeActionDrawer() {
    if (busy) return
    setAction('')
  }

  function focusDocInViewer(docId: string) {
    if (!splitOpen) setSplitOpen(true)
    window.setTimeout(() => {
      const root = viewerPaneRef.current
      if (!root) return
      const tabs = root.querySelectorAll<HTMLButtonElement>('.dossier-viewer__modes [role="tab"]')
      if (tabs[0] && tabs[0].getAttribute('aria-selected') !== 'true') {
        tabs[0].click()
      }
      window.setTimeout(() => {
        const select = root.querySelector<HTMLSelectElement>(
          'select[aria-label="Chọn tệp đính kèm để đối chiếu"]',
        )
        if (select) {
          setNativeSelectValue(select, docId)
          select.focus({ preventScroll: true })
        }
        if (window.innerWidth <= 1280) {
          root.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 25)
    }, 25)
  }

  function focusSlipInViewer(slip: OfficialSlipKind) {
    if (!splitOpen) setSplitOpen(true)
    window.setTimeout(() => {
      const root = viewerPaneRef.current
      if (!root) return
      const tabs = root.querySelectorAll<HTMLButtonElement>('.dossier-viewer__modes [role="tab"]')
      if (tabs[1] && tabs[1].getAttribute('aria-selected') !== 'true') {
        tabs[1].click()
      }
      window.setTimeout(() => {
        const select = root.querySelector<HTMLSelectElement>('#slip-preview-select')
        if (select) {
          setNativeSelectValue(select, slip)
          select.focus({ preventScroll: true })
        }
        if (window.innerWidth <= 1280) {
          root.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 25)
    }, 25)
  }

  const drawerOpen = Boolean(action)
  const selectedActionOption = actionOptions.find(opt => opt.value === action)
  const statusLabel = labels[item.status] || item.statusLabel || item.status
  const submissionChannelText = formatChannel(
    item.submissionChannel,
    'Trực tuyến trên Cổng Dịch vụ công',
  )
  const deliveryMethodText = formatChannel(
    item.deliveryMethod,
    'Trực tiếp tại Bộ phận Một cửa',
  )

  return (
    <div className="case-detail-workspace">
      <header className="panel case-detail-header">
        <div className="case-detail-topbar">
          <div className="case-detail-badges">
            <button type="button" className="button secondary compact-btn" onClick={onBack}>
              <ArrowLeft size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>Quay lại danh sách</span>
            </button>

            <button
              type="button"
              className={`button ${splitOpen ? 'secondary' : 'primary'} compact-btn`}
              aria-pressed={splitOpen}
              onClick={() => setSplitOpen(prev => !prev)}
            >
              <Columns2 size={15} strokeWidth={1.75} aria-hidden="true" />
              <span>
                {splitOpen ? 'Ẩn khung đối chiếu tài liệu' : 'Hiện khung đối chiếu tài liệu'}
              </span>
            </button>
          </div>

          {isStaff && (
            <div className="case-detail-utility-bar">
              <details
                ref={printMenuRef}
                className="report-export-menu case-print-menu"
                onKeyDown={event => {
                  if (event.key === 'Escape' && printMenuRef.current?.open) {
                    printMenuRef.current.open = false
                    printMenuRef.current.querySelector('summary')?.focus()
                  }
                }}
              >
                <summary className="button secondary compact-btn">
                  <Printer size={15} strokeWidth={1.75} aria-hidden="true" />
                  <span>In biểu mẫu pháp lý (01–06)</span>
                  <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
                </summary>
                <div className="report-export-options case-print-menu__options">
                  {slipMenuOptions.map(slip => (
                    <button
                      key={slip.kind}
                      type="button"
                      className="case-print-menu__item"
                      onClick={() => {
                        if (printMenuRef.current) printMenuRef.current.open = false
                        printOfficialSlip(slip.kind, item, statusLabel)
                      }}
                    >
                      <span>{slip.label}</span>
                      {slip.active && (
                        <span className="case-print-menu__tag">Đủ dữ liệu</span>
                      )}
                    </button>
                  ))}
                </div>
              </details>

              {item.canManageLookupKey && (
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() => setLookupModalOpen(true)}
                >
                  <KeyRound size={15} strokeWidth={1.75} aria-hidden="true" />
                  <span>Mã &amp; Khóa tra cứu</span>
                </button>
              )}
            </div>
          )}
        </div>

        <h1 className="case-detail-title">{item.procedure?.name || item.procedureCode}</h1>
        <div className="case-detail-metadata">
          <span>
            Mã hồ sơ: <b className="mono-code tabular-nums">{item.code}</b>
          </span>
          <span>
            Mã thủ tục: <b className="mono-code tabular-nums">{item.procedureCode}</b>
          </span>
          <StatusTag status={item.status} label={statusLabel} />
          <SLABadge item={item} />
          <span>
            Kênh nộp: <b>{submissionChannelText}</b>
          </span>
          <span>
            Nhận kết quả: <b>{deliveryMethodText}</b>
          </span>
        </div>
      </header>

      <ModalDialog
        open={Boolean(isStaff && item.canManageLookupKey && lookupModalOpen)}
        title="Mã hồ sơ & Khóa tra cứu của công dân"
        description="Chỉ cung cấp cho chủ hồ sơ hoặc người đại diện hợp pháp sau khi đối chiếu giấy tờ tùy thân. Mọi thao tác xem và cấp lại đều được ghi nhật ký kiểm toán."
        onClose={() => setLookupModalOpen(false)}
      >
        <StaffLookupKey key={item.code} item={item} onChanged={onLookupKeyChanged} />
      </ModalDialog>

      <div className={splitOpen ? 'workstation-split' : 'workstation-split workstation-split--single'}>
        <div className="case-detail-main">
          <div
            className="staff-module-tabs case-detail-tabs"
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
              <span>1. Tờ khai &amp; Hồ sơ</span>
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
              <span>2. Thẩm định &amp; Lệ phí</span>
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
              <span>3. Nhật ký kiểm toán</span>
              <b className="tabular-nums">{item.events?.length || 0}</b>
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
                <div className="source-warning case-notice-banner">
                  <div>
                    <b>Đã ban hành Phiếu xin lỗi &amp; gia hạn (Mẫu 04):</b> Gia hạn thêm{' '}
                    <b className="tabular-nums">{item.forms.mau04.addDays || 0} ngày</b> (từ{' '}
                    <span className="tabular-nums">{toDate(item.forms.mau04.previousDeadline)}</span>{' '}
                    sang hạn mới{' '}
                    <b className="tabular-nums">
                      {toDate(item.forms.mau04.newDeadline || item.deadline)}
                    </b>
                    ). Lý do: {item.forms.mau04.reason}
                  </div>
                  {isStaff && (
                    <div className="case-notice-banner__actions">
                      <button
                        type="button"
                        className="button secondary compact-btn"
                        onClick={() => focusSlipInViewer('MAU_04')}
                      >
                        <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>Đối chiếu Mẫu 04</span>
                      </button>
                      <button
                        type="button"
                        className="button secondary compact-btn"
                        onClick={() => printOfficialSlip('MAU_04', item, statusLabel)}
                      >
                        <Printer size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>In Mẫu 04</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {item.supplement?.reason && (
                <div className="source-warning case-notice-banner">
                  <div>
                    <b>Yêu cầu bổ sung hồ sơ (Mẫu 02):</b> {item.supplement.reason}
                    {(item.supplementDueAt || item.supplement.dueAt) && (
                      <p className="case-notice-subline">
                        <b>Thời hạn hoàn thiện bổ sung:</b>{' '}
                        <span className="tabular-nums">
                          {toDate(item.supplementDueAt || item.supplement.dueAt)}
                        </span>
                      </p>
                    )}
                    {(item.supplement.items || []).length > 0 && (
                      <ul className="case-supplement-list">
                        {(item.supplement.items || []).map((entry: string, idx: number) => (
                          <li key={`${entry}-${idx}`}>{entry}</li>
                        ))}
                      </ul>
                    )}
                    {item.supplement.citizenNote && (
                      <p className="case-notice-subline">
                        <b>Giải trình / bổ sung đã gửi:</b> {item.supplement.citizenNote}
                        {item.supplement.respondedAt && (
                          <>
                            {' '}
                            (<span className="tabular-nums">{toDate(item.supplement.respondedAt)}</span>)
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {isStaff && (
                    <div className="case-notice-banner__actions">
                      <button
                        type="button"
                        className="button secondary compact-btn"
                        onClick={() => focusSlipInViewer('MAU_02')}
                      >
                        <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>Đối chiếu Mẫu 02</span>
                      </button>
                      <button
                        type="button"
                        className="button secondary compact-btn"
                        onClick={() => printOfficialSlip('MAU_02', item, statusLabel)}
                      >
                        <Printer size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>In Mẫu 02</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {pendingNotice && (
                <div className="source-warning case-notice-banner">
                  <div>
                    <b>
                      Đã nhận yêu cầu dừng ngày{' '}
                      <span className="tabular-nums">{toDate(item.withdrawal.requestReceivedAt)}</span>.
                    </b>{' '}
                    Trạng thái hồ sơ vẫn được giữ nguyên, chờ người có thẩm quyền ký phát hành Mẫu 06 hoặc từ chối yêu cầu dừng.
                  </div>
                  {isStaff && (
                    <div className="case-notice-banner__actions">
                      <button
                        type="button"
                        className="button secondary compact-btn"
                        onClick={() => focusSlipInViewer('MAU_06')}
                      >
                        <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>Xem dự thảo Mẫu 06 (A4)</span>
                      </button>
                      <button
                        type="button"
                        className="button secondary compact-btn"
                        onClick={() => printOfficialSlip('MAU_06', item, statusLabel)}
                      >
                        <Printer size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>In dự thảo Mẫu 06</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {item.withdrawal?.status === 'DA_PHAT_HANH' && (
                <div className="source-warning case-notice-banner">
                  <div>
                    <b>
                      Đã phát hành Thông báo dừng Mẫu 06 số{' '}
                      <span className="mono-code tabular-nums">{item.withdrawal.noticeNumber}</span>.
                    </b>{' '}
                    Kênh gửi: {formatChannel(item.withdrawal.noticeDelivery?.channel, 'Trực tiếp')} ·{' '}
                    <span className="tabular-nums">{item.withdrawal.noticeDelivery?.reference}</span>
                    {item.withdrawal.returnPaperFollowUp && (
                      <p className="case-notice-subline">
                        <b>Hoàn trả bản giấy gốc:</b>{' '}
                        {item.withdrawal.returnPaperFollowUp === 'DA_HOAN_TRA'
                          ? 'Đã đối chiếu và hoàn trả bản gốc'
                          : item.withdrawal.returnPaperFollowUp === 'CAN_DOI_CHIEU'
                            ? 'Đang chờ xác nhận hoàn trả bản giấy gốc tại quầy'
                            : 'Không phát sinh bản giấy gốc'}
                      </p>
                    )}
                  </div>
                  {noticeDoc?.downloadUrl && (
                    <div className="case-notice-banner__actions">
                      <a
                        className="button secondary compact-btn"
                        href={noticeDoc.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>Tải Mẫu 06 đã ký</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {item.withdrawal?.status === 'KHONG_DU_DIEU_KIEN' && (
                <div className="source-warning">
                  <b>Không phát hành Mẫu 06:</b> {item.withdrawal.ineligibleReason}
                </div>
              )}

              <section className="panel citizen-case-section">
                <div className="case-section-header">
                  <h3>Thông tin chủ hồ sơ &amp; Tiếp nhận</h3>
                  {!splitOpen && <QrCodeBadge code={item.code} size={54} />}
                </div>
                <dl className="hcds-kv-list">
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Chủ hồ sơ</dt>
                    <dd>
                      <b>{item.applicant?.name || '—'}</b>
                      {item.applicant?.citizenId && (
                        <span className="case-kv-sub mono-code tabular-nums">
                          Định danh / MST: {item.applicant.citizenId}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Thông tin liên hệ</dt>
                    <dd>
                      <span className="tabular-nums">
                        {[item.applicant?.phone, item.applicant?.email].filter(Boolean).join(' · ') ||
                          '—'}
                      </span>
                      {item.applicant?.address && (
                        <span className="case-kv-sub">{item.applicant.address}</span>
                      )}
                    </dd>
                  </div>
                  {item.requestSummary && (
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Nội dung yêu cầu</dt>
                      <dd>{item.requestSummary}</dd>
                    </div>
                  )}
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Cơ quan tiếp nhận</dt>
                    <dd>
                      <b>{item.receivingAgency || item.procedure?.agency || '—'}</b>
                    </dd>
                  </div>
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Kênh nộp &amp; Nhận kết quả</dt>
                    <dd>
                      {submissionChannelText} · Nhận: <b>{deliveryMethodText}</b>
                      {item.deliveryAddress ? ` (${item.deliveryAddress})` : ''}
                    </dd>
                  </div>
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Chuyên viên thụ lý</dt>
                    <dd>
                      <b>
                        {item.assignment?.assigneeName ||
                          item.assignment?.assignee ||
                          'Chưa phân công'}
                      </b>
                      {item.assignment?.assignedAt && (
                        <span className="case-kv-sub tabular-nums">
                          Phân công lúc {toDate(item.assignment.assignedAt)}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Thời điểm tiếp nhận</dt>
                    <dd className="tabular-nums">{toDate(item.acceptedAt || item.createdAt)}</dd>
                  </div>
                  <div className="hcds-kv-row hcds-kv-row--two">
                    <dt>Hạn giải quyết theo quy định</dt>
                    <dd className="tabular-nums">
                      <b>{item.deadline ? toDate(item.deadline) : item.deadlineNote || 'Chưa xác định'}</b>
                    </dd>
                  </div>
                </dl>
              </section>

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
                    {item.attachments.map((file, idx) => {
                      const fileUrl = file.downloadUrl || file.url || ''
                      return (
                        <li key={`${file.name}-${idx}`} className="case-attachment-row">
                          <span className="case-attachment-row__name">
                            <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
                            <span>{file.name}</span>
                          </span>
                          <div className="case-attachment-row__actions">
                            {fileUrl && (
                              <button
                                type="button"
                                className="button secondary compact-btn"
                                onClick={() => focusDocInViewer(`att-${idx}`)}
                              >
                                <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                                <span>Đối chiếu</span>
                              </button>
                            )}
                            {fileUrl && (
                              <a
                                href={fileUrl}
                                download={file.name}
                                target="_blank"
                                rel="noreferrer"
                                className="button secondary compact-btn"
                              >
                                <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                                <span>Tải tệp</span>
                              </a>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="muted">Chưa có tệp đính kèm điện tử.</p>
                )}

                {item.paperOriginals && (
                  <div className="case-flat-subsection">
                    <dl className="hcds-kv-list">
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Bản giấy kiểm đếm tại quầy</dt>
                        <dd>{item.paperOriginals}</dd>
                      </div>
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Tình trạng số hóa</dt>
                        <dd>
                          {item.digitization ? (
                            <>
                              Đã số hóa <b className="tabular-nums">{item.digitization.pageCount}</b>{' '}
                              trang · Sổ đăng ký: <b>{item.digitization.documentRegister}</b> · Thực
                              hiện bởi {item.digitization.digitizedBy} (
                              <span className="tabular-nums">
                                {toDate(item.digitization.digitizedAt)}
                              </span>
                              )
                            </>
                          ) : (
                            <span className="muted">Chưa đính kèm bản quét số hóa tại quầy.</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}

                {Object.entries(item.documentExemptions || {}).length > 0 && (
                  <div className="case-flat-subsection">
                    <h4>Giải trình thành phần hồ sơ của người nộp</h4>
                    <dl className="hcds-kv-list">
                      {Object.entries(item.documentExemptions).map(([id, reason]) => (
                        <div className="hcds-kv-row hcds-kv-row--two" key={id}>
                          <dt>
                            {(item.procedure?.submission?.documents || []).find(
                              (doc: { id: string }) => doc.id === id,
                            )?.label || id}
                          </dt>
                          <dd>{String(reason)}</dd>
                        </div>
                      ))}
                    </dl>
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
                        <span className="tabular-nums">
                          {item.workflowGuard.version || 'Mặc định'}
                        </span>
                      </p>
                    </div>
                    {item.workflowGuard.sourceUrl && (
                      <a
                        className="button secondary compact-btn"
                        href={item.workflowGuard.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>Công bố chính thức</span>
                        <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
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
                              {step.description
                                .split(/\n+/)
                                .filter(line => line.trim())
                                .map((line, index) => (
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
                            {String(item.workflowGuard.conditions)
                              .split(/\n+/)
                              .filter(line => line.trim())
                              .map((line, index) => (
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
                  <dl className="hcds-kv-list">
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Kết luận kiểm tra</dt>
                      <dd>
                        <b>{item.workflowEvidence.outcome}</b> ·{' '}
                        <span className="tabular-nums">
                          {toDate(item.workflowEvidence.verifiedAt)}
                        </span>
                      </dd>
                    </div>
                    {item.proposedDecision && (
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Đề xuất trình lãnh đạo</dt>
                        <dd>
                          <StatusTag
                            tone={item.proposedDecision === 'DECLINE' ? 'danger' : 'info'}
                            label={
                              item.proposedDecision === 'DECLINE'
                                ? 'Đề nghị kết luận không giải quyết (Mẫu 03)'
                                : 'Đề nghị phê duyệt giải quyết'
                            }
                          />
                        </dd>
                      </div>
                    )}
                    {(item.workflowEvidence.registerReference ||
                      item.workflowEvidence.dataReference) && (
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Số sổ / Mã tham chiếu dữ liệu</dt>
                        <dd className="mono-code tabular-nums">
                          {item.workflowEvidence.registerReference ||
                            item.workflowEvidence.dataReference}
                        </dd>
                      </div>
                    )}
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Căn cứ thẩm định</dt>
                      <dd>{item.workflowEvidence.verificationBasis}</dd>
                    </div>
                    {item.workflowEvidence.financialAssessment && (
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Xác định nghĩa vụ tài chính</dt>
                        <dd>{item.workflowEvidence.financialAssessment}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {item.milestones?.length > 0 && (
                <section className="panel citizen-case-section">
                  <h3>Mốc xử lý trung gian</h3>
                  <dl className="hcds-kv-list">
                    {item.milestones.map(
                      (milestone: {
                        id: string
                        label: string
                        dueDate: string
                        completedAt?: string
                      }) => (
                        <div className="hcds-kv-row hcds-kv-row--two" key={milestone.id}>
                          <dt>{milestone.label}</dt>
                          <dd className="tabular-nums">
                            Hạn {toDate(milestone.dueDate)} ·{' '}
                            {milestone.completedAt ? (
                              <StatusTag
                                tone="success"
                                label={`Đã thực hiện ${toDate(milestone.completedAt)}`}
                                className="tabular-nums"
                              />
                            ) : (
                              <StatusTag tone="neutral" label="Chưa hoàn tất" />
                            )}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </section>
              )}

              <section className="panel citizen-case-section">
                <h3>Nghĩa vụ tài chính (Phí / Lệ phí)</h3>
                {item.fee?.amount ? (
                  <dl className="hcds-kv-list">
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Số tiền phải nộp</dt>
                      <dd>
                        <b className="tabular-nums">
                          {Number(item.fee.amount).toLocaleString('vi-VN')} đồng
                        </b>
                      </dd>
                    </div>
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Căn cứ thu</dt>
                      <dd>{item.fee.basis}</dd>
                    </div>
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Trạng thái đối soát</dt>
                      <dd>
                        <StatusTag
                          status={item.fee.status}
                          label={feeStatusLabels[item.fee.status] || item.fee.status}
                        />
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="muted">Chưa phát sinh hoặc chưa cấu hình khoản thu trên hồ sơ này.</p>
                )}
              </section>

              <section className="panel citizen-case-section">
                <h3>Dự thảo, Phê duyệt &amp; Phát hành kết quả</h3>
                {item.draftResult ? (
                  <dl className="hcds-kv-list">
                    <div className="hcds-kv-row hcds-kv-row--two">
                      <dt>Dự thảo kết quả giải quyết</dt>
                      <dd className="case-pre-wrap">{item.draftResult}</dd>
                    </div>
                    {item.approvalNote && (
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Ý kiến lãnh đạo phê duyệt</dt>
                        <dd>
                          {item.approvalNote}
                          {item.approvedAt && (
                            <>
                              {' '}
                              (<span className="tabular-nums">{toDate(item.approvedAt)}</span>)
                            </>
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                ) : (
                  <p className="muted">Chưa có nội dung dự thảo kết quả.</p>
                )}

                {item.sandboxSignature && (
                  <div
                    className={`case-inline-alert ${
                      item.sandboxSignature.verified ? 'citizen-success' : 'form-error'
                    }`}
                  >
                    <div>
                      <b>
                        {item.sandboxSignature.verified
                          ? 'Đã ký số nội bộ hợp lệ (Ed25519)'
                          : 'Chữ ký số không hợp lệ'}
                      </b>
                      <p className="case-notice-subline">
                        Người ký: <b>{item.sandboxSignature.signer}</b> ·{' '}
                        <span className="tabular-nums">
                          {toDate(item.sandboxSignature.signedAt)}
                        </span>{' '}
                        · SHA-256:{' '}
                        <code className="mono-code">{item.sandboxSignature.documentHash}</code>
                      </p>
                    </div>
                  </div>
                )}

                {item.status === 'DA_PHE_DUYET' && !item.sandboxSignature && (
                  <div className="source-warning case-inline-alert">
                    <b>Hồ sơ đã phê duyệt, chờ ký số:</b>{' '}
                    {item.approvedAt &&
                    item.approvedById &&
                    String(item.draftResult || '').trim().length >= 10
                      ? 'Lãnh đạo có thẩm quyền ký số có thể thực hiện ký kết quả trước khi văn thư phát hành.'
                      : 'Cần bổ sung đầy đủ dự thảo và thông tin phê duyệt trước khi ký.'}
                  </div>
                )}

                {item.result && (
                  <div className="case-flat-subsection">
                    <dl className="hcds-kv-list">
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Số hiệu văn bản kết quả</dt>
                        <dd>
                          <b className="mono-code tabular-nums">{item.result.number}</b> · Ngày phát
                          hành:{' '}
                          <span className="tabular-nums">
                            {toDate(item.result.issuedAt || item.resultIssuedAt)}
                          </span>
                        </dd>
                      </div>
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Nội dung phát hành</dt>
                        <dd className="case-pre-wrap">{item.result.content}</dd>
                      </div>
                    </dl>
                    {!!item.result.files?.length && (
                      <div className="case-file-actions">
                        {item.result.files.map((file, idx) =>
                          file.downloadUrl ? (
                            <div key={`${file.name}-${idx}`} className="case-attachment-row__actions">
                              <button
                                type="button"
                                className="button secondary compact-btn"
                                onClick={() => focusDocInViewer(`res-file-${idx}`)}
                              >
                                <Eye size={14} strokeWidth={1.75} aria-hidden="true" />
                                <span>Đối chiếu: {file.name}</span>
                              </button>
                              <a
                                className="button secondary compact-btn"
                                href={file.downloadUrl}
                                download={file.name}
                              >
                                <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                                <span>Tải kết quả: {file.name}</span>
                              </a>
                            </div>
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                )}

                {item.delivery && (
                  <div className="case-flat-subsection">
                    <dl className="hcds-kv-list">
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Người nhận &amp; Kênh trả</dt>
                        <dd>
                          <b>{item.delivery.receiver}</b> ·{' '}
                          {formatChannel(item.delivery.channel, item.delivery.channel)}
                        </dd>
                      </div>
                      <div className="hcds-kv-row hcds-kv-row--two">
                        <dt>Biên nhận / Chứng cứ giao</dt>
                        <dd>
                          <span className="mono-code tabular-nums">{item.delivery.evidence}</span> ·
                          Thời gian:{' '}
                          <span className="tabular-nums">
                            {toDate(item.delivery.deliveredAt || item.delivery.at)}
                          </span>
                        </dd>
                      </div>
                    </dl>
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
                <h3>
                  Nhật ký kiểm toán hồ sơ (
                  <span className="tabular-nums">{item.events?.length || 0}</span> mốc sự kiện)
                </h3>
                <span className="section-head-note">
                  Toàn bộ diễn tiến xử lý có truy vết thời gian thực từ tiếp nhận đến khi trả kết quả
                </span>
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
                            <span className="timeline-time-badge tabular-nums">
                              {toDate(event.at)}
                            </span>
                            {isStaff && event.actor && (
                              <span className="timeline-actor-pill">
                                {event.actor}
                                {event.role ? ` (${roleNames[event.role] || event.role})` : ''}
                              </span>
                            )}
                            {isStaff && event.audience === 'internal' && (
                              <StatusTag tone="warning" label="Nội bộ" />
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
                <div className="case-flat-subsection">
                  <h4>Tài liệu yêu cầu dừng hồ sơ đính kèm</h4>
                  <ul className="dossier-attachment-list">
                    {item.withdrawal.requestDocuments.map(
                      (file: { name: string; downloadUrl: string }) => (
                        <li key={file.name} className="case-attachment-row">
                          <span className="case-attachment-row__name">
                            <FileText size={15} strokeWidth={1.75} aria-hidden="true" />
                            <span>{file.name}</span>
                          </span>
                          <a
                            className="button secondary compact-btn"
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                            <span>Tải tài liệu</span>
                          </a>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </section>
          )}

          {actionOptions.length > 0 && (
            <div className="sticky-decision-bar" role="region" aria-label="Thanh quyết định xử lý hồ sơ">
              <div className="sticky-decision-bar__meta">
                <strong className="sticky-decision-bar__title">
                  {isStaff ? 'Xử lý nghiệp vụ hồ sơ' : 'Gửi bổ sung hồ sơ'}
                  {pendingNotice ? ' · Chờ xử lý yêu cầu dừng' : ''}
                </strong>
                {item.workflowGuard?.message && (
                  <span className="sticky-decision-bar__hint">{item.workflowGuard.message}</span>
                )}
              </div>

              <div className="sticky-decision-bar__actions">
                {primaryActions.map((opt, idx) => {
                  const isDanger = DESTRUCTIVE_WORKFLOW_ACTIONS.has(opt.value)
                  const btnClass = isDanger
                    ? 'button warning compact-btn'
                    : idx === 0
                      ? 'button primary compact-btn'
                      : 'button secondary compact-btn'
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={btnClass}
                      disabled={busy}
                      onClick={() => openActionWithValue(opt.value)}
                    >
                      {opt.value === 'sign_result' ? (
                        <FileSignature size={15} strokeWidth={1.75} aria-hidden="true" />
                      ) : (
                        <Play size={14} strokeWidth={1.75} aria-hidden="true" />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  )
                })}

                {secondaryActions.length > 0 && (
                  <details
                    ref={moreActionsRef}
                    className="report-export-menu case-actions-menu"
                    onKeyDown={event => {
                      if (event.key === 'Escape' && moreActionsRef.current?.open) {
                        moreActionsRef.current.open = false
                        moreActionsRef.current.querySelector('summary')?.focus()
                      }
                    }}
                  >
                    <summary className="button secondary compact-btn">
                      <MoreHorizontal size={15} strokeWidth={1.75} aria-hidden="true" />
                      <span>
                        Nghiệp vụ khác (<b className="tabular-nums">{secondaryActions.length}</b>)
                      </span>
                      <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
                    </summary>
                    <div className="report-export-options case-actions-menu__options">
                      {secondaryActions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={
                            DESTRUCTIVE_WORKFLOW_ACTIONS.has(opt.value)
                              ? 'case-actions-menu__danger'
                              : undefined
                          }
                          onClick={() => openActionWithValue(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {splitOpen && (
          <div className="workstation-right-pane" ref={viewerPaneRef}>
            <SplitDossierViewer
              item={item}
              defaultSlip={
                pendingNotice || canPrintMau06
                  ? 'MAU_06'
                  : canPrintMau04
                    ? 'MAU_04'
                    : canPrintMau02
                      ? 'MAU_02'
                      : canPrintMau03
                        ? 'MAU_03'
                        : 'MAU_01'
              }
            />
            <div className="panel case-qr-strip">
              <QrCodeBadge code={item.code} size={56} />
            </div>
          </div>
        )}
      </div>

      <SideDrawer
        open={drawerOpen && actionOptions.length > 0}
        title={
          selectedActionOption?.label ||
          (isStaff ? 'Xử lý nghiệp vụ hồ sơ' : 'Gửi bổ sung hồ sơ')
        }
        subtitle={`Hồ sơ ${item.code} · ${statusLabel}`}
        onClose={closeActionDrawer}
      >
        <form className="form-stack" onSubmit={onSubmitAction}>
          <label>
            <span>Nghiệp vụ thực hiện</span>
            <select
              value={action}
              onChange={e => {
                const next = e.target.value
                setAction(next)
                setActionText(
                  ['save_draft', 'submit_review'].includes(next) ? item.draftResult || '' : '',
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

          {item.workflowGuard?.message && (
            <p className="action-guard-hint case-reset-margin">{item.workflowGuard.message}</p>
          )}

          {action === 'send_back' && item.sandboxSignature?.verified && (
            <p className="source-warning small-warning case-reset-margin">
              Lưu ý: Trả lại hồ sơ đã ký sẽ thu hồi chữ ký số hiện tại để chuyên viên/lãnh đạo chỉnh sửa và ký lại.
            </p>
          )}

          {action === 'submit_review' && isNegativeVerification && (
            <p className="source-warning small-warning case-reset-margin">
              Kết quả kiểm tra chuyên ngành đang ở trạng thái không đủ điều kiện: trình duyệt sẽ đề xuất Lãnh đạo ban hành kết luận không giải quyết (Mẫu 03).
            </p>
          )}

          {action === 'assign' && (
            <label>
              <span>Chuyên viên được phân công</span>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} required>
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
                className="tabular-nums"
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
              <input
                name="pageCount"
                className="tabular-nums"
                type="number"
                min="1"
                max="500"
                required
              />
            </label>
          )}

          {action === 'set_fee' && (
            <label>
              <span>Số tiền (đồng)</span>
              <input
                name="feeAmount"
                className="tabular-nums"
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
                      ? 'Nội dung cần bổ sung (mỗi ý một dòng, nêu rõ căn cứ — Mẫu 02)'
                      : action === 'prepare_stop_notice'
                        ? 'Lý do đề nghị dừng (Mẫu 05 / Mẫu 06)'
                        : action === 'digitize_documents'
                          ? 'Danh mục giấy tờ đối chiếu với bản gốc'
                          : action === 'set_fee'
                            ? 'Căn cứ và nguồn xác định khoản thu'
                            : action === 'extend_deadline'
                              ? 'Lý do chậm trễ và nội dung xin lỗi công dân (Mẫu 04)'
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
            <p className="source-warning small-warning case-reset-margin">
              Tạo chữ ký số nội bộ Ed25519 gắn với mã băm SHA-256 của nội dung dự thảo đã phê duyệt.
            </p>
          )}

          {action === 'issue' && (
            <label>
              <span>Số hiệu văn bản kết quả</span>
              <input
                name="resultNumber"
                className="mono-code tabular-nums"
                required
                minLength={3}
                maxLength={100}
                placeholder="QD-2026-001"
              />
            </label>
          )}

          {action === 'deliver' && (
            <div className="form-grid">
              <label className="span-two">
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
                <span>Kênh trả kết quả</span>
                <select name="deliveryChannel" required defaultValue="">
                  <option value="" disabled>
                    Chọn kênh trả
                  </option>
                  <option value="TRUC_TIEP">{channelNames.TRUC_TIEP}</option>
                  <option value="BUU_CHINH">{channelNames.BUU_CHINH}</option>
                  <option value="DIEN_TU_SANDBOX">{channelNames.DIEN_TU_SANDBOX}</option>
                </select>
              </label>
              <label>
                <span>Mã biên nhận / chứng cứ giao</span>
                <input
                  name="deliveryEvidence"
                  className="mono-code tabular-nums"
                  required
                  minLength={3}
                  maxLength={180}
                />
              </label>
            </div>
          )}

          {action === 'prepare_stop_notice' && (
            <div className="form-grid">
              <label>
                <span>Kênh nhận yêu cầu</span>
                <select name="stopChannel" required defaultValue="">
                  <option value="" disabled>
                    Chọn kênh
                  </option>
                  <option value="TRUC_TIEP">{channelNames.TRUC_TIEP}</option>
                  <option value="BUU_CHINH">{channelNames.BUU_CHINH}</option>
                </select>
              </label>
              <label>
                <span>Chủ thể yêu cầu</span>
                <select name="requesterType" required defaultValue="">
                  <option value="" disabled>
                    Chọn chủ thể
                  </option>
                  <option value="SELF">Chủ thể hồ sơ</option>
                  <option value="REPRESENTATIVE">Người đại diện hợp pháp</option>
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
                <span>Số định danh cá nhân / mã số tổ chức</span>
                <input
                  name="requesterIdentifier"
                  className="mono-code tabular-nums"
                  maxLength={80}
                  minLength={3}
                  defaultValue={item.applicant?.citizenId || ''}
                  required
                />
              </label>
              <label className="span-two">
                <span>Địa chỉ người yêu cầu</span>
                <input
                  name="requesterAddress"
                  maxLength={300}
                  minLength={3}
                  defaultValue={item.applicant?.address || ''}
                  required
                />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input
                  name="requesterPhone"
                  className="tabular-nums"
                  type="tel"
                  maxLength={40}
                  defaultValue={item.applicant?.phone || ''}
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  name="requesterEmail"
                  type="email"
                  maxLength={254}
                  defaultValue={item.applicant?.email || ''}
                />
              </label>
              <label className="span-two">
                <span>Mã biên nhận trực tiếp hoặc mã bưu gửi</span>
                <input
                  name="requestReference"
                  className="mono-code tabular-nums"
                  maxLength={120}
                  placeholder="Bắt buộc nếu nhận qua bưu chính"
                />
              </label>
              <label className="check-row span-two">
                <input name="identityVerified" type="checkbox" required />
                <span>Đã đối chiếu danh tính người yêu cầu hợp lệ</span>
              </label>
              <label className="check-row span-two">
                <input name="authorizationVerified" type="checkbox" />
                <span>
                  Nếu là người đại diện: đã đối chiếu giấy tờ chứng minh căn cứ đại diện hợp pháp
                </span>
              </label>
              <label className="span-two">
                <span>Văn bản yêu cầu dừng đã ký (PDF, PNG hoặc JPG)</span>
                <input
                  name="supportingFiles"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  required
                  multiple
                />
              </label>
            </div>
          )}

          {action === 'issue_stop_notice' && (
            <div className="form-grid">
              <p className="source-warning small-warning span-two case-reset-margin">
                Quyền ký được cấp theo văn bản <b>{signingAuthorityRef}</b>. Chỉ ghi nhận phát hành sau khi Mẫu 06 đã được ký hợp lệ.
              </p>
              <label className="span-two">
                <span>Tên cấp tỉnh / Bộ, ngành / cấp xã ghi ở đầu biểu mẫu</span>
                <input
                  name="authorityName"
                  maxLength={180}
                  minLength={2}
                  value={noticeHeader.authorityName}
                  onChange={e => updateNoticeHeader('authorityName', e.target.value)}
                  required
                />
              </label>
              <label className="span-two">
                <span>Tên Trung tâm / Bộ phận Tiếp nhận và Trả kết quả</span>
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
                  className="tabular-nums"
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
                  className="mono-code tabular-nums"
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
                  <option value="TRUC_TIEP">{channelNames.TRUC_TIEP}</option>
                  <option value="BUU_CHINH">{channelNames.BUU_CHINH}</option>
                </select>
              </label>
              <label className="span-two">
                <span>Biên nhận giao hoặc mã bưu gửi</span>
                <input
                  name="deliveryReference"
                  className="mono-code tabular-nums"
                  maxLength={150}
                  minLength={3}
                  required
                />
              </label>
              <label className="span-two">
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
              <label className="check-row span-two">
                <input name="signatureAttested" type="checkbox" required />
                <span>Tôi xác nhận bản Mẫu 06 đính kèm đã được người có thẩm quyền ký</span>
              </label>
              <label className="span-two">
                <span>Bản Thông báo dừng Mẫu 06 đã ký (PDF, PNG hoặc JPG)</span>
                <input
                  name="supportingFiles"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  required
                />
              </label>
            </div>
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
            <div className="form-actions case-drawer-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={closeActionDrawer}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className={`button ${
                  DESTRUCTIVE_WORKFLOW_ACTIONS.has(action) ? 'warning' : 'primary'
                }`}
                disabled={busy}
              >
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
      </SideDrawer>
    </div>
  )
}
