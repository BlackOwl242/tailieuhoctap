import type { ResolvedIndex766, ResolvedPeriodBalance } from './portalUtils'

const PILLARS: {
  key: keyof Omit<ResolvedIndex766, 'total' | 'classification'>
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

export function Index766Panel({
  summary,
  subtitle,
}: {
  summary: ResolvedIndex766
  subtitle?: string
}) {
  return (
    <section className="panel index766-panel" aria-labelledby="index766-heading">
      <div className="ops-panel-heading">
        <div>
          <h2 id="index766-heading">
            Bộ chỉ số phục vụ người dân, doanh nghiệp (Quyết định 766/QĐ-TTg)
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="index766-total-badge">
          <small>Tổng điểm / 100</small>
          <b className="tabular-nums">{summary.total.toFixed(1)}</b>
          <span>{summary.classification}</span>
        </div>
      </div>

      <div className="index766-grid">
        {PILLARS.map(pillar => {
          const score = summary[pillar.key]
          const pct = Math.min(100, Math.round((score / pillar.max) * 100))
          return (
            <article className="index766-card" key={pillar.key}>
              <div className="index766-card-head">
                <span>{pillar.label}</span>
                <strong className="tabular-nums">
                  {score.toFixed(1)} / {pillar.max}
                </strong>
              </div>
              <div className="index766-bar" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </div>
              <small>{pillar.note}</small>
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
  const cells: { label: string; value: number; note: string; tone?: string }[] = [
    { label: 'Tồn đầu kỳ', value: balance.opening, note: 'Chuyển từ kỳ trước' },
    { label: 'Nhận trong kỳ', value: balance.received, note: 'Phát sinh mới' },
    {
      label: 'Đúng hạn',
      value: balance.resolvedOnTime,
      note: 'Hoàn thành trước & đúng hạn',
      tone: 'green',
    },
    {
      label: 'Quá hạn',
      value: balance.resolvedOverdue,
      note: 'Hoàn thành trễ hạn',
      tone: balance.resolvedOverdue > 0 ? 'red' : undefined,
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
      tone: 'blue',
    },
  ]

  return (
    <section className="panel period-balance-panel" aria-labelledby="period-balance-heading">
      <div className="ops-panel-heading">
        <div>
          <h2 id="period-balance-heading">
            Báo cáo cân đối hồ sơ trong kỳ (Thông tư 09/2026/TT-BTP)
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="period-balance-grid">
        {cells.map(cell => (
          <article
            className={`period-balance-cell${cell.tone ? ` tone-${cell.tone}` : ''}`}
            key={cell.label}
          >
            <small>{cell.label}</small>
            <b className="tabular-nums">{cell.value.toLocaleString('vi-VN')}</b>
            <span>{cell.note}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
