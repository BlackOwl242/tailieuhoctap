import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck2,
  Info,
  OctagonAlert,
  ShieldCheck,
} from 'lucide-react'
import { CLOSED_STATUSES, daysUntil, dueText } from '../portalUtils'
import type { CaseFile } from '../types'

export type SemanticTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger'

function statusTone(status?: string): SemanticTone {
  const code = (status || '').toUpperCase()
  if (
    code === 'HOAN_THANH' ||
    code === 'DA_TRA_KET_QUA' ||
    code === 'DA_PHAT_HANH' ||
    code === 'DA_PHE_DUYET' ||
    code === 'APPROVED' ||
    code === 'RECONCILED' ||
    code === 'ACTIVE' ||
    code === 'PUBLISHED'
  ) {
    return 'success'
  }
  if (
    code === 'TU_CHOI' ||
    code === 'KHONG_GIAI_QUYET' ||
    code === 'REJECTED' ||
    code === 'FAILED' ||
    code === 'REVOKED' ||
    code === 'OVERDUE'
  ) {
    return 'danger'
  }
  if (
    code === 'CHO_BO_SUNG' ||
    code === 'CHO_TIEP_NHAN' ||
    code === 'DUNG' ||
    code === 'PENDING' ||
    code === 'DUE' ||
    code === 'PAID'
  ) {
    return 'warning'
  }
  if (
    code === 'DA_TIEP_NHAN' ||
    code === 'DANG_THU_LY' ||
    code === 'CHO_PHE_DUYET' ||
    code === 'PROCESSING'
  ) {
    return 'info'
  }
  return 'neutral'
}

export function StatusTag({
  status,
  label,
  tone,
  className = '',
}: {
  status?: string
  label: string
  tone?: SemanticTone
  className?: string
}) {
  const resolved = tone || statusTone(status)
  return (
    <span className={`hcds-tag hcds-tag--${resolved} ${className}`.trim()}>
      {label}
    </span>
  )
}

export function SLABadge({ item }: { item: CaseFile }) {
  const text = dueText(item)
  if (CLOSED_STATUSES.has(item.status)) {
    return (
      <span className="hcds-sla-badge hcds-sla-badge--closed">
        <CheckCircle2 size={13} strokeWidth={2} aria-hidden="true" />
        <span>{text}</span>
      </span>
    )
  }

  const days = daysUntil(item.deadline)
  if (days !== null && days < 0) {
    return (
      <span className="hcds-sla-badge hcds-sla-badge--breach">
        <OctagonAlert size={13} strokeWidth={2} aria-hidden="true" />
        <span>{text}</span>
      </span>
    )
  }
  if (days !== null && days <= 3) {
    return (
      <span className="hcds-sla-badge hcds-sla-badge--risk">
        <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
        <span>{text}</span>
      </span>
    )
  }
  return (
    <span className="hcds-sla-badge hcds-sla-badge--ok">
      <Clock size={13} strokeWidth={2} aria-hidden="true" />
      <span>{text}</span>
    </span>
  )
}

export function ServiceLevelBadge({
  level,
  serviceMode,
}: {
  level?: string
  serviceMode?: string
}) {
  const raw = `${level || ''} ${serviceMode || ''}`.toLowerCase()
  if (raw.includes('toàn trình') || raw.includes('full')) {
    return (
      <span
        className="hcds-service-badge hcds-service-badge--full"
        title="Nộp hồ sơ, thanh toán và nhận kết quả 100% trực tuyến"
      >
        <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" />
        <span>Trực tuyến toàn trình</span>
      </span>
    )
  }
  if (raw.includes('một phần') || raw.includes('partial')) {
    return (
      <span
        className="hcds-service-badge hcds-service-badge--partial"
        title="Nộp hồ sơ trực tuyến; đối chiếu bản chính hoặc nhận kết quả theo quy định"
      >
        <FileCheck2 size={13} strokeWidth={2} aria-hidden="true" />
        <span>Trực tuyến một phần</span>
      </span>
    )
  }
  return (
    <span className="hcds-service-badge hcds-service-badge--info">
      <Info size={13} strokeWidth={2} aria-hidden="true" />
      <span>Cung cấp thông tin</span>
    </span>
  )
}
