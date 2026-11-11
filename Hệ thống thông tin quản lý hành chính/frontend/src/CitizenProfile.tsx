import { useEffect, useState, type FormEvent } from 'react'
import './CitizenProfile.css'
import {
  identityTypes,
  type ApiRequest,
  type CitizenProfile,
  type DetailKey,
  type User,
} from './types'

export type { CitizenProfile } from './types'

export function CitizenProfilePage({
  request,
  onChanged,
  onHome,
  onSubmit,
  onDirtyChange,
}: {
  request: ApiRequest
  onChanged: (user: User) => void
  onHome: () => void
  onSubmit: () => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [communes, setCommunes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
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
    if (!dirty || window.confirm('Thông tin mới chưa được lưu. Bạn có muốn rời trang?')) {
      action()
    }
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
      const result = await request<{ profile: CitizenProfile; user: User }>('/api/citizen/profile', profile)
      setProfile(result.profile)
      onChanged(result.user)
      setDirty(false)
      setNotice(
        'Đã lưu thông tin cá nhân. Hồ sơ lập mới sẽ dùng thông tin này; hồ sơ đã gửi giữ nguyên nội dung.',
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
    return (
      <label className="citizen-field" key={key}>
        <span>
          {label}
          {options.required && <span className="required-mark"> *</span>}
        </span>
        <input
          name={key}
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

  return (
    <section className="citizen-profile-page">
      <nav className="profile-navigation" aria-label="Điều hướng tài khoản">
        <button type="button" className="text-button" onClick={() => leave(onHome)}>
          ← Về cổng dịch vụ
        </button>
        <button type="button" className="text-button" onClick={() => leave(onSubmit)}>
          Nộp hồ sơ →
        </button>
      </nav>

      <header className="citizen-page-heading">
        <h1>Thông tin cá nhân</h1>
        <p>Lưu thông tin một lần để tự động điền khi nộp hồ sơ, đặt lịch hẹn và gửi phản ánh.</p>
      </header>

      {loading ? (
        <p role="status">Đang tải thông tin cá nhân…</p>
      ) : (
        profile && (
          <>
            <p className="profile-source">
              Thông tin cá nhân lưu tại đây dùng để tự động điền biểu mẫu điện tử. Vui lòng kiểm tra
              kỹ nội dung tờ khai và thành phần hồ sơ trước khi gửi.
            </p>
            {profile.missingFields.length > 0 && (
              <p className="profile-completion">
                Có thể bổ sung thêm: {profile.missingFields.join('; ')}. Các trường chưa có thông tin
                vẫn được để trống khi tự điền.
              </p>
            )}

            <form onSubmit={save} className="profile-form" aria-busy={busy}>
              <section className="citizen-form-section">
                <h2>1. Thông tin cơ bản</h2>
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
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  {renderField('nationality', 'Quốc tịch', { maxLength: 100 })}
                </div>
              </section>

              <section className="citizen-form-section">
                <h2>2. Thông tin liên hệ</h2>
                <div className="citizen-form-grid">
                  {renderField('phone', 'Số điện thoại', {
                    type: 'tel',
                    required: true,
                    maxLength: 40,
                    autoComplete: 'tel',
                  })}
                  <label className="citizen-field">
                    <span>Email đăng nhập</span>
                    <input type="email" value={profile.email} readOnly autoComplete="email" />
                    <small>Email này dùng để đăng nhập tài khoản công dân.</small>
                  </label>
                </div>
              </section>

              <section className="citizen-form-section">
                <h2>3. Giấy tờ nhận dạng</h2>
                <div className="citizen-form-grid">
                  <label className="citizen-field">
                    <span>Loại giấy tờ</span>
                    <select
                      disabled={busy}
                      value={profile.identityType}
                      onChange={event => change('identityType', event.target.value)}
                    >
                      {identityTypes.map(value => (
                        <option key={value}>{value}</option>
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
                <h2>4. Địa chỉ thường trú</h2>
                <p>
                  Ghi theo địa chỉ hành chính hiện tại. Với Hà Nội, có thể chọn phường, xã từ danh
                  sách gợi ý.
                </p>
                {renderAddress('permanent')}
              </section>

              <section className="citizen-form-section">
                <h2>5. Địa chỉ liên hệ</h2>
                <label className="citizen-consent">
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
                  Địa chỉ này được gợi ý khi nhận kết quả qua bưu chính. Bạn có thể đổi riêng cho
                  từng hồ sơ.
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
                <button className="button primary" disabled={busy || !dirty}>
                  {busy ? 'Đang lưu…' : 'Lưu thông tin cá nhân'}
                </button>
                {profile.updatedAt && (
                  <span>Lần cập nhật: {new Date(profile.updatedAt).toLocaleString('vi-VN')}</span>
                )}
              </div>
            </form>
          </>
        )
      )}

      {error && (
        <div role="alert" className="form-error">
          {error}
          <button type="button" className="text-button" onClick={reload} disabled={busy}>
            Tải lại thông tin đã lưu
          </button>
        </div>
      )}
    </section>
  )
}

export default CitizenProfilePage
