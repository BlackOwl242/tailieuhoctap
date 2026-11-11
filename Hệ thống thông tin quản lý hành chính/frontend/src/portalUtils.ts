import type { KeyboardEvent } from 'react'
import {
  CITIZEN_UPLOAD_MAX_FILES,
  CITIZEN_UPLOAD_MAX_FILE_BYTES,
  CITIZEN_UPLOAD_MAX_TOTAL_BYTES,
  type CaseFile,
  type Index766Summary,
  type PeriodBalanceSummary,
  type Procedure,
  type User,
} from './types'

let staffCsrfToken = ''
let citizenCsrfToken = ''
let staffAuthenticated = false

export function setStaffSessionToken(token: string, active: boolean): void {
  staffCsrfToken = token
  staffAuthenticated = active
}

export function setCitizenSessionToken(token: string): void {
  citizenCsrfToken = token
}

export function isAbortError(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === 'AbortError'
}

export async function api<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const isCitizenOrPublic =
    path.startsWith('/api/citizen/') || path.startsWith('/api/public/') || path === '/api/cases'
  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    const token = isCitizenOrPublic ? citizenCsrfToken : staffCsrfToken
    if (token) headers['X-CSRF-Token'] = token
  }

  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) {
      if (isCitizenOrPublic) {
        window.dispatchEvent(new Event('citizen-session-expired'))
      } else if (staffAuthenticated && path !== '/api/auth/login') {
        window.dispatchEvent(new Event('staff-session-expired'))
      }
    }
    throw new Error(result.error || `Yêu cầu thất bại (${response.status}).`)
  }
  return result as T
}

export const roleNames: Record<string, string> = {
  intake: 'Cán bộ tiếp nhận',
  specialist: 'Chuyên viên thụ lý',
  leader: 'Lãnh đạo phê duyệt',
  registrar: 'Văn thư phát hành',
  finance: 'Tài chính',
  admin: 'Quản trị hệ thống',
}

export const channelNames: Record<string, string> = {
  TRUC_TIEP: 'Trực tiếp tại Bộ phận Một cửa',
  BUU_CHINH: 'Qua dịch vụ bưu chính',
  DIEN_TU_SANDBOX: 'Bản điện tử trên Cổng Dịch vụ công',
  TRUC_TUYEN: 'Trực tuyến trên Cổng Dịch vụ công',
}

export const feeStatusLabels: Record<string, string> = {
  DUE: 'Chờ người nộp khai đã thanh toán',
  PAID: 'Đã khai thanh toán · chờ kế toán đối chiếu chứng từ',
  RECONCILED: 'Đã đối chiếu chứng từ trong hệ thống',
  WAIVED: 'Đã miễn thu phí, lệ phí',
  REFUNDED: 'Đã ghi nhận hoàn trả',
}

export const CLOSED_STATUSES = new Set([
  'HOAN_THANH',
  'TU_CHOI',
  'KHONG_GIAI_QUYET',
  'DUNG',
])

export function toDate(value?: string): string {
  if (!value) return 'Chưa xác định'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined,
  }).format(parsed)
}

export function hanoiDate(value?: string): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(parsed)
}

export function daysUntil(value?: string): number | null {
  const day = hanoiDate(value)
  if (!day) return null
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
    new Date(),
  )
  return Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
}

export function dueText(item: CaseFile): string {
  if (CLOSED_STATUSES.has(item.status)) return 'Đã kết thúc'
  const days = daysUntil(item.deadline)
  if (days === null) return item.deadlineNote || 'Chưa xác định hạn'
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`
  if (days === 0) return 'Đến hạn hôm nay'
  if (days <= 3) return `Còn ${days} ngày`
  return `Hạn ${toDate(item.deadline)}`
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const cell = (value: string) => {
    let safe = String(value ?? '')
    if (/^[\s]*[=+\-@]/.test(safe)) safe = `'${safe}`
    return `"${safe.replace(/"/g, '""')}"`
  }
  const content =
    '\ufeff' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function encodeFile(file: File): Promise<{ name: string; type: string; data: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return { name: file.name, type: file.type, data: btoa(binary) }
}

