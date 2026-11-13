import { ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { PanelHeading, StatusTag, type SemanticTone } from './design-system'
import type { ResolvedIndex766, ResolvedPeriodBalance } from './portalUtils'

export type Index766PillarKey = keyof Omit<ResolvedIndex766, 'total' | 'classification'>

const PILLARS: {
  key: Index766PillarKey
  label: string
  max: number
  note: string
}[] = [
  {
    key: 'transparency',
    label: 'Công khai, minh bạch',
    max: 18,
    note: 'Danh mục & quy trình công bố',
  },
  {
    key: 'progress',
    label: 'Tiến độ giải quyết',
    max: 20,
    note: 'Tỷ lệ xử lý đúng & trước hạn',
  },
  {
    key: 'onlineService',
    label: 'Dịch vụ trực tuyến & Thanh toán',
    max: 22,
    note: 'Nộp trực tuyến & đối soát phí',
  },
  {
    key: 'digitization',
    label: 'Số hóa hồ sơ',
    max: 22,
    note: 'Tài liệu điện tử & kết quả ký số',
  },
  {
    key: 'satisfaction',
    label: 'Mức độ hài lòng',
    max: 18,
    note: 'Đánh giá của người dân, tổ chức',
  },
]

function classificationTone(total: number): SemanticTone {
  if (total >= 80) return 'success'
  if (total >= 70) return 'info'
  if (total >= 50) return 'warning'
  return 'danger'
}

function pillarBarTone(pct: number): 'high' | 'good' | 'warn' | 'low' {
  if (pct >= 85) return 'high'
  if (pct >= 70) return 'good'
  if (pct >= 50) return 'warn'
  return 'low'
}

export function Index766Panel({
  summary,
  subtitle,
  onSelectPillar,
}: {
  summary: ResolvedIndex766
  subtitle?: string
  onSelectPillar?: (key: string) => void
}) {
  return (
    <section className="panel index766-panel" aria-labelledby="index766-heading">
      <PanelHeading
        id="index766-heading"
        title="Bộ chỉ số phục vụ người dân, doanh nghiệp (Quyết định 766/QĐ-TTg)"
        description={subtitle}
        actions={
          <div className="hcds-766-summary" aria-label="Điểm tổng hợp Quyết định 766">
            <div className="hcds-766-summary__score">
              <span className="hcds-766-summary__label">Tổng điểm / 100</span>
              <strong className="hcds-766-summary__value tabular-nums">
                {summary.total.toFixed(1)}
              </strong>
            </div>
            <StatusTag
              tone={classificationTone(summary.total)}
              label={summary.classification}
            />
          </div>
        }
      />

      <div className="hcds-766-pillars">
        {PILLARS.map(pillar => {
          const score = summary[pillar.key]
          const pct = Math.max(0, Math.min(100, Math.round((score / pillar.max) * 100)))
          const barTone = pillarBarTone(pct)
          const barStyle = { '--bar-pct': `${pct}%` } as CSSProperties

          const content = (
            <>
              <div className="hcds-766-pillar__head">
                <span className="hcds-766-pillar__title">{pillar.label}</span>
                <strong className="hcds-766-pillar__score tabular-nums">
                  {score.toFixed(1)}
                  <span className="hcds-766-pillar__max"> / {pillar.max}</span>
                </strong>
              </div>

              <div className="hcds-766-pillar__meter">
                <div
                  className={`hcds-766-bar hcds-766-bar--${barTone}`}
                  style={barStyle}
                  aria-hidden="true"
                >
                  <span className="hcds-766-bar__fill" />
                </div>
                <span className="hcds-766-pillar__pct tabular-nums">{pct}%</span>
              </div>

              <div className="hcds-766-pillar__foot">
                <span className="hcds-766-pillar__note">{pillar.note}</span>
                {onSelectPillar && (
                  <span className="hcds-766-pillar__drill">
                    <span>Chi tiết</span>
                    <ChevronRight size={14} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                )}
              </div>
            </>
          )

          if (onSelectPillar) {
            return (
              <button
                type="button"
                key={pillar.key}
                className="hcds-766-pillar hcds-766-pillar--interactive"
                onClick={() => onSelectPillar(pillar.key)}
              >
                {content}
              </button>
            )
          }

          return (
            <article className="hcds-766-pillar" key={pillar.key}>
              {content}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function PeriodBalancePanel({
  balance,
  subtitle,
}: {
  balance: ResolvedPeriodBalance
  subtitle?: string
}) {
  const totalResolved = balance.resolvedOnTime + balance.resolvedOverdue
  const onTimeRate =
    totalResolved > 0 ? Math.round((balance.resolvedOnTime / totalResolved) * 100) : 100

  const cells: {
    label: string
    value: number
    note: string
    tone?: SemanticTone
  }[] = [
    {
      label: 'Tồn đầu kỳ',
      value: balance.opening,
      note: 'Chuyển từ kỳ trước',
    },
    {
      label: 'Nhận trong kỳ',
      value: balance.received,
      note: 'Phát sinh mới',
    },
    {
      label: 'Đúng hạn',
      value: balance.resolvedOnTime,
      note: 'Hoàn thành trước & đúng hạn',
      tone: 'success',
    },
    {
      label: 'Quá hạn',
      value: balance.resolvedOverdue,
      note: 'Hoàn thành trễ hạn',
      tone: balance.resolvedOverdue > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Dừng / Từ chối',
      value: balance.stoppedOrRejected,
      note: 'Theo Mẫu 03 & Mẫu 06',
    },
    {
      label: 'Tồn cuối kỳ',
      value: balance.closing,
      note: 'Đang giải quyết chuyển kỳ sau',
      tone: 'info',
    },
  ]

  return (
    <section className="panel period-balance-panel" aria-labelledby="period-balance-heading">
      <PanelHeading
        id="period-balance-heading"
        title="Báo cáo cân đối hồ sơ trong kỳ (Thông tư 09/2026/TT-BTP)"
        description={subtitle}
        actions={
          <StatusTag
            tone={balance.resolvedOverdue > 0 ? 'warning' : 'success'}
            label={
              totalResolved > 0
                ? `Đúng hạn: ${onTimeRate}% (${balance.resolvedOnTime.toLocaleString('vi-VN')}/${totalResolved.toLocaleString('vi-VN')})`
                : 'Chưa phát sinh hồ sơ kết thúc trong kỳ'
            }
            className="tabular-nums"
          />
        }
      />

      <div className="hcds-balance-ledger">
        {cells.map(cell => (
          <article
            className={`hcds-balance-cell${cell.tone ? ` hcds-balance-cell--${cell.tone}` : ''}`}
            key={cell.label}
          >
            <span className="hcds-balance-cell__label">{cell.label}</span>
            <strong className="hcds-balance-cell__value tabular-nums">
              {cell.value.toLocaleString('vi-VN')}
            </strong>
            <span className="hcds-balance-cell__note">{cell.note}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
