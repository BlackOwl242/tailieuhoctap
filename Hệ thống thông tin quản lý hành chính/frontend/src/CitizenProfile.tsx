import { ArrowLeft, ArrowRight, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import './CitizenProfile.css'
import { ConfirmDialog, LockedFieldNotice, VerifiedFieldBadge } from './design-system'
import {
  identityTypes,
  type ApiRequest,
  type CitizenProfile,
  type DetailKey,
  type User,
} from './types'

export type { CitizenProfile } from './types'

const CitizenProfileEmbedContext = createContext(false)

export function CitizenProfileEmbedBoundary({ children }: { children: ReactNode }) {
  return (
    <CitizenProfileEmbedContext.Provider value={true}>
      {children}
    </CitizenProfileEmbedContext.Provider>
  )
}

const TABULAR_KEYS = new Set<DetailKey>(['phone', 'dateOfBirth', 'identityNumber', 'identityDate'])
const CORE_PROFILE_FIELD_TOTAL = 7

export function CitizenProfilePage({
  request,
  onChanged,
  onHome,
  onSubmit,
  onDirtyChange,
  embedded,
}: {
  request: ApiRequest
  onChanged: (user: User) => void
  onHome: () => void
  onSubmit: () => void
  onDirtyChange?: (dirty: boolean) => void
  embedded?: boolean
}) {
  const inWorkspace = useContext(CitizenProfileEmbedContext)
  const isEmbedded = embedded ?? inWorkspace

  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [communes, setCommunes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)
  const [today] = useState(() =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()),
  )

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function leave(action: () => void) {
    if (!dirty) {
      action()
      return
    }
    setPendingLeave(() => action)
  }

  useEffect(() => {
    const controller = new AbortController()
    request<{ profile: CitizenProfile }>('/api/citizen/profile', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setProfile(result.profile)
        }
      })
      .catch(reason => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Chưa tải được thông tin cá nhân.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    request<{ agencies: string[] }>('/api/public/agencies', undefined, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setCommunes(
            result.agencies
              .filter(name => /^UBND (phường|xã) /i.test(name))
              .map(name => name.replace(/^UBND /i, ''))
              .sort((a, b) => a.localeCompare(b, 'vi')),
          )
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [request])

  async function reload() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const result = await request<{ profile: CitizenProfile }>('/api/citizen/profile')
      setProfile(result.profile)
      setDirty(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa tải được thông tin.')
    } finally {
      setBusy(false)
    }
  }

  function change<K extends keyof CitizenProfile>(key: K, value: CitizenProfile[K]) {
    setProfile(old => (old ? { ...old, [key]: value } : old))
    setDirty(true)
    setNotice('')
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const result = await request<{ profile: CitizenProfile; user: User }>(
        '/api/citizen/profile',
        profile,
      )
      setProfile(result.profile)
      onChanged(result.user)
      setDirty(false)
      setNotice(
        'Đã lưu thông tin cá nhân. Hồ sơ lập mới sẽ tự động điền thông tin này; hồ sơ đã gửi giữ nguyên nội dung.',
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Chưa lưu được thông tin.')
    } finally {
      setBusy(false)
    }
  }

  function renderField(
    key: DetailKey,
    label: string,
    options: {
      type?: string
      required?: boolean
      maxLength?: number
      autoComplete?: string
      list?: string
    } = {},
  ) {
    const isTabular = TABULAR_KEYS.has(key) || options.type === 'date' || options.type === 'tel'
    return (
      <label className="citizen-field" key={key}>
        <span>
          {label}
          {options.required && <span className="required-mark"> *</span>}
        </span>
        <input
          name={key}
          className={isTabular ? 'tabular-nums' : undefined}
          disabled={busy}
          type={options.type || 'text'}
          value={profile?.[key] || ''}
          onChange={event => change(key, event.target.value)}
          required={options.required}
          maxLength={options.maxLength || 150}
          autoComplete={options.autoComplete}
          list={options.list}
          max={options.type === 'date' ? today : undefined}
        />
      </label>
    )
  }

  function renderAddress(prefix: 'permanent' | 'contact') {
    const autoPrefix = prefix === 'permanent' ? 'section-permanent' : 'section-contact'
    return (
      <div className="citizen-form-grid">
        {renderField(`${prefix}Province`, 'Tỉnh, thành phố', {
          maxLength: 100,
          autoComplete: `${autoPrefix} address-level1`,
        })}
        {renderField(`${prefix}Commune`, 'Phường, xã, đặc khu', {
          list: 'hanoi-profile-communes',
          maxLength: 150,
        })}
        <div className="profile-wide">
          {renderField(`${prefix}Street`, 'Số nhà, đường, thôn hoặc tổ dân phố', {
            maxLength: 250,
            autoComplete: `${autoPrefix} street-address`,
          })}
        </div>
      </div>
    )
  }

  const completedCoreCount = profile
    ? Math.max(0, CORE_PROFILE_FIELD_TOTAL - profile.missingFields.length)
    : 0

  const body = (
    <>
      {!isEmbedded && (
        <>
          <nav className="profile-navigation" aria-label="Điều hướng tài khoản">
            <button type="button" className="text-button" onClick={() => leave(onHome)}>
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Về cổng dịch vụ</span>
            </button>
            <button type="button" className="text-button" onClick={() => leave(onSubmit)}>
              <span>Nộp hồ sơ trực tuyến</span>
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </nav>

          <header className="citizen-page-heading">
            <h1>Thông tin cá nhân</h1>
            <p>
              Quản lý dữ liệu công dân dùng chung để tự động điền khi nộp hồ sơ, đặt lịch hẹn Một
              cửa và gửi phản ánh, kiến nghị.
            </p>
          </header>
        </>
      )}

      {loading ? (
        <p className="profile-status-note" role="status">
          Đang tải thông tin cá nhân…
        </p>
      ) : (
        profile && (
          <>
            <aside
              className="profile-once-only-banner"
              aria-label="Nguyên tắc cung cấp dữ liệu một lần"
            >
              <div className="profile-once-only-banner__head">
                <div className="profile-once-only-banner__title">
                  <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                  <strong>Nguyên tắc “Cung cấp dữ liệu một lần” (Nghị định 42/2022/NĐ-CP)</strong>
                </div>
                <VerifiedFieldBadge
                  text={
                    profile.missingFields.length === 0
                      ? 'Sẵn sàng tự động điền biểu mẫu 5 bước'
                      : `Đã hoàn thiện ${completedCoreCount}/${CORE_PROFILE_FIELD_TOTAL} trường cốt lõi`
                  }
                />
              </div>
              <p className="profile-once-only-banner__desc">
                Các trường định danh, liên hệ và địa chỉ đã lưu tại đây sẽ tự động điền vào quy
                trình nộp hồ sơ trực tuyến 5 bước, đặt lịch hẹn Một cửa và gửi phản ánh. Hồ sơ đã
                nộp trước đó giữ nguyên nội dung tại thời điểm tiếp nhận.
              </p>
              {profile.missingFields.length > 0 && (
                <p className="profile-completion">
                  <b>Gợi ý bổ sung để điền tự động trọn vẹn:</b> {profile.missingFields.join('; ')}.
                  Các trường chưa khai vẫn có thể nhập trực tiếp trên từng tờ khai.
                </p>
              )}
            </aside>

            <form onSubmit={save} className="profile-form" aria-busy={busy}>
              <section className="citizen-form-section">
                <h2>Thông tin cơ bản</h2>
                <div className="citizen-form-grid">
                  {renderField('name', 'Họ và tên', { required: true, autoComplete: 'name' })}
                  {renderField('dateOfBirth', 'Ngày sinh', { type: 'date', autoComplete: 'bday' })}
                  <label className="citizen-field">
                    <span>Giới tính</span>
                    <select
                      disabled={busy}
                      value={profile.gender}
                      onChange={event => change('gender', event.target.value)}
                    >
                      <option value="">Chưa cung cấp</option>
                      {['Nam', 'Nữ', 'Khác'].map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  {renderField('nationality', 'Quốc tịch', { maxLength: 100 })}
                </div>
              </section>

              <section className="citizen-form-section">
                <h2>Thông tin liên hệ</h2>
                <div className="citizen-form-grid">
                  {renderField('phone', 'Số điện thoại', {
                    type: 'tel',
                    required: true,
                    maxLength: 40,
                    autoComplete: 'tel',
                  })}
                  <div className="citizen-field">
                    <label htmlFor="citizen-profile-email">
                      <span>Email đăng nhập</span>
                    </label>
                    <input
                      id="citizen-profile-email"
                      className="hcds-verified-input"
                      type="email"
                      value={profile.email}
                      readOnly
                      autoComplete="email"
                    />
                    <LockedFieldNotice>
                      Email định danh tài khoản công dân, được khóa để bảo vệ phiên đăng nhập.
                    </LockedFieldNotice>
                  </div>
                </div>
              </section>

              <section className="citizen-form-section">
                <h2>Giấy tờ định danh cá nhân</h2>
                <div className="citizen-form-grid">
                  <label className="citizen-field">
                    <span>Loại giấy tờ</span>
                    <select
                      disabled={busy}
                      value={profile.identityType}
                      onChange={event => change('identityType', event.target.value)}
                    >
                      {identityTypes.map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  {renderField(
                    'identityNumber',
                    'Số căn cước, số định danh cá nhân hoặc số giấy tờ',
                    { maxLength: 40 },
                  )}
                  {renderField('identityDate', 'Ngày cấp (nếu có)', { type: 'date' })}
                  {renderField('identityPlace', 'Nơi cấp (nếu có)', { maxLength: 180 })}
                </div>
              </section>

              <section className="citizen-form-section">
                <h2>Địa chỉ thường trú</h2>
                <p>
                  Ghi theo địa giới hành chính hiện hành. Với Thành phố Hà Nội, có thể chọn nhanh từ
                  danh sách 126 phường, xã gợi ý.
                </p>
                {renderAddress('permanent')}
              </section>

              <section className="citizen-form-section">
                <h2>Địa chỉ liên hệ nhận kết quả</h2>
                <label className="citizen-consent profile-checkbox-row">
                  <input
                    type="checkbox"
                    disabled={busy}
                    checked={profile.sameContactAddress}
                    onChange={event => change('sameContactAddress', event.target.checked)}
                  />
                  <span>Dùng địa chỉ thường trú làm địa chỉ liên hệ</span>
                </label>
                {!profile.sameContactAddress && renderAddress('contact')}
                <p>
                  Địa chỉ này được tự động gợi ý khi đăng ký nhận kết quả qua dịch vụ bưu chính công
                  ích. Bạn vẫn có thể thay đổi riêng cho từng hồ sơ.
                </p>
              </section>

              <datalist id="hanoi-profile-communes">
                {communes.map(name => (
                  <option value={name} key={name} />
                ))}
              </datalist>

              {notice && (
                <p className="citizen-success" role="status">
                  {notice}
                </p>
              )}

              <div className="profile-actions">
                <button type="submit" className="button primary" disabled={busy || !dirty}>
                  <Save size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>{busy ? 'Đang lưu…' : 'Lưu thông tin cá nhân'}</span>
                </button>
                {profile.updatedAt && (
                  <span className="tabular-nums">
                    Lần cập nhật gần nhất: {new Date(profile.updatedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            </form>
          </>
        )
      )}

      {error && (
        <div role="alert" className="form-error profile-error-banner">
          <span>{error}</span>
          <button type="button" className="button secondary compact-btn" onClick={reload} disabled={busy}>
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Tải lại thông tin đã lưu</span>
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingLeave)}
        title="Chưa lưu thay đổi thông tin cá nhân"
        message="Thông tin bạn vừa chỉnh sửa chưa được lưu vào hồ sơ công dân. Bạn có muốn rời trang và hủy các thay đổi này?"
        confirmLabel="Rời trang"
        cancelLabel="Tiếp tục chỉnh sửa"
        tone="danger"
        onConfirm={() => {
          const nextAction = pendingLeave
          setPendingLeave(null)
          setDirty(false)
          nextAction?.()
        }}
        onClose={() => setPendingLeave(null)}
      />
    </>
  )

  if (isEmbedded) {
    return (
      <section className="citizen-profile-page is-embedded" aria-label="Thông tin cá nhân công dân">
        {body}
      </section>
    )
  }

  return (
    <main id="main-content" className="citizen-profile-page">
      {body}
    </main>
  )
}

export default CitizenProfilePage
