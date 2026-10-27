import { useEffect, useState, type FormEvent } from 'react'
import './CitizenProfile.css'

type DetailKey = 'name' | 'phone' | 'email' | 'dateOfBirth' | 'gender' | 'nationality' | 'identityType' | 'identityNumber' | 'identityDate' | 'identityPlace' | 'permanentProvince' | 'permanentCommune' | 'permanentStreet' | 'contactProvince' | 'contactCommune' | 'contactStreet'
export type CitizenProfile = Record<DetailKey, string> & { sameContactAddress: boolean; version: number; updatedAt: string; verificationStatus: string; permanentAddress: string; contactAddress: string; missingFields: string[] }
type Request = <T>(path: string, body?: unknown) => Promise<T>
export const identityTypes = ['Thẻ căn cước', 'Thẻ căn cước công dân', 'Giấy chứng nhận căn cước', 'Hộ chiếu', 'Giấy tờ xuất nhập cảnh hoặc đi lại quốc tế']

export function CitizenProfilePage<T>({ request, onChanged, onHome, onSubmit, onDirtyChange }: { request: Request; onChanged: (user: T) => void; onHome: () => void; onSubmit: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const [profile, setProfile] = useState<CitizenProfile | null>(null)
  const [communes, setCommunes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function leave(action: () => void) { if (!dirty || window.confirm('Thông tin mới chưa được lưu. Bạn có muốn rời trang?')) action() }
  useEffect(() => {
    let active = true
    request<{ profile: CitizenProfile }>('/api/citizen/profile').then(result => { if (active) setProfile(result.profile) }).catch(reason => { if (active) setError(reason.message) }).finally(() => { if (active) setLoading(false) })
    request<{ agencies: string[] }>('/api/public/agencies').then(result => { if (active) setCommunes(result.agencies.filter(name => /^UBND (phường|xã) /i.test(name)).map(name => name.replace(/^UBND /i, '')).sort((a, b) => a.localeCompare(b, 'vi'))) }).catch(() => {})
    return () => { active = false }
  }, [request])
  async function reload() {
    setError(''); setNotice(''); setBusy(true)
    try { const result = await request<{ profile: CitizenProfile }>('/api/citizen/profile'); setProfile(result.profile); setDirty(false) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa tải được thông tin.') }
    finally { setBusy(false) }
  }
  function change<K extends keyof CitizenProfile>(key: K, value: CitizenProfile[K]) { setProfile(old => old ? { ...old, [key]: value } : old); setDirty(true); setNotice('') }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!profile) return
    setError(''); setNotice(''); setBusy(true)
    try {
      const result = await request<{ profile: CitizenProfile; user: T }>('/api/citizen/profile', profile)
      setProfile(result.profile); onChanged(result.user); setDirty(false); setNotice('Đã lưu thông tin cá nhân. Hồ sơ lập mới sẽ dùng thông tin này; hồ sơ đã gửi giữ nguyên nội dung.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Chưa lưu được thông tin.') }
    finally { setBusy(false) }
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
  function field(key: DetailKey, label: string, options: { type?: string; required?: boolean; maxLength?: number; autoComplete?: string; list?: string } = {}) {
    return <label className="citizen-field" key={key}><span>{label}{options.required && <span className="required-mark"> *</span>}</span><input name={key} disabled={busy} type={options.type || 'text'} value={profile?.[key] || ''} onChange={event => change(key, event.target.value)} required={options.required} maxLength={options.maxLength || 150} autoComplete={options.autoComplete} list={options.list} max={options.type === 'date' ? today : undefined} /></label>
  }
  function address(prefix: 'permanent' | 'contact') {
    return <div className="citizen-form-grid">{field(`${prefix}Province`, 'Tỉnh, thành phố', { maxLength: 100, autoComplete: prefix === 'permanent' ? 'section-permanent address-level1' : 'section-contact address-level1' })}{field(`${prefix}Commune`, 'Phường, xã, đặc khu', { list: 'hanoi-profile-communes', maxLength: 150 })}<div className="profile-wide">{field(`${prefix}Street`, 'Số nhà, đường, thôn hoặc tổ dân phố', { maxLength: 250, autoComplete: prefix === 'permanent' ? 'section-permanent street-address' : 'section-contact street-address' })}</div></div>
  }
  return <section className="citizen-profile-page"><nav className="profile-navigation" aria-label="Điều hướng tài khoản"><button className="text-button" onClick={() => leave(onHome)}>Về cổng dịch vụ</button><button className="text-button" onClick={() => leave(onSubmit)}>Nộp hồ sơ</button></nav>
    <header className="citizen-page-heading"><span className="eyebrow">TÀI KHOẢN CÔNG DÂN</span><h1>Thông tin cá nhân</h1><p>Lưu thông tin một lần để dùng khi nộp hồ sơ, đặt lịch hẹn và gửi phản ánh.</p></header>
    {loading ? <p role="status">Đang tải thông tin cá nhân…</p> : profile && <>
      <p className="profile-source">Thông tin do bạn cung cấp, chưa xác thực qua VNeID hoặc cơ sở dữ liệu dân cư. Bạn vẫn cần kiểm tra tờ khai và giấy tờ trước khi gửi.</p>
      {profile.missingFields.length > 0 && <p className="profile-completion">Có thể bổ sung: {profile.missingFields.join('; ')}. Các trường chưa có thông tin vẫn được để trống khi tự điền.</p>}
      <form onSubmit={save} className="profile-form" aria-busy={busy}>
        <section className="citizen-form-section"><h2>1. Thông tin cơ bản</h2><div className="citizen-form-grid">{field('name', 'Họ và tên', { required: true, autoComplete: 'name' })}{field('dateOfBirth', 'Ngày sinh', { type: 'date', autoComplete: 'bday' })}<label className="citizen-field">Giới tính<select disabled={busy} value={profile.gender} onChange={event => change('gender', event.target.value)}><option value="">Chưa cung cấp</option>{['Nam', 'Nữ', 'Khác'].map(value => <option key={value}>{value}</option>)}</select></label>{field('nationality', 'Quốc tịch', { maxLength: 100 })}</div></section>
        <section className="citizen-form-section"><h2>2. Thông tin liên hệ</h2><div className="citizen-form-grid">{field('phone', 'Số điện thoại', { type: 'tel', required: true, maxLength: 40, autoComplete: 'tel' })}<label className="citizen-field">Email đăng nhập<input type="email" value={profile.email} readOnly autoComplete="email" /><small>Email này dùng để đăng nhập tài khoản.</small></label></div></section>
        <section className="citizen-form-section"><h2>3. Giấy tờ nhận dạng</h2><div className="citizen-form-grid"><label className="citizen-field">Loại giấy tờ<select disabled={busy} value={profile.identityType} onChange={event => change('identityType', event.target.value)}>{identityTypes.map(value => <option key={value}>{value}</option>)}</select></label>{field('identityNumber', 'Số căn cước, số định danh cá nhân hoặc số giấy tờ', { maxLength: 40 })}{field('identityDate', 'Ngày cấp (nếu có)', { type: 'date' })}{field('identityPlace', 'Nơi cấp (nếu có)', { maxLength: 180 })}</div></section>
        <section className="citizen-form-section"><h2>4. Địa chỉ thường trú</h2><p>Ghi theo địa chỉ hành chính hiện tại. Với Hà Nội, có thể chọn phường, xã từ danh sách gợi ý.</p>{address('permanent')}</section>
        <section className="citizen-form-section"><h2>5. Địa chỉ liên hệ</h2><label className="citizen-consent"><input type="checkbox" disabled={busy} checked={profile.sameContactAddress} onChange={event => change('sameContactAddress', event.target.checked)} />Dùng địa chỉ thường trú làm địa chỉ liên hệ</label>{!profile.sameContactAddress && address('contact')}<p>Địa chỉ này được gợi ý khi nhận kết quả qua bưu chính. Bạn có thể đổi cho từng hồ sơ.</p></section>
        <datalist id="hanoi-profile-communes">{communes.map(name => <option value={name} key={name} />)}</datalist>
        {notice && <p className="citizen-success" role="status">{notice}</p>}
        <div className="profile-actions"><button className="button primary" disabled={busy || !dirty}>{busy ? 'Đang lưu…' : 'Lưu thông tin cá nhân'}</button>{profile.updatedAt && <span>Lần cập nhật: {new Date(profile.updatedAt).toLocaleString('vi-VN')}</span>}</div>
      </form></>}
    {error && <div role="alert" className="form-error">{error}<button type="button" className="text-button" onClick={reload} disabled={busy}>Tải lại thông tin đã lưu</button></div>}
  </section>
}