export function validateCitizenFiles(files: File[]): string {
  if (files.length > CITIZEN_UPLOAD_MAX_FILES) {
    return `Mỗi lần gửi nhận tối đa ${CITIZEN_UPLOAD_MAX_FILES} tệp.`
  }
  if (files.some(file => file.size > CITIZEN_UPLOAD_MAX_FILE_BYTES)) {
    return 'Mỗi tệp không được vượt quá 8 MB.'
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > CITIZEN_UPLOAD_MAX_TOTAL_BYTES) {
    return 'Tổng dung lượng tệp một lần gửi không được vượt quá 9 MB.'
  }
  return ''
}

export function reportDateDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ''
}

export function parseReportDate(value: string): string | null {
  const text = value.trim()
  if (!text) return ''
  const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(text)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const dateValue = new Date(Date.UTC(year, month - 1, day))
  if (
    dateValue.getUTCFullYear() !== year ||
    dateValue.getUTCMonth() !== month - 1 ||
    dateValue.getUTCDate() !== day
  ) {
    return null
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

export function handleTabArrows<T extends string>(
  event: KeyboardEvent<HTMLDivElement>,
  tabs: T[],
  current: T,
  onSelect: (next: T) => void,
): void {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const index = tabs.indexOf(current)
  if (index === -1 || tabs.length < 2) return
  event.preventDefault()
  const delta = event.key === 'ArrowRight' ? 1 : -1
  const nextIndex = (index + delta + tabs.length) % tabs.length
  onSelect(tabs[nextIndex])
  const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  buttons[nextIndex]?.focus()
}


export type ResolvedIndex766 = {
  transparency: number
  progress: number
  onlineService: number
  digitization: number
  satisfaction: number
  total: number
  classification: string
}

export type ResolvedPeriodBalance = {
  opening: number
  received: number
  resolvedOnTime: number
  resolvedOverdue: number
  stoppedOrRejected: number
  closing: number
}

function clampScore(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(Math.max(0, Math.min(max, value)) * 10) / 10
}

function classifyTotal(total: number): string {
  if (total >= 90) return 'Xuất sắc'
  if (total >= 80) return 'Tốt'
  if (total >= 70) return 'Khá'
  if (total >= 50) return 'Trung bình'
  return 'Cần cải thiện'
}

export function computeIndex766(
  cases: CaseFile[],
  procedures: Procedure[],
  feedback: { score: number }[] = [],
  backend?: Index766Summary | null,
): ResolvedIndex766 {
  const backendOnline = backend?.onlineAndPayment ?? backend?.onlineService
  const backendTotal = backend?.totalScore ?? backend?.total
  if (
    backend &&
    typeof backend.transparency === 'number' &&
    typeof backend.progress === 'number' &&
    typeof backendOnline === 'number' &&
    typeof backend.digitization === 'number' &&
    typeof backend.satisfaction === 'number'
  ) {
    const transparency = clampScore(backend.transparency, 18)
    const progress = clampScore(backend.progress, 20)
    const onlineService = clampScore(backendOnline, 22)
    const digitization = clampScore(backend.digitization, 22)
    const satisfaction = clampScore(backend.satisfaction, 18)
    const total =
      typeof backendTotal === 'number'
        ? clampScore(backendTotal, 100)
        : Math.round((transparency + progress + onlineService + digitization + satisfaction) * 10) /
          10
    return {
      transparency,
      progress,
      onlineService,
      digitization,
      satisfaction,
      total,
      classification: backend.classification || classifyTotal(total),
    }
  }

  const publishedRatio = procedures.length
    ? procedures.filter(item => Boolean(item.field && item.agency && item.level)).length /
      procedures.length
    : 0.95
  const transparency = clampScore(publishedRatio * 18, 18)

  const trackedCases = cases.length || 1
  const overdueCount = cases.filter(item => {
    if (CLOSED_STATUSES.has(item.status)) {
      const due = item.deadline ? Date.parse(item.deadline) : NaN
      const end = Date.parse(item.resultIssuedAt || item.updatedAt || item.createdAt)
      return Number.isFinite(due) && Number.isFinite(end) && end > due + 86400000
    }
    const remaining = daysUntil(item.deadline)
    return remaining !== null && remaining < 0
  }).length
  const onTimeRatio = Math.max(0, (trackedCases - overdueCount) / trackedCases)
  const progress = clampScore(onTimeRatio * 20, 20)

  const onlineCases = cases.filter(item => item.submissionChannel !== 'TRUC_TIEP').length
  const feeCases = cases.filter(item => typeof item.fee?.amount === 'number' && item.fee.amount > 0)
  const settledFees = feeCases.filter(item =>
    ['PAID', 'RECONCILED', 'WAIVED'].includes(item.fee?.status),
  ).length
  const onlineRatio = cases.length ? onlineCases / cases.length : 0.8
  const feeRatio = feeCases.length ? settledFees / feeCases.length : 0.9
  const onlineService = clampScore(onlineRatio * 12 + feeRatio * 10, 22)

  const digitizedCases = cases.filter(
    item =>
      (item.attachments && item.attachments.length > 0) ||
      Boolean(item.digitization) ||
      Boolean(item.result) ||
      Boolean(item.sandboxSignature?.verified),
  ).length
  const digitRatio = cases.length ? digitizedCases / cases.length : 0.85
  const digitization = clampScore(digitRatio * 22, 22)

  const avgFeedback = feedback.length
    ? feedback.reduce((sum, item) => sum + Number(item.score || 0), 0) / feedback.length
    : 4.7
  const satisfaction = clampScore((avgFeedback / 5) * 18, 18)

  const total =
    Math.round((transparency + progress + onlineService + digitization + satisfaction) * 10) / 10
  return {
    transparency,
    progress,
    onlineService,
    digitization,
    satisfaction,
    total,
    classification: classifyTotal(total),
  }
}

export function computePeriodBalance(
  cases: CaseFile[],
  from?: string,
  to?: string,
  backend?: PeriodBalanceSummary | null,
): ResolvedPeriodBalance {
  const backendOpening = backend?.openingBacklog ?? backend?.opening
  const backendReceived = backend?.receivedInPeriod ?? backend?.received
  const backendClosing = backend?.closingBacklog ?? backend?.closing
  if (
    backend &&
    typeof backendOpening === 'number' &&
    typeof backendReceived === 'number' &&
    typeof backend.resolvedOnTime === 'number' &&
    typeof backend.resolvedOverdue === 'number' &&
    typeof backendClosing === 'number'
  ) {
    return {
      opening: backendOpening,
      received: backendReceived,
      resolvedOnTime: backend.resolvedOnTime,
      resolvedOverdue: backend.resolvedOverdue,
      stoppedOrRejected: backend.stoppedOrRejected ?? 0,
      closing: backendClosing,
    }
  }

  let opening = 0
  let received = 0
  let resolvedOnTime = 0
  let resolvedOverdue = 0
  let stoppedOrRejected = 0
  let closing = 0

  for (const item of cases) {
    const createdDay = hanoiDate(item.createdAt)
    const updatedDay = hanoiDate(item.resultIssuedAt || item.updatedAt || item.createdAt)
    const createdBeforeFrom = Boolean(from && createdDay && createdDay < from)
    const createdAfterTo = Boolean(to && createdDay && createdDay > to)
    if (createdAfterTo) continue

    if (createdBeforeFrom) {
      const closedBeforeFrom =
        CLOSED_STATUSES.has(item.status) && Boolean(from && updatedDay < from)
      if (!closedBeforeFrom) opening++
    } else {
      received++
    }

    const closedInOrBeforeTo =
      CLOSED_STATUSES.has(item.status) && (!to || !updatedDay || updatedDay <= to)
    const closedBeforePeriod =
      CLOSED_STATUSES.has(item.status) && Boolean(from && updatedDay && updatedDay < from)

    if (closedBeforePeriod) continue

    if (closedInOrBeforeTo) {
      if (['DUNG', 'TU_CHOI', 'KHONG_GIAI_QUYET'].includes(item.status)) {
        stoppedOrRejected++
      } else {
        const due = item.deadline ? hanoiDate(item.deadline) : ''
        if (due && updatedDay && updatedDay > due) resolvedOverdue++
        else resolvedOnTime++
      }
    } else {
      closing++
    }
  }

  return {
    opening,
    received,
    resolvedOnTime,
    resolvedOverdue,
    stoppedOrRejected,
    closing,
  }
}

export function getActions(user: User, item: CaseFile): { value: string; label: string }[] {
  const { role, maySignStop } = user
  const status = item.status
  if (role === 'admin') return []

  if (item.withdrawal?.status === 'CHO_KY_PHAT_HANH') {
    if (role !== 'leader') return []
    const stopOptions: { value: string; label: string }[] = []
    if (maySignStop) {
      stopOptions.push({
        value: 'issue_stop_notice',
        label: 'Ghi nhận phát hành Thông báo dừng Mẫu 06',
      })
    }
    stopOptions.push({
      value: 'reject_stop_notice',
      label: 'Từ chối yêu cầu dừng, tiếp tục thụ lý',
    })
    return stopOptions
  }

  const all: Record<string, { value: string; label: string }[]> = {
    CHO_TIEP_NHAN: [
      { value: 'accept', label: 'Tiếp nhận hồ sơ' },
      { value: 'request_supplement', label: 'Yêu cầu bổ sung (Mẫu 02)' },
      { value: 'reject_intake', label: 'Từ chối tiếp nhận (Mẫu 03)' },
    ],
    DA_TIEP_NHAN: [
      { value: 'assign', label: 'Điều chuyển / Phân công chuyên viên' },
      { value: 'request_supplement', label: 'Yêu cầu bổ sung (Mẫu 02)' },
    ],
    DANG_THU_LY: [
      { value: 'save_draft', label: 'Lưu dự thảo' },
      { value: 'submit_review', label: 'Trình phê duyệt' },
      { value: 'assign', label: 'Điều chuyển / Phân công chuyên viên' },
      { value: 'return_to_intake', label: 'Trả lại Một cửa kiểm tra lại' },
      { value: 'request_supplement', label: 'Yêu cầu bổ sung (Mẫu 02)' },
    ],
    TRINH_DUYET: [
      { value: 'approve', label: 'Phê duyệt dự thảo' },
      { value: 'send_back', label: 'Yêu cầu chỉnh sửa' },
      { value: 'decline', label: 'Kết luận không giải quyết (Mẫu 03)' },
    ],
    DA_PHE_DUYET: [
      { value: 'sign_result', label: 'Ký số kết quả' },
      { value: 'issue', label: 'Phát hành kết quả' },
      { value: 'return_to_leader', label: 'Trả lại Lãnh đạo chỉnh sửa thể thức' },
    ],
    DA_PHAT_HANH: [{ value: 'deliver', label: 'Ghi nhận trả kết quả' }],
    CHO_BO_SUNG: [
      { value: 'submit_supplement', label: 'Gửi bổ sung' },
      { value: 'close_expired_supplement', label: 'Đóng hồ sơ quá hạn bổ sung' },
    ],
  }

  const permitted: Record<string, string[]> = {
    intake: [
      'accept',
      'request_supplement',
      'reject_intake',
      'assign',
      'prepare_stop_notice',
      'set_fee',
      'digitize_documents',
      'deliver',
      'submit_supplement',
      'close_expired_supplement',
      'confirm_paper_returned',
    ],
    specialist: [
      'save_draft',
      'submit_review',
      'request_supplement',
      'set_fee',
      'return_to_intake',
      'extend_deadline',
      'verify_original_register',
      'assess_data_request',
      'verify_published_procedure',
    ],
    leader: [
      'assign',
      'approve',
      'send_back',
      'decline',
      'waive_fee',
      'sign_result',
      'extend_deadline',
      'close_expired_supplement',
      'issue_stop_notice',
      'reject_stop_notice',
    ],
    registrar: ['issue', 'deliver', 'return_to_leader', 'confirm_paper_returned'],
    finance: [],
  }

  const options = [...(all[status] || [])]

  if (role === 'specialist' && status === 'DANG_THU_LY' && item.workflowGuard?.verificationAction) {
    options.unshift({
      value: item.workflowGuard.verificationAction,
      label: item.workflowGuard.verificationLabel,
    })
  }

  if (role === 'leader' && status === 'DA_PHE_DUYET') {
    options.push({
      value: 'send_back',
      label: item.sandboxSignature?.verified
        ? 'Trả lại để chỉnh sửa (thu hồi chữ ký số)'
        : 'Trả lại để kiểm tra, trình duyệt lại',
    })
  }

  if (
    ['intake', 'specialist'].includes(role) &&
    ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(status) &&
    !item.fee?.amount
  ) {
    options.push({ value: 'set_fee', label: 'Ấn định nghĩa vụ tài chính' })
  }

  if (
    role === 'intake' &&
    item.submissionChannel === 'TRUC_TIEP' &&
    ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(status)
  ) {
    options.push({ value: 'digitize_documents', label: 'Bổ sung bản quét tại quầy' })
  }

  if (
    role === 'leader' &&
    ['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET'].includes(status) &&
    item.fee?.status === 'DUE'
  ) {
    options.push({ value: 'waive_fee', label: 'Ghi nhận miễn khoản thu' })
  }

  if (
    ['leader', 'specialist'].includes(role) &&
    ['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET'].includes(status) &&
    !item.forms?.mau04
  ) {
    options.push({
      value: 'extend_deadline',
      label: 'Ban hành Phiếu xin lỗi & gia hạn Mẫu 04',
    })
  }

  const resume = item.supplement?.resumeStatus
  const eligibleSupplement =
    status === 'CHO_BO_SUNG' && !!resume && ['DA_TIEP_NHAN', 'DANG_THU_LY'].includes(resume)

  if (
    role === 'intake' &&
    !!item.acceptedAt &&
    (['DA_TIEP_NHAN', 'DANG_THU_LY', 'TRINH_DUYET', 'DA_PHE_DUYET'].includes(status) ||
      eligibleSupplement)
  ) {
    if (
      !item.withdrawal?.status &&
      !item.resultIssuedAt &&
      !item.decisionIssuedAt &&
      !item.resultNoticeIssuedAt
    ) {
      options.push({ value: 'prepare_stop_notice', label: 'Tiếp nhận yêu cầu dừng · lập Mẫu 06' })
    }
  }

  if (
    ['intake', 'registrar'].includes(role) &&
    (item.withdrawal?.returnPaperFollowUp === 'CAN_DOI_CHIEU' ||
      item.withdrawal?.returnPaperFollowUp?.status === 'CAN_DOI_CHIEU')
  ) {
    options.push({
      value: 'confirm_paper_returned',
      label: 'Xác nhận đã hoàn trả bản giấy gốc',
    })
  }

  const seen = new Set<string>()
  return options.filter(option => {
    if (seen.has(option.value)) return false
    const allowedForRole =
      permitted[role]?.includes(option.value) ||
      (role === 'specialist' && option.value === item.workflowGuard?.verificationAction)
    if (!allowedForRole) return false

    if (option.value === 'approve' && item.proposedDecision === 'DECLINE') {
      return false
    }

    if (
      option.value === 'sign_result' &&
      (!user.maySignSandbox ||
        !item.approvedAt ||
        !item.approvedById ||
        String(item.draftResult || '').trim().length < 10)
    ) {
      return false
    }

    if (option.value === 'issue' && !item.sandboxSignature?.verified) {
      return false
    }

    if (
      option.value === 'submit_review' &&
      Boolean(item.workflowGuard?.verificationAction) &&
      !item.workflowEvidence
    ) {
      return false
    }

    seen.add(option.value)
    return true
  })
}
