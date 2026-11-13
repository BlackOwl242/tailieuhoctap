import { AlertCircle, Building2, CheckCircle2, Info, Lock, ShieldCheck, Type } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { User } from '../types'

export function SkipLink({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="hcds-skip-link">
      Chuyển thẳng đến nội dung chính
    </a>
  )
}

export function GovTrustBanner({
  citizenUser,
  largeFont,
  onToggleLargeFont,
  onNavigate,
  onLogoutCitizen,
}: {
  citizenUser?: User | null
  largeFont?: boolean
  onToggleLargeFont?: () => void
  onNavigate?: (path: string) => void
  onLogoutCitizen?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const handleLink = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (
      !onNavigate ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <div className="gov-trust-banner" role="region" aria-label="Xác nhận cổng thông tin cơ quan nhà nước">
      <div className="gov-trust-banner__inner">
        <div className="gov-trust-banner__lead">
          <span className="gov-trust-banner__dot" aria-hidden="true" />
          <span>Hệ thống thông tin phục vụ hành chính công theo mô hình chính quyền 2 cấp TP. Hà Nội</span>
          <button
            type="button"
            className="gov-trust-banner__toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? 'Thu gọn nhận biết' : 'Cách nhận biết chính thống'}
          </button>
        </div>

        <div className="gov-trust-banner__utilities">
          {onToggleLargeFont && (
            <button
              type="button"
              className="gov-trust-banner__util-btn"
              aria-pressed={Boolean(largeFont)}
              onClick={onToggleLargeFont}
              title="Hỗ trợ người cao tuổi và người thị lực kém (Thông tư 26/2020/TT-BTTTT)"
            >
              <Type size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>{largeFont ? 'Cỡ chữ chuẩn' : 'Cỡ chữ lớn'}</span>
            </button>
          )}

          <a
            href="/staff"
            className="gov-trust-banner__util-link"
            onClick={e => handleLink(e, '/staff')}
          >
            <Building2 size={13} strokeWidth={1.75} aria-hidden="true" />
            <span>Bàn làm việc cán bộ</span>
          </a>

          {citizenUser ? (
            <>
              <a
                href="/tai-khoan"
                className="gov-trust-banner__util-link gov-trust-banner__util-link--primary"
                onClick={e => handleLink(e, '/tai-khoan')}
              >
                <ShieldCheck size={13} strokeWidth={1.75} aria-hidden="true" />
                <span>Công dân: {citizenUser.name}</span>
              </a>
              {onLogoutCitizen && (
                <button
                  type="button"
                  className="gov-trust-banner__util-btn"
                  onClick={onLogoutCitizen}
                >
                  Đăng xuất
                </button>
              )}
            </>
          ) : (
            <a
              href="/dang-nhap"
              className="gov-trust-banner__util-link gov-trust-banner__util-link--primary"
              onClick={e => handleLink(e, '/dang-nhap')}
            >
              <ShieldCheck size={13} strokeWidth={1.75} aria-hidden="true" />
              <span>Đăng nhập Công dân / Tổ chức</span>
            </a>
          )}
        </div>
      </div>

      {expanded && (
        <div className="gov-trust-banner__details">
          <div>
            <strong>1. Chuẩn cấu trúc Thông tư 21 & 22/2023/TT-BTTTT</strong>
            Cổng dịch vụ công chính thức trên môi trường mạng vận hành dưới tên miền cơ quan nhà nước
            (`.gov.vn`), công khai đầy đủ cơ quan chủ quản, tổng đài hỗ trợ và trình tự thủ tục hành chính.
          </div>
          <div>
            <strong>2. Bảo vệ dữ liệu cá nhân & Xác thực phiên (Nghị định 13/2023/NĐ-CP)</strong>
            Thông tin định danh của công dân được ẩn trên luồng tra cứu nhanh công khai; các thao tác nộp,
            bổ sung hoặc rút hồ sơ yêu cầu xác thực tài khoản hoặc khóa tra cứu bảo mật.
          </div>
        </div>
      )}
    </div>
  )
}

export function PanelHeading({
  title,
  description,
  actions,
  action,
  id,
}: {
  title: string
  description?: string
  actions?: ReactNode
  action?: ReactNode
  id?: string
  kicker?: string
}) {
  const resolvedActions = actions ?? action
  return (
    <div className="ops-panel-heading">
      <div>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {resolvedActions && <div className="heading-actions ops-panel-action">{resolvedActions}</div>}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  note,
  tone = 'navy',
  onClick,
}: {
  label: string
  value: string | number
  hint?: string
  note?: string
  tone?: 'navy' | 'blue' | 'amber' | 'red' | 'green' | string
  onClick?: () => void
}) {
  const resolvedHint = hint ?? note
  const formattedValue = typeof value === 'number' ? value.toLocaleString('vi-VN') : value
  const safeTone = ['navy', 'blue', 'amber', 'red', 'green'].includes(tone) ? tone : 'navy'
  const inner = (
    <>
      <div className="hcds-kpi-card__header">
        <span className="hcds-kpi-card__label">{label}</span>
        <span className="hcds-kpi-card__indicator" aria-hidden="true" />
      </div>
      <strong className="hcds-kpi-card__value tabular-nums">{formattedValue}</strong>
      {resolvedHint && <span className="hcds-kpi-card__hint">{resolvedHint}</span>}
    </>
  )

  const cls = `hcds-kpi-card hcds-kpi-card--${safeTone}`
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    )
  }
  return <div className={cls}>{inner}</div>
}

export function SummaryBox({
  title = 'Thông tin tóm tắt thủ tục hành chính',
  items,
}: {
  title?: string
  items: { label: string; value: ReactNode }[]
}) {
  return (
    <aside className="hcds-summary-box" aria-label={title}>
      <div className="hcds-summary-box__title">
        <Info size={18} strokeWidth={1.75} aria-hidden="true" />
        <span>{title}</span>
      </div>
      <dl className="hcds-summary-box__grid">
        {items.map(item => (
          <div key={item.label} className="hcds-summary-box__item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}

export function ErrorSummary({
  title = 'Vui lòng kiểm tra lại thông tin kê khai',
  errors,
}: {
  title?: string
  errors: { id?: string; message: string }[]
}) {
  if (!errors.length) return null
  return (
    <div className="hcds-error-summary" role="alert" tabIndex={-1}>
      <h2 className="hcds-error-summary__title">
        <AlertCircle size={18} strokeWidth={2} aria-hidden="true" />
        <span>{title}</span>
      </h2>
      <ul className="hcds-error-summary__list">
        {errors.map((err, idx) => (
          <li key={`${err.id || idx}-${err.message}`}>
            {err.id ? <a href={`#${err.id}`}>{err.message}</a> : <span>{err.message}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function VerifiedFieldBadge({
  text = 'Đã đồng bộ từ hồ sơ công dân',
}: {
  text?: string
}) {
  return (
    <span className="hcds-verified-badge">
      <CheckCircle2 size={12} strokeWidth={2} aria-hidden="true" />
      <span>{text}</span>
    </span>
  )
}

export function LockedFieldNotice({ children }: { children: ReactNode }) {
  return (
    <p className="hcds-locked-notice">
      <Lock size={13} strokeWidth={1.75} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
